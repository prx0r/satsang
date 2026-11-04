// Acceptance tests for the For You tension blocks (specs/FORYOU-TENSIONS.md §7). Synthetic tensions only: never real journal text.
// Unit behaviour runs on a small synthetic knot table; aptness smoke tests run on the built site/data/wisegraph/knots.json and the
// public catalogue. node tools/awaken/test-foryou-tensions.mjs
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { parseDoc, extractSignals, HELD_MAIN, BANNED } from '../../app/src/journal.js'
import { tensionsOf, knotsFor, planBlocks, titleOf, pickWhyOk, flatPicks, BUDGET } from '../../app/src/tensions.js'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'))
const NOW = Date.parse('2026-11-05T10:00:00+07:00'), START = '2026-10-28'
const T = (id, status, domain, roots, summary, body = 'Notes.', vis = 'public') => parseDoc(`id: ${id}\nvisibility: ${vis}\nopened: ${START}\nstatus: ${status}\ndomain: ${domain}\nroots: [${roots}]\nsummary: ${summary}\n---\n${body}`, { id: `tensions/${id}.md`, kind: 'tension' })
const E = (day, body) => parseDoc(`day: ${day}\nvisibility: public\n---\n${body}`, { id: `entries/day-${day}.md`, kind: 'entry' })
const sigOf = (docs) => { const s = extractSignals(docs, { now: NOW, start: START }); s.tensions = tensionsOf(docs); return s }
let n = 0; const ok = (name, f) => { f(); n++; console.log('ok', name) }

// ---------- a synthetic knot table: deterministic picks for the unit behaviour ----------
const P = (k, id, t, s, extra = {}) => ({ k, id, t, s, why: `Why ${id}`, tr: 0, tier: '', g: 0, d: 10, ...extra })
const SK = { roles: { resolve: { label: 'Resolve', hint: 'h' }, enlighten: { label: 'Enlighten', hint: 'h' }, explain: { label: 'Explain', hint: 'h' } },
  grounding: { practices: ['walk'], topics: ['kindness'] }, intense: { practices: ['hold'], topics: ['meditation/kundalini'] },
  knots: [
    { id: 'craving', label: 'Craving', match: { domain: ['addiction'], roots: ['lobha'], re: '\\b(habit|crav\\w*|sugar)\\b' }, roles: {
      resolve: { picks: [P('clip', 'heldtalk', 'sogyal-rinpoche', 9), P('clip', 'r1', 'ta', 3), P('clip', 'r2', 'tb', 2.9, { tr: 1 }), P('clip', 'r3', 'tc', 2.8, { g: 1 }), P('clip', 'kund', 'tk', 2.7)], practices: [P('practice', 'hold', null, 1.2), P('practice', 'walk', null, 1.1), P('practice', 'metta', null, 1.0)] },
      enlighten: { picks: [P('clip', 'e1', 'td', 3), P('clip', 'e2', 'te', 2.9, { tr: 1 }), P('clip', 'e3', 'tf', 2.5)], practices: [] },
      explain: { picks: [P('clip', 'x1', 'tg', 3), P('clip', 'r1', 'ta', 2.9), P('clip', 'x2', 'th', 2.4)], practices: [] } } },
    { id: 'livelihood', label: 'Money', match: { domain: ['money'], roots: [], re: '\\b(rent|debt|money)\\b' }, roles: {
      resolve: { picks: [P('clip', 'r1', 'ta', 3.5), P('clip', 'm1', 'ti', 3), P('clip', 'm2', 'tj', 2)], practices: [P('practice', 'walk', null, 1.2)] },
      enlighten: { picks: [P('clip', 'e1', 'td', 3), P('clip', 'm3', 'tl', 2.5)], practices: [] },
      explain: { picks: [P('clip', 'm4', 'tm', 3), P('clip', 'x1', 'tg', 2.8)], practices: [] } } },
    { id: 'anger', label: 'Anger', match: { domain: ['anger'], roots: ['dosa'], re: '\\b(anger|snapp\\w*)\\b' }, roles: {
      resolve: { picks: [P('clip', 'a1', 'tn', 3)], practices: [] }, enlighten: { picks: [P('clip', 'a2', 'to', 3)], practices: [] }, explain: { picks: [P('clip', 'a3', 'tp', 3)], practices: [] } } },
    { id: 'doubt', label: 'Doubt', match: { domain: ['doubt'], roots: [], re: '\\bdoubt\\w*\\b' }, roles: {
      resolve: { picks: [P('clip', 'd1', 'tq', 3)], practices: [] }, enlighten: { picks: [P('clip', 'd2', 'tr2', 3)], practices: [] }, explain: { picks: [P('clip', 'd3', 'ts', 3)], practices: [] } } },
  ] }
