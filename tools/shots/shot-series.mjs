// Wiser screenshots: serves work/wiser/app/site as https://tantrafiles.xyz (or hits the live site with LIVE=1).
// usage: node shot-series.mjs <outdir> [views...]  (2026-10-25 nav + Series round)
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
const ALL = { home: '', topics: '#topics', topic: '#topic/rebirth', series: '#series/how-to-discern-past-lives', s1: '#series/how-to-discern-past-lives/1', s3: '#series/how-to-discern-past-lives/3', s6: '#series/how-to-discern-past-lives/6', index: '#series', oldlink: '#course/how-to-discern-past-lives/2', oldlist: '#courses', practise: '#collections', menu: '#topics' }
const views = ALL
for (const [w, h, tag] of [[390, 844, 'phone'], [1440, 900, 'desktop']].filter((d) => !process.env.DEV || d[2] === process.env.DEV)) {
  for (const [v, hash] of Object.entries(views)) {
    if (only.length && !only.includes(v)) continue
    const p = await b.newPage(); await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: tag === 'phone', hasTouch: tag === 'phone' })
    await p.setRequestInterception(true); p.on('request', (r) => handle(r).catch(() => {}))
    p.on('pageerror', (e) => errs.push(`${tag}/${v}: ${e.message}`)); p.on('console', (m) => { if (m.type() === 'error' && !/youtube|ytimg|Failed to load resource|CORS|api.tantrafiles/.test(m.text())) errs.push(`${tag}/${v} console: ${m.text().slice(0, 200)}`) })
    await p.goto('https://tantrafiles.xyz/' + (hash || ''), { waitUntil: 'domcontentloaded', timeout: 30000 })
    await new Promise((r) => setTimeout(r, v === 'ballot' ? 1600 : 3500))
    errs.push(`${tag}/${v} scrollWidth=` + await p.evaluate(() => document.documentElement.scrollWidth + '/' + document.documentElement.clientWidth + ' ' + [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 2 && !e.closest('.rail')).slice(0, 4).map((e) => e.tagName + '.' + e.className + '<' + (e.parentElement?.className || e.parentElement?.id) + '<' + (e.closest('section')?.id || '') + ':' + Math.round(e.getBoundingClientRect().right)).join(' | ')))
    if (v === 'coursestep') { await p.evaluate(() => document.querySelector('[data-play]')?.click()); await new Promise((r) => setTimeout(r, 2500)) }
    if (/^(places|place|placeforest|country|hillside|placespick)$/.test(v)) await p.waitForFunction(() => !document.querySelector('.leaflet-container') || document.querySelectorAll('.leaflet-tile-loaded').length >= 6, { timeout: 15000 }).then(() => new Promise((r) => setTimeout(r, 800))).catch(() => errs.push(`${tag}/${v}: map tiles did not load`))
    if (v === 'placespick') { // Goenka layer on (clustered), then pick a curated point: the place panel opens
      await p.evaluate(() => { const i = document.querySelector('.ptog input'); i.checked = true; i.dispatchEvent(new Event('input', { bubbles: true })) }); await new Promise((r) => setTimeout(r, 2500))
      await p.evaluate(() => document.querySelector('.pmk:not(.gk)')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))); await new Promise((r) => setTimeout(r, 1200))
      errs.push(`${tag}/placespick: clusters=${await p.evaluate(() => document.querySelectorAll('.pmclu').length)} panel=${await p.evaluate(() => document.querySelector('.ppanel h3')?.textContent || 'none')}`)
    }
    if (v === 'oldlink' || v === 'oldlist') errs.push(`${tag}/${v} -> ${await p.evaluate(() => location.hash)}`)
    if (v === 'home' || v === 'topics') errs.push(`${tag}/${v} nav: ` + await p.evaluate(() => { const n = document.querySelector('.top nav'); return `items=${n.children.length} navScroll=${n.scrollWidth}/${n.clientWidth} labels=${[...n.children].map((x) => x.textContent.trim() + ':' + Math.round(x.getBoundingClientRect().right)).join(',')}` }))
    if (v === 'menu') { await p.evaluate(() => document.querySelector('#userbtn')?.click()); await new Promise((r) => setTimeout(r, 800)); await p.screenshot({ path: path.join(out, `${tag}-menu.png`) }); await p.close(); continue }
    if (v === 'charts' || v === 'you') { await p.evaluate((t) => document.querySelector(`nav [data-tab="${t}"]`)?.click(), v); await new Promise((r) => setTimeout(r, 2500)) }
    if (v === 'ballot') { // jump to the ballot: the screening stages are timed; force the vote stage when the app exposes it
      await p.screenshot({ path: path.join(out, `${tag}-intro.png`) })
      await new Promise((r) => setTimeout(r, 2500))
      await p.screenshot({ path: path.join(out, `${tag}-theatre.png`) })
      for (let i = 0; i < 2; i++) { await p.keyboard.press('n'); await new Promise((r) => setTimeout(r, 1800)) }
    }
    if (/^s\d$/.test(v)) await p.screenshot({ path: path.join(out, `${tag}-${v}-view.png`) }) // the session as it lands (scrolled to #mnow)
    await p.evaluate(() => scrollTo(0, 0)); await new Promise((r) => setTimeout(r, 400))
    await p.screenshot({ path: path.join(out, `${tag}-${v}.png`), fullPage: v !== 'ballot' })
    const ov = await p.evaluate(() => { const W = document.documentElement.clientWidth; return [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > W + 2 && getComputedStyle(e).position !== 'fixed' && !e.closest('.leaflet-container') }).slice(0, 5).map((e) => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right)) })
    if (ov.length) errs.push(`${tag}/${v} overflow: ${ov.join(' | ')}`)
    await p.close()
  }
}
await b.close()
console.log(errs.length ? errs.join('\n') : 'no errors')
