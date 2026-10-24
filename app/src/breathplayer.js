// "Practise with the body": the live breath engine (engine/breath: body.js + breath.js, the white page of light) as an
// immersive overlay over the dark site, parameterised per practice from practices[].body (wisegraph/practice-body.json):
// locus (where the light gathers), pace {inn, out} and lead. Natural breath only: the engine has no holds and no retention.
// The practice's steps come as one quiet line at a time, then fade. Built separately (site/breathplayer.js, loaded on demand
// from collections.js) so the main bundle does not carry WebGL.
import { createBreath } from '../../engine/breath/breath.js'
import { createBody, LOCUS } from '../../engine/breath/body.js'

const CSS = `
.bp{position:fixed;inset:0;z-index:9999;background:#fff;overflow:hidden;overscroll-behavior:none;touch-action:none;-webkit-user-select:none;user-select:none;
  font:300 15px/1.4 "Cormorant Garamond",Georgia,serif;color:#8a7a62;opacity:0;transition:opacity 1.2s ease}
.bp.on{opacity:1}
.bp canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.bp-nm{position:absolute;top:calc(18px + env(safe-area-inset-top));left:0;right:0;text-align:center;letter-spacing:.06em;font-size:15px;opacity:.55;pointer-events:none;padding:0 70px}
.bp-line{position:absolute;left:0;right:0;bottom:calc(30px + env(safe-area-inset-bottom));text-align:center;letter-spacing:.03em;font-size:19px;font-style:italic;
  opacity:0;transition:opacity 2.6s ease;pointer-events:none;padding:0 28px;max-width:760px;margin:0 auto;color:#7d6c52}
.bp-line.on{opacity:.8}
@media (max-width:520px){.bp-line{font-size:16px}.bp-nm{font-size:13px;top:calc(62px + env(safe-area-inset-top));padding:0 24px}}
.bp-ui{position:absolute;top:calc(10px + env(safe-area-inset-top));right:calc(10px + env(safe-area-inset-right));display:flex;gap:4px}
.bp-ui button,.bp-x{width:42px;height:42px;border-radius:50%;border:0;background:transparent;padding:0;cursor:pointer;color:#b8a888;opacity:.6;
  transition:opacity .4s,color .4s;display:grid;place-items:center;-webkit-tap-highlight-color:transparent}
.bp-ui button:hover,.bp-ui button:focus-visible,.bp-x:hover,.bp-x:focus-visible{opacity:1;outline:none}
.bp-ui button[aria-pressed="true"]{color:#b08a3e;opacity:.95}
.bp svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
.bp-x{position:absolute;top:calc(10px + env(safe-area-inset-top));left:calc(10px + env(safe-area-inset-left))}
.bp-ring{position:absolute;left:50%;bottom:calc(8px + env(safe-area-inset-bottom));width:120px;height:2px;margin-left:-60px;background:rgba(176,138,62,.12);border-radius:2px;overflow:hidden;pointer-events:none}
.bp-ring i{display:block;height:100%;width:0;background:rgba(176,138,62,.45)}
`

const ICON = {
  mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"/></svg>',
  snd: '<svg viewBox="0 0 24 24"><path d="M4 12c2-4 4-4 6 0s4 4 6 0 3-3 4-1"/></svg>',
  end: '<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="1.5"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
}

export function supported() {
  try { return !!document.createElement('canvas').getContext('webgl2') } catch { return false }
}

// cue times for the steps over the sit: the first line after a short settle, then each step at its share of the time
export function cuesFor(steps, totalSec) {
  const S = (steps || []).filter((s) => s && s.text)
  if (!S.length) return []
  const sum = S.reduce((a, s) => a + (s.seconds || 60), 0), scale = Math.max(0, totalSec - 8) / Math.max(1, sum)
  let acc = 8
  return S.map((s) => { const at = acc; acc += (s.seconds || 60) * scale; return { at, text: s.text } })
}

/**
 * open({ name, steps, minutes, body: {locus, pace:{inn,out}, lead}, reduce, onEnd({full, seconds}) }) -> { close, state }
 * Throws when WebGL2 is missing (the caller falls back to the timer).
 */