const CLIPS = Object.fromEntries(['heldtalk', 'r1', 'r2', 'r3', 'e1', 'e2', 'e3', 'x1', 'x2', 'm1', 'm2', 'm3', 'm4', 'a1', 'a2', 'a3', 'd1', 'd2', 'd3'].map((id) => [id, { id, speaker: 't', topics: ['craving'] }]))
CLIPS.r3.topics = ['kindness']; CLIPS.kund = { id: 'kund', speaker: 'tk', topics: ['meditation/kundalini'] }
const PRAC = { hold: { id: 'hold', name: 'Hold', minutes: 10 }, walk: { id: 'walk', name: 'Walk', minutes: 10 }, metta: { id: 'metta', name: 'Metta', minutes: 5 } }
const X = (o = {}) => ({ now: NOW, clip: (id) => CLIPS[id] || null, practice: (id) => PRAC[id] || null, isHeld: (s) => HELD_MAIN.has(s), ...o })
const allPicks = (plan) => plan.blocks.flatMap((b) => b.roles.flatMap((r) => r.picks.map((p) => ({ ...p, block: b.id, role: r.role }))))

const sugar = T('sugar-habit-late-at-night-again', 'open', 'addiction', 'lobha', 'a late-night sugar habit I keep feeding')
const rent = T('rent-arrears', 'loosening', 'money', 'moha', 'two months of rent arrears')
const brother = T('snapping-at-my-brother', 'resolved', 'anger', 'dosa', 'snapping at my brother')
const base = sigOf([sugar, rent, brother, E(2, 'Sat with the breath.')])

