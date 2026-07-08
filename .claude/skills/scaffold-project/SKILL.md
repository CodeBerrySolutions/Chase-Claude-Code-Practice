---
name: scaffold-project
description: Turns a rambling goal, braindump, or voice-transcript into a structured Notion project with bite-size, calendar-ready tasks — the "yapper ingest". Use when the user brain-dumps a goal, rambles about things they need to do, asks to create a project or tasks in Notion, or gives a deadline-bound deliverable to break down; also handles single-task capture ("add a task: pay X on Friday").
---

# Scaffold Project — the yapper ingest

Take Phil's unstructured talk — a ramble, a braindump, a voice transcript ("I need to
do X, Y, Z for project A", "new content must ship by Friday") — and turn it into a
properly structured Notion project plus bite-size tasks. Phil never does the
micro-decomposition by hand; that is this skill's job.

Read `references/notion-conventions.md` before writing anything to Notion. It holds
the database IDs, the exact field set, and the standing rulings (which fields are
live, which are dead, naming rules). Do not write to Notion from memory of a past
session — the conventions file is the source of truth.

## Tools

Use the Notion MCP tools. If they are not loaded, fetch them via ToolSearch first:

- `mcp__Notion__notion-create-pages` — create task/project pages with properties;
  parent is the data source (collection ID from the conventions file).
- `mcp__Notion__notion-update-page` — fix or enrich an existing page.
- `mcp__Notion__notion-query-data-sources` — SQL over a data source; use to check
  for an existing project before creating a duplicate.
- `mcp__Notion__notion-fetch` — read a page or database when you need detail.

## Core algorithm

### 1. LISTEN

Parse the ramble for:

- The goal / end-state — what does "done" look like.
- The deliverable(s) — the concrete artifacts.
- The deadline(s) — explicit dates ("by Friday") or implied ones.
- Constraints — budget, people, tools, sequencing hinted at in passing.
- Details worth preserving — names, links, half-formed acceptance criteria,
  "check with so-and-so" asides. These go into task Descriptions later; they are
  exactly the details Phil would never type by hand.

### 2. CLARIFY — 1-2 questions MAX before decomposing

Ask at most one or two questions, then get on with it. Candidates, in priority order:

1. **The due date, if no date is stated or inferable.** This one is NON-OPTIONAL:
   Phil's default view shows tasks planned for upcoming days, so an undated task
   is effectively invisible and may never be seen again. Never create a task
   without a Due date silently — ask ("when should this land — today?"), or
   propose a date and flag it clearly as proposed.
2. The goal/end-state, if genuinely unclear.
3. When there is a deadline, the **dependency questions**:
   - Who consumes the deliverable on that date? (e.g. "Is Friday when you present
     to Juliette, or when it ships?")
   - Is Phil the sole judge of done, or does someone review it first?
   - Is anything blocked on external input (assets, approvals, access)?

If the ramble already answers these, do not ask — decompose immediately. Never
burn the question budget on things you can infer.

### 3. BACKWARD-PLAN into bite-size tasks

Work backward from the deadline to today:

- Every leaf task is **≤ 1 day of work**. This is non-negotiable — it is the fix
  for multi-day tasks breaking the calendar view (the reason both Notion and Asana
  previously felt weak to Phil). Multi-day work is decomposed, never dated as one
  long task.
- Every leaf task lands on a real calendar day via its Due date. Sequence tasks so
  dependencies come earlier; leave slack before the deadline when a reviewer is in
  the loop (their review is its own task with its own day).
- If review/consumption answers from step 2 revealed a handoff (e.g. present to
  Juliette Friday), schedule the deliverable to be finished *before* that day, and
  make the handoff itself a task.
- Keep the plan honest: if the work plainly cannot fit before the deadline at
  ≤1-day granularity, say so and propose what to cut or move — do not silently
  compress.

### 4. WRITE to Notion

**Project first (only if new).** Before creating a project, SQL-search the Projects
data source for a similar name. Prefer linking tasks to an existing project over
creating a near-duplicate. Exclude projects whose name starts with `Old -` from
matching. If a plausible match exists but you are unsure, ask — never guess.

New project properties (see conventions file for options): Project name, Category
(ask if unclear), Status, Priority, Start date = today. Do not set End date at
creation — it is set when the project is marked Done.

**Then the tasks.** Every task gets ALL of:

- **Task name** — short, verb-first ("Draft outline", "Enviar factura a gestoría").
- **Status** — `Not started`.
- **Due date** — the real calendar day from the backward plan.
- **Priority** — High / Medium / Low, judged from deadline pressure and stakes.
- **Effort level** — Low / Med / Intense.
- **Description** — context, acceptance criteria, and "who to check with",
  harvested from the ramble. This is where the preserved details from LISTEN go.
- **Related Project** — relation link to the project.
- **Assignee** — Phil.

Never fill the dead fields (`Task type`, `Tags`) — see the conventions file.

### 5. REPORT

List what was created — project and each task with its due date — including Notion
links. Flag anything you were uncertain about and how you resolved it. If something
remains uncertain (a date, an owner, a category), ask; never guess and move on.

## Trivial case: single-task capture

"Add a task: pay Northwest invoice Friday" is the degenerate case — no
decomposition, no clarifying interrogation. Create one task with the same full
field set (name, Status, Due date, Priority, Effort level, Description, Related
Project if one is evident, Assignee). Only ask a question if a required field is
truly ambiguous (e.g. no discernible due date for something clearly deadline-bound).

## Judgment notes

- The agent absorbs the data-entry cost Phil used to bear: always fill Priority,
  Effort level, and Description even when the ramble barely hints at them — a
  reasonable inference beats a blank field. Priority feeds Phil's sorted
  "Working on" / "Pending" views, so it must never be empty.
- Bilingual English/Spanish task names are fine; match the language of the ramble.
- Never create new `Fn -` prefixed projects (legacy convention).
- Anything uncertain → ask. Never invent dates, categories, or reviewers.
