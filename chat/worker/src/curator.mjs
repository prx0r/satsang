// Satsang curator: deterministic intent parsing -> BM25 retrieval over Satsang's own catalog -> an ordered micro-curriculum pack
// with templated prose. No model is needed; an optional LLM provider (llm.mjs, Qwen, off by default) may only re-word the prose
// from the pack's own facts. Every item in a pack is a real catalog id; nothing is generated that is not in the catalog.
import { createIndex, tokens, fold } from './bm25.mjs'
import { triage, practiceExcluded } from './safety.mjs'

const GENTLE = /metta|goodwill|loving|kindness|mindfulness-of-breathing|mindful-breathing|walking|rain\b|yoga-nidra|body-sweeping|welcoming|natural-awareness|shamatha-with-object|anapanasati|buddho/i
// schedule and filler words in the ask: they shape the plan, not the search
const NOISE = new Set(tokens('minute minutes min mins hour hours day days daily week weeks month months morning mornings evening each every per last keep thinking feel feeling im ive been since new start started starting beginner first time want wanted would like maybe bit little quick short busy half half-hour'))
export const CURATOR_VERSION = 'satsang-curator/1'
const SITE = 'https://tantrafiles.xyz'

// ---- curator synonyms: everyday words -> catalog topic ids (only ids that exist in the catalog are used) ----
const TOPIC_SYN = [
  [/\b(anxi\w*|panic\w*|worr\w*|fear\w*|afraid|scared|nervous|stress\w*|overwhelm\w*|on edge)\b/, 'emotions/fear'],
  [/\b(angry|anger|rage|irritat\w*|resent\w*)\b/, 'emotions/anger'],
  [/\b(sad|sadness|depress\w*|low mood|grief|griev\w*|mourn\w*|loss|bereave\w*|lonely|loneliness|died|passed away)\b/, 'emotions/sadness'],
  [/\b(grief|griev\w*|bereave\w*|died|dying|death|mortality|passed away)\b/, 'death'],
  [/\b(bored|boredom|restless\w*)\b/, 'emotions/boredom'],
  [/\b(past[- ]li(fe|ves)|previous li(fe|ves)|reincarnat\w*|rebirth|reborn|afterlife|after death|next life|samsara|transmigrat\w*)\b/, 'rebirth'],
  [/\b(karma|kamma)\b/, 'kamma'],
  [/\b(bardo|tibetan book of the dead|phowa|powa)\b/, 'death/bardo'],
  [/\b(breath\w*|pranayama|anapanasati)\b/, 'meditation/breath'],
  [/\b(mantra|japa|chant\w*)\b/, 'meditation/mantra'],
  [/\b(kundalini|chakras?|subtle body|nadis?)\b/, 'meditation/kundalini'],
  [/\b(koan|huatou)\b/, 'meditation/koan'],
  [/\b(pray\w*|contemplative prayer|centering prayer)\b/, 'meditation/prayer'],
  [/\b(yoga|asana|hatha)\b/, 'meditation/hatha'],
  [/\b(dzogchen|rigpa)\b/, 'meditation/dzogchen'],
  [/\b(guided|guide me)\b/, 'meditation/guided'],
  [/\b(meditat\w*|sitting practice|sit daily|mindful\w*)\b/, 'meditation'],
  [/\b(mindful\w*|present moment|awareness)\b/, 'mindfulness'],
  [/\b(who am i|true self|ego|no[- ]self|not[- ]self|anatta)\b/, 'self'],
  [/\b(self[- ]enquiry|self[- ]inquiry|atma vichara|who am i)\b/, 'self/self-enquiry'],
  [/\b(non[- ]?dual\w*|advaita|oneness)\b/, 'reality/nonduality'],
  [/\b(emptiness|sunyata|shunyata)\b/, 'self/emptiness'],
  [/\b(enlighten\w*|awaken\w*|liberation|nirvana|nibbana|moksha)\b/, 'awakening'],
  [/\b(love|kindness|metta|loving[- ]kindness|compassion\w*|forgiv\w*)\b/, 'kindness'],
  [/\b(compassion\w*|tonglen)\b/, 'kindness/compassion'],
  [/\b(devotion\w*|bhakti|faith)\b/, 'faith'],
  [/\b(god|the divine|divinity)\b/, 'divine'],
  [/\b(goddess|divine feminine|shakti|kali)\b/, 'divine/goddess'],
  [/\b(dreams?|lucid|deep sleep)\b/, 'consciousness/states'],
  [/\b(consciousness|mind itself)\b/, 'consciousness'],
  [/\b(tantra|tantric|tantras)\b/, 'texts/tantra'],
  [/\b(suffer\w*|dukkha)\b/, 'dukkha'],
  [/\b(desire|craving|addict\w*|lust)\b/, 'craving'],
  [/\b(relationship\w*|marriage|partner|family)\b/, 'relationships'],
  [/\b(everyday|daily life|work life|at work|busy life)\b/, 'daily-life'],
  [/\b(jhana|jhanas|absorption)\b/, 'jhana'],
  [/\b(guru|teacher)\b/, 'guru'],
  [/\b(soul)\b/, 'soul'],
  [/\b(impermanen\w*|change)\b/, 'impermanence'],
  [/\b(imaginal|active imagination|visionary)\b/, 'imaginal'],
  [/\b(gnosis|gnostic)\b/, 'gnosis'],
  [/\b(freedom|free will)\b/, 'freedom'],
  [/\b(ritual|initiation|puja|worship)\b/, 'faith/ritual'],
]
const TRAD_ALIAS = [
  [/\bbuddhis[mt]\b|\bbuddha'?s?\b/, 'buddhism'], [/\bzen\b/, 'zen'], [/\btibetan\b/, 'tibetan'], [/\btheravada\b|\bforest tradition\b/, 'theravada'],
  [/\bthai forest\b|\bajahn chah\b/, 'thai-forest'], [/\bvipassana\b|\bgoenka\b/, 'goenka-vipassana'], [/\binsight meditation\b/, 'insight'],
  [/\badvaita\b|\bnon[- ]?dual vedanta\b/, 'advaita'], [/\bvedanta\b/, 'vedanta'], [/\bhindu\w*\b/, 'hindu'], [/\bkashmir shaivism\b|\bkashmiri shaivism\b/, 'kashmir-shaivism'],
  [/\btrika\b/, 'trika'], [/\bsufi\w*\b|\brumi\b/, 'sufism'], [/\bchristian\w*\b/, 'christian'], [/\bchristian mystic\w*\b|\bmystics?\b/, 'christian-mysticism'],
  [/\bkabbal\w*\b|\bjewish\b/, 'jewish'], [/\bhermetic\w*\b/, 'hermeticism'], [/\bplato\w*\b|\bneoplaton\w*\b/, 'platonic'], [/\bsteiner\b|\banthroposoph\w*\b/, 'anthroposophy'],
  [/\btheosoph\w*\b/, 'theosophy'], [/\bgnostic\w*\b/, 'gnosticism'], [/\btao\w*\b|\bdao\w*\b/, 'taoist'], [/\bquaker\w*\b/, 'quaker'], [/\bpagan\w*\b|\bdruid\w*\b/, 'modern-paganism'],
  [/\bdzogchen\b/, 'dzogchen'], [/\bmahamudra\b/, 'mahamudra'], [/\bplum village\b|\bthich nhat hanh\b/, 'plum-village'], [/\bkrishnamurti\b/, 'krishnamurti'],
  [/\bkriya\b/, 'kriya-yoga'], [/\bpure land\b/, 'pure-land'], [/\bshaiv\w*\b|\bsaiv\w*\b/, 'shaivism'], [/\btantra\w*\b/, 'kashmir-shaivism'], [/\bjain\w*\b/, 'jain'], [/\bsikh\w*\b/, 'sikh'],
  [/\bwestern esoteric\w*\b|\boccult\w*\b/, 'esoteric'],
]
const COUNTRY_ALIAS = [
  [/\b(uk|u\.k\.|britain|great britain|england|english countryside|scotland|wales|london|united kingdom)\b/, 'GB'], [/\b(us|usa|u\.s\.|america|united states|california|new york)\b/, 'US'],
  [/\bindia\b/, 'IN'], [/\bthailand\b/, 'TH'], [/\bnepal\b/, 'NP'], [/\bmyanmar\b|\bburma\b/, 'MM'], [/\bsri lanka\b/, 'LK'], [/\baustralia\b/, 'AU'], [/\bfrance\b/, 'FR'],
  [/\bgermany\b/, 'DE'], [/\bitaly\b/, 'IT'], [/\bspain\b/, 'ES'], [/\bcanada\b/, 'CA'], [/\bjapan\b/, 'JP'], [/\bireland\b/, 'IE'], [/\bnew zealand\b/, 'NZ'], [/\bswitzerland\b/, 'CH'],
  [/\bnetherlands\b|\bholland\b/, 'NL'], [/\bportugal\b/, 'PT'], [/\bgreece\b/, 'GR'], [/\bbrazil\b/, 'BR'], [/\bmexico\b/, 'MX'], [/\bcosta rica\b/, 'CR'], [/\bcambodia\b/, 'KH'],
  [/\bvietnam\b/, 'VN'], [/\btaiwan\b/, 'TW'], [/\bkorea\b/, 'KR'], [/\bmalaysia\b/, 'MY'], [/\bindonesia\b|\bbali\b/, 'ID'], [/\bperu\b/, 'PE'], [/\bsweden\b/, 'SE'], [/\baustria\b/, 'AT'], [/\bbelgium\b/, 'BE'],
]
const NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, fifteen: 15, twenty: 20, thirty: 30, forty: 40, 'forty-five': 45, sixty: 60 }

