// Wiser ranking in the browser (specs/RANKING.md, ported from mcp/src/rank.mjs to the site's clip shape).
// Pure: no DOM, no storage. createRanker(ctx) indexes the catalogue once and answers: clip quality q, the topic publish
// gate (specs/TOPICS.md §6), MMR-diverse lists, the next topic (adjacency + information gain + fit + depth) and the three
// teachers of a Topic flash (two best fits from different schools + one explore slot, session fatigue, main-tier fronts).

export const MAIN_MIN = 8 // RANKING §5: main tier = at least 8 ballot talks

// Wiser's own one-line questions for each topic (the title card's second line). Hubs may override with their intro.
export const TOPIC_Q = {
  rebirth: 'Does anything carry on after death?', kamma: 'Do our actions follow us?', self: 'Who, or what, am I?', meditation: 'What happens when we sit still?',
  'sense-restraint': 'Why guard the senses?', jhana: 'What are the deep absorptions?', 'dependent-origination': 'How does suffering arise, link by link?',
  dukkha: 'Why is there suffering, and can it end?', craving: 'What does wanting do to us?', mindfulness: 'What does it mean to be present?',
  virtue: 'Why does how we live matter for the path?', renunciation: 'What is gained by letting go?', death: 'How should we meet death?',
  emotions: 'What do we do with anger, fear and grief?', relationships: 'How does practice live with the people we love?', impermanence: 'What changes, and what does not?',
  'right-view': 'What is the right way to see?', awakening: 'What is awakening?', feeling: 'What is a feeling, before we react to it?',
  thought: 'Are we our thoughts?', defilements: 'What clouds the mind?', kindness: 'How do we grow a kind heart?', faith: 'What is faith, and what is it for?',
  'daily-life': 'How does practice fit an ordinary day?', texts: 'How should we read the old texts?', consciousness: 'What is consciousness?',
  reality: 'Is the world as it appears?', guru: 'Do we need a teacher?', soul: 'Is there a soul?', gnosis: 'Can we know the divine directly?',
  divine: 'What is God, or the divine?', freedom: 'What does it mean to be free?', imaginal: 'What is the imagination for?',
  'self/emptiness': 'What does it mean that things are empty?', 'meditation/kundalini': 'What is the subtle body?',
}
// the bridge's plain-words hook for a topic ("Rebirth leads to Karma: what carries on is what you do")
export const TOPIC_HOOK = {
  rebirth: 'what carries on, and what does not', kamma: 'what carries on is what you do', self: 'who is it that lives and dies', meditation: 'the practice under every answer',
  'sense-restraint': 'where craving begins', jhana: 'the stillness the teachers point to', 'dependent-origination': 'the chain that turns the round',
  dukkha: 'the question every tradition starts from', craving: 'the fuel of becoming', mindfulness: 'the attention that sees it', virtue: 'the ground the path stands on',
  renunciation: 'what letting go makes room for', death: 'the one certainty', emotions: 'what moves us', relationships: 'practice among people', impermanence: 'everything that changes',
  'right-view': 'seeing it rightly', awakening: 'where the path leads', feeling: 'where reaction starts', thought: 'the voice in the head', defilements: 'what clouds the mind',
  kindness: 'the warm side of wisdom', faith: 'trust on the way', 'daily-life': 'the path in an ordinary day', texts: 'the words behind the teachings',
  consciousness: 'the knowing itself', reality: 'what is really here', guru: 'the one who shows the way', soul: 'the old word for what carries on', gnosis: 'knowing, not believing',
  divine: 'the ground of it all', freedom: 'what release feels like', imaginal: 'the images between worlds', 'self/emptiness': 'nothing standing alone', 'meditation/kundalini': 'the energy in the body',
}

const clamp01 = (x) => Math.max(0, Math.min(1, x))
const root = (t) => String(t).split('/')[0]

