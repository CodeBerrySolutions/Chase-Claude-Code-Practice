# Part 3 — The Dashboard (Cockpit) Plan

*Written 2026-07-08, at the close of Part 1. Self-contained: read this cold
and you have the full picture.*

---

## Context recap (30 seconds)

The agentic OS as of today:

- **Skills** — 11 built (prospecting, tax triage, invoices, bank expenses,
  Notion capture, payment run, dev threads). They live in the repo
  `Chase-Claude-Code-Practice/.claude/skills/` (the *workshop*, versioned,
  `main` = production) and are junctioned into the vault (the *runtime*).
- **The vault** — `Documents\Deludicrous`. Obsidian vault + git repo. Holds
  the inbox, ramble transcripts, ingest reports, archive, and 15
  vault-native skills. This is the OS's memory (Part 2 structures it).
- **The runner** — `telegram-bridge.js` + `runner.js` (Node, always on).
  The bridge catches Telegram voice/text → Whisper transcribes → drops
  files into `vault\inbox\` → runner.js *watches those folders* and
  dispatches skills against whatever appears. Proven live: a voice note
  from Bali became a correctly-dated, correctly-projected Notion task.

**The two problems Part 3 solves:**

1. **Invocation.** Skills do not fire themselves reliably. Auto-triggering
   (Claude noticing a skill's description mid-conversation) is real but
   inconsistent — we established early that the architecture is
   **explicit-first**: slash commands, schedules, and… buttons. Today
   "explicit" means opening a terminal and typing. That's fine for Phil,
   hostile to everyone else.
2. **Visibility.** Knowing what the OS did today means reading
   `runner.log` and rummaging `inbox\reports\`. There is no single screen
   answering: what ran, what did it produce, what needs my review, what's
   in the pipeline.

Part 3 = a **control panel**: buttons that fire skills ("Prep payment run",
"Categorize June", "Process inbox") + an **activity feed** (what ran, what
came out, what's waiting on Phil). It's also what makes the OS usable by
someone who isn't Phil — Juliette first, possibly clients later.

---

## The one architecture rule that makes everything below work

> **The cockpit owns no logic and no state. It is a window.**

- All real state lives in the **vault**: skill outputs, reports, a
  machine-readable activity log.
- All triggering happens through the **watched-folder mechanism the runner
  already has**: a "button" is anything that drops a trigger file into
  `vault\inbox\triggers\`. The runner can't tell whether Obsidian, a web
  page, or a human wrote that file — and doesn't care.
- Never put business logic *in* a dashboard (no Obsidian plugin that
  computes, no Streamlit code that decides). The moment a cockpit knows
  something the vault doesn't, there's a third brain and we're back to the
  split-brain problem the junctions just fixed.

This rule is why the two dashboard options below are not rivals — they are
**two windows onto the same wall**, buildable in either order with zero
migration cost.

*(Dependency: Part 2 must design vault state with this in mind. The Part 2
kickoff prompt already includes the line: skill runs append to a
machine-readable activity log, and skills can be triggered by dropping
files into a watched folder.)*

---

## Option A — Obsidian-native cockpit

Build the panel **inside the vault itself**, since the vault is already an
Obsidian vault.

**What it concretely is:** a dashboard note (or a few) using community
plugins — Dataview (or Bases) queries that render the activity log and
reports as live tables ("today's runs", "needs review", "pipeline by due
date"), plus a buttons plugin whose buttons write trigger files into
`inbox\triggers\`. The runner does the rest.

**Pros**
- **Zero new infrastructure.** No server, no port, no extra process to
  babysit. The cockpit lives where the memory lives — open the vault, the
  OS is looking back at you.
- **Fastest to working.** Hours, not days; it's configuration more than
  construction.
- **Compounds with Part 2.** Every memory-layer artifact (rulings, state
  docs, worklists) is natively renderable — the dashboard improves
  automatically as the vault gets structured.
- **Most customizable for a solo operator.** Any query you can think of is
  a Dataview block away.

**Cons**
- **Single-operator by design.** Only whoever has the vault open sees it.
  Sharing means sharing the entire vault — memory, finances, everything.
  Not acceptable for Juliette-as-user, unthinkable for a client.
- **Desktop-bound.** Phone access is clumsy (Obsidian mobile + synced
  vault; triggers would fire only when the home machine's runner sees the
  sync — indirect and laggy).
- Plugin maintenance is a minor but nonzero tax (plugins break
  occasionally on Obsidian updates).

## Option B — Web app (Streamlit)

A small **Python web app** running locally, opened in a browser
(`localhost:8501`). Streamlit's whole point: a data dashboard in ~a hundred
lines of Python, no frontend skills needed.

**What it concretely is:** the app *reads the same vault files* (activity
log, reports) and renders them as a web page; its buttons *write the same
trigger files*. Identical brain, different window.

**Pros**
- **Shareable.** A real web page: Juliette uses it without touching
  Obsidian or a terminal; a client can be shown (or given) a curated
  slice. You choose which buttons/views each audience gets — the vault
  itself stays private.
- **Reachable.** With Tailscale (or similar) it works from your phone or
  Juliette's laptop while the home machine runs.
- **Distribution-friendly.** If the agentic OS ever becomes something you
  demo or sell (Berry Nova adjacency is obvious), a web cockpit is the
  showable artifact.

**Cons**
- **One more always-on process** to start, monitor, restart after reboots —
  joining the bridge and runner. Every process you add is a thing that can
  be silently down.
- **Slower iteration.** Each new view is Python code, not a query block in
  a note.
- **Security surface.** The moment it's reachable beyond localhost, you own
  auth decisions. (Tailscale makes this easy, but it's still a decision.)
- Building it *before* the memory layer exists means rendering a state
  that's still changing shape — rework guaranteed.

---

## The decision: Obsidian first, Streamlit when it's ready to share

**Sequencing, and the reasoning:**

1. **Part 2 first regardless.** A dashboard is only as good as the state it
   displays; the memory layer is what creates that state. Dashboard-before-
   memory means rendering `runner.log` prettily — low value.
2. **Obsidian-native next.** It's nearly free (the vault exists, Obsidian
   is open anyway), it serves the only current daily operator (Phil), and
   it forces Part 2's state design to be clean — if a Dataview query can't
   render it, the state isn't machine-readable enough, and better to learn
   that now.
3. **Streamlit when a second pair of eyes needs it.** Because of the
   thin-cockpit rule, this is an afternoon of work *whenever* it happens —
   a second window on files that already exist, not a migration. Building
   it earlier means maintaining a web server for an audience of one.

**Trigger conditions for starting the Streamlit build** (any one suffices):
- Juliette needs to fire skills or check the feed herself (e.g. the
  design-edit skill goes live for her lane).
- A client or collaborator needs a curated view.
- Phone access stops being "nice someday" and starts being blocking.
- You want a showable cockpit for Berry Nova demos/content.

**The trap to re-read before building either:** if you ever find yourself
writing logic in the dashboard — a calculation, a decision, a piece of
state that exists nowhere else — stop. It goes in the vault (memory) or in
a skill (behavior). The dashboard renders and triggers. Nothing more.

---

## Source materials

- Masterclass companions (on the hard drive, in the Chase AI+ materials):
  - Obsidian-native route: `agentic-os-build-guide.md` (Phases 3–10)
  - Streamlit route: `2026-05-13-streamlit-cockpit-v2-companion-prompt.md`
- This repo: `SKILLS-DEPLOYMENT.md` (junction/deploy model the dashboard
  must respect).
- Architecture map artifact (statuses, decisions, open threads):
  https://claude.ai/code/artifact/4c34a03f-3256-4f09-802e-7bfabfe67546
