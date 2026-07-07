---
name: metrics-pull
description: "Pull all cockpit metrics for the Berry Nova agentic OS. Runs every pull script in scripts/, appends rows to system/metrics/metrics.csv and updates the last-pull.json snapshot. Trigger phrases: 'pull metrics', '/metrics-pull', 'refresh dashboard data', 'update the cockpit numbers'."
---

# metrics-pull

Archetype 4 — mechanical script wrapper. No AI judgment: run the scripts,
report what they printed. The runner routes this skill DIRECT-EXEC
(spawns the scripts, skips `claude -p`).

## Scripts

| script | metric keys | source |
|---|---|---|
| `scripts/pull_salescalls.py` | `ghl:sales_calls_week` | GoHighLevel calendar API |
| `scripts/pull_wise_revenue.py` | `wise:revenue_mtd` / `_30d` / `_total` | newest Wise CSV in `<vault>/inbox/wise/` |

Manual metrics (`manual:customer_conversations_week`,
`manual:concierge_active_customers`) are typed by the user — not pulled here.

## Steps

1. Run each `pull_*.py` in `scripts/` with Python 3.11+.
2. Each script self-reports: appends to `system/metrics/metrics.csv`
   (append-only, never rewrite) and updates `system/metrics/last-pull.json`
   with `status: ok` or `status: error` + reason.
3. If a script errors, surface the error string — don't retry silently.
   Common: missing `GHL_API_KEY` in `~/.claude/.env`; no Wise CSV exported yet.

## Boundaries

- Never invent metric values. A failed pull is `status: error`, not a guess.
- Never write secrets anywhere. Credentials live in `~/.claude/.env` only.
