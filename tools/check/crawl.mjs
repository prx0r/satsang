// Wiring crawl of the live site (or a local one): opens every route in headless Chromium, records console errors, page errors,
// failed requests (>= 400, YouTube player traffic excluded), broken images, "undefined/NaN/[object Object]" in the text, empty views,
// redirects, and collects every in-app link it sees for a second pass.
// usage: node tools/check/crawl.mjs <routes.json> <out.json> [from] [to]     DEV=phone|desktop  BASE=https://tantrafiles.xyz  WAIT=ms
//   routes.json = ["#topics", "#topic/rebirth", ...]  (tools/check/routes.py writes it from the site data)
// Needs the screenshot toolchain: sh tools/shots/shot-setup.sh (puppeteer-core in /tmp/smoke, /tmp/chromium).
import { createRequire } from 'module'
import fs from 'fs'
const puppeteer = createRequire('/tmp/smoke/')('puppeteer-core')
const [, , rf, out, from = 0, to = 1e9] = process.argv
const BASE = process.env.BASE || 'https://tantrafiles.xyz', DEV = process.env.DEV || 'phone', WAIT = +(process.env.WAIT || 1400)
const routes = JSON.parse(fs.readFileSync(rf, 'utf8')).slice(+from, +to)
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox', '--no-proxy-server', '--mute-audio', '--disable-gpu'] })
const SKIP = /googlevideo|doubleclick|google-analytics|googletagmanager|play\.google|youtube(-nocookie)?\.com\/(embed|api|s\/|iframe_api|ptracking|generate_204|youtubei)|ytimg\.com\/(s|yts)\/|accounts\.google|fonts\.g/
let cur = null
let page
async function openPage() {
  page = await b.newPage()
  await page.setViewport(DEV === 'phone' ? { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true } : { width: 1366, height: 900 })
  if (DEV === 'phone') await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
  await page.setRequestInterception(true)
  page.on('request', (r) => (SKIP.test(r.url()) ? r.abort() : r.continue()))
  page.on('console', (m) => { if (cur && m.type() === 'error' && !/net::ERR_FAILED|ERR_BLOCKED|Failed to load resource: net::/.test(m.text())) cur.console.push(m.text().slice(0, 240)) })
  page.on('pageerror', (e) => cur && cur.pageerror.push(String(e.message || e).slice(0, 240)))
  page.on('response', (r) => { const s = r.status(); if (cur && s >= 400 && !SKIP.test(r.url())) cur.bad.push(`${s} ${r.url().slice(0, 200)}`) })
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() => window._route, { timeout: 30000 }).catch(() => {})
  await new Promise((r) => setTimeout(r, 2500))
}
await openPage()
const res = (fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : []).filter((r) => !r.crashed && !r.fail), tried = new Set() // resumes a killed run
const done = new Set(res.map((r) => r.route))
for (let i = 0; i < routes.length; i++) {
  const h = routes[i]
  if (done.has(h)) continue
  cur = { route: h, console: [], pageerror: [], bad: [] }
  const t0 = Date.now()
  try {
    if (h.startsWith('/')) await page.goto(BASE + h, { waitUntil: 'domcontentloaded', timeout: 30000 })
    else await page.evaluate((x) => { location.hash = x }, h)
    await new Promise((r) => setTimeout(r, WAIT))
    Object.assign(cur, await page.evaluate(() => {
      const v = document.querySelector('section.view:not([hidden])'), txt = (v || document.body).innerText || ''
      const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
      const scope = v || document.body
      const links = [...scope.querySelectorAll('a[href]')].filter(vis).map((a) => a.getAttribute('href'))
      const imgs = [...scope.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src') && !i.loading?.includes('lazy')).map((i) => i.getAttribute('src').slice(0, 160))
      const deadBtn = [...scope.querySelectorAll('button')].filter(vis).filter((x) => !x.disabled && !x.textContent.trim() && !x.getAttribute('aria-label')).length
      const odd = (txt.match(/\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b/g) || []).slice(0, 5)
      const empty = [...scope.querySelectorAll('.empty, .muted')].filter(vis).map((e) => e.textContent.trim()).filter((t) => /^(no |nothing|not found|unknown|coming soon|loading)/i.test(t)).slice(0, 4)
      return { hash: location.hash, path: location.pathname, view: v?.id || null, chars: txt.trim().length, title: (scope.querySelector('h1,h2')?.textContent || '').trim().slice(0, 80), links, imgs, deadBtn, odd, empty, sideways: document.documentElement.scrollWidth > innerWidth + 2 }
    }))
  } catch (e) {
    cur.fail = String(e.message || e).slice(0, 200)
    if (/detached|Target closed|crash|Session closed/i.test(cur.fail) && !tried.has(h) && tried.add(h)) { // renderer died (memory): fresh tab, retry this route once
      try { await page.close() } catch {}
      await openPage(); routes[i] = h; i--; res.push({ route: h, crashed: cur.fail }); continue
    }
  }
  cur.ms = Date.now() - t0
  res.push(cur)
  fs.writeFileSync(out, JSON.stringify(res)) // incremental: a killed run keeps what it saw
}
fs.writeFileSync(out, JSON.stringify(res))
const bad = res.filter((r) => r.fail || r.console.length || r.pageerror.length || r.bad.length || r.imgs?.length || r.odd?.length || r.chars < 40)
console.log(`${DEV} ${res.length} routes, ${bad.length} with findings -> ${out}`)
await b.close()
