// Build the curator's catalog (chat/worker/data/catalog.json) from Satsang's OWN published data only.
// Inputs (all public, all already live on the site / MCP):
//   live site:  clips.json, data/wisegraph/{collections,hubs,places,wise}.json   (fetched from the site, or LIVE_DIR=<folder>)
//   repo:       mcp/data/wiser.json (topics, texts) + mcp/src/resources.mjs (the same /resource/<id> ids the site and MCP use)
//   optional:   app/wisegraph/catalog-for-chat.json (satsang-curation's catalog). When present, its why-lines win by id
//               and its item lists can add ids (only ids that also exist in the live data are kept).
// Nothing is invented here: every record carries an id that resolves on the live site. The worker re-checks nothing at runtime,
// so chat/test/verify-ids.mjs checks a built catalog (and returned packs) against the live site.
// usage: node chat/tools/build-catalog.mjs [--live https://tantrafiles.xyz] [--out chat/worker/data/catalog.json]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildResources } from '../../mcp/src/resources.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..')
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const LIVE = arg('--live', 'https://tantrafiles.xyz'), OUT = path.resolve(ROOT, arg('--out', 'chat/worker/data/catalog.json'))
const LIVE_DIR = process.env.LIVE_DIR || ''

async function live(p) {
  if (LIVE_DIR) { const f = path.join(LIVE_DIR, path.basename(p)); if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8')) }
  const r = await fetch(`${LIVE}/${p}`, { headers: { 'cache-control': 'no-cache' } }); if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.json()
}
const clean = (s, n = 400) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '\u2026' : t }

const [clips, cols, hubsF, placesF, wise] = await Promise.all(['clips.json', 'data/wisegraph/collections.json', 'data/wisegraph/hubs.json', 'data/wisegraph/places.json', 'data/wisegraph/wise.json'].map(live))
const W = JSON.parse(fs.readFileSync(path.join(ROOT, 'mcp/data/wiser.json'), 'utf8'))

// ---- optional curation catalog: collect why-lines by id ----
const WHY = new Map(), CUR_IDS = new Set(), GOLD = new Set()
let CUR = null
const CUR_FILES = [process.env.CURATION_CATALOG, path.join(ROOT, 'app/wisegraph/catalog-for-chat.json'), path.resolve(ROOT, '../../wiser/app/wisegraph/catalog-for-chat.json')].filter(Boolean)
for (const f of CUR_FILES) {
  if (!fs.existsSync(f)) continue
  CUR = JSON.parse(fs.readFileSync(f, 'utf8'))
  for (const t of Object.values(CUR.talks || {})) if (t.tier === 'gold') GOLD.add(t.id)
  const walk = (x) => {
    if (Array.isArray(x)) return x.forEach(walk)
    if (!x || typeof x !== 'object') return
    const id = x.id || x.ref
    const why = x.why || x.whyLine || x.why_line
    if (typeof id === 'string' && typeof why === 'string' && why.trim()) { WHY.set(id.replace(/^(clip|talk|practice|resource|text|reading|place|collection|topic):/, ''), clean(why, 220)); CUR_IDS.add(id) }
    for (const v of Object.values(x)) if (v && typeof v === 'object') walk(v)
  }
  walk(CUR)
  console.log(`curation catalog ${path.relative(ROOT, f)}: ${WHY.size} why-lines, ${GOLD.size} gold talks, ${(CUR.courses || []).length} courses`)
  break
}

// ---- traditions + people ----
const trads = {}
for (const [id, t] of Object.entries(wise.traditions || {})) trads[id] = { l: t.label || id, p: t.parent || null }
const famOf = (id) => { let x = id, n = 0; while (trads[x]?.p && n++ < 12) x = trads[x].p; return x }
for (const id of Object.keys(trads)) trads[id].f = famOf(id)
const people = {}
for (const [id, p] of Object.entries(wise.people || {})) people[id] = { n: p.short || p.n || id, t: p.t || null, tag: clean(p.tagline || '', 140) || undefined }

// ---- topics (hubs carry the regexes; wiser.json carries every topic's label/intro/related/terms) ----
const hubs = hubsF.hubs || {}
const topics = []
for (const t of Object.values(W.topic || {})) {
  const h = hubs[t.id] || {}
  topics.push({ id: t.id, l: t.label, intro: clean(h.intro || t.intro || '', 360), rel: t.related || h.related || [], terms: t.terms || [], rx: h.poolRx || null,
    qs: (h.questions || t.questions || []).map((q) => ({ id: q.id, l: q.label, b: clean(q.blurb || '', 200), rx: q.rx || null, fam: q.fam || undefined })),
    hub: !!hubs[t.id], takes: wise.takes?.[t.id]?.takes || t.takes || undefined })
}
const topicIds = new Set(topics.map((t) => t.id))

