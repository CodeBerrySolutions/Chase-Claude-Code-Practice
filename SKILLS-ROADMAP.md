# Skills Roadmap — the source of truth for what's built and what's next

*Updated 2026-08-26. A new session should treat this file as the pickup point.
The visual version lives at the architecture-map artifact:*
https://claude.ai/code/artifact/4c34a03f-3256-4f09-802e-7bfabfe67546

*Since the 2026-07-08 Part-1 close, `score-prospect-fit` graduated from a
single screening prompt to a full live lead-gen pipeline (harvest → fetch →
re-fetch → score → write-back), run end-to-end for the first time on
2026-08-26. See its row below and the new operational items.*

## Built (11) — live in `.claude/skills/`, deployed to the vault via junctions

| Skill | Owner | Notes |
|---|---|---|
| score-prospect-fit | Phil | ICP gate → now a full live pipeline. Symptom screen (fit/review/later/no) over a weekly n8n harvest: harvest_workflow → fetch-quality gate → refetch_workflow for walled rows → deep-fetch-queue for the rest → scored by a scheduled CCR runner (scoring-runner.md, T5, staged/not-yet-enabled) draining queue-reader, verdicts written back via verdict-writer to the Work Sheet. First live run 2026-08-26: 81 scored (5 fit / 28 review / 8 later / 40 no), 13 pending deep-fetch. F5 ruling 2026-08-24: demand IS a criterion, followers only a weak proxy |
| draft-outreach | Phil | no-authority research-call motion; door-based framing; never fabricate proof |
| prep-research-call | Phil | listen-don't-pitch call briefs |
| synthesize-research-call | Phil | demand signal · roadmap pulls · case-study material · fit re-check |
| scaffold-project | Phil | the "yapper ingest": ramble → ≤1-day bite-size Notion tasks; due date is a MANDATORY clarification |
| update-notion | Phil | act-and-report on clear match; Cancelled/Deprioritized/delete = confirm-first; project Done → set End date |
| triage-tax-item | Phil | sub-recipes: US-IRS / Spain-AEAT / Wyoming-LLC / cross-border; triage only, never files |
| ingest-invoices | Phil | extract → rename `YYYYMMDD - Provider - Amount` → 3 review CSVs; never writes to Xero |
| categorize-bank-expenses | Phil | Mercury via MCP + Wise CSV → coded batch + missing-invoice worklist |
| prepare-payment-run | Phil | living roster in references/; prepares only, never pays; nannies = personal, excluded |
| triage-dev-thread | Phil | root cause not symptom; Spanish-by-default reply; draft-only, never sends |

## Identified, NOT yet built (6)

| Skill | Owner | Status | Blocker / next step |
|---|---|---|---|
| score-ai-test-run | Phil | define first | write down persona set + known-issues list; rubric is an INPUT (still changes per test). Internally agentic (batch JSONL scoring + root-cause diagnosis, not just scores) |
| draft-rag-doc | shared | blocked | **house-rules extraction**: write the doc rules (WHAT/WHEN vs HOW/WHO split, no customer-facing jargon, no cross-doc duplication, TBD-flag never invent figures, tables over per-competitor prose) into a reference file first. Biggest pattern in the claude.ai mine (16 convos) |
| draft-reel-script | Phil | blocked | **copy-skills recovery**: brand-voice / copy-editing / copy-fitting skills were built inside claude.ai conversation `28c17d92` and may not exist as files. Recover or rebuild, then this is an orchestration wrapper. Content = 45% of all message volume — highest-leverage build once unblocked |
| process-scrape-export | Phil | largely absorbed | The harvest → process → fetch stages now live as n8n workflows inside `score-prospect-fit/pipeline/` (harvest_workflow, refetch_workflow, fetch_gate) rather than a standalone script/skill. Filter/dedupe/fetch-quality logic is validated live. Only promote a separate skill if a non-score-prospect-fit consumer needs it; otherwise this stays folded into the pipeline. Guardrail still holds: process off-context, never paste sheets into chat |
| enrich-channel-index | Phil | blocked | fix the taxonomy/template (changed per run in evidence). Must paginate to hard counts — the "claimed complete without counting" failure mode is the thing to fix |
| draft-design-edit | Juliette | blocked | **style-guide assembly** (clean upload, NOT extracted from the inconsistent repo) + **mergeable-code hinge test** (Claude Design → Claude Code → does it merge into the real Next.js repo?). Skill core is tool-agnostic: precise, scoped, collateral-safe edit instructions |

