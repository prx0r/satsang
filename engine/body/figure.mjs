// Satsang body layer · the seated figure as crisp SVG line art, front + side, driven by body/breath.mjs.
// Pure geometry (node-testable: figurePaths(view, state) → { name: svg path d }) plus a small DOM builder (createFigure).
// World units are grammar.json frame units (deitybody scene units, y up); SVG output is y-flipped (svg y = -world y).
// What moves (breathState fields): belly (abdomen forward / slightly wider), ribs (lateral + forward), clav (collarbones lift),
// shoulder (shoulders lift), diaphragm (dome flattens and descends), vol (lungs fill), flow + nostril (airflow streaks), still.
// Loci never move: they are attention seats, not anatomy (GRAMMAR.md §5).

export const FIGURE = 'satsang-figure/1'
const r3 = x => Math.round(x * 1000) / 1000
const lerp = (a, b, t) => a + (b - a) * t

function catmull(pts, per = 10, closed = false) {
  const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]], out = []
  const segs = closed ? pts.length : pts.length - 1
  for (let i = 0; i < segs; i++) {
    const [p0, p1, p2, p3] = [P[i], P[i + 1], P[i + 2], P[i + 3]]
    for (let j = 0; j < per; j++) {
      const t = j / per, t2 = t * t, t3 = t2 * t
      out.push([0, 1].map(k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)))
    }
  }
  if (!closed) out.push(pts[pts.length - 1])
  return out
}
const d = (pts, close = false) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${r3(x)} ${r3(-y)}`).join('') + (close ? 'Z' : '')
const smoothD = (pts, close = false, per = 10) => d(catmull(pts, per, close), close)
const ellipseD = (cx, cy, rx, ry, n = 48) => d(Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] }), true)
const capsuleD = (a, b, r, n = 14) => {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), pts = []
  for (let i = 0; i <= n; i++) { const t = ang + Math.PI / 2 + (i / n) * Math.PI; pts.push([a[0] + r * Math.cos(t), a[1] + r * Math.sin(t)]) }
  for (let i = 0; i <= n; i++) { const t = ang - Math.PI / 2 + (i / n) * Math.PI; pts.push([b[0] + r * Math.cos(t), b[1] + r * Math.sin(t)]) }
  return d(pts, true)
}
const mirror = pts => pts.map(([x, y]) => [-x, y])

const REST = { belly: 0.2, ribs: 0, clav: 0, shoulder: 0, diaphragm: 0.2, vol: 0.2, flow: 0, still: 0, nostril: null }

/** Front view (facing the viewer; screen right = the practitioner's left, GRAMMAR orientation rule). */
export function frontPaths(s = REST, o = {}) {
  const k = o.gain ?? 1
  const belly = (s.belly || 0) * k, ribs = (s.ribs || 0) * k, clav = (s.clav || 0) * k, sh = (s.shoulder || 0) * k
  const dia = (s.diaphragm || 0) * k, vol = lerp(0.2, s.vol ?? 0.2, k)
  const lift = sh * 0.07 + clav * 0.025, rx = 1 + ribs * 0.05, bx = 1 + belly * 0.035
  // torso half-outline (after engine.js figureShapes, deitybody capsule canon), breathing applied per station
  const half = [[0.19, 1.76], [0.5, 1.63 + lift * 0.6], [0.86, 1.46 + lift], [1.05, 1.2 + lift * 0.8], [0.98 * rx, 0.84 + lift * 0.3], [0.86 * rx, 0.46],
    [0.78 * lerp(1, rx, 0.6), 0.0], [0.64 * bx, -0.6], [0.76 * bx, -1.3], [0.66, -1.85], [0.3, -2.0]]
  const torso = smoothD([...half, ...mirror(half).reverse()], true, 8)
  const P = {
    base: smoothD([[-2.12, -1.98], [-1.7, -1.62], [-0.9, -1.5], [0, -1.56], [0.9, -1.5], [1.7, -1.62], [2.12, -1.98], [1.6, -2.3], [0, -2.36], [-1.6, -2.3]], true, 8),
    shinL: smoothD([[1.95, -2.06], [1.0, -1.86], [0.0, -1.94], [-0.42, -2.06]], false, 8),
    shinR: smoothD([[-1.95, -2.16], [-1.0, -2.2], [0.0, -2.2], [0.42, -2.14]], false, 8),
    torso,
    neck: d([[-0.17, 2.18], [-0.18, 1.72]]) + d([[0.17, 2.18], [0.18, 1.72]]),
    head: ellipseD(0, 2.79, 0.4, 0.52),
  }
  for (const sgn of [-1, 1]) {
    const S = sgn > 0 ? 'L' : 'R'   // screen right (+x) = practitioner's left
    const shy = 1.18 + lift, sx = sgn * 0.95
    P['arm' + S] = capsuleD([sx, shy], [sgn * 1.36, -0.28 + lift * 0.4], 0.155) + capsuleD([sgn * 1.36, -0.28 + lift * 0.4], [sgn * 1.74, -1.6], 0.12)
    P['hand' + S] = ellipseD(sgn * 1.86, -1.76, 0.13, 0.1)
    // collarbone: sternal notch → shoulder, lifts with clav
    P['clav' + S] = smoothD([[sgn * 0.08, 1.5 + clav * 0.03], [sgn * 0.42, 1.56 + clav * 0.05], [sgn * 0.8, 1.52 + lift]], false, 8)
    // ribs: four arcs per side, opening laterally with ribs
    P['ribs' + S] = [0, 1, 2, 3].map(i => {
      const y = 1.22 - i * 0.24, w = (0.5 + i * 0.08) * rx
      return smoothD([[sgn * 0.06, y], [sgn * w * 0.6, y + 0.02], [sgn * w, y - 0.12 - i * 0.03], [sgn * w * 0.95, y - 0.26 - i * 0.04]], false, 6)
    }).join('')
    // lung lobe: fills with volume
    const ls = 0.86 + 0.16 * vol, lw = 0.42 * lerp(1, rx, 0.8), cx = sgn * 0.42, top = 1.42, bot = 0.18 - dia * 0.16
    P['lung' + S] = smoothD([[sgn * 0.12, top - 0.06], [cx + sgn * 0.05, top + 0.02 * ls], [cx + sgn * lw * ls, 1.0], [cx + sgn * lw * ls * 1.04, 0.5],
      [cx + sgn * lw * 0.8, bot], [cx, bot + 0.06], [sgn * 0.14, bot + 0.22], [sgn * 0.1, 0.9]], true, 6)
  }
  // diaphragm: a dome under the lungs; full breath flattens it and lowers it
  const dy = 0.1 - dia * 0.2, dome = 0.3 * (1 - 0.62 * dia)
  P.diaphragm = smoothD([[-0.86 * rx, dy - 0.04], [-0.45, dy + dome * 0.85], [0, dy + dome], [0.45, dy + dome * 0.85], [0.86 * rx, dy - 0.04]], false, 8)
  P.belly = smoothD([[-0.34 * bx, -0.98], [0, -1.04 - belly * 0.03], [0.34 * bx, -0.98]], false, 6)
  return P
}

/** Side view (profile facing screen right): chest and belly move forward, the back stays, diaphragm slopes. */
export function sidePaths(s = REST, o = {}) {
  const k = o.gain ?? 1
  const belly = (s.belly || 0) * k, ribs = (s.ribs || 0) * k, clav = (s.clav || 0) * k, sh = (s.shoulder || 0) * k
  const dia = (s.diaphragm || 0) * k, vol = lerp(0.2, s.vol ?? 0.2, k)
  const lift = sh * 0.07 + clav * 0.025, cf = ribs * 0.1, bf = belly * 0.16
  const front = [[0.2, 1.74], [0.32 + cf * 0.3, 1.5 + clav * 0.03], [0.5 + cf * 0.8, 1.08], [0.56 + cf, 0.62], [0.54 + cf * 0.6 + bf * 0.2, 0.18],
    [0.52 + bf * 0.7, -0.3], [0.58 + bf, -0.86], [0.56 + bf * 0.7, -1.3], [0.5, -1.7]]
  const back = [[-0.62, -1.78], [-0.56, -1.2], [-0.42, -0.5], [-0.44, 0.2], [-0.52, 0.86], [-0.46 - lift * 0.2, 1.32 + lift], [-0.24, 1.66 + lift * 0.5], [-0.2, 1.78]]
  const P = {
    base: smoothD([[-0.9, -1.86], [-0.2, -1.6], [0.9, -1.62], [1.72, -1.9], [1.5, -2.3], [0, -2.36], [-0.9, -2.24]], true, 8),
    torso: smoothD([...front, ...back], true, 8),
    neck: d([[-0.2, 2.2], [-0.22, 1.76]]) + d([[0.14, 2.14], [0.2, 1.74]]),
    head: smoothD([[-0.05, 3.32], [0.32, 3.16], [0.42, 2.86], [0.5, 2.62], [0.44, 2.52], [0.4, 2.4], [0.3, 2.24], [0.08, 2.16], [-0.24, 2.3], [-0.4, 2.7], [-0.32, 3.12]], true, 8),
    arm: capsuleD([-0.02, 1.2 + lift], [0.14, -0.3 + lift * 0.4], 0.16) + capsuleD([0.14, -0.3 + lift * 0.4], [1.0, -1.42], 0.12),
    clav: smoothD([[0.3, 1.52 + clav * 0.04], [0.06, 1.58 + clav * 0.05], [-0.2, 1.5 + lift]], false, 6),
    spine: smoothD([[-0.3, 2.3], [-0.36, 1.7], [-0.32, 1.0], [-0.26, 0.3], [-0.32, -0.5], [-0.42, -1.3], [-0.5, -1.7]], false, 8),
  }
  const ls = 0.86 + 0.16 * vol
  P.lung = smoothD([[-0.06, 1.46], [0.18 + cf * 0.4, 1.32], [0.36 + cf * 0.9 * ls, 0.9], [0.38 + cf * ls, 0.42 - dia * 0.06], [0.1, 0.1 - dia * 0.12],
    [-0.28, 0.3 - dia * 0.1], [-0.3, 0.9], [-0.22, 1.32]], true, 6)
  // diaphragm in profile: higher in front, descends and flattens with breath
  P.diaphragm = smoothD([[0.5 + cf * 0.6, 0.3 - dia * 0.1], [0.2, 0.42 - dia * 0.2], [-0.1, 0.36 - dia * 0.22], [-0.38, 0.04 - dia * 0.14]], false, 8)
  P.belly = smoothD([[0.3 + bf * 0.6, -0.4], [0.42 + bf * 0.85, -0.86], [0.36 + bf * 0.6, -1.24]], false, 6)
  return P
}

export function figurePaths(view, state, o) { return view === 'side' ? sidePaths(state, o) : frontPaths(state, o) }

/** Airflow streaks at the nostrils. Returns [{ d, a }] in svg coords; direction from flow sign, opacity from |flow|. */
export function airflow(view, s, t, o = {}) {
  const f = s.flow || 0, mag = Math.min(1, Math.abs(f) * 2.2), out = []
  if (mag < 0.03 || o.reduced) return out
  const inn = f > 0, n = 5
  const src = view === 'side' ? [[0.5, 2.56]] : s.nostril === 'L' ? [[0.06, 2.46]] : s.nostril === 'R' ? [[-0.06, 2.46]] : [[0.06, 2.46], [-0.06, 2.46]]
  for (const [sx, sy] of src) for (let i = 0; i < n; i++) {
    let u = ((t * 0.9 + i / n) % 1); if (inn) u = 1 - u            // inhale: streaks travel toward the nostril
    const dir = view === 'side' ? [1, -0.25 + i * 0.12] : [Math.sign(sx || 1) * (0.2 + i * 0.12), -1]
    const L = Math.hypot(...dir), ux = dir[0] / L, uy = dir[1] / L, r0 = 0.04 + u * 0.24, r1 = r0 + 0.07
    out.push({ d: d([[sx + ux * r0, sy + uy * r0], [sx + ux * r1, sy + uy * r1]]), a: r3(mag * Math.sin(Math.PI * u) * 0.9) })
  }
  return out
}

export const VIEWBOX = {
  front: { full: [-2.5, -3.6, 5.0, 6.1], upper: [-1.8, -3.65, 3.6, 4.2] },
  side: { full: [-1.3, -3.5, 3.2, 5.95], upper: [-1.0, -3.5, 2.2, 3.9] },
}

/** DOM builder: an <svg> for one view whose paths update from a breath state each frame. */
export function createFigure(doc, view = 'front', o = {}) {
  const NS = 'http://www.w3.org/2000/svg', svg = doc.createElementNS(NS, 'svg')
  const vb = VIEWBOX[view][o.frame || 'full']
  svg.setAttribute('viewBox', vb.join(' ')); svg.setAttribute('class', `sf sf-${view}`); svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  const names = Object.keys(figurePaths(view, REST))
  const order = ['base', 'shinL', 'shinR', 'torso', 'arm', 'armL', 'armR', 'handL', 'handR', 'neck', 'head']
  const inner = names.filter(n => !order.includes(n))
  const g = doc.createElementNS(NS, 'g'), el = {}
  const add = (n, cls) => { const p = doc.createElementNS(NS, 'path'); p.setAttribute('class', cls); g.appendChild(p); el[n] = p }
  for (const n of order) if (names.includes(n)) add(n, `sf-solid sf-${n.replace(/[LR]$/, '')}`)
  for (const n of inner) add(n, `sf-inner sf-${n.replace(/[LR]$/, '')}`)
  const air = doc.createElementNS(NS, 'g'); air.setAttribute('class', 'sf-air'); g.appendChild(air)
  const lociG = doc.createElementNS(NS, 'g'); lociG.setAttribute('class', 'sf-loci'); g.appendChild(lociG)
  svg.appendChild(g)
  const streaks = Array.from({ length: 10 }, () => { const p = doc.createElementNS(NS, 'path'); air.appendChild(p); return p })
  return {
    svg, view,
    update(state, t = 0, uo = {}) {
      const P = figurePaths(view, state, uo)
      for (const n in P) el[n]?.setAttribute('d', P[n])
      const A = airflow(view, state, t, uo)
      streaks.forEach((p, i) => { const a = A[i]; p.setAttribute('d', a ? a.d : ''); p.style.opacity = a ? a.a : 0 })
      svg.style.setProperty('--sf-still', String(state.still || 0))
    },
    setLoci(list) {   // [{ id, at:[x,y], on }] small markers (front view only)
      lociG.innerHTML = ''
      for (const l of list) { const c = doc.createElementNS(NS, 'circle'); c.setAttribute('cx', l.at[0]); c.setAttribute('cy', -l.at[1]); c.setAttribute('r', 0.035); c.setAttribute('class', 'sf-locus'); c.dataset.id = l.id; lociG.appendChild(c) }
    },
    setPresence(v) { svg.style.opacity = String(v) },
    // world (x, y up) → client pixels, for the glow layer
    toClient(x, y) {
      const r = svg.getBoundingClientRect(), [vx, vy, vw, vh] = vb, s = Math.min(r.width / vw, r.height / vh)
      const ox = r.left + (r.width - vw * s) / 2, oy = r.top + (r.height - vh * s) / 2
      return [ox + (x - vx) * s, oy + (-y - vy) * s, s]
    },
  }
}
