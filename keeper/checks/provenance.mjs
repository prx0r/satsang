// Provenance, judged with the MCP's own prov() on the repo data (mcp/data/wiser.json): every record has source_url,
// verified_on and confidence; flags verified_on older than cfg.staleDays, places whose programme/event dates are past,
// people whose living status is unknown, and records whose only source is our own page. Writes the re-verify queue.
const MONTHS = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec'
export default {
  id: 'provenance', cadence: 'daily', full: true, autofix: 'reverify-queue',
  doc: 'A record lacks provenance or is stale. Agents: take items from state/reverify.json, re-check the fact on the official source, update the source file (app/wisegraph/*.json, place-contacts.json, sources/<group>/) with the source URL and a fresh check date, then rebuild. Never invent dates or contacts.',
  async run(ctx) {
    const { cfg, data } = ctx
    const m = await data.mcp()
    if (!m) return { findings: [], passed: [], skipped: 'mcp/data/wiser.json not found' }
    const { ctx: mc, prov, livingStatus } = m
    const findings = [], queue = []
    const now = new Date(), year = now.getUTCFullYear()
    const stale = (d) => !d || (now - new Date(d)) / 86400000 > cfg.staleDays
    const kinds = { person: mc.person, tradition: mc.tradition, place: mc.place, practice: mc.practice, resource: mc.resource, collection: mc.collection, topic: mc.topic }
    let checked = 0, selfSourced = { person: 0, tradition: 0, place: 0, practice: 0 }
    for (const [kind, recs] of Object.entries(kinds)) for (const r of Object.values(recs || {})) {
      checked++
      const p = prov(mc, kind, r), t = `${kind}/${r.id}`
      const miss = ['source_url', 'verified_on', 'confidence'].filter((k) => !p[k])
      if (miss.length) findings.push({ target: t, key: 'missing', severity: 'error', message: `Missing ${miss.join(', ')}`, evidence: p })
      if (p.verified_on && stale(p.verified_on)) { findings.push({ target: t, key: 'stale', severity: 'warn', message: `verified_on ${p.verified_on} is older than ${cfg.staleDays} days`, evidence: { source_url: p.source_url }, autofix: 'reverify-queue' }); queue.push({ kind, id: r.id, reason: 'stale', verified_on: p.verified_on, source_url: p.source_url }) }
      if (p.source_url && p.url && p.source_url === p.url && kind in selfSourced) selfSourced[kind]++
      if (kind === 'place') {
        if (p.source_url === p.url) findings.push({ target: t, key: 'self-source', severity: 'info', message: 'Place has no external source (no official site, contact page or Wikidata)', autofix: 'reverify-queue' })
        for (const x of [...(r.events || []), ...(r.programmes || [])]) {
          const w = `${x.when || ''} ${x.date || ''} ${x.start || ''} ${x.end || ''} ${x.dates || ''}`
          const iso = [...w.matchAll(/\b(20\d\d)-(\d\d)-(\d\d)\b/g)].map((d) => new Date(d[0]))
          const ym = [...w.toLowerCase().matchAll(new RegExp(`\\b(${MONTHS})[a-z]*\\.? (20\\d\\d)\\b`, 'g'))].map((d) => new Date(`${d[1]} 28 ${d[2]}`))
          const yrs = /\b(20\d\d)\b/.test(w) && !iso.length && !ym.length ? [new Date(`${w.match(/\b(20\d\d)\b/)[1]}-12-31`)] : []
          const dates = [...iso, ...ym, ...yrs].filter((d) => !isNaN(d))
          if (dates.length && Math.max(...dates) < now) { findings.push({ target: t, key: 'past:' + (x.id || x.name), severity: 'warn', message: `Programme/event "${x.name}" has only past dates (${w.trim().slice(0, 60)})`, evidence: { url: x.url || x.scheduleUrl }, autofix: 'reverify-queue' }); queue.push({ kind, id: r.id, reason: 'past-date', item: x.name, source_url: x.url || x.scheduleUrl }) }
        }
        if (p.confidence === 'low') queue.push({ kind, id: r.id, reason: 'low-confidence', source_url: p.source_url })
      }
      if (kind === 'person') {
        const ls = livingStatus(r)
        if (ls.status === 'unknown') { findings.push({ target: t, key: 'alive-unknown', severity: 'info', message: 'Living status unknown (no years recorded)', autofix: 'reverify-queue' }); queue.push({ kind, id: r.id, reason: 'alive-unknown', source_url: p.source_url }) }
        else if (ls.status === 'likely-living') queue.push({ kind, id: r.id, reason: 'likely-living-inferred', source_url: p.source_url })
      }
    }
    const pri = { stale: 0, 'past-date': 1, 'alive-unknown': 2, 'low-confidence': 3, 'likely-living-inferred': 4 }
    queue.sort((a, b) => pri[a.reason] - pri[b.reason])
    ctx.autofix('reverify', { updated: ctx.today, rule: `verified_on > ${cfg.staleDays} days, past programme dates, living status unknown or inferred, low-confidence places`, count: queue.length, items: queue.slice(0, cfg.reverifyLimit) })
    return { findings, passed: [], full: true, checked, selfSourced }
  },
}
