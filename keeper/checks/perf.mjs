// Performance smoke: TTFB and page weight (HTML + same-origin scripts and stylesheets) for the key pages.
export default {
  id: 'perf', cadence: 'weekly', full: true,
  doc: 'A key page is slow to first byte or heavy. Look at what grew (app.js, embedded JSON); keep the dark design; move big data to KV or lazy-load it.',
  async run(ctx) {
    const { cfg, http } = ctx, F = [], res = {}
    for (const p of cfg.keyPages) {
      const u = cfg.base + p, ttfbs = []
      let r
      for (let i = 0; i < 3; i++) { r = await http.req(u, { politeness: false, headers: { 'accept-encoding': 'identity' } }); ttfbs.push(r.ttfb ?? r.ms) }
      if (!r.ok) continue
      const baseHref = new URL((r.text.match(/<base[^>]+href=["']([^"']+)/i) || [])[1] || u, u)
      const assets = [...new Set([...(r.text || '').matchAll(/<script[^>]+src=["']([^"']+)["']|<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi)].map((m) => new URL(m[1] || m[2], baseHref).toString()))].filter((a) => new URL(a).host === cfg.host)
      let weight = r.bytes || 0
      for (const a of assets) { const x = await http.req(a, { politeness: false }); weight += x.bytes || 0 }
      const ttfb = ttfbs.sort((a, b) => a - b)[1]
      res[p] = { ttfb, weight, assets: assets.length }
      if (ttfb > cfg.limits.perfTtfbMs) F.push({ target: u, key: 'ttfb', severity: 'warn', message: `TTFB ${ttfb} ms (median of 3) over ${cfg.limits.perfTtfbMs} ms` })
      if (weight > cfg.limits.perfWeightBytes) F.push({ target: u, key: 'weight', severity: 'warn', message: `Page weight ${(weight / 1e6).toFixed(2)} MB uncompressed over ${(cfg.limits.perfWeightBytes / 1e6).toFixed(1)} MB` })
    }
    ctx.status.note('perf', res)
    return { findings: F, passed: [], full: true, checked: cfg.keyPages.length, perf: res }
  },
}
