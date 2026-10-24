// LLM- and crawler-readable places (run by deploy.sh build, after esbuild, before site/ is copied to dist/).
// Reads site/data/wisegraph/places.json (+ wise.json for names/labels, wisegraph/redflags.json, site/data/events.json) and writes:
//   site/data/wisegraph/places-index.json      slim list for the map/list (the SPA loads this instead of the 600 KB file)
//   site/data/wisegraph/place/<id>.json        one full record per place (+ upcoming events), fetched when a place opens
//   site/_p/place/<id>.html                    static page served at /place/<id> (schema.org JSON-LD: PlaceOfWorship/Organization,
//                                              PostalAddress, GeoCoordinates, Event); links back to the app (/#place/<id>)
//   site/_p/places.html, site/_p/places/<tradition>.html, site/_p/places/country/<cc>.html   listing pages (/places, ...)
//   site/_p/sitemap-places.xml                 every page above (served at /sitemap-places.xml, listed in sitemap.xml)
// The worker (web-worker/worker.js) serves /_p/* from KV (embed.mjs prefixes); nothing here is rehosted content: contacts are
// exactly as each place publishes them, with their source page and check date.
import fs from 'node:fs'
import path from 'node:path'
import { BASE, NAME } from '../../domain.mjs'

const APP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const rd = (p, d) => { try { return JSON.parse(fs.readFileSync(path.join(APP, p), 'utf8')) } catch { return d } }
const D = rd('site/data/wisegraph/places.json'), W = rd('site/data/wisegraph/wise.json', { people: {}, traditions: {} })
const RF = rd('wisegraph/redflags.json', { records: [] }).records, EV = rd('site/data/events.json', { places: {}, meta: {} })
const TODAY = new Date().toISOString().slice(0, 10)
const e = (x) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const P = D.places, BY = Object.fromEntries(P.map((p) => [p.id, p]))
const T = W.traditions || {}, PEOPLE = W.people || {}
const tl = (t) => T[t]?.label || t.replace(/-/g, ' ')
const chain = (t) => { const out = []; let x = t; const seen = new Set(); while (x && T[x] && !seen.has(x)) { seen.add(x); out.unshift(x); x = T[x].parent } return out.length ? out : [t] }
const family = (t) => chain(t)[0]
const pn = (id) => PEOPLE[id]?.n || id.replace(/-/g, ' ')
let DN; const cname = (c) => D.countries?.[c]?.name || (() => { try { DN ||= new Intl.DisplayNames(['en'], { type: 'region' }); return DN.of(c) } catch { return c } })()
const TYPE = { monastery: 'Monastery', 'retreat-centre': 'Retreat centre', ashram: 'Ashram', temple: 'Temple', pilgrimage: 'Pilgrimage site', 'study-centre': 'Study centre', centre: 'Centre', 'sacred-site': 'Sacred site', 'meeting-house': 'Meeting house', organisation: 'Organisation', hermitage: 'Hermitage', bookshop: 'Bookshop' }
const WORSHIP = /^(monastery|temple|ashram|meeting-house|hermitage|pilgrimage|sacred-site)$/
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u } }
const dir = (p) => p.lat != null ? `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}` : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([p.name, p.city, cname(p.country)].filter(Boolean).join(', '))}`
const osm = (p) => p.lat != null ? `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=14/${p.lat}/${p.lng}` : null
const safetyOf = (pid) => RF.filter((r) => r.subject === 'person/' + pid)
const checkedOf = (p) => [p.contact?.checked, p.verified_on, EV.places?.[p.id]?.fetched_at?.slice(0, 10)].filter(Boolean).sort().pop() || D.meta?.built || TODAY
const upcoming = (id) => (EV.places?.[id]?.events || []).filter((x) => Date.parse(x.end || x.start) >= Date.now() - 864e5)

// ---------- shards + index ----------
const shardDir = path.join(APP, 'site/data/wisegraph/place'); fs.rmSync(shardDir, { recursive: true, force: true }); fs.mkdirSync(shardDir, { recursive: true })
// practice offers (SERVE-SPEC 5.8): residential retreats, 10-day courses, retreats, courses, classes, drop-in classes, meditation, satsang, guest stays, online, ordination
const PRACTICE_OFFER = /^(residential retreats|10-day courses|retreats|courses|classes|drop-in classes|meditation( classes)?|satsang|guest stays|online|ordination)$/i
const idx = []
for (const p of P) {
  const ev = EV.places?.[p.id]
  fs.writeFileSync(path.join(shardDir, p.id + '.json'), JSON.stringify({ ...p, ...(ev ? { upcoming: upcoming(p.id), upcoming_meta: { fetched_at: ev.fetched_at, sources: ev.sources, stale: !!ev.stale } } : {}) }))
  idx.push(JSON.parse(JSON.stringify({ id: p.id, name: p.name, type: p.type, traditions: p.traditions, country: p.country, city: p.city, lat: p.lat, lng: p.lng,
    teachers: p.teachers?.length ? p.teachers : undefined, goenka: p.goenka || undefined, founded: p.founded || undefined, url: p.url || undefined,
    hc: p.contact ? 1 : undefined, hr: p.resources?.length ? 1 : undefined, nr: p.retreats?.length || undefined, ne: upcoming(p.id).length || undefined, po: (p.offers || []).some((o) => PRACTICE_OFFER.test(o)) ? 1 : undefined })))  // po: a practice offer (the enquiry lens keeps pilgrimage/sacred-site/bookshop/university places only with one)
}
fs.writeFileSync(path.join(APP, 'site/data/wisegraph/places-index.json'), JSON.stringify({ meta: { ...D.meta, shards: 'data/wisegraph/place/<id>.json' }, countries: D.countries, places: idx }))

// ---------- html ----------
const CSS = 'body{margin:0;background:#0a0d14;color:#efe9dd;font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}main{max-width:760px;margin:0 auto;padding:36px 22px 60px}a{color:#e9b764}.brand{font:600 20px/1 Georgia,serif;letter-spacing:.18em;color:#e9b764;text-decoration:none}nav.crumb{font-size:13px;color:#929aab;margin:22px 0 0}nav.crumb a{color:#929aab}h1{font-size:32px;line-height:1.2;margin:10px 0 6px;font-family:Georgia,serif;font-weight:500}h2{font:500 20px/1.3 Georgia,serif;margin:30px 0 8px;color:#e9b764}h3{font:500 17px/1.3 Georgia,serif;margin:20px 0 4px}.muted{color:#929aab;font-size:14px}.btn{display:inline-block;margin:6px 8px 6px 0;padding:9px 14px;border:1px solid #e9b764;border-radius:8px;text-decoration:none}dl{display:grid;grid-template-columns:max-content 1fr;gap:6px 16px;font-size:15px;margin:14px 0}dt{color:#929aab}dd{margin:0;overflow-wrap:anywhere}ul{padding-left:20px}li{margin:4px 0;overflow-wrap:anywhere}.src{font-size:12px;color:#929aab;margin-left:6px}.note{border-left:3px solid #e9b764;padding:6px 12px;background:#121722;font-size:14px}.cols{columns:2 240px}@media(max-width:480px){dl{grid-template-columns:1fr;gap:0 0}dt{margin-top:8px}h1{font-size:27px}}'
const page = (title, desc, canon, ld, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)}</title><meta name="theme-color" content="#0a0d14"><meta name="description" content="${e(desc)}"><link rel="canonical" href="${canon}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(desc)}"><meta property="og:url" content="${canon}"><meta property="og:type" content="website"><link rel="alternate" type="application/json" href="${BASE}/data/wisegraph/places-index.json"><style>${CSS}</style>${ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>` : ''}</head><body><main><a class="brand" href="/">${e(NAME.toUpperCase())}</a>
${body}
<p class="muted" style="margin-top:40px">${e(NAME)} is an open directory of the world\u2019s wisdom traditions. Place data: CC BY 4.0 (Satsang curation; contacts as each place publishes them). <a href="/places">All places</a> \u00b7 <a href="/data/places.json">Open data</a> \u00b7 <a href="/llms.txt">llms.txt</a> \u00b7 <a href="/agents">MCP for agents</a></p></main></body></html>`
const crumbs = (items) => `<nav class="crumb" aria-label="Breadcrumb">${items.map(([u, t]) => (u ? `<a href="${u}">${e(t)}</a>` : e(t))).join(' \u203a ')}</nav>`
const crumbLd = (items) => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([u, t], i) => ({ '@type': 'ListItem', position: i + 1, name: t, ...(u ? { item: BASE + u } : {}) })) })
const when = (x) => { const s = String(x.start), d = s.slice(0, 10), t = /T\d\d:\d\d/.test(s) ? s.slice(11, 16) : ''; const en = x.end ? String(x.end).slice(0, 10) : ''; return `${d}${t ? ' ' + t : ''}${en && en !== d ? ' \u2013 ' + en : ''}${t && x.tz ? ' (' + x.tz + ')' : ''}` }

const out = path.join(APP, 'site/_p'); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(path.join(out, 'place'), { recursive: true }); fs.mkdirSync(path.join(out, 'places/country'), { recursive: true })
const urls = []
for (const p of P) {
  const canon = `${BASE}/place/${encodeURIComponent(p.id)}`, c = p.contact || {}, ev = upcoming(p.id), evm = EV.places?.[p.id]
  const fam = family(p.traditions[0] || ''), tch = (p.teachers || []).filter(Boolean)
  const addr = c.address?.[0] || null, where = [p.city, cname(p.country)].filter(Boolean).join(', ')
  const desc = p.description || (p.goenka ? 'A centre in S. N. Goenka\u2019s Vipassana network, running 10-day silent residential courses on a donation basis.' : `${TYPE[p.type] || 'Place'} of the ${p.traditions.map(tl).join(' / ')} tradition in ${where}.`)
  const cr = [['/', NAME], ['/places', 'Places'], [`/places/${fam}`, tl(fam)], ...(p.traditions[0] && p.traditions[0] !== fam ? [[`/places/${p.traditions[0]}`, tl(p.traditions[0])]] : []), [null, p.name]]
  const safety = tch.flatMap((t) => safetyOf(t).map((r) => [t, r]))
  const ld = { '@context': 'https://schema.org', '@graph': [JSON.parse(JSON.stringify({
    '@type': [WORSHIP.test(p.type) ? 'PlaceOfWorship' : 'Place', 'Organization'], '@id': canon, url: canon, name: p.name, description: desc,
    sameAs: [p.url, p.wikidata ? `https://www.wikidata.org/wiki/${p.wikidata}` : null].filter(Boolean),
    address: { '@type': 'PostalAddress', ...(addr ? { streetAddress: addr } : {}), ...(p.city ? { addressLocality: p.city } : {}), addressCountry: p.country },
    geo: p.lat != null ? { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lng } : undefined, hasMap: osm(p) || undefined,
    email: c.email?.[0]?.[0], telephone: c.phone?.[0]?.[0], foundingDate: p.founded ? String(p.founded) : undefined,
    founder: tch.length ? tch.map((t) => ({ '@type': 'Person', name: pn(t), url: `${BASE}/person/${t}` })) : undefined,
    knowsAbout: p.traditions.map((t) => ({ '@type': 'DefinedTerm', name: tl(t), url: `${BASE}/tradition/${t}` })),
    event: ev.length ? ev.slice(0, 30).map((x) => ({ '@type': 'Event', name: x.name, startDate: x.start, endDate: x.end, url: x.url || x.source, eventAttendanceMode: x.online ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
      location: x.online ? { '@type': 'VirtualLocation', url: x.url || x.source } : { '@type': 'Place', name: x.location || p.name, address: { '@type': 'PostalAddress', addressLocality: p.city, addressCountry: p.country } }, organizer: { '@type': 'Organization', name: p.name, url: p.url || canon } })) : undefined,
    dateModified: checkedOf(p) })), crumbLd(cr)] }
  const row = (k, v) => (v ? `<dt>${e(k)}</dt><dd>${v}</dd>` : '')
  const src = (u) => (u ? `<a class="src" href="${e(u)}" rel="noopener">source</a>` : '')
  const lineage = (() => { if (!tch[0] || !PEOPLE[tch[0]]?.by) return ''; const L = [tch[0]]; let x = tch[0]; for (let g = 0; g < 6; g++) { const b = (PEOPLE[x]?.by || []).find(([y, ty]) => ty === 'teacher_of' && PEOPLE[y]); if (!b || L.includes(b[0])) break; L.unshift(b[0]); x = b[0] } return L.length > 1 ? L.map((t) => `<a href="/person/${e(t)}">${e(pn(t))}</a>`).join(' \u2192 ') : '' })()
  const sis = (p.sisters || []).map((s) => (Array.isArray(s) ? s : [s])).filter(([id]) => BY[id])
  const body = `${crumbs(cr)}
<h1>${e(p.name)}</h1>
<p class="muted">${e(TYPE[p.type] || p.type)} \u00b7 ${e(where)}${p.founded ? ` \u00b7 founded ${e(p.founded)}` : ''}</p>
<p>${e(desc)}</p>
<a class="btn" href="/#place/${e(p.id)}">Open in the Satsang app</a>${p.url ? `<a class="btn" href="${e(p.url)}" rel="noopener">Official site</a>` : ''}<a class="btn" href="${e(dir(p))}" rel="noopener">Directions</a>
<h2>At a glance</h2><dl>
${row('Tradition', chain(p.traditions[0] || '').map((t) => `<a href="/places/${e(t)}">${e(tl(t))}</a>`).join(' \u203a '))}
${row(p.traditions.length > 1 ? 'Schools' : 'School', p.traditions.map((t) => `<a href="/tradition/${e(t)}">${e(tl(t))}</a>`).join(', '))}
${row('Founded by or taught here', tch.map((t) => `<a href="/person/${e(t)}">${e(pn(t))}</a>`).join(', '))}
${row('Lineage', lineage)}
${row('Address', `${e(addr || where)}${addr ? src(c.address[1]) : ''}`)}
${row('Map', p.lat != null ? `<a href="${e(osm(p))}" rel="noopener">${(+p.lat).toFixed(4)}, ${(+p.lng).toFixed(4)}</a> <span class="muted">(${e(p.coord_precision || 'map point')})</span>` : '<span class="muted">No public map point</span>')}
${row('Website', p.url ? `<a href="${e(p.url)}" rel="noopener">${e(host(p.url))}</a>` : '')}
${row('Contact page', c.page ? `<a href="${e(c.page)}" rel="noopener">${e(host(c.page))}</a>` : '')}
${row('Email', (c.email || []).map(([v, u]) => `<a href="mailto:${e(v)}">${e(v)}</a>${src(u)}`).join('<br>'))}
${row('Phone', (c.phone || []).map(([v, u]) => `<a href="tel:${e(v.replace(/[^\d+]/g, ''))}">${e(v)}</a>${src(u)}`).join('<br>'))}
${row('Languages', (Array.isArray(p.language) ? p.language : p.language ? [p.language] : []).map(e).join(', '))}
${row('Offerings', (p.offers || []).map(e).join(', '))}
${row('Network', p.goenka ? 'dhamma.org (S. N. Goenka)' : '')}
${row('Last checked', e(checkedOf(p)))}
</dl>${c.checked ? `<p class="muted">Contacts are exactly as published on the organisation\u2019s own site, checked ${e(c.checked)}. Please confirm there before you travel; do not use them for bulk mail.</p>` : ''}
${p.retreats?.length ? `<h2>Retreats and programmes</h2><ul>${p.retreats.map((r) => `<li><b>${e(r.name)}</b>${r.typical_length ? ` \u00b7 ${e(r.typical_length)}` : ''}${r.format ? ` \u00b7 ${e(r.format)}` : ''}${r.cost_model ? ` \u00b7 <span class="muted">${e(r.cost_model)}</span>` : ''}${r.schedule_url ? ` \u00b7 <a href="${e(r.schedule_url)}" rel="noopener">official schedule</a>` : ''}</li>`).join('')}</ul><p class="muted">Typical shape as published; dates and fees live on the official schedule.</p>` : ''}
<h2>Upcoming events</h2>${ev.length ? `<ul>${ev.slice(0, 40).map((x) => `<li><b>${x.url ? `<a href="${e(x.url)}" rel="noopener">${e(x.name)}</a>` : e(x.name)}</b> \u00b7 ${e(when(x))}${x.location ? ` \u00b7 ${e(x.location)}` : ''}${x.online ? ' \u00b7 online' : ''}${src(x.source)}</li>`).join('')}</ul><p class="muted">Read ${e(evm.fetched_at.slice(0, 10))} from the place\u2019s own ${[...new Set(ev.map((x) => (x.source_type === 'ical' ? 'iCal feed' : 'schema.org event data')))].join(' and ')}${evm.stale ? ' (stale: not re-read for over 14 days)' : ''}. Confirm dates on the source page.</p>` : `<p class="muted">No machine-readable events found on the place\u2019s own site for the next 90 days${EV.meta?.fetched_at ? ` (checked ${e(EV.meta.fetched_at.slice(0, 10))})` : ''}.${p.retreats?.[0]?.schedule_url ? ` See the <a href="${e(p.retreats[0].schedule_url)}" rel="noopener">official schedule</a>.` : p.url ? ` See <a href="${e(p.url)}" rel="noopener">${e(host(p.url))}</a>.` : ''}</p>`}
${p.events?.length ? `<h2>Yearly gatherings</h2><ul>${p.events.map((x) => `<li><b>${e(x.name)}</b>${x.when ? ` \u00b7 ${e(x.when)}` : ''}${x.note ? ` \u00b7 ${e(x.note)}` : ''}${x.url ? ` \u00b7 <a href="${e(x.url)}" rel="noopener">official page</a>` : ''}</li>`).join('')}</ul>` : ''}
${sis.length ? `<h2>Sister places</h2><ul>${sis.map(([id, rel]) => `<li><a href="/place/${e(id)}">${e(BY[id].name)}</a>${rel ? ` <span class="muted">(${e(String(rel).replace(/_/g, ' '))})</span>` : ''}</li>`).join('')}</ul>` : ''}
${p.resources?.length ? `<h2>Free books</h2><ul>${p.resources.map((r) => `<li><a href="${e(r.url)}" rel="noopener">${e(r.title)}</a>${r.licence ? ` <span class="muted">${e(r.licence)}</span>` : ''}</li>`).join('')}</ul>` : ''}
${safety.length ? `<h2>Public safety record</h2>${safety.map(([t, r]) => `<p class="note"><b>${e(pn(t))}</b> (${e(r.happened || '')}): ${e(r.summary)} ${r.reports.map((x) => `<a href="${e(x.url)}" rel="noopener">${e(x.outlet.split(':')[0])}</a>`).join(' \u00b7 ')} <span class="muted">Dated, sourced note; not a verdict about the place today. Updated ${e(r.updated)}.</span></p>`).join('')}` : ''}
<h2>Sources</h2><ul>${[...new Set([p.source_url, c.page_src, c.page, p.url, p.wikidata ? `https://www.wikidata.org/wiki/${p.wikidata}` : null, ...(evm?.sources || [])].filter((u) => /^https?:/.test(u || '')))].map((u) => `<li><a href="${e(u)}" rel="noopener">${e(u)}</a></li>`).join('')}</ul>
<p class="muted">Machine-readable: <a href="/data/wisegraph/place/${e(p.id)}.json">this place as JSON</a> \u00b7 MCP <code>get_place("${e(p.id)}")</code>. Map data \u00a9 OpenStreetMap contributors.</p>`
  fs.writeFileSync(path.join(out, 'place', p.id + '.html'), page(`${p.name} \u00b7 ${TYPE[p.type] || 'Place'} in ${where} \u00b7 ${NAME}`, desc.slice(0, 200), canon, ld, body))
  urls.push([`/place/${p.id}`, checkedOf(p)])
}

// ---------- listings ----------
const listItems = (ps) => ps.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${BASE}/place/${p.id}`, name: p.name }))
const li = (p) => `<li><a href="/place/${e(p.id)}">${e(p.name)}</a> <span class="muted">${e(TYPE[p.type] || p.type)}${p.city ? ` \u00b7 ${e(p.city)}` : ''} \u00b7 ${e(p.traditions.map(tl).join(', '))}${upcoming(p.id).length ? ' \u00b7 upcoming events' : ''}</span></li>`
const byCountry = (ps) => { const g = {}; for (const p of ps) (g[p.country] ||= []).push(p); return Object.entries(g).sort((a, b) => b[1].length - a[1].length || cname(a[0]).localeCompare(cname(b[0]))) }
const sorted = (ps) => [...ps].sort((a, b) => !!a.goenka - !!b.goenka || a.name.localeCompare(b.name))
const KIDS = {}; for (const [id, x] of Object.entries(T)) if (x.parent) (KIDS[x.parent] ||= []).push(id)
const SUB = {}; const subtree = (t) => (SUB[t] ||= (() => { const s = new Set([t]), q = [t]; while (q.length) for (const k of KIDS[q.pop()] || []) if (!s.has(k)) { s.add(k); q.push(k) } return s })())
const inT = (t) => P.filter((p) => p.traditions.some((x) => subtree(t).has(x)))
const used = new Set(); for (const p of P) for (const t of p.traditions) for (const c of chain(t)) used.add(c)
const tradIds = [...used].filter((t) => /^[a-z0-9-]+$/.test(t) && inT(t).length)
const fams = tradIds.filter((t) => !T[t]?.parent)
const countries = [...new Set(P.map((p) => p.country).filter(Boolean))].sort((a, b) => cname(a).localeCompare(cname(b)))
const curated = P.filter((p) => !p.goenka)
{
  const cr = [['/', NAME], [null, 'Places']]
  const body = `${crumbs(cr)}<h1>Places to practise and study</h1>
<p>${curated.length} monasteries, retreat centres, ashrams, temples, meeting houses and pilgrimage sites across the world\u2019s wisdom traditions, plus ${P.length - curated.length} centres of S. N. Goenka\u2019s Vipassana network, in ${countries.length} countries. Each place page gives its tradition and lineage, address and map point, website, contacts exactly as the place publishes them (with source and check date), programmes, upcoming events read from the place\u2019s own calendar, and when it was last checked.</p>
<a class="btn" href="/#places">Open the map</a><a class="btn" href="/data/places.json">Open data (JSON)</a><a class="btn" href="/llms.txt">llms.txt</a>
<h2>By tradition</h2><ul class="cols">${fams.map((f) => `<li><a href="/places/${e(f)}">${e(tl(f))}</a> <span class="muted">${inT(f).length}</span>${tradIds.filter((t) => T[t]?.parent === f).length ? `<ul>${tradIds.filter((t) => T[t]?.parent === f).map((t) => `<li><a href="/places/${e(t)}">${e(tl(t))}</a> <span class="muted">${inT(t).length}</span></li>`).join('')}</ul>` : ''}</li>`).join('')}</ul>
<h2>By country</h2><ul class="cols">${countries.map((c) => `<li><a href="/places/country/${e(c.toLowerCase())}">${e(cname(c))}</a> <span class="muted">${P.filter((p) => p.country === c).length}</span></li>`).join('')}</ul>
<h2>Every place</h2><p class="muted">Goenka Vipassana centres are listed on the country pages.</p>${byCountry(curated).map(([c, ps]) => `<h3><a href="/places/country/${e(c.toLowerCase())}">${e(cname(c))}</a></h3><ul>${sorted(ps).map(li).join('')}</ul>`).join('')}`
  fs.writeFileSync(path.join(out, 'places.html'), page(`Places to practise: monasteries, retreat centres and ashrams \u00b7 ${NAME}`, `${curated.length} places across the wisdom traditions, plus ${P.length - curated.length} Goenka Vipassana centres, with contacts, programmes and upcoming events.`, `${BASE}/places`, { '@context': 'https://schema.org', '@graph': [{ '@type': 'CollectionPage', '@id': `${BASE}/places`, name: 'Places to practise', mainEntity: { '@type': 'ItemList', numberOfItems: curated.length, itemListElement: listItems(sorted(curated)) } }, crumbLd(cr)] }, body))
  urls.push(['/places', TODAY])
}
for (const t of tradIds) {
  const ps = sorted(inT(t)), bc = byCountry(ps)
  const cr = [['/', NAME], ['/places', 'Places'], ...chain(t).slice(0, -1).map((x) => [`/places/${x}`, tl(x)]), [null, tl(t)]]
  const kids = tradIds.filter((x) => T[x]?.parent === t)
  const body = `${crumbs(cr)}<h1>${e(tl(t))}: places to practise</h1>
<p>${T[t]?.blurb ? e(T[t].blurb) + ' ' : ''}${ps.length} place${ps.length === 1 ? '' : 's'} in ${bc.length} countr${bc.length === 1 ? 'y' : 'ies'}.</p>
<a class="btn" href="/#tradition/${e(t)}">${e(tl(t))} in the app</a>
${kids.length ? `<h2>Schools and lineages</h2><ul class="cols">${kids.map((k) => `<li><a href="/places/${e(k)}">${e(tl(k))}</a> <span class="muted">${inT(k).length}</span></li>`).join('')}</ul>` : ''}
${bc.map(([c, cs]) => `<h2><a href="/places/country/${e(c.toLowerCase())}">${e(cname(c))}</a></h2><ul>${cs.map(li).join('')}</ul>`).join('')}`
  fs.writeFileSync(path.join(out, 'places', t + '.html'), page(`${tl(t)} places: monasteries, centres and retreats \u00b7 ${NAME}`, `${ps.length} ${tl(t)} places to practise, with contacts, programmes and upcoming events.`, `${BASE}/places/${t}`, { '@context': 'https://schema.org', '@graph': [{ '@type': 'CollectionPage', '@id': `${BASE}/places/${t}`, name: `${tl(t)} places`, about: { '@type': 'DefinedTerm', name: tl(t), url: `${BASE}/tradition/${t}` }, mainEntity: { '@type': 'ItemList', numberOfItems: ps.length, itemListElement: listItems(ps) } }, crumbLd(cr)] }, body))
  urls.push([`/places/${t}`, TODAY])
}
for (const c of countries) {
  const ps = sorted(P.filter((p) => p.country === c)), cc = c.toLowerCase(), g = {}
  for (const p of ps) (g[family(p.traditions[0] || '')] ||= []).push(p)
  const cr = [['/', NAME], ['/places', 'Places'], [null, cname(c)]], ng = ps.filter((p) => p.goenka).length
  const body = `${crumbs(cr)}<h1>Places to practise in ${e(cname(c))}</h1><p>${ps.length} place${ps.length === 1 ? '' : 's'}${ng ? `, including ${ng} Goenka Vipassana centre${ng === 1 ? '' : 's'}` : ''}.</p>
<a class="btn" href="/#country/${e(c)}">Map of ${e(cname(c))}</a>
${Object.entries(g).sort((a, b) => b[1].length - a[1].length).map(([f, fs2]) => `<h2><a href="/places/${e(f)}">${e(tl(f))}</a></h2><ul>${fs2.map(li).join('')}</ul>`).join('')}`
  fs.writeFileSync(path.join(out, 'places/country', cc + '.html'), page(`Monasteries, retreat centres and ashrams in ${cname(c)} \u00b7 ${NAME}`, `${ps.length} places to practise in ${cname(c)} across the wisdom traditions.`, `${BASE}/places/country/${cc}`, { '@context': 'https://schema.org', '@graph': [{ '@type': 'CollectionPage', '@id': `${BASE}/places/country/${cc}`, name: `Places in ${cname(c)}`, mainEntity: { '@type': 'ItemList', numberOfItems: ps.length, itemListElement: listItems(ps) } }, crumbLd(cr)] }, body))
  urls.push([`/places/country/${cc}`, TODAY])
}
fs.writeFileSync(path.join(out, 'sitemap-places.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, d]) => `<url><loc>${BASE}${u.split('/').map(encodeURIComponent).join('/')}</loc><lastmod>${d}</lastmod></url>`).join('\n')}\n</urlset>\n`)
console.log(`place pages ${P.length}, tradition pages ${tradIds.length}, country pages ${countries.length}; index ${(fs.statSync(path.join(APP, 'site/data/wisegraph/places-index.json')).size / 1e3).toFixed(0)} KB; events on ${Object.keys(EV.places || {}).length} places`)
