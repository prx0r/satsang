// Shared helpers for the text → practice pipeline (TEXT-TO-PRACTICE.md). Pure ESM, no dependencies.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
export const ENGINE = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..')
export const sha256 = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex')
export const readJSON = f => JSON.parse(fs.readFileSync(f, 'utf8'))
export const writeJSON = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 1) + '\n') }
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–', hellip: '…' }
export const decode = s => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e.toLowerCase()] ?? m)
/** Normalise one HTML chapter to text: <main id=content> (or <body>), one paragraph per <p>/<li>, "\n\n" between, tags stripped,
 *  whitespace collapsed, NFC. Offsets everywhere in the pipeline are JS string indices into this text. Deterministic. */
export function htmlToText(html, { container = /<main[^>]*id="content"[^>]*>([\s\S]*?)<\/main>/i } = {}) {
  let m = html.match(container); let body = m ? m[1] : (html.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [, html])[1]
  body = body.replace(/<(script|style|nav|header|footer)[\s\S]*?<\/\1>/gi, '')
  const title = decode((body.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i) || [, ''])[1].replace(/<[^>]+>/g, '')).trim()
  const paras = []
  for (const pm of body.matchAll(/<(p|li|h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi)) {
    if (/^h/i.test(pm[1])) continue
    const t = decode(pm[2].replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim().normalize('NFC')
    if (t) paras.push(t)
  }
  return { title, text: paras.join('\n\n') }
}
/** paragraphs and sentences with offsets. Sentence split: . ? ! (optionally followed by a closing quote/bracket) + space + capital/quote,
 *  protecting a small abbreviation list. Deterministic. */
export function segment(text) {
  const out = []; let pos = 0, pi = 0
  for (const para of text.split('\n\n')) {
    const p0 = text.indexOf(para, pos); pos = p0 + para.length; pi++
    const sents = []; const re = /[^.?!]*(?:[.?!]+[’”')\]]*|$)/g; let mm, s0 = 0
    const parts = []
    while ((mm = re.exec(para)) && mm[0] !== '') parts.push([mm.index, mm.index + mm[0].length])
    // merge splits after abbreviations or when the next part starts lowercase / with a digit continuation
    const merged = []
    for (const [a, b] of parts) {
      const prev = merged[merged.length - 1]
      const seg = para.slice(a, b)
      const ps = prev ? para.slice(prev[0], prev[1]).trim() : ''
      if (prev && (/\b(e\.g|i\.e|etc|cf|vs|Mr|Dr|St)\.$/.test(ps) || /^\d+\.$/.test(ps) || /^\s*[a-z0-9(]/.test(seg))) prev[1] = b
      else merged.push([a, b])
    }
    let si = 0
    for (let [a, b] of merged) {
      while (a < b && /\s/.test(para[a])) a++; while (b > a && /\s/.test(para[b - 1])) b--
      if (b > a) sents.push({ id: `p${pi}.s${++si}`, start: p0 + a, end: p0 + b })
    }
    out.push({ id: `p${pi}`, start: p0, end: p0 + para.length, sentences: sents })
    void s0
  }
  return out
}
const NUM = { one: 1, once: 1, two: 2, twice: 2, three: 3, thrice: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, hundred: 100 }
/** every number a span states, digits or words ("ten times" → 10, "once" → 1) */
export const numbersIn = s => [...s.toLowerCase().matchAll(/\b(\d+(?:\.\d+)?|one|once|two|twice|three|thrice|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|hundred)\b/g)].map(m => NUM[m[1]] ?? +m[1])
