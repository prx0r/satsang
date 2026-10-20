// Packs ../dist into site.gen.js (path -> [content-type, text]) so the whole site ships inside the Worker script.
// (Workers static-asset uploads use a per-upload JWT that the sandbox's credential gateway rewrites, so assets can't be
// uploaded from here; embedding keeps the deploy to one script upload. The site is ~200 KB gzipped.)
import fs from 'fs'
import path from 'path'
const root = new URL('../dist/', import.meta.url).pathname, out = {}
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.xml': 'application/xml; charset=utf-8' }
const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else { const ext = path.extname(p); if (T[ext]) out['/' + path.relative(root, p)] = [T[ext], fs.readFileSync(p, 'utf8')] } } }
walk(root)
fs.writeFileSync(new URL('site.gen.js', import.meta.url), 'export default ' + JSON.stringify(out) + '\n')
console.log('embedded', Object.keys(out).length, 'files')
