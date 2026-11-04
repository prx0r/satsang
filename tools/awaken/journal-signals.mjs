// Awakening algorithm, slice 1 proof (specs/AWAKENING-ALGORITHM.md §4, §8): public journal posts -> private "concerns" that
// For You can read as journal intentions. Deterministic, no model, no network. Reuses Satsang's own matchers:
//   app/src/intentions.js  matchText + INTENTS (the "What you bring" chips and their topic weights)
//   chat/worker/src/safety.mjs  triage (crisis / emergency / unsettled / stop / soften + intense + conditions)
// Output is derived personal data: it never goes in the repo, the open data, the MCP or any log (spec §9).
//
// CLI (local proof): node tools/awaken/journal-signals.mjs --dir <nibbanahelp clone> [--start YYYY-MM-DD] [--now ISO] [--out file]
//   prints a short summary only (concern ids, weights, safety class); the full object goes to --out (default tools/awaken/out/, gitignored).
import { matchText, INTENTS } from '../../app/src/intentions.js'
import { triage } from '../../chat/worker/src/safety.mjs'

export const VERSION = 'satsang-journal-signals/0.1'
const DAY = 86400000
const BY = Object.fromEntries(INTENTS.map((x) => [x.id, x]))
// concerns the chip set lacks: the five hindrances not already covered, and two common knots. Topics are antidote-leaning.
export const EXTRA = [
  { id: 'doubt', label: 'Doubt', topics: { 'right-view': 1, faith: 0.7, 'dependent-origination': 0.5, texts: 0.4 }, re: /\b(doubt|unsure if|is this (even )?working|not sure (this|it) works|losing faith|sceptic|skeptic)/ },
  { id: 'sloth', label: 'Dullness and low energy', topics: { jhana: 0.6, mindfulness: 0.8, 'meditation/breath': 0.7, virtue: 0.3 }, re: /\b(sleepy|drows|dull|sluggish|letharg|no energy|exhausted|tired all)/ },
  { id: 'shame', label: 'Shame and self-judgment', topics: { 'kindness/compassion': 1, kindness: 0.8, self: 0.6, virtue: 0.4 }, re: /\b(shame|ashamed|self[- ]?(hate|hatred|judg|loath|critic)|guilt|unworthy|hiding (who|what) i)/ },
  { id: 'livelihood', label: 'Money and livelihood', topics: { renunciation: 0.8, 'daily-life': 1, craving: 0.5, virtue: 0.4 }, re: /\b(debt|money|rent|broke\b|job|work stress|livelihood|bills?\b|owe\b)/ },
]
const EX = Object.fromEntries(EXTRA.map((x) => [x.id, x]))
// tension headers (nibbanahelp schema/tension.md): domain and roots -> concern ids
const DOMAIN = { money: 'livelihood', addiction: 'craving', identity: 'shame', relationship: 'relationships', health: 'illness', doubt: 'doubt' }
const ROOT = { lobha: 'craving', dosa: 'anger', moha: 'doubt' }
const KIND_W = { tension: 1, entry: 0.7, essay: 0.4 }
// what a concern IS weighs its urgency: something being gone through > a goal > a curiosity (curiosity is relevance, spec §5.1)
const NEED_W = { issues: 1, goals: 0.6, curious: 0.4 }
const needW = (id) => EX[id] ? 1 : NEED_W[BY[id]?.g] ?? 0.5
const TREND = { open: 1, loosening: 0.6, resolved: 0.15 }
// practice-context words (never an attainment judgement: spec §5.3)
const LEVEL = { deep: /\b(jhana|jhāna|nimitta|retreat|samadhi|samādhi|stream[- ]entry|anupaya|anupāya|samavesa|samāveśa|dark night|vipassana course)\b/g, steady: /\b(sat|sitting|meditat\w*|practi[cs]e[ds]?|noting|breath)\b/g }
// words a why-line or label may never apply to the person (spec §7.1)
export const BANNED = /\b(depress\w*|disorder|addict\b|addicted|psychos\w*|bipolar|diagnos\w*|dark night|enlightened|awakened|stream[- ]enterer|arahant|attain\w*|broken|sick)\b/i

const label = (id) => (BY[id] || EX[id])?.label || id
const topics = (id) => (BY[id] || EX[id])?.topics || {}

export function parseDoc(md, meta = {}) {
  const t = String(md || ''), i = t.indexOf('\n---')
  const head = i > -1 ? t.slice(0, i) : '', body = (i > -1 ? t.slice(i + 4) : t).trim(), h = {}
  for (const line of head.split('\n')) { const m = /^([a-z_]+):\s*(.*)$/.exec(line.trim()); if (m) h[m[1]] = m[2].trim() }
  const roots = (/^\[(.*)\]$/.exec(h.roots || '') || [, ''])[1].split(',').map((s) => s.trim()).filter(Boolean)
  return { id: meta.id, kind: meta.kind || 'entry', day: h.day ? +h.day : null, date: meta.date || h.opened || null,
    visibility: h.visibility || 'public', status: h.status || null, domain: h.domain || null, roots, summary: h.summary || '', body }
}

const recency = (date, now) => { const d = (now - Date.parse(date || 0)) / DAY; if (!(d >= 0)) return 1; return d <= 14 ? 1 : Math.pow(0.5, (d - 14) / 7) }

