# Scoring handoff — n8n ⇄ Claude-session (T0 findings + T1 schema)
_Design spec for operating the score-prospect-fit skill as a scheduled Claude session. Dated 2026-08-24._

Companion to `n8n-workflow-design.md`. This file is the build contract for the scoring split:
n8n does harvest + fetch + all Sheet writes + watchdog (API-billed); a scheduled Claude Code session
runs the skill and produces verdicts (plan-billed). One Google Sheet, one `status` column, is the handoff.

---

## T0 — the Sheets write primitive (RESOLVED)

**Finding.** The Claude session's Google access in this environment (and any CCR session that inherits it)
is **Drive-level only**: `read_file_content` (whole-sheet read), `create_file` (whole new file),
`update_file` (title/parent metadata only), `copy_file`, `share_file`. **There is no cell/row write**
(`values.append`/`batchUpdate`) — confirmed by tool inventory and empirically (row-append to the Raw sheet
failed earlier; Phil imported via the UI). Additionally, the session's **raw outbound HTTP is egress-blocked**
(only Anthropic + package registries are allowed — a direct POST to the n8n webhook host is refused).

**Decision — n8n is the single Sheets writer; the session drives it via the n8n MCP.**
- **Writes:** the scoring session never writes the sheet directly. It calls an n8n **"verdict-writer" workflow**
  through `mcp__n8n__execute_workflow` (MCP traffic routes through the allowed Anthropic MCP proxy, not the
  blocked egress path), passing the verdict payload as inputs. That workflow does a Google Sheets
  **`appendOrUpdate` keyed on the stable `row_key`** — a **key-addressed upsert**, which structurally kills
  the "write-by-row-index onto the wrong prospect" hazard the review flagged (Sheets has no CAS; keying the
  write is the fix). One writer ⇒ no two-writer races.
- **Reads:** the session reads the queue snapshot via `read_file_content` on the work sheet (whole-sheet,
  parse the table) — this already works. (Optional later: an n8n read-workflow returning JSON; deferred
  because `execute_workflow` is fire-and-forget and returns an execution id, so a Drive read is simpler for
  a synchronous snapshot.)
- **Atomicity:** each verdict is one `appendOrUpdate` node execution (all fields for the row in one call),
  so there is no observable "verdict written but status still scoring" half-row.

**Caveat to carry into T5 (trigger).** Interactively-authenticated MCP connectors can be **absent in a
headless/cron-fired session** (the n8n MCP docs warn of this). The runner MUST preflight: confirm the n8n MCP
and Google Drive MCP are present; if either is missing, do nothing destructive and alert (never score
without a working writer). This is a hard gate in the runner prompt.

---

## T1 — stable key, work-sheet schema, status lifecycle

### Stable dedup key
`row_key` = the IG **numeric user id** (`ig_user_id`, ScrapeCreators profile `pk`/`id`) — **not** the handle
(usernames are mutable and reusable; keying on them creates ghosts on rename and collisions on reuse).
- Fallback: if `ig_user_id` is unavailable for a row, `row_key = "u:" + username` so the pipeline still works,
  flagged for later backfill.
- The n8n upsert matches on `row_key`. **Open item (Phil):** confirm ScrapeCreators returns the numeric id.

### The one work sheet — columns
Tab: the existing **`Screened Prospects`** (extended into the superset below). Owner = who writes it:
**H** n8n harvest+fetch · **C** Claude scoring session · **P** Phil (manual deep-fetch).

