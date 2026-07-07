---
name: update-notion
description: Applies natural-language changes to existing tasks and projects in Phil's Notion workspace — status changes, due-date moves, priority/effort edits, descriptions, project re-linking. Use when the user asks to update, change, complete, reschedule, reprioritize, pause, block, or cancel existing Notion tasks or projects in natural language — "mark X done", "bump Y to high", "move the tax task to Friday".
---

# Update Notion

Apply natural-language edits to EXISTING tasks and projects in Phil's Notion. This skill never creates new items — creation belongs to the scaffold-project skill.

Read `references/notion-conventions.md` for database IDs, field values, and naming conventions before querying.

Batch commands are normal ("mark X done and push Y to next week"). Process each change independently through the full resolve → act/confirm → report loop.

## Tools

Load via ToolSearch if not already available:

- `mcp__Notion__notion-query-data-sources` — find target tasks/projects via SQL
- `mcp__Notion__notion-update-page` — apply property changes
- `mcp__Notion__notion-fetch` — verify current state when unsure

## Step 1: Resolve the target

Resolve the user's reference by fuzzy match on task/project name via SQL over the relevant data source (Tasks or Projects — see conventions file for collection IDs).

- Use `LIKE` patterns over the title, with `OR` across plausible keywords. Example shape:
  ```sql
  SELECT id, "Task name", "Status", "Due date", "Priority"
  FROM "Tasks Tracker Actual"
  WHERE lower("Task name") LIKE '%tax%' OR lower("Task name") LIKE '%modelo%'
  ```
- Prefer OPEN items — Status not in (Done, Cancelled) — over closed ones.
- Prefer RECENT items when several match.
- EXCLUDE projects named "Old -*" from matching entirely. Never resolve to them.
- Names are short, verb-first, and bilingual (English/Spanish) — try keywords in both languages if the first pattern misses.

## Step 2: Decide — act or ask

- **One clear best match** → act immediately, then report.
- **Genuine tie, or nothing convincing** → do NOT guess. Ask the user, showing the candidates (name, status, due date) so they can pick.
- **Nothing matches at all** → never invent a task that doesn't exist. Say the reference matched nothing and offer to create it via the **scaffold-project** skill instead.

## Step 3: Confirm-first for destructive changes

DESTRUCTIVE = CONFIRM-FIRST, always (Phil's ruling, 2026-07-07):

- Setting Status to **Cancelled**
- Setting Status to **Deprioritized**
- Any **deletion or archiving**

For these, state exactly what you are about to do and to which item, and wait for explicit confirmation before calling `notion-update-page`.

Everything else is FREE — act and report, no confirmation needed:

- Status bumps (Not started → In progress, Done, Paused, Blocked, Validate, …)
- Due-date moves
- Priority and Effort level changes
- Description edits
- Project re-linking (Related Project)

## Step 4: Apply the change

Use `mcp__Notion__notion-update-page` with the resolved page ID.

Special rules:

- **Marking a PROJECT Done** → also set its **"End date" to today**. This feeds Phil's filtered view that hides completed projects from the cards view. Never mark a project Done without setting End date.
- **Never fill dead fields**: "Task type" and "Tags" are unused (deferred ruling 2026-07-07). Do not populate them even if a value seems obvious.
- **"Fn -" prefixed items are legacy** — leave them untouched unless the user names one explicitly and unambiguously.
- **Validate status** means done-pending-check — use it when the user says something is "done but needs checking" or similar.

If unsure about an item's current field values before editing, use `mcp__Notion__notion-fetch` to verify rather than overwriting blind.

## Step 5: Report

After EACH change, re-state:

- The item (with its Notion link)
- The field changed
- Old value → new value

Example:

> Updated **Fix Stripe webhook** (link): Status: In progress → Done.

For batches, report each item on its own line. If part of a batch failed or needed a question, complete the unambiguous changes first, then surface the rest.

## Edge cases

- **Multi-day reschedules on a single task** ("this will take all week"): do not stretch one task's date across days. Tasks are bite-size (≤1 day). Suggest decomposing the work via the **scaffold-project** skill instead, and offer to set today's slice as the task's due date meanwhile.
- **Ambiguous scope** ("cancel the growth stuff"): if the reference plausibly covers multiple items, list what would be affected and ask — this is both an ambiguity case and a destructive case.
- **User references a project when they mean a task (or vice versa)**: search both data sources when the reference could be either, and say which one you resolved to.
- **Relative dates** ("Friday", "next week"): resolve against today's date. When the user says "next week" without a day, use Monday of next week and say so in the report.
- **Reopening**: moving Done/Cancelled back to an open status is a normal, free edit. When reopening a project, clear its End date and mention it.

## Non-goals

- Creating tasks or projects (use scaffold-project)
- Bulk schema/database changes
- Editing page body content beyond the Description property
