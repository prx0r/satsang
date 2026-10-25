// /sit/: the hands-off practice player. Choose a practice or a routine → Begin → it runs by itself from the compiled timeline
// (compile.mjs via sit/session.mjs): the energy body (breath/body.js) breathes the timeline's natural breath, the light of
// attention moves to the locus each stage names (sit/loci.mjs), one quiet line of guidance at a time, optional narration
// (rendered clips where they exist, otherwise the browser voice), soft bells at the start, at each stage and at the end.
// Nothing to hold or tap. Eyes-closed mode darkens the screen and leaves the sound. Esc stops, Space pauses.
// Optional mic-follow (off by default): the light follows your own breath sound instead of the timeline's (breath/breath.js).
// URL: ?p=<practice> | ?r=<routine>  [&min=20] [&voice=1] [&eyes=1] [&beginner=1] [&reduce] [&lq|&hq]
//      test/screens: [&t=<sec>&still] start at t and freeze; [&sheet] open "From the text"; [&end] show the end card
import { compile } from '../compile.mjs'
import { createBody } from '../breath/body.js'
import { createBreath } from '../breath/breath.js'
import { buildSession, breathAt, focusAt, stageAt, itemAt, fmt } from './session.mjs'
import { bodyLocus } from './loci.mjs'

const PRACTICES = ['ajahn-lee-method-2', 'ajahn-lee-method-1', 'mn118-anapanasati', 'karaniya-metta', 'vbt-body-as-awareness', 'vbt-space-contemplation']
const ROUTINES = ['morning-thai-forest', 'anapanasati-sixteen', 'vbt-spacious']
const LENGTHS = [5, 10, 15, 20, 30, 45, 60]
const q = new URLSearchParams(location.search)
const $ = id => document.getElementById(id)
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || q.has('reduce')
const small = q.has('lq') || (!q.has('hq') && (Math.min(innerWidth, innerHeight) < 600 || (navigator.hardwareConcurrency || 8) <= 2))
const J = async u => { const r = await fetch(u); if (!r.ok) throw new Error(u + ' ' + r.status); return r.json() }
const cache = new Map(), get = u => cache.get(u) || (cache.set(u, J(u).catch(e => (cache.delete(u), Promise.reject(e)))), cache.get(u))

const grammar = await get('../grammar.json')
const practice = id => get(`../practices/${id}.json`)
const routine = id => get(`../routines/${id}.json`)

/* ---------- the body (or a quiet orb when WebGL2 is missing) ---------- */
const canvas = $('c')
let body = null
try { body = createBody(canvas, { small, reduce }) } catch (e) { console.error(e) }
let orb = null
if (!body) { canvas.style.display = 'none'; const c2 = $('nogl'); c2.style.display = 'block'; orb = c2.getContext('2d') }
window.__body = body
function drawOrb(level, focus) {
  const c = orb.canvas, d = Math.min(devicePixelRatio || 1, 2); if (c.width !== innerWidth * d) { c.width = innerWidth * d; c.height = innerHeight * d }
  const w = c.width, h = c.height, r = Math.min(w, h) * (0.12 + 0.1 * level)
  orb.clearRect(0, 0, w, h); const g = orb.createRadialGradient(w / 2, h * 0.45, r * 0.1, w / 2, h * 0.45, r)
  g.addColorStop(0, 'rgba(201,164,92,.55)'); g.addColorStop(1, 'rgba(201,164,92,0)'); orb.fillStyle = g; orb.beginPath(); orb.arc(w / 2, h * 0.45, r, 0, 7); orb.fill()
}

