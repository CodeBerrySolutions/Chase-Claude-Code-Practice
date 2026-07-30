# pipeline — end-to-end re-scoring

Scraped CSV → **re-scored roster**, reading the real offer behind each
link-in-bio via a real Chrome on port 9222 (which the bio can't show).

```
scraped.csv
  │  1_csv_to_profiles.py        split ext_urls -> links (skips private)
  ▼
profiles.json
  │  ../link-reader/read-links.mjs   open links in Chrome :9222 -> page text
  ▼
pages.json
  │  2_classify_offers.py        page text -> offer_type (heuristic; exclusions win)
  ▼
offers.json
  │  3_score.py                  CSV + offer_type -> tier/priority/reason/needs_review
  ▼
scored.json
```

## Run it

**Easiest — one command** (checks prereqs, installs Playwright, launches Chrome
on :9222, runs everything):
```bash
./bootstrap.sh path/to/scraped.csv 2026-07-30
# -> out/scored.json  and  out/fit-review.html
```

**Manual** (if you already have Chrome on :9222):
```bash
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/pf-chrome &   # keep open
./run.sh path/to/scraped.csv 2026-07-30      # 2nd arg = "today" for the stale check
# -> out/scored.json  (+ out/{profiles,pages,offers}.json, out/fit-review.html)
```

Run on a machine with a **real browser + open network** (your laptop or the
scraper box). A locked-down CI/cloud sandbox has no route to the sites and no
browser to drive.

Each step is standalone and pipeable, so you can rerun just one (e.g. re-classify
without re-reading links).

## What's mechanical vs. what still needs a human

`3_score.py` is the executable form of the v2 rubric, but it only does the
**mechanical** gates: private, the offer gate (from `offer_type`), mega-reach,
follower band, and activity. It deliberately does **not** try to auto-detect
`off_niche` / `no_offer` beyond what the offer classification catches — those
were human calls in the pilot. Practical effect:

- **With real link data** the offer classifier catches most non-fits (a realtor's
  or product brand's link has no coaching cues → `product_only`/`unknown`).
- **Without link data** (bio-only fallback) the scorer is intentionally permissive
  and flags almost everything `needs_review` — that's honest, not a bug.

So this pipeline gets you a strong first pass; `calibration-examples.md` + hand
review refine the edges. The classifier (`2_classify_offers.py`) is a keyword
approximation — when in doubt it returns `unknown` (→ `offer_unconfirmed`), never
a false reject.

## Verified
Steps 1–3 run here (Node 22 + global Playwright, Python 3). The `:9222` browser
step needs your Chrome running; on the mocked offer texts the chain reproduces
the human verdicts (`@annette`, `@vickibartel`, `@theenglishaesthetic` →
`no_serviceable_offer`; `@elenasblair`, `@nancy_levin` → A/High).
```
