// Satsang fx · glow layer on raw WebGL2 (no dependencies, ~4 KB).
// Draws additive gaussian sprites (instanced quads): breath-synced glow on loci, prana-flow particles riding the sound wave,
// and the soft halo along the wave line. Positions are computed on the CPU per frame as analytic functions of t
// (deterministic, seekable); the GPU only rasterises the soft points. Technique: instanced point sprites with premultiplied
// additive blending (the same idea as mapbox/webgl-wind's particle pass, without its state textures; see ../THIRD_PARTY_NOTICES.md).
// createGlow(canvas) → { ok, resize(), draw(sprites), clear(), destroy() } · sprite = [x_px, y_px, r_px, alpha, r, g, b] (rgb 0-1)

const VS = `#version 300 es
layout(location=0) in vec2 corner;
layout(location=1) in vec4 sprite;   // x, y, radius (css px), alpha
layout(location=2) in vec3 colour;
uniform vec2 view;                   // css px size
uniform float dpr;
out vec2 uv; out vec4 col;
void main() {
  vec2 p = sprite.xy + corner * sprite.z;
  uv = corner; col = vec4(colour, sprite.w);
  gl_Position = vec4(p.x / view.x * 2.0 - 1.0, 1.0 - p.y / view.y * 2.0, 0.0, 1.0);
}`
const FS = `#version 300 es
precision mediump float;
in vec2 uv; in vec4 col;
out vec4 o;
void main() {
  float d2 = dot(uv, uv);
  if (d2 > 1.0) discard;
  float a = col.a * (exp(-d2 * 5.5) * 0.9 + exp(-d2 * 40.0) * 0.35);   // soft body + a small hot core
  o = vec4(col.rgb * a, a);
}`

export function createGlow(canvas, o = {}) {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: !!o.preserve })
  if (!gl) return { ok: false, resize() { }, draw() { }, clear() { }, destroy() { } }
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s }
  const prog = gl.createProgram()
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog))
  const uView = gl.getUniformLocation(prog, 'view'), uDpr = gl.getUniformLocation(prog, 'dpr')
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao)
  const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  const inst = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, inst)
  let cap = 0, data = new Float32Array(0)
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 28, 0); gl.vertexAttribDivisor(1, 1)
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 28, 16); gl.vertexAttribDivisor(2, 1)
  gl.bindVertexArray(null)
  let W = 1, H = 1, dpr = 1
  function resize() {
    const r = canvas.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1)
    W = Math.max(1, r.width); H = Math.max(1, r.height)
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
  }
  function draw(sprites) {
    const n = sprites.length
    if (n > cap) { cap = Math.max(n, cap * 2, 256); data = new Float32Array(cap * 7) }
    for (let i = 0; i < n; i++) { const s = sprites[i], j = i * 7; for (let k = 0; k < 7; k++) data[j + k] = s[k] }
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT)
    if (!n) return
    gl.useProgram(prog); gl.uniform2f(uView, W, H); gl.uniform1f(uDpr, dpr)
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE)
    gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, inst)
    gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, n * 7), gl.DYNAMIC_DRAW)
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n)
    gl.bindVertexArray(null)
  }
  resize()
  return {
    ok: true, gl, resize, draw,
    clear() { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT) },
    destroy() { gl.getExtension('WEBGL_lose_context')?.loseContext() },
    get renderer() { const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'webgl2' },
  }
}
