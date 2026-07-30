---
name: triage-tax-item
description: Triages a tax notice, letter, document, or tax-related email for Phil's multi-jurisdiction setup (US/Wyoming LLC, Spain/CBS Ventures SL and personal AEAT matters, Indonesia/KITAS, YEC quarterly cycles) — identifies what it is, which entity it belongs to, the deadline, urgency, and the next action. Use when the user pastes or uploads a tax notice, IRS letter (CP/LTR), AEAT notificación, modelo form, 1099, Wyoming annual-report or registered-agent mail, or any tax-related email (English or Spanish) and asks what it is, which entity it belongs to, whether it matters, or what to do about it. Triage only — never computes, prepares, or files taxes.
---

# Triage Tax Item

Triage one or more tax notices, documents, or emails. Identify the item, attribute it to an entity, extract the deadline, and route to a next action. Do NOT compute, prepare, or file anything.

## Ground rules

1. Accept pasted text, PDFs, or photos. Read images/PDFs directly.
2. Spanish input is common: work bilingually. Translate key terms inline (e.g. "requerimiento" = formal demand for information; "plazo" = deadline; "recargo" = surcharge). Quote the original Spanish phrase for anything deadline- or penalty-related.
3. Pick exactly one sub-recipe below and state which one fired.
4. If the document does not clearly map to one entity, ASK Phil — never guess entity attribution. Common ambiguity: IRS mail could be Wyoming LLC vs. Phil personal; AEAT mail could be CBS Ventures SL vs. Phil personal vs. Juliette (IRPF via TaxDown).
5. Extract the stated deadline. If none is stated but the notice type has a well-known statutory response window (e.g. IRS CP2000: 30 days; AEAT requerimiento: 10 hábiles/business days), infer it and label it "(inferred)".
6. Scope guard: if asked to actually compute, prepare, or file taxes, decline that part explicitly — this skill only triages and routes to the right entity, deadline, and next step.

## Entity map

- **Wyoming LLC** (US) — registered agent: Northwest Registered Agent; annual reports; IRS business notices; 1099s issued/received.
- **Phil personal — US** — IRS personal notices; MFJ/MFS filing-status questions.
- **CBS Ventures SL** (Spain) — being wound down; modelo 200 (corporate tax), modelo 390 (annual VAT summary); AEAT notificaciones.
- **Phil personal — Spain** — AEAT; former autónomo (deregistered — baja); residual notices possible.
- **Juliette (wife)** — Spanish IRPF, handled via TaxDown; route, don't process.
- **Indonesia** — KITAS/residency-linked tax matters; currently paused/low activity.
- **YEC** — operating entity with quarterly tax cycles (e.g. "YEC T4 taxes", "YEC 2025 Q3 Tax").

## Sub-recipes

### 1. US-IRS-notice

**Cues:** IRS letterhead; notice codes CP#### or LTR#### in the top/bottom corner; "Department of the Treasury"; 1099-NEC/1099-K/1099-MISC forms or mismatch letters; proposed-adjustment or balance-due language; EIN vs. SSN on the notice.

**Do:**
- Extract the notice code and look up its meaning (CP2000 = income mismatch, CP14 = balance due, LTR 226-J, etc.).
- Check whether it's addressed to the Wyoming LLC (EIN) or Phil personally (SSN) — this decides the entity line. If unclear, ask.
- For 1099 matters: identify payer, amount, tax year, and whether it conflicts with what was reported.
- Note MFJ/MFS relevance if the notice touches Phil's personal filing status.
- Typical next actions: respond via the address/fax on the notice, check the IRS online account transcript, or flag for the US accountant. Never draft the tax computation itself.

### 2. Spain-AEAT

**Cues:** "Agencia Tributaria" / AEAT letterhead; "notificación", "requerimiento", "propuesta de liquidación", "providencia de apremio"; modelo numbers (200, 390, 303, 036/037); CSV (Código Seguro de Verificación); NIF of CBS Ventures SL vs. Phil's NIE.

**Do:**
- Work in Spanish, report in English. Translate the notice type and every deadline phrase; quote the original.
- Attribute: modelo 200/390 or SL NIF → CBS Ventures SL (remember it is being wound down — check whether the notice affects the winding-down); Phil's NIE → Phil personal (note his autónomo baja history — notices for periods after deregistration may be contestable); IRPF for Juliette → route to TaxDown, do not process.
- AEAT deadlines are usually "10 días hábiles" or "1 mes" from notification date — business days, Spanish calendar. Flag if the notification date (fecha de notificación) differs from the letter date.
- Check whether it arrived via Dirección Electrónica Habilitada (electronic notification) — the clock may have started at electronic acceptance.
- Typical next actions: forward to the gestor, respond via Sede Electrónica with certificado digital, or file an alegación before the plazo expires.

