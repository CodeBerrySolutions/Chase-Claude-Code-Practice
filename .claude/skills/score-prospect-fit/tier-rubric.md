# Tier Rubric

The waterfall in full. Gates are evaluated top to bottom; the first match wins.
Thresholds were calibrated to the `pilot_scored_profiles_v1` labels (a decoded
version reproduces ~98% of the pilot's tiers). v2 adds the **offer gate** as the
central test and separates **priority** from tier.

Every scored profile carries a **reason code** (see the taxonomy at the end).

## Gate 1 — C_private (privacy)

`private == True` → **C_private**, reason `private`. Stop.

Absolute — a private account with 40k followers and a perfect name is still
C_private. In the pilot, every C_private row was private and nothing else.

## Gate 2 — The offer gate (central test)

The question that actually decides fit: **does this person sell a done-with-you
offer BerryNova could service** (1:1 coaching, group program, mastermind,
membership-with-delivery)? Resolve to one of three states.

**Signal sources, in priority order:**
1. `offer_type` from the scraper (`service` / `mixed` / `product_only` /
   `unknown`) — trust this first when present.
2. Explicit bio/comment language.
3. Nothing conclusive → unconfirmed.

**State A — Service-confirmed.** The offer is **interactive, done-with-you
coaching or teaching of knowledge** — 1:1, group program, mastermind, cohort.
`offer_type` is `service`/`mixed`, or the text plainly shows it ("DM COACH",
"book a call", "apply", "1:1", "group program", "mastermind", "coaching",
"work with me", a booking/consult link). → passes the gate. (A course *and*
coaching = `mixed` = passes.)

**State B — Out-of-ICP offer (confirmed).** `offer_type == product_only`, **or**
positive evidence the offer is one of the ICP exclusions (`icp-flags.md`) — it
is **not** interactive coaching but instead:
- a **performed craft / done-for-you service** (photographer selling photos,
  designer selling design — `@vickibartel`, `@honeywavecreative`);
- a **physical / procedural / hands-on / visual skill** (pilates, injectables /
  medical procedure, teaching-to-read-music — `@patriciamedrospilates`,
  `@theenglishaesthetic`, `@ashleeyoungmusicstudio`);
- a **passive product with no interactivity** (self-guided course/ebook, no sign
  of student contact);
- a **community / movement**, not an individual expert (`@buywomenbuilt`);
- merch / supplements / physical product / ecommerce.

→ **D_fail**, reason `no_serviceable_offer`. Stop. This fires *even if the bio
reads "coach/expert"* — the disqualifier is "expert in **performing**, not in
**providing info**."

> Worked example — `@annette_milbers`: bio reads coach-adjacent ("Functional
> Hormone Specialist", "Nutrition Coach"), but her link-in-bio sells only an
> ebook + self-guided programs + merch and her posts lean hands-on training —
> nothing to offload. With `offer_type=product_only` she is `no_serviceable_offer`.
> **From bio text alone**, though, she resolves to State C (unconfirmed) — which
> is exactly why the upstream `offer_type` matters.

**State C — Unconfirmed.** The text is silent on offer type and no `offer_type`
was supplied (the common case). → **do NOT reject.** Continue, carrying reason
`offer_unconfirmed` and `needs_review = yes`. A qualified-looking profile with an
unconfirmed offer still flows to A/B — it just gets flagged for a human to verify
before outreach, and drops to **priority: Low** (Step 3 in `SKILL.md`).

## Gate 3 — D_fail (other hard disqualifiers)

Any one → **D_fail**. Stop.

- **No offer at all.** Not selling anything and not presenting as a
  coach/expert — a personal/lifestyle account. Reason `no_offer`.
- **Mega / celebrity reach.** Followers **> ~150,000** — too big for warm 1:1.
  Reason `mega_reach`.
- **Off-ICP niche.** Realtor, physical-product/retail brand, e-commerce shop,
  generic lifestyle/travel creator, unrelated local service (bakery, day spa),
  or spam. Reason `off_niche`.

Note: **being small is no longer a D_fail.** The old "< ~1k followers → D_fail"
floor is removed. A genuine fit that is merely tiny is still a fit — it is
handled by **priority: Nurture**, not rejection. Only reject the tiny ones that
*also* trip a real gate above (no offer / off-niche / product-only).

## Gate 4 — B_inactive (dormant)

A fit, but `last_post` is **older than ~90 days** → **B_inactive**, reason
`inactive`. Good bones, dormant; low-yield now.

## Gate 5 — B_band_edge (follower band edge)

A fit, active, but follower count sits just outside the A sweet spot:
**~1,000–2,000** (low) or **~48,000–150,000** (high) → **B_band_edge**, reason
`band_edge`.

## Gate 6 — A_qualified (the sweet spot)

Public, active (posted within ~90 days), offer service-confirmed (or unconfirmed
but otherwise strong), followers **~2,000–48,000**, coaching/expert-adjacent
niche → **A_qualified**, reason `qualified`. Go assign an ICP flag
(`icp-flags.md`) and priority.

## Reason code taxonomy

| Code | Meaning | Typical tier |
|---|---|---|
| `qualified` | Clears every gate | A_qualified |
| `offer_unconfirmed` | Fit, but offer type not visible in text — verify before outreach | A / B (+ needs_review) |
| `band_edge` | Fit, follower count a notch small or big | B_band_edge |
| `inactive` | Fit, but dormant >90 days | B_inactive |
| `no_serviceable_offer` | Sells product/self-guided/merch only — nothing to offload | D_fail |
| `no_offer` | Not selling anything; personal/lifestyle account | D_fail |
| `off_niche` | Outside target verticals (realtor, product brand, generic creator) | D_fail |
| `mega_reach` | > ~150k followers, too big for warm 1:1 | D_fail |
| `private` | Private account, can't vet | C_private |

## Priority signals (beyond fit)

Fit says *whether* to reach out; these adjust *how soon*. From real review notes:

- **Capacity / "at their limit."** BerryNova helps people offload — so someone
  who is **near capacity** is a hotter prospect than someone with room to spare.
  A large following with **low engagement / little content traction** suggests
  they are *not* at capacity and less likely to want help → **downgrade to Low**
  (e.g. `@tiana_smith_coaching`, `@projectleaderacademy`: "almost no engagement,
  unlikely they are at their limit").
- **Already scaled.** Running an agency or clearly past the DIY stage → **Low**
  (still worth a touch — they get lots of DMs — but not a priority):
  `@sallyhogshead`.
- **Muddy / unclear / dead offer.** Bio fits but the offer is unclear, the
  link mixes ecommerce with coaching, or the site is down/ancient → **Low** and
  `needs_review` (`@barbpitcock`, `@grow.with.roshnii`, `@maryumsharif`,
  `@waldorf_essentials`, `@jenniwedmore`).
- **In-person / presential lean.** Speaking coach, retreat-led, or otherwise
  partly offline → **Low** (`@chantellespeaks`).
- **Buried-but-present offer still counts.** A coaching offer that exists but is
  hard to find keeps the fit — don't reject for it, just note it
  (`@maryghyatt`: "does coaching but it's kinda buried").

## Edge cases (where judgment beats the thresholds)

- **Offer-detector false-negative.** `bio_offer == False` but the bio has a clear
  CTA ("Download the method", "DM COACH", a checkout link) → treat as having an
  offer (State A). Pilot kept `@linzey_taylor` (5k) as A here.
- **Lenient high-edge.** A ~50k–135k account reading as a genuine personal-brand
  peer can be B_band_edge, not D_fail.
- **Low-band niche/quality.** In the ~1k–2k zone, let niche + offer + content
  quality decide between a Nurture-priority fit and an off_niche D_fail — not
  follower count alone.
- **Big + stale.** A >100k account that is also months-dormant is D_fail
  (`mega_reach`), not B_inactive.

Whenever you override a mechanical flag, say so in the Reason line so the call is
auditable.
