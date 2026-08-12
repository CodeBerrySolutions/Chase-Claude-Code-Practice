---
name: score-prospect-fit
description: Screen a scraped coach/expert/consultant profile for Berry Nova ICP fit by recognizing observable symptoms — returns a screen verdict (fit / partial-fit / near-fit / not-yet / disqualified), the indicators that fired, and any missing evidence. A symptom screen, not a diagnosis — it filters who gets a closer look; a human makes the real call. Does NOT scrape, DM, or write outreach copy. Trigger phrases -- "score these prospects", "screen this list", "which of these fit the ICP", "assess prospect fit".
---

# Score Prospect Fit

**A symptom screen, not a diagnosis.** This skill is the *nurse*: it recognizes
the outward **symptoms** of Berry Nova ICP fit on a scraped profile and flags who
deserves a closer look. It does **not** reason about the underlying fundamentals
(the *why*) — that is the *doctor's* job, captured in the canonical **Berry Nova
ICP** doc (Google Drive). You screen; a human decides.

Governing rules from that doc: **indicators find, fundamentals decide** (these
symptoms only estimate fit and select who gets examined), and **never cross
layers** — follower count / engagement are not criteria, only routing priors.

Screen-only. No outreach, no DMs, no drafting.

## What Berry Nova sells (just enough to calibrate the screen)

Berry Nova sells coaches/experts/consultants **their time back**: people with
**their own method, delivered to real clients over and over, and drowning in the
delivery**, whose knowledge **already lives in words** (written or recorded) so
an AI can absorb it and hand back the hours they burn re-answering the same
questions. **We do not sell leads.** So screen for the tells of: a repeatable
practice on their own method, knowledge that survives as text, real
hours-to-offload, and a method that's captured (or close).

## The four fundamentals (the *why* — for your calibration, not the output)

1. **A repeatable practice on their own method** — personally delivers ongoing
   expertise in a repeating format (1:1 with patterns, group, cohort, community)
   with a method compatible with an **answering** AI. Fails at two edges:
   nothing repeats (fully custom consulting), or the method's real job is
   something an answering AI can't do (works by *asking* questions / Socratic; a
   regulated adviser whose clients need licensed answers). **Title alone doesn't
   settle it** — a therapist running a non-clinical course can fit.
2. **Knowledge that lives in words** — could a smart stranger learn it with eyes
   closed? **Talking-head video counts** (value is in what's *said*). Must-watch
   instruction (form checks, hands-on technique) does not. Knowledge fields fit,
   technique fields don't; a mix is **partial-fit**.
3. **Real hours to hand off** — weekly hours answering existing clients from the
   method, no live context, in text. If the real problem is *getting* clients →
   **not-yet**, not no. Count hours, not clients.
4. **A method that is captured, or close** — exists in written docs, audio,
   courses, or representative recorded sessions (~10hr screen; exportable).

## Step 1 — Screen for symptoms

Read the whole profile (+ link content if present) against the two indicator sets
in `indicators.md` (that file is the checklist). In brief:

- **Lean fit:** a **bio promoting a real program with a link** to a site /
  application / community (the fastest positive screen); a cohort / mentorship /
  paid community; teachable material on their own method (named framework, book,
  course, or a *teaching* podcast); text-first deliverables; overload signs
  (waitlist, rising prices, booked calendar, VA hired to absorb messages).
- **Lean disqualify:** no online presence; **private account** (can't see
  content); promoting a business **clearly outside our ICP** (realtor, designer
  selling design, retail/product brand, performed craft sold to end clients); a
  **highly bespoke/customized** approach. Plus the structural hard stops (★):
  works-by-asking / Socratic; regulated case-specific; **must-watch technique**
  (form checks, hands-on) — but **not** talking-head video.

## Step 2 — Screen verdict

- **disqualified** — REQUIRES a positive signal: a structural hard stop fired
  (Socratic/asking, regulated case-specific, must-watch technique), **or** a
  clearly off-ICP business / fully-bespoke approach is what's visible. Name it.
  **A silent or thin offer is never disqualified** — a coach-shaped bio with no
  visible program is **near-fit** (unverified, not absent), not a cut.
- **not-yet** — coach-shaped and could fit, but the visible problem is *getting
  clients*, not serving them (lead-gen funnels, discovery-call CTAs everywhere).
  Re-engageable; tag it.
- **fit** — lean-fit symptoms present (a program/delivery vehicle **and** a sign
  of teachable method) and no hard stop.
- **partial-fit** — knowledge + technique mixed, or only part of delivery is
  text-serviceable. State the serviceable share.
- **near-fit** — no hard stop, but the fit evidence isn't visible from what you
  have. **Do not guess** — list the missing evidence (Step 3). Common and correct
  from a bare bio; the link-dive resolves it.

## Step 3 — Name the missing evidence (fit / partial / near)

Whenever the deep tells aren't visible, list them instead of assuming — this is
what the closer look (Firecrawl link read or human) must resolve:
- a captured method clearing the ~10hr screen (docs / audio / course / session
  archive);
- a repeatable delivery vehicle;
- the text-serviceable share (how much inbound is text, from the method, no live
  context — vs. must-watch technique or getting-clients).

## Step 4 — Output

Single profile:
```
PROSPECT SCREEN
Handle:      @<username>
Screen:      fit | partial-fit | near-fit | not-yet | disqualified   (provisional)
Fired:       <lean-fit and lean-disqualify indicators that actually fired>
Missing:     <missing evidence, or "—" for a clean disqualified>
Closer look: yes (what to check) | no
```

Batch: a table (Handle, Screen, Fired, Missing) + tallies (count per verdict and a
"closer look" count). Cite the **symptom** that drove each call — never a
fundamentals essay.

## Guardrails

- **Symptoms, not the why.** Cite the indicator that fired.
- **Hard stops stop; lean indicators tilt.** Socratic / regulated-case-specific /
  must-watch-technique disqualify. Private / no-program / off-ICP / bespoke lean
  disqualify but read the whole profile first.
- **Talking-head video is fit, not a stop.** Only must-*watch* technique fails F2.
- **Followers/engagement are never a criterion** — routing prior only.
- **Never guess a missing fundamental** → near-fit + list what's missing. Never a
  false disqualified. "Getting clients" is **not-yet**, not no.
