// Agent-facing layer of the Satsang MCP: canonical URLs, provenance (source_url + verified_on + confidence) on every answer,
// the OpenAI-shaped `fetch` tool, and the "spiritual directory" tools: find_places, get_place, find_teachers, get_resources,
// get_lineage_path, what_to_study. Pure functions over the index built by core.mjs (no I/O), so the same code runs in the
// Worker, in Node tests and behind the REST mirror.
import { buildResources, dateOf, slugify } from './resources.mjs'
import { BASE, HOST, SITE_URL_RE } from '../../domain.mjs'
const SITE_RE = new RegExp(SITE_URL_RE)

export const SITE = BASE
export const fold = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
export const LICENSE = 'CC-BY-4.0 (Satsang curation); third-party records are metadata only, each under its source\u2019s terms'
const KINDS = ['person', 'tradition', 'topic', 'practice', 'collection', 'place', 'resource', 'clip']

// Canonical, citation-friendly URLs (all resolve on BASE from ../../domain.mjs; clips redirect into the player).
export const canon = (kind, id) => {
  if (kind === 'text') kind = 'resource'
  return `${SITE}/${kind}/${kind === 'clip' || kind === 'topic' ? String(id).split('/').map(encodeURIComponent).join('/') : encodeURIComponent(id)}`
}
const wd = (q) => (q ? `https://www.wikidata.org/wiki/${q}` : null)

const REGION = {}
for (const [r, cs] of Object.entries({
  europe: 'GB IE FR DE IT ES PT NL BE AT CH SE NO DK FI PL CZ SK HU RO BG GR LT LV EE SI HR RS IS LU MT CY UA',
  'north-america': 'US CA MX', 'central-america': 'CR GT PA NI HN SV BZ CU DO JM', 'south-america': 'BR AR CL CO PE VE EC BO UY PY',
  'south-asia': 'IN NP LK BT BD PK MV', 'southeast-asia': 'TH MM KH LA VN MY SG ID PH', 'east-asia': 'CN JP KR TW HK MN MO',
  'middle-east': 'IL IR TR EG JO LB SY IQ SA AE', oceania: 'AU NZ FJ PG', africa: 'ZA KE NG GH ET MA TZ UG SN', russia: 'RU',
})) for (const c of cs.split(' ')) REGION[c] = r
export const REGIONS = [...new Set(Object.values(REGION))]
const REGION_ALIAS = { asia: ['south-asia', 'southeast-asia', 'east-asia'], americas: ['north-america', 'central-america', 'south-america'], uk: null, 'latin-america': ['central-america', 'south-america'] }

function err(msg) { const e = new Error(msg); e.toolError = true; return e }
const lim = (n, d, max) => Math.max(1, Math.min(max, Number.isFinite(+n) ? Math.round(+n) : d))
const list = (x) => (Array.isArray(x) ? x : x == null || x === '' ? [] : String(x).split(',')).map((s) => String(s).trim()).filter(Boolean)
const bool = (x) => (x === true || x === 'true' || x === '1' || x === 1 ? true : x === false || x === 'false' || x === '0' || x === 0 ? false : undefined)

// ---------- index extension (runs once at startup) ----------
export function extendIndex(ctx) {
  ctx.built = dateOf(ctx.meta?.built) || null
  ctx.peopleDate = dateOf(ctx.meta?.sources?.people) || ctx.built
  ctx.resource = buildResources(ctx)
  ctx.textToResource = new Map(Object.values(ctx.resource).filter((r) => r.origin === 'text').map((r) => [r.id, r.id]))
  // tradition tree: descendants and folded labels
  ctx.tradKids = new Map()
  for (const t of Object.values(ctx.tradition)) { if (t.parent && ctx.tradition[t.parent]) { if (!ctx.tradKids.has(t.parent)) ctx.tradKids.set(t.parent, new Set()); ctx.tradKids.get(t.parent).add(t.id) } for (const k of t.children || []) if (ctx.tradition[k]) { if (!ctx.tradKids.has(t.id)) ctx.tradKids.set(t.id, new Set()); ctx.tradKids.get(t.id).add(k) } }
  ctx.tradFold = Object.values(ctx.tradition).map((t) => [t.id, fold(t.label), fold(t.id.replace(/-/g, ' '))])
  // places tied to people, people tied to places
  ctx.placesOf = new Map(); for (const p of Object.values(ctx.place)) for (const t of p.teachers || []) { if (!ctx.placesOf.has(t)) ctx.placesOf.set(t, []); ctx.placesOf.get(t).push(p.id) }
  // folded haystacks for filters
  ctx.placeHay = new Map(Object.values(ctx.place).map((p) => [p.id, fold([p.name, p.city, p.description, p.kindLabel, ...(p.offers || []), ...(p.programmes || []).flatMap((x) => [x.name, x.format, x.typicalLength])].join(' | '))]))
  ctx.personHay = new Map(Object.values(ctx.person).map((p) => [p.id, fold([p.name, p.short, p.bio, p.tagline].join(' '))]))
  // lineage adjacency (undirected, without place ties)
  ctx.adj = new Map()
  for (const e of Object.values(ctx.edge)) {
    if (e.rel === 'teacher_at') continue
    for (const [a, b, dir] of [[e.src, e.dst, 'forward'], [e.dst, e.src, 'backward']]) { if (!ctx.adj.has(a)) ctx.adj.set(a, []); ctx.adj.get(a).push({ to: b, e, dir }) }
  }
  return ctx
}

