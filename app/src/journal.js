// Awakening algorithm, slice 1 (specs/AWAKENING-ALGORITHM.md §4-§7, §9): a public journal -> private "concerns" on this device
// -> journal intents for For You and a "From your journal" rail. Deterministic, no model. Reuses Satsang's own matchers:
//   ./intentions.js  matchText + INTENTS (the "What you bring" chips and their topic weights)
//   chat/worker/src/safety.mjs  triage (crisis / emergency / unsettled / stop / soften + intense + conditions) and its LINES
// The derived profile (wiser.journal) never leaves the device: no sync, not in the open data, the MCP, logs or analytics.
// Relay, never advise: labels are Satsang's chip labels, why-lines are "Because you wrote about <label> (day N)", and no
// journal text is ever shown back. Pure functions first (tested by tools/awaken/test-journal-*.mjs), then the small UI.
import { matchText, INTENTS } from './intentions.js'
import { triage, LINES } from '../../chat/worker/src/safety.mjs'

export const VERSION = 'satsang-journal-signals/0.2'
export const KEY = 'journal', MUTE_KEY = 'journalMute'
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
// teachers held from any surfacing (BRIEF "main teachers held") + anyone with a person-level public safety record (people[].safety)
export const HELD_MAIN = new Set(['ajahn-sucitto', 'jack-kornfield', 'swami-ramdev', 'yogi-bhajan', 'taizan-maezumi', 'sogyal-rinpoche', 'swami-vishnudevananda', 'swami-rama', 'swami-shankarananda'])

const label = (id) => (BY[id] || EX[id])?.label || id
export const labelOf = label
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

// journey start when the source does not say: the earliest tension `opened` date (nibbanahelp tensions are opened on day 1)
export function inferStart(docs) { const d = docs.filter((x) => x.kind === 'tension' && /^\d{4}-\d{2}-\d{2}/.test(x.date || '')).map((x) => x.date.slice(0, 10)).sort(); return d[0] || null }

