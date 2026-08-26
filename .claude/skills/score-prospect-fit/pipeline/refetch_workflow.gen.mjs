// Generator for the targeted deep-fetch-queue re-fetch workflow.
// Reuses classifyFetch/statusFor verbatim from fetch_gate.mjs; slim output
// (only fetch fields + row_key) so it updates in place without touching
// harvest-owned columns.

const refetchGate = `
const THIN_FLOOR = 200;
const HTTP_BLOCK = [401, 403, 429];
const BLOCK_MARKERS = [
  /recaptcha/i, /i'?m not a robot/i, /captcha/i,
  /just a moment\\.\\.\\./i, /attention required/i, /checking your browser/i,
  /cf-browser-verification/i, /\\bray id\\b/i, /cloudflare/i,
  /enable javascript to (?:run|view|continue)/i, /please enable javascript/i,
  /access denied/i, /you have been blocked/i, /rate limit/i,
];
const LOGIN_MARKERS = [
  /log in to continue/i, /sign in to continue/i, /log in to (?:see|view)/i,
  /this account is private/i, /account is private/i,
  /you must log in/i, /login required/i, /create an account to (?:see|view)/i,
];
const PARKED_MARKERS = [
  /buy this domain/i, /domain is for sale/i, /this domain (?:is|may be) (?:for sale|parked)/i,
  /parked (?:free )?courtesy of/i, /sedoparking/i, /hugedomains/i,
  /the domain .{0,40} is (?:available|for sale)/i, /related searches/i,
];
const CONSENT_MARKERS = [
  /we value your privacy/i, /accept all cookies/i, /manage (?:your )?consent/i,
  /this (?:site|website) uses cookies/i, /cookie preferences/i,
];
const norm = (s) => String(s == null ? '' : s);
const nonWs = (s) => norm(s).replace(/\\s+/g, '').length;
const anyMatch = (s, list) => list.some((re) => re.test(s));
function contentMinusConsent(md) {
  return norm(md).split(/\\n+/).filter((line) => !anyMatch(line, CONSENT_MARKERS)).join('\\n');
}
function classifyFetch(o) {
  o = o || {};
  const hasLink = norm(o.extUrls).trim().length > 0;
  if (!hasLink) return { fetch_status: 'no_link', fetch_note: 'no ext_urls' };
  if (o.error) return { fetch_status: 'error', fetch_note: 'error: ' + String(o.error).slice(0, 120) };
  if (typeof o.httpStatus === 'number' && o.httpStatus >= 500) return { fetch_status: 'error', fetch_note: 'http ' + o.httpStatus };
  const md = norm(o.markdown);
  if (typeof o.httpStatus === 'number' && HTTP_BLOCK.includes(o.httpStatus)) return { fetch_status: 'blocked', fetch_note: 'http ' + o.httpStatus };
  if (anyMatch(md, BLOCK_MARKERS)) return { fetch_status: 'blocked', fetch_note: 'bot/js/cloudflare wall' };
  if (anyMatch(md, LOGIN_MARKERS)) return { fetch_status: 'blocked', fetch_note: 'login/private wall' };
  if (anyMatch(md, PARKED_MARKERS)) return { fetch_status: 'blocked', fetch_note: 'parked/for-sale domain' };
  const real = nonWs(contentMinusConsent(md));
  if (real < THIN_FLOOR) return { fetch_status: 'thin', fetch_note: real + ' chars' };
  return { fetch_status: 'ok', fetch_note: '' };
}
function statusFor(fetch_status) {
  return fetch_status === 'ok' || fetch_status === 'no_link' ? 'to_score' : 'needs_deep_fetch';
}
const j = $json || {};
const fc = j.data || j;
const markdown = (fc && (fc.markdown || fc.content)) || j.markdown || '';
const meta = (fc && fc.metadata) || j.metadata || {};
const httpStatus = (typeof meta.statusCode === 'number') ? meta.statusCode : (typeof j.statusCode === 'number' ? j.statusCode : undefined);
const error = j.error || (j.success === false ? 'firecrawl error' : undefined);
const g = classifyFetch({ extUrls: j.ext_urls, httpStatus: httpStatus, markdown: markdown, error: error });
return {
  row_key: j.row_key,
  fetched_content: String(markdown).slice(0, 45000),
  fetch_status: g.fetch_status,
  fetch_note: g.fetch_note,
  fetched_at: $now.toISO(),
  source: 'firecrawl',
  status: statusFor(g.fetch_status)
};
`.trim();

// self-test the classify region against the repo
import { classifyFetch as ref } from '/home/user/Chase-Claude-Code-Practice/.claude/skills/score-prospect-fit/pipeline/fetch_gate.mjs';
const region = refetchGate.slice(0, refetchGate.indexOf('const j = $json'));
const ng = new Function(region + '\nreturn { classifyFetch, statusFor };')();
const checks = [[{extUrls:'',markdown:''},'no_link'],[{extUrls:'x',markdown:'Just a moment...\nRay ID: 8'},'blocked'],[{extUrls:'x',markdown:'x'},'thin'],[{extUrls:'x',markdown:'Work with me: 12-week group coaching program helps founders reclaim time. Join the waitlist. Testimonials from 40+ clients. My signature framework taught over live calls and a private community. '.repeat(2)},'ok']];
let ok=0; for(const [i,w] of checks){ if(ng.classifyFetch(i).fetch_status===w && ref(i).fetch_status===w) ok++; else console.error('MISMATCH',w);}
console.error(`refetch gate region: ${ok}/${checks.length}`);
if(ok!==checks.length) process.exit(1);

