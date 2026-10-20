// robots.txt / llms.txt drift: AI and search crawlers may fetch '/', the Sitemap line points at BASE, llms.txt is there,
// names BASE and the MCP URL, and its headline counts match the open-data index.
const groups = (txt) => { // -> [{agents:[..], rules:[[allow|disallow, path]]}]
  const out = []; let cur = null, lastWasAgent = false
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim(); if (!line) continue
    const [k, ...v] = line.split(':'); const key = k.trim().toLowerCase(), val = v.join(':').trim()
    if (key === 'user-agent') { if (!cur || !lastWasAgent) { cur = { agents: [], rules: [] }; out.push(cur) } cur.agents.push(val.toLowerCase()); lastWasAgent = true }
    else { lastWasAgent = false; if (cur && (key === 'allow' || key === 'disallow')) cur.rules.push([key, val]) }
  }
  return out
}
const blocksRoot = (gs, bot) => {
  const b = bot.toLowerCase(); const g = gs.find((x) => x.agents.some((a) => a !== '*' && b.includes(a))) || gs.find((x) => x.agents.includes('*'))
  if (!g) return false
  const dis = g.rules.filter(([k, p]) => k === 'disallow' && p && '/'.startsWith(p)).map(([, p]) => p.length), al = g.rules.filter(([k, p]) => k === 'allow' && '/'.startsWith(p || '/')).map(([, p]) => (p || '/').length)
  return dis.length > 0 && Math.max(...dis) >= Math.max(0, ...al)
}
export default {
  id: 'robots', cadence: 'daily', full: true,
  doc: 'robots.txt or llms.txt drifted from policy: every AI/search crawler in keeper/config.json aiBots is allowed, the Sitemap line points at BASE, llms.txt numbers match /data/index.json. Fix the generators (mcp/build-discovery.mjs, deploy.sh), not the served files.',
  async run(ctx) {
    const { cfg, http, data } = ctx, F = [], passed = []
    const r = await http.req(cfg.base + '/robots.txt', { politeness: false })
    if (!r.ok) F.push({ target: cfg.base + '/robots.txt', key: 'missing', severity: 'error', message: `robots.txt HTTP ${r.status || r.error}` })
    else {
      const gs = groups(r.text)
      for (const bot of cfg.aiBots) if (blocksRoot(gs, bot)) F.push({ target: cfg.base + '/robots.txt', key: 'bot:' + bot, severity: 'error', message: `robots.txt blocks ${bot}` }); else passed.push([cfg.base + '/robots.txt', 'bot:' + bot])
      const sm = [...r.text.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1])
      if (!sm.includes(cfg.base + '/sitemap.xml')) F.push({ target: cfg.base + '/robots.txt', key: 'sitemap-line', severity: 'warn', message: `robots.txt Sitemap line is ${sm.join(', ') || 'missing'}; expected ${cfg.base}/sitemap.xml` })
    }
    const l = await http.req(cfg.base + '/llms.txt', { politeness: false })
    if (!l.ok) F.push({ target: cfg.base + '/llms.txt', key: 'missing', severity: 'error', message: `llms.txt HTTP ${l.status || l.error}` })
    else {
      if (!l.text.includes(cfg.mcp)) F.push({ target: cfg.base + '/llms.txt', key: 'mcp-url', severity: 'warn', message: `llms.txt does not mention ${cfg.mcp}` })
      if (!l.text.includes(cfg.host)) F.push({ target: cfg.base + '/llms.txt', key: 'base-url', severity: 'warn', message: `llms.txt does not mention ${cfg.host}` })
      const idx = await http.req(cfg.base + '/data/index.json', { politeness: false })
      try {
        const counts = Object.fromEntries(JSON.parse(idx.text).files.filter((f) => f.count).map((f) => [f.kind, f.count]))
        for (const [word, kind] of [['traditions', 'tradition'], ['teachers', 'person'], ['places', 'place']]) {
          const m = l.text.match(new RegExp(`([\\d,]+) ${word}`)); if (!m || !counts[kind]) continue
          const n = Number(m[1].replace(/,/g, ''))
          if (n !== counts[kind]) F.push({ target: cfg.base + '/llms.txt', key: 'count:' + kind, severity: 'warn', message: `llms.txt says ${n} ${word}; /data/index.json has ${counts[kind]}` })
        }
      } catch { /* index unreadable: uptime owns that */ }
    }
    return { findings: F, passed, full: true, checked: cfg.aiBots.length + 4 }
  },
}
