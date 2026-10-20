// Wiser Place layer: monasteries, retreat centres, ashrams, temples, pilgrimage and study sites (data/wisegraph/places.json).
//   #places            map (Leaflet + OSM, attribution shown) + filters (family / type / country) + list; Goenka centres are a
//                      clustered layer you switch on; places without a public point (e.g. Hillside Hermitage) are list-only
//   #place/<id>        a place profile: tradition, founder + lineage, official site, directions, contact (as published, with
//                      source + checked date), programmes (official schedule link, no dates), free books, teachers + their talks
//   #country/<code>    a country: its places on a map, traditions, Goenka centres
// Also fills "Where to practise" (+ Contact / Free books) on teacher and tradition profiles (see wise.js data-practise).
// Metadata only: nothing is rehosted; every programme and resource links to the organisation's own page.

const TYPE = { monastery: 'Monastery', 'retreat-centre': 'Retreat centre', ashram: 'Ashram', temple: 'Temple', pilgrimage: 'Pilgrimage site', 'study-centre': 'Study centre', centre: 'Centre', 'sacred-site': 'Sacred site', 'meeting-house': 'Meeting house', organisation: 'Organisation', bookshop: 'Bookshop' }
const TYPES = Object.keys(TYPE)
const GK_LINE = 'A centre in S. N. Goenka\u2019s Vipassana network, running 10-day silent residential courses on a donation basis.'

