#!/usr/bin/env node
// Upload the talk index (built by ../wiser-search-index/scripts/ingest_talks.py) to KV for the satsang-search Worker.
//   node search/tools/upload-index.mjs [--index DIR] [--dry] [--force] [--dump /tmp/kvfiles.json (local Worker tests)]
// Writes the new version's keys first (idx/<ver>/<name>), then flips idx/current, then prunes versions older than the previous one.
// ver = <manifest built stamp>-<8 hex content hash>; an unchanged index is not re-uploaded (KV free tier: 1,000 writes/day).
// Never uploads passages.bm25.json (internal) or any text other than ids/labels/metadata tokens.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')   // work/wiser
const args = process.argv.slice(2)
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
const IDX = path.resolve(opt('--index', process.env.SEARCH_INDEX || path.join(ROOT, '../wiser-search-index/index')))
const DRY = args.includes('--dry'), FORCE = args.includes('--force')
const WDIR = path.join(ROOT, 'search/worker')
const WR = fs.existsSync(path.join(ROOT, 'app/api/node_modules/.bin/wrangler')) ? path.join(ROOT, 'app/api/node_modules/.bin/wrangler') : 'npx'
const wr = (...a) => execFileSync(WR, WR === 'npx' ? ['wrangler', ...a] : a, { cwd: WDIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 100000 })

// held teachers (never surface in the lens): public red-flag subjects + the main teachers held in BRIEF ("main teachers held")
const HELD_MAIN = ['ajahn-sucitto', 'jack-kornfield', 'swami-ramdev']
let rf = []; try { rf = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/wisegraph/redflags.json'), 'utf8')).records.map((r) => r.subject.split('/').pop()) } catch {}
const held = [...new Set([...rf, ...HELD_MAIN])].sort()

const rd = (n) => fs.readFileSync(path.join(IDX, n))
const man = JSON.parse(rd('manifest.json'))

// BM25 postings (metadata tokens only) -> binary: header uint32 [T, P, N]; len uint16[N] pad4; off uint32[T+1]; row uint32[P]; tf uint8[P]
function bm25bin() {
  const B = JSON.parse(rd('talks.bm25.json')), terms = Object.keys(B.post).sort(), N = B.N
  let P = 0; for (const t of terms) P += B.post[t].length
  const lenBytes = N * 2 + ((-(N * 2)) & 3), size = 12 + lenBytes + (terms.length + 1) * 4 + P * 4 + P
  const buf = Buffer.alloc(size), dv = new DataView(buf.buffer, buf.byteOffset, size)
  dv.setUint32(0, terms.length, true); dv.setUint32(4, P, true); dv.setUint32(8, N, true)
  let o = 12; for (let i = 0; i < N; i++) dv.setUint16(o + i * 2, Math.min(65535, B.len[i]), true); o += lenBytes
  const offAt = o; o += (terms.length + 1) * 4; const rowAt = o; o += P * 4; const tfAt = o
  let p = 0
  terms.forEach((t, ti) => { dv.setUint32(offAt + ti * 4, p, true); for (const [r, f] of B.post[t]) { dv.setUint32(rowAt + p * 4, r, true); buf[tfAt + p] = Math.min(255, f); p++ } })
  dv.setUint32(offAt + terms.length * 4, p, true)
  if (terms.some((t) => t.includes('\n'))) throw new Error('term with newline')
  return { bin: buf, vocab: terms.join('\n'), N }
}

const ids = rd('talks.ids.txt').toString('utf8')
const nIds = ids.split('\n').length
const bm = bm25bin()
if (bm.N !== nIds) throw new Error(`bm25 N ${bm.N} != ids ${nIds}`)
if (rd('talks.bits.bin').length !== nIds * 48 || rd('talks.vectors.bin').length !== nIds * 384) throw new Error('talk vectors/bits do not match ids')
const pids = JSON.parse(rd('passages.ids.json'))
if (pids.some((x) => !Array.isArray(x) || x.length !== 5 || x.some((y) => typeof y === 'string' && y.length > 40))) throw new Error('passages.ids.json is not ids-only')

const files = {
  'talks.bits': rd('talks.bits.bin'), 'talks.vectors': rd('talks.vectors.bin'), 'talks.ids': Buffer.from(ids), 'talks.facets': rd('talks.facets.bin'),
  'talks.facets.dict': rd('talks.facets.dict.json'), 'series.vectors': rd('series.vectors.bin'), 'series.ids': rd('series.ids.json'),
  'practices.vectors': rd('practices.vectors.bin'), 'practices.ids': rd('practices.ids.json'),
  'passages.vectors': rd('passages.vectors.bin'), 'passages.bits': rd('passages.bits.bin'), 'passages.ids': rd('passages.ids.json'),
  'talks.bm25': bm.bin, 'talks.bm25.vocab': Buffer.from(bm.vocab),
}
const h = crypto.createHash('sha256'); for (const [k, v] of Object.entries(files)) h.update(k).update(v); h.update(JSON.stringify(held))
const built = String(man.built_at || '').replace(/[^0-9A-Za-z]+/g, '').slice(0, 20) || 'x'
const ver = `${built}-${h.digest('hex').slice(0, 8)}`
files.meta = Buffer.from(JSON.stringify({ ver, built: man.built_at, model: man.model, held, counts: { talks: nIds, passages: pids.length, series: man.sets?.series?.count, practices: man.sets?.practices?.count }, note: 'ids, vectors, facets, metadata-token BM25 only; no transcript text' }))

const total = Object.values(files).reduce((s, b) => s + b.length, 0)
console.log(`index ${IDX}\nver ${ver}: ${Object.keys(files).length} keys, ${(total / 1048576).toFixed(2)} MiB, held ${held.length}`)
if (opt('--dump')) fs.writeFileSync(opt('--dump'), JSON.stringify(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, v.toString('base64')]))))  // local Worker tests
if (DRY) process.exit(0)

let cur = ''; try { cur = wr('kv', 'key', 'get', 'idx/current', '--binding', 'IDX', '--remote').trim() } catch {}
if (cur.split('-').pop() === ver.split('-').pop() && !FORCE) { console.log('unchanged: idx/current already', cur); process.exit(0) }
const bulk = Object.entries(files).map(([k, v]) => ({ key: `idx/${ver}/${k}`, value: v.toString('base64'), base64: true }))
const tmp = '/tmp/satsang-search-kv.json'; fs.writeFileSync(tmp, JSON.stringify(bulk))
wr('kv', 'bulk', 'put', tmp, '--binding', 'IDX', '--remote'); console.log('uploaded', bulk.length, 'keys')
wr('kv', 'key', 'put', 'idx/current', ver, '--binding', 'IDX', '--remote'); console.log('idx/current ->', ver, '(was', cur || 'none', ')')
// prune: keep this version and the previous one
try {
  const keys = JSON.parse(wr('kv', 'key', 'list', '--binding', 'IDX', '--remote', '--prefix', 'idx/')).map((k) => k.name)
  const old = keys.filter((k) => k !== 'idx/current' && !k.startsWith(`idx/${ver}/`) && !(cur && k.startsWith(`idx/${cur}/`)))
  if (old.length) { fs.writeFileSync('/tmp/satsang-search-del.json', JSON.stringify(old)); wr('kv', 'bulk', 'delete', '/tmp/satsang-search-del.json', '--binding', 'IDX', '--remote', '--force'); console.log('pruned', old.length, 'old keys') }
} catch (e) { console.log('prune skipped:', String(e.message || e).slice(0, 120)) }
fs.rmSync(tmp, { force: true })
