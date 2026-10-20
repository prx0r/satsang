// Validation for the text → practice layers (TEXT-TO-PRACTICE.md §4). Pure functions; every check returns {errors, warnings}.
import { numbersIn } from './lib.mjs'
const STOP = new Set(['the', 'of', 'a', 'an', 'at', 'to', 'in', 'on', 'and', 'or', 'for', 'tip', 'middle', 'base', 'centre', 'center', 'lotus', 'cave'])
const words = s => new Set(String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[a-z]+/g) || [])
export function locusWords(grammar, id) {
  const l = grammar.loci?.[id] || grammar.regions?.[id] || grammar.paths?.[id]
  if (!l) return null
  const w = new Set([...words(l.label), ...words(id.replace(/_/g, ' ')), ...(l.alias || []).flatMap(a => [...words(a)])])
  for (const x of STOP) w.delete(x)
  return w
}
const exists = (grammar, id) => !!(grammar.loci?.[id] || grammar.regions?.[id] || grammar.paths?.[id])
const okBasis = new Set(['quoted', 'paraphrased', 'inferred'])

/** instructions (resolved) vs passages, grammar, rules */
export function validateInstructions(doc, passages, grammar, rules) {
  const errors = [], warnings = [], P = new Map(passages.map(p => [p.id, p])), seen = new Set()
  const stages = new Set((doc.stages || []).map(s => s.id))
  const provOk = (ins, field) => {
    const pv = ins.prov?.[field]; if (!pv) return false
    if (!okBasis.has(pv.basis)) { errors.push(`${ins.id}.prov.${field}: basis must be quoted|paraphrased|inferred`); return false }
    if (pv.basis === 'inferred' && !pv.rule && !pv.cite) { errors.push(`${ins.id}.prov.${field}: inferred without rule or cite`); return false }
    if (pv.rule && !rules[pv.rule]) errors.push(`${ins.id}.prov.${field}: unknown rule ${pv.rule}`)
    for (const c of [].concat(pv.cite || [])) if (!P.has(c)) errors.push(`${ins.id}.prov.${field}: cite ${c} is not a passage`)
    if (pv.basis === 'paraphrased' && !pv.note) warnings.push(`${ins.id}.prov.${field}: paraphrase without a note`)
    return true
  }
  for (const ins of doc.instructions) {
    if (seen.has(ins.id)) errors.push(`duplicate id ${ins.id}`); seen.add(ins.id)
    if (!stages.has(ins.stage)) errors.push(`${ins.id}: unknown stage ${ins.stage}`)
    if (!ins.spans?.length) { errors.push(`${ins.id}: no span`); continue }
    const quotes = []
    for (const s of ins.spans) {
      const p = P.get(s.passage)
      if (!p) { errors.push(`${ins.id}: span passage ${s.passage} not found`); continue }
      if (s.start == null || s.end == null) { errors.push(`${ins.id}: span not resolved`); continue }
      const local = p.text.slice(s.start - p.start, s.end - p.start)
      if (local !== s.quote) errors.push(`${ins.id}: span offsets do not reproduce the quote in ${s.passage}`)
      quotes.push(s.quote)
    }
    const q = quotes.join(' '), nums = numbersIn(q), qw = words(q)
    if (ins.count?.value != null && !nums.includes(ins.count.value) && !provOk(ins, 'count')) errors.push(`${ins.id}: count ${ins.count.value} not in the quote and no inferred provenance`)
    if (ins.duration?.value != null && !(ins.duration.unit === 's' && nums.includes(ins.duration.value)) && !provOk(ins, 'duration')) errors.push(`${ins.id}: duration not stated by the source and no provenance`)
    for (const l of ins.locus || []) {
      if (!exists(grammar, l)) { errors.push(`${ins.id}: locus ${l} not in grammar`); continue }
      const lw = locusWords(grammar, l)
      if (![...lw].some(w => qw.has(w)) && !provOk(ins, 'locus')) errors.push(`${ins.id}: locus ${l} not supported by the quote and no provenance`)
    }
    if (ins.attention) {
      if (!exists(grammar, ins.attention.target)) errors.push(`${ins.id}: attention target ${ins.attention.target} not in grammar`)
      else if (![...locusWords(grammar, ins.attention.target)].some(w => qw.has(w)) && !(ins.locus || []).includes(ins.attention.target) && !provOk(ins, 'attention')) errors.push(`${ins.id}: attention target not supported by the quote and no provenance`)
    }
    if (ins.region && !exists(grammar, ins.region)) errors.push(`${ins.id}: region ${ins.region} not in grammar`)
    if (ins.path) for (const k of ['from', 'to', 'end']) if (ins.path[k] && !exists(grammar, ins.path[k])) errors.push(`${ins.id}: path.${k} ${ins.path[k]} not in grammar`)
    if (ins.breath?.phase && ins.breath.phase !== 'in_out' && !/breath|inhale|exhale|in-breath|out-breath/i.test(q) && !provOk(ins, 'breath')) errors.push(`${ins.id}: breath phase not in the quote and no provenance`)
    if (ins.breath?.phase === 'in_out' && !/breath/i.test(q) && !provOk(ins, 'breath')) errors.push(`${ins.id}: breath pairing not in the quote and no provenance`)
    for (const [w, v] of Object.entries(ins.words || {})) for (const t of [].concat(v)) if (typeof t === 'string' && !q.toLowerCase().includes(t.toLowerCase().split(',')[0].trim())) errors.push(`${ins.id}: word '${t}' (${w}) not in the quote`)
    if (ins.scripted === false && !ins.exclude_reason) errors.push(`${ins.id}: unscripted without exclude_reason`)
    if (ins.scripted == null) errors.push(`${ins.id}: scripted must be true or false`)
    if (typeof ins.confidence !== 'number') errors.push(`${ins.id}: confidence missing`)
    else if (ins.confidence < 0.8) warnings.push(`${ins.id}: confidence ${ins.confidence} < 0.8 → review queue`)
    for (const [f, pv] of Object.entries(ins.prov || {})) if (!['count', 'duration', 'locus', 'attention', 'breath'].includes(f)) provOk(ins, f)
  }
  return { errors, warnings }
}

