// satsang-search: the enquiry lens Worker (search/README.md; spec ../wiser-search-index/SERVE-SPEC.md).
// GET /search  /similar  /health. Returns ids and scores only; the browser joins titles/labels from the catalogue it already has.
// Free plan only: Workers AI @cf/baai/bge-small-en-v1.5 (pooling 'cls', parity 1.0 with the local index) for the query vector,
// KV (versioned keys) for the index. No transcript text is stored or served here: vectors, ids, timestamps, facets and
// metadata-only BM25 postings (titles/teacher/topics), nothing else.
import { makeSet, knn, scanAll, facetsFromBin, facetDf, chips, similar } from './search-core.mjs'

const MODEL = '@cf/baai/bge-small-en-v1.5'
const PREFIX = 'Represent this sentence for searching relevant passages: '
const CONF_FLOOR = 0.66, WATCH_FLOOR = 0.66
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-max-age': '86400' }
const FIELDS = { teacher: 0, topic: 1, tradition: 2, series: 3 }

let I = null, checkedAt = 0, loading = null

async function kvBuf(env, ver, name) { return env.IDX.get(`idx/${ver}/${name}`, { type: 'arrayBuffer', cacheTtl: 3600 }) }
async function kvJson(env, ver, name) { return env.IDX.get(`idx/${ver}/${name}`, { type: 'json', cacheTtl: 3600 }) }
async function kvText(env, ver, name) { return env.IDX.get(`idx/${ver}/${name}`, { type: 'text', cacheTtl: 3600 }) }

async function build(env, ver) {
  const [tb, tv, tids, fb, fd, sv, sids, pv, pids, gb, gbits, gids, bm, vocab, meta] = await Promise.all([
    kvBuf(env, ver, 'talks.bits'), kvBuf(env, ver, 'talks.vectors'), kvText(env, ver, 'talks.ids'), kvBuf(env, ver, 'talks.facets'), kvJson(env, ver, 'talks.facets.dict'),
    kvBuf(env, ver, 'series.vectors'), kvJson(env, ver, 'series.ids'), kvBuf(env, ver, 'practices.vectors'), kvJson(env, ver, 'practices.ids'),
    kvBuf(env, ver, 'passages.vectors'), kvBuf(env, ver, 'passages.bits'), kvJson(env, ver, 'passages.ids'),
    kvBuf(env, ver, 'talks.bm25'), kvText(env, ver, 'talks.bm25.vocab'), kvJson(env, ver, 'meta')])
  if (!tb || !tv || !tids || !fb || !fd) throw new Error('index incomplete for ' + ver)
  const ids = tids.split('\n')
  const talks = makeSet({ bits: tb, vectors: tv, ids })
  const F = facetsFromBin(fb, fd), df = facetDf(F)
  // held / red-flag teachers (meta.held: speaker ids): their talks never surface here
  const heldV = new Set((meta?.held || []).map((s) => fd.dict.teacher.indexOf(s)).filter((v) => v >= 0))
  const blocked = new Uint8Array(talks.n)
  for (let i = 0; i < talks.n; i++) for (let j = F.off[0][i]; j < F.off[0][i + 1]; j++) if (heldV.has(F.val[0][j])) blocked[i] = 1
  const out = { ver, talks, F, df, blocked, meta: meta || {}, heldV }
  if (sv && sids) out.series = makeSet({ bits: new ArrayBuffer(0), vectors: sv, ids: sids })
  if (pv && pids) out.practices = makeSet({ bits: new ArrayBuffer(0), vectors: pv, ids: pids })
  if (gb && gbits && gids) out.passages = makeSet({ bits: gbits, vectors: gb, ids: gids.map((x, i) => i) }), out.pIds = gids
  if (bm && vocab) {  // BM25: header uint32 [T, P, N]; len uint16[N] (padded to 4); off uint32[T+1]; row uint32[P]; tf uint8[P]
    const h = new Uint32Array(bm, 0, 3), T = h[0], P = h[1], N = h[2]
    let o = 12; const len = new Uint16Array(bm, o, N); o += N * 2 + ((-(N * 2)) & 3)
    const off = new Uint32Array(bm, o, T + 1); o += (T + 1) * 4
    const row = new Uint32Array(bm, o, P); o += P * 4
    const tf = new Uint8Array(bm, o, P)
    let sum = 0; for (let i = 0; i < N; i++) sum += len[i]
    const terms = vocab.split('\n'), map = new Map(); for (let t = 0; t < terms.length; t++) map.set(terms[t], t)
    out.bm = { T, N, len, off, row, tf, avg: sum / Math.max(1, N), map }
  }
  return out
}

