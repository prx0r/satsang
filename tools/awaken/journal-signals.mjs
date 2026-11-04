// Awakening algorithm, slice 1: the CLI around the shipped pure functions. Since 2026-11-04 the functions live in
// app/src/journal.js (one copy, bundled into the site); this file re-exports them for the tests and runs the local proof.
// Output is derived personal data: it never goes in the repo, the open data, the MCP or any log (spec §9).
//
// CLI (local proof): node tools/awaken/journal-signals.mjs --dir <nibbanahelp clone> [--start YYYY-MM-DD] [--now ISO] [--out file]
//   prints a short summary only (concern ids, weights, safety class); the full object goes to --out (default tools/awaken/out/, gitignored).
export { VERSION, EXTRA, BANNED, HELD_MAIN, parseDoc, extractSignals, journalIntents, whyOk, inferStart, journalRail, safetyCard, isMuted, parseSource, fetchDocs } from '../../app/src/journal.js'
import { parseDoc, extractSignals, journalIntents, inferStart } from '../../app/src/journal.js'

// ---------- CLI ----------
if (import.meta.url === `file://${process.argv[1]}`) {
  const fs = await import('node:fs'), path = await import('node:path')
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d }
  const dir = arg('--dir'); if (!dir) { console.error('usage: --dir <nibbanahelp clone> [--start YYYY-MM-DD] [--now ISO] [--out file]'); process.exit(2) }
  const docs = []
  for (const [sub, kind] of [['entries', 'entry'], ['essays', 'essay'], ['tensions', 'tension']]) {
    const p = path.join(dir, sub); if (!fs.existsSync(p)) continue
    for (const f of fs.readdirSync(p).filter((f) => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md').sort())
      docs.push(parseDoc(fs.readFileSync(path.join(p, f), 'utf8'), { id: `${sub}/${f}`, kind }))
  }
  const now = Date.parse(arg('--now', new Date().toISOString())), sig = extractSignals(docs, { now, start: arg('--start', null) || inferStart(docs) })
  const here = path.dirname(new URL(import.meta.url).pathname), out = arg('--out', path.join(here, 'out', 'signals.json'))
  fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify({ ...sig, intents: journalIntents(sig) }, null, 1))
  console.log(`${docs.length} docs (${docs.filter((d) => d.visibility === 'public').length} public) -> ${sig.concerns.length} concerns; safety ${sig.safety.class}; level ${sig.level.value}`)
  for (const c of sig.concerns.slice(0, 6)) console.log(`  ${c.id.padEnd(16)} U ${c.U.toFixed(2)} ${c.trend.padEnd(9)} evidence ${c.evidence.length}`)
  console.log(`written ${out} (private: never commit)`)
}
