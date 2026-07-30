#!/usr/bin/env node
/**
 * read-links.mjs — fetch each prospect's link-in-bio via a REAL Chrome over the
 * DevTools protocol (port 9222), so Linktree/Stan/creator sites that 403 plain
 * bots render normally. Returns page text for the score-prospect-fit skill to
 * classify into offer_type (service / mixed / product_only / unknown).
 *
 * WHY CDP: WebFetch and headless bots get 403'd by these hosts. Attaching to a
 * real, logged-in Chrome (started with --remote-debugging-port=9222) uses a real
 * browser fingerprint and session, which gets through.
 *
 * START CHROME FIRST (user's machine or the scraper env):
 *   google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/pf-chrome
 *   (or any Chromium; keep it open)
 *
 * RUN:
 *   node read-links.mjs profiles.json > pages.json
 * where profiles.json is: [{ "username": "...", "links": ["https://...", ...] }]
 * (the scraper already has `ext_urls`; split it into `links`.)
 *
 * OUTPUT (stdout): [{ username, results:[{ url, ok, status, text|error }] }]
 * Feed that to the skill; it reads `text` and applies the Gate-2 offer test.
 *
 * Requires Playwright (already present in this environment; Chromium at
 * /opt/pw-browsers). If no Chrome is listening on 9222 it falls back to
 * launching its own Chromium — less reliable against bot-blocking, but works
 * for plain sites.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
// Resolve playwright from a local install OR a global one (set NODE_PATH to the
// global node_modules, e.g. NODE_PATH=$(npm root -g)). Keeps the script runnable
// without a package.json in this folder.
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const CDP_URL = process.env.PF_CDP_URL || 'http://localhost:9222';
const MAX_LINKS = Number(process.env.PF_MAX_LINKS || 2);   // links per profile
const MAX_CHARS = Number(process.env.PF_MAX_CHARS || 4000);
const NAV_TIMEOUT = Number(process.env.PF_TIMEOUT || 15000);

function log(...a) { console.error('[read-links]', ...a); }

async function getBrowser() {
  try {
    const b = await chromium.connectOverCDP(CDP_URL, { timeout: 4000 });
    log(`attached to Chrome at ${CDP_URL}`);
    return { browser: b, launched: false };
  } catch (e) {
    log(`no Chrome on ${CDP_URL} (${e.message}); launching own Chromium (weaker vs bot-blocks)`);
    const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
    const b = await chromium.launch({ headless: true, ...(proxy ? { proxy: { server: proxy } } : {}) });
    return { browser: b, launched: true };
  }
}

async function readOne(ctx, url) {
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    await page.waitForTimeout(1200); // let link-hub JS render
    const text = (await page.evaluate(() => document.body?.innerText || ''))
      .replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_CHARS);
    return { url, ok: true, status: resp ? resp.status() : null, text };
  } catch (e) {
    return { url, ok: false, error: e.message };
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  const file = process.argv[2];
  if (!file) { log('usage: node read-links.mjs profiles.json > pages.json'); process.exit(1); }
  const profiles = JSON.parse(readFileSync(file, 'utf8'));
  const { browser, launched } = await getBrowser();
  // reuse an existing context when attached (keeps the logged-in session)
  const ctx = (!launched && browser.contexts()[0]) || await browser.newContext();

  const out = [];
  for (const p of profiles) {
    const links = (p.links || []).filter(Boolean).slice(0, MAX_LINKS);
    const results = [];
    for (const url of links) results.push(await readOne(ctx, url));
    out.push({ username: p.username, results });
    log(`${p.username}: ${results.filter(r => r.ok).length}/${links.length} read`);
  }

  process.stdout.write(JSON.stringify(out, null, 2));
  if (launched) await browser.close().catch(() => {});
}

main().catch(e => { log('fatal', e); process.exit(1); });
