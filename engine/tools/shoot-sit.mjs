// Headless check + screenshots of the hands-off player /sit/ (puppeteer-core + /tmp/chromium, see work/setup-tmp.sh smoke|chrome).
// Writes engine/shots/sit-*.jpg (desktop 1280×800, phone 390×844 @2x). usage: node tools/shoot-sit.mjs [baseUrl] [--only name,…]
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import http from 'http'
import url from 'url'
import { execFileSync } from 'child_process'
const puppeteer = createRequire('/tmp/smoke/')('puppeteer-core')
const ENGINE = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const out = path.join(ENGINE, 'shots'); fs.mkdirSync(out, { recursive: true })
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.mp3': 'audio/mpeg' }
const args = process.argv.slice(2), only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null
let srv, base = args.find(a => /^https?:/.test(a))
if (!base) {
  srv = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = path.join(ENGINE, p.endsWith('/') ? p + 'index.html' : p)
    if (!f.startsWith(ENGINE) || !fs.existsSync(f)) { res.writeHead(404); return res.end('nf') }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res)
  }).listen(0)
  base = `http://127.0.0.1:${srv.address().port}`
}
const browser = await puppeteer.launch({ executablePath: '/tmp/chromium', headless: true,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log(c ? 'ok  ' : 'FAIL', m) }
const D = { width: 1280, height: 800, deviceScaleFactor: 1 }, PH = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
const stats = file => JSON.parse(execFileSync('python3', ['-c', `import sys,json
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGB');w,h=im.size;im=im.resize((160,int(160*h/w)))
px=list(im.getdata());n=len(px)
print(json.dumps({'white':sum(min(p)>246 for p in px)/n,'lit':sum(min(p)<=246 for p in px)/n,'dark':sum(max(p)<40 for p in px)/n}))`, file], { encoding: 'utf8' }))
async function shot(name, vp, qs, check, after) {
  if (only && !only.includes(name)) return
  const page = await browser.newPage(); const errs = []
  page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/favicon|404|manifest/.test(m.text())) errs.push(m.text()) })
  await page.setViewport(vp)
  await page.goto(`${base}/sit/${qs}`, { waitUntil: 'load' })
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1', { timeout: 30000 }).catch(() => errs.push('never ready'))
  if (after) await after(page)
  await new Promise(r => setTimeout(r, 2600))
  const info = await page.evaluate(() => ({ stage: document.getElementById('stage').textContent, where: document.getElementById('where').textContent, caption: document.getElementById('caption').textContent,
    total: window.__sit?.session?.total_s ?? window.__sit?.plan()?.total_s, start: !document.getElementById('start').hidden, eyes: document.body.classList.contains('eyes'),
    sheet: !document.getElementById('sheet').hidden ? document.getElementById('sheet').innerText : '', plan: document.getElementById('plan').textContent, fmt: window.__body?.fmt }))
  const file = path.join(out, `sit-${name}.jpg`); await page.screenshot({ path: file, type: 'jpeg', quality: 86 })
  Object.assign(info, stats(file))
  console.log(name, JSON.stringify({ stage: info.stage, where: info.where, caption: info.caption.slice(0, 60), lit: info.lit.toFixed(3), total: info.total, plan: info.plan.slice(0, 90) }))
  ok(!errs.length, `${name}: no page errors ${errs.join(' | ')}`)
  if (check) check(info)
  await page.close(); return info
}
await shot('desktop-start', D, '?p=ajahn-lee-method-2&hq', i => { ok(i.start && /no breath holds/.test(i.plan), 'start card with plan'); ok(i.lit > 0.02, 'body visible behind the card') })
await shot('desktop-m1-bases', D, '?p=ajahn-lee-method-1&hq&t=560&still', i => { ok(/bases/i.test(i.stage), 'Method 1 at 9:20 is in the bases stage: ' + i.stage); ok(/head|forehead|nose/.test(i.where), 'attention on a head base: ' + i.where) })
await shot('desktop-m2-spread-sheet', D, '?p=ajahn-lee-method-2&hq&t=162&still&sheet', i => { ok(/spread/i.test(i.stage), 'Method 2 spread stage'); ok(/Method 2/.test(i.sheet) && /base of the skull/.test(i.sheet), 'From the text shows the Method 2 passage with its quote') })
await shot('desktop-vbt-sheet', D, '?p=vbt-space-contemplation&hq&t=60&still&sheet', i => { ok(/Satsang’s own words/.test(i.sheet) && !/Hareesh|Wallis/.test(i.sheet.split('Satsang’s own words')[0].replace(/source/g, '')), 'VBT: our own words, translation linked not quoted') })
await shot('desktop-reduced', D, '?p=mn118-anapanasati&hq&reduce&t=100&still', i => { ok(/tetrad|body/i.test(i.stage), 'MN 118 first tetrad'); ok(i.lit > 0.02, 'reduced motion still draws the body') })
await shot('phone-start', PH, '?r=morning-thai-forest', i => { ok(i.start && Math.abs(i.total - 1650) < 2, `routine planned at 27:30 (${i.total})`) })
await shot('phone-m2-spread', PH, '?p=ajahn-lee-method-2&t=184&still', i => ok(/foot|skull/.test(i.where), 'attention moves down the leg: ' + i.where))
await shot('phone-routine-goodwill', PH, '?r=morning-thai-forest&t=1540&still', i => { ok(/Goodwill/.test(i.stage), 'routine reaches goodwill: ' + i.stage); ok(/heart|chest/.test(i.where), 'goodwill at the heart: ' + i.where) })
await shot('phone-routine-method1-rounds', PH, '?r=morning-thai-forest&t=900&still', i => ok(/Method 1/.test(i.stage), 'routine item 2 is Method 1: ' + i.stage))
await shot('phone-eyes-closed', PH, '?p=ajahn-lee-method-1&t=200&still&eyes=1', i => { ok(i.eyes && i.dark > 0.8, `eyes-closed darkens the screen (${i.dark.toFixed(2)})`) })
await shot('phone-end', PH, '?p=karaniya-metta&t=10&still&end', null)
await browser.close(); srv?.close()
console.log(fails.length ? `FAIL ${fails.length}: ${fails.join('; ')}` : 'all ok'); process.exitCode = fails.length ? 1 : 0
