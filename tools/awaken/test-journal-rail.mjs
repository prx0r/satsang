// Slice-1 UI acceptance tests (specs/AWAKENING-ALGORITHM.md §11, tests 11-16) on the shipped pure functions in
// app/src/journal.js. Synthetic posts and synthetic talks only: never real journal text.
// node tools/awaken/test-journal-rail.mjs
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { parseDoc, extractSignals, journalIntents, journalRail, safetyCard, isMuted, parseSource, fetchDocs, inferStart, whyOk, HELD_MAIN } from '../../app/src/journal.js'

const HERE = path.dirname(new URL(import.meta.url).pathname), ROOT = path.resolve(HERE, '../..')
const NOW = Date.parse('2026-11-04T12:00:00Z'), START = '2026-10-28'
const E = (day, body, vis = 'public') => parseDoc(`day: ${day}\nvisibility: ${vis}\n---\n${body}`, { id: `entries/day-${day}.md`, kind: 'entry' })
const T = (id, status, domain, roots, summary) => parseDoc(`id: ${id}\nvisibility: public\nopened: ${START}\nstatus: ${status}\ndomain: ${domain}\nroots: [${roots}]\nsummary: ${summary}\n---\nNotes.`, { id: `tensions/${id}.md`, kind: 'tension' })
// a ranked For You list (synthetic): grief talks, a held teacher's perfect match, other topics
const talk = (id, speaker, topics) => ({ c: { id, speaker, topics }, kind: 'fit', why: 'x' })
const RANKED = [
  talk('a1', 'ajahn-chah', ['meditation']), talk('held1', 'sogyal-rinpoche', ['death', 'impermanence']), talk('g1', 'teacher-a', ['death']),
  talk('g2', 'teacher-b', ['impermanence']), talk('g3', 'teacher-c', ['emotions/sadness']), talk('g4', 'teacher-d', ['death']),
  talk('k1', 'teacher-e', ['kindness/compassion']), talk('k2', 'teacher-f', ['kindness']), talk('s1', 'swami-shankarananda', ['kindness/compassion']), talk('k3', 'teacher-g', ['self']),
]
const isHeld = (s) => HELD_MAIN.has(s)
let n = 0; const ok = async (name, f) => { await f(); n++; console.log('ok', name) }

const grief = extractSignals([E(1, 'Sat twenty minutes with the breath.'), E(6, 'My father died last week. The grief comes in waves.'), T('t-shame', 'open', 'identity', 'dosa', 'hiding who I am')], { now: NOW, start: START })

