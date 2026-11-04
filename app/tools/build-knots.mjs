// Knots -> ranked candidates per role (specs/FORYOU-TENSIONS.md). Build time, deterministic, no model.
//   in : wisegraph/knots.json (the curator's generic knot vocabulary), clips.site.json, site/data/wisegraph/{gold,collections,wise}.json,
//        and (optional, internal) the transcript passages of the enquiry-lens index (../../wiser-search-index/passages.jsonl or $KNOTS_PASSAGES)
//   out: site/data/wisegraph/knots.json  { version, built, roles, grounding, intense, knots: [{id, label, match, roles: {resolve, enlighten, explain}}] }
// Every candidate is a pointer: {k: clip|moment|practice, id, start?, end?, s, why, t (teacher id), tr (Trika 1), tier}. Transcript text never leaves
// this script: a "moment" is a video id + start/end seconds + Satsang's own why-line. People with a public safety record (and the BRIEF's
// held main teachers) are never candidates. Nothing here comes from anyone's journal.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HELD_MAIN } from '../src/journal.js'

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const J = (p) => JSON.parse(fs.readFileSync(path.join(APP, p), 'utf8'))
const SRC = J('wisegraph/knots.json'), CLIPS = J('clips.site.json'), GOLD = J('site/data/wisegraph/gold.json'), COLS = J('site/data/wisegraph/collections.json'), WISE = J('site/data/wisegraph/wise.json')
const OUT = path.join(APP, 'site/data/wisegraph/knots.json')
const PASS = process.env.KNOTS_PASSAGES || path.resolve(APP, '../../wiser-search-index/passages.jsonl')
const gold = GOLD.gold || {}, strong = new Set(GOLD.strong || [])
const held = (s) => HELD_MAIN.has(s) || !!WISE.people?.[s]?.safety
const TRIKA = new Set(['kashmir-shaivism', 'trika', 'pratyabhijna', 'krama', 'spanda'])
const isTrika = (c) => (c.traditions || []).some((t) => TRIKA.has(t)) || TRIKA.has(c.tradition)
const tierOf = (id) => (gold[id] ? 'gold' : strong.has(id) ? 'strong' : '')
const rx = (s) => new RegExp(s, 'i')
const vid = (c) => c.parent || String(c.id).split('@')[0]
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const GENTLE = /\b(guided|compassion\w*|kind\w*|gentle|gently|tender\w*|love|self[- ]acceptance|forgiv\w*|ease|befriend\w*)\b/i
const AVOID = rx(SRC.avoid), INTENSE = rx(SRC.intense.re)
const ROLES = ['resolve', 'enlighten', 'explain']
const GEN = Object.fromEntries(ROLES.map((r) => [r, { cues: SRC.roles[r].generic.map((g) => ({ ...g, R: rx(g.re) })), topics: SRC.roles[r].topics }]))
const KN = SRC.knots.map((k) => ({ ...k, core: k.core.map((c) => ({ ...c, R: rx(c.re) })), P: rx(k.passage.re),
  roles: Object.fromEntries(ROLES.map((r) => [r, { ...k.roles[r], cues: k.roles[r].cues.map((c) => ({ ...c, R: rx(c.re) })), neg: (k.roles[r].neg || []).map((c) => ({ ...c, R: rx(c.re) })) }])) }))

// ---------- catalogue: eligible talks (horizontal, not footage, not held, re-uploads collapsed) ----------
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const seenKey = new Map(), ELIG = []
for (const c of CLIPS) {
  if (c.format === 'vertical' || c.delivery === 'footage' || c.hubOnly || held(c.speaker) || !(Number(c.dur) >= 45)) continue
  const key = c.speaker + '|' + norm(c.title)
  const prev = seenKey.get(key)
  if (prev) { if ((tierOf(c.id) && !tierOf(prev.id)) || (c.views || 0) > (prev.views || 0) * 3) { ELIG[ELIG.indexOf(prev)] = c; seenKey.set(key, c) } continue }
  seenKey.set(key, c); ELIG.push(c)
}
const BYVID = new Map(); for (const c of ELIG) { const v = vid(c); if (!BYVID.has(v)) BYVID.set(v, []); BYVID.get(v).push(c) }
const textOf = (c) => [c.title, c.ytTitle, c.talk, gold[c.id]?.why].filter(Boolean).join(' | ')

