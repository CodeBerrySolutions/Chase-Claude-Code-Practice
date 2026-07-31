---
name: score-prospect-fit
description: Screen a scraped coach/expert profile for Berry Nova ICP fit by recognizing observable symptoms — returns a screen verdict (fit / partial-fit / near-fit / disqualified), a door (overloaded / acquisition-mode / lead-starved), the indicators that fired, and any missing evidence. A symptom screen, not a diagnosis — it filters who gets a closer look; a human (or the sales-AI test suite) makes the real call. Does NOT scrape, DM, or write outreach copy. Trigger phrases -- "score these prospects", "screen this list", "which of these fit the ICP", "assess prospect fit", "which door".
---

# Score Prospect Fit

**A symptom screen, not a diagnosis.** This skill is the *nurse*: it recognizes
the outward **symptoms** of Berry Nova ICP fit on a scraped profile and flags who
deserves a closer look. It does **not** reason about the underlying fundamentals
(the *why*) — that is the *doctor's* job, captured in the canonical
`Lead Qualification — ICP and Doors` doc (Google Drive). The skill tracks the
**published v2**; the v3 draft (which would accept recorded client sessions as
documented methodology) is not yet encoded.
You screen; a human decides.

Two rules from that doc that govern everything here:
- **Indicators find, fundamentals decide.** These symptoms are Layer-2 heuristics
  that *estimate* fit from the outside. They select who gets examined; they never
  substitute for the fundamentals verdict.
- **Never cross layers.** Follower count, engagement, and client counts are NOT
  criteria. Using them to make a fit decision is the documented failure mode.
  They may route *who gets looked at* — never the verdict.

Screen-only. No outreach, no DMs, no drafting.

## What Berry Nova needs (just enough to calibrate the screen)

Berry Nova is an AI operator that absorbs an expert's **between-session, text
Q&A** from **existing clients of a repeatable program**, answered from the
expert's **documented methodology**. So the symptoms worth screening for are the
outward signs of: a repeatable delivery vehicle, a documented/cloneable method,
text-answerable inbound, and being at/near capacity (not demand-starved). You
don't assert those — you spot their tells.

## Input

- **A single profile** pasted inline, or
- **A batch** — a CSV of scraped profiles (see `field-glossary.md`).
- **When available**, the offer/content read from the link-in-bio (`offer_type`
  + page text via `link-reader/`) and any content-modality signal. The richest
  symptoms live behind the link, not in the 150-char bio.

## Step 1 — Screen for symptoms

Read the whole profile (+ link content if present) and check it against the two
symptom sets in `indicators.md` — read that file; it is the checklist. In brief:

- **Fit-leaning symptoms** (raise fit): a named/trademarked method; a
  book/course/workbook/written-curriculum/podcast catalog *about the method*; a
  cohort / mentorship / paid community; capacity pressure ("fully booked",
  waitlist, raising prices, application forms); complaints about DM volume /
  repeat questions / late-night messages; a hired VA or community manager;
  text-first deliverables.
- **Non-fit-leaning symptoms** (lower fit; the starred ones are hard stops):
  lead-gen funnels / "DM me to work together" / discovery-call CTAs ★; must-watch
  demonstration content (form checks, demos, technique) ★; runs an agency /
  scaled past personally delivering ★; Socratic / presence language ("holding
  space", "I don't give answers") ★; regulated case-specific title (attorney,
  therapist, clinical) ★; big audience with no program ★; voice-note-first norms;
  "every engagement is bespoke" / pure B2B consulting (→ near-fit: check for a
  repeatable subset); content locked in a closed coaching app.

## Step 2 — Assign a door (capacity read)

From the capacity symptoms (`doors.md`):
- **overloaded** — at/past capacity ("fully booked", waitlist, throttling). The headline fit.
- **acquisition-mode** — climbing toward capacity. Fit.
- **lead-starved** — demand-constrained (lead-gen CTAs, discovery-call funnels).
  Disqualified *for now* — re-engageable, not "never".

## Step 3 — Screen verdict

Mirror the doc's verdicts, but mark them **provisional** (a screen, not a ruling):

- **disqualified** — a **hard-stop** non-fit symptom fired (must-watch content,
  Socratic/presence, regulated case-specific, agency/scaled-past-delivering,
  big-audience-no-program), **or** lead-starved. Name the symptom. (lead-starved
  → tag re-engageable.) Note: bespoke/consulting is **not** a hard stop → near-fit,
  check for a repeatable subset.
- **fit** — fit-leaning symptoms present (a delivery vehicle **and** some sign of
  documented method) and no hard stop.
- **partial-fit** — signs that only *part* of delivery is text-serviceable (e.g.
  written Q&A plus heavy video/technique). Note the serviceable share.
- **near-fit** — no hard stop, but the fit evidence isn't visible from what you
  have. **Do not guess** — list the missing evidence (Step 4). This is the
  common outcome from a bare profile, and it is the correct one.

## Step 4 — Name the missing evidence (for fit / partial / near)

The deep tells usually aren't visible in a scrape. Whenever they're unconfirmed,
list them plainly rather than assuming — this is what the closer look (link read
or human) must resolve:
- a documentation source clearing the ~10hr floor (course, manual, audio, or a
  representative session-recording archive);
- the delivery format (is there a repeatable vehicle?);
- the text-serviceable share of inbound (how much is text and answerable from the
  method vs. video / voice / live-situational).

## Step 5 — Output

Single profile:
```
PROSPECT SCREEN
Handle:        @<username>
Screen:        fit | partial-fit | near-fit | disqualified   (provisional)
Door:          overloaded | acquisition-mode | lead-starved | —
Fired:         <fit-leaning and non-fit-leaning symptoms that actually fired>
Missing:       <missing evidence, or "—" for a clean disqualified>
Closer look:   yes (what to check) | no
```

Batch: a table (Handle, Screen, Door, Fired, Missing) + tallies (count per screen
verdict, per door, and a "closer look" count). Cite the *symptom* that drove each
call — never a fundamentals essay.

## Guardrails

- **Symptoms, not the why.** Cite the indicator that fired; don't write the
  pathophysiology. The doctor's reasoning stays in the Drive doc.
- **Hard stops stop; soft symptoms tilt.** A single must-watch / Socratic /
  regulated-case-specific tell disqualifies. Soft indicators only lean.
- **Followers/engagement are never a criterion** — only a routing prior.
- **Never guess a missing fundamental.** If the fit evidence isn't visible →
  near-fit + list what's missing. Never a false disqualified.
- **lead-starved is "not yet," not "never."** Tag it re-engageable.
