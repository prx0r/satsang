// All places (incl. directory entries) and all topics get a page so every canonical URL the MCP/API returns resolves.
// Path pages for search engines and link previews (ROADMAP 7): /person/<id>, /topic/<id>, /tradition/<id>, /practice/<id>,
// /collection/<id>, /place/<id> get server-filled <title>, description, canonical and schema.org JSON-LD; the client then
// opens the matching in-app route. Reads ../../mcp/data/wiser.json (open metadata only, no transcripts) -> meta.gen.js.
import fs from 'node:fs'
import { toJsonLd, personRelations } from '../../mcp/src/jsonld.mjs'
const data = JSON.parse(fs.readFileSync(new URL('../../mcp/data/wiser.json', import.meta.url), 'utf8'))
const cut = (s, n = 200) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s\S*$/, '') + '\u2026' : s }
const out = {}, edges = Object.values(data.edge)
const add = (kind, r, title, desc) => {
  const ld = toJsonLd(kind, r, data); if (ld && kind === 'person') Object.assign(ld, personRelations(r, edges))
  out[`/${kind}/${r.id}`] = [cut(title, 90), cut(desc), ld ? JSON.stringify({ '@context': 'https://schema.org', ...JSON.parse(JSON.stringify(ld)) }) : '']
}
for (const r of Object.values(data.person)) add('person', r, `${r.name} \u00b7 Satsang`, r.tagline || r.bio || `${r.name}: talks, lineage and places on Satsang.`)
for (const r of Object.values(data.topic)) add('topic', r, `${r.label}: how the traditions answer \u00b7 Satsang`, r.intro || `${r.label} across the wisdom traditions: talks, practices and texts.`)
for (const r of Object.values(data.tradition)) add('tradition', r, `${r.label} \u00b7 Satsang`, r.blurb || `${r.label}: teachers, talks and lineages on Satsang.`)
for (const r of Object.values(data.practice)) add('practice', r, `${r.name} \u00b7 Satsang`, r.summary || r.name)
for (const r of Object.values(data.collection)) add('collection', r, `${r.title} \u00b7 Satsang`, r.intro || r.title)
for (const r of Object.values(data.place)) add('place', r, `${r.name} \u00b7 Satsang`, r.description || `${r.name}${r.country ? ', ' + r.country : ''}: a place to practise.`)
fs.writeFileSync(new URL('meta.gen.js', import.meta.url), 'export default ' + JSON.stringify(out) + '\n')
// /resource/<id> pages (plain HTML, rendered by worker.js) from ../../mcp/discovery/resources.json (mcp/build-discovery.mjs)
let res = {}; try { res = JSON.parse(fs.readFileSync(new URL('../../mcp/discovery/resources.json', import.meta.url), 'utf8')) } catch { console.warn('no mcp/discovery/resources.json: run node build-discovery.mjs in mcp/') }
// held links (licence gate: wisegraph/review-queue.json text-licence*/resource-licence-place items): /resource/<id> answers with a plain
// "held while its licence is checked" page (noindex, no outbound link) instead of a bare 404, under the id the shown record would have.
import { slugify } from '../../mcp/src/resources.mjs'
const HELD = {}
try {
  const q = JSON.parse(fs.readFileSync(new URL('../wisegraph/review-queue.json', import.meta.url), 'utf8')).items || []
  for (const i of q) if (/^(text-licence|text-licence-person|text-licence-hub|resource-licence-place)$/.test(i.kind) && i.title) {
    for (const id of new Set([slugify(i.title), i.rid].filter(Boolean))) if (!res[id] && !HELD[id]) HELD[id] = { t: i.title, why: String(i.reason || '').replace(/^licence gate: /, '').slice(0, 300), lu: i.evidenceUrl || null, q: i.queued }
  }
} catch (e) { console.warn('review queue unreadable', e.message) }
fs.writeFileSync(new URL('resources.gen.js', import.meta.url), 'export default ' + JSON.stringify(res) + '\nexport const HELD = ' + JSON.stringify(HELD) + '\n')
console.log('held resource pages', Object.keys(HELD).length)
console.log('resource pages', Object.keys(res).length)
console.log('meta pages', Object.keys(out).length, (fs.statSync(new URL('meta.gen.js', import.meta.url)).size / 1e6).toFixed(2), 'MB')
