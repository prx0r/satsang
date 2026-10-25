// Stage 4–5 · Practice + Script → practice v2 (what compile.mjs and the player already run). Deterministic.
//   instructions.json + head.json + narration.json [+ voice manifest] + defaults.json → practices/<id>.json + build-report.json
// usage: node tools/extract/build-practice.mjs <pipeline dir> [--voice <renders/<id>/voice/manifest.json>]
// Templates: one per instruction action (TEXT-TO-PRACTICE.md §6). Carriers make blocks; modifiers (caution, image, widen…) ride on
// the first carrier of their stage, or get one guidance breath each after a carrier (rule guidance-breaths). Every block records
// the instructions it came from and the rule behind every number the source does not state.
import fs from 'node:fs'
import path from 'node:path'
import { ENGINE, readJSON, writeJSON, sha256 } from './lib.mjs'
import { validateNarration } from './validate.mjs'
import { compile } from '../../compile.mjs'
export const BUILDER = 'satsang-build-practice/1'
const CARRIER_FIT = new Set(['posture', 'recollect', 'recite'])
const CARRIER_BREATH = new Set(['move_attention', 'settle', 'spread'])
const isCarrier = i => CARRIER_FIT.has(i.action) || CARRIER_BREATH.has(i.action) || (i.count && ['breath_word', 'let_go', 'attend'].includes(i.action))
const WPS = 2.3
const REGIONS = new Set(Object.keys(readJSON(path.join(ENGINE, 'grammar.json')).regions || {}))   // an attention target that is a region is drawn as a field

