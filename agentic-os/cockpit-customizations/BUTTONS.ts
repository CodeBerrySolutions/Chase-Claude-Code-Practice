// Swap-point 3 — src/components/ActionBar.tsx BUTTONS array (Berry Nova build).
// Each `skill` MUST have a matching case in runner.js buildPrompt() —
// see runner-cases.js in this folder.

const BUTTONS: ButtonSpec[] = [
  { skill: "plan-today", label: "Plan Today" },
  { skill: "metrics-pull", label: "Pull Metrics" }, // direct-exec, skips claude -p
  { skill: "close-day", label: "Close Day" },
  { skill: "categorize-bank-expenses", label: "Sort Expenses" }, // monthly routine
  { skill: "ingest-invoices", label: "Ingest Invoices" },        // monthly routine
  // STUB — prepare-payment-run is define-first (contractor roster not yet
  // written down). Button reserved; uncomment when the SKILL.md lands.
  // { skill: "prepare-payment-run", label: "Prep Payments" },
];

// NOT buttons by design (input-driven judgment skills — fire as /slash):
// score-prospect-fit, draft-outreach, prep-research-call,
// synthesize-research-call, triage-tax-item, triage-dev-thread
