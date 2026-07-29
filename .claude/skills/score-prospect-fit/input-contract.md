# Input Contract — what the scraper must provide

This skill is **text-only and does not fetch links or images** (see "What the
skill cannot see" in `field-glossary.md`). The single most decisive fit signal —
*what does this person actually sell?* — lives behind the link-in-bio, which the
skill can't reach. So it must be resolved **upstream, by the scraper** that
builds the CSV, and passed in as a column.

This file specs that handoff. It is **not** built in this repo — it's the
requirement the scraper (a separate tool) must satisfy so v2 scoring works.

## Required new column: `offer_type`

The scraper should visit each profile's link-in-bio (Linktree/Stan/website/etc.)
and classify what the person sells into one value:

| Value | Definition | How the skill uses it |
|---|---|---|
| `service` | Sells a done-with-you offer: 1:1 coaching, group program, mastermind, membership-with-delivery, done-for-you service. | Passes the offer gate. |
| `mixed` | Sells a service **and** products/courses. | Passes the offer gate. |
| `product_only` | Sells only merch, supplements, physical product, self-guided course, or ebook — **no** service component. | **D_fail `no_serviceable_offer`.** |
| `unknown` | Link dead, blocked, or offer indeterminate. | `offer_unconfirmed` + `needs_review` — not a rejection. |

When `offer_type` is absent entirely, the skill falls back to bio inference and
defaults to `offer_unconfirmed` where the text is silent.

## Recommended (optional) column: `visual_lean`

A short free-text note from the profile's actual photos/videos — e.g.
"mostly hands-on fitness training", "whiteboard teaching clips", "product flatlays".
Lets the skill catch the `@annette_milbers` failure mode (bio says coach, feed
says hands-on trainer) without seeing the images itself. Absent → skill relies on
text + `offer_type` and leans on `needs_review`.

## Implementation notes for the scraper

- Link hubs (Linktree, Stan, Beacons) and many creator sites return 403 to bots.
  Budget for headless-browser rendering or an API, and record `unknown` cleanly
  when a link can't be read — never guess `product_only` from a failed fetch.
- Classifying `service` vs `product_only` is itself an LLM-on-page-text task;
  the prompt in `SKILL.md`'s offer gate (State A/B/C) is the same rubric to apply
  at the page level.
- Keep the existing columns (`field-glossary.md`) unchanged; `offer_type` and
  `visual_lean` are additive, so v1 CSVs still score (just with more
  `offer_unconfirmed`).