export function buildBlocks(ins, rules, stagesMeta) {
  const PACE = rules['pace-guide'].value, prov = {}, stages = []
  const R = (id, o) => (prov[id] = o, id)
  const pace = { basis: 'inferred', rule: 'pace-guide' }
  let pos = null, roundsCarrier = null
  const B = (id, phase, o, instr, extra = {}) => { R(id, { instr, seconds: phase === 'in' || phase === 'out' ? pace : extra.secondsProv, ...extra.prov }); return { id, phase, ...(phase === 'in' ? { seconds: PACE.in_s } : phase === 'out' ? { seconds: PACE.out_s } : {}), ...o } }
  const att = (target, size = 'narrow') => ({ target, size })
  const loc = (l, motion = 'fill', colour = 'breath') => REGIONS.has(l) ? { prim: 'field', region: l, motion, colour } : ({ prim: 'locus', locus: l, motion, colour })
  const pair = (id, instr, a = {}, b = {}, extra) => [B(id + '.in', 'in', a, instr, extra), B(id + '.out', 'out', b, instr, extra)]
  const rep = (id, n, blocks, unit, instr, cp) => {
    R(id, { instr, count: cp })
    if (n > 3) return [{ id, repeat: n, unit, blocks }]
    const o = [] // short repeats are unrolled so each breath can carry its own line
    for (let k = 1; k <= n; k++) for (const b of blocks) { const nid = b.id.replace(id, `${id}.b${k}`); prov[nid] = prov[b.id]; o.push({ ...b, id: nid }) }
    for (const b of blocks) delete prov[b.id]
    return o
  }
  const countProv = i => i.prov?.count || { basis: 'quoted', span: i.spans.map(s => s.passage) }
  const wordTpl = i => {
    const w = i.words || {}, a = i.attention?.target || 'nose_tip'
    const inL = w.in ?? (w.per_breath ? (w.per_breath_n > 1 ? `${w.per_breath} ×${w.per_breath_n}` : w.per_breath) : undefined), outL = w.out
    return [{ ...(inL ? { label: inL } : {}), attention: att(a, i.attention?.size || 'narrow'), visual: [loc(a, 'fill')] }, { ...(outL ? { label: outL } : {}), visual: [loc(a, 'dissipate', 'release')] }]
  }
  const fitBlock = (i, minS, visual) => { const id = i.id; R(id, { instr: [i.id], seconds: { basis: 'measured', rule: 'fit-narration', min_s: minS } }); return { id, phase: 'natural', seconds: minS, fit: { min_s: minS }, ...(visual ? { visual } : {}) } }

  const out = { intro: [], round: [], outro: [] }
  let where = 'intro'
  for (const st of stagesMeta) {
    const list = ins.filter(i => i.stage === st.id && i.scripted)
    if (!list.length) continue
    const blocks = []; let pendingInstr = [], lastTpl = null
    const tag = bs => bs.map(b => ({ ...b, stage: st.id }))
    for (const i of list) {
      if (!isCarrier(i)) {
        if (!lastTpl) { pendingInstr.push(i.id); continue }
        // one guidance breath, same template as the carrier before it (rule guidance-breaths)
        const [a, b] = lastTpl(i)
        blocks.push(...pair(i.id + '.g', [i.id], a, b, { prov: { guidance: { basis: 'inferred', rule: 'guidance-breaths' } } })); continue
      }
      const instr = [...pendingInstr, i.id]; pendingInstr = []
      let made = []
      if (i.action === 'posture') made = [fitBlock(i, 8, [{ prim: 'field', region: 'whole_body', motion: 'steady', colour: 'awareness' }])]
      else if (i.action === 'recollect' && i.spans.length > 1) made = i.spans.map((s, k) => { const id = `${i.id}.${'abc'[k]}`; R(id, { instr: [i.id], seconds: { basis: 'measured', rule: 'fit-narration', min_s: 5 } }); return { id, phase: 'natural', seconds: 5, fit: { min_s: 5 }, visual: [loc('middle_chest', 'steady', 'awareness')] } })
      else if (i.action === 'recollect' || i.action === 'recite') made = [fitBlock(i, 8, i.gesture?.includes('heart') ? [loc('middle_chest', 'steady', 'awareness')] : undefined)]
      else if (['breath_word', 'let_go'].includes(i.action) && i.words) {
        const [a, b] = wordTpl(i)
        if (i.prov?.count?.rule === 'stillness-rounds') { // the stage the user lengthens: one narrated breath now, the rest as rounds
          made = pair(i.id, instr, a, b)
          const rr = rules['stillness-rounds'].value
          roundsCarrier = { blocks: pair(i.id + '.r', [i.id], { ...a, attention: undefined }, b).map(x => ({ ...x, stage: st.id })), rounds: { default: i.count.value, min: rr.min, max: rr.max, unit: 'breaths of stillness' } }
          R(i.id + '.r', { instr: [i.id], count: countProv(i) })
        } else made = rep(i.id, i.count.value, pair(i.id, instr, a, b), 'breath', instr, countProv(i))
        lastTpl = m => [{ ...a, attention: m.attention ? att(m.attention.target, m.attention.size) : undefined }, b]
        pos = a.attention?.target || pos
      } else if (i.action === 'attend') {
        const t = i.attention?.target || pos || 'nose_tip'
        made = rep(i.id, i.count.value, pair(i.id, instr, { attention: att(t, i.attention?.size || 'medium'), visual: [loc(t, 'fill')] }, { visual: [loc(t, 'dissipate', 'release')] }), 'breath', instr, countProv(i))
        pos = t; lastTpl = () => [{ visual: [loc(t, 'fill')] }, { visual: [loc(t, 'dissipate', 'release')] }]
      } else if (i.action === 'move_attention' && !i.path.back_and_forth) {
        made = pair(i.id, instr, { attention: att(i.path.from), visual: [loc(i.path.from, 'fill')] }, { attention: att(i.path.to), visual: [loc(i.path.to, 'steady')] }, { prov: { pairing: { basis: 'inferred', rule: 'traverse-with-breath' } } })
        pos = i.path.to
      } else if (i.action === 'move_attention') {
        const here = pos === i.path.to ? i.path.to : i.path.from, far = here === i.path.from ? i.path.to : i.path.from
        made = rep(i.id, i.count.value, pair(i.id, instr, { attention: att(far), visual: [loc(far, 'fill')] }, { attention: att(here), visual: [loc(here, 'steady')] }, { prov: { pairing: { basis: 'inferred', rule: 'traverse-with-breath' } } }), 'round trip', instr, countProv(i))
        pos = here
        if (i.path.end && i.path.end !== pos) { made.push(...pair(i.id + '.end', [i.id], { attention: att(i.path.end, 'medium'), visual: [loc(i.path.end, 'fill')] }, { visual: [loc(i.path.end, 'hold-glow')] }, { prov: { duration: { basis: 'inferred', rule: 'moment-one-breath' } } })); pos = i.path.end }
      } else if (i.action === 'settle') {
        const a0 = i.locus[0], a1 = i.locus[1] || a0
        made = pair(i.id, instr, { attention: att(a0, 'medium'), visual: [loc(a0, i.locus[1] ? 'fill' : 'hold-glow')] }, { attention: att(a1, a1 === a0 ? 'medium' : 'narrow'), visual: [loc(a1, a1 === a0 ? 'hold-glow' : 'steady')] }, { prov: { duration: i.prov?.duration } })
        pos = a1
      } else if (i.action === 'spread') {
        const from = i.locus?.[0] || pos
        if (i.region === 'head') {
          made = pair(i.id, instr, { attention: att(from, 'medium'), visual: [loc(from, 'fill'), { prim: 'field', region: 'head', motion: 'expand', colour: 'breath', from }] }, { attention: att(i.locus[1] || from), visual: [{ prim: 'field', region: 'head', motion: 'steady', colour: 'breath' }] }, { prov: { duration: i.prov?.duration } })
          pos = i.locus[1] || from
        } else {
          const n = i.count?.value || 1
          const fromHead = from && from !== 'whole_body'
          made = rep(i.id, n, pair(i.id, instr,
            fromHead ? { attention: att(from, 'medium'), visual: [loc(from, 'steady'), { prim: 'path', path: 'spine', motion: 'flow', mode: 'fill', colour: 'breath' }] } : { attention: att('whole_body', 'whole'), visual: [{ prim: 'field', region: 'whole_body', motion: 'fill', colour: 'breath' }] },
            fromHead ? { attention: att('whole_body', 'wide'), visual: [{ prim: 'field', region: 'whole_body', motion: 'fill', colour: 'breath', from }, { prim: 'path', path: 'spine', motion: 'flow', mode: 'stream', colour: 'breath' }] } : { visual: [{ prim: 'field', region: 'whole_body', motion: 'steady', colour: 'breath' }] }), 'breath', instr, countProv(i))
          pos = 'whole_body'
        }
      } else throw new Error(`${i.id}: no template for action ${i.action}`)
      const P = pos
      if (CARRIER_FIT.has(i.action)) lastTpl = null
      else if (!(['breath_word', 'let_go'].includes(i.action) && i.words)) lastTpl = m => [{ attention: att(P, m.action === 'widen' ? 'wide' : 'medium'), visual: [loc(P, 'steady')] }, { visual: [loc(P, 'steady')] }]
      blocks.push(...made)
    }
    if (pendingInstr.length) throw new Error(`stage ${st.id}: modifiers ${pendingInstr} with no carrier`)
    stages.push({ id: st.id, label: st.label, ...(st.optional ? { optional: true } : {}) })
    out[where].push(...tag(blocks))
    if (roundsCarrier && where === 'intro') where = 'outro'
  }
  return { ...out, roundsCarrier, prov, stages }
}

