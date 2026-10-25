// Pass 0b for a sectioned book: write source-text.json (public: metadata, licence evidence, one segment per section with
// hashes, no text) and passages.json (PRIVATE: sentence spans with text) using the standard satsang-segment/1 splitter.
// usage: node tools/extract/book-passages.mjs <public dir with sections.json + source-config.json> <private dir with sections/*.txt>
import fs from 'node:fs'
import path from 'node:path'
import { readJSON, writeJSON, sha256 } from './lib.mjs'
import { passages, SEGMENTER } from './segment.mjs'
const [pub, priv] = process.argv.slice(2)
const S = readJSON(path.join(pub, 'sections.json')), cfg = readJSON(path.join(pub, 'source-config.json'))
const src = { ...cfg, segments: S.sections.map(s => ({ id: s.id, label: s.heading, title: s.heading, url: s.url, file: s.file, chars: s.chars, sha256: s.sha256 })) }
// licence evidence must appear verbatim in its segment
const ev = fs.readFileSync(path.join(priv, src.segments.find(s => s.id === src.licence.evidence_segment).file), 'utf8')
if (!ev.includes(src.licence.evidence_quote)) throw new Error('licence evidence quote not found in ' + src.licence.evidence_segment)
const P = passages(src, priv, src.segments.map(s => s.id))
writeJSON(path.join(pub, 'source-text.json'), src)
writeJSON(path.join(priv, 'passages.json'), { type: 'passages', schema_version: 1, source: src.id, segmenter: SEGMENTER, source_sha256: Object.fromEntries(src.segments.map(s => [s.id, s.sha256])), passages: P })
// public passage index: ids, offsets, hashes, kind guesses, numbers; no text
const idx = P.map(p => [p.id, p.start, p.end, p.sha256, p.kind_guess.join('+'), p.numbers.join(' ')])
writeJSON(path.join(pub, 'passage-index.json'), { type: 'passage_index', source: src.id, segmenter: SEGMENTER, passages_sha256: sha256(JSON.stringify(P)), columns: ['id', 'start', 'end', 'sha256_16', 'kind_guess', 'numbers'], count: P.length, rows: idx })
const by = {}; for (const p of P) for (const k of p.kind_guess) by[k] = (by[k] || 0) + 1
console.log(P.length, 'passages', JSON.stringify(by))
