// Wiser: the daily editorial theme for For You (specs/FORYOU.md §3). Pure, no DOM: shared by the site (src/foryou.js) and
// the API's nightly cron (api/src/index.js -> D1 daily_theme). Calendar-aware where the calendar can be computed honestly:
//   - moon phases: Meeus, Astronomical Algorithms ch. 49 (main periodic terms; error well under an hour) -> uposatha days
//     (full and new moon, the observance days of Theravada practice), Vesak (the first full moon of May, the date most
//     countries keep; some keep the next one), Mahashivaratri (the 14th night of the dark fortnight before the new moon
//     that falls between mid-February and mid-March: the new moon's UTC date minus 2 days), Diwali (around the Kartika new
//     moon, mid-October to mid-November)
//   - Easter by the Gregorian computus -> Ash Wednesday, Lent, Holy Week, Easter week; Advent from the 4th Sunday before
//     Christmas; Christmas and the twelve days; All Saints / All Souls; Bodhi Day (8 Dec, Rohatsu); Rumi's Urs (17 Dec)
//   - Ramadan from a table of expected start dates (moon sighting can move them a day; labelled "around")
//   - teachers' death anniversaries from site/data/wisegraph/anniversaries.json (Wikidata P570, day precision only)
// Otherwise a deterministic daily rotation over editorial themes (never yesterday's), so the feed changes every day.
// Regional practice differs for every lunar date; the labels say "around" where that matters. Approximations are named here.

const RAD = Math.PI / 180, DAY = 86400000
const sin = (d) => Math.sin(d * RAD)
const RAMADAN = { 2025: ['2025-03-01', '2025-03-30'], 2026: ['2026-02-18', '2026-03-19'], 2027: ['2027-02-08', '2027-03-09'], 2028: ['2028-01-28', '2028-02-26'], 2029: ['2029-01-16', '2029-02-14'], 2030: ['2030-01-06', '2030-02-04'] }

// Meeus ch. 49: the instant (ms since epoch, UTC) of new moon (phase 0) or full moon (phase 0.5) for lunation k
export function moonPhase(k, phase) {
  k = Math.floor(k) + phase
  const T = k / 1236.85, T2 = T * T, T3 = T2 * T, T4 = T3 * T
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4
  const E = 1 - 0.002516 * T - 0.0000074 * T2
  const M = 2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3
  const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4
  const F = 160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4
  const Om = 124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3
  const c = phase === 0 ? [-0.4072, 0.17241, 0.01608, 0.01039, 0.00739, -0.00514, 0.00208] : [-0.40614, 0.17302, 0.01614, 0.01043, 0.00734, -0.00515, 0.00209]
  jde += c[0] * sin(Mp) + c[1] * E * sin(M) + c[2] * sin(2 * Mp) + c[3] * sin(2 * F) + c[4] * E * sin(Mp - M) + c[5] * E * sin(Mp + M) + c[6] * E * E * sin(2 * M)
    - 0.00111 * sin(Mp - 2 * F) - 0.00057 * sin(Mp + 2 * F) + 0.00056 * E * sin(2 * Mp + M) - 0.00042 * sin(3 * Mp) + 0.00042 * E * sin(M + 2 * F)
    + 0.00038 * E * sin(M - 2 * F) - 0.00024 * E * sin(2 * Mp - M) - 0.00017 * sin(Om)
  return (jde - 2440587.5) * DAY - 69000 // JDE (TT) -> Unix ms, minus ΔT ≈ 69 s
}
// local calendar date 'YYYY-MM-DD' of an instant, at a fixed UTC offset in minutes (the browser passes its own)
const ymd = (ms, off = 0) => new Date(ms + off * 60000).toISOString().slice(0, 10)
const addDays = (s, n) => new Date(Date.parse(s + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10)
const dow = (s) => new Date(s + 'T00:00:00Z').getUTCDay()
// every new and full moon around a date (local dates)
export function moonsAround(date, off = 0) {
  const t = Date.parse(date + 'T12:00:00Z'), k0 = Math.floor((t / DAY + 2440587.5 - 2451550.09766) / 29.530588861)
  const out = []
  for (let k = k0 - 14; k <= k0 + 2; k++) for (const ph of [0, 0.5]) { const ms = moonPhase(k, ph); out.push({ kind: ph ? 'full' : 'new', ms, date: ymd(ms, off), utc: ymd(ms, 0) }) }
  return out.sort((a, b) => a.ms - b.ms)
}
export function easter(y) { // anonymous Gregorian algorithm
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1
  return `${y}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`
}
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }

