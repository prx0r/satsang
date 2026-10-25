// Stage 1 · SourceText: fetch chapters, normalise to text, record edition/licence/segments with hashes. Deterministic.
// usage: node tools/extract/fetch.mjs <source-config.json>   (config = a SourceText with segments[].url and no text yet)
// Writes <dir>/<segment.id>.txt next to the config and fills segments[].{chars,sha256,title}, retrieved.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { htmlToText, sha256, readJSON, writeJSON } from './lib.mjs'
const cfgFile = process.argv[2]; if (!cfgFile) { console.error('usage: fetch.mjs <source-text.json>'); process.exit(2) }
const src = readJSON(cfgFile), dir = path.dirname(cfgFile)
const ENGINE_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..')
// curl, not fetch: the sandbox proxy is on curl's path
const get = u => execFileSync('curl', ['-sL', '--max-time', '60', '-A', 'satsang-engine/0.1 (+https://engine.tantrafiles.xyz)', u], { encoding: 'utf8', maxBuffer: 1 << 26 })
for (const seg of src.segments) {
  let title, text
  if (seg.local) {      // a file in this repo (our own CC BY 4.0 wording): a JSON record's fields, or a text file's line range
    const f = path.resolve(ENGINE_DIR, seg.local.file), raw = fs.readFileSync(f, 'utf8')
    if (seg.local.record) { const all = JSON.parse(raw), r = (Array.isArray(all) ? all : all.practices).find(x => x.id === seg.local.record)
      text = seg.local.fields.flatMap(k => [].concat(r[k])).map(x => String(x).replace(/\s+/g, ' ').trim()).join('\n\n').normalize('NFC'); title = r.name }
    else { const [a, b] = seg.local.lines.split('-').map(Number); text = raw.split('\n').slice(a - 1, b).join('\n').split(/\n\s*\n/).map(p => p.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n\n').normalize('NFC'); title = seg.title }
  } else if (seg.pdf_pages) {   // a PDF page range (e.g. a copyright page), text via poppler pdftotext -layout off; whitespace collapsed per paragraph
    const pdf = `/tmp/fetch-${seg.id}.pdf`; execFileSync('curl', ['-sL', '--max-time', '90', '-o', pdf, seg.url])
    const [f, l] = String(seg.pdf_pages).split('-'), raw = execFileSync('pdftotext', ['-f', f, '-l', l || f, pdf, '-'], { encoding: 'utf8' })
    text = raw.split(/\n\s*\n/).map(p => p.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n\n').normalize('NFC'); title = seg.title
  } else ({ title, text } = htmlToText(get(seg.url)))
  if (!text) throw new Error(`${seg.id}: no text at ${seg.url}`)
  fs.writeFileSync(path.join(dir, seg.file || `${seg.id}.txt`), text)
  Object.assign(seg, { file: seg.file || `${seg.id}.txt`, title: title || seg.title, chars: text.length, sha256: sha256(text) })
  console.log(seg.id, title, text.length, 'chars')
}
src.retrieved = new Date().toISOString().slice(0, 10)
writeJSON(cfgFile, src)
