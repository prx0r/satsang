// Stage 1 · SourceText: fetch chapters, normalise to text, record edition/licence/segments with hashes. Deterministic.
// usage: node tools/extract/fetch.mjs <source-config.json>   (config = a SourceText with segments[].url and no text yet)
// Writes <dir>/<segment.id>.txt next to the config and fills segments[].{chars,sha256,title}, retrieved.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { htmlToText, sha256, readJSON, writeJSON } from './lib.mjs'
const cfgFile = process.argv[2]; if (!cfgFile) { console.error('usage: fetch.mjs <source-text.json>'); process.exit(2) }
const src = readJSON(cfgFile), dir = path.dirname(cfgFile)
// curl, not fetch: the sandbox proxy is on curl's path
const get = u => execFileSync('curl', ['-sL', '--max-time', '60', '-A', 'satsang-engine/0.1 (+https://engine.tantrafiles.xyz)', u], { encoding: 'utf8', maxBuffer: 1 << 26 })
for (const seg of src.segments) {
  const html = get(seg.url)
  const { title, text } = htmlToText(html)
  if (!text) throw new Error(`${seg.id}: no text at ${seg.url}`)
  fs.writeFileSync(path.join(dir, seg.file || `${seg.id}.txt`), text)
  Object.assign(seg, { file: seg.file || `${seg.id}.txt`, title: title || seg.title, chars: text.length, sha256: sha256(text) })
  console.log(seg.id, title, text.length, 'chars')
}
src.retrieved = new Date().toISOString().slice(0, 10)
writeJSON(cfgFile, src)