/* ---------- sound: bowls and chimes are synthesised (no samples), voice = rendered clips or speechSynthesis ---------- */
let ac = null
const audio = () => { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac }
function strike(kind, when = 0) {
  if (!ac) return
  const t = ac.currentTime + when, out = ac.createGain(); out.gain.value = kind === 'chime' ? 0.07 : 0.11; out.connect(ac.destination)
  const f0 = kind === 'chime' ? 1046 : 196, parts = kind === 'chime' ? [[1, 1, 2.4], [2.76, 0.4, 1.6], [5.4, 0.15, 0.9]] : [[1, 1, 9], [2.71, 0.55, 6], [5.1, 0.25, 3.5], [8.2, 0.1, 2]]
  for (const [m, a, d] of parts) for (const det of [0, 1.3]) {   // two slightly detuned partials beat softly, like a real bowl
    const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f0 * m + det
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a * 0.5, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d)
    o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.1)
  }
}
const cue = s => s === 'bowl-end' ? (strike('bowl'), strike('bowl', 3.2)) : strike(s === 'bowl' ? 'bowl' : 'chime')
let clips = new Map(), voiceOn = false, curAudio = null
async function loadClips(ids) {
  clips = new Map()
  for (const id of ids) { try { const m = await get(`../renders/${id}/voice/manifest.json`); for (const l of m.lines || []) if (l.file) clips.set(l.text, '../' + l.file) } catch (e) { /* no rendered voice: browser voice */ } }
}
function speak(v) {
  if (!voiceOn || !v.say) return
  stopVoice()
  const f = clips.get(v.text)
  if (f) { curAudio = new Audio(f); curAudio.volume = 0.9; curAudio.play().catch(() => {}); return }
  if (!('speechSynthesis' in window)) return
  const u = new SpeechSynthesisUtterance(v.say); u.rate = 0.82; u.pitch = 0.95; u.volume = 0.9; speechSynthesis.speak(u)
}
function stopVoice() { if (curAudio) { curAudio.pause(); curAudio = null } if ('speechSynthesis' in window) speechSynthesis.cancel() }

/* ---------- start card ---------- */
const st = { kind: q.get('r') ? 'routine' : 'practice', id: q.get('r') || q.get('p') || PRACTICES[0], min: q.get('min') ? +q.get('min') : 0,
  voice: q.get('voice') === '1', eyes: q.get('eyes') === '1', beginner: q.get('beginner') === '1', mic: false }
async function items() {
  if (st.kind === 'routine') { const r = await routine(st.id); return Promise.all(r.items.map(async i => ({ ...i, practice: await practice(i.practice), beginner: i.beginner || st.beginner }))) }
  return [{ practice: await practice(st.id), minutes: st.min || undefined, beginner: st.beginner }]
}
async function renderList() {
  $('tabP').setAttribute('aria-selected', st.kind === 'practice'); $('tabR').setAttribute('aria-selected', st.kind === 'routine')
  const ids = st.kind === 'routine' ? ROUTINES : (PRACTICES.includes(st.id) || st.kind !== 'practice' ? PRACTICES : [st.id, ...PRACTICES])
  const rows = await Promise.all(ids.map(async id => {
    try {
      if (st.kind === 'routine') { const r = await routine(id); return { id, name: r.name, sub: r.summary } }
      const p = await practice(id), tl = compile(p, grammar, {})
      return { id, name: p.name, sub: `${fmt(tl.total_s)} as written · ${(p.sources?.[0]?.cite || '').split(/ \(|, summarised|; /)[0]}` }
    } catch (e) { return null }
  }))
  $('list').setAttribute('aria-label', st.kind === 'routine' ? 'Routines' : 'Practices')
  $('list').replaceChildren(...rows.filter(Boolean).map(r => {
    const b = document.createElement('button'); b.className = 'opt'; b.setAttribute('aria-pressed', r.id === st.id)
    b.innerHTML = `<b></b><span></span>`; b.querySelector('b').textContent = r.name; b.querySelector('span').textContent = r.sub
    b.onclick = () => { st.id = r.id; st.min = 0; renderList() }; return b
  }))
  await renderPlan()
}
let plan = null
async function renderPlan() {
  const its = await items()
  plan = buildSession(its, grammar, compile)
  const one = st.kind === 'practice' ? its[0].practice : null
  // length chips (practices only: a routine's items carry their own minutes)
  const lr = $('lenRow'); lr.querySelectorAll('.chip').forEach(c => c.remove()); lr.hidden = st.kind === 'routine'
  if (one) {
    const nat = compile(one, grammar, { beginner: st.beginner }).total_s
    const mk = (label, m) => { const c = document.createElement('button'); c.className = 'chip'; c.textContent = label; c.setAttribute('aria-pressed', (st.min || 0) === m); c.onclick = () => { st.min = m; renderPlan() }; lr.append(c) }
    mk(`As written · ${fmt(nat)}`, 0)
    for (const m of LENGTHS) if (m * 60 > nat * 0.55) mk(`${m} min`, m)
  }
  for (const [id, k] of [['oVoice', 'voice'], ['oEyes', 'eyes'], ['oBeg', 'beginner'], ['oMic', 'mic']]) $(id).setAttribute('aria-pressed', !!st[k])
  const it = plan.items
  $('plan').textContent = plan.warnings.length ? plan.warnings.join(' · ') :
    `${fmt(plan.total_s)} in all` + (it.length > 1 ? ' · ' + it.map(i => `${i.label} ${fmt(i.t1 - i.t0)}`).join(' → ') : '') +
    (it.length === 1 && it[0].notes.length ? ` · ${[...new Set(it.flatMap(i => i.notes))].join(', ')}` : '') + ' · no breath holds'
  const ps = await Promise.all(its.map(i => i.practice))
  const cs = [...new Set(ps.flatMap(p => p.contraindications || []))]
  $('caut').hidden = !cs.length; $('caut').innerHTML = cs.length ? '<b>Before you begin</b><ul></ul>' : ''
  for (const c of cs) { const li = document.createElement('li'); li.textContent = c; $('caut').querySelector('ul').append(li) }
  $('src').replaceChildren(...ps.flatMap(p => (p.sources || []).slice(0, 1).map(s => { const d = document.createElement('div'); const a = document.createElement('a'); a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = s.cite; d.append(a); if (s.licence) d.append(` · ${s.licence.split(' (')[0]}`); return d })))
  $('begin').disabled = !plan.items.length
  await loadClips(ps.map(p => p.id))
  if (clips.size && q.get('voice') !== '0' && !st._voiceTouched) { st.voice = true; $('oVoice').setAttribute('aria-pressed', 'true') }
}
$('tabP').onclick = () => { st.kind = 'practice'; st.id = PRACTICES[0]; st.min = 0; renderList() }
$('tabR').onclick = () => { st.kind = 'routine'; st.id = ROUTINES[0]; renderList() }
$('oVoice').onclick = () => { st.voice = !st.voice; st._voiceTouched = true; renderPlan() }
$('oEyes').onclick = () => { st.eyes = !st.eyes; renderPlan() }
$('oBeg').onclick = () => { st.beginner = !st.beginner; renderPlan() }
$('oMic').onclick = () => { st.mic = !st.mic; renderPlan() }

