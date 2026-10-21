// Satsang body + breath layer · the breath model (pure, no DOM; node-testable).
// Turns a compiled timeline (compile.mjs) and a time t into a body state that any renderer can draw:
// lung volume, airflow, the three-part breath (belly / ribs / collarbones), shoulders, diaphragm, nostril, retention stillness.
// Every value is an analytic function of (timeline, t), so seeking is exact and the voice clock can drive it.
//
// The three-part (yogic) breath is modelled as staged recruitment over lung volume v ∈ [0,1]:
//   belly  = smooth(0, .45, v)     fills first, empties last   (diaphragm descends, abdomen moves forward)
//   ribs   = smooth(.25, .85, v)   lateral and forward rib expansion
//   clav   = smooth(.7, 1, v)      the top of the lungs, collarbones lift slightly
// Because each part is a function of v alone, the exhale releases in reverse order (clav → ribs → belly) for free.
// Styles re-weight the parts: full (default) · abdominal · thoracic · clavicular · kapalabhati (abdominal snaps) · natural.

export const BREATH_MODEL = 'satsang-breath/1'
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x)
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t) }
const ease = p => 0.5 - 0.5 * Math.cos(Math.PI * clamp(p))
const outQuad = p => 1 - (1 - p) * (1 - p)

export const STYLES = {
  full: { belly: 1, ribs: 1, clav: 0.8, shoulder: 0.25, diaphragm: 1 },
  abdominal: { belly: 1.15, ribs: 0.25, clav: 0, shoulder: 0, diaphragm: 1.1 },
  thoracic: { belly: 0.35, ribs: 1.2, clav: 0.4, shoulder: 0.2, diaphragm: 0.5 },
  clavicular: { belly: 0.2, ribs: 0.6, clav: 1.3, shoulder: 1, diaphragm: 0.3 },
  kapalabhati: { belly: 1.25, ribs: 0.15, clav: 0, shoulder: 0, diaphragm: 1.2 },
  natural: { belly: 0.8, ribs: 0.45, clav: 0.1, shoulder: 0.05, diaphragm: 0.8 },
}
const HOLD = new Set(['hold_in', 'hold_out'])

/** Which breath style a practice uses: script.breath_style, else inferred from its strokes/method. */
export function styleOf(tl, practice) {
  const s = practice?.script?.breath_style || tl?.show?.breath_style
  if (s && STYLES[s]) return s
  if (tl?.tracks?.breath?.some(b => b.stroke)) return 'kapalabhati'
  const B = tl?.tracks?.breath || []
  const paced = B.filter(b => b.phase === 'in' || b.phase === 'out').length
  return paced ? 'full' : 'natural'
}

function findSeg(B, t) {
  let lo = 0, hi = B.length - 1, k = -1
  while (lo <= hi) { const m = (lo + hi) >> 1; if (B[m].t <= t) { k = m; lo = m + 1 } else hi = m - 1 }
  return k
}

// volume at t, the same curve the orb uses (inOutSine per phase, outQuad for strokes), plus a quiet tidal breath in rest phases
function volAt(B, t) {
  const k = findSeg(B, t)
  if (k < 0) return { k, seg: null, p: 0, vol: 0.2 }
  const seg = B[k], p = clamp((t - seg.t) / Math.max(1e-6, seg.dur))
  const e = seg.stroke ? outQuad(p) : ease(p)
  let vol = seg.vol0 + (seg.vol1 - seg.vol0) * e
  if (seg.phase === 'rest') vol = 0.32 + 0.16 * Math.sin((t - seg.t) * (2 * Math.PI / 10.5) - Math.PI / 2) // ~5.7 breaths/min, unforced
  return { k, seg, p, vol }
}

/**
 * Body state at time t.
 * @param {object} tl  compiled timeline
 * @param {number} t   timeline seconds
 * @param {object} [o] { style, practice }
 */
export function breathState(tl, t, o = {}) {
  const B = tl?.tracks?.breath || []
  const style = o.style || styleOf(tl, o.practice)
  const W = STYLES[style] || STYLES.full
  const a = volAt(B, t), b = volAt(B, t + 0.04)
  const seg = a.seg, phase = seg ? seg.phase : 'rest'
  const v = clamp(a.vol)
  const flow = (b.vol - a.vol) / 0.04                // volume per second, + = inhaling
  // retention stillness: eases in over the first 0.8 s of a hold, out over 0.5 s after it
  let still = 0
  if (seg && HOLD.has(phase)) still = smooth(0, 0.8, t - seg.t)
  else if (a.k > 0 && HOLD.has(B[a.k - 1].phase)) still = 1 - smooth(0, 0.5, t - seg.t)
  const st = seg?.stroke ? 'kapalabhati' : style
  const w = STYLES[st] || W
  const belly = clamp(smooth(0, 0.45, v) * w.belly, 0, 1.25)
  const ribs = clamp(smooth(0.25, 0.85, v) * w.ribs, 0, 1.2)
  const clav = clamp(smooth(0.7, 1, v) * w.clav, 0, 1.3)
  return {
    model: BREATH_MODEL, style: st, phase, sub: seg?.sub || null, nostril: seg?.nostril || null,
    p: a.p, vol: v, flow, inhaling: flow > 0.02, exhaling: flow < -0.02,
    belly, ribs, clav,
    shoulder: clav * w.shoulder,                       // healthy breath barely lifts the shoulders; clavicular style does
    diaphragm: clamp(v * w.diaphragm, 0, 1.15),        // 0 = dome up (empty), 1 = flattened (full)
    still, hold: HOLD.has(phase),
    stroke: seg?.stroke || 0, strokes: seg?.strokes || 0,
    seg, k: a.k,
  }
}

/** Phase boundaries crossed in (t0, t1]: breath_in / breath_out / hold / rest events for the bus. */
export function breathEvents(tl, t0, t1) {
  const out = [], B = tl?.tracks?.breath || []
  if (t1 <= t0) return out
  for (let i = Math.max(0, findSeg(B, t0)); i < B.length; i++) {
    const s = B[i]; if (s.t > t1) break
    if (s.t > t0 && s.t <= t1) {
      const ph = s.phase === 'natural' ? s.sub : s.phase
      const kind = ph === 'in' ? 'breath_in' : ph === 'out' ? 'breath_out' : HOLD.has(ph) ? 'hold_started' : 'rest_started'
      out.push({ type: kind, t: s.t, dur: s.dur, phase: s.phase, nostril: s.nostril || null, round: s.round || 0 })
    }
  }
  return out
}
