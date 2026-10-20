// Data access for checks: the live open-data dump (what the public sees), the repo's MCP data (mcp/data/wiser.json,
// what gets deployed) with the MCP's own provenance rules, and the live sitemaps. Everything is memoised per run.
import fs from 'node:fs'
import path from 'node:path'
import { ROOT } from './util.mjs'

export function makeData(cfg, http) {
  const memo = new Map()
  const once = (k, fn) => { if (!memo.has(k)) memo.set(k, fn()); return memo.get(k) }

  // live dump /data/<kind>.json, falling back to the repo copy mcp/dist-data/<kind>.json
  const dump = (kind) => once('dump:' + kind, async () => {
    const r = await http.req(`${cfg.base}/data/${kind}.json`, { politeness: false, timeout: 60000 })
    if (r.ok) { try { return JSON.parse(r.text) } catch { /* fall through */ } }
    const f = path.join(ROOT, 'mcp/dist-data', kind + '.json')
    return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : []
  })

  const repo = () => once('repo', async () => {
    const f = path.join(ROOT, 'mcp/data/wiser.json')
    return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null
  })
  const list = (x) => (Array.isArray(x) ? x : Object.values(x || {}))

  // MCP index + provenance function (mcp/src), so keeper judges records exactly as agents receive them
  const mcp = () => once('mcp', async () => {
    const data = await repo(); if (!data) return null
    const core = await import(path.join(ROOT, 'mcp/src/core.mjs'))
    const agents = await import(path.join(ROOT, 'mcp/src/agents.mjs'))
    return { ctx: core.buildIndex(data), prov: agents.prov, livingStatus: agents.livingStatus }
  })

  // sitemap index -> [{sitemap, locs:[{loc,lastmod}], status}]
  const sitemaps = () => once('sitemaps', async () => {
    const out = []
    const parse = (xml) => [...xml.matchAll(/<(url|sitemap)>([\s\S]*?)<\/\1>/g)].map((m) => ({ loc: (m[2].match(/<loc>\s*([^<]+?)\s*<\/loc>/) || [])[1], lastmod: (m[2].match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/) || [])[1] || null, kind: m[1] }))
    const top = await http.req(`${cfg.base}/sitemap.xml`, { politeness: false })
    if (!top.ok) return { error: `sitemap.xml ${top.status || top.error}`, maps: [] }
    const items = parse(top.text)
    if (/<sitemapindex/.test(top.text)) {
      for (const sm of items.filter((i) => i.kind === 'sitemap')) {
        const r = await http.req(sm.loc, { politeness: false })
        out.push({ sitemap: sm.loc, lastmod: sm.lastmod, status: r.status, error: r.error, locs: r.ok ? parse(r.text).filter((i) => i.kind === 'url') : [] })
      }
    } else out.push({ sitemap: `${cfg.base}/sitemap.xml`, status: top.status, locs: items.filter((i) => i.kind === 'url') })
    return { maps: out }
  })
  const allLocs = async () => { const s = await sitemaps(); return [...new Set(s.maps.flatMap((m) => m.locs.map((l) => l.loc)).filter(Boolean))].sort() }

  return { dump, repo, mcp, sitemaps, allLocs, list }
}

// every external URL in the public dump, with the records that cite it
export async function externalUrls(cfg, data) {
  const own = new Set([new URL(cfg.base).host, 'www.' + new URL(cfg.base).host, new URL(cfg.mcp).host, new URL(cfg.api).host, 'tantrafiles.xyz', 'satsang.digital'])
  const m = new Map()
  const add = (u, ref) => {
    if (typeof u !== 'string' || !/^https?:\/\//i.test(u)) return
    let h; try { h = new URL(u).host.toLowerCase() } catch { return }
    if (own.has(h) || own.has(h.replace(/^www\./, ''))) return
    if (/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(h) && /watch\?v=|youtu\.be\//.test(u)) return // clips: oembed check
    if (!m.has(u)) m.set(u, new Set()); if (m.get(u).size < 5) m.get(u).add(ref)
  }
  for (const p of await data.dump('person')) { for (const l of p.links || []) add(l.url, 'person/' + p.id); for (const t of p.freeTexts || []) add(t.url, 'person/' + p.id) }
  for (const p of await data.dump('place')) {
    const r = 'place/' + p.id
    add(p.url, r); add(p.scheduleUrl, r); add(p.contact?.page, r); add(p.contact?.pageSource, r)
    for (const x of p.programmes || []) add(x.scheduleUrl, r)
    for (const x of p.events || []) add(x.url, r)
    for (const x of p.resources || []) { add(x.url, r); add(x.source_url || x.sourceUrl, r) }
    for (const s of p.meta?.sources || []) add(s.url || s, r)
  }
  for (const t of await data.dump('text')) for (const e of t.editions || []) add(e.url, 'text/' + t.id)
  for (const x of await data.dump('practice')) for (const s of x.sources || []) add(s.url || s, 'practice/' + x.id)
  for (const e of await data.dump('edge')) for (const s of e.sources || []) add(s.url || s, 'edge/' + e.id)
  return [...m.entries()].map(([url, refs]) => ({ url, refs: [...refs] })).sort((a, b) => (a.url < b.url ? -1 : 1))
}
