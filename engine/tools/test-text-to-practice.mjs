// node tools/test-text-to-practice.mjs: the text → practice pipeline and its worked example (Ajahn Lee, Method 1).
// Determinism (re-run every deterministic stage and compare), provenance (every span re-checks against the hashed source),
// the validators' teeth (tampered artefacts must fail), safety (no holds, beginner form), timing (measured voice fits its slots),
// media (every line has a clip, loudness), schemas (python jsonschema).
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { compile } from '../compile.mjs'
import { sha256, readJSON } from './extract/lib.mjs'
import { passages as segmentPassages } from './extract/segment.mjs'
import { finish } from './extract/extract.mjs'
import { validateInstructions, validateNarration } from './extract/validate.mjs'
import { build } from './extract/build-practice.mjs'
const E = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const P = path.join(E, 'pipeline', 'ajahn-lee-method-1'), SRC = path.join(E, 'sources', 'keeping-the-breath')
const J = f => readJSON(path.join(P, f)), grammar = readJSON(path.join(E, 'grammar.json')), rules = readJSON(path.join(E, 'tools/extract/defaults.json')).rules
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++ }

// 1. SourceText: hashes match the stored text; licence evidence is verbatim on the copyright page
const st = readJSON(path.join(SRC, 'source-text.json'))
for (const s of st.segments) ok(sha256(fs.readFileSync(path.join(SRC, s.file), 'utf8')) === s.sha256, `segment ${s.id} hash`)
ok(fs.readFileSync(path.join(SRC, 'copyright.txt'), 'utf8').includes(st.licence.evidence_quote), 'licence quote on the copyright page')
ok(st.licence.id === 'CC-BY-NC-4.0' && st.licence.terms.noncommercial, 'licence recorded as CC BY-NC 4.0')

// 2. Passages: deterministic, and every passage is exactly its offsets in the source
const pd = J('passages.json')
const again = segmentPassages(st, SRC, ['method-1', 'method-2'])
ok(JSON.stringify(again) === JSON.stringify(pd.passages), 'segment.mjs is deterministic')
const text = Object.fromEntries(st.segments.map(s => [s.id, fs.readFileSync(path.join(SRC, s.file), 'utf8')]))
ok(pd.passages.every(p => text[p.segment].slice(p.start, p.end) === p.text), 'every passage = its offsets')

// 3. Instructions: resolution is deterministic; every instruction has a span that re-checks against the source; no errors
const ins = J('instructions.json'), draft = J('instructions.draft.json')
const re = finish(draft, pd, { mode: ins.extractor.mode })
ok(JSON.stringify(re.instructions) === JSON.stringify(ins.instructions), 'extract.mjs resolution is deterministic')
ok(ins.validation.errors.length === 0, 'instructions validate')
ok(ins.instructions.every(i => i.spans.length && i.spans.every(s => text[s.segment].slice(s.start, s.end) === s.quote)), 'every instruction has spans that reproduce in the source')
ok(!ins.coverage.some(c => c.status === 'uncovered'), 'no actionable passage silently dropped')
const inferredCounts = ins.instructions.filter(i => i.prov?.count?.basis === 'inferred').map(i => i.id)
ok(inferredCounts.includes('i33') && inferredCounts.includes('i12'), 'the counts the text omits are flagged inferred (i12 stillness, i33 third→fourth base)')
// teeth: tampering must fail
const bad = structuredClone(ins); bad.instructions.find(i => i.id === 'i08').count.value = 12
ok(validateInstructions(bad, pd.passages, grammar, rules).errors.some(e => e.includes('i08') && e.includes('count')), 'a count the text does not give fails')
const bad2 = structuredClone(ins); bad2.instructions.find(i => i.id === 'i33').prov.count = { basis: 'inferred' }
ok(validateInstructions(bad2, pd.passages, grammar, rules).errors.some(e => e.includes('i33')), 'inferred without a rule fails')
const bad3 = structuredClone(ins); bad3.instructions.find(i => i.id === 'i24').spans[0].start += 3
ok(validateInstructions(bad3, pd.passages, grammar, rules).errors.some(e => e.includes('i24') && e.includes('offsets')), 'shifted offsets fail')
const bad4 = structuredClone(draft); bad4.instructions[0].spans[0].quote = 'Sit in a full-lotus position'
ok(finish(bad4, pd, {}).validation.errors.some(e => e.includes('not verbatim')), 'a non-verbatim quote fails')
const bad5 = structuredClone(ins); delete bad5.instructions.find(i => i.id === 'i14').prov
ok(validateInstructions(bad5, pd.passages, grammar, rules).errors.some(e => e.includes('i14') && e.includes('locus')), 'a body place the quote does not name needs provenance')

