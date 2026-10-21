// node talk/test-talk.mjs : the /talk/ mock flow end to end on a headless player (no key, no network, no browser).
// interrupt mid-hold → "slower please" → replay_phase(slow) via the fake model's tool call → "hold longer" refused → "I feel dizzy"
// handled by safety before the model → resume gently, no more holds.
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import { compile } from '../compile.mjs'
import { createSimPort } from '../rt/player-port.mjs'
import { createTalkFlow } from './flow.mjs'
import { SCRIPTS } from '../rt/safety.mjs'

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const J = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'))
const grammar = J('grammar.json'), practice = J('practices/nadi-shodhana-sivananda.json')
let n = 0, fail = 0
const ok = (c, m) => { n++; if (!c) { fail++; console.error('FAIL', m) } }

const sim = createSimPort({ compile, grammar, practice })
const spoken = [], events = []
const flow = await createTalkFlow({ port: sim.port, practice, grammar, onEvent: e => events.push(e), speakModel: t => spoken.push(t) })
const { bus } = flow
const run = s => sim.advance(s, bus.tick)

ok(flow.fake.state.session?.tools?.length >= 12 && flow.fake.state.session.tools[0].function, 'fake model received Qwen-shaped tools in session.update')
bus.exec('play', {}, { source: 'user' }); run(20)                       // t=20: inside the first hold (10..26)
ok(bus.index.at(sim.st.t).phase === 'hold_in', 'practising, mid-hold')

// 1. interrupt
const bi = flow.talkStart()
ok(bi.ok && bi.released && !sim.st.playing && sim.st.ducked, 'interrupt: hold released, practice paused, narration ducked')
ok(Math.abs(sim.st.t - 26) < 1e-6, 'paused at the out-breath (never frozen in retention)')

// 2. "slower please" → replay_phase(slow)
const r = flow.say('slower please')
ok(r.routed === 'model', '"slower please" goes to the model')
const call = events.find(e => e.dir === 'tool' && e.name === 'replay_phase')
ok(call && JSON.parse(call.arguments).slow === true && JSON.parse(call.output).ok, 'fake model called replay_phase{slow:true}; bus accepted')
ok(sim.st.playing && sim.st.speed === 0.75 && sim.st.t === 6, 'player replays in-L at 0.75×')
ok(spoken.some(t => /slowly/.test(t)), 'model spoke its follow-up after the function output')
run(6); ok(sim.st.t >= 26 && sim.st.speed === 1, `back at the out-breath at normal speed (t=${sim.st.t.toFixed(2)})`)

// 3. "can I hold longer?" → refused by the guard, model explains
run(9)                                                                  // into in-R / hold_in-2
flow.talkStart()
flow.say('can I hold it longer?')
const ext = events.filter(e => e.dir === 'tool' && e.name === 'extend_pause').pop()
ok(ext && JSON.parse(ext.output).ok === false, `extend_pause refused outside a silence pause (${ext?.output})`)
ok(spoken.some(t => /can't lengthen the holds/.test(t)), 'model explains the refusal')
bus.exec('resume', {}, { source: 'user' }); run(3)

// 4. safety: "I feel dizzy" never reaches the model
const heardBefore = flow.fake.state.heard.length, turnsBefore = flow.client.stats.modelTurns
flow.talkStart()
const s = flow.say('I feel dizzy')
ok(s.routed === 'safety' && s.triage.intent === 'dizzy', 'dizzy → safety route')
ok(flow.fake.state.heard.length === heardBefore && flow.client.stats.modelTurns === turnsBefore, 'the model heard nothing and opened no turn')
ok(sim.calls.some(([k, a]) => k === 'speak' && a === SCRIPTS.stop.dizzy), 'fixed safety wording spoken')
ok(!sim.st.playing && sim.st.tl.opts.beginner, 'paused and switched to the gentler form')
ok(JSON.parse(JSON.stringify(bus.exec('resume', {}, { source: 'model' }))).reason === 'locked_after_safety', 'model cannot restart the practice')
const ret = bus.state.played.retention_s
bus.exec('resume', {}, { source: 'user' }); run(120)
ok(bus.state.played.retention_s - ret < 0.01, 'resumed gently: no further holds')

// 5. a barge-in while the model is mid-answer cancels it
const rid = flow.fake.beginLongAnswer()
const cancels = flow.fake.state.received.filter(e => e.type === 'response.cancel').length
flow.talkStart()
ok(flow.fake.state.received.filter(e => e.type === 'response.cancel').length === cancels + 1 && flow.audioOut.stopped > 0, 'barge-in during a model answer → response.cancel + audio cut')

console.log(fail ? `${fail} of ${n} checks FAILED` : `ok ${n} checks`)
process.exitCode = fail ? 1 : 0
