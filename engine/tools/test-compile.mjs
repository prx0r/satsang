// node tools/test-compile.mjs: compiler checks (safety caps, beginner override, loops, address validation) on all demo practices.
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import assert from 'node:assert/strict'
import { compile } from '../compile.mjs'
const here = path.dirname(url.fileURLToPath(import.meta.url)), root = path.join(here, '..')
const grammar = JSON.parse(fs.readFileSync(path.join(root, 'grammar.json'), 'utf8'))
const load = f => JSON.parse(fs.readFileSync(path.join(root, 'practices', f), 'utf8'))
let n = 0
const ok = (c, m) => { assert.ok(c, m); n++ }

// 1. every demo practice compiles cleanly in both modes; holds respect caps
for (const f of fs.readdirSync(path.join(root, 'practices'))) {
  const p = load(f)
  for (const beginner of [false, true]) {
    const tl = compile(p, grammar, { beginner })
    ok(tl.warnings.length === 0, `${f} warnings: ${tl.warnings}`)
    ok(tl.total_s > 30, `${f} too short`)
    const holds = tl.tracks.breath.filter(b => b.phase.startsWith('hold'))
    ok(holds.every(h => h.dur <= 30), `${f} hold > 30 s`)
    if (beginner) ok(holds.every(h => h.dur <= 10), `${f} beginner hold > 10 s`)
    const ts = tl.tracks.breath.map(b => b.t); ok(ts.every((t, i) => !i || t >= ts[i - 1]), `${f} breath not monotonic`)
  }
}
// 2. Nadi Shodhana: 1:4:2 with 4 s counts → 16 s holds; beginner → no holds
const ns = load('nadi-shodhana-sivananda.json')
let tl = compile(ns, grammar, {})
ok(tl.physiology.retention_max_s === 16, 'nadi hold 16 s')
ok(tl.tracks.breath.filter(b => b.phase === 'hold_in').length === 2 * tl.loops, 'two holds per round')
tl = compile(ns, grammar, { beginner: true })
ok(tl.tracks.breath.filter(b => b.phase === 'hold_in').length === 0, 'beginner strips holds')
// 3. caps: an over-long ratio is capped at 30 s; with beginner and no override, holds > 10 s are removed
const hot = structuredClone(ns); hot.script.params.ratio = [10, 40, 20, 0]; delete hot.safety.beginner_override
tl = compile(hot, grammar, {}); ok(tl.physiology.retention_max_s === 30 && tl.safety.applied.some(a => a.includes('capped')), 'cap 30 s')
tl = compile(hot, grammar, { beginner: true }); ok(tl.physiology.retention_max_s === 0 && tl.safety.applied.some(a => a.includes('removed')), 'beginner strip > 10 s')
const mild = structuredClone(hot); mild.script.params.ratio = [4, 8, 8, 0]
tl = compile(mild, grammar, { beginner: true }); ok(tl.physiology.retention_max_s === 8, 'beginner keeps holds ≤ 10 s')
// 4. rounds clamp + counts→seconds
tl = compile(ns, grammar, { rounds: 999 }); ok(tl.loops === 20, 'rounds clamp to max')
tl = compile(ns, grammar, { count_s: 1.5, rounds: 1 }); ok(tl.tracks.breath.find(b => b.phase === 'hold_in').dur === 24, 'count_s scales')
// 5. kapalabhati strokes from params, beginner 10
const kb = load('kapalabhati-sivananda.json')
ok(compile(kb, grammar, { rounds: 1 }).tracks.breath.filter(b => b.stroke).length === 40, '20 strokes = 40 half-phases')
ok(compile(kb, grammar, { beginner: true, rounds: 1 }).tracks.breath.filter(b => b.stroke).length === 20, 'beginner 10 strokes')
// 6. unknown addresses are reported
const bad = structuredClone(ns); bad.script.round[0].do[0].along = 'no-such-nadi'
ok(compile(bad, grammar, {}).warnings.some(w => w.includes('no-such-nadi')), 'unknown path warned')
console.log(`ok ${n} checks`)
