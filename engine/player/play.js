// Satsang play player (engine milestone 1): SVG figure + WebGL2 glow + sound wave + narration, on one shared clock.
// API: player/API.md. Pure parts: player/clock.mjs, body/breath.mjs, body/figure.mjs, fx/wave.mjs (node-tested).
import { createClock, segmentAt } from './clock.mjs'
import { breathState, styleOf } from '../body/breath.mjs'
import { createFigure } from '../body/figure.mjs'
import { waveAt, wavePoints, waveParticle } from '../fx/wave.mjs'
import { createGlow } from '../fx/glow.js'

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const fmt = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x)
const hex = h => { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] }
const fract = x => x - Math.floor(x)
const hash = i => fract(Math.sin(i * 127.1 + 311.7) * 43758.5453)
const LEVELS = ['first-steps', 'steady', 'deep']
const ICON = {
  play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
  again: '<svg viewBox="0 0 24 24"><path d="M12 5a7 7 0 1 1-6.6 4.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4.5 4.5v5h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  voice: '<svg viewBox="0 0 24 24"><path d="M5 6.5h14v9H11l-4 3v-3H5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 11v5.5M12 7.6v.1" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
}

function makeBells(grammar) {
  let ac = null
  return {
    ring(kind, muted) {
      if (muted) return
      if (window.SatsangCues?.play?.(kind)) return
      try {
        ac ||= new (window.AudioContext || window.webkitAudioContext)()
        const sy = grammar.audio?.[kind]?.synth || {}, f0 = sy.f0 || 396, now = ac.currentTime, strikes = sy.strikes || 1
        for (let s = 0; s < strikes; s++) for (const [mul, g0, dec] of [[1, 0.07, sy.decay_s || 4], [2.76, 0.024, 2], [5.4, 0.009, 1]]) {
          const o = ac.createOscillator(), g = ac.createGain(), t0 = now + s * 1.6
          o.type = 'sine'; o.frequency.value = f0 * mul
          g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(g0, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dec)
          o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + dec + 0.1)
        }
      } catch { }
    },
    resume() { try { ac?.resume() } catch { } },
  }
}
const speechTTS = {
  speak(text, o = {}) {
    if (!('speechSynthesis' in window)) return Promise.resolve()
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text); u.rate = 0.86 * (o.rate || 1); u.pitch = 0.95
    const v = speechSynthesis.getVoices().find(v => /^en/.test(v.lang)); if (v) u.voice = v
    return new Promise(r => { u.onend = r; u.onerror = r; speechSynthesis.speak(u) })
  },
  cancel() { try { speechSynthesis.cancel() } catch { } },
}