/** coverage: every instruction-like passage in the extracted segments is either used by an instruction or covered by a rule */
export function coverage(doc, passages) {
  const used = new Map()
  for (const ins of doc.instructions) for (const s of ins.spans) (used.get(s.passage) || used.set(s.passage, []).get(s.passage)).push(ins.id)
  const order = passages.map(p => p.id), idx = new Map(order.map((id, i) => [id, i]))
  const ruleFor = id => (doc.coverage_rules || []).find(r => {
    const [a, b] = r.passages.split('..')
    if (a.endsWith(':*')) return id.startsWith(a.slice(0, -1))
    if (!b) return a === id
    return idx.get(id) >= idx.get(a) && idx.get(id) <= idx.get(b)
  })
  const rows = [], uncovered = []
  for (const p of passages) {
    const ids = used.get(p.id)
    if (ids) { rows.push({ passage: p.id, status: 'extracted', instructions: ids }); continue }
    const r = ruleFor(p.id)
    if (r) { rows.push({ passage: p.id, status: r.status, reason: r.reason }); continue }
    const actionable = p.kind_guess.some(k => ['instruction', 'warning'].includes(k))
    rows.push({ passage: p.id, status: actionable ? 'uncovered' : 'not_instruction', kind_guess: p.kind_guess })
    if (actionable) uncovered.push(p.id)
  }
  return { rows, uncovered }
}

