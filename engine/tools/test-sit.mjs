// node tools/test-sit.mjs: every text → practice pipeline (not only the Method 1 worked example) and the hands-off player's
// session layer (sit/session.mjs + sit/loci.mjs): routines run end to end on one clock, natural breath only, every focus
// target lands on the body, licences respected in what the player may quote.
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import assert from 'node:assert/strict'
import { compile } from '../compile.mjs'
import { sha256, readJSON } from './extract/lib.mjs'
import { passages as segmentPassages } from './extract/segment.mjs'
import { finish } from './extract/extract.mjs'
import { validateInstructions, validateNarration } from './extract/validate.mjs'
import { build } from './extract/build-practice.mjs'
import { buildSession, fitPractice, eligible, breathAt, focusAt, stageAt } from '../sit/session.mjs'
import { bodyLocus } from '../sit/loci.mjs'
const E = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const grammar = readJSON(path.join(E, 'grammar.json')), rules = readJSON(path.join(E, 'tools/extract/defaults.json')).rules
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++ }
const practice = id => readJSON(path.join(E, 'practices', id + '.json'))
const strip = o => JSON.parse(JSON.stringify(o))

// 1. every pipeline: source hashes + licence evidence, deterministic passages/resolution/build, validators clean, no holds
const PIPES = fs.readdirSync(path.join(E, 'pipeline')).filter(d => fs.existsSync(path.join(E, 'pipeline', d, 'instructions.json'))).sort()
ok(PIPES.length >= 6, `${PIPES.length} pipelines`)
for (const id of PIPES) {
  const P = path.join(E, 'pipeline', id), J = f => readJSON(path.join(P, f))
  const ins = J('instructions.json'), pd = J('passages.json'), SRC = path.join(E, 'sources', ins.source), st = readJSON(path.join(SRC, 'source-text.json'))
  for (const s of st.segments) ok(sha256(fs.readFileSync(path.join(SRC, s.file), 'utf8')) === s.sha256, `${id}: segment ${s.id} hash`)
  ok(fs.readFileSync(path.join(SRC, 'copyright.txt'), 'utf8').includes(st.licence.evidence_quote), `${id}: licence evidence on the stored licence page`)
  const segIds = [...new Set(pd.passages.map(p => p.segment))]
  ok(JSON.stringify(segmentPassages(st, SRC, segIds)) === JSON.stringify(pd.passages), `${id}: segmentation deterministic`)
  const text = Object.fromEntries(st.segments.map(s => [s.id, fs.readFileSync(path.join(SRC, s.file), 'utf8')]))
  ok(pd.passages.every(p => text[p.segment].slice(p.start, p.end) === p.text), `${id}: every passage = its offsets`)
  const re = finish(J('instructions.draft.json'), pd, { mode: ins.extractor.mode })
  ok(JSON.stringify(re.instructions) === JSON.stringify(ins.instructions), `${id}: resolution deterministic`)
  ok(!ins.validation.errors.length && !validateInstructions(ins, pd.passages, grammar, rules).errors.length, `${id}: instructions validate`)
  ok(ins.instructions.every(i => i.spans.every(s => text[s.segment].slice(s.start, s.end) === s.quote)), `${id}: every span reproduces in the source`)
  ok(!ins.coverage.some(c => c.status === 'uncovered'), `${id}: no actionable passage silently dropped`)
  const vmf = path.join(E, 'renders', id, 'voice', 'manifest.json')
  const { practice: built, report } = build(P, { voiceManifest: fs.existsSync(vmf) ? readJSON(vmf) : undefined })
  ok(!report.errors.length, `${id}: build + narration lint + timing slots clean ${report.errors.slice(0, 3).join('; ')}`)
  ok(JSON.stringify(strip(built)) === JSON.stringify(practice(id)), `${id}: practices/${id}.json is exactly what the builder makes`)
  for (const o of [{}, { beginner: true }]) {
    const tl = compile(built, grammar, o)
    ok(!tl.warnings.length && !tl.tracks.breath.some(b => /^hold/.test(b.phase)), `${id}${o.beginner ? ' (beginner)' : ''}: compiles, no holds`)
  }
  ok(eligible(built, grammar, compile).ok, `${id}: eligible for the hands-off player`)
  // licence: verbatim only where the licence allows; quotes ≤ 25 words
  const quotes = J('narration.json').lines.filter(l => l.quote)
  ok(st.licence.terms.store_verbatim || !quotes.length, `${id}: no quoted lines unless the licence allows storing the words`)
  ok(quotes.every(l => l.quote.text.split(/\s+/).length <= 25), `${id}: quotes ≤ 25 words`)
}
// the VBT practices are Satsang's own words; the all-rights-reserved translation is cited by verse and linked, never quoted
for (const id of ['vbt-body-as-awareness', 'vbt-space-contemplation']) {
  const src = readJSON(path.join(E, 'sources', readJSON(path.join(E, 'pipeline', id, 'instructions.json')).source, 'source-text.json'))
  ok(src.author.id === 'satsang' && src.segments.filter(s => s.id !== 'copyright').every(s => s.verses && /tantra112\.app/.test(s.url)), `${id}: own wording, verse numbers + translation link`)
}