export function createPlay(root, { grammar, compile, practice, media = null, options = {} }) {
  const reduced = options.reducedMotion ?? matchMedia('(prefers-reduced-motion: reduce)').matches
  const COL = Object.fromEntries(Object.entries(grammar.colours).map(([k, v]) => [k, hex(v.hex)]))
  const st = {
    practice, level: options.level || practice.facets?.level || 'steady', voice: options.voice ?? !!media, muted: !!options.muted,
    view: options.view || null, padj: {}, started: false, highlights: [], explainer: null, replayUntil: null, lastFrame: 0, idle: 0,
    presence: { from: 1, to: 1, t0: -99 }, caption: { text: '', t: -99, live: false }, rested_override: null,
  }
  const listeners = new Map()
  const emit = ev => { for (const k of [ev.type, '*']) for (const f of listeners.get(k) || []) try { f(ev) } catch (e) { console.error(e) } }

  // ---------- DOM ----------
  const el = document.createElement('div'); el.className = 'pl' + (reduced ? ' pl-reduced sf-reduced' : ''); el.tabIndex = -1
  el.innerHTML = `
    <div class="pl-stage">
      <div class="pl-fig pl-front"></div><div class="pl-fig pl-side" hidden></div>
      <svg class="pl-wave" aria-hidden="true"><path class="pl-wave-glow"/><path class="pl-wave-line"/></svg>
      <canvas class="pl-glow" aria-hidden="true"></canvas>
      <div class="pl-rest" aria-live="off" hidden><span class="pl-rest-t">0:00</span><span class="pl-rest-l">in the silence</span></div>
    </div>
    <header class="pl-top"><div class="pl-title"><span class="pl-word">Satsang</span><span class="pl-sep">·</span><span class="pl-name"></span></div>
      <span class="pl-seg"></span><button class="pl-btn pl-icon pl-info-btn" aria-label="About this play and its sources">${ICON.info}</button></header>
    <div class="pl-caption" aria-live="polite"><p></p></div>
    <button class="pl-back" hidden>I'm back</button>
    <nav class="pl-controls" aria-label="Play controls">
      <button class="pl-btn pl-icon pl-again" aria-label="Play again from the start">${ICON.again}</button>
      <button class="pl-btn pl-icon pl-pp pl-primary" aria-label="Play">${ICON.play}</button>
      <div class="pl-dots" aria-hidden="true"></div>
      <button class="pl-btn pl-toggle pl-voice" aria-pressed="true" aria-label="Voice"><span class="pl-l">Voice</span>${ICON.voice}</button>
    </nav>
    <section class="pl-gate" role="dialog" aria-modal="true"></section>
    <aside class="pl-explainer" hidden></aside>
    <aside class="pl-info" hidden></aside>`
  root.appendChild(el)
  const q = s => el.querySelector(s)
  const stage = q('.pl-stage'), capEl = q('.pl-caption'), capP = q('.pl-caption p'), restEl = q('.pl-rest'), restT = q('.pl-rest-t')
  const waveSvg = q('.pl-wave'), waveLine = q('.pl-wave-line'), waveGlow = q('.pl-wave-glow')
  const bells = makeBells(grammar)
  let glow = { ok: false, draw() { }, resize() { } }
  if (!reduced && options.webgl !== false) { try { glow = createGlow(q('.pl-glow'), { preserve: !!options.preserve }) } catch (e) { console.warn('glow off:', e.message) } }
  window.__gl = glow.ok ? 'webgl2' : 'off'
  const show = () => st.practice.script?.show || {}
  const viewMode = () => st.view || (show().side === false ? 'front' : show().side ? 'both' : 'front')
  const frame = st.practice.script?.view === 'upper' ? 'upper' : 'full'
  const front = createFigure(document, 'front', { frame }), side = createFigure(document, 'side', { frame: 'full' })
  q('.pl-front').appendChild(front.svg); q('.pl-side').appendChild(side.svg)
  if (frame === 'upper') q('.pl-front').classList.add('pl-upper')

  // ---------- media (pre-rendered narration) ----------
  const clips = new Map()   // segment id or spoken text → line
  if (media?.lines) for (const l of media.lines) { clips.set(l.id, l); clips.set(l.spoken, l); clips.set(l.text, l) }
  const base = options.base || new URL('../', import.meta.url).href
  let audio = null, audioLine = null, audioSeg = null, failTimer = 0
  const speech_s = () => { const o = {}; if (media?.lines) for (const l of media.lines) { o[l.spoken] = l.dur_s; o[l.text] = l.dur_s } return o }

  // ---------- compile + clock ----------
  let tl = null, clock = null
  function compileNow() {
    tl = compile(st.practice, grammar, { beginner: st.level === 'first-steps', speech_s: speech_s(), pause_adjust: st.padj })
    return tl
  }
  compileNow()
  clock = createClock(tl, { gate: st.voice && !st.muted, rest_cap_s: options.rest_cap_s ?? 600 })
  const style = () => styleOf(tl, st.practice)
  const segIndex = () => clock.segments

  function envAt(t) {   // loudness of the narration at t (0-1): the live clip when playing, else the manifest envelope (deterministic)
    const s = segmentAt(clock.segments, t)
    if (!s) return 0
    const l = clips.get(s.id) || (s.voice && clips.get(s.voice.say))
    if (!l?.env) return s.voice && t < s.speak_end ? 0.55 + 0.25 * Math.sin(t * 9) * Math.sin(t * 3.1) : 0
    const x = audio && audioSeg === s.id && !audio.paused ? audio.currentTime : t - s.t
    const i = Math.floor(x * (l.env_fps || 25))
    return i >= 0 && i < l.env.length ? l.env[i] : 0
  }

  // ---------- speech ----------
  function stopAudio() { clearTimeout(failTimer); if (audio) { audio.onended = audio.onerror = null; audio.pause() } audio = null; audioSeg = null; tts().cancel?.() }
  const tts = () => window.SatsangTTS || speechTTS
  function startSpeech(ev) {
    setCaption(ev.text || ev.say || '', clock.t)
    if (!ev.say || !st.voice || st.muted) return
    const l = clips.get(ev.id) || clips.get(ev.say)
    stopAudio()
    const done = () => { if (audioSeg !== ev.id && audioSeg !== null) return; audioSeg = null; handle(clock.speechEnded(ev.id)) }
    if (l) {
      audio = new Audio(new URL(l.file, base).href); audioSeg = ev.id; audioLine = l
      audio.playbackRate = clock.rate; audio.preservesPitch = true
      audio.onended = done; audio.onerror = () => fallbackTimer(ev, done)
      audio.play().catch(() => fallbackTimer(ev, done))
    } else {
      audioSeg = ev.id
      Promise.resolve(tts().speak(ev.say, { rate: clock.rate })).catch(() => { }).finally(done)
    }
  }
  function fallbackTimer(ev, done) {   // audio blocked or missing: keep the estimated timing, never stall
    const s = clock.segments.find(x => x.id === ev.id), left = s ? Math.max(0, s.speak_end - clock.t) : 0
    clearTimeout(failTimer); failTimer = setTimeout(done, (left / clock.rate) * 1000)
  }
  function setCaption(text, t, live = false) {
    if (st.caption.text !== text) { capEl.classList.remove('pl-in'); void capEl.offsetWidth; capP.textContent = text; if (text) capEl.classList.add('pl-in') }
    st.caption = { text, t, live }
  }

  // ---------- events from the clock ----------
  function handle(evs) {
    for (const ev of evs) {
      if (ev.type === 'speech_started') startSpeech(ev)
      else if (ev.type === 'audio') bells.ring(ev.sound, st.muted)
      else if (ev.type === 'pause_started') el.classList.add('pl-pausing')
      else if (ev.type === 'segment_started') { el.classList.remove('pl-pausing'); renderDots() }
      else if (ev.type === 'ended') onEnded(ev)
      else if (ev.type === 'state' && ev.hold_open) { q('.pl-back').hidden = false }
      emit(ev)
    }
  }

  // ---------- frame ----------
  function presenceAt(t) {
    const F = tl.tracks.visual.filter(v => v.prim === 'figure'); let prev = show().figure ?? 1, cur = null
    for (const f of F) { if (f.t <= t) { if (cur) prev = cur.to; cur = f } else break }
    if (!cur) return prev
    return prev + (cur.to - prev) * clamp((t - cur.t) / 2.5)
  }
  function attentionAt(t) { let a = null; for (const e of tl.tracks.attention) { if (e.t <= t) a = e; else break } return a }
  function fieldsAt(t) { return tl.tracks.visual.filter(v => v.prim === 'field' && v.t <= t && t < v.t + v.dur) }
  function centerOf(id) {
    const L = grammar.loci[id]; if (L) return { at: L.at, r: 0.12 }
    const R = grammar.regions[id]; if (R?.c) return { at: R.c, r: Math.max(...R.r) }
    if (id === 'whole_body') return { at: [0, 0.5], r: 2 }
    for (const [k, l] of Object.entries(grammar.loci)) if ((l.alias || []).includes(id)) return { at: l.at, r: 0.12 }
    return null
  }
  let lastW = 0, lastH = 0
  function draw(t, nowS) {
    const r = stage.getBoundingClientRect()
    if (r.width !== lastW || r.height !== lastH) { lastW = r.width; lastH = r.height; glow.resize(); waveSvg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`) }
    const bs = breathState(tl, t, { style: style() })
    const gain = reduced ? 0.45 : 1
    front.update(bs, t, { gain, reduced }); if (viewMode() !== 'front') side.update(bs, t, { gain, reduced })
    const pres = presenceAt(t); front.svg.style.opacity = String(pres)
    // the sound wave
    const ws = waveAt(tl, t, envAt(t)), wy = show().wave_y ?? 2.82
    const [, cy, scale] = front.toClient(0, wy), y0 = cy - r.top, H = Math.min(r.height * 0.13, scale * 0.42)
    const sprites = []
    if (ws.on) {
      const P = wavePoints(ws, t, 180, { reduced })
      const dd = P.map(([x, y], i) => `${i ? 'L' : 'M'}${((x + 1) / 2 * r.width).toFixed(1)} ${(y0 - y * H).toFixed(1)}`).join('')
      waveLine.setAttribute('d', dd); waveGlow.setAttribute('d', dd)
      const lum = ws.flat ? 0.34 : 0.45 + 0.55 * Math.min(1, ws.amp)
      waveSvg.style.setProperty('--wl', lum.toFixed(3)); waveSvg.hidden = false
      const c = COL[ws.colour] || COL.silence
      if (glow.ok) {
        for (let i = 0; i < P.length; i += 3) { const [x, y] = P[i]; const e = 1 - Math.abs(x) ** 4; sprites.push([(x + 1) / 2 * r.width, y0 - y * H, 10 + 16 * ws.amp, (0.05 + 0.16 * ws.amp) * e, ...c]) }
        // prana-flow particles riding the wave inward to the head; absorbed near the centre
        const N = Math.round(150 * ws.particles)
        for (let i = 0; i < N; i++) {
          const u = fract(hash(i) + t * (0.05 + 0.05 * hash(i + 9))), side = i % 2 ? 1 : -1
          const [x, y, a] = waveParticle(ws, t, u, side, { reduced })
          sprites.push([(x + 1) / 2 * r.width, y0 - y * H + (hash(i + 3) - 0.5) * 10, 2.5 + 3.5 * hash(i + 5), 0.55 * a * ws.particles, ...COL.nada])
        }
      }
    } else waveSvg.hidden = true
    // breath-synced glow on the attention locus and active fields
    if (glow.ok) {
      const a = attentionAt(t), seat = a && a.size !== 'whole' ? centerOf(a.target) : null
      if (seat) { const [x, y, s] = front.toClient(...seat.at); const rr = s * Math.min(0.55, seat.r) * (0.85 + 0.3 * bs.vol) + 14; sprites.push([x - r.left, y - r.top, rr, 0.16 * pres + 0.08 * bs.vol, ...COL.awareness]) }
      for (const f of fieldsAt(t)) {
        const c = centerOf(f.region); if (!c) continue
        const p = clamp((t - f.t) / Math.max(1, f.dur)), k = f.motion === 'fill' ? p : 1
        const [x, y, s] = front.toClient(...c.at)
        sprites.push([x - r.left, y - r.top, s * c.r * (1.1 + 0.15 * bs.vol), 0.22 * k, ...(COL[f.colour] || COL.awareness)])
        for (let i = 0; i < 18; i++) { const an = hash(i) * 6.283 + t * 0.15 * (hash(i + 2) - 0.5), rad = s * c.r * 0.8 * Math.sqrt(hash(i + 7)); sprites.push([x - r.left + Math.cos(an) * rad, y - r.top + Math.sin(an) * rad, 2 + 2 * hash(i + 4), 0.35 * k * (0.6 + 0.4 * Math.sin(t * 1.3 + i)), ...(COL[f.colour] || COL.awareness)]) }
      }
      for (const h of st.highlights) {
        const c = centerOf(h.id); if (!c) continue
        const [x, y, s] = front.toClient(...c.at), life = clamp((h.until - nowS) / 0.8) * clamp((nowS - h.from) / 0.5)
        sprites.push([x - r.left, y - r.top, s * Math.max(0.18, c.r) * (1 + 0.18 * Math.sin(nowS * 3)), 0.5 * life, ...(COL[h.colour] || COL.awareness)])
      }
    }
    st.highlights = st.highlights.filter(h => h.until > nowS)
    glow.draw(sprites)
    // rest timer: only in the flat line
    const silent = clock.silence() && ws.flat
    restEl.hidden = !silent
    if (silent) restT.textContent = fmt(st.rested_override ?? clock.rested_s)
    // caption fades a moment after the voice stops: the silence is quiet on screen too
    const s = clock.segment()
    if (s && t > s.speak_end + 1.8 && !st.caption.live) capEl.classList.add('pl-out'); else capEl.classList.remove('pl-out')
    q('.pl-seg').textContent = s ? `${s.n} / ${s.of}` : ''
  }

  // ---------- loop ----------
  let raf = 0
  function loop(ts) {
    raf = requestAnimationFrame(loop)
    const dt = st.lastFrame ? Math.min(0.25, (ts - st.lastFrame) / 1000) : 1 / 60   // real time, bounded for tab switches; st.lastFrame = ts
    if (clock.playing) handle(clock.tick(dt))
    if (st.replayUntil != null && clock.t >= st.replayUntil) { clock.setRate(1); if (audio) audio.playbackRate = 1; st.replayUntil = null }
    draw(clock.t, ts / 1000)
    syncUI()
  }
  function syncUI() {
    q('.pl-pp').innerHTML = clock.playing ? ICON.pause : ICON.play
    q('.pl-pp').setAttribute('aria-label', clock.playing ? 'Pause' : 'Play')
    q('.pl-voice').setAttribute('aria-pressed', String(st.voice && !st.muted))
    el.classList.toggle('pl-playing', clock.playing); el.classList.toggle('pl-waiting', !!clock.waiting)
  }
  function renderDots() {
    const S = clock.segments, cur = clock.segment()
    q('.pl-dots').innerHTML = S.map(s => `<i class="${cur && s.n < cur.n ? 'done' : cur && s.id === cur.id ? 'on' : ''}"></i>`).join('')
  }

  // ---------- overlays ----------
  function renderGate() {
    const p = st.practice, g = q('.pl-gate')
    const ci = (p.contraindications || []).map(c => `<li>${esc(c)}</li>`).join('')
    g.hidden = false
    g.innerHTML = `<div class="pl-card"><p class="pl-kicker">A play · ${esc(verses(p))}</p><h2>${esc(p.name)}</h2>
      <p class="pl-summary">${esc(p.summary)}</p>
      <details class="pl-before"><summary>Before you begin</summary><ul>${ci}<li>Stop any time: Space, or tap pause.</li></ul></details>
      <div class="pl-row"><button class="pl-btn pl-primary pl-begin">Play · ${fmt(tl.total_s)}</button></div></div>`
    g.querySelector('.pl-begin').onclick = () => api.play()
  }
  const verses = p => { const m = (p.sources || [])[0]?.cite?.match(/vv?\.\s*[\d–-]+/); return m ? `Vijñāna Bhairava ${m[0]}` : (p.traditions || []).join(' · ') }
  function renderInfo() {
    const p = st.practice, m = p.meta || {}, v = media?.voice
    q('.pl-info').innerHTML = `<div class="pl-card pl-infocard"><button class="pl-btn pl-icon pl-close" aria-label="Close">×</button>
      <p class="pl-kicker">About this play</p><h3>${esc(p.name)}</h3>
      <ol class="pl-steps">${(p.steps || []).map(s => `<li>${esc(s.text)}</li>`).join('')}</ol>
      <p class="pl-kicker">Sources</p><ul class="pl-src">${(p.sources || []).map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.cite)}</a>${s.note ? ` <span class="pl-muted">(${esc(s.note)})</span>` : ''}</li>`).join('')}</ul>
      <p class="pl-muted">${esc(m.confidence_note || '')}</p>
      ${v ? `<p class="pl-muted">Voice: ${esc(v.title)}, ${esc(v.model)} (${esc(v.licence || '')}). Not a teacher's voice.</p>` : ''}
      <p class="pl-muted">Visuals show where attention goes; they are not anatomy.</p></div>`
    q('.pl-info .pl-close').onclick = () => { q('.pl-info').hidden = true }
  }
  function onEnded(ev) {
    stopAudio(); q('.pl-back').hidden = true; bells.ring('bell-end', st.muted)
    const rested = Math.round(st.rested_override ?? ev.rested_s)
    try {
      const k = 'satsang.practice_log', L = JSON.parse(localStorage.getItem(k) || '[]')
      L.push({ practice: st.practice.id, at: new Date().toISOString(), seconds: Math.round(clock.t), rested_s: rested, source: 'player', reason: ev.reason })
      localStorage.setItem(k, JSON.stringify(L.slice(-500)))
    } catch { }
    const g = q('.pl-gate'); g.hidden = false
    g.innerHTML = `<div class="pl-card pl-end"><p class="pl-kicker">${esc(st.practice.name)}</p>
      <h2>${rested >= 1 ? `You rested in the silence for ${rested} second${rested === 1 ? '' : 's'}.` : 'The silence is still here.'}</h2>
      <p class="pl-muted">Not a score. Just noticed. Play it again on another sound, any time today.</p>
      <div class="pl-row"><button class="pl-btn pl-primary pl-again2">Again</button><button class="pl-btn pl-done">Done</button></div></div>`
    g.querySelector('.pl-again2').onclick = () => { g.hidden = true; api.repeat_round(); api.play() }
    g.querySelector('.pl-done').onclick = () => { g.hidden = true }
    g.querySelector('.pl-again2').focus?.()
  }

  // ---------- helpers for commands ----------
  function findPhase(id, round) {
    const m = tl.tracks.markers.find(x => (x.kind === 'segment' && x.id === id) || (x.kind === 'stage' && x.stage === id))
    if (m) return { t: m.t, end: m.end ?? null, kind: m.kind }
    const B = tl.tracks.breath.filter(b => b.id === id && (round == null || b.round === round))
    if (B.length) return { t: B[0].t, end: B[0].t + B[0].dur, kind: 'breath' }
    return null
  }
  function currentPhaseId() { const s = clock.segment(); if (s) return s.id; const b = breathState(tl, clock.t); return b.seg?.id || null }
  function recompileKeep() {
    const s = clock.segment(), off = s ? clock.t - s.t : 0, id = s?.id, t = clock.t
    compileNow()
    const s2 = id ? tl.tracks.markers.find(m => m.kind === 'segment' && m.id === id) : null
    clock.setTimeline(tl, s2 ? s2.t + off : Math.min(t, tl.total_s))
    renderDots()
  }

  // ---------- API (player/API.md) ----------
  const api = {
    el,
    play() {
      q('.pl-gate').hidden = true; st.started = true; bells.resume()
      if (clock.ended) { clock.play(); } else clock.play()
      emit({ type: 'state', t: clock.t, playing: true }); el.focus?.(); return { ok: true }
    },
    pause() { clock.pause(); if (audio) audio.pause(); tts().cancel?.(); emit({ type: 'state', t: clock.t, playing: false }); return { ok: true } },
    resume() {
      if (clock.ended) return { ok: false, error: 'ended' }
      q('.pl-gate').hidden = true
      // a gated line that was cut resumes from the line's start (seek re-arms the segment)
      const s = clock.segment()
      if (s && clock.waiting === s.id && audio?.paused) { clock.seek(s.t) }
      clock.play(); emit({ type: 'state', t: clock.t, playing: true }); return { ok: true }
    },
    seek_phase(id, o = {}) {
      const f = findPhase(id, o.round); if (!f) return { ok: false, error: `unknown phase ${id}` }
      stopAudio(); clock.seek(f.t); setCaption('', f.t); renderDots(); return { ok: true, t: f.t }
    },
    replay_phase(id, o = {}) {
      id = id || currentPhaseId(); const f = findPhase(id, o.round); if (!f) return { ok: false, error: `unknown phase ${id}` }
      const slow = clamp(o.slow ?? 0.75, 0.5, 1)
      stopAudio(); clock.seek(f.t); clock.setRate(slow); st.replayUntil = f.end ?? f.t + 10
      if (!clock.playing) clock.play()
      return { ok: true, t: f.t, slow }
    },
    repeat_round() {
      const R = tl.tracks.markers.filter(m => m.kind === 'round'), cur = [...R].reverse().find(m => m.t <= clock.t + 1e-6) || R[0]
      const t = R.length && R[0].of > 1 ? cur.t : (R[0]?.t ?? 0)
      stopAudio(); clock.reset(); clock.seek(t); renderDots(); return { ok: true, t }
    },
    set_level(level) {
      if (!LEVELS.includes(level)) return { ok: false, error: `level is one of ${LEVELS.join(', ')}` }
      st.level = level; recompileKeep(); return { ok: true, level, total_s: tl.total_s }
    },
    extend_pause(seconds, o = {}) {
      const s = o.segment ? clock.segments.find(x => x.id === o.segment) : clock.segment()
      if (!s) return { ok: false, error: 'no segment' }
      const cur = (s.end - s.speak_end), add = Math.max(2 - cur, +seconds || 0)
      st.padj[s.id] = (st.padj[s.id] || 0) + add; recompileKeep()
      return { ok: true, segment: s.id, pause_s: Math.round((cur + add) * 10) / 10 }
    },
    highlight_locus(id, o = {}) {
      if (!centerOf(id)) return { ok: false, error: `unknown locus ${id}` }
      const now = performance.now() / 1000; st.highlights.push({ id, colour: o.colour || 'awareness', from: now, until: now + (o.seconds ?? 6) })
      return { ok: true }
    },
    show_explainer(o = {}) {
      const x = q('.pl-explainer')
      x.innerHTML = `<div class="pl-card"><button class="pl-btn pl-icon pl-close" aria-label="Close">×</button>${o.title ? `<h3>${esc(o.title)}</h3>` : ''}<p>${esc(o.text || '')}</p></div>`
      x.hidden = false
      const wasPlaying = clock.playing
      if (o.pause !== false && wasPlaying) api.pause()
      if (o.locus) api.highlight_locus(o.locus, { seconds: o.seconds ?? 8 })
      const close = () => { if (x.hidden) return; x.hidden = true; if (o.pause !== false && wasPlaying) api.resume() }
      x.querySelector('.pl-close').onclick = close
      if (o.seconds) setTimeout(close, o.seconds * 1000)
      return { ok: true }
    },
    speak(text, o = {}) {
      if (!text) return { ok: false, error: 'no text' }
      if (o.interrupt) stopAudio()
      const gate = o.gate !== false
      if (gate) clock.holdLive(true)
      setCaption(text, clock.t, true); emit({ type: 'speech_started', t: clock.t, id: null, text, live: true })
      const finish = () => { if (gate) clock.holdLive(false); st.caption.live = false; emit({ type: 'speech_ended', t: clock.t, id: null, live: true }) }
      if (st.voice && !st.muted) Promise.resolve(tts().speak(text)).catch(() => { }).finally(finish)
      else setTimeout(finish, Math.min(8000, 400 * text.split(/\s+/).length))
      return { ok: true, gate }
    },
    end(o = {}) { handle(clock.end(o.reason || 'user')); return { ok: true } },
    dispatch({ cmd, args } = {}) {
      const f = COMMANDS.includes(cmd) && api[cmd]
      if (!f) return { ok: false, error: `unknown cmd ${cmd}` }
      const r = Array.isArray(args) ? f(...args) : args === undefined ? f() : f(args)
      emit({ type: 'command', t: clock.t, cmd, args, ok: !!r?.ok }); return r
    },
    on(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); return () => api.off(type, fn) },
    off(type, fn) { listeners.get(type)?.delete(fn) },
    get state() {
      const s = clock.segment(), b = breathState(tl, clock.t)
      return { t: clock.t, total: tl.total_s, playing: clock.playing, waiting: !!clock.waiting, ended: clock.ended, rate: clock.rate, level: st.level,
        segment: s ? { id: s.id, n: s.n, of: s.of, part: clock.t >= s.speak_end ? 'pause' : 'speak', t0: s.t, speak_end: s.speak_end, end: s.end } : null,
        phase: b.seg ? { id: b.seg.id, phase: b.phase, sub: b.sub, round: b.seg.round } : null,
        silence: clock.silence(), rested_s: Math.round(clock.rested_s), view: viewMode() }
    },
    get timeline() { return tl },
    // deterministic still at t (screenshots, tests): no audio, envelope from the manifest
    renderAt(t, o = {}) {
      stopAudio(); clock.pause(); q('.pl-gate').hidden = true
      clock.seek(t); handle(clock.tick(0).filter(e => e.type !== 'speech_started' && e.type !== 'audio'))
      const s = clock.segment(); if (s?.voice) setCaption(s.voice.text, t)
      if (o.rested != null) st.rested_override = o.rested
      renderDots(); draw(t, performance.now() / 1000); syncUI()
    },
    showEnd(rested) { st.rested_override = rested; onEnded({ reason: 'still', rested_s: rested }) },
    set(o) {
      if ('voice' in o) st.voice = !!o.voice; if ('muted' in o) st.muted = !!o.muted
      clock.setGate(st.voice && !st.muted); if (!st.voice || st.muted) stopAudio()
      if ('view' in o) { st.view = o.view; layoutViews() }
    },
    destroy() { cancelAnimationFrame(raf); stopAudio(); window.removeEventListener('keydown', onKey); glow.destroy?.(); el.remove() },
  }
  const COMMANDS = ['play', 'pause', 'resume', 'seek_phase', 'replay_phase', 'repeat_round', 'set_level', 'extend_pause', 'highlight_locus', 'show_explainer', 'speak', 'end']

  function layoutViews() {
    const v = viewMode()
    q('.pl-front').hidden = v === 'side'; q('.pl-side').hidden = v === 'front'
    el.dataset.view = v
  }

  // ---------- controls ----------
  q('.pl-pp').onclick = () => clock.playing ? api.pause() : (st.started && !clock.ended ? api.resume() : api.play())
  q('.pl-again').onclick = () => { api.repeat_round(); api.play() }
  q('.pl-voice').onclick = () => api.set({ voice: !(st.voice && !st.muted), muted: false })
  q('.pl-info-btn').onclick = () => { const i = q('.pl-info'); i.hidden = !i.hidden; if (!i.hidden && clock.playing) api.pause() }
  q('.pl-back').onclick = () => api.end({ reason: 'back' })
  stage.addEventListener('click', () => { if (clock.holdOpen) api.end({ reason: 'back' }) })
  const onKey = e => {
    if (e.target.closest?.('input,textarea,select')) return
    if (e.key === ' ' || e.key === 'k') { if (e.target.tagName === 'BUTTON') return; e.preventDefault(); q('.pl-pp').click() }
    else if (e.key === 'Escape') { if (!q('.pl-info').hidden) q('.pl-info').hidden = true; else api.pause() }
    else if (e.key === 'Enter' && clock.holdOpen) api.end({ reason: 'back' })
    else if (e.key === 'v') q('.pl-voice').click()
    else if (e.key === 'i') q('.pl-info-btn').click()
  }
  window.addEventListener('keydown', onKey)
  q('.pl-name').textContent = st.practice.name
  layoutViews(); renderGate(); renderInfo(); renderDots()
  front.setLoci((show().loci || []).map(id => ({ id, at: grammar.loci[id]?.at })).filter(l => l.at))
  raf = requestAnimationFrame(loop)
  if (options.autoplay) api.play()
  return api
}
