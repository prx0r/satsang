#!/usr/bin/env node
// data/wiser.json -> data/wiser.mcp.json: what the MCP Worker bundles (Cloudflare free plan: 3 MB gzip script, small CPU budget).
// Keeps every non-clip record; clips = every ballot talk (1-20 min) + each teacher's 12 most-viewed full talks; drops per-record
// licence stamps (the licence is in meta) and the uploader's raw title. Same schema shapes, fewer clips.
import fs from 'node:fs'
const d = JSON.parse(fs.readFileSync(new URL('data/wiser.json', import.meta.url), 'utf8'))
const full = {}
for (const c of Object.values(d.clip)) if (!c.inBallot) (full[c.speaker] ||= []).push(c)
const keepFull = new Set(Object.values(full).flatMap((L) => L.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 12).map((c) => c.id)))
// gold talks and every talk a collection/course points at stay in the bundle (get_course, get_topic gold)
for (const c of Object.values(d.clip)) if (c.quality?.tier === 'gold') keepFull.add(c.id)
for (const col of Object.values(d.collection)) for (const u of col.units || []) for (const it of u.items || []) if (it.ref?.id?.startsWith('clip/')) keepFull.add(it.ref.id.slice(5))
const clip = {}
for (const [id, c] of Object.entries(d.clip)) { if (!c.inBallot && !keepFull.has(id)) continue; const { meta, sourceTitle, videoSeconds, ...rest } = c; clip[id] = rest }
for (const k of ['person', 'tradition', 'text', 'practice', 'topic', 'collection', 'place', 'edge']) for (const r of Object.values(d[k])) if (r.meta && Object.keys(r.meta).length === 1 && r.meta.license) delete r.meta
const out = { ...d, clip, meta: { ...d.meta, counts: { ...d.meta.counts, clip: Object.keys(clip).length }, note: 'MCP bundle: ballot talks + 12 full talks per teacher + every gold or collection talk; the full set is in the /data dump.' } }
fs.writeFileSync(new URL('data/wiser.mcp.json', import.meta.url), JSON.stringify(out))
console.log('data/wiser.mcp.json', Object.keys(clip).length, 'clips', (fs.statSync(new URL('data/wiser.mcp.json', import.meta.url)).size / 1e6).toFixed(2), 'MB')
