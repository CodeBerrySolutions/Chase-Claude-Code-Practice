# Notion conventions — Phil's workspace

Source of truth for how scaffold-project writes to Notion. Facts and standing
rulings; update this file when a ruling changes, never contradict it silently.

## Workspace

- Phil's Workspace (phildelude@gmail.com).

## Databases (data source collection IDs)

| Database | Data source ID | Notes |
|---|---|---|
| Tasks | `collection://285f0131-348b-8063-9cb9-000bfc403694` | "Tasks Tracker Actual" |
| Projects | `collection://285f0131-348b-8076-91a8-000b0f809f2d` | "Projects" |

Use these as the `parent` when creating pages, and as the target of
`notion-query-data-sources` SQL queries.

## Task fields IN USE — write ALL of these on every task

- **Task name** (title) — short, verb-first.
- **Status** — options: `Not started` / `In progress` / `Paused` / `Blocked` /
  `Validate` / `Done` / `Cancelled` / `Deprioritized`. New tasks start at
  `Not started`. `Validate` means done-pending-check (finished, awaiting review).
- **Due date** — the real calendar day the task is worked/finished.
- **Priority** — `High` / `Medium` / `Low`.
- **Effort level** — `Low` / `Med` / `Intense`.
- **Description** — agent-written: context + acceptance criteria + "who to check
  with", harvested from the ramble.
- **Related Project** — relation to the Projects database.
- **Assignee** — Phil.

## DEAD task fields — never fill

- **Task type** — dead.
- **Tags** — dead. Deferred by ruling 2026-07-07: revisit only when agent-written
  descriptions are rich enough to derive tags from.

## Project fields

- **Project name**
- **Category** — `Team` / `Growth` / `Tax` / `Berry Nova`. Ask if unclear.
- **Status**
- **Priority** — `Critical` / `Important` / `Necessary` / `Optional`.
- **Start date** — set = today on creation.
- **End date** — set when the project is marked Done. This feeds Phil's filtered
  view that hides old projects, so do not set it at creation.

## Field economics ruling (2026-07-07)

Phil historically under-filled fields because HE was the data-entry cost. The
agent absorbs that cost now, so Priority, Effort level, and Description are
agent-maintained — always filled, never left blank. Priority matters concretely:
Phil's "Working on" and "Pending" views sort by it.

## Naming

- Task and project names: short, verb-first. Bilingual English/Spanish is fine.
- `Old -` project-name prefix = archived; **ignore these in duplicate-search
  matching** and never link new tasks to them.
- `Fn -` prefix = legacy convention; **never create new ones**.

## Bite-size rule

Every task is ≤ 1 day of effort. Multi-day work is decomposed into daily leaf
tasks, never dated as one long task — long tasks break the calendar view.
