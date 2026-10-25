// fastknn.mjs: the same 1-bit shortlist + int8 rescore as search-core knn(), tuned for the Workers Free 10 ms CPU budget:
// Hamming over 32-bit words (SWAR popcount) into a Uint16Array, a counting pass for the cut-off distance, no per-row arrays.
// rows (optional): scan only these row indices (e.g. a category's postings); allow (optional): row filter.
export function u32bits(S) { if (!S.w32 && S.bits.byteLength) S.w32 = new Uint32Array(S.bits.buffer, S.bits.byteOffset, S.bits.byteLength >> 2); return S.w32 }
function qWords(q) {
  const b = new Uint8Array(q.length >> 3)
  for (let d = 0; d < q.length; d++) if (q[d] > 0) b[d >> 3] |= 0x80 >> (d & 7)
  return new Uint32Array(b.buffer)
}
const pop = (x) => { x -= (x >>> 1) & 0x55555555; x = (x & 0x33333333) + ((x >>> 2) & 0x33333333); return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24 }
export function fastKnn(S, q, { k = 40, cand = 500, rows = null, allow = null } = {}) {
  const W = u32bits(S), wpr = S.dims >> 5, qw = qWords(q), m = rows ? rows.length : S.n
  const D = S.dims, V = S.vec, inv = 1 / S.scale
  let C
  if (m <= cand) {  // small set: rescore everything (exact)
    C = []; for (let t = 0; t < m; t++) { const i = rows ? rows[t] : t; if (!allow || allow(i)) C.push(i) }
  } else {
    const dist = new Uint16Array(m), hist = new Uint32Array(D + 2)
    for (let t = 0; t < m; t++) {
      const i = rows ? rows[t] : t
      if (allow && !allow(i)) { dist[t] = 0xffff; continue }  // excluded rows never enter the shortlist
      let h = 0; const o = i * wpr
      for (let j = 0; j < wpr; j++) h += pop(W[o + j] ^ qw[j])
      dist[t] = h; hist[h]++
    }
    let cut = 0, acc = 0; while (cut <= D && acc + hist[cut] < cand) acc += hist[cut++]
    C = []; let atCut = cand - acc
    for (let t = 0; t < m; t++) { const h = dist[t]; if (h > D) continue; if (h < cut) C.push(rows ? rows[t] : t); else if (h === cut && atCut > 0) { C.push(rows ? rows[t] : t); atCut-- } }
  }
  const sc = new Float32Array(C.length)
  for (let c = 0; c < C.length; c++) { let s = 0; const o = C[c] * D; for (let d = 0; d < D; d++) s += V[o + d] * q[d]; sc[c] = s * inv }
  const ord = [...C.keys()].sort((a, b) => sc[b] - sc[a]).slice(0, k)
  return ord.map((c) => ({ row: C[c], id: S.ids[C[c]], score: sc[c] }))
}
