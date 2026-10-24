// "Build me a path": Satsang's curator chat (chat/README.md). Self-contained module: it adds its own view (#v-ask), its own styles
// (ask.css), a "Build a path" entry in the top bar and on topic hubs, and talks to the satsang-chat Worker (POST /curate, NDJSON).
// Routes: #ask, #ask?q=<text>, #ask?topic=<topic id>, #ask/<packId> (a saved path). Saved paths use the existing journeys API
// (POST /journeys/<packId>/progress with the device id) and the saves API (ref path:<packId>, list "Paths"); the pack itself is kept
// on this device (localStorage wiser.askPacks) and on the chat Worker (GET /packs/<id>).
// Integration in app.js (two lines): `import { initAsk } from './ask.js'` and, in route(), `if (/^#ask\b/.test(location.hash)) { show('ask'); window.__ask?.open(); return }`;
// initAsk() is called once after tabs(). Without the route line the module shows its own view on hashchange.

const DEFAULT_CHAT = 'https://chat.tantrafiles.xyz'
const ASK_V = '1'
const EXAMPLES = [
  'I want to understand how rebirth works and maybe try a past-life practice',
  "10 minutes a day, I'm anxious",
  'A weekend retreat in the UK',
  "I'm new to meditation: 15 minutes each morning",
  'Teach me about Kashmir Shaivism, I like reading',
]
const ROLE = { watch: 'Watch', read: 'Read', practise: 'Practise', reflect: 'Reflect', collection: 'Collection', course: 'Series', visit: 'Visit', topic: 'Topic' }

const LS = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem('wiser.' + k)) ?? d } catch { return d } },
  set: (k, v) => { try { localStorage.setItem('wiser.' + k, JSON.stringify(v)) } catch {} },
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
function deviceId() {
  let d = LS.get('device', '')
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(d)) { d = 'd' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36); LS.set('device', d) }
  return d
}
let CFG = null
async function cfg() {
  if (CFG) return CFG
  try { CFG = await (await fetch('config.json', { cache: 'no-cache' })).json() } catch { CFG = {} }
  return CFG
}
const chatBase = async () => ((await cfg()).chatBase || DEFAULT_CHAT).replace(/\/$/, '')

// ---------- view ----------
let root = null, log = null, form = null, busy = false
const packs = () => LS.get('askPacks', {})
const savePackLocal = (p) => { const m = packs(); m[p.id] = p; LS.set('askPacks', m) }
const journeys = () => LS.get('journeys', {})

function ensureView() {
  if (root) return root
  const main = document.querySelector('main') || document.body
  const sec = document.createElement('section')
  sec.className = 'view'; sec.id = 'v-ask'; sec.hidden = true
  sec.innerHTML = `<div class="ask">
    <a class="back" href="#topics">\u2190 Topics</a>
    <header class="ask-head"><span class="eyebrow">Build me a path</span><h1>What are you looking for?</h1>
      <p class="lede">Say it in your own words: a question, a feeling, how much time you have, a place. Satsang builds a short path from its own talks, practices, readings and places, with a reason for each.</p></header>
    <div class="ask-log" aria-live="polite"></div>
    <form class="ask-form" autocomplete="off"><label class="ask-sr" for="ask-in">Your request</label>
      <textarea id="ask-in" rows="2" maxlength="600" placeholder="e.g. 10 minutes a day, I'm anxious"></textarea>
      <button type="submit" class="btn gold">Build my path</button></form>
    <div class="ask-chips">${EXAMPLES.map((e) => `<button type="button" class="wchip" data-ex="${esc(e)}">${esc(e)}</button>`).join('')}</div>
    <p class="muted small ask-note">Only Satsang's own catalogue is used, nothing invented. Practices marked orientation are traditionally learned from a teacher. Not medical advice.</p>
    <section class="ask-saved" hidden></section>
  </div>`
  main.appendChild(sec)
  root = sec; log = sec.querySelector('.ask-log'); form = sec.querySelector('form')
  const ta = form.querySelector('textarea')
  form.addEventListener('submit', (e) => { e.preventDefault(); const v = ta.value.trim(); if (v && !busy) { ta.value = ''; ask(v) } })
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit() } })
  sec.querySelector('.ask-chips').addEventListener('click', (e) => { const b = e.target.closest('[data-ex]'); if (b && !busy) ask(b.dataset.ex) })
  sec.addEventListener('click', onClick)
  paintSaved()
  return sec
}

