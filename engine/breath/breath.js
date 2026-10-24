/* Breath for /breath/: one state {level 0..1, vel, phase, source, env} from three sources.
   pace  - idle pacer, natural ~5.9 breaths/min (4.2 s in, 6.0 s out), smooth turns, no holds.
   touch - press = inhale, release = exhale; the body mirrors the hand; when the hand rests, the pacer carries on
           at the rhythm the hand showed, then leads it gently slower.
   mic   - opt-in; the envelope of the breath sound (a proxy, not a measurement) drives the light directly, the rhythm
           is read from it, the pacer phase-locks to it and leads it gently slower.
   Leading (after deitybody's locked decision TA 4.91): lengthen a little every few cycles, exhale first, never a forced
   ratio, never a hold or retention, never past ~5.5 breaths/min, and back off when the breather doesn't follow. */

const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
const IDLE = { inn: 4.2, out: 6.0 }
const LEAD = { every: 3, step: 0.04, maxCycle: 11, maxRatio: 1.6 }   // 4% per 3 cycles, cycle <= 11 s (~5.5/min), out <= 1.6 x in

export function createBreath({ onPhase = () => {}, pace = null, lead: leadOn = null } = {}) {
  // pace {inn, out} (seconds) and lead (bool) are optional, for a practice player (app/src/breathplayer.js); without them the
  // page behaves exactly as before. lead: true = lead gently from the first cycle; false = never lead (only follow); null = old.
  const P0 = pace ? { inn: clamp(+pace.inn || IDLE.inn, 2, 6.5), out: clamp(+pace.out || IDLE.out, 2.5, 9.5) } : IDLE
  const s = { level: 0.15, vel: 0, phase: 'in', source: 'pace', env: 0, inn: P0.inn, out: P0.out, adapted: leadOn === true,
    micOn: false, micPeriod: 0, micConf: 0, rest: false, cycles: 0 }
  let pt = 0                  // time into the current pacer phase
  let lastLevel = s.level
  // touch
  let pressed = false, pressAt = 0, releaseAt = 0, now = 0
  const ins = [], outs = []
  // mic
  let ac = null, stream = null, an = null, buf = null, floor = 0.002, peak = 0.02, envFast = 0, burst = false
  let lastOnset = -99, lastExhaleOnset = -99, lastSoundAt = 0
  const hist = new Float32Array(800); let hi = 0, histN = 0, histAcc = 0, histT = 0   // envelope at 20 Hz, 40 s
  let lastAuto = 0, forced = null

  function startPhase(p, from) {          // enter a pacer phase continuing from the current level
    s.phase = p
    const L = clamp(from, 0, 1)
    pt = p === 'in' ? s.inn * Math.acos(clamp(1 - 2 * L, -1, 1)) / Math.PI
                    : s.out * Math.acos(clamp(2 * L - 1, -1, 1)) / Math.PI
    onPhase(p, p === 'in' ? s.inn - pt : s.out - pt, s.source)
  }
  function lead() {                       // called once per completed pacer cycle
    s.cycles++
    if (leadOn === false || !s.adapted || s.cycles % LEAD.every) return
    if (s.source === 'mic' && s.micPeriod && s.micConf > 0.3) {
      const cyc = s.inn + s.out
      if (s.micPeriod < cyc * 0.85) {     // not following: ease back toward their own rhythm, no pressure
        const k = (cyc * 0.5 + s.micPeriod * 0.5) / cyc; s.inn *= k; s.out *= k; return
      }
      if (s.micPeriod < cyc * 0.93) return  // not caught up yet: wait for them
    }
    if (s.inn + s.out >= LEAD.maxCycle) return
    if (s.out < s.inn * LEAD.maxRatio) s.out *= 1 + LEAD.step   // exhale first
    else s.inn *= 1 + LEAD.step * 0.6
    const cyc = s.inn + s.out
    if (cyc > LEAD.maxCycle) { const k = LEAD.maxCycle / cyc; s.inn *= k; s.out *= k }
  }
  function adopt(inn, out) {               // take the breather's rhythm as the pacer's starting point
    s.inn = clamp(inn, 1.4, 6.5); s.out = clamp(out, 1.8, 9.5); s.adapted = true; s.cycles = 0
  }
  const avg = a => a.reduce((x, y) => x + y, 0) / a.length

  function press() {
    if (s.rest) s.rest = false
    pressed = true; pressAt = now
    if (s.source === 'touch' && s.phase === 'out' && releaseAt) { const d = now - releaseAt; if (d > 0.8 && d < 20) { outs.push(d); if (outs.length > 5) outs.shift() } }
    if (s.source !== 'mic') s.source = 'touch'
    s.phase = 'in'; onPhase('in', ins.length ? avg(ins) : s.inn, 'touch')
  }
  function release() {
    if (!pressed) return
    pressed = false; releaseAt = now
    const d = now - pressAt; if (d > 0.5 && d < 15) { ins.push(d); if (ins.length > 5) ins.shift() }
    if (s.source !== 'mic') s.source = 'touch'
    s.phase = 'out'; onPhase('out', outs.length ? avg(outs) : s.out, 'touch')
  }

  async function micStart(audioCtx) {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false } })
    ac = audioCtx
    const src = ac.createMediaStreamSource(stream), hp = ac.createBiquadFilter()
    hp.type = 'highpass'; hp.frequency.value = 160
    an = ac.createAnalyser(); an.fftSize = 1024; buf = new Float32Array(an.fftSize)
    src.connect(hp); hp.connect(an)
    s.micOn = true; s.source = 'mic'; s.rest = false; lastSoundAt = now; histN = 0; s.micPeriod = 0; s.micConf = 0
  }
  function micStop() {
    if (stream) stream.getTracks().forEach(t => t.stop())
    stream = null; an = null; s.micOn = false; s.env = 0; envFast = 0
    if (s.source === 'mic') s.source = 'pace'
  }
  function micRead(dt) {
    an.getFloatTimeDomainData(buf)
    let e = 0; for (let i = 0; i < buf.length; i++) e += buf[i] * buf[i]
    const rms = Math.sqrt(e / buf.length)
    floor = rms < floor ? floor + (rms - floor) * 0.2 : floor + (rms - floor) * 0.0012 * dt * 60   // noise floor: fast down, slow up
    peak = Math.max(peak * Math.exp(-dt / 25), rms, floor * 4)
    const n = clamp((rms - floor * 1.5) / (peak - floor * 1.5), 0, 1)
    envFast += (n - envFast) * (1 - Math.exp(-dt / (n > envFast ? 0.06 : 0.35)))
    s.env = envFast
    // bursts (breath sounds); the louder, assumed exhale, onset phase-locks the pacer
    if (!burst && envFast > 0.3) { burst = true; onset() } else if (burst && envFast < 0.16) burst = false
    if (envFast > 0.16) lastSoundAt = now
    histAcc += envFast; histT += dt; histN++
    if (histT >= 0.05) {                  // resample to a steady 20 Hz whatever the frame rate
      const v = histAcc / histN
      while (histT >= 0.05) { hist[hi] = v; hi = (hi + 1) % hist.length; histT -= 0.05; filled = Math.min(filled + 1, hist.length) }
      histAcc = 0; histN = 0
    }
    if (now - lastAuto > 2 && filled > 300) { lastAuto = now; period() }
  }
  let filled = 0
  function onset() {
    const P = s.micPeriod || 0
    lastOnset = now
    if (P && now - lastExhaleOnset < 0.6 * P) return
    lastExhaleOnset = now
    if (!P || s.micConf < 0.3) return
    // nudge the pacer so an exhale starts about now: 35% of the phase error per breath, never a jump
    const cyc = s.inn + s.out, pos = s.phase === 'in' ? pt : s.inn + pt       // position in cycle, exhale starts at s.inn
    let err = pos - s.inn; if (err > cyc / 2) err -= cyc; if (err < -cyc / 2) err += cyc
    const shift = clamp(-err * 0.35, -1, 1)
    let np = pos + shift; np = ((np % cyc) + cyc) % cyc
    if (np < s.inn) { if (s.phase !== 'in') { s.phase = 'in'; onPhase('in', s.inn - np, 'mic') } pt = np }
    else { if (s.phase !== 'out') { s.phase = 'out'; onPhase('out', cyc - np, 'mic') } pt = np - s.inn }
  }
  function period() {                     // autocorrelation of the last ~40 s, lags 3..16 s
    const N = filled, x = new Float32Array(N)
    let m = 0; for (let i = 0; i < N; i++) { x[i] = hist[(hi - N + i + hist.length) % hist.length]; m += x[i] }
    m /= N; let v = 0; for (let i = 0; i < N; i++) { x[i] -= m; v += x[i] * x[i] }
    if (v < 1e-4) { s.micConf *= 0.8; return }
    const r = lag => { let c = 0; for (let i = lag; i < N; i++) c += x[i] * x[i - lag]; return c / v * N / (N - lag) }
    const top = Math.min(320, Math.floor(N / 2)), rs = []
    let best = 0
    for (let lag = 60; lag <= top; lag += 2) { const c = r(lag); rs.push([lag, c]); if (c > best) best = c }
    if (best <= 0) return
    // the first strong peak is the cycle (later peaks are its multiples)...
    let bl = 0
    for (let i = 1; i < rs.length - 1; i++) if (rs[i][1] >= best * 0.85 && rs[i][1] >= rs[i - 1][1] && rs[i][1] >= rs[i + 1][1]) { bl = rs[i][0]; break }
    if (!bl) bl = rs.reduce((a, b) => b[1] > a[1] ? b : a)[0]
    // ...unless in and out breaths both sound: then the half-cycle peak is weaker than the full one
    if (bl * 2 <= top && r(bl * 2) > r(bl) * 1.1) bl *= 2
    const P = bl / 20
    s.micConf = clamp(r(bl), 0, 1)
    if (s.micConf < 0.25) return
    s.micPeriod = s.micPeriod ? s.micPeriod * 0.6 + P * 0.4 : P
    if (!s.adapted) adopt(s.micPeriod * 0.42, s.micPeriod * 0.58)
  }

  function tick(dt, t) {
    now = t
    dt = Math.min(dt, 0.25)
    if (an) micRead(dt)
    const prev = s.level
    if (forced) { s.level = forced.level; s.vel = forced.vel; s.phase = forced.vel >= 0 ? 'in' : 'out'; return s }
    if (s.source === 'touch' && (pressed || now - releaseAt < (outs.length ? avg(outs) : s.out) * 1.25 + 0.8)) {
      // mirror the hand: rise toward full while held, fall toward empty after release (first-order, like lungs)
      const tauIn = (ins.length ? avg(ins) : s.inn) / 2.6, tauOut = (outs.length ? avg(outs) : s.out) / 2.8
      s.level += ((pressed ? 1.02 : -0.02) - s.level) * (1 - Math.exp(-dt / (pressed ? tauIn : tauOut)))
      s.level = clamp(s.level, 0, 1)
    } else {
      if (s.source === 'touch') {         // the hand rested: carry on at its rhythm, then lead
        if (ins.length >= 2) adopt(avg(ins), outs.length ? avg(outs) : avg(ins) * 1.3)
        s.source = s.micOn ? 'mic' : 'pace'; startPhase('in', s.level)
      }
      const restK = s.rest ? 1.25 : 1
      pt += dt / restK
      if (s.phase === 'in') {
        s.level = 0.5 - 0.5 * Math.cos(Math.PI * clamp(pt / s.inn, 0, 1))
        if (pt >= s.inn) { pt -= s.inn; s.phase = 'out'; onPhase('out', s.out * restK, s.source) }
      } else {
        s.level = 0.5 + 0.5 * Math.cos(Math.PI * clamp(pt / s.out, 0, 1))
        if (pt >= s.out) { pt -= s.out; lead(); s.phase = 'in'; onPhase('in', s.inn * restK, s.source) }
      }
    }
    s.vel = dt > 0 ? (s.level - prev) / dt : 0
    s.quiet = s.micOn && now - lastSoundAt > 20
    return s
  }

  function stop() {                       // one tap: mic released, back to a slow, quiet rest pacer
    micStop(); pressed = false; s.rest = true; s.source = 'pace'; s.inn = P0.inn; s.out = P0.out; s.adapted = false
    startPhase(s.vel >= 0 ? 'in' : 'out', s.level)
  }

  return { state: s, tick, press, release, micStart, micStop, stop,
    force(level, vel) { forced = level == null ? null : { level, vel } } }
}
