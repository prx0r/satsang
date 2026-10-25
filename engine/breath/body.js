/* The energy body: a seated figure made only of light, on a white page. Raw WebGL2, no libraries.
   Shape: deitybody's seated canon (site/engine/primitives/vitruvian-figure.js, seated(): seat 0.35, torso cylinder r .5->.3,
   head r .25 at seat+1.72, arms to the knees, crossed shanks) sampled as particles instead of meshes.
   Palette: deitybody lab GOLD #c9a45c, TEAL #5ec4b6 (ida), ROSE #d4899a (pingala).
   Light on white: particles add "light" (colour x amount) into a float buffer; the composite lays it over white as
   coloured glow, warming to pale gold where it is densest, so the figure reads as luminous rather than inked. */

const GOLD = [0.79, 0.64, 0.36], TEAL = [0.37, 0.77, 0.71], ROSE = [0.83, 0.54, 0.60], AMBER = [0.94, 0.60, 0.13]
const SEAT = 0.35
export const LOCI = [0.33, 0.69, 1.05, 1.40, 1.76, 2.12, 2.34]   // base .. crown along the central channel

/* Where attention rests, for a practice (app/src/breathplayer.js; data: app/wisegraph/practice-body.json). Optional: with no
   locus the page draws exactly as before. kind 1-3 light a small cluster of motes at a point (heart radiates on the out-breath,
   nostrils stream in and out at the touch point, belly rises and falls); 4-7 reweight the layers already drawn. */
export const LOCUS = {
  none: { kind: 0 },
  heart: { kind: 1, at: [0, 1.40, 0.16], r: 0.11 },
  nostrils: { kind: 2, at: [0, 1.99, 0.235], r: 0.03 },
  belly: { kind: 3, at: [0, 0.66, 0.14], r: 0.12 },
  central: { kind: 4 }, channels: { kind: 5 }, whole: { kind: 6 }, space: { kind: 7 },
}
// layer weights per kind: body, sushumna, ida/pingala, aura reach, haze, fill-all, loci, filaments
const MIX = { 0: [1, 1, 1, 1, 1, 0, 1, 1], 1: [0.45, 0.4, 0.45, 1, 0.7, 0, 0.4, 0.6], 2: [0.45, 0.35, 0.4, 1, 0.7, 0, 0.35, 0.6], 3: [0.45, 0.4, 0.45, 1, 0.7, 0, 0.4, 0.6],
  4: [0.72, 1.9, 0.75, 1, 0.8, 0, 1.6, 0.8], 5: [0.75, 1.3, 2.0, 1, 0.8, 0, 1.0, 0.8], 6: [1.0, 0.5, 0.5, 1.15, 1.1, 1, 0.45, 1.35], 7: [0.78, 0.55, 0.6, 2.3, 2.0, 0, 0.5, 0.8] }

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296 } }

/* seated canon -> primitives. caps: [ax,ay,az,bx,by,bz,r] */
function canon() {
  const caps = []
  for (const s of [-1, 1]) {
    const S = [s * 0.42, SEAT + 1.32, 0], E = [s * 0.68, SEAT + 0.72, 0.05], W = [s * 0.88, SEAT + 0.28, 0.12]
    caps.push([...S, ...E, 0.11], [...E, ...W, 0.09], [...W, W[0] - s * 0.1, W[1] - 0.05, W[2] + 0.06, 0.08])
    const H = [s * 0.16, SEAT, 0], K = [s * 0.92, SEAT - 0.02, 0.12], A = [-s * 0.3, SEAT - 0.12, 0.3 + s * 0.08]
    caps.push([...H, ...K, 0.16], [...K, ...A, 0.11], [...A, A[0] - s * 0.4, A[1], A[2], 0.07])
  }
  caps.push([0, SEAT + 1.35, 0, 0, SEAT + 1.62, 0, 0.12])   // neck
  return caps
}

