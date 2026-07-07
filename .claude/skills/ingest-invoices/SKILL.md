---
name: ingest-invoices
description: Processes supplier invoices and receipts for S & W Island Group LLC — extracts key fields (bilingual English/Spanish), renames files to "YYYYMMDD - Provider Name - Amount", checks suppliers against known Xero contacts, and outputs three review CSVs (extraction table, new-contacts delta in Xero contacts-import format, draft bills in Xero bills-import format) for human import. Use when the user provides invoice or receipt files (PDF, image, or forwarded email), asks to ingest/process/rename invoices, or to prepare Xero bills/contacts from invoices.
---

# Ingest Invoices

Process one or more supplier invoices/receipts for **S & W Island Group LLC** (Wyoming LLC, base currency USD; owner Phil). Invoices arrive as-needed — there is no big backlog corpus. Handle a single invoice as gracefully as a batch of 30.

**Read `references/payee-rules.md` before processing anything.** It holds the known contacts, contractor list, related parties, never-contact exclusions, and account-coding defaults. Every classification and coding decision below depends on it.

## Hard rules (apply always)

- **Never write to Xero.** The Xero connector is read-only by design. You produce review CSVs; a human reviews and imports them. Never claim anything was written to Xero.
- **Never invent data.** Anything ambiguous — unclear supplier, unreadable amount, unknown entity, illegible date — goes in the NEEDS-REVIEW section with a note of what is missing. Leave the field blank in CSVs rather than guessing.
- **Never convert currency silently.** Keep each invoice in its own currency and put the currency code in the outputs. If the user wants conversion, ask.
- **Do not run git commands** unless the user explicitly asks.

## Step 1 — Inventory the input

1. Locate the invoice files the user pointed at (PDFs, images, .eml/forwarded email text). Glob the directory if given one.
2. Count them and decide the processing mode:
   - **≤ 8 files:** process them yourself, one at a time.
   - **> 8 files:** fan out subagents (Task tool). Split files into slices of ~5-8, one subagent per slice. Each subagent extracts, renames, and writes *partial* CSVs to the scratchpad; merge the partials at the end. Never paste whole PDF contents into the main context — subagents read the files, the main thread only sees structured rows.
3. Ask where outputs should go if unclear; default to the directory containing the invoices.

## Step 2 — Extract fields per invoice

Read each file (PDF pages, image OCR via Read, or email body) and extract:

| Field | Notes |
|---|---|
| Supplier legal name | Clean legal form (S.L., LLC, GmbH...). Prefer the name on the invoice header/footer over trading names, but record both. |
| Tax ID | EIN, NIF/CIF, VAT number — whichever appears. |
| Invoice number | As printed. |
| Issue date | Normalize to YYYY-MM-DD. |
| Due date | Normalize to YYYY-MM-DD; blank if absent (note payment terms if stated). |
| Currency | ISO code (USD, EUR, BRL, IDR, INR...). |
| Net / tax / gross | All three when shown; verify net + tax = gross, flag if not. |
| Description | One line: what was bought. |
| Confidence | high / medium / low per invoice. |

**Spanish-language invoices are common — handle bilingually.** Expect "Factura", "Fecha de emisión/vencimiento", "Base imponible" (net), "IVA" (tax), "Total", "NIF/CIF", "Razón social". Watch European number format: `1.234,56 €` means 1234.56 EUR. Watch DD/MM/YYYY dates on Spanish invoices vs MM/DD/YYYY on US ones — use context (month > 12, supplier country) and flag when genuinely ambiguous.

## Step 3 — Rename each file

Rename to:

```
YYYYMMDD - Provider Name - Amount
```

- Date = issue date.
- Provider Name = clean legal name (strip trailing punctuation; keep legal suffix).
- Amount = gross total; include the currency code when not USD (e.g. `450.00 EUR`); plain number for USD (e.g. `450.00`).
- Keep the original extension. Example: `20260315 - AZURIUS DIGITAL S.L. - 1210.00 EUR.pdf`
- If a target name already exists, do not overwrite — append a suffix like ` (2)` and flag as a possible duplicate (Step 5).
- If the date or amount could not be extracted, do NOT rename; list the file under NEEDS-REVIEW instead.

## Step 4 — Classify each supplier

Match against the known contacts and rules in `references/payee-rules.md`:

- **existing-contact** — matches a known Xero contact (fuzzy match on legal name, brand name, or card descriptor; e.g. "Dp* Dodopay Ppcclients" → SOYPROACADEMY, SL).
- **new** — a real supplier not in the known list. Goes into the new-contacts CSV.
- **uncertain** — plausible match but not confident, or entity unclear. Goes into NEEDS-REVIEW, not into the contacts CSV.

Special handling from the payee rules:

- **AZURIUS DIGITAL S.L. and AZURIUS SL are two separate companies** with the same owners — never merge or "correct" one into the other; match exactly.
- **Related parties** (CBS TECH VENTURES S.L. — Phil's own Spanish SL; Yuliet Espinosa Cruz) — always flag as inter-company/related-party in the extraction table, even when the match is confident.
- **Never-contacts**: "Mercury Credit" (card repayment), "Intl. Transaction Fee" (Bank Fees), S & W self-transfers, Phil's own top-ups (owner capital contribution → equity). These are not supplier invoices — exclude from contacts and bills CSVs and note why.

## Step 5 — Duplicate detection

Before emitting rows, check within the batch and against any prior extraction CSV in the output directory:

- Same supplier + same invoice number → duplicate.
- Same supplier + same date + same gross amount → probable duplicate.

Flag duplicates in the extraction table (`duplicate_of` column) and emit the bill row only once. Never double-emit.

## Step 6 — Write the three output CSVs

Write next to the invoices (or where the user says). Use clear dated names, e.g. `invoice-extraction-2026-07-07.csv`.

**a. Extraction table** — one row per invoice:

```csv
File,Supplier,TaxID,InvoiceNumber,IssueDate,DueDate,Currency,Net,Tax,Gross,Description,ContactStatus,SuggestedAccount,Confidence,Flags
```

`Flags` carries related-party, duplicate, currency-ambiguity, and needs-review markers.

**b. New-contacts delta** — Xero contacts-import header format; only suppliers classified **new** (never uncertain ones):

```csv
*ContactName,EmailAddress,TaxNumber,LegalName
```

First column must be `*ContactName`. Fill EmailAddress/TaxNumber/LegalName when extracted; leave blank otherwise.

**c. Draft bills** — Xero bills-import format, one line per invoice line (or one summary line if line items are not itemized):

```csv
*ContactName,*InvoiceNumber,*InvoiceDate,*DueDate,Description,*Quantity,*UnitAmount,*AccountCode,*TaxType,Currency
```

Suggest the account per the coding rules in `references/payee-rules.md` (SaaS → Software & Web, contractors → Contract Labor, PPC/marketing → Advertising, advisors → Professional Fees, bank/FX fees → Bank Fees, Xero itself → Dues and Subscriptions). For unknown suppliers, suggest the closest account and flag it. Keep the invoice currency in the Currency column.

## Step 7 — Report

Summarize in the final message:

1. Count processed, renamed files (old → new names).
2. Contacts: how many existing / new / uncertain.
3. Paths of the three CSVs.
4. **NEEDS-REVIEW** section: every ambiguity, duplicate, related-party flag, and excluded never-contact item, each with a one-line reason.
5. Remind the user the CSVs are for human review and import into Xero — nothing was written to Xero.
