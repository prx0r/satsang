#!/usr/bin/env node
// Black-box client test, the way ChatGPT / Claude / a Custom GPT talk to the server.
//   node test-client.mjs https://mcp.satsang.digital      (live)     node test-client.mjs http://127.0.0.1:8799 (local)
// Checks: Streamable HTTP handshake, tools/list (7 original + OpenAI search/fetch + directory tools), OpenAI result shapes,
// legacy SSE transport round trip, REST mirror + OpenAPI 3.1, CORS, discovery files.
import { BASE, MCP_BASE } from '../domain.mjs'
export async function run(base, { log = console.log } = {}) {
  let id = 0, fails = 0
  const check = (label, cond, info = '') => { log(`${cond ? 'PASS' : 'FAIL'}  ${label}${info ? '  \u2014 ' + info : ''}`); if (!cond) fails++ }
  const H = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }
  const rpc = async (method, params, h = {}) => { const r = await fetch(base + '/mcp', { method: 'POST', headers: { ...H, ...h }, body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }) }); return r.status === 202 ? null : r.json() }
  const call = async (name, args) => { const t = Date.now(); const r = await rpc('tools/call', { name, arguments: args }); return { r: r.result, ms: Date.now() - t, parsed: (() => { try { return JSON.parse(r.result.content[0].text) } catch { return null } })() } }

  const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'openai-mcp', version: '1.0.0' } })
  check('initialize (2025-06-18, no auth)', init?.result?.serverInfo?.name === 'satsang' && init.result.protocolVersion === '2025-06-18', init?.result?.serverInfo?.version)
  const old = await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'old', version: '0' } })
  check('initialize (2024-11-05 negotiates)', old?.result?.protocolVersion === '2024-11-05')
  const n = await fetch(base + '/mcp', { method: 'POST', headers: H, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) })
  check('notifications/initialized -> 202', n.status === 202)
  const tl = await rpc('tools/list', {}); const names = tl.result.tools.map((t) => t.name)
  const want = ['search', 'fetch', 'get_topic', 'get_teacher', 'get_lineage', 'list_practices', 'get_collection', 'recommend', 'find_places', 'get_place', 'find_teachers', 'get_resources', 'get_lineage_path', 'what_to_study']
  check(`tools/list has all ${want.length} tools`, want.every((x) => names.includes(x)), names.join(', '))
  check('every tool is annotated read-only', tl.result.tools.every((t) => t.annotations?.readOnlyHint === true))
  const st = tl.result.tools.find((t) => t.name === 'search'), ft = tl.result.tools.find((t) => t.name === 'fetch')
  check('search/fetch schemas: query / id required strings', st.inputSchema.required?.includes('query') && st.inputSchema.properties.query.type === 'string' && ft.inputSchema.required?.includes('id') && ft.inputSchema.properties.id.type === 'string')

  // OpenAI shapes
  let x = await call('search', { query: 'ajahn chah' })
  const res = x.parsed?.results || []
  check('search -> exactly {results:[{id,title,url}]} in content[0].text', Object.keys(x.parsed || {}).join() === 'results' && res.length > 0 && res.every((h) => Object.keys(h).sort().join() === 'id,title,url'), `${res.length} hits, first ${res[0]?.id}, ${x.ms} ms`)
  check('search result urls are canonical ' + BASE, res.every((h) => h.url.startsWith(BASE + '/') && /^[a-z]+\//.test(h.url.slice(BASE.length + 1))))
  x = await call('fetch', { id: res[0].id })
  const f = x.parsed
  check('fetch -> {id,title,text,url,metadata}', f && ['id', 'title', 'text', 'url', 'metadata'].every((k) => k in f) && f.text.length > 40, `${f?.title}; ${x.ms} ms`)
  check('fetch metadata has source_url, verified_on, confidence', !!(f?.metadata?.source_url && /^\d{4}-\d{2}-\d{2}$/.test(f.metadata.verified_on) && f.metadata.confidence))
  x = await call('fetch', { id: BASE + '/place/amaravati' })
  check('fetch by canonical URL (place)', x.parsed?.id === 'place/amaravati')
  x = await call('fetch', { id: 'nope/nothing' })
  check('fetch unknown -> isError', x.r.isError === true)

  // directory tools
  x = await call('find_places', { tradition: 'theravada', country: 'GB', offers: ['residential'] })
  check('find_places theravada GB residential', x.parsed.total > 0 && x.parsed.results.every((p) => p.country === 'GB' && p.url && p.source_url && p.verified_on && p.confidence), `${x.parsed.total}: ${x.parsed.results.slice(0, 3).map((p) => p.name).join('; ')}`)
  x = await call('find_places', { offers: ['sanskrit'] })
  check('find_places offers=sanskrit', x.parsed.total > 0, x.parsed.results.map((p) => p.name).slice(0, 3).join('; '))
  x = await call('find_places', { tradition: 'Tibetan Buddhism', region: 'europe', status: 'active' })
  check('find_places Tibetan / europe / active', x.parsed.total > 0, String(x.parsed.total))
  x = await call('get_place', { id: 'amaravati' })
  check('get_place: contact as published + programmes as_of', x.parsed.contact?.as_published && x.parsed.programmes.every((p) => p.as_of) && x.parsed.source_url && x.parsed.url === BASE + '/place/amaravati', `checked ${x.parsed.contact?.checked}, ${x.parsed.programmes.length} programmes`)
  x = await call('find_teachers', { tradition: 'thai-forest', living: true })
  check('find_teachers thai-forest living', x.parsed.total > 0 && x.parsed.results.every((p) => ['living', 'likely-living'].includes(p.living)), x.parsed.results.slice(0, 4).map((p) => p.name).join(', '))
  x = await call('get_resources', { tradition: 'theravada', free: true })
  check('get_resources theravada free', x.parsed.total > 0 && x.parsed.results.every((r) => r.access === 'free' && r.link && r.url.includes('/resource/')), `${x.parsed.total} free`)
  x = await call('get_lineage_path', { from: 'thanissaro-bhikkhu', to: 'ajahn-mun' })
  check('get_lineage_path Thanissaro -> Ajahn Mun', x.parsed.found && x.parsed.path.length >= 1, x.parsed.path?.map((s) => s.reads).join(' | '))
  x = await call('what_to_study', { tradition: 'thai-forest' })
  check('what_to_study thai-forest: 4 steps', x.parsed.path?.length === 4 && x.parsed.path[2].living.length > 0, x.parsed.path?.map((s) => s.title).join(' > '))
  x = await call('get_teacher', { id: 'person/thanissaro-bhikkhu', talks: 2 })
  check('legacy tool accepts search ids (person/<id>)', x.parsed?.name === 'Thanissaro Bhikkhu' && !!x.parsed.source_url)

  // legacy SSE transport
  try {
    const ac = new AbortController(); const sr = await fetch(base + '/sse', { headers: { accept: 'text/event-stream' }, signal: ac.signal })
    check('GET /sse -> text/event-stream', sr.ok && /event-stream/.test(sr.headers.get('content-type') || ''))
    const rd = sr.body.getReader(), dec = new TextDecoder(); let buf = '', endpoint = null
    const until = async (pred, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const m = pred(buf); if (m) return m; const { value, done } = await Promise.race([rd.read(), new Promise((r) => setTimeout(() => r({ value: null, done: false }), 500))]); if (done) break; if (value) buf += dec.decode(value, { stream: true }) } return pred(buf) }
    endpoint = (await until((b) => b.match(/event: endpoint\ndata: (\S+)/)))?.[1]
    check('SSE endpoint event', !!endpoint, endpoint || buf.slice(0, 120))
    if (endpoint) {
      const p = await fetch(new URL(endpoint, base), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 'sse-1', method: 'tools/call', params: { name: 'search', arguments: { query: 'zen' } } }) })
      check('POST /messages -> 202', p.status === 202)
      const msg = await until((b) => b.match(/event: message\ndata: (.+"id":"sse-1".+)\n/))
      check('reply arrives on the SSE stream', !!msg && JSON.parse(msg[1]).result?.content?.length > 0)
    }
    ac.abort()
  } catch (e) { check('SSE transport', false, e.message) }

  // REST + OpenAPI + CORS + discovery
  const oa = await (await fetch(base + '/openapi.json')).json()
  check('openapi.json is 3.1 with operationIds', oa.openapi === '3.1.0' && Object.values(oa.paths).every((p) => p.get?.operationId), `${Object.keys(oa.paths).length} paths`)
  let rr = await fetch(base + '/api/places?tradition=zen&country=JP&limit=3', { headers: { origin: 'https://chat.openai.com' } })
  const pj = await rr.json()
  check('REST /api/places + CORS *', rr.ok && rr.headers.get('access-control-allow-origin') === '*' && pj.results?.length > 0, pj.results?.map((p) => p.name).join('; '))
  rr = await fetch(base + '/api/search?q=karma&limit=3'); check('REST /api/search', rr.ok && (await rr.json()).results?.length > 0)
  rr = await fetch(base + '/api/study/kashmir-shaivism'); check('REST /api/study/{tradition}', rr.ok && (await rr.json()).path?.length === 4)
  rr = await fetch(base + '/api/places/no-such-place'); check('REST unknown id -> 404', rr.status === 404)
  rr = await fetch(base + '/api/records/person/ajahn-chah'); check('REST /api/records/{kind}/{id}', rr.ok && (await rr.json()).title === 'Ajahn Chah')
  const pre = await fetch(base + '/api/places', { method: 'OPTIONS', headers: { origin: 'https://example.org', 'access-control-request-method': 'GET' } })
  check('CORS preflight', pre.status === 204 && pre.headers.get('access-control-allow-origin') === '*')
  for (const p of ['/llms.txt', '/llms-full.txt', '/.well-known/mcp.json']) { const r = await fetch(base + p); check(`discovery ${p}`, r.ok, `${(await r.text()).length} bytes`) }
  return fails
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const base = (process.argv[2] || MCP_BASE).replace(/\/$/, '')
  const fails = await run(base)
  console.log(fails ? `\n${fails} FAILED against ${base}` : `\nall passed against ${base}`)
  process.exit(fails ? 1 : 0)
}