// ---- talks: every live clip except archival footage; quality prior from tier, views and topic confidence ----
const talks = []
for (const c of clips) {
  if (c.delivery === 'footage') continue
  const dur = c.parent ? (c.end - c.start) : (c.dur || 0)
  if (!(dur >= 60)) continue
  const tp = (c.topics || []).map((x) => (Array.isArray(x) ? x[0] : typeof x === 'string' ? x : x?.id)).filter((x) => topicIds.has(x))
  const tierW = c.tier === 'king' ? 1 : c.tier === 'indie' ? 0.75 : 0.5
  const q = +(tierW * (0.6 + 0.4 * Math.min(1, Math.log10((c.views || 0) + 10) / 6))).toFixed(3)
  talks.push({ id: c.id, t: clean(c.segTitle ? `${c.title}: ${c.segTitle}` : c.title, 160), yt: c.ytTitle && c.ytTitle !== c.title ? clean(c.ytTitle, 160) : undefined,
    sp: c.speaker || null, by: c.teacher || people[c.speaker]?.n || null, tr: c.tradition || null, trs: c.traditions || [], top: tp, fig: c.figures?.length ? c.figures : undefined,
    dur, full: c.full && !c.parent ? 1 : undefined, rd: c.delivery === 'reading' ? 1 : undefined, q, g: GOLD.has(c.id) ? 1 : undefined })
}

