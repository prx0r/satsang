// Satsang practice player v0: DOM shell around engine.js (controls, captions, narration hook, bell, keyboard/TV).
// Usage:
//   import { createPlayer } from './player.js'
//   const p = createPlayer(el, { grammar, practice, compile })   // compile from ../compile.mjs
//   p.load(practice)  p.play()  p.pause()  p.seek(t)  p.renderAt(t)  p.set({ speed, rounds, beginner, voice, muted })
// Narration: window.SatsangTTS = { speak(text, {lang}) → Promise, cancel() } overrides the speechSynthesis fallback.
// Cues: window.SatsangCues = { play(kind) → true if handled } plays a rendered sound kit; the synth bell is the fallback.
import { createRenderer } from './engine.js'

const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstChild }
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const fmt = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
const SPEEDS = [0.75, 1, 1.25, 1.5]
const ICON = {
  play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
  restart: '<svg viewBox="0 0 24 24"><path d="M12 5a7 7 0 1 1-6.6 4.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4.5 4.5v5h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  voice: '<svg viewBox="0 0 24 24"><path d="M5 6.5h14v9H11l-4 3v-3H5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><path d="M5 9.5h3.5L13 6v12l-4.5-3.5H5z" fill="currentColor"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.8a7 7 0 0 1 0 10.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 11v5.5M12 7.6v.1" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
}

// soft synthesized bells (no assets)
function makeAudio() {
  let ac = null
  return {
    bell(kind = 'bell-soft', muted) {
      if (muted) return
      if (window.SatsangCues?.play?.(kind)) return   // rendered kit (PRACTICE-MEDIA §1); else the synth below
      try {
        ac ||= new (window.AudioContext || window.webkitAudioContext)()
        const f0 = kind === 'bell-end' ? 396 : 528, now = ac.currentTime
        for (const [mul, g0, dec] of [[1, 0.07, 2.6], [2.76, 0.025, 1.4], [5.4, 0.01, 0.8]]) {
          const o = ac.createOscillator(), g = ac.createGain()
          o.type = 'sine'; o.frequency.value = f0 * mul
          g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(g0, now + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + dec)
          o.connect(g).connect(ac.destination); o.start(now); o.stop(now + dec + 0.1)
        }
      } catch { /* audio unavailable */ }
    },
    resume() { try { ac?.resume() } catch { } },
  }
}
const speechTTS = {
  speak(text) {
    if (!('speechSynthesis' in window)) return Promise.resolve()
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text.replace(/[“”]/g, '')); u.rate = 0.86; u.pitch = 0.95; u.volume = 0.9
    const v = speechSynthesis.getVoices().find(v => /en-(GB|IN)/.test(v.lang)) || speechSynthesis.getVoices().find(v => /^en/.test(v.lang))
    if (v) u.voice = v
    return new Promise(r => { u.onend = r; u.onerror = r; speechSynthesis.speak(u) })
  },
  cancel() { try { speechSynthesis.cancel() } catch { } },
}

