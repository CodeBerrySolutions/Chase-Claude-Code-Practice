# Field Glossary — scraped profile CSV

The batch input is a CSV export of profiles scraped from a seed account's
engagers. Columns, in the order the pilot export used them:

| Column | Meaning | Notes for scoring |
|---|---|---|
| `username` | Instagram handle | The `@` identity; use in output. |
| `full_name` | Display name | Often carries the niche ("… \| Business Coach"). Read it. |
| `followers` | Follower count | **A weak proxy for demand [F5], read only with demand evidence — never alone, never a fixed threshold** (ruling 2026-08-20, `indicators.md`). Low reach *with* a waitlist / reviews / off-platform clients still fits; low reach *with none* → `later`/`no`. Ignore the old band thresholds; the floor varies by niche. |
| `private` | Account is private | Can't see content to screen → screen from bio alone or skip; not a verdict by itself. |
| `verified` | Blue check | Weak signal only. Not required for A; common on mega D_fail too. |
| `is_business` | IG business/creator account | Weak signal. Not decisive. |
| `biz_category` | IG category label | Blank for many real businesses — absence means nothing. When present ("Photographer", "Realtor") it can fire a non-fit symptom (performed craft, regulated title). |
| `posts_count` | Lifetime posts | Context only; very low counts hint at a thin/new account. |
| `last_post` | Date of most recent post | Drives **B_inactive**: older than ~90 days from today = stale. |
| `bio` | Bio text | **Read this fully.** The offer, the niche, and the ICP flag all come from here. Overrides the boolean flags when they conflict. |
| `ext_urls` | External links in bio/link-in-bio | Presence of a funnel/booking/course link corroborates a real offer. |
| `has_commerce` | Shop/commerce link detected | Weak corroboration of a real business. |
| `has_linkhub` | Linktree/Stan/Beacons-style hub detected | Weak corroboration; common for coaches. |
| `bio_offer` | Heuristic: bio contains an offer/CTA | Strong signal but **noisy** — misses soft CTAs ("Download the method"). Confirm against the bio. |
| `offer_type` | (scraper) What the person sells, read from their link-in-bio | Feeds the offer symptoms (`indicators.md`): `service`/`mixed` → the **delivery-vehicle** fit symptom; `product_only` → the **passive-product / no-vehicle** non-fit; `unknown` → **review** (missing evidence). See `input-contract.md`. Absent → infer from bio, default review. |
| `overwhelm` | Heuristic: bio speaks to burnout/overwhelm themes | Weak proxy for an overload sign [F3]; never a verdict. |
| `tier` | (pilot output) legacy tier | Old band-based label; **ignore for screening** — kept only to compare against the new symptom screen. |
| `seeds` | Which seed account(s) this engager came from | `amy` / `james` / `jasmine`. Provenance; a very on-topic peer-level comment is a mild positive. |
| `source_types` | How they surfaced | `organic` / `keyword_bait` / `personal`. Context for comment quality. |
| `best_comment` | Their comment on the seed's post | A substantive, peer-level comment leans expert; "🔥🔥🔥" / "Training" leans low-intent fan. |
| `icp_flag` | (pilot output) legacy sub-flag | Superseded by the screen verdict. Ignore for screening. |

## Signals that are load-bearing vs. decorative

- **Load-bearing (symptom sources):** the **bio** and, when present, the
  **link-in-bio content / `offer_type`** — this is where the delivery-vehicle,
  documented-method, and capacity symptoms show up. Read `indicators.md`.
- **Demand proxies [F5] (weak, corroborating — never alone):** `followers` (see
  its row), `last_post` (a long-dead account is a demand/`no` signal). Read
  *with* the bio's demand evidence, not as standalone criteria.
- **Decorative / routing only:** `verified`, `is_business`, `has_commerce`,
  `has_linkhub`, `overwhelm`, `source_types`. Use to route who gets looked at or
  to break ties — **never** as the screen verdict.

## What the skill cannot see

The skill reads **text only**. It has **no access to photos or videos**, and in
this environment **cannot open link-in-bio pages** (Linktree/Stan/most sites 403
automated fetches; web fetch is blocked here). Consequences:

- The delivery-vehicle and documented-method symptoms usually live *behind the
  link*, not in the bio — so they're frequently invisible to a text-only screen.
  This is why link content / `offer_type` is pushed **upstream to the scraper**
  (`input-contract.md`).
- Visual lean is invisible: someone whose bio says "coach" but whose feed is all
  hands-on training can look fine from text alone. When a text-invisible symptom
  could flip the call, screen **review** and flag the closer look — don't guess.

Never treat a silent bio as a hard stop — absence of visible tells is
**review + missing evidence**, not a `no`.
