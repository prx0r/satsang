// Series (collection kind `mini-course`, DATA-MODEL §2.4; called "mini-courses"/"courses" before 2026-10-25). A series lives
// inside its topic: the topic page shows its series first (featured first), #series lists them all grouped by topic, and
// #series/<id>[/<n>] plays one, session by session (old #courses and #course/<id> links redirect here; ids are unchanged).
// Progress uses the existing journeys store (profile.setJourney -> POST /journeys/:id/progress), so it resumes across devices.
// Data: data/wisegraph/collections.json (tools/mini_courses_src.py -> build-collections.py). Talks play inline (privacy-enhanced
// YouTube, click to load). Step types are always one of Listen / Practise / Read / Go deeper. The series caution is shown once,
// in the hero; a session flagged `remind` (or holding an orientation-only practice) gets one short reminder line; a practice's
// cautions show the first time it appears. "Go deeper: full retreat" links a whole Dharma Seed retreat (CC BY-NC-ND: never cut,
// credited, listened to on Dharma Seed). Dark design only: whero / wsec / pprog / pprg / btn / hbtn / fl-caution.

const LEVEL = { 'first-steps': 'First steps', steady: 'Going further', deep: 'Deep' }
const TYPE = { watch: 'Listen', listen: 'Listen', practise: 'Practise', reflect: 'Practise', read: 'Read', visit: 'Go deeper' }
const firstSentence = (t) => { const m = String(t || '').match(/^.*?[.!?](\s|$)/); return (m ? m[0] : String(t || '')).trim() }

