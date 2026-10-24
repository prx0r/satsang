// search-core.mjs: the vector half of query.py, ported to plain JS for the satsang-search Worker (SERVE-SPEC.md).
// No dependencies, no I/O. Load the index files once per isolate, keep the typed arrays in module scope.
//
//   const idx = makeSet({ bits, vectors, ids, scale, dims })   // bits/vectors: ArrayBuffer, ids: array
//   const hits = knn(idx, q, { k: 40, cand: 500 })            // q: Float32Array (L2-normalised, 384)
//   const ch = chips(facets, hits, 10); const sim = similar(idx, facets, hits, q, ch, 8)

const POP = new Uint8Array(256);
for (let i = 0; i < 256; i++) POP[i] = (i & 1) + POP[i >> 1];

export function makeSet({ bits, vectors, ids, scale = 254, dims = 384 }) {
  const n = ids.length;
  return { n, dims, scale, ids, bits: new Uint8Array(bits), vec: new Int8Array(vectors), bpr: dims >> 3,
           row: new Map(ids.map((id, i) => [id, i])) };
}

// query float -> sign bits, numpy packbits order (MSB first in each byte)
export function signBits(q) {
  const out = new Uint8Array(q.length >> 3);
  for (let d = 0; d < q.length; d++) if (q[d] > 0) out[d >> 3] |= 0x80 >> (d & 7);
  return out;
}

// 1-bit prefilter (Hamming over sign bits) -> top `cand` rows -> int8 rescore with the float query -> top k
export function knn(S, q, { k = 40, cand = 500, allow = null } = {}) {
  const qb = signBits(q), bpr = S.bpr, B = S.bits;
  const buckets = Array.from({ length: S.dims + 1 }, () => []);  // counting sort by distance: O(n)
  for (let i = 0, o = 0; i < S.n; i++, o += bpr) {
    if (allow && !allow(i)) continue;
    let h = 0;
    for (let j = 0; j < bpr; j++) h += POP[B[o + j] ^ qb[j]];
    buckets[h].push(i);
  }
  const C = [];
  for (let h = 0; h <= S.dims && C.length < cand; h++) for (const i of buckets[h]) { C.push(i); if (C.length >= cand) break; }
  const V = S.vec, D = S.dims, inv = 1 / S.scale;
  const scored = C.map(i => {
    let s = 0; const o = i * D;
    for (let d = 0; d < D; d++) s += V[o + d] * q[d];
    return [i, s * inv];
  });
  scored.sort((a, b) => b[1] - a[1]);
  return scored.slice(0, k).map(([i, s]) => ({ row: i, id: S.ids[i], score: s }));
}

// brute-force int8 scan for small sets (series, practices)
export function scanAll(S, q) {
  const out = [], D = S.dims, inv = 1 / S.scale;
  for (let i = 0; i < S.n; i++) { let s = 0; const o = i * D; for (let d = 0; d < D; d++) s += S.vec[o + d] * q[d]; out.push({ row: i, id: S.ids[i], score: s * inv }); }
  return out.sort((a, b) => b.score - a.score);
}

// Facets: CSR per field. F = { fields, dict, n, off:[Uint32Array x4], val:[Uint16Array x4] }
// fields: 0 teacher, 1 topic, 2 tradition, 3 series. Load with facetsFromBin(talks.facets.bin, talks.facets.dict.json).
export function facetsFromBin(buf, D) {
  const h = new Uint32Array(buf, 0, 2), n = h[0], nf = h[1], off = [], val = [];
  let o = 8;
  for (let f = 0; f < nf; f++) {
    const a = new Uint32Array(buf, o, n + 1); o += (n + 1) * 4;
    const cnt = a[n]; val.push(new Uint16Array(buf, o, cnt)); off.push(a); o += cnt * 2 + ((-(cnt * 2)) & 3);
  }
  return { fields: D.fields, dict: D.dict, n, off, val };
}
const has = (F, i, f, v) => { const a = F.off[f], V = F.val[f]; for (let j = a[i]; j < a[i + 1]; j++) if (V[j] === v) return true; return false; };

export function facetDf(F) {
  const df = [new Uint32Array(F.dict.teacher.length), new Uint32Array(F.dict.topic.length), new Uint32Array(F.dict.tradition.length), new Uint32Array(F.dict.series.length)];
  for (let f = 1; f <= 2; f++) for (const v of F.val[f]) df[f][v]++;
  return df;
}

// chips: categories the top talks sit in, rank-weighted 1/(r+2); topic/tradition damped by idf (so 'buddhism' sinks)
export function chips(F, hits, n = 10, df = facetDf(F)) {
  const w = new Map();
  hits.forEach((h, r) => {
    for (let f = 0; f < 4; f++) for (let j = F.off[f][h.row]; j < F.off[f][h.row + 1]; j++) {
      const key = f * 65536 + F.val[f][j]; w.set(key, (w.get(key) || 0) + 1 / (r + 2));
    }
  });
  const out = [], L = Math.log(1 + F.n);
  for (const [key, x] of w) {
    const f = Math.floor(key / 65536), v = key % 65536;
    const damp = (f === 1 || f === 2) ? Math.log(1 + F.n / (1 + df[f][v])) / L : 1;
    out.push({ type: F.fields[f], id: F.dict[F.fields[f]][v], f, v, score: x * damp });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, n);
}

// similar talks: neighbours of (mean of top-3 talk vectors + 0.5*query), restricted to rows sharing one of the top chips
export function similar(S, F, hits, q, topChips, n = 8, exclude = new Set(hits.map(h => h.row))) {
  const D = S.dims, cen = new Float32Array(D), top = hits.slice(0, 3);
  for (const h of top) { const o = h.row * D; for (let d = 0; d < D; d++) cen[d] += S.vec[o + d] / S.scale; }
  let norm = 0; for (let d = 0; d < D; d++) { cen[d] = cen[d] / Math.max(1, top.length) + 0.5 * q[d]; norm += cen[d] * cen[d]; }
  norm = Math.sqrt(norm) || 1; for (let d = 0; d < D; d++) cen[d] /= norm;
  const want = topChips.slice(0, 6);
  const mask = new Uint8Array(S.n);  // rows in any allowed category, by walking each category's postings once
  for (const c of want) { const a = F.off[c.f], V = F.val[c.f]; for (let i = 0; i < S.n; i++) if (!mask[i]) for (let j = a[i]; j < a[i + 1]; j++) if (V[j] === c.v) { mask[i] = 1; break; } }
  for (const i of exclude) mask[i] = 0;
  const res = knn(S, cen, { k: n, cand: 600, allow: i => mask[i] === 1 });
  return res.map(h => ({ ...h, via: want.filter(c => has(F, h.row, c.f, c.v)).slice(0, 2).map(c => `${c.type}:${c.id}`) }));
}
