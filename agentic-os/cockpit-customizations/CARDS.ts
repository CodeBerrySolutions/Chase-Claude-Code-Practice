// Swap-point 2 — src/components/Cockpit.tsx CARDS array (Berry Nova build).
// Keys MUST match the `<source>:<metric>` strings the pull scripts emit —
// verify against system/metrics/metrics.csv after the first pull.
// Cards with no matching CSV row render a "no data" placeholder (safe).

const CARDS: CardSpec[] = [
  // manual entries — typed via daily note / cockpit; wire as source `manual`
  { key: "manual:customer_conversations_week", label: "Convos (wk)", format: "integer", tabs: ["overview"] },
  { key: "manual:concierge_active_customers", label: "Concierge Active", format: "integer", tabs: ["overview"] },

  // GHL — pull_salescalls.py
  { key: "ghl:sales_calls_week", label: "Sales Calls (wk)", format: "integer", tabs: ["overview"] },

  // Wise — pull_wise_revenue.py (services/concierge revenue)
  { key: "wise:revenue_mtd", label: "Wise Rev MTD €", format: "compact", tabs: ["overview"] },
  { key: "wise:revenue_30d", label: "Wise Rev 30d €", format: "compact", tabs: ["overview"] },

  // Stripe — DEFERRED. Uncomment when live SaaS charges exist.
  // Wise-vs-Stripe on one screen = the concierge-vs-software split, daily.
  // { key: "stripe:revenue_mtd", label: "SaaS Rev MTD", format: "compact", tabs: ["overview"] },
];
