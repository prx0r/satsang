// For You (#foryou, and a rail on Watch): an endless, ranked list of talks from src/feedrank.js with one honest "why" per
// card, "Not interested" / "Less like this", and a TV mode button. Dark design only: existing tokens and classes, plus the
// few fy-* rules appended to site/style.css. Desktop and TV never get a vertical clip (servable / horizontal-only).

import { rankFeed } from './feedrank.js'
import { dailyTheme, themeMatch, localDate } from './themes.js'

const PAGE = 24
export function createForYou(d) {
  // d: { esc, LS, ranker(), taste(), wise(), thumb, clips(), servable(c), inBallot(c), isUnplayable(id), watchOf(id), tierOf(w), stats(),
  //      label(t), topics(), intents(), device(), anniversaries(), toast, onTaste(), fmtDur(c), byId, horizontal() -> bool (TV / desktop) }
  const { esc, LS } = d
  let cache = null, cacheKey = '', theme = null, themeDay = ''
  const W = () => d.wise()
  const P = (id) => W().person?.(id) || null
  const tradL = (id) => W().tradition?.(id)?.label || ''
  const spk = (c) => c.speaker || c.comic
  const tName = (c) => P(spk(c))?.short || P(spk(c))?.n || c.teacher || c.comic || ''
  const title = (c) => c.segTitle || c.title || ''

  // ---------- signals ----------
  const lessLog = () => { const a = LS.get('feedLess', []); return Array.isArray(a) ? a : [] }
  const moreLog = () => { const a = LS.get('feedMore', []); return Array.isArray(a) ? a : [] }
  const seenLog = () => { const o = LS.get('feedSeen', {}); return o && typeof o === 'object' && !Array.isArray(o) ? o : {} }
  function agg(L) { // {clips:Set, teachers:{s:n}, topics:{t:n}} with a 30-day fade
    const now = Date.now(), out = { clips: new Set(), teachers: {}, topics: {} }
    for (const x of L) {
      const c = d.byId(x.clip); if (!c) continue
      const w = Math.pow(0.5, (now - Date.parse(x.at || 0)) / (30 * 86400000))
      if (x.kind !== 'more') out.clips.add(c.id)
      if (x.kind === 'not') continue
      out.teachers[spk(c)] = (out.teachers[spk(c)] || 0) + w
      for (const t of new Set((c.topics || []).map((t) => String(t).split('/')[0]))) out.topics[t] = (out.topics[t] || 0) + 0.5 * w
    }
    return out
  }
  function less(c, kind = 'less') { LS.set('feedLess', [...lessLog(), { clip: c.id, kind, at: new Date().toISOString() }].slice(-500)); cache = null; d.onTaste() }
  function more(c) { LS.set('feedMore', [...moreLog(), { clip: c.id, kind: 'more', at: new Date().toISOString() }].slice(-500)); cache = null; d.onTaste() }
  function undoLess(id) { LS.set('feedLess', lessLog().filter((x) => x.clip !== id)); cache = null; d.onTaste() }
  function seen(ids) { // impressions, one per clip per day (last 14 days kept)
    const S = seenLog(), day = localDate().date, cut = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)
    for (const id of ids) { const a = (S[id] ||= []); if (!a.includes(day)) a.push(day) }
    for (const k of Object.keys(S)) { S[k] = S[k].filter((x) => x >= cut); if (!S[k].length) delete S[k] }
    LS.set('feedSeen', S)
  }

  // ---------- today's theme ----------
  function todayTheme() {
    const { date, off } = localDate()
    if (theme && themeDay === date) return theme
    const R = d.ranker(), pool = d.clips().filter((c) => d.inBallot(c) && d.servable(c))
    const memo = new Map()
    const size = (m) => { const k = JSON.stringify(m); if (!memo.has(k)) memo.set(k, pool.reduce((s, c) => s + (themeMatch(m, c, R.famOfClip, R.schoolOf) >= 0.5 ? 1 : 0), 0)); return memo.get(k) }
    theme = dailyTheme(date, { off, anniversaries: d.anniversaries(), person: P, poolSize: size }); themeDay = date
    return theme
  }

  // ---------- the ranked list (cached for the day, the taste version and the signals) ----------
  function list(opts = {}) {
    const { date } = localDate(), T = d.taste(), hz = opts.horizontal ?? d.horizontal()
    const key = [date, T?.n || 0, lessLog().length, moreLog().length, d.intents().map((x) => x.id + x.w.toFixed(2)).join(','), hz ? 'h' : 'a', opts.topic || '', opts.teacher || ''].join('|')
    if (cache && cacheKey === key) return cache
    const R = d.ranker()
    let cands = d.clips().filter((c) => d.inBallot(c) && d.servable(c) && !d.isUnplayable(c.id) && c.media === 'youtube' && (!hz || c.format !== 'vertical'))
    if (opts.topic) cands = cands.filter((c) => (c.topics || []).some((t) => t === opts.topic || String(t).split('/')[0] === opts.topic))
    if (opts.teacher) cands = cands.filter((c) => spk(c) === opts.teacher || (c.figures || []).includes(opts.teacher))
    const W0 = W(), plays = []
    const w = d.watchLog?.() || {}
    for (const [id, e] of Object.entries(w)) if (e?.last && Date.now() - Date.parse(e.last) < 10 * 86400000) plays.push({ id, at: e.last })
    cache = rankFeed({ cands, R, taste: T, watch: d.watchOf, tier: d.tierOf, impressions: seenLog(), plays, less: agg(lessLog()), more: agg(moreLog()),
      intents: d.intents(), theme: todayTheme(), themeMatch: (m, c) => themeMatch(m, c, R.famOfClip, R.schoolOf), today: date, device: d.device(),
      stats: (id) => d.stats()[id] || null, topics: d.topics(), label: d.label, person: P, tradLabel: tradL, byId: d.byIdMap() }, opts.k || 160)
    cacheKey = key
    void W0
    return cache
  }

  // ---------- cards ----------
  function card(x, compact) {
    const c = x.c, dur = d.fmtDur(c)
    return `<article class="fy-card${compact ? ' fy-sm' : ''}" data-id="${esc(c.id)}">
      <a class="fy-th" href="#watch/${encodeURIComponent(c.id)}" aria-label="Play ${esc(title(c))}"><img loading="lazy" decoding="async" src="${d.thumb(c.id)}" alt="">${dur ? `<span class="fy-dur">${esc(dur)}</span>` : ''}</a>
      <div class="fy-body"><p class="fy-why fy-${esc(x.kind)}">${esc(x.why)}</p>
        <h3 class="fy-t"><a href="#watch/${encodeURIComponent(c.id)}">${esc(title(c))}</a></h3>
        <p class="fy-who"><a href="#teacher/${esc(spk(c))}">${esc(tName(c))}</a> <span class="fy-trad">${esc(tradL(d.ranker().schoolOf(c)) || tradL(c.tradition))}</span></p>
        ${compact ? '' : `<p class="fy-acts"><button type="button" class="linkbtn" data-tvfrom="${esc(c.id)}">Play in TV mode</button><span class="fy-sep" aria-hidden="true">\u00b7</span><button type="button" class="linkbtn" data-not="${esc(c.id)}">Not interested</button><span class="fy-sep" aria-hidden="true">\u00b7</span><button type="button" class="linkbtn" data-less="${esc(c.id)}">Less like this</button></p>`}</div></article>`
  }
  function bindCards(root) {
    root.querySelectorAll('[data-not],[data-less]').forEach((b) => (b.onclick = (e) => {
      e.preventDefault(); const id = b.dataset.not || b.dataset.less, c = d.byId(id); if (!c) return
      const kind = b.dataset.not ? 'not' : 'less'; less(c, kind)
      const art = b.closest('.fy-card'); art.classList.add('fy-gone')
      art.querySelector('.fy-body').innerHTML = `<p class="fy-why">${kind === 'not' ? 'Hidden.' : `Less like this: fewer talks from ${esc(tName(c))} and on this theme.`}</p><p class="fy-acts"><button type="button" class="linkbtn" data-undo="${esc(id)}">Undo</button></p>`
      art.querySelector('[data-undo]').onclick = () => { undoLess(id); art.classList.remove('fy-gone'); const tmp = document.createElement('div'); tmp.innerHTML = card({ c, kind: 'fit', why: 'Back in your list' }); art.replaceWith(tmp.firstElementChild); bindCards(root) }
    }))
    root.querySelectorAll('[data-tvfrom]').forEach((b) => (b.onclick = (e) => { e.preventDefault(); location.hash = 'tv/from/' + encodeURIComponent(b.dataset.tvfrom) }))
  }
  let io = null
  function observe(root) {
    if (typeof IntersectionObserver === 'undefined') return
    io?.disconnect()
    let buf = [], t = null
    io = new IntersectionObserver((ents) => { for (const e of ents) if (e.isIntersecting && e.intersectionRatio >= 0.6) { buf.push(e.target.dataset.id); io.unobserve(e.target) } clearTimeout(t); t = setTimeout(() => { if (buf.length) seen(buf.splice(0)) }, 800) }, { threshold: [0.6] })
    root.querySelectorAll('.fy-card').forEach((a) => io.observe(a))
  }
  const bigScreen = () => typeof matchMedia !== 'undefined' && (matchMedia('(pointer: none)').matches || matchMedia('(min-width: 1800px)').matches || /\b(SMART-TV|SmartTV|Tizen|Web0S|webOS|AFT[A-Z]|CrKey|BRAVIA|HbbTV|GoogleTV|Android TV)\b/i.test(navigator.userAgent || ''))
  function tvSuggest() {
    if (!bigScreen() || sessionStorage.getItem('wiser.tvhint')) return ''
    return `<div class="fy-tvhint" role="note"><span>On a big screen? Sit back with TV mode: talks keep coming, the remote does the rest.</span><a class="btn gold" href="#tv">TV mode \u25b8</a><button type="button" class="linkbtn" data-tvhint-x="1">Not now</button></div>`
  }
  function bindHint(el) { el.querySelector('[data-tvhint-x]')?.addEventListener('click', () => { sessionStorage.setItem('wiser.tvhint', '1'); el.querySelector('.fy-tvhint')?.remove() }) }

  // ---------- #foryou ----------
  function paint(el) {
    const L = list(), th = todayTheme(), it = d.intents()
    let shown = 0
    el.innerHTML = `<div class="head"><h2>For you</h2><div class="fy-head-acts"><a class="btn gold" href="#tv">TV mode \u25b8</a></div></div>
      <p class="muted lede">${d.taste()?.n >= 2 ? 'Ranked from what resonates with you, with room for the unexpected.' : 'A first mix from the talks listeners find most resonant, across the traditions. It learns from every heart and pick.'}</p>
      ${th ? `<p class="fy-today"><span class="eyebrow">${esc(th.kind === 'rotation' ? 'Today' : th.kind === 'anniversary' ? 'On this day' : th.kind === 'moon' ? 'Today' : 'Today')}</span> <b>${esc(th.label)}</b> <span class="muted">${esc(th.line)}</span></p>` : ''}
      ${it.length ? `<p class="muted small fy-int">Leaning towards ${esc(it.map((x) => x.label).join(', '))} \u00b7 <a href="#me" data-goint="1">change</a></p>` : `<p class="muted small fy-int"><a href="#me" data-goint="1">Tell Wiser what is on your mind</a> (optional, private)</p>`}
      ${tvSuggest()}
      <div class="fy-grid" id="fygrid"></div><div class="fy-more" id="fymore"><span class="muted small">More arriving as you scroll</span></div>`
    const grid = el.querySelector('#fygrid')
    const more = () => { const next = L.slice(shown, shown + PAGE); if (!next.length) { el.querySelector('#fymore').innerHTML = '<p class="muted small">That is today\u2019s list. Tomorrow brings a new one.</p>'; return } grid.insertAdjacentHTML('beforeend', next.map((x) => card(x)).join('')); shown += next.length; bindCards(grid); observe(grid) }
    more()
    if (typeof IntersectionObserver !== 'undefined') { const s = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) more() }, { rootMargin: '600px' }); s.observe(el.querySelector('#fymore')) }
    el.querySelector('[data-goint]')?.addEventListener('click', () => setTimeout(() => document.getElementById('intents')?.scrollIntoView({ block: 'start' }), 400))
    bindHint(el)
  }
  // ---------- the rail on Watch ----------
  function rail(el) {
    if (!el) return
    const L = list().slice(0, 14)
    if (!L.length) { el.innerHTML = ''; return }
    const th = todayTheme()
    el.innerHTML = `<section class="wsec fy-rail"><div class="wsech"><h3>For you</h3><span class="fy-rail-acts">${th ? `<span class="muted small">Today: ${esc(th.label)}</span>` : ''}<a class="hbtn" href="#tv">TV mode</a><a class="hbtn" href="#foryou">See all</a></span></div>
      ${tvSuggest()}<div class="rail fy-railrow">${L.map((x) => card(x, true)).join('')}</div></section>`
    bindCards(el); observe(el); bindHint(el)
  }
  return { list, paint, rail, less, more, todayTheme, seen, lessLog, moreLog, bigScreen, invalidate: () => { cache = null } }
}
