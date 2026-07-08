---
name: score-prospect-fit
description: Score Instagram profiles for warm-DM outreach fit — assign each a tier (A_qualified / B_band_edge / B_inactive / C_private / D_fail) and, for qualified prospects, an ICP flag (P1_coach_expert / P2_adjacent / P3_nonfit). Works on one profile pasted inline or a batch (CSV export of scraped seed-audience profiles). Does NOT scrape, DM, or write outreach copy. Trigger phrases -- "score these prospects", "assess prospect fit", "which of these are qualified", "tier this list", "how does the skill assess them".
---

# Score Prospect Fit

Score-only. This skill decides whether a scraped Instagram profile is worth a
warm 1:1 DM, and if so how strong a fit — it does not scrape profiles, send
DMs, or draft outreach copy. The job stops at: tier, ICP flag (for qualified
profiles), and the one-line reason.

The prospects are people who engaged with a "seed" account's post — the seeds
are online-business coaches (Amy Porterfield, James Wedmore, Jasmine Star,
Jenna Kutcher; the `seeds` field records which). We are looking for the seed's
*peers and adjacent service pros* — people who could become clients, partners,
or referrals — not their fans, their competitors' megabrands, or random
product accounts.

## Input

One of:

- **A single profile** pasted inline (bio text, follower count, links, etc.).
- **A batch** — a CSV of scraped profiles. Expected columns are listed in
  `field-glossary.md`; read that file before scoring a batch so you know what
  each signal means and how the boolean flags were generated.

Read the whole profile — bio, links, category, and the prospect's comment on
the seed's post — before assigning a tier. Do not score off follower count
alone. The mechanical flags (`bio_offer`, `has_commerce`, etc.) are *hints*
that can be wrong; when a flag contradicts what the bio plainly says, trust
your reading of the bio (see Guardrails).

## Step 1 — Run the tier waterfall

Apply these gates **in order**. The first one that matches wins — stop there.
Full detail, thresholds, and edge-case handling are in `tier-rubric.md`; read
it before scoring.

1. **C_private** — the account is private. Can't see content, can't vet, can't
   warm-DM effectively. Tier and stop, regardless of anything else.
2. **D_fail** — a hard disqualifier is present:
   - No real offer / CTA in the bio (not selling anything), **and** not
     plainly a coach/expert; or
   - Mega/celebrity reach (roughly **> 150k** followers) — too big for warm
     1:1 outreach; or
   - Too little traction (roughly **< 1,000** followers); or
   - Off-ICP entirely (physical-product/retail brand, generic lifestyle
     creator, unrelated local service, spam).
3. **B_inactive** — otherwise plausible (in a reasonable follower range with an
   offer) but the last post is stale (**older than ~90 days**). Good bones,
   dormant account.
4. **B_band_edge** — qualified in every way except follower count sits just
   **outside** the A sweet spot: roughly **1k–2k** (a touch small) or
   **48k–150k** (a touch big). Still worth outreach, lower priority.
5. **A_qualified** — public, active (posted within ~90 days), has a genuine
   offer in the bio, and sits in the **~2k–48k** follower sweet spot, in a
   coaching/expert-adjacent niche. Proceed to Step 2.

## Step 2 — Assign the ICP flag (A_qualified only)

Only A_qualified profiles get an ICP flag. B / C / D profiles leave it blank.
Definitions and worked examples are in `icp-flags.md`; read it before flagging.

- **P1_coach_expert** — core fit. Coach, mentor, educator, consultant, or
  expert who sells knowledge/transformation (business, mindset, marketing,
  health, spiritual, creative-skill coaching).
- **P2_adjacent** — adjacent service pro (brand photographer, designer, med-spa
  injector, stylist, etc.) with an education/coaching or founder-facing lean.
- **P3_nonfit** — sits in the follower band and looks legit, but the niche is
  off for our offer (realtor, physical-product owner, generic creator).

## Step 3 — Produce the score block

For a **single profile**, end with exactly this:

```
PROSPECT SCORE
--------------
Handle:       @<username>
Tier:         <A_qualified | B_band_edge | B_inactive | C_private | D_fail>
ICP flag:     <P1_coach_expert | P2_adjacent | P3_nonfit | — (non-A)>
Why:          <the single deciding reason, tied to the gate that fired>
Gate fired:   <private | hard-fail:<which> | inactive | band-edge:<low/high> | qualified>
```

For a **batch**, produce a table (one row per profile: Handle, Tier, ICP flag,
Why) and a short tally at the top — count per tier, and P1/P2/P3 counts among
the A_qualified. Flag any profile you scored against its mechanical flags
(e.g. "kept as A despite bio_offer=False — bio has a clear CTA") in the Why
column so the judgment call is auditable.

## Guardrails

- Score fit, don't editorialize. No outreach copy, no DM drafts, no "here's
  what to say to them."
- The boolean flags in a CSV are heuristics and carry false negatives/positives
  (an offer detector misses "Download the method"; a category field is blank
  for real businesses). When a flag contradicts the plain bio, go with the bio
  and note it in the Why column.
- The follower thresholds are soft edges, not bright lines. A 1,900-follower
  coach with a strong offer and daily posting can be A, not B; a 50k account
  that's clearly a personal-brand peer can be B, not D. Use the band as a
  prior, then adjust on niche and content quality — that is exactly where this
  skill beats a spreadsheet formula.
- Private is absolute: never tier a private account anything but C_private,
  even if the follower count and name look perfect.
- When a profile is genuinely ambiguous between two adjacent tiers, pick the
  lower one and say why in one line — don't inflate the pipeline.
