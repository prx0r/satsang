// Uptime: site home, hub pages, API health, MCP (initialize, tools/list, one real tool call), sitemap, llms.txt,
// openapi.json, .well-known/mcp.json. One finding per probe while it is down; history goes to state/status.json.
export default {
  id: 'uptime', cadence: 'hourly', full: true,
  doc: 'Core endpoints answer. A failing probe is retried once after 5 s before it counts. Fix: check the Worker deploy, DNS and routes; never change DNS from keeper.',
  async run(ctx) {
    const { cfg, http } = ctx
    const mcpUrl = `${cfg.mcp}/mcp`
    const rpc = (method, params, id = 1) => http.req(mcpUrl, { method: 'POST', politeness: false, headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-06-18' }, data: JSON.stringify({ jsonrpc: '2.0', id, method, params }) })
    const parse = (t) => { try { const s = String(t || '').trim(); return JSON.parse(s.startsWith('{') || s.startsWith('[') ? s : (s.match(/data: (.*)/) || [])[1]) } catch { return null } }
    const page = (path) => async () => { const r = await http.req(cfg.base + path, { politeness: false }); return [r, r.ok && /<html/i.test(r.text || '') ? null : 'not an HTML page'] }
    const probes = [
      ['home', page('/')],
      ...cfg.hubPages.map((p) => ['hub:' + p, page(p)]),
      ['api-health', async () => { const r = await http.req(cfg.api + '/', { politeness: false }); const j = parse(r.text); return [r, j?.ok === true ? null : 'health JSON lacks ok:true'] }],
      ['mcp-initialize', async () => { const r = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'satsang-keeper', version: '1' } }); const j = parse(r.text); return [r, j?.result?.serverInfo ? null : 'no serverInfo'] }],
      ['mcp-tools-list', async () => { const r = await rpc('tools/list', {}, 2); const j = parse(r.text); const n = j?.result?.tools?.length || 0; return [r, n > 0 ? null : 'no tools', { tools: n }] }],
      ['mcp-tool-call', async () => { const r = await rpc('tools/call', cfg.mcpProbeTool, 3); const j = parse(r.text); const res = j?.result; const n = res?.structuredContent?.results?.length ?? (res?.content?.length || 0); return [r, res && !res.isError && n > 0 ? null : 'tool call returned nothing or isError', { results: n }] }],
      ['sitemap', async () => { const r = await http.req(cfg.base + '/sitemap.xml', { politeness: false }); return [r, /<(sitemapindex|urlset)/.test(r.text || '') ? null : 'not a sitemap'] }],
      ['llms.txt', async () => { const r = await http.req(cfg.base + '/llms.txt', { politeness: false }); return [r, (r.text || '').length > 200 ? null : 'too short'] }],
      ['openapi.json', async () => { const r = await http.req(cfg.mcp + '/openapi.json', { politeness: false }); return [r, parse(r.text)?.openapi ? null : 'no openapi field'] }],
      ['well-known-mcp', async () => { const r = await http.req(cfg.base + '/.well-known/mcp.json', { politeness: false }); return [r, parse(r.text)?.name ? null : 'no name field'] }],
    ]
    const findings = [], passed = []
    for (const [name, fn] of probes) {
      let [r, why, extra] = await fn()
      if (!r.ok || why) { await new Promise((s) => setTimeout(s, 5000)); [r, why, extra] = await fn() }
      const ok = r.ok && !why
      ctx.status.record(name, ok, r.ttfb ?? r.ms, r.status)
      if (ok) passed.push(name)
      else findings.push({ target: name, severity: 'error', message: `${name} is down: ${r.status ? 'HTTP ' + r.status : r.error}${why && r.ok ? ' (' + why + ')' : ''}`, evidence: { url: r.url, status: r.status, error: r.error, ms: r.ms, ...extra } })
    }
    return { findings, passed, checked: probes.length }
  },
}
