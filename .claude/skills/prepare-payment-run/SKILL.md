---
name: prepare-payment-run
description: Prepares the monthly contractor payment-run checklist for S & W Island Group LLC — reads the living payment roster, checks prior Notion payment pages and recent Wise/Mercury activity, and outputs a per-payee checklist with amounts, channels, deltas from last month, and missing-invoice flags. Preparation only; never executes payments (Wise/Tropipay transfers are manual). Use when the user asks to prep, plan, or review this month's contractor payments, who to pay, or the monthly payment run.
---

# Prepare Payment Run

Produce the payment-run checklist for a given month for Phil / S & W Island Group LLC. This skill PREPARES only — it never executes, schedules, or initiates payments. All Wise and Tropipay transfers are manual actions Phil takes himself.

## Scope

- Business contractor payments only (Wise + Tropipay).
- Mercury is NOT used for contractor payments (card/SaaS spend only) — use it as evidence, not as a payment channel.
- PERSONAL — NOT BUSINESS: nannies are paid through Phil's personal Wise account. Never include them in the business payment run and never suggest invoices for them. If a nanny payment appears in business bank data, flag it as personal/misrouted.

## Process

### 1. Establish the month

Confirm which month is being prepared. Default to the current month if the user doesn't specify. Refer to the run as "<Month> payments" to match the Notion convention.

### 2. Read the roster

Read `references/payment-roster.md` in this skill directory. It is the living source of truth: active payees, dormant payees who may return, departed payees, channels, and hard rules. Treat every payment run as a chance to verify it.

### 3. Gather evidence

- Notion: find the prior monthly payment page(s) — there is one page per month (e.g. "April payments"). Pull who was paid, amounts, and any notes.
- Bank activity: check recent Wise and Mercury activity if available — via outputs of the categorize-bank-expenses skill or the Mercury MCP. Use it to confirm what actually went out last month.
- If evidence is unavailable (no Notion access, no recent bank data), say so and build the checklist from the roster alone, clearly marked as unverified.

### 4. Build the per-payee checklist

For every payee in the roster (active AND dormant — dormants get a check line, not silence), output one entry with:

- **Name**
- **Expected amount** — from roster/history. If the roster marks the amount IRREGULAR or TBD, do NOT fill in a number: flag it and ask Phil. Never assume an irregular amount.
- **Currency**
- **Channel** — Wise or Tropipay (and who relays it, where relevant).
- **Status vs roster** — active / dormant / gone. Note any mismatch with observed evidence.
- **Invoice status** — subcontractor payments need invoices behind them. Check whether an invoice exists (ingest-invoices outputs, Notion, or ask). Flag every missing invoice explicitly.

Current roster shape (verify against the roster file, which wins if they diverge):

- José Luis Correa Godefoy — ~€1,192 → ~7,000 BRL via Wise, regular monthly.
- Yuliet Espinosa Cruz — Wise EUR, IRREGULAR (€2,500–10,000 observed) — confirm amount with Phil every run. Related party; also relays Tropipay to the Cuba team.
- Javier — Tropipay via Yuliet/Juliette, amount TBD each run.
- Celia Indira Hidalgo Tagle — dormant ($825 USD Wise historically), may return.
- Danay Garces Garcia — dormant (€1,250–2,500 Wise historically), may return.
- Lurima — gone (was a Tropipay relay to the downstream team).

### 5. DELTAS section

List anything different from last month:

- Dormant payees who returned (e.g. Celia hours resumed).
- Amount changes vs prior month or roster expectation.
- New payees not on the roster.
- Structure changes (relay/invoicing flow shifts).

If nothing changed, say "No deltas vs <prior month>."

### 6. STANDING CHECKS section

Always include these two, every run:

1. **"Any Celia hours this month?"** — she is dormant but may do limited side work. Ask; do not assume either way.
2. **"Confirm downstream team invoicing."** — Since Lurima's departure, Yeleny, Aldo, and Asney are expected to invoice Yuliet directly. This is UNCONFIRMED. Verify it each run until the structure is stable, then propose retiring this check via a roster edit.

### 7. Roster maintenance and follow-ups

- If reality diverges from the roster — a dormant payee returned, an irregular amount has stabilized, the downstream invoicing structure is confirmed, a payee left — PROPOSE a concrete edit to `references/payment-roster.md` (show the diff-style change and apply it once Phil agrees). Keep the roster a living document.
- Offer to create Notion payment tasks for the run via the scaffold-project skill (one task per payee or a single "<Month> payments" checklist, per Phil's preference).

## Output format

```
# Payment run — <Month YYYY>

## Checklist
- [ ] <Name> — <amount or "IRREGULAR — confirm with Phil"> <currency> via <channel> — roster: <status> — invoice: <ok / MISSING>
...

## Deltas vs <prior month>
- ...

## Standing checks
- [ ] Any Celia hours this month?
- [ ] Confirm downstream team invoicing (Yeleny/Aldo/Asney → Yuliet directly — unconfirmed)

## Proposed roster updates
- ... (or "None")
```

## Hard rules

1. Prepare, never pay. Do not execute, schedule, or draft transfer instructions in Wise/Tropipay.
2. Irregular amounts are asked, never assumed — no placeholder numbers for Yuliet or Javier.
3. Subcontractor payments need invoices — flag every missing one; never mark a payment ready without one.
4. Nanny payments are personal, never business — exclude them, and flag any that leak into business data.
5. The roster is living — when reality diverges, propose the roster edit in the same run.
