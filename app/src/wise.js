// Satsang profiles: teachers, figures, traditions and topic compare pages, drawn from the wisegraph (data/wisegraph/wise.json)
// plus the live clip list. Everything clip-related is computed here from clips.json, so a new clip lights up every page it
// belongs to without rebuilding the graph:
//   #teacher/<id>    a speaker (talks by) or a figure/text (talks about), same layout; empty sections are hidden
//   #tradition/<id>  a family, school or lineage: tree, key figures, top topics, best talks
//   #traditions      every tradition, family by family (the Traditions view of the Teachers tab)
//   #topic/<id>      takes on one topic, side by side by tradition, with "Compare two takes"
// Portraits are Wikimedia Commons files (Wikidata P18), public domain or CC only, credited on the page and on credits.html.

export function createWise(ctx) {
  const { esc, thumb, clipTile, ytId, isFull, inBallot, servable, crowdClip, LS } = ctx
  const topicLabel = (t) => ctx.topicLabel(t) || HL[t] || null
  let W = null, WP = null, H = {}
  // topic hubs (data/wisegraph/hubs.json, tools/build-hubs.py): essays, practices, sub-questions, the Atlas thread. Optional.
  let HL = {} // leaf topic labels (schema/topics.json via build-hubs.py): the app's own label list holds the roots
  const loadHubs = () => fetch('data/wisegraph/hubs.json', { cache: 'no-cache' }).then((r) => (r && r.ok !== false ? r.json() : null)).then((j) => { H = (j && j.hubs) || {}; HL = (j && j.labels) || {} }).catch(() => (H = {}))
  const load = () => (WP ||= Promise.all([fetch('data/wisegraph/wise.json', { cache: 'no-cache' }).then((r) => (r && r.ok !== false ? r.json() : null)).then((j) => (W = j && j.people ? j : { people: {}, traditions: {}, takes: {} })).catch(() => (W = { people: {}, traditions: {}, takes: {} })), loadHubs()]).then(([w]) => w))
  // depth: a teacher with at least DEEP_MIN talks gets a front-facing tile; thinner voices stay in topics and a "More voices" list
  const DEEP_MIN = 8
  const isDeep = (id) => by(id).length >= DEEP_MIN
  const clips = () => ctx.clips()
  const T = (id) => W?.traditions?.[id] || null
  const P = (id) => W?.people?.[id] || null
  const chain = (t) => { const out = []; let x = t, g = 0; while (x && T(x) && g++ < 8) { out.push(x); x = T(x).parent } return out } // most specific first
  const familyOf = (t) => chain(t).slice(-1)[0] || t
  const subtree = (t) => { const out = [t]; for (let i = 0; i < out.length; i++) for (const k of T(out[i])?.kids || []) out.push(k); return out }
  const tLabel = (t) => T(t)?.label || ''
  const KIND = { family: 'Tradition', school: 'School', lineage: 'Lineage' }
  const plural = (n, a, b = a + 's') => `${n} ${n === 1 ? a : b}`
  const fmtDur = (c) => { const d = Number(c?.end) > 0 ? Number(c.end) - (Number(c.start) || 0) : Number(c?.dur) || 0; return d >= 3600 ? `${Math.floor(d / 3600)} h ${Math.round((d % 3600) / 60)} min` : `${Math.max(1, Math.round(d / 60))} min` }
  // clip quality for ordering: crowd strength first, then views
  const score = (c) => { const r = crowdClip(c.id); return (r && r.bouts ? 10 + (r.elo - 1500) / 50 : 0) + Math.log10(1 + (Number(c.views) || 0)) / 10 }
  const best = (list) => [...list].sort((a, b) => score(b) - score(a))
  const by = (id) => clips().filter((c) => c.speaker === id)
  const about = (id) => clips().filter((c) => Array.isArray(c.figures) && c.figures.includes(id) && c.speaker !== id)
  const ballotable = (list) => list.filter((c) => inBallot(c) && servable(c))
  const viewable = (list) => list.filter((c) => servable(c) && (inBallot(c) || c.delivery === 'footage' || (c.hubOnly && !isFull(c)))) // shown on pages (footage and hub-only passages too), never paired
  const fullTalks = (list) => list.filter((c) => isFull(c) && servable(c))
  const initials = (n) => String(n || '').replace(/^(the|sri|swami|ajahn|bhikkhu|sister|meister)\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const portrait = (id) => P(id)?.img || null
  const firstStill = (id) => { const c = best(by(id)).find((k) => k.media === 'youtube'); return c ? `https://i.ytimg.com/vi/${ytId(c)}/hqdefault.jpg` : '' } // only a speaker's OWN talk stands in for a face
  const link = (id) => (P(id) ? `#teacher/${encodeURIComponent(id)}` : T(id) ? `#tradition/${encodeURIComponent(id)}` : null)
  const nameOf = (id) => P(id)?.short || P(id)?.n || T(id)?.label || id

  // ---------- small parts ----------
  function face(id, cls = '') { // a round-ish portrait, a talk still, or a monogram
    const im = portrait(id), st = im ? '' : firstStill(id)
    if (im) return `<span class="wface ${cls}"><img src="${esc(im.face || im.src)}" alt="" decoding="async"></span>`
    if (st) return `<span class="wface yt ${cls}"><img src="${esc(st)}" alt="" decoding="async"></span>`
    return `<span class="wface mono ${cls}"><b>${esc(initials(P(id)?.n || nameOf(id)))}</b></span>`
  }
  function personTile(id, sub) {
    const p = P(id); if (!p) return ''
    const n = by(id).length, a = about(id).length
    const line = sub || [p.k === 'speaker' || n ? (n ? plural(n, 'talk') : 'Talks arriving') : a ? `In ${plural(a, 'talk')}` : p.k === 'text' ? 'Text' : p.ro === 'scholar' ? 'Scholar' : 'Figure', tLabel(p.t)].filter(Boolean).join(' · ')
    return `<a class="wtile" href="#teacher/${esc(id)}">${face(id)}<span class="wtt"><b>${esc(p.n)}</b><span>${esc(line)}</span></span></a>`
  }
  function chips(t, cur) {
    return chain(t).reverse().map((x) => `<a class="wchip${x === cur ? ' on' : ''}" href="#tradition/${esc(x)}">${esc(tLabel(x))}</a>`).join('')
  }
  const rail = (title, list, more = '') => (list.length ? `<section class="wsec"><div class="wsech"><h3>${esc(title)}</h3>${more}</div><div class="rail">${list.slice(0, 40).map((c) => clipTile(c, null, fmtDur(c))).join('')}</div></section>` : '')
  const section = (title, inner, cls = '') => (inner ? `<section class="wsec ${cls}"><div class="wsech"><h3>${esc(title)}</h3></div>${inner}</section>` : '')
  // [[id, type]] -> chips with a face. dir 'by' = edges into this node (teachers, influences), 'inf' = edges out (students).
  // studied_with (looser, medium-confidence links) always reads "Studied with", never Teacher/Student.
  const REL = { by: { teacher_of: 'Teacher', studied_with: 'Studied with', influenced: 'Influence', academic_supervisor_of: 'Doctoral supervisor', translated: 'Translator' }, inf: { teacher_of: 'Student', studied_with: 'Studied with', influenced: 'Influenced', academic_supervisor_of: 'Doctoral student', translated: 'Translated' } }
  const ACAD = (rows, yes) => (rows || []).filter(([, ty]) => (ty === 'academic_supervisor_of') === yes)
  function relList(rows, dir = 'by') {
    const ok = (rows || []).filter(([id]) => P(id) || T(id))
    if (!ok.length) return ''
    return `<div class="wrel">${ok.map(([id, ty]) => { const isT = !P(id); return `<a class="wrelc" href="${link(id)}">${isT ? '<span class="wface mono t"><b>' + esc(initials(tLabel(id))) + '</b></span>' : face(id, 'sm')}<span><b>${esc(nameOf(id))}</b><em>${isT ? KIND[T(id).kind] || 'Tradition' : REL[dir][ty] || 'Influence'}</em></span></a>` }).join('')}</div>`
  }
  // ---------- lineage (teacher_of edges only): the line above, this person, their students ----------
  const teachersOf = (id) => (P(id)?.by || []).filter(([x, ty]) => ty === 'teacher_of' && P(x)).map(([x]) => x)
  const studentsOf = (id) => (P(id)?.inf || []).filter(([x, ty]) => ty === 'teacher_of' && P(x)).map(([x]) => x)
  function lineUp(id) { // longest teacher_of line above id (depth-first, cycle-safe)
    let bestL = []
    const walk = (x, path) => { if (path.length > 8) return; const ts = teachersOf(x).filter((t) => !path.includes(t)); if (!ts.length) { if (path.length > bestL.length) bestL = path; return } for (const t of ts) walk(t, [t, ...path]) }
    walk(id, [id]); return bestL
  }
  function lineageHTML(id) {
    const up = lineUp(id), kids = studentsOf(id), other = teachersOf(id).filter((t) => !up.includes(t))
    if (up.length < 2 && !kids.length) return ''
    const node = (x, cls = '') => `<a class="wlnode ${cls}" href="#teacher/${esc(x)}">${face(x, 'sm')}<span><b>${esc(nameOf(x))}</b>${P(x)?.years ? `<em>${esc(P(x).years)}</em>` : ''}</span></a>`
    return section('Lineage', `<div class="wlin">${up.map((x) => node(x, x === id ? 'on' : '')).join('<i class="wlarr" aria-hidden="true"></i>')}
      ${other.length ? `<p class="muted small">Also taught by ${other.map((x) => `<a href="#teacher/${esc(x)}">${esc(nameOf(x))}</a>`).join(', ')}</p>` : ''}
      ${kids.length ? `<i class="wlarr" aria-hidden="true"></i><div class="wlkids">${kids.map((x) => node(x)).join('')}</div>` : ''}</div>
      <p class="muted small">Teacher to student, as the tradition records it. Looser links appear under Influenced by as “Studied with”.</p>`, 'wlineage')
  }
  function readLog() { const m = LS.get('works', {}); return m && typeof m === 'object' ? m : {} }
  function worksHTML(id, works) {
    if (!works?.length) return ''
    const m = readLog(), verb = (k) => (k === 'talk series' || k === 'talk' || k === 'retreat' ? 'Heard' : 'Read')
    return section('Works', `<div class="wworks">${works.map((w, i) => { const key = w.id || id + ':' + i, on = !!m[key]
      return `<article class="wwork"><div class="wwcover"><span class="wwk">${esc(w.kind ? w.kind[0].toUpperCase() + w.kind.slice(1) : 'Work')}${w.year ? ' · ' + esc(String(w.year)) : ''}</span><b${w.title.length > 34 || w.title.split(/\s+/).some((x) => x.length > 11) ? ' class="lg"' : ''}>${esc(w.title)}</b><i aria-hidden="true"></i></div>
        <button type="button" class="wwlog${on ? ' on' : ''}" data-work="${esc(key)}" data-verb="${verb(w.kind)}" aria-pressed="${on}">${on ? '\u2713 ' + verb(w.kind) : '+ ' + verb(w.kind)}</button></article>` }).join('')}</div><p class="muted small">Your reading log stays on this device.</p>`)
  }
  function bindWorks(el) {
    el.querySelectorAll('[data-work]').forEach((b) => (b.onclick = () => { const m = readLog(), k = b.dataset.work, on = !m[k]; if (on) m[k] = new Date().toISOString(); else delete m[k]; LS.set('works', m); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.textContent = (on ? '\u2713 ' : '+ ') + b.dataset.verb }))
  }
  function credit(id) {
    const im = portrait(id); if (!im) return ''
    const lic = im.licenseUrl ? `<a href="${esc(im.licenseUrl)}" target="_blank" rel="noopener license">${esc(im.license)}</a>` : esc(im.license)
    return `<p class="pcredit">Portrait: <a href="${esc(im.page)}" target="_blank" rel="noopener">${esc(im.artist)}</a>, ${lic}, via Wikimedia Commons</p>`
  }
  function topicCounts(list) { const n = {}; for (const c of list) for (const t of c.topics || []) if (!t.includes('/') && topicLabel(t)) n[t] = (n[t] || 0) + 1; return Object.entries(n).sort((a, b) => b[1] - a[1]) }
  const topicChips = (list, k = 10) => { const tc = topicCounts(list).slice(0, k); return tc.length ? `<div class="wtopics">${tc.map(([t, n]) => `<a class="wchip tp" href="#topic/${esc(t)}">${esc(topicLabel(t))}<small>${n}</small></a>`).join('')}</div>` : '' }

  // ---------- a teacher or figure ----------
  function paintPerson(el, id) {
    const p = P(id)
    if (!p) { el.innerHTML = `<a class="back" href="#teachers">\u2190 All teachers</a><div class="wempty"><h2>Not on Satsang yet</h2><p class="muted">We couldn\u2019t find that teacher. Browse the teachers and traditions instead.</p></div>`; return }
    const mine = best(by(id)), ab = best(about(id))
    const talks = viewable(mine), full = fullTalks(mine), abt = ab.filter((c) => servable(c))
    const im = portrait(id), still = !im ? firstStill(id) : ''
    const role = p.ro === 'scholar' ? 'Scholar' : p.k === 'speaker' ? 'Teacher' : p.k === 'text' ? 'Text' : 'Figure'
    const stats = talks.length + full.length + abt.length ? [[talks.length, 'Talks'], [full.length, 'Full talks'], [abt.length, 'Talks about'], [(p.works || []).length, 'Works']].filter(([v]) => v > 0) : []
    const tag = p.tagline || ''
    const canRound = ballotable([...mine, ...ab]).length >= 2
    el.innerHTML = `<a class="back" href="#teachers">\u2190 Teachers</a>
      <section class="whero${im ? ' hasportrait' : still ? ' hasstill' : ' plain'}">
        ${im ? `<div class="wportrait"><img src="${esc(im.src)}" alt="${esc(p.n)}" decoding="async"></div>` : still ? `<img class="wstill" src="${esc(still)}" alt="" decoding="async">` : `<div class="wmono" aria-hidden="true">${esc(initials(p.n))}</div>`}
        <div class="whin">
          <span class="eyebrow">${esc(role)} \u00b7 ${esc(tLabel(p.t))}</span>
          <h1>${esc(p.n)}</h1>
          ${p.years || p.living ? `<p class="wyears">${esc(p.years || '')}${p.living ? `<span class="wliving" title="No date of death on Wikidata">Living teacher</span>` : ''}</p>` : ''}
          ${tag ? `<p class="tag">${esc(tag)}</p>` : p.bio ? `<p class="tag">${esc(p.bio)}</p>` : ''}
          <div class="wchips">${chips(p.t)}</div>
          ${stats.length ? `<div class="stats">${stats.map(([v, l]) => `<div><b>${v}</b><span>${esc(l)}</span></div>`).join('')}</div>` : ''}
          <div class="wcta">${canRound ? `<button type="button" class="btn gold" data-round="${esc(id)}">Play a resonance round</button>` : ''}${p.links ? Object.entries(p.links).slice(0, 3).map(([k, u]) => `<a class="btn ghost" href="${esc(u)}" target="_blank" rel="noopener">${esc(k)}</a>`).join('') : ''}</div>
        </div>
      </section>${credit(id)}
      ${tag && p.bio ? section('About', `<p class="wbio">${esc(p.bio)}</p>${p.wd ? `<p class="muted small"><a href="https://www.wikidata.org/wiki/${esc(p.wd)}" target="_blank" rel="noopener">Wikidata</a></p>` : ''}`) : ''}
      ${worksHTML(id, p.works)}
      ${p.texts?.length ? `<section class="wsec"><div class="wsech"><h3>Free texts</h3><span class="muted small">${plural(p.texts.length, 'text')}</span></div><div class="pprog">${p.texts.map(essayCard).join('')}</div><p class="muted small">Links to free copies on the publisher\u2019s own site or public-domain editions. Nothing is copied here.</p></section>` : ''}
      ${!talks.length && !full.length && !abt.length && !(p.ro === 'scholar' || p.lo) ? `<section class="wsec"><p class="wsoon">${p.k === 'speaker' ? 'Talks are on their way.' : `Talks about ${esc(p.short || p.n)} are on their way. As teachers who speak about ${p.k === 'text' ? 'it' : 'them'} arrive, they appear here.`}</p></section>` : ''}
      ${rail(p.k === 'speaker' ? 'Talks by ' + (p.short || p.n) : 'Talks', talks)}
      ${rail('Full talks', full, '<span class="muted small">Over 20 minutes: watch whole, outside the pairs</span>')}
      ${rail('Talks about ' + (p.short || p.n), abt)}
      ${lineageHTML(id)}
      ${section('Studied under', relList(ACAD(p.by, true), 'by'))}
      ${section('Supervised', relList(ACAD(p.inf, true), 'inf'))}
      ${section('Influenced by', relList(ACAD(p.by, false), 'by'))}
      ${section('Influenced', relList(ACAD(p.inf, false), 'inf'))}
      <div data-practise="person:${esc(encodeURIComponent(id))}"></div>
      ${p.seek?.length ? section('For seekers of ' + (p.short || p.n), `<div class="wgrid">${p.seek.map((x) => personTile(x)).join('')}</div>`) : ''}`
    bindWorks(el)
    ctx.fillPlaces?.(el)
    el.querySelector('[data-round]')?.addEventListener('click', () => ctx.playRound(ballotable([...mine, ...ab])))
    scrollTo({ top: 0 })
  }

  // ---------- a tradition ----------
  function treeHTML(root, cur) {
    const node = (t, d) => { const x = T(t); if (!x) return ''
      const n = Object.values(W.people).filter((p) => p.t === t).length
      return `<li class="${t === cur ? 'on' : ''}"><a href="#tradition/${esc(t)}"><span>${esc(x.label)}</span>${n ? `<small>${n}</small>` : ''}</a>${x.kids?.length ? `<ul>${x.kids.map((k) => node(k, d + 1)).join('')}</ul>` : ''}</li>` }
    return `<ul class="wtree">${node(root, 0)}</ul>`
  }
  function paintTradition(el, id) {
    const t = T(id)
    if (!t) { el.innerHTML = `<a class="back" href="#traditions">\u2190 Traditions</a><div class="wempty"><h2>Tradition not found</h2></div>`; return }
    const sub = new Set(subtree(id)), fam = familyOf(id)
    const people = Object.entries(W.people).filter(([, p]) => sub.has(p.t)).map(([k]) => k)
    const founders = (t.founders || []).filter((x) => P(x) && !people.includes(x))
    const key = [...founders, ...people].sort((a, b) => (P(b).k === 'speaker') - (P(a).k === 'speaker') || by(b).length + about(b).length - by(a).length - about(a).length)
    const talks = best(clips().filter((c) => servable(c) && (sub.has(c.tradition) || (c.traditions || []).some((x) => sub.has(x)))))
    const own = talks.filter((c) => sub.has(c.tradition))
    const faces = key.filter((k) => portrait(k)).slice(0, 4)
    const parents = chain(id).slice(1).reverse()
    el.innerHTML = `<a class="back" href="#traditions">\u2190 Traditions</a>
      <section class="whero trad">
        ${faces.length ? `<div class="wcollage n${faces.length}">${faces.map((k) => `<img src="${esc(portrait(k).src)}" alt="" decoding="async">`).join('')}</div>` : `<div class="wmono t" aria-hidden="true">${esc(initials(t.label))}</div>`}
        <div class="whin">
          <span class="eyebrow">${esc(KIND[t.kind] || 'Tradition')}${parents.length ? ' \u00b7 ' + parents.map((x) => esc(tLabel(x))).join(' \u203a ') : ''}</span>
          <h1>${esc(t.label)}</h1>
          ${t.blurb ? `<p class="tag">${esc(t.blurb)}</p>` : ''}
          <div class="stats">${[[key.length, key.length === 1 ? 'Figure' : 'Figures'], [viewable(own).length, 'Talks'], [topicCounts(talks).length, 'Topics']].filter(([v]) => v > 0).map(([v, l]) => `<div><b>${v}</b><span>${esc(l)}</span></div>`).join('')}</div>
          <div class="wcta">${ballotable(own).length >= 2 ? `<button type="button" class="btn gold" data-round="1">Play a resonance round</button>` : ''}${t.wd ? `<a class="btn ghost" href="https://www.wikidata.org/wiki/${esc(t.wd)}" target="_blank" rel="noopener">Wikidata</a>` : ''}</div>
        </div>
      </section>
      <div class="wcols">
        ${section('Lineage', treeHTML(fam, id), 'tree')}
        <div class="wcolmain">
          ${key.length ? section('Key figures', `<div class="wgrid">${key.slice(0, 12).map((k) => personTile(k)).join('')}</div>`) : ''}
          ${section('Influenced by', relList(t.by, 'by'))}
          ${section('Influenced', relList(t.inf, 'inf'))}
          ${section('Top topics', topicChips(talks))}
        </div>
      </div>
      ${rail('Best talks', viewable(talks).slice(0, 16))}
      ${!talks.length ? `<section class="wsec"><p class="wsoon">Talks from ${esc(t.label)} are on their way.</p></section>` : ''}
      <div data-practise="tradition:${esc(encodeURIComponent(id))}"></div>`
    ctx.fillPlaces?.(el)
    el.querySelector('[data-round]')?.addEventListener('click', () => ctx.playRound(ballotable(own)))
    scrollTo({ top: 0 })
  }
  function traditionsHTML() {
    const fams = Object.entries(W.traditions).filter(([, t]) => t.kind === 'family')
    const stat = (id) => { const sub = new Set(subtree(id)); return { p: Object.values(W.people).filter((p) => sub.has(p.t)).length, c: clips().filter((c) => sub.has(c.tradition) && inBallot(c)).length } }
    return `<div class="wfams">${fams.map(([id, t]) => { const s = stat(id), faces = Object.entries(W.people).filter(([, p]) => subtree(id).includes(p.t) && p.img).slice(0, 3)
      return `<article class="wfam"><a class="wfamh" href="#tradition/${esc(id)}"><span class="wfaces">${faces.map(([k]) => face(k, 'sm')).join('')}</span><span><b>${esc(t.label)}</b><em>${[s.p ? plural(s.p, 'figure') : '', s.c ? plural(s.c, 'talk') : 'Talks arriving'].filter(Boolean).join(' \u00b7 ')}</em></span></a>
        ${t.blurb ? `<p>${esc(t.blurb)}</p>` : ''}
        <div class="wchips">${subtree(id).slice(1).map((k) => `<a class="wchip" href="#tradition/${esc(k)}">${esc(tLabel(k))}</a>`).join('')}</div></article>` }).join('')}</div>`
  }

  // ---------- a topic hub: takes by tradition, then everything Satsang holds on it (questions, traditions, essays, practices,
  // the Atlas thread, teachers, places, related topics) and an endless "Keep going" that walks into neighbouring topics ----------
  const textOf = (c) => `${c.segTitle || ''} ${c.title || ''} ${c.ytTitle || ''} ${c.talk || ''}`
  const rxOf = (s) => { try { return s ? new RegExp(s, 'i') : null } catch { return null } }
  function topicPool(topic) {
    const hub = H[topic] || {}, tags = hub.pool || [topic], prx = rxOf(hub.poolRx)
    return best(clips().filter((c) => servable(c) && ((c.topics || []).some((t) => tags.includes(t) || tags.includes(t.split('/')[0])) || (prx && prx.test(textOf(c))))))
  }
  function coTopics(list, topic) { // topics that travel with this one, most shared talks first
    const n = {}; for (const c of list) for (const t of c.topics || []) if (!t.includes('/') && t !== topic && topicLabel(t)) n[t] = (n[t] || 0) + 1
    return Object.entries(n).sort((a, b) => b[1] - a[1]).map(([t]) => t)
  }
  const essayCard = (e) => `<article class="pprg"><span>${esc([e.trad, e.site].filter(Boolean).join(' \u00b7 '))}</span><b>${esc(e.title)}</b>${e.note ? `<p>${esc(e.note)}</p>` : ''}${e.author ? `<em>${esc(e.author)}</em>` : ''}<a class="btn" href="${esc(e.url)}" target="_blank" rel="noopener">Read free \u2197</a></article>`
  const practiceCard = (x) => `<article class="pprg"><span>${esc(x.trad || 'Practice')}</span><b>${esc(x.name)}</b>${x.how ? `<p>${esc(x.how)}</p>` : ''}${x.src ? `<em>Source: ${esc(x.src)}</em>` : ''}${x.url ? `<a class="btn" href="${esc(x.url)}" target="_blank" rel="noopener">Open the source \u2197</a>` : ''}</article>`
  const threadCard = (x) => `<article class="pprg"><span>${esc(x.when || 'Undated')}</span><b>${x.person && P(x.id) ? `<a href="#teacher/${esc(x.id)}">${esc(x.label)}</a>` : esc(x.label)}</b>${x.note ? `<p>${esc(x.note)}</p>` : ''}<em>${esc(x.kind === 'text' ? 'Text' : x.kind === 'school' || x.kind === 'lineage' ? 'Movement' : 'Person')}</em></article>`
  function paintTopic(el, topic) {
    const order = (L) => (ctx.order ? ctx.order(L, topic) : L) // RANKING §2: MMR across traditions per sub-question rail
    const label = topicLabel(topic)
    if (!label) { el.innerHTML = `<a class="back" href="#topics">\u2190 Topics</a><div class="wempty"><h2>Topic not found</h2></div>`; return }
    const hub = H[topic] || null
    const tk = W.takes?.[topic] || { order: [], takes: {} }
    const on = best(clips().filter((c) => servable(c) && (c.topics || []).includes(topic)))
    const pool = topicPool(topic), poolV = viewable(pool), fullP = fullTalks(pool)
    // a take's tradition = the speaker's own tradition; columns key on the node the takes file names, or the clip's school
    const cols = new Map()
    const colOf = (c) => { const ch = chain(c.tradition); return tk.order.find((x) => ch.includes(x)) || ch[1] || ch[0] }
    for (const x of tk.order) cols.set(x, [])
    for (const c of on) { const k = colOf(c); if (!cols.has(k)) cols.set(k, []); cols.get(k).push(c) }
    for (const [k, l] of [...cols]) if (!l.length) { cols.delete(k); cols.set(k, l) } // traditions with talks first; 'Talks arriving' columns last
    const withTalks = [...cols].filter(([, l]) => l.length).length
    const heads = [...cols.keys()].map(tLabel).filter(Boolean)
    const facesOf = [...cols.keys()].map((k) => { const sub = new Set(subtree(k)); return Object.entries(W.people).filter(([, p]) => sub.has(p.t) && p.img).sort((a, b) => (b[1].k === 'figure') - (a[1].k === 'figure'))[0]?.[0] }).filter(Boolean).slice(0, 4)
    // questions: the hub's own, else the topic's leaves in the vocabulary
    const leafQs = [...new Set(pool.flatMap((c) => (c.topics || []).filter((t) => t.startsWith(topic + '/'))))].filter((t) => topicLabel(t)).map((t) => ({ id: t.split('/')[1], label: topicLabel(t), tag: t }))
    const qs = (hub?.questions || leafQs).map((q) => { const rx = rxOf(q.rx), L = poolV.filter((c) => (q.tag ? (c.topics || []).includes(q.tag) : rx && rx.test(textOf(c))) && (!q.fam || q.fam.includes(familyOf(c.tradition)))); return { ...q, list: L } }).filter((q) => q.list.length >= 2)
    // by tradition family
    const fam = new Map(); for (const c of poolV) { const f = familyOf(c.tradition); if (!fam.has(f)) fam.set(f, []); fam.get(f).push(c) }
    const fams = [...fam].sort((a, b) => b[1].length - a[1].length)
    // teachers: deep catalogues first; thin voices fold into one line
    const nOn = {}; for (const c of pool) if (c.speaker) nOn[c.speaker] = (nOn[c.speaker] || 0) + 1
    const spk = Object.keys(nOn).filter((id) => P(id)).sort((a, b) => nOn[b] - nOn[a])
    const deep = spk.filter(isDeep), thin = spk.filter((id) => !isDeep(id))
    const related = [...new Set([...(hub?.related || []), ...coTopics(pool, topic)])].filter((t) => t !== topic && topicLabel(t))
    const schools = [...new Set(pool.map((c) => c.tradition).filter((t) => T(t)))].slice(0, 6)
    const essays = hub?.essays || [], practices = hub?.practices || [], thread = hub?.thread || []
    const stats = [[poolV.length, 'Talks'], [fams.length, fams.length === 1 ? 'Tradition' : 'Traditions'], [deep.length + thin.length, 'Teachers'], [essays.length, 'Essays'], [practices.length, 'Practices']].filter(([v]) => v > 0)
    const jump = [qs.length && ['tq', 'Questions'], fams.length > 1 && ['tt', 'By tradition'], essays.length && ['te', 'Essays'], practices.length && ['tp', 'Practices'], thread.length && ['th', 'Through time'], deep.length && ['tw', 'Teachers'], ['tk', 'Keep going']].filter(Boolean)
    const qsec = (q) => `<section class="wsec"><div class="wsech"><h3>${esc(q.label)}</h3><span class="muted small">${plural(q.list.length, 'talk')}</span></div>${q.blurb ? `<p class="muted">${esc(q.blurb)}</p>` : ''}<div class="rail">${order(q.list).slice(0, 30).map((c) => clipTile(c, null, fmtDur(c))).join('')}</div></section>`
    el.innerHTML = `<a class="back" href="#topics">\u2190 Topics</a>
      <section class="whero wtopic">${facesOf.length ? `<div class="wcollage n${facesOf.length}">${facesOf.map((k) => `<img src="${esc(portrait(k).src)}" alt="" decoding="async">`).join('')}</div>` : ''}<div class="whin">
        <span class="eyebrow">${hub ? 'Topic' : 'Compare takes'}</span>
        <h1>${esc(label)}</h1>
        <p class="wsubs">${heads.map(esc).join(' <i>\u00b7</i> ')}</p>
        ${hub?.intro ? `<p class="tag">${esc(hub.intro)}</p>` : ''}
        ${stats.length > 1 ? `<div class="stats">${stats.map(([v, l]) => `<div><b>${v}</b><span>${esc(l)}</span></div>`).join('')}</div>` : ''}
        <div class="wcta">${ballotable(on).length >= 2 ? `<button type="button" class="btn gold" data-compare="1">Compare two takes</button><button type="button" class="btn ghost" data-feed="1">Play this topic</button>` : ''}</div>
        ${withTalks < 2 && on.length ? `<p class="muted small">Talks from one tradition so far. Compare two takes pairs different teachers until more traditions arrive.</p>` : ''}
        ${jump.length > 2 ? `<div class="wchips">${jump.map(([id, l]) => `<a class="wchip" href="#topic/${esc(topic)}" data-jump="${id}">${esc(l)}</a>`).join('')}</div>` : ''}
      </div></section>
      <div class="wtakes">${[...cols].map(([k, l]) => { const line = tk.takes?.[k]
        return `<article class="wtake${l.length ? '' : ' soon'}"><a class="wtakeh" href="#tradition/${esc(k)}"><span class="eyebrow">${esc(KIND[T(k)?.kind] || 'Tradition')}</span><b>${esc(tLabel(k))}</b></a>
          ${line ? `<p class="wline">${esc(line)}</p>` : ''}
          ${l.length ? `<div class="wtk">${viewable(l).slice(0, 3).map((c) => `<a class="wtkc" href="#watch/${encodeURIComponent(c.id)}"><img src="${esc(thumb(c.id))}" alt="" loading="lazy"><span><b>${esc(c.segTitle || c.title)}</b><em>${esc(P(c.speaker)?.short || c.teacher || c.comic || '')} \u00b7 ${c.delivery === 'reading' ? 'Reading \u00b7 ' : c.delivery === 'footage' ? 'Footage \u00b7 ' : ''}${fmtDur(c)}</em></span></a>`).join('')}</div><p class="muted small">${plural(l.length, 'talk')}</p>` : '<p class="wsoon">Talks arriving</p>'}</article>` }).join('')}</div>
      ${line2(tk)}
      ${qs.length ? `<div id="tq"></div>${qs.map(qsec).join('')}` : rail('All talks on ' + label, poolV.slice(0, 24))}
      ${fams.length > 1 ? `<div id="tt"></div>${fams.map(([f, L]) => `<section class="wsec"><div class="wsech"><h3><a href="#tradition/${esc(f)}">${esc(label)} in ${esc(tLabel(f))}</a></h3><span class="muted small">${plural(L.length, 'talk')}</span></div><div class="rail">${L.slice(0, 30).map((c) => clipTile(c, null, fmtDur(c))).join('')}</div></section>`).join('')}` : ''}
      ${fullP.length ? rail('Full talks on ' + label, fullP, '<span class="muted small">Over 20 minutes: watch whole, outside the pairs</span>') : ''}
      ${essays.length ? `<section class="wsec" id="te"><div class="wsech"><h3>Essays and texts</h3><span class="muted small">${plural(essays.length, 'text')}</span></div><div class="pprog">${essays.map(essayCard).join('')}</div><p class="muted small">Links to free copies on the publisher\u2019s own site or public-domain editions. Nothing is copied here.</p></section>` : ''}
      ${practices.length ? `<section class="wsec" id="tp"><div class="wsech"><h3>Practices</h3><span class="muted small">${plural(practices.length, 'practice')}</span></div><div class="pprog">${practices.map(practiceCard).join('')}</div><p class="muted small">Satsang\u2019s short summaries; each links to its source. Practices with an empowerment or a teacher in their tradition are marked so.</p></section>` : ''}
      ${thread.length ? `<section class="wsec" id="th"><div class="wsech"><h3>${esc(hub.threadLabel || label)} through time</h3><span class="muted small">${plural(thread.length, 'holder')} across the traditions, oldest first</span></div><div class="pprog">${thread.map(threadCard).join('')}</div></section>` : ''}
      ${deep.length ? `<section class="wsec" id="tw"><div class="wsech"><h3>Teachers to go deeper with</h3></div><div class="wgrid">${deep.slice(0, 12).map((id) => personTile(id, `${plural(nOn[id], 'talk')} on ${label} \u00b7 ${plural(by(id).length, 'talk')} in all`)).join('')}</div>
        ${thin.length ? `<p class="muted small" style="margin-top:14px">More voices</p><div class="wtopics">${thin.map((id) => `<a class="wchip" href="#teacher/${esc(id)}">${esc(P(id).n)}<small>${nOn[id]}</small></a>`).join('')}</div>` : ''}</section>` : ''}
      ${schools.length ? `<div data-practise="trads:${esc(encodeURIComponent(schools.join(',')))}"></div>` : ''}
      ${related.length ? section('Related topics', `<div class="wtopics">${related.slice(0, 12).map((t) => `<a class="wchip tp" href="#topic/${esc(t)}">${esc(topicLabel(t))}${H[t] ? ' \u2726' : ''}</a>`).join('')}</div>`) : ''}
      <div id="tk"></div><div data-more></div>
      <section class="wsec"><div class="wcta"><button type="button" class="btn ghost" data-keepgoing="1">Keep going</button></div><p class="muted small" data-next></p></section>`
    el.querySelector('[data-compare]')?.addEventListener('click', () => ctx.compare(topic, ballotable(on), colOf))
    el.querySelector('[data-feed]')?.addEventListener('click', () => ctx.playTopic(topic))
    el.querySelectorAll('[data-jump]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); el.querySelector('#' + a.dataset.jump)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }))
    // Keep going: each press opens the next neighbouring topic (its best talks not already on this page), then that topic's
    // own neighbours join the queue, so the walk never runs dry while the library has topics left
    const shown = new Set(poolV.map((c) => c.id)), queue = [...related], seen = new Set([topic])
    const nextT = () => { while (queue.length && seen.has(queue[0])) queue.shift(); return queue[0] || null }
    const say = () => { const n = nextT(), p = el.querySelector('[data-next]'); if (p) p.textContent = n ? `Next: ${topicLabel(n)}` : 'You have walked every topic on Satsang.' }
    say()
    el.querySelector('[data-keepgoing]')?.addEventListener('click', () => {
      const t = nextT(); if (!t) return say()
      seen.add(t); queue.shift()
      const L = topicPool(t), fresh = viewable(L).filter((c) => !shown.has(c.id)).slice(0, 24)
      fresh.forEach((c) => shown.add(c.id))
      for (const x of [...(H[t]?.related || []), ...coTopics(L, t)]) if (!seen.has(x) && !queue.includes(x)) queue.push(x)
      const box = document.createElement('div')
      box.innerHTML = `<section class="wsec"><div class="wsech"><h3>${esc(label)} \u2192 ${esc(topicLabel(t))}</h3><a class="muted small" href="#topic/${esc(t)}">Open ${esc(topicLabel(t))} \u2192</a></div>${fresh.length ? `<div class="rail">${fresh.map((c) => clipTile(c, null, fmtDur(c))).join('')}</div>` : '<p class="muted">Every talk here is already on this page.</p>'}${H[t]?.essays?.length ? `<div class="pprog" style="margin-top:14px">${H[t].essays.slice(0, 3).map(essayCard).join('')}</div>` : ''}</section>`
      el.querySelector('[data-more]').append(...box.children); say()
    })
    ctx.fillPlaces?.(el)
    scrollTo({ top: 0 })
  }
  const line2 = (tk) => (tk.order?.length ? '<p class="muted small wnote">Each tradition\u2019s line is Satsang\u2019s own short summary of its classic position. The talks speak for themselves.</p>' : '')

  return { labels: () => HL, traditions: () => W?.traditions || {}, isDeep, DEEP_MIN, hub: (t) => H[t] || null, talksBy: (id) => viewable(best(by(id))), talksAbout: (id) => best(about(id)).filter((c) => servable(c)), fmtDur, subtree, load, ready: () => !!W, people: () => W?.people || {}, paintPerson, paintTradition, paintTopic, traditionsHTML, person: P, tradition: T, chain, familyOf, face, personTile, topicCounts }
}
