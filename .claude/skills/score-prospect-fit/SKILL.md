---
name: score-prospect-fit
description: Score Instagram profiles for warm-DM outreach fit — assign each a tier (A_qualified / B_band_edge / B_inactive / C_private / D_fail), a priority (High / Low / Nurture), a reason code, and, for qualified prospects, an ICP flag (P1_coach_expert / P2_adjacent / P3_nonfit). The central test is whether the person sells a done-with-you offer BerryNova could service. Works on one profile pasted inline or a batch (CSV export of scraped seed-audience profiles). Does NOT scrape, DM, or write outreach copy. Trigger phrases -- "score these prospects", "assess prospect fit", "which of these are qualified", "tier this list", "how does the skill assess them".
---

# Score Prospect Fit

Score-only. This skill decides whether a scraped Instagram profile is worth a
warm 1:1 DM, and if so how strong a fit and how urgently — it does not scrape
profiles, send DMs, or draft outreach copy. The job stops at: tier, priority,
reason code, ICP flag (for qualified profiles), and the one-line why.

The prospects engaged with a "seed" account's post — the seeds are
online-business coaches (Amy Porterfield, James Wedmore, Jasmine Star, Jenna
Kutcher; the `seeds` field records which). We want the seed's *peers and
adjacent service pros* who **sell a done-with-you offer BerryNova could take
work off of** — 1:1 coaching, a group program, a mastermind, a
membership-with-delivery. We do **not** want product-only sellers (merch,
supplements, self-guided courses/ebooks), their fans, competitors' megabrands,
or random product accounts.

## What the skill can and cannot see

The skill reads **text only** — bio, name, category, links present, and the
prospect's comment. It **cannot see photos or videos**, and (in this
environment) it **cannot open link-in-bio pages** to read the real offer. So
the deciding signal — *what do they actually sell?* — is often not visible in
the text. Handle that with the three-state offer gate below and the
`needs_review` flag; never fail a prospect merely because the text didn't spell
out the offer. When the scraper supplies an `offer_type` field
(`field-glossary.md`), trust it over inference.

## Input

- **A single profile** pasted inline, or
- **A batch** — a CSV of scraped profiles. Read `field-glossary.md` before
  scoring a batch (column meanings, load-bearing vs. decorative signals, and the
  `offer_type` contract).

Read the whole profile before scoring. The mechanical flags (`bio_offer`, etc.)
are noisy hints; when a flag contradicts the plain bio, trust the bio.

## Step 1 — Run the tier waterfall

Apply the gates **in order**; first match wins. Full detail and thresholds are
in `tier-rubric.md` — read it before scoring.

1. **C_private** — the account is private. Can't vet, can't warm-DM. Stop.
   → reason `private`.
2. **Offer gate (the central test).** Resolve what they sell into one of three
   states:
   - **Service-confirmed** (bio/comment/`offer_type` shows a done-with-you
     offer) → passes, continue.
   - **Product-only-confirmed** (positive evidence of merch / supplements /
     self-guided course / ebook only, *no* service — usually from
     `offer_type=product_only`, sometimes explicit in bio) → **D_fail**, reason
     `no_serviceable_offer`. Stop.
   - **Unconfirmed** (text is silent on offer type — the common case) → do NOT
     reject; continue, but carry reason `offer_unconfirmed` and set
     `needs_review`.
3. **D_fail — other hard disqualifiers:** not selling anything at all
   (`no_offer`); off-ICP niche like realtor / product brand / generic creator
   (`off_niche`); mega/celebrity reach >~150k (`mega_reach`). Stop.
4. **B_inactive** — otherwise a fit but last post is stale (>~90 days).
   → reason `inactive`.
5. **B_band_edge** — a fit, but follower count sits just outside the A sweet
   spot (~1k–2k low or ~48k–150k high). → reason `band_edge`.
6. **A_qualified** — public, active, service-confirmed (or unconfirmed but
   otherwise strong), ~2k–48k followers, coaching/expert-adjacent niche.
   → reason `qualified`. Proceed to Step 2.

Note: a genuine fit that is simply **too small** (~sub-2k, even sub-1k) is no
longer a reject — it stays a fit and is handled by **priority: Nurture** in
Step 3, not D_fail.

## Step 2 — Assign the ICP flag (A_qualified only)

Only A_qualified profiles get an ICP flag; B/C/D leave it blank. Definitions and
examples in `icp-flags.md`.

- **P1_coach_expert** — sells knowledge/transformation as the core business.
- **P2_adjacent** — adjacent service pro (photographer, designer, med-spa, etc.)
  serving founders, with a service (not knowledge) as the core offer.
- **P3_nonfit** — in-band and legit but off-niche for our offer.

A profile that *looks* P1 but is confirmed product-only is still a **D_fail**
(`no_serviceable_offer`), not a P1 — the offer gate wins over the niche read.

## Step 3 — Assign priority (independent of tier)

Priority is a separate axis from tier — it answers "how soon do we act?", not
"are they a fit?". Default mapping (adjustable):

- **High** — A_qualified, service-confirmed, active, P1/P2, sweet-spot size.
- **Low** — B_band_edge (high side), P3-in-band, or any `offer_unconfirmed` fit.
- **Nurture** — genuine fit but too small (~sub-2k) or inactive-but-good: keep
  for later, don't reject, keep out of the active outreach queue.
- **—** — C_private and D_fail carry no priority.

## Step 4 — Produce the score block

For a **single profile**, end with exactly this:

```
PROSPECT SCORE
--------------
Handle:       @<username>
Tier:         <A_qualified | B_band_edge | B_inactive | C_private | D_fail>
Priority:     <High | Low | Nurture | —>
ICP flag:     <P1_coach_expert | P2_adjacent | P3_nonfit | — (non-A)>
Reason:       <reason_code> — <one-line explanation tied to the gate that fired>
Needs review: <yes (why) | no>
```

`Needs review: yes` whenever the offer was `offer_unconfirmed`, or a
text-invisible signal (visual lean, offer behind a link) could flip the call —
these are the ones a human should eyeball before outreach.

For a **batch**, produce a table (Handle, Tier, Priority, ICP, Reason, Review?)
plus a tally at the top: count per tier, per priority, per ICP among A, and a
count of `needs_review`. Flag any profile you scored against its mechanical
flags in the Reason column so the call is auditable.

## Guardrails

- Score fit, don't editorialize. No outreach copy, no DM drafts.
- Never reject on a silent bio. Absence of a visible offer is `offer_unconfirmed`
  + `needs_review`, not `no_serviceable_offer`. Reject for product-only only on
  positive evidence (ideally `offer_type`).
- Mechanical flags are heuristics with false positives/negatives; the plain bio
  and `offer_type` win. Note overrides in the Reason line.
- Follower thresholds are soft edges, not bright lines. Use the band as a prior,
  then adjust on niche, offer, and content quality.
- Private is absolute: never anything but C_private.
- When genuinely torn between two tiers, pick the lower and say why — don't
  inflate the pipeline. When torn on the offer, prefer `offer_unconfirmed` +
  `needs_review` over a hard reject.
