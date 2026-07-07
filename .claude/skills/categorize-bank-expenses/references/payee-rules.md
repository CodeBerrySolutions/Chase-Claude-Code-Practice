# Payee Rules — S & W Island Group LLC

Classification and coding reference for the categorize-bank-expenses skill.

## Entity & banking context

- **Entity**: S & W Island Group LLC (Wyoming)
- **Banks**:
  - **Mercury** — USD, including the Mercury credit card
  - **Wise** — multi-currency: EUR / USD / BRL / IDR / INR
- **Xero base currency**: USD (report totals per currency anyway — never
  sum across currencies)

## Existing Xero contacts (as of 2026-07)

Only 5 contacts exist, with a 49-contact import pending. Expect most
counterparties to have no Xero contact yet.

### Customers

| Contact | Notes |
|---|---|
| MINTECH IBERICA, S.L. | Brand: Membersfy |
| AZURIUS DIGITAL S.L. | **Separate company** from AZURIUS SL — same owners, never merge |
| AZURIUS SL | **Separate company** from AZURIUS DIGITAL S.L. — same owners, never merge |
| SOYPROACADEMY, SL | Brand: "PPC Clients"; card descriptor "Dp* Dodopay Ppcclients" |

### Suppliers

| Contact | Notes |
|---|---|
| Wise | Payment platform / fees |

## Contractors — code to "Contract Labor"

| Name | Currency | Notes |
|---|---|---|
| José Luis Correa Godefoy | BRL | |
| Celia Indira Hidalgo Tagle | USD | |
| Danay Garces Garcia | EUR | |
| Yuliet Espinosa Cruz | EUR | Subcontractor — **related party**, flag |

## Related parties — always flag, never silently code

- **CBS TECH VENTURES S.L.** — Phil's own Spanish SL. Any movement is
  inter-company: classify as related-party and put it in NEEDS-REVIEW.
- **Yuliet Espinosa Cruz** — related-party subcontractor (see above).

## Never contacts / never expenses

| Item | Treatment |
|---|---|
| "Mercury Credit" | Credit card repayment — **internal transfer**, not an expense |
| "Intl. Transaction Fee" | → **Bank Fees** |
| S & W self-transfers (Mercury ↔ Wise, account-to-account) | **Internal transfer** |
| Phil's own top-ups | **Owner capital contribution → equity**, never an expense |
| Incoming client payments | → **Service Revenue** (income) |

## Account coding defaults (real Xero chart)

| Payee / pattern | Xero account |
|---|---|
| SaaS & tools: Anthropic, OpenAI, Cursor, GitHub, Atlassian, Clouding.io, HostGator, GoDaddy, IONOS, Sonarsource, Lovable, Apify, Heygen, Replit, Google Workspace, Gummysearch, UX Pilot, Nevercode, Slack, Dashlane | **Software & Web** |
| Xero subscription | **Dues and Subscriptions** |
| Contractors (list above) | **Contract Labor** |
| PPC Clients spend / marketing agencies | **Advertising** |
| Fixcal Consulting and similar advisors | **Professional Fees** |
| Bank / FX / international transaction fees | **Bank Fees** |
| Unknown payee | Suggest the closest account **and flag NEEDS-REVIEW** |

## Context facts

- As of 2026-07, the books held only **$1,716 of booked expenses against a
  full year of real spend**. Assume almost everything this skill touches
  has **never been coded before** — do not assume prior categorization.

## Hard rule

Output review CSVs only; a **human** imports or enters them into Xero.
Never claim anything was written to Xero — the connector is read-only by
design.
