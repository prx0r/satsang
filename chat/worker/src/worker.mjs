// satsang-chat Worker: the curator chat endpoint (chat.tantrafiles.xyz). Deterministic: safety triage -> intent -> BM25 over
// Satsang's own catalog (data/catalog.json, built by chat/tools/build-catalog.mjs) -> an ordered pack. No external LLM unless
// LLM_PROVIDER=qwen and QWEN_API_KEY are set (llm.mjs), and then only to re-word the prose.
//   POST /curate        {message, device?}  -> NDJSON stream: meta, item*, prose (or prose deltas), pack, done   (?stream=0 -> JSON)
//   POST /packs         {message, device?}  -> re-runs the curator server-side and stores the pack (KV PACKS) -> {id, pack}
//   GET  /packs/<id>                         -> a saved pack
//   GET  /health                             -> catalog date, counts, llm on/off
import CATALOG from '../data/catalog.json'
import { createCurator, CURATOR_VERSION } from './curator.mjs'
import { createLLM, proseOK } from './llm.mjs'

const CUR = createCurator(CATALOG) // built once per isolate (startup), not per request
const ORIGINS = new Set(['https://tantrafiles.xyz', 'https://www.tantrafiles.xyz', 'https://satsang.digital', 'https://www.satsang.digital', 'http://127.0.0.1:8787', 'http://localhost:8787', 'http://127.0.0.1:8080', 'http://localhost:8080', 'https://engine.tantrafiles.xyz'])
const DEVICE = /^[A-Za-z0-9_-]{8,64}$/
const PACK_ID = /^ask-[a-z0-9]{4,24}$/
const MAX_BODY = 4000

function cors(req) {
  const o = req.headers.get('origin') || ''
  return { 'access-control-allow-origin': ORIGINS.has(o) ? o : 'https://tantrafiles.xyz', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type, x-wiser-device', 'access-control-max-age': '86400', vary: 'origin' }
}
const json = (req, body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...cors(req), ...extra } })

// per-isolate fallback bucket when the Rate Limiting bindings are absent (local dev)
const buckets = new Map()
function localLimit(key, limit, periodMs = 60000) {
  const now = Date.now(), b = buckets.get(key) || { n: 0, t: now }
  if (now - b.t > periodMs) { b.n = 0; b.t = now }
  b.n++; buckets.set(key, b)
  if (buckets.size > 5000) buckets.clear()
  return b.n <= limit
}
async function limited(env, req, device) {
  const ip = req.headers.get('cf-connecting-ip') || 'local'
  const ok1 = env.RL_IP ? (await env.RL_IP.limit({ key: 'ip:' + ip })).success : localLimit('ip:' + ip, 20)
  const ok2 = !device ? true : env.RL_DEVICE ? (await env.RL_DEVICE.limit({ key: 'dev:' + device })).success : localLimit('dev:' + device, 10)
  return !(ok1 && ok2)
}
async function readBody(req) {
  const t = await req.text(); if (t.length > MAX_BODY) return null
  try { return JSON.parse(t) } catch { return null }
}

function itemsOf(pack) { return [...pack.steps, ...pack.deeper] }

async function curateStream(req, env, msg, ctx) {
  const pack = CUR.curate(msg, ctx)
  const llm = createLLM(env)
  const enc = new TextEncoder(), { readable, writable } = new TransformStream(), w = writable.getWriter()
  const send = (o) => w.write(enc.encode(JSON.stringify(o) + '\n'))
  ;(async () => {
    try {
      await send({ type: 'meta', engine: CURATOR_VERSION, safety: pack.safety || null, blocked: !!pack.blocked, intent: pack.intent, title: pack.title, id: pack.id })
      if (!pack.blocked) for (const it of itemsOf(pack)) await send({ type: 'item', item: it })
      let prose = pack.prose
      if (llm && !pack.blocked && !pack.empty) {
        let out = ''
        try {
          for await (const d of llm.rewordProse(pack)) { out += d; if (out.length > 1200) break }
          if (proseOK(out, pack)) { prose = out.trim(); pack.proseBy = llm.name } // only an accepted rewrite replaces the template
        } catch (e) { pack.llmError = String(e?.message || e).slice(0, 60) }
      }
      pack.prose = prose
      await send({ type: 'prose', text: prose, by: pack.proseBy || 'template' })
      await send({ type: 'pack', pack })
      await send({ type: 'done' })
    } catch (e) { try { await send({ type: 'error', error: 'internal' }) } catch {} }
    try { await w.close() } catch {}
  })()
  return new Response(readable, { headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...cors(req) } })
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) })
    if (p === '/' || p === '/health') {
      return json(req, { ok: true, service: 'satsang-chat', engine: CURATOR_VERSION, catalog: CATALOG.built, counts: { topics: CATALOG.topics.length, talks: CATALOG.talks.length, practices: CATALOG.practices.length, readings: CATALOG.readings.length, places: CATALOG.places.length, collections: CATALOG.collections.length }, whyLines: CATALOG.whyLines || 0, llm: createLLM(env) ? 'qwen' : 'off', docs: 'POST /curate {message, device}' })
    }
    if (p === '/curate' && req.method === 'POST') {
      const b = await readBody(req); if (!b) return json(req, { error: 'bad_request' }, 400)
      const msg = String(b.message || '').trim(), device = DEVICE.test(String(b.device || '')) ? b.device : null
      if (!msg || msg.length > 600) return json(req, { error: 'message_required', max: 600 }, 400)
      if (await limited(env, req, device)) return json(req, { error: 'rate_limited', retry_s: 60 }, 429, { 'retry-after': '60' })
      const ctx = { country: req.cf?.country || null }
      if (url.searchParams.get('stream') === '0') return json(req, CUR.curate(msg, ctx))
      return curateStream(req, env, msg, ctx)
    }
    if (p === '/packs' && req.method === 'POST') {
      const b = await readBody(req); if (!b) return json(req, { error: 'bad_request' }, 400)
      const msg = String(b.message || '').trim(), device = DEVICE.test(String(b.device || '')) ? b.device : null
      if (!msg || msg.length > 600 || !device) return json(req, { error: 'message_and_device_required' }, 400)
      if (await limited(env, req, device)) return json(req, { error: 'rate_limited', retry_s: 60 }, 429, { 'retry-after': '60' })
      const pack = CUR.curate(msg, { country: req.cf?.country || null }) // the server rebuilds the pack: a saved pack only ever holds catalog items
      if (pack.blocked || !pack.id) return json(req, { error: 'not_saveable' }, 400)
      pack.saved = new Date().toISOString()
      if (env.PACKS) await env.PACKS.put(pack.id, JSON.stringify(pack), { metadata: { title: pack.title } })
      return json(req, { ok: true, id: pack.id, pack, stored: !!env.PACKS })
    }
    const m = p.match(/^\/packs\/([^/]+)$/)
    if (m && req.method === 'GET') {
      if (!PACK_ID.test(m[1])) return json(req, { error: 'bad_id' }, 400)
      const v = env.PACKS ? await env.PACKS.get(m[1]) : null
      if (!v) return json(req, { error: 'not_found' }, 404)
      return new Response(v, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300', ...cors(req) } })
    }
    return json(req, { error: 'not_found' }, 404)
  },
}