## Parked (with re-entry conditions)

- **evaluate-ai-tool** — prototype as a checklist prompt first; promote if it stabilizes (output is prose, not artifact).
- **Tags field in Notion** — revisit only when agent-written Descriptions are rich enough to derive tags from.
- **harvest methodology** (lead-gen scraping) — no longer just a prototype: built as the `score-prospect-fit` n8n harvest (ScrapeCreators + Firecrawl, fetch-quality gate, targeted re-fetch) and run live 2026-08-26. Still owned inside the pipeline, not a standalone skill. Open: confirm the weekly cron is actually scheduled/active (first run was manual).
- **draft-ig-post** — superseded by draft-reel-script.
- **Juliette's mine** — her 67 claude.ai conversations were attributed but never clustered; her lane is provisional until then (or until she runs a live cycle).
- **Claude Code local transcripts** (~60MB, 44 JSONL) — excluded from the first mine; likely contains skills that never touch claude.ai.

## Operational open items (not skills)

- **score-prospect-fit pipeline — go autonomous (T5/T9 cutover):** the scheduled
  08:00 CCR scoring Routine is spec'd and validated (scoring-runner.md, budget
  STOP=50/MINUTES=60 confirmed) but NOT yet created — needs Phil to add it from
  the claude.ai Routines UI with n8n + Slack + Google connectors (runs on plan
  tokens, so it must be his session). Until then, scoring is manual/inline.
- **score-prospect-fit — 13-row deep-fetch pass:** rows at `status=needs_deep_fetch`
  need the 9222 manual browser pass (org proxy + Firecrawl can't crack them). Triaged
  worklist at `score-prospect-fit/deep-fetch-queue.md`; check each row's existing
  `fetched_content` first — some already came through behind the Cloudflare label.
- **score-prospect-fit — weekly harvest cadence:** confirm the harvest workflow is on
  an active weekly cron (first live run was manual) so the queue refills on its own.
- **Act on the fits:** 5 `fit` prospects are scored and sitting in the Work Sheet →
  ready for prep-research-call / draft-outreach. This is the pipeline's payoff.
- Vault git remote (memory layer has NO backup) — highest-consequence risk.
- Xero: import `seed/xero-contacts-delta.csv` (49 contacts) — unblocks Hubdoc matching and the finance skills' dedupe.
- Vault: delete-and-relink the 8 stale skill copies (byte-check first).
- Telegram bridge restart (text-ack echo inactive).
- Branch hygiene: `claude/agentic-os-build-review-x11572` (runner session — may hold unmerged docs) and `claude/skill-triage-tax-item-ncdj2v` (stranded, probably deletable) — diff against main, merge or delete deliberately.

## Standing decisions (don't re-litigate)

1. Repo = workshop, vault = runtime, joined by junctions; `main` = production; `git pull` = deploy (see SKILLS-DEPLOYMENT.md).
2. Invocation is explicit-first — never rely on auto-trigger.
3. Skills are the interface; agents/scripts are implementation details inside them.
4. Finance skills output review CSVs; never write to Xero directly (connector is read-only; n8n auto-write deferred — shared n8n login makes Xero credentials there unsafe).
5. One-verb-one-input-one-output per skill; encode stable judgment, not moving surfaces.
6. Repo skills edited only via repo commits; vault-native skills only in the vault.
7. Dashboards (Part 3) own no logic and no state — see PART3-DASHBOARD-PLAN.md.
