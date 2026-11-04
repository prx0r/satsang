// For You tension blocks, phone 390 + desktop, local (app/site) or LIVE=1. A journal is connected through localStorage the way
// "Read my journal" does it (signals computed here from the public GitHub journal). Screenshots go to a gitignored folder.
// usage: node tools/shots/shot-foryou-tensions.mjs <outdir> [owner/repo]     (needs sh tools/shots/shot-setup.sh)
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { fetchDocs, extractSignals, inferStart } from '../../app/src/journal.js'
import { tensionsOf } from '../../app/src/tensions.js'
const puppeteer = createRequire('/tmp/smoke/')('puppeteer-core')
const [, , out = 'shots/foryou', src = 'prx0r/nibbanahelp'] = process.argv
const SITE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../app/site'), LIVE = process.env.LIVE === '1'
fs.mkdirSync(out, { recursive: true })
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' }
const [owner, repo] = src.split('/'), docs = await fetchDocs({ kind: 'github', owner, repo }), now = Date.now()
const sig = extractSignals(docs, { now, start: inferStart(docs) }); sig.tensions = tensionsOf(docs)
const J = JSON.stringify({ source: src, fetched: new Date(now).toISOString(), posts: docs.length, signals: sig })
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox', '--no-proxy-server', '--mute-audio'] })
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
const report = []
for (const [w, h, tag] of [[390, 844, 'phone'], [1440, 900, 'desktop']]) {
  const p = await b.newPage(); await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: tag === 'phone', hasTouch: tag === 'phone' })
  await p.setRequestInterception(true); p.on('request', (r) => handle(r).catch(() => {}))
  p.on('pageerror', (e) => errs.push(`${tag}: ${e.message}`))
  await p.evaluateOnNewDocument((j) => { try { localStorage.setItem('wiser.journal', j) } catch {} }, J)
  await p.goto('https://tantrafiles.xyz/#foryou', { waitUntil: 'domcontentloaded', timeout: 45000 })
  await p.waitForSelector('.fy-tensions .fy-tblock', { timeout: 40000 }).catch(() => errs.push(`${tag}: no tension blocks rendered`))
  await new Promise((r) => setTimeout(r, 2500))
  const info = await p.evaluate(() => { const s = document.querySelector('.fy-tensions'); const t = s?.innerText || ''; return { blocks: [...document.querySelectorAll('.fy-tblock')].map((b) => ({ roles: [...b.querySelectorAll('.fy-trole')].map((r) => r.querySelectorAll('.fy-card').length) })), bad: /\bundefined\b|\bNaN\b|\[object Object\]/.test(document.body.innerText), overflow: document.documentElement.scrollWidth > innerWidth + 1, dup: (() => { const ids = [...document.querySelectorAll('#v-foryou .fy-card[data-id]')].map((a) => a.dataset.id.split('@')[0]); return ids.length - new Set(ids).size })() } })
  report.push({ tag, ...info })
  const el = await p.$('.fy-tensions'); if (el) await el.screenshot({ path: path.join(out, `foryou-tensions-${tag}.png`) })
  await p.screenshot({ path: path.join(out, `foryou-top-${tag}.png`) })
  await p.close()
}
await b.close()
console.log(JSON.stringify(report)); if (errs.length) console.log('errors:', errs.slice(0, 8).join(' | '))
