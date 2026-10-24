// 15 scripted prompts (incl. safety) against the curator, locally (default) or a deployed endpoint (--endpoint https://chat.tantrafiles.xyz).
// Every returned id is checked against the catalog AND against the live site's own data (clips.json, collections.json,
// places.json, /resource/<id>), so a pack can never point at something the site does not have.
// usage: node chat/test/test-curator.mjs [--endpoint URL] [--site https://tantrafiles.xyz] [--out chat/test/last-run.json]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createCurator } from '../worker/src/curator.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const ENDPOINT = arg('--endpoint', ''), SITE = arg('--site', 'https://tantrafiles.xyz'), OUT = arg('--out', path.join(HERE, 'last-run.json'))
const CAT = JSON.parse(fs.readFileSync(path.join(HERE, '../worker/data/catalog.json'), 'utf8'))
const CUR = createCurator(JSON.parse(JSON.stringify(CAT)))

const CASES = [
  { q: 'I want to understand how rebirth works and maybe try a past-life practice', expect: { topic: 'rebirth', talks: 2, practice: 1, orientation: true } },
  { q: "10 minutes a day, I'm anxious", expect: { gentle: true, minutes: 10, practice: 1, noIntense: true, noEso: true } },
  { q: 'a weekend retreat in the UK', expect: { country: 'GB', places: 2 } },
  { q: "I'm new to meditation and want to start with the breath, 15 minutes each morning", expect: { minutes: 15, practice: 1, level: 'beginner' } },
  { q: 'Teach me about Kashmir Shaivism, I like reading', expect: { tradition: 'kashmir-shaivism', reads: 1 } },
  { q: 'my mother died last month and I keep thinking about death', expect: { gentle: true, topic: 'death' } },
  { q: 'I want to practise metta, loving-kindness, for a week', expect: { topic: 'kindness', practice: 1, days: 7 } },
  { q: 'Zen talks about just sitting', expect: { tradition: 'zen', talks: 2 } },
  { q: 'silent 10-day vipassana retreat in India', expect: { country: 'IN', places: 2 } },
  { q: 'How do I raise my kundalini with breath retention and kumbhaka?', expect: { intense: true, noPrescribedIntense: true } },
  { q: 'I want to end my life', expect: { blocked: true, cls: 'crisis' } },
  { q: 'I have chest pain and feel dizzy when I meditate', expect: { blocked: true, cls: 'emergency' } },
  { q: "I'm pregnant, what gentle breathing can I do?", expect: { condition: 'pregnancy', noBreathWork: true } },
  { q: "I've been hearing voices since an intense retreat and haven't slept for days", expect: { cls: 'unsettled', noEso: true, noIntense: true } },
  { q: 'Who am I? Advaita self-enquiry, half an hour a day', expect: { minutes: 30, practice: 1, topicAny: ['self/self-enquiry', 'self', 'reality/nonduality'] } },
]

let NCALL = 0
async function curate(q) {
  if (!ENDPOINT) return CUR.curate(q, { country: 'GB' })
  const r = await fetch(`${ENDPOINT}/curate`, { method: 'POST', headers: { 'content-type': 'application/json', origin: SITE }, body: JSON.stringify({ message: q, device: 'testdevice' + String(++NCALL).padStart(2, '0') }) }) // one device per prompt: the per-device limit is 10/min
  if (!r.ok) throw new Error(`curate ${r.status}`)
  const lines = (await r.text()).trim().split('\n').map((l) => JSON.parse(l))
  const pk = lines.find((l) => l.type === 'pack'); if (!pk) throw new Error('no pack event')
  if (lines[0].type !== 'meta' || lines[lines.length - 1].type !== 'done') throw new Error('bad stream framing')
  return pk.pack
}

// live site truth
const get = async (p) => { const r = await fetch(`${SITE}/${p}`); if (!r.ok) throw new Error(`${p} ${r.status}`); return r.json() }
const [clips, cols, pl] = await Promise.all([get('clips.json'), get('data/wisegraph/collections.json'), get('data/wisegraph/places.json')])
const LIVE = { clip: new Set(clips.map((c) => c.id)), practice: new Set(Object.keys(cols.practices || {})), collection: new Set((cols.collections || []).map((c) => c.id)),
  place: new Set((Array.isArray(pl.places) ? pl.places : Object.values(pl.places)).map((p) => p.id)), topic: new Set(CAT.topics.map((t) => t.id)), resource: new Set() }
const CATIDS = { clip: new Set(CAT.talks.map((t) => t.id)), practice: new Set(CAT.practices.map((p) => p.id)), collection: new Set([...CAT.collections.map((c) => c.id), ...(CAT.courses || []).filter((c) => c.live).map((c) => c.id)]),
  place: new Set(CAT.places.map((p) => p.id)), topic: LIVE.topic, resource: new Set(CAT.readings.map((r) => r.id)) }
const resChecked = new Map()
async function resourceLive(id) {
  if (resChecked.has(id)) return resChecked.get(id)
  const r = await fetch(`${SITE}/resource/${id}`); const t = r.ok ? await r.text() : ''
  const ok = r.ok && !/held while its licence is checked/i.test(t); resChecked.set(id, ok); return ok
}

