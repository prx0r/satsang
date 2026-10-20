// Wiser taste vector (specs/PROFILE.md §2). Built on the device from what the listener did: picks (pairwise and Topic
// flash), "This resonates" hearts, skips before the 60 s gate, "None of these", saves, practice sessions and "Not for me".
// Four facets (traditions = school + family nodes, topics = roots, teachers, styles), each value a Beta(a, b) posterior
// from a neutral crowd prior (a0 = b0 = 2: crowdShare 0.5 until the tally publishes shares). weight = mean − prior mean,
// uncertainty = posterior variance (RANKING §4 information gain). Never shown as numbers.

const A0 = 2, B0 = 2, PRIOR = A0 / (A0 + B0)
const root = (t) => String(t).split('/')[0]

export function buildTaste({ byId, familyOf, schoolOf, events }) {
  const F = { traditions: {}, topics: {}, teachers: {}, styles: {} }
  let n = 0
  const cell = (f, k) => (F[f][k] ||= { a: A0, b: B0, n: 0 })
  const valuesOf = (c) => {
    const sch = schoolOf(c), fam = familyOf(c.tradition || sch)
    const sec = Number(c.end) > 0 ? Number(c.end) - (Number(c.start) || 0) : Number(c.dur) || Number(c.sec) || 0
    return { traditions: [...new Set([sch, fam].filter(Boolean))], topics: [...new Set((c.topics || []).map(root))], teachers: [c.speaker || c.comic].filter(Boolean),
      styles: [sec < 240 ? 'len:short' : sec <= 1200 ? 'len:talk' : 'len:long', c.format === 'vertical' ? 'fmt:vertical' : 'fmt:horizontal', c.delivery ? 'del:' + c.delivery : 'del:talk'] }
  }
  const win = (c, w) => { if (!c || !(w > 0)) return; const V = valuesOf(c); for (const f in V) for (const k of V[f]) { const x = cell(f, k); x.a += w; x.n++ } }
  const lose = (c, w) => { if (!c || !(w > 0)) return; const V = valuesOf(c); for (const f in V) for (const k of V[f]) { const x = cell(f, k); x.b += 0.6 * w; x.n++ } }
  for (const v of events.votes || []) {
    const A = byId[v.a], B = byId[v.b]; if (!A || !B) continue
    const w = v.lowWatch ? 0.5 : 1, W = v.winner === v.a ? A : B, L = v.winner === v.a ? B : A
    win(W, w); lose(L, w); n++
  }
  for (const id of events.resonates || []) { win(byId[id], 0.5); n++ }
  for (const s of events.skips || []) { lose(byId[s], 0.4); }
  for (const shown of events.none || []) for (const id of shown) lose(byId[id], 0.15 / 0.6)
  for (const id of events.saves || []) { win(byId[id], 0.3); n++ }
  // For You / TV (specs/FORYOU.md): "Less like this" = a full loss for the talk's values; "Not interested" hides one talk and
  // counts lightly; "More like this" (TV ↑) = 0.4 of a win; a finished talk (watch log) = +0.2 (PROFILE §2 completion)
  for (const x of events.less || []) lose(byId[x.id], x.kind === 'not' ? 0.3 : 1)
  for (const id of events.more || []) { win(byId[id], 0.4); n++ }
  for (const id of events.completions || []) win(byId[id], 0.2)
  const perDay = {}
  for (const p of events.practice || []) { // +0.1 per session to the practice's traditions and topics, at most 3 a day
    const d = String(p.at || '').slice(0, 10); if ((perDay[d] = (perDay[d] || 0) + 1) > 3) continue
    for (const t of p.traditions || []) { const x = cell('traditions', t); x.a += 0.1; x.n++ }
    for (const t of p.topics || []) { const x = cell('topics', root(t)); x.a += 0.1; x.n++ }
    n++
  }
  for (const [k, on] of Object.entries(events.notForMe || {})) { if (!on) continue; const [f, id] = k.split(':'); if (F[f]) cell(f, id).b += 3 }
  const mean = (x) => x.a / (x.a + x.b)
  const w = (f, k) => { const x = F[f][k]; return x ? mean(x) - PRIOR : 0 }
  const vr = (f, k) => { const x = F[f][k] || { a: A0, b: B0 }; const s = x.a + x.b; return (x.a * x.b) / (s * s * (s + 1)) }
  const affinity = (c) => {
    const V = valuesOf(c), sch = V.traditions[0], fam = V.traditions[1] || sch
    const tr = Math.max(w('traditions', sch), 0.5 * w('traditions', fam))
    const tp = V.topics.length ? Math.max(...V.topics.map((t) => w('topics', t) * 0.85)) : 0
    return 2 * (0.4 * tr + 0.4 * tp + 0.2 * w('teachers', V.teachers[0])) // weights live in about [-0.5, 0.5]; scaled to about [-1, 1]
  }
  const top = (f, k = 6, min = 0.035) => Object.entries(F[f]).map(([id, x]) => [id, mean(x) - PRIOR, x.n]).filter((r) => r[1] > min).sort((a, b) => b[1] - a[1]).slice(0, k)
  const exploring = (fams, k = 3) => fams.map((f) => [f, vr('traditions', f), F.traditions[f]?.n || 0]).sort((a, b) => b[1] - a[1] || a[2] - b[2]).slice(0, k)
  return { n, facets: F, w, var: vr, famVar: (f) => vr('traditions', f), topicW: (t) => w('topics', root(t)), affinity, top, exploring, prior: PRIOR }
}

// compact export of the facets (for /me/taste and the profile export): { facet: { value: [a, b, n] } }
export function tasteJSON(t) {
  const out = {}
  for (const [f, m] of Object.entries(t.facets)) out[f] = Object.fromEntries(Object.entries(m).map(([k, x]) => [k, [Math.round(x.a * 100) / 100, Math.round(x.b * 100) / 100, x.n]]))
  return { v: 1, n: t.n, facets: out }
}
