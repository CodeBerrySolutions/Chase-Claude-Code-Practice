---
name: triage-tax-item
description: Triage a tax notice, letter, or email (photo, PDF, or pasted text — sometimes in Spanish) into what it is, which entity and jurisdiction it belongs to, the deadline and urgency, and the concrete next action. Does NOT prepare, calculate, or file taxes. Trigger phrases -- "what is this tax letter", "triage this tax notice", "which entity does this belong to", "tax deadline check".
---

# Triage Tax Item

Triage only. Never compute tax owed, fill out a form, draft a filing, or tell
the user what to write on a return. The job stops at: what it is, whose it
is, when it's due, how urgent, and what to do next.

## Input

The user provides one tax document/notice/email as pasted text, a PDF, or an
image (often a photo of a physical letter), plus optional context. Read the
whole document before classifying — don't triage off a subject line or the
first paragraph. If it's an image/PDF, read it directly (don't ask the user
to transcribe it).

## Step 1 — Identify the entity and jurisdiction

The user operates multiple entities. Known entities and their home
jurisdiction:

| Entity | Jurisdiction |
|---|---|
| Wyoming LLC | United States |
| Spanish SL | Spain |
| YEC | Indonesia |
| CBS | (jurisdiction per user context — confirm if not already established in conversation) |

Look for hard identifying markers in the document itself, not assumptions:

- **US / IRS** — "Department of the Treasury", "Internal Revenue Service",
  an EIN, a CP-series or LT-series notice number, a US ZIP code return address.
- **Spain / AEAT** — "Agencia Tributaria", "Ministerio de Hacienda", a NIF,
  a Modelo number (130, 303, 349, 100, 036/037), Spanish-language boilerplate.
- **Wyoming Secretary of State** — "Wyoming Secretary of State", registered
  agent cover mail, "Annual Report", a WY filing ID.
- **Indonesia** — NPWP, KITAS/KITAP references, Direktorat Jenderal Pajak.

If the letterhead, addressee, or account/ID numbers don't clearly tie the
document to exactly one entity in the table above — **stop and ask the user
which entity this belongs to.** Do not guess based on topic, language, or
plausibility. A wrong entity guess sends the user down the wrong sub-recipe
and can cause a missed deadline.

## Step 2 — Route to the matching sub-recipe

Read the matched file below in full before producing output — each contains
the notice/document types, deadline patterns, urgency rules, and standard
next actions for that entity.

- **US-IRS-notice** → `us-irs-notice.md` — IRS notices/letters for the
  Wyoming LLC (or any other US-filing entity).
- **Spain-autonomo** → `spain-autonomo.md` — AEAT notices and modelo filings
  for the Spanish SL / autónomo activity.
- **Wyoming-LLC** → `wyoming-llc.md` — Secretary of State / registered-agent
  mail (annual report, service of process, admin dissolution notices).
- **cross-border-residency** → `cross-border-residency.md` — anything about
  tax residency, day-counts, double-tax treaties, or that spans more than one
  entity/jurisdiction at once (e.g., Indonesia stay affecting US or Spain
  filing status). Also use this when Step 1 couldn't confirm a single entity
  and the user has confirmed it's a residency/cross-border matter rather than
  a single-entity notice.

If nothing matches any sub-recipe and it isn't a residency question either,
say so explicitly and ask the user what kind of item this is rather than
forcing it into one of the four buckets.

## Step 3 — Produce the triage block

Always end with exactly this structure, filled in:

```
TRIAGE
------
Item type:        <what the document actually is, in plain language>
Entity + Country:  <entity name — jurisdiction>
Deadline:          <exact date if stated, or how it's calculated; "none stated" if none>
Urgency:           🔴 Critical / 🟡 Moderate / 🟢 Low — <one-line reason>
Next action:       <the single concrete next step, not a list of options>
Documents needed:  <what the user needs to gather/provide to take that action>
Sub-recipe used:   <us-irs-notice | spain-autonomo | wyoming-llc | cross-border-residency>
```

If Step 1 or Step 2 ended in a question instead of a match, ask the question
instead of emitting this block — don't fill it in with guesses.

## Guardrails

- Never estimate amounts owed, never draft response letters/forms, never
  tell the user what numbers to enter anywhere.
- Translating a Spanish notice's key facts (deadline, notice type) into
  English is fine and expected; drafting a Spanish-language reply is not.
- If a document sets a very short response window (e.g., Spain's DEHú
  electronic-notification rule, or a US "Final Notice of Intent to Levy"),
  flag that explicitly in Urgency even if the raw calendar date looks distant.
- When in doubt between two sub-recipes, ask rather than pick one.
