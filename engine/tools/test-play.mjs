// Milestone-1 checks: SVG figure geometry, sound wave, shared clock (gates, pauses, hold-open, rest timer), the Trace the Sound play.
// usage: node tools/test-play.mjs
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import { compile } from '../compile.mjs'
import { breathState } from '../body/breath.mjs'
import { frontPaths, sidePaths, airflow } from '../body/figure.mjs'
import { waveAt, wavePoints, FLAT } from '../fx/wave.mjs'
import { createClock, segmentsOf } from '../player/clock.mjs'

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const J = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'))
let n = 0, bad = 0
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL', m) } }
const grammar = J('grammar.json'), P = J('practices/vbt-trace-the-sound.json'), M = J('renders/vbt-trace-the-sound/voice/manifest.json')
const speech_s = Object.fromEntries(M.lines.map(l => [l.spoken, l.dur_s]))
const tl = compile(P, grammar, { speech_s })
const num = s => (s.match(/-?\d+(\.\d+)?/g) || []).map(Number)

// ---- figure ----
const paced = { total_s: 20, tracks: { breath: [{ t: 0, dur: 4, phase: 'in', vol0: 0.05, vol1: 1 }, { t: 4, dur: 6, phase: 'out', vol0: 1, vol1: 0.05 }] } }
const emptyS = breathState(paced, 0.01, { style: 'full' }), fullS = breathState(paced, 3.99, { style: 'full' })
const F0 = frontPaths(emptyS), F1 = frontPaths(fullS), S0 = sidePaths(emptyS), S1 = sidePaths(fullS)
for (const [name, P0] of [['front', F0], ['side', S0]]) for (const [k, d] of Object.entries(P0)) ok(/^M/.test(d) && num(d).every(Number.isFinite), `${name}.${k} is a finite svg path`)
ok(Object.keys(F0).length >= 18 && Object.keys(S0).length >= 10, 'front and side views have their parts (lungs, diaphragm, ribs, collarbones, belly)')
ok(F0.torso !== F1.torso, 'front torso changes with the breath')
const maxX = d => Math.max(...num(d).filter((_, i) => i % 2 === 0))
ok(maxX(F1.ribsL) > maxX(F0.ribsL) + 0.02 && maxX(F1.lungL) > maxX(F0.lungL) + 0.02, 'ribs open and lungs widen on a full inhale')
const meanY = d => { const v = num(d).filter((_, i) => i % 2 === 1); return v.reduce((a, b) => a + b, 0) / v.length }
ok(meanY(F1.diaphragm) > meanY(F0.diaphragm) + 0.1, 'diaphragm descends when full (svg y grows downward)')
ok(maxX(S1.torso) > maxX(S0.torso) + 0.1, 'side view: chest and belly move forward on the inhale')
ok(meanY(F1.clavL) < meanY(F0.clavL), 'collarbones lift at the top of the breath')
const clavS = frontPaths(breathState(paced, 3.99, { style: 'clavicular' })), abdS = frontPaths(breathState(paced, 3.99, { style: 'abdominal' }))
ok(meanY(clavS.armL) < meanY(abdS.armL) - 0.01, 'clavicular breath lifts the shoulders; abdominal does not')
// release order: at mid-exhale the collarbones have let go before the belly
const mid = breathState(paced, 6.2, { style: 'full' })
ok(mid.clav < 0.3 && mid.belly > 0.6, `exhale releases top-down (clav ${mid.clav.toFixed(2)}, belly ${mid.belly.toFixed(2)})`)
const ain = airflow('front', breathState(paced, 2, { style: 'full' }), 2), aout = airflow('front', breathState(paced, 7, { style: 'full' }), 7)
ok(ain.length > 0 && aout.length > 0, 'airflow streaks while breathing in and out')
ok(airflow('front', fullS, 3.99, { reduced: true }).length === 0, 'reduced motion: no airflow streaks')
ok(airflow('side', breathState(paced, 2), 2).every(a => num(a.d)[0] > 0.45), 'side airflow leaves at the nose (front of the face)')
ok(frontPaths(fullS, { gain: 0.45 }).torso !== F1.torso && maxX(frontPaths(fullS, { gain: 0.45 }).torso) < maxX(F1.torso), 'reduced motion: gentler breathing (gain 0.45)')
const restS = breathState(tl, 20), restS2 = breathState(tl, 25)
ok(restS.phase === 'rest' && Math.abs(restS.vol - restS2.vol) > 0.01, 'the play breathes a quiet tidal breath during speech and pauses')

