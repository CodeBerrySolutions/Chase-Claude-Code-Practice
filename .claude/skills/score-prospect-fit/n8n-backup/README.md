# n8n workflow backup — Berry Nova prospect pipeline

**Snapshot: 2026-08-27.** Taken before a round of n8n testing (model swaps etc.) so
every pipeline workflow has a restore point. Scope = the **score-prospect-fit /
prospecting** workflows in the n8n **BerryNova** project (`cjX8d5pgL5PahDdR`). The
other ~27 workflows in that project belong to the CBS/Deludicrous RAG assistant (a
different product) and are intentionally **not** backed up here.

Backups store the full node graph + parameters + connections + settings, and
reference credentials **by id only** (no secrets — those stay in n8n).

## What's captured

| Workflow | ID | versionId (this snapshot) | Backup form |
|---|---|---|---|
| BN Prospect Harvest | `Nqh8rW55QoLIsDhd` | `31bca3a7-e314-4ebf-aba8-f511f7a1d2b9` | summary JSON here + **canonical source** `../pipeline/harvest_workflow.ts` (+ `.gen.mjs`, `fetch_gate.mjs`) |
| BN Refetch Deep-Fetch Queue | `LwY4qE8GuZhv0RzC` | — | **canonical source** `../pipeline/refetch_workflow.ts` (+ `.gen.mjs`) |
| BN — Queue Reader (test) | `G9vzcreuIpY1W7kn` | `6a38b2d4-f885-42a1-93b6-c8fd3756ee74` | full JSON here |
| BN — Verdict Writer (test) | `80Vgb0oBZyZeYcrj` | `24ea7b6e-db6c-4fb9-9803-ecc23604bf0f` | full JSON here |
| BN — Scoring Watchdog (T6) | `1I6deH79WKDi4kWE` | `f97af60c-401f-4145-84bb-6a175903f639` | full JSON here |
| Berry Nova Prospect Screener (legacy gpt-4o) | `bK0muPffxRMXLazZ` | `087cb428-2322-4ef7-9c2d-ff028b6d26fc` | full JSON here |
| Full Pilot Validation (A/B) | `gkULiWdArPDG8hFl` | `5425bc2c-30aa-4a2c-a2a1-c61d1d61bd33` | full JSON here |
| Firecrawl Link Test (throwaway) | `JuGP5MQeSdVDj686` | — | n8n version history only (disposable) |
| BN — Migrate Work Sheet (one-shot) | `2aZXY21YAzGrtTye` | — | one-shot migration helper; disposable |

All nine are **inactive** at snapshot time (no armed crons).

## Where the models live (relevant to model-swap testing)

- **Berry Nova Prospect Screener** → node `OpenAI Screen Model` = `gpt-4o`,
  temperature 0, cred `openAiApi izNRG0eSGUQXNZXD` (OpenAI BerryNova).
- **Full Pilot Validation (A/B)** → node `OpenAI Screen Model` = `gpt-4o`, same cred.
- The **live** scoring path is NOT in n8n — it's the Claude scoring runner
  (`../scoring-runner.md`) driven by the queue-reader/verdict-writer helpers. So
  "changing models" in n8n only affects the two legacy OpenAI workflows above.

## Shared references (unchanged by testing)

- Google Sheets cred `ewwwXdsL265lcGnq` = account **aiberrynova@gmail.com**.
- ScrapeCreators header-auth cred `eBYpneBljMZRIPYQ`; Firecrawl cred `SWCB5NyKsCIYJAJM`.
- Slack cred `kHGFK2xQZL4ZgDt6`; channel `#fd_marketing` = `C0BR9JW9Z6F`.
- Live Work Sheet at snapshot = OLD `1gZu5OuMhZ4kBfCPGNlsj09d07dtvkVsfQ2yk8u5252o`
  (a folder migration to `1LKnJo-srg1RnDZXPjuPI-sYmT0X2DBZ_xvAlDhf7Mg8` is in flight —
  data copied, workflows not yet repointed).

## How to restore

1. **Fastest (per-workflow revert):** in n8n, open the workflow → version history →
   restore the `versionId` listed above. This undoes any test edits in place.
2. **From this backup (rebuild):** recreate the workflow from the JSON here (via the
   n8n MCP `create_workflow_from_code`, or import), then re-attach credentials by the
   ids above. For harvest/refetch, prefer regenerating from the `../pipeline/*.ts`
   canonical source instead.
