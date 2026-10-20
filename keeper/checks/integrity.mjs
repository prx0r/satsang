// Data integrity on the repo data (mcp/data/wiser.json) plus the sourcing folders: duplicate people / places
// (normalised name + Wikidata + geo), lineage cycles, dangling edges and references, contradictions (living with a
// death year, two academic supervisors), conflicts between sourcing groups, and keeper/known-conflicts.json.
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, KEEPER, fold, readJson } from '../lib/util.mjs'
const HONORIFIC = /\b(ajahn|ajaan|achaan|luang|por|pu|phra|swami|sri|shri|venerable|ven|bhante|lama|rinpoche|dr|roshi|sayadaw|bhikkhu|bhikkhuni|thero|thera|geshe|sensei|master|saint|st|the|mahathera|guru|ji|maharaj|maharshi|acharya|sister|brother|father|rev|reverend|sir)\b/g
const norm = (s) => fold(s).replace(/[^a-z0-9 ]+/g, ' ').replace(HONORIFIC, ' ').replace(/\s+/g, ' ').trim()
const km = (a, b) => { const R = 6371, r = Math.PI / 180, dl = (b.lat - a.lat) * r, dg = (b.lng - a.lng) * r; const x = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dg / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)) }
const deathYear = (y) => { const s = String(y || ''); const m = s.match(/(?:d\.|died)\s*(\d{3,4})/i) || s.match(/\d{3,4}\s*[\u2013\u2014-]\s*(\d{3,4})/); return m ? Number(m[1]) : null }

