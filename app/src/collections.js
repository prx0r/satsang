// Collections and practices (specs/DATA-MODEL.md §2.4, ROADMAP 9 + 12): #collections, #collection/<id> (set, journey with
// day steps, meditation series, visualisation cycle, syllabus with theory/practice tracks) and #practice/<id> (steps,
// cautions above step 1, needsTeacher gate, source link, related talks, the dark timer, log to the device). Data:
// data/wisegraph/collections.json (tools/build-collections.py). Dark design: whero/wsec/pprog/pprg/rail/tile/wchip only.

const KIND = { set: 'Set', journey: 'Journey', 'meditation-series': 'Meditation series', 'visualisation-cycle': 'Visualisation cycle', syllabus: 'Syllabus', 'mini-course': 'Course' }
const ROLE = { watch: 'Watch', read: 'Read', practise: 'Practise', listen: 'Listen', visit: 'Visit', reflect: 'Reflect' }

export function createCollections(d) {
  // d: { esc, byId(id), servable(c), clipTile, fmtDur, thumb, profile, label(t), wise(), toast, playList(clips) }
  const { esc } = d
  let D = null, DP = null
  // course tree (tools/build-courses.py): tradition > school > course > phase > practice, loaded beside collections; read by
  // the practice page's "where this sits" line and offered to the #courses UI as courseTree()
  let CT = null, CTP = null
  const loadCourses = () => (CTP ||= fetch('data/wisegraph/courses.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((j) => (CT = j)).catch(() => (CT = null)))
  const courseTree = () => CT
  const load = () => (loadCourses(), DP ||= fetch('data/wisegraph/collections.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((j) => (D = j || { practices: {}, collections: [] })).catch(() => (D = { practices: {}, collections: [] })))
  const ready = () => !!D
  const practice = (id) => D?.practices?.[id] || null
  const all = () => D?.collections || []
  const clipOf = (it) => { if (!it.ref?.startsWith('clip:')) return null; for (const id of [it.ref.slice(5), ...(it.alts || [])]) { const c = d.byId(id); if (c && d.servable(c)) return c } return null }

  function paintList(el) {
    const P = Object.values(D.practices || {}), byT = {}
    for (const p of P) { const k = p.tradLabel || 'Other'; (byT[k] ||= []).push(p) }
    el.innerHTML = `<a class="back" href="#topics">\u2190 Topics</a><div class="head"><h2>Journeys and practices</h2></div>
      <p class="muted lede">Short collections built from the talks: a week with one question, a first syllabus in a tradition, a series of sits. Each practice links to its source; some are orientation only.</p>
      <section class="wsec"><div class="wsech"><h3>Collections</h3><span class="muted small">${all().length}</span></div><div class="pprog">${all().map(colCard).join('')}</div></section>
      <section class="wsec"><div class="wsech"><h3>Practices</h3><span class="muted small">${P.length}</span></div>
        <div class="pprog">${P.filter((p) => !p.needsTeacher).slice(0, 60).map(pracCard).join('')}</div>
        ${P.some((p) => p.needsTeacher) ? `<p class="muted small" style="margin-top:14px">Orientation only (learned from a teacher)</p><div class="wtopics">${P.filter((p) => p.needsTeacher).map((p) => `<a class="wchip" href="#practice/${esc(p.id)}">${esc(p.name)}</a>`).join('')}</div>` : ''}</section>`
  }
  const colCard = (c) => { const j = d.profile.journey(c.id), n = c.units.length || c.items.length
    return `<article class="pprg"><span>${esc(KIND[c.kind] || 'Collection')}${c.units.length ? ` \u00b7 ${c.units.length} ${c.kind === 'journey' ? 'days' : 'steps'}` : ` \u00b7 ${n} items`}${c.orientationOnly ? ' \u00b7 orientation only' : ''}</span><b>${esc(c.title)}</b><p>${esc(c.intro)}</p>${j ? `<em>${j.done.length} of ${n} done</em>` : ''}<a class="btn" href="#collection/${esc(c.id)}">${j ? 'Resume' : 'Open'}</a></article>` }
  const pracCard = (p) => `<article class="pprg"><span>${esc(p.tradLabel || 'Practice')}${p.minutes ? ` \u00b7 ${p.minutes} min` : ''}</span><b>${esc(p.name)}</b><p>${esc(String(p.how || '').slice(0, 180))}${String(p.how || '').length > 180 ? '\u2026' : ''}</p><a class="btn" href="#practice/${esc(p.id)}">${p.needsTeacher ? 'Read about it' : 'Practise'}</a></article>`

  function itemHTML(it, colId, unit) {
    if (it.role === 'watch') { const c = clipOf(it); return c ? `<div class="fl-item"><span class="eyebrow">${it.group ? esc(it.group) + ' \u00b7 ' : ''}Watch</span><div class="rail fl-one">${d.clipTile(c, null, d.fmtDur(c))}</div></div>` : '' }
    if (it.role === 'practise') { const p = practice(it.ref?.slice(9)); return p ? `<article class="pprg"><span>${it.group ? esc(it.group) + ' \u00b7 ' : ''}Practise${p.minutes ? ' \u00b7 ' + p.minutes + ' min' : ''}</span><b>${esc(p.name)}</b><p>${esc(String(p.how || '').slice(0, 220))}</p><a class="btn" href="#practice/${esc(p.id)}${colId ? `?from=${esc(colId)}&unit=${unit || ''}` : ''}">${p.needsTeacher ? 'Read about it' : 'Begin the sit'}</a></article>` : '' }
    if (it.role === 'read') return `<article class="pprg"><span>${it.group ? esc(it.group) + ' \u00b7 ' : ''}Read</span><b>${esc(it.ref?.startsWith('topic:') ? 'On the ' + (d.label(it.ref.slice(6)) || '') + ' page' : 'Reading')}</b>${it.note ? `<p>${esc(it.note)}</p>` : ''}${it.ref?.startsWith('topic:') ? `<a class="btn" href="#topic/${esc(it.ref.slice(6))}">Open</a>` : ''}</article>`
    if (it.role === 'reflect') return `<article class="pprg"><span>Reflect</span><p class="fl-reflect">${esc(it.note || '')}</p></article>`
    return ''
  }
  function paintCollection(el, id) {
    const c = all().find((x) => x.id === id)
    if (!c) { el.innerHTML = `<a class="back" href="#collections">\u2190 Journeys and practices</a><div class="wempty"><h2>Collection not found</h2></div>`; return }
    const j = d.profile.journey(c.id), done = new Set(j?.done || []), staged = c.units.length > 0
    const next = staged ? c.units.find((u) => !done.has(u.n)) : null
    const saved = d.profile.has('collection:' + c.id)
    const watch = [...c.units.flatMap((u) => u.items), ...c.items].map(clipOf).filter(Boolean)
    const tracks = c.kind === 'syllabus' ? [['theory', 'Theory'], ['practice', 'Practice'], ['both', 'Theory and practice']] : null
    const unitHTML = (u) => `<section class="wsec fl-unit${done.has(u.n) ? ' done' : ''}${next && next.n === u.n ? ' next' : ''}" id="u${u.n}"><div class="wsech"><h3>${c.kind === 'journey' ? `Day ${u.day || u.n}: ` : `${u.n}. `}${esc(u.title)}</h3><span class="muted small">${u.track ? esc(u.track === 'both' ? 'Theory and practice' : u.track[0].toUpperCase() + u.track.slice(1)) + ' \u00b7 ' : ''}${done.has(u.n) ? 'Done' : next && next.n === u.n ? 'Next' : ''}</span></div>
      ${u.intro ? `<p class="muted">${esc(u.intro)}</p>` : ''}<div class="pprog fl-items">${u.items.map((it) => itemHTML(it, c.id, u.n)).join('')}</div>
      <p class="fl-acts" style="justify-content:flex-start"><button type="button" class="hbtn" data-done="${u.n}">${done.has(u.n) ? 'Mark as not done' : 'Mark as done'}</button></p></section>`
    el.innerHTML = `<a class="back" href="#collections">\u2190 Journeys and practices</a>
      <section class="whero wtopic"><div class="whin"><span class="eyebrow">${esc(KIND[c.kind] || 'Collection')}${c.orientationOnly ? ' \u00b7 Orientation only' : ''}</span><h1>${esc(c.title)}</h1>
        <p class="tag">${esc(c.intro)}</p>
        <div class="stats">${[[staged ? c.units.length : c.items.length, c.kind === 'journey' ? 'Days' : staged ? 'Steps' : 'Items'], [watch.length, 'Talks'], [[...c.units.flatMap((u) => u.items), ...c.items].filter((i) => i.role === 'practise').length, 'Practices'], staged && j ? [done.size, 'Done'] : null].filter((x) => x && x[0]).map(([v, l]) => `<div><b>${v}</b><span>${esc(l)}</span></div>`).join('')}</div>
        <div class="wcta">${staged ? `<button type="button" class="btn gold" data-start="1">${!j ? (c.kind === 'journey' ? 'Start the journey' : 'Start') : next ? `Resume: ${c.kind === 'journey' ? 'day ' + (next.day || next.n) : 'step ' + next.n}` : 'Finished: look back'}</button>` : ''}${watch.length >= 2 ? `<button type="button" class="btn ghost" data-play="1">Play the talks</button>` : ''}<button type="button" class="btn ghost" data-save="1">${saved ? 'Saved' : 'Save'}</button></div>
        ${c.kind === 'journey' ? '<p class="muted small">One step a day is plenty. Your progress stays on this device and syncs anonymously.</p>' : ''}
      </div></section>
      ${tracks ? `<div class="wchips" style="margin-top:18px">${tracks.filter(([k]) => c.units.some((u) => u.track === k)).map(([k, l]) => `<a class="wchip" href="#collection/${esc(c.id)}" data-track="${k}">${esc(l)}</a>`).join('')}</div>` : ''}
      ${staged ? c.units.map(unitHTML).join('') : `<div class="pprog fl-items" style="margin-top:24px">${c.items.map((it) => itemHTML(it, null)).join('')}</div>`}
      ${j ? `<section class="wsec"><p class="muted small"><button type="button" class="linkbtn" data-leave="1">Leave this ${c.kind === 'journey' ? 'journey' : 'collection'}</button></p></section>` : ''}`
    el.querySelector('[data-start]')?.addEventListener('click', () => { if (!j) d.profile.setJourney(c.id, { unit: 1, done: [] }); const u = next || c.units[0]; paintCollection(el, id); el.querySelector('#u' + u.n)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) })
    el.querySelector('[data-play]')?.addEventListener('click', () => d.playList(watch))
    el.querySelector('[data-save]')?.addEventListener('click', (e) => { const on = d.profile.toggleSave('collection:' + c.id); e.target.textContent = on ? 'Saved' : 'Save' })
    el.querySelector('[data-leave]')?.addEventListener('click', () => { d.profile.setJourney(c.id, null); paintCollection(el, id) })
    el.querySelectorAll('[data-done]').forEach((b) => b.addEventListener('click', () => markUnit(c, Number(b.dataset.done), el)))
    el.querySelectorAll('[data-track]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); const u = c.units.find((x) => x.track === a.dataset.track); el.querySelector('#u' + u?.n)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }))
  }
  function markUnit(c, n, el) {
    const j = d.profile.journey(c.id) || { done: [] }, done = new Set(j.done)
    if (done.has(n)) done.delete(n); else done.add(n)
    const next = c.units.find((u) => !done.has(u.n))
    d.profile.setJourney(c.id, { done: [...done].sort((a, b) => a - b), unit: next ? next.n : c.units.length })
    if (el) paintCollection(el, c.id)
  }

  // ---------- practice page + timer ----------
  function paintPractice(el, id, q = {}) {
    const p = practice(id)
    if (!p) { el.innerHTML = `<a class="back" href="#collections">\u2190 Journeys and practices</a><div class="wempty"><h2>Practice not found</h2></div>`; return }
    const W = d.wise(), from = q.from && all().find((c) => c.id === q.from)
    const talks = (p.topics || []).length ? relatedTalks(p) : []
    const mine = d.profile.practiceLog().filter((x) => x.practice === p.id)
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const withBody = !p.needsTeacher && p.body?.mode === 'body' && webgl2()
    const where = whereHTML(p.id)
    if (!CT) loadCourses().then(() => { const w = whereHTML(p.id); if (w && el.isConnected && !el.querySelector('.fl-where')) el.querySelector('.wcta')?.insertAdjacentHTML('afterend', `<p class="muted small fl-where">${w}</p>`) })
    el.innerHTML = `<a class="back" href="${from ? (from.kind === 'mini-course' ? '#course/' : '#collection/') + esc(from.id) : '#collections'}">\u2190 ${esc(from ? from.title : 'Journeys and practices')}</a>
      <section class="whero wtopic"><div class="whin"><span class="eyebrow">${esc(p.tradLabel || 'Practice')}${p.tradition && W.tradition?.(p.tradition) ? '' : ''}${p.needsTeacher ? ' \u00b7 Orientation only' : ` \u00b7 about ${p.minutes} min`}</span><h1>${esc(p.name)}</h1>
        ${p.cautions?.length ? `<div class="fl-caution">${p.cautions.map((x) => `<p>${esc(x)}</p>`).join('')}</div>` : ''}
        ${p.needsTeacher ? `<p class="tag">${esc(p.how)}</p>` : `<ol class="fl-steps">${p.steps.map((s) => `<li>${esc(s.text)}</li>`).join('')}</ol>`}
        <p class="muted small">${p.sourceLabel ? 'Source: ' + esc(p.sourceLabel) + ' \u00b7 ' : ''}${p.source ? `<a href="${esc(p.source)}" target="_blank" rel="noopener">Open the source \u2197</a>` : ''}</p>
        <div class="wcta">${p.needsTeacher ? '' : withBody ? `<button type="button" class="btn ${reduce ? 'ghost' : 'gold'}" data-body="1">Practise with the body \u00b7 ${p.minutes} min</button><button type="button" class="btn ${reduce ? 'gold' : 'ghost'}" data-timer="1">${reduce ? 'Begin' : 'Timer only'} \u00b7 ${p.minutes} min</button>` : `<button type="button" class="btn gold" data-timer="1">Begin \u00b7 ${p.minutes} min</button>`}${p.needsTeacher ? '' : `<span class="fl-mins">${[5, 10, 20, 30].map((m) => `<button type="button" class="hbtn${m === p.minutes ? ' send' : ''}" data-m="${m}">${m} min</button>`).join('')}</span>`}<button type="button" class="btn ghost" data-save="1">${d.profile.has('practice:' + p.id) ? 'Saved' : 'Save'}</button></div>
        ${withBody ? `<p class="muted small fl-bodynote">${esc(BODY_NOTE[p.body.locus] || BODY_NOTE.none)} Natural breath; it never holds. Hold anywhere to breathe in, or let the microphone follow you.</p>` : ''}
        ${where ? `<p class="muted small fl-where">${where}</p>` : ''}
        ${mine.length ? `<p class="muted small">You have sat with this ${mine.length === 1 ? 'once' : mine.length + ' times'}.</p>` : ''}
      </div></section>
      ${talks.length ? `<section class="wsec"><div class="wsech"><h3>Talks to go with it</h3></div><div class="rail">${talks.map((c) => d.clipTile(c, null, d.fmtDur(c))).join('')}</div></section>` : ''}
      ${(p.topics || []).length ? `<section class="wsec"><div class="wsech"><h3>Topics</h3></div><div class="wtopics">${p.topics.filter((t) => d.label(t)).map((t) => `<a class="wchip tp" href="#topic/${esc(t)}">${esc(d.label(t))}</a>`).join('')}</div></section>` : ''}`
    let mins = p.minutes
    el.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { mins = Number(b.dataset.m); el.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('send', x === b)); const t = el.querySelector('[data-timer]'); if (t) t.textContent = `${withBody && !reduce ? 'Timer only' : 'Begin'} \u00b7 ${mins} min`; const bb = el.querySelector('[data-body]'); if (bb) bb.textContent = `Practise with the body \u00b7 ${mins} min` }))
    const ctx = { journey: from?.id || null, unit: Number(q.unit) || null }
    el.querySelector('[data-timer]')?.addEventListener('click', () => timer(p, mins, ctx))
    el.querySelector('[data-body]')?.addEventListener('click', (e) => withTheBody(p, mins, ctx, e.currentTarget, reduce))
    el.querySelector('[data-save]')?.addEventListener('click', (e) => { const on = d.profile.toggleSave('practice:' + p.id); e.target.textContent = on ? 'Saved' : 'Save' })
  }
  function relatedTalks(p) {
    const L = d.allClips().filter((c) => d.servable(c) && d.inBallot(c) && (c.topics || []).some((t) => p.topics.includes(t.split('/')[0])) && (!p.tradition || (c.traditions || []).includes(p.tradition) || c.tradition === p.tradition))
    return (L.length >= 3 ? L : d.allClips().filter((c) => d.servable(c) && d.inBallot(c) && (c.topics || []).some((t) => p.topics.includes(t.split('/')[0])))).sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0)).slice(0, 12)
  }
  // ---------- "Practise with the body": the breath engine as an immersive overlay (src/breathplayer.js -> site/breathplayer.js) ----------
  const BODY_NOTE = { none: 'The body of light breathes with you.', heart: 'The light gathers at the heart and radiates as you breathe out.', nostrils: 'The light rests where the breath touches, at the nostrils.',
    belly: 'The light rests low in the belly and rises and falls with the breath.', central: 'The light rises and settles along the central channel.',
    channels: 'The three channels glow: the central one, with the teal and rose channels either side.', whole: 'The whole body is evenly lit.', space: 'The light widens into the space around the body.' }
  let W2 = null
  function webgl2() { if (W2 === null) { try { W2 = !!document.createElement('canvas').getContext('webgl2') } catch { W2 = false } } return W2 }
  let BP = null
  const playerUrl = () => new URL(document.querySelector('meta[name="wiser-breath"]')?.content || 'breathplayer.js', location.href).href
  async function withTheBody(p, minutes, ctx, btn, reduce) {
    if (btn) btn.disabled = true
    try {
      BP ||= import(/* @vite-ignore */ playerUrl())
      const m = await BP
      m.open({ name: p.name, steps: p.steps, minutes, body: p.body, reduce, onEnd: ({ full, seconds }) => logSheet(p, minutes, Math.max(1, Math.round(seconds / 60)), full, ctx, 'player') })
    } catch (e) { console.warn('breath player unavailable, using the timer', e); BP = null; timer(p, minutes, ctx) }
    finally { if (btn) btn.disabled = false }
  }
  // where a practice sits in the course tree: Tradition › School, and each course › phase that uses it
  function whereHTML(pid) {
    const ix = CT?.index?.practice?.[pid]; if (!ix) return ''
    const T = CT.traditions.find((t) => t.id === ix.tradition), S = T?.schools.find((s) => s.id === ix.school)
    const cs = (ix.courses || []).map((x) => { const c = S?.courses.find((y) => y.id === x.course) || CT.traditions.flatMap((t) => t.schools.flatMap((s) => s.courses)).find((y) => y.id === x.course); if (!c) return ''
      const ph = x.phase ? c.phases.find((f) => f.n === x.phase) : null
      return `<a href="${esc(c.href || '#collection/' + c.id)}">${esc(c.title)}</a>${ph ? ` \u203a ${esc(ph.title)}` : ''}` }).filter(Boolean)
    const head = T ? `${esc(T.label)}${S && S.label !== T.label ? ' \u203a ' + esc(S.label) : ''}` : ''
    return head || cs.length ? `${head}${cs.length ? `${head ? ' \u00b7 ' : ''}In ${cs.slice(0, 3).join('; ')}` : ''}` : ''
  }

  // the dark timer: practice name in the serif, one gold hairline ring filling slowly, bells at step cues, no numerals unless tapped
  let wake = null
  function timer(p, minutes, ctx = {}) {
    const total = Math.max(1, minutes) * 60, steps = p.steps.length ? p.steps : [{ n: 1, text: p.how, seconds: total }]
    const scale = total / Math.max(1, steps.reduce((s, x) => s + x.seconds, 0))
    let acc = 0; const cues = steps.map((s) => { const at = acc; acc += s.seconds * scale; return { at, text: s.text } })
    const ov = document.createElement('div'); ov.className = 'fl-timer'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', p.name)
    const R = 140, C = 2 * Math.PI * R
    ov.innerHTML = `<div class="fl-tin"><h2 class="fl-nm">${esc(p.name)}</h2>
      <button type="button" class="fl-ring" aria-label="Show the time"><svg viewBox="0 0 320 320" aria-hidden="true"><circle cx="160" cy="160" r="${R}" class="bg"/><circle cx="160" cy="160" r="${R}" class="fg" style="stroke-dasharray:${C};stroke-dashoffset:${C}"/></svg><span class="fl-left" hidden></span></button>
      <p class="fl-cue">${esc(cues[0].text)}</p>
      <p class="fl-acts"><button type="button" class="hbtn" data-pause="1">Pause</button><button type="button" class="hbtn" data-end="1">End</button></p></div>`
    document.body.appendChild(ov); document.body.classList.add('in-timer')
    try { navigator.wakeLock?.request('screen').then((w) => (wake = w)).catch(() => {}) } catch {}
    let t0 = performance.now(), paused = 0, pausedAt = 0, ci = 0, raf = 0, ended = false
    const fg = ov.querySelector('.fg'), cue = ov.querySelector('.fl-cue'), left = ov.querySelector('.fl-left')
    bell(0.5)
    const loop = () => {
      if (ended) return
      const el = pausedAt ? (pausedAt - t0 - paused) / 1000 : (performance.now() - t0 - paused) / 1000
      fg.style.strokeDashoffset = String(C * (1 - Math.min(1, el / total)))
      if (!left.hidden) { const r = Math.max(0, Math.ceil(total - el)); left.textContent = `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}` }
      while (ci + 1 < cues.length && el >= cues[ci + 1].at) { ci++; cue.textContent = cues[ci].text; bell(0.25) }
      if (el >= total) return finish(true)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    ov.querySelector('.fl-ring').onclick = () => { left.hidden = !left.hidden }
    ov.querySelector('[data-pause]').onclick = (e) => { if (pausedAt) { paused += performance.now() - pausedAt; pausedAt = 0; e.target.textContent = 'Pause' } else { pausedAt = performance.now(); e.target.textContent = 'Resume' } }
    ov.querySelector('[data-end]').onclick = () => finish(false)
    function finish(full) {
      ended = true; cancelAnimationFrame(raf); if (full) bell(0.6, 3)
      const sat = Math.max(1, Math.round(((pausedAt || performance.now()) - t0 - paused) / 60000))
      try { wake?.release?.() } catch {} wake = null
      logSheet(p, minutes, sat, full, ctx, 'timer', ov)
    }
    function close() { ended = true; cancelAnimationFrame(raf); ov.remove(); document.body.classList.remove('in-timer'); try { wake?.release?.() } catch {} }
  }
  // after a sit (timer or body): log it to the device, optionally advancing the journey unit it came from
  function logSheet(p, minutes, sat, full, ctx = {}, source = 'timer', ov = null) {
    if (!ov) { ov = document.createElement('div'); ov.className = 'fl-timer'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', p.name); ov.innerHTML = '<div class="fl-tin"></div>'; document.body.appendChild(ov); document.body.classList.add('in-timer') }
    ov.querySelector('.fl-tin').innerHTML = `<h2 class="fl-nm">${full ? 'Well sat.' : 'Ended.'}</h2>
        <label class="fl-log">Minutes <input type="number" min="1" max="600" value="${full ? minutes : sat}" data-min></label>
        <label class="fl-log">A note, if you like <input type="text" maxlength="300" data-note placeholder="Optional"></label>
        <p class="fl-qual" role="group" aria-label="How was it?">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="hbtn" data-q="${n}">${'\u2022'.repeat(n)}</button>`).join('')}</p>
        <p class="fl-acts"><button type="button" class="btn gold" data-log="1">Log this sit</button><button type="button" class="hbtn" data-skip="1">Don\u2019t log</button></p>`
    let qual = null
    const close = () => { ov.remove(); document.body.classList.remove('in-timer') }
    ov.querySelectorAll('[data-q]').forEach((b) => (b.onclick = () => { qual = Number(b.dataset.q); ov.querySelectorAll('[data-q]').forEach((x) => x.classList.toggle('send', x === b)) }))
    ov.querySelector('[data-log]').onclick = () => {
      const m = Math.max(1, Math.min(600, Number(ov.querySelector('[data-min]').value) || sat))
      d.profile.logPractice({ practice: p.id, minutes: m, note: ov.querySelector('[data-note]').value.trim() || undefined, quality: qual || undefined, journey: ctx.journey || undefined, traditions: [p.tradition].filter(Boolean), topics: p.topics || [], source })
      if (ctx.journey && ctx.unit) { const c = all().find((x) => x.id === ctx.journey), j = d.profile.journey(ctx.journey); if (c && !(j?.done || []).includes(ctx.unit)) markUnit(c, ctx.unit, null) }
      close(); d.toast('Logged. ' + m + ' minutes.'); d.onTaste?.()
    }
    ov.querySelector('[data-skip]').onclick = close
  }
  let actx = null
  function bell(vol = 0.4, times = 1) { // a soft synthesised bell (no audio files): two partials, slow decay
    try {
      actx ||= new (window.AudioContext || window.webkitAudioContext)()
      for (let k = 0; k < times; k++) {
        const t = actx.currentTime + k * 2.2
        for (const [f, g] of [[528, 1], [1056, 0.35], [1584, 0.12]]) { const o = actx.createOscillator(), a = actx.createGain(); o.type = 'sine'; o.frequency.value = f; a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(vol * g * 0.3, t + 0.02); a.gain.exponentialRampToValueAtTime(0.0001, t + 4.5); o.connect(a).connect(actx.destination); o.start(t); o.stop(t + 4.6) }
      }
    } catch {}
  }
  const practiceForTopic = (t) => Object.values(D?.practices || {}).find((p) => !p.needsTeacher && (p.topics || []).includes(String(t).split('/')[0])) || null
  return { load, ready, practice, all, paintList, paintCollection, paintPractice, practiceForTopic, courseTree, loadCourses }
}
