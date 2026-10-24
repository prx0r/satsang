// Practice engine tests: data (practice-body.json, courses.json), the breath engine's no-hold / pace / lead rules, and
// (with --browser) the practice pages + "Practise with the body" overlay in headless Chromium, writing screenshots.
//   node tools/test-practice-engine.mjs                       data + engine
//   node tools/test-practice-engine.mjs --browser [outDir] [filter]   + pages (needs ../shot-setup.sh: /tmp/chromium, /tmp/smoke puppeteer-core)
import fs from 'fs'
import path from 'path'
import url from 'url'
import http from 'http'
import { createRequire } from 'module'
import { execFileSync } from 'child_process'
const APP = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const J = (p) => JSON.parse(fs.readFileSync(path.join(APP, p), 'utf8'))
let fails = 0, n = 0
const ok = (c, m) => { n++; if (!c) { fails++; console.log('FAIL', m) } else if (process.env.V) console.log('ok  ', m) }

// ---------- data ----------
const PB = J('wisegraph/practice-body.json'), COL = J('site/data/wisegraph/collections.json'), CT = J('site/data/wisegraph/courses.json')
const { LOCUS } = await import(path.join(APP, '../engine/breath/body.js'))
const P = COL.practices, ids = Object.keys(P)
ok(ids.length >= 84, `84+ practices (${ids.length})`)
for (const id of ids) {
  const m = PB.practices[id], p = P[id]
  ok(!!m, `${id}: has a body mapping`)
  if (!m) continue
  ok(['body', 'text'].includes(m.mode), `${id}: mode body|text`)
  ok(typeof m.why === 'string' && m.why.length > 10, `${id}: says why`)
  if (p.needsTeacher) ok(m.mode === 'text' && p.body?.mode === 'text', `${id}: needsTeacher stays text-only`)
  if (m.mode === 'body') {
    ok(m.locus in LOCUS, `${id}: locus ${m.locus} is a body.js LOCUS`)
    ok(p.body?.mode === 'body' && p.body.locus === m.locus, `${id}: merged into collections.json`)
    const pc = p.body?.pace || {}
    ok(pc.inn >= 2 && pc.inn <= 6.5 && pc.out >= 2.5 && pc.out <= 9.5 && pc.out >= pc.inn, `${id}: natural pace, exhale >= inhale (${pc.inn}/${pc.out})`)
    ok(!('retention' in m) || m.retention === 0, `${id}: no retention`)
    ok(Array.isArray(p.steps) && p.steps.length > 0, `${id}: has steps for the fading line`)
  }
  ok(!/hold_in|hold_out|retention/i.test(JSON.stringify(p.body || {})), `${id}: no hold in the built body`)
}
ok(Object.keys(PB.practices).every((k) => k in P), 'no mapping for a practice that does not exist')
ok(PB.defaults.retention === 0, 'defaults: retention 0')

