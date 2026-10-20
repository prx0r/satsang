#!/usr/bin/env node
// Death anniversaries for the For You daily theme (src/themes.js). Reads Wikidata P570 (date of death) for every wisegraph
// person with a Wikidata id, keeps only DAY-precision dates (precision 11) and people with talks by or about them, and
// writes site/data/wisegraph/anniversaries.json: { updated, source, people: { "MM-DD": [[id, year], ...] } }.
// Safe to re-run; keeps the old file when Wikidata is unreachable. No guessed dates: no Wikidata day-precision date, no entry.
import fs from 'node:fs'
const wise = JSON.parse(fs.readFileSync(new URL('../site/data/wisegraph/wise.json', import.meta.url)))
const clips = JSON.parse(fs.readFileSync(new URL('../clips.json', import.meta.url)))
const talks = {}
for (const c of clips) { if (c.speaker) talks[c.speaker] = (talks[c.speaker] || 0) + 1; for (const f of c.figures || []) talks[f] = (talks[f] || 0) + 1 }
const byQ = {}
for (const [id, p] of Object.entries(wise.people)) if (p.wd && /^Q\d+$/.test(p.wd) && (talks[id] || 0) >= 3) byQ[p.wd] = id
const qs = Object.keys(byQ), out = {}
const dst = new URL('../site/data/wisegraph/anniversaries.json', import.meta.url)
try {
  for (let i = 0; i < qs.length; i += 80) {
    const vals = qs.slice(i, i + 80).map((q) => 'wd:' + q).join(' ')
    const q = `SELECT ?p ?d ?prec WHERE { VALUES ?p { ${vals} } ?p p:P570/psv:P570 ?v . ?v wikibase:timeValue ?d ; wikibase:timePrecision ?prec . }`
    const r = await fetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q), { headers: { 'user-agent': 'Wiser/1.0 (https://tantrafiles.xyz; hello@tantrafiles.xyz)', accept: 'application/sparql-results+json' }, signal: AbortSignal.timeout(30000) })
    const j = await r.json()
    for (const b of j.results.bindings) {
      if (Number(b.prec.value) !== 11) continue
      const m = b.d.value.match(/^([+-]?\d{1,4})-(\d\d)-(\d\d)/); if (!m || m[1].startsWith('-')) continue
      const year = Number(m[1]); if (year < 1583) continue // Wikidata stores pre-1583 dates in the Julian calendar: skip them rather than mis-date
      const id = byQ[b.p.value.split('/').pop()], k = `${m[2]}-${m[3]}`
      const L = (out[k] ||= []); if (!L.some((x) => x[0] === id)) L.push([id, year])
    }
  }
  const n = Object.values(out).reduce((s, L) => s + L.length, 0)
  fs.writeFileSync(dst, JSON.stringify({ updated: new Date().toISOString().slice(0, 10), source: 'Wikidata P570, day precision, Gregorian dates from 1583', people: out }))
  console.log('anniversaries.json', n, 'people on', Object.keys(out).length, 'days (of', qs.length, 'with a Wikidata id and >= 3 talks)')
} catch (e) { console.log('anniversaries: Wikidata unreachable, kept the previous file', e.message) }