export function extractSignals(docs, { now = Date.now(), start = null } = {}) {
  const pub = docs.filter((d) => d.visibility === 'public')          // never read a private item, even if handed one
  const dateOf = (d) => d.date || (start && d.day ? new Date(Date.parse(start) + (d.day - 1) * DAY).toISOString().slice(0, 10) : null)
  const acc = {}, safety = { class: 'none', at: null, intense: false, conditions: [] }, SEV = { none: 0, soften: 1, stop: 2, unsettled: 3, emergency: 4, crisis: 5 }
  let lv = { deep: 0, steady: 0 }
  const add = (cid, d, s) => {
    if (!(BY[cid] || EX[cid])) return
    const a = (acc[cid] ||= { x: 0, days: new Set(), ev: [], trend: null })
    a.x += s * KIND_W[d.kind] * recency(dateOf(d), now); if (d.day) a.days.add(d.day)
    if (!a.ev.some((e) => e.doc === d.id)) a.ev.push({ doc: d.id, kind: d.kind, day: d.day, date: dateOf(d) })
    if (d.kind === 'tension' && d.status in TREND) a.trend = a.trend == null ? TREND[d.status] : Math.max(a.trend, TREND[d.status])  // the tension's own status is the trend
  }
  for (const d of pub) {
    const paras = d.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    for (const p of paras) {
      const hits = new Set(matchText(p)); for (const x of EXTRA) if (x.re.test(p.toLowerCase())) hits.add(x.id)
      for (const cid of hits) add(cid, d, 1 / Math.max(1, Math.sqrt(hits.size)))
      const tr = triage(p)
      if (SEV[tr.class] > SEV[safety.class] && recency(dateOf(d), now) > 0.25) { safety.class = tr.class; safety.at = dateOf(d) }
      if (tr.intense) safety.intense = true
      for (const c of tr.conditions) if (!safety.conditions.includes(c)) safety.conditions.push(c)
    }
    if (d.kind === 'tension') {
      for (const r of d.roots) add(ROOT[r], d, 0.5)
      if (DOMAIN[d.domain]) add(DOMAIN[d.domain], d, 1.5)
      for (const cid of matchText(d.summary)) add(cid, d, 1)
    }
    const txt = d.body.toLowerCase(); lv.deep += (txt.match(LEVEL.deep) || []).length; lv.steady += (txt.match(LEVEL.steady) || []).length
  }
  const concerns = Object.entries(acc).map(([id, a]) => {
    // a standing theme (in most posts: e.g. "awakening" on a nibbana diary) is taste, not urgency: damp it (spec §5.2)
    const share = a.ev.length / Math.max(1, pub.length), standing = pub.length >= 4 && share > 0.6
    const tm = a.trend ?? 1, raw = needW(id) * a.x * (1 + 0.25 * Math.log(Math.max(1, a.days.size))) * tm * (standing ? 0.35 : 1)
    return { id, label: label(id), need: EX[id] ? 'issues' : BY[id]?.g, U: +(1 - Math.exp(-raw / 4)).toFixed(3), standing, trend: tm === 1 ? 'open' : tm === TREND.loosening ? 'loosening' : 'resolved', topics: topics(id), evidence: a.ev.sort((x, y) => (y.day || 0) - (x.day || 0)) }
  }).filter((c) => c.U >= 0.1).sort((a, b) => b.U - a.U || a.id.localeCompare(b.id))
  const level = lv.deep >= 3 ? 'deep' : lv.steady >= 4 ? 'steady' : 'new'
  return { version: VERSION, built: new Date(now).toISOString(), concerns, safety, level: { value: level, basis: 'practice words in your posts (not a judgement of attainment)' } }
}

// For You reads these exactly like intentions (feedrank X.intents): [{id, label, w, topics, why, source}]
export function journalIntents(sig, max = 3) {
  return sig.concerns.slice(0, max).map((c) => {
    const e = c.evidence[0], when = e?.day ? ` (day ${e.day})` : ''
    return { id: 'j:' + c.id, label: c.label, w: c.U, topics: c.topics, why: `Because you wrote about ${c.label.toLowerCase()}${when}`, source: 'journal' }
  })
}
export const whyOk = (s) => typeof s === 'string' && s.length <= 80 && !BANNED.test(s)

// ---------- CLI ----------
if (import.meta.url === `file://${process.argv[1]}`) {
  const fs = await import('node:fs'), path = await import('node:path')
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d }
  const dir = arg('--dir'); if (!dir) { console.error('usage: --dir <nibbanahelp clone> [--start YYYY-MM-DD] [--now ISO] [--out file]'); process.exit(2) }
  const docs = []
  for (const [sub, kind] of [['entries', 'entry'], ['essays', 'essay'], ['tensions', 'tension']]) {
    const p = path.join(dir, sub); if (!fs.existsSync(p)) continue
    for (const f of fs.readdirSync(p).filter((f) => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md').sort())
      docs.push(parseDoc(fs.readFileSync(path.join(p, f), 'utf8'), { id: `${sub}/${f}`, kind }))
  }
  const now = Date.parse(arg('--now', new Date().toISOString())), sig = extractSignals(docs, { now, start: arg('--start', null) })
  const here = path.dirname(new URL(import.meta.url).pathname), out = arg('--out', path.join(here, 'out', 'signals.json'))
  fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify({ ...sig, intents: journalIntents(sig) }, null, 1))
  console.log(`${docs.length} docs (${docs.filter((d) => d.visibility === 'public').length} public) -> ${sig.concerns.length} concerns; safety ${sig.safety.class}; level ${sig.level.value}`)
  for (const c of sig.concerns.slice(0, 6)) console.log(`  ${c.id.padEnd(16)} U ${c.U.toFixed(2)} ${c.trend.padEnd(9)} evidence ${c.evidence.length}`)
  console.log(`written ${out} (private: never commit)`)
}