const walk = (bs, f) => { for (const b of bs) { f(b); if (b.blocks) walk(b.blocks, f) } }
const inRepeat = bs => { const s = new Set(); for (const b of bs) if (b.blocks) walk(b.blocks, x => s.add(x.id)); return s }

export function build(dir, { voiceManifest } = {}) {
  const rules = readJSON(path.join(ENGINE, 'tools/extract/defaults.json')).rules
  const grammar = readJSON(path.join(ENGINE, 'grammar.json'))
  const insDoc = readJSON(path.join(dir, 'instructions.json')), head = readJSON(path.join(dir, 'head.json')), nar = readJSON(path.join(dir, 'narration.json'))
  const src = readJSON(path.join(ENGINE, 'sources', insDoc.source, 'source-text.json'))
  if (insDoc.validation.errors.length) throw new Error('instructions.json has validation errors; fix them first')
  const ins = insDoc.instructions
  const g = buildBlocks(ins, rules, insDoc.stages)
  const errors = [], warnings = []
  // lead-in (bowl) and a chime at each stage change (rules lead-in, stage-chime)
  g.intro.unshift({ id: 'open', phase: 'natural', seconds: rules['lead-in'].value.s, stage: g.intro[0]?.stage, sound: 'bowl-start' })
  g.prov.open = { instr: [], seconds: { basis: 'inferred', rule: 'lead-in' } }
  { let last = g.intro[0].stage; const first = b => { let x = b; while (x.blocks) x = x.blocks[0]; return x }
    for (const sec of [g.intro, g.roundsCarrier?.blocks || [], g.outro]) for (const b of sec) { if (b.stage && b.stage !== last) { const f = first(b); f.sound ||= rules['stage-chime'].value.sound; if (b.blocks) f.sound_first = true; last = b.stage } } }
  // close: our framing
  g.outro.push({ id: 'close', phase: 'natural', seconds: rules['whole-body-breaths'].value.rest_s, stage: g.stages.at(-1).id, visual: [{ prim: 'field', region: 'whole_body', motion: 'steady', colour: 'breath' }] })
  g.prov.close = { instr: [], seconds: { basis: 'inferred', rule: 'whole-body-breaths' } }
  const sections = { intro: g.intro, round: g.roundsCarrier?.blocks || [], outro: g.outro }
  const all = []; for (const s of Object.values(sections)) walk(s, b => b.id && all.push(b))
  const byId = new Map(all.map(b => [b.id, b])), rep = new Set(Object.values(sections).flatMap(s => [...inRepeat(s)]))
  // narration → captions
  const v = validateNarration(nar, ins, grammar, all.map(b => b.id)); errors.push(...v.errors); warnings.push(...v.warnings)
  const vm = voiceManifest ? new Map(voiceManifest.lines.map(l => [l.id, l])) : new Map()
  const est = ln => vm.get(ln.id)?.text === ln.text ? vm.get(ln.id).dur_s : ln.text.split(/\s+/).length / WPS
  const lineOf = new Map()
  for (const ln of nar.lines) {
    const b = byId.get(ln.block); if (!b) continue
    if (b.blocks) { errors.push(`${ln.id}: block ${ln.block} is a repeat container; put the line on a block inside it (e.g. ${b.blocks[0].id})`); continue }
    if (b.caption) errors.push(`${ln.id}: block ${ln.block} already has a line`)
    b.caption = ln.text; if (ln.say) b.say = ln.say
    if (ln.quote) b.quote = { text: ln.quote.text, cite: `${src.author.name}, ${src.title.split(' & ')[0]}, ${ln.quote.passage} (tr. ${src.translator.name.split(' (')[0]})` }
    if (rep.has(b.id) || sections.round.includes(b)) b.voice_first = true
    if (sections.round.includes(b)) b.say_once = true
    lineOf.set(b.id, ln)
    if (b.fit) { const need = est(ln) + (ln.pause_after_s ?? 0) + rules['fit-narration'].value.margin_s; b.seconds = Math.max(b.fit.min_s, Math.round(need * 10) / 10) }
  }
  for (const b of all) delete b.fit
  // practice v2
  const pick = f => (f && typeof f === 'object' && 'value' in f) ? f.value : f
  const sources = head.sources ? head.sources.map(s => { const seg = src.segments.find(x => x.id === s.segment)
    return { url: s.url || seg.url, cite: s.cite, checked: src.licence.checked, check: 'work', licence: s.licence ? s.licence : s.licence_full === false ? src.licence.id : `${src.licence.id} (${src.licence.evidence_url})` } }) : [
    { url: src.segments.find(s => s.id === 'method-1').url, cite: `${src.author.name}, ${src.title.split(' & ')[0]}, Method 1 (tr. ${src.translator.name.split(' (')[0]}, ${src.edition.split(';')[0]})`, checked: src.licence.checked, check: 'work', licence: `${src.licence.id} (${src.licence.evidence_url})` },
    { url: src.segments.find(s => s.id === 'method-2').url, cite: `ibid., Method 2: the headache caution (used for the beginner form)`, checked: src.licence.checked, check: 'work', licence: src.licence.id },
  ]
  const practice = {
    type: 'practice', schema_version: 2, id: head.id, name: head.name, kind: head.kind, subkind: head.subkind, traditions: head.traditions,
    summary: pick(head.summary).text ?? head.summary.text,
    steps: head.steps.map((s, k) => ({ n: k + 1, text: s.text, cue: 'breath', instr: s.instr })),
    level: pick(head.level), posture: pick(head.posture), eyes: pick(head.eyes), needsTeacher: pick(head.needs_teacher),
    contraindications: head.contraindications.map(c => c.text),
    facets: { method: head.facets.method, locus: [...new Set(ins.filter(i => i.scripted).flatMap(i => i.locus || []))], aim: pick(head.facets.aim), level: pick(head.level), intensity: head.facets.intensity, needs_teacher: pick(head.needs_teacher), needs_teacher_note: head.needs_teacher_note ?? 'Ajaan Lee: study with someone skilled to become expert. Work with signs (lights) is not scripted here.', initiation_required: false },
    safety: { max_hold_s: pick(head.safety.max_hold_s), contraindications: head.contraindications.map(c => c.text.split(':')[0]), stop_if: pick(head.safety.stop_if), beginner_override: pick(head.safety.beginner_override), alternatives: pick(head.safety.alternatives) },
    stages: g.stages,
    script: {
      count_s: 1, params: {},
      rounds: g.roundsCarrier?.rounds || { default: 1, min: 1, max: 1 },
      round_sound: false,
      show: { channels: [], loci: [...new Set(all.flatMap(b => (b.visual || []).filter(c => c.prim === 'locus').map(c => c.locus)))], labels: 'active' },
      intro: sections.intro, round: sections.round, outro: sections.outro,
    },
    sources, teachers: head.teachers,
    derivation: {
      pipeline: 'TEXT-TO-PRACTICE v1', builder: BUILDER, extractor: insDoc.extractor,
      source: { id: src.id, segments: src.segments.filter(s => s.id !== 'copyright').map(s => ({ id: s.id, sha256: s.sha256 })), licence: src.licence.id, licence_evidence: src.licence.evidence_url },
      files: { passages: `pipeline/${head.id}/passages.json`, instructions: `pipeline/${head.id}/instructions.json`, head: `pipeline/${head.id}/head.json`, narration: `pipeline/${head.id}/narration.json`, rules: 'tools/extract/defaults.json' },
      inputs_sha256: sha256(JSON.stringify([insDoc.instructions, head, nar.lines])).slice(0, 16),
      voice_measured: !!voiceManifest,
    },
    provenance: { blocks: g.prov, fields: Object.fromEntries(Object.entries({ summary: head.summary, level: head.level, posture: head.posture, eyes: head.eyes, needs_teacher: head.needs_teacher, aim: head.facets.aim, stop_if: head.safety.stop_if, beginner_override: head.safety.beginner_override, alternatives: head.safety.alternatives }).map(([k, f]) => [k, { basis: f.basis || (f.rule ? 'inferred' : 'paraphrased'), instr: f.instr, rule: f.rule, note: f.note }])) },
    ask: buildAsk(dir, ins, g),
    meta: { created: head.meta.created || '2026-10-21', status: head.meta.status, confidence: head.meta.confidence || 'medium', confidence_note: head.meta.confidence_note || confidenceNote(ins, g), license: head.meta.license, license_note: head.meta.license_note },
  }
  for (const [k, f] of Object.entries(practice.provenance.fields)) if (!f.instr?.length && !f.rule && k !== 'needs_teacher' && f.basis !== 'quoted') errors.push(`field ${k}: neither instructions nor a rule`)
  // compile + timing slots: every line must end (measured/estimated) before the next line starts
  const slots = []
  for (const opts of [{}, { beginner: true }]) {
    const tl = compile(practice, grammar, opts)
    if (tl.warnings.length) errors.push(`compile${opts.beginner ? ' (beginner)' : ''}: ${tl.warnings.join('; ')}`)
    const V = tl.tracks.voice.filter(x => x.say)
    V.forEach((x, k) => {
      const ln = lineOf.get(x.block); if (!ln) return
      const avail = (V[k + 1]?.t ?? tl.total_s) - x.t, need = est(ln) + rules['narration-margin'].value.s
      if (!opts.beginner) slots.push({ line: ln.id, block: x.block, t: x.t, avail_s: Math.round(avail * 100) / 100, speech_s: Math.round(est(ln) * 100) / 100, measured: vm.has(ln.id) && vm.get(ln.id).text === ln.text })
      if (need > avail + 1e-6) errors.push(`${ln.id}${opts.beginner ? ' (beginner)' : ''}: needs ${need.toFixed(2)} s, only ${avail.toFixed(2)} s before the next line`)
    })
  }
  return { practice, report: { errors, warnings, slots } }
}

