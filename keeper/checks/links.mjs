// Internal broken links: crawl a rolling sample of sitemap pages plus the agent docs (/agents, /llms.txt, /llms-full.txt),
// collect same-site links, and check up to ~500 of them per run (HEAD then GET).
export default {
  id: 'links', cadence: 'daily',
  doc: 'A link on our own pages or agent docs points at a URL on our host that does not answer. Fix the generator that wrote the link (build-meta.mjs, build-discovery.mjs, worker.js routes) rather than the page.',
  async run(ctx) {
    const { cfg, http, data } = ctx
    const own = new Set([cfg.host, 'www.' + cfg.host, new URL(cfg.mcp).host])
    const locs = await data.allLocs()
    const pages = [...new Set([...cfg.keyPages.map((p) => cfg.base + p), cfg.base + '/llms.txt', cfg.base + '/llms-full.txt', cfg.mcp + '/llms.txt', ...ctx.rolling('links-pages', locs, ctx.limit(cfg.limits.links.pages))])]
    const found = new Map() // url -> first page it was found on
    await http.pool(pages, 6, async (pg) => {
      const r = await http.req(pg, { politeness: false })
      if (!r.ok || !r.text) return
      const baseHref = new URL((r.text.match(/<base[^>]+href=["']([^"']+)/i) || [])[1] || pg, pg)
      const raw = [...r.text.matchAll(/(?:href|src)=["']([^"'#]+)["']/gi)].map((m) => m[1])
        .concat(/\.txt$/.test(pg) ? [...r.text.matchAll(/https?:\/\/[^\s)<>"'\]{}`]+(?![<{])/g)].map((m) => m[0].replace(/[.,;:]+$/, '')).filter((x) => !/\/$/.test(x) || !/[/](person|topic|tradition|place|practice|collection|resource|clip|text|api)\/$/.test(x)) : [])
      for (const h of raw) {
        if (/^(mailto|tel|javascript|data):/i.test(h)) continue
        let u; try { u = new URL(h.replace(/&amp;/g, '&'), baseHref) } catch { continue }
        if (!own.has(u.host)) continue
        if (u.host === new URL(cfg.mcp).host && /^\/(mcp|sse|messages)\/?$/.test(u.pathname)) continue // protocol endpoints: uptime probes them
        u.hash = ''; const s = u.toString()
        if (!found.has(s)) found.set(s, pg)
      }
    })
    const all = [...found.keys()].sort()
    const n = ctx.limit(ctx.cadence === 'weekly' ? cfg.limits.links.weekly : cfg.limits.links.urls)
    const batch = ctx.rolling('links-urls', all, n, (o) => o.check === 'links' && o.status === 'open' ? o.target : null)
    const findings = [], passed = []
    await http.pool(batch, 8, async (u) => {
      let r = await http.req(u, { method: 'HEAD', politeness: false })
      if (!r.ok && r.status !== 404) r = await http.req(u, { body: 'none', politeness: false })
      if (r.ok) passed.push(u)
      else findings.push({ target: u, severity: r.status === 404 || r.status === 410 || r.status >= 500 || !r.status ? 'error' : 'warn', message: `Internal link broken: HTTP ${r.status || r.error}`, evidence: { found_on: found.get(u) || 'recheck', status: r.status } })
    })
    const known = new Set(all)
    for (const o of Object.values(ctx.state.findings)) if (o.check === 'links' && o.status === 'open' && !known.has(o.target)) passed.push(o.target) // no longer linked anywhere we crawl
    return { findings, passed, checked: batch.length, total: all.length, pages: pages.length }
  },
}