const S = (x) => JSON.stringify(x);
const code = `import { workflow, node, trigger, newCredential, expr } from '@n8n/workflow-sdk';

const start = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Run Re-fetch', position: [-200, 300] },
  output: [{}]
});

const readSheet = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Read Work Sheet',
    position: [40, 300],
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: { __rl: true, mode: 'id', value: '1gZu5OuMhZ4kBfCPGNlsj09d07dtvkVsfQ2yk8u5252o' },
      sheetName: { __rl: true, mode: 'name', value: 'Untitled' },
      options: { returnAllMatches: 'returnAllMatches' }
    },
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account', 'ewwwXdsL265lcGnq') }
  },
  output: [{ row_key: '123', ext_urls: 'https://x.co', status: 'needs_deep_fetch' }]
});

const filterQueue = node({
  type: 'n8n-nodes-base.filter',
  version: 2.3,
  config: {
    name: 'Only Deep-Fetch Queue',
    position: [260, 300],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        combinator: 'and',
        conditions: [
          { leftValue: expr('{{ $json.status }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'needs_deep_fetch' },
          { leftValue: expr('{{ $json.ext_urls }}'), operator: { type: 'string', operation: 'notEmpty' } }
        ]
      }
    }
  },
  output: [{ row_key: '123', ext_urls: 'https://x.co', status: 'needs_deep_fetch' }]
});

const capCalls = node({
  type: 'n8n-nodes-base.limit',
  version: 1,
  config: { name: 'Cap Re-fetch', position: [480, 300], parameters: { maxItems: 200 } },
  output: [{ row_key: '123', ext_urls: 'https://x.co' }]
});

const firecrawl = node({
  type: '@mendable/n8n-nodes-firecrawl.firecrawl',
  version: 1,
  config: {
    name: 'Firecrawl Re-fetch',
    position: [700, 300],
    onError: 'continueRegularOutput',
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 2500,
    parameters: {
      resource: 'Scraping',
      operation: 'scrape',
      url: expr('{{ $json.ext_urls }}'),
      requestOptions: { batching: { batch: { batchSize: 1, batchInterval: 1000 } } }
    },
    credentials: { firecrawlApi: newCredential('Firecrawl BerryNova', 'SWCB5NyKsCIYJAJM') }
  },
  output: [{ data: { markdown: 'Work with me...', metadata: { statusCode: 200 } } }]
});

const joinRowFetch = node({
  type: 'n8n-nodes-base.merge',
  version: 3.2,
  config: { name: 'Join Row + Fetch', position: [820, 460], parameters: { mode: 'combine', combineBy: 'combineByPosition', numberInputs: 2 } },
  output: [{ row_key: '123', ext_urls: 'https://x.co', data: { markdown: 'Work with me...', metadata: { statusCode: 200 } } }]
});

const gate = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Re-fetch Gate', position: [940, 300], parameters: { mode: 'runOnceForEachItem', language: 'javaScript', jsCode: ${S(refetchGate)} } },
  output: [{ row_key: '123', fetched_content: 'Work with me...', fetch_status: 'ok', fetch_note: '', fetched_at: '2026-08-26T00:00:00.000Z', source: 'firecrawl', status: 'to_score' }]
});

const writeBack = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Update Row',
    position: [1160, 300],
    onError: 'continueRegularOutput',
    parameters: {
      resource: 'sheet',
      operation: 'appendOrUpdate',
      documentId: { __rl: true, mode: 'id', value: '1gZu5OuMhZ4kBfCPGNlsj09d07dtvkVsfQ2yk8u5252o' },
      sheetName: { __rl: true, mode: 'name', value: 'Untitled' },
      columns: {
        mappingMode: 'autoMapInputData',
        matchingColumns: ['row_key'],
        value: {},
        schema: [
          { id: 'row_key', displayName: 'row_key', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'fetched_content', displayName: 'fetched_content', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'fetch_status', displayName: 'fetch_status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'fetch_note', displayName: 'fetch_note', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'fetched_at', displayName: 'fetched_at', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'source', displayName: 'source', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false }
        ]
      },
      options: { handlingExtraData: 'ignoreIt' }
    },
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account', 'ewwwXdsL265lcGnq') }
  },
  output: [{ row_key: '123', status: 'to_score' }]
});

export default workflow('bn-refetch', 'BN Refetch Deep-Fetch Queue')
  .add(start)
  .to(readSheet)
  .to(filterQueue)
  .to(capCalls)
  .to(firecrawl)
  .add(capCalls.to(joinRowFetch.input(0)))
  .add(firecrawl.to(joinRowFetch.input(1)))
  .add(joinRowFetch.to(gate))
  .add(gate.to(writeBack));
`;
console.log(code);
