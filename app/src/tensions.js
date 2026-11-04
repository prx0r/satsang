// For You from the journal's tensions (specs/FORYOU-TENSIONS.md). Pure functions, no DOM, no storage: tested by
// tools/awaken/test-foryou-tensions.mjs with synthetic tensions only.
//   tensionsOf(docs)        the journal's tension files (public only) -> [{id, title, status, domain, roots, txt, day}] (device only)
//   knotsFor(t, KN)         a tension -> generic knot ids from site/data/wisegraph/knots.json (`match`: domain, roots, words)
//   planBlocks(sig, KN, X)  -> {safety, blocks: [{id, title, status, kind, roles: [{role, label, hint, picks}]}], used}
// One block per open tension (then loosening, then one per strong concern from the entries that no tension covers; resolved
// tensions get at most one "integration" pick). Each role (Resolve / Enlighten / Explain) holds 1-3 pointers to real talks,
// transcript moments or practices, with Satsang's own why-line from the build (app/tools/build-knots.mjs). Never a held
// teacher, never one video twice on the page, at most one talk per teacher in a block and two on the page, Trika first when
// it fits as well. Safety: crisis / emergency -> no picks; unsettled -> grounding practices and gentle talks only; soften /
// stop -> no intense or teacher-only practice, and the gentle note. "This helped" (device) lowers that tension's urgency and
// raises similar items; "Not this" hides a pick for 30 days; a muted tension shows nothing for 30 days.
import { safetyCard, BANNED } from './journal.js'

const DAY = 86400000
export const ROLES = ['resolve', 'enlighten', 'explain']
export const STATUS_W = { open: 1, loosening: 0.6, resolved: 0.15 }
// concern ids (src/journal.js signals) -> knot ids, for the blocks that come from the entries rather than a tension file
export const CONCERN_KNOT = { craving: 'craving', livelihood: 'livelihood', shame: 'shame', doubt: 'doubt', anger: 'anger', anxiety: 'fear', grief: 'grief', relationships: 'relationships', restless: 'restless', sloth: 'sloth', illness: 'illness' }
// picks per role by block kind (owner 2026-11-05: 1-3 per role; loosening fewer and gentler; resolved none or one integration pick)
export const BUDGET = { open: { resolve: 3, enlighten: 2, explain: 2 }, loosening: { resolve: 1, enlighten: 1, explain: 1 }, entry: { resolve: 1, enlighten: 1, explain: 1 }, resolved: { enlighten: 1 } }
const HELPED_DAYS = 30, NOT_DAYS = 30
const recent = (at, now, days) => !!at && now - Date.parse(at) < days * DAY

