# Fetch-quality gate — policy & markers (T2/T3)
_Versioned config for the mechanical fetch gate. Dated 2026-08-24._

The gate sits in the n8n fetch workflow **after Firecrawl and before the sheet write**. It classifies each
link-in-bio fetch into a `fetch_status` using **only** transport facts and content-marker regex — **zero ICP
judgment** (that stays in the `score-prospect-fit` skill, one source of truth). This is the piece that
structurally kills the silent blank row: every fetch outcome writes a row with a non-empty `fetch_status`.

## Source of truth
The executable, unit-tested implementation is **`pipeline/fetch_gate.mjs`** — `classifyFetch()` + `statusFor()`.
Paste those two functions into the n8n Code node **verbatim** so the deployed gate and the repo never drift
(the exact drift the review warned about). Self-test: `node pipeline/fetch_gate.mjs --test` (11 fixtures, no
network). **To change a threshold or marker, edit `fetch_gate.mjs`, re-run the test, commit — never tune it
inside the n8n node.**

## fetch_status values (never blank)
| value | meaning | initial `status` |
|---|---|---|
| `ok` | HTTP success, no wall/junk markers, ≥ `THIN_FLOOR` real chars | `to_score` |
| `no_link` | prospect has no `ext_urls` | `to_score` (skill scores on bio → usually `review`) |
| `thin` | 200 but < `THIN_FLOOR` real content (Linktree shell, consent-only, JS shell) | `needs_deep_fetch` |
| `blocked` | 401/403/429, or a captcha / Cloudflare / login / private / parked marker | `needs_deep_fetch` |
| `error` | timeout / DNS / 5xx / Firecrawl error object | `needs_deep_fetch` |

## Tunables (in `fetch_gate.mjs`)
- `THIN_FLOOR = 200` — min non-whitespace chars of *real* content (consent-banner lines stripped first) for `ok`.
- `HTTP_BLOCK = [401, 403, 429]` — walls.
- Marker sets: `BLOCK_MARKERS` (captcha/JS/Cloudflare/access-denied), `LOGIN_MARKERS` (login/private-account),
  `PARKED_MARKERS` (domain-for-sale), `CONSENT_MARKERS` (cookie/consent — **weak**: never forces `blocked`,
  only counts toward `thin` when the page is otherwise empty, so a real page with a cookie banner still passes).

## Routing policy & rationale
- `ok`/`no_link` → **`to_score`**. A bio-only row still scores (the skill's thin-content rule → `review` +
  missing evidence, never a false `no`).
- `blocked`/`thin`/`error` → **`needs_deep_fetch`**. The link content is the *decisive* offer signal
  (`input-contract.md`: `offer_type` lives behind the link), so a human/9222 deep-fetch is worth more than a
  bio-only `review`. **Caveat the review raised:** this pile fills fast (coaches live on bot-403'd Linktree/Stan),
  so it is **aged and escalated by the watchdog (T6)** and surfaced in the digest — it must never grow silently.
  If the deep-fetch backlog is impractical, a bio-only `to_score` is an acceptable fallback (skill → `review`).

## n8n wiring (the gate's place in the fetch workflow)
1. Firecrawl node runs with an **error output branch** — **not** `continueRegularOutput` (that setting wrote the
   one blank row we saw). A throw/timeout routes to the error branch carrying `error`.
2. A single **Code node** (the classifier) runs on both branches’ items → sets `fetch_status`, `fetch_note`,
   and `status` = `statusFor(fetch_status)`. **Both branches produce a row.**
3. Write via the single n8n Sheets writer, **insert-if-absent on `row_key`** (never `appendOrUpdate` that would
   clobber an existing verdict) — see `scoring-handoff.md` §T0/T1.

## Fixture provenance (real signatures observed in pilot runs 8722–8729)
- `sarahdebaetscoaching` → Firecrawl returned a **reCAPTCHA** page → `blocked`.
- `shift.magnetic` / `maryghyatt` → Linktree/blocked link returned a **thin** shell → `thin`.
- `melaniedyann` → **parked / taken-over** site → `blocked` (parked markers).
- Private IG pages → **login/private** wall → `blocked`.
These seed the self-test; add new real signatures as they appear (freeze the Firecrawl markdown into a fixture,
add a case, re-run `--test`).
