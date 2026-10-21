// Headless check of /breath/ (puppeteer-core + /tmp/chromium from ../../shot-setup.sh). Poses the breath at inhale / exhale,
// checks the frame really has coloured light on white, simulates a hold/release, and writes engine/shots/breath-*.jpg.
// usage: node breath/shoot.mjs [baseUrl]
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import http from 'http'
import url from 'url'
import { execFileSync } from 'child_process'
const puppeteer = createRequire('/tmp/smoke/')('puppeteer-core')
const ENGINE = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const out = path.join(ENGINE, 'shots'); fs.mkdirSync(out, { recursive: true })
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html' }
let srv, base = process.argv[2]
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
async function shot(name, vp, setup, q = '') {
  const page = await browser.newPage(); const errs = []
  page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push(m.text()) })
  await page.setViewport(vp)
  await page.goto(`${base}/breath/${q}`, { waitUntil: 'load' })
  await new Promise(r => setTimeout(r, 1500))
  if (setup) await setup(page)
  await new Promise(r => setTimeout(r, 2500))
  const info = await page.evaluate(() => ({ fmt: window.__body && window.__body.fmt, count: window.__body && window.__body.count, s: { ...window.__breath.state } }))
  const file = path.join(out, `breath-${name}.jpg`)
  await page.screenshot({ path: file, type: 'jpeg', quality: 86 })
  // pixel stats from the screenshot (the WebGL buffer isn't preserved for readback)
  Object.assign(info, JSON.parse(execFileSync('python3', ['-c', `import sys,json
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGB').resize((160,int(160*Image.open(sys.argv[1]).size[1]/Image.open(sys.argv[1]).size[0])))
px=list(im.getdata());n=len(px)
print(json.dumps({'white':sum(min(p)>246 for p in px)/n,'lit':sum(min(p)<=246 for p in px)/n,'sat':sum(max(p)-min(p)>40 for p in px)/n}))`, file], { encoding: 'utf8' })))
  console.log(name, JSON.stringify({ lit: info.lit.toFixed(3), white: info.white.toFixed(3), sat: info.sat.toFixed(3), fmt: info.fmt, n: info.count, level: info.s.level.toFixed(2), src: info.s.source }))
  ok(!errs.length, `${name}: no page errors ${errs.join(' | ')}`)
  ok(info.white > 0.55 && info.lit > 0.04 && info.sat > 0.01, `${name}: coloured light on a white page`)
  await page.close(); return info
}
const D = { width: 1280, height: 800, deviceScaleFactor: 1 }, PH = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
// headless Chromium reports 2 cores, which the page treats as a low-end device; ?hq shows what a real desktop gets
const inh = await shot('inhale', D, p => p.evaluate(() => __breath.force(0.92, 0.3)), '?hq')
const exh = await shot('exhale', D, p => p.evaluate(() => __breath.force(0.22, -0.3)), '?hq')
ok(inh.lit > exh.lit, 'inhale carries more light than exhale')
await shot('idle', D, null, '?hq')
await shot('phone', PH, p => p.evaluate(() => __breath.force(0.8, 0.25)))
await shot('phone-exhale', PH, p => p.evaluate(() => __breath.force(0.3, -0.25)))
await shot('reduced-motion', D, null, '?reduce&hq')
// hold/release: the body mirrors the hand, and the pacer later takes on the hand's rhythm
{
  const page = await browser.newPage(); await page.setViewport(D); await page.goto(`${base}/breath/?lq`, { waitUntil: 'load' })
  await new Promise(r => setTimeout(r, 800))
  const lv = () => page.evaluate(() => ({ ...__breath.state }))
  for (let i = 0; i < 3; i++) {
    await page.mouse.move(400, 400); await page.mouse.down(); await new Promise(r => setTimeout(r, 3000))
    const a = await lv(); await page.mouse.up(); await new Promise(r => setTimeout(r, 4000)); const b = await lv()
    ok(a.level > 0.6 && a.source === 'touch', `hold ${i}: level rises while held (${a.level.toFixed(2)})`)
    ok(b.level < a.level - 0.3, `release ${i}: level falls after release (${b.level.toFixed(2)})`)
  }
  await new Promise(r => setTimeout(r, 7000))
  const c = await lv()
  ok(c.source === 'pace' && c.adapted && Math.abs(c.inn - 3) < 0.6, `hand rested: pacer took the hand's rhythm (in ${c.inn.toFixed(2)} s, out ${c.out.toFixed(2)} s)`)
  await page.click('#stop'); await new Promise(r => setTimeout(r, 300)); const d = await lv()
  ok(d.rest && !d.micOn, 'stop is one tap: rest, mic released')
  await page.close()
}
// mic: a synthetic breather (band noise, 5 s cycle: louder 2 s exhale, softer 1.5 s inhale) stands in for getUserMedia;
// the page should read a ~5 s rhythm, adopt it, and drive the light from the envelope
{
  const page = await browser.newPage(); await page.setViewport(D)
  await page.evaluateOnNewDocument(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const ac = new AudioContext(), n = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = n.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
      const src = ac.createBufferSource(); src.buffer = n; src.loop = true
      const g = ac.createGain(), dst = ac.createMediaStreamDestination(), t = ac.currentTime + 0.1
      g.gain.setValueAtTime(0.002, t)
      for (let c = 0; c < 30; c++) { const b = t + c * 5
        g.gain.setTargetAtTime(0.25, b, 0.2); g.gain.setTargetAtTime(0.002, b + 2, 0.25)          // exhale
        g.gain.setTargetAtTime(0.09, b + 3.2, 0.2); g.gain.setTargetAtTime(0.002, b + 4.7, 0.15) } // inhale
      src.connect(g); g.connect(dst); src.start(); window.__fakeAc = ac; return dst.stream }
  })
  await page.goto(`${base}/breath/?lq`, { waitUntil: 'load' }); await new Promise(r => setTimeout(r, 500))
  await page.click('#mic')
  let maxEnv = 0
  for (let i = 0; i < 70; i++) { await new Promise(r => setTimeout(r, 500)); const e = await page.evaluate(() => __breath.state.env); maxEnv = Math.max(maxEnv, e) }
  const m = await page.evaluate(() => ({ ...__breath.state }))
  console.log('mic', JSON.stringify({ env: maxEnv.toFixed(2), period: m.micPeriod.toFixed(2), conf: m.micConf.toFixed(2), inn: m.inn.toFixed(2), out: m.out.toFixed(2), src: m.source, adapted: m.adapted }))
  ok(m.micOn && m.source === 'mic', 'mic on: the breath source is the microphone')
  ok(maxEnv > 0.5, 'mic envelope reaches the body')
  ok(Math.abs(m.micPeriod - 5) < 1, `mic rhythm read as ~5 s (${m.micPeriod.toFixed(2)})`)
  ok(m.adapted && Math.abs(m.inn + m.out - 5) < 1.2, `pacer adopted the breather's rhythm (${(m.inn + m.out).toFixed(2)} s cycle)`)
  await page.click('#stop'); const st = await page.evaluate(() => ({ ...__breath.state }))
  ok(!st.micOn && st.rest, 'stop releases the mic in one tap')
  await page.close()
}
await browser.close(); if (srv) srv.close()
console.log(fails.length ? `${fails.length} FAILED` : 'all ok'); process.exitCode = fails.length ? 1 : 0
