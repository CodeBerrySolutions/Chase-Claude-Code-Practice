// fetch_gate.mjs — the mechanical fetch-quality gate (T2).
//
// PURPOSE. Classify a link-in-bio fetch (from Firecrawl, or from the 9222 deep
// reader) into a fetch_status, with ZERO ICP judgment — HTTP status, byte
// length, and content-marker regex only. ICP/offer judgment stays in the
// score-prospect-fit skill (one source of truth). This file IS the versioned
// gate config the review asked for (references/fetch-gate.md documents the
// policy); paste `classifyFetch`/`statusFor` into the n8n Code node verbatim so
// the deployed gate and the repo never drift.
//
// Contract:
//   classifyFetch({ extUrls, httpStatus, markdown, error }) -> { fetch_status, fetch_note }
//     fetch_status ∈ ok | no_link | thin | blocked | error   (never blank)
//   statusFor(fetch_status) -> to_score | needs_deep_fetch    (the row's initial status)
//
// Run the self-test:  node fetch_gate.mjs --test   (no network, no API)

// ---- tunables (dated 2026-08-23; change here, re-run the self-test) ----------
export const THIN_FLOOR = 200;          // min non-whitespace chars of real content for `ok`
export const HTTP_BLOCK = [401, 403, 429]; // auth/rate-limit walls => blocked

// Marker sets. Case-insensitive. A page matching a BLOCK/LOGIN/PARKED marker is
// `blocked` regardless of length (it's a wall/junk page, not the real site).
export const BLOCK_MARKERS = [
  /recaptcha/i, /i'?m not a robot/i, /captcha/i,
  /just a moment\.\.\./i, /attention required/i, /checking your browser/i,
  /cf-browser-verification/i, /\bray id\b/i, /cloudflare/i,
  /enable javascript to (?:run|view|continue)/i, /please enable javascript/i,
  /access denied/i, /you have been blocked/i, /rate limit/i,
];
export const LOGIN_MARKERS = [
  /log in to continue/i, /sign in to continue/i, /log in to (?:see|view)/i,
  /this account is private/i, /account is private/i,
  /you must log in/i, /login required/i, /create an account to (?:see|view)/i,
];
export const PARKED_MARKERS = [
  /buy this domain/i, /domain is for sale/i, /this domain (?:is|may be) (?:for sale|parked)/i,
  /parked (?:free )?courtesy of/i, /sedoparking/i, /hugedomains/i,
  /the domain .{0,40} is (?:available|for sale)/i, /related searches/i,
];
// Consent/cookie walls are WEAK: a real page often carries a cookie banner. So
// they DO NOT force `blocked` — they only count toward `thin` when the page has
// little else (banner-only shell).
export const CONSENT_MARKERS = [
  /we value your privacy/i, /accept all cookies/i, /manage (?:your )?consent/i,
  /this (?:site|website) uses cookies/i, /cookie preferences/i,
];

// ---- helpers -----------------------------------------------------------------
const norm = (s) => String(s ?? "");
const nonWs = (s) => norm(s).replace(/\s+/g, "").length;
const anyMatch = (s, list) => list.some((re) => re.test(s));
// content with consent-banner lines stripped, to measure the *real* remainder
function contentMinusConsent(md) {
  return norm(md)
    .split(/\n+/)
    .filter((line) => !anyMatch(line, CONSENT_MARKERS))
    .join("\n");
}