/* ---------- running ---------- */
let S = null, t = 0, running = false, paused = false, still = false, lastWall = 0, vi = 0, ci = 0, breathM = null, wake = null, lastStage = null, lastFocus = null
let captionTimer = 0
function caption(v) {
  const el = $('caption'); el.textContent = v.text
  if (v.quote?.text) { const qq = document.createElement('q'); qq.textContent = v.quote.text; el.append(qq) }
  el.classList.add('on'); clearTimeout(captionTimer); captionTimer = setTimeout(() => el.classList.remove('on'), Math.max(6000, (v.dur || 5) * 1000 + 2500))
}
async function begin({ at = 0, freeze = false } = {}) {
  if (!plan?.items.length) return
  S = plan; t = at; still = freeze; running = true; paused = false
  vi = S.voice.findIndex(v => v.t >= at - 0.01); if (vi < 0) vi = S.voice.length
  ci = S.cues.findIndex(c => c.t >= at - 0.01); if (ci < 0) ci = S.cues.length
  voiceOn = st.voice
  if (!freeze) audio()
  $('start').hidden = true; $('end').hidden = true; $('hud').hidden = false
  document.body.classList.toggle('eyes', st.eyes); $('eyesBtn').setAttribute('aria-pressed', st.eyes)
  if (st.mic && !freeze) { breathM = createBreath({ lead: false }); try { await breathM.micStart(audio()) } catch (e) { breathM = null; caption({ text: 'The microphone was not allowed: following the guide instead.', dur: 4 }) } }
  try { wake = await navigator.wakeLock?.request('screen') } catch (e) { wake = null }
  lastWall = performance.now(); lastStage = null; lastFocus = null
  if (freeze) { const v = [...S.voice].reverse().find(v => v.t <= at); if (v) caption(v); tick(true) }
  idleSoon()
}
function stop(done = false) {
  if (!running) return
  running = false; stopVoice(); if (breathM) { breathM.micStop(); breathM = null }
  try { wake?.release() } catch (e) {} wake = null
  document.body.classList.remove('eyes'); $('sheet').hidden = true
  $('hud').hidden = true; $('endTxt').textContent = done ? `${fmt(S.total_s)} · ${S.items.map(i => i.label).join(' → ')}` : `Stopped at ${fmt(t)} of ${fmt(S.total_s)}`
  $('end').querySelector('h1').textContent = done ? 'Complete' : 'Stopped'
  $('end').hidden = false
  if (body) body.setLocus('none')
  // integration hook (SIT-PLAYER.md §6): a host page (the main site's "Practise with the body") logs the sit from this
  const ev = { type: 'satsang-sit-end', kind: st.kind, id: st.id, items: S.items.map(i => i.id), seconds: Math.round(t), total: Math.round(S.total_s), full: done }
  dispatchEvent(new CustomEvent('sit-end', { detail: ev }))
  if (parent !== window) try { parent.postMessage(ev, '*') } catch (e) {}
}
function tick(force) {
  if (!running) return
  const now = performance.now(), dt = Math.min(0.25, (now - lastWall) / 1000); lastWall = now
  if (!paused && !still) t += dt
  // cues and voice fire as the clock passes them (anything more than 2 s late after a background pause is skipped, not stacked)
  while (ci < S.cues.length && S.cues[ci].t <= t) { const c = S.cues[ci++]; if (t - c.t < 2 && !still) cue(c.sound) }
  while (vi < S.voice.length && S.voice[vi].t <= t) { const v = S.voice[vi++]; if (t - v.t < 2) { caption(v); if (!still) speak(v) } }
  const sg = stageAt(S, t), f = focusAt(S, t)
  if (sg && sg !== lastStage) { lastStage = sg; $('stage').textContent = `${itemAt(S, t)?.label || ''}${S.items.length > 1 || sg.label ? ' · ' : ''}${sg.label || ''}`; if (!$('sheet').hidden) openSheet() }
  const L = f.target ? bodyLocus(f.target, f.size) : null
  const key = f.target + '|' + f.size
  if (key !== lastFocus) { lastFocus = key; if (body) body.setLocus(L || 'none'); $('where').textContent = L?.label ? `attention: ${L.label}` : '' }
  $('clock').textContent = `${fmt(t)} / ${fmt(S.total_s)}${paused ? ' · paused' : ''}`
  $('bar').style.width = `${Math.min(100, t / S.total_s * 100)}%`
  if (t >= S.total_s && !still) { cueEndOnce(); stop(true) }
}
let endFired = false
function cueEndOnce() { if (endFired) return; endFired = true }
function frame(now) {
  const dt = Math.min(0.25, (now - (frame.last || now)) / 1000); frame.last = now
  if (running) tick()
  let b
  if (running && breathM) b = breathM.tick(dt, now / 1000)
  else if (running) { const s = breathAt(S, t); b = { level: s.level, vel: paused ? 0 : s.vel, env: 0, rest: paused } ; const w = $('word'); if (s.label && !s.open) { w.textContent = s.label; w.classList.add('on') } else w.classList.remove('on') }
  else b = idleBreath(dt)
  if (body) body.frame(still ? (frame.n = (frame.n || 0) + 1) < 90 ? 0.08 : 0.016 : dt, b)   // a still (screens/tests) settles the eased locus first; else if (orb) drawOrb(b.level, null)
  requestAnimationFrame(frame)
}
const idle = createBreath({ lead: false })
const idleBreath = dt => idle.tick(dt, performance.now() / 1000)
requestAnimationFrame(frame)
setInterval(() => { if (running && document.hidden) tick() }, 500)   // keeps bells and voice on time when the tab is hidden

