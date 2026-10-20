#!/usr/bin/env node
// Normalises Satsang's static site data (READ-ONLY: ../app/site/{clips.json,data/wisegraph/*} + ../app/schema/topics.json for
// topic labels/tree only; keyword regexes are internal and dropped) into one file of unified entities that match
// ../specs/schema/*.json:  data/wiser.json  { meta, person, tradition, clip, text, practice, topic, collection, place, edge }
// Usage: node build-data.mjs [--app ../app]   (never writes outside mcp/)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BASE } from '../domain.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const argApp = process.argv.indexOf('--app')
const APP = path.resolve(HERE, argApp > 0 ? process.argv[argApp + 1] : '../app')
const rd = (p) => JSON.parse(fs.readFileSync(path.join(APP, p), 'utf8'))
const SITE = BASE

const clipsRaw = rd('site/clips.json')
const wise = rd('site/data/wisegraph/wise.json')
const graph = rd('site/data/wisegraph/graph.json')
const hubs = rd('site/data/wisegraph/hubs.json').hubs
const placesRaw = rd('site/data/wisegraph/places.json')
let topicTree = {}
try { topicTree = rd('schema/topics.json').tree } catch { /* optional */ }

const slugify = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
const LIC = 'CC-BY-4.0'

// ---------- fuzzy years ----------
function years(s) {
  if (!s) return undefined
  const str = String(s)
  const bce = /BCE|BC/.test(str)
  const nums = [...str.matchAll(/(\d{1,4})/g)].map((m) => +m[1] * (bce ? -1 : 1))
  const circa = /c\.|ca\.|circa|\?/.test(str)
  const cent = /c(entury)?\b|th c\./.test(str) && /th|st|nd|rd/.test(str)
  return { start: nums[0] ?? null, end: /–$|-$/.test(str.trim()) ? null : (nums[1] ?? null), precision: cent ? 'century' : 'year', basis: circa ? 'estimate' : 'documented', label: str }
}

// ---------- traditions ----------
const tradition = {}
for (const [id, t] of Object.entries(wise.traditions)) {
  tradition[id] = { id, type: 'tradition', label: t.label, kind: t.kind, parent: t.parent || null, children: t.kids || [], blurb: t.blurb,
    founders: t.founders || [], ids: t.wd ? { wikidata: t.wd } : undefined, meta: { license: LIC } }
}
const tradByLabel = Object.fromEntries(Object.values(tradition).map((t) => [slugify(t.label), t.id]))
const tradOf = (label) => tradByLabel[slugify(label)] || tradition[slugify(label)]?.id || null
const ancestors = (id) => { const out = []; let t = tradition[id]; while (t) { out.push(t.id); t = tradition[t.parent] } return out }
const familyOf = (id) => ancestors(id).at(-1) || id

// ---------- people + text-kind people ----------
const person = {}, text = {}
for (const [id, p] of Object.entries(wise.people)) {
  if (p.k === 'text') {
    text[id] = { id, type: 'text', title: p.n, kind: 'scripture', traditions: p.t ? [p.t] : [], years: years(p.years),
      ids: p.wd ? { wikidata: p.wd } : undefined, summary: p.bio, meta: { license: LIC } }
    continue
  }
  const roles = p.k === 'speaker' ? ['teacher'] : ['figure']
  if (/scholar|professor|indologist|historian|translator/i.test(p.bio || '')) roles.push('scholar')
  person[id] = { id, type: 'person', name: p.n, short: p.short, roles, onVideo: p.k === 'speaker', traditions: p.t ? [p.t] : [],
    years: years(p.years), living: p.living === true ? true : undefined, bio: p.bio, tagline: p.tagline,
    freeTexts: (p.texts || []).filter((x) => /^https?:/.test(x.url || '')).map((x) => ({ title: x.title, url: x.url, site: x.site, free: x.free !== false, licence: x.licence })),
    image: p.img?.src ? { src: p.img.src, face: p.img.face, page: p.img.page, artist: p.img.artist, license: p.img.license, licenseUrl: p.img.licenseUrl } : undefined,
    ids: p.wd ? { wikidata: p.wd } : undefined,
    links: Object.entries(p.links || {}).filter(([, u]) => /^https?:/.test(u)).map(([label, url]) => ({ label, url, kind: /web|site|official/i.test(label) ? 'official' : 'other' })),
    works: (p.works || []).map((w) => ({ id: w.id, title: w.title, year: w.year ?? null, kind: w.kind })),
    meta: { license: LIC, ...(p.vo ? { updated: p.vo } : {}), ...(p.cf ? { confidence: p.cf } : {}), ...(p.src ? { sources: p.src.filter((u) => /^https?:/.test(u)).map((url) => ({ url, check: 'reviewed', ...(p.vo ? { checked: p.vo } : {}) })) } : {}) } }
}

