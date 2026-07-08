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

## Day-to-day

- **Deploy a fix:** `git pull` in this repo. Done.
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
