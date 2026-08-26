import { workflow, node, trigger, sticky, newCredential, expr } from '@n8n/workflow-sdk';

const scheduleTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Weekly Harvest',
    position: [-200, 300],
    parameters: { rule: { interval: [{ field: 'weeks', weeksInterval: 1, triggerAtDay: [1], triggerAtHour: 6, triggerAtMinute: 0 }] } }
  },
  output: [{}]
});

const readExisting = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Read Existing Rows',
    position: [40, 300],
    executeOnce: true,
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: { __rl: true, mode: 'id', value: '1gZu5OuMhZ4kBfCPGNlsj09d07dtvkVsfQ2yk8u5252o' },
      sheetName: { __rl: true, mode: 'name', value: 'Untitled' },
      options: { returnAllMatches: 'returnAllMatches' }
    },
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account', 'ewwwXdsL265lcGnq') }
  },
  output: [{ row_key: 'u:kiki_keysers', username: 'kiki_keysers' }]
});

const seeds = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Seeds', position: [260, 300], parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: "return [\n  { json: { seed: 'jasminestar' } },\n  { json: { seed: 'amyporterfield' } },\n  { json: { seed: 'brendonburchard' } }\n];" } },
  output: [{ seed: 'jasminestar' }, { seed: 'amyporterfield' }, { seed: 'brendonburchard' }]
});

const listPosts = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'List Posts',
    position: [480, 300],
    parameters: {
      method: 'GET',
      url: 'https://api.scrapecreators.com/v2/instagram/user/posts',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendQuery: true,
      queryParameters: { parameters: [{ name: 'handle', value: expr('{{ $json.seed }}') }] }
    },
    credentials: { httpHeaderAuth: newCredential('Header Auth account 2', 'oB8NBmiRktRjoNwk') }
  },
  output: [{ items: [{ id: '1', code: 'abc', product_type: 'carousel_container' }] }]
});

const tagPosts = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'Tag Posts With Seed',
    position: [700, 300],
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: { assignments: [{ id: 'a1', name: 'seed', value: expr('{{ $(\'Seeds\').item.json.seed }}'), type: 'string' }] }
    }
  },
  output: [{ seed: 'jasminestar', items: [{ id: '1', code: 'abc', product_type: 'carousel_container' }] }]
});

const flattenPosts = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Flatten Posts', position: [920, 300], parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: "const CAP = 8;\nconst bySeed = {};\nconst out = [];\nfor (const it of $input.all()) {\n  const j = it.json || {};\n  const seed = j.seed || '';\n  let posts = j.items || j.posts || (j.data && (j.data.items || j.data.posts)) || [];\n  if (!Array.isArray(posts)) posts = [];\n  for (const p of posts) {\n    const productType = p.product_type || (p.media && p.media.product_type) || '';\n    if (productType === 'clips') continue;\n    bySeed[seed] = (bySeed[seed] || 0);\n    if (bySeed[seed] >= CAP) continue;\n    bySeed[seed]++;\n    const code = p.code || p.shortcode || (p.media && p.media.code) || '';\n    const postId = p.id || p.pk || (p.media && p.media.id) || code;\n    out.push({ json: { seed: seed, post_id: String(postId), post_code: String(code) } });\n  }\n}\nreturn out;" } },
  output: [{ seed: 'jasminestar', post_id: '1', post_code: 'abc' }]
});

const listComments = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'List Comments',
    position: [1140, 300],
    parameters: {
      method: 'GET',
      url: 'https://api.scrapecreators.com/v2/instagram/post/comments',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendQuery: true,
      queryParameters: { parameters: [{ name: 'url', value: expr('https://www.instagram.com/p/{{ $json.post_code }}/') }] }
    },
    credentials: { httpHeaderAuth: newCredential('Header Auth account 2', 'oB8NBmiRktRjoNwk') }
  },
  output: [{ comments: [{ user: { username: 'coach_jane' }, text: 'I need this, how do I join your program?' }] }]
});

const tagComments = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'Tag Comments With Post',
    position: [1360, 300],
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: { assignments: [
        { id: 'b1', name: 'seed', value: expr('{{ $(\'Flatten Posts\').item.json.seed }}'), type: 'string' },
        { id: 'b2', name: 'post_id', value: expr('{{ $(\'Flatten Posts\').item.json.post_id }}'), type: 'string' }
      ] }
    }
  },
  output: [{ seed: 'jasminestar', post_id: '1', comments: [{ user: { username: 'coach_jane' }, text: 'I need this, how do I join your program?' }] }]
});