// death years from Wikidata P570 (tools/build-anniversaries.mjs -> site/data/wisegraph/anniversaries.json), for living status
try { const an = rd('site/data/wisegraph/anniversaries.json'); for (const L of Object.values(an.people || {})) for (const [id, y] of L) if (person[id] && person[id].years?.end == null) { person[id].years = { ...(person[id].years || { start: null, precision: 'year', basis: 'documented', label: `d. ${y}` }), end: y }; person[id].living = undefined } } catch { /* optional */ }

// ---------- clips ----------
const clip = {}
const CARRIER = { own: 'own', foundation: 'foundation', estate: 'estate', publisher: 'publisher', archive: 'host', host: 'host' }
for (const r of clipsRaw) {
  if (!r.id || !r.speaker) continue
  const vid = r.parent || r.id.split('@')[0]
  const fmt = r.format || 'horizontal'
  clip[r.id] = {
    id: r.id, type: 'clip', title: r.title, sourceTitle: r.ytTitle, talk: r.talk,
    media: { provider: 'youtube', videoId: vid, parent: r.parent, start: r.start, end: r.end, channel: r.channel, carrier: CARRIER[r.carrier] || 'host' },
    orientation: { value: fmt, verified: !!r.formatChecked, method: r.formatChecked ? 'oembed' : undefined, checked: r.formatChecked },
    seconds: Math.max(1, Math.round(r.sec || r.dur || 1)), videoSeconds: r.dur, lengthClass: r.full ? 'full' : (r.sec || 0) < 180 ? 'short' : 'talk',
    delivery: r.delivery || 'talk', speaker: r.speaker, figures: r.figures || [],
    traditions: r.traditions?.length ? r.traditions : [r.tradition || r.region].filter(Boolean),
    topics: (r.tags?.topics?.length ? r.tags.topics.map(([id, conf, src]) => ({ id, conf, src: ['title', 'desc', 'transcript', 'human', 'llm', 'chapter'].includes(src) ? src : 'desc' }))
      : (r.topics || []).map((id) => ({ id, conf: 0.6, src: 'desc' }))),
    published: r.published, views: r.views, year: r.year,
    inBallot: !r.full && r.delivery !== 'footage' && fmt === 'horizontal',
    url: `${SITE}/#watch/${encodeURIComponent(r.id)}`, meta: { license: LIC },
  }
}

// ---------- crowd quality signals (tools/build-stats.mjs -> site/data/stats.json, from the API's /stats/clips over D1 votes) ----------
let stats = {}
try { stats = rd('site/data/stats.json').clips || {} } catch { /* none yet */ }
for (const [id, s] of Object.entries(stats)) if (clip[id] && (s.picks || s.resonates)) clip[id].stats = { bt: s.bt || 0, picks: s.picks || 0, ...(s.resonates ? { resonates: s.resonates } : {}) }
const schoolOfClip = Object.fromEntries(clipsRaw.filter((r) => r.id).map((r) => [r.id, r.tradition || r.region]))

// ---------- depth per person (computed) ----------
for (const c of Object.values(clip)) {
  const p = person[c.speaker]; if (!p) continue
  p.depth ||= { clips: 0, fullTalks: 0, about: 0, topics: 0, minutes: 0 }
  if (c.lengthClass === 'full') p.depth.fullTalks++; else p.depth.clips++
  p.depth.minutes += c.seconds / 60
  for (const f of c.figures) if (person[f]) { person[f].depth ||= { clips: 0, fullTalks: 0, about: 0, topics: 0, minutes: 0 }; person[f].depth.about++ }
}
for (const p of Object.values(person)) {
  p.depth ||= { clips: 0, fullTalks: 0, about: 0, topics: 0, minutes: 0 }
  p.depth.minutes = Math.round(p.depth.minutes)
  p.depth.tier = !p.onVideo ? 'figure' : p.depth.clips >= 8 ? 'main' : 'more-voices'
  p.depth.topics = new Set(Object.values(clip).filter((c) => c.speaker === p.id).flatMap((c) => c.topics.map((t) => t.id.split('/')[0]))).size
}