export function open({ name = '', steps = [], minutes = 10, body = {}, reduce = false, onEnd = () => {} } = {}) {
  if (!document.getElementById('bp-css')) { const st = document.createElement('style'); st.id = 'bp-css'; st.textContent = CSS; document.head.appendChild(st) }
  const ov = document.createElement('div'); ov.className = 'bp'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', name + ': practise with the body')
  ov.innerHTML = `<canvas aria-label="A seated body made of light, breathing. Hold anywhere to breathe in, release to breathe out."></canvas>
    <p class="bp-nm"></p><button type="button" class="bp-x" aria-label="Back to the practice" title="Back">${ICON.x}</button>
    <div class="bp-ui"><button type="button" data-k="mic" aria-pressed="false" aria-label="Follow my breath with the microphone" title="Follow my breath (microphone)">${ICON.mic}</button>
      <button type="button" data-k="snd" aria-pressed="false" aria-label="Breath sound" title="Breath sound">${ICON.snd}</button>
      <button type="button" data-k="end" aria-label="End the sit" title="End">${ICON.end}</button></div>
    <div class="bp-line" role="status" aria-live="polite"></div><div class="bp-ring" aria-hidden="true"><i></i></div>`
  ov.querySelector('.bp-nm').textContent = name
  const canvas = ov.querySelector('canvas'), line = ov.querySelector('.bp-line'), bar = ov.querySelector('.bp-ring i')
  document.body.appendChild(ov)
  const small = Math.min(innerWidth, innerHeight) < 600 || (navigator.hardwareConcurrency || 8) <= 2
  const locus = LOCUS[body.locus] ? body.locus : 'none'
  let gl
  try { gl = createBody(canvas, { small, reduce, locus }) } catch (e) { gl = null; console.error(e) }
  if (!gl) { ov.remove(); throw new Error('webgl2') }

  // sound: band-passed noise per phase (as on /breath/), off until asked for
  let ac = null, soundOn = false, noise = null, cur = null
  const audio = () => { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac }
  function breathSound(phase, dur) {
    if (cur) { try { const t = ac.currentTime; cur.g.gain.cancelScheduledValues(t); cur.g.gain.setTargetAtTime(0.0001, t, 0.12); cur.s.stop(t + 0.6) } catch {} cur = null }
    if (!soundOn || !ac || breath.state.micOn) return
    dur = Math.max(1, Math.min(dur, 12))
    if (!noise) { noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1 }
    const s = ac.createBufferSource(); s.buffer = noise; s.loop = true
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = phase === 'in' ? 620 : 400; f.Q.value = 0.8
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800
    const g = ac.createGain(), t = ac.currentTime, peak = breath.state.rest ? 0.035 : 0.07
    g.gain.setValueAtTime(0.0001, t)
    if (phase === 'in') { g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + dur) }
    else { g.gain.exponentialRampToValueAtTime(peak * 0.85, t + Math.min(0.5, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur) }
    s.connect(f); f.connect(lp); lp.connect(g); g.connect(ac.destination); s.start(t); s.stop(t + dur + 0.1)
    cur = { s, g }
  }
  function bell(vol = 0.4) { try { audio(); const t = ac.currentTime; for (const [fq, g] of [[528, 1], [1056, 0.35], [1584, 0.12]]) { const o = ac.createOscillator(), a = ac.createGain(); o.type = 'sine'; o.frequency.value = fq; a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(vol * g * 0.3, t + 0.02); a.gain.exponentialRampToValueAtTime(0.0001, t + 4.5); o.connect(a).connect(ac.destination); o.start(t); o.stop(t + 4.6) } } catch {} }

  const pace = body.pace && body.pace.inn && body.pace.out ? body.pace : null
  const breath = createBreath({ onPhase: (p, dur) => breathSound(p, dur), pace, lead: body.lead !== false })
  let lineT = 0
  const say = (text, ms = 9000) => { line.textContent = text; line.classList.add('on'); clearTimeout(lineT); lineT = setTimeout(() => line.classList.remove('on'), ms) }

  const total = Math.max(1, minutes) * 60, cues = cuesFor(steps, total)
  let ci = -1, el = 0, ended = false, raf = 0, last = performance.now(), tStart = last, wake = null
  try { navigator.wakeLock?.request('screen').then((w) => (wake = w)).catch(() => {}) } catch {}
  const onDown = (e) => { if (e.target.closest('.bp-ui,.bp-x')) return; e.preventDefault(); if (soundOn) audio(); breath.press() }
  const onUp = (e) => { if (e.target?.closest?.('.bp-ui,.bp-x')) return; breath.release() }
  const onKey = (e) => { if (e.repeat) return; if (e.code === 'Space') { e.preventDefault(); e.type === 'keydown' ? breath.press() : breath.release() } if (e.type === 'keydown' && e.key === 'Escape') finish(false) }
  ov.addEventListener('pointerdown', onDown, { passive: false }); ov.addEventListener('pointerup', onUp); ov.addEventListener('pointercancel', onUp)
  ov.addEventListener('contextmenu', (e) => e.preventDefault())
  addEventListener('keydown', onKey); addEventListener('keyup', onKey)
  const onHash = () => close()
  addEventListener('hashchange', onHash)
  const btn = (k) => ov.querySelector(`[data-k="${k}"]`)
  btn('snd').onclick = () => { soundOn = !soundOn; btn('snd').setAttribute('aria-pressed', soundOn); if (soundOn) audio(); else breathSound('in', 0) }
  btn('mic').onclick = async () => {
    if (breath.state.micOn) { breath.micStop(); btn('mic').setAttribute('aria-pressed', 'false'); return }
    try { await breath.micStart(audio()); btn('mic').setAttribute('aria-pressed', 'true'); breathSound('in', 0); say('breathe as you are · the light follows', 5500) }
    catch { say('the microphone was not allowed · hold anywhere to breathe in', 6000) }
  }
  btn('end').onclick = () => finish(false)
  ov.querySelector('.bp-x').onclick = () => finish(false)

  function loop(now) {
    if (ended) return
    const dt = Math.min(0.25, (now - last) / 1000); last = now; el = (now - tStart) / 1000   // wall clock: the sit is real time even at a low frame rate
    const s = breath.tick(dt, now / 1000)
    gl.frame(dt, s)
    bar.style.width = (100 * Math.min(1, el / total)).toFixed(2) + '%'
    while (ci + 1 < cues.length && el >= cues[ci + 1].at) { ci++; say(cues[ci].text, Math.min(14000, Math.max(7000, cues[ci].text.length * 110))) }
    if (el >= total) { finish(true); return }
    raf = requestAnimationFrame(loop)
  }
  requestAnimationFrame(() => ov.classList.add('on'))
  raf = requestAnimationFrame(loop)
  setTimeout(() => { if (!ended && ci < 0) say('hold to breathe in · let go to breathe out', 5200) }, 1400)

  function finish(full) {
    if (ended) return
    ended = true; cancelAnimationFrame(raf)
    if (full) bell(0.5)
    breath.stop()
    const seconds = Math.round(el)
    // let the body dim to rest for a breath before handing back
    let t1 = performance.now()
    const rest = (now) => { const dt = Math.min(0.25, (now - t1) / 1000); t1 = now; try { gl.frame(dt, breath.tick(dt, now / 1000)) } catch {} if (ov.isConnected && performance.now() - t0 < 1600) requestAnimationFrame(rest) }
    const t0 = performance.now(); requestAnimationFrame(rest)
    setTimeout(() => { close(); onEnd({ full, seconds }) }, full ? 1600 : 500)
  }
  function close() {
    ended = true; cancelAnimationFrame(raf); clearTimeout(lineT)
    try { breath.micStop() } catch {}
    try { breathSound('in', 0); ac?.close?.() } catch {}
    try { wake?.release?.() } catch {} wake = null
    removeEventListener('keydown', onKey); removeEventListener('keyup', onKey); removeEventListener('hashchange', onHash)
    try { const x = canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context'); x?.loseContext() } catch {}
    ov.remove()
  }
  const api = { close, finish, breath, body: gl, get elapsed() { return el }, get cue() { return ci }, cues, locus }
  window.__bp = api   // test hook (headless screenshots / player tests)
  return api
}
