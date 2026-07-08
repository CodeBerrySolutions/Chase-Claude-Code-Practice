# Field Glossary — scraped profile CSV

The batch input is a CSV export of profiles scraped from a seed account's
engagers. Columns, in the order the pilot export used them:

| Column | Meaning | Notes for scoring |
|---|---|---|
| `username` | Instagram handle | The `@` identity; use in output. |
| `full_name` | Display name | Often carries the niche ("… \| Business Coach"). Read it. |
| `followers` | Follower count | Primary band signal. Sweet spot ~2k–48k. See `tier-rubric.md`. |
| `private` | Account is private | `True` → **C_private**, hard stop. |
| `verified` | Blue check | Weak signal only. Not required for A; common on mega D_fail too. |
| `is_business` | IG business/creator account | Weak signal. Not decisive. |
| `biz_category` | IG category label | Blank for many real businesses — absence means nothing. When present ("Photographer", "Realtor") it helps the ICP flag. |
| `posts_count` | Lifetime posts | Context only; very low counts hint at a thin/new account. |
| `last_post` | Date of most recent post | Drives **B_inactive**: older than ~90 days from today = stale. |
| `bio` | Bio text | **Read this fully.** The offer, the niche, and the ICP flag all come from here. Overrides the boolean flags when they conflict. |
| `ext_urls` | External links in bio/link-in-bio | Presence of a funnel/booking/course link corroborates a real offer. |
| `has_commerce` | Shop/commerce link detected | Weak corroboration of a real business. |
| `has_linkhub` | Linktree/Stan/Beacons-style hub detected | Weak corroboration; common for coaches. |
| `bio_offer` | Heuristic: bio contains an offer/CTA | Strong signal but **noisy** — misses soft CTAs ("Download the method"). Confirm against the bio. |
| `overwhelm` | Heuristic: bio speaks to burnout/overwhelm themes | Context flag about messaging; not a tier driver on its own. |
| `tier` | (pilot output) assigned tier | Present in already-scored pilot files; the label to reproduce/audit, not an input to trust blindly. |
| `seeds` | Which seed account(s) this engager came from | `amy` / `james` / `jasmine` (Amy Porterfield, James Wedmore, Jasmine Star). Provenance; a very on-topic comment on a peer's post is a mild positive. |
| `source_types` | How they surfaced | `organic` (real engagement), `keyword_bait` (replied to a bait keyword like "Podcast"/"Training"), `personal` (personal/emotional comment). Context for comment quality. |
| `best_comment` | Their actual comment on the seed's post | Read it — a substantive, peer-level comment signals an expert; "🔥🔥🔥" or "Training" signals a low-intent fan. |
| `icp_flag` | (pilot output) ICP sub-flag | Only populated for A_qualified. See `icp-flags.md`. |

## Signals that are load-bearing vs. decorative

- **Load-bearing:** `private`, `followers`, `last_post`, and the bio (offer +
  niche). The waterfall turns almost entirely on these four.
- **Decorative / corroborating:** `verified`, `is_business`, `has_commerce`,
  `has_linkhub`, `overwhelm`, `source_types`. Use them to break ties or
  sanity-check, never as the deciding factor.
