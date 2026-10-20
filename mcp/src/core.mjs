// Satsang MCP server core: read-only, stateless, dependency-free. Implements MCP over Streamable HTTP (POST /mcp, JSON responses)
// for a Cloudflare Worker or Node (Web Fetch API Request/Response). Data = mcp/data/wiser.json (built by build-data.mjs).
import { quality, mmr, tasteFrom, affinity, nextTopics, familyOf, uncertainty } from './rank.mjs'
import { AGENT_TOOLS, callAgentTool, extendIndex, resourceDocs, canon, prov, titleOf, LICENSE } from './agents.mjs'
import { restHandler, openapi } from './rest.mjs'
import { KEEPER_TOOLS, keeperTool, ensureKeeper } from './keeper.mjs' // keeper: site health + maintenance queue (read-only)
import { BASE, HOST, SITE_URL_RE } from '../../domain.mjs'
const SITE_RE = new RegExp(SITE_URL_RE)

export const SERVER_INFO = { name: 'satsang', title: 'Satsang: an open directory of the wisdom traditions', version: '0.2.0', websiteUrl: BASE + '/agents' }
const PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05']
const SITE = BASE
const fold = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function buildIndex(data) {
  const ctx = { ...data }
  ctx.bySpeaker = new Map(); ctx.byTopic = new Map(); ctx.byTradition = new Map(); ctx.byFigure = new Map()
  const push = (m, k, v) => { if (!m.has(k)) m.set(k, []); m.get(k).push(v) }
  for (const c of Object.values(data.clip)) {
    push(ctx.bySpeaker, c.speaker, c)
    for (const f of c.figures) push(ctx.byFigure, f, c)
    for (const t of c.topics) { push(ctx.byTopic, t.id, c); if (t.id.includes('/')) push(ctx.byTopic, t.id.split('/')[0], c) }
    for (const tr of c.traditions) push(ctx.byTradition, tr, c)
  }
  // views percentile within each speaker's catalogue
  ctx.viewsPct = new Map()
  for (const list of ctx.bySpeaker.values()) {
    const s = list.slice().sort((a, b) => (a.views || 0) - (b.views || 0))
    s.forEach((c, i) => ctx.viewsPct.set(c.id, s.length > 1 ? i / (s.length - 1) : 0.5))
  }
  ctx.q = new Map(Object.values(data.clip).map((c) => [c.id, quality(c, ctx)]))
  // topic co-occurrence (lift, capped) and family mix per topic
  const cnt = new Map(), pair = new Map(); let N = 0
  ctx.topicFamilies = new Map()
  for (const c of Object.values(data.clip)) {
    const roots = [...new Set(c.topics.map((t) => t.id.split('/')[0]))]; N++
    const fam = familyOf(data.tradition, c.traditions[0])
    for (const r of roots) { cnt.set(r, (cnt.get(r) || 0) + 1); const f = ctx.topicFamilies.get(r) || {}; f[fam] = (f[fam] || 0) + 1; ctx.topicFamilies.set(r, f) }
    for (const a of roots) for (const b of roots) if (a !== b) pair.set(a + '|' + b, (pair.get(a + '|' + b) || 0) + 1)
  }
  ctx.cooc = new Map()
  for (const [k, n] of pair) { const [a, b] = k.split('|'); const lift = (n * N) / (cnt.get(a) * cnt.get(b)); if (n >= 3) ctx.cooc.set(k, Math.min(1, Math.log(lift + 1) / Math.log(6))) }
  extendIndex(ctx)
  // search docs
  ctx.docs = []
  const doc = (kind, id, title, text, extra) => ctx.docs.push({ kind, id, title, hay: fold(title + ' ' + (text || '')), ftitle: fold(title), ...extra })
  for (const p of Object.values(data.person)) doc('person', p.id, p.name, [p.short, p.bio, p.tagline, ...(p.works || []).map((w) => w.title)].join(' '), { weight: 1 + Math.min(1, (p.depth?.clips || 0) / 20) })
  for (const t of Object.values(data.tradition)) doc('tradition', t.id, t.label, t.blurb, { weight: 1.2 })
  for (const t of Object.values(data.topic)) doc('topic', t.id, t.label, [t.intro, ...(t.questions || []).map((q) => q.label)].join(' '), { weight: 1.3 })
  for (const p of Object.values(data.practice)) doc('practice', p.id, p.name, p.summary, { weight: 1.1 })
  resourceDocs(ctx, doc)
  for (const c of Object.values(data.collection)) doc('collection', c.id, c.title, c.intro, { weight: 1 })
  for (const p of Object.values(data.place)) doc('place', p.id, p.name, [p.city, p.country, p.description, ...p.teachers.map((t) => data.person[t]?.name), ...p.traditions.map((t) => data.tradition[t]?.label)].join(' '), { weight: p.network ? 0.6 : 0.9 })
  for (const c of Object.values(data.clip)) doc('clip', c.id, c.title, [c.talk, data.person[c.speaker]?.name].join(' '), { weight: 0.8 + 0.4 * ctx.q.get(c.id) })
  CTX = ctx
  return ctx
}