function sampleBody(n, R) {
  // weights by rough volume; each sample: pos + outward normal; 45% on the surface (silhouette), the rest inside
  const caps = canon(), out = [], nrm = []
  const capVol = c => { const l = Math.hypot(c[3] - c[0], c[4] - c[1], c[5] - c[2]); return Math.PI * c[6] * c[6] * l + 4 / 3 * Math.PI * c[6] ** 3 }
  const parts = [
    { w: Math.PI * 0.16 * 1.0 * 0.75, f: torso }, { w: 4 / 3 * Math.PI * 0.42 * 0.26 * 0.3, f: pelvis },
    { w: 4 / 3 * Math.PI * 0.25 ** 3 * 1.4, f: head }, { w: 0.02, f: () => ell([-0.38, SEAT + 1.27, 0], [0.14, 0.12, 0.13]) }, { w: 0.02, f: () => ell([0.38, SEAT + 1.27, 0], [0.14, 0.12, 0.13]) }, ...caps.map(c => ({ w: capVol(c), f: () => cap(c) }))]
  const W = parts.reduce((a, p) => a + p.w, 0)
  function surf() { return R() < 0.72 }
  function torso() {   // tapered elliptic cylinder, chest wider (r .5 at top -> .3 at seat), depth .62 r
    const v = R(), y = SEAT + 0.25 + v * 1.0, r = 0.3 + 0.16 * Math.pow(v, 0.7) - 0.06 * Math.pow(v, 6.0), a = R() * 6.283, k = surf() ? 1 : Math.sqrt(R())
    return [[Math.cos(a) * r * k, y, Math.sin(a) * r * 0.62 * k], [Math.cos(a), 0, Math.sin(a)]]
  }
  function pelvis() { return ell([0, SEAT + 0.02, 0], [0.42, 0.26, 0.3]) }
  function head() { return ell([0, SEAT + 1.73, 0], [0.22, 0.25, 0.23]) }
  function ell(c, r) {
    let x, y, z; do { x = R() * 2 - 1; y = R() * 2 - 1; z = R() * 2 - 1 } while (x * x + y * y + z * z > 1)
    const l = Math.hypot(x, y, z) || 1, k = surf() ? 1 / l : 1
    return [[c[0] + x * r[0] * k, c[1] + y * r[1] * k, c[2] + z * r[2] * k], [x / l, y / l, z / l]]
  }
  function cap(c) {
    const t = R(), a = R() * 6.283, k = surf() ? 1 : Math.sqrt(R())
    const d = [c[3] - c[0], c[4] - c[1], c[5] - c[2]], l = Math.hypot(...d), u = d.map(x => x / l)
    let p = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
    let v1 = [u[1] * p[2] - u[2] * p[1], u[2] * p[0] - u[0] * p[2], u[0] * p[1] - u[1] * p[0]]; const l1 = Math.hypot(...v1); v1 = v1.map(x => x / l1)
    const v2 = [u[1] * v1[2] - u[2] * v1[1], u[2] * v1[0] - u[0] * v1[2], u[0] * v1[1] - u[1] * v1[0]]
    const nn = [0, 1, 2].map(i => Math.cos(a) * v1[i] + Math.sin(a) * v2[i])
    return [[0, 1, 2].map(i => c[i] + d[i] * t + nn[i] * c[6] * k), nn]
  }
  for (let i = 0; i < n; i++) {
    let x = R() * W, p = parts[0]
    for (const q of parts) { if ((x -= q.w) <= 0) { p = q; break } }
    const [pos, nn] = p.f(); out.push(pos); nrm.push(nn)
  }
  return { pos: out, nrm }
}