// ---------- transcript moments (internal input; only ids + seconds come out) ----------
let passages = null
if (!fs.existsSync(PASS) && fs.existsSync(OUT) && JSON.parse(fs.readFileSync(OUT, 'utf8')).moments && !process.env.KNOTS_FORCE) {
  console.log('build-knots: transcript passages not on this machine; kept the committed knots.json (it has moments). KNOTS_FORCE=1 rebuilds without them.'); process.exit(0)
}
if (fs.existsSync(PASS)) {
  passages = new Map()
  for (const line of fs.readFileSync(PASS, 'utf8').split('\n')) { if (!line.trim()) continue; const p = JSON.parse(line); if (!BYVID.has(p.yt)) continue; (passages.get(p.yt) || passages.set(p.yt, []).get(p.yt)).push(p) }
  for (const a of passages.values()) a.sort((x, y) => x.start - y.start)
}
const ROLE_P = { resolve: /\b(practi[cs]e|notice|attention|when (it|the \w+) arises|be with|let (it|go)|try|patient|restrain\w*|endure|guard)\b/gi,
  enlighten: /\b(self|awareness|conscious\w*|empt\w*|not yours|not[- ]self|shiva|śiva|freedom|recogni\w*)\b/gi,
  explain: /\b(because|cause\w*|why|depend\w*|condition\w*|sutta|arises? (from|out of)|means)\b/gi }
function moments(k) { // best window of up to 3 consecutive passages per video with >= 2 knot hits; role = whichever role words dominate it
  const out = []
  if (!passages) return out
  for (const [v, ps] of passages) {
    let best = null
    for (let i = 0; i < ps.length; i++) {
      let hits = 0, rw = { resolve: 0, enlighten: 0, explain: 0 }, j = i
      for (; j < Math.min(ps.length, i + 3); j++) { const t = ps[j].text || ''; hits += (t.match(new RegExp(k.P.source, 'gi')) || []).length; for (const r of ROLES) rw[r] += (t.match(ROLE_P[r]) || []).length }
      if (hits >= 2 && (!best || hits > best.hits)) best = { hits, rw, s: ps[i].start, e: ps[j - 1].end, exact: !ps[i].approx }
    }
    if (!best) continue
    const c = BYVID.get(v).find((x) => !x.parent) || BYVID.get(v)[0]
    const role = ROLES.slice().sort((a, b) => best.rw[b] - best.rw[a])[0]
    let s = Math.max(0, Math.floor(best.s)), e = Math.ceil(Math.min(best.e, s + 600)); if (e - s < 180) e = Math.min(Number(c.dur) || s + 180, s + 180)
    // a talk of 20 min or less plays whole, and a passage at the very start is the talk itself: evidence only, no jump
    const whole = !c.parent && ((Number(c.dur) || 0) <= 1200 || s < 45)
    // an existing virtual clip that covers the moment wins (it already has a title and plays on the site's own player)
    const vc = BYVID.get(v).find((x) => x.parent && Number(x.start) <= s + 30 && Number(x.end) >= s + 60)
    out.push({ c: vc || c, v, s, e: vc ? Number(vc.end) : e, hits: best.hits, role, exact: best.exact, virtual: !!vc || whole })
  }
  return out
}