// ---- wave ----
const segs = segmentsOf(tl), S = Object.fromEntries(segs.map(s => [s.id, s]))
const wA = waveAt(tl, S['find-a-sound'].t + 2, 0.8), wB = waveAt(tl, S['fading'].end - 1, 0), wC = waveAt(tl, S['whats-left'].end - 1, 0)
ok(wA.on && wA.amp > 0.7, 'wave is bright while the voice finds the sound')
ok(wB.amp < wA.amp * 0.4, 'wave fades during the fading pause')
ok(wC.flat && wC.hold, 'flat line held after "what is left"')
ok(waveAt(tl, S['always-there'].t + 3, 1).flat, 'flat line stays flat through the last line')
ok(waveAt(tl, S['find-a-sound'].t + 2, 1).amp > waveAt(tl, S['find-a-sound'].t + 2, 0).amp, 'the wave answers the voice (voice_react)')
const pts = wavePoints(wA, 3, 101)
ok(Math.abs(pts[0][1]) < 1e-6 && Math.abs(pts[100][1]) < 1e-6, 'wave tapers to nothing at the stage edges')
ok(pts.length === 101 && pts.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y)), 'wave points finite')
ok(JSON.stringify(wavePoints(wA, 1, 40, { reduced: true })) === JSON.stringify(wavePoints(wA, 9, 40, { reduced: true })), 'reduced motion: the wave shape holds still')
const wIn = waveAt(tl, S['trace-inward'].end - 1, 0), pi = wavePoints(wIn, 2, 201)
const outer = Math.max(...pi.filter(([x]) => Math.abs(x) > 0.6).map(([, y]) => Math.abs(y))), inner = Math.max(...pi.filter(([x]) => Math.abs(x) < 0.25).map(([, y]) => Math.abs(y)))
ok(wIn.inward > 0.5 && inner > outer * 1.5, 'traced inward: the outer wave quietens first, the centre (head) stays')

// ---- the play's timeline ----
ok(tl.mode === 'play' && tl.warnings.length === 0, 'Trace compiles as a play with no warnings')
ok(segs.length === 7 && segs.every(s => s.voice?.gate), '7 segments, every line gated')
for (const l of M.lines) { const s = S[l.id]; ok(s && Math.abs((s.speak_end - s.t) - l.dur_s) < 0.01, `speak window = measured clip (${l.id} ${l.dur_s}s)`) }
ok(segs[segs.length - 1].hold_open && !segs.slice(0, -1).some(s => s.hold_open), 'only the last segment holds open')
ok(tl.total_s > 90 && tl.total_s < 240, `short and repeatable (${tl.total_s}s)`)
ok(!tl.tracks.breath.some(b => b.phase === 'hold_in' || b.phase === 'hold_out'), 'no retention anywhere')
ok(S['whats-left'].end - S['whats-left'].speak_end >= 25, 'the long silence after "what is left" (≥ 25 s)')
ok(segs.every(s => s.end > s.speak_end), 'every line is followed by a pause')
ok(segs.filter(s => s.flat).length === 2, 'flat line in the last two segments')
const src = JSON.stringify(P.sources)
ok(/hareesh\.org\/blog\/2024\/10\/1/.test(src) && /hareesh\.org\/blog\/2024\/12\/7/.test(src) && /38-41/.test(src), 'cites Hareesh VBT vv. 38-41 by link + verse numbers')
ok(P.sources.every(s => !s.quote && !s.text) && !JSON.stringify(P).includes('Hareesh 2018 translation text'), 'no Hareesh translation text in the practice')
ok(M.voice.provider === 'phonon' && /Apache-2\.0/.test(M.voice.licence) && /not named after or cloned/.test(M.voice.policy), 'voice manifest documents model, licence, policy')
ok(M.lines.every(l => fs.existsSync(path.join(root, l.file)) && Array.isArray(l.env) && l.env.length > 10), 'every narration clip is a static file with a loudness envelope')
ok(M.lines.every(l => (l.match ?? 1) >= 0.9), 'narration intelligibility (whisper match ≥ 0.9)')

