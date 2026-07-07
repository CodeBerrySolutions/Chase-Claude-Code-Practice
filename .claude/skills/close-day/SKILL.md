---
name: close-day
description: "End-of-day close-out for the Berry Nova agentic OS. Checks off completed Top 3 items, prompts for manual metrics (customer conversations, concierge count), and writes the EOD Reflection into today's daily note. Trigger phrases: 'close day', 'close out today', 'end my day', '/close-day'."
---

# close-day

Archetype 1 — daily-note writer. Idempotent: re-running updates, never duplicates.

## Steps

1. Open today's `daily-notes/<YYYY-MM-DD>.md`. If missing, create it from the
   v1 schema first (a close-out with no note is still worth capturing).
2. Review the Activity Log section — summarize what actually happened today
   (tool calls, skill runs) in 2-3 lines.
3. Top 3: mark items the user confirms done (`[x]`), flip the matching
   `top3_done` frontmatter flags. Unfinished items stay — plan-today
   carries them over tomorrow.
4. Prompt for the manual metrics (skip any the user doesn't answer):
   - customer conversations held today → append to
     `system/metrics/metrics.csv` as `manual:customer_conversations_week`
   - active concierge/pilot customers (if changed) →
     `manual:concierge_active_customers`
5. Write `## EOD Reflection` — 3-5 lines: what moved the needle, what stalled,
   one pre-PMF learning (customer signal, objection, channel insight) if any.
6. Update `effort` / `focus_blocks` frontmatter if the user volunteers them.

## Boundaries

- Schema headings are a parser contract — never rename or reorder them.
- Reflection is the user's voice, not a motivational essay. Terse > flowery.
- Never mark a Top 3 item done without user confirmation.

End your reply with: `SAVED daily-notes/<date>.md`
