// Screenshot key phases of each demo practice with headless Chromium (puppeteer-core + Playwright's Chromium, see ../../shot-setup.sh).
// usage: node tools/shoot.mjs [outdir] [filter]   env DEVS="tv phone desktop"
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import http from 'http'
import url from 'url'
const puppeteer = createRequire('/tmp/smoke/')('puppeteer-core')
const ENGINE = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const out = path.resolve(process.argv[2] || path.join(ENGINE, 'shots')), filter = process.argv[3] || '', only = process.argv[4] || ''
fs.mkdirSync(out, { recursive: true })
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html', '.svg': 'image/svg+xml' }
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const f = path.join(ENGINE, p.endsWith('/') ? p + 'index.html' : p)
  if (!f.startsWith(ENGINE) || !fs.existsSync(f)) { res.writeHead(404); return res.end('nf') }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res)
}).listen(0)
const port = srv.address().port
// key phases (seconds) per practice
const SHOTS = {
  'nadi-shodhana-sivananda': [['in-left', 9.0], ['hold-base', 16.5], ['out-right', 31], ['rest-ajna', 294]],
  'ajahn-lee-method-2': [['nose-bud', 3.5], ['arms-spread', 74], ['resting-spot', 100], ['whole-body', 133], ['united', 150]],
  'kapalabhati-sivananda': [['strokes', 23.6], ['rest-skull-shines', 42]],
  'kapala-dharana-vbt34': [['gather-up', 18], ['cavern', 40], ['brahmarandhra', 104]],
  'bhramari': [['inhale', 8.5], ['hum', 14], ['silence', 108]],
  'ajahn-lee-method-1': [['recollection', 40], ['pali-quote', 43], ['counting-bud', 80], ['post-at-sea', 432], ['base-forehead', 560], ['base-top', 700], ['spread-body', 890], ['whole-body', 925]],
}
if (process.env.GATE) for (const k of Object.keys(SHOTS)) SHOTS[k] = k === 'nadi-shodhana-sivananda' ? [['start-card', null]] : []
const DEV = { tv: { width: 1920, height: 1080, deviceScaleFactor: 1 }, desktop: { width: 1440, height: 900, deviceScaleFactor: 1 }, phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } }
const devs = (process.env.DEVS || 'tv phone').split(' ')
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox', '--no-proxy-server'] })
const errs = []
for (const dev of devs) for (const [id, shots] of Object.entries(SHOTS)) {
  if (filter && !id.includes(filter)) continue
  for (const [name, t] of shots) {
    if (only && name !== only) continue
    for (let attempt = 1; attempt <= 2; attempt++) {
      let pg
      try {
        pg = await b.newPage(); await pg.setViewport(DEV[dev])
        pg.on('pageerror', e => errs.push(`${id}@${t}: ${e.message}`)); pg.on('console', m => m.type() === 'error' && !/404/.test(m.text()) && errs.push(`${id}@${t} console: ${m.text()}`))
        await pg.goto(`http://127.0.0.1:${port}/demo/?p=${id}${t == null ? '' : '&t=' + t}${process.env.Q || ''}`, { waitUntil: 'load', timeout: 45000 })
        await pg.waitForFunction('window.__frameReady === true', { timeout: 30000 })
        await new Promise(r => setTimeout(r, 200))
        const f = path.join(out, `${dev}-${id}-${name}.jpg`)
        await pg.screenshot({ path: f, type: 'jpeg', quality: 84 }); console.log(f)
        await pg.close(); break
      } catch (e) { errs.push(`${dev} ${id} ${name} attempt ${attempt}: ${e.message}`); try { await pg?.close() } catch { } }
    }
  }
}
await b.close(); srv.close()
if (errs.length) { console.error('ERRORS\n' + [...new Set(errs)].join('\n')); process.exitCode = 1 }
