// External link rot over every URL in the open-data dump (official sites, schedules, contact pages, resources, sources).
// Rolling batches, polite (1 request per host per second, hosts interleaved), HEAD then GET. 403/429/bot walls = unknown.
// Dead after cfg.deadAfter consecutive failing runs (then listed in state/dead.json).
export default {
  id: 'linkrot', cadence: 'daily',
  doc: 'An external URL cited by a record stopped answering. Re-verify on the web: find the moved page on the same organisation\'s site (or the Wayback Machine), update the record\'s source file in app/wisegraph or sources/, and cite the new URL. Never guess a URL.',
  async run(ctx) {
    const { cfg, http, data } = ctx
    const { externalUrls } = await import('../lib/data.mjs')
    const urls = await externalUrls(cfg, data)
    const byUrl = new Map(urls.map((x) => [x.url, x]))
    let batch = ctx.rolling('linkrot', urls.map((x) => x.url), ctx.limit(cfg.limits.linkrot), (o) => o.check === 'linkrot' && o.status === 'open' ? o.target : null)
    // interleave hosts so the per-host delay never stalls the pool
    const hosts = new Map(); for (const u of batch) { const h = new URL(u).host; if (!hosts.has(h)) hosts.set(h, []); hosts.get(h).push(u) }
    batch = []; for (let i = 0, more = true; more; i++) { more = false; for (const l of hosts.values()) if (l[i]) { batch.push(l[i]); more = true } }
    const findings = [], passed = []; let unknown = 0
    await http.pool(batch, 16, async (u) => {
      if (ctx.timeUp()) return
      const v = await http.linkCheck(u)
      if (v.verdict === 'ok') passed.push(u)
      else if (v.verdict === 'unknown') unknown++
      else findings.push({ target: u, message: `External link failing: ${v.status ? 'HTTP ' + v.status : v.error}`, evidence: { status: v.status, error: v.error, refs: byUrl.get(u)?.refs } })
    })
    return { findings, passed, checked: batch.length, unknown, total: urls.length }
  },
}
