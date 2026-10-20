// Structured data: JSON-LD on key pages and a rolling sample of path pages parses, has @context/@type/name and a url or
// @id matching the canonical, and its name matches the visible <title>.
const strip = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
export default {
  id: 'jsonld', cadence: 'daily',
  doc: 'JSON-LD on a page is missing, invalid, or disagrees with the page. Fix in app/web-worker/build-meta.mjs (path pages) or worker.js resourcePage(); never hand-edit meta.gen.js.',
  async run(ctx) {
    const { cfg, http, data } = ctx
    const locs = (await data.allLocs()).filter((u) => /\/(person|topic|tradition|practice|collection|place|resource)\//.test(u))
    const pages = [...new Set([...cfg.keyPages.map((p) => cfg.base + p), ...ctx.rolling('jsonld', locs, ctx.limit(cfg.limits.jsonld))])]
    const findings = [], passed = []
    await http.pool(pages, 6, async (pg) => {
      const r = await http.req(pg, { politeness: false })
      if (!r.ok) return // uptime/sitemap own that
      const html = r.text || '', probs = []
      const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || ''
      const canon = (html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i) || [])[1]
      const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1])
      const isPathPage = /\/(person|topic|tradition|practice|collection|place|resource)\//.test(pg)
      if (!blocks.length) { if (isPathPage) probs.push('no JSON-LD') }
      for (const b of blocks) {
        let j; try { j = JSON.parse(b) } catch (e) { probs.push('JSON-LD does not parse: ' + e.message.slice(0, 80)); continue }
        const nodes = Array.isArray(j) ? j : j['@graph'] ? j['@graph'] : [j]
        const main = nodes.find((n) => n && (n.name || n.headline)) || nodes[0]
        if (!j['@context'] && !nodes[0]?.['@context']) probs.push('no @context')
        if (!main?.['@type']) probs.push('no @type')
        const name = main?.name || main?.headline
        if (!name) probs.push('no name')
        else if (isPathPage && !strip(title).includes(strip(name).slice(0, 40)) && !strip(name).includes(strip(title).split(' ').slice(0, 3).join(' '))) probs.push(`name "${String(name).slice(0, 60)}" does not match title "${title.slice(0, 60)}"`)
        const id = main?.url || main?.['@id']
        if (isPathPage && canon && id && id.replace(/\/$/, '') !== canon.replace(/\/$/, '') && !String(id).startsWith(canon)) probs.push(`url/@id ${id} differs from canonical ${canon}`)
      }
      if (probs.length) findings.push({ target: pg, severity: probs.some((p) => /parse|no JSON-LD/.test(p)) ? 'error' : 'warn', message: probs.join('; '), evidence: { title: title.slice(0, 120), blocks: blocks.length } })
      else passed.push(pg)
    })
    return { findings, passed, checked: pages.length }
  },
}
