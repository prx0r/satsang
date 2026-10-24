// Satsang ranking primitives (see ../../specs/RANKING.md). Pure functions, no I/O; shared by the MCP server and the sim spec.

export const familyOf = (trads, id) => { let t = trads[id]; let last = id; while (t) { last = t.id; t = trads[t.parent] } return last }

// Quality in [0,1]. Live signals (bt, completion, resonates) come from the API's /stats when present; the static build only
// has views, depth and topic confidence, so those carry the weight here and the live terms default to neutral.
export function quality(c, ctx) {
  const sp = ctx.person[c.speaker]
  const depth = sp ? Math.min(1, Math.log1p(sp.depth?.clips || 0) / Math.log(31)) : 0
  const viewsPct = ctx.viewsPct.get(c.id) ?? 0.5           // percentile of views WITHIN the speaker's catalogue (fair to small channels)
  const bt = c.stats?.bt != null ? 1 / (1 + Math.exp(-c.stats.bt)) : 0.5
  const btConf = c.stats?.picks ? Math.min(1, c.stats.picks / 30) : 0
  const completion = c.stats?.completion ?? 0.5
  const thin = sp && (sp.depth?.clips || 0) < 3 ? 0.15 : 0   // thin-teacher penalty (RANKING §5)
  const lenFit = c.seconds >= 240 && c.seconds <= 1200 ? 1 : c.seconds < 120 ? 0.4 : 0.75
  const tierB = c.quality?.tier === 'gold' ? 0.12 : c.quality?.tier === 'strong' ? 0.05 : 0 // editorial tier (app/tools/build-gold.py)
  return Math.max(0, (0.35 * (btConf * bt + (1 - btConf) * 0.5) + 0.15 * completion + 0.2 * depth + 0.15 * viewsPct + 0.15 * lenFit) - thin + tierB)
}

// Similarity between two clips for diversity: same parent video > same speaker > same tradition > same family.
export function sim(a, b, ctx) {
  if (a.media.videoId === b.media.videoId) return 1
  if (a.speaker === b.speaker) return 0.85
  const ta = a.traditions[0], tb = b.traditions[0]
  if (ta === tb) return 0.55
  if (familyOf(ctx.tradition, ta) === familyOf(ctx.tradition, tb)) return 0.3
  return 0
}

// Maximal Marginal Relevance: pick k items, each maximising lambda*rel - (1-lambda)*max sim to those already picked.
export function mmr(cands, rel, k, ctx, lambda = 0.6) {
  const picked = [], pool = cands.slice()
  while (picked.length < k && pool.length) {
    let best = -1, bestScore = -Infinity
    for (let i = 0; i < pool.length; i++) {
      const c = pool[i]
      let maxSim = 0
      for (const p of picked) { const s = sim(c, p, ctx); if (s > maxSim) maxSim = s; if (maxSim === 1) break }
      const score = lambda * rel(c) - (1 - lambda) * maxSim
      if (score > bestScore) { bestScore = score; best = i }
    }
    picked.push(pool.splice(best, 1)[0])
  }
  return picked
}

// Taste vector from liked ids (clip/person/topic/tradition gids or bare clip ids). Beta posteriors per tradition family
// and school, plus simple counts for topics and teachers.
export function tasteFrom(ids, ctx, disliked = []) {
  const t = { traditions: {}, topics: {}, teachers: {}, n: 0 }
  const bump = (obj, k, w) => { if (k) obj[k] = (obj[k] || 0) + w }
  const apply = (raw, w) => {
    const id = String(raw)
    const [kind, ...rest] = id.includes('/') && /^(clip|person|topic|tradition)\//.test(id) ? id.split('/') : ['clip', id]
    const local = rest.join('/') || id
    if (kind === 'clip' && ctx.clip[local]) {
      const c = ctx.clip[local]; t.n++
      bump(t.teachers, c.speaker, w)
      for (const tr of c.traditions) { bump(t.traditions, tr, w); bump(t.traditions, familyOf(ctx.tradition, tr), w * 0.5) }
      for (const tp of c.topics) bump(t.topics, tp.id.split('/')[0], w * tp.conf)
    } else if (kind === 'person' && ctx.person[local]) {
      t.n++; bump(t.teachers, local, w * 2); for (const tr of ctx.person[local].traditions) bump(t.traditions, tr, w)
    } else if (kind === 'topic') { t.n++; bump(t.topics, local.split('/')[0], w * 2) }
    else if (kind === 'tradition' && ctx.tradition[local]) { t.n++; bump(t.traditions, local, w * 2) }
  }
  for (const id of ids) apply(id, 1)
  for (const id of disliked) apply(id, -0.6)
  return t
}

const norm = (obj) => { const m = Math.max(1e-9, ...Object.values(obj).map(Math.abs)); return (k) => (obj[k] || 0) / m }

// Personal relevance of a clip to a taste vector, in about [-1,1].
export function affinity(c, taste, ctx) {
  if (!taste || !taste.n) return 0
  const T = norm(taste.traditions), P = norm(taste.topics), S = norm(taste.teachers)
  const tr = Math.max(...c.traditions.map((x) => Math.max(T(x), 0.5 * T(familyOf(ctx.tradition, x)))))
  const tp = c.topics.length ? Math.max(...c.topics.map((x) => P(x.id.split('/')[0]) * x.conf)) : 0
  return 0.4 * tr + 0.4 * tp + 0.2 * S(c.speaker)
}

// Beta-posterior variance per tradition family: how unsure we are whether the user resonates with it.
export function uncertainty(taste, ctx, fam) {
  const v = taste?.traditions?.[fam] || 0
  const a = 1 + Math.max(0, v), b = 1 + Math.max(0, -v) + (taste?.n ? 0.15 * taste.n * (v <= 0 ? 1 : 0) : 0)
  return (a * b) / ((a + b) ** 2 * (a + b + 1))   // max 1/12 at a=b=1
}

// Next topic: graph neighbourhood x novelty x information gain on the profile x depth gate.
export function nextTopics(fromTopic, taste, ctx, k = 5, seen = []) {
  const out = []
  for (const t of Object.values(ctx.topic)) {
    if (t.parent || t.id === fromTopic || seen.includes(t.id)) continue
    const d = t.depth || {}
    if ((d.clips || 0) < 12 || (d.traditions || 0) < 3) continue          // publish gate (TOPICS §6)
    const adj = fromTopic ? (ctx.topic[fromTopic]?.related?.includes(t.id) ? 1 : 0) + (ctx.cooc.get(fromTopic + '|' + t.id) || 0) : 0.5
    const fams = ctx.topicFamilies.get(t.id) || {}
    const tot = Object.values(fams).reduce((s, x) => s + x, 0) || 1
    const ig = Object.entries(fams).reduce((s, [f, n]) => s + (n / tot) * uncertainty(taste, ctx, f), 0) * 12   // 0..1
    const fit = taste?.n ? Math.max(0, (taste.topics[t.id] || 0) / Math.max(1, ...Object.values(taste.topics))) : 0
    const score = 0.45 * Math.min(1, adj) + 0.3 * ig + 0.15 * fit + 0.1 * Math.min(1, Math.log1p(d.clips) / Math.log(200))
    out.push({ id: t.id, label: t.label, score: +score.toFixed(3), why: { adjacency: +Math.min(1, adj).toFixed(2), infoGain: +ig.toFixed(2), fit: +fit.toFixed(2) } })
  }
  return out.sort((a, b) => b.score - a.score).slice(0, k)
}
