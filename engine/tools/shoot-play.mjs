// Headless screenshots of the milestone-1 views: the SVG figure (front, side, reduced motion) and the Trace the Sound play.
// usage: node tools/shoot-play.mjs [outdir] [filter]     (toolchain: sh ../shot-setup.sh → /tmp/chromium + /tmp/smoke puppeteer-core)
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import http from 'http'
import url from 'url'
const puppeteer = createRequire('/tmp/smoke/')('puppeteer-core')
const ENGINE = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const out = path.resolve(process.argv[2] || path.join(ENGINE, 'shots')), filter = process.argv[3] || ''
fs.mkdirSync(out, { recursive: true })
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg' }
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const f = path.join(ENGINE, p.endsWith('/') ? p + 'index.html' : p)
  if (!f.startsWith(ENGINE) || !fs.existsSync(f)) { res.writeHead(404); return res.end('nf') }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res)
}).listen(0)
const port = srv.address().port
const DEV = { tv: { width: 1920, height: 1080, deviceScaleFactor: 1 }, desktop: { width: 1440, height: 900, deviceScaleFactor: 1 }, phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } }
// [name, path, device, { reduced, wait }]: play stills use ?still=<t> (deterministic renderAt)
const SHOTS = [
  ['figure-front-inhale', '/figure/?view=front&t=3.9', 'desktop'],
  ['figure-front-exhale', '/figure/?view=front&t=9.9', 'desktop'],
  ['figure-side-inhale', '/figure/?view=side&t=3.9', 'desktop'],
  ['figure-both-phone', '/figure/?t=2.6', 'phone'],
  ['figure-reduced-motion', '/figure/?t=3.9', 'desktop', { reduced: true }],
  ['trace-start-card', '/play/?p=vbt-trace-the-sound', 'phone'],
  ['trace-find-a-sound', '/play/?p=vbt-trace-the-sound&still=14', 'phone'],
  ['trace-inward', '/play/?p=vbt-trace-the-sound&still=40', 'phone'],
  ['trace-fading', '/play/?p=vbt-trace-the-sound&still=66', 'tv'],
  ['trace-flat-line-rest', '/play/?p=vbt-trace-the-sound&still=118&rested=31', 'phone'],
  ['trace-end-card', '/play/?p=vbt-trace-the-sound&still=end&rested=47', 'phone'],
  ['trace-reduced-motion', '/play/?p=vbt-trace-the-sound&still=40', 'phone', { reduced: true }],
  ['trace-tv-inward', '/play/?p=vbt-trace-the-sound&still=40', 'tv'],
]
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox', '--no-proxy-server', ...(process.env.GLFLAGS === '0' ? [] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']), '--autoplay-policy=no-user-gesture-required'] })
const errs = [], done = []
for (const [name, p, dev, o = {}] of SHOTS) {
  if (filter && !name.includes(filter)) continue
  let pg
  try {
  pg = await b.newPage()
  pg.on('pageerror', e => errs.push(`${name}: ${e.message}`))
  pg.on('console', m => { if (m.type() === 'error' && !/fonts|Failed to load resource/.test(m.text())) errs.push(`${name}: ${m.text()}`) })
  await pg.setViewport(DEV[dev])
  if (o.reduced) await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await pg.goto(`http://127.0.0.1:${port}${p}`, { waitUntil: 'networkidle0', timeout: 30000 }).catch(e => errs.push(`${name}: goto ${e.message}`))
  await pg.waitForFunction('window.__ready === true', { timeout: 20000 }).catch(() => errs.push(`${name}: not ready`))
  await new Promise(r => setTimeout(r, o.wait ?? 600))
  const f = path.join(out, `${dev}-${name}.jpg`)
  await pg.screenshot({ path: f, type: 'jpeg', quality: 88 })
  const info = await pg.evaluate(() => ({ gl: window.__gl || null, overflow: document.documentElement.scrollWidth > innerWidth + 1 }))
  done.push(`${path.basename(f)}${info.gl ? ' gl=' + info.gl : ''}${info.overflow ? ' OVERFLOW' : ''}`)
  } catch (e) { errs.push(`${name}: ${e.message}`) }
  await pg?.close().catch(() => { })
}
await b.close(); srv.close()
console.log(done.join('\n'))
if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exitCode = 1 }
