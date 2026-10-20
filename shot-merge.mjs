// Merge-batch screenshots of the LIVE site (dark design check): node shot-merge.mjs <outdir> name=/path [name=/path ...]
// Desktop 1440x900 + phone 390x844; YouTube/ads aborted (sandbox Chromium cannot decode the player anyway).
import { createRequire } from 'module'
import fs from 'fs'
const puppeteer = createRequire('/tmp/smoke/')('puppeteer-core')
const [, , out, ...views] = process.argv
const BASE = process.env.BASE || 'https://tantrafiles.xyz'
fs.mkdirSync(out, { recursive: true })
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox', '--no-proxy-server', '--mute-audio'] })
const report = []
for (const v of views) {
  const [name, path] = v.split('=')
  for (const [dev, vp] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]) {
    const pg = await b.newPage(); await pg.setViewport(vp)
    await pg.setRequestInterception(true)
    pg.on('request', async r => {  // the sandbox proxy needs auth Chromium cannot give: fetch from node and fulfil (as shot.mjs does)
      if (/googlevideo|doubleclick|google-analytics|youtube\.com\/(api|ptracking|generate_204)/.test(r.url())) return r.abort()
      try {
        const x = await fetch(r.url(), { method: r.method(), headers: { ...r.headers(), 'accept-encoding': 'identity' }, body: r.postData(), redirect: 'manual', signal: AbortSignal.timeout(20000) })
        const h = {}; x.headers.forEach((v, k) => { if (!['content-encoding', 'content-length', 'transfer-encoding', 'content-security-policy'].includes(k)) h[k] = v })
        return r.respond({ status: x.status, headers: h, body: Buffer.from(await x.arrayBuffer()) })
      } catch { return r.abort() }
    })
    const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 120)))
    let status = 0
    try { const r = await pg.goto(BASE + path, { waitUntil: 'networkidle2', timeout: 30000 }); status = r ? r.status() : 0 } catch (e) { errs.push('goto ' + String(e).slice(0, 80)) }
    await new Promise(r => setTimeout(r, 1500))
    const bg = await pg.evaluate(() => getComputedStyle(document.body).backgroundColor).catch(() => '?')
    const title = await pg.title().catch(() => '')
    await pg.screenshot({ path: `${out}/${dev}-${name}.png` })
    report.push({ shot: `${dev}-${name}.png`, path, status, bg, title: title.slice(0, 70), errs })
    await pg.close()
  }
}
await b.close()
fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 1))
console.log(JSON.stringify(report))