export function createPlayer(root, { grammar, compile, practice, options = {} }) {
  const st = { t: 0, playing: false, speed: 1, rounds: null, beginner: !!options.beginner, voice: !!options.voice, muted: !!options.muted,
    tl: null, practice: null, voiceIdx: -1, audioIdx: 0, lastTs: 0, ended: false, idleTimer: 0, started: false }
  const el = $(`<div class="sp" tabindex="-1">
    <canvas class="sp-canvas" aria-hidden="true"></canvas>
    <div class="sp-grain" aria-hidden="true"></div>
    <header class="sp-top">
      <div class="sp-title"><span class="sp-word">Satsang</span><span class="sp-sep">·</span><span class="sp-name"></span></div>
      <div class="sp-slot"></div>
      <button class="sp-btn sp-icon sp-info-btn" aria-label="About this practice and its sources">${ICON.info}</button>
    </header>
    <div class="sp-caption" aria-live="polite"><p></p><q class="sp-quote" hidden></q></div>
    <nav class="sp-controls" aria-label="Practice controls">
      <button class="sp-btn sp-icon sp-restart" aria-label="Restart">${ICON.restart}</button>
      <button class="sp-btn sp-icon sp-play sp-primary" aria-label="Play">${ICON.play}</button>
      <span class="sp-time">0:00 / 0:00</span>
      <div class="sp-bar" role="progressbar" aria-label="Progress"><i></i></div>
      <button class="sp-btn sp-speed" aria-label="Speed">1×</button>
      <span class="sp-rounds"><button class="sp-btn sp-icon sp-rminus" aria-label="Fewer rounds">−</button><span class="sp-rval">5 rounds</span><button class="sp-btn sp-icon sp-rplus" aria-label="More rounds">+</button></span>
      <button class="sp-btn sp-toggle sp-beg" aria-pressed="false" aria-label="Beginner form"><span class="sp-l">Beginner</span><span class="sp-s">Easy</span></button>
      <button class="sp-btn sp-toggle sp-voice" aria-pressed="false" aria-label="Spoken guidance"><span class="sp-l">Voice</span><span class="sp-s">${ICON.voice}</span></button>
      <button class="sp-btn sp-toggle sp-mute" aria-pressed="false" aria-label="Sound"><span class="sp-l">Sound</span><span class="sp-s">${ICON.sound}</span></button>
    </nav>
    <section class="sp-gate" role="dialog" aria-modal="true"></section>
    <aside class="sp-info" hidden></aside>
  </div>`)
  root.appendChild(el)
  const q = s => el.querySelector(s)
  const canvas = q('.sp-canvas'), capEl = q('.sp-caption'), capP = q('.sp-caption p'), capQ = q('.sp-caption .sp-quote')
  const audio = makeAudio()
  { // static film grain from a tiny generated tile (an SVG turbulence filter is too slow on TVs and headless)
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), im = g.createImageData(128, 128)
    for (let i = 0; i < im.data.length; i += 4) { const v = (Math.random() * 255) | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255 }
    g.putImageData(im, 0, 0); q('.sp-grain').style.backgroundImage = `url(${c.toDataURL()})`
  }
  const R = createRenderer(canvas, grammar, {
    insets: () => ({ top: q('.sp-top').offsetHeight + 4, bottom: q('.sp-controls').offsetHeight + 26 }),
    onLayout(L) {
      const c = L.cap
      Object.assign(capEl.style, { left: c.x + 'px', top: c.y + 'px', width: c.w + 'px', textAlign: c.align, height: c.h ? c.h + 'px' : '' })
      el.classList.toggle('sp-land', L.land); el.classList.toggle('sp-port', !L.land)
    },
  })
  const tts = () => window.SatsangTTS || speechTTS

  function compileNow() {
    st.tl = compile(st.practice, grammar, { beginner: st.beginner, rounds: st.rounds ?? undefined, skip_stages: options.skip_stages })
    st.rounds = st.tl.loops
    R.setTimeline(st.tl, st.practice)
    syncUI()
  }
  function load(prac, { autoplay = false, t = 0 } = {}) {
    pause(); st.practice = prac; st.rounds = null; st.ended = false; st.voiceIdx = -1
    q('.sp-name').textContent = prac.name
    compileNow(); renderGate(); renderInfo()
    seek(t)
    if (autoplay) start()
  }
  function syncUI() {
    const tl = st.tl; if (!tl) return
    q('.sp-play').innerHTML = st.playing ? ICON.pause : ICON.play
    q('.sp-play').setAttribute('aria-label', st.playing ? 'Pause' : 'Play')
    q('.sp-speed').textContent = st.speed + '×'
    const Rr = st.practice.script.rounds || {}
    q('.sp-rval').innerHTML = `${tl.loops}<span class="sp-l"> ${Rr.unit ? 'breaths' : tl.loops === 1 ? 'round' : 'rounds'}</span>`
    q('.sp-rounds').style.display = (Rr.max ?? 1) > 1 ? '' : 'none'
    const hasBeg = !!st.practice.safety?.beginner_override
    q('.sp-beg').style.display = hasBeg ? '' : 'none'
    for (const [s, v] of [['.sp-beg', st.beginner], ['.sp-voice', st.voice], ['.sp-mute', !st.muted]]) q(s).setAttribute('aria-pressed', String(v))
    q('.sp-time').textContent = `${fmt(st.t)} / ${fmt(tl.total_s)}`
    q('.sp-bar i').style.width = (100 * st.t / tl.total_s).toFixed(2) + '%'
  }
  function caption(t) {
    const V = st.tl.tracks.voice; let k = -1
    for (let i = 0; i < V.length; i++) { if (V[i].t <= t + 1e-6) k = i; else break }
    if (k !== st.voiceIdx) {
      const prev = st.voiceIdx; st.voiceIdx = k
      const v = V[k]
      if (!v) { capP.textContent = ''; capQ.hidden = true; return }
      if (prev < 0 || V[prev]?.text !== v.text) {
        capEl.classList.remove('sp-in'); void capEl.offsetWidth
        capP.textContent = v.text; capEl.classList.add('sp-in')
        // optional original-text line (TEXT-TO-PRACTICE §5): shown, never spoken, with its citation
        capQ.hidden = !v.quote; capQ.textContent = v.quote ? v.quote.text : ''; if (v.quote?.cite) capQ.title = v.quote.cite
      }
      if (st.playing && st.voice && !st.muted && v.say && k > prev) tts().speak(v.say).catch(() => { })
    }
  }
  function audioCues(t0, t1) {
    const A = st.tl.tracks.audio
    for (const a of A) if (a.t > t0 && a.t <= t1) audio.bell(a.sound, st.muted)
  }

  // ---------- clock ----------
  let raf = 0
  function loop(ts) {
    raf = requestAnimationFrame(loop)
    if (!st.tl) return
    const dtReal = st.lastTs ? Math.min(0.1, (ts - st.lastTs) / 1000) : 1 / 60
    st.lastTs = ts
    const t0 = st.t
    if (st.playing) {
      st.t = Math.min(st.tl.total_s, st.t + dtReal * st.speed)
      audioCues(t0, st.t)
      if (st.t >= st.tl.total_s) end()
    }
    R.frame(st.t, dtReal * (st.playing ? st.speed : 1))
    caption(st.t)
    if (st.playing || (ts | 0) % 10 === 0) syncUI()
  }
  function play() {
    if (!st.tl) return
    if (st.ended || st.t >= st.tl.total_s) seek(0)
    st.playing = true; st.ended = false; audio.resume(); el.classList.add('sp-playing'); syncUI(); poke()
  }
  function pause() { st.playing = false; el.classList.remove('sp-playing'); tts().cancel(); syncUI(); showControls() }
  function toggle() { st.playing ? pause() : (st.started ? play() : start()) }
  function seek(t) { st.t = Math.max(0, Math.min(st.tl.total_s, t)); st.voiceIdx = -1; R.clearTrails(); syncUI() }
  function renderAt(t, warm = 2) {
    seek(Math.max(0, t - warm)); const n = Math.round(Math.min(t, warm) * 60)
    for (let i = 0; i < n; i++) { st.t += 1 / 60; R.frame(st.t, 1 / 60) }
    st.t = t; R.frame(t, 1 / 60); caption(t); syncUI()
  }
  function start() { st.started = true; q('.sp-gate').hidden = true; play(); canvas.focus?.() }
  function end() {
    st.playing = false; st.ended = true; el.classList.remove('sp-playing'); syncUI(); showControls()
    const g = q('.sp-gate'); g.hidden = false
    g.innerHTML = `<div class="sp-card"><p class="sp-kicker">Complete</p><h2>${esc(st.practice.name)}</h2>
      <p class="sp-muted">${fmt(st.tl.total_s)} · ${st.tl.loops} ${st.tl.loops === 1 ? 'round' : 'rounds'}. Sit for a moment before moving on.</p>
      <div class="sp-row"><button class="sp-btn sp-primary sp-again">Again</button></div></div>`
    g.querySelector('.sp-again').onclick = () => { g.hidden = true; seek(0); play() }
    g.querySelector('.sp-again').focus()
  }

  // ---------- overlays ----------
  function renderGate() {
    const p = st.practice, g = q('.sp-gate'), f = p.facets || {}
    const ci = (p.contraindications || []).slice(0, 4).map(c => `<li>${esc(c)}</li>`).join('')
    g.hidden = false
    g.innerHTML = `<div class="sp-card">
      <p class="sp-kicker">${esc((p.traditions || []).join(' · ').replace(/-/g, ' '))}</p>
      <h2>${esc(p.name)}</h2>
      <p class="sp-summary">${esc(p.summary)}</p>
      ${f.needs_teacher ? `<p class="sp-badge">${esc(f.needs_teacher_note || 'Traditionally learned with a teacher.')}</p>` : ''}
      <details class="sp-before" ${ci ? 'open' : ''}><summary>Before you begin</summary><ul>${ci}<li>Stop at any time: press Space or tap pause.</li></ul></details>
      <div class="sp-row">
        <button class="sp-btn sp-primary sp-begin">Begin · ${fmt(st.tl.total_s)}</button>
        ${p.safety?.beginner_override ? `<button class="sp-btn sp-toggle sp-gbeg" aria-pressed="${st.beginner}">Beginner form</button>` : ''}
      </div></div>`
    g.querySelector('.sp-begin').onclick = start
    const gb = g.querySelector('.sp-gbeg')
    if (gb) gb.onclick = () => { st.beginner = !st.beginner; compileNow(); seek(0); renderGate(); g.querySelector('.sp-gbeg')?.focus() }
  }
  function renderInfo() {
    const p = st.practice, m = p.meta || {}, tl = st.tl
    q('.sp-info').innerHTML = `<div class="sp-card sp-infocard">
      <button class="sp-btn sp-icon sp-close" aria-label="Close">×</button>
      <p class="sp-kicker">About this practice</p><h3>${esc(p.name)}</h3>
      <ol class="sp-steps">${(p.steps || []).map(s => `<li>${esc(s.text)}</li>`).join('')}</ol>
      <p class="sp-kicker">Sources · confidence ${esc(m.confidence || '?')}</p>
      <ul class="sp-src">${(p.sources || []).map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.cite || s.url)}</a></li>`).join('')}</ul>
      <p class="sp-muted">${esc(m.confidence_note || '')}</p>
      <p class="sp-muted">Ratio ${tl.physiology.ratio ? tl.physiology.ratio.join(':') : 'free'} · longest hold ${tl.physiology.retention_max_s}s (cap ${tl.safety.max_hold_s}s)${tl.safety.applied.length ? ' · ' + esc(tl.safety.applied.join('; ')) : ''}</p>
      <p class="sp-muted">Captions are our own words. Visuals show where attention goes; they are not anatomy.</p></div>`
    q('.sp-info .sp-close').onclick = () => toggleInfo(false)
  }
  function toggleInfo(v) {
    const i = q('.sp-info'); i.hidden = v === undefined ? !i.hidden : !v
    if (!i.hidden) { pause(); i.querySelector('.sp-close').focus() }
  }

  // ---------- controls ----------
  q('.sp-play').onclick = toggle
  q('.sp-restart').onclick = () => { seek(0); if (!st.playing) R.frame(0) }
  q('.sp-speed').onclick = () => { st.speed = SPEEDS[(SPEEDS.indexOf(st.speed) + 1) % SPEEDS.length]; syncUI() }
  const setRounds = d => { const Rr = st.practice.script.rounds || {}; st.rounds = Math.max(Rr.min ?? 1, Math.min(Rr.max ?? 1, st.tl.loops + d)); const t = st.t; compileNow(); seek(Math.min(t, st.tl.total_s)) }
  q('.sp-rminus').onclick = () => setRounds(-1)
  q('.sp-rplus').onclick = () => setRounds(+1)
  q('.sp-beg').onclick = () => { st.beginner = !st.beginner; compileNow(); seek(0); renderInfo() }
  q('.sp-voice').onclick = () => { st.voice = !st.voice; if (!st.voice) tts().cancel(); syncUI() }
  q('.sp-mute').onclick = () => { st.muted = !st.muted; if (st.muted) tts().cancel(); syncUI() }
  q('.sp-info-btn').onclick = () => toggleInfo()
  q('.sp-bar').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * st.tl.total_s) }

  function showControls() { el.classList.remove('sp-idle'); clearTimeout(st.idleTimer) }
  function poke() { showControls(); if (st.playing) st.idleTimer = setTimeout(() => el.classList.add('sp-idle'), 3500) }
  el.addEventListener('pointermove', poke); el.addEventListener('pointerdown', poke)
  const onKey = e => {
    if (e.target.closest?.('input,textarea,select')) return
    poke()
    const k = e.key
    if (k === ' ' || k === 'k' || k === 'MediaPlayPause') { if (e.target.tagName === 'BUTTON' && k === ' ') return; e.preventDefault(); toggle() }
    else if (k === 'Escape') { if (!q('.sp-info').hidden) toggleInfo(false); else pause() }
    else if (k === 'r') { seek(0) }
    else if (k === 'm') q('.sp-mute').click()
    else if (k === 'v') q('.sp-voice').click()
    else if (k === 'b') q('.sp-beg').click()
    else if (k === 'i') toggleInfo()
    else if (k === '+' || k === '=') setRounds(1)
    else if (k === '-') setRounds(-1)
    else if (k === '>' || k === '.') q('.sp-speed').click()
    else if (k === 'f') { document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen?.().catch(() => { }) }
    else if (k === 'MediaPlay') play(); else if (k === 'MediaPause' || k === 'MediaStop') pause()
  }
  window.addEventListener('keydown', onKey)
  const ro = new ResizeObserver(() => { R.layout(); R.frame(st.t) })
  ro.observe(canvas)
  R.layout()
  document.fonts?.ready?.then(() => { R.layout(); R.frame(st.t) })
  raf = requestAnimationFrame(loop)
  if (practice) load(practice)

  return {
    el, load, play, pause, toggle, seek, renderAt, start,
    slot: q('.sp-slot'),
    set(o) { Object.assign(st, o); if ('beginner' in o || 'rounds' in o) compileNow(); syncUI() },
    get state() { return { t: st.t, playing: st.playing, total: st.tl?.total_s, beginner: st.beginner, rounds: st.tl?.loops } },
    get timeline() { return st.tl },
    freeze() { cancelAnimationFrame(raf); raf = 0 },
    // deterministic offline rendering (preview videos): step the clock forward to t in 1/60 s frames, keeping trails
    advance(t) { while (st.t + 1 / 60 <= t + 1e-9) { st.t += 1 / 60; R.frame(st.t, 1 / 60) } st.t = t; R.frame(t, 0); caption(t); syncUI() },
    hideGate() { q('.sp-gate').hidden = true; st.started = true },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('keydown', onKey); el.remove() },
  }
}
