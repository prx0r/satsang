// Worker bundle size under the Workers Free limit (3 MB gzip). Exact for the site when the build output
// (app/web-worker/site.gen.js) is present; otherwise an estimate from the tracked inputs, labelled as such.
// The MCP bundle is estimated from mcp/data/wiser.mcp.json + mcp/src + mcp/discovery.
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { ROOT } from '../lib/util.mjs'
const gz = (files) => { const bufs = files.filter((f) => fs.existsSync(f)).map((f) => fs.readFileSync(f)); const raw = Buffer.concat(bufs); return { raw: raw.length, gzip: zlib.gzipSync(raw, { level: 9 }).length, files: bufs.length } }
const walk = (d, re) => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name), re) : re.test(e.name) ? [path.join(d, e.name)] : []) : []
export default {
  id: 'bundle', cadence: 'weekly', full: true,
  doc: 'A Worker script is near or over the 3 MB gzip Free-plan limit. Levers: move clips.json and meta.gen.js to KV like the open-data dumps (site); slim mcp/data/wiser.mcp.json (MCP). Never upgrade the plan (no purchases).',
  async run(ctx) {
    const lim = ctx.cfg.workerGzipLimit, F = [], out = {}
    const ww = process.env.KEEPER_APP_DIR ? path.join(process.env.KEEPER_APP_DIR, 'web-worker') : path.join(ROOT, 'app/web-worker') // KEEPER_APP_DIR: a built app/ checkout
    const exact = fs.existsSync(path.join(ww, 'site.gen.js'))
    out.site = exact ? { ...gz(['site.gen.js', 'meta.gen.js', 'resources.gen.js', 'worker.js'].map((f) => path.join(ww, f))), basis: 'build output' }
      : { ...gz([...['meta.gen.js', 'resources.gen.js', 'worker.js'].map((f) => path.join(ww, f)), path.join(ROOT, 'app/clips.site.json'), ...walk(path.join(ROOT, 'app/site'), /\.(html|css|js|json|txt|xml|svg)$/).filter((f) => !/\/data\/(open|dump)\//.test(f))]), basis: 'estimate from tracked inputs (build output absent)' }
    out.mcp = { ...gz([path.join(ROOT, 'mcp/data/wiser.mcp.json'), ...walk(path.join(ROOT, 'mcp/src'), /\.mjs$/), ...walk(path.join(ROOT, 'mcp/discovery'), /\.(txt|json|html)$/)]), basis: 'estimate (data + src + discovery)' }
    for (const [k, v] of Object.entries(out)) {
      if (!v.files) continue
      const pct = Math.round((v.gzip / lim) * 100)
      const est = !/build output/.test(v.basis) && k === 'site' // the site estimate over-counts (not every file under app/site is embedded)
      if (v.gzip > lim) F.push({ target: 'worker:' + k, severity: est ? 'info' : 'error', message: `${k} Worker ~${(v.gzip / 1e6).toFixed(2)} MB gzip, over the ${(lim / 1e6).toFixed(0)} MB limit (${v.basis})`, evidence: v })
      else if (pct >= 85) F.push({ target: 'worker:' + k, severity: est ? 'info' : 'warn', message: `${k} Worker ~${(v.gzip / 1e6).toFixed(2)} MB gzip = ${pct}% of the limit (${v.basis})`, evidence: v })
    }
    ctx.status.note('bundle', out)
    return { findings: F, passed: [], full: true, checked: 2, sizes: out }
  },
}
