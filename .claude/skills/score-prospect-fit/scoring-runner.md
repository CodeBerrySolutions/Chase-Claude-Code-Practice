# Scoring runner — the scheduled Claude session (T4)
_The standalone instruction a fresh CCR session runs each fire to drain the scoring queue. Dated 2026-08-24._
_Companion to `scoring-handoff.md` (schema/lifecycle/T0) and `references/fetch-gate.md`._

## Where it runs / billing
A **fresh Claude Code session** fired by a CCR trigger (T5), off-hours, **billing the user's Claude plan**.
It runs the `score-prospect-fit` skill directly (one source of truth) and writes verdicts back. It has **no
direct Sheets write** (T0) and **egress-blocked HTTP**, so all sheet I/O goes through two tiny n8n helper
workflows it calls over the **n8n MCP** (`execute_workflow`, then poll `get_workflow_execution`).

## I/O contracts it depends on (build these with T2/T9)
Both are owned by n8n — the single Sheets writer/reader — and called via `mcp__n8n__execute_workflow`:

- **`queue-reader`** — reads the work sheet, returns rows as **JSON** (not a markdown table: `fetched_content`
  is large/multiline and would corrupt a Drive whole-sheet render — this supersedes the tentative "reads use
  Drive read_file_content" note in `scoring-handoff.md` T0). Input: `{ statuses: ["to_score","scoring"] }`.
  Output: an array of row objects (all columns). The runner fires it, then polls the execution for the data.
- **`verdict-writer`** — input `{ writes: [ { row_key, <col>:<val>, ... }, ... ] }`; for each, Google Sheets
  **`appendOrUpdate` matching on `row_key`** (key-addressed upsert = no wrong-row hazard). Idempotent, so a
  re-fire is safe. The runner batches a chunk's rows into one call, then polls the execution for success.

## The runner prompt (goes verbatim in the CCR trigger `prompt`)

> You are the **Berry Nova prospect-scoring runner**. This is a fresh session. Score fetched prospect rows
> with the `score-prospect-fit` skill and write verdicts back. Bill is the user's plan. **You never fetch web
> pages, and you write ONLY through the n8n `verdict-writer` workflow** (you have no direct Sheets access).
> Work sheet: tab `Screened Prospects`, spreadsheet `<ID>`. Columns are documented in `scoring-handoff.md`.
>
> **1. Preflight — abort safely if unmet.** Confirm the **n8n MCP** and (for the summary) the **Slack** path
> are available. If the n8n MCP is missing you cannot read or write — post a Slack alert if you can, otherwise
> stop; **never score without a working writer**. Get your session id (`get_session`) for `scored_by`.
>
> **2. Lock (best-effort single-writer).** Read `_Control` via `queue-reader`. If a lock row is held with
> `lock_expires` in the future by a different owner, **exit** (another run is active). Else write a lock
> (`owner=<your id>`, `expires=<now+2h>`) via `verdict-writer`, re-read, and proceed only if you own it.
>
> **3. Read the queue.** Call `queue-reader` for `status ∈ {to_score, scoring}`; poll the execution for the
> JSON rows.
>
> **4. Orphan sweep.** For each `scoring` row with `claim_at` older than **30 min**, set `status=to_score`,
> clear `claim_at` (a prior run died mid-row). Reclaim, don't skip.
>
> **5. Drain** `to_score`, **oldest `harvested_at` first, in chunks of `<CHUNK=10>`**, up to the per-run cap.
> For each row:
> - **Re-gate.** If `fetch_status` is not `ok`/`no_link`, or `fetched_content` is empty or matches the
>   fetch-gate junk markers (`references/fetch-gate.md`), set `status=needs_deep_fetch`,
>   `fetch_note="late gate: <reason>"`, and **skip** — never score junk.
> - **Poison check.** If `attempt >= <POISON=3>`, set `status=error_held`, `reason="poison: repeated
>   failures"`, skip — one bad row must not drain the budget every run.
> - **Claim** (batch per chunk): `status=scoring`, `claim_at=<now>`, `scored_by=<your id>`, `attempt++`.
> - **offer_type.** Compute it from `fetched_content` using the skill's own State A/B/C rubric
>   (`input-contract.md`) — not from any upstream field.
> - **Score.** Run `score-prospect-fit` on `bio` + `fetched_content` (+ `offer_type`). Get
>   `screen / fired / missing / closer_look / reason`. **Never guess on empty content; a thin/blocked page is
>   `needs_deep_fetch`, never `no`.**
> - **Commit** (one `verdict-writer` call per chunk): the verdict fields + `offer_type` + `screened_at=<now>`
>   + `status=scored`, keyed on `row_key`. Poll the execution; on write failure retry once, else set those
>   rows `error_held`, `reason="write failed"` and flag it in the digest.
> - On a **skill exception**: retry ≤2×, then `status=error_held`, `reason=<error>`.
>
> **6. Budget.** Between chunks, check elapsed time / plan headroom. Near the soft budget (**stop at `<STOP>`
> rows or `<MINUTES>` min — set from the T8 dry run**), **stop**: leave the rest `to_score`, post the partial
> digest, release the lock, and `send_later`-fire yourself to resume **only if still inside the off-hours
> window**. Stopping is always reported, never silent.
>
> **7. Digest — once, at end.** Post one Slack line to `<channel>`: `Scoring <date>: scored N
> (fit A / review B / later C / no D). Deep-Fetch Queue: X. Error-held: Y. Unfetchable: Z. Remaining
> to_score: R.` **State every operational count even when zero** — a clean run is asserted, not inferred from
> silence. (The "did the run happen at all" case is covered by the separate always-on n8n watchdog, T6 — a
> plan-capped session cannot self-monitor that.)
>
> **8. Release** the `_Control` lock.
>
> **Never:** fetch web pages · write the sheet except via `verdict-writer` · touch a `scored`/`unfetchable`/
> `error_held` row · emit a verdict on empty/thin content.

## Safety properties (why this can't fail silently)
- **Per-chunk commit + lease** → a crash/cap loses at most the in-flight chunk; its rows stay visibly
  `scoring` and are reclaimed by the next run's orphan sweep. Blast radius is bounded, never a lost batch.
- **Key-addressed upsert** (verdict-writer on `row_key`) → a verdict can never land on the wrong prospect even
  if the sheet shifted between read and write (Sheets has no CAS; keying the write is the fix).
- **Re-gate** → one gate bug can't cause a confident verdict on junk; junk routes to `needs_deep_fetch`.
- **Poison breaker** → a malformed row is parked + named after 3 tries, never re-drained forever.
- **Mandatory digest footer + external watchdog** → every non-terminal-good pile is counted; "never ran" is
  caught by the watchdog outside the plan-cap failure domain.
- **Invariant:** a row is either terminal (`scored`/`unfetchable`/`error_held`) **or** counted-and-named in
  the next digest/alert — never un-terminal AND unmentioned.

## Tunables (fill at build)
`CHUNK=10` · lease TTL `30 min` · `POISON=3` · soft budget `STOP`/`MINUTES` (**measure in T8** — a 10-row dry
run extrapolated against BOTH the 5-hour and weekly caps) · `<ID>`/`<channel>` (Phil) · off-hours window.

## Resolved build parameters (2026-08-24)
- **Spreadsheet `<ID>`** = the Screened work sheet `1gUhvTA2UxxctxwXwsrxz6R82nnpXKhuQWF_4kqZz3oY` (tab gid 1722814082).
- **`<channel>`** = `#fd_marketing` (`C0BR9JW9Z6F`) — digest *and* watchdog (watchdog alerts prefixed
  `⚠️ SCORING DID NOT RUN`).
- **Schedule** = daily **08:00 UTC** (fresh session), ~2h after the Mon 06:00 UTC harvest. Sanity-check against
  Phil's local off-hours; adjust the one cron field if it collides with his work window.
- **`CHUNK=10` · lease TTL 30 min · `POISON=3`** as specified.

## Still open (fed by other tasks)
- The `queue-reader` + `verdict-writer` helper workflows are part of the T2/T9 n8n build.
- Soft-budget `STOP`/`MINUTES` come from the **T8 dry run** (only number still to measure).
- `_Control` lock is **best-effort** (Sheets has no atomic compare-and-swap) — acceptable because a single
  daily fire is the only scheduled writer and manual fires are discouraged while a run is active.
