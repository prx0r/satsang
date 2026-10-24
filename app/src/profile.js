// The practitioner profile (specs/PROFILE.md): device-first store (saves, practice log, journeys, flash signals) synced
// anonymously through the API (who = d:<device>), and the #me page: "What resonates with you", saved, journeys in
// progress, practice log, history, export and delete. Private by default; nothing here is public. Dark design classes only.
import { BASE as SITE_BASE } from '../../domain.mjs'

export function createProfile(d) {
  // d: { esc, LS, api(path, opts), apiOn(), device(), toast, taste(), tasteJSON(t), wise(), byId(id), thumb, clipTile, fmtDur,
  //      collections(), practice(id), label(t), resonates(), signedIn(), votes() }
  const { esc, LS } = d
  const arr = (k) => { const a = LS.get(k, []); return Array.isArray(a) ? a : [] }
  const obj = (k) => { const o = LS.get(k, {}); return o && typeof o === 'object' && !Array.isArray(o) ? o : {} }
  const now = () => new Date().toISOString()
  const post = (path, body) => (d.apiOn() ? d.api(path, { method: 'POST', body: { device: d.device(), ...body } }).catch(() => null) : Promise.resolve(null))

  // ---------- saves ----------
  const saves = () => arr('saves')
  const has = (ref) => saves().some((s) => s.ref === ref && !s.list)
  function toggleSave(ref, on) {
    const L = saves().filter((s) => !(s.ref === ref && !s.list)), want = on == null ? !has(ref) : on
    if (want) L.unshift({ ref, list: '', at: now() })
    LS.set('saves', L.slice(0, 2000)); post('/saves', { ref, list: '', on: want })
    return want
  }
  // ---------- practice log ----------
  const practiceLog = () => arr('practice')
  function logPractice(e) {
    const rec = { id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), at: now(), ...e }
    LS.set('practice', [rec, ...practiceLog()].slice(0, 2000)); post('/practice/log', { entries: [rec] })
    return rec
  }
  // ---------- journeys ----------
  const journeys = () => obj('journeys')
  function journey(id) { return journeys()[id] || null }
  function setJourney(id, patch) {
    const J = journeys(), j = J[id] || { started: now(), unit: 1, done: [], paused: false }
    if (patch === null) { delete J[id]; LS.set('journeys', J); post(`/journeys/${encodeURIComponent(id)}/progress`, { left: true }); return null }
    Object.assign(j, patch, { updated: now() }); J[id] = j; LS.set('journeys', J)
    post(`/journeys/${encodeURIComponent(id)}/progress`, { unit: j.unit, done: j.done, paused: !!j.paused, started: j.started })
    return j
  }
  // ---------- sync (anonymous device or account) ----------
  let syncing = null
  function sync() {
    if (!d.apiOn() || syncing) return syncing || Promise.resolve()
    syncing = d.api('/profile/sync?device=' + encodeURIComponent(d.device())).then((r) => {
      if (!r || r.error) return
      const S = saves(), have = new Set(S.map((s) => s.ref + '|' + s.list)), remote = new Set()
      for (const s of r.saves || []) { remote.add(s.ref + '|' + s.list); if (!have.has(s.ref + '|' + s.list)) S.push({ ref: s.ref, list: s.list, at: s.created_at }) }
      LS.set('saves', S)
      const pushS = S.filter((s) => !remote.has(s.ref + '|' + s.list)); if (pushS.length) post('/saves', { items: pushS.slice(0, 200).map((s) => ({ ref: s.ref, list: s.list, at: s.at, on: true })) })
      const P = practiceLog(), pid = new Set(P.map((p) => p.id)), rid = new Set((r.practice || []).map((p) => p.id))
      for (const p of r.practice || []) if (!pid.has(p.id)) P.push({ ...p, note: p.note || undefined })
      P.sort((a, b) => String(b.at).localeCompare(String(a.at))); LS.set('practice', P)
      const pushP = P.filter((p) => !rid.has(p.id)); if (pushP.length) post('/practice/log', { entries: pushP.slice(0, 200) })
      const J = journeys()
      for (const j of r.journeys || []) { const l = J[j.collection]; if (!l || String(j.updated_at || '') > String(l.updated || '')) J[j.collection] = { started: j.started, unit: j.unit, done: [...new Set([...(l?.done || []), ...j.done])], paused: j.paused, updated: j.updated_at } }
      LS.set('journeys', J)
      if (r.intentions) d.intentions?.().merge(r.intentions); else if (LS.get('intentions', null)?.updated) d.intentions?.().merge({ items: [], updated: '' })
      for (const [id, j] of Object.entries(J)) if (!(r.journeys || []).some((x) => x.collection === id)) post(`/journeys/${encodeURIComponent(id)}/progress`, { unit: j.unit, done: j.done, paused: !!j.paused, started: j.started })
    }).catch(() => {}).finally(() => (syncing = null))
    return syncing
  }
  let tT = null
  function pushTaste() { if (!d.apiOn()) return; clearTimeout(tT); tT = setTimeout(() => { const t = d.taste(); if (t?.n) d.api('/taste', { method: 'PUT', body: { device: d.device(), ...d.tasteJSON(t) } }).catch(() => {}) }, 4000) }

  // ---------- export / delete ----------
  function exportLocal() {
    const t = d.taste()
    return { schema: SITE_BASE + '/schema/profile.json', exported: now(), who: 'device', taste: t ? d.tasteJSON(t) : null, saves: saves(), practice: practiceLog(), journeys: journeys(),
      votes: d.votes().map((v) => ({ a: v.a, b: v.b, winner: v.winner, context: v.context || null, at: v.createdAt })), resonates: Object.entries(d.resonates()).map(([clip, x]) => ({ clip, ...x })),
      works: LS.get('works', {}), notForMe: obj('notForMe'), intentions: LS.get('intentions', null), feed: { less: arr('feedLess'), more: arr('feedMore'), seen: obj('feedSeen') }, visibility: { profile: 'private', taste: 'private', practice: 'private', curations: 'private' } }
  }
  function download() {
    const blob = new Blob([JSON.stringify(exportLocal(), null, 2)], { type: 'application/json' }), a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 'wiser-profile.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 500)
    const P = practiceLog(); if (P.length) { const csv = 'at,practice,minutes,quality,note\n' + P.map((p) => [p.at, p.practice, p.minutes, p.quality || '', JSON.stringify(p.note || '')].join(',')).join('\n'); const b2 = new Blob([csv], { type: 'text/csv' }), a2 = document.createElement('a'); a2.href = URL.createObjectURL(b2); a2.download = 'wiser-practice-log.csv'; document.body.appendChild(a2); a2.click(); setTimeout(() => { URL.revokeObjectURL(a2.href); a2.remove() }, 500) }
  }
  async function forget() {
    for (const k of ['saves', 'practice', 'journeys', 'flashNone', 'flashSkips', 'notForMe', 'votes', 'resonates', 'partials', 'passes', 'skips', 'skipped', 'seen', 'shown', 'queue', 'watches', 'works', 'intentions', 'feedLess', 'feedMore', 'feedSeen']) localStorage.removeItem('wiser.' + k)
    if (d.apiOn() && !d.signedIn()) await d.api('/me/forget-device', { method: 'POST', body: { device: d.device() } }).catch(() => {})
  }

  // ---------- the #me page ----------
  function paint(el) {
    const W = d.wise(), T = (id) => W.tradition?.(id), t = d.taste()
    const trad = t ? t.top('traditions', 8).filter(([id]) => T(id)) : [], top = t ? t.top('topics', 6).filter(([id]) => d.label(id)) : [], tea = t ? t.top('teachers', 6).filter(([id]) => W.person?.(id)) : []
    const fams = Object.entries(W.traditions?.() || {}).filter(([, x]) => x.kind === 'family').map(([id]) => id)
    const exploring = t && t.n >= 3 ? t.exploring(fams.length ? fams : ['buddhism', 'hindu', 'christian', 'sufism', 'platonic', 'esoteric'], 3).filter(([id]) => T(id)) : []
    const nm = (id) => T(id)?.label || id
    const sentence = trad.length || top.length ? `You lean towards ${listify(trad.slice(0, 2).map(([id]) => nm(id)))}${top.length ? `${trad.length ? ', and towards talks on ' : 'talks on '}${listify(top.slice(0, 2).map(([id]) => d.label(id).toLowerCase()))}` : ''}.` : ''
    const S = saves(), clipsSaved = S.filter((s) => s.ref.startsWith('clip:')).map((s) => d.byId(s.ref.slice(5))).filter(Boolean)
    const pracSaved = S.filter((s) => s.ref.startsWith('practice:')).map((s) => d.practice(s.ref.slice(9))).filter(Boolean)
    const colSaved = S.filter((s) => s.ref.startsWith('collection:')).map((s) => d.collections().find((c) => c.id === s.ref.slice(11))).filter(Boolean)
    const res = Object.keys(d.resonates()).map((id) => d.byId(id)).filter(Boolean)
    const J = journeys(), cols = d.collections(), jin = Object.entries(J).map(([id, j]) => ({ c: cols.find((x) => x.id === id), j })).filter((x) => x.c)
    const P = practiceLog(), week = weekDots(P), mins = P.reduce((s, p) => s + (Number(p.minutes) || 0), 0), month = P.filter((p) => String(p.at).slice(0, 7) === now().slice(0, 7)).length
    const picks = d.votes().length
    el.innerHTML = `<div class="head"><h2>You</h2></div>
      <p class="muted lede">What Satsang has learned from your picks, and what you keep. Private: only this device${d.signedIn() ? ' and your account' : ''} can see it.</p>
      <section class="wsec"><div class="wsech"><h3>What resonates with you</h3><span class="muted small">${picks ? picks + (picks === 1 ? ' pick' : ' picks') : ''}</span></div>
        ${trad.length || top.length ? `<p class="wsubs">${esc(sentence)}</p>
        <div class="wtopics">${trad.map(([id]) => chip('traditions', id, nm(id), `#tradition/${id}`)).join('')}${top.map(([id]) => chip('topics', id, d.label(id), `#topic/${id}`)).join('')}${tea.map(([id]) => chip('teachers', id, W.person(id)?.short || W.person(id)?.n, `#teacher/${id}`)).join('')}</div>
        ${exploring.length ? `<p class="muted small" style="margin-top:14px">Still exploring</p><div class="wtopics">${exploring.map(([id]) => `<a class="wchip" href="#tradition/${esc(id)}">${esc(nm(id))}</a>`).join('')}</div>` : ''}
        <p class="muted small" style="margin-top:12px"><button type="button" class="linkbtn" data-reset="1">Reset my taste</button></p>`
        : `<p class="muted">After a few picks in the Topic flash, the traditions and topics that resonate with you appear here.</p><p><a class="btn gold" href="#">Start a Topic flash</a></p>`}</section>
      ${d.intentions ? d.intentions().section() : ''}
      ${jin.length ? `<section class="wsec"><div class="wsech"><h3>Journeys in progress</h3></div><div class="pprog">${jin.map(({ c, j }) => `<article class="pprg"><span>${esc(KIND[c.kind] || 'Collection')} \u00b7 ${j.done.length} of ${c.units.length} done</span><b>${esc(c.title)}</b><p>${esc(c.units.find((u) => !j.done.includes(u.n))?.title || 'Finished')}</p><a class="btn" href="#collection/${esc(c.id)}">${j.done.length >= c.units.length ? 'Look back' : 'Resume'}</a></article>`).join('')}</div></section>` : ''}
      <section class="wsec"><div class="wsech"><h3>Practice</h3><span class="muted small">${P.length ? `${month} ${month === 1 ? 'sit' : 'sits'} this month \u00b7 ${fmtH(mins)} in all` : ''}</span></div>
        ${P.length ? `<p class="fl-week" aria-label="Days practised this week">${week.map((x) => `<span class="${x.on ? 'on' : ''}" title="${esc(x.d)}">${esc(x.l)}</span>`).join('')}</p>
        <div class="pprog">${P.slice(0, 9).map((p) => { const pr = d.practice(p.practice); return `<article class="pprg"><span>${esc(dayLabel(p.at))} \u00b7 ${Math.round(p.minutes)} min</span><b>${pr ? `<a href="#practice/${esc(pr.id)}">${esc(pr.name)}</a>` : esc(p.practice)}</b>${p.note ? `<p>${esc(p.note)}</p>` : ''}</article>` }).join('')}</div>`
        : `<p class="muted">Sits you time with a practice are logged here, on this device. No streaks to lose.</p><p><a class="hbtn" href="#collections">Practices and journeys</a></p>`}</section>
      ${clipsSaved.length || res.length ? `<section class="wsec"><div class="wsech"><h3>Saved talks</h3><span class="muted small">${clipsSaved.length + res.filter((c) => !clipsSaved.includes(c)).length}</span></div><div class="rail">${[...clipsSaved, ...res.filter((c) => !clipsSaved.includes(c))].slice(0, 40).map((c) => d.clipTile(c, null, d.fmtDur(c))).join('')}</div></section>` : ''}
      ${pracSaved.length || colSaved.length ? `<section class="wsec"><div class="wsech"><h3>Saved practices and collections</h3></div><div class="pprog">${colSaved.map((c) => `<article class="pprg"><span>${esc(KIND[c.kind] || 'Collection')}</span><b>${esc(c.title)}</b><a class="btn" href="#collection/${esc(c.id)}">Open</a></article>`).join('')}${pracSaved.map((p) => `<article class="pprg"><span>${esc(p.tradLabel || 'Practice')}</span><b>${esc(p.name)}</b><a class="btn" href="#practice/${esc(p.id)}">Open</a></article>`).join('')}</div></section>` : ''}
      <section class="wsec"><div class="wsech"><h3>History</h3></div><p><a class="hbtn" href="#history">Every pick and talk you watched</a></p></section>
      <section class="wsec"><div class="wsech"><h3>Your data</h3></div>
        <p class="muted">Everything above lives on this device${d.apiOn() ? ' and is kept in sync anonymously (no account, no email) so it survives a cleared browser' : ''}. Download it whole, or delete it whole.</p>
        <p class="fl-acts" style="justify-content:flex-start"><button type="button" class="hbtn" data-dl="1">Download my data</button><button type="button" class="hbtn" data-del="1">Delete everything</button></p></section>`
    el.querySelectorAll('[data-nfm]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); const N = obj('notForMe'); N[b.dataset.nfm] = true; LS.set('notForMe', N); d.onTaste?.(); paint(el); d.toast('Noted. Less of that.') }))
    el.querySelector('[data-reset]')?.addEventListener('click', () => { if (!confirm('Reset your taste? Your picks stay in your history; Satsang forgets what it learned from them.')) return; LS.set('tasteReset', now()); d.onTaste?.(); paint(el) })
    d.intentions?.().bind(el, () => paint(el))
    el.querySelector('[data-dl]')?.addEventListener('click', download)
    el.querySelector('[data-del]')?.addEventListener('click', async () => { if (!confirm('Delete your taste, saves, practice log, journeys and history from this device' + (d.apiOn() ? ' and from Satsang\u2019s servers' : '') + '? This cannot be undone.')) return; await forget(); d.onTaste?.(); paint(el); d.toast('Deleted.') })
  }
  const KIND = { set: 'Set', journey: 'Journey', 'meditation-series': 'Meditation series', 'visualisation-cycle': 'Visualisation cycle', syllabus: 'Syllabus', 'mini-course': 'Series' }
  const chip = (f, id, label, href) => `<a class="wchip tp" href="${esc(href)}">${esc(label)}<button type="button" class="fl-nfm" data-nfm="${esc(f + ':' + id)}" aria-label="Not for me" title="Not for me">\u00d7</button></a>`
  const listify = (a) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1])
  const fmtH = (m) => (m >= 90 ? `${Math.round(m / 6) / 10} hours` : `${Math.round(m)} minutes`)
  const dayLabel = (iso) => { try { return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) } catch { return String(iso).slice(0, 10) } }
  function weekDots(P) {
    const days = new Set(P.map((p) => { const x = new Date(p.at); return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}` })), out = [], t = new Date()
    for (let i = 6; i >= 0; i--) { const x = new Date(t); x.setDate(t.getDate() - i); out.push({ l: x.toLocaleDateString(undefined, { weekday: 'narrow' }), d: x.toDateString(), on: days.has(`${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`) }) }
    return out
  }
  return { saves, has, toggleSave, practiceLog, logPractice, journeys, journey, setJourney, sync, pushTaste, exportLocal, download, forget, paint }
}