const VS = `#version 300 es
precision highp float;
in vec3 aPos; in vec3 aNrm; in vec4 aSeed; in float aType;
uniform float uK, uT, uB, uV, uFlowS, uFlowIP, uAura, uEnv, uExh, uDim, uYaw, uS, uAspect, uVH, uM, uPx, uFocK, uFocKind, uFlowN;
uniform vec4 uFoc; uniform float uMix[8];
out vec3 vCol; out float vA; out float vSharp;
const vec3 GOLD = vec3(${GOLD}), TEAL = vec3(${TEAL}), ROSE = vec3(${ROSE}), AMBER = vec3(${AMBER});
const float PI = 3.14159265;
void main(){
  vec3 p = aPos; float size = 0.06, a = 0.0; vec3 col = GOLD; vSharp = 14.0;
  float h = 0.15 + uB * 2.35;                                   // height the breath's light has filled to
  float tw = 0.78 + 0.22 * sin(uT * (1.3 + aSeed.z * 1.7) * uM + aSeed.w * 40.0);
  vec3 drift = vec3(sin(uT * (0.31 + aSeed.x * 0.5) * uM + aSeed.y * 31.0), sin(uT * (0.27 + aSeed.z * 0.5) * uM + aSeed.x * 17.0),
                    sin(uT * (0.23 + aSeed.w * 0.4) * uM + aSeed.z * 23.0));
  if (aType < 0.5) {                                            // body
    vec3 d = p - vec3(0.0, 1.1, 0.0);
    float wc = exp(-pow((p.y - 1.3) / 0.45, 2.0)) + 0.5 * exp(-pow((p.y - 0.8) / 0.3, 2.0));
    p.xz += d.xz * 0.075 * wc * uB;
    p.y += 0.03 * uB * (p.y - 0.35);
    p += drift * (0.010 + 0.035 * uExh + 0.03 * uEnv) * uM;
    p += aNrm * (0.02 * uExh + 0.04 * uEnv) * aSeed.y;           // exhale: the surface loosens outward, then settles
    float fill = mix(smoothstep(h + 0.3, h - 0.2, p.y), 0.55 + 0.45 * uB, uMix[5]);
    if (uFocKind > 0.5 && uFocKind < 3.5) fill += 0.45 * uFocK * exp(-pow(length(p - uFoc.xyz) / (uFoc.w * 2.6), 2.0));   // warm the body around the point
    float rise = 0.5 + 0.5 * sin(p.y * 7.0 - uFlowS * 15.0);   // bands of light travelling up on the in-breath
    float spread = 0.5 + 0.5 * sin(length(d.xz) * 12.0 + length(d.xy) * 5.0 - uAura * 30.0);
    a = (0.09 + 0.24 * fill) * uK * tw * (1.0 + 0.6 * rise * max(uV, 0.0) + 0.45 * spread * max(-uV, 0.0)) * (1.0 + 0.5 * uEnv);
    col = mix(GOLD, AMBER, 0.45 + 0.5 * aSeed.x); col = mix(col, aSeed.y < 0.5 ? TEAL : ROSE, 0.12 * step(0.82, aSeed.z));
    size = 0.06 + 0.05 * aSeed.w; vSharp = 22.0; a *= uMix[0];
  } else if (aType < 1.5) {                                     // sushumna: rises on the in-breath
    float u = fract(aSeed.x + uFlowS);
    p = vec3(0.016 * sin(aSeed.y * 40.0 + uT * 1.4 * uM) * (0.5 + aSeed.z), mix(0.28, 2.66, u), 0.05);
    float fill = smoothstep(h + 0.25, h - 0.1, p.y);
    a = (0.22 + 0.6 * fill) * sin(PI * u) * tw * (1.0 + 0.6 * uEnv);
    col = mix(AMBER, GOLD, aSeed.w); size = 0.05 + 0.03 * aSeed.w; vSharp = 18.0; a *= uMix[1];
  } else if (aType < 3.5) {                                     // ida (screen right, teal) / pingala (screen left, rose)
    float side = aType < 2.5 ? 1.0 : -1.0;
    float u = fract(aSeed.x - uFlowIP);                         // settles downward on the out-breath
    float y = mix(0.33, 2.12, u);
    p = vec3(side * (0.19 * (1.0 - 0.55 * u)) * sin(PI * 5.0 * u) + (aSeed.y - 0.5) * 0.03, y, 0.08 + (aSeed.z - 0.5) * 0.03);
    a = (0.4 + 0.35 * uB + 0.3 * uExh) * pow(sin(PI * u), 0.6) * tw;
    col = side > 0.0 ? TEAL : ROSE; size = 0.05 + 0.03 * aSeed.w; vSharp = 30.0; a *= uMix[2];
  } else if (aType < 4.5) {                                     // aura: released from the surface on the out-breath
    float life = fract(aSeed.x + uAura);
    p += aNrm * (0.03 + life * (0.35 + 0.35 * aSeed.y) * uMix[3]) + vec3(0.0, life * 0.22, 0.0) + drift * 0.04 * uM;
    a = pow(sin(PI * life), 1.5) * (0.18 + 0.7 * uExh + 0.5 * uEnv) * tw * 0.75 * (0.6 + 0.4 * uMix[3]);
    col = aSeed.z < 0.45 ? TEAL : aSeed.z < 0.75 ? GOLD : ROSE; size = 0.035 + 0.03 * aSeed.w; vSharp = 12.0;
  } else if (aType < 5.5) {                                     // soft haze that swells with the breath
    p += drift * 0.03 * uM;
    p = mix(vec3(0.0, 1.2, 0.0), p, 0.8 + 0.2 * uMix[4]);
    a = 0.03 * (0.55 + 0.9 * uB + 0.6 * uEnv) * min(uMix[4], 1.0); size = (0.5 + 0.3 * aSeed.w) * (0.8 + 0.2 * uMix[4]); vSharp = 3.0;
    col = mix(GOLD, AMBER, 0.6 + 0.4 * aSeed.x);
  } else if (aType > 7.5) {                                     // focus motes: where attention rests (uFocKind 1-3)
    vec3 q = aPos;                                              // aPos = a point in the unit ball
    if (uFocKind < 1.5) {                                       // heart: a warm core that radiates outward on the out-breath
      float life = fract(aSeed.x + uAura * 1.6);
      float rr = uFoc.w * (0.35 + 0.65 * length(q)) * (1.0 + (2.6 + 1.6 * aSeed.y) * life * (0.35 + 0.65 * uExh));
      p = uFoc.xyz + normalize(q + 1e-4) * rr + drift * 0.01 * uM;
      a = 0.2 * (0.6 + 0.4 * uB) * pow(1.0 - life, 1.1) * tw * uFocK;
      col = mix(ROSE, AMBER, 0.1 + 0.25 * aSeed.z); size = 0.10 + 0.08 * aSeed.w; vSharp = 4.0;
    } else if (uFocKind < 2.5) {                                // nostrils: a fine stream at the touch point, in on the in-breath, out on the out
      float u = fract(aSeed.x + uFlowN);
      float sd = aSeed.w < 0.5 ? -1.0 : 1.0;                    // two nostrils, a little apart, streams fanning slightly outward
      vec3 dir = normalize(vec3(sd * 0.45 + (aSeed.y - 0.5) * 0.5, -0.5 - 0.3 * aSeed.z, 1.0));
      p = uFoc.xyz + vec3(sd * 0.025, 0.0, 0.0) + dir * (0.01 + u * 0.2) + drift * 0.006 * uM;
      a = 0.26 * (0.4 + 0.6 * min(abs(uV) * 1.5, 1.0)) * pow(1.0 - u, 1.2) * tw * uFocK;
      col = mix(TEAL, AMBER, smoothstep(-0.2, 0.2, -uV)); size = 0.06 + 0.05 * aSeed.w; vSharp = 5.0;
    } else {                                                    // belly: a soft ball that rises and falls with the breath
      vec3 e = vec3(1.3, 0.85, 0.9) * uFoc.w * (0.75 + 0.55 * uB);
      p = uFoc.xyz + vec3(0.0, 0.0, 0.06 * uB) + q * e + drift * 0.012 * uM;
      a = 0.13 * (0.5 + 0.5 * uB) * (1.0 - 0.6 * length(q)) * tw * uFocK;
      col = mix(AMBER, ROSE, 0.2 * aSeed.z); size = 0.11 + 0.08 * aSeed.w; vSharp = 4.0;
    }
    if (uFocKind < 0.5 || uFocKind > 3.5) a = 0.0;
  } else if (aType > 6.5) {                                     // filaments along the limbs: aPos = proximal end, aNrm = distal end
    float u = fract(aSeed.x + (uFlowIP - uFlowS) * 0.8);
    p = mix(aPos, aNrm, u) + (aSeed.yzw - 0.5) * 0.05 + drift * 0.012 * uM;
    a = (0.16 + 0.22 * uB + 0.2 * uExh) * pow(sin(PI * u), 0.5) * uK * tw;
    col = mix(AMBER, GOLD, aSeed.y); size = 0.035 + 0.02 * aSeed.w; vSharp = 26.0; a *= uMix[7];
  } else {                                                      // loci along the central channel
    float lit = smoothstep(p.y + 0.35, p.y - 0.05, h);
    a = (0.14 + 0.5 * lit + 0.2 * uEnv) * (0.85 + 0.15 * sin(uT * 0.9 * uM + p.y * 3.0));
    size = 0.20 + 0.10 * lit + 0.04 * sin(uT * 0.7 * uM + aSeed.x * 6.0); vSharp = 7.0;
    col = p.y > 2.3 ? mix(GOLD, vec3(1.0, 0.9, 0.7), 0.4) : AMBER; a *= uMix[6];
  }
  float cy = cos(uYaw), sy = sin(uYaw);
  p.xz = mat2(cy, -sy, sy, cy) * p.xz;
  float w = 1.0 - p.z * 0.07;
  gl_Position = vec4(p.x * uS / uAspect, (p.y - 1.33) * uS, 0.0, w);
  gl_PointSize = max(1.0, size * uS * 0.5 * uVH / w);
  vCol = col; vA = a * uDim;
}`
const FS = `#version 300 es
precision mediump float;
in vec3 vCol; in float vA; in float vSharp; out vec4 o;
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0; float r2 = dot(q, q); if (r2 > 1.0) discard;
  float core = exp(-r2 * vSharp) * (1.0 - r2), halo = 0.24 * exp(-r2 * 2.5) * (1.0 - r2);
  vec3 pale = 0.55 + 0.45 * vCol + vec3(0.04, 0.02, -0.03);   // each mote: a pale spark inside its own coloured halo
  o = vec4((pale * core * 0.5 + vCol * halo) * vA, (core * 0.5 + halo) * vA);
}`
const CVS = `#version 300 es
in vec2 aP; out vec2 vUv; void main(){ vUv = aP * 0.5 + 0.5; gl_Position = vec4(aP, 0.0, 1.0); }`
const BFS = `#version 300 es
precision mediump float;
uniform sampler2D uTex; uniform vec2 uStep; in vec2 vUv; out vec4 o;
void main(){
  vec4 c = texture(uTex, vUv) * 0.227;
  c += (texture(uTex, vUv + uStep * 1.38) + texture(uTex, vUv - uStep * 1.38)) * 0.316;
  c += (texture(uTex, vUv + uStep * 3.23) + texture(uTex, vUv - uStep * 3.23)) * 0.070;
  o = c;
}`
const CFS = `#version 300 es
precision mediump float;
uniform sampler2D uTex, uBlur; uniform float uGain, uBloom; in vec2 vUv; out vec4 o;
void main(){
  vec4 e = texture(uTex, vUv) + texture(uBlur, vUv) * uBloom;
  float a = e.a; vec3 hue = e.rgb / max(a, 1e-4);
  float cov = 1.0 - exp(-a * uGain);
  vec3 hot = 0.62 + 0.38 * hue + vec3(0.03, 0.015, -0.02);     // where the sharp light is densest it turns pale (its own hue):
  float core = texture(uTex, vUv).a;                            // reads as luminous rather than inked
  vec3 c = mix(hue, hot, smoothstep(0.45, 1.8, core) * 0.8);
  float l = dot(c, vec3(0.299, 0.587, 0.114)); c = clamp(mix(vec3(l), c, 1.15), 0.0, 1.0);
  hue = mix(vec3(1.0), c, cov);
  o = vec4(hue, 1.0);
}`

