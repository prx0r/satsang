// Tiny BM25 over in-memory docs (no external index). Shared by the Worker and the Node tests.
const STOP = new Set(('a am an and are as at be been but by can could do does for from get got had has have how i i\'d i\'m if in into is it its ' +
  'just like me my of on or our out over so some than that the their them then there these they this to too up us want wanna was we were what when where which who why will with would you your ' +
  'maybe really also about any more much very try trying learn understand know need looking look find give show help please something thing things').split(' '))

export function fold(s) { return String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\u2018\u2019\u02bc]/g, "'") }
// light stemmer: enough to join practise/practice/practising, lives/life, meditating/meditation
export function stem(w) {
  if (w.length <= 3) return w
  if (w === 'lives') return 'life'
  return w.replace(/(ational|ation|ations)$/, 'ate').replace(/(ising|izing|ise|ize|ised|ized)$/, 'is').replace(/(ing|ings)$/, '').replace(/(ies)$/, 'y').replace(/(es|s)$/, (m, _, i, s) => (s.length - m.length > 3 ? '' : m)).replace(/(ed)$/, '').replace(/ce$/, 's').replace(/e$/, '')
}
export function tokens(s) {
  const out = []
  for (const w of fold(s).split(/[^a-z0-9]+/)) { if (!w || w.length < 2 || STOP.has(w)) continue; out.push(stem(w)) }
  return out
}

export function createIndex(docs, textOf, { k1 = 1.2, b = 0.75 } = {}) {
  const post = new Map(), len = new Float32Array(docs.length)
  let total = 0
  docs.forEach((d, i) => {
    const tf = new Map()
    for (const t of tokens(textOf(d))) tf.set(t, (tf.get(t) || 0) + 1)
    let n = 0; for (const v of tf.values()) n += v
    len[i] = n; total += n
    for (const [t, f] of tf) { let p = post.get(t); if (!p) post.set(t, (p = [])); p.push(i, f) }
  })
  const N = docs.length, avg = total / Math.max(1, N)
  // query: array of [token, weight]; returns Map docIndex -> score
  function search(q) {
    const sc = new Map()
    for (const [t, w] of q) {
      const p = post.get(t); if (!p) continue
      const df = p.length / 2, idf = Math.log(1 + (N - df + 0.5) / (df + 0.5))
      for (let j = 0; j < p.length; j += 2) {
        const i = p[j], f = p[j + 1]
        const s = idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * len[i] / avg))
        sc.set(i, (sc.get(i) || 0) + s * w)
      }
    }
    return sc
  }
  return { search, N, has: (t) => post.has(t) }
}
