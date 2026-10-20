// TV mode (#tv, specs/LOOP.md §4 + specs/FORYOU.md §4): full screen, lean-back, horizontal talks that keep coming from the
// For You ranking (or a topic, a teacher, a collection). A minimal overlay (title, teacher, tradition, why) that hides when
// idle; the next-up card in the last 10 s; a topic title card between topics. Remote / keyboard:
//   OK/Enter = this resonates (heart)   ↑ more like this   ↓ less like this (and move on)   → / N next   ← previous
//   Space pause   T topics   Esc / Back exit
// Signals feed the taste (src/taste.js: resonates, feedMore, feedLess, flashSkips, completions from the watch log).
// Official YouTube player only, inside the site (the Screen class from src/app.js), never a vertical clip.

const IDLE_MS = 3500, NEXT_UP_SEC = 10, INTER_MS = 2600, GATE_SEC = 60
export function createTV(d) {
  // d: { esc, makeScreen(clip, hostId, onFail), feed(opts) -> [{c, why, kind}], byId(id), wise(), ranker(), label(t), question(t), topics() -> published [{id,label}],
  //      resonate(id, screen), isRes(id), more(c), less(c), skipSignal(c, sec), logWatch(screen), toast, exit(), collectionClips(id) -> clips, setLive(s), thumb }
  const { esc } = d
  let el = null, Q = [], i = -1, scr = null, tick = null, idleT = null, interT = null, src = { kind: 'foryou' }, n = 0, on = false, paused = false, nextShown = false
  const W = () => d.wise()
  const P = (id) => W().person?.(id) || null
  const spk = (c) => c.speaker || c.comic
  const tName = (c) => P(spk(c))?.short || P(spk(c))?.n || c.teacher || c.comic || ''
  const tradL = (c) => W().tradition?.(d.ranker().schoolOf(c))?.label || W().tradition?.(c.tradition)?.label || ''
  const title = (c) => c.segTitle || c.title || ''
  const topicOf = (c) => { const t = (c.topics || []).find((x) => !x.includes('/')) || (c.topics || [])[0]; return t ? String(t).split('/')[0] : null }

  function build() {
    let L = []
    if (src.kind === 'collection') L = d.collectionClips(src.id).filter((c) => c.format !== 'vertical').map((c) => ({ c, why: src.label ? 'From ' + src.label : 'From the collection', kind: 'collection' }))
    else L = d.feed({ horizontal: true, topic: src.kind === 'topic' ? src.id : null, teacher: src.kind === 'teacher' ? src.id : null, k: 200 })
    if (src.from) { const f = d.byId(src.from); if (f && f.format !== 'vertical') L = [{ c: f, why: 'You chose this one', kind: 'chosen' }, ...L.filter((x) => x.c.id !== f.id)] }
    return L.filter((x) => x.c && x.c.format !== 'vertical')
  }
  function mount(container) {
    el = container
    el.innerHTML = `<div class="tv" tabindex="-1" aria-label="TV mode">
      <div class="tv-stage"></div>
      <div class="tv-shade" aria-hidden="true"></div>
      <div class="tv-top"><span class="eyebrow">Satsang \u00b7 TV</span><span class="tv-src marquee"></span></div>
      <div class="tv-ov"><p class="tv-why"></p><h1 class="tv-title"></h1><p class="tv-who"><b class="tv-name"></b> <span class="tv-trad"></span></p></div>
      <div class="tv-keys" aria-hidden="true"><span><kbd>OK</kbd> resonates</span><span><kbd>\u2191</kbd> more like this</span><span><kbd>\u2193</kbd> less</span><span><kbd>\u2190</kbd><kbd>\u2192</kbd> previous / next</span><span><kbd>T</kbd> topics</span><span><kbd>Esc</kbd> exit</span></div>
      <div class="tv-prog" aria-hidden="true"><i></i></div>
      <div class="tv-heart" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/></svg></div>
      <div class="tv-note" aria-live="polite"></div>
      <div class="tv-next" aria-live="polite"></div>
      <section class="tv-inter fl-card" aria-live="polite"></section>
      <section class="tv-topics" hidden></section>
      <button type="button" class="tv-exit hbtn" aria-label="Exit TV mode (Esc)">Exit</button>
    </div>`
    el.querySelector('.tv-exit').onclick = () => d.exit()
    el.querySelector('.tv').addEventListener('pointermove', wake, { passive: true })
    el.querySelector('.tv').addEventListener('click', (e) => { if (e.target.closest('button,a,.tv-topics')) return; wake(); if (e.target.closest('.tv-stage,.tv-shade')) toggle() })
  }
  function start(container, opts = {}) {
    if (!el || el !== container) mount(container)
    stop(true)
    on = true; src = opts.kind ? opts : { kind: 'foryou', ...opts }
    Q = build(); i = -1
    el.querySelector('.tv-src').textContent = src.kind === 'topic' ? d.label(src.id) || '' : src.kind === 'teacher' ? (P(src.id)?.short || P(src.id)?.n || '') : src.kind === 'collection' ? src.label || 'Collection' : 'For you'
    document.body.classList.add('tv-on')
    try { if (!document.fullscreenElement && opts.fs !== false) document.documentElement.requestFullscreen?.().catch(() => {}) } catch {}
    if (!Q.length) { note('Nothing to play here yet.'); return }
    el.querySelector('.tv').focus({ preventScroll: true })
    go(0, true)
  }
  function stop(keep) {
    clearInterval(tick); clearTimeout(idleT); clearTimeout(interT); tick = idleT = interT = null
    if (scr) { try { d.logWatch(scr) } catch {} try { scr.retire() } catch {} scr = null }
    d.setLive?.(null)
    if (!keep) { on = false; document.body.classList.remove('tv-on', 'tv-idle'); try { if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}) } catch {} }
  }
  function go(k, first) {
    if (!on) return
    if (k < 0) return note('This is the first talk.')
    if (k >= Q.length) { const more = build().filter((x) => !Q.some((y) => y.c.id === x.c.id)); if (!more.length) return note('That is everything for now.'); Q.push(...more) }
    const prev = Q[i]?.c, nx = Q[k].c
    if (scr) { try { scr.track(); d.logWatch(scr); scr.fadePause() } catch {} const old = scr; setTimeout(() => { try { old.retire() } catch {} }, 600); scr = null }
    i = k; nextShown = false; paused = false
    el.querySelector('.tv-next').classList.remove('on'); el.querySelector('.tv').classList.remove('nextup')
    const tp = topicOf(nx), changed = first || !prev || topicOf(prev) !== tp
    paint(Q[i])
    const host = el.querySelector('.tv-stage'), id = 'tvp' + ++n
    host.insertAdjacentHTML('beforeend', `<div class="tv-screen" data-n="${n}"><div class="yt" id="${id}"></div></div>`)
    while (host.children.length > 2) host.firstElementChild.remove()
    const s = d.makeScreen(nx, id, () => { if (scr === s) { note('That one would not play here. Next.'); Q.splice(i, 1); i--; go(i + 1) } })
    scr = s; s.mount()
    const begin = () => { if (scr !== s) return; host.querySelectorAll('.tv-screen').forEach((x) => x.classList.toggle('on', x.dataset.n === String(n))); d.setLive?.(s); s.play(); loop(s) }
    if (changed && tp && d.label(tp)) { inter(tp, nx); interT = setTimeout(() => { el.querySelector('.tv-inter').classList.remove('on'); el.querySelector('.tv').classList.remove('inter'); begin() }, INTER_MS) }
    else begin()
    wake()
  }
  function inter(tp, c) {
    const box = el.querySelector('.tv-inter'), q = d.question(tp)
    box.innerHTML = `<div class="fl-in"><p class="eyebrow">Next</p><h2 class="fl-topic tv-it">${esc(d.label(tp))}</h2><span class="fl-hair" aria-hidden="true"></span>${q ? `<p class="fl-q">${esc(q)}</p>` : ''}<p class="marquee fl-trads">${esc(tName(c))} <span aria-hidden="true">\u00b7</span> ${esc(tradL(c))}</p></div>`
    box.classList.remove('on'); void box.offsetWidth; box.classList.add('on'); el.querySelector('.tv').classList.add('inter')
  }
  function paint(x) {
    const c = x.c
    el.querySelector('.tv-why').textContent = x.why || ''
    el.querySelector('.tv-title').textContent = title(c)
    el.querySelector('.tv-name').textContent = tName(c)
    el.querySelector('.tv-trad').textContent = tradL(c)
    el.querySelector('.tv-heart').classList.toggle('on', d.isRes(c.id))
  }
  function loop(s) {
    clearInterval(tick)
    tick = setInterval(() => {
      if (scr !== s || !on) return clearInterval(tick)
      try { s.track() } catch {}
      const bar = el.querySelector('.tv-prog i'); if (bar) bar.style.transform = `scaleX(${(s.progress?.() || 0).toFixed(4)})`
      const left = s.end() - s.t()
      if (!nextShown && s.started && left > 0 && left <= NEXT_UP_SEC && Q[i + 1]) { nextShown = true; upNext() }
      if (s.done?.()) { clearInterval(tick); s.reachedEnd = true; go(i + 1) }
    }, 250)
  }
  function upNext() {
    const x = Q[i + 1]; if (!x) return
    const b = el.querySelector('.tv-next')
    b.innerHTML = `<span class="tv-nth" style="background-image:url(${d.thumb(x.c.id)})"></span><span class="tv-ntx"><span class="eyebrow">Up next</span><b>${esc(tName(x.c))}</b><small>${esc(title(x.c))}</small></span>`
    b.classList.add('on'); el.querySelector('.tv').classList.add('nextup')
  }
  function note(m) { const b = el?.querySelector('.tv-note'); if (!b) return; b.textContent = m; b.classList.add('on'); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('on'), 2400) }
  function wake() {
    document.body.classList.remove('tv-idle'); clearTimeout(idleT)
    idleT = setTimeout(() => { if (on && !paused && el.querySelector('.tv-topics').hidden) document.body.classList.add('tv-idle') }, IDLE_MS)
  }
  function toggle() { if (!scr) return; scr.toggle(); paused = !scr.wantPlay || !scr.playing?.(); setTimeout(() => { paused = !(scr?.playing?.()); note(paused ? 'Paused' : 'Playing'); wake() }, 300) }
  function heart() {
    const c = Q[i]?.c; if (!c) return
    d.resonate(c.id, scr)
    const h = el.querySelector('.tv-heart'); h.classList.toggle('on', d.isRes(c.id)); h.classList.remove('bloom'); void h.offsetWidth; if (d.isRes(c.id)) h.classList.add('bloom')
    note(d.isRes(c.id) ? 'Resonates. Saved.' : 'Removed.')
  }
  function next(skip) {
    const s = scr, c = Q[i]?.c
    if (s && c && skip !== false) { try { s.track() } catch {} if (!(s.enough?.() || (s.watched || 0) >= GATE_SEC)) d.skipSignal(c, Math.round(s.watched || 0)) }
    go(i + 1)
  }
  // ---------- topics overlay (D-pad navigable) ----------
  function topics() {
    const box = el.querySelector('.tv-topics')
    if (!box.hidden) { box.hidden = true; return }
    const L = d.topics()
    box.innerHTML = `<div class="tv-tin"><p class="eyebrow">Choose a topic</p><div class="tv-tgrid">
      <button type="button" class="wchip tp" data-tvt="">For you</button>${L.map((t) => `<button type="button" class="wchip" data-tvt="${esc(t.id)}">${esc(t.label)}</button>`).join('')}</div>
      <p class="muted small">Arrows to move \u00b7 OK to play \u00b7 T or Esc to close</p></div>`
    box.hidden = false; document.body.classList.remove('tv-idle')
    box.querySelectorAll('[data-tvt]').forEach((b) => (b.onclick = () => { box.hidden = true; const t = b.dataset.tvt; start(el, t ? { kind: 'topic', id: t, fs: false } : { kind: 'foryou', fs: false }) }))
    ;(box.querySelector(src.kind === 'topic' ? `[data-tvt="${CSS.escape ? CSS.escape(src.id) : src.id}"]` : '[data-tvt=""]') || box.querySelector('[data-tvt]'))?.focus()
  }
  function moveFocus(k) {
    const box = el.querySelector('.tv-topics'), B = [...box.querySelectorAll('[data-tvt]')], cur = document.activeElement, idx = B.indexOf(cur)
    if (idx < 0) return B[0]?.focus()
    const r0 = cur.getBoundingClientRect(), cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2
    let best = null, bd = Infinity
    for (const b of B) {
      if (b === cur) continue
      const r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, dx = x - cx, dy = y - cy
      const okDir = k === 'ArrowRight' ? dx > 4 && Math.abs(dy) < r0.height : k === 'ArrowLeft' ? dx < -4 && Math.abs(dy) < r0.height : k === 'ArrowDown' ? dy > 4 : dy < -4
      if (!okDir) continue
      const dist = Math.abs(dx) + 2 * Math.abs(dy) * (k === 'ArrowLeft' || k === 'ArrowRight' ? 3 : 0.5)
      if (dist < bd) { bd = dist; best = b }
    }
    if (!best && (k === 'ArrowRight' || k === 'ArrowLeft')) best = B[idx + (k === 'ArrowRight' ? 1 : -1)]
    best?.focus()
  }
  function key(e) {
    if (!on) return false
    const k = e.key
    wake()
    const box = el.querySelector('.tv-topics')
    if (!box.hidden) {
      if (k === 'Escape' || k === 't' || k === 'T' || k === 'Backspace' || k === 'GoBack') { box.hidden = true; return true }
      if (k.startsWith('Arrow')) { moveFocus(k); return true }
      if (k === 'Enter' || k === ' ') { document.activeElement?.click?.(); return true }
      return false
    }
    if (k === 'Escape' || k === 'Backspace' || k === 'GoBack' || k === 'BrowserBack') { d.exit(); return true }
    if (k === 'Enter' || k === 'h' || k === 'H' || k === 'MediaPlay' && false) { heart(); return true }
    if (k === ' ' || k === 'MediaPlayPause' || k === 'k' || k === 'K') { toggle(); return true }
    if (k === 'ArrowRight' || k === 'n' || k === 'N' || k === 'MediaTrackNext') { next(); return true }
    if (k === 'ArrowLeft' || k === 'p' || k === 'P' || k === 'MediaTrackPrevious') { go(i - 1); return true }
    if (k === 'ArrowUp') { const c = Q[i]?.c; if (c) { d.more(c); note(`More like this: ${tName(c)}, ${tradL(c) || 'this tradition'}`) } return true }
    if (k === 'ArrowDown') { const c = Q[i]?.c; if (c) { d.less(c); note('Less like this. Moving on.'); Q = Q.slice(0, i + 1).concat(Q.slice(i + 1).filter((x) => spk(x.c) !== spk(c))); setTimeout(() => go(i + 1, false), 700) } return true }
    if (k === 't' || k === 'T') { topics(); return true }
    return false
  }
  return { start, stop, key, active: () => on, current: () => Q[i] || null, queue: () => Q, index: () => i }
}
