// Wiser screenshots: serves work/wiser/app/site as https://tantrafiles.xyz (or hits the live site with LIVE=1).
// usage: node shot.mjs <outdir> [views...]   views: ballot topics charts teacher teachers you
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
const puppeteer = createRequire('/tmp/smoke/')('puppeteer-core')
const [, , out, ...only] = process.argv
const SITE = process.env.SITE_DIR || '/workspace/projects/f9a7b7ba-e7fb-456e-891e-78ec1c0ab3dc/work/wiser/app/site', LIVE = process.env.LIVE === '1'
fs.mkdirSync(out, { recursive: true })
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' }
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox', '--no-proxy-server', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] })
const errs = []
async function handle(req) {
  const u = new URL(req.url())
  if (LIVE && u.hostname === 'api.tantrafiles.xyz' && req.method() !== 'GET' && req.method() !== 'OPTIONS') return req.respond({ status: 200, body: '{"ok":true}', contentType: 'application/json', headers: { 'access-control-allow-origin': 'https://tantrafiles.xyz', 'access-control-allow-credentials': 'true' } }) // never write test picks into the live tally
  if (/youtube\.com\/iframe_api|youtube\.com\/s\/player/.test(u.href)) return req.respond({ status: 200, contentType: 'text/javascript', body: '' })
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

const ALL = { foryou: '#foryou', tv: '#tv', metint: '#me', flashrail: '', flash: '', rebirth: '#topic/rebirth', topics: '#topics', teachers: '#teachers', places: '#places', me: '#me', collections: '#collections', journey: '#collection/seven-days-with-death', syllabus: '#collection/kashmir-shaivism-first-syllabus', practice: '#practice/the-five-remembrances', pair: '#pair', pathperson: 'person/ajahn-chah', pathtopic: 'topic/rebirth', scholar: '#teacher/alexis-sanderson' }

// the sandbox's Chromium cannot decode YouTube video (HTML5 error 5), so the screenshots use a stand-in player: the
// official still in the frame, a clock that advances. Only for these screenshots; the site always uses YouTube's player.
const FAKE_YT = `window.__fakeYT = true; (() => { const P = function (id, o) { const el = document.getElementById(id); const vid = o.videoId; const img = document.createElement('img'); img.src = 'https://i.ytimg.com/vi/' + vid + '/hqdefault.jpg'; img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover'; img.id = id; el.replaceWith(img); this.t = o.playerVars?.start || 0; this.st = 5; this.v = 100; this.m = false; setTimeout(() => o.events?.onReady?.(), 50); this.o = o };
  P.prototype = { playVideo() { this.st = 1; clearInterval(this.i); this.i = setInterval(() => (this.t += 0.25), 250); this.o.events?.onStateChange?.({ data: 1 }) }, pauseVideo() { this.st = 2; clearInterval(this.i) }, getPlayerState() { return this.st }, getCurrentTime() { return this.t }, getDuration() { return 0 }, seekTo(t) { this.t = t }, setVolume(v) { this.v = v }, mute() { this.m = true }, unMute() { this.m = false }, isMuted() { return this.m }, destroy() { clearInterval(this.i) }, getIframe() { return null } };
  window.YT = { Player: P }; Object.defineProperty(window, 'onYouTubeIframeAPIReady', { set(f) { setTimeout(() => f(window.YT), 30) }, get() { return null } }) })()`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
for (const [w, h, tag] of [[390, 844, 'phone'], [1440, 900, 'desktop']].filter((d) => !process.env.DEV || d[2] === process.env.DEV)) {
  for (const [v, hash] of Object.entries(ALL)) {
    if (only.length && !only.includes(v)) continue
    const p = await b.newPage(); await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: tag === 'phone', hasTouch: tag === 'phone' })
    await p.setRequestInterception(true); p.on('request', (r) => handle(r).catch(() => {}))
    p.on('pageerror', (e) => errs.push(`${tag}/${v}: ${e.message}`)); p.on('console', (m) => { if (m.type() === 'error' && !/youtube|ytimg|Failed to load resource|CORS|api.tantrafiles/.test(m.text())) errs.push(`${tag}/${v} console: ${m.text().slice(0, 200)}`) })
    if (!LIVE || process.env.FAKEYT) await p.evaluateOnNewDocument(FAKE_YT)
    if (['foryou', 'metint', 'tv', 'flashrail'].includes(v) && process.env.TASTE !== '0') await p.evaluateOnNewDocument(() => { try {
      const now = new Date().toISOString()
      localStorage.setItem('wiser.intentions', JSON.stringify({ items: [{ id: 'grief', at: now }, { id: 'rebirth', at: now }], text: { v: 'my father died this summer', ids: ['grief'], at: now }, updated: now }))
      localStorage.setItem('wiser.resonates', JSON.stringify({ 'cY2GjcIBKkw': { at: now, t: 30, sec: 300 } }))
    } catch {} })
    if (process.env.SEED === '1') await p.evaluateOnNewDocument(() => { try { localStorage.setItem('wiser.practice', JSON.stringify([{ id: 'p1', practice: 'the-five-remembrances', minutes: 10, at: new Date().toISOString() }])) } catch {} })
    await p.goto('https://tantrafiles.xyz/' + (hash || ''), { waitUntil: 'domcontentloaded', timeout: 30000 })
    const WAIT = { foryou: '#fygrid .fy-card', tv: '.tv-title', metint: '#intents', flashrail: '.fl-title .fl-topic', flash: '.fl-title .fl-topic', teachers: '#tsch', topics: '.topicgrid .topic', places: '.leaflet-container', rebirth: '#topicsview .wtakes', me: '#meview .head', collections: '#colview .pprog', journey: '#colview .whero h1', syllabus: '#colview .whero h1', practice: '#colview .whero h1', pair: '#stage .slide', pathperson: '#comicsview .whero', pathtopic: '#topicsview .wtakes', scholar: '#comicsview .whero' }
    await p.waitForFunction((q) => document.querySelector(q), { timeout: 40000 }, WAIT[v]).catch(() => errs.push(`${tag}/${v}: content did not appear`))
    await sleep(v === 'places' ? 4000 : 2500)
    await p.screenshot({ path: path.join(out, `${tag}-${v}.png`) })
    if (v.startsWith('path')) errs.push(`${tag}/${v}: url=${await p.evaluate(() => location.href)} title=${await p.title()}`)
    if (v === 'flash') {
      const info = await p.evaluate(() => { const F = window._wiser?.flash()?.current(); return F ? { topic: F.topic, clips: F.clips.map((c) => [c.speaker, c.tradition, c.format, c.id]), slots: F.slots } : null })
      errs.push(`${tag}/flash composed: ${JSON.stringify(info)}`)
      await p.evaluate(() => document.querySelector('[data-begin]')?.click()); await sleep(600)
      if (process.env.DBG) { await sleep(6000); errs.push('unplayable: ' + await p.evaluate(() => localStorage.getItem('wiser.unplayable'))); errs.push('stage ' + await p.evaluate(() => document.querySelector('.slide.fl')?.dataset.stage + ' ' + window._wiser.flash().current()?.idx)) }
      await p.screenshot({ path: path.join(out, `${tag}-flash-name.png`) })
      await sleep(4500); await p.screenshot({ path: path.join(out, `${tag}-flash-talk.png`) })
      await p.keyboard.press('n'); await sleep(2600); await p.screenshot({ path: path.join(out, `${tag}-flash-talk2.png`) })
      for (let i = 0; i < 2; i++) { await p.keyboard.press('n'); await sleep(1900) }
      await sleep(800); await p.screenshot({ path: path.join(out, `${tag}-flash-ballot.png`) })
      await p.evaluate(() => document.querySelector('.fl-picks .pick')?.click()); await sleep(1200)
      await p.screenshot({ path: path.join(out, `${tag}-flash-picked.png`) })
      await sleep(3800); await p.screenshot({ path: path.join(out, `${tag}-flash-bridge.png`) })
      const st = await p.evaluate(() => ({ stage: document.querySelector('.slide.fl')?.dataset.stage, votes: JSON.parse(localStorage.getItem('wiser.votes') || '[]').map((x) => [x.a, x.b, x.context]) }))
      errs.push(`${tag}/flash after pick: ${JSON.stringify(st)}`)
      await sleep(3500); await p.screenshot({ path: path.join(out, `${tag}-flash-next.png`) })
      const t2 = await p.evaluate(() => window._wiser?.flash()?.current()?.topic); errs.push(`${tag}/flash next topic: ${t2}`)
    }
    if (v === 'foryou') {
      const info = await p.evaluate(() => [...document.querySelectorAll('#fygrid .fy-card')].slice(0, 12).map((a) => a.querySelector('.fy-why').textContent + ' | ' + a.querySelector('.fy-who').textContent.trim().replace(/\s+/g, ' ')))
      errs.push(`${tag}/foryou top: ${JSON.stringify(info)}`)
      await p.evaluate(() => scrollBy(0, innerHeight * 1.2)); await sleep(1500); await p.screenshot({ path: path.join(out, `${tag}-foryou-1.png`) })
      await p.evaluate(() => document.querySelector('#fygrid [data-less]')?.click()); await sleep(600)
      await p.evaluate(() => document.querySelector('.fy-gone')?.scrollIntoView({ block: 'center' })); await sleep(600); await p.screenshot({ path: path.join(out, `${tag}-foryou-less.png`) })
      errs.push(`${tag}/foryou less: ${await p.evaluate(() => localStorage.getItem('wiser.feedLess'))}`)
      await p.evaluate(() => scrollBy(0, innerHeight * 3)); await sleep(1800); errs.push(`${tag}/foryou cards after scroll: ${await p.evaluate(() => document.querySelectorAll('#fygrid .fy-card').length)}; seen=${await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('wiser.feedSeen') || '{}')).length)}`)
    }
    if (v === 'flashrail') { await p.evaluate(() => document.querySelector('#fyrail')?.scrollIntoView({ block: 'start' })); await sleep(1500); await p.screenshot({ path: path.join(out, `${tag}-flashrail-1.png`) }) }
    if (v === 'metint') { await p.evaluate(() => document.querySelector('#intents')?.scrollIntoView({ block: 'start' })); await sleep(1000); await p.screenshot({ path: path.join(out, `${tag}-metint-1.png`) }); await p.evaluate(() => scrollBy(0, innerHeight * 0.7)); await sleep(800); await p.screenshot({ path: path.join(out, `${tag}-metint-2.png`) }) }
    if (v === 'tv') {
      await sleep(3200); await p.screenshot({ path: path.join(out, `${tag}-tv-play.png`) })
      const q = await p.evaluate(() => { const T = window._wiser?.tv?.(); return T ? { cur: T.current()?.c?.id, why: T.current()?.why, fmt: T.queue().slice(0, 30).map((x) => x.c.format), n: T.queue().length } : null })
      errs.push(`${tag}/tv queue: ${JSON.stringify(q && { ...q, vertical: q.fmt.filter((f) => f === 'vertical').length, fmt: undefined })}`)
      await p.keyboard.press('Enter'); await sleep(500); await p.screenshot({ path: path.join(out, `${tag}-tv-heart.png`) })
      await p.keyboard.press('ArrowUp'); await sleep(500); await p.screenshot({ path: path.join(out, `${tag}-tv-more.png`) })
      await sleep(4500); await p.screenshot({ path: path.join(out, `${tag}-tv-idle.png`) })
      await p.evaluate(() => { const T = window._wiser?.tv?.(); const s = T && window._wiser.tvScreen?.(); if (s) { s.end = () => s.t() + 8 } }); await sleep(1200); await p.mouse.move(400, 300); await sleep(400); await p.screenshot({ path: path.join(out, `${tag}-tv-nextup.png`) })
      await p.keyboard.press('ArrowRight'); await sleep(900); await p.screenshot({ path: path.join(out, `${tag}-tv-inter.png`) })
      await sleep(3000); await p.keyboard.press('t'); await sleep(700); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowDown'); await sleep(300); await p.screenshot({ path: path.join(out, `${tag}-tv-topics.png`) })
      await p.keyboard.press('Escape'); await sleep(300); await p.keyboard.press('Escape'); await sleep(1200)
      errs.push(`${tag}/tv after esc: ${await p.evaluate(() => location.hash + ' tvOn=' + document.body.classList.contains('tv-on'))}; signals more=${await p.evaluate(() => localStorage.getItem('wiser.feedMore'))} res=${await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('wiser.resonates') || '{}')).length)}`)
    }
    if (v === 'me') { await p.evaluate(() => { localStorage.setItem('wiser.votes', JSON.stringify([])) }) }
    if (v === 'rebirth') { for (const sel of ['#tq']) { await p.evaluate((q) => { const e = document.querySelector(q); e?.scrollIntoView({ block: 'start' }); scrollBy(0, -80) }, sel); await sleep(1500); await p.screenshot({ path: path.join(out, `${tag}-${v}-1.png`) }) } }
    if (v === 'topics' || v === 'journey' || v === 'practice') { await p.evaluate(() => scrollBy(0, innerHeight * 0.9)); await sleep(1200); await p.screenshot({ path: path.join(out, `${tag}-${v}-1.png`) }) }
    if (v === 'practice') { await p.evaluate(() => document.querySelector('[data-timer]')?.click()); await sleep(2500); await p.screenshot({ path: path.join(out, `${tag}-timer.png`) }); await p.evaluate(() => document.querySelector('[data-end]')?.click()); await sleep(800); await p.screenshot({ path: path.join(out, `${tag}-timer-log.png`) }) }
    const ov = await p.evaluate(() => { const W = document.documentElement.clientWidth; return [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > W + 2 && getComputedStyle(e).position !== 'fixed' && !e.closest('.leaflet-container,.rail,.theatre,.tv') }).slice(0, 5).map((e) => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right)) })
    if (ov.length) errs.push(`${tag}/${v} overflow: ${ov.join(' | ')}`)
    await p.close()
  }
}
await b.close()
console.log(errs.length ? errs.join('\n') : 'no errors')
