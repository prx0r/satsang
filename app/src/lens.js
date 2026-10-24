// The enquiry lens (search/README.md; spec ../wiser-search-index/SERVE-SPEC.md section 5): one persistent question at the top
// of every tab. Watch / Topics / Teachers / Places / Practise / Ask each re-rank around it from the same /search response
// (satsang-search Worker: ids + scores only) joined with the catalogue the site already holds.
// "Metadata match" = matched on a talk's title, teacher, topics and why-line. "Transcript moment" = a timed passage whose meaning
// matched (only for talks that have one; no transcript text is ever sent to the browser or shown).
// Integration (app.js): import { initLens } from './lens.js'; initLens({...deps}) once after tabs(). Self-contained otherwise.

const DEFAULT_SEARCH = 'https://satsang-search.tradesprior.workers.dev'
const LENS_V = '1'
const CONF_FLOOR = 0.66
// held (BRIEF "main teachers held") + public red-flag subjects: never surfaced by the lens (the Worker filters them too)
const HELD = new Set(['ajahn-sucitto', 'jack-kornfield', 'swami-ramdev', 'yogi-bhajan', 'taizan-maezumi', 'sogyal-rinpoche', 'swami-vishnudevananda', 'swami-rama'])
const PLACE_SOFT = new Set(['pilgrimage', 'sacred-site', 'bookshop', 'university'])  // kept only with a practice offer (places-index po:1)
const EXAMPLES = ['fear of death', 'how to deal with anger', 'what is nonduality', 'past lives', 'grief', 'sufi remembrance']
const TABS = { 'v-flash': 'watch', 'v-arena': 'watch', 'v-foryou': 'watch', 'v-topics': 'topics', 'v-courses': 'topics', 'v-comics': 'teachers', 'v-places': 'places', 'v-col': 'practise', 'v-ask': 'ask' }