// courses: every collection is a course node; every practice on exactly one shelf; phases cover each course's units
const courses = CT.traditions.flatMap((t) => t.schools.flatMap((s) => s.courses.map((c) => ({ ...c, t: t.id, s: s.id }))))
ok(JSON.stringify(CT.levels) === JSON.stringify(['tradition', 'school', 'course', 'phase', 'practice']), 'levels tradition > school > course > phase > practice')
for (const c of COL.collections) {
  const k = courses.filter((x) => x.id === c.id)
  ok(k.length === 1, `collection ${c.id} is exactly one course node`)
  if (k.length !== 1) continue
  const units = (c.units || []).map((u) => u.n).sort((a, b) => a - b), covered = k[0].phases.flatMap((f) => f.units).sort((a, b) => a - b)
  ok(JSON.stringify(units) === JSON.stringify(covered), `${c.id}: phases cover units ${units}`)
  ok(CT.index.course[c.id]?.school === k[0].s, `${c.id}: index agrees with the tree`)
  const want = new Set([...(c.units || []).flatMap((u) => u.items), ...(c.items || [])].filter((i) => String(i.ref || '').startsWith('practice:')).map((i) => i.ref.slice(9)))
  const got = new Set([...k[0].phases.flatMap((f) => f.practices.map((x) => x.id)), ...(k[0].practices || [])])
  ok([...want].every((x) => got.has(x)), `${c.id}: every practice the collection asks for hangs off a phase`)
}
const shelf = CT.traditions.flatMap((t) => t.schools.flatMap((s) => s.practices))
ok(shelf.length === ids.length && new Set(shelf).size === ids.length, `every practice on exactly one school shelf (${shelf.length})`)
for (const id of ids) ok(CT.index.practice[id]?.tradition && CT.index.practice[id]?.school, `${id}: indexed`)
const trika = CT.traditions.find((t) => t.id === 'kashmir-shaivism')
ok(trika && trika.schools[0].id === 'trika' && trika.schools[0].courses.map((c) => c.id).join() === 'kashmir-shaivism-first-steps,trika-prep-week,vbt-foundations,kashmir-shaivism-first-syllabus', 'Trika: first steps (mini-course) > prep week > VBT foundations > first syllabus')
ok(CT.traditions.some((t) => t.id === 'esoteric' && /Occult/.test(t.label)), 'Occult is a tradition (esoteric)')
// a mini-course (satsang-curation) is a course node like any other
try {
  const sch = J('wisegraph/courses.schema.json')
  ok(sch.$defs.course.properties.kind.enum.includes('mini-course'), 'schema: mini-course is a course kind')
  const mc = COL.collections.filter((c) => c.kind === 'mini-course')
  for (const c of mc) ok(CT.index.course[c.id] && (!c.school || CT.index.course[c.id].school === c.school || CT.index.course[c.id].tradition === c.school || (c.school === 'kashmir-shaivism' && CT.index.course[c.id].school === 'trika')), `mini-course ${c.id} sits under its own school (${c.school} -> ${JSON.stringify(CT.index.course[c.id])})`)
} catch (e) { ok(false, 'schema readable ' + e) }
try { execFileSync('python3', ['-c', `import json,jsonschema,sys
s=json.load(open('wisegraph/courses.schema.json'));d=json.load(open('site/data/wisegraph/courses.json'))
jsonschema.validate(d,s)
pb=json.load(open('wisegraph/practice-body.json'))
for k,v in pb['practices'].items(): jsonschema.validate(v,{**s['$defs']['practiceBody'],'$defs':s['$defs']})
src=json.load(open('wisegraph/courses.json')); jsonschema.validate(src,{**s['$defs']['source'],'$defs':s['$defs']})`], { cwd: APP, stdio: 'pipe' }); ok(true, 'JSON Schema: courses.json, practice-body.json, source') }
catch (e) { const msg = String(e.stderr || e); if (/No module named 'jsonschema'/.test(msg)) console.log('skip JSON Schema (pip install jsonschema)'); else ok(false, 'JSON Schema: ' + msg.slice(-400)) }

// ---------- the breath engine: natural breath, never a hold, pace and lead from the practice ----------
const { createBreath } = await import(path.join(APP, '../engine/breath/breath.js'))
function run(opts, secs = 240) {
  const b = createBreath(opts), dt = 1 / 60
  let t = 0, flat = 0, maxFlat = 0, prev = b.state.level
  for (let i = 0; i < secs / dt; i++) { t += dt; const s = b.tick(dt, t); if (Math.abs(s.level - prev) < 1e-4) flat += dt; else { maxFlat = Math.max(maxFlat, flat); flat = 0 } prev = s.level }
  return { b, maxFlat: Math.max(maxFlat, flat) }
}
{ const { b, maxFlat } = run({ pace: { inn: 5, out: 5 }, lead: false }); ok(b.state.inn === 5 && b.state.out === 5, 'lead:false keeps an even 5/5 count'); ok(maxFlat < 0.35, `no hold at the turns (longest still ${maxFlat.toFixed(2)} s)`) }
{ const { b, maxFlat } = run({ pace: { inn: 4.2, out: 6.0 }, lead: true }, 600); const cyc = b.state.inn + b.state.out
  ok(b.state.out > 6.0, `lead:true lengthens the exhale (${b.state.out.toFixed(2)} s)`); ok(cyc <= 11.0001, `never past ~5.5/min (cycle ${cyc.toFixed(2)} s)`)
  ok(b.state.out <= b.state.inn * 1.6 + 0.3, 'out <= ~1.6 x in'); ok(maxFlat < 0.35, 'no hold while leading') }
{ const { b } = run({}, 120); ok(b.state.inn === 4.2 && b.state.out === 6.0, '/breath/ page default unchanged (idle 4.2/6.0, no lead until the hand shows a rhythm)') }
{ const b = createBreath({ pace: { inn: 99, out: 0.1 } }); ok(b.state.inn <= 6.5 && b.state.out >= 2.5, 'pace is clamped to a natural range') }
const { cuesFor } = await import(path.join(APP, 'src/breathplayer.js')).catch(() => ({}))
if (cuesFor) { const c = cuesFor([{ text: 'a', seconds: 60 }, { text: 'b', seconds: 180 }, { text: 'c', seconds: 60 }], 600); ok(c.length === 3 && c[0].at === 8 && c[1].at > c[0].at && c[2].at < 600, 'step cues spread over the sit, one line at a time') }

