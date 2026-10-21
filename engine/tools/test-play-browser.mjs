// Headless end-to-end check of the play player API (player/API.md) on /play/?p=vbt-trace-the-sound with the real narration files.
// usage: node tools/test-play-browser.mjs     (toolchain: sh ../shot-setup.sh)
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import http from 'http'
import url from 'url'
const puppeteer = createRequire('/tmp/smoke/')('puppeteer-core')
const ENGINE = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html', '.mp3': 'audio/mpeg' }
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = path.join(ENGINE, p.endsWith('/') ? p + 'index.html' : p)
  if (!f.startsWith(ENGINE) || !fs.existsSync(f)) { res.writeHead(404); return res.end('nf') }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res)
}).listen(0)
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox', '--no-proxy-server', '--autoplay-policy=no-user-gesture-required', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const pg = await b.newPage(), errs = []
pg.on('pageerror', e => errs.push(e.message))
await pg.setViewport({ width: 390, height: 844 })
await pg.goto(`http://127.0.0.1:${srv.address().port}/play/?p=vbt-trace-the-sound`, { waitUntil: 'networkidle0' })
await pg.waitForFunction('window.__ready === true && window.player')
let n = 0, bad = 0
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL', m) } }
const S = () => pg.evaluate(() => player.state)
const D = (cmd, args) => pg.evaluate((cmd, args) => player.dispatch({ cmd, args }), cmd, args)
const wait = ms => new Promise(r => setTimeout(r, ms))
await pg.evaluate(() => { window.__ev = []; player.on('*', e => window.__ev.push(e)); window.SatsangTTS = { speak: () => new Promise(r => setTimeout(r, 1500)), cancel() { } } })   // live lines: a 1.5 s stub voice (scripted lines play the real clips)
ok((await D('play')).ok, 'play')
await wait(3000)
let s = await S()
ok(s.playing && s.t > 0 && s.segment?.id === 'begin', `clock runs from the first segment (t=${s.t.toFixed(2)})`)
const ev1 = await pg.evaluate(() => __ev.map(e => e.type))
ok(ev1.includes('segment_started') && ev1.includes('speech_started'), 'segment + speech events')
await pg.waitForFunction(() => __ev.some(e => e.type === 'pause_started'), { timeout: 30000 }).catch(() => { })   // the first clip is 6.7 s
s = await S()
const ev2 = await pg.evaluate(() => __ev.filter(e => e.type === 'speech_ended' || e.type === 'pause_started').map(e => e.type + ':' + e.id))
ok(ev2.includes('pause_started:begin'), `the pause starts when the voice ends (${ev2.join(', ')}; t=${s.t.toFixed(2)})`)
ok((await D('pause')).ok && !(await S()).playing, 'pause')
ok((await D('resume')).ok && (await S()).playing, 'resume')
ok((await D('seek_phase', ['whats-left'])).ok && (await S()).segment.id === 'whats-left', 'seek_phase')
const ext = await D('extend_pause', [6]); ok(ext.ok && ext.pause_s >= 35, `extend_pause (${ext.pause_s} s)`)
ok((await D('highlight_locus', ['kapala', { seconds: 2 }])).ok, 'highlight_locus')
ok(!(await D('highlight_locus', ['nowhere'])).ok, 'highlight_locus rejects an unknown locus')
const lv = await D('set_level', ['first-steps']); ok(lv.ok && (await S()).segment.id === 'whats-left', 'set_level keeps the place')
const t0 = (await S()).t
ok((await D('speak', ['Rest here a moment.', { gate: true }])).ok, 'speak (live line)')
await wait(600); const t1 = (await S()).t
ok(Math.abs(t1 - t0) < 0.2, `live speech holds the clock (${t0.toFixed(2)} → ${t1.toFixed(2)})`)
await wait(1300)
const rp = await D('replay_phase', [null, { slow: 0.75 }]); ok(rp.ok && (await S()).rate === 0.75, 'replay_phase slows the clock')
ok((await D('show_explainer', [{ title: 'Why the pause?', text: 'The silence after the voice is where it happens.', seconds: 1 }])).ok, 'show_explainer')
await wait(1300)
ok((await D('repeat_round')).ok && (await S()).segment.id === 'find-a-sound', 'repeat_round starts the play again (after the intro)')
ok(!(await D('fly')).ok, 'unknown command refused')
ok((await D('end', [{ reason: 'test' }])).ok && (await S()).ended, 'end')
const log = await pg.evaluate(() => JSON.parse(localStorage.getItem('satsang.practice_log') || '[]'))
ok(log.length && log[log.length - 1].practice === 'vbt-trace-the-sound' && 'rested_s' in log[log.length - 1], 'practice_log row on the device')
ok(await pg.evaluate(() => /rested in the silence|silence is still here/.test(document.querySelector('.pl-gate').textContent)), 'end card notices the rest')
ok(errs.length === 0, 'no page errors ' + errs.join('; '))
await b.close(); srv.close()
console.log(bad ? `FAILED ${bad} of ${n}` : `ok ${n} browser checks`)
process.exitCode = bad ? 1 : 0
