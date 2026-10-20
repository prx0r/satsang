#!/usr/bin/env node
// Local end-to-end test: starts the HTTP server on a free port and speaks MCP JSON-RPC to it like a client would.
// node test.mjs   (exit 1 on any failure)
import fs from 'node:fs'
import http from 'node:http'
import { buildIndex, makeFetch } from './src/core.mjs'

const data = JSON.parse(fs.readFileSync(new URL('data/wiser.json', import.meta.url), 'utf8'))
const rdT = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8')
const llms = rdT('discovery/llms.txt')
import { run as clientRun } from './test-client.mjs'
const t0 = Date.now(); const ctx = buildIndex(data); const indexMs = Date.now() - t0
const handler = makeFetch(ctx, { discovery: { llms, llmsFull: rdT('discovery/llms-full.txt'), mcpJson: JSON.parse(rdT('discovery/mcp.json')) }, allowOrigin: (o) => /tantrafiles\.xyz|openai\.com|localhost|127\.0\.0\.1/.test(o) })
const server = http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c)
  const ac = new AbortController(); res.on('close', () => ac.abort())
  const r = await handler(new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers: req.headers, signal: ac.signal, body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : Buffer.concat(chunks) }))
  res.writeHead(r.status, Object.fromEntries(r.headers))
  if (!r.body) return res.end()
  const rd = r.body.getReader(); req.on('close', () => rd.cancel().catch(() => {}))
  for (;;) { const { value, done } = await rd.read(); if (done) break; res.write(value) } res.end()
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`
let id = 0, fails = 0
const rpc = async (method, params, extraHeaders = {}) => {
  const r = await fetch(base + '/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-06-18', ...extraHeaders }, body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }) })
  return { status: r.status, body: r.status === 202 ? null : await r.json() }
}
const call = async (name, args) => { const t = Date.now(); const r = await rpc('tools/call', { name, arguments: args }); return { ...r.body.result, ms: Date.now() - t } }
const check = (label, cond, info = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${info ? '  — ' + info : ''}`); if (!cond) fails++ }