ok('tensions: public only; title is the file name, at most four words; status kept', () => {
  const ts = tensionsOf([sugar, rent, T('secret-one', 'open', 'identity', '', 'x', 'y', 'private')])
  assert.deepEqual(ts.map((t) => t.id), ['sugar-habit-late-at-night-again', 'rent-arrears'])
  assert.equal(ts[0].title, 'Sugar habit late at'); assert.equal(titleOf('rent-arrears'), 'Rent arrears')
  assert.equal(ts[1].status, 'loosening')
})
ok('knots: domain + summary words + roots map a tension to generic knots, strongest first', () => {
  assert.equal(knotsFor(tensionsOf([sugar])[0], SK)[0].id, 'craving')
  assert.equal(knotsFor(tensionsOf([rent])[0], SK)[0].id, 'livelihood')
  assert.equal(knotsFor(tensionsOf([brother])[0], SK)[0].id, 'anger')
})
const plan = planBlocks(base, SK, X())
ok('order: open first, then loosening; resolved last with one integration pick', () => {
  assert.deepEqual(plan.blocks.map((b) => b.kind), ['open', 'loosening', 'resolved'])
  const res = plan.blocks[2]; assert.equal(allPicks({ blocks: [res] }).length, 1); assert.equal(res.roles[0].label, 'Integration'); assert.match(res.roles[0].picks[0].why, /^Integration: /)
})
ok('open: every role has 1-3 picks; Resolve keeps one slot for a practice; loosening gets fewer (<= 1 per role)', () => {
  const o = plan.blocks[0]
  for (const r of o.roles) { assert.ok(r.picks.length >= 1 && r.picks.length <= 3); assert.ok(r.picks.length <= BUDGET.open[r.role]) }
  const rs = o.roles.find((r) => r.role === 'resolve'); assert.equal(rs.picks.filter((p) => p.k === 'practice').length, 1)
  const l = plan.blocks[1]; for (const r of l.roles) assert.ok(r.picks.length <= 1)
  assert.ok(allPicks({ blocks: [l] }).length < allPicks({ blocks: [o] }).length)
})
ok('never a held teacher, even as the best match; never a teacher-only or held practice', () => {
  for (const p of allPicks(plan)) { assert.notEqual(p.id, 'heldtalk'); assert.ok(!HELD_MAIN.has(p.t)) }
})
ok('page-wide: no talk twice, one talk per teacher per block, at most three per teacher on the page', () => {
  const v = allPicks(plan).filter((p) => p.k !== 'practice').map((p) => p.id); assert.equal(new Set(v).size, v.length)
  for (const b of plan.blocks) { const t = allPicks({ blocks: [b] }).filter((p) => p.k !== 'practice').map((p) => p.t); assert.equal(new Set(t).size, t.length) }
  const per = {}; for (const p of allPicks(plan)) if (p.t) per[p.t] = (per[p.t] || 0) + 1; assert.ok(Object.values(per).every((x) => x <= 3))
  assert.deepEqual([...plan.used].sort(), [...new Set(v)].sort())
})
ok('Trika first: on Enlighten a Trika talk within 80 % of the best leads', () => {
  const e = plan.blocks[0].roles.find((r) => r.role === 'enlighten'); assert.equal(e.picks[0].id, 'e2')
})
ok('safety: crisis -> no picks; unsettled -> grounding practices and gentle talks only; soften -> no intense practice or topic, note shown', () => {
  const cr = planBlocks({ ...base, safety: { class: 'crisis' } }, SK, X()); assert.equal(cr.blocks.length, 0); assert.equal(cr.safety.kind, 'crisis')
  const un = planBlocks({ ...base, safety: { class: 'unsettled' } }, SK, X())
  for (const b of un.blocks) for (const r of b.roles) { assert.ok(r.role === 'resolve' || b.kind === 'resolved'); for (const p of r.picks) assert.ok(p.k === 'practice' ? p.id === 'walk' : (p.c.topics || []).includes('kindness')) }
  const so = planBlocks({ ...base, safety: { class: 'soften' } }, SK, X()); assert.equal(so.safety.kind, 'gentle')
  for (const p of allPicks(so)) { assert.notEqual(p.id, 'hold'); assert.notEqual(p.id, 'kund') }
})
ok('"This helped" lowers that tension (order) and raises similar items (same teacher) in it', () => {
  const two = sigOf([sugar, T('debt-and-rent', 'open', 'money', '', 'debt and rent')]), tid = 't:sugar-habit-late-at-night-again'
  const p0 = planBlocks(two, SK, X()); assert.equal(p0.blocks[0].id, tid)
  const res0 = p0.blocks[0].roles.find((r) => r.role === 'resolve').picks; assert.ok(!res0.some((p) => p.id === 'r3'))
  const top = res0[0]
  const helped = [1, 2, 3].map(() => ({ tid, ref: top.ref, t: 'tc', tr: 0, knot: 'craving', role: 'resolve', at: new Date(NOW - 3600e3).toISOString() }))
  const p1 = planBlocks(two, SK, X({ helped }))
  assert.equal(p1.blocks[0].id, 't:debt-and-rent')                                         // the helped tension eases down the page
  assert.ok(p1.blocks.find((b) => b.id === tid).roles.find((r) => r.role === 'resolve').picks.some((p) => p.id === 'r3'))  // a talk by the helped teacher comes up
})
ok('"Not this" hides a pick for 30 days; a muted tension shows nothing', () => {
  const first = plan.blocks[0].roles[0].picks[0]
  const p2 = planBlocks(base, SK, X({ not: { [first.ref]: new Date(NOW - 86400e3).toISOString() } }))
  assert.ok(!allPicks(p2).some((p) => p.ref === first.ref))
  const p3 = planBlocks(base, SK, X({ mutes: { 't:sugar-habit-late-at-night-again': new Date(NOW - 86400e3).toISOString() } }))
  assert.ok(!p3.blocks.some((b) => b.id === 't:sugar-habit-late-at-night-again'))
})
ok('entries: a strong concern no tension covers gets its own block (<= 2), titled with its label', () => {
  const s = sigOf([rent, E(1, 'Sat with the breath.'), E(2, 'Walked by the river.'), E(6, 'Cooked for friends.'), E(3, 'Doubt again: is this even working? I doubt the whole path.'), E(4, 'More doubt today, doubting everything.'), E(5, 'Still unsure if this works, doubt.')])
  const p = planBlocks(s, SK, X()), e = p.blocks.find((b) => b.kind === 'entry')
  assert.ok(e && e.id === 'c:doubt' && e.title === 'Doubt'); assert.ok(p.blocks.filter((b) => b.kind === 'entry').length <= 2)
})
ok('no journal -> null; deterministic; fast (< 50 ms for the real knot table)', () => {
  assert.equal(planBlocks(null, SK, X()), null)
  assert.deepEqual(JSON.stringify(planBlocks(base, SK, X())), JSON.stringify(plan))
  const KN = J('app/site/data/wisegraph/knots.json'), t0 = performance.now(); planBlocks(base, KN, X({ clip: (id) => ({ id, speaker: 's', topics: [] }) })); assert.ok(performance.now() - t0 < 50)
})

