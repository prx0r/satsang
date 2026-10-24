// Events keeper (no LLM, no paid API): for each curated place with a website, read its own pages for machine-readable
// events (iCal feeds and schema.org JSON-LD Event), keep the next 90 days, and write app/site/data/events.json.
//   node keeper/events/run.mjs                 all places (weekly GitHub Action: .github/workflows/events-weekly.yml)
//   node keeper/events/run.mjs --from 0 --to 150   a slice (the Hark sandbox has 120 s per call); merges into the file
//   node keeper/events/run.mjs --only amaravati,gaia-house
// Pages read per place: events_url, its programme schedule pages, the homepage, and up to 2 same-site links on the
// homepage that look like an events/calendar page, plus any iCal feed those pages link (<link type="text/calendar">,
// *.ics, webcal:, The Events Calendar ?ical=1). Polite: one UA naming the project, robots.txt respected, 10 s timeout,
// 2 MB cap, 6 hosts at a time. A place whose last successful read is older than 14 days is marked stale (events kept).
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
// built file locally (has retreat schedule pages); in CI it is gitignored, so fall back to the committed source list
const PLACES = [path.join(ROOT, 'app/site/data/wisegraph/places.json'), path.join(ROOT, 'app/wisegraph/places.json')].find((f) => fs.existsSync(f))
const OUT = path.join(ROOT, 'app/site/data/events.json')
const UA = 'SatsangEventsKeeper/1.0 (+https://tantrafiles.xyz/llms.txt; reads public event feeds weekly)'
const WINDOW_DAYS = 90, STALE_DAYS = 14, TIMEOUT = 10000, MAX_BYTES = 2e6, CONC = +(process.argv.includes('--conc') ? process.argv[process.argv.indexOf('--conc') + 1] : 6)
const arg = (k) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null }
const now = new Date(), until = new Date(now.getTime() + WINDOW_DAYS * 864e5)
const iso = (d) => d.toISOString()