async function load(env) {
  const now = Date.now()
  if (I && now - checkedAt < 300000) return I
  if (loading) return loading
  loading = (async () => {
    try {
      const ver = await env.IDX.get('idx/current', { cacheTtl: 300 })
      checkedAt = Date.now()
      if (!ver) throw new Error('no idx/current')
      if (!I || I.ver !== ver) I = await build(env, ver)
      return I
    } finally { loading = null }
  })()
  return loading
}

// tokenizer = scripts/tok.py (index and query must match)
const STOP = new Set('a an the and or but of to in on at for with is are was were be been being it its this that these those i you he she we they me my your our their his her them us as by from not no so if then than there here what which who whom whose when where why how all any some can could would should will shall may might must do does did done have has had having just very also into out up down over about more most such only own same too s t don now one get got go going know like really yeah okay um uh right well see say said thing things way kind sort actually'.split(' '))
const TOK = /[a-zA-Zāīūṛṝḷḹṅñṭḍṇśṣḥṃ']+/g
const tokens = (t) => (String(t).match(TOK) || []).filter((w) => w.length > 2 && !STOP.has(w.toLowerCase())).map((w) => w.replace(/^'+|'+$/g, '').toLowerCase())

function bm25(B, q, allow, n = 100, k1 = 1.2, b = 0.75) {
  const sc = new Map()
  for (const w of new Set(tokens(q))) {
    const t = B.map.get(w); if (t == null) continue
    const a = B.off[t], z = B.off[t + 1], dfn = z - a, idf = Math.log(1 + (B.N - dfn + 0.5) / (dfn + 0.5))
    for (let j = a; j < z; j++) { const i = B.row[j]; if (allow && !allow(i)) continue; const f = B.tf[j]; sc.set(i, (sc.get(i) || 0) + idf * f * (k1 + 1) / (f + k1 * (1 - b + b * B.len[i] / B.avg))) }
  }
  return [...sc].sort((x, y) => y[1] - x[1]).slice(0, n)
}

function facetRows(F, f, v) { const m = new Uint8Array(F.n), a = F.off[f], V = F.val[f]; for (let i = 0; i < F.n; i++) for (let j = a[i]; j < a[i + 1]; j++) if (V[j] === v) { m[i] = 1; break } return m }
function allowFrom(u, X) {
  const masks = []
  for (const [name, f] of Object.entries(FIELDS)) {
    const id = u.searchParams.get(name); if (!id) continue
    const v = X.F.dict[name].indexOf(id); if (v < 0) return () => false
    masks.push(facetRows(X.F, f, v))
  }
  return (i) => !X.blocked[i] && masks.every((m) => m[i])
}
const dot = (S, row, q) => { let s = 0; const o = row * S.dims; for (let d = 0; d < S.dims; d++) s += S.vec[o + d] * q[d]; return s / S.scale }
const r3 = (x) => Math.round(x * 1000) / 1000

async function embed(env, q) {
  const e = await env.AI.run(MODEL, { text: [PREFIX + q], pooling: 'cls' })
  const v = e?.data?.[0]; if (!v || v.length !== 384) throw new Error('bad embedding')
  return Float32Array.from(v)
}

async function search(u, env, X) {
  const q = (u.searchParams.get('q') || '').replace(/\s+/g, ' ').trim().slice(0, 200)
  const scope = u.searchParams.get('scope') || 'all'
  const k = Math.max(1, Math.min(40, Number(u.searchParams.get('k')) || 40))
  if (!q) return { q, ver: X.ver, conf: null, degraded: null, talks: [], chips: [], similar: [], watch: [], series: [], practices: [] }
  const allow = allowFrom(u, X)
  let qv = null, degraded = null
  try { qv = await embed(env, q) } catch (e) { degraded = 'lexical' }
  const sem = qv ? knn(X.talks, qv, { k: 100, cand: 500, allow }) : []
  const lex = X.bm ? bm25(X.bm, q, allow, 100) : []
  const conf = sem.length ? r3(sem.slice(0, 3).reduce((s, h) => s + h.score, 0) / Math.min(3, sem.length)) : null
  // RRF: semantic 1.0, BM25 0.7, k=60 (hybrid best-or-tied on 9/10 eval queries)
  const fused = new Map(), semOf = new Map(sem.map((h) => [h.row, h.score]))
  sem.forEach((h, r) => fused.set(h.row, (fused.get(h.row) || 0) + 1 / (60 + r)))
  lex.forEach(([i], r) => fused.set(i, (fused.get(i) || 0) + 0.7 / (60 + r)))
  const order = [...fused].sort((a, b) => b[1] - a[1])
  const talks = order.slice(0, k).map(([row, s]) => ({ clip: X.talks.ids[row], score: r3(s * 60), sem: semOf.has(row) ? r3(semOf.get(row)) : (qv ? r3(dot(X.talks, row, qv)) : null), lex: lex.some(([i]) => i === row) ? 1 : 0 }))
  const out = { q, ver: X.ver, conf, degraded, talks, chips: [], similar: [], watch: [], series: [], practices: [], anchor: 'talks' }
  if (!qv) return out
  if (X.series && (scope === 'all' || scope === 'series' || scope === 'practices')) out.series = scanAll(X.series, qv).slice(0, 6).map((h) => ({ id: h.id, score: r3(h.score) }))
  if (X.practices && (scope === 'all' || scope === 'practices')) out.practices = scanAll(X.practices, qv).slice(0, 8).map((h) => ({ id: h.id, score: r3(h.score) }))
  // anchor hits for chips + similar: the top talks, or (low confidence) the talks of the best-matching series
  let hits = order.slice(0, 8).map(([row]) => ({ row, id: X.talks.ids[row], score: semOf.get(row) ?? dot(X.talks, row, qv) }))
  if (conf != null && conf < CONF_FLOOR) for (const s of out.series.slice(0, 3)) {  // the best series that has talks in the index
    const v = X.F.dict.series.indexOf(s.id); if (v < 0) continue
    const m = facetRows(X.F, 3, v), rows = []
    for (let i = 0; i < X.talks.n; i++) if (m[i] && !X.blocked[i]) rows.push({ row: i, id: X.talks.ids[i], score: dot(X.talks, i, qv) })
    if (rows.length >= 2) { hits = rows.sort((a, b) => b.score - a.score).slice(0, 8); out.anchor = 'series:' + s.id; break }
  }
  if (scope === 'all' || scope === 'talks' || scope === 'teachers') {
    const ch = hits.length ? chips(X.F, hits, 10, X.df).filter((c) => !(c.f === 0 && X.heldV.has(c.v))) : []
    out.chips = ch.map((c) => ({ type: c.type, id: c.id, score: r3(c.score) }))
    if (ch.length) {
      const shown = new Set(order.slice(0, 8).map(([r]) => r)); hits.forEach((h) => shown.add(h.row))
      for (let i = 0; i < X.talks.n; i++) if (X.blocked[i]) shown.add(i)
      out.similar = similar(X.talks, X.F, hits, qv, ch, 8, shown).map((h) => ({ clip: h.id, score: r3(h.score), via: h.via }))
    }
  }
  if (X.passages && (scope === 'all' || scope === 'watch')) {
    const P = knn(X.passages, qv, { k: 40, cand: 400 }), perV = new Map(), perT = new Map()
    for (const h of P) {
      if (h.score < WATCH_FLOOR || out.watch.length >= 8) break
      const [yt, clip, start, end, approx] = X.pIds[h.row], row = X.talks.row.get(clip) ?? X.talks.row.get(yt)
      if (row == null || X.blocked[row]) continue  // only moments of talks in the catalogue, never held teachers
      const t = X.F.off[0][row] < X.F.off[0][row + 1] ? X.F.val[0][X.F.off[0][row]] : -1
      if ((perV.get(yt) || 0) >= 2 || (t >= 0 && (perT.get(t) || 0) >= 3)) continue
      perV.set(yt, (perV.get(yt) || 0) + 1); if (t >= 0) perT.set(t, (perT.get(t) || 0) + 1)
      out.watch.push({ yt, clip: X.talks.ids[row], start: Math.round(start), end: Math.round(end), approx: approx ? 1 : 0, score: r3(h.score) })
    }
  }
  return out
}

function similarTo(u, X) {
  const clip = u.searchParams.get('clip') || '', row = X.talks.row.get(clip)
  const k = Math.max(1, Math.min(24, Number(u.searchParams.get('k')) || 8))
  if (row == null) return { clip, ver: X.ver, error: 'unknown clip', similar: [] }
  let mask = null; const within = u.searchParams.get('within') || ''
  const m = within.match(/^(teacher|topic|tradition|series):(.+)$/)
  if (m) { const v = X.F.dict[m[1]].indexOf(m[2]); if (v < 0) return { clip, ver: X.ver, within, similar: [] }; mask = facetRows(X.F, FIELDS[m[1]], v) }
  const q = new Float32Array(X.talks.dims); for (let d = 0; d < q.length; d++) q[d] = X.talks.vec[row * q.length + d] / X.talks.scale
  const yt = clip.split('@')[0]
  const res = knn(X.talks, q, { k, cand: 500, allow: (i) => i !== row && !X.blocked[i] && (!mask || mask[i]) && X.talks.ids[i].split('@')[0] !== yt })
  return { clip, ver: X.ver, within: within || null, similar: res.map((h) => ({ clip: h.id, score: r3(h.score) })) }
}

// per-isolate token bucket: protects the free neuron allocation
const BUCKET = new Map()
function limited(ip) {
  const now = Date.now(), b = BUCKET.get(ip) || { t: now, n: 30 }
  b.n = Math.min(30, b.n + (now - b.t) / 2000); b.t = now
  if (b.n < 1) { BUCKET.set(ip, b); return true }
  b.n -= 1; BUCKET.set(ip, b); if (BUCKET.size > 5000) BUCKET.clear()
  return false
}
const json = (o, s = 200, extra = {}) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', ...CORS, ...extra } })

export default {
  async fetch(req, env, ctx) {
    const u = new URL(req.url)
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
    if (req.method !== 'GET') return json({ error: 'GET only' }, 405)
    let X
    try { X = await load(env) } catch (e) { return json({ error: 'index unavailable', detail: String(e.message || e) }, 503) }
    if (u.pathname === '/health') return json({ ok: true, ver: X.ver, model: MODEL, pooling: 'cls', counts: { talks: X.talks.n, series: X.series?.n || 0, practices: X.practices?.n || 0, passages: X.passages?.n || 0, bm25Terms: X.bm?.T || 0, held: X.heldV.size, blockedTalks: X.blocked.reduce((s, x) => s + x, 0) }, built: X.meta.built || null })
    if (u.pathname !== '/search' && u.pathname !== '/similar') return json({ error: 'not found', endpoints: ['/search?q=', '/similar?clip=', '/health'] }, 404)
    // cache key: normalised params + index version
    const p = new URLSearchParams(); for (const key of ['q', 'scope', 'k', 'teacher', 'topic', 'tradition', 'series', 'clip', 'within']) { const v = u.searchParams.get(key); if (v) p.set(key, key === 'q' ? v.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 200) : v) }
    const ck = new Request(`https://satsang-search.cache${u.pathname}?${p}&v=${encodeURIComponent(X.ver)}`)
    const cache = caches.default, hit = await cache.match(ck)
    if (hit) { const r = new Response(hit.body, hit); r.headers.set('x-cache', 'hit'); return r }
    if (limited(req.headers.get('cf-connecting-ip') || 'x')) return json({ error: 'slow down' }, 429, { 'retry-after': '10' })
    const body = u.pathname === '/search' ? await search(u, env, X) : similarTo(u, X)
    const res = json(body, 200, { 'cache-control': 'public, max-age=3600', 'x-cache': 'miss' })
    if (!body.degraded) ctx.waitUntil(cache.put(ck, res.clone()))
    return res
  },
}