// 4. Narration: lint passes; unsupported claims fail
const nar = J('narration.json'), prac = readJSON(path.join(E, 'practices', 'ajahn-lee-method-1.json'))
const ids = []; const walk = bs => { for (const b of bs) { if (b.id) ids.push(b.id); if (b.blocks) walk(b.blocks) } }; for (const k of ['intro', 'round', 'outro']) walk(prac.script[k])
ok(validateNarration(nar, ins.instructions, grammar, ids).errors.length === 0, 'narration lint passes')
const n1 = structuredClone(nar); n1.lines.find(l => l.id === 'L39').text = 'Back and forth between these two spots, seven times.'
ok(validateNarration(n1, ins.instructions, grammar, ids).errors.some(e => e.includes('L39') && e.includes('inferred')), 'saying an inferred count without an inferred tag fails')
const n2 = structuredClone(nar); n2.lines.find(l => l.id === 'L13').text = 'One buddho per breath. Twenty breaths.'
ok(validateNarration(n2, ins.instructions, grammar, ids).errors.some(e => e.includes('L13')), 'a number the source does not support fails')
const n3 = structuredClone(nar); n3.lines.push({ id: 'L99', block: 'close', basis: 'paraphrased', instructions: ['i38'], text: 'Now see the white light.' })
ok(validateNarration(n3, ins.instructions, grammar, ids).errors.some(e => e.includes('unscripted')), 'narrating an unscripted instruction (light sign) fails')
ok(nar.lines.filter(l => l.quote).every(l => l.quote.text.split(/\s+/).length <= 25), 'quote lines ≤ 25 words')

// 5. Practice: the builder is deterministic; provenance on every block; every inferred number names a rule
const vm = readJSON(path.join(E, 'renders/ajahn-lee-method-1/voice/manifest.json'))
const { practice: rebuilt, report } = build(P, { voiceManifest: vm })
ok(report.errors.length === 0, 'build has no errors: ' + report.errors.join('; '))
ok(JSON.stringify(rebuilt) === JSON.stringify(prac), 'build-practice.mjs is deterministic (committed practice == rebuild)')
ok(ids.every(id => prac.provenance.blocks[id] && (prac.provenance.blocks[id].instr?.length || Object.values(prac.provenance.blocks[id]).some(x => x?.rule))), 'every block has instructions or a rule')
const provs = Object.values(prac.provenance.blocks).flatMap(b => Object.values(b || {}).filter(x => x && typeof x === 'object' && x.basis))
ok(provs.filter(x => x.basis === 'inferred').every(x => rules[x.rule] || x.cite), 'every inferred value names a known rule or a cited span')
ok(prac.steps.every(s => s.instr.every(id => ins.instructions.some(i => i.id === id))), 'steps cite real instructions')

// 6. Timeline + safety
const tl = compile(prac, grammar, {}), tb = compile(prac, grammar, { beginner: true })
ok(JSON.stringify(tl) === JSON.stringify(J('timeline.json')), 'committed timeline == compile(practice)')
ok(tl.warnings.length === 0 && tb.warnings.length === 0, 'compiles cleanly')
ok(tl.physiology.retention_max_s === 0 && !tl.tracks.breath.some(b => b.phase.startsWith('hold')), 'no breath holds anywhere (the text has none)')
const stages = tl.tracks.markers.filter(m => m.kind === 'stage').map(m => m.stage)
ok(JSON.stringify(stages) === JSON.stringify(prac.stages.map(s => s.id)), 'stage markers in order = ask phases')
ok(!tb.tracks.markers.some(m => m.stage === 'bases') && tb.safety.applied.some(a => a.includes('bases')), 'beginner form skips the head bases (Method 2 headache caution)')
ok(!compile(prac, grammar, { skip_stages: ['recollection'] }).tracks.voice.some(v => v.stage === 'recollection'), 'the devotional stage can be skipped')
const cnt = id => { const b = prac.script.intro.find(x => x.id === id) || prac.script.outro.find(x => x.id === id); return b?.repeat }
ok(cnt('i08') === 10 && cnt('i09') === 7 && cnt('i10') === 5, 'quoted counts reach the script (10, 7, 5)')
ok(tl.tracks.breath.filter(b => b.stage === undefined && b.label === 'buddho ×3').length === 3, 'three breaths of buddho ×3')
ok(prac.ask.preload.every(q => q.sources.length && q.phase.every(ph => prac.stages.some(s => s.id === ph))), 'every Ask preload has source spans and real phase ids')

// 7. Media: every spoken line has a measured clip that fits its slot; mix loudness
const clips = new Map(vm.lines.map(l => [l.text, l]))
ok(tl.tracks.voice.filter(v => v.say).every(v => clips.has(v.text) && fs.existsSync(path.join(E, clips.get(v.text).file))), 'every spoken line has a clip')
ok(report.slots.every(s => s.measured && s.speech_s + rules['narration-margin'].value.s <= s.avail_s + 1e-6), 'measured speech fits every slot')
ok(!/teacher|ajahn|thanissaro|lee/i.test(vm.voice.title) && /not named after or cloned/.test(vm.voice.policy), 'the voice is a generic library voice, not a teacher')
ok(vm.lines.reduce((s, l) => s + (l.match ?? 0), 0) / vm.lines.length >= 0.9, 'whisper hears ≥ 90% of the script words')
for (const m of ['session', 'preview']) { const r = readJSON(path.join(E, `renders/ajahn-lee-method-1/mix/${m}.json`)); ok(Math.abs(r.integrated_lufs + 14) <= 0.5 && r.true_peak_dbtp <= -1, `${m} mix at -14 LUFS, TP ≤ -1 dBTP`) }

// 8. Schemas
execFileSync('python3', [path.join(E, 'tools/validate-schemas.py')], { stdio: 'pipe' }); ok(true, 'schemas')
console.log(`ok ${n} checks`)