| Column | Owner | Type | Purpose |
|---|---|---|---|
| `row_key` | H | string | **Stable key** = `ig_user_id` (or `u:<username>` fallback). Upsert/dedup key. |
| `username` | H | string | Current handle (display; may change over time). |
| `run_id` | H | string | Harvest batch, ISO week e.g. `2026-W34`. |
| `bio` | H | text | Scoring input. |
| `ext_urls` | H | string | Link(s)-in-bio; fetch + deep-fetch target. |
| `fetched_content` | H·P | text | Firecrawl markdown (or pasted 9222 text). Scoring input. |
| `fetch_status` | H·P | enum | `ok` / `thin` / `blocked` / `error` / `no_link`. **Never blank.** |
| `fetch_note` | H·P | string | Short reason when not `ok` ("403 Linktree", "38 chars", "timeout"). |
| `fetched_at` | H·P | iso8601 | When content was captured. |
| `source` | H·P | enum | `firecrawl` / `deep_fetch_9222` / `legacy`. Audit; shows re-scores. |
| `offer_type` | C | enum | `service`/`mixed`/`product_only`/`unknown` — **computed by the scorer from `fetched_content` using the skill's own rubric** (one source of truth), not by n8n. |
| `status` | H·C·P | enum | The state machine (below). Only orchestration field. |
| `claim_at` | C | iso8601 | Lease timestamp; drives orphan recovery. |
| `scored_by` | C | string | Scoring session id (distinguishes a live claim from a dead session's). |
| `screen` | C | enum | `fit` / `review` / `later` / `no`. |
| `fired` | C | string | Indicators that fired. |
| `missing` | C | string | Missing-evidence list. |
| `closer_look` | C | enum | `yes: <what>` / `no`. |
| `reason` | C | string | One-line cited symptom. |
| `screened_at` | C | iso8601 | Verdict timestamp. |

Consumers (Slack digest, `draft-outreach`) read **only `status = scored`** (a Filter View) — so no in-flight
or errored row can leak into a decision surface. This gives the isolation of a separate results tab without a
second physical copy to keep in sync.

### Status lifecycle (the `status` column)
States (owner who sets it):
- **`to_score`** — good fetch, awaiting the skill. *The scoring queue.* (H on `fetch_status=ok`/`no_link`; P after a good deep-fetch; retry/re-open.)
- **`needs_deep_fetch`** — fetch `blocked`/`thin`/`error`; not scoreable from what we have. *The Deep-Fetch Queue.* **Loud.** (H on bad fetch; C on late-detected junk.)
- **`scoring`** — a session holds a lease. Transient. (C.)
- **`scored`** — verdict written. Terminal-good. (C.)
- **`error_held`** — content was `ok` but the skill/write threw past retries; parked + named, never dropped. (C.)
- **`unfetchable`** — even 9222 failed (private/deleted/dead); terminal-dead, with a reason so the queue can't grow forever. (P.)

Transition table (`from → to : trigger : writer`):
```
(new, fetch ok/no_link)  → to_score          : n8n gate           : H
(new, fetch bad)         → needs_deep_fetch   : n8n gate           : H
to_score   → scoring     : claim (writes claim_at, scored_by)     : C
scoring    → scored       : verdict upsert (all fields, one call) : C
scoring    → needs_deep_fetch : late junk/thin detected on page  : C
scoring    → error_held   : skill/write threw > retry cap         : C
scoring    → to_score     : orphan sweep (claim_at stale > 30m)   : C (next run)
needs_deep_fetch → to_score : 9222 refill, fetch_status=ok         : P
needs_deep_fetch → unfetchable : gave up (reason)                  : P
scored     → to_score     : manual re-open (re-score)             : P
error_held → to_score     : retry after fix                       : P
```
Invariant (the "never silent" guarantee): a row is **either terminal (`scored`/`unfetchable`/`error_held`)
OR counted-and-named in the next Slack digest / watchdog alert — never un-terminal AND unmentioned.** Absence
of a visible offer is `needs_deep_fetch` or (per the skill's thin-content rule, when a scoreable bio exists)
`review` — **never a silent drop, never verdict-`no`.**

Column ownership prevents write-collision: H owns identity+fetch cols and the initial status; C owns scoring
cols and the exits from `to_score`; P owns content-refresh and the exits from `needs_deep_fetch`. No two
actors write the same cell in the same state — and since all writes funnel through the one n8n upsert (T0),
there is no concurrent-writer race regardless.

### Observability = the sheet (thin cockpit, no dashboard)
Filter Views (the virtual queues): **To score** (`to_score`), **Deep-Fetch Queue** (`needs_deep_fetch`),
**Scoring stuck** (`scoring` AND `claim_at` old), **Score errors** (`error_held`), **Unfetchable**
(`unfetchable`), **Scored — this run** (`scored` + `run_id`). Conditional formatting on `status`:
green `scored`, amber `to_score`/`needs_deep_fetch`, red `error_held`, grey `unfetchable`.

### Migration / backfill of existing rows (do at cutover)
The current `Screened Prospects` has 7 columns keyed on `username` (the pilot's 15 rows). At cutover:
1. Add the new columns (above). For each legacy row set `status=scored`, `source=legacy`, and fill
   `row_key` (backfill `ig_user_id` where cheap, else `u:<username>`).
2. So legacy rows are skipped by the scorer (they're `scored`) and won't be re-processed.
3. n8n dedup matches on `row_key`; a re-harvest of a legacy prospect with a real `ig_user_id` won't match a
   `u:<username>` legacy key — acceptable (it re-scores once and supersedes), or backfill the id to avoid it.
4. Enable Google Sheets **version history** as the rollback (a runaway session can't silently corrupt the
   store — the analog of the repo's "finance skills never write to Xero" guardrail).
