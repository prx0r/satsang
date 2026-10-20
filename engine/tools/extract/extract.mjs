// Stage 3 · ExtractedInstructions. The one model step in the pipeline, fenced on both sides by deterministic code:
//   passages.json → [LLM with PROMPT.md + schema/instruction.json] → draft (quotes, no offsets) → resolve offsets → validate → instructions.json
// usage:
//   node tools/extract/extract.mjs <passages.json> --llm <model> --out <instructions.json> [--segments method-1] [--context m-2:p23.s1,…]
//       (needs OPENROUTER_API_KEY; temperature 0; one retry with the validator's errors appended)
//   node tools/extract/extract.mjs <passages.json> --draft <instructions.draft.json> --out <instructions.json>
//       (agent-manual: a draft written by an agent following the same PROMPT.md; identical resolution + validation)
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { ENGINE, readJSON, writeJSON, sha256 } from './lib.mjs'
import { validateInstructions, coverage } from './validate.mjs'
export const EXTRACTOR = 'satsang-extract/1'
const HERE = path.join(ENGINE, 'tools', 'extract')

export function resolve(draft, passages) {
  const P = new Map(passages.map(p => [p.id, p])), errors = []
  const out = structuredClone(draft)
  for (const ins of out.instructions) for (const s of ins.spans || []) {
    const p = P.get(s.passage); if (!p) { errors.push(`${ins.id}: no passage ${s.passage}`); continue }
    const i = p.text.indexOf(s.quote)
    if (i < 0) { errors.push(`${ins.id}: quote not verbatim in ${s.passage}: “${s.quote.slice(0, 60)}…”`); continue }
    if (p.text.indexOf(s.quote, i + 1) >= 0) errors.push(`${ins.id}: quote ambiguous in ${s.passage}`)
    s.segment = p.segment; s.start = p.start + i; s.end = s.start + s.quote.length
  }
  return { doc: out, errors }
}

export function buildPrompt(passages, segIds, contextIds) {
  const md = fs.readFileSync(path.join(HERE, 'PROMPT.md'), 'utf8')
  const tpl = md.slice(md.indexOf('\n', md.indexOf('## §A')) + 1, md.indexOf('## §B'))   // only the extraction prompt is sent
  const schema = fs.readFileSync(path.join(ENGINE, 'schema', 'instruction.json'), 'utf8')
  const rules = readJSON(path.join(HERE, 'defaults.json')).rules
  const grammar = readJSON(path.join(ENGINE, 'grammar.json'))
  const body = passages.filter(p => segIds.includes(p.segment) || contextIds.includes(p.id)).map(p => `[${p.id}] ${p.text}`).join('\n')
  const vocab = `loci: ${Object.keys(grammar.loci).join(', ')}\nregions: ${Object.keys(grammar.regions).join(', ')}\npaths: ${Object.keys(grammar.paths).join(', ')}`
  return tpl.split('{{PASSAGES}}').join(body).split('{{SCHEMA}}').join(schema).split('{{RULES}}').join(Object.entries(rules).map(([k, v]) => `- ${k}: ${v.sets}`).join('\n')).split('{{GRAMMAR}}').join(vocab)
}

function callLLM(model, prompt) {
  const key = process.env.OPENROUTER_API_KEY; if (!key) throw new Error('OPENROUTER_API_KEY not set: use --draft (agent-manual) instead')
  const body = JSON.stringify({ model, temperature: 0, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: prompt }] })
  const f = '/tmp/extract-req.json'; fs.writeFileSync(f, body)
  const r = JSON.parse(execFileSync('curl', ['-s', '--max-time', '300', 'https://openrouter.ai/api/v1/chat/completions', '-H', `Authorization: Bearer ${key}`, '-H', 'content-type: application/json', '--data-binary', '@' + f], { encoding: 'utf8', maxBuffer: 1 << 26 }))
  const txt = r.choices?.[0]?.message?.content; if (!txt) throw new Error('LLM: ' + JSON.stringify(r).slice(0, 300))
  return JSON.parse(txt.replace(/^```json\s*|```\s*$/g, ''))
}

export function finish(draft, passagesDoc, meta) {
  const passages = passagesDoc.passages
  const grammar = readJSON(path.join(ENGINE, 'grammar.json')), rules = readJSON(path.join(HERE, 'defaults.json')).rules
  const { doc, errors: rerr } = resolve(draft, passages)
  const v = validateInstructions(doc, passages, grammar, rules)
  const segs = [...new Set(doc.instructions.flatMap(i => i.spans.map(s => s.segment)).filter(Boolean))]
  const cov = coverage(doc, passages.filter(p => segs.includes(p.segment)))
  doc.type = 'instructions'; doc.extractor = { tool: EXTRACTOR, ...doc.extracted_by, ...meta }; delete doc.extracted_by
  doc.passages_sha256 = sha256(JSON.stringify(passages))
  doc.coverage = cov.rows
  doc.validation = { errors: [...rerr, ...v.errors], warnings: [...v.warnings, ...cov.uncovered.map(id => `uncovered actionable passage ${id}`)] }
  return doc
}

if (process.argv[1]?.endsWith('extract.mjs')) {
  const a = process.argv.slice(2), flag = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined }
  const pFile = a[0], out = flag('--out'); if (!pFile || !out) { console.error('usage: extract.mjs <passages.json> (--llm model | --draft file) --out file'); process.exit(2) }
  const pd = readJSON(pFile)
  let draft, meta
  if (flag('--draft')) { draft = readJSON(flag('--draft')); meta = { mode: draft.extracted_by?.mode || 'agent-manual' } }
  else {
    const segs = (flag('--segments') || '').split(',').filter(Boolean), ctx = (flag('--context') || '').split(',').filter(Boolean)
    const prompt = buildPrompt(pd.passages, segs, ctx)
    draft = callLLM(flag('--llm'), prompt); meta = { mode: 'llm', model: flag('--llm'), prompt_sha256: sha256(prompt) }
    let doc = finish(draft, pd, meta)
    if (doc.validation.errors.length) { // one repair round, then stop (never loop)
      draft = callLLM(flag('--llm'), prompt + '\n\nYour previous answer failed validation:\n' + doc.validation.errors.join('\n') + '\n\nPrevious answer:\n' + JSON.stringify(draft) + '\n\nReturn the corrected JSON only.')
      meta.repaired = true
    }
  }
  const doc = finish(draft, pd, meta)
  writeJSON(out, doc)
  const st = {}; for (const r of doc.coverage) st[r.status] = (st[r.status] || 0) + 1
  console.log(`${doc.instructions.length} instructions (${doc.instructions.filter(i => i.scripted).length} scripted) · coverage ${JSON.stringify(st)} · ${doc.validation.errors.length} errors · ${doc.validation.warnings.length} warnings`)
  for (const e of doc.validation.errors) console.error('ERROR', e)
  for (const w of doc.validation.warnings) console.error('warn ', w)
  if (doc.validation.errors.length) process.exitCode = 1
}
