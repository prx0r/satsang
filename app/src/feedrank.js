// For You ranking (specs/FORYOU.md). Pure: no DOM, no storage. Given the catalogue, the listener's taste (src/taste.js),
// their watch log, yesterday's impressions, their intentions and today's theme (src/themes.js), it returns an ordered,
// diverse list with one honest "why" per card. Deterministic for a (day, device) pair, so the feed is stable while you
// scroll today and different tomorrow.
//
// score(c) = rel + 0.30·intent + 0.12·theme + 0.15·fresh − novelty − impressions − teacherRecency − topicFatigue − less + jitter
//   rel (taste)  = 0.50·affinity + 0.35·q + 0.15·crowd          (affinity from the Beta facets, q = RANKING §1 quality)
//   rel (cold)   = 0.60·q + 0.40·crowd                          (crowd = smoothed crowd resonance, 0.5 when unknown)
//   novelty      : finished = never; partial 0.5; glance 0.2·recency (seen.js tiers)
//   impressions  : 0.015 per earlier-day impression, half-life 3 days, capped at 0.3 (tuned in specs/sim/feed_sim.py)
//   teacher/topic: decayed counts over the last days of what you were shown or played (half-life 3 days)
//   jitter       : ±0.015 from a (day, device, clip) hash: ties break differently each day, never randomly within one
// Slots per 10: 2 exploration (Thompson sample over families you have barely met), 1 serendipity bridge (a topic next to
// your strongest one on the topic graph), the rest exploitation by MMR (λ 0.65; same video 1, teacher .85, school .45,
// family .2). Position 2 is the best talk on today's theme; the theme holds at most ~30 % of the list, intentions ~50 %. Hard rules: no teacher twice within 4 cards, ≤ 2 per teacher
// in the first 20, never two passages of one video.

const DAYMS = 86400000
export function hash32(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
export function rng(seed) { let a = hash32(seed) || 1; return () => { a ^= a << 13; a >>>= 0; a ^= a >>> 17; a ^= a << 5; a >>>= 0; return a / 4294967296 } }
// Beta(a, b) sample from a seeded uniform source (Marsaglia–Tsang gamma)
function gamma(k, r) {
  if (k < 1) return gamma(k + 1, r) * Math.pow(r() || 1e-9, 1 / k)
  const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d)
  for (;;) { let x, v; do { const u1 = r() || 1e-9, u2 = r(); x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); v = 1 + c * x } while (v <= 0); v = v * v * v; const u = r(); if (u < 1 - 0.0331 * x ** 4 || Math.log(u || 1e-9) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v }
}
export const betaSample = (a, b, r) => { const x = gamma(a, r), y = gamma(b, r); return x / (x + y) }
const root = (t) => String(t).split('/')[0]
const ageDays = (iso, now) => { const t = Date.parse(iso || ''); return Number.isFinite(t) ? Math.max(0, (now - t) / DAYMS) : Infinity }

