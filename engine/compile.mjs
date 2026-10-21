// Satsang practice compiler v0: practice JSON v2 → timeline (PRACTICE-ENGINE.md §3 script, compiled to absolute seconds).
// Pure ESM, no dependencies; runs in the browser (import { compile }) and in node (CLI below).
// CLI: node compile.mjs practices/<id>.json [--beginner] [--rounds N] [--count S] [--grammar grammar.json] [--out file]

export const ENGINE = 'satsang-engine/0.3'
const HOLDS = new Set(['hold_in', 'hold_out'])
const PHASES = new Set(['in', 'hold_in', 'out', 'hold_out', 'natural', 'rest'])
const r3 = x => Math.round(x * 1000) / 1000

/**
 * @param {object} practice  practice v2 (schema/practice-v2.json)
 * @param {object} grammar   grammar.json
 * @param {object} [opts]    { beginner?: bool, rounds?: int, count_s?: number, max_hold_s?: number, skip_stages?: string[] }
 * v0.2 (additive, TEXT-TO-PRACTICE.md §6): blocks may carry id, stage, instr, quote, voice_first, sound_first; repeat may carry unit;
 * stages listed in opts.skip_stages or safety.beginner_override.skip_stages (beginner) are dropped; stage changes become markers.
 * v0.3 (additive, engine v2 · REALTIME.md): every breath entry carries `id` (the block's id, else an auto id such as in-L, hold_in-2,
 * unique within its template) so the realtime bus can address phases; `kind: "segment"` blocks (VBT play: the voice speaks, then
 * the pause IS the practice) expand to a speak window + a pause, with gated voice entries and segment markers; free primitives
 * (grammar.primitives[prim].free: wave, spaces, gap, edges, airflow) pass through without an address.
 * opts.speech_s { text → seconds } uses measured clip lengths for speak windows; opts.pause_adjust { segment id → ±seconds }.
 * @returns timeline (schema/timeline.json)
 */