// ---------- topics ----------
const topic = {}
function addTopic(id, node, parent) {
  topic[id] = { id, type: 'topic', label: node.label || id, parent: parent || null, children: [], state: 'seed', meta: { license: LIC } }
  if (parent) topic[parent].children.push(id)
  for (const [k, v] of Object.entries(node)) if (v && typeof v === 'object' && !Array.isArray(v) && 'label' in v) addTopic(`${id}/${k}`, v, id)
}
for (const [id, node] of Object.entries(topicTree)) addTopic(id, node, null)
for (const c of Object.values(clip)) for (const t of c.topics) if (!topic[t.id]) {
  const root = t.id.split('/')[0]; if (!topic[root]) topic[root] = { id: root, type: 'topic', label: root, parent: null, children: [], state: 'seed', meta: { license: LIC } }
  if (t.id !== root) { topic[t.id] = { id: t.id, type: 'topic', label: t.id.split('/').pop(), parent: root, children: [], state: 'seed', meta: { license: LIC } }; topic[root].children.push(t.id) }
}
for (const [tid, tk] of Object.entries(wise.takes || {})) if (topic[tid]) topic[tid].takes = tk.takes
// depth
for (const t of Object.values(topic)) t.depth = { clips: 0, traditions: 0, teachers: 0, practices: 0, texts: 0 }
const tTrad = {}, tTeach = {}
for (const c of Object.values(clip)) if (c.inBallot || c.lengthClass === 'full') for (const t of c.topics) {
  for (const id of new Set([t.id, t.id.split('/')[0]])) {
    if (!topic[id]) continue
    topic[id].depth.clips++
    ;(tTrad[id] ||= new Set()).add(familyOf(c.traditions[0]) + ':' + c.traditions[0])
    ;(tTeach[id] ||= new Set()).add(c.speaker)
  }
}
for (const t of Object.values(topic)) { t.depth.traditions = tTrad[t.id]?.size || 0; t.depth.teachers = tTeach[t.id]?.size || 0 }

// ---------- hubs -> topic intros, practices, texts, editorial sets ----------
const practice = {}, collection = {}
const kindOf = (s) => /visuali[sz]|imagine|picture|deity|light at|mandala/i.test(s) ? 'visualisation'
  : /who am i|enquir|inquir|ask (yourself|who)|look for the/i.test(s) ? 'enquiry'
  : /chant|recite|mantra|sing|kirtan/i.test(s) ? 'chant'
  : /walk|prostrat|bow|asana|posture flow|tai ?chi|qigong/i.test(s) ? 'movement'
  : /offer|altar|candle|ritual|rite/i.test(s) ? 'ritual' : 'meditation'