/** narration lines vs instructions: the script never states what the source doesn't support without an inferred tag */
export function validateNarration(nar, instructions, grammar, practiceBlocks) {
  const errors = [], warnings = [], I = new Map(instructions.map(i => [i.id, i])), B = new Set(practiceBlocks)
  const NUMWORD = /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty)\b/gi
  const N = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 20 }
  const allLocus = Object.keys(grammar.loci || {}).concat(Object.keys(grammar.regions || {}))
  const seen = new Set()
  for (const ln of nar.lines) {
    if (seen.has(ln.id)) errors.push(`duplicate line ${ln.id}`); seen.add(ln.id)
    if (!B.has(ln.block)) errors.push(`${ln.id}: block ${ln.block} not in the practice`)
    if (!['quoted', 'paraphrased', 'inferred', 'framing'].includes(ln.basis)) errors.push(`${ln.id}: bad basis ${ln.basis}`)
    const ins = (ln.instructions || []).map(id => I.get(id) || (errors.push(`${ln.id}: unknown instruction ${id}`), null)).filter(Boolean)
    if (ln.basis !== 'framing' && !ins.length) errors.push(`${ln.id}: ${ln.basis} line without instructions`)
    if (ln.basis === 'inferred' && !ln.inferred?.rule && !ln.inferred?.note) errors.push(`${ln.id}: inferred line without a rule/note`)
    for (const i of ins) if (i.scripted === false) errors.push(`${ln.id}: narrates unscripted instruction ${i.id}`)
    // numbers: each number in the line must be a count/duration/number in its instructions, or the line must carry an inferred tag naming it
    const support = new Set(ins.flatMap(i => [i.count?.value, i.duration?.value, ...(i.count?.range || []), ...i.spans.flatMap(s => numbersIn(s.quote))]).filter(x => x != null))
    const inferredOK = (ln.inferred?.values || [])
    for (const m of ln.text.matchAll(NUMWORD)) {
      const v = N[m[1].toLowerCase()] ?? +m[1]
      const inf = ins.some(i => i.count?.value === v && i.prov?.count?.basis === 'inferred') || ins.some(i => i.duration?.value === v && i.prov?.duration?.basis === 'inferred')
      if (!support.has(v) && !inferredOK.includes(v)) errors.push(`${ln.id}: '${m[1]}' not supported by its instructions`)
      else if (inf && ln.basis !== 'inferred' && !inferredOK.includes(v)) errors.push(`${ln.id}: '${m[1]}' is an inferred count; the line must be tagged inferred`)
    }
    // body places: a place word in the line must belong to a locus its instructions use (or be tagged inferred)
    const lw = words(ln.text)
    for (const id of allLocus) {
      const w = locusWords(grammar, id); if (!w?.size) continue
      if (![...w].every(x => lw.has(x))) continue
      const used = new Set(ins.flatMap(i => [...(i.locus || []), i.attention?.target, i.region, i.path?.from, i.path?.to, i.path?.end]).filter(Boolean))
      const usedWords = new Set([...used].flatMap(u => [...(locusWords(grammar, u) || [])]))
      if (![...w].some(x => usedWords.has(x)) && !(ln.inferred?.loci || []).includes(id)) warnings.push(`${ln.id}: mentions ${id} which none of its instructions use`)
    }
    if (ln.quote) {
      const qi = ins.flatMap(i => i.spans).find(s => s.passage === ln.quote.passage && s.quote.includes(ln.quote.text))
      if (!qi) errors.push(`${ln.id}: quote line is not verbatim from its instructions' spans`)
      if (ln.quote.text.split(/\s+/).length > 25) errors.push(`${ln.id}: quote line over 25 words`)
    }
    if (ln.text.length > 140) errors.push(`${ln.id}: caption over 140 chars`)
  }
  for (const i of instructions) if (i.scripted && !nar.lines.some(l => (l.instructions || []).includes(i.id))) warnings.push(`instruction ${i.id} is scripted but never narrated (visual only)`)
  return { errors, warnings }
}