// the rotation: plain editorial days. match = { topics, fams, schools, people }; each needs >= 12 talks to be used (minPool)
export const ROTATION = [
  { id: 'r-death', label: 'Death', line: 'A day for the one certainty', match: { topics: ['death', 'impermanence'] } },
  { id: 'r-self', label: 'The self', line: 'Who, or what, am I?', match: { topics: ['self', 'self/self-enquiry'] } },
  { id: 'r-kindness', label: 'Kindness', line: 'A day for the warm side of wisdom', match: { topics: ['kindness', 'kindness/compassion'] } },
  { id: 'r-emotions', label: 'Hard feelings', line: 'Anger, fear and grief, met well', match: { topics: ['emotions', 'emotions/anger', 'emotions/fear', 'emotions/sadness'] } },
  { id: 'r-devotion', label: 'Devotion', line: 'Love as a path', match: { topics: ['faith', 'faith/bhakti', 'faith/grace', 'meditation/prayer'] } },
  { id: 'r-mind', label: 'Mindfulness', line: 'The attention that sees it', match: { topics: ['mindfulness', 'meditation/breath'] } },
  { id: 'r-awakening', label: 'Awakening', line: 'Where the path leads', match: { topics: ['awakening', 'awakening/buddha-nature'] } },
  { id: 'r-reality', label: 'Reality', line: 'Is the world as it appears?', match: { topics: ['reality', 'reality/nonduality', 'reality/maya', 'self/emptiness'] } },
  { id: 'r-everyday', label: 'Everyday life', line: 'The path in an ordinary day', match: { topics: ['daily-life', 'relationships'] } },
  { id: 'r-letting-go', label: 'Letting go', line: 'What renunciation makes room for', match: { topics: ['renunciation', 'craving'] } },
  { id: 'r-divine', label: 'The divine', line: 'What is God, or the ground of it all?', match: { topics: ['divine', 'divine/the-one', 'divine/goddess', 'gnosis'] } },
  { id: 'r-rebirth', label: 'Rebirth', line: 'Does anything carry on?', match: { topics: ['rebirth', 'kamma', 'soul'] } },
  { id: 'r-mantra', label: 'Mantra and sound', line: 'The practice of the sacred word', match: { topics: ['meditation/mantra', 'meditation/kundalini'] } },
  { id: 'r-zen', label: 'A day with Zen', line: 'Koans, sitting, and nothing special', match: { topics: ['meditation/koan', 'meditation/silent-illumination'] } },
  { id: 'r-texts', label: 'The old texts', line: 'Reading slowly with the teachers', match: { topics: ['texts'] } },
  { id: 'r-consciousness', label: 'Consciousness', line: 'The knowing itself', match: { topics: ['consciousness', 'consciousness/states'] } },
  { id: 'r-sufism', label: 'A day with the Sufis', line: 'The way of the heart', match: { fams: ['sufism'] } },
  { id: 'r-christian', label: 'The Christian contemplatives', line: 'Prayer of the heart, the cloud of unknowing', match: { fams: ['christian'] } },
  { id: 'r-platonic', label: 'The Platonists', line: 'The ascent to the One', match: { fams: ['platonic'] } },
  { id: 'r-esoteric', label: 'Western esotericism', line: 'The hidden streams of the West', match: { fams: ['esoteric'] } },
  { id: 'r-forest', label: 'The forest tradition', line: 'Simplicity, sitting, the monastery', match: { schools: ['thai-forest'] } },
  { id: 'r-advaita', label: 'Advaita', line: 'Not two', match: { schools: ['advaita', 'advaita-vedanta', 'arsha-vidya', 'neo-advaita'] } },
  { id: 'r-tibetan', label: 'Tibetan teachers', line: 'Mind training, the view, the deities', match: { fams: [], schools: ['tibetan', 'gelug', 'kagyu', 'nyingma', 'sakya', 'dzogchen'], topics: ['meditation/dzogchen', 'meditation/lojong'] } },
  { id: 'r-tantra', label: 'Tantra', line: 'The body, energy and the goddess', match: { topics: ['texts/tantra', 'divine/goddess', 'meditation/kundalini'] } },
]

