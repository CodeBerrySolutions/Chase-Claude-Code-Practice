---
name: score-prospect-fit
description: Scores a coach/expert prospect against Berry Nova's ICP and classifies which door they enter through (acquisition-mode or overloaded). Use when the user provides one or more coach/expert profiles, bios, social handles, or scraped prospect rows and asks whether they fit the ICP, to score/qualify a lead, to vet or filter prospects, or which door a coach enters through.
---

# Score Prospect Fit

Score each coach/expert prospect against Berry Nova's ICP and assign a door.

Context: Berry Nova sells an AI operator platform for coaches — "operational depth plus a brain that learns." It makes a coach's EXISTING delivery time efficient. It does NOT generate leads. Keep this framing in mind for every judgment below.

## Procedure

Apply the ICP in this exact order. Check hard disqualifiers before weighing any positive signal.

### Step 1 — Hard disqualifiers (check first, in order)

1. **Lead-starved.** If the prospect's main problem is GETTING clients (asking for lead gen, complaining about empty pipeline, "how do I find clients"), DISQUALIFY. The product will not create new leads for them.
2. **Undocumented methodology.** The prospect's distinctive methodology must be documented in written docs or audio tracks. Audio may have accompanying video, but everything important must be understandable from audio alone. If no such documentation exists, DISQUALIFY — the methodology cannot be cloned.

If either fires, stop evaluating that prospect: verdict is `disqualified`, door is `n/a`, and name the disqualifier.

### Step 2 — Positive profile

Only if no disqualifier fired, assess these signals:

- Coach or expert with a DISTINCTIVE methodology, delivering 1-on-1 or group sessions.
- At or very near their client-capacity ceiling.
- Likely tried or considered hiring a virtual assistant.
- Active social media promoting their services, with at least a modest following.

Do not inflate. A coach with a huge audience but no documented methodology is still disqualified. Volume of following is a signal, not a criterion — it never substitutes for the criteria above.

### Step 3 — Classify the door

The door drives downstream outreach messaging:

- `acquisition-mode` — still scaling toward their capacity ceiling.
- `overloaded` — drowning in clients; at or over their ceiling.
- `n/a` — disqualified prospects only.

### Step 4 — Verdict

- `fit` — no disqualifier fired and positive-profile evidence is affirmatively present.
- `near-fit` — no disqualifier fired, but evidence for one or more criteria is missing or ambiguous. NEVER guess or assume missing facts; list exactly what evidence is missing.
- `disqualified` — a hard disqualifier fired.

## Input handling

- Accept a single profile or a batch (e.g. rows from a scrape export, a pasted list of bios/handles).
- Evaluate each prospect independently and output one block per prospect, in input order.
- Use whatever identifier is available (name, handle, row label) as the prospect name.

## Output format

Emit exactly this block per prospect:

```
PROSPECT: <name/handle>
VERDICT: fit | near-fit | disqualified
DOOR: acquisition-mode | overloaded | n/a
REASON: <one line>
DISQUALIFIER FIRED: <which, or none>
MISSING EVIDENCE: <list, only if near-fit>
```

Rules:

- `REASON` is one line — the decisive facts, not a rehash of the whole profile.
- `DISQUALIFIER FIRED` names the specific disqualifier (`lead-starved` or `undocumented methodology`) or says `none`.
- Include the `MISSING EVIDENCE` line only when verdict is `near-fit`; omit it otherwise.

## Examples

### Example 1 — clear fit (overloaded)

Input: "Marta K., strength coach for postpartum athletes. Runs her trademarked 'Rebuild Protocol' — full written manual plus a recorded audio course. 38 active 1-on-1 clients, waitlist of 12, posted last week that she's 'turning people away'. 22k Instagram followers, hired a VA last year. "

```
PROSPECT: Marta K.
VERDICT: fit
DOOR: overloaded
REASON: Distinctive documented methodology (written manual + audio course), 1-on-1 delivery, over capacity with a waitlist, VA history, active social presence.
DISQUALIFIER FIRED: none
```

### Example 2 — disqualified (lead-starved)

Input: "Dev R., business coach, well-produced framework PDF, but posts say 'struggling to fill my calendar, DM me for a free session' and he's asking about lead-gen tools."

```
PROSPECT: Dev R.
VERDICT: disqualified
DOOR: n/a
REASON: Primary problem is getting clients; Berry Nova makes delivery efficient but does not generate leads.
DISQUALIFIER FIRED: lead-starved
```

### Example 3 — near-fit (methodology documentation unknown)

Input: "@mindsetwithlena — executive coach, 40k followers, mentions her 'Clarity Ladder' method in posts, says she's 'fully booked through September'. No visible course, manual, or audio content."

```
PROSPECT: @mindsetwithlena
VERDICT: near-fit
DOOR: overloaded
REASON: Distinctive-sounding method and at capacity, but no evidence the methodology is documented in written or audio form.
DISQUALIFIER FIRED: none
MISSING EVIDENCE: written docs or audio tracks documenting the Clarity Ladder method; delivery format (1-on-1 vs group); VA hiring history
```
