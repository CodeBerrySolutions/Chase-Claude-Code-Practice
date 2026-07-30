# Chase-Claude-Code-Practice — Phil's agentic-OS skill workshop

This repo is the **workshop** where Claude Code skills for Phil's agentic OS
are designed, built, and versioned. The **runtime** is the Obsidian vault
(`Documents\Deludicrous` on Phil's machine), where a Telegram bridge +
runner dispatch these skills against incoming voice/text rambles. The two
are joined by directory junctions; `main` is production and `git pull` on
the local machine is the deploy action.

## Read before working on skills

- **SKILLS-ROADMAP.md** — source of truth: what's built (11), what's
  identified-but-unbuilt (6, with blockers), what's parked, standing
  decisions. **A new session picks up from here.**
- **SKILLS-DEPLOYMENT.md** — the junction/deploy model and its rules.
- **PART3-DASHBOARD-PLAN.md** — the future cockpit; thin-cockpit rule.

## Conventions

- Skills live in `.claude/skills/<name>/SKILL.md`, one verb + one input +
  one output each. Frontmatter description must carry concrete trigger
  conditions (auto-invocation depends on it), but the architecture is
  explicit-first — never design around auto-trigger.
- Durable facts and Phil's rulings go in `references/*.md` inside the
  skill (payee-rules, notion-conventions, payment-roster). Date every
  ruling. These are proto-memory; Part 2 (vault memory layer) will
  centralize them.
- Finance skills NEVER write to Xero — review CSVs only, a human imports.
- New skills are typically built by subagents from a rich spec, then
  committed; update SKILLS-ROADMAP.md in the same commit.
- `seed/` is gitignored working data (financial exports) — never commit
  financial data to this repo.