// the tension's own short title, in the person's words: its file name (slug), at most four words. Shown only on their device.
export function titleOf(id) {
  const w = String(id || '').replace(/\.md$/, '').split(/[-_\s]+/).filter(Boolean).slice(0, 4)
  const s = w.join(' ')
  return s ? s[0].toUpperCase() + s.slice(1) : 'A tension'
}
export function tensionsOf(docs) {
  return (docs || []).filter((d) => d.kind === 'tension' && d.visibility === 'public').map((d) => {
    const slug = String(d.id || '').split('/').pop().replace(/\.md$/, '')
    const prog = [...String(d.body || '').matchAll(/^#{2,4}\s*(\d{4}-\d{2}-\d{2})/gm)].map((m) => m[1]).sort()
    return { id: slug, title: titleOf(slug), status: STATUS_W[d.status] != null ? d.status : 'open', domain: d.domain || null, roots: d.roots || [],
      opened: d.date ? String(d.date).slice(0, 10) : null, last: prog[prog.length - 1] || (d.date ? String(d.date).slice(0, 10) : null),
      txt: `${d.summary || ''}\n${String(d.body || '').slice(0, 900)}`.toLowerCase() }   // for knot matching on the device; never shown
  })
}
const rxCache = new Map(), rx = (s) => { if (!rxCache.has(s)) rxCache.set(s, new RegExp(s, 'i')); return rxCache.get(s) }
// domain (the person's own header) 2, words in the summary/opening 1.5 (summary) or 0.6 (body), roots 0.4
export function knotsFor(t, KN) {
  const out = []
  const summary = String(t.txt || '').split('\n')[0]
  for (const k of KN?.knots || []) {
    const m = k.match || {}; let w = 0
    if (t.domain && (m.domain || []).includes(String(t.domain).toLowerCase())) w += 2
    if (m.re && rx(m.re).test(summary)) w += 1.5
    else if (m.re && rx(m.re).test(t.txt || '')) w += 0.6
    if ((t.roots || []).some((r) => (m.roots || []).includes(r))) w += 0.4
    if (w > 0) out.push({ id: k.id, w })
  }
  return out.sort((a, b) => b.w - a.w || a.id.localeCompare(b.id))
}

// X: { clip(id) -> catalogue clip or null (null = not playable here), practice(id) -> record or null, isHeld(speakerId),
//      mutes {tensionOrConcernId: iso}, not {ref: iso}, helped [{tid, ref, t, tr, knot, role, at}], now, maxEntry }
export function planBlocks(sig, KN, X = {}) {
  if (!sig || !KN?.knots) return null
  const now = X.now || Date.now(), card = safetyCard(sig)
  if (card && card.items === false) return { safety: card, blocks: [], used: new Set() }
  const grounding = card?.items === 'grounding', gentle = !!card
  const KB = Object.fromEntries(KN.knots.map((k) => [k.id, k]))
  const helped = (X.helped || []).filter((h) => recent(h.at, now, HELPED_DAYS)), not = X.not || {}, mutes = X.mutes || {}
  const muted = (id) => recent(mutes[id], now, 30)
  const concernU = Object.fromEntries((sig.concerns || []).map((c) => [c.id, c.U]))
  const knotU = (kid) => Math.max(0, ...Object.entries(CONCERN_KNOT).filter(([, k]) => k === kid).map(([c]) => concernU[c] || 0))
  // ---- the blocks to fill, most urgent first ----
  const B = []
  for (const t of sig.tensions || []) {
    if (muted('t:' + t.id)) continue
    const ks = knotsFor(t, KN); if (!ks.length) continue
    const nh = helped.filter((h) => h.tid === 't:' + t.id).length
    const U = (STATUS_W[t.status] ?? 1) * (0.5 + 0.5 * knotU(ks[0].id)) * Math.max(0.3, Math.pow(0.7, nh))
    B.push({ id: 't:' + t.id, title: t.title, status: t.status, kind: t.status === 'resolved' ? 'resolved' : t.status === 'loosening' ? 'loosening' : 'open', knots: ks, U })
  }
  const covered = new Set(B.map((b) => b.knots[0].id))
  const entry = (sig.concerns || []).filter((c) => (c.need === 'issues') && c.U >= 0.4 && CONCERN_KNOT[c.id] && !covered.has(CONCERN_KNOT[c.id]) && !muted(c.id) && !muted('c:' + c.id))
  for (const c of entry.slice(0, X.maxEntry ?? 2)) {
    const nh = helped.filter((h) => h.tid === 'c:' + c.id).length
    covered.add(CONCERN_KNOT[c.id])
    B.push({ id: 'c:' + c.id, title: c.label, status: c.trend === 'loosening' ? 'loosening' : 'open', kind: 'entry', knots: [{ id: CONCERN_KNOT[c.id], w: 1 }], U: 0.55 * c.U * Math.max(0.3, Math.pow(0.7, nh)) })
  }
  const RANK = { open: 0, loosening: 1, entry: 2, resolved: 3 }
  B.sort((a, b) => RANK[a.kind] - RANK[b.kind] || b.U - a.U || a.id.localeCompare(b.id))
  // ---- fill them: one pass, page-wide dedupe ----
  const usedV = new Set(), usedP = new Set(), perT = {}, blocks = []
  const intenseP = new Set(KN.intense?.practices || []), intenseT = new Set(KN.intense?.topics || [])
  const groundP = new Set(KN.grounding?.practices || []), groundT = new Set(KN.grounding?.topics || [])
  const refOf = (x) => x.k === 'practice' ? 'practice:' + x.id : x.k === 'moment' ? `moment:${x.id}@${x.start}` : 'clip:' + x.id
  const vidOf = (x, c) => x.k === 'practice' ? null : x.k === 'moment' ? x.id : (c?.parent || String(x.id).split('@')[0])
  function okPractice(x, p) {
    if (!p || usedP.has(x.id) || recent(not[refOf(x)], now, NOT_DAYS)) return false
    if (grounding) return groundP.has(x.id)
    if (gentle && (intenseP.has(x.id) || p.needsTeacher || x.needsTeacher)) return false
    return !intenseP.has(x.id) && !p.needsTeacher && !x.needsTeacher   // teacher-only practices are orientation, never a Resolve pick
  }
  function okClip(x, c, blockT) {
    if (!c || X.isHeld?.(x.t) || X.isHeld?.(c.speaker) || recent(not[refOf(x)], now, NOT_DAYS)) return false
    const v = vidOf(x, c); if (usedV.has(v) || blockT.has(x.t) || (perT[x.t] || 0) >= 3) return false
    const tops = c.topics || []
    if (grounding && !tops.some((t) => groundT.has(t))) return false
    if (gentle && tops.some((t) => intenseT.has(t))) return false
    return true
  }
  const simBoost = (b, x, knot, role) => { // "This helped": more like what helped, within this tension first
    let s = 0
    for (const h of helped) { const same = h.tid === b.id ? 1 : 0.4; if (h.t && h.t === x.t) s += 0.3 * same; if (h.tr && x.tr) s += 0.1 * same; if (h.knot === knot && h.role === role) s += 0.1 * same }
    return Math.min(0.6, s)
  }
  for (const b of B) {
    const budget = { ...BUDGET[b.kind] }
    if (grounding) { for (const r of ROLES) budget[r] = r === 'resolve' ? 2 : 0 }
    const blockT = new Set(), roles = []
    const roleOrder = b.kind === 'resolved' ? ['enlighten'] : ROLES
    for (const role of roleOrder) {
      const n = budget[role] || 0; if (!n) continue
      // candidates from every knot this block maps to, weighted by how strongly the tension names that knot
      const top = b.knots[0].w, C = []
      for (const kw of b.knots.slice(0, 3)) {
        const K = KB[kw.id]; if (!K) continue
        const f = kw.id === b.knots[0].id ? 1 : Math.min(0.8, kw.w / top) * 0.7
        // loosening and entry blocks are gentler: guided / kindness items first, long talks last
        const soft = b.kind !== 'open' ? (x) => (x.g ? 0.25 : 0) - ((x.d || 0) > 25 ? 0.3 : 0) : () => 0
        for (const x of K.roles[role]?.picks || []) C.push({ x, knot: kw.id, s: x.s * f + simBoost(b, x, kw.id, role) + soft(x) })
        if (role === 'resolve') for (const x of K.roles[role]?.practices || []) C.push({ x, knot: kw.id, s: x.s * f + simBoost(b, x, kw.id, role) })
      }
      // variety of teachers: a teacher already on the page costs 0.35 per earlier pick (hard stop at 3)
      for (const y of C) if (y.x.k !== 'practice') y.s -= 0.35 * (perT[y.x.t] || 0)
      C.sort((p, q) => q.s - p.s || String(p.x.id).localeCompare(String(q.x.id)))
      const picks = []
      const take = (y) => {
        const c = y.x.k === 'practice' ? null : X.clip?.(y.x.id) || null, p = y.x.k === 'practice' ? X.practice?.(y.x.id) : null
        if (y.x.k === 'practice' ? !okPractice(y.x, p) : !okClip(y.x, c, blockT)) return false
        if (y.x.k === 'practice' && picks.some((z) => z.k === 'practice')) return false
        picks.push({ ...y.x, c, p, role, knot: y.knot, ref: refOf(y.x), why: b.kind === 'resolved' ? 'Integration: ' + y.x.why.replace(/^./, (m) => m.toLowerCase()) : y.x.why })
        if (y.x.k === 'practice') usedP.add(y.x.id); else { usedV.add(vidOf(y.x, c)); blockT.add(y.x.t); perT[y.x.t] = (perT[y.x.t] || 0) + 1 }
        return true
      }
      // Trika first (owner 2026-11-04): on Enlighten, a Trika talk within 80 % of the best leads; elsewhere it breaks near-ties
      const best = C.find((y) => y.x.k !== 'practice')?.s || 0
      if (role === 'enlighten' || b.kind === 'open') { const t = C.find((y) => y.x.tr && y.x.k !== 'practice' && y.s >= (role === 'enlighten' ? 0.8 : 0.9) * best); if (t) take(t) }
      // a second Enlighten pick from another view (no-self, the witness) when one is close: two angles beat two of a kind
      if (role === 'enlighten' && n > 1 && picks.length === 1) { const lead = picks[0], o = C.find((y) => y.x.k !== 'practice' && !!y.x.tr !== !!lead.tr && y.s >= 0.8 * best); if (o) take(o) }
      // an open tension's Resolve keeps its last slot for a practice (breath, body, kindness: the doing, not only the hearing)
      const talkMax = role === 'resolve' && b.kind === 'open' && n > 1 && C.some((y) => y.x.k === 'practice' && okPractice(y.x, X.practice?.(y.x.id))) ? n - 1 : n
      for (const y of C) { if (picks.length >= n) break; if (y.x.k !== 'practice' && picks.filter((z) => z.k !== 'practice').length >= talkMax) continue; take(y) }
      if (picks.length) roles.push({ role, label: b.kind === 'resolved' ? 'Integration' : KN.roles?.[role]?.label || role, hint: b.kind === 'resolved' ? 'one thing to carry' : KN.roles?.[role]?.hint || '', picks: picks.slice(0, n) })
    }
    if (roles.length) blocks.push({ id: b.id, title: b.title, status: b.status, kind: b.kind, U: +b.U.toFixed(3), knot: b.knots[0].id, roles })
  }
  return { safety: card, blocks, used: usedV }
}
export const pickWhyOk = (s) => typeof s === 'string' && s.length > 0 && s.length <= 96 && !BANNED.test(s)
// flattened, for the compact rail on Watch: the first pick of each role, block by block (<= max)
export function flatPicks(plan, max = 6) {
  const out = []
  if (!plan) return out
  for (let i = 0; i < 3 && out.length < max; i++) for (const b of plan.blocks) for (const r of b.roles) { const p = r.picks[i]; if (p && out.length < max && !out.includes(p)) out.push({ ...p, block: b }) }
  return out
}