// ---------- shapers (public, compact) ----------
const url = (kind, id) => canon(kind, id)
const clipOut = (c, ctx, extra) => ({ id: c.id, title: c.title, speaker: c.speaker, speakerName: ctx.person[c.speaker]?.name, tradition: c.traditions[0],
  minutes: +(c.seconds / 60).toFixed(1), orientation: c.orientation.value, youtube: `https://www.youtube.com/watch?v=${c.media.videoId}${c.media.start ? `&t=${c.media.start}s` : ''}`,
  start: c.media.start, end: c.media.end, topics: c.topics.map((t) => t.id), quality: +(ctx.q.get(c.id) || 0).toFixed(3), ...prov(ctx, 'clip', c), ...extra })
let CTX = null // set by buildIndex callers through personOut(p, ctx)
const personOut = (p, ctx = CTX) => ({ id: p.id, name: p.name, roles: p.roles, traditions: p.traditions, years: p.years?.label, living: p.living, clips: p.depth?.clips, tier: p.depth?.tier, ...(ctx ? prov(ctx, 'person', p) : { url: url('person', p.id) }) })

function err(msg) { const e = new Error(msg); e.toolError = true; return e }
const lim = (n, d, max) => Math.max(1, Math.min(max, Number.isFinite(+n) ? Math.round(+n) : d))