export function compile(practice, grammar, opts = {}) {
  const sc = practice.script
  if (!sc) throw new Error(`${practice.id}: no script`)
  const warnings = [], applied = []
  const beginner = !!opts.beginner
  const bo = practice.safety?.beginner_override || {}
  const params = { ...(sc.params || {}), ...(beginner ? bo.params || {} : {}) }
  if (beginner && bo.params) applied.push(`beginner override: ${JSON.stringify(bo.params)}`)
  const count_s = opts.count_s || sc.count_s || 1
  const R = sc.rounds || { default: 1, min: 1, max: 1 }
  let rounds = opts.rounds ?? (beginner ? bo.rounds : undefined) ?? R.default ?? 1
  rounds = Math.max(R.min ?? 1, Math.min(R.max ?? 99, rounds | 0))
  const capHold = Math.min(30, opts.max_hold_s ?? 30, practice.safety?.max_hold_s ?? 30, grammar?.safety?.max_hold_s ?? 30)
  const stripOver = beginner ? (grammar?.safety?.beginner?.strip_holds_over_s ?? 10) : Infinity
  const skip = new Set([...(opts.skip_stages || []), ...(beginner ? bo.skip_stages || [] : [])])
  if (skip.size) applied.push(`skipped stages: ${[...skip].join(', ')}`)
  const stageLabel = Object.fromEntries((practice.stages || []).map(s => [s.id, s.label]))
  let stage = null

  // address validation against the grammar
  const L = grammar?.loci || {}, P = grammar?.paths || {}, G = grammar?.regions || {}
  const alias = {}
  for (const [id, l] of Object.entries(L)) for (const a of l.alias || []) alias[a] = id
  const locus = id => (L[id] ? id : alias[id] ? alias[id] : (warnings.push(`unknown locus: ${id}`), id))
  const target = id => (G[id] || L[id] || P[id] ? id : alias[id] ? alias[id] : (warnings.push(`unknown target: ${id}`), id))
  const path = id => (P[id] ? id : (warnings.push(`unknown path: ${id}`), id))

  const counts = c => {
    if (typeof c === 'number') return c
    if (typeof c === 'string') {
      const m = c.match(/^r([0-3])$/); if (m) return (params.ratio || [])[+m[1]] ?? 0
      const p = c.match(/^param:(\w+)$/); if (p) return +params[p[1]] || 0
    }
    return 0
  }
  const repeatN = n => typeof n === 'number' ? n : n === 'rounds' ? rounds : counts(n)

  // verbs → cues (grammar.verbs)
  function verbCue(d) {
    const v = grammar?.verbs?.[d.verb]
    if (!v) { warnings.push(`unknown verb: ${d.verb}`); return [] }
    const cue = { ...v.to }
    if (cue.prim === 'path') cue.path = d.along || d.path
    if (cue.prim === 'locus') cue.locus = d.at
    if (cue.prim === 'field') { cue.region = d.over || d.region || cue.region || 'whole_body'; if (d.from) cue.from = d.from }
    if (cue.prim === 'attention') { cue.target = d.at || d.over; cue.size = d.size || cue.size || 'medium' }
    for (const k of ['dir', 'colour', 'mode', 'motion', 'exit', 'density', 'from']) if (d[k] != null) cue[k] = d[k]
    const out = [cue]
    if (v.to.with_attention && d.at) out.push({ prim: 'attention', target: d.at, size: v.to.with_attention })
    return out
  }
  function normCue(c) {
    const cue = { ...c }
    if (cue.prim === 'path') cue.path = path(cue.path), cue.colour ??= P[cue.path]?.colour, cue.mode ??= 'fill', cue.dir ??= 'forward'
    else if (cue.prim === 'locus') cue.locus = locus(cue.locus)
    else if (cue.prim === 'field') { cue.region = target(cue.region || 'whole_body'); if (cue.from) cue.from = locus(cue.from) }
    else if (cue.prim === 'attention') cue.target = target(cue.target)
    else if (grammar?.primitives?.[cue.prim]?.free) { if (cue.at_locus) cue.at_locus = locus(cue.at_locus) }
    else warnings.push(`unknown prim: ${cue.prim}`)
    return cue
  }

  // auto ids: unique per template (intro / round / between / outro), so 'out-R' in round 3 is addressable as {id, round}
  const autoId = new WeakMap()
  for (const part of ['intro', 'round', 'between', 'outro']) {
    const seen = {}
    const walk = list => { for (const b of list || []) { if (b.blocks) { walk(b.blocks); continue }
      const base = b.id || (b.kind === 'segment' ? 'seg' : `${b.phase}${b.nostril ? '-' + b.nostril : ''}`)
      seen[base] = (seen[base] || 0) + 1; autoId.set(b, b.id && seen[base] === 1 ? b.id : seen[base] > 1 ? `${base}-${seen[base]}` : base) } }
    walk(sc[part])
  }
  const speechS = opts.speech_s || {}, padj = opts.pause_adjust || {}
  const estSpeech = txt => { if (!txt) return 0; if (speechS[txt] != null) return +speechS[txt]; const w = txt.trim().split(/\s+/).length; return Math.round((w / 2.15 + 0.6) * 10) / 10 }

  const tl = { breath: [], voice: [], visual: [], attention: [], audio: [], haptic: [], markers: [] }
  let t = 0, vol = 0, round = 0, said = new Set()

  function emitBlock(b, ctx) {
    if (b.stage && skip.has(b.stage)) return
    if (b.stage && b.stage !== stage) { stage = b.stage; tl.markers.push({ t: r3(t), kind: 'stage', stage, label: stageLabel[stage] }) }
    if (b.repeat != null) {
      const n = repeatN(b.repeat)
      for (let i = 0; i < n; i++) for (const bb of b.blocks) emitBlock(bb.stage || !b.stage ? bb : { ...bb, stage: b.stage }, { ...ctx, stroke: b.repeat === 'rounds' ? undefined : i + 1, strokes: n, unit: b.unit, first: i === 0, last: i === n - 1, rid: b.id })
      return
    }
    if (b.kind === 'segment') return emitSegment(b, ctx)
    const phase = b.phase
    if (!PHASES.has(phase)) { warnings.push(`unknown phase: ${phase}`); return }
    let dur = b.seconds != null ? b.seconds : counts(b.counts) * count_s
    const c = b.seconds != null ? null : counts(b.counts)
    if (HOLDS.has(phase)) {
      if (dur <= 0) return
      if (dur > stripOver) { applied.push(`beginner: removed ${phase} of ${r3(dur)} s (round ${round || '-'})`); return }
      if (dur > capHold) { applied.push(`capped ${phase} ${r3(dur)} s → ${capHold} s`); dur = capHold }
    }
    if (dur <= 0) return
    if (b.only_first && ctx.first === false) return
    const t0 = t
    // breath track (natural expands into suggested in/out pairs so the orb has a clock)
    if (phase === 'natural') {
      const [pi, po] = b.pace || [5, 6]
      let tt = 0
      while (tt < dur - 0.5) {
        const di = Math.min(pi, dur - tt); tl.breath.push({ t: r3(t0 + tt), dur: r3(di), phase: 'natural', id: autoId.get(b), sub: 'in', vol0: 0.18, vol1: 0.82, round }); tt += di
        if (tt >= dur - 0.5) break
        const dO = Math.min(po, dur - tt); tl.breath.push({ t: r3(t0 + tt), dur: r3(dO), phase: 'natural', id: autoId.get(b), sub: 'out', vol0: 0.82, vol1: 0.18, round }); tt += dO
      }
      vol = 0.18
    } else {
      const vol0 = vol
      const vol1 = phase === 'in' ? (b.to ?? 1) : phase === 'out' ? (b.to ?? 0) : vol
      tl.breath.push({ t: r3(t0), dur: r3(dur), phase, id: autoId.get(b), nostril: b.nostril, counts: c, round, stroke: ctx.stroke, strokes: ctx.strokes, unit: ctx.unit, vol0, vol1, label: b.label })
      vol = vol1
    }
    // voice: caption (shown) and say (spoken); our own words
    const text = b.voice_first && ctx.first === false ? null : b.caption
    if (text) tl.voice.push({ t: r3(t0), dur: r3(dur), text, say: b.say === false ? null : (b.say || text), once: !!b.say_once, ...(b.id ? { block: b.id } : {}), ...(b.quote ? { quote: b.quote } : {}), ...(b.stage ? { stage: b.stage } : {}) })
    if (b.say_once && text) { const k = text; if (said.has(k)) tl.voice[tl.voice.length - 1].say = null; said.add(k) }
    // visual cues
    const cues = [...(b.visual || []), ...(b.do || []).flatMap(verbCue)]
    for (const raw of cues) {
      const cue = normCue(raw)
      if (cue.prim === 'attention') { tl.attention.push({ t: r3(t0), target: cue.target, size: cue.size || 'medium' }); continue }
      const cd = raw.seconds ?? dur
      tl.visual.push({ t: r3(t0 + (raw.delay || 0)), dur: r3(cd), phase, ...cue })
    }
    if (b.attention) { const a = normCue({ prim: 'attention', ...b.attention }); tl.attention.push({ t: r3(t0), target: a.target, size: a.size || 'medium' }) }
    if (b.sound && !(b.sound_first && ctx.first === false)) tl.audio.push({ t: r3(t0 + (b.sound_at === 'end' ? dur : 0)), sound: b.sound })
    if (b.haptic) tl.haptic.push({ t: r3(t0), pattern: b.haptic })
    t += dur
  }

  // VBT play segment: [speak window][pause]. The voice entry is gated: the shared clock waits at the end of the speak window
  // until the real speech ends (and catches up if it ends early), so the pause always starts when the voice stops.
  function emitSegment(b, ctx) {
    const sid = b.id || autoId.get(b), say = b.say || null, text = b.caption || say
    const speak = say ? estSpeech(b.say_spoken || say) : 0
    const pause = Math.max(0, (b.pause_s ?? 10) + (padj[sid] || 0))
    const t0 = t, total = speak + pause
    if (total <= 0) return
    tl.markers.push({ t: r3(t0), kind: 'segment', id: sid, speak_end: r3(t0 + speak), end: r3(t0 + total), n: (ctx.segN = (ctx.segN || 0) + 1), hold_open: !!b.hold_open })
    if (speak > 0) tl.breath.push({ t: r3(t0), dur: r3(speak), phase: 'rest', id: sid, sub: 'speak', segment: sid, round, vol0: vol, vol1: vol })
    if (pause > 0) tl.breath.push({ t: r3(t0 + speak), dur: r3(pause), phase: 'rest', id: sid + ':pause', sub: 'pause', segment: sid, round, vol0: vol, vol1: vol })
    if (text) tl.voice.push({ t: r3(t0), dur: r3(speak || total), text, say, gate: !!say, segment: sid, pause_s: r3(pause), ...(b.tts_source ? { tts_source: b.tts_source } : {}) })
    for (const raw of b.visual || []) {
      const cue = normCue(raw)
      const at = raw.at === 'pause' ? t0 + speak : t0
      const cd = raw.seconds ?? (raw.at === 'pause' ? pause : raw.at === 'speak' ? speak : total)
      if (cue.prim === 'attention') { tl.attention.push({ t: r3(at), target: cue.target, size: cue.size || 'medium' }); continue }
      tl.visual.push({ t: r3(at + (raw.delay || 0)), dur: r3(cd), phase: 'rest', segment: sid, ...cue })
    }
    if (b.attention) { const a = normCue({ prim: 'attention', ...b.attention }); tl.attention.push({ t: r3(t0), target: a.target, size: a.size || 'medium' }) }
    if (b.sound) tl.audio.push({ t: r3(t0 + (b.sound_at === 'pause' ? speak : b.sound_at === 'end' ? total : 0)), sound: b.sound })
    t += total
  }

  for (const b of sc.intro || []) emitBlock(b, {})
  const hasRounds = (sc.round || []).length > 0
  if (!hasRounds) rounds = 0
  for (round = 1; round <= rounds; round++) {
    tl.markers.push({ t: r3(t), kind: 'round', round, of: rounds })
    for (const b of sc.round || []) emitBlock(b, { first: round === 1 })
    if (sc.round_sound !== false) tl.audio.push({ t: r3(t), sound: sc.round_sound || 'bell-soft' })
    if (round < rounds) for (const b of sc.between || []) emitBlock(b, {})
  }
  round = 0
  for (const b of sc.outro || []) emitBlock(b, {})
  tl.audio.push({ t: r3(t), sound: 'bell-end' })

  const holds = tl.breath.filter(b => HOLDS.has(b.phase)).map(b => b.dur)
  return {
    script_version: 1,
    engine: ENGINE,
    practice: practice.id,
    name: practice.name,
    traditions: practice.traditions,
    opts: { beginner, rounds, count_s },
    params,
    loops: rounds,
    mode: sc.mode || 'guided',
    total_s: r3(t),
    show: sc.show || {},
    tracks: tl,
    physiology: {
      ratio: params.ratio || null,
      retention_max_s: holds.length ? Math.max(...holds) : 0,
      breaths_per_min: r3(tl.breath.filter(b => b.phase === 'in' || b.sub === 'in').length / Math.max(1e-6, t / 60)),
      breath_style: sc.breath_style || null,
    },
    safety: {
      max_hold_s: capHold, beginner, applied,
      needs_teacher: !!practice.facets?.needs_teacher,
      contraindications: practice.safety?.contraindications || practice.contraindications || [],
      stop_if: practice.safety?.stop_if || [],
    },
    warnings,
  }
}

