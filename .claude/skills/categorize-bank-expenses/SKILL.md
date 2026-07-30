---
name: categorize-bank-expenses
description: Categorizes a month (or date range) of S & W Island Group LLC bank activity from Mercury (via MCP) and Wise (via CSV export) into a coded, review-ready expense batch with suggested Xero accounts, plus a reconciliation against ingested invoice files and a missing-invoice worklist. Use when the user asks to sort/categorize/code bank transactions or expenses from Mercury or Wise, to prepare a month's expenses for Xero, or to reconcile bank payments against invoices. Runs as a monthly routine or on demand. Read-only toward Xero — outputs a review CSV for human entry, never writes to Xero.
---

# Categorize Bank Expenses

Produce a fully coded, review-ready expense batch plus reconciliation for
S & W Island Group LLC for a given month or date range. Sources: Mercury
(MCP, read-only), Wise (user-supplied CSV), and optionally a folder of
ingested invoice files. Output: one review CSV + a short summary. A human
imports/enters results into Xero — this skill NEVER writes to Xero.

Read `references/payee-rules.md` before classifying anything. It holds the
entity context, known payees, related parties, and Xero account defaults.

## Step 0 — Scope the period

1. Confirm the period with the user (default: the most recent full calendar
   month). Call Mercury `getCurrentDate` BEFORE resolving any relative dates
   ("last month", "June") — never guess today's date.
2. Ask where the Wise CSV export is (or confirm its path) and whether an
   invoice folder exists for reconciliation.

## Step 1 — Pull Mercury transactions (off-context)

CRITICAL: Mercury results routinely overflow the context window and get
saved to a tool-results file. NEVER read that JSON file into context — this
has crashed sessions before. Process it with a Python script instead.

1. Call `listTransactions` with `limit` ≤ 300 and `status: ["sent"]`,
   scoped to the period.
2. When the response is saved to a tool-results file, note the file path
   only. Do not open it. Do not paste transaction dumps into chat — ever.
3. Follow pagination: read `page.nextPage` from each response (via script
   if the response is on disk) and pass it as `start_at` on the next call.
   Repeat until `nextPage` is null.
4. Write a Python script in the scratchpad that:
   - loads every saved page file,
   - dedupes by transaction `id` across pages,
   - counts transactions per page and in total,
   - emits a normalized CSV/JSON for downstream steps.
5. Verify completeness BEFORE aggregating: pages fetched, per-page counts,
   total unique transactions, and that the final page's `nextPage` was null.
   If pagination was cut short for any reason, say so explicitly — never
   present partial data as complete.

## Step 2 — Load the Wise CSV (off-context)

Wise has no MCP. Parse the user's CSV export with a script (same
off-context rule — do not paste rows into chat). Expected columns:

`ID, Status, Direction, "Created on", "Finished on", fee fields,
"Source name", "Source amount (after fees)", "Source currency",
"Target name", "Target amount (after fees)", "Target currency",
"Exchange rate", Reference, Batch, "Created by", Category, Note`

- For `OUT` rows: counterparty = **Target name**.
- For `IN` rows: counterparty = **Source name**.
- Filter to the period using "Created on" / "Finished on"; keep the
  currency of each leg — never convert or merge currencies.

## Step 3 — Classify every transaction

Apply `references/payee-rules.md` to each transaction. Every row gets
exactly one classification:

- **expense** — with a suggested Xero account from the payee rules
- **income** — incoming client payments → Service Revenue
- **internal transfer** — Mercury Credit repayments, S & W self-transfers
- **owner equity** — Phil's own top-ups (capital contribution, never expense)
- **related-party** — CBS TECH VENTURES S.L. and similar; ALWAYS flag
- **fee** — bank/FX/intl transaction fees → Bank Fees
- **unknown** — anything unrecognized → mark **NEEDS-REVIEW**

Judgment calls always surface, never get silently coded. Route to
NEEDS-REVIEW whenever you see:
- a new/unknown payee (suggest the closest account, but flag it),
- any related-party movement,
- an unusually large amount for that payee or category.

Assume almost nothing has been coded before (see payee rules context) —
do not skip transactions because they "look old" or "probably booked".

## Step 4 — Reconcile against invoices

If an invoice folder is available (files named `YYYYMMDD - Provider -
Amount`), match each outgoing payment to an invoice file by:

- **provider**: fuzzy match counterparty vs. file's Provider segment
- **amount**: exact, or ±2% tolerance for FX-affected payments
- **date**: payment date within ±14 days of the invoice file date

Then build the **MISSING-INVOICE WORKLIST**: outgoing payments that should
have an invoice but matched none. "Should have an invoice" means
contractors, agencies, and consultants — NOT SaaS micro-charges under $50,
unless the user says otherwise.

## Step 5 — Output

Write one coded review CSV with columns:

`date, source, counterparty, amount, currency, classification,
suggested Xero account, invoice-matched?, notes`

(`source` = Mercury or Wise; `notes` carries flags like NEEDS-REVIEW,
related-party, missing-invoice.)

Then give a short summary in chat:
- totals per Xero account **per currency** — NEVER sum across currencies
- deltas vs. prior month, if a prior run's output exists on disk
- count of NEEDS-REVIEW items
- the missing-invoice worklist (or "none")
- completeness statement: transactions fetched vs. processed, per source

## Hard rules

- NEVER write to Xero. The Xero connector is read-only by design. The CSV
  is for human review, then manual entry / bank reconciliation in Xero (or
  a future n8n path). Never claim anything was written to Xero.
- NEVER read Mercury tool-result JSON files or paste transaction dumps
  into context — scripts only.
- NEVER sum amounts across currencies.
- Always state fetched vs. processed counts; disclose any truncation.
- Every uncertain call lands in NEEDS-REVIEW.