export function createMiniCourses(d) {
  // d: { esc, byId(id), thumb(id), ytId(c), cols() (collections module: load, all, practice), profile, label(t), wise() }
  const { esc } = d
  const all = () => d.cols().all().filter((c) => c.kind === 'mini-course')
  const get = (id) => all().find((c) => c.id === id) || null
  const clipOf = (it) => (it.ref?.startsWith('clip:') ? d.byId(it.ref.slice(5)) : null)
  const items = (c) => c.units.flatMap((u) => u.items)
  const count = (c, role) => items(c).filter((i) => i.role === role).length
  const mins = (c) => c.minutes || Math.round(items(c).reduce((s, i) => { const k = clipOf(i); return s + (k ? secOf(k) / 60 : i.role === 'practise' ? 10 : 0) }, 0))
  const span = (c) => { const m = mins(c); return m >= 120 ? `${Math.round(m / 60)} hours` : `${m} min` }
  const secOf = (k) => (k.end ? k.end - (k.start || 0) : Number(k.sec) || Number(k.dur) || 0)
  const fmt = (k) => { const m = Math.round(secOf(k) / 60); return m ? m + ' min' : '' }
  const prog = (c) => d.profile.journey(c.id)
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`
  const purposeOf = (u) => u.purpose || firstSentence(u.intro || u.listenFor || '')
  const topicOf = (c) => (c.topic && d.label(c.topic) ? { id: c.topic, label: d.label(c.topic) } : null)
  const listens = (c) => count(c, 'watch')
  const nPractices = (c) => new Set(items(c).filter((i) => i.role === 'practise').map((i) => i.ref)).size
  const ORDER = ['Listen', 'Practise', 'Read', 'Go deeper']
  const reminderOf = (c) => c.reminder || (c.orientationOnly ? 'Reminder: orientation only, not instruction. No results are promised; stop if anything here becomes distressing.' : '')

  function card(c, opts = {}) {
    const j = prog(c), n = c.units.length, done = j?.done?.length || 0, feat = c.featured && !opts.plain
    const first = (c.cover && d.byId(c.cover)) || items(c).map(clipOf).find(Boolean)
    return `<a class="mcard${feat ? ' mfeat' : ''}" href="#series/${esc(c.id)}">
      ${first ? `<span class="mimg" style="--img:url(${esc(d.thumb(first.id))})"></span>` : ''}
      <span class="mbody"><span class="eyebrow">${c.featured ? '<span class="gtxt">Featured series</span> \u00b7 ' : 'Series \u00b7 '}${esc(LEVEL[c.level] || '')} \u00b7 ${plural(n, 'session')} \u00b7 ${span(c)}${c.orientationOnly ? ' \u00b7 orientation' : ''}</span>
      <b>${esc(c.title)}</b><span class="mintro">${esc(c.intro)}</span>
      <span class="mmeta">${plural(listens(c), 'talk')}${count(c, 'listen') ? ` \u00b7 ${count(c, 'listen')} audio` : ''} \u00b7 ${plural(nPractices(c), 'practice')}${count(c, 'read') ? ` \u00b7 ${count(c, 'read')} to read` : ''}${c.retreat ? ' \u00b7 a full retreat to go deeper' : ''}</span>
      ${j ? `<span class="mprog" style="--p:${Math.round((100 * done) / n)}%"><i></i><em>${done >= n ? 'Finished' : `${done} of ${n} sessions done`}</em></span>` : ''}</span></a>`
  }

  const retreatCard = (r, where) => (r?.url ? `<article class="pprg mretreat"><span>Go deeper \u00b7 full retreat${r.talks ? ` \u00b7 ${r.talks} talks` : ''}</span><b>${esc(r.title)}</b>
    ${r.note && where !== 'topic' ? `<p>${esc(r.note)}</p>` : ''}<p class="muted small">${esc(r.by || '')}${r.year ? ` \u00b7 ${r.year}` : ''}. Complete talks on Dharma Seed (CC BY-NC-ND 4.0): listened to whole there, credited, never cut or transcribed here.</p>
    <a class="btn" href="${esc(r.url)}" target="_blank" rel="noopener">Open the retreat on Dharma Seed \u2197</a></article>` : '')

  // the topic page's series block: every series on this topic, featured first, then its full retreats
  function topicBlock(list, label) {
    if (!list?.length) return ''
    const L = [...list].sort((a, b) => !!b.featured - !!a.featured)
    const rs = L.filter((c) => c.retreat?.url).map((c) => retreatCard(c.retreat, 'topic')).join('')
    return `<section class="wsec tseries" id="ts"><div class="wsech"><h3>Series on ${esc(label.toLowerCase())}</h3><span class="muted small">Talks in a teaching order, session by session, with practices</span></div>
      <div class="mgrid">${L.map((c) => card(c)).join('')}</div>${rs ? `<div class="pprog">${rs}</div>` : ''}</section>`
  }

  // the Topics page strip and the #series index: series grouped by their topic, featured first
  function grouped() {
    const by = new Map()
    for (const c of [...all()].sort((a, b) => !!b.featured - !!a.featured)) { const t = topicOf(c); const k = t ? t.id : ''; if (!by.has(k)) by.set(k, { t, L: [] }); by.get(k).L.push(c) }
    return [...by.values()]
  }
  function topicsStrip() {
    const G = grouped(); if (!G.length) return ''
    return `<section class="wsec" id="series"><div class="wsech"><h3>Series</h3><span class="muted small">Each lives inside its topic</span></div>
      <div class="sgroups">${G.map(({ t, L }) => `<div class="sgroup">${t ? `<a class="wchip tp" href="#topic/${esc(t.id)}">${esc(t.label)}</a>` : ''}${L.map((c) => `<a class="sline${c.featured ? ' sfeat' : ''}" href="#series/${esc(c.id)}"><b>${esc(c.title)}</b><span class="muted small">${c.featured ? '<span class="gtxt">Featured</span> \u00b7 ' : ''}${plural(c.units.length, 'session')}${c.orientationOnly ? ' \u00b7 orientation' : ''}</span></a>`).join('')}</div>`).join('')}</div>
      <p class="muted small"><a href="#collections">Week-long journeys and practices</a></p></section>`
  }

  function paintList(el) {
    const G = grouped()
    el.innerHTML = `<a class="back" href="#topics">\u2190 Topics</a><div class="head"><h2>Series</h2></div>
      <p class="muted lede">Short series inside each topic, built from the talks most worth your time: a few in a teaching order, a practice to go with them, something to read, and where to go deeper. One session at a time.</p>
      ${G.length ? G.map(({ t, L }) => `<section class="wsec"><div class="wsech"><h3>${t ? `<a href="#topic/${esc(t.id)}">${esc(t.label)}</a>` : 'More'}</h3><span class="muted small">${L.length} series</span></div><div class="mgrid">${L.map((c) => card(c, { plain: G.length > 1 && !c.featured })).join('')}</div></section>`).join('')
        : '<div class="wempty"><p class="muted">Series are on their way.</p></div>'}`
  }

  function itemHTML(it, c, u, seen) {
    const note = it.note ? `<p class="mnote">${esc(it.note)}</p>` : ''
    const eb = (sub) => `<span class="eyebrow mtype"><b>${it.optional ? 'Optional \u00b7 ' : ''}${TYPE[it.role] || ''}</b>${sub ? ' \u00b7 ' + sub : ''}</span>`
    if (it.role === 'watch') {
      const k = clipOf(it); if (!k) return ''
      const who = k.teacher || k.comic || ''
      return `<article class="mstep-item mwatch">${eb(`talk \u00b7 ${esc(fmt(k))}${k.gold ? ' \u00b7 <span class="gtxt">Gold</span>' : ''}`)}
        <button type="button" class="mplayer" data-play="${esc(k.id)}" aria-label="Play ${esc(k.segTitle || k.title)}"><img src="${esc(d.thumb(k.id))}" alt="" loading="lazy"><span class="mplay" aria-hidden="true"></span></button>
        <b class="mtitle">${esc(k.segTitle || k.title)}</b><span class="muted small">${esc(who)}</span>${note}
        <p class="muted small"><a href="#watch/${encodeURIComponent(k.id)}">Open in the talk view</a>${it.transcript?.url ? ` \u00b7 <a href="${esc(it.transcript.url)}" target="_blank" rel="noopener">${esc(it.transcript.label || 'Transcript')} \u2197</a>` : ''}</p></article>`
    }
    if (it.role === 'practise') {
      const p = d.cols().practice(it.ref?.slice(9)); if (!p) return ''
      const firstTime = !seen.has(p.id); seen.add(p.id)
      return `<article class="mstep-item">${eb(`${p.needsTeacher ? 'orientation only' : p.minutes ? p.minutes + ' min' : ''}${!firstTime ? ' \u00b7 again' : ''}`)}
        <b class="mtitle">${esc(p.name)}</b>${note}
        ${firstTime && p.cautions?.length ? `<div class="fl-caution"><p>${esc(p.cautions[0])}</p></div>` : ''}
        <a class="btn ${p.needsTeacher ? 'ghost' : 'gold'}" href="#practice/${esc(p.id)}?from=${esc(c.id)}&unit=${u.n}">${p.needsTeacher ? 'Read about it' : 'Begin the sit'}</a></article>`
    }
    if (it.role === 'listen' && it.url) return `<article class="mstep-item">${eb('free audio')}<b class="mtitle">${esc(it.title || 'Lecture')}</b>${it.by ? `<span class="muted small">${esc(it.by)}</span>` : ''}${note}<a class="hbtn" href="${esc(it.url)}" target="_blank" rel="noopener">Listen on the official archive \u2197</a></article>`
    if (it.role === 'visit' && it.retreat && it.url) return `<article class="mstep-item mdeep mretreat">${eb(`full retreat${it.talks ? ` \u00b7 ${it.talks} complete talks` : ''}`)}<b class="mtitle">${esc(it.title || 'Retreat')}</b>${it.by ? `<span class="muted small">${esc(it.by)}</span>` : ''}${note}
      <p class="muted small">On Dharma Seed (CC BY-NC-ND 4.0): listen to each talk whole there. Nothing is cut, trimmed or transcribed here.</p><a class="hbtn" href="${esc(it.url)}" target="_blank" rel="noopener">Open the retreat on Dharma Seed \u2197</a></article>`
    if (it.role === 'visit' && it.url) return `<article class="mstep-item mdeep">${eb('free')}<b class="mtitle">${esc(String(it.title || 'More').replace(/^Go deeper:\s*/i, ''))}</b>${note}<a class="hbtn" href="${esc(it.url)}" target="_blank" rel="noopener">Open \u2197</a></article>`
    if (it.role === 'read' && it.url) return `<article class="mstep-item">${eb('free')}<b class="mtitle">${esc(it.title || 'Reading')}</b>${note}<a class="hbtn" href="${esc(it.url)}" target="_blank" rel="noopener">Open the text \u2197</a></article>`
    if (it.role === 'reflect') return `<article class="mstep-item">${eb('reflection')}<p class="fl-reflect">${esc(it.note || '')}</p></article>`
    return ''
  }

  function paintCourse(el, id, stepArg) {
    const c = get(id)
    if (!c) { el.innerHTML = `<a class="back" href="#series">\u2190 Series</a><div class="wempty"><h2>Series not found</h2></div>`; return }
    const j = prog(c), done = new Set(j?.done || []), n = c.units.length, t = topicOf(c)
    const next = c.units.find((u) => !done.has(u.n))
    const cur = c.units.find((u) => u.n === Number(stepArg)) || (j ? next || c.units[n - 1] : null)
    const deeper = (c.deeper || []).filter((x) => x.name)
    // practices already met in earlier sessions show their caution only once
    const seen = new Set(); if (cur) for (const u of c.units) { if (u.n >= cur.n) break; for (const it of u.items) if (it.role === 'practise') seen.add(it.ref?.slice(9)) }
    const remind = cur && (cur.remind || cur.items.some((it) => it.role === 'practise' && d.cols().practice(it.ref?.slice(9))?.needsTeacher)) ? reminderOf(c) : ''
    el.innerHTML = `<a class="back" href="${t ? '#topic/' + esc(t.id) : '#series'}">\u2190 ${esc(t ? t.label : 'Series')}</a>
      <section class="whero wtopic mhero"><div class="whin">
        <span class="eyebrow">${c.featured ? '<span class="gtxt">Featured series</span>' : 'Series'}${t ? ` \u00b7 in ${esc(t.label)}` : ''} \u00b7 ${esc(LEVEL[c.level] || '')} \u00b7 ${plural(n, 'session')} \u00b7 about ${span(c)}</span>
        <h1>${esc(c.title)}</h1><p class="tag">${esc(c.intro)}</p>
        ${c.caution ? `<div class="fl-caution mcaution"><b>Before you begin</b><p>${esc(c.caution)}</p>${c.stepCaution ? `<p>${esc(c.stepCaution.replace(/^A reminder at every step:\s*/i, ''))}</p>` : ''}</div>` : ''}
        <div class="stats">${[[listens(c), listens(c) === 1 ? 'Talk' : 'Talks'], [count(c, 'listen'), 'Audio'], [nPractices(c), nPractices(c) === 1 ? 'Practice' : 'Practices'], [count(c, 'read'), 'Readings'], j ? [done.size, 'Done'] : null].filter((x) => x && x[0]).map(([v, l]) => `<div><b>${v}</b><span>${esc(l)}</span></div>`).join('')}</div>
        <div class="wcta">${!j ? '<button type="button" class="btn gold" data-start="1">Start the series</button>' : next ? `<button type="button" class="btn gold" data-go="${next.n}">${cur && cur.n === next.n ? 'Continue below' : `Resume: session ${next.n}`}</button>` : '<span class="muted">Finished. Look back over any session.</span>'}
          <button type="button" class="btn ghost" data-save="1">${d.profile.has('collection:' + c.id) ? 'Saved' : 'Save'}</button></div>
        <p class="muted small">Your progress stays on this device and syncs anonymously.</p>
      </div></section>
      ${cur ? `<section class="wsec mnow" id="mnow"><div class="msessh"><span class="eyebrow">Session ${cur.n} of ${n}${done.has(cur.n) ? ' \u00b7 done' : ''}</span><h3>${esc(cur.title)}</h3>${purposeOf(cur) ? `<p class="mpurpose">${esc(purposeOf(cur))}</p>` : ''}</div>
        ${cur.listenFor ? `<p class="mlisten"><b>What to listen for</b>${esc(cur.listenFor)}</p>` : cur.intro ? `<p class="muted">${esc(cur.intro)}</p>` : ''}
        <div class="mitems">${cur.items.map((it) => itemHTML(it, c, cur, seen)).join('')}</div>
        ${remind ? `<p class="muted small mrecur">${esc(remind)}</p>` : ''}
        <p class="fl-acts mnav">${cur.n > 1 ? `<button type="button" class="hbtn" data-go="${cur.n - 1}">\u2190 Previous session</button>` : ''}
          ${done.has(cur.n) ? `<button type="button" class="hbtn" data-undo="${cur.n}">Mark as not done</button>${cur.n < n ? `<button type="button" class="btn gold" data-go="${cur.n + 1}">Next session \u2192</button>` : ''}`
            : `<button type="button" class="btn gold" data-done="${cur.n}">${cur.n < n ? 'Done: next session \u2192' : 'Done: finish the series'}</button>`}</p></section>` : ''}
      <section class="wsec"><div class="wsech"><h3>The sessions</h3></div><ol class="msteps">${c.units.map((u) => {
        const roles = ORDER.filter((r) => u.items.some((i) => TYPE[i.role] === r))
        return `<li class="${done.has(u.n) ? 'done' : ''}${cur && cur.n === u.n ? ' on' : ''}"><a href="#series/${esc(c.id)}/${u.n}"><span><b>${esc(u.title)}</b>${purposeOf(u) ? `<span class="mpurp">${esc(purposeOf(u))}</span>` : ''}<span class="muted small">${esc(roles.join(' \u00b7 '))}</span></span></a></li>` }).join('')}
        ${c.retreat?.url ? `<li class="mfinal"><a href="${esc(c.retreat.url)}" target="_blank" rel="noopener"><span><b>Go deeper: full retreat</b><span class="mpurp">${esc(c.retreat.title)}</span><span class="muted small">${c.retreat.talks ? `${c.retreat.talks} complete talks \u00b7 ` : ''}on Dharma Seed \u2197</span></span></a></li>` : ''}</ol></section>
      ${c.retreat?.url ? `<section class="wsec"><div class="wsech"><h3>Go deeper: full retreat</h3><span class="muted small">After the last session</span></div><div class="pprog">${retreatCard(c.retreat)}</div></section>` : ''}
      ${(c.further || []).length ? `<section class="wsec"><div class="wsech"><h3>More to explore</h3><span class="muted small">Links only. Paid ones say so; Satsang sells nothing.</span></div><div class="pprog">${c.further.map((r) => `<article class="pprg"><span>${r.free ? 'Free' : '<span class="gtxt">Paid</span>'}${r.price ? ' \u00b7 ' + esc(r.price) : ''}</span><b>${esc(String(r.title).replace(/\s+\u2014 Paid$/, ''))}</b>${r.note ? `<p>${esc(r.note)}</p>` : ''}<a class="btn" href="${esc(r.url)}" target="_blank" rel="noopener">Open \u2197</a></article>`).join('')}</div></section>` : ''}
      ${deeper.length ? `<section class="wsec"><div class="wsech"><h3>Places to go deeper</h3></div><div class="pprog">${deeper.map((p) => `<article class="pprg"><span>Place${p.country ? ' \u00b7 ' + esc(p.country) : ''}</span><b>${esc(p.name)}</b>${p.note ? `<p>${esc(p.note)}</p>` : ''}<a class="btn" href="#place/${esc(p.ref.slice(6))}">Open place</a></article>`).join('')}</div></section>` : ''}
      ${t ? `<section class="wsec"><div class="wsech"><h3>The topic</h3></div><p class="muted">Every talk in this series is also in the topic, beside the other traditions\u2019 takes.</p><div class="wtopics"><a class="wchip tp" href="#topic/${esc(t.id)}">${esc(t.label)}</a></div></section>` : ''}`
    const set = (patch) => d.profile.setJourney(c.id, patch)
    const goStep = (k) => { location.hash = `#series/${c.id}/${k}` }
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
  return { all, get, paintList, paintCourse, topicBlock, topicsStrip, card }
}