function confidenceNote(ins, g) {
  const inf = Object.values(g.prov).filter(p => p && Object.values(p).some(x => x?.basis === 'inferred')).length
  return `Built by the text-to-practice pipeline from Method 1 (every block lists its instructions and every unstated number its rule). ${ins.filter(i => i.scripted).length} of ${ins.length} extracted instructions are scripted; work with signs/lights, the powers passage and the knowledge teaching are not. ${inf} blocks carry inferred timing (breath pace ${'5/6 s'}, 'a moment' = one breath, back-and-forth paced on the breath, the 3rd–4th base count of seven by analogy).`
}

function buildAsk(dir, ins, g) {
  const f = path.join(dir, 'ask.json'); if (!fs.existsSync(f)) return undefined
  const a = readJSON(f), I = new Map(ins.map(i => [i.id, i]))
  for (const q of a.preload) for (const id of q.instr || []) if (!I.has(id)) throw new Error(`ask ${q.id}: unknown instruction ${id}`)
  return { phases: g.stages.map(s => s.id), preload: a.preload.map(q => ({ ...q, sources: [...new Set((q.instr || []).flatMap(id => I.get(id).spans.map(s => s.passage)))] })) }
}

if (process.argv[1]?.endsWith('build-practice.mjs')) {
  const a = process.argv.slice(2), dir = path.resolve(a[0]), vi = a.indexOf('--voice')
  const voiceManifest = vi >= 0 && fs.existsSync(a[vi + 1]) ? readJSON(a[vi + 1]) : undefined
  const { practice, report } = build(dir, { voiceManifest })
  writeJSON(path.join(dir, 'build-report.json'), report)
  for (const e of report.errors) console.error('ERROR', e)
  for (const w of report.warnings) console.error('warn ', w)
  if (report.errors.length) { process.exitCode = 1; console.error('not written: fix the errors above'); }
  else { writeJSON(path.join(ENGINE, 'practices', practice.id + '.json'), practice); console.log(`practices/${practice.id}.json · ${report.slots.length} narrated lines · voice ${voiceManifest ? 'measured' : 'estimated'}`) }
}