const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'wiser-test', version: '0' } })
check('initialize', init.body.result?.serverInfo?.name === 'wiser' && init.body.result.protocolVersion === '2025-06-18', `index built in ${indexMs} ms`)
const note = await fetch(base + '/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) })
check('notification -> 202', note.status === 202)
const list = await rpc('tools/list', {})
const names = list.body.result.tools.map((t) => t.name)
check('tools/list has 7 tools', ['search', 'get_topic', 'get_teacher', 'get_lineage', 'list_practices', 'get_collection', 'recommend'].every((n) => names.includes(n)), names.join(', '))

let r = await call('search', { query: 'rebirth' })
check('search "rebirth" finds the topic', r.structuredContent.results.some((x) => x.id === 'topic/rebirth'), `${r.structuredContent.results.length} hits, ${r.ms} ms`)
r = await call('search', { query: 'ajahn chah', kinds: ['person'] })
check('search person "ajahn chah"', r.structuredContent.results[0]?.id === 'person/ajahn-chah', r.structuredContent.results.slice(0, 3).map((x) => x.id).join(', '))
r = await call('search', { query: 'Sivananda', kinds: ['place'] })
check('search place "Sivananda"', r.structuredContent.results.length > 0, r.structuredContent.results.slice(0, 2).map((x) => x.title).join(' | '))

r = await call('get_topic', { id: 'rebirth', talks: 12 })
const tp = r.structuredContent
const trads = new Set(tp.talks.map((c) => c.tradition)), spk = new Set(tp.talks.map((c) => c.speaker))
check('get_topic rebirth: intro + questions', !!tp.intro && tp.questions.length >= 5, `${tp.questions.length} questions`)
check('get_topic rebirth: 12 talks, diverse (MMR)', tp.talks.length === 12 && trads.size >= 5 && spk.size >= 9, `${trads.size} traditions, ${spk.size} teachers, ${r.ms} ms`)
check('get_topic rebirth: practices + texts + related', tp.practices.length > 0 && tp.texts.length > 0 && tp.related.length > 0, `${tp.practices.length} practices, ${tp.texts.length} texts, next: ${tp.related.slice(0, 3).map((x) => x.id).join(', ')}`)
r = await call('get_topic', { id: 'no-such-topic' })
check('get_topic unknown -> isError', r.isError === true)

r = await call('get_teacher', { id: 'thanissaro-bhikkhu', talks: 5 })
check('get_teacher thanissaro', r.structuredContent.name === 'Thanissaro Bhikkhu' && r.structuredContent.talks.length === 5, `${r.structuredContent.depth.clips} clips, ${r.structuredContent.relations.length} relations`)

r = await call('get_lineage', { id: 'thanissaro-bhikkhu', direction: 'up', hops: 5 })
const chain = r.structuredContent.nodes.map((n) => n.id)
check('get_lineage up from Thanissaro reaches Ajahn Mun', chain.includes('person/ajahn-mun'), chain.join(' <- '))
r = await call('get_lineage', { id: 'ajahn-chah', direction: 'down', hops: 2 })
check('get_lineage down from Ajahn Chah', r.structuredContent.edges.length > 0, r.structuredContent.nodes.map((n) => n.label).slice(0, 6).join(', '))

r = await call('list_practices', { topic: 'rebirth' })
check('list_practices topic=rebirth', r.structuredContent.total > 0 && r.structuredContent.practices[0].steps.length > 0, r.structuredContent.practices.map((p) => `${p.name} [${p.kind}]`).join('; '))
r = await call('get_collection', {})
const cid = r.structuredContent.collections[0]?.id
check('get_collection list', !!cid, r.structuredContent.collections.map((c) => c.id).join(', '))
r = await call('get_collection', { id: cid })
check('get_collection resolves items', r.structuredContent.units[0].items.every((i) => !i.resolved.missing))

r = await call('recommend', {})
check('recommend cold start: diverse', r.structuredContent.coldStart && new Set(r.structuredContent.talks.map((c) => c.tradition)).size >= 5, r.structuredContent.talks.map((c) => c.speakerName).join(', '))
const liked = Object.values(data.clip).filter((c) => c.speaker === 'rupert-spira' && c.inBallot).slice(0, 3).map((c) => c.id)
r = await call('recommend', { liked, k: 8 })
const top = r.structuredContent.talks
check('recommend from 3 Spira clips: personalised but not all Spira', top.length === 8 && top.filter((c) => c.speaker === 'rupert-spira').length <= 2, `${top.map((c) => c.speakerName).join(', ')} | next topics: ${r.structuredContent.nextTopics.map((t) => t.id).join(', ')} (${r.ms} ms)`)
check('recommend excludes liked', !top.some((c) => liked.includes(c.id)))

const bad = await rpc('tools/call', { name: 'nope', arguments: {} })
check('unknown tool -> JSON-RPC error', bad.body.error?.code === -32602)
const nf = await rpc('foo/bar', {})
check('unknown method -> -32601', nf.body.error?.code === -32601)
const evil = await fetch(base + '/mcp', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example' }, body: '{}' })
check('foreign Origin -> 403', evil.status === 403)
const g = await fetch(base + '/mcp')
check('GET /mcp -> 405 (stateless; SSE lives at /sse)', g.status === 405)
const lt = await fetch(base + '/llms.txt')
check('/llms.txt served', lt.status === 200 && (await lt.text()).startsWith('# Wiser'))
console.log('--- client test (test-client.mjs) against the local server ---')
fails += await clientRun(base)
// no transcript leakage: payload never carries transcript fields
check('no transcript fields in data', !JSON.stringify(data).includes('transcripts-internal') && !Object.values(data.clip).some((c) => 'transcript' in c))

server.closeAllConnections?.(); server.close()
console.log(fails ? `\n${fails} FAILED` : '\nall passed')
process.exit(fails ? 1 : 0)