// X: { cands[], R (createRanker), taste|null, watch(id) -> seen.js entry|null, tier(entry), impressions: {id: ['YYYY-MM-DD', ...]},
//      plays: [{id, at}] (recent plays, any surface), less: {clips:Set, teachers:{s:n}, topics:{t:n}}, more: {teachers:{}, topics:{}},
//      intents: [{id, label, w, topics:{t: weight}}], theme: {why, label, match}|null, themeMatch(m, c), today 'YYYY-MM-DD', now ms,
//      device, stats(id) -> {picks, wins, bt}|null, published(topics) -> [{id,label}], topics: all topic ids, label(t), person(id), tradLabel(id) }
export function rankFeed(X, k = 120) {
  const { R, taste: T, today } = X, now = X.now || Date.now(), seed = `${today}|${X.device || 'anon'}`
  const r = rng('feed|' + seed), jit = (id) => ((hash32(seed + '|' + id) % 10000) / 10000 - 0.5) * 0.03
  const cold = !(T && T.n >= 2)
  const fam = (c) => R.famOfClip(c), sch = (c) => R.schoolOf(c), spk = (c) => c.speaker || c.comic, vid = (c) => c.parent || String(c.id).split('@')[0]
  // recency of teachers and topics: impressions from earlier days + plays (half-life 3 days)
  const tRec = {}, topRec = {}
  const bump = (c, w) => { if (!c) return; tRec[spk(c)] = (tRec[spk(c)] || 0) + w; for (const t of new Set((c.topics || []).map(root))) topRec[t] = (topRec[t] || 0) + w }
  const byId = X.byId || {}
  for (const [id, days] of Object.entries(X.impressions || {})) for (const d of days) if (d < today) bump(byId[id], 0.25 * Math.pow(0.5, ageDays(d + 'T12:00:00Z', now) / 3))
  for (const p of X.plays || []) bump(byId[p.id], Math.pow(0.5, ageDays(p.at, now) / 3))
  const crowd = (c) => { const s = X.stats?.(c.id); if (!s || !s.picks) return 0.5; return (s.wins + 2.5) / (s.picks + 5) }
  const intentOf = (c) => { let best = 0, who = null; for (const it of X.intents || []) { let m = 0; for (const t of c.topics || []) m = Math.max(m, it.topics[t] || it.topics[root(t)] * 0.8 || 0); if (m * it.w > best) { best = m * it.w; who = it } } return [best, who] }
  const scored = []
  for (const c of X.cands) {
    if (X.less?.clips?.has(c.id)) continue
    const w = X.watch?.(c.id), tier = w ? X.tier(w) : null
    if (tier === 'finished') continue
    const q = R.quality(c), cr = crowd(c), aff = cold ? 0 : T.affinity(c)
    const rel = cold ? 0.6 * q + 0.4 * cr : 0.5 * aff + 0.35 * q + 0.15 * cr
    const [inten, itw] = intentOf(c)
    const th = X.theme ? X.themeMatch(X.theme.match, c) : 0
    const pubAge = c.published ? ageDays(c.published + 'T12:00:00Z', now) : Infinity
    const fresh = pubAge <= 7 ? 1 : pubAge <= 30 ? 0.6 * (1 - (pubAge - 7) / 23) : 0
    const nov = tier === 'partial' ? 0.5 : tier === 'glance' ? 0.2 * Math.pow(0.5, ageDays(w.last, now) / 7) : 0
    let imp = 0; for (const d of X.impressions?.[c.id] || []) if (d < today) imp += 0.015 * Math.pow(0.5, ageDays(d + 'T12:00:00Z', now) / 3)
    imp = Math.min(0.3, imp)
    const tr = Math.min(0.5, 0.12 * (tRec[spk(c)] || 0))
    const tf = Math.min(0.3, 0.06 * Math.max(0, ...(c.topics || []).map((t) => topRec[root(t)] || 0)))
    const less = 0.4 * (X.less?.teachers?.[spk(c)] || 0) + 0.2 * Math.max(0, ...(c.topics || []).map((t) => X.less?.topics?.[root(t)] || 0))
    const more = 0.15 * Math.min(2, X.more?.teachers?.[spk(c)] || 0) + 0.08 * Math.min(2, Math.max(0, ...(c.topics || []).map((t) => X.more?.topics?.[root(t)] || 0)))
    const parts = { rel, intent: 0.3 * inten, theme: 0.12 * th, fresh: 0.15 * fresh, more }
    const score = rel + parts.intent + parts.theme + parts.fresh + more - nov - imp - tr - tf - less + jit(c.id)
    scored.push({ c, score, q, aff, th, fresh, pubAge, inten, itw, parts, cr })
  }
  scored.sort((a, b) => b.score - a.score)
  const pool = scored.slice(0, Math.max(600, k * 4))
  const out = [], used = new Set(), perT = {}, usedVid = new Set()
  const okAt = (c) => !used.has(c.id) && !usedVid.has(vid(c)) && !out.slice(-4).some((x) => spk(x.c) === spk(c)) && !(out.length < 20 && (perT[spk(c)] || 0) >= 2)
  const sim = (a, b) => (vid(a) === vid(b) ? 1 : spk(a) === spk(b) ? 0.85 : sch(a) === sch(b) ? 0.45 : fam(a) === fam(b) ? 0.2 : 0)
  const push = (s, kind, why) => { out.push({ c: s.c, kind, why, score: s.score }); used.add(s.c.id); usedVid.add(vid(s.c)); perT[spk(s.c)] = (perT[spk(s.c)] || 0) + 1 }
  // the why line, from the biggest honest reason
  const whyOf = (s) => {
    const c = s.c, P = s.parts
    if (P.intent > 0.12 && s.itw) return `On your mind: ${s.itw.label}`
    if (P.theme >= 0.07 && X.theme) return X.theme.why
    if (s.pubAge <= 7) return 'New this week'
    if (!cold) {
      const tw = T.w('teachers', spk(c)), sw = T.w('traditions', sch(c)), top = (c.topics || []).map(root).map((t) => [t, T.w('topics', t)]).sort((a, b) => b[1] - a[1])[0]
      const best = [['t', tw], ['s', sw], ['p', top ? top[1] * 0.85 : 0]].sort((a, b) => b[1] - a[1])[0]
      if (best[1] > 0.03) {
        if (best[0] === 't') return `Because you resonated with ${X.person(spk(c))?.short || X.person(spk(c))?.n || c.teacher || 'this teacher'}`
        if (best[0] === 's' && X.tradLabel(sch(c))) return `Because ${X.tradLabel(sch(c))} talks resonate with you`
        if (best[0] === 'p' && X.label(top[0])) return `More on ${X.label(top[0]).toLowerCase()}, which resonates with you`
      }
    }
    if (s.pubAge <= 30) return 'New this month'
    if (s.cr > 0.6) return 'Most resonant with listeners'
    return cold ? `A good place to start: ${X.tradLabel(sch(c)) || X.tradLabel(fam(c)) || 'a deep teacher'}` : `Close to what resonates with you`
  }
  // exploration: Thompson sample per family (Beta posterior from the taste; unmet families sit at the prior)
  const fams = [...new Set(pool.map((s) => fam(s.c)))]
  const famN = (f) => (T ? (T.facets.traditions[f]?.n || 0) : 0)
  const explorePick = () => {
    // families the profile has barely met: fewer than 3 signals and no positive lean yet, and not in the last 6 cards
    const near = new Set(out.slice(-6).map((x) => fam(x.c)))
    const cand = fams.filter((f) => famN(f) < 3 && !(T && T.w('traditions', f) > 0.02) && !near.has(f) && pool.some((s) => fam(s.c) === f && okAt(s.c)))
    if (!cand.length) return null
    let bf = null, bv = -1
    for (const f of cand) { const x = T?.facets.traditions[f] || { a: 2, b: 2 }; const v = betaSample(x.a, x.b, r) + 0.15 * (famN(f) === 0); if (v > bv) { bv = v; bf = f } }
    // inside the family: a teacher you have not met first, then quality (+ jitter)
    const L = pool.filter((s) => fam(s.c) === bf && okAt(s.c)).map((s) => [s.q + 0.15 * cr0(s) + (T && (T.facets.teachers[spk(s.c)]?.n || 0) > 0 ? -0.15 : 0.1) + jit(s.c.id) - (X.less?.teachers?.[spk(s.c)] ? 1 : 0), s]).sort((a, b) => b[0] - a[0])
    return L[0]?.[1] || null
  }
  const cr0 = (s) => s.cr - 0.5
  // serendipity: a bridge from the listener's strongest topic (or intention, or theme) to a neighbour on the topic graph
  const topTopic = (!cold && T.top('topics', 3)[0]?.[0]) || Object.keys((X.intents || [])[0]?.topics || {})[0] || X.theme?.match?.topics?.[0] || 'meditation'
  let bridges = null
  const bridgePick = () => {
    if (!bridges) { const seenT = cold ? [] : T.top('topics', 4).map((x) => x[0]); bridges = R.nextTopics(root(topTopic), T || null, seenT, X.topics, 6).filter((b) => b.id !== root(topTopic)) }
    for (const b of bridges) {
      const L = pool.filter((s) => okAt(s.c) && (s.c.topics || []).some((t) => t === b.id || root(t) === b.id)).sort((a, b2) => b2.score - a.score)
      if (L[0]) { bridges = bridges.filter((x) => x !== b); return [L[0], b] }
    }
    return null
  }
  // the themed card (position 2)
  const themePick = () => { if (!X.theme) return null; const L = pool.filter((s) => s.th >= 0.5 && okAt(s.c)).sort((a, b) => b.score - a.score); return L[0] || null }
  const mmrNext = () => {
    let best = null, bs = -Infinity
    const recent = out.slice(-8).map((x) => x.c)
    // shares: the theme takes at most ~30 % of the list, intentions at most ~50 %, so neither crowds out the listener's taste
    const nTh = out.filter((x) => x.kind === 'theme').length, nIn = out.filter((x) => x.why?.startsWith('On your mind')).length
    const capTh = nTh >= Math.max(2, 0.3 * out.length), capIn = nIn >= Math.max(3, 0.5 * out.length)
    for (const s of pool) {
      if (!okAt(s.c)) continue
      let ms = 0; for (const p of recent) { const x = sim(s.c, p); if (x > ms) ms = x }
      const v = 0.65 * (s.score - (capTh ? s.parts.theme : 0) - (capIn ? s.parts.intent : 0)) - 0.35 * ms
      if (v > bs) { bs = v; best = s }
    }
    return best
  }
  const lbl = (f) => X.tradLabel(f) || f
  while (out.length < k) {
    const i = out.length, slot = i % 10
    let done = false
    if (i === 1) { const s = themePick(); if (s) { push(s, 'theme', X.theme.why); done = true } }
    if (!done && (slot === 3 || slot === 7)) { const s = explorePick(); if (s) { push(s, 'explore', cold ? `Something different: ${lbl(fam(s.c))}` : `Something different: ${lbl(fam(s.c))}`); done = true } }
    if (!done && slot === 9) { const bp = bridgePick(); if (bp) { push(bp[0], 'bridge', `A bridge from ${X.label(root(topTopic)) || 'here'} to ${bp[1].label}`); done = true } }
    if (!done) { const s = mmrNext(); if (!s) break; { const why = whyOf(s); push(s, X.theme && why === X.theme.why ? 'theme' : 'fit', why) } }
  }
  return out
}
// Jaccard overlap of two id lists (the day-to-day turnover metric in specs/sim/feed_sim.py)
export const jaccard = (a, b) => { const A = new Set(a), B = new Set(b); let i = 0; for (const x of A) if (B.has(x)) i++; return i / Math.max(1, A.size + B.size - i) }
