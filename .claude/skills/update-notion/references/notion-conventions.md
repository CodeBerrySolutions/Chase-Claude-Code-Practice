# Notion Conventions — Phil's Workspace

Workspace: Phil's Workspace (phildelude@gmail.com).

## Databases

| Database | Data source ID | Notes |
|---|---|---|
| Tasks | `collection://285f0131-348b-8063-9cb9-000bfc403694` | "Tasks Tracker Actual" |
| Projects | `collection://285f0131-348b-8076-91a8-000b0f809f2d` | "Projects" |

## Task fields IN USE

- **Task name** (title)
- **Status**: Not started / In progress / Paused / Blocked / Validate / Done / Cancelled / Deprioritized
  - "Validate" = done-pending-check
- **Due date**
- **Priority**: High / Medium / Low
- **Effort level**: Low / Med / Intense
- **Description**
- **Related Project** (relation to Projects)
- **Assignee** (Phil)

## DEAD FIELDS — never fill

- **Task type**
- **Tags**

Deferred ruling 2026-07-07: leave these empty even when a value seems obvious.

## Project fields

- **Project name**
- **Category**: Team / Growth / Tax / Berry Nova
- **Status**
- **Priority**: Critical / Important / Necessary / Optional
- **Start date**
- **End date** — set to today when marking the project Done (feeds Phil's filtered view that hides completed projects from the cards view)

## Naming conventions

- **"Old -" prefix** = archived; exclude from search and matching entirely.
- **"Fn -" prefix** = legacy; leave untouched.
- Names are short, verb-first, and bilingual (English/Spanish) — match keywords in both languages.

## Destructive boundary (Phil, 2026-07-07)

- **Confirm-first**: setting Status to Cancelled, setting Status to Deprioritized, any deletion/archiving.
- **Act-and-report**: all other edits (status bumps, due-date moves, priority/effort changes, description edits, project re-linking).