const flattenCommenters = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Classify + Dedupe Commenters', position: [1580, 300], parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: "const CAP_PER_POST = 150;\nconst existing = {};\nconst rex = $('Read Existing Rows').all();\nfor (const r of rex) {\n  const uname = (r.json && r.json.username) ? String(r.json.username).toLowerCase() : '';\n  if (uname) existing[uname] = true;\n}\nconst seen = {};\nconst perPost = {};\nconst out = [];\nfor (const it of $input.all()) {\n  const j = it.json || {};\n  const seed = j.seed || '';\n  const postId = j.post_id || '';\n  let comments = j.comments || j.items || (j.data && (j.data.comments || j.data.items)) || [];\n  if (!Array.isArray(comments)) comments = [];\n  for (const c of comments) {\n    const user = (c.user && c.user.username) || c.username || '';\n    if (!user) continue;\n    perPost[postId] = (perPost[postId] || 0);\n    if (perPost[postId] >= CAP_PER_POST) break;\n    perPost[postId]++;\n    const key = String(user).toLowerCase();\n    if (seen[key]) continue;\n    if (existing[key]) continue;\n    seen[key] = true;\n    const text = c.text || c.comment || '';\n    const words = String(text).trim().split(/\\s+/).filter(Boolean);\n    let sourceType = 'keyword_bait';\n    if (words.length >= 4) sourceType = 'organic';\n    else if (/[@]|amazing|thank|love|need this|obsessed/i.test(text)) sourceType = 'personal';\n    out.push({ json: { username: user, comment_text: text, best_comment: text, seed: seed, post_id: postId, source_type: sourceType } });\n  }\n}\nreturn out;" } },
  output: [{ username: 'coach_jane', comment_text: 'I need this, how do I join your program?', best_comment: 'I need this, how do I join your program?', seed: 'jasminestar', post_id: '1', source_type: 'organic' }]
});

const limitCalls = node({
  type: 'n8n-nodes-base.limit',
  version: 1,
  config: { name: 'Cap Profile Calls', position: [1800, 300], parameters: { maxItems: 300 } },
  output: [{ username: 'coach_jane', seed: 'jasminestar', source_type: 'organic' }]
});

const profileEnrich = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Profile Enrich',
    position: [2020, 300],
    parameters: {
      method: 'GET',
      url: 'https://api.scrapecreators.com/v1/instagram/profile',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendQuery: true,
      queryParameters: { parameters: [{ name: 'handle', value: expr('{{ $json.username }}') }] }
    },
    credentials: { httpHeaderAuth: newCredential('Header Auth account 2', 'oB8NBmiRktRjoNwk') }
  },
  output: [{ pk: '17841400000000000', username: 'coach_jane', biography: 'Business coach for founders', external_url: 'https://coachjane.com', edge_followed_by: { count: 12000 }, full_name: 'Coach Jane', is_private: false, is_verified: false, category: 'Coach' }]
});

const buildRow = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Build Prospect Row', position: [2240, 300], parameters: { mode: 'runOnceForEachItem', language: 'javaScript', jsCode: "const p = $json || {};\nconst u = (p.data && p.data.user) || p.user || p || {};\nconst ctx = $('Classify + Dedupe Commenters').item.json || {};\nconst username = u.username || ctx.username || '';\nconst pk = u.pk || u.id || '';\nconst bio = u.biography || '';\nlet ext = u.external_url || '';\nif (!ext && Array.isArray(u.bio_links) && u.bio_links.length) ext = u.bio_links[0].url || '';\nconst followers = u.follower_count || (u.edge_followed_by && u.edge_followed_by.count) || '';\nconst fullName = u.full_name || '';\nconst bizCategory = u.category || u.category_name || '';\nconst priv = (u.is_private != null) ? u.is_private : false;\nconst verified = (u.is_verified != null) ? u.is_verified : false;\nconst rowKey = pk ? String(pk) : ('u:' + username);\nreturn {\n  row_key: rowKey,\n  username: username,\n  bio: bio,\n  ext_urls: ext,\n  followers: followers,\n  full_name: fullName,\n  biz_category: bizCategory,\n  private: priv,\n  verified: verified,\n  seed: ctx.seed || '',\n  source_type: ctx.source_type || '',\n  best_comment: ctx.best_comment || '',\n  run_id: $now.toFormat(\"yyyy-'W'WW\"),\n  harvested_at: $now.toISO()\n};" } },
  output: [{ row_key: '17841400000000000', username: 'coach_jane', bio: 'Business coach for founders', ext_urls: 'https://coachjane.com', followers: 12000, full_name: 'Coach Jane', biz_category: 'Coach', private: false, verified: false, seed: 'jasminestar', source_type: 'organic', best_comment: 'I need this', run_id: '2026-W34', harvested_at: '2026-08-24T06:00:00.000Z' }]
});

