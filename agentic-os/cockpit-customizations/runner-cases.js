// Phase 5/7 — cases to add to runner.js (Berry Nova build).
// Paste each block into the matching switch. Also add "plan-today" and
// "close-day" to SERIAL_SKILLS (they write the same daily note) and
// "metrics-pull" is already in DEDUPE_SKILLS by default.

// ---------------------------------------------------------------------------
// deliverablePathFor(skill, date, id8) — where each skill saves output
// ---------------------------------------------------------------------------
case "plan-today":
  return `daily-notes/${date}.md`;

case "close-day":
  return `daily-notes/${date}.md`;

case "metrics-pull":
  return `system/metrics/last-pull.json`; // direct-exec script wrapper

case "categorize-bank-expenses":
  return `inbox/reports/metrics/${date}-expense-batch-${id8}.md`;

case "ingest-invoices":
  return `inbox/reports/metrics/${date}-invoice-ingest-${id8}.md`;

// STUB — enable when prepare-payment-run's SKILL.md lands:
// case "prepare-payment-run":
//   return `inbox/reports/metrics/${date}-payment-run-${id8}.md`;

// ---------------------------------------------------------------------------
// buildPrompt(skill, args, deliverable) — the headless claude -p prompt
// ---------------------------------------------------------------------------
case "plan-today":
  return `${AUTONOMOUS_PREFIX}\n\nRun /plan-today.\n\nEnd your reply with: SAVED ${deliverable}`;

case "close-day":
  return `${AUTONOMOUS_PREFIX}\n\nRun /close-day.\n\nEnd your reply with: SAVED ${deliverable}`;

// metrics-pull: route DIRECT-EXEC in the runner (spawn the script, skip
// claude -p entirely — archetype 4):
//   Windows: powershell -NoProfile -ExecutionPolicy Bypass -File %USERPROFILE%\.claude\skills\metrics-pull\scripts\run_all.ps1

case "categorize-bank-expenses":
  return `${AUTONOMOUS_PREFIX}\n\nRun /categorize-bank-expenses for last month. Mercury via MCP, Wise from the newest CSV export. Emit the review CSV (Xero is read-only — never fake a write).\n\nSave the run report at: ${deliverable}.\n\nEnd your reply with: SAVED ${deliverable}`;

case "ingest-invoices":
  return `${AUTONOMOUS_PREFIX}\n\nRun /ingest-invoices on the invoice inbox folder (+ Gmail receipts). Emit renamed files, bills CSV, and the new-contacts delta.\n\nSave the run report at: ${deliverable}.\n\nEnd your reply with: SAVED ${deliverable}`;

// case "prepare-payment-run": — STUB until the contractor roster is defined.
