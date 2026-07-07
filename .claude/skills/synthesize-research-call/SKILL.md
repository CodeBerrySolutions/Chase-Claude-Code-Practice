---
name: synthesize-research-call
description: Synthesizes raw notes or transcripts from Berry Nova prospect/research calls (Fireflies, Granola, or pasted text) into structured signal — demand signal, roadmap pulls, case-study raw material, and an ICP fit re-check with a next move. Use when the user provides notes or a transcript from a prospect/research call and asks what it told us, to synthesize or debrief the call, to pull signal from it, or to check whether the prospect is still a fit. Not for general meeting notes — prospect/research calls only.
---

# Synthesize Research Call

Turn raw research-call notes or a transcript into structured signal for Berry Nova (pre-launch AI operator platform for coaches, selling founding-client spots via research calls).

## Scope gate

First, confirm the input is actually a prospect/research call (a conversation with a coach who is a potential founding client). If it is clearly something else — a team standup, an investor call, a vendor demo, generic meeting notes — say so in one line and stop. Do not produce the four sections for non-prospect calls.

## Evidence discipline

- Every claim in sections 1 and 2 must trace to something actually in the notes. Quote or closely paraphrase the source line.
- Allow at most one interpretive step from what was said to what it means. Do not chain inferences or pad with speculation.
- If the notes are too thin to fill a section, write "insufficient signal" for that section rather than inventing content.

## Output — exactly four sections

### 1. DEMAND SIGNAL

What the prospect pulled for, and what to finalize or prioritize in the build because of this call. Keep what they SAID separate from what it MEANS — use paired bullets (or two labeled columns):

- **Said:** quote or close paraphrase from the notes.
- **Means for build:** the interpretation, one step removed at most.

### 2. ROADMAP PULLS

List specific product implications. Tag each one as exactly one of:

- `confirms-existing-plan`
- `new`
- `contradicts-existing-plan`

If nothing in the notes touches the product, write "insufficient signal".

### 3. CASE-STUDY RAW MATERIAL

Collect verbatim-ish quotes, pains, numbers, and outcomes reusable later as proof (landing page, case studies, sales calls). Prefer exact wording. Include concrete figures (revenue, client counts, hours, prices) whenever stated.

Mark anything flagged as sensitive or off-record in the notes with **[OFF-RECORD — do not publish]** and do not soften that marker.

### 4. FIT RE-CHECK

Re-apply the ICP gates against what was actually said on the call — not what the intake form claimed:

a. **Capacity gate:** Is the prospect truly at a capacity ceiling (full roster, waitlist, turning people away), or actually lead-starved? Berry Nova's product does not generate leads. A statement like "I mainly need more clients" is disqualifying — flag it prominently with the quote.
b. **Methodology gate:** Is their coaching methodology documented in written or audio form (frameworks, curriculum, recorded sessions, worksheets)? "It's all in my head" is a disqualifier or at minimum a downgrade.

End the section with a verdict line:

**Verdict:** `still-fit` / `downgraded-to-near-fit` / `disqualified` — with the quote that triggered any downgrade or disqualification.

If a disqualifier surfaced, make it impossible to miss: lead the section with **FLAG:** and the triggering quote.

## NEXT MOVE

Always end the output with a single line:

**NEXT MOVE:** one concrete action — e.g. "send founding-offer follow-up", "park — disqualified", "second call needed on methodology documentation".

## Worked example (condensed)

Input notes (fictional):

> Call w/ Dana R., executive coach. 14 1:1 clients, says she's "turning away 2-3 inquiries a month, I just can't take them." Spends ~6 hrs/wk on session prep + follow-up emails. Has a 40-page frameworks doc + recorded session library. Asked twice whether the platform could "draft the post-session recap in my voice." Said pricing "under $300/mo is a no-brainer." Mentioned her divorce affecting Q1 revenue — asked to keep that off record.

Output (abbreviated):

**1. DEMAND SIGNAL**
- **Said:** Asked twice whether it could "draft the post-session recap in my voice." **Means for build:** post-session recap generation with voice matching is a top pull — prioritize finalizing it.
- **Said:** ~6 hrs/wk on session prep + follow-up emails. **Means for build:** prep + follow-up automation is where the time savings story lands for this segment.

**2. ROADMAP PULLS**
- Post-session recap drafting in coach's voice — `confirms-existing-plan`
- Session-prep automation as a headline workflow — `new`
- Pricing tolerance signal at <$300/mo — `confirms-existing-plan`

**3. CASE-STUDY RAW MATERIAL**
- "Turning away 2-3 inquiries a month, I just can't take them."
- 14 active 1:1 clients; ~6 hrs/wk on prep and follow-up.
- "Under $300/mo is a no-brainer."
- Q1 revenue dip due to divorce — **[OFF-RECORD — do not publish]**

**4. FIT RE-CHECK**
a. Capacity: at ceiling — turning away 2-3 inquiries/month. Passes.
b. Methodology: 40-page frameworks doc + recorded session library. Passes.

**Verdict:** `still-fit`

**NEXT MOVE:** send founding-offer follow-up.