export function parseIntent(text, CAT, ctx = {}) {
  const s = fold(text).replace(/\s+/g, ' ').trim()
  const has = (re) => re.test(s)
  // time per day
  let minutes = null
  const m1 = s.match(/\b(\d{1,3}|one|two|three|five|ten|fifteen|twenty|thirty|forty|forty-five|sixty)\s*(?:-|to)?\s*(?:\d{1,3}\s*)?(?:min|mins|minutes|minute)\b/)
  if (m1) minutes = Number(m1[1]) || NUMW[m1[1]] || null
  else if (has(/\bhalf an hour\b/)) minutes = 30
  else if (has(/\b(an|one) hour\b/)) minutes = 60
  else if (has(/\b(busy|short on time|not much time|quick|little time)\b/)) minutes = 10
  if (minutes) minutes = Math.max(2, Math.min(120, minutes))
  // horizon
  let days = null
  const m2 = s.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|ten)\s*(?:-|\s)?days?\b(?! retreat| course)/)
  if (has(/\b(a|one|1) week\b|\bthis week\b|\bseven days\b/)) days = 7
  else if (m2 && !has(/\b\d+[- ]day (retreat|course)\b/)) days = Number(m2[1]) || NUMW[m2[1]] || null
  else if (has(/\b(a|one) month\b|\b30 days\b/)) days = 14
  if (days) days = Math.max(1, Math.min(14, days))
  const daily = has(/\b(a day|per day|each day|every day|daily|every morning|each morning|every evening|habit|routine)\b/)
  // level
  const level = has(/\b(new to|beginner|never (meditated|tried|done)|just start\w*|first time|complete novice|where (do i|to) start|get started|newbie)\b/) ? 'beginner'
    : has(/\b(experienced|advanced|years of practice|been practi[cs]ing for|long[- ]time practitioner|deepen my)\b/) ? 'experienced' : null
  // wants
  const wants = {
    watch: has(/\b(talks?|videos?|watch|listen|lectures?|teachings?|understand|explain\w*|how (does|do|is|it)|what (is|are|happens)|why|curious|learn about|works?)\b/),
    practise: has(/\b(practi[cs]\w*|meditat\w*|exercise|technique|try|sit|sitting|routine|habit|a day|daily)\b/),
    read: has(/\b(read|reading|books?|texts?|sutta|scripture|essay|understand|study)\b/),
    visit: has(/\b(retreats?|monaster\w*|ashrams?|centres?|centers?|temples?|visit|stay|residential|in person|place to|where can i (go|practi[cs]e|learn)|teacher near|sangha|group near)\b/),
    deep: has(/\b(deep(ly|er)?|in depth|thorough\w*|full talks?|long talks?|lectures?|study|syllabus|course)\b/),
  }
  // retreat shape
  const retreat = wants.visit ? {
    weekend: has(/\bweekend\b|\b(2|3|two|three)[- ]day\b/), long: has(/\b(10|ten)[- ]day\b|\bweek[- ]long\b|\bmonth\b|\blong retreat\b/), silent: has(/\bsilen(t|ce)\b/),
    online: has(/\bonline\b|\bzoom\b|\bfrom home\b/), free: has(/\b(free|donation|dana|cheap|affordable|budget)\b/), monastic: has(/\bmonaster\w*|\bmonks?\b|\bnuns?\b/),
  } : null
  // country (explicit, then "near me" with the request's approximate country)
  let country = null
  for (const [re, cc] of COUNTRY_ALIAS) if (re.test(s) && CAT.countries[cc]) { country = cc; break }
  if (!country) for (const [cc, name] of Object.entries(CAT.countries)) if (name.length > 4 && new RegExp(`\\b${fold(name)}\\b`).test(s)) { country = cc; break }
  const nearMe = has(/\b(near me|nearby|close to me|local|in my area|around here|my country)\b/)
  if (!country && nearMe && ctx.country && CAT.countries[ctx.country]) country = ctx.country
  // traditions (aliases, then full labels)
  const traditions = []
  for (const [re, id] of TRAD_ALIAS) if (re.test(s) && CAT.trads[id] && !traditions.includes(id)) traditions.push(id)
  for (const [id, t] of Object.entries(CAT.trads)) {
    const lab = fold(t.l.split(' (')[0]); if (lab.length < 6 || /^(independent|imaginal|insight meditation|vedic|the imaginal)$/.test(lab)) continue
    if (new RegExp(`\\b${lab.replace(/[^a-z0-9 ]/g, '.')}\\b`).test(s) && !traditions.includes(id)) traditions.push(id)
  }
  // topics: hub regexes (strongest), labels/terms, then synonyms; sub-questions from the hub's own regexes
  const tscore = new Map(), qpick = {}
  const add = (id, w) => { if (CAT._topic[id]) tscore.set(id, (tscore.get(id) || 0) + w) }
  for (const t of CAT.topics) {
    if (t.rx) { try { if (new RegExp(t.rx, 'i').test(s)) add(t.id, 3) } catch {} }
    const lab = fold(t.l).replace(/&/g, 'and')
    if (lab.length > 3 && new RegExp(`\\b${lab.replace(/[^a-z0-9 ]/g, '.')}\\b`).test(s)) add(t.id, 2.5)
    for (const term of t.terms || []) { const f = fold(typeof term === 'string' ? term : term?.t || ''); if (f.length > 3 && s.includes(f)) add(t.id, 2) }
  }
  for (const [re, id] of TOPIC_SYN) if (re.test(s)) add(id, 2)
  const topics = [...tscore.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length).slice(0, 3).map(([id]) => id)
  for (const id of topics) for (const q of CAT._topic[id].qs || []) { if (!q.rx) continue; try { if (new RegExp(q.rx, 'i').test(s)) { (qpick[id] ||= []).push(q.id) } } catch {} }
  // past lives: the user names the sub-question even when the hub regex is broad
  if (topics.includes('rebirth') && /past[- ]li(fe|ves)|previous li(fe|ves)/.test(s)) qpick.rebirth = ['past-lives', ...(qpick.rebirth || []).filter((x) => x !== 'past-lives')]
  if (topics.includes('rebirth') && /\bhow (does )?(it|rebirth|reincarnation) works?\b|\bhow rebirth\b|\bwhat (is|gets) reborn\b/.test(s)) qpick.rebirth = [...new Set(['what-is-reborn', ...(qpick.rebirth || [])])]
  if (!wants.watch && !wants.read && !wants.practise && !wants.visit) { wants.watch = wants.practise = wants.read = true }
  if (minutes || daily) wants.practise = true
  return { topics, questions: qpick, traditions, minutes, days, daily, level, country, nearMe, wants, retreat, grief: /\b(griev\w*|grief|bereave\w*|mourn\w*|died|passed away|lost my)\b/.test(s), text: s }
}