// the theme of a day. opts: { off: UTC offset minutes (browser: -new Date().getTimezoneOffset()), anniversaries: {MM-DD: [[id, year]]},
//   person(id) -> {short|n}, poolSize(match) -> talks available (rotation themes below minPool are skipped), minPool = 12 }
export function dailyTheme(date, opts = {}) {
  const off = opts.off || 0, y = Number(date.slice(0, 4)), md = date.slice(5), A = opts.anniversaries || {}
  const pool = opts.poolSize || (() => 99), minPool = opts.minPool ?? 12
  const ok = (m) => pool(m) >= minPool
  const T = (o) => ({ date, ...o, why: o.why || 'Today: ' + o.label })
  const moons = moonsAround(date, off), todayMoon = moons.find((m) => m.date === date)
  // 1. fixed and computed feast days (one day each)
  const e = easter(y), ash = addDays(e, -46)
  const firstMayFull = moons.concat(moonsAround(`${y}-05-20`, off)).find((m) => m.kind === 'full' && m.date >= `${y}-05-01` && m.date <= `${y}-05-31`)
  const shivaNew = moons.concat(moonsAround(`${y}-03-01`, off)).find((m) => m.kind === 'new' && m.utc >= `${y}-02-13` && m.utc <= `${y}-03-14`)
  const kartikaNew = moons.concat(moonsAround(`${y}-11-01`, off)).find((m) => m.kind === 'new' && m.utc >= `${y}-10-13` && m.utc <= `${y}-11-14`)
  const feasts = [
    [e, { id: 'easter', kind: 'calendar', label: 'Easter', line: 'Death and what overcomes it', match: { fams: ['christian'], topics: ['death', 'faith/grace'] } }],
    [ash, { id: 'ash-wednesday', kind: 'calendar', label: 'Ash Wednesday', line: 'Remember that you are dust', match: { fams: ['christian'], topics: ['death', 'renunciation'] } }],
    [addDays(e, -2), { id: 'good-friday', kind: 'calendar', label: 'Good Friday', line: 'Suffering, and what it can open', match: { fams: ['christian'], topics: ['dukkha', 'death'] } }],
    [firstMayFull?.date, { id: 'vesak', kind: 'calendar', label: 'Vesak', line: 'The full moon of the Buddha\u2019s birth, awakening and passing (kept on this moon in many countries)', match: { fams: ['buddhism'], topics: ['awakening'] } }],
    [shivaNew ? addDays(shivaNew.utc, -2) : null, { id: 'mahashivaratri', kind: 'calendar', label: 'Mahashivaratri', line: 'The great night of Shiva (around this date)', match: { schools: ['kashmir-shaivism', 'shaivism', 'shaiva-siddhanta'], topics: ['meditation/mantra', 'texts/tantra'] } }],
    [kartikaNew?.date, { id: 'diwali', kind: 'calendar', label: 'Diwali', line: 'The festival of lights (around the Kartika new moon)', match: { fams: ['hindu'], topics: ['divine/goddess', 'faith/bhakti'] } }],
    [`${y}-11-01`, { id: 'all-saints', kind: 'calendar', label: 'All Saints', line: 'The holy ones of every age', match: { fams: ['christian'], topics: ['faith', 'gnosis'] } }],
    [`${y}-11-02`, { id: 'all-souls', kind: 'calendar', label: 'All Souls', line: 'A day for the dead', match: { topics: ['death', 'rebirth', 'soul'] } }],
    [`${y}-12-08`, { id: 'bodhi-day', kind: 'calendar', label: 'Bodhi Day', line: 'Rohatsu: the morning of the Buddha\u2019s awakening, as Zen keeps it', match: { fams: ['buddhism'], topics: ['awakening', 'meditation/koan'] } }],
    [`${y}-12-17`, { id: 'rumi-urs', kind: 'calendar', label: 'Rumi\u2019s wedding night', line: 'Shab-e Arus, the night Rumi died, kept as his union with the Beloved', match: { fams: ['sufism'], people: ['rumi'] } }],
    [`${y}-12-25`, { id: 'christmas', kind: 'calendar', label: 'Christmas', line: 'The birth of the divine in the soul', match: { fams: ['christian'], topics: ['divine', 'faith/grace'] } }],
  ]
  for (const [d, t] of feasts) if (d === date && ok(t.match)) return T(t)
  // 2. a teacher's death anniversary (only people with enough talks)
  const ann = (A[md] || []).map(([id, yr]) => ({ id, yr, n: pool({ people: [id] }) })).filter((x) => x.n >= 3).sort((a, b) => b.n - a.n)[0]
  if (ann) { const p = opts.person?.(ann.id); const nm = p?.short || p?.n || ann.id; const yrs = y - ann.yr; return T({ id: 'anniv-' + ann.id, kind: 'anniversary', label: nm, line: `${nm} died on this day in ${ann.yr}${yrs > 0 ? `, ${yrs} years ago` : ''}`, why: `Today: ${yrs} years since ${nm} died`, match: { people: [ann.id] } }) }
  // 3. uposatha: full and new moon days
  if (todayMoon) { const t = { id: 'uposatha-' + todayMoon.kind, kind: 'moon', label: todayMoon.kind === 'full' ? 'Full moon' : 'New moon', line: 'An uposatha day: the observance days of the Buddhist calendar, for keeping precepts and sitting longer', why: 'Today: uposatha', match: { fams: ['buddhism'], topics: ['virtue', 'meditation', 'renunciation'] } }; if (ok(t.match)) return T(t) }
  // 4. seasons (several weeks): every other day, so the days between still turn over
  const xmas = `${y}-12-25`, advent = addDays(xmas, -(dow(xmas) || 7) - 21)
  const R = RAMADAN[y]
  const seasons = [
    [date >= addDays(ash, 1) && date < e, { id: 'lent', kind: 'season', label: 'Lent', line: 'Forty days of turning back: fasting, prayer, giving', match: { fams: ['christian'], topics: ['renunciation', 'meditation/prayer', 'virtue'] } }],
    [date > e && date <= addDays(e, 7), { id: 'easter-week', kind: 'season', label: 'Easter week', line: 'Resurrection, and the new life', match: { fams: ['christian'], topics: ['faith/grace', 'awakening'] } }],
    [date >= advent && date < xmas, { id: 'advent', kind: 'season', label: 'Advent', line: 'Waiting, and the light that comes', match: { fams: ['christian'], topics: ['faith', 'meditation/prayer'] } }],
    [date > xmas || date <= `${y}-01-05`, { id: 'twelve-days', kind: 'season', label: 'The twelve days of Christmas', line: 'The birth of the divine in the soul', match: { fams: ['christian'], topics: ['divine'] } }],
    [R && date >= R[0] && date <= R[1], { id: 'ramadan', kind: 'season', label: 'Ramadan', line: 'The month of fasting (dates around the moon sighting): the Sufi way of the heart', match: { fams: ['sufism'], topics: ['meditation/prayer', 'renunciation', 'faith'] } }],
  ]
  const day = Math.floor(Date.parse(date + 'T00:00:00Z') / DAY)
  for (const [on, t] of seasons) if (on && day % 2 === 0 && ok(t.match)) return T(t)
  // 5. the rotation: deterministic per date, never the same as yesterday
  const usable = ROTATION.filter((t) => ok(t.match))
  if (!usable.length) return null
  const pickFor = (d) => usable[hash('wiser-theme:' + d) % usable.length]
  let t = pickFor(date)
  if (t.id === pickFor(addDays(date, -1)).id) t = usable[(usable.indexOf(t) + 1 + (hash(date) % Math.max(1, usable.length - 1))) % usable.length]
  return T({ ...t, kind: 'rotation', why: 'Today: ' + t.label.replace(/^A day with /, '') })
}
// does a clip match a theme? (site and API share this)
export function themeMatch(m, c, famOf, schoolOf) {
  if (!m || !c) return 0
  const tops = c.topics || []
  if (m.people?.length && (m.people.includes(c.speaker) || (c.figures || []).some((f) => m.people.includes(f)))) return 1
  let s = 0
  if (m.topics?.length && tops.some((t) => m.topics.includes(t) || m.topics.includes(String(t).split('/')[0]))) s += 0.6
  if (m.fams?.length && m.fams.includes(famOf(c))) s += 0.5
  if (m.schools?.length && (m.schools.includes(schoolOf(c)) || (c.traditions || []).some((t) => m.schools.includes(t)))) s += 0.5
  return Math.min(1, s)
}
export const localDate = (d = new Date()) => { const o = -d.getTimezoneOffset(); return { date: ymd(d.getTime(), o), off: o } }
export { addDays, ymd }