// ---- clock ----
const runFor = (c, sec, dt = 1 / 30) => { const ev = []; for (let x = 0; x < sec; x += dt) ev.push(...c.tick(dt)); return ev }
{ // gate holds at speak_end while the voice is still speaking
  const c = createClock(tl); c.play()
  const ev = runFor(c, S['begin'].speak_end + 2)
  ok(ev.some(e => e.type === 'segment_started' && e.id === 'begin') && ev.some(e => e.type === 'speech_started' && e.id === 'begin'), 'clock starts the first segment and its line')
  ok(Math.abs(c.t - S['begin'].speak_end) < 1e-6 && c.waiting === 'begin', 'gate: clock waits at speak_end for the voice')
  ok(!ev.some(e => e.type === 'pause_started'), 'no pause before the voice stops')
  const e2 = c.speechEnded('begin')
  ok(e2.some(e => e.type === 'pause_started') && !c.waiting, 'speech ended → the pause starts')
  runFor(c, 0.5); ok(c.t > S['begin'].speak_end, 'clock runs again after the gate')
}
{ // early end: the clock catches up so the pause begins when the voice stops
  const c = createClock(tl); c.play(); runFor(c, 2)
  const e = c.speechEnded('begin')
  ok(Math.abs(c.t - S['begin'].speak_end) < 1e-6 && e.find(x => x.type === 'speech_ended')?.early_s > 0, 'early end → jump to speak_end')
}
{ // voice off: no gate
  const c = createClock(tl, { gate: false }); c.play(); runFor(c, S['find-a-sound'].t + 1)
  ok(c.t > S['find-a-sound'].t && !c.waiting, 'voice off: no gate, estimated timing')
}
{ // whole play with voice off: silence, rest timer, hold open, end
  const c = createClock(tl, { gate: false, rest_cap_s: 90 }); c.play()
  const ev = runFor(c, tl.total_s + 5, 0.1)
  ok(ev.some(e => e.type === 'silence_entered' && e.id === 'whats-left'), 'silence_entered at the flat line')
  ok(c.holdOpen && !c.ended, 'hold open: the play does not end by itself')
  ok(c.rested_s > 45 && c.rested_s < 60, `rest timer counts the silence only (${c.rested_s.toFixed(1)} s)`)
  ok(ev.filter(e => e.type === 'rest_tick').length >= 8, 'rest ticks every 5 s')
  ok(ev.some(e => e.type === 'breath_in') || ev.some(e => e.type === 'rest_started'), 'breath events ride the same clock')
  ok(!ev.some(e => e.type === 'audio' && e.sound === 'bell-end'), 'no end bell before the user comes back')
  const e2 = runFor(c, 45, 0.5)
  ok(e2.some(e => e.type === 'ended' && e.reason === 'rest_cap') && c.ended, 'rest cap ends the play gently')
  const c2 = createClock(tl, { gate: false }); c2.play(); runFor(c2, tl.total_s + 3, 0.1)
  const end = c2.end('back'); ok(end[0]?.type === 'ended' && end[0].rested_s > 0, 'end() reports rested_s')
}
{ // seek re-arms a segment; live hold freezes; rate
  const c = createClock(tl); c.seek(S['fading'].t); c.play()
  const ev = c.tick(0.01)
  ok(ev.some(e => e.type === 'segment_started' && e.id === 'fading') && ev.some(e => e.type === 'speech_started' && e.id === 'fading'), 'seek to a segment re-emits its start and line')
  c.speechEnded('fading'); c.holdLive(true); const t0 = c.t; runFor(c, 2); ok(c.t === t0, 'live speech holds the clock still')
  c.holdLive(false); c.setRate(0.5); const t1 = c.t; runFor(c, 2); ok(Math.abs(c.t - t1 - 1) < 0.05, 'rate 0.5 → half speed (replay_phase slow)')
}
{ // extend_pause = recompile with pause_adjust; later segments shift, earlier stay
  const tl2 = compile(P, grammar, { speech_s, pause_adjust: { fading: 12 } }), s2 = Object.fromEntries(segmentsOf(tl2).map(s => [s.id, s]))
  ok(Math.abs((s2.fading.end - S.fading.end) - 12) < 1e-6 && s2['trace-inward'].t === S['trace-inward'].t && Math.abs(s2['no-force'].t - S['no-force'].t - 12) < 1e-6, 'extend_pause lengthens one pause and shifts the rest')
  const c = createClock(tl); c.seek(S.fading.speak_end + 3); c.setTimeline(tl2, c.t); ok(c.segment().id === 'fading' && c.segment().end === s2.fading.end, 'clock keeps its place across a recompile')
}

// ---- API doc covers every command ----
const api = fs.readFileSync(path.join(root, 'player/API.md'), 'utf8'), js = fs.readFileSync(path.join(root, 'player/play.js'), 'utf8')
const cmds = JSON.parse(js.match(/const COMMANDS = (\[[^\]]+\])/)[1].replace(/'/g, '"'))
for (const c of ['play', 'pause', 'resume', 'seek_phase', 'replay_phase', 'repeat_round', 'set_level', 'extend_pause', 'highlight_locus', 'show_explainer', 'speak', 'end'])
  ok(cmds.includes(c) && api.includes('`' + c + '('), `command ${c} implemented and documented`)
ok(FLAT > 0 && FLAT < 0.05, 'flat threshold sane')

console.log(bad ? `FAILED ${bad} of ${n}` : `ok ${n} checks`)
process.exitCode = bad ? 1 : 0