/* controls: everything optional; the screen can be ignored */
let idleTimer = 0
function idleSoon() { $('hud').classList.remove('idle'); clearTimeout(idleTimer); idleTimer = setTimeout(() => running && $('sheet').hidden && $('hud').classList.add('idle'), 4000) }
addEventListener('pointermove', idleSoon); addEventListener('pointerdown', idleSoon)
function setEyes(on) { st.eyes = on; document.body.classList.toggle('eyes', on); $('eyesBtn').setAttribute('aria-pressed', on) }
$('eyesBtn').onclick = () => setEyes(!st.eyes)
$('dim').onclick = () => setEyes(false)
$('stopBtn').onclick = () => stop(false)
$('pauseBtn').onclick = () => { paused = !paused; if (paused) { stopVoice(); if (ac) ac.suspend() } else if (ac) ac.resume(); $('pauseBtn').setAttribute('aria-label', paused ? 'Resume' : 'Pause') }
addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (!$('sheet').hidden) { $('sheet').hidden = true; return } stop(false) }
  else if (running && e.code === 'Space') { e.preventDefault(); $('pauseBtn').click() }
  else if (running && (e.key === 'e' || e.key === 'E')) setEyes(!st.eyes)
})
$('begin').onclick = () => begin()
$('again').onclick = () => { endFired = false; begin() }
$('other').onclick = () => { $('end').hidden = true; $('start').hidden = false }

