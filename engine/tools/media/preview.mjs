// Stage 8 · short preview video: the live player rendered offline (seek → advance frame by frame), muxed with the session mix.
// Same renderer as the player, no separate art (PRACTICE-MEDIA §3). Resumable in chunks under the sandbox's 120 s tool limit.
// usage: node tools/media/preview.mjs <practice id> <from s> <to s> [--fps 24] [--w 1280 --h 720] [--budget 95]   then run again until "done"
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import http from 'http'
import { execFileSync } from 'child_process'
import { ENGINE } from '../extract/lib.mjs'
const puppeteer = createRequire('/tmp/smoke/')('puppeteer-core')
const a = process.argv.slice(2), flag = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d }
const [id, from, to] = [a[0], +a[1], +a[2]], fps = +flag('--fps', 24), W = +flag('--w', 1280), H = +flag('--h', 720), budget = +flag('--budget', 95) * 1000
const out = path.join(ENGINE, 'renders', id, 'preview'), fr = path.join(out, 'frames'); fs.mkdirSync(fr, { recursive: true })
const N = Math.round((to - from) * fps), T0 = Date.now()
const have = new Set(fs.readdirSync(fr)), todo = [...Array(N).keys()].filter(k => !have.has(`f${String(k).padStart(5, '0')}.jpg`))
if (todo.length) {
  const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html' }
  const srv = http.createServer((req, res) => { const p = decodeURIComponent(new URL(req.url, 'http://x').pathname); const f = path.join(ENGINE, p.endsWith('/') ? p + 'index.html' : p)
    if (!f.startsWith(ENGINE) || !fs.existsSync(f)) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }).listen(0)
  const b = await puppeteer.launch({ executablePath: '/tmp/chromium', args: ['--no-sandbox', '--no-proxy-server'] })
  const pg = await b.newPage(); await pg.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
  const k0 = todo[0], t0 = from + k0 / fps
  await pg.goto(`http://127.0.0.1:${srv.address().port}/demo/?p=${id}&t=${Math.max(0, t0 - 1 / fps)}&muted=1`, { waitUntil: 'load' })
  await pg.waitForFunction('window.__frameReady === true', { timeout: 30000 })
  await pg.addStyleTag({ content: '.sp-controls,.sp-slot,.sp-info-btn{visibility:hidden!important}' })   // a clean picture; title + caption stay
  for (let k = k0; k < N; k++) {
    if (Date.now() - T0 > budget) break
    await pg.evaluate(t => window.satsangPlayer.advance(t), from + k / fps)
    await pg.screenshot({ path: path.join(fr, `f${String(k).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 88 })
  }
  await b.close(); srv.close()
}
const done = fs.readdirSync(fr).filter(f => f.endsWith('.jpg')).length
console.log(`${done}/${N} frames`)
if (done >= N) {
  const audio = path.join(ENGINE, 'renders', id, 'mix', 'preview.m4a')
  const mp4 = path.join(out, `preview-${W}x${H}.mp4`)
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(fps), '-i', path.join(fr, 'f%05d.jpg'), ...(fs.existsSync(audio) ? ['-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'copy', '-shortest'] : []),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '24', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', mp4])
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String((N / fps) * 0.4), '-i', mp4, '-frames:v', '1', '-q:v', '3', path.join(out, 'poster.jpg')])
  console.log('done', mp4, (fs.statSync(mp4).size / 1e6).toFixed(2) + ' MB')
}
