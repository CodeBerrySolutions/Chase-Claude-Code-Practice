# Payee Rules — S & W Island Group LLC

Reference data for classifying suppliers, coding bills, and naming invoice files.

## Entity

- **S & W Island Group LLC** — Wyoming LLC; owner Phil.
- **Xero base currency:** USD.
- **Banks:**
  - Mercury — USD, including the Mercury credit card.
  - Wise — multi-currency (EUR / USD / BRL / IDR / INR).

## Existing Xero contacts (as of 2026-07)

Five contacts exist; a 49-contact import is pending, so re-check before declaring a supplier "new" if that import may have landed.

### Customers

| Contact | Notes |
|---|---|
| MINTECH IBERICA, S.L. | Brand: **Membersfy** |
| AZURIUS DIGITAL S.L. | See warning below |
| AZURIUS SL | See warning below |
| SOYPROACADEMY, SL | Brand: **"PPC Clients"**; card descriptor: `Dp* Dodopay Ppcclients` |

> **Warning:** AZURIUS DIGITAL S.L. and AZURIUS SL are **TWO SEPARATE companies** with the same owners. **Never merge them** or map one to the other — match legal names exactly.

### Suppliers

| Contact | Notes |
|---|---|
| Wise | Bank/FX provider |

## Contractors (account: Contract Labor)

| Name | Currency | Notes |
|---|---|---|
| José Luis Correa Godefoy | BRL | |
| Celia Indira Hidalgo Tagle | USD | |
| Danay Garces Garcia | EUR | |
| Yuliet Espinosa Cruz | EUR | Subcontractor — **related party** |

## Related parties (always flag)

- **CBS TECH VENTURES S.L.** — Phil's own Spanish SL. Any transaction with it is inter-company: process normally but **always flag** as related-party for review.
- **Yuliet Espinosa Cruz** — related-party subcontractor (see above).

## Never contacts / never expenses

These are not supplier invoices — exclude from the contacts and bills CSVs and note why:

| Item | Treatment |
|---|---|
| "Mercury Credit" | Credit-card repayment — not an expense, not a contact |
| "Intl. Transaction Fee" | Code to **Bank Fees**; not a contact |
| S & W self-transfers | Internal transfer — never an expense |
| Phil's own top-ups | Owner capital contribution → **equity**, never an expense |

## Account coding defaults (real Xero chart)

| Category | Account | Examples |
|---|---|---|
| SaaS / tools | **Software & Web** | Anthropic, OpenAI, Cursor, GitHub, Atlassian, Clouding.io, HostGator, GoDaddy, IONOS, Sonarsource, Lovable, Apify, Heygen, Replit, Google Workspace, Gummysearch, UX Pilot, Nevercode, Slack, Dashlane |
| Xero subscription | **Dues and Subscriptions** | Xero itself |
| Contractors | **Contract Labor** | The contractors listed above |
| PPC Clients / marketing agencies | **Advertising** | |
| Advisors | **Professional Fees** | Fixcal Consulting and similar |
| Bank / FX fees | **Bank Fees** | Wise fees, Intl. Transaction Fee |
| Unknown | Suggest closest account **and flag** for review | |

## File naming

```
YYYYMMDD - Provider Name - Amount
```

Issue date; clean legal provider name; gross amount with currency code when not USD. Keep the original file extension.

## Hard rule

Output **review CSVs only** — a human reviews and imports them into Xero. The Xero connector is read-only. **Never claim anything was written to Xero.**