const steps = (how) => how.split(/(?<=[.!?])\s+(?=[A-Z"“])/).map((s) => s.trim()).filter(Boolean).slice(0, 12).map((s, i) => ({ n: i + 1, text: s }))
for (const [hid, h] of Object.entries(hubs)) {
  const t = topic[hid] || (topic[hid] = { id: hid, type: 'topic', label: hid, parent: null, children: [], state: 'seed', meta: { license: LIC } })
  t.intro = h.intro; t.related = (h.related || []).filter((x) => topic[x]); t.atlas = h.atlas; t.state = 'published'
  t.questions = (h.questions || []).map((q, i) => ({ id: q.id, label: q.label, blurb: q.blurb, order: i + 1 }))
  const items = []
  for (const pr of h.practices || []) {
    const id = slugify(pr.name); const tr = tradOf(pr.trad)
    practice[id] ||= { id, type: 'practice', name: pr.name, kind: kindOf(pr.name + ' ' + pr.how), traditions: tr ? [tr] : ['independent'],
      traditionLabel: pr.trad, summary: pr.how.slice(0, 400), steps: steps(pr.how), duration: undefined,
      sources: [{ url: pr.url || SITE, cite: pr.src }], topics: [], meta: { license: LIC } }
    practice[id].topics.push(hid)
    items.push({ ref: { id: `practice/${id}` }, role: 'practise', group: pr.trad })
  }
  for (const e of h.essays || []) {
    const id = slugify(e.title).slice(0, 60); const tr = tradOf(e.trad)
    text[id] ||= { id, type: 'text', title: e.title, kind: /book/i.test(e.note || '') ? 'book' : 'essay', authorName: e.author,
      authors: person[slugify(e.author)] ? [slugify(e.author)] : [], traditions: tr ? [tr] : [], topics: [],
      editions: [{ url: e.url, free: true, publisher: e.site, title: e.title }], summary: e.note, meta: { license: LIC } }
    text[id].topics.push(hid)
    items.push({ ref: { id: `text/${id}` }, role: 'read', group: e.trad, note: e.note })
  }
  t.depth.practices = (h.practices || []).length; t.depth.texts = (h.essays || []).length
  collection[`${slugify(hid)}-starter`] = { id: `${slugify(hid)}-starter`, type: 'collection', kind: 'set', title: `${t.label}: read and practise`,
    intro: `The essays and practices gathered on the ${t.label} hub, grouped by tradition. Talks are ranked live by the hub.`,
    author: 'wiser', visibility: 'public', topics: [hid], ordered: false, units: [{ n: 1, title: 'Read and practise', track: 'both', items }], license: LIC, meta: { license: LIC, status: 'live' } }
}

// ---------- topic publish gate (specs/TOPICS.md §6): >= 12 ballot clips, >= 3 schools (>= 2 families for a root), >= 5 teachers, >= 3 main-tier ----------
{
  const nBal = {}; for (const c of Object.values(clip)) if (c.inBallot) nBal[c.speaker] = (nBal[c.speaker] || 0) + 1
  const G = {}
  for (const c of Object.values(clip)) {
    if (!c.inBallot) continue
    const sch = schoolOfClip[c.id], fam = familyOf(sch)
    for (const id of new Set(c.topics.flatMap((t) => (t.id.includes('/') ? [t.id, t.id.split('/')[0]] : [t.id])))) {
      const g = (G[id] ||= { clips: 0, schools: new Set(), fams: new Set(), teachers: new Set() })
      g.clips++; g.schools.add(sch); g.fams.add(fam); g.teachers.add(c.speaker)
    }
  }
  let pub = 0
  for (const t of Object.values(topic)) {
    const g = G[t.id], main = g ? [...g.teachers].filter((s) => (nBal[s] || 0) >= 8).length : 0
    const ok = !!g && g.clips >= 12 && g.schools.size >= 3 && (t.parent || g.fams.size >= 2) && g.teachers.size >= 5 && main >= 3
    if (t.state !== 'merged' && t.state !== 'retired') t.state = ok ? 'published' : g ? 'growing' : 'seed'
    if (ok) pub++
  }
  console.error('topics published by the gate:', pub)
}

// ---------- practices + editorial collections (tools/build-collections.py -> site/data/wisegraph/collections.json) ----------
let colData = null
try { colData = rd('site/data/wisegraph/collections.json') } catch { /* optional */ }
if (colData) {
  const byName = Object.fromEntries(Object.values(practice).map((p) => [slugify(p.name), p.id]))
  const pidMap = {}
  for (const pr of Object.values(colData.practices || {})) {
    const id = byName[slugify(pr.name)] || slugify(pr.id)
    pidMap[pr.id] = id
    const tr = tradition[pr.tradition] ? pr.tradition : tradOf(pr.tradLabel || '') || 'independent'
    const st = (pr.steps || []).length ? pr.steps.map((x) => ({ n: x.n, text: String(x.text).slice(0, 600), seconds: x.seconds, cue: 'bell' }))
      : [{ n: 1, text: String(pr.how || pr.name).slice(0, 600) }]
    const prev = practice[id]
    practice[id] = { id, type: 'practice', name: pr.name, kind: prev?.kind || kindOf(pr.name + ' ' + (pr.how || '')), traditions: [tr], traditionLabel: pr.tradLabel || prev?.traditionLabel,
      summary: String(pr.how || '').slice(0, 400), steps: st, duration: pr.minutes ? { min: Math.min(5, pr.minutes), max: 30, default: pr.minutes } : undefined,
      needsTeacher: !!pr.needsTeacher, contraindications: pr.cautions?.length ? pr.cautions : undefined,
      sources: pr.source ? [{ url: pr.source, cite: pr.sourceLabel || undefined }] : prev?.sources || [{ url: `${SITE}/#practice/${id}`, cite: 'Satsang summary' }],
      topics: [...new Set([...(prev?.topics || []), ...(pr.topics || []).filter((t) => topic[t])])], url: `${SITE}/#practice/${id}`, meta: { license: LIC } }
  }
  const refOf = (it, cid) => it.ref?.startsWith('clip:') ? { id: `clip/${it.ref.slice(5)}` } : it.ref?.startsWith('practice:') ? { id: `practice/${pidMap[it.ref.slice(9)] || it.ref.slice(9)}` }
    : it.ref?.startsWith('topic:') ? { id: `topic/${it.ref.slice(6)}` } : { id: `collection/${cid}` }
  const itemOf = (it, cid) => ({ ref: refOf(it, cid), role: it.role, ...(it.note ? { note: it.note } : {}), ...(it.group ? { group: it.group } : {}) })
  for (const c of colData.collections || []) {
    const units = c.units?.length ? c.units.map((u) => ({ n: u.n, title: u.title, ...(u.day ? { day: u.day } : {}), ...(u.track ? { track: u.track } : {}), ...(u.intro ? { intro: u.intro } : {}), items: u.items.map((it) => itemOf(it, c.id)) }))
      : [{ n: 1, title: c.title, items: (c.items || []).map((it) => itemOf(it, c.id)) }]
    collection[c.id] = { id: c.id, type: 'collection', kind: c.kind, title: c.title, intro: c.intro, author: 'wiser', visibility: 'public', topics: c.topic && topic[c.topic] ? [c.topic] : [],
      ordered: c.kind !== 'set', units, ...(c.kind === 'journey' ? { cadence: { days: units.length, minutesPerDay: 20 } } : {}), url: `${SITE}/#collection/${c.id}`, license: LIC, meta: { license: LIC, status: 'live' } }
  }
}

// ---------- places ----------
const place = {}
const PLACE_TYPE = { 'retreat-centre': 'retreat', 'study-centre': 'centre', 'sacred-site': 'pilgrimage', 'meeting-house': 'centre', organisation: 'other', bookshop: 'other' }
for (const p of placesRaw.places) {
  place[p.id] = { id: p.id, type: 'place', name: p.name, placeType: ['monastery', 'centre', 'ashram', 'retreat', 'pilgrimage', 'temple', 'lodge', 'grove', 'hermitage'].includes(p.type) ? p.type : PLACE_TYPE[p.type] || 'other',
    traditions: p.traditions || [], country: p.country, city: p.city,
    geo: p.lat != null ? { lat: p.lat, lng: p.lng, precision: p.coord_precision, public: true } : { public: false },
    founded: years(p.founded), teachers: p.teachers || [], ...(p.main_teacher ? { mainTeacher: p.main_teacher, teacherModel: p.teacher_model || 'single', mainTeacherConfidence: p.main_teacher_conf } : {}), ...(p.status ? { status: p.status } : {}), url: p.url, scheduleUrl: p.schedule_url, description: p.description,
    network: p.goenka ? 'dhamma.org' : undefined,
    programmes: (p.retreats || []).map((r) => ({ id: r.id, name: r.name, typicalLength: r.typical_length, format: r.format, costModel: ['dana', 'fixed', 'sliding', 'free'].includes(r.cost_model) ? r.cost_model : 'unknown', scheduleUrl: r.schedule_url })),
    contact: p.contact ? { checked: p.contact.checked, page: p.contact.page, pageSource: p.contact.page_src, email: p.contact.email, phone: p.contact.phone, address: p.contact.address } : undefined,
    kindLabel: p.type, offers: p.offers || [], sisters: (p.sisters || []).map((x) => (Array.isArray(x) ? x[0] : x)).filter((x) => typeof x === 'string'),
    sisterLinks: (p.sisters || []).filter(Array.isArray).map(([id, rel, note]) => ({ id, rel, ...(note ? { note } : {}) })),
    events: (p.events || []).map((e) => ({ name: e.name, kind: e.kind, when: e.when, url: e.url, note: e.note })),
    resources: (p.resources || []).filter((r) => /^https?:/.test(r.url || '')).map((r) => ({ title: r.title, url: r.url, free: r.free, licence: r.licence, sourceUrl: r.source_url, checked: r.checked })),
    ids: p.wikidata ? { wikidata: p.wikidata } : undefined, meta: { license: LIC, ...(p.aliases ? { aliases: p.aliases } : {}), updated: p.verified_on || p.contact?.checked || p.checked || placesRaw.meta?.built, confidence: p.confidence || (p.contact?.checked && p.contact?.page ? 'high' : (p.url || p.wikidata) ? 'medium' : 'low'),
      sources: [...new Set([p.source_url, p.contact?.page, p.url, p.goenka && p.url ? null : null].filter((u) => /^https?:/.test(u || '')))].slice(0, p.source_url ? 3 : 2).map((url) => ({ url, check: p.contact?.page === url || p.source_url === url ? 'reviewed' : 'cited', ...(p.source_url === url && p.verified_on ? { checked: p.verified_on } : p.contact?.page === url && p.contact?.checked ? { checked: p.contact.checked } : {}) })) } }
}

// ---------- edges ----------
const gidOf = (id) => person[id] ? `person/${id}` : tradition[id] ? `tradition/${id}` : text[id] ? `text/${id}` : place[id] ? `place/${id}` : null
const LINEAGE = { teacher_of: 'dharma', studied_with: 'dharma', ordained_by: 'dharma', dharma_heir_of: 'dharma', academic_supervisor_of: 'academic',
  translated: 'academic', edited: 'academic', commented_on: 'textual', influenced: 'influence', founded: 'institutional', lineage_of: 'institutional', member_of: 'institutional' }
const edge = {}
for (const e of graph.edges) {
  const src = gidOf(e.from), dst = gidOf(e.to); if (!src || !dst) continue
  const id = `${e.from}~${e.type}~${e.to}`
  edge[id] = { id, type: 'edge', src, dst, rel: e.type, lineage: LINEAGE[e.type] || 'influence', conf: e.conf || 'medium', basis: 'documented', note: e.note,
    ...(/^https?:/.test(e.src || '') ? { sources: [{ url: e.src, check: e.checked ? 'reviewed' : 'cited', ...(e.checked ? { checked: e.checked } : {}) }] } : {}), meta: { license: LIC, ...(e.checked ? { updated: e.checked } : {}) } }
}
// place teacher_at-ish ties from places
for (const p of Object.values(place)) for (const t of p.teachers) if (person[t]) {
  const id = `${t}~teacher_at~${p.id}`; edge[id] = { id, type: 'edge', src: `person/${t}`, dst: `place/${p.id}`, rel: 'teacher_at', lineage: 'geographic', conf: 'medium', basis: 'documented', note: 'founder or historically tied', meta: { license: LIC } }
}

// optional extra resource lists merged into app/ later (each row {title,url,free,licence,traditions[],people[],kind,source_url,checked});
// any file matching site/data/wisegraph/resources*.json is read, so new sourcers only have to drop a file there.
const resourceExtra = []
try {
  for (const f of fs.readdirSync(path.join(APP, 'site/data/wisegraph')).filter((f) => /^resources.*\.json$/.test(f))) {
    const j = rd('site/data/wisegraph/' + f), rows = Array.isArray(j) ? j : j.resources || []
    for (const r of rows) if (r && r.title && /^https?:/.test(r.url || '')) resourceExtra.push({ title: r.title, url: r.url, free: r.free, licence: r.licence, kind: r.kind,
      traditions: (r.traditions || []).filter((t) => tradition[t]), people: (r.people || []).filter((x) => person[x]), sourceUrl: r.source_url || r.url, checked: r.checked, file: f })
  }
} catch { /* none */ }

// strip undefined
const clean = (o) => JSON.parse(JSON.stringify(o, (k, v) => (v === null && !['parent', 'end', 'start', 'year'].includes(k) ? undefined : v)))
const out = clean({
  meta: { built: new Date().toISOString(), source: 'app/site (read-only)', license: 'Metadata CC BY 4.0 (Satsang curation). Media stays on its host (YouTube embeds). No transcripts.',
    counts: {}, sources: { people: wise.meta?.built, places: placesRaw.meta?.built, placeSources: placesRaw.meta?.sources } },
  person, tradition, clip, text, practice, topic, collection, place, edge, resourceExtra,
})
for (const k of ['person', 'tradition', 'clip', 'text', 'practice', 'topic', 'collection', 'place', 'edge']) out.meta.counts[k] = Object.keys(out[k]).length
fs.mkdirSync(path.join(HERE, 'data'), { recursive: true })
fs.writeFileSync(path.join(HERE, 'data/wiser.json'), JSON.stringify(out))
console.log('data/wiser.json', out.meta.counts, (fs.statSync(path.join(HERE, 'data/wiser.json')).size / 1e6).toFixed(2) + ' MB')