const raw = JSON.parse(fs.readFileSync(PLACES, 'utf8')).places
let todo = raw.filter((p) => !p.goenka && !/dhamma\.org/.test(p.url || '') && /^https?:\/\//.test(p.url || ''))
if (arg('only')) { const s = new Set(arg('only').split(',')); todo = todo.filter((p) => s.has(p.id)) }
const from = +(arg('from') || 0), to = arg('to') != null ? +arg('to') : todo.length
todo = todo.slice(from, to)

const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { places: {} }

// ---------- http ----------
const robotsCache = new Map()
async function get(url, accept = 'text/html,application/xhtml+xml,text/calendar;q=0.9,*/*;q=0.5') {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), TIMEOUT)
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept }, redirect: 'follow', signal: ac.signal })
    if (!r.ok) return null
    const reader = r.body.getReader(); const chunks = []; let n = 0
    for (;;) { const { done, value } = await reader.read(); if (done) break; n += value.length; if (n > MAX_BYTES) { ac.abort(); break } chunks.push(value) }
    return { url: r.url, type: r.headers.get('content-type') || '', text: Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8') }
  } catch { return null } finally { clearTimeout(t) }
}
async function allowed(url) {
  let u; try { u = new URL(url) } catch { return false }
  if (!robotsCache.has(u.origin)) robotsCache.set(u.origin, (async () => {
    const r = await get(u.origin + '/robots.txt', 'text/plain'); if (!r || !/text\/plain/.test(r.type)) return []
    const dis = []; let on = false
    for (const line of r.text.split(/\r?\n/)) {
      const m = line.replace(/#.*/, '').trim().match(/^([A-Za-z-]+)\s*:\s*(.*)$/); if (!m) continue
      const k = m[1].toLowerCase(), v = m[2].trim()
      if (k === 'user-agent') on = v === '*' || /satsang/i.test(v)
      else if (on && k === 'disallow' && v) dis.push(v)
    }
    return dis
  })())
  const dis = await robotsCache.get(u.origin)
  return !dis.some((d) => (u.pathname + u.search).startsWith(d.replace(/\*.*$/, '')))
}

// ---------- parsers ----------
const strip = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&#8211;|&ndash;/g, '\u2013').replace(/&#8217;/g, '\u2019').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
function jsonldEvents(html, base) {
  const out = []
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let j; try { j = JSON.parse(m[1].trim()) } catch { continue }
    const walk = (x) => {
      if (!x || typeof x !== 'object') return
      if (Array.isArray(x)) return x.forEach(walk)
      const ty = [].concat(x['@type'] || [])
      if (ty.some((t) => /Event$/.test(String(t))) && x.startDate) {
        const loc = [].concat(x.location || [])[0]
        out.push({ name: strip(x.name), start: x.startDate, end: x.endDate || null, url: abs(x.url, base) || base,
          location: loc ? strip(loc.name || loc.address?.addressLocality || (typeof loc.address === 'string' ? loc.address : '')) || null : null,
          online: /OnlineEventAttendanceMode/.test(String(x.eventAttendanceMode || '')) || ty.includes('VirtualLocation') || /VirtualLocation/.test(JSON.stringify(loc || {})) || undefined,
          source_type: 'jsonld' })
      }
      for (const k of ['@graph', 'subEvent', 'itemListElement', 'item', 'event', 'events']) if (x[k]) walk(x[k])
    }
    walk(j)
  }
  return out
}
function icalDate(v, params) {
  const m = String(v).match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/); if (!m) return null
  if (!m[4]) return `${m[1]}-${m[2]}-${m[3]}`
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7] ? 'Z' : ''}${!m[7] && /TZID=([^;:]+)/.test(params) ? '' : ''}`
}
function icalEvents(text, base) {
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/), out = []; let ev = null
  for (const l of lines) {
    if (l === 'BEGIN:VEVENT') ev = {}
    else if (l === 'END:VEVENT') { if (ev?.start && ev.name) out.push({ ...ev, source_type: 'ical' }); ev = null }
    else if (ev) {
      const i = l.indexOf(':'); if (i < 0) continue
      const [key, ...ps] = l.slice(0, i).split(';'), val = l.slice(i + 1), params = ps.join(';')
      if (key === 'SUMMARY') ev.name = val.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/gi, ' ').trim()
      else if (key === 'DTSTART') { ev.start = icalDate(val, params); const tz = params.match(/TZID=([^;:]+)/); if (tz) ev.tz = tz[1] }
      else if (key === 'DTEND') ev.end = icalDate(val, params)
      else if (key === 'URL') ev.url = abs(val, base)
      else if (key === 'LOCATION') ev.location = val.replace(/\\,/g, ',').replace(/\\n/gi, ' ').trim() || null
      else if (key === 'RRULE') ev.recurrence = val
    }
  }
  return out
}
function abs(u, base) { if (!u || typeof u !== 'string') return null; try { return new URL(u.replace(/^webcal:/i, 'https:'), base).href } catch { return null } }
function feedLinks(html, base) {
  const s = new Set()
  for (const m of html.matchAll(/<link[^>]+type=["']text\/calendar["'][^>]*>/gi)) { const h = m[0].match(/href=["']([^"']+)/i); if (h) s.add(abs(h[1], base)) }
  for (const m of html.matchAll(/href=["']([^"']+(?:\.ics(?:\?[^"']*)?|[?&]ical=1[^"']*)|webcal:[^"']+)["']/gi)) s.add(abs(m[1].replace(/&amp;/g, '&'), base))
  return [...s].filter(Boolean).slice(0, 3)
}
function eventPageLinks(html, base) {
  const host = new URL(base).host, s = new Set()
  for (const m of html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)) {
    const u = abs(m[1].replace(/&amp;/g, '&'), base); if (!u) continue
    let x; try { x = new URL(u) } catch { continue }
    if (x.host !== host) continue
    if (/\/(events?|calendar|programme|programs?|schedule|retreats?|whats-on|kalender|veranstaltungen|agenda|programm)(\/|$|\.)/i.test(x.pathname)) s.add(x.origin + x.pathname)
  }
  return [...s].slice(0, 2)
}

// ---------- per place ----------
const inWindow = (e) => { const s = Date.parse(e.start), en = Date.parse(e.end || e.start); return Number.isFinite(s) && en >= now.getTime() - 864e5 && s <= until.getTime() }
async function readPlace(p) {
  const pages = [...new Set([p.events_url, ...(p.retreats || []).map((r) => r.schedule_url).slice(0, 2), p.url].filter((u) => /^https?:/.test(u || '')))]
  const seen = new Set(), feeds = new Set(), found = [], sources = new Set(); let reached = false
  const readHtml = async (u) => {
    if (seen.has(u) || seen.size >= 6 || !(await allowed(u))) return null
    seen.add(u); const r = await get(u); if (!r) return null
    reached = true
    if (/text\/calendar/.test(r.type) || /^BEGIN:VCALENDAR/.test(r.text)) { const ev = icalEvents(r.text, r.url); if (ev.length) { found.push(...ev.map((e) => ({ ...e, source: r.url }))); sources.add(r.url) } return null }
    const ev = jsonldEvents(r.text, r.url); if (ev.length) { found.push(...ev.map((e) => ({ ...e, source: r.url }))); sources.add(r.url) }
    for (const f of feedLinks(r.text, r.url)) feeds.add(f)
    return r
  }
  let home = null
  for (const u of pages) { const r = await readHtml(u); if (u === p.url) home = r }
  if (home) for (const u of eventPageLinks(home.text, home.url)) await readHtml(u)
  for (const f of [...feeds].slice(0, 3)) {
    if (!(await allowed(f))) continue
    const r = await get(f, 'text/calendar,*/*;q=0.5'); if (!r || !/BEGIN:VCALENDAR/.test(r.text)) continue
    const ev = icalEvents(r.text, r.url); if (ev.length) { found.push(...ev.map((e) => ({ ...e, source: f }))); sources.add(f) }
  }
  const key = (e) => (e.name + '|' + String(e.start).slice(0, 10)).toLowerCase()
  const uniq = [...new Map(found.filter(inWindow).filter((e) => e.name).map((e) => [key(e), e])).values()]
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start)).slice(0, 40)
    .map((e) => JSON.parse(JSON.stringify({ name: e.name.slice(0, 200), start: e.start, end: e.end || undefined, tz: e.tz, url: e.url || undefined, location: e.location || undefined, online: e.online, recurrence: e.recurrence, source: e.source, source_type: e.source_type })))
  return { reached, events: uniq, sources: [...sources], pages: [...seen] }
}

// ---------- run ----------
const places = { ...(prev.places || {}) }
let i = 0, done = 0
async function worker() {
  while (i < todo.length) {
    const p = todo[i++]
    const r = await readPlace(p).catch(() => ({ reached: false, events: [], sources: [] }))
    const fetched_at = iso(new Date())
    if (r.reached) {
      if (r.events.length || r.sources.length) places[p.id] = { fetched_at, sources: r.sources, events: r.events }
      else delete places[p.id]
    } else if (places[p.id]) places[p.id].last_error_at = fetched_at
    done++
  }
}
await Promise.all(Array.from({ length: CONC }, worker))
// dates: keep ISO 8601; rewrite display strings some calendars put in JSON-LD ("Sat 2026-10-17 7:00 AM (UTC+07:00)")
function normDate(v) {
  if (!v || /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/.test(v)) return v
  const m = String(v).match(/(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?\s*(?:\(UTC([+-]\d{2}):?(\d{2})\))?/i)
  if (!m) return v
  let h = +m[2]; if (m[4]) { h = h % 12 + (/pm/i.test(m[4]) ? 12 : 0) }
  return `${m[1]}T${String(h).padStart(2, '0')}:${m[3]}:00${m[5] ? `${m[5]}:${m[6]}` : ''}`
}
// one organisation calendar read by several places (e.g. San Francisco Zen Center for City Center, Green Gulch, Tassajara):
// each place keeps only the events that name it (title, location or URL); the rest stay with no place
const byName = Object.fromEntries(raw.map((p) => [p.id, p.name]))
const shared = {}; for (const [id, x] of Object.entries(places)) for (const s of x.sources || []) (shared[s] ||= new Set()).add(id)
const toks = (id) => { const STOP = /^(the|and|zen|centre|center|buddhist|monastery|abbey|temple|retreat|house|meditation|society|community|of|for|de|la|le|du|des|ashram|international|institute|mountain)$/i
  return String(byName[id] || id).split(/[^A-Za-z\u00C0-\u024F]+/).filter((w) => w.length >= 4 && !STOP.test(w)).map((w) => w.toLowerCase()) }
for (const [id, x] of Object.entries(places)) {
  for (const e of x.events || []) { e.start = normDate(e.start); if (e.end) e.end = normDate(e.end) }
  const t = toks(id)
  x.events = (x.events || []).filter((e) => { if ((shared[e.source]?.size || 1) < 2) return true; const h = (e.name + ' ' + (e.location || '') + ' ' + (e.url || '')).toLowerCase(); return t.some((w) => h.includes(w)) })
}
for (const [id, x] of Object.entries(places)) {
  x.stale = (now.getTime() - Date.parse(x.fetched_at)) / 864e5 > STALE_DAYS || undefined
  x.events = (x.events || []).filter((e) => Date.parse(e.end || e.start) >= now.getTime() - 864e5)
  if (!x.events.length && !x.stale) delete places[id]
}
const out = { meta: { generator: 'keeper/events/run.mjs', fetched_at: iso(now), window_days: WINDOW_DAYS, stale_after_days: STALE_DAYS, user_agent: UA,
  note: 'Events read from each place\u2019s own public iCal feed or schema.org JSON-LD. Dates are the organiser\u2019s; always confirm on the source page. No LLM, no third-party aggregator.',
  places_with_events: Object.keys(places).length, events: Object.values(places).reduce((a, x) => a + x.events.length, 0),
  last_slice: { from, to: from + todo.length, checked: done } }, places }
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n')
console.log(`checked ${done} places (${from}-${from + todo.length}); ${out.meta.places_with_events} places with events, ${out.meta.events} events -> ${path.relative(ROOT, OUT)}`)