// ---------- tradition resolution ----------
export function resolveTradition(ctx, q) {
  if (!q) return null
  const s = String(q).replace(/^tradition\//, '')
  if (ctx.tradition[s]) return s
  const f = fold(s).replace(/[-_]/g, ' ').trim(), sl = slugify(s)
  if (ctx.tradition[sl]) return sl
  let hit = ctx.tradFold.find(([, l, i]) => l === f || i === f)
  if (!hit) hit = ctx.tradFold.find(([, l]) => l.startsWith(f) || l.replace(/[^a-z ]/g, '') === f.replace(/[^a-z ]/g, ''))
  if (!hit) hit = ctx.tradFold.filter(([, l]) => l.includes(f)).sort((a, b) => a[1].length - b[1].length)[0]
  return hit ? hit[0] : null
}
const descendants = (ctx, id) => { const out = new Set([id]), st = [id]; while (st.length) for (const k of ctx.tradKids.get(st.pop()) || []) if (!out.has(k)) { out.add(k); st.push(k) } return out }
const ancestry = (ctx, id) => { const out = []; let t = ctx.tradition[id], n = 0; while (t && n++ < 12) { out.push(t.id); t = ctx.tradition[t.parent] } return out }
const tradLabel = (ctx, id) => ctx.tradition[id]?.label || id
function tradSet(ctx, q, exact) {
  if (!q) return null
  const ids = list(q).map((x) => { const r = resolveTradition(ctx, x); if (!r) throw err(`unknown tradition or school "${x}"; try search with kinds ["tradition"]`); return r })
  const out = new Set(); for (const id of ids) for (const d of exact ? [id] : descendants(ctx, id)) out.add(d)
  return { ids, set: out }
}

// ---------- provenance ----------
export function livingStatus(p) {
  if (p.living === true) return { status: 'living', basis: 'marked living in Satsang' }
  if (p.years?.end != null) return { status: 'deceased', basis: `died ${p.years.end < 0 ? -p.years.end + ' BCE' : p.years.end}` }
  if (/[\u2013-]\s*\d{1,4}\s*(BCE|CE)?\s*$/.test(p.years?.label || '') || /\bBCE\b/.test(p.years?.label || '')) return { status: 'deceased', basis: `years ${p.years.label}` }
  if (p.onVideo && (p.years?.start == null || p.years.start >= 1930)) return { status: 'likely-living', basis: 'teaches on video, no death year recorded (inferred)' }
  if (p.years?.start != null && p.years.start < 1920) return { status: 'deceased', basis: `born ${p.years.start}, no later record (inferred)` }
  return { status: 'unknown', basis: 'no dates recorded' }
}
export function prov(ctx, kind, r) {
  const built = ctx.built
  switch (kind) {
    case 'person': {
      const off = (r.links || []).find((l) => l.kind === 'official')?.url
      return { url: canon('person', r.id), source_url: r.meta?.sources?.[0]?.url || off || wd(r.ids?.wikidata) || canon('person', r.id), verified_on: dateOf(r.meta?.updated) || ctx.peopleDate, confidence: r.meta?.confidence || (r.ids?.wikidata && (off || r.bio) ? 'high' : r.ids?.wikidata || off ? 'medium' : 'low') }
    }
    case 'place': return { url: canon('place', r.id), source_url: r.meta?.sources?.[0]?.url || r.contact?.page || r.url || wd(r.ids?.wikidata) || canon('place', r.id), verified_on: dateOf(r.contact?.checked) || dateOf(r.meta?.updated) || built, confidence: r.meta?.confidence || (r.url ? 'medium' : 'low') }
    case 'tradition': return { url: canon('tradition', r.id), source_url: wd(r.ids?.wikidata) || canon('tradition', r.id), verified_on: ctx.peopleDate, confidence: r.ids?.wikidata ? 'high' : 'medium' }
    case 'practice': return { url: canon('practice', r.id), source_url: r.sources?.[0]?.url || canon('practice', r.id), verified_on: built, confidence: r.sources?.[0]?.url && !SITE_RE.test(r.sources[0].url) ? 'medium' : 'low' }
    case 'topic': return { url: canon('topic', r.id), source_url: canon('topic', r.id), verified_on: built, confidence: r.state === 'published' ? 'medium' : 'low' }
    case 'collection': return { url: canon('collection', r.id), source_url: canon('collection', r.id), verified_on: built, confidence: 'medium' }
    case 'resource': return { url: canon('resource', r.id), source_url: r.sourceUrl || r.url || canon('resource', r.id), verified_on: r.verifiedOn || built, confidence: r.confidence || 'medium' }
    case 'clip': return { url: canon('clip', r.id), source_url: `https://www.youtube.com/watch?v=${r.media.videoId}${r.media.start ? `&t=${r.media.start}s` : ''}`, verified_on: dateOf(r.orientation?.checked) || built, confidence: 'high' }
    case 'edge': return { source_url: r.sources?.[0]?.url || null, verified_on: dateOf(r.sources?.[0]?.checked) || built, confidence: r.conf || 'medium' }
    default: return { verified_on: built, confidence: 'low' }
  }
}

// ---------- id parsing (accepts kind/id, bare ids, canonical URLs and hash routes) ----------
export function parseId(ctx, raw) {
  let s = String(raw || '').trim()
  if (!s) return null
  s = s.replace(SITE_RE, '').replace(/^#/, '').replace(/^teacher\//, 'person/').replace(/^watch\//, 'clip/').replace(/^text\//, 'resource/').replace(/^wiser:\/\//, '')
  try { s = decodeURIComponent(s) } catch { /* keep */ }
  const m = s.match(/^([a-z]+)\/(.+)$/)
  if (m && (KINDS.includes(m[1]))) {
    const [, k, id] = m
    if (k === 'resource') { const rid = ctx.resource[id] ? id : ctx.textToResource.get(id); return rid ? { kind: 'resource', id: rid } : null }
    return (k === 'clip' ? ctx.clip : ctx[k])?.[id] ? { kind: k, id } : null
  }
  for (const k of ['person', 'topic', 'tradition', 'place', 'practice', 'collection', 'resource', 'clip']) if (ctx[k]?.[s]) return { kind: k, id: s }
  return null
}
const recOf = (ctx, k, id) => (k === 'resource' ? ctx.resource[id] : ctx[k]?.[id])
export const titleOf = (ctx, k, r) => k === 'clip' ? `${r.title}${ctx.person[r.speaker] ? ' \u2014 ' + ctx.person[r.speaker].name : ''}` : k === 'place' ? `${r.name}${r.city || r.country ? ', ' + [r.city, r.country].filter(Boolean).join(', ') : ''}` : r.name || r.label || r.title || r.id

// ---------- compact shapers with provenance ----------
const placeCard = (ctx, p) => ({ id: p.id, name: p.name, type: p.placeType, kind: p.kindLabel, traditions: p.traditions.map((t) => ({ id: t, label: tradLabel(ctx, t) })), country: p.country, region: REGION[p.country] || null, city: p.city,
  offers: p.offers || [], programmes: (p.programmes || []).length, hasPublishedContact: !!(p.contact?.email?.length || p.contact?.phone?.length || p.contact?.page), status: placeStatus(p), network: p.network, website: p.url, ...prov(ctx, 'place', p) })
const personCard = (ctx, p) => { const ls = livingStatus(p); return { id: p.id, name: p.name, roles: p.roles, traditions: p.traditions.map((t) => ({ id: t, label: tradLabel(ctx, t) })), years: p.years?.label, living: ls.status, livingBasis: ls.basis, onVideo: !!p.onVideo, talks: p.depth?.clips || 0, fullTalks: p.depth?.fullTalks || 0, short: p.tagline || p.bio?.slice(0, 200), places: (ctx.placesOf.get(p.id) || []).slice(0, 6), ...prov(ctx, 'person', p) } }
const resourceCard = (ctx, r) => ({ id: r.id, title: r.title, kind: r.kind, access: r.access, free: r.free, link: r.url, licence: r.licence, licenceClass: r.licenceClass, terms: r.terms, publisher: r.publisher, authors: (r.authors || []).map((a) => ({ id: a, name: ctx.person[a]?.name || a })), authorName: r.authorName, traditions: r.traditions, topics: r.topics, places: r.places, summary: r.summary, note: r.note, ...prov(ctx, 'resource', r) })
const clipCard = (ctx, c) => ({ id: c.id, title: c.title, speaker: c.speaker, speakerName: ctx.person[c.speaker]?.name, tradition: c.traditions[0], minutes: +(c.seconds / 60).toFixed(1), quality: +(ctx.q.get(c.id) || 0).toFixed(3), ...prov(ctx, 'clip', c) })
const practiceCard = (ctx, p) => ({ id: p.id, name: p.name, kind: p.kind, traditions: p.traditions, minutes: p.duration?.default, needsTeacher: !!p.needsTeacher, cautions: p.contraindications || [], summary: p.summary, ...prov(ctx, 'practice', p) })
function placeStatus(p) {
  const o = (p.offers || []).map(fold).join(' ')
  if (/(sacred-site|pilgrimage|museum|heritage)/.test(fold(p.kindLabel + ' ' + p.placeType)) && !(p.programmes || []).length && !/(retreat|course|class|meditation|ordination|worship|service|satsang)/.test(o)) return 'heritage'
  return 'active'
}
const offerMatch = (ctx, p, want) => { const h = ctx.placeHay.get(p.id); return want.every((w) => { const f = fold(w); return h.includes(f) || (f === 'residential' && /residential|guest stay|10-day|retreat/.test(h)) || (f === 'online' && /online|livestream|zoom/.test(h)) || (f === 'ordination' && /ordination|monastic/.test(h)) }) }
const countrySet = (q) => { const out = new Set(); for (const c of list(q)) { const u = c.toUpperCase(); if (/^[A-Z]{2}$/.test(u)) out.add(u === 'UK' ? 'GB' : u); else { const n = COUNTRY_NAMES[fold(c)]; if (n) out.add(n); else throw err(`unknown country "${c}"; use an ISO code such as GB, IN, US`) } } return out }
const regionSet = (q) => { const out = new Set(); for (const r of list(q)) { const f = slugify(r); if (REGIONS.includes(f)) out.add(f); else if (REGION_ALIAS[f]) REGION_ALIAS[f].forEach((x) => out.add(x)); else throw err(`unknown region "${r}"; one of ${REGIONS.join(', ')}, asia, americas`) } return out }
const COUNTRY_NAMES = { 'united kingdom': 'GB', britain: 'GB', england: 'GB', scotland: 'GB', wales: 'GB', india: 'IN', 'united states': 'US', usa: 'US', america: 'US', myanmar: 'MM', burma: 'MM', nepal: 'NP', thailand: 'TH', australia: 'AU', 'sri lanka': 'LK', france: 'FR', china: 'CN', canada: 'CA', japan: 'JP', italy: 'IT', germany: 'DE', greece: 'GR', brazil: 'BR', spain: 'ES', 'new zealand': 'NZ', switzerland: 'CH', egypt: 'EG', indonesia: 'ID', vietnam: 'VN', poland: 'PL', argentina: 'AR', colombia: 'CO', cambodia: 'KH', taiwan: 'TW', ireland: 'IE', portugal: 'PT', austria: 'AT', belgium: 'BE', chile: 'CL', mexico: 'MX', netherlands: 'NL', sweden: 'SE', 'south africa': 'ZA', bhutan: 'BT', tibet: 'CN', korea: 'KR', 'south korea': 'KR', israel: 'IL', iran: 'IR', russia: 'RU', peru: 'PE', mongolia: 'MN', malaysia: 'MY', philippines: 'PH' }

// ---------- readable text for fetch ----------
function textOf(ctx, k, r) {
  const L = []
  const tl = (ids) => (ids || []).map((t) => tradLabel(ctx, t)).join(', ')
  switch (k) {
    case 'person': {
      const ls = livingStatus(r)
      L.push(`${r.name}${r.years?.label ? ` (${r.years.label})` : ''}. ${r.roles.join(', ')}; ${tl(r.traditions)}. Status: ${ls.status} (${ls.basis}).`)
      if (r.bio) L.push(r.bio); if (r.tagline) L.push(r.tagline)
      if (r.works?.length) L.push('Works: ' + r.works.map((w) => `${w.title}${w.year ? ` (${w.year})` : ''}`).join('; ') + '.')
      if (r.freeTexts?.length) L.push('Free to read: ' + r.freeTexts.map((x) => `${x.title} <${x.url}>`).join('; '))
      const gl = (g) => { const [gk, gi] = splitG(g); const x = recOf(ctx, gk, gi); return x ? titleOf(ctx, gk, x) : gi }
      const ed = (ctx.adj.get('person/' + r.id) || []).slice(0, 20).map(({ e }) => `${gl(e.src)} ${e.rel.replace(/_/g, ' ')} ${gl(e.dst)} [${e.conf}]`)
      if (ed.length) L.push('Lineage: ' + ed.join('; ') + '.')
      const pl = (ctx.placesOf.get(r.id) || []).map((id) => ctx.place[id]?.name).filter(Boolean); if (pl.length) L.push('Places tied to them (founded or historically tied): ' + pl.join(', ') + '.')
      if (r.depth?.clips) L.push(`Talks on Satsang: ${r.depth.clips} (plus ${r.depth.fullTalks || 0} full talks).`)
      for (const l of r.links || []) L.push(`${l.label}: ${l.url}`)
      break
    }
    case 'place': {
      L.push(`${r.name}: ${r.kindLabel || r.placeType} in ${[r.city, r.country].filter(Boolean).join(', ')}. Traditions: ${tl(r.traditions)}.`)
      if (r.description) L.push(r.description)
      if (r.founded?.label) L.push(`Founded ${r.founded.label}.`)
      if (r.offers?.length) L.push('Offers: ' + r.offers.join(', ') + '.')
      for (const pr of r.programmes || []) L.push(`Programme: ${pr.name}${pr.typicalLength ? ', ' + pr.typicalLength : ''}${pr.format ? ', ' + pr.format : ''}${pr.costModel && pr.costModel !== 'unknown' ? ', cost: ' + pr.costModel : ''}${pr.scheduleUrl ? ' <' + pr.scheduleUrl + '>' : ''}`)
      const c = r.contact
      if (c) { L.push(`Contact as published (checked ${c.checked || 'n/a'}): ${c.page || ''}`); for (const [v, s] of c.email || []) L.push(`Email: ${v} (source ${s})`); for (const [v, s] of c.phone || []) L.push(`Phone: ${v} (source ${s})`); if (c.address?.[0]) L.push(`Address: ${c.address[0]}`) }
      if (r.url) L.push(`Website: ${r.url}`); if (r.scheduleUrl) L.push(`Schedule: ${r.scheduleUrl}`)
      const t = (r.teachers || []).map((x) => ctx.person[x]?.name).filter(Boolean); if (t.length) L.push('Founders or historically tied teachers: ' + t.join(', ') + '.')
      for (const e of r.events || []) L.push(`Event: ${e.name} (${e.when || ''})${e.url ? ' <' + e.url + '>' : ''}`)
      break
    }
    case 'tradition': L.push(`${r.label} (${r.kind}). ${r.blurb || ''}`); if (r.parent) L.push('Part of: ' + ancestry(ctx, r.parent).map((t) => tradLabel(ctx, t)).join(' < ')); if (r.children?.length) L.push('Schools/lineages: ' + r.children.map((t) => tradLabel(ctx, t)).join(', ')); break
    case 'topic': L.push(`${r.label}. ${r.intro || ''}`); for (const q of r.questions || []) L.push(`Question: ${q.label}${q.blurb ? ' \u2014 ' + q.blurb : ''}`); for (const [t, s] of Object.entries(r.takes || {})) L.push(`${tradLabel(ctx, t)}: ${s}`); break
    case 'practice': L.push(`${r.name} (${r.kind}, ${r.traditionLabel || tl(r.traditions)}). ${r.summary || ''}`); if (r.contraindications?.length) L.push('Cautions: ' + r.contraindications.join(' ')); if (r.needsTeacher) L.push('Traditionally given by a teacher; see the source.'); else for (const s of r.steps || []) L.push(`${s.n}. ${s.text}`); for (const s of r.sources || []) L.push(`Source: ${s.cite || ''} <${s.url}>`); break
    case 'collection': L.push(`${r.title} (${r.kind}). ${r.intro || ''}`); for (const u of r.units || []) L.push(`${u.n}. ${u.title}: ${u.items.length} items`); break
    case 'resource': L.push(`${r.title}${r.authorName ? ' by ' + r.authorName : ''} (${r.kind}). Access: ${r.access}.${r.licence ? ' Licence/terms: ' + r.licence : ''}`); if (r.summary) L.push(r.summary); if (r.note) L.push(r.note); if (r.url) L.push(`Read at: ${r.url}`); break
    case 'clip': L.push(`${r.title} \u2014 ${ctx.person[r.speaker]?.name || r.speaker} (${tl(r.traditions)}), ${(r.seconds / 60).toFixed(1)} min on YouTube.`); if (r.talk) L.push(`From: ${r.talk}`); L.push('Topics: ' + r.topics.map((t) => ctx.topic[t.id]?.label || t.id).join(', ')); break
  }
  return L.filter(Boolean).join('\n')
}
const splitG = (g) => { const i = g.indexOf('/'); return [g.slice(0, i), g.slice(i + 1)] }

// ---------- lineage path (BFS, shortest, optional lineage filter) ----------
function lineagePath(ctx, from, to, want, maxH) {
  const ok = (e) => want === 'all' || e.lineage === want
  const prev = new Map([[from, null]]); let frontier = [from]
  for (let h = 0; h < maxH && frontier.length && !prev.has(to); h++) {
    const next = []
    for (const n of frontier) for (const st of ctx.adj.get(n) || []) if (ok(st.e) && !prev.has(st.to)) { prev.set(st.to, { from: n, ...st }); next.push(st.to) }
    frontier = next
  }
  if (!prev.has(to)) return null
  const steps = []; let cur = to
  while (prev.get(cur)) { const p = prev.get(cur); steps.unshift(p); cur = p.from }
  return steps
}

// ---------- tools ----------
const RO = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
export const AGENT_TOOLS = [
  { name: 'fetch', title: 'Fetch a record', annotations: RO,
    description: 'Fetch one Satsang record by the id returned from search (e.g. "person/ajahn-chah", "place/tassajara", "resource/the-truth-of-rebirth-...", "topic/rebirth") or its ' + HOST + ' URL. Returns {id, title, text, url, metadata}; text is a readable summary, metadata carries kind, source_url, verified_on, confidence and licence.',
    inputSchema: { type: 'object', properties: { id: { type: 'string', description: `Id from search results, or a ${HOST} URL.` } }, required: ['id'] } },
  { name: 'find_places', title: 'Find places to practise', annotations: RO,
    description: 'Monasteries, retreat centres, ashrams, temples, study centres and sacred sites. Filter by tradition (includes its schools), school (exact), country (ISO code or name), region, type, status (active or heritage), living_teacher, and offers (e.g. "residential", "10-day", "ordination", "online", "sanskrit"; all must match). Every result carries source_url, verified_on and confidence.',
    inputSchema: { type: 'object', properties: {
      tradition: { type: 'string', description: 'Tradition or family id/label, e.g. "theravada", "Tibetan Buddhism", "sufism"; matches its schools too.' },
      school: { type: 'string', description: 'Exact school/lineage id or label, e.g. "thai-forest", "soto-zen".' },
      country: { type: 'string', description: 'ISO 3166 code(s) or name(s), comma-separated: "GB", "IN,NP", "Thailand".' },
      region: { type: 'string', description: `One of ${['europe', 'north-america', 'south-america', 'south-asia', 'southeast-asia', 'east-asia', 'oceania', 'middle-east', 'africa', 'asia', 'americas'].join(', ')}.` },
      type: { type: 'string', description: 'monastery, retreat, centre, ashram, temple, pilgrimage, hermitage, grove, lodge, other (or the finer kind: retreat-centre, study-centre, sacred-site, meeting-house).' },
      status: { type: 'string', enum: ['active', 'heritage', 'any'], default: 'any', description: 'active = runs programmes, services or visits; heritage = sacred/pilgrimage site without programmes.' },
      living_teacher: { type: 'boolean', description: 'Only places tied to a living (or likely living) teacher.' },
      offers: { type: 'array', items: { type: 'string' }, description: 'Words that must all appear in offers/programmes/description.' },
      query: { type: 'string', description: 'Free words in name, city or description.' },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 } } } },
  { name: 'get_place', title: 'Place details', annotations: RO,
    description: 'One place with contacts exactly as the place publishes them (each with its source page and check date), programmes with an as-of date and schedule links, founders/tied teachers, sister monasteries, events, free resources, coordinates, website, source_url, verified_on, confidence and the canonical tantrafiles.xyz URL.',
    inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'Place id, e.g. "amaravati" or "place/amaravati".' } }, required: ['id'] } },
  { name: 'find_teachers', title: 'Find teachers, scholars and figures', annotations: RO,
    description: 'People in Satsang filtered by tradition (includes schools), school (exact), living (true = living or likely living; status and its basis are returned), country/region (via places they founded or are tied to), role (teacher, scholar, figure) and on_video. Sorted by depth of talks on Satsang.',
    inputSchema: { type: 'object', properties: { tradition: { type: 'string' }, school: { type: 'string' }, living: { type: 'boolean' }, country: { type: 'string' }, region: { type: 'string' },
      role: { type: 'string', enum: ['teacher', 'scholar', 'figure', 'translator', 'founder', 'author'] }, on_video: { type: 'boolean' }, query: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 } } } },
  { name: 'get_resources', title: 'Texts and books', annotations: RO,
    description: 'Texts, books and libraries per tradition, person or topic. access = free (publisher\u2019s own free edition, linked never rehosted), paid-or-unknown (published works not known to be free), or no-link. Filter free=true for free reading only.',
    inputSchema: { type: 'object', properties: { tradition: { type: 'string' }, person: { type: 'string', description: 'Person id or name.' }, topic: { type: 'string' }, free: { type: 'boolean' },
      kind: { type: 'string', description: 'book, text, scripture, sutta, essay, library, talk series ...' }, query: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 100, default: 25 } } } },
  { name: 'get_lineage_path', title: 'Lineage path between two people', annotations: RO,
    description: 'Shortest documented chain between two people (or traditions) over teacher-student, ordination, transmission, academic supervision and influence edges. Each step says who taught/influenced whom, with confidence and a source link where recorded.',
    inputSchema: { type: 'object', properties: { from: { type: 'string', description: 'Person id or name, e.g. "thanissaro-bhikkhu".' }, to: { type: 'string', description: 'Person id or name, e.g. "ajahn-sao".' },
      lineage: { type: 'string', enum: ['all', 'dharma', 'academic', 'influence', 'institutional'], default: 'all' }, max_hops: { type: 'integer', minimum: 1, maximum: 10, default: 8 } }, required: ['from', 'to'] } },
  { name: 'what_to_study', title: 'Study path for a tradition', annotations: RO,
    description: 'A study path for one tradition or school: orientation, then free online resources (texts, practices with cautions, journeys, best talks), then teachers (living first), then places to go (active, residential first, with verified contacts first). Every item carries source_url, verified_on, confidence and a canonical URL.',
    inputSchema: { type: 'object', properties: { tradition: { type: 'string', description: 'e.g. "thai-forest", "Kashmir Shaivism", "Zen", "Advaita Vedanta".' }, limit: { type: 'integer', minimum: 3, maximum: 20, default: 6 } }, required: ['tradition'] } },
  // satsang-extensions 10-golden-path
  { name: 'guide_me', title: 'Guided path: teacher, method, contact', annotations: RO,
    description: 'Walk the golden path for a tradition or a teacher: living teachers, each one’s methods (practices with cautions and needsTeacher; never initiated detail), the syllabuses that contain them, and the places tied to them with contacts exactly as published. For a historical figure or a text it returns the study path (works, free texts, syllabuses, living students) instead of a contact. Start here for "how do I learn X" or "who teaches Y".',
    inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'tradition (e.g. "thai-forest") or person (e.g. "ajahn-chah", "person/thanissaro-bhikkhu")' }, limit: { type: 'integer', minimum: 1, maximum: 10, default: 5 } }, required: ['id'] } },
]

