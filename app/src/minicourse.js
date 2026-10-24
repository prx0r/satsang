// Mini-courses (collection kind `mini-course`, DATA-MODEL §2.4): #courses lists them, #course/<id>[/<step>] plays one:
// talk -> practice -> next, one step at a time. Progress uses the existing journeys store (profile.setJourney -> POST
// /journeys/:id/progress), so it resumes across devices exactly like a journey. Data: data/wisegraph/collections.json
// (tools/mini_courses_src.py -> build-collections.py). Talks play inline (privacy-enhanced YouTube, click to load), so a
// course never turns into a pair round. Dark design only: whero / wsec / pprog / pprg / btn / hbtn / fl-caution.

const LEVEL = { 'first-steps': 'First steps', steady: 'Going further', deep: 'Deep' }

export function createMiniCourses(d) {
  // d: { esc, byId(id), thumb(id), ytId(c), cols() (collections module: load, all, practice), profile, label(t), wise() }
  const { esc } = d
  const all = () => d.cols().all().filter((c) => c.kind === 'mini-course')
  const get = (id) => all().find((c) => c.id === id) || null
  const clipOf = (it) => (it.ref?.startsWith('clip:') ? d.byId(it.ref.slice(5)) : null)
  const items = (c) => c.units.flatMap((u) => u.items)
  const count = (c, role) => items(c).filter((i) => i.role === role).length
  const mins = (c) => c.minutes || Math.round(items(c).reduce((s, i) => { const k = clipOf(i); return s + (k ? secOf(k) / 60 : i.role === 'practise' ? 10 : 0) }, 0))
  const secOf = (k) => (k.end ? k.end - (k.start || 0) : Number(k.sec) || Number(k.dur) || 0)
  const fmt = (k) => { const m = Math.round(secOf(k) / 60); return m ? m + ' min' : '' }
  const prog = (c) => d.profile.journey(c.id)

  function card(c) {
    const j = prog(c), n = c.units.length, done = j?.done?.length || 0
    const first = items(c).map(clipOf).find(Boolean)
    return `<a class="mcard" href="#course/${esc(c.id)}">
      ${first ? `<span class="mimg" style="--img:url(${esc(d.thumb(first.id))})"></span>` : ''}
      <span class="mbody"><span class="eyebrow">${esc(LEVEL[c.level] || 'Course')} \u00b7 ${n} steps \u00b7 ${mins(c)} min${c.orientationOnly ? ' \u00b7 orientation' : ''}</span>
      <b>${esc(c.title)}</b><span class="mintro">${esc(c.intro)}</span>
      <span class="mmeta">${count(c, 'watch')} talks \u00b7 ${count(c, 'practise')} ${count(c, 'practise') === 1 ? 'practice' : 'practices'}${count(c, 'read') ? ` \u00b7 ${count(c, 'read')} to read` : ''}</span>
      ${j ? `<span class="mprog" style="--p:${Math.round((100 * done) / n)}%"><i></i><em>${done >= n ? 'Finished' : `${done} of ${n} done`}</em></span>` : ''}</span></a>`
  }

  function paintList(el) {
    const L = all()
    el.innerHTML = `<div class="head"><h2>Courses</h2></div>
      <p class="muted lede">Short courses built from the talks most worth your time: a few in a teaching order, a practice to go with them, something to read, and where to go deeper. One step at a time, at your own pace.</p>
      ${L.length ? `<div class="mgrid">${L.map(card).join('')}</div>` : '<div class="wempty"><p class="muted">Courses are on their way.</p></div>'}
      <section class="wsec"><div class="wsech"><h3>Journeys and practices</h3></div><p class="muted">Week-long journeys, first syllabi and series of sits.</p><p><a class="hbtn" href="#collections">Open journeys and practices</a></p></section>`
  }

  function itemHTML(it, c, u) {
    const note = it.note ? `<p class="mnote">${esc(it.note)}</p>` : ''
    if (it.role === 'watch') {
      const k = clipOf(it); if (!k) return ''
      const who = k.teacher || k.comic || ''
      return `<article class="mstep-item mwatch"><span class="eyebrow">Watch \u00b7 ${esc(fmt(k))}${k.gold ? ' \u00b7 <span class="gtxt">Gold</span>' : ''}</span>
        <button type="button" class="mplayer" data-play="${esc(k.id)}" aria-label="Play ${esc(k.segTitle || k.title)}"><img src="${esc(d.thumb(k.id))}" alt="" loading="lazy"><span class="mplay" aria-hidden="true"></span></button>
        <b class="mtitle">${esc(k.segTitle || k.title)}</b><span class="muted small">${esc(who)}</span>${note}
        <p class="muted small"><a href="#watch/${encodeURIComponent(k.id)}">Open in the talk view</a></p></article>`
    }
    if (it.role === 'practise') {
      const p = d.cols().practice(it.ref?.slice(9)); if (!p) return ''
      return `<article class="mstep-item"><span class="eyebrow">Practise${p.minutes && !p.needsTeacher ? ' \u00b7 ' + p.minutes + ' min' : ''}${p.needsTeacher ? ' \u00b7 orientation only' : ''}</span>
        <b class="mtitle">${esc(p.name)}</b>${note}
        ${p.cautions?.length ? `<div class="fl-caution">${p.cautions.slice(0, 2).map((x) => `<p>${esc(x)}</p>`).join('')}</div>` : ''}
        <a class="btn ${p.needsTeacher ? 'ghost' : 'gold'}" href="#practice/${esc(p.id)}?from=${esc(c.id)}&unit=${u.n}">${p.needsTeacher ? 'Read about it' : 'Begin the sit'}</a></article>`
    }
    if (it.role === 'read' && it.url) return `<article class="mstep-item"><span class="eyebrow">Read \u00b7 free</span><b class="mtitle">${esc(it.title || 'Reading')}</b>${note}<a class="hbtn" href="${esc(it.url)}" target="_blank" rel="noopener">Open the text \u2197</a></article>`
    if (it.role === 'reflect') return `<article class="mstep-item"><span class="eyebrow">Reflect</span><p class="fl-reflect">${esc(it.note || '')}</p></article>`
    return ''
  }

  function paintCourse(el, id, stepArg) {
    const c = get(id)
    if (!c) { el.innerHTML = `<a class="back" href="#courses">\u2190 Courses</a><div class="wempty"><h2>Course not found</h2></div>`; return }
    const j = prog(c), done = new Set(j?.done || []), n = c.units.length
    const next = c.units.find((u) => !done.has(u.n))
    const cur = c.units.find((u) => u.n === Number(stepArg)) || (j ? next || c.units[n - 1] : null)
    const deeper = (c.deeper || []).filter((x) => x.name)
    el.innerHTML = `<a class="back" href="#courses">\u2190 Courses</a>
      <section class="whero wtopic mhero"><div class="whin">
        <span class="eyebrow">Course \u00b7 ${esc(LEVEL[c.level] || '')} \u00b7 ${n} steps \u00b7 about ${mins(c)} min</span>
        <h1>${esc(c.title)}</h1><p class="tag">${esc(c.intro)}</p>
        ${c.caution ? `<div class="fl-caution"><p>${esc(c.caution)}</p></div>` : ''}
        <div class="stats">${[[count(c, 'watch'), 'Talks'], [count(c, 'practise'), count(c, 'practise') === 1 ? 'Practice' : 'Practices'], [count(c, 'read'), 'Readings'], j ? [done.size, 'Done'] : null].filter((x) => x && x[0]).map(([v, l]) => `<div><b>${v}</b><span>${esc(l)}</span></div>`).join('')}</div>
        <div class="wcta">${!j ? '<button type="button" class="btn gold" data-start="1">Start the course</button>' : next ? `<button type="button" class="btn gold" data-go="${next.n}">${cur && cur.n === next.n ? 'Continue below' : `Resume: step ${next.n}`}</button>` : '<span class="muted">Finished. Look back over any step.</span>'}
          <button type="button" class="btn ghost" data-save="1">${d.profile.has('collection:' + c.id) ? 'Saved' : 'Save'}</button></div>
        <p class="muted small">Your progress stays on this device and syncs anonymously.</p>
      </div></section>
      ${cur ? `<section class="wsec mnow" id="mnow"><div class="wsech"><h3>Step ${cur.n} of ${n}: ${esc(cur.title)}</h3><span class="muted small">${done.has(cur.n) ? 'Done' : 'Now'}</span></div>
        ${cur.intro ? `<p class="muted">${esc(cur.intro)}</p>` : ''}
        <div class="mitems">${cur.items.map((it) => itemHTML(it, c, cur)).join('')}</div>
        <p class="fl-acts mnav">${cur.n > 1 ? `<button type="button" class="hbtn" data-go="${cur.n - 1}">\u2190 Previous step</button>` : ''}
          ${done.has(cur.n) ? `<button type="button" class="hbtn" data-undo="${cur.n}">Mark as not done</button>${cur.n < n ? `<button type="button" class="btn gold" data-go="${cur.n + 1}">Next step \u2192</button>` : ''}`
            : `<button type="button" class="btn gold" data-done="${cur.n}">${cur.n < n ? 'Done: next step \u2192' : 'Done: finish the course'}</button>`}</p></section>` : ''}
      <section class="wsec"><div class="wsech"><h3>The steps</h3></div><ol class="msteps">${c.units.map((u) => { const roles = [...new Set(u.items.map((i) => i.role))].map((r) => ({ watch: 'talk', practise: 'practice', read: 'reading', reflect: 'reflection' })[r]).filter(Boolean)
        return `<li class="${done.has(u.n) ? 'done' : ''}${cur && cur.n === u.n ? ' on' : ''}"><a href="#course/${esc(c.id)}/${u.n}"><b>${esc(u.title)}</b><span class="muted small">${esc(roles.join(' \u00b7 '))}</span></a></li>` }).join('')}</ol></section>
      ${deeper.length ? `<section class="wsec"><div class="wsech"><h3>Where to go deeper</h3></div><div class="pprog">${deeper.map((p) => `<article class="pprg"><span>Place${p.country ? ' \u00b7 ' + esc(p.country) : ''}</span><b>${esc(p.name)}</b>${p.note ? `<p>${esc(p.note)}</p>` : ''}<a class="btn" href="#place/${esc(p.ref.slice(6))}">Open place</a></article>`).join('')}</div></section>` : ''}
      ${c.topic && d.label(c.topic) ? `<section class="wsec"><div class="wsech"><h3>The topic</h3></div><div class="wtopics"><a class="wchip tp" href="#topic/${esc(c.topic)}">${esc(d.label(c.topic))}</a></div></section>` : ''}`
    const set = (patch) => d.profile.setJourney(c.id, patch)
    const goStep = (k) => { location.hash = `#course/${c.id}/${k}` }
    el.querySelector('[data-start]')?.addEventListener('click', () => { set({ unit: 1, done: [] }); goStep(1) })
    el.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => goStep(Number(b.dataset.go))))
    el.querySelectorAll('[data-done]').forEach((b) => b.addEventListener('click', () => {
      const k = Number(b.dataset.done), D = new Set(prog(c)?.done || []); D.add(k)
      const nx = c.units.find((u) => !D.has(u.n)); set({ done: [...D].sort((a, b2) => a - b2), unit: nx ? nx.n : n })
      if (k < n) goStep(k + 1); else paintCourse(el, id, k)
    }))
    el.querySelectorAll('[data-undo]').forEach((b) => b.addEventListener('click', () => { const k = Number(b.dataset.undo), D = new Set(prog(c)?.done || []); D.delete(k); set({ done: [...D], unit: k }); paintCourse(el, id, k) }))
    el.querySelector('[data-save]')?.addEventListener('click', (e) => { const on = d.profile.toggleSave('collection:' + c.id); e.target.textContent = on ? 'Saved' : 'Save' })
    el.querySelectorAll('[data-play]').forEach((b) => b.addEventListener('click', () => {
      const k = d.byId(b.dataset.play); if (!k) return
      const q = new URLSearchParams({ autoplay: '1', rel: '0', modestbranding: '1', playsinline: '1' }); if (k.start) q.set('start', String(k.start)); if (k.end) q.set('end', String(k.end))
      const f = document.createElement('iframe'); f.className = 'mframe'; f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true; f.title = k.segTitle || k.title
      f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(d.ytId(k))}?${q}`; b.replaceWith(f)
    }))
    if (stepArg && el.querySelector('#mnow')) el.querySelector('#mnow').scrollIntoView({ block: 'start' })
  }
  return { all, get, paintList, paintCourse }
}
