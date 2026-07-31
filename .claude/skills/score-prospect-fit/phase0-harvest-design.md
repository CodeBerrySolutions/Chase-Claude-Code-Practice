# Phase 0 Harvest — design (Berry Nova prospect harvester)

Goal: fill the **raw prospects sheet** the screener reads — one row per candidate
with `username`, `full_name`, `followers`, `bio`, `ext_urls`, `private`,
`verified`, `biz_category`, `last_post`, `best_comment`, `seed`, `source_type`.
Hands-off, on a schedule, feeding straight into the Screener (`bK0muPffxRMXLazZ`).

**Source of truth for the method:** the pilot doc *Instagram Seed Investigation —
Berry Nova Harvest Pilot*. This is that pilot's **Phase 2** (the commenter harvest
the pilot deferred to "the Apify job" — but we use the same **ScrapeCreators**
API the pilot already validated, not Apify).

## The scraper: ScrapeCreators (already proven in the pilot)

- Base `https://api.scrapecreators.com`, auth via **`x-api-key`** header.
- Endpoints (confirmed live in the pilot):
  - `GET /v1/instagram/profile` — verify + followers + bio + links (profile enrich)
  - `GET /v2/instagram/user/posts` — an account's posts, paginate via `next_max_id`
  - `GET /v2/instagram/post/comments` — a post's commenters, paginate via `cursor`
- Reel detection: `product_type == "clips"`.
- In n8n: **HTTP Request** node + an **httpHeaderAuth** credential holding the
  `x-api-key`. (You have "Header Auth" credentials — confirm one is the
  ScrapeCreators key, or add one.)

## The harvest logic

```
seeds → recent posts (30d, prefer carousels not reels) → commenters
      → dedup commenters (across posts + seeds, and vs. already-harvested)
      → profile-enrich each new commenter → write prospect row
```

Grounded in the pilot's findings:
- **Prefer carousels/feed over reels.** Reels accumulate plays, not comments, and
  the big-comment posts are often keyword-DM funnels. Filter `product_type !=
  "clips"`; the pilot explicitly says harvest the carousels.
- **Keep keyword-bait commenters — don't drop them.** "Qualification happens on
  their profiles, not their comment text" (Amy's "comment PODCAST" crowd are
  on-target course-creators). Tag them via `source_type` instead of filtering:
  - `keyword_bait` — comment is a single keyword ("Podcast", "Training")
  - `personal` — an @-tag or emotional/personal reply
  - `organic` — a substantive human sentence (≥4 words, the pilot's classifier)
- **Qualification is the Screener's job**, not harvest's. Harvest casts the net
  and enriches; the Screener (Phase 1, built) applies the ICP symptoms. So
  harvest should **not** pre-judge fit — only dedup and enrich.

## Recommended seeds (from the pilot, ranked)

1. **@jasminestar** — highest comment quality (66% substantive), median 49.
2. **@amyporterfield** — volume leader (~3,123 comments/30d), on-target audience.
3. **@brendonburchard** — distinct 3rd flavor (mindset), comment-friendly carousels.
Swap option: **@jameswedmore** for Amy if you weight audience purity over volume.

## Cost model (the real constraint)

The credit driver is **one profile call per unique commenter**. Amy alone has
~3k comments/30d, so uncapped this is thousands of calls per run. Controls:
- **Caps:** N posts/seed (e.g. 8 non-reel), M comments/post (e.g. 150) →
  dedup → cap **new** profile-enrich calls/run (e.g. 300).
- **Dedup vs. already-harvested:** skip usernames already in the sheet, so each
  run spends credits only on genuinely new prospects.
- Rough budget at ~1–2 credits/call: 3 seeds × (8 post-list + 8×~2 comment pages)
  + ~300 profile calls ≈ **350–400 calls/run**. Tune caps to your credit budget.

## n8n node plan (harvester workflow)

Target project **BerryNova**. Own workflow, scheduled just before the Screener.

1. **Schedule Trigger** — weekly (before the screener's run).
2. **Seeds** — a `Set`/`Code` node or a small "seeds" sheet: `[{seed:'jasminestar'},
   {seed:'amyporterfield'},{seed:'brendonburchard'}]`.
3. **List Posts** — HTTP Request `GET /v2/instagram/user/posts` per seed, loop
   pagination (`next_max_id`) until 30-day boundary or post cap; keep
   `product_type != "clips"`.
4. **Split** posts → **List Comments** — HTTP Request `GET /v2/instagram/post/comments`
   per post, paginate `cursor` to the comment cap. Emit one item per commenter
   with `{username, comment_text, seed, post_id}`.
5. **Classify + dedup** — a `Code` node: tag `source_type` from `comment_text`;
   dedup by `username` within the run; then a **Google Sheets read** of existing
   rows + `filter` to drop usernames already harvested.
6. **Profile Enrich** — HTTP Request `GET /v1/instagram/profile?handle=…` per new
   commenter → `followers, bio, ext_urls, private, verified, full_name,
   biz_category, last_post`. Cap items with a `Limit` node first.
7. **Write Prospect Row** — Google Sheets `appendOrUpdate` (match `username`) into
   the raw prospects sheet the Screener reads, plus `harvested_at`, `seed`,
   `source_type`, `best_comment`.

Pagination + caps use `splitInBatches` loops; a `Limit` node enforces the
per-run profile-call ceiling so credits stay bounded.

## Steering decisions before I build

1. **Scraper = ScrapeCreators?** (Recommended — proven in your pilot, endpoints
   known.) And which credential holds the `x-api-key` — one of the "Header Auth"
   creds, or add one?
2. **Seeds** — Jasmine Star + Amy Porterfield + Brendon Burchard (pilot pick), or
   swap Amy → James Wedmore for purity?
3. **Caps** — posts/seed, comments/post, and the **new-profiles/run ceiling**
   (this sets the credit spend). Suggest 8 / 150 / 300 to start.
4. **Cadence** — weekly, a bit before the screener? And should harvest + screen be
   two chained workflows or one?
5. **Reel handling** — carousels-only (recommended), or include reels too?

## Not in scope
- Comment-text qualification (that's the Screener).
- Direct instagram.com scraping / logins (the pilot stayed API-only; so do we).
