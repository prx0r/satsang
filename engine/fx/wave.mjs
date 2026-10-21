// Satsang fx · the sound wave (grammar.primitives.wave). Pure, node-testable.
// "The sound is the doorway, the silence is the room" (VBT-DOCTRINE §5-6): a bright wave that answers the voice,
// travels inward toward the head, dims during each pause, and ends as a flat line that holds.
// waveAt(tl, t, energy) → the wave's state at t; wavePoints(state, t, n) → n points, x ∈ [-1, 1] (stage width), y ∈ [-1, 1] × amp.

export const WAVE = 'satsang-wave/1'
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x)
const ease = p => 0.5 - 0.5 * Math.cos(Math.PI * clamp(p))
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t) }
export const FLAT = 0.015

/**
 * @param {object} tl      compiled timeline
 * @param {number} t       timeline seconds
 * @param {number} energy  0-1 loudness of the voice right now (manifest env), 0 when silent
 */
export function waveAt(tl, t, energy = 0) {
  const W = (tl?.tracks?.visual || []).filter(v => v.prim === 'wave')
  let cue = null
  for (const w of W) { if (w.t <= t + 1e-9) cue = w; else break }
  if (!cue) return { on: false, amp: 0, base: 0, flat: true, hold: false, freq: 3, inward: 0, particles: 0, colour: 'silence', cue: null }
  const p = clamp((t - cue.t) / Math.max(1e-6, cue.dur))
  // a flat_hold cue reaches its end value early (by 55 % of the cue) and then holds the flat line
  const pe = cue.flat_hold ? Math.min(1, p / 0.55) : p
  const base = (cue.amp ?? 1) + ((cue.to ?? cue.amp ?? 1) - (cue.amp ?? 1)) * ease(pe)
  const vr = cue.voice_react ?? 0
  // the wave answers the voice: louder while it speaks, settling back in the silence after it
  const amp = base * (1 - 0.35 * vr + 0.7 * vr * clamp(energy))
  const flat = amp < FLAT
  return {
    on: true, amp: flat ? 0 : amp, base, p, flat, hold: !!cue.flat_hold, freq: cue.freq ?? 3,
    inward: (cue.inward || 0) * ease(Math.min(1, p * 1.6)), particles: (cue.particles || 0) * base,
    colour: cue.colour || 'silence', cue,
  }
}

/** n points across the stage. Crests travel from both edges toward the centre (the head): sound traced inward. */
export function wavePoints(ws, t, n = 160, o = {}) {
  const pts = new Array(n)
  const k = Math.PI * 2 * (ws.freq || 3), w = o.reduced ? 0 : 1.3       // reduced motion: the shape holds still, only the amplitude eases
  for (let i = 0; i < n; i++) {
    const x = -1 + (2 * i) / (n - 1), ax = Math.abs(x)
    const edge = 1 - smooth(0.82, 1, ax)                                // fades into the stage edges
    const focus = 1 - ws.inward * (1 - Math.exp(-((x / 0.38) ** 2)))      // traced inward: the outer wave quietens first
    const y = ws.amp * edge * focus * (Math.sin(k * ax + w * t * 2.2) * 0.72 + Math.sin(k * 2.31 * ax + w * t * 3.7 + 1.3) * 0.28)
    pts[i] = [x, y]
  }
  return pts
}

/** Where a particle riding the wave is: u ∈ [0, 1) from the edge (0) to the centre (1); side ±1. */
export function waveParticle(ws, t, u, side, o = {}) {
  const x = side * (1 - u) * 0.98, ax = Math.abs(x), k = Math.PI * 2 * (ws.freq || 3), w = o.reduced ? 0 : 1.3
  const edge = 1 - smooth(0.82, 1, ax), focus = 1 - ws.inward * (1 - Math.exp(-((x / 0.38) ** 2)))
  const y = ws.amp * edge * focus * (Math.sin(k * ax + w * t * 2.2) * 0.72 + Math.sin(k * 2.31 * ax + w * t * 3.7 + 1.3) * 0.28)
  return [x, y, edge * (1 - smooth(0.82, 1, u))]
}
