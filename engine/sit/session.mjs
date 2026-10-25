// The hands-off session: one or more compiled practices laid end to end on one clock, fitted to the minutes asked for.
// Pure (no DOM): the player (sit/sit.js) and node tests (tools/test-sit.mjs) use the same functions.
//   fitPractice(practice, grammar, compile, {minutes, beginner, skip_stages, only_stages})
//   buildSession(items, grammar, compile)  items = [{practice, minutes?, beginner?, skip_stages?, only_stages?, label?}]
//   breathAt(session, t) → {level 0..1, vel, phase, label}     focusAt(session, t) → {target, size}
// Rules (engine/tools/extract/defaults.json): the player never invents steps. A session longer than the practice as written
// first lengthens the practice's own user-adjustable rounds (e.g. Ajaan Lee's stillness breaths), then adds silent open sitting
// with the last stage (rule open-sitting). A shorter session uses the beginner form, then drops optional stages; if it still
// doesn't fit, the practice runs as written and the plan says so. Never a hold: practices whose timeline has any retention
// are refused (natural breath only).
export const OPEN_PACE = { in: 5, out: 6 }   // pace-guide (defaults.json): the same visual pace the practices use
export const OPEN_LINE = 'Stay with this, in your own time.'
const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
const lvl = v => clamp((v - 0.15) / 0.72, 0, 1)

export function eligible(practice, grammar, compile) {
  const tl = compile(practice, grammar, {})
  const holds = tl.tracks.breath.some(b => /^hold/.test(b.phase)) || (tl.physiology?.retention_max_s || 0) > 0
  return { ok: !holds && !tl.warnings.length && !practice.needsTeacher, reason: holds ? 'has breath retention' : practice.needsTeacher ? 'needs a teacher' : tl.warnings.join('; ') }
}

export function fitPractice(practice, grammar, compile, { minutes, beginner = false, skip_stages = [], only_stages } = {}) {
  const ids = (practice.stages || []).map(s => s.id)
  const skip = only_stages ? ids.filter(id => !only_stages.includes(id)) : [...skip_stages]
  const notes = []
  let opts = { beginner, skip_stages: skip }
  let tl = compile(practice, grammar, opts)
  const natural_s = tl.total_s
  if (!minutes) return { tl, opts, natural_s, target_s: natural_s, fill_s: 0, notes }
  const target = Math.round(minutes * 60)
  if (tl.total_s > target + 1) {            // shorter: beginner form, then drop optional stages
    const tries = []
    if (!beginner) tries.push({ ...opts, beginner: true })
    const optional = (practice.stages || []).filter(s => s.optional).map(s => s.id)
    if (optional.length) tries.push({ ...opts, beginner: true, skip_stages: [...new Set([...skip, ...optional])] })
    for (const o of tries) { const t2 = compile(practice, grammar, o); if (t2.total_s < tl.total_s) { tl = t2; opts = o; notes.push(o.beginner && !beginner ? 'beginner form' : 'optional stages left out') } if (tl.total_s <= target + 1) break }
    if (tl.total_s > target + 1) notes.push(`runs ${Math.ceil(tl.total_s / 60)} min as written (asked for ${minutes})`)
  }
  const R = practice.script?.rounds
  if (tl.total_s < target && R && practice.script?.round?.length && (R.max ?? 1) > (tl.opts?.rounds ?? R.default ?? 1)) {   // longer: the practice's own rounds first
    let best = tl
    for (let n = (tl.opts?.rounds ?? R.default ?? 1) + 1; n <= R.max; n++) {
      const t2 = compile(practice, grammar, { ...opts, rounds: n }); if (t2.total_s > target) break; best = t2
    }
    if (best !== tl) { notes.push(`${best.opts.rounds} ${R.unit || 'rounds'}`); tl = best; opts = { ...opts, rounds: best.opts.rounds } }
  }
  const fill_s = Math.max(0, Math.round((target - tl.total_s) * 10) / 10)
  if (fill_s >= 30) notes.push(`${Math.round(fill_s / 60)} min open sitting`)
  return { tl, opts, natural_s, target_s: Math.max(target, tl.total_s), fill_s: fill_s >= 1 ? fill_s : 0, notes }
}