export function createBody(canvas, { small = false, reduce = false, locus = null } = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' })
  if (!gl) return null
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o }
  const prog = (v, f) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, v)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, f)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p }
  const P = prog(VS, FS), C = prog(CVS, CFS), B = prog(CVS, BFS)

  // particles: counts capped for phones; reduced motion keeps all the light, moves it slower
  const k = small ? 0.5 : 1
  const N = { body: Math.round(5200 * k), sus: Math.round(900 * k), ida: Math.round(420 * k), aura: Math.round(900 * k), haze: Math.round(240 * k) }
  const R = rng(108)
  const pos = [], nrm = [], seed = [], type = []
  const push = (p, n, t) => { pos.push(...p); nrm.push(...n); seed.push(R(), R(), R(), R()); type.push(t) }
  const body = sampleBody(N.body + N.aura + N.haze, R)
  let j = 0
  for (let i = 0; i < N.body; i++, j++) push(body.pos[j], body.nrm[j], 0)
  for (let i = 0; i < N.sus; i++) push([0, 0, 0], [0, 0, 0], 1)
  for (let i = 0; i < N.ida; i++) push([0, 0, 0], [0, 0, 0], 2)
  for (let i = 0; i < N.ida; i++) push([0, 0, 0], [0, 0, 0], 3)
  for (let i = 0; i < N.aura; i++, j++) push(body.pos[j], body.nrm[j], 4)
  for (let i = 0; i < N.haze; i++, j++) push(body.pos[j], body.nrm[j], 5)
  for (const y of LOCI) push([0, y, 0.06], [0, 0, 0], 6)
  const limbs = canon(), nF = Math.round(1400 * k)
  for (let i = 0; i < nF; i++) { const c = limbs[i % limbs.length]; push(c.slice(0, 3), c.slice(3, 6), 7) }
  for (let i = 0; i < Math.round(500 * k); i++) {   // threads up the torso's sides and over the head
    const sd = i % 2 ? 1 : -1, r = R()
    if (r < 0.7) push([sd * 0.24, SEAT + 0.05, 0.1], [sd * 0.44, SEAT + 1.3, 0.1], 7)
    else push([sd * 0.05, SEAT + 1.45, 0.15], [sd * 0.2, SEAT + 1.85, 0.1], 7)
  }
  const nFoc = Math.round(420 * k)
  for (let i = 0; i < nFoc; i++) { let x, y, z; do { x = R() * 2 - 1; y = R() * 2 - 1; z = R() * 2 - 1 } while (x * x + y * y + z * z > 1); push([x, y, z], [0, 0, 0], 8) }
  const count = type.length
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao)
  const attr = (name, data, n) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW); const l = gl.getAttribLocation(P, name); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, n, gl.FLOAT, false, 0, 0) }
  attr('aPos', pos, 3); attr('aNrm', nrm, 3); attr('aSeed', seed, 4); attr('aType', type, 1)
  const quad = gl.createVertexArray(); gl.bindVertexArray(quad)
  { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); const l = gl.getAttribLocation(C, 'aP'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0) }
  gl.bindVertexArray(null)
  const U = {}; for (const n of ['uK', 'uT', 'uB', 'uV', 'uFlowS', 'uFlowIP', 'uAura', 'uEnv', 'uExh', 'uDim', 'uYaw', 'uS', 'uAspect', 'uVH', 'uM', 'uPx', 'uFocK', 'uFocKind', 'uFlowN']) U[n] = gl.getUniformLocation(P, n)
  const uFoc = gl.getUniformLocation(P, 'uFoc'), uMix = gl.getUniformLocation(P, 'uMix')
  const uTex = gl.getUniformLocation(C, 'uTex'), uGain = gl.getUniformLocation(C, 'uGain'), uBlurT = gl.getUniformLocation(C, 'uBlur'), uBloom = gl.getUniformLocation(C, 'uBloom')
  const bTex = gl.getUniformLocation(B, 'uTex'), bStep = gl.getUniformLocation(B, 'uStep')

  // light buffer: half float when the GPU can render to it, else 8-bit (saturates sooner, still fine)
  const hf = gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float')
  const tgt = () => ({ tex: gl.createTexture(), fbo: gl.createFramebuffer(), w: 0, h: 0 })
  const L = tgt(), B1 = tgt(), B2 = tgt()
  let W = 0, H = 0, fmt = hf ? 'rgba16f' : 'rgba8'
  function make(t, w, h) {
    t.w = w; t.h = h
    gl.bindTexture(gl.TEXTURE_2D, t.tex)
    if (fmt === 'rgba16f') gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null)
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.tex, 0)
    return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE
  }
  function alloc() {
    const bw = Math.max(8, W >> 2), bh = Math.max(8, H >> 2)
    if (!(make(L, W, H) && make(B1, bw, bh) && make(B2, bw, bh)) && fmt === 'rgba16f') { fmt = 'rgba8'; alloc() }
  }
  function pass(prog, dst, src, setup) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.fbo : null); gl.viewport(0, 0, dst ? dst.w : W, dst ? dst.h : H)
    gl.useProgram(prog); gl.bindVertexArray(quad); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src.tex); setup(); gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
  const dprCap = small ? 1.5 : 2
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, dprCap)
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr)
    if (w === W && h === H) return
    canvas.width = W = w; canvas.height = H = h; alloc()
  }

  const m = reduce ? 0.45 : 1, bloom = 0.6
  let flowS = 0, flowIP = 0, flowN = 0, aura = 0, exh = 0, dim = 1, t0 = performance.now()
  // locus: eased in over ~2 s so a change never jumps; mix eases from the plain look toward the locus's weights
  let foc = LOCUS.none, focK = 0, mix = MIX[0].slice(), atCur = null, rCur = 0.1
  // a new locus of the same point kind glides there (attention moving: nose -> forehead -> crown) instead of fading out and in
  function setLocus(l) {
    const next = typeof l === 'string' ? (LOCUS[l] || LOCUS.none) : (l && l.kind != null ? l : LOCUS.none)
    const glide = foc.kind && next.kind === foc.kind && foc.at && next.at
    foc = next; if (!glide) { focK = 0; atCur = foc.at ? foc.at.slice() : null; rCur = foc.r || 0.1 }
  }
  setLocus(locus)
  function frame(dt, b) {
    resize()
    const vN = Math.max(-1, Math.min(1, b.vel / 0.35))
    flowS += dt * (0.025 + 0.24 * Math.max(vN, 0) + 0.05 * b.env) * m
    flowIP += dt * (0.02 + 0.17 * Math.max(-vN, 0)) * m
    flowN += dt * (-0.32 * vN) * m   // nostril stream: toward the face on the in-breath, away on the out-breath
    focK += ((foc.kind ? 1 : 0) - focK) * (1 - Math.exp(-dt / 1.8))
    const target = MIX[foc.kind] || MIX[0]; for (let i = 0; i < 8; i++) mix[i] += (target[i] - mix[i]) * (1 - Math.exp(-dt / 1.8))
    aura += dt * (0.014 + 0.11 * Math.max(-vN, 0) + 0.08 * b.env) * m
    exh += (Math.max(-vN, 0) - exh) * (1 - Math.exp(-dt / 1.2))
    dim += ((b.rest ? 0.5 : 1) - dim) * (1 - Math.exp(-dt / 1.5))
    const t = (performance.now() - t0) / 1000, aspect = W / H
    const S = Math.min(0.9 / 1.65, 0.96 * aspect / 1.38)
    gl.bindFramebuffer(gl.FRAMEBUFFER, L.fbo); gl.viewport(0, 0, W, H)
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE)
    gl.useProgram(P); gl.bindVertexArray(vao)
    const set = { uK: small ? 1.1 : 0.72, uT: t, uB: b.level, uV: vN, uFlowS: flowS, uFlowIP: flowIP, uAura: aura, uEnv: b.env || 0, uExh: exh, uDim: dim,
      uYaw: 0.16 * Math.sin(t * 0.06 * m) + 0.04 * Math.sin(t * 0.17 * m), uS: S, uAspect: aspect, uVH: H, uM: m, uPx: 1 }
    set.uFocK = focK * (foc.gain || 1); set.uFocKind = foc.kind || 0; set.uFlowN = flowN
    for (const n in set) gl.uniform1f(U[n], set[n])
    if (foc.at) { if (!atCur) atCur = foc.at.slice(); const g = 1 - Math.exp(-dt / 1.1); for (let i = 0; i < 3; i++) atCur[i] += (foc.at[i] - atCur[i]) * g; rCur += ((foc.r || 0.1) - rCur) * g }
    const at = atCur || [0, 0, 0]; gl.uniform4f(uFoc, at[0], at[1], at[2], foc.at ? rCur : (foc.r || 0.1)); gl.uniform1fv(uMix, mix)
    gl.drawArrays(gl.POINTS, 0, count)
    gl.disable(gl.BLEND)
    const sx = 1 / B1.w, sy = 1 / B1.h
    pass(B, B1, L, () => { gl.uniform1i(bTex, 0); gl.uniform2f(bStep, sx * 0.5, sy * 0.5) })   // downsample
    for (const k2 of [1.2, 2.6]) {
      pass(B, B2, B1, () => { gl.uniform1i(bTex, 0); gl.uniform2f(bStep, sx * k2, 0) })
      pass(B, B1, B2, () => { gl.uniform1i(bTex, 0); gl.uniform2f(bStep, 0, sy * k2) })
    }
    pass(C, null, L, () => { gl.uniform1i(uTex, 0); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, B1.tex); gl.uniform1i(uBlurT, 1)
      gl.uniform1f(uGain, 1.15); gl.uniform1f(uBloom, bloom); gl.activeTexture(gl.TEXTURE0) })
  }
  return { frame, resize, count, setLocus, get locus() { return foc }, get fmt() { return fmt } }
}
