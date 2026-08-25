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
`CHUNK=10` · lease TTL `30 min` · `POISON=3` · soft budget `STOP`/`MINUTES` (**measure in the T8 dry run** —
see below) · `<ID>`/`<channel>` (Phil) · off-hours window.

## T8 — the dry run (what it is, exactly)
The runner stops at a **soft budget** so one scoring session never blows through the plan's rate windows. Two
placeholders in that budget — **`STOP`** (max rows per fire) and **`MINUTES`** (max wall-clock per fire) — are
currently *guessed* (provisional 50 rows / 60 min). **T8 is the single measurement that replaces the guess with
real numbers.** It is not a feature; it's a one-off calibration pass.

**What it measures — per-row cost of the scoring loop, in the two currencies that actually bind:**
1. **Plan-token cost per row** — how much of the Max-20x **5-hour window** and **weekly cap** one scored
   prospect consumes. This is the expensive part deliberately put on plan tokens: the scorer reads a `bio` + a
   full `fetched_content` page (can be long), applies the skill, and does 2–3 n8n round-trips per chunk.
2. **Wall-clock per row** — seconds per prospect, including `execute_workflow` + poll latency for
   read / claim / commit.

**How it's run — one controlled pass over a small fixed sample:**
- Sample = **10 real `to_score` rows** from the first live harvest (T12) — so it needs a non-empty queue and is
  therefore **downstream of the first harvest**. (The 15 migrated rows are all `scored`; nothing to drain from
  them.)
- Run the runner in **measure mode**: score exactly those 10, then **stop and report** — do not drain further.
- Report: tokens consumed (start-of-window vs end), elapsed seconds, the derived **per-row averages**
  (tokens/row, sec/row), and the **worst-case row** (longest `fetched_content`) so the budget is set on the fat
  tail, not the mean.

**What it produces — two numbers, plugged straight into step 5 of the runner prompt:**
- **`STOP`** = rows that fit before eating too much of the 5-hour window (cross-checked against the weekly cap).
- **`MINUTES`** = wall-clock ceiling per fire.

The runner already has the machinery to use them: at each chunk boundary it checks elapsed/headroom, and on
hitting the budget it leaves the rest `to_score`, posts a partial digest, and `send_later`-fires to resume
within off-hours. **T8 only calibrates where those two thresholds sit; nothing else changes.**

**One-line version:** score 10 real prospects once, measure plan-tokens and minutes per row, set `STOP`/`MINUTES`
from that instead of the provisional 50 / 60.

## Resolved build parameters (updated 2026-08-24)
- **Spreadsheet `<ID>`** = the **real Work Sheet** `1gZu5OuMhZ4kBfCPGNlsj09d07dtvkVsfQ2yk8u5252o`, tab **`Untitled`**
  (supersedes the old Screened sheet `1gUhvTA2…` — the 15 rows were migrated here). The runner reaches it only
  through the two helper workflows, which are already repointed at this sheet.
- **Helper workflows:** `queue-reader` = `G9vzcreuIpY1W7kn` · `verdict-writer` = `80Vgb0oBZyZeYcrj` (both BerryNova).
- **`<channel>`** = `#fd_marketing` (`C0BR9JW9Z6F`) — digest *and* watchdog (watchdog alerts prefixed
  `⚠️ SCORING DID NOT RUN`).
