---
name: plan-today
description: "Opinionated start-of-day planner for the Berry Nova agentic OS. Creates today's daily note from the frozen v1 schema, suggests Top 3 priorities from carryover + project status, drops today's Google Calendar events into Schedule. Idempotent — merges, never overwrites. Trigger phrases: 'plan today', 'plan my day', '/plan-today'."
---

# plan-today

Archetype 1 — daily-note writer. Idempotent: safe to fire twice.

## Steps

1. Compute today's date (local). Path: `daily-notes/<YYYY-MM-DD>.md`.
2. If the note exists, read existing Top 3 + Daily Drivers — MERGE into empty
   slots only, never overwrite filled ones.
3. Read the last 3 daily notes for unfinished Top 3 items (carryover).
4. Pull today's events via `mcp__claude_ai_Google_Calendar__list_events` →
   Schedule section as `- HH:MM — <event>` lines.
5. Glob `projects/*.md` for `status: active` or `status: in-progress`
   modified in the last 14 days.
6. Score Top 3 candidates: carryover +50, due-today +40, calendar-prep +25.
   Pre-PMF tiebreak: customer-facing work (conversations, sales calls,
   concierge delivery) outranks internal polish.
7. Write the note using the frozen v1 schema from
   `system/schemas/daily-note.md` — EXACT headings, EXACT section order.
   Daily Drivers default: "Log customer conversations + sales calls",
   "Inbox triage", "Check metrics / cockpit review".

## Boundaries

- Schema headings are a parser contract — never rename or reorder them.
- Never delete user-entered content. Merge only.

End your reply with: `SAVED daily-notes/<date>.md`