// ---------- tools ----------
const LEGACY_TOOLS = [
  { name: 'search', title: 'Search Satsang',
    description: 'Search the Satsang directory: teachers, scholars and figures, traditions and schools, topics, practices, texts and books, collections, places to practise and talks. Returns {results:[{id,title,url}]}; pass an id to fetch (or to the get_* tools) for the full record with source_url, verified_on and confidence.',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Words to look for, e.g. "rebirth bardo", "Ajahn Chah", "Zen monastery Japan".' },
      kinds: { type: 'array', items: { type: 'string', enum: ['person', 'tradition', 'topic', 'practice', 'resource', 'text', 'collection', 'place', 'clip'] }, description: 'Optional: restrict to these kinds.' },
      limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 } }, required: ['query'] } },
  { name: 'get_topic', title: 'Topic hub',
    description: 'A topic seen across traditions: intro, sub-questions, one-line takes per tradition, the best talks chosen for diversity across traditions (MMR), practices, texts, teachers and related topics.',
    inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'Topic id, e.g. "rebirth" or "death/bardo".' }, talks: { type: 'integer', minimum: 1, maximum: 40, default: 12 } }, required: ['id'] } },
  { name: 'get_teacher', title: 'Teacher, scholar or figure',
    description: 'A person profile: bio, years, traditions, works, their best talks, talks about them, lineage neighbours and places tied to them.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, talks: { type: 'integer', minimum: 0, maximum: 50, default: 10 } }, required: ['id'] } },
  { name: 'get_lineage', title: 'Lineage',
    description: 'Walk teacher-student (dharma) and/or academic lineage edges up and down from a person or tradition. Every edge carries its confidence.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, direction: { type: 'string', enum: ['up', 'down', 'both'], default: 'both' },
      lineage: { type: 'string', enum: ['dharma', 'academic', 'influence', 'all'], default: 'dharma' }, hops: { type: 'integer', minimum: 1, maximum: 8, default: 3 } }, required: ['id'] } },
  { name: 'list_practices', title: 'Practices',
    description: 'Practices (meditation, visualisation, enquiry, chant, ritual, movement) with steps in plain words, sources and cautions. Filter by tradition, kind or topic.',
    inputSchema: { type: 'object', properties: { tradition: { type: 'string' }, kind: { type: 'string', enum: ['meditation', 'visualisation', 'enquiry', 'chant', 'ritual', 'movement'] },
      topic: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 } } } },
  { name: 'get_collection', title: 'Collection',
    description: 'A curated set, journey, meditation series, visualisation cycle or syllabus with its ordered units and items. Omit id to list collections.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } } } },
  { name: 'recommend', title: 'Recommend',
    description: 'Stateless recommendations. Give ids the listener liked (clip ids, person/<id>, topic/<id>, tradition/<id>) and optionally disliked; returns diverse talks (taste x quality, MMR across traditions) and next topics to explore (graph neighbours + information gain). With no likes it returns a cold-start spread.',
    inputSchema: { type: 'object', properties: { liked: { type: 'array', items: { type: 'string' } }, disliked: { type: 'array', items: { type: 'string' } },
      topic: { type: 'string', description: 'Restrict talks to this topic.' }, exclude: { type: 'array', items: { type: 'string' } },
      maxMinutes: { type: 'number' }, k: { type: 'integer', minimum: 1, maximum: 30, default: 8 } } } },
]
const RO = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
export const TOOLS = [...LEGACY_TOOLS.map((t) => ({ ...t, annotations: RO })), ...AGENT_TOOLS, ...KEEPER_TOOLS]
// ids may come prefixed ("person/x", "topic/death/bardo") or as canonical URLs, straight from search results
const bare = (kind, id) => String(id ?? '').replace(SITE_RE, '').replace(/^#/, '').replace(kind === 'person' ? /^(person|teacher)\// : new RegExp('^' + kind + '\\/'), '')

export function callTool(ctx, name, a = {}) {
  switch (name) {
    case 'search': {
      const q = fold(a.query).split(/\s+/).filter((w) => w.length > 1)
      if (!q.length) throw err('query is empty')
      const kinds = Array.isArray(a.kinds) && a.kinds.length ? new Set(a.kinds.map((k) => (k === 'text' ? 'resource' : k))) : null
      const hits = []
      for (const d of ctx.docs) {
        if (kinds && !kinds.has(d.kind)) continue
        let s = 0
        for (const w of q) { if (d.ftitle.includes(w)) s += 3; else if (d.hay.includes(w)) s += 1; else { s = -1; break } }
        if (s > 0) { const phrase = q.join(' '); if (d.ftitle === phrase) s += 8; else if (d.ftitle.includes(phrase)) s += 4 }
        if (s > 0) hits.push([s * d.weight, d])
      }
      hits.sort((x, y) => y[0] - x[0])
      // exact OpenAI connector / deep-research shape: {results:[{id,title,url}]}; id is "<kind>/<id>" and goes to fetch
      return { results: hits.slice(0, lim(a.limit, 10, 50)).map(([, d]) => { const r = d.kind === 'resource' ? ctx.resource[d.id] : ctx[d.kind][d.id]; return { id: `${d.kind}/${d.id}`, title: titleOf(ctx, d.kind, r), url: url(d.kind, d.id) } }) }
    }
    case 'get_topic': {
      const t = ctx.topic[bare('topic', a.id)]; if (!t) throw err(`unknown topic "${a.id}"; try search with kinds ["topic"]`)
      const pool = (ctx.byTopic.get(t.id) || []).filter((c) => c.inBallot || c.lengthClass === 'full')
      const conf = (c) => Math.max(...c.topics.filter((x) => x.id === t.id || x.id.startsWith(t.id + '/')).map((x) => x.conf), 0.3)
      const talks = mmr(pool.filter((c) => c.lengthClass !== 'full'), (c) => 0.6 * ctx.q.get(c.id) + 0.4 * conf(c), lim(a.talks, 12, 40), ctx, 0.55)
      const byTrad = {}
      for (const c of pool) (byTrad[c.traditions[0]] ||= new Set()).add(c.speaker)
      const teachers = [...new Set(talks.map((c) => c.speaker))].map((id) => ctx.person[id]).filter(Boolean).map(personOut)
      return { id: t.id, label: t.label, state: t.state, intro: t.intro, parent: t.parent, children: t.children, questions: t.questions || [], takes: t.takes || {},
        depth: t.depth, atlas: t.atlas, ...prov(ctx, 'topic', t),
        traditions: Object.entries(byTrad).map(([tr, s]) => ({ id: tr, label: ctx.tradition[tr]?.label || tr, teachers: s.size })).sort((x, y) => y.teachers - x.teachers),
        talks: talks.map((c) => clipOut(c, ctx)), teachers,
        practices: Object.values(ctx.practice).filter((p) => p.topics?.includes(t.id)).map((p) => ({ id: p.id, name: p.name, kind: p.kind, tradition: p.traditionLabel || p.traditions[0], url: url('practice', p.id), source_url: p.sources?.[0]?.url })),
        texts: Object.values(ctx.text).filter((x) => x.topics?.includes(t.id)).map((x) => ({ id: x.id, title: x.title, author: x.authorName, link: x.editions?.[0]?.url, url: url('resource', ctx.textToResource.get(x.id) || x.id), source_url: x.editions?.[0]?.url })),
        related: nextTopics(t.id, null, ctx, 6) }
    }
    case 'get_teacher': {
      const p = ctx.person[bare('person', a.id)]; if (!p) throw err(`unknown person "${a.id}"; try search with kinds ["person"]`)
      const n = lim(a.talks, 10, 50)
      const own = (ctx.bySpeaker.get(p.id) || []).filter((c) => c.lengthClass !== 'full')
      const best = mmr(own, (c) => ctx.q.get(c.id), n, { ...ctx, person: ctx.person }, 0.8)
      const about = (ctx.byFigure.get(p.id) || []).sort((x, y) => ctx.q.get(y.id) - ctx.q.get(x.id)).slice(0, n)
      const edges = Object.values(ctx.edge).filter((e) => e.src === 'person/' + p.id || e.dst === 'person/' + p.id)
      return { ...personOut(p), short: p.short, bio: p.bio, tagline: p.tagline, image: p.image, ids: p.ids, links: p.links, works: p.works, depth: p.depth,
        talks: best.map((c) => clipOut(c, ctx)), fullTalks: (ctx.bySpeaker.get(p.id) || []).filter((c) => c.lengthClass === 'full').slice(0, n).map((c) => clipOut(c, ctx)),
        talksAbout: about.map((c) => clipOut(c, ctx)),
        relations: edges.map((e) => ({ rel: e.rel, lineage: e.lineage, from: e.src, to: e.dst, conf: e.conf, note: e.note, source_url: e.sources?.[0]?.url })),
        places: edges.filter((e) => e.rel === 'teacher_at').map((e) => { const pl = ctx.place[e.dst.slice(6)]; return pl && { id: pl.id, name: pl.name, country: pl.country, website: pl.url, url: url('place', pl.id) } }).filter(Boolean), license: LICENSE }
    }
    case 'get_lineage': {
      a = { ...a, id: String(a.id ?? '').replace(/^teacher\//, 'person/') }
      const start = ctx.person[a.id] ? 'person/' + a.id : ctx.tradition[a.id] ? 'tradition/' + a.id : String(a.id).includes('/') ? a.id : null
      if (!start || (!ctx.person[start.split('/')[1]] && !ctx.tradition[start.split('/')[1]])) throw err(`unknown person or tradition "${a.id}"`)
      const want = a.lineage || 'dharma', dir = a.direction || 'both', hops = lim(a.hops, 3, 8)
      const ok = (e) => want === 'all' || e.lineage === want
      const out = new Map(), nodes = new Set([start])
      const walk = (fromSide) => {
        let frontier = [start]
        for (let h = 1; h <= hops && frontier.length; h++) {
          const next = []
          for (const n of frontier) for (const e of Object.values(ctx.edge)) {
            if (!ok(e) || e.rel === 'teacher_at') continue
            const hit = fromSide === 'down' ? e.src === n : e.dst === n
            if (!hit) continue
            const other = fromSide === 'down' ? e.dst : e.src
            out.set(e.id, { from: e.src, rel: e.rel, to: e.dst, lineage: e.lineage, conf: e.conf, note: e.note, source_url: e.sources?.[0]?.url, hop: h, side: fromSide })
            if (!nodes.has(other)) { nodes.add(other); next.push(other) }
          }
          frontier = next
        }
      }
      if (dir !== 'down') walk('up'); if (dir !== 'up') walk('down')
      const label = (g) => { const [k, id] = g.split('/'); const r = ctx[k]?.[id]; return { id: g, label: r?.name || r?.label || id, kind: k, url: url(k, id) } }
      return { root: label(start), lineage: want, edges: [...out.values()], nodes: [...nodes].map(label) }
    }
    case 'list_practices': {
      let ps = Object.values(ctx.practice)
      if (a.kind) ps = ps.filter((p) => p.kind === a.kind)
      if (a.topic) ps = ps.filter((p) => p.topics?.includes(a.topic))
      if (a.tradition) { const want = a.tradition; ps = ps.filter((p) => p.traditions.some((t) => t === want || familyOf(ctx.tradition, t) === want)) }
      return { total: ps.length, practices: ps.slice(0, lim(a.limit, 20, 100)).map((p) => ({ id: p.id, name: p.name, kind: p.kind, traditions: p.traditions, traditionLabel: p.traditionLabel,
        summary: p.summary, steps: p.needsTeacher ? [] : p.steps, needsTeacher: !!p.needsTeacher, duration: p.duration, contraindications: p.contraindications || [], sources: p.sources, topics: p.topics, ...prov(ctx, 'practice', p) })), license: LICENSE }
    }
    case 'get_collection': {
      if (!a.id) return { collections: Object.values(ctx.collection).map((c) => ({ id: c.id, kind: c.kind, title: c.title, topics: c.topics, items: c.units.reduce((s, u) => s + u.items.length, 0) })) }
      const c = ctx.collection[bare('collection', a.id)]; if (!c) throw err(`unknown collection "${a.id}"`)
      const resolve = (g) => { const [k, ...r] = g.split('/'); const id = r.join('/'); const x = ctx[k]?.[id]; return x ? { id: g, kind: k, title: x.title || x.name || x.label, url: url(k === 'text' ? 'resource' : k, k === 'text' ? ctx.textToResource.get(id) || id : id), ...(k === 'text' ? { link: x.editions?.[0]?.url } : {}) } : { id: g, missing: true } }
      return { ...c, ...prov(ctx, 'collection', c), units: c.units.map((u) => ({ ...u, items: u.items.map((it) => ({ ...it, resolved: resolve(it.ref.id) })) })) }
    }
    case 'recommend': {
      const liked = a.liked || [], disliked = a.disliked || []
      const taste = tasteFrom(liked, ctx, disliked)
      const ex = new Set([...(a.exclude || []), ...liked, ...disliked].map((x) => String(x).replace(/^clip\//, '')))
      let pool = (a.topic ? ctx.byTopic.get(a.topic) || [] : Object.values(ctx.clip)).filter((c) => c.inBallot && !ex.has(c.id))
      if (a.maxMinutes) pool = pool.filter((c) => c.seconds <= a.maxMinutes * 60)
      // prefilter for speed, then MMR
      const rel = (c) => taste.n ? 0.55 * affinity(c, taste, ctx) + 0.45 * ctx.q.get(c.id) : ctx.q.get(c.id)
      pool = pool.map((c) => [c, rel(c)]).sort((x, y) => y[1] - x[1]).slice(0, 400).map((x) => x[0])
      const k = lim(a.k, 8, 30)
      const talks = mmr(pool, rel, taste.n && k > 2 ? k - 1 : k, ctx, taste.n ? 0.65 : 0.45)
      if (taste.n && k > 2) {   // explore slot (RANKING §4.3): best clip from the family the profile is least sure about
        const used = new Set(talks.map((c) => c.speaker)), all = (a.topic ? ctx.byTopic.get(a.topic) || [] : Object.values(ctx.clip)).filter((c) => c.inBallot && !ex.has(c.id) && !used.has(c.speaker))
        let best = null, bs = -1
        for (const c of all) { const s = 0.5 * ctx.q.get(c.id) + 6 * uncertainty(taste, ctx, familyOf(ctx.tradition, c.traditions[0])); if (s > bs) { bs = s; best = c } }
        if (best) talks.push(best)
      }
      return { coldStart: !taste.n, taste: { traditions: taste.traditions, topics: taste.topics }, talks: talks.map((c, i) => clipOut(c, ctx, { score: +rel(c).toFixed(3), slot: taste.n && k > 2 && i === talks.length - 1 ? 'explore' : 'fit' })),
        nextTopics: nextTopics(a.topic || null, taste, ctx, 5) }
    }
    default: { const kr = keeperTool(ctx, name, a); if (kr !== undefined) return kr; const r = callAgentTool(ctx, name, a); if (r !== undefined) return r; throw Object.assign(new Error(`Unknown tool: ${name}`), { code: -32602 }) }
  }
}

// ---------- JSON-RPC ----------
export function handleRpc(ctx, msg) {
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') return { jsonrpc: '2.0', id: msg?.id ?? null, error: { code: -32600, message: 'Invalid Request' } }
  const isNote = !('id' in msg)
  const ok = (result) => (isNote ? null : { jsonrpc: '2.0', id: msg.id, result })
  const fail = (code, message) => (isNote ? null : { jsonrpc: '2.0', id: msg.id, error: { code, message } })
  const p = msg.params || {}
  switch (msg.method) {
    case 'initialize':
      return ok({ protocolVersion: PROTOCOLS.includes(p.protocolVersion) ? p.protocolVersion : PROTOCOLS[0], capabilities: { tools: { listChanged: false }, resources: {} }, serverInfo: SERVER_INFO,
        instructions: 'Satsang (' + HOST + ') is an open, read-only directory of the world\'s wisdom traditions: traditions and schools, teachers and scholars with lineages, places to practise (monasteries, retreat centres, ashrams) with contacts exactly as published, free texts, practices with cautions, and talks on YouTube. Start with search (or find_places / find_teachers / get_resources / what_to_study), then fetch or get_* for details. Every record carries url (canonical tantrafiles.xyz page to cite), source_url, verified_on and confidence: cite url, prefer high-confidence facts, tell users to confirm dates on the place\'s own schedule, never invent teacher quotes, respect practice cautions and needsTeacher. Licence: CC BY 4.0 for Satsang curation (credit "Satsang, tantrafiles.xyz"); third-party records are metadata under their own terms.' })
    case 'notifications/initialized': case 'notifications/cancelled': return null
    case 'ping': return ok({})
    case 'tools/list': return ok({ tools: TOOLS })
    case 'resources/list': return ok({ resources: [{ uri: 'wiser://meta', name: 'Dataset meta', mimeType: 'application/json' }] })
    case 'resources/read': return p.uri === 'wiser://meta' ? ok({ contents: [{ uri: 'wiser://meta', mimeType: 'application/json', text: JSON.stringify(ctx.meta) }] }) : fail(-32602, 'unknown resource')
    case 'tools/call': {
      if (!TOOLS.find((t) => t.name === p.name)) return fail(-32602, `Unknown tool: ${p.name}`)
      try {
        const r = callTool(ctx, p.name, p.arguments || {})
        return ok({ content: [{ type: 'text', text: JSON.stringify(r) }], structuredContent: r, isError: false })
      } catch (e) {
        if (e.toolError) return ok({ content: [{ type: 'text', text: e.message }], isError: true })
        return fail(e.code || -32603, e.message)
      }
    }
    default: return fail(-32601, `Method not found: ${msg.method}`)
  }
}

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS', 'access-control-allow-headers': 'content-type, accept, authorization, mcp-session-id, mcp-protocol-version, last-event-id', 'access-control-expose-headers': 'mcp-session-id, mcp-protocol-version, x-ratelimit-limit, x-ratelimit-remaining, retry-after', 'access-control-max-age': '86400' }
const json = (o, status = 200, h = {}) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...CORS, ...h } })
const text = (t, type, h = {}) => new Response(t, { headers: { 'content-type': type, ...CORS, 'cache-control': 'public, max-age=600', ...h } })
const sseFrame = (event, data) => `event: ${event}\ndata: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`

// In-memory SSE sessions (Node / single process). The Worker passes a Durable Object-backed implementation instead.
export function memorySessions() {
  const m = new Map()
  return {
    async open(id, request, endpoint) {
      const ts = new TransformStream(), w = ts.writable.getWriter(), enc = new TextEncoder()
      m.set(id, w); w.write(enc.encode(sseFrame('endpoint', endpoint)))
      const ping = setInterval(() => w.write(enc.encode(': ping\n\n')).catch(() => {}), 20000)
      request.signal?.addEventListener?.('abort', () => { clearInterval(ping); m.delete(id); w.close().catch(() => {}) })
      return new Response(ts.readable, { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive', ...CORS } })
    },
    async push(id, msgs) { const w = m.get(id); if (!w) return false; const enc = new TextEncoder(); for (const x of msgs) await w.write(enc.encode(sseFrame('message', x))); return true },
  }
}

// Per-isolate token bucket (fallback when the Workers rate-limit binding is not present).
export function memoryLimiter(limit = 120, periodS = 60) {
  const b = new Map()
  return async (key) => { const now = Date.now(); let x = b.get(key); if (!x || now - x.t > periodS * 1000) { x = { t: now, n: 0 }; b.set(key, x) } x.n++; if (b.size > 5000) b.clear(); return { ok: x.n <= limit, limit, remaining: Math.max(0, limit - x.n), reset: Math.ceil((x.t + periodS * 1000 - now) / 1000) } }
}

export function makeFetch(ctx, extras = {}) {
  const sessions = extras.sessions || memorySessions()
  const limiter = extras.limiter || memoryLimiter(extras.rateLimit || 120)
  const disc = extras.discovery || {}
  const rpcReply = (body) => { const batch = Array.isArray(body); const replies = (batch ? body : [body]).map((m) => handleRpc(ctx, m)).filter(Boolean); return { batch, replies } }
  return async function fetch(request, env) {
    const u = new URL(request.url), path = u.pathname.replace(/\/+$/, '') || '/'
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
    // ---- discovery + docs ----
    if (path === '/' || path === '/health') return json({ ok: true, server: SERVER_INFO, mcp: `${u.origin}/mcp`, sse: `${u.origin}/sse`, openapi: `${u.origin}/openapi.json`, rest: `${u.origin}/api`, docs: BASE + '/agents', llms: `${u.origin}/llms.txt`, tools: TOOLS.map((t) => t.name), counts: ctx.meta.counts, built: ctx.built, license: LICENSE })
    if (path === '/llms.txt' && (disc.llms || extras.llms)) return text(disc.llms || extras.llms, 'text/plain; charset=utf-8')
    if (path === '/llms-full.txt' && disc.llmsFull) return text(disc.llmsFull, 'text/plain; charset=utf-8')
    if ((path === '/.well-known/mcp.json' || path === '/.well-known/mcp' || path === '/.well-known/mcp/server-card.json' || path === '/server.json') && disc.mcpJson) return text(JSON.stringify(disc.mcpJson, null, 2), 'application/json; charset=utf-8')
    if (path === '/openapi.json' || path === '/api/openapi.json' || path === '/.well-known/openapi.json') return text(JSON.stringify(openapi(u.origin)), 'application/json; charset=utf-8')
    if (path === '/robots.txt') return text('User-agent: *\nAllow: /\n', 'text/plain; charset=utf-8')
    // ---- rate limit (REST strict, MCP generous) ----
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'local'
    if (path.startsWith('/api/') || path === '/mcp' || path === '/sse' || path === '/messages') {
      const rl = await limiter(`${path.startsWith('/api/') ? 'api' : 'mcp'}:${ip}`, path.startsWith('/api/') ? 'api' : 'mcp', env)
      if (rl && !rl.ok) return json({ error: 'rate_limited', retry_after: rl.reset || 60 }, 429, { 'retry-after': String(rl.reset || 60) })
    }
    // ---- REST mirror ----
    if (path === '/api' || path.startsWith('/api/')) {
      if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
      let body = {}; if (request.method === 'POST') { try { body = await request.json() } catch { return json({ error: 'bad_json' }, 400) } }
      const r = restHandler(ctx, path, u.searchParams, body, (n, a) => callTool(ctx, n, a))
      return json(r.body, r.status, { 'cache-control': r.status === 200 ? 'public, max-age=600' : 'no-store' })
    }
    // ---- legacy HTTP+SSE transport (2024-11-05): GET /sse -> endpoint event; POST /messages?sessionId= -> replies on the stream ----
    if (path === '/sse' && request.method === 'GET') {
      const id = crypto.randomUUID().replace(/-/g, '')
      return sessions.open(id, request, `${u.origin}/messages?sessionId=${id}`, env)
    }
    if (path === '/messages' && request.method === 'POST') {
      const sid = u.searchParams.get('sessionId') || u.searchParams.get('session_id')
      if (!sid) return json({ error: 'missing sessionId' }, 400)
      let body; try { body = await request.json() } catch { return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400) }
      await ensureKeeper(ctx, body)
      const { replies } = rpcReply(body)
      if (replies.length && !(await sessions.push(sid, replies, env))) return json({ error: 'unknown or closed session; reconnect to /sse' }, 404)
      return new Response('Accepted', { status: 202, headers: CORS })
    }
    // ---- Streamable HTTP (2025-03-26 / 2025-06-18): POST /mcp (also accepted on /sse for clients that POST there) ----
    if (path !== '/mcp' && !(path === '/sse' && request.method === 'POST')) return json({ error: 'not_found', see: `${u.origin}/` }, 404)
    if (request.method === 'GET') return new Response('This endpoint is stateless and opens no server-initiated stream: POST JSON-RPC to /mcp (Streamable HTTP), or use GET /sse for the legacy SSE transport.', { status: 405, headers: { allow: 'POST, DELETE, OPTIONS', ...CORS } })
    if (request.method === 'DELETE') return new Response(null, { status: 204, headers: CORS })
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
    const origin = request.headers.get('origin')
    if (origin && extras.allowOrigin && !extras.allowOrigin(origin)) return json({ error: 'forbidden_origin' }, 403)  // DNS-rebinding guard
    let body
    try { body = await request.json() } catch { return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400) }
    await ensureKeeper(ctx, body)
    const { batch, replies } = rpcReply(body)
    if (!replies.length) return new Response(null, { status: 202, headers: CORS })
    const out = batch ? replies : replies[0]
    const accept = request.headers.get('accept') || ''
    if (/text\/event-stream/.test(accept) && !/application\/json|\*\/\*/.test(accept)) // client takes only SSE: one event per reply, then close
      return new Response(replies.map((r) => sseFrame('message', r)).join(''), { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', ...CORS } })
    return json(out)
  }
}
