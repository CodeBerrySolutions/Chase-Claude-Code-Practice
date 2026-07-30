# Skills Deployment — one home, two doors

Decision (2026-07-08): this repo is the **workshop** — the only place skills
are written, reviewed, and versioned. The vault (`Documents\Deludicrous`) is
the **runtime** — the Telegram runner and vault sessions dispatch from
`Deludicrous\.claude\skills\`. The two are joined by **directory junctions**,
so there is exactly one physical copy of every repo skill.

## Why junctions (not copies, not global)

- **Copy-on-ship** drifts: a skill fixed in the repo silently keeps running
  its old version in the vault until someone remembers to re-copy. Invisible
  failure mode — rejected.
- **Global `~/.claude/skills/`** doesn't fix the actual bug: the runner reads
  the vault path, not the global path. Optional later for judgment-only
  skills you want in every ad-hoc session.
- **Junctions** give one source of truth: `git pull` in this repo IS the
  deploy action. The runner sees the new logic instantly. Vault-native
  skills (ingest-ramble, reconcile-state, daily-standup, ...) are never
  touched — collisions are skipped with a warning.

## Setup (once per machine)

```powershell
cd C:\Users\phild\projects\Chase-Claude-Code-Practice
git checkout claude/code-skill-architecture-e4jpx6   # or main once merged
git pull
powershell -ExecutionPolicy Bypass -File scripts\Link-SkillsToVault.ps1
```

Re-run the script any time a NEW skill is added to the repo (existing links
are skipped; new folders get linked). It also gitignores the junctioned
paths inside the vault so the vault's git doesn't double-track them.

## Deploy convention: `main` is production

Cloud sessions build on feature branches; **merging to `main` is the release
act**. The local checkout stays on `main` permanently, and `git pull` on
`main` = deploy. Never point the vault junctions at a feature-branch
checkout for daily operation.

### Freshness signal (fixes pull-drift)

The junction guarantees local coherence, not freshness — skill fixes pushed
from cloud sessions sit on GitHub until pulled. Run this at runner startup
(or scheduled daily) to surface staleness instead of silently running old
logic:

```powershell
# Warn-IfSkillsStale.ps1 — run from the repo root
git fetch origin main --quiet
$behind = git rev-list --count HEAD..origin/main
if ([int]$behind -gt 0) {
  Write-Warning "SKILLS ARE $behind COMMIT(S) BEHIND ORIGIN - run 'git pull' to deploy."
}
```

(Deliberately warn-only: auto-pull can collide with a dirty working tree
and turn an invisible problem into a broken pipeline.)

### Auto-relink on pull (fixes forgotten new skills)

New skills need a new junction; make `git pull` handle it. Create
`.git\hooks\post-merge` (no extension) in the local clone containing:

```sh
#!/bin/sh
powershell -ExecutionPolicy Bypass -File "$(git rev-parse --show-toplevel)/scripts/Link-SkillsToVault.ps1"
```

The link script is idempotent — existing junctions are skipped.

## Standing rules (one line each, put in the LOCAL machine's context)

- Repo skills are edited **only via repo commits** — never casually amended
  through the vault path (same file! uncommitted edits cause pull conflicts).
- Vault agents must **never modify or delete** anything under
  `vault\.claude\skills\` — deleting through a junction deletes the repo
  source.
- Check once whether `Documents` is **OneDrive-managed**; OneDrive interacts
  badly with junctions (duplication/choking). If yes, exclude or relocate
  the vault.
- Add `.claude/skills` to Obsidian's **Excluded files** so skill instructions
  don't pollute vault search/graph.

## Day-to-day

- **Deploy a fix:** `git pull` in this repo (on `main`). Done.
- **Build a new skill:** create it here, commit, pull locally, re-run the
  link script once.
- **Take a skill out of the runtime:** re-run with
  `-Exclude skill-name` after `-Unlink`, or delete the single junction in
  the vault (the repo copy is untouched).
- **Work-in-progress caution:** the runner sees the *checked-out* state.
  Build on branches; keep the local checkout on the stable branch and pull
  deliberately — that's the release valve.

## Related flags (tracked in the architecture artifact)

- The vault git repo has **no remote** — add a private GitHub remote; the
  memory layer currently lives one disk failure from gone.
- Whisper mishears ("Barry Nova", "with you to" → Yudha) — maintain a
  known-names correction list inside the vault's `ingest-ramble` skill, not
  in repo skills.
