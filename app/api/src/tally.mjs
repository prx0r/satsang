// Crowd tally (RANKING §1, OPEN-THREADS S16): pairwise picks + "This resonates", signed-in and anonymous, one score per clip.
// Pure functions + the two aggregate queries, so the Worker (/stats/clips) and tests (test/tally.test.mjs) share one rule.
//
// Weights (2026-10-25):
//   a signed-in pick            = 1 trial for each talk, 1 win for the winner
//   an anonymous device pick    = ANON_VOTE_W (0.5) of that
//   a "This resonates"          = RES_W (0.5) of a trial, all of it a win (a single-talk save beats an average talk)
//   an anonymous resonate       = RES_W * ANON_RES_W (0.25)
// Anonymous writes are rate-limited at the endpoints (POST /votes, POST /resonate: per device + per hashed IP, hourly).
// Output per clip keeps the fields the site already reads ({picks, wins, bt}) as *effective* (weighted) values, so the
// ranker (src/rank-topics.js: conf = picks / 30), the feed (src/feedrank.js) and build-gold.py move with resonates
// without changes; `raw` carries the plain counts.
export const W = { VOTE: 1, ANON_VOTE: 0.5, RES: 0.5, ANON_RES: 0.5 }

export const VOTE_AGG = `SELECT clip, anon, COUNT(*) AS n, SUM(w) AS wins FROM (
  SELECT a AS clip, CASE WHEN winner = a THEN 1 ELSE 0 END AS w, CASE WHEN user_id LIKE 'd:%' THEN 1 ELSE 0 END AS anon FROM votes
  UNION ALL SELECT b, CASE WHEN winner = b THEN 1 ELSE 0 END, CASE WHEN user_id LIKE 'd:%' THEN 1 ELSE 0 END FROM votes) GROUP BY clip, anon`
export const RES_AGG = `SELECT clip, CASE WHEN who LIKE 'd:%' THEN 1 ELSE 0 END AS anon, COUNT(*) AS n FROM resonates GROUP BY clip, anon`
export const TOTALS = `SELECT (SELECT COUNT(*) FROM votes) AS votes, (SELECT COUNT(*) FROM resonates) AS resonates,
  (SELECT COUNT(*) FROM (SELECT user_id AS w FROM votes UNION SELECT who FROM resonates)) AS voters`

const r3 = (x) => Math.round(1000 * x) / 1000
export const logit = (wins, picks) => r3(Math.log((wins + 1) / (picks - wins + 1)))

// voteRows: [{clip, anon (0|1), n, wins}] · resRows: [{clip, anon (0|1), n}] -> { clipId: {picks, wins, bt, resonates?, raw} }
export function tally(voteRows = [], resRows = [], w = W) {
  const out = {}
  const get = (id) => (out[id] ||= { picks: 0, wins: 0, raw: { picks: 0, wins: 0, anonPicks: 0, resonates: 0, anonResonates: 0 } })
  for (const x of voteRows) {
    if (!x || !x.clip) continue
    const o = get(x.clip), n = Number(x.n) || 0, wins = Number(x.wins) || 0, k = Number(x.anon) ? w.ANON_VOTE : w.VOTE
    o.picks += k * n; o.wins += k * wins
    o.raw.picks += n; o.raw.wins += wins; if (Number(x.anon)) o.raw.anonPicks += n
  }
  for (const x of resRows) {
    if (!x || !x.clip) continue
    const o = get(x.clip), n = Number(x.n) || 0, k = w.RES * (Number(x.anon) ? w.ANON_RES : 1)
    o.picks += k * n; o.wins += k * n
    o.raw.resonates += n; if (Number(x.anon)) o.raw.anonResonates += n
  }
  for (const o of Object.values(out)) {
    o.picks = r3(o.picks); o.wins = r3(o.wins); o.bt = logit(o.wins, o.picks)
    if (o.raw.resonates) o.resonates = o.raw.resonates
  }
  return out
}

// D1 -> tally (three cheap aggregate reads in one batch)
export async function crowdTally(DB, w = W) {
  const [v, r, t] = await DB.batch([DB.prepare(VOTE_AGG), DB.prepare(RES_AGG), DB.prepare(TOTALS)])
  const tot = t.results?.[0] || {}
  return { clips: tally(v.results || [], r.results || [], w), totals: { votes: tot.votes || 0, resonates: tot.resonates || 0, voters: tot.voters || 0 }, weights: w }
}