export function buildSession(items, grammar, compile) {
  const S = { total_s: 0, items: [], breath: [], voice: [], cues: [], focus: [], stages: [], warnings: [] }
  let t0 = 0
  items.forEach((it, k) => {
    const p = it.practice, el = eligible(p, grammar, compile)
    if (!el.ok) { S.warnings.push(`${p.id}: refused (${el.reason})`); return }
    const f = fitPractice(p, grammar, compile, it), tl = f.tl
    const rec = { id: p.id, name: p.name, label: it.label || p.name, t0, natural_s: f.natural_s, fill_s: f.fill_s, opts: f.opts, notes: f.notes }
    for (const b of tl.tracks.breath) {
      const sub = b.sub || b.phase
      if (sub !== 'in' && sub !== 'out') continue   // never a hold (eligible() already refused any)
      S.breath.push({ t: t0 + b.t, dur: b.dur, sub, l0: lvl(b.vol0 ?? (sub === 'in' ? 0.18 : 0.82)), l1: lvl(b.vol1 ?? (sub === 'in' ? 0.82 : 0.18)), label: b.label, item: k })
    }
    for (const v of tl.tracks.voice) if (v.text) S.voice.push({ t: t0 + v.t, dur: v.dur, text: v.text, say: v.say, quote: v.quote, stage: v.stage, block: v.block, item: k })
    for (const a of tl.tracks.audio) S.cues.push({ t: t0 + a.t, sound: a.sound === 'bowl-start' ? (S.items.length ? 'chime' : 'bowl') : 'chime', item: k })
    // focus: attention events win over visual prims at the same moment; a dissipating locus never moves the focus
    const ev = []
    for (const v of tl.tracks.visual) {
      if (v.motion === 'dissipate') continue
      if (v.prim === 'locus') ev.push({ t: v.t, target: v.locus, size: 'medium', pr: 1 })
      else if (v.prim === 'field') ev.push({ t: v.t, target: v.region, size: 'medium', pr: 1 })
      else if (v.prim === 'path') ev.push({ t: v.t, target: v.path, size: 'medium', pr: 0 })
    }
    for (const a of tl.tracks.attention) ev.push({ t: a.t, target: a.target, size: a.size, pr: 2 })
    ev.sort((a, b) => a.t - b.t || a.pr - b.pr)
    for (const e of ev) S.focus.push({ t: t0 + e.t, target: e.target, size: e.size, item: k })
    const marks = tl.tracks.markers.filter(m => m.kind === 'stage')
    marks.forEach((m, j) => S.stages.push({ t: t0 + m.t, t1: t0 + (marks[j + 1]?.t ?? tl.total_s), stage: m.stage, label: m.label, item: k, practice: p.id }))
    let t = t0 + tl.total_s
    if (f.fill_s) {   // open sitting: silent breaths at the practice's pace with the last focus (rule open-sitting)
      const end = t + f.fill_s
      if (f.fill_s >= 20) S.voice.push({ t, dur: 4, text: OPEN_LINE, say: OPEN_LINE, stage: marks.at(-1)?.stage, item: k, open: true })
      const last = S.stages.at(-1); if (last && last.item === k) last.t1 = end
      while (t < end - 0.5) {
        const di = Math.min(OPEN_PACE.in, end - t); S.breath.push({ t, dur: di, sub: 'in', l0: lvl(0.18), l1: lvl(0.82), item: k, open: true }); t += di
        if (t >= end - 0.5) break
        const dO = Math.min(OPEN_PACE.out, end - t); S.breath.push({ t, dur: dO, sub: 'out', l0: lvl(0.82), l1: lvl(0.18), item: k, open: true }); t += dO
      }
      t = end
    }
    rec.t1 = t; S.items.push(rec); t0 = t
  })
  S.total_s = Math.round(t0 * 10) / 10
  S.cues.push({ t: S.total_s, sound: 'bowl-end' })
  return S
}

const find = (arr, t) => { let lo = 0, hi = arr.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (arr[m].t <= t) { r = m; lo = m + 1 } else hi = m - 1 } return r }
export function breathAt(S, t) {
  const i = find(S.breath, t); if (i < 0) return { level: 0.1, vel: 0, phase: 'in' }
  const b = S.breath[i], u = clamp((t - b.t) / b.dur, 0, 1), e = 0.5 - 0.5 * Math.cos(Math.PI * u)
  const level = b.l0 + (b.l1 - b.l0) * e, vel = (b.l1 - b.l0) * 0.5 * Math.PI * Math.sin(Math.PI * u) / b.dur
  return { level, vel, phase: b.sub, label: b.label, open: !!b.open }
}
export function focusAt(S, t) { const i = find(S.focus, t); return i < 0 ? { target: null } : S.focus[i] }
export function stageAt(S, t) { const i = find(S.stages, t); return i < 0 ? S.stages[0] : S.stages[i] }
export function itemAt(S, t) { return S.items.find(it => t >= it.t0 && t < it.t1) || S.items.at(-1) }
export const fmt = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
