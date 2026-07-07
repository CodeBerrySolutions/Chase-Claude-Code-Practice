---
name: triage-dev-thread
description: Reads an internal dev-team Slack thread or technical discussion about a blocker or disagreement (OAuth/webhooks, WhatsApp Business API, Meta Business Manager, n8n workflows, billing logic, infra outages), diagnoses the actual root cause rather than the reported symptom, and drafts a reply in Spanish for the Cuba-based dev team plus an English summary. Use when the user shares a Slack thread or internal technical discussion and asks what's actually going on, for a diagnosis, or for a drafted reply to the team.
---

# Triage Dev Thread

Diagnose the real root cause behind a dev-team thread and draft a reply. The team is
Cuba-based and Spanish-speaking; Phil (English-speaking) posts the reply himself.

## Hard boundary: draft only

NEVER send or post the reply anywhere — not to Slack, not by email — even if write
tools (e.g. `slack_send_message`) are available. These threads are often sensitive
internal disagreements. Output the draft in the response and stop. Phil posts it.

## Step 1 — Read the whole thread, not the headline

- Read every message, including late corrections and half-retracted claims. The most
  useful evidence is often an offhand detail ("funciona en staging", "solo falla desde
  ayer", an error code pasted without comment).
- Note WHO claims WHAT. In a disagreement, map each position to its supporting evidence.
- Extract hard facts: exact error messages, HTTP status codes, timestamps, environment
  names, config values, API versions.

## Step 2 — Do not trust the thread's framing

The stated problem is usually a symptom, and the thread's own diagnosis is often wrong
or incomplete. Independently reason to the root cause:

- Ask: what single underlying fault would produce ALL the observations, including the
  ones nobody is focusing on?
- Check the boring causes first: expired/rotated tokens, wrong environment, redirect
  URI mismatch, webhook not re-subscribed after a change, unverified Meta business,
  paused n8n workflow, credential scoped to the wrong account, timezone/currency
  assumptions in billing code, DNS/TLS expiry in outages.
- If tools are available, verify instead of speculating: WebSearch/WebFetch for API
  docs and changelogs (Meta/WhatsApp docs especially — behavior changes by version),
  n8n MCP tools for workflow/execution state, the repo for the code under discussion.
- If the thread's diagnosis is wrong, SAY SO EXPLICITLY in the analysis and the draft,
  and explain what the proposed fix would and wouldn't change. Be direct but respectful:
  developers wrote it under pressure with partial information.
- If two people disagree, resolve the disagreement on the evidence — don't split the
  difference to be polite. It is fine for both to be partially right; say which parts.

## Step 3 — Separate what you know from what you assume

Classify every claim into the four output buckets below. Assign a confidence level to
the root cause (high / medium / low) and justify it: high = evidence in the thread or
docs directly implicates it; medium = best explanation but a key fact is unverified;
low = plausible hypothesis, needs the UNKNOWNS checked first.

## Step 4 — Draft the reply

- SPANISH BY DEFAULT when addressed to the dev team. Natural, professional Latin
  American Spanish — not machine-translated English. Follow with a 2-3 line English
  summary for Phil. If the recipient is clearly English-speaking, English only.
- Register: precise, technical, peer-to-peer. The audience is professional developers —
  no hedging filler, no lecturing, no over-explaining basics they already know.
- Structure the reply: acknowledge the work done, state the diagnosis plainly, give
  concrete next steps (exact settings, endpoints, commands to check), and if correcting
  someone, correct the idea, not the person.
- Keep it short enough to actually get read in Slack.

## Output format

Always produce exactly this structure:

```
SYMPTOM: <the problem as reported in the thread>
ROOT CAUSE: <your diagnosis + confidence high/med/low>
EVIDENCE:
- <what in the thread or docs supports the diagnosis>
UNKNOWNS / HOW TO CONFIRM:
- <what would confirm or kill the diagnosis, and how to check it>
DRAFT REPLY (ES):
<the Spanish reply, ready for Phil to paste>
SUMMARY (EN):
<2-3 lines for Phil>
```

## Worked example (condensed)

Thread: "Los webhooks de WhatsApp dejaron de llegar a n8n desde ayer. Meta debe estar
caído otra vez — reintentamos la verificación y falla con 403. Propongo migrar el
endpoint a otro server." Later in thread: "ayer roté los certs y moví el webhook detrás
del nuevo proxy."

```
SYMPTOM: WhatsApp webhooks stopped reaching n8n; verification fails with 403; team
suspects a Meta outage and proposes moving servers.
ROOT CAUSE: Not a Meta outage. The webhook endpoint broke when it was moved behind the
new proxy — the proxy is not passing the hub.challenge verification GET (or strips the
verify token), so Meta gets a 403 and disables delivery. Confidence: high.
EVIDENCE:
- Failure started exactly when certs were rotated and the endpoint moved behind the proxy.
- 403 on verification is a local auth/routing response, not what a Meta outage produces.
- No Meta status incident reported; other integrations unaffected.
UNKNOWNS / HOW TO CONFIRM:
- curl the callback URL with a hub.challenge GET from outside — does it echo the challenge?
- Check proxy access logs for Meta's verification request and what the proxy returned.
DRAFT REPLY (ES):
Equipo, no creo que sea una caída de Meta: el 403 empezó justo cuando movimos el
endpoint detrás del proxy nuevo. Todo apunta a que el proxy no está dejando pasar el
GET de verificación (hub.challenge), y por eso Meta desactivó la entrega. Antes de
migrar de servidor, probemos: (1) curl al callback con hub.challenge desde fuera,
(2) revisar los logs del proxy para ver qué responde a Meta. Si el proxy devuelve el
challenge, re-verificamos el webhook en el App Dashboard y debería volver a fluir.
SUMMARY (EN):
Webhooks broke because yesterday's proxy change blocks Meta's verification GET, not a
Meta outage. Asked the team to test the callback and check proxy logs before migrating
servers — migration would not fix it.
```
