// Shared-account UI shots, phone 390 + desktop: Satsang's account menu (signed out, local dist over the live site) and the hosted
// sign-in page at auth.tantrafiles.xyz (live). usage: node tools/shots/shot-account.mjs <outdir>   (needs sh tools/shots/shot-setup.sh)
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
const puppeteer = createRequire('/tmp/smoke/')('puppeteer-core')
const [, , out = 'shots/account'] = process.argv
const DIST = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../app/dist')
fs.mkdirSync(out, { recursive: true })
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' }
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox', '--no-proxy-server', '--mute-audio'] })
const errs = []
async function handle(req) {
  const u = new URL(req.url())
  if (/googlevideo|doubleclick|google-analytics|youtube\.com\/(api\/stats|ptracking|generate_204)/.test(u.href)) return req.abort()
  if (u.hostname === 'tantrafiles.xyz') {
    const rel = decodeURIComponent(u.pathname.replace(/^\//, '')) || 'index.html', f = path.join(DIST, rel)
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return req.respond({ status: 200, contentType: TYPES[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) })
  }
  try {
    const r = await fetch(u.href, { method: req.method(), headers: { ...req.headers(), 'accept-encoding': 'identity' }, body: ['GET', 'HEAD'].includes(req.method()) ? undefined : req.postData(), redirect: 'manual', signal: AbortSignal.timeout(20000) })
    const h = {}; r.headers.forEach((v, k) => { if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(k)) h[k] = v })
    return req.respond({ status: r.status, headers: h, body: Buffer.from(await r.arrayBuffer()) })
  } catch { return req.abort() }
}
const cc = 'A'.repeat(43)
for (const [name, vp] of [['phone390', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }], ['desktop1440', { width: 1440, height: 900 }]]) {
  const p = await b.newPage(); await p.setViewport(vp); p.on('pageerror', (e) => errs.push(name + ': ' + e.message))
  await p.setRequestInterception(true); p.on('request', (r) => handle(r).catch(() => {}))
  await p.goto('https://tantrafiles.xyz/', { waitUntil: 'load', timeout: 60000 }).catch((e) => console.log('goto', e.message))
  await new Promise((r) => setTimeout(r, 2500))
  await p.click('#userbtn').catch((e) => console.log('click', e.message)); await new Promise((r) => setTimeout(r, 800))
  const btn = await p.$eval('[data-um="google"]', (x) => x.textContent).catch(() => null); console.log(name, 'menu google button:', btn)
  await p.screenshot({ path: `${out}/menu-${name}.png` })
  await p.goto(`https://auth.tantrafiles.xyz/signin?return=${encodeURIComponent('https://body.stonedoorway.com/lab')}&state=shotstate1&cc=${cc}`, { waitUntil: 'load', timeout: 60000 }).catch((e) => console.log('goto', e.message))
  await new Promise((r) => setTimeout(r, 3000))
  await p.screenshot({ path: `${out}/signin-${name}.png` }); await p.close()
}
await b.close()
console.log('page errors:', errs.length ? errs : 'none')
