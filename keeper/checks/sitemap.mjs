// Sitemap integrity: every child sitemap answers, has lastmod and stays on BASE; a rolling sample of <loc>s answer 200
// without redirects, carry a canonical equal to the loc, and are not noindex. Weekly runs sweep every loc.
export default {
  id: 'sitemap', cadence: 'hourly',
  doc: 'Sitemap URLs must answer 200 directly, declare <link rel="canonical"> equal to the loc, never be noindex, and each entry needs a lastmod. Fix in mcp/build-dump.mjs (sitemaps) or app/web-worker/build-meta.mjs (path pages).',
  async run(ctx) {
    const { cfg, http, data } = ctx
    const findings = [], passed = []
    const sm = await data.sitemaps()
    if (sm.error) return { findings: [{ target: cfg.base + '/sitemap.xml', key: 'index', severity: 'error', message: sm.error }], passed: [] }
    passed.push([cfg.base + '/sitemap.xml', 'index'])
    for (const m of sm.maps) {
      const noLastmod = m.locs.filter((l) => !l.lastmod).length, offHost = m.locs.filter((l) => { try { return new URL(l.loc).host !== cfg.host } catch { return true } })
      const probs = []
      if (m.status !== 200) probs.push(`HTTP ${m.status || m.error}`)
      if (!m.locs.length && m.status === 200) probs.push('no <url> entries')
      if (noLastmod) probs.push(`${noLastmod} entries without lastmod`)
      if (offHost.length) probs.push(`${offHost.length} locs not on ${cfg.host} (e.g. ${offHost[0].loc})`)
      if (probs.length) findings.push({ target: m.sitemap, key: 'child', severity: m.status !== 200 || offHost.length ? 'error' : 'warn', message: `Sitemap ${m.sitemap.split('/').pop()}: ${probs.join('; ')}`, evidence: { entries: m.locs.length } })
      else passed.push([m.sitemap, 'child'])
    }
    const locs = await data.allLocs()
    const n = ctx.limit(ctx.cadence === 'weekly' || ctx.cadence === 'all-full' ? cfg.limits.sitemap.weekly : cfg.limits.sitemap.hourly)
    const batch = ctx.rolling('sitemap', locs, n, (o) => o.check === 'sitemap' && o.key === 'page' && o.status === 'open' ? o.target : null)
    await http.pool(batch, 6, async (loc) => {
      const r = await http.req(loc, { politeness: false, redirect: 'manual' })
      const probs = []
      if (r.status >= 300 && r.status < 400) probs.push(`redirects (${r.status}) to ${r.headers?.get('location')}`)
      else if (!r.ok) probs.push(`HTTP ${r.status || r.error}`)
      else {
        const html = r.text || ''
        const canon = (html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i) || [''])[0].match(/href=["']([^"']+)/i)?.[1]
        if (/\.html?$|\/[^.]*$/.test(new URL(loc).pathname) && /<html/i.test(html)) {
          if (!canon) probs.push('no canonical link')
          else if (canon.replace(/\/$/, '') !== loc.replace(/\/$/, '')) probs.push(`canonical ${canon} differs from loc`)
        }
        if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html) || /noindex/i.test(r.headers?.get('x-robots-tag') || '')) probs.push('noindex on a sitemap URL')
      }
      if (probs.length) findings.push({ target: loc, key: 'page', severity: r.ok || (r.status >= 300 && r.status < 400) ? 'warn' : 'error', message: probs.join('; '), evidence: { status: r.status, ms: r.ms } })
      else passed.push([loc, 'page'])
    })
    return { findings, passed, checked: batch.length, total: locs.length }
  },
}
