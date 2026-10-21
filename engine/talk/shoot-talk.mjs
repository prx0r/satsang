// Headless check of /talk/ (puppeteer-core + /tmp/chromium, see ../../shot-setup.sh): runs the scripted demo in the real page,
// asserts the flow from window.__talk, and writes screenshots. usage: node talk/shoot-talk.mjs [outdir] [baseUrl]
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import http from 'http'
import url from 'url'
const puppeteer = createRequire('/tmp/smoke/')('puppeteer-core')
const ENGINE = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const out = path.resolve(process.argv[2] || '/tmp/talk-shots'); fs.mkdirSync(out, { recursive: true })
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html' }
let srv, base = process.argv[3]
if (!base) {
  srv = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = path.join(ENGINE, p.endsWith('/') ? p + 'index.html' : p)
    if (!f.startsWith(ENGINE) || !fs.existsSync(f)) { res.writeHead(404); return res.end('nf') }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res)
  }).listen(0)
  base = `http://127.0.0.1:${srv.address().port}`
}
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox', '--no-proxy-server', '--autoplay-policy=no-user-gesture-required'] })
let fail = 0; const ok = (c, m) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) fail++ }
try {
  const pg = await b.newPage(); const errs = []
  pg.on('pageerror', e => errs.push(String(e))); pg.on('console', m => { if (m.type() === 'error' && !/favicon|fonts\.g|ERR_|status of 404/.test(m.text() + (m.location()?.url || ''))) errs.push(m.text() + ' ' + (m.location()?.url || '')) })
  pg.on('requestfailed', r => { if (!/fonts\.g|favicon/.test(r.url())) errs.push('requestfailed ' + r.url()) })
  pg.on('response', r => { if (r.status() >= 400 && !/favicon|fonts\.g/.test(r.url())) errs.push(r.status() + ' ' + r.url()) })
  await pg.setViewport({ width: 1440, height: 900 })
  await pg.goto(`${base}/talk/`, { waitUntil: 'domcontentloaded' })
  await pg.waitForFunction(() => window.__talk?.flow?.client?.ready, { timeout: 30000 })
  await pg.click('#demo')
  const T = () => pg.evaluate(() => { const f = window.__talk.flow; return { t: window.__talk.player.state.t, playing: window.__talk.player.state.playing, speed: f.bus.state.speed, level: f.bus.state.level, locked: f.bus.state.locked, stats: f.client.stats, heard: f.fake.state.heard } })
  await new Promise(r => setTimeout(r, 3000))
  let s = await T(); await pg.screenshot({ path: `${out}/talk-1-interrupt.png` })
  ok(!s.playing && Math.abs(s.t - 26) < 0.5, `interrupt mid-hold → paused at the out-breath (t=${s.t.toFixed(2)})`)
  await new Promise(r => setTimeout(r, 3300))
  s = await T(); await pg.screenshot({ path: `${out}/talk-2-replay-slow.png` })
  ok(s.speed === 0.75 && s.playing && s.t < 10.5, `replay_phase(slow) running (t=${s.t.toFixed(2)}, speed ${s.speed})`)
  await new Promise(r => setTimeout(r, 13000))
  s = await T(); await pg.screenshot({ path: `${out}/talk-3-refused.png` })
  ok(s.stats.refused >= 1, `longer hold refused (${s.stats.refused})`)
  await new Promise(r => setTimeout(r, 6500))
  s = await T(); await pg.screenshot({ path: `${out}/talk-4-safety.png` })
  ok(s.stats.safetyHits === 1 && s.locked === 'stop' && s.level === 'gentler' && !s.playing, `dizzy → safety, gentler, paused (${JSON.stringify({ hits: s.stats.safetyHits, locked: s.locked, level: s.level })})`)
  ok(!s.heard.some(h => /dizzy/i.test(h)), 'the fake model never heard "dizzy"')
  // the bus against the play player (player/play.js, API.md) on a VBT play
  const pp = await pg.evaluate(async () => {
    const [{ compile }, { createPlay }, { createBus }, { portFor }] = await Promise.all([import('../compile.mjs'), import('../player/play.js'), import('../rt/bus.mjs'), import('../rt/player-port.mjs')])
    const g = await (await fetch('../grammar.json')).json(), pr = await (await fetch('../practices/vbt-trace-the-sound.json')).json()
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-2000px;top:0;width:800px;height:600px'; document.body.appendChild(host)
    const p = createPlay(host, { grammar: g, compile, practice: pr, options: { voice: false, webgl: false } })
    const port = portFor(p), bus = createBus({ port, grammar: g, practice: pr })
    const out = { kind: port.kind }
    p.play()
    const pz = bus.index.B.find(b => b.sub === 'pause')
    out.seek = bus.exec('seek_phase', { phase: pz.id }, { source: 'model' }).ok && Math.abs(p.state.t - pz.t) < 0.01
    const tot0 = p.timeline.total_s
    out.extend = bus.exec('extend_pause', { seconds: 10 }, { source: 'model' })
    out.extendGrew = Math.round((p.timeline.total_s - tot0) * 10) / 10
    const sp = bus.index.B.find(b => b.sub === 'speak' && b.t > 1)
    bus.exec('seek_phase', { phase: sp.id }, { source: 'user' })
    out.replay = bus.exec('replay_phase', { phase: sp.id, slow: true }, { source: 'model' }).ok && p.state.rate === 0.75
    out.highlight = bus.exec('highlight_locus', { locus: 'heart' }, { source: 'model' }).rendered
    out.level = bus.exec('set_level', { level: 'gentler' }, { source: 'model' }).ok
    out.end = bus.exec('end', {}, { source: 'model' }).ok && p.state.ended
    return out
  })
  ok(pp.kind === 'play-player' && pp.seek && pp.extend.ok && pp.extendGrew === 10 && pp.replay && pp.end, `bus drives the play player: ${JSON.stringify(pp)}`)
  await pg.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await new Promise(r => setTimeout(r, 600)); await pg.screenshot({ path: `${out}/talk-5-phone.png` })
  ok(errs.length === 0, `no page errors ${errs.slice(0, 3).join(' | ')}`)
} finally { await b.close(); srv?.close() }
console.log(fail ? `${fail} FAILED` : 'talk page ok', out)
process.exitCode = fail ? 1 : 0
