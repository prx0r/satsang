// Crowd tally unit tests: node test/tally.test.mjs  (pure; no D1, no network)
import { tally, logit, W } from '../src/tally.mjs'
let n = 0, f = 0
const ok = (c, m) => { n++; if (!c) { f++; console.log('FAIL ' + m) } }
const near = (a, b, e = 1e-3) => Math.abs(a - b) < e

// 1. no data -> nothing
ok(Object.keys(tally([], [])).length === 0, 'empty tally')
// 2. a signed-in pick counts fully, an anonymous pick half
let t = tally([{ clip: 'A', anon: 0, n: 1, wins: 1 }, { clip: 'B', anon: 0, n: 1, wins: 0 }])
ok(t.A.picks === 1 && t.A.wins === 1 && t.B.picks === 1 && t.B.wins === 0, 'signed-in pick = 1 trial, 1 win')
ok(t.A.bt > 0 && t.B.bt < 0 && near(t.A.bt, -t.B.bt), 'winner above, loser below, symmetric')
t = tally([{ clip: 'A', anon: 1, n: 1, wins: 1 }])
ok(t.A.picks === W.ANON_VOTE && t.A.wins === W.ANON_VOTE, 'anonymous pick = 0.5')
ok(t.A.raw.picks === 1 && t.A.raw.anonPicks === 1, 'raw counts kept')
// 3. resonates move a clip that has no picks at all
t = tally([], [{ clip: 'R', anon: 0, n: 2 }, { clip: 'S', anon: 1, n: 2 }])
ok(t.R.picks === 1 && t.R.wins === 1 && t.R.bt > 0, 'two signed-in resonates = 1 pseudo-win')
ok(t.S.picks === 0.5 && t.S.bt > 0 && t.S.bt < t.R.bt, 'anonymous resonates down-weighted (0.25 each)')
ok(t.R.resonates === 2 && t.S.raw.anonResonates === 2, 'resonate counts exposed')
// 4. ranking moves: before / after resonates, a clip overtakes a peer with the same picks
const votes = [{ clip: 'X', anon: 0, n: 4, wins: 2 }, { clip: 'Y', anon: 0, n: 4, wins: 2 }]
const before = tally(votes), after = tally(votes, [{ clip: 'Y', anon: 1, n: 3 }])
ok(before.X.bt === before.Y.bt, 'tie before resonates')
ok(after.Y.bt > after.X.bt, 'Y moves above X after anonymous resonates')
// 5. weighting holds: 1 signed-in resonate outweighs 1 anonymous resonate, and a pick outweighs a resonate
const m = tally([{ clip: 'P', anon: 0, n: 1, wins: 1 }], [{ clip: 'Q', anon: 0, n: 1 }, { clip: 'Z', anon: 1, n: 1 }])
ok(m.P.bt > m.Q.bt && m.Q.bt > m.Z.bt, 'pick > signed-in resonate > anonymous resonate')
// 6. many anonymous resonates still need many to reach a strong score (100 anon = 25 pseudo-wins)
const big = tally([], [{ clip: 'B', anon: 1, n: 100 }])
ok(near(big.B.picks, 25) && near(big.B.bt, logit(25, 25)), '100 anonymous resonates = 25 effective picks')
// 7. the site's confidence (src/rank-topics.js conf = picks / 30) sees resonates
ok(Math.min(1, big.B.picks / 30) > 0.8, 'ranker confidence rises with resonates')
// 8. robust to junk rows
ok(Object.keys(tally([null, { anon: 0, n: 3 }], [{}, null])).length === 0, 'junk rows ignored')
console.log(f ? `${f}/${n} tally checks FAILED` : `ok ${n} tally checks`)
process.exit(f ? 1 : 0)