export function createRanker(ctx) {
  // ctx: clips() -> array, trad(id) -> {parent,label,kind}, ballot(c) -> bool, servable(c), stats() -> {clipId: {bt, picks, resonates}},
  //      hub(t) -> hub|null, label(t) -> string|null, vertical(c) -> bool, played(c) -> seconds, isVirtual(c)
  let IX = null, IXN = -1
  const chain = (t) => { const out = []; let x = t, g = 0; while (x && ctx.trad(x) && g++ < 10) { out.push(x); x = ctx.trad(x).parent } return out.length ? out : [t] }
  const familyOf = (t) => chain(t).slice(-1)[0] || t
  const schoolOf = (c) => c.school || c.tradition || 'unknown'
  const famOfClip = (c) => familyOf(c.tradition || schoolOf(c))
  const vid = (c) => c.parent || String(c.id).split('@')[0]

  function build() {
    const L = ctx.clips()
    if (IX && IXN === L.length) return IX
    const bal = L.filter((c) => ctx.ballot(c))
    const nBal = {}, nAll = {}, views = {}
    for (const c of L) { const s = c.speaker || c.comic; nAll[s] = (nAll[s] || 0) + 1 }
    for (const c of bal) { const s = c.speaker || c.comic; nBal[s] = (nBal[s] || 0) + 1; (views[s] ||= []).push(Number(c.views) || 0) }
    for (const s in views) views[s].sort((a, b) => a - b)
    const vp = new Map()
    for (const c of bal) { const a = views[c.speaker || c.comic], v = Number(c.views) || 0; let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < v) lo = m + 1; else hi = m } vp.set(c.id, a.length > 1 ? lo / (a.length - 1) : 0.5) }
    // topics: ballot clips per topic (leaves count for roots), schools, families, teachers; co-occurrence lift
    const T = {}, co = {}
    for (const c of bal) {
      const tps = [...new Set((c.topics || []).flatMap((t) => (t.includes('/') ? [t, root(t)] : [t])))]
      for (const t of tps) {
        const o = (T[t] ||= { id: t, clips: [], schools: new Set(), fams: {}, teachers: {} })
        o.clips.push(c); o.schools.add(schoolOf(c)); const f = famOfClip(c); o.fams[f] = (o.fams[f] || 0) + 1
        const s = c.speaker || c.comic; o.teachers[s] = (o.teachers[s] || 0) + 1
      }
      const rs = [...new Set(tps.map(root))]
      for (const a of rs) for (const b of rs) if (a !== b) co[a + '|' + b] = (co[a + '|' + b] || 0) + 1
    }
    const lift = new Map()
    for (const [k, n] of Object.entries(co)) if (n >= 3) { const [a, b] = k.split('|'); const na = T[a]?.clips.length || 1, nb = T[b]?.clips.length || 1; lift.set(k, clamp01(Math.log1p((n * bal.length) / (na * nb)) / Math.log(8))) }
    IX = { bal, nBal, nAll, vp, T, lift }; IXN = L.length
    return IX
  }
  const tier = (s) => ((build().nBal[s] || 0) >= MAIN_MIN ? 'main' : 'more')
  const btOf = (c) => { const s = ctx.stats()?.[c.id]; return s && s.picks ? { bt: 1 / (1 + Math.exp(-(Number(s.bt) || 0))), conf: Math.min(1, s.picks / 30), picks: s.picks } : { bt: 0.5, conf: 0, picks: 0 } }
  function quality(c) {
    const I = build(), s = c.speaker || c.comic, n = I.nBal[s] || 0
    const B = btOf(c), st = ctx.stats()?.[c.id]
    const btP = B.conf * B.bt + (1 - B.conf) * 0.5
    const comp = st && st.plays ? (st.completion * st.plays + 0.5 * 20) / (st.plays + 20) : 0.5
    const depth = Math.min(1, Math.log1p(n) / Math.log(31))
    const sec = ctx.played(c) || 0
    const lenFit = sec >= 240 && sec <= 1200 ? 1 : sec >= 120 ? 0.75 : 0.4
    const thin = n < 3 ? 0.15 : 0
    return Math.max(0, 0.35 * btP + 0.15 * comp + 0.2 * depth + 0.15 * (I.vp.get(c.id) ?? 0.5) + 0.15 * lenFit - thin)
  }
  const topicConf = (c, t) => { const n = (c.topics || []).length; return (c.topics || []).includes(t) ? (n <= 2 ? 0.9 : n <= 4 ? 0.8 : 0.7) : 0.5 }
  // RANKING §2 similarity; teacher pages use topic overlap instead (§8)
  function sim(a, b) {
    if (vid(a) === vid(b)) return 1
    if ((a.speaker || a.comic) === (b.speaker || b.comic)) return 0.85
    if (schoolOf(a) === schoolOf(b)) return 0.55
    if (famOfClip(a) === famOfClip(b)) return 0.3
    return 0
  }
  function topicSim(a, b) {
    if (vid(a) === vid(b)) return 1
    const A = new Set((a.topics || []).map(root)), B = (b.topics || []).map(root)
    if (!A.size || !B.length) return 0.2
    let i = 0; for (const t of new Set(B)) if (A.has(t)) i++
    return i / (A.size + new Set(B).size - i)
  }
  function mmr(cands, rel, k, lambda = 0.55, simFn = sim) {
    const picked = [], pool = cands.slice(), relC = new Map(pool.map((c) => [c.id, rel(c)]))
    while (picked.length < k && pool.length) {
      let best = 0, bs = -Infinity
      for (let i = 0; i < pool.length; i++) {
        const c = pool[i]; let ms = 0
        for (const p of picked) { const s = simFn(c, p); if (s > ms) ms = s; if (ms === 1) break }
        const sc = lambda * relC.get(c.id) - (1 - lambda) * ms
        if (sc > bs) { bs = sc; best = i }
      }
      picked.push(pool.splice(best, 1)[0])
    }
    return picked
  }
  // hub/rail order with the hard rules: no two passages of one video adjacent, ≤ 2 talks per teacher in the first 12, more-voices after 8
  function railOrder(list, rel, k = 24, lambda = 0.55) {
    const m = mmr(list, rel, Math.min(list.length, k * 2), lambda)
    const out = [], per = {}, late = []
    for (const c of m) {
      const s = c.speaker || c.comic
      if (out.length < 12 && (per[s] || 0) >= 2) { late.push(c); continue }
      if (out.length < 8 && tier(s) !== 'main') { late.push(c); continue }
      if (out.length && (vid(out[out.length - 1]) === vid(c) || (out[out.length - 1].speaker || out[out.length - 1].comic) === s)) { late.push(c); continue }
      out.push(c); per[s] = (per[s] || 0) + 1
      if (out.length >= k) break
    }
    for (const c of late) { if (out.length >= k) break; out.push(c) }
    return out
  }

  // ---------- topics: the publish gate (TOPICS §6) ----------
  function info(t) {
    const o = build().T[t]
    if (!o) return { id: t, clips: 0, schools: 0, families: 0, teachers: 0, main: 0, published: false }
    const teachers = Object.keys(o.teachers), main = teachers.filter((s) => tier(s) === 'main').length
    const families = Object.keys(o.fams).length
    const published = o.clips.length >= 12 && o.schools.size >= 3 && (t.includes('/') || families >= 2) && teachers.length >= 5 && main >= 3
    return { id: t, clips: o.clips.length, schools: o.schools.size, families, teachers: teachers.length, main, published, fams: o.fams }
  }
  const question = (t) => { const h = ctx.hub(t); const first = h?.intro ? String(h.intro).split(/(?<=[?])\s/)[0] : ''; return TOPIC_Q[t] || (first.endsWith('?') ? first : '') || h?.questions?.[0]?.label || '' }
  function published(topics) { return topics.map(info).filter((x) => x.published && ctx.label(x.id)).map((x) => ({ ...x, label: ctx.label(x.id), question: question(x.id) })) }

  // ---------- next topic (RANKING §4) ----------
  function nextTopics(from, taste, seen, topics, k = 5) {
    const I = build(), pub = published(topics).filter((x) => x.id !== from && !seen.includes(x.id))
    const fromRel = new Set(ctx.hub(from)?.related || [])
    const igRaw = new Map(), fam = taste?.famVar || (() => 1 / 12)
    for (const x of pub) { const tot = Object.values(x.fams).reduce((s, n) => s + n, 0) || 1; igRaw.set(x.id, Object.entries(x.fams).reduce((s, [f, n]) => s + (n / tot) * fam(f), 0)) }
    const igMax = Math.max(1e-9, ...igRaw.values())
    const tw = taste?.topicW || (() => 0), twMax = Math.max(1e-9, ...pub.map((x) => Math.max(0, tw(x.id))))
    const out = pub.map((x) => {
      const adj = from ? Math.min(1, (fromRel.has(x.id) || (ctx.hub(x.id)?.related || []).includes(from) ? 1 : 0) + (I.lift.get(root(from) + '|' + root(x.id)) || 0)) : 0.5
      const ig = igRaw.get(x.id) / igMax, fit = taste?.n ? Math.max(0, tw(x.id)) / twMax : 0
      const depth = Math.min(1, Math.log1p(x.clips) / Math.log(200))
      const parts = { adjacency: 0.45 * adj, infoGain: 0.3 * ig, fit: 0.15 * fit, depth: 0.1 * depth, intent: 0.25 * (ctx.intent ? Math.min(1, ctx.intent(x.id) || 0) : 0) } // intent: FORYOU §2 (what the listener brings)
      const score = parts.adjacency + parts.infoGain + parts.fit + parts.depth + parts.intent
      const why = Object.entries(parts).sort((a, b) => b[1] - a[1])[0][0]
      return { id: x.id, label: x.label, question: x.question, score, why, fams: x.fams }
    })
    return out.sort((a, b) => b.score - a.score).slice(0, k)
  }

  // ---------- one Topic flash (LOOP §1, RANKING §4.3) ----------
  // opts: { taste, seenTeachers: {speaker: n}, deeper, preferVertical, exclude: Set(clip ids), avoidSchools: Set }
  function composeFlash(t, opts = {}) {
    const I = build(), o = I.T[t]; if (!o) return null
    const taste = opts.taste, seen = opts.seenTeachers || {}, ex = opts.exclude || new Set()
    const cands = o.clips.filter((c) => ctx.servable(c) && !ex.has(c.id) && (opts.deeper || !seen[c.speaker || c.comic]) && !(opts.avoidSchools && opts.avoidSchools.has(schoolOf(c))))
    const lambda = taste?.n ? 0.55 : 0.45
    const rel = (c) => {
      const q = quality(c), base = 0.6 * q + 0.4 * topicConf(c, t)
      const aff = taste?.n ? taste.affinity(c) : null
      let r = aff == null ? base : 0.55 * aff + 0.45 * base
      r -= 0.3 * (seen[c.speaker || c.comic] || 0) // session fatigue
      if (opts.preferVertical && ctx.vertical(c)) r += 0.25 // phone: vertical first per slot
      return r
    }
    const main = cands.filter((c) => tier(c.speaker || c.comic) === 'main')
    const picks = []
    const okWith = (c) => picks.every((p) => schoolOf(p) !== schoolOf(c) && (p.speaker || p.comic) !== (c.speaker || c.comic) && vid(p) !== vid(c))
    // slots 1-2: MMR on personalised relevance over main-tier talks, hard rule: different schools (ideally families)
    const ordered = mmr(main, rel, Math.min(main.length, 60), lambda)
    for (const c of ordered) { if (picks.length >= 2) break; if (!okWith(c)) continue; if (picks.length === 1 && famOfClip(picks[0]) === famOfClip(c) && ordered.some((d) => okWith(d) && famOfClip(d) !== famOfClip(picks[0]) && rel(d) > rel(c) - 0.12)) continue; picks.push(c) }
    if (picks.length < 2) for (const c of ordered) { if (picks.length >= 2) break; if (okWith(c)) picks.push(c) }
    if (picks.length < 2) return picks.length ? null : null
    // slot 3 (explore): the family the profile is least sure about, best quality there (+ new-clip bonus); main tier, or earned depth
    const famVar = taste?.famVar || (() => 1 / 12)
    const usedF = new Set(picks.map(famOfClip))
    const exPool = cands.filter((c) => okWith(c) && (tier(c.speaker || c.comic) === 'main' || (btOf(c).bt >= 0.6 && btOf(c).picks >= 30)))
    const byFam = {}; for (const c of exPool) (byFam[famOfClip(c)] ||= []).push(c)
    const famOrder = Object.keys(byFam).sort((a, b) => (usedF.has(a) - usedF.has(b)) || famVar(b) - famVar(a) || byFam[b].length - byFam[a].length)
    let explore = null
    for (const f of famOrder) {
      const best = byFam[f].map((c) => [quality(c) + 0.1 * (1 - btOf(c).conf) - 0.3 * (seen[c.speaker || c.comic] || 0) + (opts.preferVertical && ctx.vertical(c) ? 0.25 : 0), c]).sort((a, b) => b[0] - a[0])[0]
      if (best) { explore = best[1]; break }
    }
    const slots = picks.map(() => 'fit')
    if (explore) { picks.push(explore); slots.push('explore') }
    return { topic: t, clips: picks, slots }
  }

  return { build, quality, sim, topicSim, mmr, railOrder, info, published, question, nextTopics, composeFlash, tier, familyOf, chain, schoolOf, famOfClip, topicConf }
}