const firecrawlFetch = node({
  type: '@mendable/n8n-nodes-firecrawl.firecrawl',
  version: 1,
  config: {
    name: 'Firecrawl Fetch',
    position: [2460, 300],
    onError: 'continueRegularOutput',
    parameters: {
      resource: 'Scraping',
      operation: 'scrape',
      url: expr('{{ $json.ext_urls }}'),
      requestOptions: { batching: { batch: { batchSize: 1, batchInterval: 7000 } } }
    },
    credentials: { firecrawlApi: newCredential('Firecrawl BerryNova', 'SWCB5NyKsCIYJAJM') }
  },
  output: [{ data: { markdown: 'Work with me: 12-week group coaching program...', metadata: { statusCode: 200 } } }]
});

const joinRowFetch = node({
  type: 'n8n-nodes-base.merge',
  version: 3.2,
  config: {
    name: 'Join Row + Fetch',
    position: [2570, 460],
    parameters: { mode: 'combine', combineBy: 'combineByPosition', numberInputs: 2 }
  },
  output: [{ row_key: '17841400000000000', ext_urls: 'https://coachjane.com', data: { markdown: 'Work with me...', metadata: { statusCode: 200 } } }]
});

const fetchGate = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Fetch Gate', position: [2680, 300], parameters: { mode: 'runOnceForEachItem', language: 'javaScript', jsCode: "const THIN_FLOOR = 200;\nconst HTTP_BLOCK = [401, 403, 429];\nconst BLOCK_MARKERS = [\n  /recaptcha/i, /i'?m not a robot/i, /captcha/i,\n  /just a moment\\.\\.\\./i, /attention required/i, /checking your browser/i,\n  /cf-browser-verification/i, /\\bray id\\b/i, /cloudflare/i,\n  /enable javascript to (?:run|view|continue)/i, /please enable javascript/i,\n  /access denied/i, /you have been blocked/i, /rate limit/i,\n];\nconst LOGIN_MARKERS = [\n  /log in to continue/i, /sign in to continue/i, /log in to (?:see|view)/i,\n  /this account is private/i, /account is private/i,\n  /you must log in/i, /login required/i, /create an account to (?:see|view)/i,\n];\nconst PARKED_MARKERS = [\n  /buy this domain/i, /domain is for sale/i, /this domain (?:is|may be) (?:for sale|parked)/i,\n  /parked (?:free )?courtesy of/i, /sedoparking/i, /hugedomains/i,\n  /the domain .{0,40} is (?:available|for sale)/i, /related searches/i,\n];\nconst CONSENT_MARKERS = [\n  /we value your privacy/i, /accept all cookies/i, /manage (?:your )?consent/i,\n  /this (?:site|website) uses cookies/i, /cookie preferences/i,\n];\nconst norm = (s) => String(s == null ? '' : s);\nconst nonWs = (s) => norm(s).replace(/\\s+/g, '').length;\nconst anyMatch = (s, list) => list.some((re) => re.test(s));\nfunction contentMinusConsent(md) {\n  return norm(md).split(/\\n+/).filter((line) => !anyMatch(line, CONSENT_MARKERS)).join('\\n');\n}\nfunction classifyFetch(o) {\n  o = o || {};\n  const hasLink = norm(o.extUrls).trim().length > 0;\n  if (!hasLink) return { fetch_status: 'no_link', fetch_note: 'no ext_urls' };\n  if (o.error) return { fetch_status: 'error', fetch_note: 'error: ' + String(o.error).slice(0, 120) };\n  if (typeof o.httpStatus === 'number' && o.httpStatus >= 500) return { fetch_status: 'error', fetch_note: 'http ' + o.httpStatus };\n  const md = norm(o.markdown);\n  if (typeof o.httpStatus === 'number' && HTTP_BLOCK.includes(o.httpStatus)) return { fetch_status: 'blocked', fetch_note: 'http ' + o.httpStatus };\n  if (anyMatch(md, BLOCK_MARKERS)) return { fetch_status: 'blocked', fetch_note: 'bot/js/cloudflare wall' };\n  if (anyMatch(md, LOGIN_MARKERS)) return { fetch_status: 'blocked', fetch_note: 'login/private wall' };\n  if (anyMatch(md, PARKED_MARKERS)) return { fetch_status: 'blocked', fetch_note: 'parked/for-sale domain' };\n  const real = nonWs(contentMinusConsent(md));\n  if (real < THIN_FLOOR) return { fetch_status: 'thin', fetch_note: real + ' chars' };\n  return { fetch_status: 'ok', fetch_note: '' };\n}\nfunction statusFor(fetch_status) {\n  return fetch_status === 'ok' || fetch_status === 'no_link' ? 'to_score' : 'needs_deep_fetch';\n}\nconst j = $json || {};\nconst fc = j.data || j;\nconst markdown = (fc && (fc.markdown || fc.content)) || j.markdown || '';\nconst meta = (fc && fc.metadata) || j.metadata || {};\nconst httpStatus = (typeof meta.statusCode === 'number') ? meta.statusCode : (typeof j.statusCode === 'number' ? j.statusCode : undefined);\nconst error = j.error || (j.success === false ? 'firecrawl error' : undefined);\nconst g = classifyFetch({ extUrls: j.ext_urls, httpStatus: httpStatus, markdown: markdown, error: error });\nreturn {\n  row_key: j.row_key,\n  username: j.username,\n  bio: j.bio,\n  ext_urls: j.ext_urls,\n  followers: j.followers,\n  full_name: j.full_name,\n  biz_category: j.biz_category,\n  private: j.private,\n  verified: j.verified,\n  seed: j.seed,\n  source_type: j.source_type,\n  best_comment: j.best_comment,\n  run_id: j.run_id,\n  harvested_at: j.harvested_at,\n  fetched_content: String(markdown).slice(0, 45000),\n  fetch_status: g.fetch_status,\n  fetch_note: g.fetch_note,\n  fetched_at: $now.toISO(),\n  source: 'firecrawl',\n  status: statusFor(g.fetch_status)\n};" } },
  output: [{ row_key: '17841400000000000', username: 'coach_jane', ext_urls: 'https://coachjane.com', fetched_content: 'Work with me...', fetch_status: 'ok', fetch_note: '', fetched_at: '2026-08-24T06:00:05.000Z', source: 'firecrawl', status: 'to_score' }]
});

