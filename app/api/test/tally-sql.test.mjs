// Crowd tally SQL against real SQLite (node:sqlite) with the D1 schema subset: node test/tally-sql.test.mjs
import { DatabaseSync } from 'node:sqlite'
import { crowdTally } from '../src/tally.mjs'
const db = new DatabaseSync(':memory:')
db.exec(`CREATE TABLE votes (user_id TEXT NOT NULL, a TEXT NOT NULL, b TEXT NOT NULL, winner TEXT NOT NULL, why TEXT, ms INTEGER, daily TEXT, cc TEXT, signals TEXT, created_at TEXT NOT NULL, UNIQUE (user_id, a, b));
  CREATE TABLE resonates (who TEXT NOT NULL, clip TEXT NOT NULL, t INTEGER, sec INTEGER, created_at TEXT NOT NULL, PRIMARY KEY (who, clip));`)
const D1 = { prepare: (q) => ({ q }), batch: async (st) => st.map((s) => ({ results: db.prepare(s.q).all() })) } // the D1 surface crowdTally uses
const at = new Date().toISOString(), V = db.prepare('INSERT INTO votes (user_id, a, b, winner, created_at) VALUES (?, ?, ?, ?, ?)'), R = db.prepare('INSERT INTO resonates (who, clip, created_at) VALUES (?, ?, ?)')
V.run('user-1', 'aaaaaaaaaaa', 'bbbbbbbbbbb', 'aaaaaaaaaaa', at)          // signed-in: a beats b
V.run('d:dev1', 'aaaaaaaaaaa', 'ccccccccccc', 'ccccccccccc', at)          // anonymous: c beats a
R.run('d:dev1', 'bbbbbbbbbbb', at); R.run('d:dev2', 'bbbbbbbbbbb', at); R.run('user-1', 'ddddddddddd', at)
let n = 0, f = 0; const ok = (c, m) => { n++; if (!c) { f++; console.log('FAIL ' + m) } }
const t = await crowdTally(D1), C = t.clips
ok(C.aaaaaaaaaaa.picks === 1.5 && C.aaaaaaaaaaa.wins === 1, 'a: 1 signed-in win + 0.5 anonymous loss')
ok(C.ccccccccccc.picks === 0.5 && C.ccccccccccc.wins === 0.5, 'c: anonymous win at half weight')
ok(C.bbbbbbbbbbb.picks === 1.5 && C.bbbbbbbbbbb.wins === 0.5 && C.bbbbbbbbbbb.resonates === 2, 'b: a loss + two anonymous resonates (0.25 each)')
ok(C.ddddddddddd.picks === 0.5 && C.ddddddddddd.bt > 0, 'd: resonate-only clip enters the tally')
ok(t.totals.votes === 2 && t.totals.resonates === 3 && t.totals.voters === 3, 'totals: 2 votes, 3 resonates, 3 distinct people/devices')
console.log(f ? `${f}/${n} tally SQL checks FAILED` : `ok ${n} tally SQL checks`); process.exit(f ? 1 : 0)