// ---- practices: the live site's practice records (#practice/<id>), with curator flags ----
const INTENSE = /\b(retention|retain|kumbhaka|hold(ing)? the breath|breath[- ]hold|holds? (it|the breath)|breath of fire|kapalabhati|bhastrika|hyperventil|wim hof|tummo|bandha|kundalini|khecar|double breath|forceful)/i
const ESOTERIC = /\b(past[- ]li(fe|ves)|previous li(fe|ves)|former li(fe|ves)|recollecting the round|powa|phowa|transference|bardo|ch[oö]d|demons?|dream yoga|middle pillar|hermetic|nyasa|k[aā]l[iī]s?\b|sri chakra|[sś]r[iī] cakra|bhairav|khecar|tantr|magic|occult|astral|ritual|deity|initiation|kundalini|khecar[iī] mudra|sadhana|s[aā]dhan[aā])/i
const practices = []
for (const p of Object.values(cols.practices || {})) {
  const text = `${p.name} ${p.how} ${(p.steps || []).map((s) => s.text).join(' ')}` // cautions excluded: they mention retention only to rule it out
  const neg = (re, t) => { const m = re.exec(t); return m && !/\b(no|not|never|without|avoid|don'?t)\b[^.]{0,30}$/i.test(t.slice(Math.max(0, m.index - 40), m.index)) }
  const tr = p.tradition || null
  const esoTrad = /tantra|trika|kaula|shaiv|saiva|shakt|vajra|western-magic|hermetic|golden-dawn|thelema|kabbal|esoteric|tibetan|nyingma|bon/.test(`${tr} ${famOf(tr)}`)
  practices.push({ id: p.id, n: p.name, tr, trl: p.tradLabel || trads[tr]?.l || null, how: clean(p.how, 300), min: p.minutes || null, nt: p.needsTeacher ? 1 : undefined,
    caut: (p.cautions || []).map((x) => clean(x, 220)), top: (p.topics || []).filter((x) => topicIds.has(x)), src: p.source || null, srcl: p.sourceLabel || null,
    intense: neg(INTENSE, text) ? 1 : undefined, eso: (ESOTERIC.test(text) || (esoTrad && ESOTERIC.test(p.name))) ? 1 : undefined,
    steps: (p.steps || []).length })
}

// ---- readings: free texts with a publisher link, the same ids as /resource/<id> ----
const R = buildResources(W)
const readings = []
for (const r of Object.values(R)) {
  if (!(r.free && r.url)) continue
  readings.push({ id: r.id, t: clean(r.title, 160), by: r.authorName || (r.authors || []).map((a) => people[a]?.n || (typeof a === 'object' ? a.name : a)).filter(Boolean).join(', ') || r.publisher || null,
    au: (r.authors || []).map((a) => (typeof a === 'object' ? a.id : a)).filter((a) => people[a]), s: clean(r.summary || r.note || '', 240), link: r.url, pub: r.publisher || null,
    tr: r.traditions || [], top: (r.topics || []).filter((x) => topicIds.has(x)), k: r.kind || 'text' })
}

// ---- places + their published programmes (no dates are stored; the schedule link is the place's own) ----
const places = []
const plv = Array.isArray(placesF.places) ? placesF.places : Object.values(placesF.places || {})
for (const p of plv) {
  places.push({ id: p.id, n: p.name, ty: p.type, c: p.country || null, city: p.city || null, tr: p.traditions || [], d: clean(p.description || '', 220) || undefined,
    of: p.offers?.length ? p.offers : undefined, te: p.teachers?.length ? p.teachers.slice(0, 6) : undefined, gk: p.goenka ? 1 : undefined, geo: p.lat != null ? 1 : undefined,
    ret: (p.retreats || []).slice(0, 4).map((x) => ({ n: clean(x.name, 120), len: x.typical_length || null, fmt: clean(x.format || '', 120) || null, cost: x.cost_model || null, url: x.schedule_url || p.schedule_url || null })),
    sched: p.schedule_url || undefined })
}
const countries = {}
for (const [cc, c] of Object.entries(placesF.countries || {})) countries[cc] = c.name

// ---- collections (#collection/<id>) ----
const collections = (cols.collections || []).map((c) => ({ id: c.id, k: c.kind, t: c.title, intro: clean(c.intro, 300), top: c.topic || null,
  days: (c.units || []).length || null, eso: c.orientationOnly ? 1 : undefined }))

// ---- curation mini-courses: ordered backbones (only steps whose ids exist in this catalog; live = on the site's collections.json) ----
const liveCol = new Set((cols.collections || []).map((c) => c.id))
const idsOf = { clip: new Set(talks.map((t) => t.id)), practice: new Set(practices.map((p) => p.id)), text: new Set(readings.map((r) => r.id)), resource: new Set(readings.map((r) => r.id)), place: new Set(places.map((p) => p.id)) }
const courses = []
for (const c of CUR?.courses || []) {
  const steps = []
  for (const st of c.steps || []) {
    const [k, id] = String(st.ref || '').split(/:(.*)/s)
    if (!idsOf[k]?.has(id)) continue
    steps.push({ u: st.unit || null, ut: st.unitTitle || null, role: st.role, k: k === 'text' ? 'resource' : k, id, note: clean(st.note || '', 220) || undefined })
  }
  const deeper = (c.deeper || []).map((d) => { const [k, id] = d.ref ? String(d.ref).split(/:(.*)/s) : ['place', d.id]; return idsOf[k]?.has(id) ? { k, id, note: clean(d.note || '', 200) } : null }).filter(Boolean)
  if (steps.length < 3) continue
  courses.push({ id: c.id, t: c.title, top: c.topic || null, lvl: c.level || null, trs: c.traditions || [], caut: c.caution || undefined, intro: clean(c.intro, 300), steps, deeper, live: liveCol.has(c.id) ? 1 : 0, kind: c.kind || 'mini-course' })
  for (const st of steps) if (st.note && !WHY.has(st.id)) WHY.set(st.id, st.note)
}

// why-lines from the curation catalog (by id), when it exists
let whyN = 0
for (const arr of [talks, practices, readings, places, collections]) for (const x of arr) if (WHY.has(x.id)) { x.why = WHY.get(x.id); whyN++ }

const out = { v: 1, built: new Date().toISOString(), source: `${LIVE} (live site data) + mcp/data/wiser.json (${W.meta?.built || '?'})`, whyLines: whyN,
  licence: 'Metadata CC BY 4.0 (Satsang curation). Media stays on its host. No transcripts.',
  topics, trads, people, talks, practices, readings, places, countries, collections, courses }
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(out))
console.log(`catalog -> ${path.relative(ROOT, OUT)} (${(fs.statSync(OUT).size / 1e6).toFixed(2)} MB): topics ${topics.length}, talks ${talks.length}, practices ${practices.length} (intense ${practices.filter((p) => p.intense).length}, esoteric ${practices.filter((p) => p.eso).length}), readings ${readings.length}, places ${places.length}, collections ${collections.length}, courses ${courses.length} (live ${courses.filter((c) => c.live).length}), gold ${talks.filter((t) => t.g).length}, why-lines ${whyN}`)
