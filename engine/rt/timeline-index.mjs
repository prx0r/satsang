// Satsang realtime layer · timeline index: phase addresses, rounds and load projection over a compiled timeline (compile.mjs ≥ 0.3).
// Pure, no DOM. The compiled timeline is the shared clock's map: every position is timeline seconds `t`.
// A phase address is { id, round } where id is the breath entry id from compile v0.3 (e.g. "in-L", "hold_in-2", "seg3:pause").

export const HOLDS = new Set(['hold_in', 'hold_out'])
export const SILENCE = new Set(['rest'])        // phases whose pause the bus may lengthen (speech-free rests and VBT segment pauses)
const EPS = 1e-6

export function indexTimeline(tl) {
  const B = (tl?.tracks?.breath || []).map((b, i) => ({ ...b, i, end: b.t + b.dur }))
  const rounds = (tl?.tracks?.markers || []).filter(m => m.kind === 'round').map(m => ({ round: m.round, t: m.t }))
  for (let k = 0; k < rounds.length; k++) rounds[k].end = k + 1 < rounds.length ? rounds[k + 1].t : roundEnd(B, rounds[k])
  const total = tl?.total_s ?? (B.length ? B[B.length - 1].end : 0)
  const holdTotal = B.filter(b => HOLDS.has(b.phase)).reduce((s, b) => s + b.dur, 0)
  const maxHold = B.filter(b => HOLDS.has(b.phase)).reduce((m, b) => Math.max(m, b.dur), 0)

  const at = t => { // the breath entry containing t (the last one starting at or before t)
    let lo = 0, hi = B.length - 1, k = -1
    while (lo <= hi) { const m = (lo + hi) >> 1; if (B[m].t <= t + EPS) { k = m; lo = m + 1 } else hi = m - 1 }
    return k >= 0 && t < B[k].end + EPS ? B[k] : (k >= 0 ? B[k] : null)
  }
  const roundAt = t => { let r = 0; for (const x of rounds) if (x.t <= t + EPS) r = x.round; return r }
  const find = (id, round) => {
    const c = B.filter(b => b.id === id)
    if (!c.length) return null
    if (round != null) return c.find(b => b.round === round) || null
    return c
  }
  // holds (seconds) inside [a, b)
  const holdsIn = (a, b) => B.reduce((s, x) => HOLDS.has(x.phase) ? s + Math.max(0, Math.min(b, x.end) - Math.max(a, x.t)) : s, 0)
  // round starts inside [a, b)
  const roundsIn = (a, b) => rounds.filter(r => r.t >= a - EPS && r.t < b - EPS).length
  const ids = [...new Set(B.map(b => b.id).filter(Boolean))]
  return { B, rounds, total, holdTotal, maxHold, at, roundAt, find, holdsIn, roundsIn, ids }
}

function roundEnd(B, r) {
  // last breath entry of this round
  let e = r.t
  for (const b of B) if (b.round === r.round) e = Math.max(e, b.end)
  return e
}

/**
 * Project the session load of a plan of jumps from position t.
 * plan = { from: t, path: [[a, b], [c, d], ...] } : the timeline intervals still to be played, in order.
 * Returns { retention_s, rounds } still to come under that plan.
 */
export function projectLoad(ix, path) {
  let retention_s = 0, rounds = 0
  for (const [a, b] of path) { if (b <= a) continue; retention_s += ix.holdsIn(a, b); rounds += ix.roundsIn(a, b) }
  return { retention_s, rounds }
}
