import { workflow, node, trigger, newCredential, expr } from '@n8n/workflow-sdk';

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
  config: { name: 'Re-fetch Gate', position: [940, 300], parameters: { mode: 'runOnceForEachItem', language: 'javaScript', jsCode: "const THIN_FLOOR = 200;\nconst HTTP_BLOCK = [401, 403, 429];\nconst BLOCK_MARKERS = [\n  /recaptcha/i, /i'?m not a robot/i, /captcha/i,\n  /just a moment\\.\\.\\./i, /attention required/i, /checking your browser/i,\n  /cf-browser-verification/i, /\\bray id\\b/i, /cloudflare/i,\n  /enable javascript to (?:run|view|continue)/i, /please enable javascript/i,\n  /access denied/i, /you have been blocked/i, /rate limit/i,\n];\nconst LOGIN_MARKERS = [\n  /log in to continue/i, /sign in to continue/i, /log in to (?:see|view)/i,\n  /this account is private/i, /account is private/i,\n  /you must log in/i, /login required/i, /create an account to (?:see|view)/i,\n];\nconst PARKED_MARKERS = [\n  /buy this domain/i, /domain is for sale/i, /this domain (?:is|may be) (?:for sale|parked)/i,\n  /parked (?:free )?courtesy of/i, /sedoparking/i, /hugedomains/i,\n  /the domain .{0,40} is (?:available|for sale)/i, /related searches/i,\n];\nconst CONSENT_MARKERS = [\n  /we value your privacy/i, /accept all cookies/i, /manage (?:your )?consent/i,\n  /this (?:site|website) uses cookies/i, /cookie preferences/i,\n];\nconst norm = (s) => String(s == null ? '' : s);\nconst nonWs = (s) => norm(s).replace(/\\s+/g, '').length;\nconst anyMatch = (s, list) => list.some((re) => re.test(s));\nfunction contentMinusConsent(md) {\n  return norm(md).split(/\\n+/).filter((line) => !anyMatch(line, CONSENT_MARKERS)).join('\\n');\n}\nfunction classifyFetch(o) {\n  o = o || {};\n  const hasLink = norm(o.extUrls).trim().length > 0;\n  if (!hasLink) return { fetch_status: 'no_link', fetch_note: 'no ext_urls' };\n  if (o.error) return { fetch_status: 'error', fetch_note: 'error: ' + String(o.error).slice(0, 120) };\n  if (typeof o.httpStatus === 'number' && o.httpStatus >= 500) return { fetch_status: 'error', fetch_note: 'http ' + o.httpStatus };\n  const md = norm(o.markdown);\n  if (typeof o.httpStatus === 'number' && HTTP_BLOCK.includes(o.httpStatus)) return { fetch_status: 'blocked', fetch_note: 'http ' + o.httpStatus };\n  if (anyMatch(md, BLOCK_MARKERS)) return { fetch_status: 'blocked', fetch_note: 'bot/js/cloudflare wall' };\n  if (anyMatch(md, LOGIN_MARKERS)) return { fetch_status: 'blocked', fetch_note: 'login/private wall' };\n  if (anyMatch(md, PARKED_MARKERS)) return { fetch_status: 'blocked', fetch_note: 'parked/for-sale domain' };\n  const real = nonWs(contentMinusConsent(md));\n  if (real < THIN_FLOOR) return { fetch_status: 'thin', fetch_note: real + ' chars' };\n  return { fetch_status: 'ok', fetch_note: '' };\n}\nfunction statusFor(fetch_status) {\n  return fetch_status === 'ok' || fetch_status === 'no_link' ? 'to_score' : 'needs_deep_fetch';\n}\nconst j = $json || {};\nconst fc = j.data || j;\nconst markdown = (fc && (fc.markdown || fc.content)) || j.markdown || '';\nconst meta = (fc && fc.metadata) || j.metadata || {};\nconst httpStatus = (typeof meta.statusCode === 'number') ? meta.statusCode : (typeof j.statusCode === 'number' ? j.statusCode : undefined);\nconst error = j.error || (j.success === false ? 'firecrawl error' : undefined);\nconst g = classifyFetch({ extUrls: j.ext_urls, httpStatus: httpStatus, markdown: markdown, error: error });\nreturn {\n  row_key: j.row_key,\n  fetched_content: String(markdown).slice(0, 45000),\n  fetch_status: g.fetch_status,\n  fetch_note: g.fetch_note,\n  fetched_at: $now.toISO(),\n  source: 'firecrawl',\n  status: statusFor(g.fetch_status)\n};" } },
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