function showSelf() {
  ensureView()
  const views = document.querySelectorAll('section.view')
  if (root.hidden) { views.forEach((s) => (s.hidden = s !== root)); document.querySelectorAll('nav [data-tab]').forEach((b) => b.classList.remove('on')); scrollTo({ top: 0 }) }
  document.querySelector('.ask-navlink')?.classList.add('on')
}

function open() {
  ensureView()
  const h = location.hash
  document.querySelector('.ask-navlink')?.classList.add('on')
  const m = h.match(/^#ask\/(ask-[a-z0-9]+)/)
  if (m) { openSaved(m[1]); return }
  const q = new URLSearchParams(h.split('?')[1] || '')
  const ta = form.querySelector('textarea')
  if (q.get('q')) ta.value = q.get('q').slice(0, 600)
  else if (q.get('topic')) ta.value = `I want to understand ${q.get('label') || q.get('topic').split('/').pop().replace(/-/g, ' ')}`
  paintSaved()
  setTimeout(() => ta.focus({ preventScroll: true }), 50)
}

// ---------- talking to the curator ----------
async function ask(text) {
  busy = true; form.classList.add('busy')
  log.insertAdjacentHTML('beforeend', `<div class="ask-me"><p>${esc(text)}</p></div>`)
  const turn = document.createElement('div'); turn.className = 'ask-turn'
  turn.innerHTML = `<div class="ask-thinking"><i></i><i></i><i></i><span>Looking through the talks, practices and places\u2026</span></div>`
  log.appendChild(turn); turn.scrollIntoView({ behavior: 'smooth', block: 'start' })
  let pack = null
  try {
    const r = await fetch(`${await chatBase()}/curate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: text, device: deviceId() }) })
    if (r.status === 429) throw new Error('rate')
    if (!r.ok || !r.body) throw new Error('http ' + r.status)
    const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '', items = [], meta = null
    for (;;) {
      const { value, done } = await rd.read(); if (done) break
      buf += dec.decode(value, { stream: true })
      let i; while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 1); if (!line.trim()) continue
        let ev; try { ev = JSON.parse(line) } catch { continue }
        if (ev.type === 'meta') { meta = ev; paintPartial(turn, meta, items) }
        else if (ev.type === 'item') { items.push(ev.item); paintPartial(turn, meta, items) }
        else if (ev.type === 'pack') pack = ev.pack
        else if (ev.type === 'error') throw new Error('server')
      }
    }
    if (!pack) throw new Error('incomplete')
    savePackLocal({ ...pack, local: true })
    turn.innerHTML = packHTML(pack)
  } catch (e) {
    turn.innerHTML = `<div class="ask-err"><p>${e.message === 'rate' ? 'That was a lot of paths in a minute. Take a breath and ask again shortly.' : 'The curator could not be reached just now. Please ask again in a moment.'}</p></div>`
  }
  busy = false; form.classList.remove('busy')
}

function paintPartial(turn, meta, items) {
  if (!meta) return
  const n = items.length
  turn.innerHTML = `<div class="ask-pack partial"><span class="eyebrow">${meta.blocked ? 'Please read this first' : 'Your path'}</span><h2>${esc(meta.title || '')}</h2>
    ${noteHTML(meta.safety?.notes)}<div class="ask-days">${items.filter((x) => ['watch', 'read', 'practise'].includes(x.role)).map(cardHTML).join('')}</div>
    ${meta.blocked ? '' : `<div class="ask-thinking small"><i></i><i></i><i></i><span>${n} found\u2026</span></div>`}</div>`
}

// ---------- rendering ----------
const ytId = (id) => String(id).split('@')[0]
const watchHref = (id) => `#watch/${encodeURIComponent(id)}`
const noteHTML = (notes) => (notes || []).length ? `<div class="ask-safety">${notes.map((n) => `<p>${esc(n)}</p>`).join('')}</div>` : ''

function cardHTML(s) {
  const eb = (x) => `<span class="eyebrow">${x}</span>`
  if (s.role === 'watch') return `<article class="ask-card talk"><a class="ask-thumb" href="${watchHref(s.id)}"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/${esc(ytId(s.id))}/mqdefault.jpg"><span>${s.minutes ? esc(s.minutes) + ' min' : ''}</span></a>
    <div class="ask-body">${eb(`Watch${s.gold ? ' \u00b7 recommended' : ''}`)}<b>${esc(s.title)}</b><span class="ask-by">${esc([s.by, s.tradition].filter(Boolean).join(' \u00b7 '))}</span>${s.why ? `<p class="ask-why">${esc(s.why)}</p>` : ''}
    <a class="hbtn" href="${watchHref(s.id)}">Watch</a></div></article>`
  if (s.role === 'practise') return `<article class="ask-card prac${s.orientationOnly ? ' orient' : ''}"><div class="ask-body">${eb(`Practise${s.daily ? ' \u00b7 daily' : ''}${s.minutes ? ' \u00b7 ' + esc(s.minutes) + ' min' : ''}${s.orientationOnly ? ' \u00b7 orientation only' : ''}`)}
    <b>${esc(s.title)}</b>${s.by ? `<span class="ask-by">${esc(s.by)}</span>` : ''}${s.why ? `<p class="ask-why">${esc(s.why)}</p>` : ''}
    ${(s.caution || []).length ? `<ul class="ask-caut">${s.caution.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
    <a class="hbtn" href="#practice/${esc(s.id)}">${s.orientationOnly || s.needsTeacher ? 'Read about it' : 'Begin'}</a></div></article>`
  if (s.role === 'read') return `<article class="ask-card read"><div class="ask-body">${eb('Read \u00b7 free')}<b>${esc(s.title)}</b>${s.by ? `<span class="ask-by">${esc(s.by)}</span>` : ''}${s.why ? `<p class="ask-why">${esc(s.why)}</p>` : ''}
    <span class="ask-acts"><a class="hbtn" href="/resource/${esc(s.id)}">About it</a>${s.link ? `<a class="hbtn send" href="${esc(s.link)}" target="_blank" rel="noopener">Read it \u2197</a>` : ''}</span></div></article>`
  if (s.role === 'reflect') return `<article class="ask-card reflect"><div class="ask-body">${eb('Reflect')}<p class="ask-why">${esc(s.why)}</p></div></article>`
  return ''
}
function deeperHTML(d) {
  const href = d.role === 'visit' ? `#place/${esc(d.id)}` : d.role === 'topic' ? `#topic/${esc(String(d.id).split('/')[0])}` : d.kind === 'course' ? `#series/${esc(d.id)}` : `#collection/${esc(d.id)}`
  const progs = (d.programmes || []).slice(0, 2).map((p) => `<li>${esc(p.n)}${p.len ? ` <span class="muted">\u00b7 ${esc(p.len)}</span>` : ''}${p.cost ? ` <span class="muted">\u00b7 ${esc(p.cost)}</span>` : ''}${p.url ? ` <a href="${esc(p.url)}" target="_blank" rel="noopener">schedule \u2197</a>` : ''}</li>`).join('')
  return `<article class="ask-card deep"><div class="ask-body"><span class="eyebrow">${esc(ROLE[d.kind] || ROLE[d.role] || 'More')}${d.tradition ? ' \u00b7 ' + esc(d.tradition) : ''}${d.orientationOnly ? ' \u00b7 orientation only' : ''}</span>
    <b>${esc(d.title)}</b>${d.by ? `<span class="ask-by">${esc(d.by)}</span>` : ''}${d.why ? `<p class="ask-why">${esc(d.why)}</p>` : ''}${progs ? `<ul class="ask-progs">${progs}</ul>` : ''}
    <a class="hbtn" href="${href}">Open</a></div></article>`
}

function packHTML(p, { saved = false } = {}) {
  if (p.blocked) return `<div class="ask-pack blocked"><span class="eyebrow">Please read this first</span><h2>${esc(p.title)}</h2>${noteHTML(p.safety?.notes)}</div>`
  if (p.empty) return `<div class="ask-pack"><p>${esc(p.prose)}</p></div>`
  const j = journeys()[p.id], done = new Set(j?.done || [])
  const days = {}
  for (const s of p.steps) (days[s.day || 1] ||= []).push(s)
  const nDays = Object.keys(days).length
  const isSaved = saved || !!j
  return `<div class="ask-pack" data-pack="${esc(p.id)}"><span class="eyebrow">Your path${p.intent?.days ? ` \u00b7 ${esc(p.intent.days)} days` : ''}${p.intent?.minutesPerDay ? ` \u00b7 ${esc(p.intent.minutesPerDay)} min a day` : ''}</span>
    <h2>${esc(p.title)}</h2><p class="ask-prose">${esc(p.prose)}</p>${noteHTML(p.safety?.notes)}
    <div class="ask-acts ask-top"><button type="button" class="btn gold" data-save="${esc(p.id)}"${isSaved ? ' disabled' : ''}>${isSaved ? `Saved as a journey${j ? ` \u00b7 ${done.size} of ${nDays} days` : ''}` : 'Save as journey'}</button>
      <button type="button" class="btn ghost" data-share="${esc(p.id)}">Copy link</button></div>
    ${Object.entries(days).map(([d, ss]) => `<section class="ask-day${done.has(+d) ? ' done' : ''}"><div class="ask-dayh"><h3>Day ${esc(d)}</h3>${isSaved ? `<button type="button" class="linkbtn" data-day="${esc(d)}" data-of="${esc(p.id)}">${done.has(+d) ? 'Done \u2713' : 'Mark as done'}</button>` : ''}</div>
      <div class="ask-days">${ss.map(cardHTML).join('')}</div></section>`).join('')}
    ${p.deeper?.length ? `<section class="ask-day deeper"><div class="ask-dayh"><h3>Go deeper</h3></div><div class="ask-days">${p.deeper.map(deeperHTML).join('')}</div></section>` : ''}
    <p class="muted small">Built from Satsang's own catalogue (${esc(String(p.catalog || '').slice(0, 10))}). Dates for retreats are on each place's own schedule.</p></div>`
}

// ---------- saving as a journey (existing /journeys + /saves APIs, device id) ----------
async function apiPost(path, body) {
  const c = await cfg(); if (!c.apiBase) return null
  try { return await fetch(c.apiBase + path, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json', ...(LS.get('session', null) ? { authorization: 'Bearer ' + LS.get('session', null) } : {}) }, body: JSON.stringify({ ...body, device: deviceId() }) }) } catch { return null }
}
async function savePath(id, btn) {
  const p = packs()[id]; if (!p) return
  btn.disabled = true; btn.textContent = 'Saving\u2026'
  let stored = p
  try {
    const r = await fetch(`${await chatBase()}/packs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: p.ask, device: deviceId() }) })
    const j = r.ok ? await r.json() : null
    if (j?.pack?.id) stored = j.pack
  } catch {}
  savePackLocal({ ...stored, savedAt: new Date().toISOString() })
  const J = journeys(); J[stored.id] = J[stored.id] || { started: new Date().toISOString(), unit: 1, done: [], paused: false, updated: new Date().toISOString() }; LS.set('journeys', J)
  await apiPost(`/journeys/${encodeURIComponent(stored.id)}/progress`, { unit: 1, done: J[stored.id].done, paused: false, started: J[stored.id].started })
  await apiPost('/saves', { ref: 'path:' + stored.id, list: 'Paths', at: new Date().toISOString() })
  const wrap = btn.closest('.ask-turn, .ask-open'); if (wrap) wrap.innerHTML = packHTML(stored, { saved: true })
  paintSaved()
}
async function markDay(id, day, el) {
  const J = journeys(), j = J[id]; if (!j) return
  const set = new Set(j.done || []); set.has(day) ? set.delete(day) : set.add(day)
  j.done = [...set].sort((a, b) => a - b); j.unit = Math.max(1, ...j.done) + (set.has(day) ? 1 : 0); j.updated = new Date().toISOString(); LS.set('journeys', J)
  apiPost(`/journeys/${encodeURIComponent(id)}/progress`, { unit: j.unit, done: j.done, paused: false, started: j.started })
  const wrap = el.closest('.ask-turn, .ask-open'); const p = packs()[id]; if (wrap && p) wrap.innerHTML = packHTML(p, { saved: true })
  paintSaved()
}
async function openSaved(id) {
  ensureView()
  let p = packs()[id]
  if (!p) { try { const r = await fetch(`${await chatBase()}/packs/${encodeURIComponent(id)}`); if (r.ok) { p = await r.json(); savePackLocal(p) } } catch {} }
  log.innerHTML = p ? `<div class="ask-open">${packHTML(p, { saved: !!journeys()[id] })}</div>` : `<div class="ask-err"><p>That path isn't on this device or the server any more. Build a new one below.</p></div>`
}
function paintSaved() {
  if (!root) return
  const el = root.querySelector('.ask-saved'), P = packs(), J = journeys()
  const list = Object.values(P).filter((p) => J[p.id] && !p.blocked).sort((a, b) => String(b.savedAt || '').localeCompare(String(a.savedAt || '')))
  el.hidden = !list.length
  el.innerHTML = list.length ? `<div class="wsech"><h3>Your paths</h3><span class="muted small">${list.length}</span></div><div class="ask-chips">${list.map((p) => `<a class="wchip" href="#ask/${esc(p.id)}">${esc(p.title)} \u00b7 ${(J[p.id].done || []).length}/${new Set(p.steps.map((s) => s.day)).size}</a>`).join('')}</div>` : ''
}
function onClick(e) {
  const s = e.target.closest('[data-save]'); if (s) return savePath(s.dataset.save, s)
  const d = e.target.closest('[data-day]'); if (d) return markDay(d.dataset.of, Number(d.dataset.day), d)
  const sh = e.target.closest('[data-share]'); if (sh) { const u = `${location.origin}${location.pathname}#ask/${sh.dataset.share}`; navigator.clipboard?.writeText(u).then(() => { sh.textContent = 'Link copied' }, () => { sh.textContent = u }); if (!journeys()[sh.dataset.share]) savePathQuiet(sh.dataset.share) }
}
async function savePathQuiet(id) { const p = packs()[id]; if (!p) return; try { await fetch(`${await chatBase()}/packs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: p.ask, device: deviceId() }) }) } catch {} }

// ---------- entries: the top bar, and topic hubs ----------
function addEntries() {
  const nav = document.querySelector('.top nav')
  if (nav && !nav.querySelector('.ask-navlink')) nav.insertAdjacentHTML('beforeend', '<a class="ask-navlink" href="#ask">Build a path</a>')
  const tv = document.getElementById('topicsview')
  const hub = () => {
    const m = location.hash.match(/^#topic\/([a-z0-9/_-]+)/); if (!m || !tv) return
    const cta = tv.querySelector('.whero .wcta'); if (!cta || cta.querySelector('.ask-cta')) return
    const label = tv.querySelector('.whero h1')?.textContent?.trim() || m[1]
    cta.insertAdjacentHTML('beforeend', `<a class="btn ghost ask-cta" href="#ask?topic=${encodeURIComponent(m[1])}&label=${encodeURIComponent(label)}">Build me a path</a>`)
  }
  if (tv) new MutationObserver(hub).observe(tv, { childList: true, subtree: true })
  const fv = document.getElementById('topicsview')
  const list = () => { if (!/^#topics\b/.test(location.hash) || !fv || fv.querySelector('.ask-banner')) return; const h = fv.querySelector('.head, h2'); if (h) h.insertAdjacentHTML('afterend', '<a class="ask-banner" href="#ask"><span class="eyebrow">New</span><b>Build me a path</b><span>Tell Satsang what you want; get talks, a practice, readings and places, in order.</span></a>') }
  if (fv) new MutationObserver(list).observe(fv, { childList: true, subtree: true })
  hub(); list()
}

export function initAsk() {
  if (window.__ask) return window.__ask
  if (!document.querySelector('link[href^="ask.css"]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'ask.css?v=' + ASK_V; document.head.appendChild(l) }
  ensureView(); addEntries()
  const onHash = () => {
    if (/^#ask\b/.test(location.hash)) { ensureView(); if (root.hidden) showSelf(); open() }
    else document.querySelector('.ask-navlink')?.classList.remove('on')
  }
  addEventListener('hashchange', onHash)
  if (/^#ask\b/.test(location.hash)) setTimeout(onHash, 0)
  window.__ask = { open, ask: (t) => { ensureView(); showSelf(); return ask(t) }, view: ensureView }
  return window.__ask
}
