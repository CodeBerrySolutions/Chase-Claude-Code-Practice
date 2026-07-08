# Tier Rubric

The waterfall in full. Gates are evaluated top to bottom; the first match wins.
Thresholds are calibrated to the `pilot_scored_profiles_v1` labels (a decoded
version of these gates reproduces ~98% of the pilot's tiers; the remaining ~2%
are edge calls the pilot made on niche/content quality — see "Edge cases").

## Gate 1 — C_private (privacy)

`private == True` → **C_private**. Stop.

Rationale: a private account can't be vetted (no visible content) and is a poor
warm-DM target. This is absolute — a private account with 40k followers and a
perfect name is still C_private, not A. In the pilot, **every** C_private row
was private and nothing else was.

## Gate 2 — D_fail (hard disqualifiers)

Any one of these → **D_fail**. Stop.

- **No offer + not an expert.** The bio isn't selling anything (no product,
  service, program, booking link, or lead magnet) *and* the person isn't
  plainly presenting as a coach/expert. Roughly two-thirds of pilot D_fails
  are here. Judge from the bio, not just the `bio_offer` flag.
- **Mega / celebrity reach.** Followers **> ~150,000**. These are the seed's
  peers-at-scale or influencers — not warm 1:1 prospects. The pilot failed
  everyone from ~155k up to 1.9M regardless of how good the bio was.
- **Too little traction.** Followers **< ~1,000**. Not enough audience to be
  worth a bespoke touch; often brand-new or dabbler accounts.
- **Off-ICP.** Physical-product / retail brand, e-commerce shop, generic
  lifestyle or travel creator, unrelated local service (bakery, day spa,
  cleaning), or non-target spam. The niche simply isn't who we sell to.

If none of the above fires, the profile is a live candidate — continue.

## Gate 3 — B_inactive (dormant)

Live candidate but `last_post` is **older than ~90 days** from today (and the
account is in a reasonable range, ~2k+ followers) → **B_inactive**.

Good fundamentals, but the account is dormant, so outreach is lower-yield and
lower-priority. If the account is *both* stale and below the ~1k floor, it's
D_fail (Gate 2 already caught it), not B_inactive.

## Gate 4 — B_band_edge (follower band edge)

Live, active, has an offer, right niche — but follower count sits just outside
the A sweet spot:

- **Low edge:** roughly **1,000–2,000** followers (a little small), or
- **High edge:** roughly **48,000–150,000** followers (a little big).

→ **B_band_edge**. Real prospects, just a notch off the ideal size, so second
priority behind A.

## Gate 5 — A_qualified (the sweet spot)

Everything true at once:

- Public, and
- Posted within ~90 days, and
- Has a genuine offer / CTA in the bio, and
- Followers in the **~2,000–48,000** sweet spot, and
- Coaching / expert-adjacent niche.

→ **A_qualified**. Then go assign an ICP flag (`icp-flags.md`).

## Edge cases (where judgment beats the thresholds)

The pilot overrode the mechanical gates in a handful of spots. Mirror that
judgment:

- **Offer detector false-negative.** `bio_offer == False` but the bio clearly
  has a CTA ("Download the method", "DM COACH", a checkout link). Treat as
  having an offer. (Pilot kept `linzey_taylor`, 5k, as A here.)
- **Lenient high-edge.** A ~50k–135k account that reads as a genuine
  personal-brand peer (not a faceless mega) can be **B_band_edge** even if the
  offer signal is weak — the pilot did this rather than dumping them to D_fail.
- **Low-band niche cull.** Two 1k–2k accounts the pilot dropped to **D_fail**
  despite an offer, because the niche/content quality was thin. In the 1k–2k
  zone, let niche fit and content quality decide between B_band_edge and
  D_fail rather than follower count alone.
- **Big + stale.** A large account (>100k) that's also months-dormant reads as
  **D_fail** (out of band and dead), not B_inactive.

When you make one of these calls, say so in the Why line so it's auditable.
