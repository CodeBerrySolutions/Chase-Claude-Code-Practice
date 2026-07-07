---
date: 2026-07-07
type: build-config
masterclass: part-3-obsidian-path
phase: 0-complete
status: confirmed
---

# Agentic OS — Phase 0 Confirmed Configuration (Berry Nova)

This file is the output of the Phase 0 Customization Interview from
`Build Your Own Agentic OS (Masterclass Part 3 · Path B)`, run 2026-07-07.
All choices below are USER-CONFIRMED. A local Claude Code session executing
Phases 1–11 should read this file and NOT re-run the interview.

## How to use (on the Windows machine)

1. Open a Claude Code session in the vault root: `C:\Users\phild\Documents\Deludicrous`
2. Paste the Part 3 guide + this file, with the prefix:
   > "Phase 0 is already complete — use agentic-os/PHASE0-SUMMARY.md for all
   > $VARIABLES. Start at the pre-flight check. Pause between phases.
   > Don't skip [VERIFY] blocks."
3. Pre-built assets in this repo (copy, don't rewrite):
   - `.claude/skills/metrics-pull/` — SKILL.md + working pull scripts (GHL + Wise)
   - `.claude/skills/plan-today/`, `.claude/skills/close-day/` — daily-rhythm skills
   - `agentic-os/cockpit-customizations/` — CARDS, BUTTONS, palette, runner cases
   - Branch `claude/code-skill-architecture-e4jpx6` — the 8 built Part 1 skills

## $VARIABLES

### $DOMAIN
Founder launching a software business (Berry Nova), pre-PMF: building MVP,
defining value prop, testing customer-acquisition channels, and resolving how
much white-glove concierge service to layer on vs. pure software — using data
(the Wise-vs-Stripe revenue split is the concierge-vs-software signal).

### $METRICS
| # | name | source_type | source_detail |
|---|---|---|---|
| 1 | customer_conversations_week | manual | typed into cockpit/daily note |
| 2 | sales_calls_week | api | GHL `/calendars/events`, calendar CTqyAV6ULsvq7QoDlRZU, location pDUAU2PcdWhEkcZ2j6sM — script: `pull_salescalls.py` ✅ pre-flighted |
| 3 | concierge_active_customers | manual | typed |
| 4 | revenue (wise) | local | Wise CSV export → `<vault>/inbox/wise/` — script: `pull_wise_revenue.py` ✅ verified on real export. Emits `wise:revenue_mtd`, `wise:revenue_30d`, `wise:revenue_total`. Owner-alias filter excludes self-funding. |
| — | revenue (stripe) | api | DEFERRED until live SaaS charges exist |

Secrets go in `~/.claude/.env` (NEVER in git): `GHL_API_KEY` (⚠ rotate the
pit- token after first successful local pull — it transited a chat),
optional `WISE_CSV_DIR`, `AGENTIC_OS_VAULT=C:\Users\phild\Documents\Deludicrous`.

### $SKILLS
Wiring rule (from the Part 1 architecture doc): buttons fire routines
explicitly; input-driven judgment skills stay slash-commands.

**ActionBar buttons (6):**
| skill | status | archetype |
|---|---|---|
| metrics-pull | ✅ built (this repo) | 4 — script wrapper, direct-exec |
| plan-today | ✅ scaffolded (this repo) | 1 — daily-note writer |
| close-day | ✅ scaffolded (this repo) | 1 — daily-note writer |
| categorize-bank-expenses | ✅ built (skill-architecture branch) | 2/agentic |
| ingest-invoices | ✅ built (skill-architecture branch) | 2/agentic |
| prepare-payment-run | 🟡 STUB — define-first; button reserved | 2 |

**Slash lane (no buttons):** score-prospect-fit · draft-outreach ·
prep-research-call · synthesize-research-call · triage-tax-item ·
triage-dev-thread

**Not wired (blocked, per architecture rule):** draft-rag-doc ·
draft-reel-script · process-scrape-export · enrich-channel-index ·
draft-design-edit

### $WANT_GMAIL
true — read + draft only (also feeds ingest-invoices receipt-hunting)

### $WANT_CALENDAR
true — plan-today drops today's events into the daily note Schedule section

### $FOLDER_MODEL
karpathy — `inbox → projects → content` + wiki/daily-notes/ops/system/_archive-vault.
Vault root: `C:\Users\phild\Documents\Deludicrous`

### $PALETTE
| token | value |
|---|---|
| bg | `#0d0b10` (near-black, violet cast) |
| fg | `#e8e4ec` |
| accent | `#d34a8a` (berry magenta) |
| accent-2 | `#8b5cf6` (violet, secondary) |
| font | JetBrains Mono |

### $OS
windows (10/11, PowerShell) — use the Windows blocks in every phase.

## Daily Drivers (Phase 2 template `$DAILY_DRIVER_*`)
1. Log customer conversations + sales calls
2. Inbox triage
3. Check metrics / cockpit review

## Notes carried from the interview
- Costs metric was considered and dropped (Juliette freelancer-invoice
  distortion makes combined costs misleading for now).
- Wise data hygiene: "AZURIUS DIGITAL S.L" and "AZURIUS SL." are the same
  customer — normalize if a customer-count metric is ever added.
- Wise revenue is 100% services/concierge today; the Stripe card, once live,
  makes the concierge-vs-software split visible daily.