const writeRow = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Write Prospect Row',
    position: [2900, 300],
    onError: 'continueRegularOutput',
    parameters: {
      resource: 'sheet',
      operation: 'append',
      documentId: { __rl: true, mode: 'id', value: '1gZu5OuMhZ4kBfCPGNlsj09d07dtvkVsfQ2yk8u5252o' },
      sheetName: { __rl: true, mode: 'name', value: 'Untitled' },
      columns: {
        mappingMode: 'autoMapInputData',
        value: {},
        schema: [
          { id: 'row_key', displayName: 'row_key', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'username', displayName: 'username', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'run_id', displayName: 'run_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'harvested_at', displayName: 'harvested_at', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'bio', displayName: 'bio', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'ext_urls', displayName: 'ext_urls', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'fetched_content', displayName: 'fetched_content', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'fetch_status', displayName: 'fetch_status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'fetch_note', displayName: 'fetch_note', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'fetched_at', displayName: 'fetched_at', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'source', displayName: 'source', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false }
        ]
      },
      options: { handlingExtraData: 'insertInNewColumn', useAppend: true }
    },
    credentials: { googleSheetsOAuth2Api: newCredential('Google Sheets account', 'ewwwXdsL265lcGnq') }
  },
  output: [{ row_key: '17841400000000000', status: 'to_score' }]
});

const noteApi = sticky('## Response shapes — CONFIRMED on live run 2026-08-26\n1. Profile numeric id = `data.user.id` (Build Row reads via data.user.*).\n2. Posts under `items[]`; reels filtered by `product_type == clips`.\n3. Comments endpoint takes `url` (post URL) — works.\nStill TODO: posts/comments are single-page (`next_max_id`/`cursor` paging deferred).\nCaps: 8 posts/seed, 150 comments/post, 300 profile calls/run.', [listPosts, listComments, profileEnrich], { color: 3, position: [480, 60], width: 1760, height: 200 });

const noteGate = sticky('## Fetch gate = verbatim pipeline/fetch_gate.mjs\nclassifyFetch/statusFor pasted byte-identical (self-tested). Firecrawl runs continueRegularOutput; Build Row + Firecrawl are joined by a Merge (combine by position) so the gate reads row+fetch from its own $json (avoids the Firecrawl paired-item bug). Every fetch writes a row with a non-empty fetch_status (no silent blanks). Change the gate in the repo + re-run its test, never here.', [firecrawlFetch, joinRowFetch, fetchGate], { color: 4, position: [2460, 60], width: 440, height: 260 });

export default workflow('bn-harvest', 'BN Prospect Harvest')
  .add(scheduleTrigger)
  .to(readExisting)
  .to(seeds)
  .to(listPosts)
  .to(tagPosts)
  .to(flattenPosts)
  .to(listComments)
  .to(tagComments)
  .to(flattenCommenters)
  .to(limitCalls)
  .to(profileEnrich)
  .to(buildRow)
  .to(firecrawlFetch)
  .add(buildRow.to(joinRowFetch.input(0)))
  .add(firecrawlFetch.to(joinRowFetch.input(1)))
  .add(joinRowFetch.to(fetchGate))
  .add(fetchGate.to(writeRow))
  .add(noteApi)
  .add(noteGate);

