// Satsang practice renderer v0: Canvas2D, no dependencies.
// Draws a compiled timeline (compile.mjs) at timeline time t: seated front body (deitybody capsule canon),
// channels, loci, advected-particle "fluid" with trails + cheap bloom, attention spotlight, breath orb.
// Every visual is an analytic function of t (seeded), so seek/renderAt(t) is deterministic; only the
// trail buffer and the attention easing carry frame-to-frame state.

const TAU = Math.PI * 2
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t) }
const EASE = {
  linear: p => p,
  inOutSine: p => 0.5 - 0.5 * Math.cos(Math.PI * clamp(p)),
  outQuad: p => 1 - (1 - p) * (1 - p),
  inQuad: p => p * p,
}
const ease = EASE.inOutSine
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0 }
const hex2rgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))

const BG = '#0a0d14'
const PHASE_WORD = { in: 'Inhale', hold_in: 'Hold', out: 'Exhale', hold_out: 'Hold out', natural: 'Breathe naturally', rest: 'Settle' }
const NOSTRIL_WORD = { L: 'left', R: 'right' }

// ---------- geometry ---------------------------------------------------------
function catmull(pts, samples = 360) {
  if (pts.length < 2) return pts.slice()
  const P = [pts[0], ...pts, pts[pts.length - 1]], out = []
  const segs = pts.length - 1, per = Math.max(4, Math.ceil(samples / segs))
  for (let i = 0; i < segs; i++) {
    const [p0, p1, p2, p3] = [P[i], P[i + 1], P[i + 2], P[i + 3]]
    for (let j = 0; j < per; j++) {
      const t = j / per, t2 = t * t, t3 = t2 * t
      out.push([0, 1].map(k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)))
    }
  }
  out.push(pts[pts.length - 1])
  return out
}
function arcLUT(pts, n = 256) {
  const c = catmull(pts), cum = [0]
  for (let i = 1; i < c.length; i++) cum.push(cum[i - 1] + Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]))
  const len = cum[cum.length - 1] || 1e-6, lut = new Float32Array(n * 2)
  let j = 0
  for (let i = 0; i < n; i++) {
    const s = (i / (n - 1)) * len
    while (j < cum.length - 2 && cum[j + 1] < s) j++
    const f = (s - cum[j]) / Math.max(1e-9, cum[j + 1] - cum[j])
    lut[i * 2] = c[j][0] + (c[j + 1][0] - c[j][0]) * f
    lut[i * 2 + 1] = c[j][1] + (c[j + 1][1] - c[j][1]) * f
  }
  return { lut, n, len }
}
function lutAt(L, u, out) {
  u = clamp(u) * (L.n - 1); const i = Math.min(L.n - 2, u | 0), f = u - i, a = i * 2, b = a + 2
  out[0] = L.lut[a] + (L.lut[b] - L.lut[a]) * f; out[1] = L.lut[a + 1] + (L.lut[b + 1] - L.lut[a + 1]) * f
  out[2] = L.lut[b] - L.lut[a]; out[3] = L.lut[b + 1] - L.lut[a + 1]
  const m = Math.hypot(out[2], out[3]) || 1; out[2] /= m; out[3] /= m
  return out
}

// Seated padmasana front figure, capsule canon after deitybody site/engine/primitives/vitruvian-figure.js
function figureShapes() {
  const S = []
  const cap = (a, b, r) => S.push({ k: 'cap', a, b, r })
  const ell = (c, rx, ry, rot = 0) => S.push({ k: 'ell', c, rx, ry, rot })
  ell([0, 2.79], 0.4, 0.52)                     // head: crown 3.31 (canonical crown 3.3)
  ell([0, 2.12], 0.2, 0.12)                      // jaw-neck join
  cap([0, 2.18], [0, 1.6], 0.175)                // neck
  const half = [[0.19, 1.76], [0.5, 1.63], [0.86, 1.46], [1.05, 1.2], [0.98, 0.84], [0.86, 0.46], [0.78, 0.0], [0.64, -0.6], [0.76, -1.3], [0.66, -1.85], [0.3, -2.0]]
  S.push({ k: 'poly', pts: catmull([...half, ...half.slice().reverse().map(([x, y]) => [-x, y])].concat([half[0]]), 220) })
  ell([0, -1.66], 0.9, 0.42)                     // pelvis
  for (const s of [-1, 1]) {
    cap([s * 0.95, 1.18], [s * 1.38, -0.3], 0.16) // upper arm
    cap([s * 1.38, -0.3], [s * 1.74, -1.62], 0.125) // forearm
    cap([s * 1.74, -1.62], [s * 2.02, -1.96], 0.1) // hand on knee (jnana mudra rest)
    cap([s * 0.45, -1.78], [s * 1.9, -2.1], 0.3)   // thigh
    cap([s * 1.92, -2.12], [-s * 0.3, -2.1], 0.19) // shin crossing in front
    cap([-s * 0.3, -1.98], [-s * 1.08, -1.84], 0.1)// foot resting on the opposite thigh
  }
  return S
}
function traceShape(ctx, sh, X, Y, s) {
  ctx.beginPath()
  if (sh.k === 'ell') ctx.ellipse(X(sh.c[0]), Y(sh.c[1]), sh.rx * s, sh.ry * s, sh.rot, 0, TAU)
  else if (sh.k === 'cap') {
    const ax = X(sh.a[0]), ay = Y(sh.a[1]), bx = X(sh.b[0]), by = Y(sh.b[1]), r = sh.r * s, ang = Math.atan2(by - ay, bx - ax)
    ctx.arc(ax, ay, r, ang + Math.PI / 2, ang - Math.PI / 2); ctx.arc(bx, by, r, ang - Math.PI / 2, ang + Math.PI / 2); ctx.closePath()
  } else { sh.pts.forEach(([x, y], i) => i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))); ctx.closePath() }
}