await ok('11a with a journal: the rail has <= 6 cards, each why names a concern and a day', () => {
  const R = journalRail(grief, RANKED, { isHeld, now: NOW })
  assert.ok(R && R.cards.length > 0 && R.cards.length <= 6)
  for (const x of R.cards) { assert.match(x.why, /^Because you wrote about .+ \(day \d+\)$/); assert.ok(whyOk(x.why)) }
  assert.equal(new Set(R.cards.map((x) => x.c.id)).size, R.cards.length)            // never one talk twice
  assert.ok(R.cards.length <= 2 * 3)                                                   // top 2 concerns x best 3
})
await ok('11b without a journal: no rail at all and no journal intents (For You unchanged)', () => {
  assert.equal(journalRail(null, RANKED), null)
  assert.deepEqual(journalIntents(null), [])
})
await ok('12 crisis fixture: the crisis card leads, no talk cards, no urgent items', () => {
  const s = extractSignals([E(6, 'Some days I want to die.'), E(5, 'Grief again.')], { now: NOW, start: START })
  const R = journalRail(s, RANKED, { isHeld, now: NOW })
  assert.equal(R.safety.kind, 'crisis'); assert.equal(R.cards.length, 0); assert.match(R.safety.text, /crisis line|emergency/)
})
await ok('12b soften: gentle note shown once, cards still offered', () => {
  const R = journalRail(grief, RANKED, { isHeld, now: NOW })
  assert.equal(safetyCard(grief)?.kind, 'gentle'); assert.ok(R.safety && R.cards.length)
})
await ok('13 held-teacher fixture: a perfect topic match by a person with a safety record never appears', () => {
  const R = journalRail(grief, RANKED, { isHeld, now: NOW })
  assert.ok(!R.cards.some((x) => isHeld(x.c.speaker)))
  assert.ok(HELD_MAIN.has('swami-shankarananda') && HELD_MAIN.has('sogyal-rinpoche'))
})
await ok('14 "Not this" mutes the concern for 30 days; then it returns', () => {
  const top = journalIntents(grief, 1)[0].id.slice(2), mutes = { [top]: new Date(NOW).toISOString() }
  assert.ok(isMuted(mutes, top, NOW + 29 * 864e5)); assert.ok(!isMuted(mutes, top, NOW + 31 * 864e5))
  const R = journalRail(grief, RANKED, { isHeld, mutes, now: NOW })
  assert.ok(!R.cards.some((x) => x.concern === top))
})
await ok('14b "Stop reading my journal" and 15 Delete everything clear the device keys; Download includes them', () => {
  const prof = fs.readFileSync(path.join(ROOT, 'app/src/profile.js'), 'utf8'), jr = fs.readFileSync(path.join(ROOT, 'app/src/journal.js'), 'utf8')
  assert.match(prof, /'journal', 'journalMute'/)                                         // forget(): Delete everything
  assert.match(prof, /journal: LS\.get\('journal', null\)/)                              // exportLocal(): Download my data
  assert.match(jr, /function stop\(\) \{ for \(const k of \[KEY, MUTE_KEY, HELPED_KEY, NOT_KEY\]\) localStorage\.removeItem\('wiser\.' \+ k\)/)   // 2026-11-05: helped / not-this go too
  assert.ok(!/api\(|fetch\([^)]*intentions/.test(jr.slice(jr.indexOf('export function createJournal'))))  // device only: never synced
})
await ok('16 guards: deploy guard and secret scan block a journal payload and the proof output', () => {
  const dep = fs.readFileSync(path.join(ROOT, 'app/deploy.sh'), 'utf8'), scan = fs.readFileSync(path.join(ROOT, 'tools/release/secret-scan.sh'), 'utf8'), gi = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8')
  assert.match(dep, /journal profile payload found in dist/); assert.match(scan, /tools\/awaken\/out/); assert.match(gi, /^tools\/awaken\/out\/$/m); assert.match(gi, /^\/private\/$/m)
  const dist = path.join(ROOT, 'app/dist')
  if (fs.existsSync(dist)) { // when a build exists, prove it carries no payload
    const bad = []; const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f), st = fs.statSync(p); if (st.isDirectory()) walk(p); else if (st.size < 30e6 && /"evidence": ?\[ ?\{ ?"doc":/.test(fs.readFileSync(p, 'utf8'))) bad.push(p) } }; walk(dist)
    assert.deepEqual(bad, [])
  }
})
await ok('sources: github fallback parses, private items dropped, start inferred from tensions', async () => {
  assert.deepEqual(parseSource('prx0r/nibbanahelp'), { kind: 'github', owner: 'prx0r', repo: 'nibbanahelp' })
  assert.deepEqual(parseSource('https://github.com/prx0r/nibbanahelp'), { kind: 'github', owner: 'prx0r', repo: 'nibbanahelp' })
  assert.equal(parseSource('https://example.org/feed.json').kind, 'feed'); assert.equal(parseSource('hello'), null)
  const files = { 'entries/day-01.md': 'day: 1\nvisibility: public\n---\nSat.', 'entries/day-02.md': 'day: 2\nvisibility: private\n---\nGrief.', 'entries/_template.md': 'x', 'tensions/t.md': `id: t\nvisibility: public\nopened: ${START}\nstatus: open\ndomain: doubt\nroots: [moha]\nsummary: s\n---\nNotes.`, 'advice/a.json': '{}' }
  const fake = async (u) => {
    if (u.endsWith('/nibbanahelp')) return { ok: true, json: async () => ({ default_branch: 'main' }) }
    if (u.includes('/git/trees/')) return { ok: true, json: async () => ({ tree: Object.keys(files).map((p) => ({ path: p, type: 'blob' })) }) }
    const p = u.split('/main/')[1]; return { ok: !!files[p], text: async () => files[p] }
  }
  const docs = await fetchDocs(parseSource('prx0r/nibbanahelp'), fake)
  assert.deepEqual(docs.map((d) => d.id), ['entries/day-01.md', 'entries/day-02.md', 'tensions/t.md'])  // template and advice/ never fetched
  assert.equal(inferStart(docs), START)
  const s = extractSignals(docs, { now: NOW, start: inferStart(docs) })
  assert.ok(!s.concerns.some((c) => c.id === 'grief'))                                   // the private post was not read
})
console.log(`${n} passed`)