// ---------- aptness smoke tests on the built knot table + the public catalogue ----------
const KN = J('app/site/data/wisegraph/knots.json'), CL = Object.fromEntries(J('app/clips.site.json').map((c) => [c.id, c])), COLS = J('app/site/data/wisegraph/collections.json')
const WISE = J('app/site/data/wisegraph/wise.json'), held = (s) => HELD_MAIN.has(s) || !!WISE.people?.[s]?.safety
const RX = (k) => ({ craving: /habit|crav|desire|compuls|addict|urge|pleasure|kāma|kama|mala/i, livelihood: /money|wealth|livelihood|career|work|karma ?yoga|worldly|poor|contentment|earn/i, shame: /shame|guilt|self|worthy|love myself|mask|identity|tender/i, doubt: /doubt|faith|saddha|sceptic|skeptic|uncertain|disbelief|hindrance|confidence/i, anger: /anger|angry|aversion|hatred|emotion|metta|kindness|krodha/i, fear: /fear|anxi|worry|panic|stress|guided/i })[k]
const real = planBlocks(sigOf([sugar, T('money-worries', 'open', 'money', '', 'money worries and debt'), T('ashamed-of-myself', 'open', 'identity', '', 'ashamed of who I am, hiding it'), T('fear-of-flying', 'loosening', 'anxiety', '', 'fear before every flight')]), KN,
  { now: NOW, clip: (id) => (CL[id] && CL[id].format !== 'vertical' ? CL[id] : null), practice: (id) => COLS.practices[id] || null, isHeld: held })
ok('real knots: every talk pick names the knot in its title or why, and its why-line passes the lint', () => {
  assert.ok(real.blocks.length >= 4)
  for (const b of real.blocks) for (const r of b.roles) for (const p of r.picks) {
    assert.ok(pickWhyOk(p.why), p.why); assert.ok(!BANNED.test(p.why))
    if (p.k !== 'practice') assert.ok(RX(b.knot).test(`${p.c.title} ${p.c.ytTitle || ''} ${p.c.talk || ''} ${p.why}`), `${b.knot}: ${p.c.title}`)
    if (p.k !== 'practice') assert.ok(!held(p.c.speaker))
  }
})
ok('real knots: Trika appears in the open blocks, and every open block has all three roles', () => {
  for (const b of real.blocks.filter((x) => x.kind === 'open')) { assert.equal(b.roles.length, 3); }
  assert.ok(real.blocks.filter((x) => x.kind === 'open').some((b) => b.roles.some((r) => r.picks.some((p) => p.tr))))
  assert.ok(flatPicks(real, 6).length === 6)
})
ok('public knots.json carries pointers only: no long text, no transcript path, every why <= 96 chars', () => {
  const s = fs.readFileSync(path.join(ROOT, 'app/site/data/wisegraph/knots.json'), 'utf8')
  assert.ok(!/transcript|wiser-search-index|passages\.jsonl/i.test(s))
  for (const k of KN.knots) for (const r of Object.values(k.roles)) for (const p of [...r.picks, ...r.practices]) { assert.ok(p.why.length <= 96, p.why); for (const v of Object.values(p)) if (typeof v === 'string') assert.ok(v.length <= 120) }
})
console.log(`${n} passed`)
