// Packs ../dist into site.gen.js (path -> [content-type, text]) so the site ships inside the Worker script.
// (Workers static-asset uploads use a per-upload JWT that the sandbox's credential gateway rewrites, so assets can't be
// uploaded from here; embedding keeps the deploy to one script upload.)
// Large data files (kv-paths.json) are NOT embedded: they go to KV under content-hashed keys (site/<hash>/<path>),
// listed in site.kv.gen.js {path: {key, type, etag}} for the Worker; deploy.sh uploads /tmp/wiser-site-kv.json first.
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
const root = new URL('../dist/', import.meta.url).pathname, out = {}, kv = {}, put = []
const KVP = new Set(JSON.parse(fs.readFileSync(new URL('kv-paths.json', import.meta.url), 'utf8')).paths)
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.xml': 'application/xml; charset=utf-8' }
const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else { const ext = path.extname(p); if (!T[ext]) continue; const k = '/' + path.relative(root, p), body = fs.readFileSync(p, 'utf8')
  if (KVP.has(k)) { const h = crypto.createHash('sha256').update(body).digest('hex').slice(0, 16); kv[k] = { key: `site/${h}${k}`, type: T[ext], etag: h }; put.push({ key: `site/${h}${k}`, value: body }) } else out[k] = [T[ext], body] } } }
walk(root)
fs.writeFileSync(new URL('site.gen.js', import.meta.url), 'export default ' + JSON.stringify(out) + '\n')
fs.writeFileSync(new URL('site.kv.gen.js', import.meta.url), 'export default ' + JSON.stringify(kv) + '\n')
fs.writeFileSync('/tmp/wiser-site-kv.json', JSON.stringify(put))
console.log('embedded', Object.keys(out).length, 'files;', put.length, 'to KV (' + (put.reduce((a, x) => a + x.value.length, 0) / 1e6).toFixed(2) + ' MB)')
