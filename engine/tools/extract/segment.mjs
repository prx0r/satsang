// Stage 2 · Passages: split each segment into verbatim sentence spans with offsets, hashes and a rule-based kind guess. Deterministic.
// usage: node tools/extract/segment.mjs <source-text.json> <segment-id>[,<segment-id>…] <out passages.json>
import fs from 'node:fs'
import path from 'node:path'
import { segment, sha256, numbersIn, readJSON, writeJSON } from './lib.mjs'
export const SEGMENTER = 'satsang-segment/1'
const IMPERATIVE = /^(?:(?:then|now|first|finally|so|simply|slowly|mindfully|from here|once you’ve got hold of it|to begin with|as the breath goes in and out once|when [^,]{0,80},|if [^,]{0,80},)[,:]?\s+)*(?:sit|keep|raise|think|repeat|return|let|count|begin|inhale|exhale|breathe|center|centre|move|bring|focus|expand|make|take|observe|notice|pretend|relax|simply|stop|practice|practise|gather|consider|eliminate|put|spread|adjust|start|be|don’t|do not|choose|visit|settle)\b/i
const WARN = /\b(don’t|do not|never|be sure|careful|avoid|caution|headache|dizz|strain|force)\b/i
const COND = /^(?:when|if|once|as soon as|whenever)\b|\b(if you|when you)\b/i
const DEVOTION = /\b(buddho me nātho|dhammo me nātho|saṅgho me nātho|refuge|homage|triple gem)\b/i
const THEORY = /\b(knowledge|mundane|transcendent|nature|stress|intuitive powers|clairvoyance|nibbāna|avijjā|asaṅkhata)\b/i
export function kindGuess(s) {
  const k = []
  if (IMPERATIVE.test(s)) k.push('instruction')
  if (COND.test(s)) k.push('condition')
  if (WARN.test(s)) k.push('warning')
  if (DEVOTION.test(s)) k.push('devotional')
  if (!k.length && THEORY.test(s)) k.push('theory')
  if (!k.length) k.push('description')
  return k
}
export function passages(src, dir, segIds) {
  const out = []
  for (const sid of segIds) {
    const seg = src.segments.find(s => s.id === sid); if (!seg) throw new Error(`no segment ${sid}`)
    const text = fs.readFileSync(path.join(dir, seg.file), 'utf8')
    if (sha256(text) !== seg.sha256) throw new Error(`${sid}: text hash differs from source-text.json (re-run fetch)`)
    for (const p of segment(text)) for (const s of p.sentences) {
      const t = text.slice(s.start, s.end)
      out.push({ id: `${sid}:${s.id}`, segment: sid, para: p.id, start: s.start, end: s.end, text: t, sha256: sha256(t).slice(0, 16), kind_guess: kindGuess(t), numbers: numbersIn(t) })
    }
  }
  return out
}
if (process.argv[1]?.endsWith('segment.mjs')) {
  const [cfg, segs, outFile] = process.argv.slice(2)
  if (!outFile) { console.error('usage: segment.mjs <source-text.json> <seg[,seg]> <out.json>'); process.exit(2) }
  const src = readJSON(cfg), P = passages(src, path.dirname(cfg), segs.split(','))
  writeJSON(outFile, { type: 'passages', schema_version: 1, source: src.id, segmenter: SEGMENTER, source_sha256: Object.fromEntries(src.segments.map(s => [s.id, s.sha256])), passages: P })
  const by = {}; for (const p of P) for (const k of p.kind_guess) by[k] = (by[k] || 0) + 1
  console.log(P.length, 'passages', JSON.stringify(by))
}
