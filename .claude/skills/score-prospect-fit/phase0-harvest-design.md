# Phase 0 Harvest — finalized spec (Berry Nova prospect harvester)
_Finalized 2026-08-24 with reasonable defaults. Companion to `scoring-handoff.md` + `references/fetch-gate.md`._

Goal: fill the **work sheet** the scorer drains — one row per candidate, born at an initial `status`, with the
stable key and the two scoring inputs (bio + fetched page). Hands-off, weekly, feeding the fetch-gate → scorer.

**Source of truth for the method:** the pilot doc *Instagram Seed Investigation — Berry Nova Harvest Pilot*.
This is that pilot's **Phase 2** (commenter harvest), using the **ScrapeCreators** API the pilot validated.

## What each run produces (per `scoring-handoff.md` T1 schema)
Harvest + enrich + fetch write one work-sheet row per **new** prospect:
- `row_key` = **`ig_user_id`** (ScrapeCreators profile numeric id) — the stable dedup key. Fallback
  `u:<username>` if the id is ever absent. **← this answers the open "stable key" question: the profile
  endpoint returns IG's numeric id; capture it. Confirm the exact field name on the first live call.**
- `username`, `bio`, `ext_urls` (the fetch target), `run_id` (ISO week), plus provenance `seed`, `source_type`,
  `best_comment`, and the routing/context fields `followers`, `full_name`, `biz_category`, `last_post`,
  `private`, `verified` (weak demand/routing proxies per `field-glossary.md`, never criteria).
- Then the **Firecrawl fetch + gate** (`fetch_gate.mjs`) fill `fetched_content`, `fetch_status`, `fetch_note`,
  `source=firecrawl`, and set the initial `status` (`to_score` / `needs_deep_fetch`).
- Harvest does **not** compute `offer_type` — the scorer computes it from `fetched_content` (one source of truth).

## The scraper: ScrapeCreators (proven in the pilot)
- Base `https://api.scrapecreators.com`, auth via **`x-api-key`** header.
- Endpoints (confirmed live in the pilot):
  - `GET /v1/instagram/profile` — id + verify + followers + bio + links (profile enrich; **source of `ig_user_id`**)
  - `GET /v2/instagram/user/posts` — an account's posts, paginate via `next_max_id`
  - `GET /v2/instagram/post/comments` — a post's commenters, paginate via `cursor`
- Reel detection: `product_type == "clips"`.
- In n8n: **HTTP Request** node + an **httpHeaderAuth** credential holding the `x-api-key`.

## Harvest logic
```
seeds → recent posts (30d, carousels not reels) → commenters
      → dedup commenters (across posts+seeds, and vs. rows already in the work sheet, by ig_user_id)
      → profile-enrich each NEW commenter (captures ig_user_id, bio, ext_urls, …)
      → Firecrawl fetch link-in-bio → fetch_gate → write work-sheet row at its initial status
```
Grounded in the pilot:
- **Carousels/feed over reels** — reels accrue plays not comments; filter `product_type != "clips"`.
- **Keep keyword-bait commenters** — qualification happens on the profile, not the comment. Tag `source_type`
  instead of dropping: `keyword_bait` (single keyword), `personal` (@-tag/emotional), `organic` (≥4-word human
  sentence). **Qualification is the scorer's job**, never harvest's — harvest casts the net + enriches only.

## Locked defaults (correct anytime)
- **Seeds:** `@jasminestar` (66% substantive, median 49) · `@amyporterfield` (volume ~3,123 comments/30d) ·
  `@brendonburchard` (mindset flavor). Swap `@jameswedmore` for Amy if weighting audience purity over volume.
- **Caps:** 8 non-reel posts/seed · 150 comments/post · **300 new profile-enrich calls/run** (the credit lever).
- **Cadence:** weekly, before the scorer's off-hours window.
- **Topology:** **one workflow** — harvest → enrich → Firecrawl fetch → gate → write. (No separate `harvested`
  state; rows are born at `to_score`/`needs_deep_fetch`. Split into two workflows only if we later want
  un-fetched rows visible during a Firecrawl rate-limit — deferred.)