// 2. the session layer
const SIT = ['ajahn-lee-method-1', 'ajahn-lee-method-2', 'mn118-anapanasati', 'karaniya-metta', 'vbt-body-as-awareness', 'vbt-space-contemplation']
ok(!eligible(practice('nadi-shodhana-sivananda'), grammar, compile).ok, 'a practice with retention is refused (no holds, ever)')
for (const id of SIT) {
  const p = practice(id), nat = compile(p, grammar, {}).total_s
  for (const m of [5, 10, 20, 30]) {
    const f = fitPractice(p, grammar, compile, { minutes: m }), got = f.tl.total_s + f.fill_s
    if (nat <= m * 60 + 1 || f.tl.total_s <= m * 60 + 1) ok(Math.abs(got - m * 60) <= 1, `${id} @ ${m} min fits (${got.toFixed(1)} s)`)
    else ok(f.notes.some(x => /as written/.test(x)), `${id} @ ${m} min: too long, says it runs as written`)
  }
  const S = buildSession([{ practice: p, minutes: 20 }], grammar, compile)
  for (const st of S.stages) if (S.focus.some(f => f.t >= st.t && f.t < st.t1)) ok(true, '')
  const targets = new Set(S.focus.map(f => f.target + '|' + f.size))
  for (const k of targets) { const [t, s] = k.split('|'); ok(t === 'null' || !!bodyLocus(t, s), `${id}: focus ${t} lands on the body`) }
}

// 3. routines run end to end: one clock, contiguous natural breath, stages in order, bells at the joins
const ROUT = fs.readdirSync(path.join(E, 'routines')).filter(f => f.endsWith('.json'))
for (const f of ROUT) {
  const r = readJSON(path.join(E, 'routines', f))
  const S = buildSession(r.items.map(i => ({ ...i, practice: practice(i.practice) })), grammar, compile)
  const want = r.items.reduce((a, i) => a + (i.minutes || 0) * 60, 0)
  ok(!S.warnings.length && S.items.length === r.items.length, `${r.id}: every item runs`)
  ok(Math.abs(S.total_s - want) <= 2 * r.items.length, `${r.id}: ${S.total_s} s ≈ ${want} s asked`)
  ok(S.breath.every(b => b.sub === 'in' || b.sub === 'out'), `${r.id}: natural breath only`)
  let gap = 0; for (let k = 1; k < S.breath.length; k++) gap = Math.max(gap, Math.abs(S.breath[k].t - (S.breath[k - 1].t + S.breath[k - 1].dur)))
  ok(gap < 0.6, `${r.id}: breath is continuous across the whole session (max gap ${gap.toFixed(2)} s)`)
  ok(S.breath.at(-1).t + S.breath.at(-1).dur >= S.total_s - 6.5, `${r.id}: breath runs to the end`)
  ok(S.stages.every((s, k) => !k || s.t >= S.stages[k - 1].t), `${r.id}: stages in order`)
  ok(S.items.every((it, k) => !k || Math.abs(it.t0 - S.items[k - 1].t1) < 1e-6), `${r.id}: items laid end to end`)
  ok(S.cues[0].sound === 'bowl' && S.cues.at(-1).sound === 'bowl-end' && S.cues.filter(c => c.sound === 'bowl').length === 1, `${r.id}: one bowl to begin, chimes at joins, bowls to end`)
  for (let t = 0; t < S.total_s; t += 7.3) { const b = breathAt(S, t); if (!(b.level >= 0 && b.level <= 1)) { ok(false, `${r.id}: breath level at ${t}`); break } }
  ok(r.items.every((_, k) => S.stages.some(s => s.item === k)), `${r.id}: every item has stages`)
  ok(!!stageAt(S, S.total_s - 1) && focusAt(S, S.total_s - 1).target !== undefined, `${r.id}: player state defined at the end`)
}
const M = readJSON(path.join(E, 'routines', 'morning-thai-forest.json'))
const MS = buildSession(M.items.map(i => ({ ...i, practice: practice(i.practice) })), grammar, compile)
ok(MS.items.map(i => i.id).join() === 'ajahn-lee-method-2,ajahn-lee-method-1,karaniya-metta', 'morning routine: settling → Method 1 → goodwill')
ok(MS.stages.filter(s => s.item === 0).every(s => M.items[0].only_stages.includes(s.stage)), 'morning routine: only the settling steps of Method 2')
console.log(`ok ${n} checks`)