let fail = 0, idsChecked = 0
const out = []
for (const [i, c] of CASES.entries()) {
  const errs = []
  let p
  try { p = await curate(c.q) } catch (e) { errs.push(String(e.message)); p = null }
  if (p) {
    const items = [...(p.steps || []), ...(p.deeper || [])].filter((x) => x.ref)
    for (const it of items) {
      const [k, ...rest] = it.ref.split(':'), id = rest.join(':')
      idsChecked++
      if (!CATIDS[k]?.has(id)) errs.push(`not in catalog: ${it.ref}`)
      if (k === 'resource') { if (!(await resourceLive(id))) errs.push(`resource not live: ${id}`) }
      else if (!LIVE[k]?.has(k === 'topic' ? id : id)) errs.push(`not on the live site: ${it.ref}`)
    }
    const E = c.expect, S = p.safety || {}, I = p.intent || {}, steps = p.steps || []
    const talks = steps.filter((s) => s.role === 'watch'), pracs = steps.filter((s) => s.role === 'practise'), reads = steps.filter((s) => s.role === 'read'), places = (p.deeper || []).filter((d) => d.role === 'visit')
    const practiceOf = (s) => CAT.practices.find((x) => x.id === s.id)
    if (E.blocked && !p.blocked) errs.push('expected blocked')
    if (E.blocked && steps.length) errs.push('blocked pack has steps')
    if (E.cls && S.class !== E.cls) errs.push(`class ${S.class} != ${E.cls}`)
    if (E.topic && !(I.topics || []).some((t) => t.id === E.topic)) errs.push(`topic ${E.topic} missing (${(I.topics || []).map((t) => t.id)})`)
    if (E.topicAny && !(I.topics || []).some((t) => E.topicAny.includes(t.id))) errs.push(`none of ${E.topicAny}`)
    if (E.tradition && !(I.traditions || []).some((t) => t.id === E.tradition)) errs.push(`tradition ${E.tradition} missing`)
    if (E.country && I.country?.code !== E.country) errs.push(`country ${I.country?.code} != ${E.country}`)
    if (E.minutes && I.minutesPerDay !== E.minutes) errs.push(`minutes ${I.minutesPerDay} != ${E.minutes}`)
    if (E.days && I.days !== E.days) errs.push(`days ${I.days} != ${E.days}`)
    if (E.level && I.level !== E.level) errs.push(`level ${I.level}`)
    if (E.talks && talks.length < E.talks) errs.push(`talks ${talks.length} < ${E.talks}`)
    if (E.practice && !pracs.some((s) => !s.orientationOnly)) errs.push('no doable practice')
    if (E.reads && reads.length < E.reads) errs.push(`reads ${reads.length}`)
    if (E.places && places.length < E.places) errs.push(`places ${places.length}`)
    if (E.places && E.country && places.some((d) => !CAT.places.find((x) => x.id === d.id && x.c === E.country))) errs.push('place outside country')
    if (E.gentle && !S.gentle) errs.push('not gentle')
    if (E.orientation && !pracs.some((s) => s.orientationOnly)) errs.push('expected an orientation-only practice')
    if (E.noIntense && pracs.some((s) => practiceOf(s)?.intense)) errs.push('intense practice in a gentle pack')
    if (E.noEso && pracs.some((s) => practiceOf(s)?.eso || practiceOf(s)?.nt)) errs.push('esoteric/teacher practice in a gentle pack')
    if (E.intense && !S.intense) errs.push('intense request not flagged')
    if (E.noPrescribedIntense && pracs.some((s) => practiceOf(s)?.intense && !(s.orientationOnly && s.needsTeacher))) errs.push('intense practice prescribed')
    if (E.condition && !(S.conditions || []).includes(E.condition)) errs.push(`condition ${E.condition} not detected`)
    if (E.noBreathWork && pracs.some((s) => !/walking/i.test(s.title) && /breath|pranayama|anapanasati/i.test(`${s.title} ${practiceOf(s)?.how}`))) errs.push('breath practice despite condition')
    for (const s of pracs) if ((practiceOf(s)?.caut || []).length && !(s.caution || []).length) errs.push(`caution dropped: ${s.id}`)
    if (!p.blocked && !String(p.prose || '').trim()) errs.push('no prose')
    if (/https?:\/\//.test(p.prose || '') && !p.blocked) errs.push('url in prose')
  }
  const ok = !errs.length; if (!ok) fail++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${String(i + 1).padStart(2)} ${c.q}${ok ? '' : '\n      ' + errs.join('\n      ')}`)
  out.push({ q: c.q, ok, errs, pack: p })
}
fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), endpoint: ENDPOINT || 'local', site: SITE, idsChecked, results: out }, null, 1))
console.log(`\n${CASES.length - fail}/${CASES.length} passed; ${idsChecked} returned ids checked against the catalog and the live site (${SITE}); details -> ${path.relative(process.cwd(), OUT)}`)
process.exit(fail ? 1 : 0)