- **Reels:** carousels-only.

## Cost model (the real constraint)
Credit driver = **one profile call per unique new commenter**. Dedup vs. the work sheet (by `ig_user_id`) so
credits are spent only on genuinely new prospects. Rough budget at ~1–2 credits/call:
3 seeds × (8 post-list + ~8×2 comment pages) + ~300 profile calls + 300 Firecrawl fetches ≈ **~350 API +
~300 Firecrawl/run**. The `Limit` node before profile-enrich enforces the ceiling. Tune to the credit budget.

## n8n node plan (one harvester+fetch workflow, project BerryNova)
1. **Schedule Trigger** — weekly, before the scorer.
2. **Seeds** — `Set`/`Code` (or a tiny seeds sheet): the three handles above.
3. **List Posts** — HTTP `GET /v2/instagram/user/posts` per seed; paginate `next_max_id` to the 30-day
   boundary or post cap; keep `product_type != "clips"`.
4. **Split posts → List Comments** — HTTP `GET /v2/instagram/post/comments`; paginate `cursor` to the comment
   cap; emit one item per commenter `{username, comment_text, seed, post_id}`.
5. **Classify + dedup** — `Code`: tag `source_type`; dedup by `username` within the run; then read the work
   sheet and **drop commenters whose `ig_user_id`/`row_key` already exists** (insert-if-absent). (Username→id
   isn't known until enrich, so pre-dedup by username to avoid wasted enrich calls, then final-dedup by
   `ig_user_id` at write.)
6. **Limit** — enforce the per-run profile-call ceiling (300).
7. **Profile Enrich** — HTTP `GET /v1/instagram/profile?handle=…` per new commenter → capture **`ig_user_id`**,
   `bio`, `ext_urls`, `followers`, `full_name`, `biz_category`, `last_post`, `private`, `verified`.
8. **Firecrawl fetch** — scrape `ext_urls` (first link); **error output branch, NOT continue-on-error**.
9. **Fetch gate (Code node)** — paste `classifyFetch`/`statusFor` from `pipeline/fetch_gate.mjs` verbatim; set
   `fetch_status`, `fetch_note`, `status`, `source=firecrawl`. Both branches emit a row.
10. **Write row** — the single n8n Sheets writer, **insert-if-absent on `row_key`** into the work sheet
    (never `appendOrUpdate` that would clobber a verdict), plus `run_id`, `harvested_at`, `seed`,
    `source_type`, `best_comment`.

Pagination/caps use `splitInBatches`; the `Limit` node bounds credits.

## Resolved build parameters (2026-08-24)
Decided defaults so the build can proceed; each is cheap to change later.
1. **ScrapeCreators credential:** use `httpHeaderAuth` **"Header Auth account 2"** (`oB8NBmiRktRjoNwk`, BerryNova
   project). Verify on the first call — a 401 means switch to `SvSJeZgEkbUP0i1Q` or add a dedicated cred.
2. **Credit ceiling:** **300** new profile-enrich calls/run (Limit node).
3. **`ig_user_id` field:** capture **`pk`**, fall back to **`id`**, from the profile object; confirm on first call.
4. **Seeds:** keep the pilot three (Jasmine Star / Amy Porterfield / Brendon Burchard).
5. **Cadence:** harvest **Mondays 06:00 UTC**; scoring **daily 08:00 UTC** (see `scoring-runner.md`). Adjust to
   Phil's off-hours if 08:00 UTC collides with his work window (one cron field).
6. **Re-score freshness window:** **90 days** — on re-harvest, skip a prospect already `scored` within 90d
   (dedup step reads the work sheet by `ig_user_id` + `screened_at`); older than 90d may re-enqueue.

## Not in scope
- Comment-text qualification (the scorer's job) · direct instagram.com scraping / logins (API-only, like the pilot).
