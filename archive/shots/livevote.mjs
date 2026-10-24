// Live UI vote: open https://tantrafiles.xyz, skip both talks to the ballot (n, n), pick the left one (ArrowLeft); report the device id.
import { createRequire } from 'module'
const puppeteer = createRequire('/tmp/smoke/')('puppeteer-core')
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox', '--no-proxy-server', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] })
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 })
await p.setRequestInterception(true)
const posts = []
p.on('request', async (req) => {
  const u = new URL(req.url())
  if (/googlevideo|doubleclick|google-analytics|youtube\.com\/(api\/stats|ptracking|generate_204)/.test(u.href)) return req.abort()
  try {
    if (u.hostname === 'api.tantrafiles.xyz' && req.method() === 'POST') posts.push(u.pathname + ' ' + (req.postData() || '').slice(0, 160))
    const r = await fetch(u.href, { method: req.method(), headers: { ...req.headers(), 'accept-encoding': 'identity' }, body: req.postData(), redirect: 'manual', signal: AbortSignal.timeout(20000) })
    const h = {}; r.headers.forEach((v, k) => { if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(k)) h[k] = v })
    req.respond({ status: r.status, headers: h, body: Buffer.from(await r.arrayBuffer()) })
  } catch { req.abort() }
})
await p.goto('https://tantrafiles.xyz/', { waitUntil: 'domcontentloaded' }); await new Promise((r) => setTimeout(r, 5000))
for (let i = 0; i < 2; i++) { await p.keyboard.press('n'); await new Promise((r) => setTimeout(r, 2000)) }
await p.keyboard.press('ArrowLeft'); await new Promise((r) => setTimeout(r, 3000))
const dev = await p.evaluate(() => JSON.parse(localStorage.getItem('wiser.device') || 'null')), votes = await p.evaluate(() => JSON.parse(localStorage.getItem('wiser.votes') || '[]'))
await p.screenshot({ path: 'shots/live-after-vote.png' })
console.log(JSON.stringify({ dev, localVotes: votes.length, posts }, null, 1))
await b.close()