// ---------- renderer ---------------------------------------------------------
export function createRenderer(canvas, grammar, opts = {}) {
  const ctx = canvas.getContext('2d')
  const fx = document.createElement('canvas'), fctx = fx.getContext('2d')
  const gx = document.createElement('canvas'), xctx = gx.getContext('2d')   // non-trail glow layer (cleared every frame)
  const bl = document.createElement('canvas'), bctx = bl.getContext('2d')
  const sil = document.createElement('canvas'), sctx = sil.getContext('2d')
  const glowC = document.createElement('canvas'), gctx = glowC.getContext('2d')
  const reduced = () => opts.reducedMotion ?? matchMedia('(prefers-reduced-motion: reduce)').matches
  const COL = Object.fromEntries(Object.entries(grammar.colours).map(([k, v]) => [k, hex2rgb(v.hex)]))
  const sprites = {}
  function sprite(key) {
    if (sprites[key]) return sprites[key]
    const c = document.createElement('canvas'); c.width = c.height = 64
    const g = c.getContext('2d'), rgb = COL[key] || COL.breath, core = mix(rgb, [255, 255, 255], 0.3)
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    gr.addColorStop(0, `rgba(${core},0.95)`); gr.addColorStop(0.15, `rgba(${rgb},0.7)`); gr.addColorStop(0.45, `rgba(${rgb},0.16)`); gr.addColorStop(1, `rgba(${rgb},0)`)
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64)
    return (sprites[key] = c)
  }
  const paths = {}; for (const [id, p] of Object.entries(grammar.paths)) paths[id] = arcLUT(p.pts)
  const loci = grammar.loci, regions = grammar.regions
  const shapes = figureShapes()
  let W = 0, H = 0, dpr = 1, L = null, tl = null, show = {}, practice = null
  let bodyPts = [], bodyIndex = {}
  const att = { x: 0, y: 0.8, r: 3, dim: 0, init: false }
  const tmp = new Float32Array(4)

  // body interior samples (world space) for whole-body fields
  function sampleBody() {
    const res = 0.03, x0 = -2.45, y0 = -2.45, w = Math.ceil(4.9 / res), h = Math.ceil(6.0 / res)
    const c = document.createElement('canvas'); c.width = w; c.height = h
    const g = c.getContext('2d'); g.fillStyle = '#fff'
    for (const sh of shapes) { traceShape(g, sh, x => (x - x0) / res, y => h - (y - y0) / res, 1 / res); g.fill() }
    const d = g.getImageData(0, 0, w, h).data, pts = []
    for (let j = 0; j < h; j += 1) for (let i = 0; i < w; i += 1) if (d[(j * w + i) * 4 + 3] > 128) pts.push([x0 + i * res, y0 + (h - j) * res])
    bodyPts = pts
  }
  sampleBody()

  function layout() {
    const r = canvas.getBoundingClientRect()
    W = Math.max(320, r.width); H = Math.max(320, r.height); dpr = Math.min(2, window.devicePixelRatio || 1)
    for (const c of [canvas, fx, gx, sil, glowC]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr) }
    bl.width = Math.max(1, Math.round(W * dpr / 5)); bl.height = Math.max(1, Math.round(H * dpr / 5))
    const land = W / H > 1.15, ins = opts.insets?.() || {}, top = Math.max(64, ins.top || 70), bottom = Math.max(land ? 100 : 90, ins.bottom || 0)
    const view = grammar.frame.views?.[practice?.script?.view] || grammar.frame.views?.full || { x: grammar.frame.bounds.x, y: grammar.frame.bounds.y }
    const yb = view.y, xb = view.x
    let area, orb, cap
    if (land) {
      area = { x: 0, y: top, w: W * 0.62, h: H - top - bottom }
      const R = Math.min(W * 0.085, H * 0.15)
      orb = { x: W * 0.79, y: top + (H - top - bottom) * 0.36, R }
      cap = { x: W * 0.62 + W * 0.04, w: W * 0.30, y: orb.y + R * 1.85, align: 'center' }
    } else {
      area = { x: 0, y: top - 4, w: W, h: H * 0.66 - top + 4 }
      const R = Math.min(W * 0.14, H * 0.072)
      orb = { x: W * 0.06 + R * 1.15, y: H * 0.66 + (H * 0.34 - bottom) * 0.42, R }
      cap = { x: orb.x + R * 1.65, w: W - (orb.x + R * 1.65) - W * 0.05, y: orb.y - R * 0.95, align: 'left', h: R * 1.9 }
    }
    const s = Math.min(area.w / (xb[1] - xb[0] + 0.2), area.h / (yb[1] - yb[0]))
    const ox = area.x + area.w / 2, oy = area.y + area.h / 2 + ((yb[1] + yb[0]) / 2) * s
    L = { land, area, orb, cap, s, ox, oy, view, X: x => ox + x * s, Y: y => oy - y * s }
    buildStatic()
    fctx.clearRect(0, 0, fx.width, fx.height)
    opts.onLayout?.(L)
    return L
  }

  function buildStatic() {
    const { X, Y, s } = L
    // silhouette: outline-by-overdraw (stroke every shape, then fill every shape opaque → only the union contour shows)
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0); sctx.clearRect(0, 0, W, H)
    const bgG = sctx.createRadialGradient(X(0), Y(0.7), 0, X(0), Y(0.7), s * 4.2)
    bgG.addColorStop(0, 'rgba(217,152,47,0.10)'); bgG.addColorStop(0.45, 'rgba(217,152,47,0.035)'); bgG.addColorStop(1, 'rgba(217,152,47,0)')
    sctx.fillStyle = bgG; sctx.fillRect(0, 0, W, H)
    sctx.lineJoin = 'round'
    sctx.strokeStyle = 'rgba(232,207,150,0.34)'; sctx.lineWidth = Math.max(1.6, s * 0.02)
    for (const sh of shapes) { traceShape(sctx, sh, X, Y, s); sctx.stroke() }
    sctx.fillStyle = '#11131a'
    for (const sh of shapes) { traceShape(sctx, sh, X, Y, s); sctx.fill() }
    sctx.save(); sctx.globalCompositeOperation = 'source-atop'
    const inner = sctx.createLinearGradient(0, Y(3.3), 0, Y(-2.2))
    inner.addColorStop(0, 'rgba(232,207,150,0.06)'); inner.addColorStop(0.5, 'rgba(232,207,150,0.025)'); inner.addColorStop(1, 'rgba(232,207,150,0.05)')
    sctx.fillStyle = inner; sctx.fillRect(0, 0, W, H); sctx.restore()
    if (L.view.fade_bottom) {   // bust view: dissolve the cut-off torso into the background
      const yb0 = L.area.y + L.area.h * 0.7, yb1 = L.area.y + L.area.h + 4
      const fg = sctx.createLinearGradient(0, yb0, 0, yb1); fg.addColorStop(0, 'rgba(10,13,20,0)'); fg.addColorStop(1, 'rgba(10,13,20,1)')
      sctx.fillStyle = fg; sctx.fillRect(0, yb0, W, H - yb0)
    }
    // the cavern (kapala): a faint inner vault when the practice works in the skull
    if (show.cavern) {
      const c = regions.kapala.c, r = regions.kapala.r
      const g = sctx.createRadialGradient(X(c[0]), Y(c[1]), 0, X(c[0]), Y(c[1]), r[0] * s * 1.15)
      g.addColorStop(0, 'rgba(5,6,10,0.9)'); g.addColorStop(0.8, 'rgba(5,6,10,0.55)'); g.addColorStop(1, 'rgba(5,6,10,0)')
      sctx.fillStyle = g; sctx.beginPath(); sctx.ellipse(X(c[0]), Y(c[1]), r[0] * s * 1.15, r[1] * s * 1.15, 0, 0, TAU); sctx.fill()
      sctx.strokeStyle = 'rgba(232,207,150,0.13)'; sctx.lineWidth = 1; sctx.setLineDash([2, 4])
      sctx.beginPath(); sctx.ellipse(X(c[0]), Y(c[1]), r[0] * s, r[1] * s, 0, 0, TAU); sctx.stroke(); sctx.setLineDash([])
    }
    // channels
    for (const id of show.channels || []) {
      const p = paths[id]; if (!p) continue
      const rgb = COL[grammar.paths[id].colour] || COL.breath
      sctx.strokeStyle = `rgba(${rgb},${id === 'sushumna' ? 0.2 : 0.26})`; sctx.lineWidth = id === 'sushumna' ? 1.4 : 1.1
      sctx.beginPath(); for (let i = 0; i < p.n; i++) { const x = X(p.lut[i * 2]), y = Y(p.lut[i * 2 + 1]); i ? sctx.lineTo(x, y) : sctx.moveTo(x, y) } sctx.stroke()
    }
    // loci markers
    for (const id of show.loci || []) {
      const l = loci[id]; if (!l) continue
      const x = X(l.at[0]), y = Y(l.at[1]), r = Math.max(2.2, s * 0.028)
      sctx.strokeStyle = 'rgba(232,207,150,0.38)'; sctx.lineWidth = 1
      sctx.beginPath(); sctx.arc(x, y, r * 1.8, 0, TAU); sctx.stroke()
      sctx.fillStyle = 'rgba(232,207,150,0.55)'; sctx.beginPath(); sctx.arc(x, y, Math.max(1, r * 0.45), 0, TAU); sctx.fill()
    }
    if (show.nostril_tags) {
      sctx.font = `600 ${Math.max(10, s * 0.11)}px "Inter Tight", system-ui, sans-serif`; sctx.textAlign = 'center'; sctx.textBaseline = 'middle'
      sctx.fillStyle = `rgba(${COL.lunar},0.75)`; sctx.fillText('L', X(0.66), Y(2.46))
      sctx.fillStyle = `rgba(${COL.solar},0.75)`; sctx.fillText('R', X(-0.66), Y(2.46))
    }
    // whole-body inner glow (shadow trick: works where ctx.filter does not)
    gctx.setTransform(dpr, 0, 0, dpr, 0, 0); gctx.clearRect(0, 0, W, H)
    const off = W * 3
    gctx.shadowColor = 'rgba(243,220,160,0.9)'; gctx.shadowBlur = s * 0.35; gctx.shadowOffsetX = off
    gctx.fillStyle = '#000'
    for (const sh of shapes) { traceShape(gctx, sh, x => X(x) - off, Y, s); gctx.fill() }
    gctx.shadowColor = 'transparent'
  }

  // ---------- timeline queries ----------
  function breathAt(t) {
    const B = tl.tracks.breath; let lo = 0, hi = B.length - 1, k = -1
    while (lo <= hi) { const m = (lo + hi) >> 1; if (B[m].t <= t) { k = m; lo = m + 1 } else hi = m - 1 }
    if (k < 0) return { seg: null, p: 0, vol: 0 }
    const seg = B[k], p = clamp((t - seg.t) / seg.dur), e = seg.phase === 'natural' ? ease(p) : (seg.stroke ? EASE.outQuad(p) : ease(p))
    const vol = seg.vol0 + (seg.vol1 - seg.vol0) * e
    return { seg, p, vol, k }
  }
  function attentionAt(t) { const A = tl.tracks.attention; let a = null; for (const e of A) { if (e.t <= t) a = e; else break } return a }
  function resolveTarget(id) {
    if (loci[id]) return { x: loci[id].at[0], y: loci[id].at[1], r: 0 }
    const g = regions[id]
    if (g?.shape === 'ellipse') return { x: g.c[0], y: g.c[1], r: Math.max(g.r[0], g.r[1]) }
    if (id === 'whole_body' || g?.shape === 'silhouette') return { x: 0, y: 0.6, r: 3.2, whole: true }
    const p = paths[id]
    if (p) { let sx = 0, sy = 0, mx = 0; for (let i = 0; i < p.n; i++) { sx += p.lut[i * 2]; sy += p.lut[i * 2 + 1] } sx /= p.n; sy /= p.n
      for (let i = 0; i < p.n; i++) mx = Math.max(mx, Math.hypot(p.lut[i * 2] - sx, p.lut[i * 2 + 1] - sy)); return { x: sx, y: sy, r: mx } }
    return { x: 0, y: 0.6, r: 3, whole: true }
  }
  const SIZE = { narrow: [0.34, 0.68], medium: [0.75, 0.55], wide: [1.55, 0.36], whole: [9, 0] }

  // ---------- drawing primitives on fx ----------
  let PX = 1, TRAIL_GAIN = 0.55
  const GAIN = { central: 0.62, awareness: 0.5, breath: 0.85, release: 0.9 }   // pale colours saturate under additive blending
  function dot(x, y, size, alpha, key) {
    if (alpha <= 0.004) return
    const sz = Math.max(2.2, size * L.s) * PX
    fctx.globalAlpha = (alpha > 1 ? 1 : alpha) * TRAIL_GAIN * (GAIN[key] ?? 1)
    fctx.drawImage(sprite(key), L.X(x) * PX - sz / 2, L.Y(y) * PX - sz / 2, sz, sz)
  }
  const haloS = {}
  function haloSprite(key) {
    if (haloS[key]) return haloS[key]
    const c = document.createElement('canvas'); c.width = c.height = 128
    const g = c.getContext('2d'), rgb = COL[key] || COL.breath, core = mix(rgb, [255, 255, 255], 0.45)
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    gr.addColorStop(0, `rgba(${core},0.9)`); gr.addColorStop(0.1, `rgba(${rgb},0.55)`); gr.addColorStop(0.35, `rgba(${rgb},0.16)`); gr.addColorStop(0.7, `rgba(${rgb},0.04)`); gr.addColorStop(1, `rgba(${rgb},0)`)
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return (haloS[key] = c)
  }
  function halo(x, y, r, alpha, key) {
    if (alpha <= 0.004) return
    const sz = r * 2 * L.s * PX; xctx.globalAlpha = clamp(alpha)
    xctx.drawImage(haloSprite(key), L.X(x) * PX - sz / 2, L.Y(y) * PX - sz / 2, sz, sz)
  }
  // a glowing stroke along part of a path: the continuous 'liquid' the particles ride in
  function pathGlow(P, u0, u1, rev, alpha, key, width = 0.05) {
    if (alpha <= 0.004 || u1 - u0 < 0.005) return
    const rgb = COL[key] || COL.breath
    xctx.globalAlpha = 1; xctx.lineCap = 'round'; xctx.lineJoin = 'round'
    const steps = Math.max(2, Math.ceil((u1 - u0) * 120))
    xctx.beginPath()
    for (let i = 0; i <= steps; i++) { const u = u0 + (u1 - u0) * i / steps; lutAt(P, rev ? 1 - u : u, tmp); const X = L.X(tmp[0]) * PX, Y = L.Y(tmp[1]) * PX; i ? xctx.lineTo(X, Y) : xctx.moveTo(X, Y) }
    const gk = GAIN[key] ?? 1
    for (const [w, a] of [[width * 4.5, 0.07 * gk], [width * 1.8, 0.16 * gk], [width * 0.6, 0.42 * gk]]) { xctx.strokeStyle = `rgba(${rgb},${clamp(a * alpha)})`; xctx.lineWidth = Math.max(1, w * L.s * PX); xctx.stroke() }
  }

  function envelope(cue, t) {
    const t1 = cue.t + cue.dur, tail = cue.dur < 1 ? 0.5 : 1.1
    if (t < cue.t || t > t1 + tail) return 0
    const fin = cue.dur < 1 ? 1 : smooth(cue.t, cue.t + 0.35, t)
    return fin * (t <= t1 ? 1 : 1 - smooth(t1, t1 + tail, t))
  }

  function drawPath(cue, t, env, vol) {
    const P = paths[cue.path]; if (!P) return
    const rnd = rng(hashStr(cue.path + cue.t)), key = cue.colour || 'breath'
    const p = clamp((t - cue.t) / cue.dur), f = ease(p)
    const red = reduced() ? 0.45 : 1
    const N = Math.round(clamp(P.len * 70, 40, 280) * red * (cue.density || 1))
    const rev = cue.dir === 'reverse', motion = cue.motion, mode = cue.mode || 'fill'
    const hold = motion === 'hold-glow', diss = motion === 'dissipate', steady = motion === 'steady'
    const speed = hold ? 0.035 : steady ? 0.06 : 0.16
    const genv = env * Math.min(1, 0.3 + 0.7 * (cue.density || 1))
    if (hold) pathGlow(P, 0, 1, rev, genv * (0.75 + 0.25 * Math.sin(t * 3)), key)
    else if (diss) pathGlow(P, 0, 1, rev, genv * (1 - f) * 0.8, key, 0.05 * (1 + f))
    else if (steady) pathGlow(P, 0, 1, rev, genv * (0.4 + 0.3 * vol), key)
    else if (mode === 'fill') pathGlow(P, 0, f, rev, genv, key)
    else if (mode === 'drain') pathGlow(P, f, 1, rev, genv, key)
    else pathGlow(P, 0, 1, rev, genv * 0.7, key)
    for (let i = 0; i < N; i++) {
      const u0 = rnd(), sp = 0.6 + rnd() * 0.8, off = (rnd() - 0.5) * 0.06, sz = 0.022 + rnd() * 0.03, tw = rnd() * TAU
      let u = (u0 + t * speed * sp / Math.max(0.6, P.len)) % 1
      let w = 1
      if (!hold && !diss && !steady) {
        if (mode === 'fill') w = smooth(f + 0.015, f - 0.06, u)
        else if (mode === 'drain') w = smooth(f - 0.015, f + 0.06, u)
        else w = 0.85
      }
      if (w <= 0.01) continue
      const uu = rev ? 1 - u : u
      lutAt(P, uu, tmp)
      let o = off * (diss ? 1 + 3 * f : 1)
      if (hold && !reduced()) o += Math.sin(t * 21 + tw) * 0.012 * (0.3 + 0.7 * p)
      const x = tmp[0] - tmp[3] * o, y = tmp[1] + tmp[2] * o
      let a = w * env * (0.35 + 0.45 * Math.sin(tw + t * 1.7) ** 2)
      if (hold) a *= 0.7 + 0.3 * Math.sin(tw + t * 9)
      if (diss) a *= 1 - f
      if (steady) a *= 0.45 + 0.35 * vol
      dot(x, y, sz, a, diss ? 'release' : key)
    }
    // the breath front
    if (!hold && !diss && !steady && mode !== 'stream' && p < 1) {
      lutAt(P, rev ? 1 - f : f, tmp)
      halo(tmp[0], tmp[1], 0.26, env * 0.9 * Math.sin(Math.PI * Math.min(1, p * 1.15 + 0.05)), key)
    }
    // exit to the air: a soft spray that cools as it leaves
    if (cue.exit === 'air' && !hold) {
      lutAt(P, rev ? 0 : 1, tmp); const ex = tmp[0], ey = tmp[1], tx = rev ? -tmp[2] : tmp[2], ty = rev ? -tmp[3] : tmp[3]
      const start = mode === 'fill' ? cue.t + cue.dur * 0.78 : cue.t, end = cue.t + cue.dur + 0.2, M = Math.round(46 * red), life = 1.5
      for (let k = 0; k < M; k++) {
        const ts = start + (end - start) * rnd(), side = rnd() - 0.5, upd = rnd(), sz = 0.04 + rnd() * 0.05
        const age = t - ts; if (age < 0 || age > life) continue
        const q = age / life, d = age * (0.5 + upd * 0.4)
        const x = ex + tx * d - ty * side * d * 1.4, y = ey + ty * d + tx * side * d * 1.4 + q * q * 0.12
        dot(x, y, sz * (1 + q * 1.6), (1 - q) ** 1.6 * 0.75 * (t > cue.t + cue.dur + 1.1 ? 0 : 1), q > 0.4 ? 'release' : key)
      }
    }
    if (hold) { lutAt(P, 0, tmp) }
  }

  function drawLocus(cue, t, env, vol) {
    const l = loci[cue.locus]; if (!l) return
    const [cx, cy] = l.at, key = cue.colour || 'breath', p = clamp((t - cue.t) / cue.dur), f = ease(p)
    const rnd = rng(hashStr(cue.locus + cue.t)), m = cue.motion, red = reduced()
    if (m === 'pulse') {
      const age = t - cue.t
      halo(cx, cy, 0.34 + 0.14 * Math.exp(-age * 6), env * (0.45 + 0.55 * Math.exp(-age * 5)), key)
      const ring = clamp(age / 0.7); if (ring < 1) ringAt(cx, cy, 0.08 + ring * 0.55, (1 - ring) * 0.55 * env, key)
      for (let k = 0; k < (red ? 0 : 16); k++) {
        const a = rnd() * TAU, v = 0.4 + rnd() * 0.6, q = clamp(age / 0.8)
        dot(cx + Math.cos(a) * v * EASE.outQuad(q) * 0.55, cy + Math.sin(a) * v * EASE.outQuad(q) * 0.45, 0.05, (1 - q) * 0.8 * env, key)
      }
      return
    }
    let I = 1
    if (m === 'fill') I = f; else if (m === 'dissipate') I = 1 - f; else if (m === 'steady') I = 0.55 + 0.35 * vol
    halo(cx, cy, 0.32 + 0.06 * I, env * I * 0.8, key)
    halo(cx, cy, 0.8, env * I * 0.22, key)
    if (m === 'hold-glow') {
      const pr = 0.3 + 0.7 * p, n = red ? 14 : 44
      for (let k = 0; k < n; k++) {
        const r0 = 0.05 + rnd() * 0.2, a0 = rnd() * TAU, w = (0.25 + rnd() * 0.4) * (rnd() < 0.5 ? -1 : 1), ph = rnd() * TAU
        const jit = red ? 0 : Math.sin(t * 27 + ph) * 0.012 * pr
        const a = a0 + t * w, r = r0 * (1 - 0.25 * pr) + jit
        dot(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.85, 0.035 + 0.02 * rnd(), env * (0.35 + 0.5 * pr) * (0.6 + 0.4 * Math.sin(t * 7 + ph)), key)
      }
      ringAt(cx, cy, 0.26 + 0.015 * Math.sin(t * 5.5), env * (0.12 + 0.18 * pr), key)
    } else if (m === 'fill') {
      for (let k = 0; k < (red ? 8 : 24); k++) {
        const a = rnd() * TAU + t * 0.5, r = (0.45 + rnd() * 0.2) * (1 - f) + 0.05
        dot(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0.04, env * f * 0.7, key)
      }
    } else if (m === 'dissipate') {
      for (let k = 0; k < (red ? 8 : 24); k++) {
        const a = rnd() * TAU, r = 0.06 + f * (0.35 + rnd() * 0.35)
        dot(cx + Math.cos(a) * r, cy + Math.sin(a) * r + f * 0.1, 0.045, env * (1 - f) * 0.6, 'release')
      }
    } else if (m === 'rotate') {
      drawLotus(cx, cy, l.petals || 8, t, env, key)
    }
  }
  function ringAt(x, y, r, a, key) {
    if (a <= 0.004) return
    const rgb = COL[key] || COL.breath
    xctx.globalAlpha = 1; xctx.strokeStyle = `rgba(${rgb},${clamp(a)})`; xctx.lineWidth = Math.max(1, L.s * 0.012) * PX
    xctx.beginPath(); xctx.arc(L.X(x) * PX, L.Y(y) * PX, r * L.s * PX, 0, TAU); xctx.stroke()
  }
  function drawLotus(x, y, petals, t, env, key) {
    const rgb = COL[key] || COL.central, n = petals === 2 ? 2 : petals, rot = reduced() ? 0 : t * 0.12
    const X = L.X(x) * PX, Y = L.Y(y) * PX, R = L.s * (petals === 2 ? 0.34 : 0.26) * PX
    xctx.save(); xctx.translate(X, Y); xctx.rotate(rot); xctx.globalAlpha = 1
    xctx.strokeStyle = `rgba(${rgb},${0.42 * env})`; xctx.lineWidth = Math.max(1, L.s * 0.01) * PX
    for (let i = 0; i < n; i++) {
      xctx.rotate(TAU / n); xctx.beginPath(); xctx.moveTo(R * 0.25, 0)
      xctx.quadraticCurveTo(R * 0.7, R * (petals === 2 ? 0.42 : 0.3), R, 0); xctx.quadraticCurveTo(R * 0.7, -R * (petals === 2 ? 0.42 : 0.3), R * 0.25, 0); xctx.stroke()
    }
    xctx.beginPath(); xctx.arc(0, 0, R * 0.25, 0, TAU); xctx.stroke(); xctx.restore()
  }

  const fieldCache = new Map()
  function fieldPoints(region, density) {
    const k = region + '|' + density
    if (fieldCache.has(k)) return fieldCache.get(k)
    const g = regions[region], rnd = rng(hashStr(k)), pts = []
    if (!g || g.shape === 'silhouette') {
      const n = Math.round(460 * density), clip = g?.clip_y
      for (let i = 0; i < n * 3 && pts.length < n; i++) { const q = bodyPts[(rnd() * bodyPts.length) | 0]; if (!clip || (q[1] >= clip[0] && q[1] <= clip[1])) pts.push([q[0] + (rnd() - 0.5) * 0.03, q[1] + (rnd() - 0.5) * 0.03]) }
    } else {
      const n = Math.round(Math.max(60, 600 * g.r[0] * g.r[1]) * density)
      for (let i = 0; i < n; i++) { const a = rnd() * TAU, r = Math.sqrt(rnd()); pts.push([g.c[0] + Math.cos(a) * r * g.r[0], g.c[1] + Math.sin(a) * r * g.r[1]]) }
    }
    const meta = pts.map(() => [rnd() * TAU, rnd() * TAU, 0.03 + rnd() * 0.045, rnd()])
    const v = { pts, meta }; fieldCache.set(k, v); return v
  }
  function drawField(cue, t, env, vol) {
    const g = regions[cue.region], red = reduced()
    const F = fieldPoints(cue.region, (cue.density || 1) * (red ? 0.45 : 1))
    const key = cue.colour || 'breath', p = clamp((t - cue.t) / cue.dur), f = ease(p), m = cue.motion
    const c = g?.c || [0, 0.6]
    const O = cue.from && loci[cue.from] ? loci[cue.from].at : c
    let dmax = 0.01; for (const q of F.pts) dmax = Math.max(dmax, Math.hypot(q[0] - O[0], q[1] - O[1]))
    let wsum = 0
    for (let i = 0; i < F.pts.length; i++) {
      const [hx, hy] = F.pts[i], [p1, p2, sz, r4] = F.meta[i]
      const d = Math.hypot(hx - O[0], hy - O[1]) / dmax
      let w = 1, x = hx, y = hy, edge = 0
      if (m === 'expand' || (m === 'fill' && cue.from)) { w = smooth(f + 0.03, f - 0.1, d); edge = Math.exp(-(((d - f) / 0.05) ** 2)) * (p < 1 ? 1 : 0) }
      else if (m === 'contract') { const ff = 1 - f; w = smooth(ff + 0.03, ff - 0.1, d) * (0.4 + 0.6 * (1 - d)); }
      else if (m === 'fill') w = f
      else if (m === 'dissipate') { w = 1 - f; x = hx + (hx - c[0]) * 0.4 * f; y = hy + (hy - c[1]) * 0.4 * f + 0.25 * f * f }
      else if (m === 'steady') w = 0.5 + 0.4 * vol
      else if (m === 'vibrate') {
        w = 0.85
        if (!red) { const dc = Math.hypot(hx - c[0], hy - c[1]) || 1e-3, s = Math.sin(dc * 38 - t * 26) * 0.014; x = hx + (hx - c[0]) / dc * s; y = hy + (hy - c[1]) / dc * s }
      }
      if (!red && m !== 'vibrate') { x += Math.sin(t * 0.35 + p1) * 0.035; y += Math.cos(t * 0.29 + p2) * 0.035 }
      const tw = 0.55 + 0.45 * Math.sin(t * (0.8 + r4) + p1)
      const a = env * (w * 0.5 * tw + edge * 0.6)
      wsum += w
      dot(x, y, sz * (1 + edge * 0.6), a, m === 'dissipate' ? 'release' : key)
    }
    const I = env * wsum / Math.max(1, F.pts.length)
    // region glow
    if (!g || g.shape === 'silhouette') {
      xctx.save(); xctx.globalAlpha = clamp(I * 0.34)
      if (m === 'expand' || (m === 'fill' && cue.from)) { xctx.beginPath(); xctx.arc(L.X(O[0]) * PX, L.Y(O[1]) * PX, Math.max(1, f * dmax * L.s * 1.05 * PX), 0, TAU); xctx.clip() }
      xctx.drawImage(glowC, 0, 0, glowC.width, glowC.height, 0, 0, fx.width, fx.height); xctx.restore()
    } else {
      const rgb = COL[key] || COL.breath, X = L.X(c[0]) * PX, Y = L.Y(c[1]) * PX
      xctx.save(); xctx.translate(X, Y); xctx.scale(1, g.r[1] / g.r[0]); xctx.globalAlpha = 1
      const gr = xctx.createRadialGradient(0, 0, 0, 0, 0, g.r[0] * L.s * 1.25 * PX)
      gr.addColorStop(0, `rgba(${rgb},${clamp(I * 0.32)})`); gr.addColorStop(0.7, `rgba(${rgb},${clamp(I * 0.12)})`); gr.addColorStop(1, `rgba(${rgb},0)`)
      xctx.fillStyle = gr; xctx.beginPath(); xctx.arc(0, 0, g.r[0] * L.s * 1.25 * PX, 0, TAU); xctx.fill(); xctx.restore()
    }
    if (m === 'vibrate') {
      const rgb = COL[key] || COL.nada, R = (g?.r || [1, 1]), period = red ? 1.2 : 0.55
      for (let k = 0; k < 4; k++) {
        const age = ((t - cue.t) - k * period) % (period * 4); if (age < 0) continue
        const q = age / (period * 4)
        xctx.globalAlpha = 1; xctx.strokeStyle = `rgba(${rgb},${clamp((1 - q) * 0.42 * env * Math.min(1, (cue.density || 1) * 1.4))})`; xctx.lineWidth = Math.max(1, L.s * 0.01) * PX
        xctx.beginPath(); xctx.ellipse(L.X(c[0]) * PX, L.Y(c[1]) * PX, R[0] * (0.25 + q * 1.5) * L.s * PX, R[1] * (0.25 + q * 1.5) * L.s * PX, 0, 0, TAU); xctx.stroke()
      }
    }
  }

  // ---------- frame ----------
  function frame(t, dt = 1 / 60) {
    if (!L || !tl) return
    PX = dpr
    const { X, Y, s } = L
    const red = reduced()
    const b = breathAt(t)
    // trails: fade the fx buffer rather than clearing it (reads as fluid)
    const fade = red ? 1 : clamp(1 - Math.pow(1 - 0.24, dt * 60), 0.05, 1)
    TRAIL_GAIN = red ? 1 : 0.55
    fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.globalCompositeOperation = 'destination-out'; fctx.globalAlpha = 1
    fctx.fillStyle = `rgba(0,0,0,${fade})`; fctx.fillRect(0, 0, fx.width, fx.height)
    fctx.globalCompositeOperation = 'lighter'
    xctx.setTransform(1, 0, 0, 1, 0, 0); xctx.globalCompositeOperation = 'source-over'; xctx.clearRect(0, 0, gx.width, gx.height); xctx.globalCompositeOperation = 'lighter'
    for (const cue of tl.tracks.visual) {
      if (cue.t > t) break
      const env = envelope(cue, t); if (env <= 0) continue
      if (cue.prim === 'path') drawPath(cue, t, env, b.vol)
      else if (cue.prim === 'locus') drawLocus(cue, t, env, b.vol)
      else if (cue.prim === 'field') drawField(cue, t, env, b.vol)
    }
    fctx.globalAlpha = 1; fctx.globalCompositeOperation = 'source-over'; xctx.globalAlpha = 1; xctx.globalCompositeOperation = 'source-over'

    // compose
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1
    ctx.fillStyle = BG; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(sil, 0, 0)
    ctx.globalCompositeOperation = 'lighter'
    ctx.drawImage(gx, 0, 0)
    ctx.drawImage(fx, 0, 0)
    bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.clearRect(0, 0, bl.width, bl.height); bctx.imageSmoothingQuality = 'high'; bctx.globalCompositeOperation = 'lighter'; bctx.drawImage(gx, 0, 0, bl.width, bl.height); bctx.drawImage(fx, 0, 0, bl.width, bl.height); bctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 0.7; ctx.drawImage(bl, 0, 0, canvas.width, canvas.height); ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // attention spotlight
    const a = attentionAt(t)
    if (a) {
      const T = resolveTarget(a.target), sz = SIZE[a.size] || SIZE.medium
      const tr = T.whole ? 9 : Math.max(sz[0], a.size === 'narrow' ? T.r * 1.25 : T.r * 1.1), td = T.whole ? 0 : sz[1]
      if (!att.init) { att.x = T.x; att.y = T.y; att.r = tr; att.dim = td; att.init = true }
      const k = 1 - Math.exp(-dt * (red ? 8 : 2.6))
      att.x += (T.x - att.x) * k; att.y += (T.y - att.y) * k; att.r += (tr - att.r) * k; att.dim += (td - att.dim) * k
      if (att.dim > 0.01) {
        const AX = X(att.x), AY = Y(att.y), r0 = att.r * s * 0.72, r1 = att.r * s * 1.75
        const gr = ctx.createRadialGradient(AX, AY, r0, AX, AY, r1)
        gr.addColorStop(0, 'rgba(6,8,13,0)'); gr.addColorStop(1, `rgba(6,8,13,${att.dim})`)
        ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H)
        if (att.r < 1) { ctx.strokeStyle = `rgba(239,233,221,${0.1 + 0.05 * Math.sin(t * 1.3)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(AX, AY, att.r * s, 0, TAU); ctx.stroke() }
      }
      // active label
      const lab = labelFor(a.target)
      if (lab && (tl.show.labels === 'active' || tl.show.labels === true || (tl.show.loci || []).includes(a.target))) drawLabel(T, lab, a.size)
    }
    drawOrb(t, b)
    return b
  }

  function labelFor(id) {
    const l = loci[id] || grammar.paths[id] || regions[id]
    if (!l?.label) return null
    return l.label
  }
  function drawLabel(T, text, size) {
    const { X, Y, s } = L
    if (T.whole) return
    const side = T.x >= 0 ? 1 : -1
    const lx = X(T.x + side * Math.max(0.55, (T.r || 0) + 0.35)), ly = Y(T.y)
    const fs = Math.max(11, Math.min(15, s * 0.1))
    ctx.font = `600 ${fs}px "Inter Tight", system-ui, sans-serif`
    const txt = text.toUpperCase()
    ctx.textBaseline = 'middle'; ctx.textAlign = side > 0 ? 'left' : 'right'
    ctx.strokeStyle = 'rgba(232,207,150,0.28)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(X(T.x) + side * Math.max(6, (T.r || 0) * s * 0.4 + 6), Y(T.y)); ctx.lineTo(lx - side * 6, ly); ctx.stroke()
    ctx.fillStyle = 'rgba(232,207,150,0.82)'
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0.12em'
    ctx.fillText(txt, lx, ly)
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0px'
  }

  function drawOrb(t, b) {
    const { orb } = L, { x, y, R } = orb, seg = b.seg
    if (!seg) return
    const ph = seg.phase, natural = ph === 'natural' || ph === 'rest'
    const key = seg.nostril === 'L' ? 'lunar' : seg.nostril === 'R' ? 'solar' : ph === 'hold_in' || ph === 'hold_out' ? 'retention' : ph === 'out' ? 'release' : natural ? 'awareness' : 'breath'
    const rgb = COL[key]
    // track + progress
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(232,207,150,0.13)'; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke()
    if (!seg.stroke) { ctx.strokeStyle = `rgba(${rgb},0.75)`; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y, R, -Math.PI / 2, -Math.PI / 2 + TAU * b.p); ctx.stroke(); ctx.lineCap = 'butt' }
    // the breath body
    const rr = R * (0.3 + 0.62 * b.vol)
    const g = ctx.createRadialGradient(x, y, 0, x, y, rr)
    g.addColorStop(0, `rgba(${rgb},${natural ? 0.16 : 0.3})`); g.addColorStop(0.75, `rgba(${rgb},${natural ? 0.07 : 0.12})`); g.addColorStop(1, `rgba(${rgb},0)`)
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill()
    ctx.strokeStyle = `rgba(${rgb},${natural ? 0.35 : 0.6})`; ctx.lineWidth = 1.2
    if (ph === 'hold_in' || ph === 'hold_out') {
      for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.arc(x, y, rr + (reduced() ? 0 : Math.sin(t * 6 + k * 2) * 1.6) + k * 4, 0, TAU); ctx.globalAlpha = k ? 0.35 : 1; ctx.stroke() }
      ctx.globalAlpha = 1
    } else { ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.stroke() }
    // count
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    let num = ''
    if (seg.stroke) num = String(seg.stroke)
    else if (seg.counts) num = String(Math.min(seg.counts, Math.floor((t - seg.t) / (tl.opts.count_s || 1)) + 1))
    if (num) { ctx.fillStyle = '#efe9dd'; ctx.font = `500 ${Math.round(R * 0.66)}px "Cormorant Garamond", Georgia, serif`; ctx.fillText(num, x, y + R * 0.02) }
    else { ctx.fillStyle = `rgba(${rgb},0.8)`; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, TAU); ctx.fill() }
    // phase word
    let word = seg.label || (ph === 'natural' ? (seg.sub === 'in' ? 'Natural · in' : 'Natural · out') : PHASE_WORD[ph])
    if (seg.nostril) word += ' · ' + NOSTRIL_WORD[seg.nostril]
    const fs = Math.max(11, Math.round(R * 0.15))
    ctx.font = `600 ${fs}px "Inter Tight", system-ui, sans-serif`; ctx.fillStyle = `rgba(${mix(rgb, [239, 233, 221], 0.4)},0.95)`
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0.16em'
    ctx.fillText(word.toUpperCase(), x, y + R + fs * 1.6)
    const mk = [...tl.tracks.markers].reverse().find(m => m.t <= t)
    const sub = seg.stroke ? `stroke ${seg.stroke} of ${seg.strokes}` : seg.round && mk ? `round ${mk.round} of ${mk.of}` : ''
    if (sub) { ctx.font = `500 ${Math.max(10, fs - 2)}px "Inter Tight", system-ui, sans-serif`; ctx.fillStyle = 'rgba(146,154,171,0.85)'; ctx.fillText(sub.toUpperCase(), x, y + R + fs * 3.1) }
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0px'
  }

  return {
    layout,
    setTimeline(timeline, prac) {
      tl = timeline; practice = prac; show = timeline.show || {}; att.init = false; fieldCache.clear()
      if (W) layout()
    },
    frame,
    clearTrails() { fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.clearRect(0, 0, fx.width, fx.height); att.init = false },
    breathAt: t => tl ? breathAt(t) : null,
    get layoutInfo() { return L },
  }
}
