// Run the tension blocks on a real public journal and write the picks for review (specs/FORYOU-TENSIONS.md §6).
//   node tools/awaken/eval-foryou.mjs [owner/repo] [out.md]      default prx0r/nibbanahelp -> private/foryou/eval-<date>.md (gitignored)
// The output names the journal's own tension titles, so it must never be committed: /private/ is gitignored and the deploy guard
// and secret scan refuse it.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchDocs, extractSignals, inferStart, HELD_MAIN } from '../../app/src/journal.js'
import { tensionsOf, planBlocks, knotsFor } from '../../app/src/tensions.js'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'))
const SRC = process.argv[2] || 'prx0r/nibbanahelp'
if (!/^[\w.-]+\/[\w.-]+$/.test(SRC)) { console.error('usage: node tools/awaken/eval-foryou.mjs [owner/repo] [out.md]'); process.exit(2) }
const [owner, repo] = SRC.split('/')
const day = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)   // the owner's calendar day (Asia/Phnom_Penh)
const OUT = process.argv[3] || path.join(ROOT, `private/foryou/eval-${day}.md`)
const KN = J('app/site/data/wisegraph/knots.json'), CL = J('app/clips.site.json'), COLS = J('app/site/data/wisegraph/collections.json'), WISE = J('app/site/data/wisegraph/wise.json')
const BY = Object.fromEntries(CL.map((c) => [c.id, c])), GOLD = J('app/site/data/wisegraph/gold.json')
const tier = (id) => GOLD.gold[id] ? 'gold' : (GOLD.strong || []).includes(id) ? 'strong' : 'standard'
const docs = await fetchDocs({ kind: 'github', owner, repo })
const sig = extractSignals(docs, { start: inferStart(docs) }); sig.tensions = tensionsOf(docs)
const X = { clip: (id) => BY[id] && BY[id].format !== 'vertical' ? BY[id] : null, practice: (id) => COLS.practices[id] || null, isHeld: (s) => HELD_MAIN.has(s) || !!WISE.people?.[s]?.safety }
const t0 = performance.now(), plan = planBlocks(sig, KN, X), ms = (performance.now() - t0).toFixed(1)
const mm = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const L = [`# For You tension blocks: eval ${day} (${owner}/${repo})`, '', `PRIVATE: names the journal's tension titles. Never commit. Safety ${sig.safety.class}; level ${sig.level.value}; planned in ${ms} ms.`, '']
L.push('Tensions read: ' + sig.tensions.map((t) => `${t.title} [${t.status}] -> ${knotsFor(t, KN).map((k) => k.id + ':' + k.w).join(' ')}`).join(' · '), '')
for (const b of plan.blocks) {
  L.push(`## ${b.title} (${b.kind}, ${b.status}, U ${b.U}, knot ${b.knot})`)
  for (const r of b.roles) for (const p of r.picks) {
    const c = p.c, who = c ? c.teacher : p.p ? p.p.tradLabel || p.p.tradition : ''
    const what = p.k === 'practice' ? `practice: ${p.p.name}` : `${c.title}${p.k === 'moment' ? ` [${mm(p.start)}-${mm(p.end)}]` : ''}`
    L.push(`- **${r.label}** · ${what} — ${who}${c ? ` (${tier(c.id)}${p.tr ? ', Trika' : ''}, ${Math.round((c.end ? c.end - (c.start || 0) : c.dur) / 60)} min)` : ''} · _${p.why}_ · \`${p.ref}\``)
    L.push(`  - judgement: `)
  }
  L.push('')
}
fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, L.join('\n'))
console.log(L.join('\n'))