export function createPlaces(ctx) {
  const { esc, wise, clipTile } = ctx
  let D = null, DP = null, GEO = null, GP = null, MAPMOD = null
  const load = () => (DP ||= Promise.all([
    fetch('data/wisegraph/places.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    wise().ready() ? null : wise().load(),
  ]).then(([j]) => { D = j && j.places ? j : { places: [], countries: {} }; index(); return D }))
  const ready = () => !!D && wise().ready()
  const geo = () => (GP ||= fetch('/geo.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((g) => (GEO = g && isFinite(g.lat) ? g : null)).catch(() => null))
  const mapmod = () => (MAPMOD ||= import(/* @vite-ignore */ ctx.mapUrl()))
  let BY = {}
  function index() {
    BY = Object.fromEntries(D.places.map((p) => [p.id, p]))
    for (const p of D.places) p.fam = famOf(p)
  }
  const W = () => wise()
  const famOf = (p) => W().familyOf(p.traditions[0])
  const tLabel = (t) => W().tradition(t)?.label || t
  const pName = (id) => W().person(id)?.short || W().person(id)?.n || id
  let DN = null
  const cName = (code) => { try { DN ||= new Intl.DisplayNames(['en'], { type: 'region' }); return DN.of(code) || code } catch { return D?.countries?.[code]?.name || code } }
  const plural = (n, a, b = a + 's') => `${n} ${n === 1 ? a : b}`
  const km = (a, b) => { const R = 6371, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lng - a.lng) * r, x = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)) }
  const fmtKm = (d) => (d < 10 ? '< 10 km' : d < 1000 ? `${Math.round(d / 10) * 10} km` : `${(Math.round(d / 100) * 100).toLocaleString('en')} km`)
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u } }
  const directions = (p) => p.lat != null ? `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}` : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([p.name, p.city, cName(p.country)].filter(Boolean).join(', '))}`
  const where = (p) => [p.city && !p.city.startsWith(cName(p.country)) ? p.city.replace(new RegExp('^' + cName(p.country) + ',\\s*'), '') : '', cName(p.country)].filter(Boolean).join(', ')
  const desc = (p) => p.description || (p.goenka ? GK_LINE : '')
  const ext = (u, label, cls = 'btn ghost') => `<a class="${cls}" href="${esc(u)}" target="_blank" rel="noopener">${esc(label)}</a>`

  // lineage of a place: its first teacher's teacher_of chain upward (founder and the line behind them)
  function lineUp(id, max = 6) { const out = [id]; let x = id; for (let g = 0; g < max; g++) { const t = (W().person(x)?.by || []).find(([y, ty]) => ty === 'teacher_of' && W().person(y)); if (!t || out.includes(t[0])) break; out.unshift(t[0]); x = t[0] } return out }
  const chainHTML = (ids, cur) => `<div class="plin">${ids.map((i, k) => `${k ? '<i aria-hidden="true">\u2192</i>' : ''}<a href="#teacher/${esc(i)}"${i === cur ? ' class="on"' : ''}>${esc(pName(i))}</a>`).join('')}</div>`

  // ---------- filters + list ----------
  const F = { fam: '', type: '', country: '', goenka: false, mode: 'map', q: '' }
  let MAP = null, PICK = null
  function visible() {
    return D.places.filter((p) => (!p.goenka || F.goenka || F.mode === 'list' && F.country) && (!F.fam || p.fam === F.fam) && (!F.type || p.type === F.type) && (!F.country || p.country === F.country)
      && (!F.q || (p.name + ' ' + (p.city || '') + ' ' + cName(p.country) + ' ' + p.traditions.map(tLabel).join(' ')).toLowerCase().includes(F.q.toLowerCase())))
  }
  function card(p, dist, rel) {
    return `<a class="pcard${p.lat == null ? ' nopin' : ''}" href="#place/${esc(p.id)}" data-pid="${esc(p.id)}"><span class="pdot f-${esc(p.fam)}${p.goenka ? ' gk' : ''}"></span><span class="pct"><b>${esc(p.name)}</b><em>${rel ? esc(rel) + ' \u00b7 ' : ''}${esc(TYPE[p.type] || p.type)} \u00b7 ${esc(where(p))}</em><small>${esc(p.traditions.map(tLabel).join(' \u00b7 '))}${p.lat == null ? ' \u00b7 not on the map' : ''}${dist != null ? ' \u00b7 ' + fmtKm(dist) : ''}</small></span></a>`
  }
  function panelHTML(p) {
    if (!p) return `<div class="ppempty"><span class="eyebrow">Places</span><p>Tap a point to see the place, its lineage and how to go on retreat there.</p></div>`
    const t0 = p.teachers?.[0], line = t0 ? lineUp(t0) : []
    return `<button type="button" class="ppx" data-close aria-label="Close">\u00d7</button>
      <span class="eyebrow">${esc(TYPE[p.type] || p.type)} \u00b7 ${esc(cName(p.country))}</span>
      <h3><a href="#place/${esc(p.id)}">${esc(p.name)}</a></h3>
      <p class="ppw">${esc(where(p))}${p.founded ? ` \u00b7 since ${esc(String(p.founded))}` : ''}</p>
      <div class="wchips">${p.traditions.map((t) => `<a class="wchip" href="#tradition/${esc(t)}">${esc(tLabel(t))}</a>`).join('')}</div>
      ${desc(p) ? `<p class="ppd">${esc(desc(p))}</p>` : ''}
      ${line.length > 1 ? `<div class="pps"><span class="eyebrow">Lineage</span>${chainHTML(line, t0)}</div>` : t0 ? `<div class="pps"><span class="eyebrow">Founded by / tied to</span><div class="plin">${p.teachers.map((i) => `<a href="#teacher/${esc(i)}">${esc(pName(i))}</a>`).join('<i>\u00b7</i>')}</div></div>` : ''}
      ${p.retreats?.length ? `<div class="pps"><span class="eyebrow">Retreats</span>${p.retreats.slice(0, 3).map((r) => `<div class="ppr"><b>${esc(r.name)}</b>${r.typical_length ? `<em>${esc(r.typical_length)}</em>` : ''}${r.schedule_url ? `<a href="${esc(r.schedule_url)}" target="_blank" rel="noopener">Official schedule \u2197</a>` : ''}</div>`).join('')}</div>` : ''}
      <div class="wcta">${`<a class="btn gold" href="#place/${esc(p.id)}">Open place</a>`}${p.url ? ext(p.url, 'Official site') : ''}</div>`
  }
  function bindPanel(el) {
    el.querySelector('[data-close]')?.addEventListener('click', () => { PICK = null; MAP?.pick(null); el.innerHTML = panelHTML(null); el.classList.remove('open') })
  }
  function paintIndex(el) {
    const famIds = [...new Set(D.places.filter((p) => !p.goenka).map((p) => p.fam))]
    const famN = (f) => D.places.filter((p) => !p.goenka && p.fam === f).length
    const curatedN = D.places.filter((p) => !p.goenka).length, gkN = D.places.filter((p) => p.goenka).length
    const countries = Object.keys(D.countries).sort((a, b) => cName(a).localeCompare(cName(b)))
    el.innerHTML = `<div class="head"><h2>Places</h2><div class="wseg" role="tablist" aria-label="Map or list"><a role="tab" href="#places" data-mode="map" class="${F.mode === 'map' ? 'on' : ''}">Map</a><a role="tab" href="#places" data-mode="list" class="${F.mode === 'list' ? 'on' : ''}">List</a></div></div>
      <p class="muted lede">${curatedN} monasteries, retreat centres, ashrams and pilgrimage sites across the traditions, plus ${gkN} Goenka Vipassana centres. Retreats link to each place\u2019s own schedule.</p>
      <div class="pfilters">
        <div class="pfam" role="group" aria-label="Tradition family"><button type="button" data-fam="" class="${!F.fam ? 'on' : ''}">All</button>${famIds.map((f) => `<button type="button" data-fam="${esc(f)}" class="${F.fam === f ? 'on' : ''}"><span class="pdot f-${esc(f)}"></span>${esc(tLabel(f).replace(/ traditions?$/, ''))}<small>${famN(f)}</small></button>`).join('')}</div>
        <div class="psel">
          <label><span>Type</span><select data-f="type"><option value="">Every type</option>${TYPES.map((t) => `<option value="${t}"${F.type === t ? ' selected' : ''}>${TYPE[t]}</option>`).join('')}</select></label>
          <label><span>Country</span><select data-f="country"><option value="">Every country</option>${countries.map((c) => `<option value="${c}"${F.country === c ? ' selected' : ''}>${esc(cName(c))}</option>`).join('')}</select></label>
          <label class="pq"><span>Search</span><input type="search" data-f="q" value="${esc(F.q)}" placeholder="Name, town, lineage" autocomplete="off"></label>
          <label class="ptog"><input type="checkbox" data-f="goenka"${F.goenka ? ' checked' : ''}><span class="sw" aria-hidden="true"></span><span>Goenka centres <small>${gkN}</small></span></label>
        </div>
      </div>
      <div class="pmapwrap"${F.mode === 'list' ? ' hidden' : ''}><div class="pmap" id="pmap" role="region" aria-label="Map of places"></div><aside class="ppanel" id="ppanel" aria-live="polite">${panelHTML(PICK && BY[PICK])}</aside></div>
      <p class="muted small pnote" id="pnote"></p>
      <div class="plist" id="plist"></div>
      <section class="wsec"><div class="wsech"><h3>By country</h3></div><div class="pcountries">${Object.entries(D.countries).slice(0, 40).map(([c, x]) => `<a class="wchip" href="#country/${esc(c)}">${esc(cName(c))}<small>${x.places}</small></a>`).join('')}</div></section>
      <p class="muted small">Map data \u00a9 OpenStreetMap contributors. Places from Wikidata, OpenStreetMap, the dhamma.org directory and each place\u2019s own site. A teacher listed at a place founded it or taught there; it is not a claim about who teaches there now.</p>`
    const list = el.querySelector('#plist'), note = el.querySelector('#pnote'), panel = el.querySelector('#ppanel')
    const refresh = (refit) => {
      const v = visible(), pinned = v.filter((p) => p.lat != null), unpinned = v.filter((p) => p.lat == null && !p.goenka)
      if (F.mode === 'map') {
        note.textContent = `${plural(pinned.length, 'place')} on the map${unpinned.length ? ` \u00b7 ${plural(unpinned.length, 'place')} without a public map point, listed below` : ''}`
        const show = [...pinned.filter((p) => !p.goenka), ...unpinned].sort((a, b) => (a.lat == null) - (b.lat == null) || a.name.localeCompare(b.name))
        const cap = innerWidth < 700 ? 24 : 60
        list.innerHTML = show.length ? `<div class="pgrid">${show.slice(0, cap).map((p) => card(p)).join('')}</div>${show.length > cap ? `<p class="muted small">Showing ${cap} of ${show.length}. Narrow the filters or switch to List.</p>` : ''}` : '<p class="wsoon">No places match these filters yet.</p>'
        if (MAP) { MAP.setData(v.map(pin), F.goenka); if (refit) MAP.fit(v.filter((p) => p.lat != null && (F.goenka || !p.goenka)).map((p) => p.id), F.country ? 8 : 6) }
      } else {
        note.textContent = plural(v.length, 'place')
        const by = {}; for (const p of v) (by[p.country] ||= []).push(p)
        list.innerHTML = v.length ? Object.keys(by).sort((a, b) => by[b].length - by[a].length || cName(a).localeCompare(cName(b))).map((c) => `<section class="wsec"><div class="wsech"><h3><a href="#country/${esc(c)}">${esc(cName(c))}</a></h3><span class="muted small">${plural(by[c].length, 'place')}</span></div><div class="pgrid">${by[c].sort((a, b) => !!a.goenka - !!b.goenka || a.name.localeCompare(b.name)).map((p) => card(p)).join('')}</div></section>`).join('') : '<p class="wsoon">No places match these filters yet.</p>'
      }
    }
    el.querySelectorAll('[data-fam]').forEach((b) => (b.onclick = () => { F.fam = b.dataset.fam; el.querySelectorAll('[data-fam]').forEach((x) => x.classList.toggle('on', x === b)); refresh(true) }))
    el.querySelectorAll('[data-f]').forEach((i) => (i.oninput = () => { F[i.dataset.f] = i.type === 'checkbox' ? i.checked : i.value; refresh(i.dataset.f !== 'q') }))
    el.querySelectorAll('[data-mode]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); if (F.mode === a.dataset.mode) return; F.mode = a.dataset.mode; paintIndex(el) }))
    bindPanel(panel)
    refresh(false)
    if (F.mode === 'map') mapmod().then(({ mountMap }) => {
      if (!el.isConnected || !el.querySelector('#pmap')) return
      MAP?.destroy?.()
      MAP = mountMap(el.querySelector('#pmap'), { places: visible().map(pin), goenka: F.goenka, fit: 'none', onPick: (id) => { PICK = id; MAP.pick(id); panel.innerHTML = panelHTML(BY[id]); panel.classList.add('open'); bindPanel(panel) } })
      const v = visible().filter((p) => p.lat != null)
      if (F.fam || F.country || F.type || F.goenka) MAP.fit(v.map((p) => p.id), F.country ? 8 : 6); else MAP.fit(v.filter((p) => !p.goenka).map((p) => p.id), 3)
      if (PICK) MAP.pick(PICK)
    }).catch((e) => { console.warn('map', e); el.querySelector('#pmap').innerHTML = '<p class="wsoon">The map could not load. The list below has every place.</p>' })
  }
  const pin = (p) => ({ id: p.id, lat: p.lat, lng: p.lng, name: p.name, fam: p.fam, goenka: !!p.goenka })

  // ---------- one place ----------
  function contactHTML(p, title = 'Contact') {
    const c = p.contact
    if (!c && !p.url) return ''
    const src = (u) => `<a class="psrc" href="${esc(u)}" target="_blank" rel="noopener">source</a>`
    const rows = []
    if (p.url) rows.push(`<div class="pcr"><span>Official site</span><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(host(p.url))}</a></div>`)
    if (c?.page) rows.push(`<div class="pcr"><span>Contact page</span><a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(host(c.page))}</a>${src(c.page_src)}</div>`)
    for (const [v, u] of c?.email || []) rows.push(`<div class="pcr"><span>Email</span><a href="mailto:${esc(v)}">${esc(v)}</a>${src(u)}</div>`)
    for (const [v, u] of c?.phone || []) rows.push(`<div class="pcr"><span>Phone</span><a href="tel:${esc(v.replace(/[^\d+]/g, ''))}">${esc(v)}</a>${src(u)}</div>`)
    const addr = c?.address?.[0]
    rows.push(`<div class="pcr"><span>Address</span><span class="pcv">${esc(addr || where(p))}${addr ? src(c.address[1]) : ''}</span><a class="pdir" href="${esc(directions(p))}" target="_blank" rel="noopener">Directions \u2197</a></div>`)
    return `<section class="wsec"><div class="wsech"><h3>${esc(title)}</h3></div><div class="pcontact">${rows.join('')}</div>${c ? `<p class="muted small">As published on the organisation\u2019s own site, checked ${esc(c.checked)}. Please check there before you travel.</p>` : ''}</section>`
  }
  function resourcesHTML(list, title = 'Free books') {
    if (!list?.length) return ''
    return `<section class="wsec"><div class="wsech"><h3>${esc(title)}</h3></div><div class="pres">${list.map((r) => `<a class="pre" href="${esc(r.url)}" target="_blank" rel="noopener"><span class="eyebrow">Free \u00b7 ${esc(host(r.url))}</span><b>${esc(r.title)}</b>${r.licence ? `<em>${esc(r.licence)}</em>` : ''}<small>Checked ${esc(r.checked || '')}</small></a>`).join('')}</div></section>`
  }
  function nearby(p, n = 6, sameFam = true) {
    if (p.lat == null) return []
    return D.places.filter((q) => q.id !== p.id && q.lat != null && !q.goenka && (!sameFam || q.fam === p.fam)).map((q) => [q, km(p, q)]).sort((a, b) => a[1] - b[1]).slice(0, n)
  }
  function paintPlace(el, id) {
    const p = BY[id]
    if (!p) { el.innerHTML = `<a class="back" href="#places">\u2190 Places</a><div class="wempty"><h2>Place not found</h2><p class="muted">Browse the map instead.</p></div>`; return }
    const t0 = p.teachers?.[0], line = t0 ? lineUp(t0) : []
    const talks = [], seen = new Set()
    for (const t of p.teachers || []) for (const c of [...W().talksBy(t), ...W().talksAbout(t)]) if (!seen.has(c.id)) { seen.add(c.id); talks.push(c) }
    const near = nearby(p)
    const stats = [[p.founded, 'Founded'], [p.retreats?.length || 0, p.retreats?.length === 1 ? 'Programme' : 'Programmes'], [(p.teachers || []).length, (p.teachers || []).length === 1 ? 'Teacher' : 'Teachers']].filter(([v]) => v)
    el.innerHTML = `<a class="back" href="#places">\u2190 Places</a>
      <section class="whero pplace">
        <div class="pherom" id="pherom"></div>
        <div class="whin">
          <span class="eyebrow">${esc(TYPE[p.type] || p.type)} \u00b7 <a href="#country/${esc(p.country)}">${esc(cName(p.country))}</a></span>
          <h1>${esc(p.name)}</h1>
          <p class="wyears">${esc(where(p))}</p>
          ${desc(p) ? `<p class="tag">${esc(desc(p))}</p>` : ''}
          <div class="wchips">${p.traditions.flatMap((t) => W().chain(t).reverse()).filter((x, i, a) => a.indexOf(x) === i).map((t) => `<a class="wchip${p.traditions.includes(t) ? ' on' : ''}" href="#tradition/${esc(t)}">${esc(tLabel(t))}</a>`).join('')}</div>
          ${stats.length ? `<div class="stats">${stats.map(([v, l]) => `<div><b>${esc(String(v))}</b><span>${esc(l)}</span></div>`).join('')}</div>` : ''}
          <div class="wcta">${p.url ? ext(p.url, 'Official site', 'btn gold') : ''}${p.retreats?.[0]?.schedule_url ? ext(p.retreats[0].schedule_url, 'Retreat schedule') : ''}${ext(directions(p), 'Directions')}</div>
          ${p.lat == null ? `<p class="muted small">${p.id === 'hillside-hermitage' ? 'The hermitage does not publish its location, so it is not on the map.' : 'No verified map point yet, so this place is listed but not on the map.'}</p>` : ''}
        </div>
      </section>
      ${p.retreats?.length ? `<section class="wsec"><div class="wsech"><h3>Retreats and programmes</h3></div><div class="pprog">${p.retreats.map((r) => `<article class="pprg"><b>${esc(r.name)}</b>${r.typical_length ? `<span>${esc(r.typical_length)}</span>` : ''}${r.format ? `<p>${esc(r.format)}</p>` : ''}${r.cost_model ? `<em>${esc(r.cost_model)}</em>` : ''}${r.schedule_url ? `<a class="btn ghost" href="${esc(r.schedule_url)}" target="_blank" rel="noopener">Official schedule \u2197</a>` : ''}</article>`).join('')}</div><p class="muted small">Dates and fees live on the official schedule; Wiser keeps only the link.</p></section>` : ''}
      ${line.length > 1 ? `<section class="wsec"><div class="wsech"><h3>Lineage</h3></div>${chainHTML(line, t0)}</section>` : ''}
      ${p.teachers?.length ? `<section class="wsec"><div class="wsech"><h3>Founded by or taught here</h3></div><div class="wgrid">${p.teachers.map((t) => W().personTile(t)).join('')}</div></section>` : ''}
      ${talks.length ? `<section class="wsec"><div class="wsech"><h3>Talks by teachers of ${esc(p.name)}</h3></div><div class="rail">${talks.slice(0, 24).map((c) => clipTile(c, null, W().fmtDur(c))).join('')}</div></section>` : ''}
      ${p.events?.length ? `<section class="wsec"><div class="wsech"><h3>Gatherings and festivals</h3></div><div class="pprog">${p.events.map((e) => `<article class="pprg"><b>${esc(e.name)}</b>${e.when ? `<span>${esc(e.when)}</span>` : ''}${e.note ? `<p>${esc(e.note)}</p>` : ''}${e.url ? `<a class="btn ghost" href="${esc(e.url)}" target="_blank" rel="noopener">Official page \u2197</a>` : ''}</article>`).join('')}</div><p class="muted small">The usual time of year only; dates live on the official page.</p></section>` : ''}
      ${(() => { const L = (p.sisters || []).map(([id, ty]) => [D.places.find((q) => q.id === id), ty]).filter(([q]) => q); const SL = { branch_of: 'Mother house', branch: 'Branch', sister_of: 'Sister place' }
        return L.length ? `<section class="wsec"><div class="wsech"><h3>Sister places</h3><span class="muted small">Its mother house, branches and sister communities</span></div><div class="pgrid">${L.map(([q, ty]) => card(q, null, SL[ty])).join('')}</div></section>` : '' })()}
      ${contactHTML(p)}
      ${resourcesHTML(p.resources)}
      ${near.length ? `<section class="wsec"><div class="wsech"><h3>Nearby in the same family</h3></div><div class="pgrid">${near.map(([q, d]) => card(q, d)).join('')}</div></section>` : ''}
      <p class="muted small">${p.wikidata ? `<a href="https://www.wikidata.org/wiki/${esc(p.wikidata)}" target="_blank" rel="noopener">Wikidata</a> \u00b7 ` : ''}${p.coord_precision && p.lat != null ? `Map point: ${esc(p.coord_precision)} \u00b7 ` : ''}Map data \u00a9 OpenStreetMap contributors</p>`
    scrollTo({ top: 0 })
    if (p.lat != null) mapmod().then(({ mountMap }) => {
      const m = el.querySelector('#pherom'); if (!m) return
      const pts = [p, ...near.map(([q]) => q)]
      const mm = mountMap(m, { places: pts.map(pin), fit: 'none', scroll: false, onPick: (i) => { if (i !== p.id) location.hash = 'place/' + i } })
      mm.map.setView([p.lat, p.lng], 9); mm.pick(p.id)
    }).catch(() => {})
  }

  // ---------- a country ----------
  function paintCountry(el, code) {
    code = String(code || '').toUpperCase()
    const c = D.countries[code], v = D.places.filter((p) => p.country === code)
    if (!c || !v.length) { el.innerHTML = `<a class="back" href="#places">\u2190 Places</a><div class="wempty"><h2>No places here yet</h2></div>`; return }
    const types = {}; for (const p of v) (types[p.type] ||= []).push(p)
    const trads = Object.entries(c.traditions || {}).filter(([t]) => W().tradition(t))
    el.innerHTML = `<a class="back" href="#places">\u2190 Places</a>
      <section class="whero pplace pcountry"><div class="pherom" id="pherom"></div><div class="whin">
        <span class="eyebrow">Country</span><h1>${esc(cName(code))}</h1>
        <div class="stats">${[[v.filter((p) => !p.goenka).length, 'Places'], [c.goenka || 0, 'Goenka centres'], [c.goenka_sites || 0, 'Other course sites'], [trads.length, 'Traditions']].filter(([x]) => x).map(([x, l]) => `<div><b>${x}</b><span>${esc(l)}</span></div>`).join('')}</div>
        <div class="wchips">${trads.slice(0, 12).map(([t, n]) => `<a class="wchip" href="#tradition/${esc(t)}">${esc(tLabel(t))}<small>${n}</small></a>`).join('')}</div>
      </div></section>
      ${TYPES.filter((t) => types[t]).sort((a, b) => (a === 'retreat-centre' && types[a].every((p) => p.goenka)) - (b === 'retreat-centre' && types[b].every((p) => p.goenka))).map((t) => `<section class="wsec"><div class="wsech"><h3>${esc(TYPE[t])}${types[t].length > 1 ? 's' : ''}</h3><span class="muted small">${types[t].length}</span></div><div class="pgrid">${types[t].sort((a, b) => !!a.goenka - !!b.goenka || a.name.localeCompare(b.name)).map((p) => card(p)).join('')}</div></section>`).join('')}
      ${c.goenka_sites ? `<p class="muted small">dhamma.org also lists ${plural(c.goenka_sites, 'non-centre course site')} in ${esc(cName(code))}; see <a href="https://www.dhamma.org/en/locations/directory" target="_blank" rel="noopener">its directory</a>.</p>` : ''}
      <p class="muted small">Map data \u00a9 OpenStreetMap contributors</p>`
    scrollTo({ top: 0 })
    mapmod().then(({ mountMap }) => {
      const m = el.querySelector('#pherom'); if (!m) return
      const mm = mountMap(m, { places: v.map(pin), goenka: true, fit: 'none', scroll: false, onPick: (i) => { location.hash = 'place/' + i } })
      mm.fit(v.filter((p) => p.lat != null).map((p) => p.id), 7)
    }).catch(() => {})
  }

  // ---------- "Where to practise" on teacher / tradition profiles ----------
  function practise(kind, id) {
    let tied = [], pool = []
    if (kind === 'person') {
      const p = W().person(id); if (!p) return null
      tied = D.places.filter((q) => (q.teachers || []).includes(id))
      let node = p.t
      for (let g = 0; g < 3 && node; g++) { const sub = new Set(W().subtree(node)); pool = D.places.filter((q) => q.traditions.some((t) => sub.has(t)) && !tied.includes(q)); if (pool.length >= 3 || W().tradition(node)?.kind === 'family') break; node = W().tradition(node)?.parent }
    } else if (kind === 'trads') { // a topic hub: the schools its talks come from (comma list)
      const sub = new Set(id.split(',').flatMap((t) => (W().tradition(t) ? W().subtree(t) : [])))
      pool = D.places.filter((q) => q.traditions.some((t) => sub.has(t)))
    } else {
      const sub = new Set(W().subtree(id)); pool = D.places.filter((q) => q.traditions.some((t) => sub.has(t)))
    }
    return { tied, pool }
  }
  async function fill(root) {
    const slots = [...root.querySelectorAll('[data-practise]')]; if (!slots.length) return
    if (!D) await load()
    const g = await Promise.race([geo(), new Promise((r) => setTimeout(() => r(null), 900))])
    for (const s of slots) {
      const [kind, id] = s.dataset.practise.split(':'), r = practise(kind, decodeURIComponent(id))
      if (!r || !(r.tied.length + r.pool.length)) { s.remove(); continue }
      const dist = (q) => (g && q.lat != null ? km(g, q) : null)
      const order = (L) => [...L].sort((a, b) => (dist(a) ?? 1e9) - (dist(b) ?? 1e9) || !!a.goenka - !!b.goenka || (a.lat == null) - (b.lat == null) || a.name.localeCompare(b.name))
      const list = [...order(r.tied), ...order(r.pool.filter((q) => !q.goenka || g))].slice(0, 6)
      const label = kind === 'person' ? (W().person(id)?.short || W().person(id)?.n) : kind === 'trads' ? 'these traditions' : tLabel(id)
      const extra = []
      if (kind === 'person') { // Contact + Free books from the organisation the teacher founded or taught at
        const org = r.tied.find((q) => q.contact) || null, res = r.tied.flatMap((q) => q.resources || [])
        if (org) extra.push(contactHTML(org, 'Contact: ' + org.name))
        if (res.length) extra.push(resourcesHTML(res))
      }
      s.outerHTML = `<section class="wsec"><div class="wsech"><h3>Where to practise</h3><a class="muted small" href="#places">All places \u2192</a></div><div class="pgrid">${list.map((q) => card(q, dist(q))).join('')}</div><p class="muted small">${g ? 'Nearest first, from your approximate location (never stored).' : kind === 'trads' ? 'Places of the traditions these talks come from.' : `Places of ${esc(label)}\u2019s lineage.`} Programmes link to each place\u2019s own schedule.</p></section>${extra.join('')}`
    }
  }

  function paint(el) {
    const h = location.hash
    if (!ready()) { el.innerHTML = '<div class="railskel"><i></i><i></i><i></i></div>'; load().then(() => paint(el)); return }
    if (MAP && !/^#places/.test(h)) { MAP.destroy(); MAP = null }
    const mp = h.match(/^#place\/(.+)$/), mc = h.match(/^#country\/(.+)$/)
    if (mp) return paintPlace(el, decodeURIComponent(mp[1]))
    if (mc) return paintCountry(el, decodeURIComponent(mc[1]))
    return paintIndex(el)
  }
  return { load, paint, fill, ready }
}