export default {
  id: 'integrity', cadence: 'daily', full: true,
  doc: 'The graph contradicts itself. Fix at the source (app/wisegraph/*.json via tools/source_maps.py, or the sourcing group file), re-run merge-sources/build, and cite the deciding source. Merges of duplicates must keep the better-sourced id and add an alias.',
  async run(ctx) {
    const repo = await ctx.data.repo()
    if (!repo) return { findings: [], passed: [], skipped: 'no repo data' }
    const L = (x) => (Array.isArray(x) ? x : Object.values(x || {}))
    const people = L(repo.person), places = L(repo.place), edges = L(repo.edge), clips = L(repo.clip)
    const ids = { person: new Set(people.map((p) => p.id)), tradition: new Set(L(repo.tradition).map((t) => t.id)), place: new Set(places.map((p) => p.id)), text: new Set(L(repo.text).map((t) => t.id)), topic: new Set(L(repo.topic).map((t) => t.id)) }
    const P = Object.fromEntries(people.map((p) => [p.id, p]))
    const exists = (ref) => { const [k, ...rest] = String(ref).split('/'); const id = rest.join('/'); return ids[k] ? ids[k].has(id) : true }
    const F = []
    // duplicates: people
    const byName = new Map(), byWd = new Map()
    for (const p of people) {
      const k = norm(p.name); if (k.length > 3) { if (!byName.has(k)) byName.set(k, []); byName.get(k).push(p.id) }
      const w = p.ids?.wikidata; if (w) { if (!byWd.has(w)) byWd.set(w, []); byWd.get(w).push(p.id) }
    }
    for (const [w, l] of byWd) if (l.length > 1) F.push({ target: 'person/' + l.join('+'), key: 'dup-wikidata', severity: 'error', message: `People share Wikidata ${w}: ${l.join(', ')}` })
    for (const [k, l] of byName) if (l.length > 1 && !(byWd.size && l.every((id) => P[id].ids?.wikidata) && new Set(l.map((id) => P[id].ids.wikidata)).size === l.length)) F.push({ target: 'person/' + l.sort().join('+'), key: 'dup-name', severity: 'warn', message: `Possible duplicate people "${k}": ${l.join(', ')}` })
    // duplicates: places (same normalised name within 2 km, or same Wikidata)
    const pn = new Map(), pw = new Map()
    for (const p of places) {
      const k = norm(p.name); if (!pn.has(k)) pn.set(k, []); pn.get(k).push(p)
      const w = p.ids?.wikidata; if (w) { if (!pw.has(w)) pw.set(w, []); pw.get(w).push(p.id) }
    }
    for (const [w, l] of pw) if (l.length > 1) F.push({ target: 'place/' + l.sort().join('+'), key: 'dup-wikidata', severity: 'warn', message: `Places share Wikidata ${w}: ${l.join(', ')}` })
    for (const [k, l] of pn) if (l.length > 1) for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) {
      const a = l[i], b = l[j]
      if (a.geo?.lat != null && b.geo?.lat != null && km(a.geo, b.geo) < 2) F.push({ target: `place/${a.id}+${b.id}`, key: 'dup-geo', severity: 'warn', message: `Possible duplicate places "${a.name}" (${km(a.geo, b.geo).toFixed(2)} km apart)` })
    }
    // dangling edges and references
    for (const e of edges) {
      for (const end of [e.src, e.dst]) if (!exists(end)) F.push({ target: 'edge/' + e.id, key: 'dangling:' + end, severity: 'error', message: `Edge points at a missing record ${end}` })
      if (e.src === e.dst) F.push({ target: 'edge/' + e.id, key: 'self-loop', severity: 'error', message: 'Edge loops onto itself' })
    }
    const missSpk = new Map()
    for (const c of clips) if (c.speaker && !ids.person.has(c.speaker)) missSpk.set(c.speaker, (missSpk.get(c.speaker) || 0) + 1)
    for (const [s, n] of missSpk) F.push({ target: 'person/' + s, key: 'dangling-speaker', severity: 'error', message: `${n} clips name speaker "${s}", who is not in the people list` })
    for (const p of places) for (const t of p.teachers || []) if (!ids.person.has(t)) F.push({ target: 'place/' + p.id, key: 'dangling-teacher:' + t, severity: 'warn', message: `Place lists teacher "${t}", who is not in the people list` })
    for (const rec of [...people, ...places, ...L(repo.practice)]) for (const t of rec.traditions || []) if (!ids.tradition.has(t)) F.push({ target: `${rec.type || 'record'}/${rec.id}`, key: 'dangling-tradition:' + t, severity: 'warn', message: `Unknown tradition "${t}"` })
    // lineage cycles (teacher_of, academic_supervisor_of): DFS on person->person edges
    for (const rel of ['teacher_of', 'academic_supervisor_of']) {
      const adj = new Map()
      for (const e of edges) if (e.rel === rel && e.src.startsWith('person/') && e.dst.startsWith('person/')) { if (!adj.has(e.src)) adj.set(e.src, []); adj.get(e.src).push(e.dst) }
      const color = new Map(), cycles = new Set()
      const dfs = (n, stack) => { color.set(n, 1); stack.push(n); for (const m of adj.get(n) || []) { if (color.get(m) === 1) cycles.add(stack.slice(stack.indexOf(m)).concat(m).join(' > ')); else if (!color.get(m)) dfs(m, stack) } stack.pop(); color.set(n, 2) }
      for (const n of adj.keys()) if (!color.get(n)) dfs(n, [])
      for (const c of cycles) F.push({ target: 'lineage/' + rel, key: 'cycle:' + c, severity: 'error', message: `${rel} cycle: ${c}` })
    }
    // contradictions inside the data
    for (const p of people) if (p.living === true && p.years?.end != null) F.push({ target: 'person/' + p.id, key: 'living-dead', severity: 'error', message: `Marked living but has a death year ${p.years.end}` })
    const sup = new Map()
    for (const e of edges) if (e.rel === 'academic_supervisor_of') { if (!sup.has(e.dst)) sup.set(e.dst, []); sup.get(e.dst).push(e.src) }
    for (const [d, l] of sup) if (l.length > 1) F.push({ target: d, key: 'two-supervisors', severity: 'info', message: `Two doctoral supervisors recorded (co-supervision, or a conflict?): ${l.join(', ')}` })
    // conflicts between sourcing groups and the merged data
    const srcDirs = [path.join(ROOT, 'sources'), process.env.KEEPER_SOURCES].filter((d) => d && fs.existsSync(d))
    const seenSrc = new Set()
    for (const dir of srcDirs) for (const g of fs.readdirSync(dir)) {
      const gd = path.join(dir, g); if (!fs.statSync(gd).isDirectory() || seenSrc.has(g + gd)) continue; seenSrc.add(g + gd)
      for (const f of fs.readdirSync(gd).filter((f) => /^(lineages|edges)[\w-]*\.json$/.test(f))) {
        const j = readJson(path.join(gd, f), {}); const list = Array.isArray(j) ? j : j.edges || j.lineages || []
        for (const e of Array.isArray(list) ? list : []) {
          if ((e.type || e.rel) !== 'academic_supervisor_of' || !e.to) continue
          const have = (sup.get('person/' + e.to) || []).map((s) => s.replace('person/', ''))
          if (ids.person.has(e.to) && have.length && !have.includes(e.from)) F.push({ target: 'person/' + e.to, key: `src-supervisor:${g}:${e.from}`, severity: 'warn', message: `Conflicting claim: ${g} says ${e.from} supervised ${e.to}; the data says ${have.join(', ')}`, evidence: { source: e.source, file: `sources/${g}/${f}` } })
        }
      }
      for (const f of fs.readdirSync(gd).filter((f) => /^people[\w-]*\.json$/.test(f))) {
        const j = readJson(path.join(gd, f), {}); const list = Array.isArray(j) ? j : Array.isArray(j.people) ? j.people : Object.values(j.people || {})
        for (const q of list) {
          const p = P[q?.id]; if (!p) continue
          let dy = deathYear(q.years) ?? (q.died ? Number(String(q.died).slice(0, 4)) : null)
          if (dy && /BCE|BC\b/.test(String(q.years || q.died))) dy = -dy
          if (dy && String(p.years?.label || '').includes(String(Math.abs(dy)))) continue
          const circa = /c\.|circa|\?|century/i.test(String(q.years || '') + ' ' + (p.years?.label || '') + ' ' + (p.years?.precision || ''))
          if (dy && p.years?.end == null && p.living !== false) F.push({ target: 'person/' + p.id, key: `src-death:${g}`, severity: 'warn', message: `Conflicting claim: ${g} gives death year ${dy}; the data has none${p.living ? ' and marks them living' : ''}`, evidence: { file: `sources/${g}/${f}`, years: q.years || q.died } })
          if (dy && p.years?.end != null && Math.abs(dy - p.years.end) > (circa ? 30 : 1)) F.push({ target: 'person/' + p.id, key: `src-death:${g}`, severity: circa ? 'info' : 'warn', message: `Conflicting claim: ${g} gives death year ${dy}; the data says ${p.years.end}`, evidence: { file: `sources/${g}/${f}` } })
        }
      }
    }
    // hand-recorded conflicts
    for (const c of readJson(path.join(KEEPER, 'known-conflicts.json'), { conflicts: [] }).conflicts) {
      if (c.resolved) continue
      const [k, id] = c.record.split('/'); const rec = (L(repo[k])).find((r) => r.id === id)
      if (c.resolvedWhen && rec) { const v = c.resolvedWhen.field.split('.').reduce((o, x) => o?.[x], rec); if (v === c.resolvedWhen.equals) continue }
      F.push({ target: c.record, key: 'known:' + c.id, severity: 'warn', message: `Conflicting claims on ${c.field}: ${c.claims.map((x) => `${x.value ?? 'none'} (${x.source})`).join(' vs ')}`, evidence: { conflict: c.id } })
    }
    return { findings: F, passed: [], full: true, checked: people.length + places.length + edges.length }
  },
}