function personId(ctx, x) {
  if (!x) return null
  const s = String(x).replace(/^person\//, '')
  if (ctx.person[s]) return s
  const f = fold(s), sl = slugify(s)
  if (ctx.person[sl]) return sl
  const exact = Object.values(ctx.person).find((p) => fold(p.name) === f || fold(p.short) === f)
  if (exact) return exact.id
  const hits = Object.values(ctx.person).filter((p) => ctx.personHay.get(p.id).includes(f) && fold(p.name).includes(f.split(' ')[0])).sort((a, b) => (b.depth?.clips || 0) - (a.depth?.clips || 0))
  return hits[0]?.id || null
}
const nodeOf = (ctx, x) => { const p = personId(ctx, x); if (p) return 'person/' + p; const t = resolveTradition(ctx, x); return t ? 'tradition/' + t : null }

export function callAgentTool(ctx, name, a = {}) {
  switch (name) {
    case 'fetch': {
      const ref = parseId(ctx, a.id); if (!ref) throw err(`unknown id "${a.id}"; use an id from search, e.g. "person/ajahn-chah"`)
      const r = recOf(ctx, ref.kind, ref.id), pv = prov(ctx, ref.kind, r)
      const meta = { kind: ref.kind, source_url: pv.source_url, verified_on: pv.verified_on, confidence: pv.confidence, license: LICENSE, canonical_url: pv.url }
      if (ref.kind === 'person') Object.assign(meta, { traditions: r.traditions, years: r.years?.label, living: livingStatus(r).status, roles: r.roles, wikidata: r.ids?.wikidata })
      if (ref.kind === 'place') Object.assign(meta, { country: r.country, city: r.city, traditions: r.traditions, geo: r.geo?.public ? { lat: r.geo.lat, lng: r.geo.lng } : undefined, website: r.url, contact_checked: r.contact?.checked })
      if (ref.kind === 'resource') Object.assign(meta, { access: r.access, link: r.url, licence: r.licence })
      if (ref.kind === 'clip') Object.assign(meta, { youtube: pv.source_url, speaker: r.speaker, minutes: +(r.seconds / 60).toFixed(1) })
      return { id: `${ref.kind}/${ref.id}`, title: titleOf(ctx, ref.kind, r), text: textOf(ctx, ref.kind, r), url: pv.url, metadata: JSON.parse(JSON.stringify(meta)) }
    }
    case 'find_places': {
      let ps = Object.values(ctx.place); const applied = {}
      const tr = tradSet(ctx, a.tradition, false); if (tr) { ps = ps.filter((p) => p.traditions.some((t) => tr.set.has(t))); applied.tradition = tr.ids }
      const sc = tradSet(ctx, a.school, true); if (sc) { const s = new Set([...sc.ids.flatMap((i) => [...descendants(ctx, i)])]); ps = ps.filter((p) => p.traditions.some((t) => s.has(t))); applied.school = sc.ids }
      if (a.country) { const cs = countrySet(a.country); ps = ps.filter((p) => cs.has(p.country)); applied.country = [...cs] }
      if (a.region) { const rs = regionSet(a.region); ps = ps.filter((p) => rs.has(REGION[p.country])); applied.region = [...rs] }
      if (a.type) { const t = fold(a.type); ps = ps.filter((p) => p.placeType === t || fold(p.kindLabel) === t || fold(p.kindLabel).includes(t)); applied.type = a.type }
      if (a.status && a.status !== 'any') { ps = ps.filter((p) => placeStatus(p) === a.status); applied.status = a.status }
      if (bool(a.living_teacher)) { ps = ps.filter((p) => (p.teachers || []).some((t) => ctx.person[t] && ['living', 'likely-living'].includes(livingStatus(ctx.person[t]).status))); applied.living_teacher = true }
      const offers = list(a.offers); if (offers.length) { ps = ps.filter((p) => offerMatch(ctx, p, offers)); applied.offers = offers }
      if (a.query) { const ws = fold(a.query).split(/\s+/).filter(Boolean); ps = ps.filter((p) => ws.every((w) => ctx.placeHay.get(p.id).includes(w) || fold(p.country).includes(w))); applied.query = a.query }
      const rank = (p) => (p.contact?.checked ? 2 : 0) + (p.url ? 1 : 0) + Math.min(2, (p.programmes || []).length * 0.5) + (p.network ? -1 : 0) + (p.description ? 0.5 : 0)
      ps.sort((x, y) => rank(y) - rank(x) || x.name.localeCompare(y.name))
      return { total: ps.length, filters: applied, results: ps.slice(0, lim(a.limit, 20, 100)).map((p) => placeCard(ctx, p)), license: LICENSE, note: 'Contacts and programmes are as each place publishes them; check the place\u2019s own page before travelling.' }
    }
    case 'get_place': {
      const id = String(a.id || '').replace(SITE_RE, '').replace(/^#?place\//, ''); const p = ctx.place[id]
      if (!p) throw err(`unknown place "${a.id}"; try find_places or search with kinds ["place"]`)
      const pv = prov(ctx, 'place', p), asOf = pv.verified_on
      return { ...placeCard(ctx, p), description: p.description, founded: p.founded?.label, geo: p.geo?.public ? { lat: p.geo.lat, lng: p.geo.lng, precision: p.geo.precision } : null, scheduleUrl: p.scheduleUrl,
        contact: p.contact ? { as_published: true, checked: p.contact.checked, page: p.contact.page, email: (p.contact.email || []).map(([value, source]) => ({ value, source })), phone: (p.contact.phone || []).map(([value, source]) => ({ value, source })), address: p.contact.address?.[0] ? { value: p.contact.address[0], source: p.contact.address[1] } : null } : null,
        programmes: (p.programmes || []).map((x) => ({ name: x.name, typicalLength: x.typicalLength, format: x.format, costModel: x.costModel, scheduleUrl: x.scheduleUrl, as_of: asOf, note: 'Typical shape as published; dates change, use scheduleUrl for the current calendar.' })),
        mainTeacher: p.mainTeacher && ctx.person[p.mainTeacher] ? { id: p.mainTeacher, name: ctx.person[p.mainTeacher].name, model: p.teacherModel || 'single', confidence: p.mainTeacherConfidence || 'medium', url: canon('person', p.mainTeacher), note: 'One teacher responsible now, as published; re-check on the official site.' } : p.teacherModel ? { model: p.teacherModel, note: p.teacherModel === 'rotating' ? 'Teachers rotate (e.g. course conductors); no single main teacher.' : 'No single teacher by design.' } : undefined,
        teachers: (p.teachers || []).map((t) => ctx.person[t] ? { id: t, name: ctx.person[t].name, living: livingStatus(ctx.person[t]).status, relation: 'founder or historically tied', url: canon('person', t) } : null).filter(Boolean),
        sisters: (p.sisterLinks?.length ? p.sisterLinks : (p.sisters || []).map((id) => ({ id }))).map((s) => ({ ...s, name: ctx.place[s.id]?.name, url: ctx.place[s.id] ? canon('place', s.id) : undefined })),
        events: p.events || [], resources: Object.values(ctx.resource).filter((r) => r.places?.includes(p.id)).map((r) => resourceCard(ctx, r)),
        wikidata: p.ids?.wikidata, sources: p.meta?.sources || [], license: LICENSE, privacy: 'Contacts are those the place publishes on its own site; do not use them for bulk mail.' }
    }
    case 'find_teachers': {
      let ps = Object.values(ctx.person); const applied = {}
      const tr = tradSet(ctx, a.tradition, false); if (tr) { ps = ps.filter((p) => p.traditions.some((t) => tr.set.has(t))); applied.tradition = tr.ids }
      const sc = tradSet(ctx, a.school, true); if (sc) { const s = new Set(sc.ids.flatMap((i) => [...descendants(ctx, i)])); ps = ps.filter((p) => p.traditions.some((t) => s.has(t))); applied.school = sc.ids }
      const lv = bool(a.living); if (lv !== undefined) { ps = ps.filter((p) => ['living', 'likely-living'].includes(livingStatus(p).status) === lv); applied.living = lv }
      if (a.role) { ps = ps.filter((p) => p.roles.includes(a.role)); applied.role = a.role }
      const ov = bool(a.on_video); if (ov !== undefined) { ps = ps.filter((p) => !!p.onVideo === ov); applied.on_video = ov }
      if (a.country || a.region) {
        const cs = a.country ? countrySet(a.country) : null, rs = a.region ? regionSet(a.region) : null
        ps = ps.filter((p) => (ctx.placesOf.get(p.id) || []).some((id) => { const c = ctx.place[id]?.country; return (!cs || cs.has(c)) && (!rs || rs.has(REGION[c])) }))
        applied.location = { country: cs && [...cs], region: rs && [...rs], basis: 'places the person founded or is historically tied to' }
      }
      if (a.query) { const ws = fold(a.query).split(/\s+/).filter(Boolean); ps = ps.filter((p) => ws.every((w) => ctx.personHay.get(p.id).includes(w))); applied.query = a.query }
      ps.sort((x, y) => (y.depth?.clips || 0) - (x.depth?.clips || 0) || (y.depth?.about || 0) - (x.depth?.about || 0) || x.name.localeCompare(y.name))
      return { total: ps.length, filters: applied, results: ps.slice(0, lim(a.limit, 20, 100)).map((p) => personCard(ctx, p)), license: LICENSE }
    }
    case 'get_resources': {
      let rs = Object.values(ctx.resource); const applied = {}
      const tr = tradSet(ctx, a.tradition, false); if (tr) { rs = rs.filter((r) => (r.traditions || []).some((t) => tr.set.has(t))); applied.tradition = tr.ids }
      if (a.person) { const pid = personId(ctx, a.person); if (!pid) throw err(`unknown person "${a.person}"`); rs = rs.filter((r) => (r.authors || []).includes(pid)); applied.person = pid }
      if (a.topic) { const t = String(a.topic).replace(/^topic\//, ''); rs = rs.filter((r) => (r.topics || []).some((x) => x === t || x.startsWith(t + '/'))); applied.topic = t }
      const fr = bool(a.free); if (fr !== undefined) { rs = rs.filter((r) => (r.access === 'free') === fr); applied.free = fr }
      if (a.kind) { const k = fold(a.kind); rs = rs.filter((r) => fold(r.kind) === k); applied.kind = a.kind }
      if (a.query) { const ws = fold(a.query).split(/\s+/).filter(Boolean); rs = rs.filter((r) => { const h = fold([r.title, r.authorName, r.summary, r.publisher].join(' ')); return ws.every((w) => h.includes(w)) }); applied.query = a.query }
      const order = { free: 0, 'paid-or-unknown': 1, paid: 1, 'no-link': 2 }
      rs.sort((x, y) => (order[x.access] ?? 3) - (order[y.access] ?? 3) || x.title.localeCompare(y.title))
      return { total: rs.length, free: rs.filter((r) => r.access === 'free').length, filters: applied, results: rs.slice(0, lim(a.limit, 25, 100)).map((r) => resourceCard(ctx, r)), license: LICENSE,
        note: 'Free items link to the publisher\u2019s own free edition (Satsang never rehosts). paid-or-unknown = a published work not known to be free.' }
    }
    case 'get_lineage_path': {
      const from = nodeOf(ctx, a.from), to = nodeOf(ctx, a.to)
      if (!from) throw err(`unknown person or tradition "${a.from}"`); if (!to) throw err(`unknown person or tradition "${a.to}"`)
      const want = a.lineage || 'all', steps = lineagePath(ctx, from, to, want, lim(a.max_hops, 8, 10))
      const label = (g) => { const [k, id] = splitG(g); const r = recOf(ctx, k, id); return { id: g, label: r ? titleOf(ctx, k, r) : id, url: canon(k, id) } }
      if (!steps) return { from: label(from), to: label(to), lineage: want, found: false, path: [], note: 'No documented chain within the hop limit. Try lineage "all" or a larger max_hops; absence here is not evidence of no connection.' }
      return { from: label(from), to: label(to), lineage: want, found: true, hops: steps.length,
        path: steps.map((s) => { const e = s.e; return { from: label(e.src), rel: e.rel, to: label(e.dst), reads: `${label(e.src).label} ${e.rel.replace(/_/g, ' ')} ${label(e.dst).label}`, walked: s.dir, lineage: e.lineage, confidence: e.conf, note: e.note, source_url: e.sources?.[0]?.url || null, verified_on: ctx.built } }),
        license: LICENSE }
    }
    case 'what_to_study': {
      const tid = resolveTradition(ctx, a.tradition); if (!tid) throw err(`unknown tradition "${a.tradition}"; try search with kinds ["tradition"]`)
      const t = ctx.tradition[tid], set = descendants(ctx, tid), n = lim(a.limit, 6, 20), anc = ancestry(ctx, tid)
      const inT = (ids) => (ids || []).some((x) => set.has(x))
      const res = Object.values(ctx.resource).filter((r) => inT(r.traditions))
      const free = res.filter((r) => r.access === 'free').sort((x, y) => (x.origin === 'text' ? 0 : 1) - (y.origin === 'text' ? 0 : 1)).slice(0, n)
      const practices = Object.values(ctx.practice).filter((p) => inT(p.traditions)).sort((x, y) => (x.needsTeacher ? 1 : 0) - (y.needsTeacher ? 1 : 0)).slice(0, n)
      const pids = new Set(practices.map((p) => 'practice/' + p.id))
      const cols = Object.values(ctx.collection).filter((c) => c.units.some((u) => u.items.some((it) => pids.has(it.ref.id) || (it.group && set.has(resolveTradition(ctx, it.group))))) || fold(c.title).includes(fold(t.label))).slice(0, 4)
      const pool = []; for (const tr of set) for (const c of ctx.byTradition.get(tr) || []) if (c.inBallot) pool.push(c)
      const bySpk = new Map(); for (const c of pool.sort((x, y) => ctx.q.get(y.id) - ctx.q.get(x.id))) if (!bySpk.has(c.speaker)) bySpk.set(c.speaker, c)
      const talks = [...bySpk.values()].slice(0, n)
      const people = Object.values(ctx.person).filter((p) => inT(p.traditions))
      const lstat = (p) => livingStatus(p).status
      const living = people.filter((p) => p.onVideo && ['living', 'likely-living'].includes(lstat(p))).sort((x, y) => (y.depth?.clips || 0) - (x.depth?.clips || 0)).slice(0, n)
      const classic = people.filter((p) => lstat(p) === 'deceased').sort((x, y) => (y.depth?.about || 0) + (y.depth?.clips || 0) - (x.depth?.about || 0) - (x.depth?.clips || 0)).slice(0, Math.min(n, 5))
      const places = Object.values(ctx.place).filter((p) => inT(p.traditions) && placeStatus(p) === 'active')
        .sort((x, y) => (offerMatch(ctx, y, ['residential']) ? 2 : 0) + (y.contact?.checked ? 2 : 0) + (y.network ? -1 : 0) - ((offerMatch(ctx, x, ['residential']) ? 2 : 0) + (x.contact?.checked ? 2 : 0) + (x.network ? -1 : 0))).slice(0, n)
      return { tradition: { id: tid, label: t.label, kind: t.kind, blurb: t.blurb, partOf: anc.slice(1).map((x) => ({ id: x, label: tradLabel(ctx, x) })), schools: [...set].filter((x) => x !== tid).slice(0, 30).map((x) => ({ id: x, label: tradLabel(ctx, x) })), ...prov(ctx, 'tradition', t) },
        path: [
          { step: 1, title: 'Read and listen online (free)', why: 'Start with what the tradition publishes freely, then hear living voices.', resources: free.map((r) => resourceCard(ctx, r)), talks: talks.map((c) => clipCard(ctx, c)) },
          { step: 2, title: 'Practise', why: 'Short practices with cautions; anything marked needsTeacher is pointed to its source, not taught here.', practices: practices.map((p) => practiceCard(ctx, p)), journeys: cols.map((c) => ({ id: c.id, title: c.title, kind: c.kind, ...prov(ctx, 'collection', c) })) },
          { step: 3, title: 'Find a teacher', why: 'Living teachers who teach on video first; then the classic figures to read.', living: living.map((p) => personCard(ctx, p)), classic: classic.map((p) => personCard(ctx, p)) },
          { step: 4, title: 'Go to a place', why: 'Active places in this tradition, residential and recently checked first. Confirm dates on the place\u2019s own schedule.', places: places.map((p) => placeCard(ctx, p)) },
        ],
        more: { resources: res.length, freeResources: res.filter((r) => r.access === 'free').length, teachers: people.length, places: Object.values(ctx.place).filter((p) => inT(p.traditions)).length },
        caution: 'A study path, not instruction: for initiation-only practices go through a qualified teacher.', license: LICENSE }
    }
    case 'guide_me': {
      const n = lim(a.limit, 5, 10), q = String(a.id || '').replace(SITE_RE, '').replace(/^#?(person|teacher)\//, '')
      const pid = personId(ctx, q), tid = pid ? null : resolveTradition(ctx, a.id)
      if (!pid && !tid) throw err(`unknown tradition or person "${a.id}"; try search`)
      const lstat = (p) => livingStatus(p).status, isLiving = (p) => ['living', 'likely-living'].includes(lstat(p))
      const practicesOf = (id) => Object.values(ctx.practice).filter((x) => (x.teachers || []).includes(id))
      const colsOf = (prs) => { const ids = new Set(prs.map((x) => 'practice/' + x.id)); return Object.values(ctx.collection).filter((c) => c.units.some((u) => u.items.some((it) => ids.has(it.ref.id)))).map((c) => ({ id: c.id, title: c.title, kind: c.kind, ...prov(ctx, 'collection', c) })) }
      const contactOf = (pl) => pl.contact ? { as_published: true, checked: pl.contact.checked, page: pl.contact.page, email: (pl.contact.email || []).map(([value, source]) => ({ value, source })), phone: (pl.contact.phone || []).map(([value, source]) => ({ value, source })) } : null
      const placesOf = (id) => [...new Set([...(ctx.placesOf.get(id) || []), ...Object.values(ctx.place).filter((pl) => pl.mainTeacher === id).map((pl) => pl.id)])].map((x) => ctx.place[x]).filter(Boolean)
        .sort((x, y) => (y.mainTeacher === id) - (x.mainTeacher === id)).slice(0, n)
        .map((pl) => ({ ...placeCard(ctx, pl), relation: pl.mainTeacher === id ? `main teacher (${pl.mainTeacherConfidence || 'medium'} confidence; ${pl.teacherModel || 'single'})` : 'founder or historically tied', contact: contactOf(pl), scheduleUrl: pl.scheduleUrl }))
      const teacherStep = (p) => { const prs = practicesOf(p.id); return { teacher: personCard(ctx, p), methods: prs.map((x) => ({ ...practiceCard(ctx, x), how: x.needsTeacher ? 'Orientation only: learn it from the teacher or their lineage; not taught here.' : 'Steps on the practice page; follow the source for the full instruction.' })), syllabuses: colsOf(prs), places: placesOf(p.id) } }
      if (pid) {
        const p = ctx.person[pid]
        if (isLiving(p)) return { kind: 'teacher', ...teacherStep(p), caution: 'Contacts are those the place publishes; confirm dates and current teachers on the official site.', license: LICENSE }
        const students = (ctx.adj.get('person/' + pid) || []).filter((x) => x.dir === 'forward' && ['teacher_of', 'studied_with'].includes(x.e.rel) && x.to.startsWith('person/')).map((x) => ctx.person[x.to.slice(7)]).filter((s) => s && isLiving(s)).slice(0, n)
        const res = Object.values(ctx.resource).filter((r) => (r.authors || []).includes(pid)).slice(0, n)
        return { kind: 'study-path', figure: personCard(ctx, p), works: (p.works || []).slice(0, 12), resources: res.map((r) => resourceCard(ctx, r)), syllabuses: colsOf(practicesOf(pid)),
          livingStudents: students.map((s) => teacherStep(s)), places: placesOf(pid), note: 'A historical figure or text: the path is study, then a living teacher in the line. No personal contacts are given.', license: LICENSE }
      }
      const t = ctx.tradition[tid], set = descendants(ctx, tid)
      const people = Object.values(ctx.person).filter((p) => p.traditions.some((x) => set.has(x)) && isLiving(p))
      const score = (p) => practicesOf(p.id).length * 3 + placesOf(p.id).length * 2 + Math.min(10, p.depth?.clips || 0) / 5 + (lstat(p) === 'living' ? 1 : 0)
      const top = people.sort((x, y) => score(y) - score(x)).slice(0, n)
      return { kind: 'tradition', tradition: { id: tid, label: t.label, ...prov(ctx, 'tradition', t) }, teachers: top.map((p) => teacherStep(p)),
        more: { livingTeachers: people.length }, caution: 'A path, not instruction: anything marked needsTeacher is learned from a qualified teacher. Contacts are exactly as each place publishes them.', license: LICENSE }
    }
    default: return undefined
  }
}

// search docs for resources (added to core's docs)
export function resourceDocs(ctx, doc) { for (const r of Object.values(ctx.resource)) doc('resource', r.id, r.title, [r.authorName, r.summary, r.publisher, r.kind].join(' '), { weight: r.access === 'free' ? 1 : 0.7 }) }
