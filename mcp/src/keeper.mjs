// Keeper tools (read-only): Satsang's own health and maintenance queue, read from keeper's public state on the
// keeper-state branch of github.com/prx0r/satsang (keeper/state/*.json). Fetched lazily before a keeper tool call and
// cached 10 min per isolate; if GitHub is unreachable the tools say so instead of failing the server.
const RAW = 'https://raw.githubusercontent.com/prx0r/satsang/keeper-state/keeper/state'
const RO = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
const SEV = { error: 3, warn: 2, info: 1 }
export const KEEPER_TOOLS = [
  { name: 'site_health', title: 'Site health', annotations: RO,
    description: 'Satsang\u2019s own health from its keeper (GitHub Actions checks): uptime over 30 days per probe (site, API, MCP, sitemap, llms.txt, openapi), what is down now, open maintenance findings by severity and check, dead clips/links, and the re-verify queue size.',
    inputSchema: { type: 'object', properties: {} } },
  { name: 'list_findings', title: 'Maintenance findings', annotations: RO,
    description: 'Open keeper findings (broken links, dead YouTube embeds, sitemap/JSON-LD problems, stale or unsourced records, data conflicts, leak guards), highest priority first. Filter by severity (error, warn, info), check (uptime, sitemap, links, linkrot, oembed, jsonld, provenance, integrity, leaks, robots, bundle, perf) or status.',
    inputSchema: { type: 'object', properties: { severity: { type: 'string', enum: ['error', 'warn', 'info'] }, check: { type: 'string' }, status: { type: 'string', enum: ['open', 'fixed', 'ignored', 'all'], default: 'open' }, limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 } } } },
  { name: 'next_maintenance_task', title: 'Next maintenance task', annotations: RO,
    description: 'The highest-priority unclaimed keeper finding with how to fix it and how to claim it (keeper/claims.json in a PR to github.com/prx0r/satsang). For agents that help maintain Satsang; read-only here, fixes go through pull requests.',
    inputSchema: { type: 'object', properties: { check: { type: 'string' } } } },
]
const NAMES = new Set(KEEPER_TOOLS.map((t) => t.name))
let cache = { at: 0, data: null, error: null }

// call before handling a JSON-RPC body; loads keeper state only when a keeper tool is being called
export async function ensureKeeper(ctx, body) {
  const msgs = Array.isArray(body) ? body : [body]
  if (!msgs.some((m) => m && m.method === 'tools/call' && NAMES.has(m.params?.name))) return
  if (cache.data && Date.now() - cache.at < 600e3) { ctx.keeper = cache; return }
  try {
    const get = async (n) => { const r = await fetch(`${RAW}/${n}.json`, { cf: { cacheTtl: 600 }, signal: AbortSignal.timeout(4000) }); if (!r.ok) throw new Error(`${n}.json HTTP ${r.status}`); return r.json() }
    const [findings, status, dead] = await Promise.all([get('findings'), get('status'), get('dead').catch(() => null)])
    cache = { at: Date.now(), data: { findings, status, dead }, error: null }
  } catch (e) { cache = { at: Date.now() - 540e3, data: cache.data, error: String(e.message || e) } }
  ctx.keeper = cache
}

const rank = (o) => (SEV[o.severity] || 0) * 1e6 + Math.min(o.fails || 0, 999) * 1e3 - (o.autofix ? 500 : 0)
const slim = (o) => ({ id: o.id, check: o.check, severity: o.severity, target: o.target, message: o.message, fails: o.fails, first_seen: o.first_seen, last_seen: o.last_seen, status: o.status, claimed_by: o.claimed_by, evidence: o.evidence })

export function keeperTool(ctx, name, a = {}) {
  if (!NAMES.has(name)) return undefined
  const k = ctx.keeper
  if (!k?.data) return { available: false, error: k?.error || 'keeper state not loaded', source: RAW }
  const all = Object.values(k.data.findings.findings || {})
  const stale = k.error ? { warning: 'showing cached keeper state: ' + k.error } : {}
  if (name === 'site_health') {
    const open = all.filter((o) => o.status === 'open'), by = (f) => open.reduce((m, o) => ((m[o[f]] = (m[o[f]] || 0) + 1), m), {})
    const probes = Object.fromEntries(Object.entries(k.data.status.probes || {}).map(([n, p]) => { const t = Object.values(p.days || {}).reduce((s, d) => [s[0] + d[0], s[1] + d[1]], [0, 0]); return [n, { uptime30d: t[1] ? +((t[0] / t[1]) * 100).toFixed(2) : null, last: p.last }] }))
    return { site: k.data.status.base, updated: k.data.findings.updated, uptime30d: k.data.status.uptime30d, down: k.data.status.down || [], probes, open: open.length, bySeverity: by('severity'), byCheck: by('check'),
      dead: k.data.dead ? { clips: k.data.dead.clips?.length || 0, urls: k.data.dead.urls?.length || 0 } : null, report: 'https://github.com/prx0r/satsang/blob/keeper-state/keeper/REPORT.md', ...stale }
  }
  if (name === 'list_findings') {
    const s = a.status || 'open', lim = Math.min(Math.max(Number(a.limit) || 20, 1), 100)
    const f = all.filter((o) => (s === 'all' || o.status === s) && (!a.severity || o.severity === a.severity) && (!a.check || o.check === a.check)).sort((x, y) => rank(y) - rank(x))
    return { total: f.length, findings: f.slice(0, lim).map(slim), updated: k.data.findings.updated, ...stale }
  }
  // next_maintenance_task
  const fresh = (o) => !o.claimed_by || (o.claimed_at && Date.now() - new Date(o.claimed_at).getTime() > 7 * 86400e3)
  const o = all.filter((x) => x.status === 'open' && fresh(x) && (!a.check || x.check === a.check) && !(x.autofix && x.severity === 'info')).sort((x, y) => rank(y) - rank(x) || (x.first_seen < y.first_seen ? -1 : 1))[0]
  if (!o) return { task: null, message: 'Nothing unclaimed is open. Thank you.', ...stale }
  return { task: slim(o), how: `Claim it by adding "${o.id}": {"claimed_by": "<you>", "claimed_at": "<ISO time>"} to keeper/claims.json in a PR to github.com/prx0r/satsang; fix it at the source; open a PR titled "keeper: fix ${o.id} (${o.check})". Rules and the never-list: keeper/AGENTS.md. The next keeper run closes it when it passes.`,
    rules: 'https://github.com/prx0r/satsang/blob/main/keeper/AGENTS.md', ...stale }
}
