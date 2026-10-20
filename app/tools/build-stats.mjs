#!/usr/bin/env node
// Crowd quality signals -> site/data/stats.json (RANKING §1): picks, wins, a smoothed Bradley-Terry-style logit and resonate
// counts per clip, from the API's public aggregate GET /stats/clips (D1 votes + resonates). Read by the site (quality q) and
// by mcp/build-data.mjs (clip.stats). Safe to run any time; keeps the old file if the API is unreachable.
import fs from 'node:fs'
const dst = new URL('../site/data/stats.json', import.meta.url)
try {
  const r = await fetch('https://api.tantrafiles.xyz/stats/clips', { headers: { origin: 'https://tantrafiles.xyz' }, signal: AbortSignal.timeout(15000) })
  const j = await r.json()
  fs.writeFileSync(dst, JSON.stringify({ updated: new Date().toISOString(), clips: j.clips || {} }))
  console.log('stats.json', Object.keys(j.clips || {}).length, 'clips with crowd signals')
} catch (e) { console.log('stats: API unreachable, kept the previous file', e.message) }