export function createCurator(CAT, { llm = null } = {}) {
  CAT._topic = Object.fromEntries(CAT.topics.map((t) => [t.id, t]))
  const T = (id) => CAT.trads[id]?.l || id
  const fam = (id) => CAT.trads[id]?.f || id
  const topicLab = (id) => CAT._topic[id]?.l || id
  const iTalk = createIndex(CAT.talks, (c) => `${c.t} ${c.t} ${c.yt || ''} ${c.by || ''} ${(c.trs || []).map(T).join(' ')} ${(c.top || []).map(topicLab).join(' ')}`)
  const iPrac = createIndex(CAT.practices, (p) => `${p.n} ${p.n} ${p.how} ${p.trl || ''} ${(p.top || []).map(topicLab).join(' ')}`)
  const iRead = createIndex(CAT.readings, (r) => `${r.t} ${r.t} ${r.s} ${r.by || ''} ${(r.tr || []).map(T).join(' ')} ${(r.top || []).map(topicLab).join(' ')}`)
  const iPlace = createIndex(CAT.places, (p) => `${p.n} ${p.d || ''} ${p.ty} ${(p.tr || []).map(T).join(' ')} ${(p.of || []).join(' ')} ${(p.ret || []).map((r) => `${r.n} ${r.fmt || ''} ${r.len || ''}`).join(' ')}`)
  const iCourse = createIndex(CAT.courses || [], (c) => `${c.t} ${c.t} ${c.intro} ${c.top ? topicLab(c.top) : ''} ${c.steps.map((s) => s.ut || '').join(' ')}`)
  CAT._talk = Object.fromEntries(CAT.talks.map((x) => [x.id, x])); CAT._prac = Object.fromEntries(CAT.practices.map((x) => [x.id, x])); CAT._read = Object.fromEntries(CAT.readings.map((x) => [x.id, x])); CAT._place = Object.fromEntries(CAT.places.map((x) => [x.id, x]))
  const iCol = createIndex(CAT.collections, (c) => `${c.t} ${c.t} ${c.intro} ${c.top ? topicLab(c.top) : ''} ${c.k}`)

  function query(intent, extra = '') {
    const q = new Map(), put = (txt, w) => { for (const t of tokens(txt)) q.set(t, Math.max(q.get(t) || 0, w)) }
    for (const t of tokens(intent.text)) if (!NOISE.has(t)) q.set(t, 1)
    for (const id of intent.topics) { const t = CAT._topic[id]; put(t.l, 1.4); for (const term of (t.terms || []).slice(0, 6)) put(typeof term === 'string' ? term : term?.t || '', 0.8) }
    for (const [tid, qs] of Object.entries(intent.questions)) for (const qid of qs.slice(0, 1)) { const qq = CAT._topic[tid].qs.find((x) => x.id === qid); if (qq) put(qq.l, 1.6) }
    for (const id of intent.traditions) put(T(id).split(' (')[0], 0.9)
    if (extra) put(extra, 1)
    if (intent.grief) put('grief loss sorrow comfort', 1.3)
    return [...q.entries()]
  }
  const topicFit = (tops, intent) => { let f = 1; for (const id of intent.topics) { if ((tops || []).includes(id)) f = Math.max(f, 1.7); else if ((tops || []).some((x) => x.startsWith(id + '/') || id.startsWith(x + '/'))) f = Math.max(f, 1.35) } return f }
  const tradFit = (trs, intent) => { if (!intent.traditions.length) return 1; const tf = new Set(intent.traditions), ff = new Set(intent.traditions.map(fam)); const L = trs || []; if (L.some((t) => tf.has(t))) return 1.8; if (L.some((t) => tf.has(fam(t)) || (ff.has(fam(t)) && !tf.has(fam(t)) && false))) return 1.35; return L.some((t) => ff.has(fam(t))) ? 1.1 : 0.55 }
  const qRx = (intent) => { const out = []; for (const [tid, qs] of Object.entries(intent.questions)) for (const qid of qs.slice(0, 2)) { const qq = CAT._topic[tid].qs.find((x) => x.id === qid); if (qq?.rx) { try { out.push([qq, new RegExp(qq.rx, 'i')]) } catch {} } } return out }

  function pickTalks(intent, n) {
    const sc = iTalk.search(query(intent)), Q = qRx(intent), budget = intent.minutes ? intent.minutes * 60 : null
    const rows = []
    for (const [i, s] of sc) {
      const c = CAT.talks[i]
      let f = s * c.q * topicFit(c.top, intent) * tradFit(c.trs, intent)
      if (Q.length && Q.some(([, re]) => re.test(`${c.t} ${c.yt || ''}`))) f *= 1.5
      if (c.full) f *= intent.wants.deep ? 1 : 0.45
      if (budget) f *= c.dur <= budget * 1.6 ? 1.15 : c.dur <= 1500 ? 0.9 : 0.6
      else if (c.dur > 2400) f *= 0.8
      if (intent.level === 'beginner' && c.dur > 1800) f *= 0.8
      if (c.rd) f *= 0.85
      if (c.g) f *= 2.2 // editorially read and recommended (satsang-curation gold)
      rows.push([f, c])
    }
    rows.sort((a, b) => b[0] - a[0])
    const out = [], seenSp = new Set(), seenYt = new Set(), trCount = {}
    const spread = intent.traditions.length === 0
    for (const [f, c] of rows) {
      if (out.length >= n) break
      const yt = c.id.split('@')[0]
      if (seenYt.has(yt) || (c.sp && seenSp.has(c.sp))) continue
      const fm = fam(c.tr)
      if (spread && (trCount[fm] || 0) >= 2) continue
      if (out.length && f < rows[0][0] * 0.12) break
      out.push(c); seenYt.add(yt); if (c.sp) seenSp.add(c.sp); trCount[fm] = (trCount[fm] || 0) + 1
    }
    return out
  }

  function pickPractices(intent, tri, n) {
    const sc = iPrac.search(query(intent)), budget = intent.minutes || null, Q = qRx(intent)
    const askedEso = intent.topics.some((t) => /^(rebirth|death|texts\/tantra|meditation\/kundalini|imaginal|divine\/goddess|faith\/ritual|gnosis)/.test(t)) || /past[- ]li|tantr|occult|ritual|magic|kundalini|bardo|hermetic|kabbal/.test(intent.text)
    const rows = []
    for (let i = 0; i < CAT.practices.length; i++) {
      const p = CAT.practices[i]
      let f = (sc.get(i) || 0) + 0.05
      f *= topicFit(p.top, intent) * tradFit([p.tr], intent)
      if (practiceExcluded(p, tri.conditions)) continue
      if (tri.noBreathWork && /breath|pranayama|anapanasati|dhikr/i.test(`${p.n} ${p.how}`) && !/walking/i.test(p.n)) continue
      if (tri.gentle || tri.groundingOnly) { if (p.intense || p.eso || p.nt) continue; if ((/death|dying|demons|corpse/i.test(p.n) || (p.top || []).some((t) => /^(death|rebirth)/.test(t))) && (tri.intent === 'grief' || !intent.topics.some((t) => /^(death|rebirth)/.test(t)))) f *= 0.15 }
      if (tri.groundingOnly && (!/walking|metta|loving|goodwill|kindness|welcoming/i.test(`${p.id} ${p.n}`) || /goenka|vipassana|noting|sweeping/i.test(p.id))) continue
      if (p.intense) { if (!tri.intense) continue; f *= 0.6 } // shown only when asked for, and only as orientation
      if ((p.eso || p.nt) && !askedEso && !tri.intense) f *= 0.25
      if (budget && p.min) f *= p.min <= budget ? 1.15 : 0.6
      if (Q.length && Q.some(([, re]) => re.test(`${p.n} ${p.how}`))) f *= 1.8
      if (tri.gentle && GENTLE.test(`${p.id} ${p.n}`)) f = (f + 0.6) * 2.2
      if (intent.grief && /metta|goodwill|loving|kindness|walking|welcoming/i.test(p.id)) f = (f + 0.6) * 2
      if (intent.level === 'beginner' && (p.nt || p.eso)) f *= 0.6
      if (!p.steps) f *= 0.7
      rows.push([f, p])
    }
    rows.sort((a, b) => b[0] - a[0])
    if (!rows.length) return []
    const top = rows[0][0], out = []
    for (const [f, p] of rows) {
      if (out.length >= n) break
      if (f < top * 0.2) break
      if (out.some((o) => o.tr === p.tr && out.length >= 1 && !intent.traditions.length)) continue
      out.push(p)
    }
    // one doable practice always leads: if the best is orientation-only, find the best doable one to put first
    if (out[0] && (out[0].nt || out[0].intense || out[0].eso)) {
      const doable = rows.find(([, p]) => !p.nt && !p.intense && !p.eso && !out.includes(p) && p.top?.some((t) => intent.topics.includes(t) || intent.topics.some((x) => t.startsWith(x.split('/')[0]))))
      if (doable) out.unshift(doable[1])
      if (out.length > n + 1) out.length = n + 1
    }
    return out
  }

  // the same safety filter pickPractices applies, for practices that come from a course
  function practiceAllowed(p, intent, tri) {
    if (practiceExcluded(p, tri.conditions)) return false
    if (tri.noBreathWork && /breath|pranayama|anapanasati|dhikr/i.test(`${p.n} ${p.how}`) && !/walking/i.test(p.n)) return false
    if ((tri.gentle || tri.groundingOnly) && (p.intense || p.eso || p.nt)) return false
    if (p.intense && !tri.intense) return false
    return true
  }
  const whyFit = (p, intent) => (p.min && intent.minutes ? (p.min <= intent.minutes ? `About ${p.min} min, within your ${intent.minutes}.` : `Usually ${p.min} min; shorten it to fit.`) : p.min ? `About ${p.min} min.` : '')
  function pickCourses(intent, tri) {
    if (!CAT.courses?.length || !intent.topics.length) return []
    const sc = iCourse.search(query(intent)), Q = qRx(intent), rows = []
    CAT.courses.forEach((c, i) => {
      const orient = /orientation only/i.test(c.caut || '')
      if ((tri.gentle || tri.groundingOnly) && (orient || (/grief|death/i.test(c.caut || '') && (tri.intent === 'grief' || !intent.topics.some((t) => /^(death|rebirth)/.test(t)))))) return
      let f = sc.get(i) || 0
      const exact = intent.topics.includes(c.top), root = intent.topics.some((t) => t.split('/')[0] === String(c.top).split('/')[0])
      if (!exact && !root) return
      f *= exact ? 2.5 : 1.4
      if (Q.length && Q.some(([, re]) => re.test(`${c.t} ${c.intro}`))) f *= 1.8
      if (intent.traditions.length) f *= c.trs.some((t) => intent.traditions.includes(t) || intent.traditions.includes(fam(t))) ? 1.6 : 0.6
      if (intent.level === 'beginner' && c.lvl !== 'first-steps') f *= 0.7
      if (orient && !/past[- ]li|previous[- ]li|tantr|occult|magic|hermetic|ritual/.test(intent.text)) f *= 0.5
      if (c.feat) f *= 1.6  // the featured (flagship) course leads when it fits the ask
      rows.push([f, c])
    })
    rows.sort((a, b) => b[0] - a[0])
    if (!rows.length || rows[0][0] < 2) return []
    const out = [rows[0][1]]
    // a second course only when the ask names its own sub-question (e.g. "how rebirth works" + "past lives")
    const second = rows.slice(1).find(([f, c]) => f >= rows[0][0] * 0.45 && Q.some(([, re]) => re.test(`${c.t} ${c.intro}`)) && !Q.every(([, re]) => re.test(`${rows[0][1].t} ${rows[0][1].intro}`)))
    if (second) out.push(second[1])
    return out
  }

  function pickReadings(intent, n) {
    const sc = iRead.search(query(intent)), rows = []
    for (const [i, s] of sc) { const r = CAT.readings[i]; rows.push([s * topicFit(r.top, intent) * tradFit(r.tr, intent) * (r.k === 'library' ? 0.6 : 1), r]) }
    rows.sort((a, b) => b[0] - a[0])
    const out = [], seen = new Set()
    for (const [f, r] of rows) { if (out.length >= n) break; if (f < (rows[0]?.[0] || 0) * 0.3) break; const k = (r.au || [])[0] || r.by; if (k && seen.has(k)) continue; out.push(r); if (k) seen.add(k) }
    return out
  }

  function pickCollections(intent, tri) {
    const sc = iCol.search(query(intent)), rows = []
    for (const [i, s] of sc) { const c = CAT.collections[i]; if (c.k === 'mini-course') continue; if ((tri.gentle || tri.groundingOnly) && c.eso) continue; if (tri.gentle && /death/.test(c.id) && (tri.intent === 'grief' || (!intent.topics.includes('death') && !intent.topics.includes('rebirth')))) continue; rows.push([s * (intent.topics.includes(c.top) ? 1.8 : 1), c]) }
    rows.sort((a, b) => b[0] - a[0])
    return rows.filter(([f, c]) => f >= (rows[0]?.[0] || 0) * 0.5 && (intent.topics.includes(c.top) || intent.topics.some((t) => t.split('/')[0] === c.top) || f > 4)).slice(0, 2).map(([, c]) => c)
  }

  function pickPlaces(intent, tri, talks, n) {
    const r = intent.retreat || {}
    const wantTr = new Set(intent.traditions.length ? intent.traditions : talks.slice(0, 3).map((t) => t.tr).filter(Boolean))
    const wantFam = new Set([...wantTr].map(fam))
    const extra = [r.weekend ? 'weekend' : '', r.silent ? 'silent' : '', r.long ? '10 day' : '', r.monastic ? 'monastery' : '', 'retreat'].join(' ')
    const sc = iPlace.search(query(intent, extra))
    const rows = []
    for (let i = 0; i < CAT.places.length; i++) {
      const p = CAT.places[i]
      if (intent.country && p.c !== intent.country) continue
      if (/bookshop|university|sacred-site|pilgrimage/.test(p.ty) && !/pilgrim/.test(intent.text)) continue
      if (tri.gentle && /shamanic|santo-daime|udv|shipibo/.test((p.tr || []).join(' '))) continue // no plant-medicine settings in a gentle path
      let f = (sc.get(i) || 0) + 0.2
      const trHit = (p.tr || []).some((t) => wantTr.has(t)), famHit = (p.tr || []).some((t) => wantFam.has(fam(t)))
      if (intent.traditions.length) f *= trHit ? 2.2 : famHit ? 1.4 : 0.35
      else if (wantTr.size) f *= trHit ? 1.5 : famHit ? 1.2 : 1
      const rets = p.ret || []
      if (rets.length) f *= 1.6; else if (intent.wants.visit) f *= 0.3
      if (!intent.wants.visit && wantTr.size) f *= trHit ? 1.6 : 1
      if (r.weekend) f *= rets.some((x) => /weekend|2[- ]?day|3[- ]?day|two|three|day to|short|friday|days?\b/i.test(`${x.len} ${x.n} ${x.fmt}`)) ? 1.6 : 0.8
      if (r.long) f *= rets.some((x) => /10|ten|week|month/i.test(`${x.len} ${x.n}`)) ? 1.5 : 0.8
      if (r.silent) f *= rets.some((x) => /silen/i.test(`${x.n} ${x.fmt}`)) || p.gk ? 1.4 : 0.9
      if (r.free) f *= rets.some((x) => /dana|donation|free/i.test(x.cost || '')) ? 1.5 : 0.85
      if (r.online) f *= rets.some((x) => /online|zoom/i.test(`${x.fmt} ${x.n}`)) ? 1.6 : 0.6
      if (p.gk && !/goenka|vipassana|10[- ]day|silent/.test(intent.text)) f *= 0.4 // 272 Goenka centres would crowd every list
      if (/retreat-centre|monastery|ashram|centre|hermitage|retreat/.test(p.ty)) f *= 1.15
      rows.push([f, p])
    }
    rows.sort((a, b) => b[0] - a[0])
    const out = [], famN = {}
    const withRet = rows.filter(([, p]) => (p.ret || []).length).length
    for (const [f, p] of rows) {
      if (out.length >= n) break
      if (intent.wants.visit && withRet >= n && !(p.ret || []).length) continue
      const fm = fam((p.tr || [])[0] || '')
      if (!intent.traditions.length && (famN[fm] || 0) >= 2) continue
      out.push(p); famN[fm] = (famN[fm] || 0) + 1
    }
    return out
  }

  // ---- why-lines (curation why wins; else a template from catalog facts) ----
  const mm = (sec) => { const m = Math.round(sec / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60 ? (m % 60) + ' min' : ''}`.trim() }
  const first = (s, n = 160) => { const t = String(s || '').split(/(?<=[.!?])\s/)[0]; return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '\u2026' : t }
  function whyTalk(c, intent, i) {
    if (c.why) return c.why
    const Q = qRx(intent).find(([, re]) => re.test(`${c.t} ${c.yt || ''}`))
    const topic = Q ? Q[0].l.replace(/\?$/, '').toLowerCase() : (c.top || []).filter((t) => intent.topics.includes(t)).map(topicLab)[0]?.toLowerCase() || (intent.topics[0] ? topicLab(intent.topics[0]).toLowerCase() : null)
    const who = c.by || 'A teacher', trad = c.tr ? T(c.tr).split(' (')[0] : null
    const lead = i === 0 ? 'A clear way in: ' : i === 1 ? 'A second angle: ' : 'Then: '
    let s = `${lead}${who}${trad ? ` (${trad})` : ''}${topic ? ` on ${topic}` : ''}`
    const tag = CAT.people[c.sp]?.tag
    if (tag && s.length + tag.length < 200) s += `. ${tag.replace(/\.$/, '')}`
    if (intent.minutes && c.dur <= intent.minutes * 60) s += `. Fits your ${intent.minutes} minutes`
    else if (c.full) s += '. A full talk: one for a slower evening'
    return s + '.'
  }
  function whyPractice(p, intent, tri) {
    if (p.why) return p.why
    let s = first(p.how, 170)
    const fit = p.min ? (intent.minutes ? (p.min <= intent.minutes ? ` About ${p.min} min, within your ${intent.minutes}.` : ` Usually ${p.min} min; shorten it to fit.`) : ` About ${p.min} min.`) : ''
    return `${s}${fit}${p.trl ? ` From ${p.trl}.` : ''}`
  }
  const whyReading = (r) => r.why || `${r.s || r.t}${r.by ? ` By ${r.by}` : ''}${r.pub ? `, free from ${r.pub}` : ''}.`.replace(/\.\s*By/, '. By').replace(/\.\./g, '.')
  function whyPlace(p, intent) {
    if (p.why) return p.why
    const ret = (p.ret || [])[0]
    const bits = [p.d ? first(p.d, 150) : `${p.ty.replace(/-/g, ' ')} in ${p.city ? p.city + ', ' : ''}${CAT.countries[p.c] || p.c}`]
    if (ret) bits.push(`Programme: ${ret.n}${ret.len ? ` (${ret.len}` : ''}${ret.len && ret.cost ? `; ${ret.cost}` : ''}${ret.len ? ')' : ''}. Dates on the place's own schedule.`)
    return bits.join(' ')
  }

  const url = { watch: (id) => `${SITE}/#watch/${encodeURIComponent(id)}`, practise: (id) => `${SITE}/#practice/${id}`, read: (id) => `${SITE}/resource/${id}`, visit: (id) => `${SITE}/#place/${id}`, collection: (id) => `${SITE}/#collection/${id}`, topic: (id) => `${SITE}/#topic/${id}` }

  function practiceItem(p, intent, tri) {
    const orientation = !!(p.nt || p.intense || p.eso)
    const caution = [...(p.caut || [])]
    if (p.nt || p.intense) caution.push('Traditionally given by a teacher: read about it and where it is taught; do not attempt the method on your own.')
    else if (p.eso) caution.push('Orientation: what the tradition describes. Traditionally learned with a teacher; no particular experience or result is promised.')
    return { role: 'practise', kind: 'practice', ref: `practice:${p.id}`, id: p.id, title: p.n, by: p.trl || null, minutes: p.min && intent.minutes ? Math.min(p.min, intent.minutes) : p.min || null,
      why: whyPractice(p, intent, tri), caution, orientationOnly: orientation || undefined, needsTeacher: p.nt || p.intense ? true : undefined, source: p.src ? { url: p.src, label: p.srcl } : undefined, url: url.practise(p.id) }
  }

  // ---- the pack ----
  function curate(text, ctx = {}) {
    const msg = String(text || '').slice(0, 600)
    const tri = triage(msg)
    const intent = parseIntent(msg, CAT, ctx)
    const base = { v: 1, engine: CURATOR_VERSION, catalog: CAT.built, ask: msg, created: new Date().toISOString() }
    if (tri.block) return { ...base, id: null, blocked: true, title: tri.class === 'crisis' ? 'Please reach out to someone now' : 'Please get medical help now', safety: tri, intent, steps: [], deeper: [], prose: tri.notes.join(' ') }

    const onlyVisit = intent.wants.visit && !intent.topics.length && !/\b(talks?|practi|read)/.test(intent.text)
    const byId = (k, id) => (k === 'clip' ? CAT._talk[id] : k === 'practice' ? CAT._prac[id] : k === 'resource' ? CAT._read[id] : k === 'place' ? CAT._place[id] : null)
    // 1. a curated mini-course as the backbone when one fits the ask (satsang-curation's ordered steps + why-notes)
    const courses = tri.groundingOnly || onlyVisit ? [] : pickCourses(intent, tri)
    const queue = [], used = new Set(), coursePlaces = []
    const pracOK = (p) => p && practiceAllowed(p, intent, tri)
    const take = (c, max, roles) => {
      let n = 0
      for (const st of c.steps) {
        if (n >= max) break
        if (roles && !roles.includes(st.role)) continue
        const x = byId(st.k, st.id); if (!x || used.has(st.id)) continue
        if (st.k === 'practice' && !pracOK(x)) continue
        if (st.k === 'clip' && intent.minutes && x.dur > Math.max(intent.minutes * 60 * 2.2, 900) && c.steps.some((o) => o.k === 'clip' && !used.has(o.id) && byId('clip', o.id)?.dur <= intent.minutes * 60 * 2.2)) continue
        queue.push({ k: st.k === 'clip' ? 'watch' : st.k === 'resource' ? 'read' : 'practise', x, why: st.note, course: c.id, unit: st.ut }); used.add(st.id); n++
      }
      for (const d of c.deeper || []) if (d.k === 'place' && CAT._place[d.id]) coursePlaces.push({ p: CAT._place[d.id], why: d.note })
    }
    if (courses[0]) take(courses[0], courses[1] ? 5 : intent.minutes ? 5 : 6)
    if (courses[1]) take(courses[1], 3, ['watch', 'practise', 'read'])
    // 2. retrieval fills what the course does not give (or builds the whole path when no course fits)
    const haveTalks = queue.filter((q) => q.k === 'watch').length, haveReads = queue.filter((q) => q.k === 'read').length
    const nTalks = tri.groundingOnly ? 0 : onlyVisit ? 1 : intent.wants.watch ? (intent.wants.deep ? 4 : 3) : 2
    const talks = haveTalks >= 2 || !nTalks ? [] : pickTalks(intent, nTalks + haveTalks).filter((t) => !used.has(t.id)).slice(0, Math.max(0, nTalks - haveTalks))
    const pracs = intent.wants.practise || !onlyVisit || tri.groundingOnly ? pickPractices(intent, tri, tri.intense ? 3 : 2).filter((p) => !used.has(p.id)) : []
    const wantReads = tri.groundingOnly ? 0 : intent.wants.read ? 2 : onlyVisit ? 0 : 1
    const reads = haveReads >= wantReads ? [] : pickReadings(intent, wantReads + 1).filter((r) => !used.has(r.id)).slice(0, wantReads - haveReads)
    const cols = tri.groundingOnly ? [] : pickCollections(intent, tri)
    const nPlaces = tri.groundingOnly ? 0 : intent.wants.visit ? 4 : tri.gentle ? 0 : 2
    const places = pickPlaces(intent, tri, [...queue.filter((q) => q.k === 'watch').map((q) => q.x), ...talks], nPlaces + coursePlaces.length)
    talks.forEach((t) => queue.push({ k: 'watch', x: t }))
    reads.forEach((r, i) => queue.splice(Math.min(queue.length, 1 + i * 2), 0, { k: 'read', x: r }))

    // 3. order: day 1 a way in + the daily practice; then one item a day; the daily practice repeats
    const steps = []
    const qPracs = queue.filter((q) => q.k === 'practise').map((q) => q.x)
    const all = [...qPracs, ...pracs.filter((p) => !qPracs.includes(p))]
    const doable = [...all.filter((p) => !(p.nt || p.intense || p.eso)), ...all.filter((p) => p.eso && !(p.nt || p.intense))]
    if (tri.gentle) doable.sort((a, b) => (GENTLE.test(b.id) ? 1 : 0) - (GENTLE.test(a.id) ? 1 : 0))
    const mainP = doable[0] || null
    const content = queue.filter((q) => !(q.k === 'practise' && q.x === mainP))
    const horizon = intent.days || Math.max(onlyVisit ? 1 : 3, Math.min(10, content.length))
    if (mainP) { const q = queue.find((x) => x.x === mainP); steps.push({ ...practiceItem(mainP, intent, tri), why: q?.why ? `${q.why} ${whyFit(mainP, intent)}`.trim() : practiceItem(mainP, intent, tri).why, day: 1, daily: true, course: q?.course }) }
    let day = 1, ti = 0
    for (const q of content) {
      if (q.k === 'watch') { steps.push({ role: 'watch', kind: 'talk', ref: `clip:${q.x.id}`, id: q.x.id, title: q.x.t, by: q.x.by, tradition: q.x.tr ? T(q.x.tr) : null, minutes: Math.max(1, Math.round(q.x.dur / 60)), why: q.why || whyTalk(q.x, intent, ti), gold: q.x.g ? true : undefined, url: url.watch(q.x.id), day, course: q.course, unit: q.unit }); ti++ }
      else if (q.k === 'read') steps.push({ role: 'read', kind: 'reading', ref: `resource:${q.x.id}`, id: q.x.id, title: q.x.t, by: q.x.by, why: q.why || whyReading(q.x), link: q.x.link, url: url.read(q.x.id), day, course: q.course, unit: q.unit })
      else steps.push({ ...practiceItem(q.x, intent, tri), why: q.why ? `${q.why} ${whyFit(q.x, intent)}`.trim() : practiceItem(q.x, intent, tri).why, day, alt: true, course: q.course, unit: q.unit })
      day = Math.min(horizon, day + 1)
    }
    for (const p of pracs.filter((p) => p !== mainP && !steps.some((s) => s.id === p.id)).slice(0, qPracs.length ? 0 : mainP ? 1 : 2)) steps.push({ ...practiceItem(p, intent, tri), day: Math.min(horizon, day), alt: true })
    if (!tri.groundingOnly && steps.length && intent.topics[0]) steps.push({ role: 'reflect', kind: 'reflect', id: null, ref: null, title: 'Look back', why: reflectLine(intent), day: horizon })
    steps.forEach((s, i) => { s.n = i + 1; for (const k of ['course', 'unit', 'gold']) if (s[k] == null) delete s[k] })

    const deeper = []
    for (const c of cols) deeper.push({ role: 'collection', kind: 'collection', ref: `collection:${c.id}`, id: c.id, title: c.t, why: c.why || `${first(c.intro, 170)}${c.days ? ` ${c.days} ${c.k === 'journey' ? 'days' : 'steps'}.` : ''}`, url: url.collection(c.id), orientationOnly: c.eso || undefined })
    for (const c of courses.filter((c) => c.live)) deeper.push({ role: 'collection', kind: 'course', ref: `collection:${c.id}`, id: c.id, title: c.t, why: `A Satsang series${c.top ? ` inside ${topicLab(c.top)}` : ''}: ${first(c.intro, 200)} Plays one session at a time, with your progress kept.`, url: `${SITE}/#series/${c.id}`, orientationOnly: /orientation only/i.test(c.caut || '') || undefined })
    const placeList = [...coursePlaces.filter(({ p }) => !intent.country || p.c === intent.country).map(({ p, why }) => ({ p, why })), ...places.map((p) => ({ p }))].filter((x, i, a) => a.findIndex((y) => y.p.id === x.p.id) === i).slice(0, Math.max(nPlaces, coursePlaces.length ? 2 : 0))
    for (const { p, why } of placeList) deeper.push({ role: 'visit', kind: 'place', ref: `place:${p.id}`, id: p.id, title: p.n, by: [p.city, CAT.countries[p.c] || p.c].filter(Boolean).join(', '), tradition: (p.tr || [])[0] ? T(p.tr[0]) : null,
      why: why ? `${why}${(p.ret || [])[0] ? ` Programme: ${p.ret[0].n}${p.ret[0].len ? ` (${p.ret[0].len})` : ''}; dates on the place's own schedule.` : ''}` : whyPlace(p, intent), programmes: (p.ret || []).slice(0, 3), url: url.visit(p.id) })
    for (const id of intent.topics.slice(0, 1)) if (CAT._topic[id]?.hub || CAT._topic[id]) deeper.push({ role: 'topic', kind: 'topic', ref: `topic:${id}`, id, title: `${topicLab(id)}: the traditions side by side`, why: first(CAT._topic[id].intro, 170) || `Every tradition's take on ${topicLab(id).toLowerCase()}, with talks.`, url: url.topic(id.split('/')[0]) })

    const title = titleOf(intent, tri)
    const notes = [...tri.notes]
    if (!tri.intense && steps.some((s) => s.orientationOnly && s.role === 'practise') && !notes.some((n) => /orientation/.test(n))) notes.push(LINE_ESO)
    const pack = { ...base, id: packId(msg, CAT.built), title, intent: { topics: intent.topics.map((id) => ({ id, label: topicLab(id), question: (intent.questions[id] || [])[0] ? CAT._topic[id].qs.find((q) => q.id === intent.questions[id][0])?.l : undefined })), traditions: intent.traditions.map((id) => ({ id, label: T(id) })), minutesPerDay: intent.minutes, days: horizon, level: intent.level, country: intent.country ? { code: intent.country, name: CAT.countries[intent.country] } : null, wants: intent.wants, retreat: intent.retreat },
      safety: { class: tri.class, intent: tri.intent, gentle: tri.gentle, intense: tri.intense, conditions: tri.conditions, notes, version: tri.version }, steps, deeper }
    pack.prose = proseOf(pack, intent, tri)
    if (!steps.length && !deeper.length) pack.empty = true
    return pack
  }

  const LINE_ESO = 'Practices marked orientation are traditionally learned from a teacher: read what the tradition says and where it is taught; no particular experience or result is promised.'
  function reflectLine(intent) {
    const id = intent.topics[0], q = (intent.questions[id] || [])[0], qq = q ? CAT._topic[id].qs.find((x) => x.id === q) : null
    return qq ? `After these, write two lines: what you now think about "${qq.l.replace(/\?$/, '')}", and which take resonated most.` : `After these, write two lines: what changed in how you see ${topicLab(id).toLowerCase()}, and which take resonated most.`
  }
  function titleOf(intent, tri) {
    const t = intent.topics[0] ? topicLab(intent.topics[0]) : null
    const q = t && (intent.questions[intent.topics[0]] || [])[0] ? CAT._topic[intent.topics[0]].qs.find((x) => x.id === intent.questions[intent.topics[0]][0])?.l : null
    if (tri.groundingOnly) return 'Gentle grounding, for now'
    const inC = intent.country ? ' in ' + (/^(United|Kingdom|People|Netherlands)/.test(CAT.countries[intent.country]) ? 'the ' : '') + CAT.countries[intent.country] : ''
    if (intent.wants.visit && intent.retreat?.weekend) return `A weekend retreat${inC}${t ? ': ' + t : ''}`
    if (intent.wants.visit && !t) return `Where to go deeper${inC}`
    const lead = !t && intent.traditions[0] ? `${T(intent.traditions[0]).split(' (')[0]}: a first path` : t ? (q && intent.topics[0] === 'rebirth' && /past/.test(q.toLowerCase()) ? 'Rebirth and past lives' : t) : 'A first path'
    return intent.minutes ? `${lead}, ${intent.minutes} minutes a day` : lead
  }
  function proseOf(pack, intent, tri) {
    const P = []
    const ts = pack.steps.filter((s) => s.role === 'watch'), ps = pack.steps.filter((s) => s.role === 'practise'), rs = pack.steps.filter((s) => s.role === 'read')
    const topic = intent.topics[0] ? CAT._topic[intent.topics[0]] : null
    if (topic?.intro) P.push(first(topic.intro, 200))
    const ser = pack.deeper.find((d) => d.kind === 'course') || null, serId = pack.steps.find((s) => s.course)?.course
    const serT = ser?.title || (serId ? (CAT.courses || []).find((c) => c.id === serId)?.t : null)
    if (serT) P.push(`This path follows Satsang's series "${serT}"; the whole series, session by session, is on the ${topic ? topic.l || 'topic' : 'topic'} page.`)
    if (ts.length) P.push(`Start with ${ts[0].by || 'the first talk'}${ts[0].minutes ? ` (${ts[0].minutes} min)` : ''}${ts.length > 1 ? `, then ${[...new Set(ts.slice(1).map((s) => s.by).filter((b) => b && b !== ts[0].by))].join(' and ') || 'the others'} for other angles` : ''}.`)
    const main = ps.find((s) => s.daily)
    if (main) P.push(`Each day: ${main.title}${main.minutes ? `, about ${main.minutes} minutes` : ''}${main.orientationOnly ? ' (orientation: read it first)' : ''}.`)
    if (rs.length) P.push(`For reading, ${rs.map((r) => `"${r.title}"`).join(' and ')}${rs.length === 1 ? ' is free online' : ' are free online'}.`)
    const places = pack.deeper.filter((d) => d.role === 'visit')
    if (places.length) P.push(`To go deeper in person: ${places.slice(0, 3).map((p) => p.title).join(', ')}${intent.retreat?.weekend ? '; check each schedule for weekend dates' : ''}.`)
    else if (pack.deeper.some((d) => d.role === 'collection')) P.push(`When you want more, ${pack.deeper.find((d) => d.role === 'collection').title} goes further.`)
    // safety notes travel separately (pack.safety.notes) and are shown above the steps, never buried in the prose
    if (!ts.length && !ps.length && !rs.length && !places.length) P.push("I couldn't find a close match in Satsang's catalog for that. Try naming a topic (rebirth, death, breath, kindness), a tradition, or a place.")
    return P.join(' ')
  }

  return { curate, parseIntent: (t, c) => parseIntent(t, CAT, c), llm }
}

// stable id for a pack: same words + same catalog -> same pack id (a save stores the result under it)
export function packId(msg, built) {
  const s = fold(msg).replace(/\s+/g, ' ').trim() + '|' + built
  let h1 = 0x811c9dc5, h2 = 0x01000193
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = Math.imul(h2 + c, 2246822519) >>> 0 }
  return 'ask-' + h1.toString(36) + h2.toString(36)
}