/* ---------- "From the text": the passages behind the current stage, quoted only where the licence allows ---------- */
const para = id => { const m = /:p(\d+)/.exec(id); return m ? `¶${m[1]}` : '' }
async function openSheet() {
  const sh = $('sheet'); sh.hidden = false; idleSoon()
  const sg = stageAt(S, t), p = await practice(sg.practice)
  const head = document.createElement('div'); head.innerHTML = '<button class="x" aria-label="Close">×</button><h2></h2>'; head.querySelector('h2').textContent = sg.label || p.name
  head.querySelector('.x').onclick = () => { sh.hidden = true }
  const body2 = document.createElement('div')
  try {
    const ins = await get(`../pipeline/${p.id}/instructions.json`), src = await get(`../sources/${ins.source}/source-text.json`)
    const seg = id => src.segments.find(s => s.id === id) || {}
    const lic = src.licence || {}, mayQuote = lic.terms?.store_verbatim !== false
    const own = src.author?.id === 'satsang'
    const list = ins.instructions.filter(i => i.stage === sg.stage && i.scripted)
    for (const i of list) {
      for (const sp of i.spans.slice(0, 2)) {
        const sgm = seg(sp.segment), ref = document.createElement('div'); ref.className = 'ref'
        ref.textContent = `${sgm.label || sp.segment}${sgm.verses ? '' : ' ' + para(sp.passage)}`
        const a = document.createElement('a'); a.href = sgm.url || src.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = ' · source'; ref.append(a)
        body2.append(ref)
        if (mayQuote) { const bq = document.createElement('blockquote'); const w = sp.quote.split(/\s+/); bq.textContent = w.length > 25 ? w.slice(0, 25).join(' ') + ' …' : sp.quote; body2.append(bq) }
      }
    }
    if (!list.length) body2.append(Object.assign(document.createElement('p'), { textContent: 'This part is our framing (a bell, open sitting), not from the text.' }))
    const att = document.createElement('div'); att.className = 'att'
    att.textContent = own ? `Satsang’s own words (CC BY 4.0), summarising the verses named above. The translation is linked, never quoted.` : `${lic.terms?.attribution || src.title}. Quoted under ${lic.id}; our guidance is adapted from it.`
    body2.append(att)
  } catch (e) {
    const s = (p.sources || [])[0]; const d = document.createElement('p'); d.textContent = s ? s.cite : 'No source recorded.'; body2.append(d)
    if (s?.url) { const a = document.createElement('a'); a.href = s.url; a.target = '_blank'; a.textContent = 'Open the source'; body2.append(a) }
  }
  sh.replaceChildren(head, body2)
}
$('provBtn').onclick = () => { if (!$('sheet').hidden) { $('sheet').hidden = true; return } openSheet() }

/* ---------- boot ---------- */
await renderList()
window.__sit = { get session() { return S }, get t() { return t }, plan: () => plan, begin, stop, setEyes, openSheet, bodyLocus }
if (q.has('t')) await begin({ at: +q.get('t'), freeze: q.has('still') })
if (q.has('sheet') && running) await openSheet()
if (q.has('end') && running) stop(true)
document.documentElement.dataset.ready = '1'