// ---------- scoring ----------
function score(k, r, c, mom) {
  const T = textOf(c)
  if (AVOID.test(T)) return null
  let core = null; for (const q of k.core) if (q.R.test(T) && (!core || q.w > core.w)) core = q
  let rc = null; for (const q of k.roles[r].cues) if (q.R.test(T) && (!rc || q.w > rc.w)) rc = q
  if (!core && !(rc && rc.w >= 1) && !mom) return null
  let gen = 0; for (const g of GEN[r].cues) if (g.R.test(T)) gen += g.w
  let tf = 0; for (const t of c.topics || []) tf = Math.max(tf, GEN[r].topics[t] || 0)
  const tr = isTrika(c), tier = tierOf(c.id), dur = mom && !mom.virtual ? mom.e - mom.s : Number(c.end) > 0 ? Number(c.end) - Number(c.start || 0) : Number(c.dur) || 0
  let s = (core?.w || 0) + (rc?.w || 0) + 0.3 * Math.min(0.8, gen) + 0.3 * tf + (tier === 'gold' ? 0.35 : tier === 'strong' ? 0.2 : 0) + (tr ? (r === 'enlighten' ? 0.35 : 0.15) : 0)
  if (mom) s += (core || rc ? Math.min(0.3, 0.06 * mom.hits) : Math.min(0.9, 0.2 * mom.hits)) + (mom.role === r ? 0.15 : 0)
  if (dur < 60) s -= 0.5; else if (dur < 120) s -= 0.15
  if (!mom && dur > 2700) s -= dur > 5400 ? 0.5 : 0.25
  if (r === 'resolve' && INTENSE.test(T)) s -= 0.6
  for (const q of k.roles[r].neg) if (q.R.test(T)) s -= q.w
  let why = rc ? rc.why
    : core ? (r === 'resolve' ? `A practical teaching ${core.why}` : r === 'enlighten' ? `${tr ? 'The Trika view' : 'A wider view'} ${core.why}` : `What is going on: a talk ${core.why}`)
    : k.passage.why
  if (mom && !rc && !core) why = k.passage.why
  if (mom && !mom.virtual) why += ` \u00b7 from ${mmss(mom.s)}`
  // g: a gentle item (guided, kindness, tenderness): loosening tensions lean on these (src/tensions.js). d: played minutes.
  const g = GENTLE.test(T) || (c.topics || []).some((t) => t === 'kindness' || t === 'kindness/compassion') ? 1 : 0
  return { s: +s.toFixed(3), why, tr, tier, g, d: Math.max(1, Math.round(dur / 60)) }
}

const PR = COLS.practices || {}
const tradLabel = (id) => WISE.traditions?.[id]?.label || ''
const out = { version: 1, built: new Date().toISOString().slice(0, 10), note: 'Generated by app/tools/build-knots.mjs from wisegraph/knots.json. Pointers only (ids, seconds, why-lines in Satsang\u2019s words).',
  moments: !!passages, roles: Object.fromEntries(ROLES.map((r) => [r, { label: SRC.roles[r].label, hint: SRC.roles[r].hint }])), grounding: SRC.grounding, intense: { practices: SRC.intense.practices, topics: SRC.intense.topics }, knots: [] }
const stats = []
for (const k of KN) {
  const M = moments(k), roles = {}
  for (const r of ROLES) {
    const C = []
    for (const c of ELIG) { const x = score(k, r, c, null); if (x) C.push({ k: 'clip', id: c.id, v: vid(c), t: c.speaker, ...x }) }
    for (const m of M) {
      const x = score(k, r, m.c, m); if (!x) continue
      C.push(m.virtual ? { k: 'clip', id: m.c.id, v: m.v, t: m.c.speaker, ...x } : { k: 'moment', id: m.v, start: m.s, end: m.e, exact: m.exact ? 1 : 0, v: m.v, t: m.c.speaker, ...x })
    }
    C.sort((a, b) => b.s - a.s || String(a.id).localeCompare(String(b.id)))
    const list = [], perT = {}, vids = new Set()
    for (const x of C) { if (vids.has(x.v) || (perT[x.t] || 0) >= 2) continue; vids.add(x.v); perT[x.t] = (perT[x.t] || 0) + 1; list.push(x); if (list.length >= 14) break }
    const prs = (k.roles[r].practices || []).filter((id) => PR[id]).map((id, i) => { const p = PR[id]; return { k: 'practice', id, s: +(1.2 - 0.1 * i).toFixed(2), why: `The doing, not only the hearing: ${p.minutes || 10} minutes${p.tradition ? ', from ' + (p.tradLabel || tradLabel(p.tradition)) : ''}`, tr: TRIKA.has(p.tradition) ? true : false, needsTeacher: !!p.needsTeacher } })
    roles[r] = { picks: list.map(({ v, ...x }) => ({ ...x, tr: x.tr ? 1 : 0 })), practices: prs.map((p) => ({ ...p, tr: p.tr ? 1 : 0 })) }
  }
  out.knots.push({ id: k.id, label: k.label, match: k.match, roles })
  stats.push(`${k.id}: ${ROLES.map((r) => `${r} ${roles[r].picks.length}+${roles[r].practices.length}p`).join(', ')} (moments ${M.length})`)
}
fs.writeFileSync(OUT, JSON.stringify(out))
console.log(`build-knots: ${out.knots.length} knots -> ${path.relative(APP, OUT)}${passages ? '' : ' (no transcript passages here: moments skipped)'}`)
for (const s of stats) console.log('  ' + s)