// ---- CLI ------------------------------------------------------------------
if (typeof process !== 'undefined' && process.argv?.[1] && /(^|[\/\\])compile\.mjs$/.test(process.argv[1])) {
  const fs = await import('node:fs'), pth = await import('node:path'), url = await import('node:url')
  const here = pth.dirname(url.fileURLToPath(import.meta.url))
  const a = process.argv.slice(2), flag = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined }
  const file = a.find(x => x.endsWith('.json') && x !== flag('--grammar') && x !== flag('--out'))
  if (!file) { console.error('usage: node compile.mjs practices/<id>.json [--beginner] [--rounds N] [--count S] [--out f]'); process.exit(2) }
  const grammar = JSON.parse(fs.readFileSync(flag('--grammar') || pth.join(here, 'grammar.json'), 'utf8'))
  const practice = JSON.parse(fs.readFileSync(file, 'utf8'))
  const out = compile(practice, grammar, { beginner: a.includes('--beginner'), rounds: flag('--rounds') ? +flag('--rounds') : undefined, count_s: flag('--count') ? +flag('--count') : undefined })
  const s = JSON.stringify(out, null, 1)
  if (flag('--out')) fs.writeFileSync(flag('--out'), s); else process.stdout.write(s + '\n')
  if (out.warnings.length) { console.error('warnings:', out.warnings.join('; ')); process.exitCode = 1 }
}