### 3. Wyoming-LLC

**Cues:** Mail scanned/forwarded by Northwest Registered Agent; "Wyoming Secretary of State"; annual report notices; state filing fees; service-of-process scans.

**Do:**
- Distinguish real state mail from registered-agent upsell/solicitation mail (common) — mark solicitations low urgency.
- Annual report: due on the first day of the anniversary month of formation; fee is min $60 (license tax). If the notice states the due date, use it; otherwise infer from formation month and label "(inferred)".
- If Northwest forwarded IRS mail, hand off to the US-IRS-notice sub-recipe but keep ENTITY = Wyoming LLC.
- Typical next actions: file the annual report on the WY SOS site, confirm Northwest's registered-agent fee is paid, or update the registered address.

### 4. cross-border-residency

**Cues:** Tax-residency certificates; treaty claims (US–Spain, Spain–Indonesia); W-8BEN/W-9 requests; KITAS or Indonesian NPWP/DGT correspondence; 183-day questions; anything where two jurisdictions both appear.

**Do:**
- Name both jurisdictions and which one is asserting the claim.
- Indonesia is currently paused/low activity: for KITAS-linked tax mail, confirm whether it relates to an active obligation or a stale registration before escalating.
- YEC quarterly items (e.g. "YEC 2025 Q3 Tax", "YEC T4 taxes") land here when the jurisdiction is unclear from the document — identify the quarter and cycle, then ask which jurisdiction's filing it refers to if ambiguous.
- Never assert a residency conclusion — surface the question and route to the cross-border advisor.
- Typical next actions: obtain a certificado de residencia fiscal, complete a W-8BEN, or list the treaty article in question for the advisor.

## Output format

Emit this exact block for EVERY item triaged (one block per item):

```
ITEM: <what it is>
ENTITY: <entity> · <country>
SUB-RECIPE: <which fired>
DEADLINE: <date or "none found"> · URGENCY: <high/medium/low + why>
NEXT ACTION: <one concrete step>
DOCUMENTS NEEDED: <list>
NOTES: <anything ambiguous, translation notes, or questions for Phil>
```

## Examples

**Example 1 — IRS notice (English).** Input: photo of "Notice CP2000, tax year 2024" addressed to Phil's SSN, proposing $3,120 additional tax from an unreported 1099-K; response due August 14, 2026.

```
ITEM: IRS CP2000 — proposed underreporter adjustment, TY2024, unreported 1099-K income ($3,120 proposed tax)
ENTITY: Phil personal · US
SUB-RECIPE: US-IRS-notice
DEADLINE: 2026-08-14 (stated on notice) · URGENCY: high — missing it converts the proposal to an assessment
NEXT ACTION: Pull the 2024 return and the 1099-K to check if the income was reported under the Wyoming LLC instead, then agree/disagree via the CP2000 response form
DOCUMENTS NEEDED: 2024 Form 1040, 1099-K from the payer, Wyoming LLC 2024 books for that payer
NOTES: If the 1099-K payer paid the LLC, this may be a payer-TIN error, not missing income. Confirm with Phil which entity invoiced this payer.
```

**Example 2 — AEAT notificación (Spanish).** Input: PDF "Requerimiento de información — Modelo 390 ejercicio 2025" addressed to CBS Ventures SL's NIF; "plazo de 10 días hábiles" from notification; fecha de notificación 2026-07-02.

```
ITEM: AEAT requerimiento (formal information demand) on modelo 390 (annual VAT summary), FY2025
ENTITY: CBS Ventures SL · Spain
SUB-RECIPE: Spain-AEAT
DEADLINE: ~2026-07-16 (inferred: "10 días hábiles" = 10 Spanish business days from notification on 2026-07-02) · URGENCY: high — short statutory window; non-response risks sanción
NEXT ACTION: Forward to the gestor today and confirm they will respond via Sede Electrónica before the plazo
DOCUMENTS NEEDED: 2025 modelo 303 quarterly filings, modelo 390 as submitted, SL's certificado digital access
NOTES: "Requerimiento" = formal demand, stronger than a simple notificación. SL is being wound down — ask Phil whether the 390 was filed as part of the winding-down and by whom.
```
