# link-reader — read the offer behind the link-in-bio (via Chrome on :9222)

The scoring skill is text-only and can't reach the link-in-bio, where the real
offer usually lives. This helper opens each prospect's links in a **real Chrome**
over the DevTools protocol (port 9222) so Linktree / Stan / creator sites that
`403` plain bots render normally, and returns the page text for the skill to
classify into `offer_type` (`service` / `mixed` / `product_only` / `unknown`).

## Why a real browser on :9222

WebFetch and headless bots get `403`'d by these hosts (verified: Linktree, Stan,
and typical creator sites all refuse). Attaching to a real, ideally logged-in
Chrome uses a genuine browser fingerprint/session and gets through. This is the
concrete answer to "so much of the info is in those links."

## Setup

1. Start Chrome with remote debugging (keep it open):
   ```
   google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/pf-chrome
   ```
   Any Chromium works. Logging into nothing is fine; a normal profile just helps.
2. Make Playwright importable. It's already on this machine globally:
   ```
   export NODE_PATH="$(npm root -g)"
   ```
   (Or `npm i playwright` in this folder.)

## Run

Build a `profiles.json` from the scraper's `ext_urls` column:
```json
[{ "username": "elenasblair_photography", "links": ["https://elenasblair.com/links"] }]
```
Then:
```
node read-links.mjs profiles.json > pages.json
```
Output (`pages.json`):
```json
[{ "username": "...", "results": [{ "url": "...", "ok": true, "status": 200, "text": "…visible page text…" }] }]
```

## Feed it back to scoring

`pages.json` is the input to the offer gate (`../tier-rubric.md`, Gate 2). Read
each `text` and classify:
- coaching / group program / mastermind / 1:1 / booking a call → `service`
- service **and** product → `mixed`
- merch / supplements / self-guided course / ebook / performed-craft / procedure
  / community only → `product_only` → **D_fail `no_serviceable_offer`**
- link dead / blocked / indeterminate → `unknown` → `offer_unconfirmed`

The classification is the same rubric the skill applies to bios — just with real
page text instead of a 150-char bio.

## Knobs (env vars)
- `PF_CDP_URL` (default `http://localhost:9222`) — where Chrome is listening.
- `PF_MAX_LINKS` (2) — links read per profile.
- `PF_MAX_CHARS` (4000) — text captured per page.
- `PF_TIMEOUT` (15000) — nav timeout ms.

## Notes / limits
- If nothing is on :9222 it falls back to launching its own headless Chromium —
  fine for plain sites, weaker against bot-blocking. Prefer the :9222 attach.
- Reading **content/posts** (not just links) would add signal but is
  time-intensive; this reader deliberately does links only.
- Verified runnable here (Node 22 + global Playwright); the launch fallback
  needs direct network or a proxy (`HTTPS_PROXY` is passed through if set).
