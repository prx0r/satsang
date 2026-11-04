// Acceptance tests for the slice-1 proof (specs/AWAKENING-ALGORITHM.md §11). Synthetic posts only: never real journal text.
// node tools/awaken/test-journal-signals.mjs
import assert from 'node:assert/strict'
import { parseDoc, extractSignals, journalIntents, whyOk, BANNED } from './journal-signals.mjs'

const NOW = Date.parse('2026-11-04T12:00:00Z'), START = '2026-10-28'
const E = (day, body, vis = 'public') => parseDoc(`day: ${day}\nvisibility: ${vis}\n---\n${body}`, { id: `entries/day-${day}.md`, kind: 'entry' })
const T = (id, status, domain, roots, summary, body = 'Notes.') => parseDoc(`id: ${id}\nvisibility: public\nopened: 2026-10-29\nstatus: ${status}\ndomain: ${domain}\nroots: [${roots}]\nsummary: ${summary}\n---\n${body}`, { id: `tensions/${id}.md`, kind: 'tension' })
let n = 0; const ok = (name, f) => { f(); n++; console.log('ok', name) }

ok('grief post leads the concerns', () => {
  const s = extractSignals([E(1, 'Sat for twenty minutes, mind on breath.'), E(6, 'My father died last week. The grief comes in waves.\n\nI keep thinking about loss.')], { now: NOW, start: START })
  assert.equal(s.concerns[0].id, 'grief'); assert.equal(s.safety.class, 'soften')
})
ok('crisis wording sets the crisis class (most severe wins)', () => {
  const s = extractSignals([E(5, 'Some days I want to die.'), E(6, 'Anxious about work.')], { now: NOW, start: START })
  assert.equal(s.safety.class, 'crisis')
})
ok('negation does nothing ("not anxious")', () => {
  const s = extractSignals([E(6, 'I am not anxious today, just quiet.')], { now: NOW, start: START })
  assert.equal(s.safety.class, 'none')
})
ok('private items are never read', () => {
  const s = extractSignals([E(6, 'My father died.', 'private')], { now: NOW, start: START })
  assert.equal(s.concerns.length, 0); assert.equal(s.safety.class, 'none')
})
ok('a loosening tension weighs less than an open one', () => {
  const a = extractSignals([T('t1', 'open', 'addiction', 'lobha', 'craving sugar every evening')], { now: NOW })
  const b = extractSignals([T('t1', 'loosening', 'addiction', 'lobha', 'craving sugar every evening')], { now: NOW })
  assert.ok(a.concerns[0].U > b.concerns[0].U); assert.equal(b.concerns[0].trend, 'loosening')
})
ok('old posts fade (half-life 7 days after 14)', () => {
  const fresh = extractSignals([E(8, 'I cannot sleep, insomnia again.')], { now: NOW, start: START })
  const old = extractSignals([E(8, 'I cannot sleep, insomnia again.')], { now: NOW + 35 * 86400000, start: START })
  assert.ok(old.concerns.length === 0 || old.concerns[0].U < fresh.concerns[0].U * 0.5)
})
ok('a new need and an older interest are both kept (ordering is the ranker, spec §6)', () => {
  const docs = [E(1, 'Reading about advaita and non-duality, who am I.'), E(2, 'More on non-duality and the self.'), E(8, 'My mother passed away on Sunday.')]
  const s = extractSignals(docs, { now: NOW, start: START }), ids = s.concerns.map((c) => c.id)
  assert.ok(ids.includes('grief') && ids.includes('nonduality'))
})
ok('why-lines are short, own-words labels, never diagnostic', () => {
  const s = extractSignals([E(6, 'Shame about hiding who I am. Self-judgment all day.'), T('t2', 'open', 'money', 'lobha', 'bills piling up')], { now: NOW, start: START })
  const it = journalIntents(s)
  assert.ok(it.length >= 1); for (const x of it) { assert.ok(whyOk(x.why), x.why); assert.ok(x.why.startsWith('Because you wrote about')); assert.equal(x.source, 'journal') }
  assert.ok(BANNED.test('you seem depressed')); assert.ok(!whyOk('Because you seem addicted'))
})
ok('deterministic for the same input and day', () => {
  const docs = [E(3, 'Anger at my brother. Resentment.'), E(4, 'Restless, cannot focus.')]
  assert.deepEqual(extractSignals(docs, { now: NOW, start: START }).concerns, extractSignals(docs, { now: NOW, start: START }).concerns)
})
ok('fast enough on a device (60 posts < 50 ms)', () => {
  const docs = Array.from({ length: 60 }, (_, i) => E(i + 1, 'Sat with the breath. Some craving, some worry about money.\n\nGrateful for the practice.'))
  const t = performance.now(); extractSignals(docs, { now: NOW, start: START }); assert.ok(performance.now() - t < 50)
})
console.log(`${n} passed`)
