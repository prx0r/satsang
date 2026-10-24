// Wiser screenshots: serves work/wiser/app/site as https://tantrafiles.xyz (or hits the live site with LIVE=1).
// usage: node shot.mjs <outdir> [views...]   views: ballot topics charts teacher teachers you
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
const puppeteer = createRequire('/tmp/smoke/')('puppeteer-core')
const [, , out, ...only] = process.argv
const SITE = '/workspace/projects/f9a7b7ba-e7fb-456e-891e-78ec1c0ab3dc/work/wiser/app/site', LIVE = process.env.LIVE === '1'
fs.mkdirSync(out, { recursive: true })
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' }
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox', '--no-proxy-server', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] })
const errs = []
async function handle(req) {
  const u = new URL(req.url())
  if (/googlevideo|doubleclick|google-analytics|play\.google|youtube\.com\/(api\/stats|ptracking|generate_204)|accounts\.google/.test(u.href)) return req.abort()
  if (!LIVE && u.hostname === 'api.tantrafiles.xyz') return req.respond({ status: 404, body: '{}', contentType: 'application/json', headers: { 'access-control-allow-origin': '*' } })
  if (!LIVE && u.hostname === 'tantrafiles.xyz') {
    const rel = decodeURIComponent(u.pathname.replace(/^\//, '')) || 'index.html', f = path.join(SITE, rel)
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return req.respond({ status: 200, contentType: TYPES[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) })
    return req.respond({ status: 404, body: 'nf' })
  }
  try {
    if (cache.has(u.href)) return req.respond(cache.get(u.href))
    const r = await fetch(u.href, { method: req.method(), headers: { ...req.headers(), 'accept-encoding': 'identity' }, body: req.postData(), redirect: 'follow', signal: AbortSignal.timeout(20000) })
    const h = {}; r.headers.forEach((v, k) => { if (!['content-encoding', 'content-length', 'transfer-encoding', 'content-security-policy'].includes(k)) h[k] = v })
    const resp = { status: r.status, headers: h, body: Buffer.from(await r.arrayBuffer()) }
    if (req.method() === 'GET' && /ytimg|fonts\.(googleapis|gstatic)/.test(u.hostname)) cache.set(u.href, resp)
    return req.respond(resp)
  } catch { return req.abort() }
}
const cache = new Map()
const ALL0 = { ballot: '', topic: '#topic/rebirth', krishnamurti: '#teacher/jiddu-krishnamurti', nisargadatta: '#teacher/nisargadatta-maharaj', tradition: '#tradition/vedanta', ramana: '#teacher/ramana-maharshi', thanissaro: '#teacher/thanissaro-bhikkhu', plato: '#teacher/plato', steiner: '#teacher/rudolf-steiner', death: '#topic/death', self: '#topic/self', meditation: '#topic/meditation', anandamayi: '#teacher/anandamayi-ma', places: '#places', place: '#place/sivananda-rishikesh', placeforest: '#place/metta-forest', hillside: '#place/hillside-hermitage', country: '#country/TH', sivananda: '#teacher/swami-sivananda', mun: '#teacher/ajahn-mun', forest: '#tradition/thai-forest', placespick: '#places' }
const ALL = { rebirth: '#topic/rebirth', teachers: '#teachers', topics: '#topics', death: '#topic/death', vballot: '#clash/t0RgPKwTSrQ/yi3i3NaPeuw' }
const views = ALL
for (const [w, h, tag] of [[390, 844, 'phone'], [1440, 900, 'desktop']].filter((d) => !process.env.DEV || d[2] === process.env.DEV)) {
  for (const [v, hash] of Object.entries(views)) {
    if (only.length && !only.includes(v)) continue
    const p = await b.newPage(); await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: tag === 'phone', hasTouch: tag === 'phone' })
    await p.setRequestInterception(true); p.on('request', (r) => handle(r).catch(() => {}))
    p.on('pageerror', (e) => errs.push(`${tag}/${v}: ${e.message}`)); p.on('console', (m) => { if (m.type() === 'error' && !/youtube|ytimg|Failed to load resource|CORS|api.tantrafiles/.test(m.text())) errs.push(`${tag}/${v} console: ${m.text().slice(0, 200)}`) })
    await p.goto('https://tantrafiles.xyz/' + (hash || ''), { waitUntil: 'domcontentloaded', timeout: 30000 })
    await new Promise((r) => setTimeout(r, v === 'ballot' || v === 'vballot' ? 2500 : 4000))
    if (/^(places|place|placeforest|country|hillside|placespick)$/.test(v)) await p.waitForFunction(() => !document.querySelector('.leaflet-container') || document.querySelectorAll('.leaflet-tile-loaded').length >= 6, { timeout: 15000 }).then(() => new Promise((r) => setTimeout(r, 800))).catch(() => errs.push(`${tag}/${v}: map tiles did not load`))
    if (v === 'placespick') { // Goenka layer on (clustered), then pick a curated point: the place panel opens
      await p.evaluate(() => { const i = document.querySelector('.ptog input'); i.checked = true; i.dispatchEvent(new Event('input', { bubbles: true })) }); await new Promise((r) => setTimeout(r, 2500))
      await p.evaluate(() => document.querySelector('.pmk:not(.gk)')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))); await new Promise((r) => setTimeout(r, 1200))
      errs.push(`${tag}/placespick: clusters=${await p.evaluate(() => document.querySelectorAll('.pmclu').length)} panel=${await p.evaluate(() => document.querySelector('.ppanel h3')?.textContent || 'none')}`)
    }
    if (v === 'charts' || v === 'you') { await p.evaluate((t) => document.querySelector(`nav [data-tab="${t}"]`)?.click(), v); await new Promise((r) => setTimeout(r, 2500)) }
    if (v === 'rebirth' || v === 'death') { for (let i = 0; i < 2; i++) { await p.evaluate(() => document.querySelector('[data-keepgoing]')?.click()); await new Promise((r) => setTimeout(r, 400)) } }
    if (v === 'vballot') errs.push(`${tag}/vballot: vertical in pool=${await p.evaluate(() => window.__funnierTest?.pool().filter((c) => c.format === 'vertical').length)} of ${await p.evaluate(() => window.__funnierTest?.pool().length)}; screens=${await p.evaluate(() => document.querySelectorAll('.screen.vert').length)}`)
    if (v === 'ballot' || v === 'vballot') { // jump to the ballot: the screening stages are timed; force the vote stage when the app exposes it
      await p.screenshot({ path: path.join(out, `${tag}-intro.png`) })
      await new Promise((r) => setTimeout(r, 2500))
      await p.screenshot({ path: path.join(out, `${tag}-theatre.png`) })
      for (let i = 0; i < 2; i++) { await p.keyboard.press('n'); await new Promise((r) => setTimeout(r, 1800)) }
    }
    if (v !== 'ballot' && v !== 'vballot') { // wake lazy stills: walk the page (window or the scrolling view) top to bottom
      await p.evaluate(async () => { const sc = [document.scrollingElement, ...document.querySelectorAll('main, .view, section.tab, [id$="view"]')].filter((e) => e && e.scrollHeight > e.clientHeight + 50)
        for (const e of sc) { for (let y = 0; y < e.scrollHeight; y += 600) { e.scrollTop = y; await new Promise((r) => setTimeout(r, 60)) } e.scrollTop = 0 } })
      await new Promise((r) => setTimeout(r, 1500))
      errs.push(`${tag}/${v} dims: ` + await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight, getComputedStyle(document.body).overflow, [...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 200 && /auto|scroll/.test(getComputedStyle(e).overflowY)).map((e) => e.tagName + '#' + e.id + '.' + e.className).slice(0, 3).join(',')].join(' ')))
    }
    await p.screenshot({ path: path.join(out, `${tag}-${v}.png`), fullPage: v !== 'ballot' && v !== 'vballot' })
    const ov = await p.evaluate(() => { const W = document.documentElement.clientWidth; return [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > W + 2 && getComputedStyle(e).position !== 'fixed' && !e.closest('.leaflet-container') }).slice(0, 5).map((e) => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right)) })
    if (ov.length) errs.push(`${tag}/${v} overflow: ${ov.join(' | ')}`)
    await p.close()
  }
}
await b.close()
console.log(errs.length ? errs.join('\n') : 'no errors')