// ---- the gate ----------------------------------------------------------------
export function classifyFetch({ extUrls, httpStatus, markdown, error } = {}) {
  // 1. no link to fetch at all -> score on bio alone (not a failure)
  const hasLink = norm(extUrls).trim().length > 0;
  if (!hasLink) return { fetch_status: "no_link", fetch_note: "no ext_urls" };

  // 2. hard transport failure
  if (error) return { fetch_status: "error", fetch_note: `error: ${String(error).slice(0, 120)}` };
  if (typeof httpStatus === "number" && httpStatus >= 500)
    return { fetch_status: "error", fetch_note: `http ${httpStatus}` };

  const md = norm(markdown);

  // 3. explicit wall/junk pages -> blocked (regardless of length)
  if (typeof httpStatus === "number" && HTTP_BLOCK.includes(httpStatus))
    return { fetch_status: "blocked", fetch_note: `http ${httpStatus}` };
  if (anyMatch(md, BLOCK_MARKERS)) return { fetch_status: "blocked", fetch_note: "bot/js/cloudflare wall" };
  if (anyMatch(md, LOGIN_MARKERS)) return { fetch_status: "blocked", fetch_note: "login/private wall" };
  if (anyMatch(md, PARKED_MARKERS)) return { fetch_status: "blocked", fetch_note: "parked/for-sale domain" };

  // 4. thin: too little *real* content (consent boilerplate stripped)
  const real = nonWs(contentMinusConsent(md));
  if (real < THIN_FLOOR) return { fetch_status: "thin", fetch_note: `${real} chars` };

  // 5. substantive content
  return { fetch_status: "ok", fetch_note: "" };
}

// fetch_status -> initial row status. Policy (default): a good or absent link is
// scoreable now; a blocked/thin/error link goes to the Deep-Fetch (9222) queue,
// because the link content is the decisive offer signal (input-contract.md).
// The deep-fetch queue is aged/escalated by the watchdog (T6) so it can't grow
// silently; a bio-only row (`no_link`) still scores (usually -> review).
export function statusFor(fetch_status) {
  return fetch_status === "ok" || fetch_status === "no_link" ? "to_score" : "needs_deep_fetch";
}

// ---- self-test (node fetch_gate.mjs --test) ----------------------------------
const FIXTURES = [
  { name: "recaptcha (real: sarahdebaets)", in: { extUrls: "https://x.co", markdown: "Please verify you are human. reCAPTCHA. I'm not a robot." }, want: "blocked" },
  { name: "cloudflare interstitial", in: { extUrls: "https://x.co", markdown: "Just a moment...\nChecking your browser before accessing. Ray ID: 8ab" }, want: "blocked" },
  { name: "private IG login wall", in: { extUrls: "https://instagram.com/x", markdown: "This Account is Private\nLog in to see their photos and videos." }, want: "blocked" },
  { name: "http 403", in: { extUrls: "https://x.co", httpStatus: 403, markdown: "Forbidden" }, want: "blocked" },
  { name: "parked domain", in: { extUrls: "https://x.co", markdown: "Buy this domain. This domain is for sale. Related searches: coaching." }, want: "blocked" },
  { name: "thin linktree shell", in: { extUrls: "https://linktr.ee/x", markdown: "Linktree\n@coach\n·\n·" }, want: "thin" },
  { name: "consent-only shell (thin after strip)", in: { extUrls: "https://x.co", markdown: "We value your privacy\nAccept all cookies\nManage consent" }, want: "thin" },
  { name: "http 500", in: { extUrls: "https://x.co", httpStatus: 500, markdown: "" }, want: "error" },
  { name: "firecrawl error object", in: { extUrls: "https://x.co", error: "ETIMEDOUT" }, want: "error" },
  { name: "no link", in: { extUrls: "", markdown: "" }, want: "no_link" },
  { name: "real coaching page + cookie banner", in: { extUrls: "https://x.co", markdown: "We value your privacy. Accept all cookies.\n\n" + "Work with me: my 12-week group coaching program helps founders reclaim their time. Join the waitlist — cohorts fill fast. Testimonials from 40+ clients. My signature framework, the Clarity Method, is taught over live calls and a private community. ".repeat(2) }, want: "ok" },
];

if (process.argv.includes("--test")) {
  let pass = 0;
  for (const f of FIXTURES) {
    const got = classifyFetch(f.in).fetch_status;
    const ok = got === f.want;
    pass += ok ? 1 : 0;
    console.log(`${ok ? "PASS" : "FAIL"}  ${f.name}  -> ${got}${ok ? "" : ` (want ${f.want})`}  [status=${statusFor(got)}]`);
  }
  console.log(`\n${pass}/${FIXTURES.length} passed`);
  process.exit(pass === FIXTURES.length ? 0 : 1);
}