console.log(`${n - fails}/${n} data + engine checks passed`)

// ---------- browser ----------
if (process.argv.includes('--browser')) {
  const out = path.resolve(process.argv[process.argv.indexOf('--browser') + 1] || path.join(APP, '../shots-practice-engine'))
  const filter = process.argv[process.argv.indexOf('--browser') + 2] || ''
  fs.mkdirSync(out, { recursive: true })
  const puppeteer = createRequire('/tmp/smoke/')('puppeteer-core')
  const SITE = path.join(APP, 'site'), ENGINE = path.join(APP, '../engine')
  const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' }
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p === '/') p = '/index.html'
    const f = path.join(SITE, p)
    if (!f.startsWith(SITE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf') }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res)
  }).listen(0)
  const base = `http://127.0.0.1:${srv.address().port}`
  const browser = await puppeteer.launch({ executablePath: '/tmp/chromium', headless: true,
    args: ['--no-sandbox', '--no-proxy-server', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const px = (file) => JSON.parse(execFileSync('python3', ['-c', `import sys,json
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGB'); w,h=im.size; im=im.resize((120,int(120*h/w)))
P=list(im.getdata()); n=len(P)
white=sum(1 for r,g,b in P if r>240 and g>240 and b>240)/n
col=sum(1 for r,g,b in P if max(r,g,b)-min(r,g,b)>18 and max(r,g,b)>120)/n
dark=sum(1 for r,g,b in P if max(r,g,b)<60)/n
print(json.dumps({'white':round(white,3),'colour':round(col,3),'dark':round(dark,3)}))`, file]).toString())
  async function page(vp, reduce = false) {
    const pg = await browser.newPage(); const errs = []
    pg.on('pageerror', (e) => errs.push(String(e)))
    await pg.setRequestInterception(true)   // offline: only the local site; the API, fonts and thumbnails fail fast
    pg.on('request', (r) => (new URL(r.url()).hostname === '127.0.0.1' ? r.continue() : r.abort()))
    await pg.setViewport(vp)
    if (reduce) await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    pg.errs = errs; return pg
  }
  const DESK = { width: 1280, height: 820 }, PHONE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  const shots = [
    ['page-anapanasati', 'mindfulness-of-breathing', DESK, 'page'],
    ['body-nostrils-anapanasati', 'mindfulness-of-breathing', DESK, 'body'],
    ['body-heart-metta', 'goodwill-metta', DESK, 'body'],
    ['body-central-vbt-breath-pause', 'resting-in-the-gap-between-breaths-vijnana-bhairava-dharana', DESK, 'body'],
    ['body-belly-zazen', 'zazen', DESK, 'body'],
    ['body-channels-nine-breathings', 'nine-breathings', DESK, 'body'],
    ['body-whole-vbt-body', 'vbt-body-as-consciousness', DESK, 'body'],
    ['body-space-vbt-space', 'vbt-space-contemplation', DESK, 'body'],
    ['phone-body-heart-tonglen', 'tonglen', PHONE, 'body'],
    ['phone-page-trika-prep', 'ease-through-the-body-trika-prep', PHONE, 'page'],
    ['page-text-only-yoga-nidra', 'yoga-nidra', DESK, 'text'],
    ['page-orientation-only-rigpa', 'resting-in-rigpa-dzogchen-orientation-only', DESK, 'text'],
    ['page-reduced-motion-metta', 'goodwill-metta', DESK, 'reduce'],
    ['end-log-sheet', 'mahasi-noting', DESK, 'end'],
  ].filter(([name]) => name.includes(filter))
  for (const [name, id, vp, mode] of shots) {
    const pg = await page(vp, mode === 'reduce')
    await pg.goto(`${base}/#practice/${id}`, { waitUntil: 'domcontentloaded' })
    await pg.waitForFunction(() => document.querySelector('.whero h1'), { timeout: 20000 }).catch(() => {})
    await wait(1200)
    const info = await pg.evaluate(() => ({ body: !!document.querySelector('[data-body]'), timer: !!document.querySelector('[data-timer]'), bodyGold: document.querySelector('[data-body]')?.classList.contains('gold'), where: document.querySelector('.fl-where')?.textContent || '', note: document.querySelector('.fl-bodynote')?.textContent || '' }))
    if (mode === 'page') { ok(info.body && info.timer, `${id}: body + timer buttons`); ok(!!info.where, `${id}: course line "${info.where}"`) }
    if (mode === 'text') ok(!info.body, `${id}: text-only, no body button`)
    if (mode === 'reduce') ok(info.body && !info.bodyGold && info.timer, `${id}: reduced motion keeps the timer first`)
    if (mode === 'body' || mode === 'end') {
      await pg.evaluate(() => { const b = [...document.querySelectorAll('[data-m]')].find((x) => x.dataset.m === '5'); b?.click(); document.querySelector('[data-body]')?.click() })
      await pg.waitForFunction(() => window.__bp && document.querySelector('.bp.on'), { timeout: 20000 }).catch(() => {})
      if (mode === 'end') {
        await wait(2000); await pg.evaluate(() => window.__bp.finish(false)); await wait(1400)
        const sheet = await pg.evaluate(() => ({ sheet: !!document.querySelector('.fl-timer [data-log]'), overlay: !!document.querySelector('.bp') }))
        ok(sheet.sheet && !sheet.overlay, `${id}: ending the body sit closes the overlay and opens the log sheet`)
        await pg.evaluate(() => document.querySelector('.fl-timer [data-log]').click()); await wait(300)
        const log = await pg.evaluate(() => JSON.parse(localStorage.getItem('wiser.practice') || localStorage.getItem('practice') || '[]'))
        ok(Array.isArray(log) && log[0]?.source === 'player', `${id}: logged with source player`)
      } else {
        await wait(9300)   // first step line arrives at 8 s
        const st = await pg.evaluate(() => ({ locus: window.__bp.locus, cue: window.__bp.cue, line: document.querySelector('.bp-line')?.textContent, on: document.querySelector('.bp-line')?.classList.contains('on'), inn: window.__bp.breath.state.inn, out: window.__bp.breath.state.out }))
        ok(st.cue === 0 && st.on && st.line, `${id}: first step as one quiet line ("${(st.line || '').slice(0, 50)}")`)
        const want = J('wisegraph/practice-body.json').practices[id]
        ok(st.locus === want.locus, `${id}: locus ${st.locus}`)
      }
    }
    const file = path.join(out, `${name}.jpg`)
    if (mode !== 'end') await pg.screenshot({ path: file, type: 'jpeg', quality: 84 })
    else await pg.screenshot({ path: file, type: 'jpeg', quality: 84 })
    const s = px(file)
    if (mode === 'body') ok(s.white > 0.45 && s.colour > 0.004, `${name}: white page with coloured light (${JSON.stringify(s)})`)
    if (mode === 'page' || mode === 'text') ok(s.dark > 0.3, `${name}: dark site page (${JSON.stringify(s)})`)
    ok(!pg.errs.length, `${name}: no page errors ${pg.errs.join(' | ').slice(0, 300)}`)
    console.log(name, JSON.stringify(s))
    await pg.close()
  }
  await browser.close(); srv.close()
  console.log(`${n - fails}/${n} checks passed (with browser); shots in ${out}`)
}
process.exit(fails ? 1 : 0)