- **Schedule** = daily **08:00 UTC** (cron `0 8 * * *`, fresh session), ~2h after the Mon 06:00 UTC harvest.
  **Timezone sanity-check before enabling:** pilot timestamps carry a `+08:00` offset, so 08:00 UTC ≈ 16:00 local
  (Phil's workday, not off-hours) — if that's his tz, shift the one cron hour field to a genuine off-hours slot.
- **Soft budget (provisional, pending T8):** stop at **50 scored rows OR 60 min**, whichever first.
- **`CHUNK=10` · lease TTL 30 min · `POISON=3`** as specified. `_Control` lock **deferred** for the pilot
  (single daily fire is the only scheduled writer).

## Deployment (T5) — how the Routine must be created
The runner is entirely dependent on the **n8n MCP** (queue-reader/verdict-writer) and **Slack** connectors. A
CCR Routine created from a headless/meta-MCP session **carries no connectors** (confirmed: the fired session
would have zero `mcp__*` tools and fail its own preflight). So T5 must be created **from the claude.ai Routines
UI**, or from an interactive session that itself holds the n8n + Slack + Google connectors, so the fired
sessions inherit them.

**Staged, not yet live.** Do not enable until the harvest is running (an enabled daily fire against an empty
queue posts a `scored 0 …` digest to `#fd_marketing` every day — the exact spam to avoid). Enable at **T9
cutover**, alongside activating the harvest + watchdog.

**Setup recipe (Routines UI):** new Routine → *fresh session each fire* in this repo's environment
(`env_01Mq6tVbms9n8BgJx9UGdzdy`) → cron `0 8 * * *` (adjust hour per the tz check above) → attach the **n8n**,
**Slack**, and **Google Drive** connectors → paste the prompt below verbatim → **leave disabled** until cutover.

## The filled-in runner prompt (paste verbatim into the Routine)
> You are the **Berry Nova prospect-scoring runner**. This is a fresh, unattended session. Score fetched
> prospect rows with the `score-prospect-fit` skill (in this repo) and write verdicts back on the user's plan.
> You **NEVER fetch web pages**, and you **write ONLY through the n8n verdict-writer workflow** — you have no
> direct Google Sheets write. Work sheet: tab `Untitled`, spreadsheet
> `1gZu5OuMhZ4kBfCPGNlsj09d07dtvkVsfQ2yk8u5252o`. Columns are documented in `scoring-handoff.md`.
>
> Helpers — call via the n8n MCP `execute_workflow`, then poll `get_workflow_execution` (includeData):
> - **queue-reader** = `G9vzcreuIpY1W7kn` — input `{ statuses: ["to_score","scoring"] }`, returns rows as JSON.
> - **verdict-writer** = `80Vgb0oBZyZeYcrj` — input `{ writes: [ { row_key, <col>:<val>, … } ] }`, upsert on `row_key`.
>
> **1. Preflight.** Confirm the n8n MCP is available. If missing you can neither read nor write — post a Slack
> alert to `#fd_marketing` (`C0BR9JW9Z6F`) if Slack is available, else stop. Never score without a working
> writer. Get your session id (`get_session`) for `scored_by`.
>
> **2. Read the queue.** Call queue-reader for `[to_score, scoring]`; poll for the rows. Zero `to_score` →
> skip to the digest (step 6) and report a clean empty run.
>
> **3. Orphan sweep.** For each `scoring` row with `claim_at` older than **30 min**, set `status=to_score`,
> clear `claim_at` (prior run died mid-row). Reclaim, don't skip.
>
> **4. Drain `to_score`, oldest `harvested_at` first, in chunks of 10**, up to the cap. Per row:
> - **Re-gate.** If `fetch_status` ∉ {ok,no_link}, or `fetched_content` is empty / matches the fetch-gate junk
>   markers (`references/fetch-gate.md`), set `status=needs_deep_fetch`, `fetch_note="late gate: <reason>"`, skip.
> - **Poison.** Missing `attempt` = 0. If `attempt >= 3` → `status=error_held`, `reason="poison: repeated failures"`, skip.
> - **Claim** (batch/chunk): `status=scoring`, `claim_at=<now>`, `scored_by=<id>`, `attempt=<attempt+1>`.
> - **offer_type** from `fetched_content` via the skill's State A/B/C rubric (`input-contract.md`).
> - **Score** `score-prospect-fit` on `bio` + `fetched_content` (+`offer_type`) → `screen/fired/missing/closer_look/reason`.
>   Never guess on empty content; thin/blocked = `needs_deep_fetch`, never `no`.
> - **Commit** (one verdict-writer call/chunk): verdict + `offer_type` + `screened_at=<now>` + `status=scored`,
>   keyed on `row_key`. On write failure retry once, else `error_held`, `reason="write failed"`, flag in digest.
> - **Skill exception:** retry ≤2×, then `error_held`, `reason=<error>`.
>
> **5. Budget (provisional, pending T8):** stop at **50 scored rows OR 60 min**. On stop: leave the rest
> `to_score`, post the partial digest, and `send_later`-fire to resume only if still in off-hours. Always reported.
>
> **6. Digest — once.** One Slack line to `#fd_marketing` (`C0BR9JW9Z6F`): `Scoring <date>: scored N (fit A /
> review B / later C / no D). Deep-Fetch Queue: X. Error-held: Y. Unfetchable: Z. Remaining to_score: R.`
> State every count even when zero.
>
> **Never:** fetch web pages · write except via verdict-writer · touch a `scored`/`unfetchable`/`error_held`
> row · emit a verdict on empty/thin content.

## Still open (fed by other tasks)
- The `queue-reader` + `verdict-writer` helper workflows are part of the T2/T9 n8n build.
- Soft-budget `STOP`/`MINUTES` come from the **T8 dry run** (only numbers still to measure) — defined in full
  in the "T8 — the dry run" section above. Blocked on the first live harvest (needs a non-empty queue).
- `_Control` lock is **best-effort** (Sheets has no atomic compare-and-swap) — acceptable because a single
  daily fire is the only scheduled writer and manual fires are discouraged while a run is active.
