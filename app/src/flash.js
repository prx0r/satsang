// Topic flash: Satsang's main loop (specs/LOOP.md). A topic's name fills the screen, two or three teachers from different
// schools speak to it one after another, a calm "Which resonated?" (no countdown, "None of these"), then a bridge card
// to a related topic. Every pick feeds the pairwise model (a pick among 3 = two pairwise wins, context flash:<topic>).
// Dark design only: reuses .slide/.theatre/.screen/.ballot/.pick and the hero collage; the few new rules (fl-*) use the
// existing tokens. Desktop never gets a vertical clip (servable); phones prefer vertical per slot.

const NAME_MS = 1300, TITLE_MS = 2600, BRIDGE_MS = 3200, GATE_SEC = 60
const COLD = ['rebirth', 'meditation', 'self', 'death', 'awakening', 'kamma']

export function createFlash(d) {
  // d: { esc, LS, ranker, taste(), wise(), thumb, ytId, makeScreen(clip, hostId, onFail), setLive(s), toast, topics(): ids, label(t),
  //      recordPick({topic, shown, winner, lowWatch}), recordNone({topic, shown}), logEvent(kind, data), skipSignal(clip, sec),
  //      preferVertical(), coarse(), share(clip), save(clip) -> bool, isSaved(id), practiceOf(topic), openPair(), chrome(), toTopics() }
  const { esc } = d
  let el = null, host = null, F = null, S = { n: 0, topics: [], teachers: {}, started: false }, timers = [], tickT = null, lock = null
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t }
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; clearInterval(tickT); tickT = null }
  const W = () => d.wise()
  const P = (id) => W().person?.(id) || null
  const T = (id) => W().tradition?.(id) || null
  const tName = (c) => P(c.speaker)?.short || P(c.speaker)?.n || c.teacher || c.comic || ''
  const tradLabel = (c) => T(d.ranker.schoolOf(c))?.label || T(c.tradition)?.label || ''
  const famLabel = (c) => T(d.ranker.famOfClip(c))?.label || ''
  const title = (c) => c.segTitle || c.title || ''
  const stage = (s) => { if (host) host.dataset.stage = s; document.body.classList.toggle('in-theatre', s === 'left'); d.chrome?.() }

  function mount(container) { el = container; if (!el.querySelector('.flwrap')) el.innerHTML = '<div class="flwrap"><div class="slide fl" data-stage="idle"></div></div>'; host = el.querySelector('.slide.fl') }
  function active() { return !!el && !el.closest('section.view')?.hidden }
  function inTalk() { return active() && host?.dataset.stage === 'left' }

  // ---------- choosing ----------
  function pickTopic(from) {
    const all = d.topics(), pub = d.ranker.published(all).map((x) => x.id)
    if (!pub.length) return null
    if (!from && !S.topics.length) { const it = d.intentTopic?.(pub); if (it) return it; const c = COLD.find((t) => pub.includes(t)); if (c) return c }
    const nx = d.ranker.nextTopics(from || S.topics[S.topics.length - 1] || null, d.taste(), S.topics.slice(-12), all, 6)
    return nx[0]?.id || pub.find((t) => !S.topics.includes(t)) || pub[0]
  }
  function compose(topic, deeper) {
    const exclude = new Set(Object.keys(d.LS.get('unplayable', {}) || {}))
    const avoid = deeper && F?.topic === topic ? new Set(F.clips.map((c) => d.ranker.schoolOf(c))) : null
    let f = d.ranker.composeFlash(topic, { taste: d.taste(), seenTeachers: S.teachers, deeper: !!deeper, preferVertical: d.preferVertical(), exclude, avoidSchools: avoid })
    if (!f && avoid) f = d.ranker.composeFlash(topic, { taste: d.taste(), seenTeachers: S.teachers, deeper: true, preferVertical: d.preferVertical(), exclude })
    if (!f) f = d.ranker.composeFlash(topic, { taste: d.taste(), seenTeachers: {}, deeper: true, preferVertical: d.preferVertical(), exclude })
    return f
  }

  // ---------- one flash ----------
  function start(topic, opts = {}) {
    if (!host) return
    teardown()
    lock = opts.lock || null
    let t = topic || pickTopic(null), f = t && compose(t, opts.deeper), guard = 0
    while (!f && guard++ < 6) { S.topics.push(t); t = pickTopic(t); f = t && compose(t) }
    if (!f) { host.innerHTML = `<div class="endcard"><div class="ec"><p class="ec-k">Topic flash</p><h2 class="ec-h">Talks are still arriving.</h2><p class="ec-a"><a class="hbtn" href="#topics">Choose a topic</a></p></div></div>`; stage('idle'); return }
    F = { ...f, label: d.label(t), question: d.ranker.question(t), idx: -1, screens: [], watched: [], via: opts.via || null }
    S.topics.push(t); S.n++
    for (const c of F.clips) S.teachers[c.speaker || c.comic] = (S.teachers[c.speaker || c.comic] || 0) + 1
    d.logEvent('flash_shown', { topic: t, clips: F.clips.map((c) => c.id), slots: F.slots, via: F.via })
    paintTitle()
  }
  function teardown() { clearTimers(); d.setLive(null); for (const s of F?.screens || []) { try { s?.retire() } catch {} } if (F) F.screens = []; document.body.classList.remove('in-theatre') }

  function collage(clips) {
    const imgs = clips.map((c) => P(c.speaker)?.img).filter(Boolean).slice(0, 3)
    return imgs.length ? `<div class="wcollage fl-faces n${imgs.length}" aria-hidden="true">${imgs.map((im) => `<img src="${esc(im.src)}" alt="" decoding="async">`).join('')}</div>` : ''
  }
  function paintTitle() {
    const trads = F.clips.map(tradLabel).filter(Boolean)
    const first = !S.started
    host.innerHTML = `<section class="fl-card fl-title" tabindex="-1">${collage(F.clips)}
      <div class="fl-in"><h1 class="fl-topic">${esc(F.label)}</h1><span class="fl-hair" aria-hidden="true"></span>
      ${F.question ? `<p class="fl-q">${esc(F.question)}</p>` : ''}
      <p class="marquee fl-trads">${trads.map(esc).join(' <span aria-hidden="true">\u00b7</span> ')}</p>
      <p class="fl-who">${F.clips.map((c) => `<span>${W().face?.(c.speaker, 'sm') || ''}<b>${esc(tName(c))}</b></span>`).join('')}</p>
      <div class="fl-acts">${first ? `<button type="button" class="btn gold" data-begin="1">Begin \u25b8</button>` : `<button type="button" class="linkbtn fl-skip" data-begin="1">Begin now</button>`}
        <a class="linkbtn" href="#topic/${esc(F.topic)}">About this topic</a><button type="button" class="linkbtn" data-pair="1">Two talks</button><a class="linkbtn" href="#tv">TV mode</a></div>
      ${first ? `<p class="muted small fl-tip">${d.coarse() ? 'Tap to begin. Swipe up for the next teacher.' : 'Space to pause \u00b7 N next teacher \u00b7 1 2 3 to choose \u00b7 T topics'}</p>` : ''}</div></section>`
    stage('title')
    host.querySelector('[data-begin]')?.addEventListener('click', (e) => { e.stopPropagation(); begin() })
    host.querySelector('[data-pair]')?.addEventListener('click', (e) => { e.stopPropagation(); d.openPair() })
    host.querySelector('.fl-title').addEventListener('click', (e) => { if (!e.target.closest('a,button')) begin() })
    // warm the first player behind the card
    mountScreen(0)
    if (!first) later(begin, TITLE_MS)
  }
  function begin() { if (!F || F.idx >= 0) return; S.started = true; clearTimers(); next() }

  function mountScreen(i) {
    if (!F || F.screens[i]) return F?.screens[i]
    const c = F.clips[i]; if (!c) return null
    let th = host.querySelector('.theatre')
    if (!th) { host.insertAdjacentHTML('beforeend', '<div class="theatre fl-th"></div>'); th = host.querySelector('.theatre') }
    const id = 'fl' + S.n + '_' + i, vert = c.format === 'vertical'
    th.insertAdjacentHTML('beforeend', `<div class="screen small${vert ? ' vert' : ''}" data-i="${i}"><div class="frame"><div class="yt" id="${id}"></div><div class="shield" aria-hidden="true"></div>
      <div class="label"><div class="meta"><h3>${esc(tName(c))} <small class="fl-lt">${esc(tradLabel(c))}</small></h3><p>${esc(title(c))}${c.talk ? ' \u00b7 from ' + esc(c.talk) : ''}</p></div></div>
      <div class="prog" aria-hidden="true"><span class="ptrack"><i></i></span></div>
      <button type="button" class="vres${d.isSaved(c.id) ? ' on' : ''}" data-res="${esc(c.id)}" aria-label="This resonates (H)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/></svg><span>This resonates</span></button></div>
      <div class="fl-under"><span class="eyebrow">${esc(F.label)} · ${i + 1} of ${F.clips.length}</span><h3>${esc(tName(c))}</h3><p class="fl-lt2">${esc(tradLabel(c))}</p><p class="muted">${esc(title(c))}</p></div>
      <button type="button" class="hbtn fl-nextb" data-next="1">${i + 1 < F.clips.length ? 'Next teacher \u203a' : 'Which resonated? \u203a'}</button></div>`)
    const scr = th.lastElementChild
    scr.querySelector('.shield').addEventListener('click', () => F?.screens[i]?.toggle())
    scr.querySelector('[data-next]').addEventListener('click', (e) => { e.stopPropagation(); nextTeacher() })
    scr.querySelector('.vres').addEventListener('click', (e) => { e.stopPropagation(); d.resonate(c.id, F.screens[i]); scr.querySelector('.vres').classList.toggle('on', d.isSaved(c.id)) })
    bindSwipe(scr)
    const s = d.makeScreen(c, id, () => onFail(i))
    F.screens[i] = s; s.mount()
    return s
  }
  function onFail(i) { // an unplayable talk: drop it quietly; the flash continues with the others (never a broken player, never YouTube)
    if (!F) return
    const was = F.idx === i
    F.clips.splice(i, 1); F.slots.splice(i, 1); const s = F.screens.splice(i, 1)[0]; try { s?.retire() } catch {}
    host.querySelector(`.theatre .screen[data-i="${i}"]`)?.remove()
    host.querySelectorAll('.theatre .screen').forEach((x, k) => (x.dataset.i = k))
    if (F.clips.length < 2) { const t = F.topic; F = null; start(pickTopic(t)); return }
    if (was) { F.idx = i - 1; next() }
  }
  function next() { // name card, then the talk
    if (!F) return
    clearTimers()
    const prev = F.screens[F.idx]; if (prev) { try { prev.track(); prev.fadePause() } catch {} }
    F.idx++
    if (F.idx >= F.clips.length) return ballot()
    const c = F.clips[F.idx]
    let nc = host.querySelector('.fl-name')
    if (!nc) { host.insertAdjacentHTML('beforeend', '<section class="fl-card fl-name" aria-live="polite"></section>'); nc = host.querySelector('.fl-name') }
    nc.innerHTML = `<div class="fl-in">${W().face?.(c.speaker, 'big') || ''}<h2 class="fl-nm">${esc(tName(c))}</h2><p class="eyebrow">${esc(tradLabel(c))}${famLabel(c) && famLabel(c) !== tradLabel(c) ? ' \u00b7 ' + esc(famLabel(c)) : ''}</p><p class="fl-q fl-tt">${esc(title(c))}</p></div>`
    stage('name')
    mountScreen(F.idx); if (F.idx + 1 < F.clips.length) later(() => mountScreen(F.idx + 1), 4000)
    later(play, NAME_MS)
  }
  function play() {
    if (!F) return
    const i = F.idx, s = F.screens[i] || mountScreen(i)
    if (!s) return next()
    host.querySelectorAll('.theatre .screen').forEach((x) => { const on = Number(x.dataset.i) === i; x.classList.toggle('big', on); x.classList.toggle('small', !on) })
    stage('left'); d.setLive(s); s.play()
    clearInterval(tickT)
    tickT = setInterval(() => {
      if (!F || F.screens[i] !== s) return clearInterval(tickT)
      try { s.track() } catch {}
      const bar = host.querySelector(`.theatre .screen[data-i="${i}"] .ptrack i`); if (bar) bar.style.transform = `scaleX(${(s.progress?.() || 0).toFixed(4)})`
      if (s.done?.()) { clearInterval(tickT); if (F.back) { F.back = false; ballot() } else next() }
    }, 250)
  }
  function nextTeacher() {
    if (!F || host.dataset.stage !== 'left') return
    const s = F.screens[F.idx]; if (!s) return next()
    try { s.track() } catch {}
    if (!(s.enough?.() || (s.watched || 0) >= GATE_SEC)) d.skipSignal(F.clips[F.idx], Math.round(s.watched || 0)) // the light "didn't land" signal before the gate
    if (F.back) { F.back = false; try { s.fadePause() } catch {} return ballot() }
    next()
  }
  function skipFlash() { if (!F) return; for (const s of F.screens) { try { s?.track(); s?.fadePause() } catch {} } d.logEvent('flash_pick', { topic: F.topic, none: true, skipped: true }); bridge(null) }

  // ---------- "Which resonated?" ----------
  function ballot() {
    clearTimers(); d.setLive(null)
    for (const s of F.screens) { try { s?.track(); s?.fadePause() } catch {} }
    let b = host.querySelector('.ballot')
    if (!b) { host.insertAdjacentHTML('beforeend', '<div class="ballot fl-ballot"></div>'); b = host.querySelector('.ballot') }
    const n = F.clips.length
    b.innerHTML = `<p class="eyebrow fl-bk">${esc(F.label)}</p><p class="bq">Which resonated?</p>
      <div class="picks fl-picks n${n}">${F.clips.map((c, i) => `<button class="pick" data-i="${i}" aria-label="${esc(tName(c))}: this resonated">
        <span class="pimg${c.format === 'vertical' ? ' vert' : ''}" style="background-image:url(${d.thumb(c.id)})"></span>
        <span class="pname">${esc(tName(c))}<small>${esc(tradLabel(c))} \u00b7 ${esc(title(c))}</small></span>
        <span class="logo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/></svg>Resonates</span></button>`).join('')}</div>
      <div class="fl-quiet"><button type="button" class="linkbtn" data-none="1">None of these</button>${F.clips.map((c, i) => `<button type="button" class="linkbtn" data-again="${i}">Listen to #${i + 1} again</button>`).join('')}</div>
      <p class="hint muted small">Take your time${d.coarse() ? '' : '<span class="kb"> \u00b7 ' + F.clips.map((_, i) => i + 1).join(' / ') + ' \u00b7 0 none</span>'}</p>
      <div class="fl-after" aria-live="polite"></div>`
    stage('vote')
    b.querySelectorAll('.pick').forEach((p) => p.addEventListener('click', () => pick(Number(p.dataset.i))))
    b.querySelector('[data-none]').addEventListener('click', () => none())
    b.querySelectorAll('[data-again]').forEach((x) => x.addEventListener('click', () => again(Number(x.dataset.again))))
  }
  function again(i) {
    if (!F || host.dataset.stage !== 'vote') return
    const s = F.screens[i]; if (!s) return
    s.ended = false; if (s.t() >= s.end() - 1) s.seek(s.start, false)
    F.idx = i; F.back = true; play()
  }
  function lowWatchOf() { return F.screens.some((s) => !s || !(s.enough?.() || (s.watched || 0) >= GATE_SEC)) }
  function pick(i) {
    if (!F || host.dataset.stage !== 'vote') return
    const w = F.clips[i]
    host.querySelector(`.fl-picks .pick[data-i="${i}"]`)?.classList.add('won')
    stage('done')
    d.recordPick({ topic: F.topic, shown: F.clips, winner: w, lowWatch: lowWatchOf() })
    d.logEvent('flash_pick', { topic: F.topic, winner: w.id, slot: F.slots[i], shown: F.clips.map((c) => c.id) })
    const a = host.querySelector('.fl-after')
    if (a) {
      a.innerHTML = `<p class="fl-res">Resonated: <b>${esc(title(w))}</b> <span class="muted">\u00b7 ${esc(tName(w))}</span></p>
        <p class="fl-acts"><button type="button" class="hbtn" data-save="1">${d.isSaved(w.id) ? 'Saved' : 'Save'}</button><button type="button" class="hbtn send" data-send="1">Send to a friend</button><button type="button" class="hbtn" data-go="1">Continue \u203a</button></p>`
      a.querySelector('[data-save]').onclick = (e) => { const on = d.save(w); e.target.textContent = on ? 'Saved' : 'Save'; hold() }
      a.querySelector('[data-send]').onclick = () => { hold(); d.share(w, F.clips) }
      a.querySelector('[data-go]').onclick = () => bridge(w)
    }
    const hold = () => { clearTimers() }
    later(() => bridge(w), 4200)
  }
  function none() {
    if (!F || host.dataset.stage !== 'vote') return
    stage('done')
    d.recordNone({ topic: F.topic, shown: F.clips })
    d.logEvent('flash_pick', { topic: F.topic, none: true, shown: F.clips.map((c) => c.id) })
    bridge(null)
  }

  // ---------- the bridge ----------
  function bridge(winner) {
    clearTimers()
    if (lock && lock.remaining > 1) { lock.remaining--; const t = F.topic; teardownLater(); return start(t, { deeper: true, lock, via: 'locked' }) }
    lock = null
    const from = F.topic, fromL = F.label
    const nx = d.ranker.nextTopics(from, d.taste(), S.topics.slice(-12), d.topics(), 4)
    const to = nx[0]
    if (!to) { teardownLater(); host.innerHTML = `<div class="endcard"><div class="ec"><p class="ec-k">Topic flash</p><h2 class="ec-h">You have walked every topic.</h2><p class="ec-a"><a class="hbtn" href="#topics">Choose a topic</a></p></div></div>`; stage('idle'); return }
    const fams = Object.keys(to.fams || {}).sort((a, b) => to.fams[b] - to.fams[a]).map((f) => T(f)?.label).filter(Boolean).slice(0, 2)
    const reason = to.why === 'intent' ? `On your mind: ${to.label}` : to.why === 'infoGain' && fams.length > 1 ? `Something different: ${fams[0]} and ${fams[1]} voices on ${to.label}` : to.why === 'fit' ? `Close to what resonates with you: ${to.label}` : `${fromL} leads to ${to.label}: ${hookOf(to.id)}`
    const rest = S.n > 0 && S.n % 4 === 0
    const pr = rest ? d.practiceOf(from) : null
    teardownLater()
    let bc = host.querySelector('.fl-bridge')
    if (!bc) { host.insertAdjacentHTML('beforeend', '<section class="fl-card fl-bridge"></section>'); bc = host.querySelector('.fl-bridge') }
    bc.innerHTML = `<div class="fl-in"><p class="fl-from">${esc(fromL)}</p><span class="fl-thread" aria-hidden="true"></span><h2 class="fl-topic fl-to">${esc(to.label)}</h2>
      <p class="fl-q">${esc(reason)}</p>
      ${rest ? `<p class="fl-rest">That was four topics. Rest here, or keep going.${pr ? `<br><a href="${esc(pr.href)}">${esc(pr.label)}</a>` : ''}</p>` : ''}
      <div class="fl-acts"><button type="button" class="btn gold" data-to="1">${rest ? 'Keep going' : 'Next topic \u25b8'}</button><button type="button" class="hbtn" data-deeper="1">Go deeper here</button><button type="button" class="hbtn" data-topics="1">Choose a topic</button></div></div>`
    stage('bridge')
    d.logEvent('bridge', { from, to: to.id, reason: to.why })
    const go = (act) => { clearTimers(); d.logEvent('bridge', { from, to: to.id, reason: to.why, action: act }); if (act === 'deeper') start(from, { deeper: true, via: 'deeper' }); else if (act === 'topics') d.toTopics(); else start(to.id, { via: 'bridge' }) }
    bc.querySelector('[data-to]').onclick = () => go('next')
    bc.querySelector('[data-deeper]').onclick = () => go('deeper')
    bc.querySelector('[data-topics]').onclick = () => go('topics')
    bc.addEventListener('pointerenter', () => clearTimers(), { once: true })
    if (!rest) later(() => go('auto'), BRIDGE_MS)
  }
  const hookOf = (t) => d.hook(t) || 'another angle on the same question'
  function teardownLater() { const old = F?.screens || []; if (F) F.screens = []; d.setLive(null); setTimeout(() => old.forEach((s) => { try { s?.retire() } catch {} }), 50); host.querySelector('.theatre')?.remove() }

  // ---------- gestures + keys ----------
  function bindSwipe(scr) {
    let x0 = 0, y0 = 0, t0 = 0, lp = null
    scr.addEventListener('touchstart', (e) => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); clearTimeout(lp); lp = setTimeout(() => { const c = F?.clips[F.idx]; if (c) { d.save(c); d.toast('Saved.') } }, 650) }, { passive: true })
    scr.addEventListener('touchmove', () => clearTimeout(lp), { passive: true })
    scr.addEventListener('touchend', (e) => {
      clearTimeout(lp); const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0
      if (Date.now() - t0 > 900) return
      if (dy < -70 && Math.abs(dy) > Math.abs(dx)) nextTeacher()
      else if (dx < -80 && Math.abs(dx) > Math.abs(dy)) skipFlash()
    }, { passive: true })
  }
  function key(e) {
    if (!active() || !F) return false
    const st = host.dataset.stage, k = e.key
    if (st === 'title' && (k === ' ' || k === 'Enter')) { begin(); return true }
    if (st === 'left') {
      if (k === ' ') { F.screens[F.idx]?.toggle(); return true }
      if (k === 'n' || k === 'N' || k === 'ArrowRight' || k === 'ArrowUp') { nextTeacher(); return true }
      if (k === 'ArrowLeft') { skipFlash(); return true }
      if (k === 'h' || k === 'H') { const c = F.clips[F.idx]; d.resonate(c.id, F.screens[F.idx]); return true }
    }
    if (st === 'vote') {
      if (/^[1-3]$/.test(k) && Number(k) <= F.clips.length) { pick(Number(k) - 1); return true }
      if (k === '0') { none(); return true }
      if (k === 'l' || k === 'L') { again(F.clips.length - 1); return true }
    }
    if (st === 'bridge' && (k === 'd' || k === 'D')) { host.querySelector('[data-deeper]')?.click(); return true }
    if (st === 'bridge' && (k === 'Enter' || k === ' ')) { host.querySelector('[data-to]')?.click(); return true }
    if (k === 't' || k === 'T') { d.toTopics(); return true }
    return false
  }
  function pause() { clearTimers(); for (const s of F?.screens || []) { try { s?.pause() } catch {} } d.setLive(null); document.body.classList.remove('in-theatre') }
  function resume() { if (!F) return start(); const st = host.dataset.stage; if (st === 'left') play(); else if (st === 'title' && S.started) later(begin, TITLE_MS); else if (st === 'bridge') host.querySelector('[data-to]') && later(() => host.querySelector('[data-to]')?.click(), BRIDGE_MS); else if (st === 'idle') start() }
  function playTopic(t, n = 3) { lock = { topic: t, remaining: n }; start(t, { lock, via: 'hub' }) }

  return { mount, start, pause, resume, key, active, inTalk, playTopic, current: () => F, session: () => S }
}
