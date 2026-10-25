// Live eval of the satsang-search Worker against the 10 queries of ../wiser-search-index/eval.md (+ API contract checks).
//   node search/test/eval-live.mjs [base=https://satsang-search.tradesprior.workers.dev]
// Joins ids to app/clips.json locally for readable output. Writes search/test/eval-live.md.
import fs from 'node:fs'
import path from 'node:path'
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const BASE = process.argv[2] || 'https://satsang-search.tradesprior.workers.dev'
const clips = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(ROOT, 'app/clips.json'), 'utf8')).map((c) => [c.id, c]))
const HELD = ['ajahn-sucitto', 'jack-kornfield', 'swami-ramdev', 'yogi-bhajan', 'taizan-maezumi', 'sogyal-rinpoche', 'swami-vishnudevananda', 'swami-rama']
const T = (c) => clips[c] ? `${clips[c].teacher} · ${clips[c].segTitle || clips[c].title}` : c
const rx = (s) => new RegExp(s, 'i')
// expectations taken from eval.md's verdicts (what the prototype got right; the Worker must match it)
const CASES = [
  { q: 'fear of death', talks: rx('fear of (death|dying)'), series: ['contemplating-death', 'seven-days-with-death'], practices: rx('death|maranasati'), watch: true },
  { q: 'past lives', talks: rx('past li|rebirth|previous'), series: ['remembering-past-lives', 'how-to-discern-past-lives'] },
  { q: 'consciousness transference / phowa', practices: rx('powa|phowa') },
  { q: 'how to deal with anger', talks: rx('anger') },
  { q: 'what is nonduality', talks: rx('non-?dual') },
  { q: 'kundalini safety', talks: rx('kundalini') },
  { q: 'grief', talks: rx('grief|griev|loss|death') },
  { q: 'jhana', talks: rx('jh[aā]na|samadhi|concentration') },
  { q: 'sufi remembrance', talks: rx('zikr|dhikr|remembrance|sufi'), series: ['sufi-remembrance'] },
  { q: 'middle pillar', lowConf: true, series: ['middle-pillar-week', 'hermetic-orientation'] },
]
const ALLOWED = new Set(['q', 'ver', 'conf', 'degraded', 'talks', 'chips', 'similar', 'watch', 'series', 'practices', 'anchor', 'clip', 'score', 'sem', 'lex', 'type', 'id', 'via', 'yt', 'start', 'end', 'approx'])
const keysOk = (o) => (Array.isArray(o) ? o.every(keysOk) : o && typeof o === 'object' ? Object.entries(o).every(([k, v]) => ALLOWED.has(k) && keysOk(v)) : true)
let pass = 0, fail = 0; const md = [`# satsang-search live eval (${new Date().toISOString()})`, '', `Base: ${BASE}`, '']
const ok = (c, msg) => { (c ? pass++ : fail++); if (!c) console.log('  FAIL', msg); return c ? 'ok' : 'FAIL' }
const h = await (await fetch(BASE + '/health')).json()
md.push(`/health: ver ${h.ver}, model ${h.model}, pooling ${h.pooling}, counts ${JSON.stringify(h.counts)}`, '')
ok(h.pooling === 'cls' && h.counts.talks > 9000, 'health')
for (const C of CASES) {
  const t0 = Date.now(), r = await fetch(`${BASE}/search?q=${encodeURIComponent(C.q)}&scope=all`), j = await r.json(), ms = Date.now() - t0
  const top = j.talks.slice(0, 8).map((t) => t.clip), checks = []
  checks.push(['200 + no degraded', ok(r.status === 200 && !j.degraded, C.q + ' status')])
  checks.push(['ids/scores only', ok(keysOk(j), C.q + ' keys')])
  checks.push(['no held teacher', ok(![...j.talks, ...j.similar, ...j.watch].some((t) => HELD.includes(clips[t.clip]?.speaker)) && !j.chips.some((c) => c.type === 'teacher' && HELD.includes(c.id)), C.q + ' held')])
  if (C.talks) checks.push(['talk match in top 8', ok(top.some((id) => C.talks.test(T(id))), C.q + ' talks')])
  if (C.series) checks.push(['series in top 3', ok(j.series.slice(0, 3).some((s) => C.series.includes(s.id)), C.q + ' series ' + j.series.slice(0, 3).map((s) => s.id))])
  if (C.practices) checks.push(['practice in top 4', ok(j.practices.slice(0, 4).some((p) => C.practices.test(p.id)), C.q + ' practices')])
  if (C.lowConf) checks.push(['conf < 0.66 (lead with series)', ok(j.conf < 0.66 && j.anchor.startsWith('series:'), C.q + ' lowconf ' + j.conf)])
  else checks.push(['conf >= 0.66', ok(j.conf >= 0.66, C.q + ' conf ' + j.conf)])
  if (C.watch) checks.push(['transcript moments', ok(j.watch.length > 0 && j.watch.every((w) => w.score >= 0.66), C.q + ' watch')])
  checks.push(['similar carry via', ok(j.similar.length > 0 && j.similar.every((s) => s.via?.length), C.q + ' similar')])
  md.push(`## ${C.q}`, `conf ${j.conf} · anchor ${j.anchor} · ${ms} ms · ${checks.map(([n, v]) => `${n}: ${v}`).join(' · ')}`, '',
    '**Talks (hybrid)**', ...top.map((id, i) => `${i + 1}. ${T(id)} (${j.talks[i].sem ?? '-'})`), '',
    `**Chips** ${j.chips.slice(0, 8).map((c) => `${c.type}:${c.id}`).join(', ')}`, '',
    `**Similar** ${j.similar.slice(0, 4).map((s) => `${T(s.clip)} [${s.via.join(', ')}]`).join('; ')}`, '',
    `**Moments** ${j.watch.length ? j.watch.slice(0, 3).map((w) => `${T(w.clip)} @${w.start}s${w.approx ? '~' : ''} (${w.score})`).join('; ') : 'none above the 0.66 floor'}`, '',
    `**Series** ${j.series.slice(0, 3).map((s) => `${s.id} ${s.score}`).join(', ')} · **Practices** ${j.practices.slice(0, 3).map((p) => p.id).join(', ')}`, '')
  console.log(C.q, j.conf, ms + 'ms', checks.map((c) => c[1]).join(' '))
}
// /similar + filter contract
const s = await (await fetch(`${BASE}/similar?clip=NBfbBbvX-VY&within=topic:death&k=5`)).json()
md.push('## /similar', `NBfbBbvX-VY within topic:death -> ${s.similar.map((x) => T(x.clip)).join('; ')} · ${ok(s.similar.length === 5 && s.similar.every((x) => (clips[x.clip]?.topics || []).some((t) => t === 'death' || t.startsWith('death'))), 'similar within')}`, '')
const f = await (await fetch(`${BASE}/search?q=${encodeURIComponent('fear of death')}&teacher=rupert-spira`)).json()
md.push('## filter', `fear of death & teacher=rupert-spira -> ${f.talks.slice(0, 3).map((t) => T(t.clip)).join('; ')} · ${ok(f.talks.length && f.talks.every((t) => clips[t.clip]?.speaker === 'rupert-spira'), 'filter teacher')}`, '')
md.push(`**${pass} passed, ${fail} failed**`)
fs.writeFileSync(path.join(ROOT, 'search/test/eval-live.md'), md.join('\n') + '\n')
console.log(`${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