export function extractSignals(docs, { now = Date.now(), start = null } = {}) {
  const pub = docs.filter((d) => d.visibility === 'public')          // never read a private item, even if handed one
  const dateOf = (d) => d.date || (start && d.day ? new Date(Date.parse(start) + (d.day - 1) * DAY).toISOString().slice(0, 10) : null)
  const dayOf = (d) => d.day || (start && /^\d{4}-\d{2}-\d{2}/.test(d.date || '') ? Math.max(1, Math.floor((Date.parse(d.date.slice(0, 10)) - Date.parse(start)) / DAY) + 1) : null)  // a tension's day = its opened date
  const acc = {}, safety = { class: 'none', at: null, intense: false, conditions: [] }, SEV = { none: 0, soften: 1, stop: 2, unsettled: 3, emergency: 4, crisis: 5 }
  let lv = { deep: 0, steady: 0 }
  const add = (cid, d, s) => {
    if (!(BY[cid] || EX[cid])) return
    const a = (acc[cid] ||= { x: 0, days: new Set(), ev: [], trend: null })
    a.x += s * KIND_W[d.kind] * recency(dateOf(d), now); const dy = dayOf(d); if (dy) a.days.add(dy)
    if (!a.ev.some((e) => e.doc === d.id)) a.ev.push({ doc: d.id, kind: d.kind, day: dy, date: dateOf(d) })
    if (d.kind === 'tension' && d.status in TREND) a.trend = a.trend == null ? TREND[d.status] : Math.max(a.trend, TREND[d.status])  // the tension's own status is the trend
  }
  for (const d of pub) {
    const paras = d.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    for (const p of paras) {
      const hits = new Set(matchText(p)); for (const x of EXTRA) if (x.re.test(p.toLowerCase())) hits.add(x.id)
      for (const cid of hits) add(cid, d, 1 / Math.max(1, Math.sqrt(hits.size)))
      const tr = triage(p)
      // only the last 14 days count for the safety state (spec §7.2): the class ends once 14 days pass with no such wording
      if (SEV[tr.class] > SEV[safety.class] && recency(dateOf(d), now) >= 1) { safety.class = tr.class; safety.at = dateOf(d) }
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

// For You reads these exactly like intentions (feedrank X.intents): [{id, label, w, topics, why, source}]. Muted concerns are skipped.
export function journalIntents(sig, max = 3, mutes = {}, now = Date.now()) {
  if (!sig?.concerns) return []
  return sig.concerns.filter((c) => !isMuted(mutes, c.id, now)).slice(0, max).map((c) => {
    const e = c.evidence[0], when = e?.day ? ` (day ${e.day})` : ''
    return { id: 'j:' + c.id, label: c.label, w: c.U, topics: c.topics, why: `Because you wrote about ${c.label.toLowerCase()}${when}`, source: 'journal' }
  })
}
export const whyOk = (s) => typeof s === 'string' && s.length <= 80 && !BANNED.test(s)
export const MUTE_DAYS = 30
export const isMuted = (mutes, cid, now = Date.now()) => { const at = mutes?.[cid]; return !!at && now - Date.parse(at) < MUTE_DAYS * DAY }

// the safety card the rail leads with (same wording as the chat: LINES), or null. Nobody is notified; nothing is sent anywhere.
export function safetyCard(sig) {
  const k = sig?.safety?.class
  if (k === 'crisis') return { kind: 'crisis', text: LINES.crisis, items: false }
  if (k === 'emergency') return { kind: 'emergency', text: LINES.emergency, items: false }
  if (k === 'unsettled') return { kind: 'unsettled', text: LINES.unsettled, items: 'grounding' }
  if (k === 'stop' || k === 'soften') return { kind: 'gentle', text: LINES.soften, items: true }
  return null
}

// "From your journal" (spec §6.1): top 2 concerns x best 3 items, <= 6 cards, from the already-ranked For You list (so every
// existing hard rule still holds), never a held teacher, never one video twice. Returns null when no journal is connected,
// so For You is byte-identical to today's (test 11).
//   ranked: [{c, ...}] in For You order; isHeld(speakerId) -> bool; grounding(c) -> bool (talks fit for the unsettled state)
export function journalRail(sig, ranked, { isHeld = () => false, mutes = {}, now = Date.now(), grounding = null, max = 6, per = 3 } = {}) {
  if (!sig || !Array.isArray(sig.concerns)) return null
  const card = safetyCard(sig)
  if (card && card.items === false) return { safety: card, cards: [] }
  const ints = journalIntents(sig, 2, mutes, now), used = new Set(), out = []
  const spk = (c) => c.speaker || c.comic
  const root = (t) => String(t).split('/')[0]
  const fit = (c, it) => { let m = 0; for (const t of c.topics || []) m = Math.max(m, it.topics[t] || (it.topics[root(t)] || 0) * 0.8); return m }
  for (const it of ints) {
    const L = ranked.map((x, i) => ({ x, i, f: fit(x.c, it) })).filter((y) => y.f >= 0.5 && !used.has(y.x.c.id) && !isHeld(spk(y.x.c)) && !(card?.items === 'grounding' && grounding && !grounding(y.x.c)))
      .sort((a, b) => b.f - a.f || a.i - b.i).slice(0, per)
    for (const y of L) { used.add(y.x.c.id); out.push({ c: y.x.c, kind: 'journal', why: it.why, concern: it.id.slice(2) }) }
  }
  return { safety: card, cards: out.slice(0, max) }
}

// ---------- sources: a JSON Feed URL (nibbanahelp /feed.json, when it exists) or a public GitHub repo (the fallback) ----------
// GitHub fallback: one tree call (api.github.com, CORS open) + raw files (raw.githubusercontent.com, CORS open). Reads only
// entries/, essays/ and tensions/ markdown; skips templates and READMEs; drops anything not marked visibility: public.
export function parseSource(s) {
  const t = String(s || '').trim()
  const gh = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(t) || /^([\w.-]+)\/([\w.-]+)$/.exec(t)
  if (gh) return { kind: 'github', owner: gh[1], repo: gh[2] }
  if (/^https:\/\/[^\s]+$/.test(t)) return { kind: 'feed', url: t }
  return null
}
const SUBS = [['entries', 'entry'], ['essays', 'essay'], ['tensions', 'tension']]
export async function fetchDocs(src, fetchFn = fetch) {
  if (src.kind === 'feed') {
    const j = await (await fetchFn(src.url, { cache: 'no-cache' })).json()
    return (j.items || []).filter((x) => x?._nibbana?.visibility === 'public').map((x) => {
      const n = x._nibbana, kind = ['entry', 'essay', 'tension'].includes(n.kind) ? n.kind : 'entry'
      return { id: String(x.id), kind, day: n.day ? +n.day : null, date: (x.date_published || '').slice(0, 10) || null, visibility: 'public', status: n.status || null, domain: n.domain || null, roots: n.roots || [], summary: n.summary || '', body: String(x.content_text || '') }
    })
  }
  const api = `https://api.github.com/repos/${src.owner}/${src.repo}`
  const meta = await (await fetchFn(api)).json(), br = meta.default_branch || 'main'
  const tree = await (await fetchFn(`${api}/git/trees/${encodeURIComponent(br)}?recursive=1`)).json()
  const files = (tree.tree || []).filter((x) => x.type === 'blob').map((x) => x.path)
    .filter((p) => SUBS.some(([s]) => p.startsWith(s + '/') && p.split('/').length === 2) && p.endsWith('.md') && !/\/(_|README)/.test(p)).slice(0, 400)
  const docs = []
  await Promise.all(files.map(async (p) => {
    const r = await fetchFn(`https://raw.githubusercontent.com/${src.owner}/${src.repo}/${encodeURIComponent(br)}/${p}`); if (!r.ok) return
    const kind = SUBS.find(([s]) => p.startsWith(s + '/'))[1]
    docs.push(parseDoc(await r.text(), { id: p, kind }))
  }))
  return docs.sort((a, b) => String(a.id).localeCompare(String(b.id)))
}

// ---------- UI (Your model section + the For You rail). Dark design: existing wsec / wchip / fy-card classes only. ----------
export function createJournal(d) {
  // d: { esc, LS, toast, onChange() }
  const { esc, LS } = d
  const get = () => { const j = LS.get(KEY, null); return j && j.signals && j.source ? j : null }
  const mutes = () => { const m = LS.get(MUTE_KEY, {}); return m && typeof m === 'object' ? m : {} }
  let busy = false
  async function connect(input) {
    const src = parseSource(input); if (!src) { d.toast('Paste a GitHub repo (owner/name) or a feed URL.'); return false }
    busy = true
    try {
      const docs = await fetchDocs(src), now = Date.now()
      const sig = extractSignals(docs, { now, start: inferStart(docs) })
      LS.set(KEY, { source: input.trim(), fetched: new Date(now).toISOString(), posts: docs.filter((x) => x.visibility === 'public').length, signals: sig })
      d.onChange(); return true
    } catch (e) { d.toast('Could not read that journal. Is it public?'); return false } finally { busy = false }
  }
  function stop() { localStorage.removeItem('wiser.' + KEY); localStorage.removeItem('wiser.' + MUTE_KEY); d.onChange() }
  function mute(cid) { const m = mutes(); m[cid] = new Date().toISOString(); LS.set(MUTE_KEY, m); d.onChange() }
  async function refreshIfStale() { const j = get(); if (!j || busy) return; if (Date.now() - Date.parse(j.fetched || 0) > 6 * 3600e3) await connect(j.source) }
  const intents = () => { const j = get(); return j ? journalIntents(j.signals, 3, mutes()) : [] }
  function section() {
    const j = get(), I = intents()
    return `<section class="wsec int-sec" id="journalsec"><div class="wsech"><h3>Read my journal</h3><span class="muted small">Optional \u00b7 stays on this device</span></div>
      ${j ? `<p class="wsubs">Reading <b>${esc(j.source)}</b> \u00b7 ${j.posts} public posts \u00b7 checked ${esc(String(j.fetched).slice(0, 10))}</p>
        ${I.length ? `<p class="muted small">For You leans towards what you wrote about: ${I.map((x) => `<span class="wchip">${esc(x.label)}<button type="button" class="fl-nfm" data-jmute="${esc(x.id.slice(2))}" aria-label="Not this" title="Not this">\u00d7</button></span>`).join(' ')}</p>` : '<p class="muted small">Nothing in the posts points For You anywhere yet.</p>'}
        <p class="muted small">Pitched at: ${esc(j.signals.level?.value || 'new')} practice (from practice words in your posts, never a judgement). Satsang reads only posts marked public, keeps what it works out here on this device, and never shows your words back.</p>
        <p class="fl-acts" style="justify-content:flex-start"><button type="button" class="hbtn" data-jre="1">Read again</button><button type="button" class="hbtn" data-jstop="1">Stop reading my journal</button></p>`
      : `<p class="muted">If you keep a public journal (a GitHub repo of markdown posts, like nibbanahelp, or a JSON feed), Satsang can read it and lean For You towards what you are going through. Only public posts are read; what Satsang works out stays on this device.</p>
        <p class="fl-acts" style="justify-content:flex-start"><input class="int-free" data-jsrc="1" type="text" inputmode="url" placeholder="owner/repo or https://\u2026/feed.json" aria-label="Journal source" style="min-width:260px"><button type="button" class="hbtn" data-jgo="1">Read my journal</button></p>`}</section>`
  }
  function bind(el, repaint) {
    el.querySelector('[data-jgo]')?.addEventListener('click', async (e) => { const b = e.currentTarget, v = el.querySelector('[data-jsrc]')?.value || ''; b.disabled = true; b.textContent = 'Reading\u2026'; const ok = await connect(v); if (ok) d.toast('Journal read. See For You.'); repaint() })
    el.querySelector('[data-jre]')?.addEventListener('click', async (e) => { const j = get(); if (!j) return; e.currentTarget.disabled = true; await connect(j.source); repaint() })
    el.querySelector('[data-jstop]')?.addEventListener('click', () => { stop(); d.toast('Stopped. Satsang forgot what it read.'); repaint() })
    el.querySelectorAll('[data-jmute]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); mute(b.dataset.jmute); d.toast('Muted for 30 days.'); repaint() }))
  }
  // the rail HTML (For You page and the Watch rail). cardHTML(x) renders one card in the existing fy-card markup.
  function railHTML(ranked, { isHeld, cardHTML, compact }) {
    const j = get(); if (!j) return ''
    const R = journalRail(j.signals, ranked, { isHeld, mutes: mutes() }); if (!R) return ''
    const note = R.safety ? `<p class="muted small fy-jnote" role="note">${esc(R.safety.text)}</p>` : ''
    if (!R.cards.length && !note) return ''
    return `<section class="wsec fy-rail fy-journal"><div class="wsech"><h3>From your journal</h3><span class="fy-rail-acts"><a class="hbtn" href="#me" data-gojournal="1">Change</a></span></div>
      ${note}${R.cards.length ? `<div class="rail fy-railrow">${R.cards.map((x) => cardHTML(x, compact)).join('')}</div>` : ''}
      ${R.cards.length ? `<p class="muted small">Enough for today.${[...new Map(R.cards.map((x) => [x.concern, x])).values()].map((x) => ` <button type="button" class="linkbtn" data-jmute="${esc(x.concern)}">Not this: ${esc(labelOf(x.concern))}</button>`).join(' \u00b7')}</p>` : ''}</section>`
  }
  function bindRail(el) {
    el.querySelectorAll('.fy-journal [data-jmute]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); mute(b.dataset.jmute); d.toast('Muted for 30 days.') }))
    el.querySelector('[data-gojournal]')?.addEventListener('click', () => setTimeout(() => document.getElementById('journalsec')?.scrollIntoView({ block: 'start' }), 400))
  }
  return { get, connect, stop, mute, mutes, intents, section, bind, railHTML, bindRail, refreshIfStale }
}