const LS = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem('wiser.' + k)) ?? d } catch { return d } },
  set: (k, v) => { try { v == null ? localStorage.removeItem('wiser.' + k) : localStorage.setItem('wiser.' + k, JSON.stringify(v)) } catch {} },
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const mmss = (s) => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}` }

export function initLens(D) {
  // D: { byId(), clipTile(c), thumb(id), wise(), cols(), topicLabel(t), ready: Promise }
  let base = DEFAULT_SEARCH, st = LS.get('lens', null) || { q: '', filter: null }, res = null, busy = false, err = '', places = null, seq = 0
  const fromUrl = new URLSearchParams(location.search).get('q')
  if (fromUrl) st = { q: fromUrl.slice(0, 200), filter: null }
  fetch('config.json', { cache: 'no-cache' }).then((r) => r.json()).then((c) => { if (c.searchBase) base = c.searchBase.replace(/\/$/, '') }).catch(() => {})
  if (!document.querySelector('link[href^="lens.css"]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'lens.css?v=' + LENS_V; document.head.appendChild(l) }

  // ---------- the bar (persistent, above every tab) ----------
  const main = document.querySelector('main'); if (!main) return
  const bar = document.createElement('div'); bar.className = 'lensbar'; bar.id = 'lensbar'
  main.prepend(bar)
  function paintBar() {
    if (st.q && !bar.classList.contains('editing')) {
      const f = st.filter
      bar.innerHTML = `<div class="lens-q" role="search"><button type="button" class="lens-chip" data-edit title="Change your question"><span class="lens-eye">Your question</span><b>${esc(st.q)}</b></button>${f ? `<button type="button" class="lens-f" data-unfilter title="Show all categories again">within ${esc(chipLabel(f))} <i aria-hidden="true">\u00d7</i></button>` : ''}<button type="button" class="lens-x" data-clear aria-label="Clear the question">\u00d7</button></div>`
    } else {
      bar.innerHTML = `<form class="lens-form" role="search" autocomplete="off"><label class="lens-sr" for="lens-in">Ask Satsang a question</label><input id="lens-in" type="search" maxlength="200" enterkeyhint="search" placeholder="Bring a question \u2014 e.g. fear of death" value="${esc(st.q)}"><button type="submit" class="lens-go">Search</button></form>${st.q ? '' : `<div class="lens-ex">${EXAMPLES.map((e) => `<button type="button" data-ex="${esc(e)}">${esc(e)}</button>`).join('')}</div>`}`
    }
  }
  bar.addEventListener('submit', (e) => { e.preventDefault(); const v = bar.querySelector('input')?.value.trim(); bar.classList.remove('editing'); if (v) ask(v); else clear() })
  bar.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return
    if (t.dataset.ex) ask(t.dataset.ex)
    else if (t.hasAttribute('data-edit')) { bar.classList.add('editing'); paintBar(); const i = bar.querySelector('input'); i?.focus(); i?.select() }
    else if (t.hasAttribute('data-clear')) clear()
    else if (t.hasAttribute('data-unfilter')) { st.filter = null; save(); run() }
  })
  bar.addEventListener('focusout', (e) => { if (bar.classList.contains('editing') && !bar.contains(e.relatedTarget)) setTimeout(() => { if (!bar.contains(document.activeElement)) { bar.classList.remove('editing'); paintBar() } }, 150) })

  const save = () => LS.set('lens', st.q ? st : null)
  function ask(q) { st = { q: q.slice(0, 200), filter: null }; save(); syncUrl(); run() }
  function clear() { st = { q: '', filter: null }; res = null; err = ''; save(); syncUrl(); bar.classList.remove('editing'); paintBar(); paint() }
  function syncUrl() { const u = new URL(location.href); if (st.q) u.searchParams.set('q', st.q); else u.searchParams.delete('q'); history.replaceState(history.state, '', u.pathname + u.search + u.hash) }

  async function run() {
    paintBar()
    if (!st.q) return paint()
    const my = ++seq; busy = true; err = ''; paint()
    const p = new URLSearchParams({ q: st.q, scope: 'all' })
    if (st.filter) p.set(st.filter.type, st.filter.id)
    try {
      const r = await fetch(`${base}/search?${p}`)
      const j = await r.json()
      if (my !== seq) return
      if (!r.ok) throw new Error(j.error || 'search failed')
      res = j
    } catch (e) { if (my !== seq) return; err = 'Search is resting for a moment. Your question is kept; try again shortly.'; res = null }
    busy = false
    await D.ready?.catch(() => {})
    if (!places) places = fetch('data/wisegraph/places-index.json').then((r) => r.json()).then((j) => j.places || []).catch(() => [])
    paint()
  }

  // ---------- joining ids to the catalogue ----------
  const people = () => D.wise()?.people?.() || {}
  const trads = () => D.wise()?.traditions?.() || {}
  const colsAll = () => { try { return D.cols().all() || [] } catch { return [] } }
  const colById = (id) => colsAll().find((c) => c.id === id)
  const practice = (id) => { try { return D.cols().practice(id) } catch { return null } }
  const isHeld = (speaker) => HELD.has(speaker) || !!people()[speaker]?.safety
  function chipLabel(c) {
    if (c.type === 'teacher') return people()[c.id]?.n || c.id.replace(/-/g, ' ')
    if (c.type === 'topic') return D.topicLabel?.(c.id) || c.id.split('/').pop().replace(/-/g, ' ')
    if (c.type === 'tradition') return trads()[c.id]?.label || c.id.replace(/-/g, ' ')
    if (c.type === 'series') return colById(c.id)?.title || c.id.replace(/-/g, ' ')
    return c.id
  }
  const chipHref = (c) => ({ teacher: '#teacher/', topic: '#topic/', tradition: '#tradition/', series: '#series/' }[c.type] + c.id)
  const colHref = (c) => (c.kind === 'mini-course' ? '#series/' : '#collection/') + c.id
  // talks: tier boost (gold 1.15, strong 1.07), drop footage and held teachers, dedupe re-uploads (teacher + title)
  function talks(list, n) {
    const B = D.byId(), seen = new Set(), out = []
    const L = (list || []).map((t) => ({ ...t, c: B[t.clip] })).filter((t) => t.c && t.c.delivery !== 'footage' && !isHeld(t.c.speaker))
      .map((t) => ({ ...t, s: (t.score || 0) * (t.c.gold ? 1.15 : t.c.strong ? 1.07 : 1) })).sort((a, b) => b.s - a.s)
    for (const t of L) { const k = (t.c.speaker || t.c.teacher) + '|' + String(t.c.segTitle || t.c.title).toLowerCase().trim(); if (seen.has(k)) continue; seen.add(k); out.push(t); if (out.length >= n) break }
    return out
  }
  const lowConf = () => res && res.conf != null && res.conf < CONF_FLOOR

  // ---------- blocks ----------
  const kind = (k, extra) => `<span class="lens-kind ${k}">${k === 'meta' ? 'Metadata match' : 'Transcript moment'}${extra ? ' \u00b7 ' + esc(extra) : ''}</span>`
  const tile = (t, label) => `<div class="lens-t">${kind('meta', label)}${D.clipTile(t.c)}</div>`
  function talksBlock(n = 8, title = 'Talks that answer it') {
    const L = talks(res.talks, n); if (!L.length) return ''
    return `<section class="lens-sec"><h3>${title}</h3><p class="lens-why">Matched on each talk\u2019s title, teacher, topics and why-line.</p><div class="lens-grid">${L.map((t) => tile(t)).join('')}</div></section>`
  }
  function momentsBlock() {
    const B = D.byId(), M = (res.watch || []).filter((w) => B[w.clip] && !isHeld(B[w.clip].speaker)); if (!M.length) return ''
    return `<section class="lens-sec"><h3>Moments where it\u2019s spoken about</h3><p class="lens-why">A timed passage of the talk matched your question in meaning. Opens at that point${M.some((m) => m.approx) ? ' (~ = approximate time)' : ''}.</p><div class="lens-grid">${M.slice(0, 6).map((w) => { const c = B[w.clip]; return `<div class="lens-t">${kind('moment', (w.approx ? '~' : '') + mmss(w.start))}<button type="button" class="lens-mom" data-yt="${esc(w.yt)}" data-start="${w.start}" data-end="${w.end}"><span class="lens-mimg"><img loading="lazy" src="${D.thumb(w.yt)}" alt=""><i class="lens-play" aria-hidden="true"></i></span><span class="lens-mcap"><b>${esc(c.segTitle || c.title)}</b><span>${esc(c.teacher || c.comic || '')} \u00b7 from ${w.approx ? '~' : ''}${mmss(w.start)}</span></span></button></div>` }).join('')}</div></section>`
  }
  function chipsBlock(types, title = 'Where it sits') {
    const C = (res.chips || []).filter((c) => (!types || types.includes(c.type)) && !(c.type === 'teacher' && isHeld(c.id))); if (!C.length) return ''
    return `<section class="lens-sec"><h3>${title}</h3><div class="lens-chips">${C.map((c) => `<span class="lens-cat"><button type="button" data-chip="${esc(c.type)}|${esc(c.id)}" title="Search within this ${esc(c.type)}"><em>${esc(c.type)}</em>${esc(chipLabel(c))}</button><a href="${esc(chipHref(c))}" aria-label="Open the ${esc(c.type)} page">\u2197</a></span>`).join('')}</div>${res.anchor && res.anchor.startsWith('series:') ? '<p class="lens-why">Few talks match closely, so these come from the best-matching series.</p>' : ''}</section>`
  }
  function similarBlock() {
    const B = D.byId(), shown = new Set(talks(res.talks, 8).map((t) => t.clip))
    const L = (res.similar || []).filter((s) => B[s.clip] && !shown.has(s.clip) && !isHeld(B[s.clip].speaker)).slice(0, 8); if (!L.length) return ''
    return `<section class="lens-sec"><h3>More in those categories</h3><div class="lens-grid">${L.map((s) => `<div class="lens-t">${kind('meta', s.via?.length ? 'because: ' + s.via.map((v) => { const [type, ...r] = v.split(':'); return chipLabel({ type, id: r.join(':') }) }).join(', ') : '')}${D.clipTile(B[s.clip])}</div>`).join('')}</div></section>`
  }
  function seriesBlock(n = 4) {
    const hitIds = new Set(talks(res.talks, 12).map((t) => t.clip))
    const L = (res.series || []).map((s) => { const c = colById(s.id); if (!c) return null; const refs = JSON.stringify(c.units || c.items || []); let hit = 0; for (const id of hitIds) if (refs.includes('clip:' + id)) hit++; return { c, s: s.score + 0.6 * Math.min(1, hit / 3) } }).filter(Boolean).sort((a, b) => b.s - a.s).slice(0, n)
    if (!L.length) return ''
    return `<section class="lens-sec"><h3>Series</h3><div class="lens-cards">${L.map(({ c }) => `<a class="lens-card" href="${esc(colHref(c))}"><span class="lens-eye">${c.kind === 'mini-course' ? 'Series' : esc(String(c.kind || 'Collection').replace(/-/g, ' '))}${c.units?.length ? ` \u00b7 ${c.units.length} sessions` : ''}</span><b>${esc(c.title)}</b>${c.intro ? `<span>${esc(String(c.intro).slice(0, 140))}${String(c.intro).length > 140 ? '\u2026' : ''}</span>` : ''}</a>`).join('')}</div></section>`
  }
  function practicesBlock(n = 4) {
    const L = (res.practices || []).map((p) => practice(p.id)).filter(Boolean).slice(0, n); if (!L.length) return ''
    return `<section class="lens-sec"><h3>Practices</h3><div class="lens-cards">${L.map((p) => `<a class="lens-card" href="#practice/${esc(p.id)}"><span class="lens-eye">${esc(p.tradLabel || '')}${p.minutes ? ` \u00b7 ${p.minutes} min` : ''}</span><b>${esc(p.name)}</b>${p.needsTeacher ? '<span class="lens-badge">Learn with a teacher</span>' : ''}${p.cautions?.length ? `<span class="lens-caution">${esc(p.cautions[0])}</span>` : ''}</a>`).join('')}</div></section>`
  }
  function teachersBlock() {
    const B = D.byId(), w = new Map()
    talks(res.talks, 30).forEach((t, r) => { const s = t.c.speaker; if (s && !isHeld(s)) w.set(s, (w.get(s) || 0) + 1 / (r + 3)) })
    ;(res.watch || []).forEach((m, r) => { const s = B[m.clip]?.speaker; if (s && !isHeld(s)) w.set(s, (w.get(s) || 0) + 1 / (r + 3)) })
    ;(res.chips || []).filter((c) => c.type === 'teacher' && !isHeld(c.id)).forEach((c) => w.set(c.id, (w.get(c.id) || 0) + c.score * 0.5))
    const L = [...w].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id]) => ({ id, p: people()[id] })).filter((x) => x.p)
    if (!L.length) return ''
    return `<section class="lens-sec"><h3>Teachers who speak to it</h3><div class="lens-cards">${L.map(({ id, p }) => { const tl = trads()[p.t]?.label; const img = p.img?.src; return `<a class="lens-card lens-person" href="#teacher/${esc(id)}">${img ? `<img loading="lazy" src="${esc(img)}" alt="">` : `<span class="lens-mono">${esc((p.n || '?').slice(0, 1))}</span>`}<span><b>${esc(p.n)}</b>${tl ? `<span>${esc(tl)}</span>` : ''}</span></a>` }).join('')}</div></section>`
  }
  function placesHTML(P) {
    const B = D.byId(), tw = new Map(), trw = new Map()
    talks(res.talks, 30).forEach((t, r) => { const s = t.c.speaker; if (s) tw.set(s, (tw.get(s) || 0) + 1 / (r + 3)); for (const tr of t.c.traditions || [t.c.tradition]) if (tr) trw.set(tr, (trw.get(tr) || 0) + 1 / (r + 3)) })
    ;(res.chips || []).filter((c) => c.type === 'tradition').forEach((c) => trw.set(c.id, (trw.get(c.id) || 0) + c.score))
    const sc = []
    for (const p of P) {
      if (p.goenka) continue
      if (PLACE_SOFT.has(p.type) && !p.po) continue
      if ((p.teachers || []).some(isHeld)) continue
      let s = 0; for (const t of p.teachers || []) s += tw.get(t) || 0
      let tr = 0; for (const t of p.traditions || []) tr += trw.get(t) || 0
      s += 0.5 * tr
      if (s > 0) sc.push({ p, s, key: (p.teachers || []).slice().sort().join(',') || p.id })
    }
    sc.sort((a, b) => b.s - a.s)
    const seenKey = new Set(), out = []
    for (const x of sc) { if (x.p.teachers?.length && seenKey.has(x.key)) continue; seenKey.add(x.key); out.push(x.p); if (out.length >= 6) break }
    if (!out.length) return ''
    return `<section class="lens-sec"><h3>Places to practise it</h3><p class="lens-why">Linked through the teachers and traditions of the matching talks. Pilgrimage sites only when they run retreats or courses.</p><div class="lens-cards">${out.map((p) => `<a class="lens-card" href="#place/${esc(p.id)}"><span class="lens-eye">${esc(String(p.type).replace(/-/g, ' '))}${p.country ? ' \u00b7 ' + esc(p.country) : ''}</span><b>${esc(p.name)}</b>${p.city ? `<span>${esc(p.city)}</span>` : ''}${p.teachers?.[0] && people()[p.teachers[0]] ? `<span class="lens-mut">${esc(people()[p.teachers[0]].n)}</span>` : ''}</a>`).join('')}</div></section>`
  }
  function askBlock() {
    return `<section class="lens-sec lens-ask"><h3>Build a path from this question</h3><p class="lens-why">Satsang\u2019s path builder orders its own talks, practices, readings and places into a short path, with a reason for each. Deterministic; nothing invented.</p><a class="lens-btn" href="#ask?q=${encodeURIComponent(st.q)}&go=1">Build my path</a></section>`
  }

  // ---------- per-tab composition ----------
  function compose(tab) {
    const lead = lowConf() ? seriesBlock(3) + practicesBlock(3) : ''
    const note = lowConf() ? '<p class="lens-note">Few talks speak to this directly, so Satsang\u2019s series and practices come first.</p>' : ''
    switch (tab) {
      case 'watch': return note + lead + talksBlock(8) + momentsBlock() + chipsBlock(null) + similarBlock() + (lowConf() ? '' : seriesBlock(2))
      case 'topics': return note + chipsBlock(['topic', 'tradition', 'series'], 'Topics and traditions it touches') + (lowConf() ? lead : seriesBlock(4)) + talksBlock(4)
      case 'teachers': return note + teachersBlock() + chipsBlock(['teacher', 'tradition'], 'Teachers and traditions') + talksBlock(4)
      case 'places': return '<div data-lens-places></div>' + chipsBlock(['tradition'], 'Traditions')
      case 'practise': return note + practicesBlock(4) + seriesBlock(lowConf() ? 3 : 2) + momentsBlock()
      case 'ask': return askBlock()
      default: return ''
    }
  }
  let panel = null
  function paint() {
    const view = document.querySelector('main > section.view:not([hidden])'), tab = view && TABS[view.id]
    if (panel && (!view || panel.parentNode !== view)) { panel.remove(); panel = null }
    if (!st.q || !view || !tab) { panel?.remove(); panel = null; return }
    if (!panel) { panel = document.createElement('div'); panel.className = 'lens-panel'; panel.setAttribute('aria-live', 'polite'); view.prepend(panel) }
    panel.dataset.tab = tab
    if (busy && !res) { panel.innerHTML = '<p class="lens-wait">Looking across the talks\u2026</p>'; return }
    if (err) { panel.innerHTML = `<p class="lens-note">${esc(err)}</p>`; return }
    if (!res) { panel.innerHTML = ''; return }
    const body = compose(tab)
    const conf = res.conf != null ? `<span class="lens-conf ${lowConf() ? 'low' : ''}" title="How closely the best talks match (cosine of the top 3)">${lowConf() ? 'loose match' : 'close match'}</span>` : (res.degraded ? '<span class="lens-conf low">keyword match only</span>' : '')
    panel.innerHTML = `<header class="lens-head"><span class="lens-eye">Around your question${busy ? ' \u00b7 updating\u2026' : ''}</span>${conf}<button type="button" class="lens-fold" data-fold aria-expanded="true">Hide</button></header><div class="lens-body">${body || '<p class="lens-note">Nothing here for this question yet.</p>'}</div>`
    if (tab === 'places') places?.then((P) => { const box = panel?.querySelector('[data-lens-places]'); if (box) box.innerHTML = placesHTML(P) || '<p class="lens-note">No place is linked to these talks yet.</p>' })
  }
  main.addEventListener('click', (e) => {
    const t = e.target.closest('.lens-panel button'); if (!t) return
    if (t.dataset.chip) { const [type, ...id] = t.dataset.chip.split('|'); st.filter = { type, id: id.join('|') }; save(); run(); scrollTo({ top: 0, behavior: 'smooth' }) }
    else if (t.hasAttribute('data-fold')) { const b = panel.querySelector('.lens-body'), open = b.hidden; b.hidden = !open; t.textContent = open ? 'Hide' : 'Show'; t.setAttribute('aria-expanded', String(open)) }
    else if (t.dataset.yt) {  // a transcript moment: privacy-enhanced embed at the matched time
      const box = t.closest('.lens-t'), s = Number(t.dataset.start) || 0, en = Number(t.dataset.end) || 0
      box.innerHTML = `<div class="lens-frame"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(t.dataset.yt)}?start=${Math.floor(s)}${en > s ? '&end=' + Math.ceil(en + 30) : ''}&autoplay=1&rel=0&playsinline=1" title="Talk moment" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>${box.querySelector('.lens-kind')?.outerHTML || ''}`
    }
  })
  // the Ask nav link carries the question into the path builder
  document.querySelector('.ask-navlink')?.addEventListener('click', (e) => { if (st.q) { e.preventDefault(); location.hash = `ask?q=${encodeURIComponent(st.q)}&go=1` } })
  // re-rank whenever the visible tab changes (app.js toggles section[hidden])
  let raf = 0
  new MutationObserver((muts) => { if (!muts.some((m) => m.target.parentNode === main && m.target.matches?.('section.view'))) return; cancelAnimationFrame(raf); raf = requestAnimationFrame(paint) }).observe(main, { subtree: true, attributes: true, attributeFilter: ['hidden'] })
  paintBar()
  if (st.q) run()
  window.__lens = { ask, clear, state: () => ({ ...st, res }), paint }
}
