#!/usr/bin/env node
// Builds the open-data dump that would be served at BASE/data/:
//   dist-data/index.json                 manifest: kinds, counts, sha256, licences, schema links
//   dist-data/<kind>.json / .jsonl       normalised records (match specs/schema/<kind>.json)
//   dist-data/wiser.jsonld               one schema.org @graph of everything except edges
//   dist-data/sitemap.xml (+ sitemap-<kind>.xml)  canonical path URLs (see OPEN-DATA.md for the hash-route caveat)
// Usage: node build-dump.mjs   (reads data/wiser.json; run build-data.mjs first)
import fs from 'node:fs'
import crypto from 'node:crypto'
import { toJsonLd, personRelations, idUrl } from './src/jsonld.mjs'
import { BASE, HOST } from '../domain.mjs'

const dir = new URL('.', import.meta.url)
const data = JSON.parse(fs.readFileSync(new URL('data/wiser.json', dir), 'utf8'))
const out = new URL('dist-data/', dir); fs.mkdirSync(out, { recursive: true })
const KINDS = ['person', 'tradition', 'clip', 'text', 'practice', 'topic', 'collection', 'place', 'edge']
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex')
const manifest = { name: 'Satsang open data', version: data.meta.built.slice(0, 10), publisher: `Satsang (${HOST})`,
  license: { metadata: 'CC-BY-4.0', attribution: `Satsang (${HOST})`, notes: [
    'Satsang curation (topic intros, takes, practice summaries, tags, lineage edges, collections): CC BY 4.0.',
    'Wikidata identifiers: CC0. Portrait files: Wikimedia Commons, each under the licence in its image.license field.',
    'Videos are not included; each clip points to the official upload on YouTube (YouTube Terms apply to playback).',
    'Linked texts keep their publishers\' terms; Satsang links and never rehosts. Dharma Seed audio (CC BY-NC-ND) is never cut or remixed.',
    'Place contact details are as published on each place\'s own site, with a source link; do not use them for bulk mail.',
    'Transcripts are never published.'] },
  schema: `${BASE}/schema/`, files: [] }
for (const k of KINDS) {
  const rows = Object.values(data[k])
  const j = JSON.stringify(rows), jl = rows.map((r) => JSON.stringify(r)).join('\n') + '\n'
  fs.writeFileSync(new URL(`${k}.json`, out), j); fs.writeFileSync(new URL(`${k}.jsonl`, out), jl)
  manifest.files.push({ kind: k, count: rows.length, json: `${k}.json`, jsonl: `${k}.jsonl`, bytes: Buffer.byteLength(j), sha256: sha(j), schema: `${BASE}/schema/${k}.json` })
}
const graph = []
const edges = Object.values(data.edge)
for (const k of KINDS) for (const r of Object.values(data[k])) {
  const ld = toJsonLd(k, r, data); if (!ld) continue
  if (k === 'person') Object.assign(ld, personRelations(r, edges))
  graph.push(JSON.parse(JSON.stringify(ld)))
}
const ld = JSON.stringify({ '@context': 'https://schema.org', license: 'https://creativecommons.org/licenses/by/4.0/', '@graph': graph })
fs.writeFileSync(new URL('wiser.jsonld', out), ld)
manifest.files.push({ kind: 'jsonld', count: graph.length, file: 'wiser.jsonld', bytes: Buffer.byteLength(ld), sha256: sha(ld) })
// sitemaps: one per kind, an index on top. Clips are left out of the sitemap (they are YouTube videos; their pages are thin).
const smKinds = ['topic', 'person', 'tradition', 'practice', 'collection', 'place']
const today = data.meta.built.slice(0, 10)
for (const k of smKinds) {
  const urls = Object.values(data[k]).filter((r) => k !== 'topic' || r.state === 'published' || (r.depth?.clips >= 12 && r.depth?.traditions >= 3)).filter((r) => k !== 'place' || !r.network)
  fs.writeFileSync(new URL(`sitemap-${k}.xml`, out), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((r) => `  <url><loc>${idUrl(k, r.id)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`)
  manifest.files.push({ kind: `sitemap-${k}`, count: urls.length, file: `sitemap-${k}.xml` })
}
fs.writeFileSync(new URL('sitemap.xml', out), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...smKinds, 'places'].map((k) => `  <sitemap><loc>${BASE}/sitemap-${k}.xml</loc><lastmod>${today}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>\n`)
// /data/places.json (wrapped with its licence note) + /data/places.ndjson (one place per line, same records as place.jsonl)
{ const rows = Object.values(data.place)
  fs.writeFileSync(new URL('places.json', out), JSON.stringify({ name: 'Satsang places', license: 'CC-BY-4.0', license_url: 'https://creativecommons.org/licenses/by/4.0/', attribution: `Satsang (${HOST})`,
    note: 'Satsang curation is CC BY 4.0: credit "Satsang, ' + HOST + '" and link ' + BASE + '/places. Contacts are exactly as each place publishes them on its own site (source link + check date on each record); use them to help a person get in touch, never for bulk mail. Upcoming events are read weekly from each place\u2019s own iCal / schema.org Event data; confirm dates on the source page.',
    generated: data.meta.built, count: rows.length, schema: `${BASE}/schema/place.json`, ndjson: `${BASE}/data/places.ndjson`, places: rows }))
  fs.writeFileSync(new URL('places.ndjson', out), rows.map((r) => JSON.stringify(r)).join('\n') + '\n')
  manifest.files.push({ kind: 'places', count: rows.length, file: 'places.json', ndjson: 'places.ndjson', license: 'CC-BY-4.0' }) }
fs.writeFileSync(new URL('index.json', out), JSON.stringify(manifest, null, 1))
console.log(manifest.files.map((f) => `${f.kind}:${f.count}`).join('  '))
