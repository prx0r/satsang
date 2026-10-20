/* Wiser Atlas prototype: timeline knowledge graph in the deitybody grammar.
   Vanilla JS + SVG, no build. Data: window.ATLAS (data.js, built by tools/build.py). */
(() => {
'use strict';
const A = window.ATLAS, NS = 'http://www.w3.org/2000/svg';
const NOW = 2026, K = 120, MINY = -1650, MAXY = 2032;
const N = new Map(A.nodes.map(n => [n.id, n]));
const lanes = A.streams.lanes, groups = A.streams.groups;
const laneById = new Map(lanes.map(l => [l.id, l]));
const lc = l => l.ink || l.colour;
const SCH = '#6d7180', GOLD = '#a86f14';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = s => document.querySelector(s);
const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- edge classes (DESIGN.md §4) ---------- */
const TX = new Set(['teacher_of', 'initiated']);
const ACAD = new Set(['academic_teacher_of', 'doctoral_advisor_of']);
const STUDY = new Set(['studied', 'critical_edition_of', 'commentary_on']);
const TEXTUAL = new Set(['commented_on', 'translated', 'founded', 'expounds', 'synthesis_of', 'part_of', 'located_at', 'schism_from']);
function eclass(e) {
  const fs = N.get(e.from), ts = N.get(e.to);
  if (TX.has(e.type)) return 'tx' + (e.basis === 'traditional' ? ' trad' : '');
  if (ACAD.has(e.type)) return 'study acad';
  if (STUDY.has(e.type) || (fs.kind === 'scholar' && e.type === 'translated')) return 'study';
  if (e.type === 'parallels') return 'par';
  if (e.type === 'opposed') return 'opp';
  if (e.type === 'influenced') return 'inf' + (fs.stream && fs.stream === ts.stream ? ' same' : '');
  return 'txt';
}

/* ---------- time ---------- */
let logMode = true;
const tf = y => logMode ? -Math.log(NOW + K - y) : y;
function rep(n) {
  const t = n.time; if (!t) return null;
  let s = t.start, e = t.end;
  if (s == null && e != null) s = e - 50;
  if (s == null) return null;
  if (e == null) e = Math.min(NOW, s + ((n.kind === 'person' || n.kind === 'scholar') ? 40 : 0));
  if (['school', 'lineage', 'event'].includes(n.kind)) return s;
  if (n.kind === 'person' || n.kind === 'scholar') return Math.min(NOW, s + Math.min(45, (e - s) * 0.6));
  return (s + e) / 2;
}
function repAlt(n) { const t = n.time_alt && n.time_alt[0]; if (!t || t.start == null) return null; return t.end != null ? (t.start + t.end) / 2 : t.start; }

/* ---------- layout ---------- */
let W = 0, labW = 150, view = [tf(MINY), tf(MAXY)];
const X = y => labW + 14 + (tf(y) - view[0]) / (view[1] - view[0]) * (W - labW - 28);
const drawn = [];          // nodes with a position
const pos = new Map();     // id -> {y, row, lane}
const ROWH = 14, LANEPAD = 6, MAXROWS = 4, SCHROWH = 11;
let laneY = new Map(), totalH = 0;

function isDrawn(n) {
  if (n.kind === 'concept') return false;
  if (!n.stream || !laneById.has(n.stream)) return false;
  if (n.kind === 'deity') return true;
  return rep(n) != null;
}
function deityYear(n) { const l = laneById.get(n.stream); return (l.span.start ?? 0); }
function yearOf(n) { return n.kind === 'deity' ? deityYear(n) : rep(n); }

const degree = new Map();
A.edges.forEach(e => { degree.set(e.from, (degree.get(e.from) || 0) + 1); degree.set(e.to, (degree.get(e.to) || 0) + 1); });
const talks = n => n.talks ? (n.talks.by || 0) + (n.talks.about || 0) : 0;

function pack() {
  // rows packed in "fit" pixel space so the layout is stable while zooming
  const saveView = view; view = [tf(MINY), tf(MAXY)];
  laneY = new Map(); let y = 8; pos.clear(); drawn.length = 0;
  let lastGroup = null;
  for (const l of lanes) {
    if (l.group !== lastGroup) { y += lastGroup ? 16 : 4; lastGroup = l.group; }
    const ns = A.nodes.filter(n => n.stream === l.id && isDrawn(n) && (showScholars || n.kind !== 'scholar') && !kindOff.has(n.kind) && streamOn.has(l.id));
    if (!streamOn.has(l.id)) { continue; }
    const main = ns.filter(n => n.kind !== 'scholar').sort((a, b) => yearOf(a) - yearOf(b));
    const sch = ns.filter(n => n.kind === 'scholar').sort((a, b) => yearOf(a) - yearOf(b));
    const rowsEnd = [];
    const place = (n, rowsArr, minGap, cap) => {
      const px = X(yearOf(n)); let r = 0;
      while (r < cap && rowsArr[r] != null && px - rowsArr[r] < minGap) r++;
      if (r >= cap) { r = 0; for (let i = 1; i < cap; i++) if (rowsArr[i] < rowsArr[r]) r = i; }  // full: reuse the row with most room
      rowsArr[r] = px; return r;
    };
    const minGap = Math.max(14, (W - labW) / 80);
    main.forEach(n => pos.set(n.id, { row: place(n, rowsEnd, minGap, Math.min(8, Math.max(MAXROWS, 2 + Math.floor(main.length / 12)))), lane: l.id, sch: false }));
    const nMain = Math.max(1, rowsEnd.length);
    const schRows = [];
    sch.forEach(n => pos.set(n.id, { row: place(n, schRows, minGap * 0.7, 2), lane: l.id, sch: true }));
    const nSch = schRows.length;
    const h = LANEPAD * 2 + nMain * ROWH + (nSch ? 4 + nSch * SCHROWH : 0);
    laneY.set(l.id, { top: y, h, nMain, nSch });
    for (const n of ns) {
      const p = pos.get(n.id);
      p.y = p.sch ? y + LANEPAD + nMain * ROWH + 4 + SCHROWH / 2 + p.row * SCHROWH : y + LANEPAD + ROWH / 2 + p.row * ROWH;
      drawn.push(n);
    }
    y += h;
  }
  totalH = y + 30; view = saveView;
}

/* ---------- glyphs (DESIGN.md §3: glyph first, colour by stream) ---------- */
function glyph(n, g, col) {
  const k = n.kind, t = talks(n);
  const big = Math.min(2.2, Math.log2(2 + (degree.get(n.id) || 0)) * 0.55);
  const r = 3.2 + big;
  if (t > 0) el('circle', { r: r + 3.4, class: 'g ring-talk', fill: 'none', stroke: GOLD, 'stroke-width': 1, opacity: .7 }, g);
  switch (k) {
    case 'person': el('circle', { r, fill: col, class: 'g' }, g); break;
    case 'scholar': el('path', { d: `M0 ${-r * .95}L${r * .95} 0L0 ${r * .95}L${-r * .95} 0Z`, fill: 'none', stroke: col, 'stroke-width': 1.2, class: 'g' }, g); break;
    case 'text': el('rect', { x: -r * 1.5, y: -r * .62, width: r * 3, height: r * 1.24, rx: 1.4, fill: 'none', stroke: col, 'stroke-width': 1.3, class: 'g' }, g);
      el('line', { x1: -r * .9, x2: r * .9, y1: 0, y2: 0, stroke: col, 'stroke-width': .8, opacity: .7 }, g); break;
    case 'school': { const p = []; for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i; p.push(`${(r + 1.5) * Math.cos(a)},${(r + 1.5) * Math.sin(a)}`); }
      el('polygon', { points: p.join(' '), fill: 'none', stroke: col, 'stroke-width': 1.3, class: 'g' }, g); el('circle', { r: 1.4, fill: col }, g); break; }
    case 'lineage': el('circle', { r: r + 1.5, fill: 'none', stroke: col, 'stroke-width': 1.2, class: 'g' }, g); el('circle', { r: r * .45, fill: 'none', stroke: col, 'stroke-width': 1 }, g); break;
    case 'practice': el('path', { d: `M0 ${-r * 1.2}L${r * 1.1} ${r * .75}L${-r * 1.1} ${r * .75}Z`, fill: 'none', stroke: col, 'stroke-width': 1.3, class: 'g' }, g); break;
    case 'place': el('rect', { x: -r, y: -r, width: r * 2, height: r * 2, fill: 'none', stroke: col, 'stroke-width': 1.2, class: 'g' }, g); break;
    case 'deity': { const s = r + 1.6, tri = a => [0, 1, 2].map(i => { const q = a + i * 2 * Math.PI / 3; return `${s * Math.sin(q)},${-s * Math.cos(q)}`; }).join(' ');
      el('polygon', { points: tri(0), fill: 'none', stroke: col, 'stroke-width': 1.1, class: 'g' }, g); el('polygon', { points: tri(Math.PI), fill: 'none', stroke: col, 'stroke-width': 1.1 }, g); break; }
    case 'event': el('line', { x1: 0, x2: 0, y1: -r - 2, y2: r + 2, stroke: col, 'stroke-width': 1.6, class: 'g' }, g); el('circle', { r: r * .7, fill: 'none', stroke: col, 'stroke-width': 1 }, g); break;
    default: el('circle', { r, fill: col, class: 'g' }, g);
  }
  el('circle', { r: 11, class: 'hit' }, g);
}

/* ---------- stream symbols: one geometric mark per tradition (DESIGN.md §3.3) ---------- */
function sym(name, g, col, s = 6) {
  const st = { fill: 'none', stroke: col, 'stroke-width': 1.1, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  const P = (d, extra = {}) => el('path', { d, ...st, ...extra }, g), C = (r, extra = {}) => el('circle', { r, ...st, ...extra }, g);
  const poly = (n, r, rot = 0) => [...Array(n)].map((_, i) => { const a = rot + i * 2 * Math.PI / n; return `${(r * Math.sin(a)).toFixed(2)} ${(-r * Math.cos(a)).toFixed(2)}`; });
  const rays = (k, r0, r1) => { for (let i = 0; i < k; i++) { const a = i * 2 * Math.PI / k; P(`M${(r0 * Math.cos(a)).toFixed(2)} ${(r0 * Math.sin(a)).toFixed(2)}L${(r1 * Math.cos(a)).toFixed(2)} ${(r1 * Math.sin(a)).toFixed(2)}`); } };
  switch (name) {
    case 'agni': P(`M0 ${-s}L${s * .87} ${s * .6}H${-s * .87}Z`, { fill: col }); break;
    case 'bindu': C(s); C(s * .28, { fill: col }); break;
    case 'purna': C(s); C(s * .55); break;
    case 'lotus': P(`M0 ${s * .7}C${-s * .9} 0 ${-s * .3} ${-s * .8} 0 ${-s}C${s * .3} ${-s * .8} ${s * .9} 0 0 ${s * .7}M${-s} ${s * .2}C${-s * .5} ${s * .8} ${s * .5} ${s * .8} ${s} ${s * .2}`); break;
    case 'trident': P(`M0 ${s}V${-s}M${-s * .8} ${-s * .7}C${-s * .8} 0 ${s * .8} 0 ${s * .8} ${-s * .7}`); break;
    case 'yoni': P(`M${-s * .9} ${-s * .55}H${s * .9}L0 ${s * .9}Z`); C(s * .18, { fill: col, cy: -s * .1 }); break;
    case 'triad': poly(3, s * .62).forEach(q => { const [x, y] = q.split(' '); el('circle', { cx: x, cy: y, r: s * .22, fill: col }, g); }); C(s); break;
    case 'yantra': P(`M${poly(3, s).join('L')}Z`); P(`M${poly(3, s, Math.PI).join('L')}Z`); C(s * .14, { fill: col }); break;
    case 'wheel': C(s); C(s * .2, { fill: col }); rays(8, s * .2, s); break;
    case 'wheel-hub': C(s); C(s * .45); rays(8, s * .45, s); break;
    case 'vajra': P(`M0 ${-s}V${s}M0 ${-s * .2}C${-s * .8} ${-s * .4} ${-s * .6} ${-s} 0 ${-s}C${s * .6} ${-s} ${s * .8} ${-s * .4} 0 ${-s * .2}M0 ${s * .2}C${-s * .8} ${s * .4} ${-s * .6} ${s} 0 ${s}C${s * .6} ${s} ${s * .8} ${s * .4} 0 ${s * .2}`); C(s * .18, { fill: col }); break;
    case 'enso': P(`M${s * .55} ${-s * .8}A${s} ${s} 0 1 0 ${s * .95} ${-s * .25}`, { 'stroke-width': 1.8 }); break;
    case 'siddhashila': P(`M${-s * .9} ${-s * .2}C${-s * .6} ${s * .6} ${s * .6} ${s * .6} ${s * .9} ${-s * .2}`); C(s * .22, { fill: col, cy: -s * .6 }); break;
    case 'taiji': C(s); P(`M0 ${-s}A${s / 2} ${s / 2} 0 0 1 0 0A${s / 2} ${s / 2} 0 0 0 0 ${s}A${s} ${s} 0 0 1 0 ${-s}Z`, { fill: col }); break;
    case 'monad': C(s); C(s * .18, { fill: col }); break;
    case 'emanation': C(s); C(s * .66); C(s * .33); C(s * .1, { fill: col }); break;
    case 'cross': P(`M0 ${-s}V${s}M${-s * .65} ${-s * .3}H${s * .65}`, { 'stroke-width': 1.4 }); break;
    case 'mercury': C(s * .42, { cy: -s * .05 }); P(`M${-s * .45} ${-s}C${-s * .3} ${-s * .55} ${s * .3} ${-s * .55} ${s * .45} ${-s}M0 ${s * .37}V${s}M${-s * .35} ${s * .7}H${s * .35}`); break;
    case 'ouroboros': P(`M${s * .3} ${-s * .95}A${s} ${s} 0 1 0 ${s * .95} ${-s * .3}`); P(`M${s * .95} ${-s * .3}l${-s * .35} ${-s * .05}l${s * .1} ${s * .35}`, { fill: col }); break;
    case 'pentagram': { const p = poly(5, s); P(`M${[0, 2, 4, 1, 3].map(i => p[i]).join('L')}Z`); break; }
    case 'triple-moon': C(s * .42); P(`M${-s * .55} ${-s * .6}A${s * .62} ${s * .62} 0 0 0 ${-s * .55} ${s * .6}A${s * .85} ${s * .85} 0 0 1 ${-s * .55} ${-s * .6}ZM${s * .55} ${-s * .6}A${s * .62} ${s * .62} 0 0 1 ${s * .55} ${s * .6}A${s * .85} ${s * .85} 0 0 0 ${s * .55} ${-s * .6}Z`, { fill: col }); break;
    case 'spiral': { let d = 'M0 0'; for (let t = 0; t < 4 * Math.PI; t += .3) { const r = s * t / (4 * Math.PI); d += `L${(r * Math.cos(t)).toFixed(2)} ${(r * Math.sin(t)).toFixed(2)}`; } P(d); break; }
    case 'sun': C(s * .42, { fill: col }); rays(8, s * .62, s); break;
    case 'tree': [[0, -1], [-.6, -.6], [.6, -.6], [0, -.2], [-.6, .2], [.6, .2], [0, .55], [0, 1]].forEach(([x, y]) => el('circle', { cx: x * s, cy: y * s * .95, r: s * .17, fill: col }, g)); P(`M0 ${-s * .95}V${s * .95}M${-s * .6} ${-s * .6}V${s * .2}M${s * .6} ${-s * .6}V${s * .2}`, { opacity: .5 }); break;
    case 'vesica': C(s * .6, { cx: -s * .3 }); C(s * .6, { cx: s * .3 }); break;
    default: C(s);
  }
}

/* ---------- state ---------- */
let edgeFocus = null;
let showScholars = true, sel = null, hov = null, concept = null, query = '';
const kindOff = new Set();
const streamOn = new Set(lanes.map(l => l.id));
const svg = $('#svg'), axis = $('#axis');
let gBands, gEdges, gHits, gThread, gNodes, gLabels, gFx;
const nodeEls = new Map(), edgeEls = [];

function build() {
  W = Math.max(320, $('#stage').clientWidth);
  labW = W < 700 ? 86 : 150;
  pack();
  svg.innerHTML = '';
  svg.setAttribute('width', W); svg.setAttribute('height', totalH);
  gBands = el('g', {}, svg); gEdges = el('g', {}, svg); gHits = el('g', {}, svg); gThread = el('g', {}, svg); gNodes = el('g', {}, svg); gLabels = el('g', {}, svg); gFx = el('g', {}, svg);
  // lanes: thin channel lines (nāḍī), lane label column
  let lastGroup = null;
  for (const l of lanes) {
    const ly = laneY.get(l.id); if (!ly) continue;
    if (l.group !== lastGroup) {
      lastGroup = l.group;
      const gl = groups.find(g => g.id === l.group);
      const gt = el('text', { x: 10, y: ly.top - 3, class: 'grouplab', tabindex: 0, role: 'button' }, gBands);
      gt.textContent = gl ? gl.label : l.group;
      const gid = l.group; gt.addEventListener('click', ev => { ev.stopPropagation(); soloGroup(gid); });
    }
    el('rect', { x: 0, y: ly.top, width: W, height: ly.h, fill: lanes.indexOf(l) % 2 ? 'rgba(34,36,44,.022)' : 'rgba(34,36,44,0)' }, gBands);
    l._chan = el('line', { y1: ly.top + ly.h / 2, y2: ly.top + ly.h / 2, stroke: lc(l), 'stroke-width': 1, opacity: .16 }, gBands);
    if (ly.nSch) l._sch = el('line', { y1: ly.top + LANEPAD + ly.nMain * ROWH + 2, y2: ly.top + LANEPAD + ly.nMain * ROWH + 2, opacity: .6, stroke: '#d9d3c1', 'stroke-dasharray': '1 3' }, gBands);
    const short = l.label.split(' (')[0];
    const lg_ = el('g', { class: 'lane', tabindex: 0, role: 'button', 'aria-label': 'Stream ' + short }, gBands);
    lg_.addEventListener('click', ev => { ev.stopPropagation(); lanePanel(l); });
    lg_.addEventListener('keydown', ev => { if (ev.key === 'Enter') lanePanel(l); });
    el('rect', { x: 0, y: ly.top, width: labW - 4, height: Math.max(26, Math.min(ly.h, 44)), fill: 'transparent' }, lg_);
    const t = el('text', { x: 20, y: ly.top + Math.min(ly.h / 2, 16) + 4, class: 'lanelab' }, lg_);
    const words = short.split(' '); let line = '', lines = [];
    const maxc = labW < 100 ? 11 : 20;
    for (const w of words) { if ((line + ' ' + w).trim().length > maxc && line) { lines.push(line); line = w; } else line = (line + ' ' + w).trim(); }
    lines.push(line);
    lines.slice(0, 3).forEach((s, i) => { const ts = el('tspan', { x: 20, dy: i ? 12 : 0 }, t); ts.textContent = s; });
    sym(l.symbol, el('g', { transform: `translate(9,${ly.top + Math.min(ly.h / 2, 16)})` }, lg_), lc(l), 5.2);
  }
  el('rect', { x: 0, y: 0, width: labW, height: totalH, fill: 'url(#fadeL)' }, gBands);
  // edges
  edgeEls.length = 0;
  for (const e of A.edges) {
    if (!pos.has(e.from) || !pos.has(e.to)) continue;
    const c = eclass(e);
    const p = el('path', { class: 'edge ' + c }, gEdges);
    if (e.conf === 'low') p.style.strokeWidth = c.startsWith('tx') ? '1' : '.7';
    const hit = el('path', { class: 'ehit' }, gHits);
    hit.addEventListener('pointerenter', ev => { p.classList.add('hot'); etip(e, ev); });
    hit.addEventListener('pointerleave', () => { p.classList.remove('hot'); $('#tip').style.display = 'none'; });
    hit.addEventListener('click', ev => { ev.stopPropagation(); edgePanel(e); });
    edgeEls.push({ e, p, c, hit });
  }
  nodeEls.clear();
  for (const n of drawn) {
    const l = laneById.get(n.stream);
    const g = el('g', { class: 'node', tabindex: 0, role: 'button', 'aria-label': n.label }, gNodes);
    const span = el('line', { class: 'span', stroke: lc(l), 'stroke-width': 1, opacity: ['school', 'lineage'].includes(n.kind) ? .1 : .22 }, gNodes);
    gNodes.insertBefore(span, g);
    let ghost = null;
    if (repAlt(n) != null && Math.abs(repAlt(n) - rep(n)) > 15) ghost = el('g', { class: 'ghostg' }, gNodes);
    glyph(n, g, n.kind === 'scholar' ? SCH : lc(l));
    if (ghost) { el('circle', { r: 3, fill: 'none', stroke: lc(l), 'stroke-dasharray': '1.5 2', opacity: .6 }, ghost); el('path', { class: 'ghost', stroke: lc(l), opacity: .4 }, ghost); }
    const lab = el('text', { class: 'nlab' + (n.kind === 'scholar' ? ' sch' : '') + ((degree.get(n.id) || 0) >= 9 || talks(n) >= 10 ? ' big' : ''), dy: 3.5 }, gLabels);
    lab.textContent = shortLabel(n);
    lab.addEventListener('click', ev => { ev.stopPropagation(); select(n.id); });
    lab.addEventListener('pointerenter', ev => { tip(n, ev); hover(n.id); });
    lab.addEventListener('pointerleave', () => { $('#tip').style.display = 'none'; hover(null); });
    g.addEventListener('click', ev => { ev.stopPropagation(); select(n.id); });
    g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(n.id); } });
    const enter = ev => { tip(n, ev); hover(n.id); }, leave = () => { $('#tip').style.display = 'none'; hover(null); };
    g.addEventListener('pointerenter', enter); g.addEventListener('pointerleave', leave);
    g.addEventListener('focus', enter); g.addEventListener('blur', leave);
    nodeEls.set(n.id, { g, span, lab, ghost, n });
  }
  const defs = el('defs', {}, svg);
  const lg = el('linearGradient', { id: 'fadeL', x1: 0, x2: 1 }, defs);
  el('stop', { offset: 0, 'stop-color': '#ffffff', 'stop-opacity': .96 }, lg); el('stop', { offset: .8, 'stop-color': '#ffffff', 'stop-opacity': .9 }, lg); el('stop', { offset: 1, 'stop-color': '#ffffff', 'stop-opacity': 0 }, lg);
  // lane label column sits above edges and nodes: fade first, then labels
  const gTop = el('g', {}, svg);
  gTop.appendChild(gBands.querySelector('rect[fill="url(#fadeL)"]'));
  [...gBands.querySelectorAll(':scope > text, :scope > g.lane')].forEach(t => gTop.appendChild(t));
  layout();
  applyHighlight();
}
function lifeLabel(n) { const t = n.time; if (!t) return ''; if (t.open && (n.kind === 'person' || n.kind === 'scholar')) return 'b. ' + t.label.replace(/–$/, ''); return t.label; }
function shortLabel(n) {
  let s = n.label.replace(/\s*\(.*?\)\s*/g, ' ').trim();
  if (s.length > 26) s = s.slice(0, 25) + '…';
  return s;
}

/* ---------- geometry update (on zoom / pan) ---------- */
function layout() {
  axis.setAttribute('width', W); axis.setAttribute('height', 34);
  axis.innerHTML = '';
  const ticks = logMode ? [-1500, -1000, -500, 0, 500, 1000, 1200, 1400, 1500, 1600, 1700, 1800, 1850, 1900, 1950, 2000] : [-1500, -1000, -500, 0, 500, 1000, 1500, 2000];
  let lastX = -1e9;
  for (const t of ticks) {
    const x = X(t); if (x < labW + 4 || x > W - 8) continue;
    if (x - lastX < 34) continue; lastX = x;
    el('line', { x1: x, x2: x, y1: 22, y2: 34, stroke: '#d9d3c1' }, axis);
    el('text', { x, y: 16, 'text-anchor': 'middle', class: 'tick' }, axis).textContent = t < 0 ? `${-t} BCE` : (t === 0 ? '1 CE' : t);
    // faint era rule through the lanes
  }
  [...svg.querySelectorAll('.era')].forEach(e => e.remove());
  lastX = -1e9;
  for (const t of ticks) { const x = X(t); if (x < labW + 4 || x > W - 8 || x - lastX < 34) continue; lastX = x; gBands.insertBefore(el('line', { class: 'era', x1: x, x2: x, y1: 0, y2: totalH, stroke: 'rgba(34,36,44,.05)' }), gBands.firstChild); }
  const nowX = X(NOW);
  for (const l of lanes) {
    const ly = laneY.get(l.id); if (!ly || !l._chan) continue;
    const s = l.span.start != null ? Math.max(MINY, l.span.start) : MINY, e = l.span.end != null ? l.span.end : NOW;
    l._chan.setAttribute('x1', Math.max(labW, X(s))); l._chan.setAttribute('x2', Math.min(W, X(e)));
    if (l._sch) { l._sch.setAttribute('x1', labW); l._sch.setAttribute('x2', W); }
  }
  for (const { g, span, lab, ghost, n } of nodeEls.values()) {
    const p = pos.get(n.id), x = X(yearOf(n));
    p.x = x;
    g.setAttribute('transform', `translate(${x},${p.y})`);
    const t = n.time;
    if (t && t.start != null && n.kind !== 'deity') {
      const e = t.end != null ? t.end : NOW;
      span.setAttribute('x1', X(t.start)); span.setAttribute('x2', X(Math.max(t.start, e))); span.setAttribute('y1', p.y); span.setAttribute('y2', p.y);
      span.setAttribute('stroke-dasharray', t.precision === 'century' || t.confidence === 'low' ? '2 3' : '');
    }
    if (ghost) {
      const ax = X(repAlt(n));
      ghost.firstChild.setAttribute('cx', ax); ghost.firstChild.setAttribute('cy', p.y);
      ghost.lastChild.setAttribute('d', `M${ax} ${p.y}Q${(ax + x) / 2} ${p.y - 9} ${x} ${p.y}`);
    }
    const off = x < labW + 2 || x > W + 2;
    g.style.display = off ? 'none' : '';
  }
  for (const { e, p, c } of edgeEls) {
    const a = pos.get(e.from), b = pos.get(e.to);
    let d;
    if (c.startsWith('inf') && !c.includes('same') || c === 'par' || (c.startsWith('tx') && a.lane !== b.lane)) {
      const mx = (a.x + b.x) / 2, dy = Math.abs(a.y - b.y), bow = Math.min(120, 18 + dy * .25 + Math.abs(a.x - b.x) * .12);
      d = `M${a.x} ${a.y}Q${mx + (a.y < b.y ? bow : -bow) * .35} ${(a.y + b.y) / 2 - bow * .3} ${b.x} ${b.y}`;
    } else {
      const dx = (b.x - a.x) * .5;
      d = `M${a.x} ${a.y}C${a.x + dx} ${a.y} ${b.x - dx} ${b.y} ${b.x} ${b.y}`;
    }
    p.setAttribute('d', d);
  }
  syncHits();
  placeLabels();
  if (concept) drawThread();
}
function syncHits() { // only visible, meaningful edges take the pointer
  const any = !!(hov || sel || concept || query || edgeFocus);
  for (const o of edgeEls) {
    const lit = o.p.classList.contains('hl');
    const show = (!o.c.startsWith('par') || lit) && (!any || lit) && nodeEls.get(o.e.from)?.g.style.display !== 'none' && nodeEls.get(o.e.to)?.g.style.display !== 'none';
    o.hit.setAttribute('d', show ? o.p.getAttribute('d') : '');
  }
}
function zoomK() { return (tf(MAXY) - tf(MINY)) / (view[1] - view[0]); }
function placeLabels() {
  const k = zoomK();
  const lit = hlSet();
  const byRow = new Map();
  const items = [...nodeEls.values()].map(o => o);
  // priority: selected/highlight > talks > degree
  items.sort((a, b) => score(b.n, lit) - score(a.n, lit));
  const occupied = new Map();
  for (const o of items) {
    const p = pos.get(o.n.id); const n = o.n;
    const show = o.g.style.display !== 'none' && ((lit.has(n.id) && (lit.size < 60 || (degree.get(n.id) || 0) >= 3)) || k > 2.6 || (degree.get(n.id) || 0) >= (W < 700 ? 9 : 5) || talks(n) >= 6 || (n.kind === 'scholar' && k > 1.6));
    if (!show) { o.lab.style.display = 'none'; continue; }
    const w = textW(o.lab.textContent, n.kind === 'scholar', o.lab.classList.contains('big')) + 6;
    const key = Math.round(p.y);
    const rowOcc = occupied.get(key) || [];
    const free = (s0, e0) => !rowOcc.some(([s, e]) => !(e0 < s || s0 > e));
    const R = [p.x - 5, p.x + 8 + w], Lf = [p.x - 8 - w, p.x + 5];
    let side = null;
    if (R[1] <= W && free(...R)) side = 'R';
    else if (Lf[0] >= labW && free(...Lf) && (lit.has(n.id) || k > 2.6)) side = 'L';
    else if (n.id === sel) side = R[1] <= W ? 'R' : 'L';
    if (!side) { o.lab.style.display = 'none'; continue; }
    if (side === 'L') { o.lab.setAttribute('x', p.x - 8); o.lab.setAttribute('text-anchor', 'end'); rowOcc.push(Lf); }
    else { o.lab.setAttribute('x', p.x + 8); o.lab.setAttribute('text-anchor', 'start'); rowOcc.push(R); }
    o.lab.setAttribute('y', p.y);
    occupied.set(key, rowOcc);
    o.lab.style.display = '';
    o.lab.classList.toggle('hl', lit.has(n.id));
  }
}
const _cv = document.createElement('canvas').getContext('2d');
const _mw = new Map();
function textW(txt, sch, big) { const k = txt + sch + big; if (_mw.has(k)) return _mw.get(k); _cv.font = `${sch ? 'italic ' : ''}500 ${sch ? 10 : big ? 11.5 : 10.5}px ${getComputedStyle(document.body).fontFamily}`; const w = _cv.measureText(txt).width; _mw.set(k, w); return w; }
function score(n, lit) { return (n.id === sel ? 5000 : 0) + (lit.has(n.id) ? 1000 : 0) + (sel && lit.has(n.id) && (n.kind === 'person' || n.kind === 'scholar') ? 300 : 0) + talks(n) * 2 + (degree.get(n.id) || 0); }

/* ---------- highlight / selection ---------- */
function neighbours(id) {
  const s = new Set([id]);
  for (const e of A.edges) { if (e.from === id) s.add(e.to); if (e.to === id) s.add(e.from); }
  return s;
}
function lineageChain(id) {
  // follow transmission edges up and down (teacher_of / initiated), collecting the line
  const s = new Set([id]); let grew = true;
  while (grew) { grew = false; for (const e of A.edges) if (TX.has(e.type)) { if (s.has(e.to) && !s.has(e.from) && pos.has(e.from)) { s.add(e.from); grew = true; } if (s.has(e.from) && !s.has(e.to) && pos.has(e.to)) { s.add(e.to); grew = true; } } }
  return s;
}
let hlCache = null;
function hlSet() {
  if (hlCache) return hlCache;
  let s = new Set();
  const focus = hov || sel;
  if (focus) { neighbours(focus).forEach(x => s.add(x)); lineageChain(focus).forEach(x => s.add(x)); }
  if (concept) threadNodes(concept).all.forEach(x => s.add(x));
  if (query) for (const n of A.nodes) if (match(n)) s.add(n.id);
  if (edgeFocus === 'talks') { for (const n of A.nodes) if (talks(n) > 0) s.add(n.id); }
  else if (edgeFocus) for (const o of edgeEls) if (o.c.split(' ').includes(edgeFocus)) { s.add(o.e.from); s.add(o.e.to); }
  return hlCache = s;
}
function match(n) { const q = query.toLowerCase(); return n.label.toLowerCase().includes(q) || (n.alt || []).some(a => a.toLowerCase().includes(q)) || n.id.includes(q); }
function applyHighlight() {
  hlCache = null;
  const lit = hlSet(), any = !!(hov || sel || concept || query || edgeFocus);
  svg.classList.toggle('dim', any);
  for (const { g, n } of nodeEls.values()) g.classList.toggle('hl', lit.has(n.id));
  const f = hov || sel, chain = f ? lineageChain(f) : null;
  for (const { e, p, c } of edgeEls) {
    const on = f ? (e.from === f || e.to === f || (TX.has(e.type) && chain.has(e.from) && chain.has(e.to))) : (edgeFocus && edgeFocus !== 'talks' ? c.split(' ').includes(edgeFocus) : false);
    p.classList.toggle('hl', !!on);
    p.classList.toggle('flow', !!on && !reduce && c.startsWith('tx'));
  }
  for (const { span, n } of nodeEls.values()) span.classList.toggle('hl', lit.has(n.id));
  syncHits();
  placeLabels();
  drawThread();
}
let hovT = null;
function hover(id) { // hover previews the lineage; leaving restores the selection view
  clearTimeout(hovT);
  hovT = setTimeout(() => { if (hov === id) return; hov = id; for (const o of nodeEls.values()) o.g.classList.toggle('hov', o.n.id === id); applyHighlight(); }, id ? 60 : 120);
}
function hops(id, n) { // transmission neighbourhood, n steps up and down
  let f = new Set([id]); const s = new Set([id]);
  for (let i = 0; i < n; i++) { const nx = new Set(); for (const e of A.edges) if (TX.has(e.type)) { if (f.has(e.to)) nx.add(e.from); if (f.has(e.from)) nx.add(e.to); } nx.forEach(x => s.add(x)); f = nx; }
  return s;
}
function focusRange(id) {
  const ids = hops(id, 2), y0 = yearOf(N.get(id));
  for (const e of A.edges) { const o = e.from === id ? e.to : e.to === id ? e.from : null; if (o && N.get(o).kind !== 'scholar') ids.add(o); }
  let ys = [...ids].filter(x => pos.has(x)).map(x => yearOf(N.get(x))).filter(y => y != null);
  if (!ys.length) return;
  const near = ys.filter(y => Math.abs(y - y0) <= 450); if (near.length >= 2) ys = near;
  let a = tf(Math.min(...ys)), b = tf(Math.max(...ys));
  const full = tf(MAXY) - tf(MINY), minSpan = full / 6, pad = (b - a) * .1 + full * .015;
  a -= pad; b += pad * 1.8;   // room for labels on the right
  if (b - a < minSpan) { const c = (a + b) / 2; a = c - minSpan / 2; b = c + minSpan / 2; }
  if (innerWidth > 700) { const pw = 440, usable = W - labW - 28 - pw; if (usable > 300) b = a + (b - a) * (W - labW - 28) / usable; }
  if (b - a < minSpan) { const c = (a + b) / 2; a = c - minSpan / 2; b = c + minSpan / 2; }
  view = [a, b]; clampView(); layout();
}
function select(id, fromPanel, noZoom) {
  sel = id; hov = null; const n = N.get(id);
  if (!noZoom) focusRange(id);
  applyHighlight();
  panel(n);
  const o = nodeEls.get(id);
  if (o) { ensureVisible(id); requestAnimationFrame(() => ping(pos.get(id))); }
  history.replaceState(null, '', '#atlas/' + id);
}
function ping(p) { // deitybody ringPing: an expanding ring that fades (0.9 s)
  if (!p || reduce) return;
  const r = el('circle', { cx: p.x, cy: p.y, r: 6, class: 'ring', 'stroke-width': 1.5 }, gFx);
  const t0 = performance.now();
  const step = t => { const k = Math.max(0, Math.min(1, (t - t0) / 900)); r.setAttribute('r', 6 + k * 22); r.setAttribute('opacity', .9 * (1 - k)); if (k < 1) requestAnimationFrame(step); else r.remove(); };
  requestAnimationFrame(step);
}
function ensureVisible(id) {
  const p = pos.get(id); if (!p) return;
  const st = $('#stage'); const top = p.y + 34, phone = innerWidth <= 700;
  const visH = phone && $('#panel').classList.contains('open') ? st.clientHeight * .36 : st.clientHeight - 80;
  if (top < st.scrollTop + 40 || top > st.scrollTop + visH) st.scrollTo({ top: Math.max(0, top - (phone ? visH * .45 : st.clientHeight / 3)), behavior: reduce ? 'auto' : 'smooth' });
  if (p.x < labW + 10 || p.x > W - 10) { const y = yearOf(N.get(id)), span = view[1] - view[0], c = tf(y); view = [c - span / 2, c + span / 2]; clampView(); layout(); }
}

/* ---------- concept thread mode ---------- */
const CONCEPTS = A.nodes.filter(n => n.kind === 'concept').map(c => ({ c, n: A.edges.filter(e => e.to === c.id && e.type === 'expounds').length })).filter(x => x.n >= 2).sort((a, b) => b.n - a.n);
function threadNodes(cid) {
  const direct = new Set(), par = new Set(), parConcepts = new Set();
  for (const e of A.edges) {
    if (e.to === cid && ['expounds', 'synthesis_of'].includes(e.type)) direct.add(e.from);
    if (e.type === 'parallels' && (e.from === cid || e.to === cid)) { const o = e.from === cid ? e.to : e.from; if (N.get(o).kind === 'concept') parConcepts.add(o); else par.add(o); }
  }
  for (const pc of parConcepts) for (const e of A.edges) if (e.to === pc && e.type === 'expounds' && !direct.has(e.from)) par.add(e.from);
  const all = new Set([...direct, ...par, cid, ...parConcepts]);
  return { direct, par, parConcepts, all };
}
function drawThread() {
  gThread.innerHTML = '';
  if (!concept) { $('#threadinfo').style.display = 'none'; return; }
  const t = threadNodes(concept);
  const line = (ids, cls) => {
    const pts = [...ids].filter(id => pos.has(id) && nodeEls.get(id).g.style.display !== 'none').map(id => pos.get(id)).sort((a, b) => a.x - b.x);
    if (pts.length < 2) return;
    let d = `M${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], mx = (a.x + b.x) / 2; d += `C${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`; }
    const th = el('path', { d, class: 'thread' + cls, tabindex: 0, role: 'button' }, gThread);
    const c0 = N.get(concept);
    th.addEventListener('click', ev => { ev.stopPropagation(); panel(c0); });
    th.addEventListener('pointerenter', ev => { const t = $('#tip'); t.innerHTML = `<b>${esc(c0.label)}</b><br><span>${cls ? 'parallel teachings in other traditions' : 'held by ' + pts.length + ' nodes in time order'} · click for the list</span>`; t.style.display = 'block'; t.style.left = Math.min(innerWidth - 290, ev.clientX + 12) + 'px'; t.style.top = (ev.clientY + 12) + 'px'; });
    th.addEventListener('pointerleave', () => { $('#tip').style.display = 'none'; });
  };
  line(t.direct, ''); line(t.par, ' par');
  const c = N.get(concept);
  const streamsHit = new Set([...t.direct, ...t.par].map(id => N.get(id).stream).filter(Boolean));
  $('#threadinfo').onclick = () => panel(c);
  $('#threadinfo').innerHTML = `${esc(c.label)} · ${t.direct.size} holders across ${streamsHit.size} streams${t.par.size ? ` · ${t.par.size} parallels` : ''}`;
  $('#threadinfo').style.display = 'block';
}

/* ---------- panel ---------- */
const TYPE_LABEL = {
  teacher_of: ['Teachers', 'Students'], initiated: ['Initiated by', 'Initiated'], influenced: ['Influenced by', 'Influenced'],
  commented_on: ['Commentaries on it', 'Comments on'], translated: ['Translated by', 'Translated'], founded: ['Founded / authored by', 'Founded / authored'],
  schism_from: ['Split off from it', 'Split from'], synthesis_of: ['Synthesised by', 'Synthesis of'], opposed: ['Critiqued by', 'Critiques'],
  located_at: ['Here', 'At'], expounds: ['Held by', 'Teaches'], parallels: ['Parallels', 'Parallels'], part_of: ['Includes', 'Part of'],
  studied: ['Studied by scholars', 'Studied'], critical_edition_of: ['Critical editions by', 'Edited'], commentary_on: ['Studies by', 'Studies'],
  doctoral_advisor_of: ['Doctoral advisor', 'Doctoral students'], academic_teacher_of: ['Academic teachers', 'Academic students'],
};
const KIND_LABEL = { person: 'Teacher · figure', scholar: 'Scholar', text: 'Text', school: 'School · tradition', lineage: 'Lineage', concept: 'Concept', practice: 'Practice', place: 'Place', deity: 'Figure of devotion', event: 'Event' };
function panel(n) {
  const out = [];
  const lane = laneById.get(n.stream);
  out.push(`<div class="k">${lane ? symSvg(lane, 14) : ''}${esc(KIND_LABEL[n.kind] || n.kind)}${lane ? ' · ' + esc(lane.label.split(' (')[0]) : ''}</div>`);
  out.push(`<h2>${esc(n.label)}</h2>`);
  if (n.time) out.push(`<div class="when">${esc(lifeLabel(n))}${n.time.confidence !== 'high' ? ` <span class="alt">· ${n.time.confidence} confidence</span>` : ''}</div>`);
  for (const t of n.time_alt || []) out.push(`<div class="alt">Also dated ${esc(t.label)}</div>`);
  if (n.note) out.push(`<div class="alt">${esc(n.note)}</div>`);
  const st = [];
  if (n.talks) {
    if (n.talks.by) st.push(`<span class="stat"><b>${n.talks.by}</b>talks by</span>`);
    if (n.talks.about) st.push(`<span class="stat"><b>${n.talks.about}</b>talks about</span>`);
    if (n.talks.tagged) st.push(`<span class="stat"><b>${n.talks.tagged}</b>talks on ${esc(n.talks.topics.join(', '))}</span>`);
  }
  const deg = degree.get(n.id) || 0; st.push(`<span class="stat"><b>${deg}</b>links</span>`);
  out.push(`<div class="stats">${st.join('')}</div>`);
  const links = [];
  if (n.legacy && n.legacy.table === 'people') links.push(`<a href="https://tantrafiles.xyz/#teacher/${encodeURIComponent(n.id)}" target="_blank" rel="noopener">Open on Wiser</a>`);
  if (n.legacy && n.legacy.table === 'traditions') links.push(`<a href="https://tantrafiles.xyz/#tradition/${encodeURIComponent(n.id)}" target="_blank" rel="noopener">Open on Wiser</a>`);
  if (n.ids && n.ids.wikidata) links.push(`<a href="https://www.wikidata.org/wiki/${n.ids.wikidata}" target="_blank" rel="noopener">Wikidata</a>`);
  if (n.ids && n.ids.enwiki) links.push(`<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(n.ids.enwiki.replace(/ /g, '_'))}" target="_blank" rel="noopener">Wikipedia</a>`);
  if (n.kind === 'concept') links.push(`<a class="n" href="#" data-thread="${n.id}">${concept === n.id ? 'Thread shown' : 'Show this thread'}</a>`);
  if (lane) links.push(`<a class="n" href="#" data-lane="${lane.id}">${esc(lane.label.split(' (')[0])}</a>`);
  if (links.length) out.push(`<div class="links">${links.join('')}</div>`);
  // grouped relations
  const groupsOut = new Map();
  for (const e of A.edges) {
    let dir = null; if (e.from === n.id) dir = 1; else if (e.to === n.id) dir = 0; else continue;
    const other = N.get(dir ? e.to : e.from);
    const head = (TYPE_LABEL[e.type] || [e.type, e.type])[dir];
    if (!groupsOut.has(head)) groupsOut.set(head, []);
    groupsOut.get(head).push({ e, other });
  }
  const order = ['Teachers', 'Initiated by', 'Students', 'Initiated', 'Influenced by', 'Influenced', 'Founded / authored by', 'Founded / authored', 'Teaches', 'Held by', 'Comments on', 'Commentaries on it', 'Translated', 'Translated by', 'Synthesis of', 'Critiques', 'Critiqued by', 'Parallels', 'Part of', 'Includes', 'At', 'Here', 'Split from', 'Split off from it', 'Studied by scholars', 'Critical editions by', 'Studies by', 'Studied', 'Edited', 'Studies', 'Academic teachers', 'Doctoral advisor', 'Academic students', 'Doctoral students'];
  const heads = [...groupsOut.keys()].sort((a, b) => (order.indexOf(a) + 99) % 999 - (order.indexOf(b) + 99) % 999);
  for (const h of heads) {
    const items = groupsOut.get(h).sort((a, b) => (yearOf(a.other) ?? 9999) - (yearOf(b.other) ?? 9999));
    out.push(`<h3>${esc(h)}</h3><ul>`);
    for (const { e, other } of items) {
      const tags = [];
      if (e.basis === 'traditional') tags.push('<span class="c trad">traditional</span>');
      if (e.conf !== 'high') tags.push(`<span class="c ${e.conf === 'low' ? 'low' : ''}">${e.conf}</span>`);
      const pv = e.provenance[e.provenance.length - 1];
      const src = pv.url ? `<a href="${esc(pv.url)}" target="_blank" rel="noopener">${esc(pv.cite.replace(/^Wikipedia, /, 'Wikipedia '))}</a>` : esc(pv.cite);
      out.push(`<li><a class="n" href="#" data-id="${esc(other.id)}">${esc(other.label)}</a>${tags.join('')}${other.time ? ` <span class="m">${esc(lifeLabel(other))}</span>` : ''}${e.lineage ? ` <span class="m">· ${esc(e.lineage)}</span>` : ''}
        ${e.note ? `<div class="m">${esc(e.note)}</div>` : ''}${e.contested ? `<div class="contest">Contested: ${esc(e.contested.note)}</div>` : ''}
        <div class="src">${pv.check === 'unverified' || pv.check === 'needs_source' ? 'to check · ' : ''}${src}</div></li>`);
    }
    out.push('</ul>');
  }
  if (n.works && n.works.length) {
    out.push('<h3>Works</h3><ul>');
    for (const w of n.works.slice().sort((a, b) => a.year - b.year)) {
      const tr = (w.treats || []).map(t => `<a class="n" href="#" data-id="${esc(t)}">${esc(N.get(t).label)}</a>`).join(', ');
      out.push(`<li>${w.url ? `<a href="${esc(w.url)}" target="_blank" rel="noopener">${esc(w.title)}</a>` : esc(w.title)} <span class="m">${w.year} · ${esc(w.kind.replace('_', ' '))}${w.publisher ? ' · ' + esc(w.publisher) : ''}</span>${tr ? `<div class="m">on ${tr}</div>` : ''}</li>`);
    }
    out.push('</ul>');
  }
  if (n.kind === 'concept') {
    const t = threadNodes(n.id);
    if (t.par.size) { out.push('<h3>Parallels in other traditions</h3><ul>'); for (const id of t.par) out.push(`<li><a class="n" href="#" data-id="${id}">${esc(N.get(id).label)}</a></li>`); out.push('</ul>'); }
  }
  $('#pbody').innerHTML = out.join('');
  math($('#pbody'));
  $('#panel').classList.add('open');
  $('#panel').scrollTop = 0;
}
$('#pbody').addEventListener('click', ev => {
  const btn = ev.target.closest('button[data-solo],button[data-go]');
  if (btn && btn.dataset.solo) { const id = btn.dataset.solo; const solo = streamOn.size === 1 && streamOn.has(id); streamOn.clear(); (solo ? lanes.map(l => l.id) : [id]).forEach(x => streamOn.add(x)); bar(); build(); lanePanel(laneById.get(id)); return; }
  if (btn && btn.dataset.go) { goTo(btn.dataset.go); return; }
  const a = ev.target.closest('a.n'); if (!a) return;
  if (a.dataset.lane) { ev.preventDefault(); lanePanel(laneById.get(a.dataset.lane)); return; }
  ev.preventDefault();
  if (a.dataset.thread) { setConcept(a.dataset.thread); return; }
  const id = a.dataset.id; if (!N.has(id)) return;
  if (N.get(id).kind === 'concept') { setConcept(id); panel(N.get(id)); return; }
  goTo(id);
});
$('#close').onclick = () => { $('#panel').classList.remove('open'); sel = null; applyHighlight(); history.replaceState(null, '', '#atlas'); };
svg.addEventListener('click', () => { if (dragMoved) return; if (sel) { $('#close').onclick(); } });

function soloGroup(gid) {
  const ls = lanes.filter(l => l.group === gid);
  const solo = streamOn.size === ls.length && ls.every(l => streamOn.has(l.id));
  streamOn.clear(); (solo ? lanes : ls).forEach(l => streamOn.add(l.id)); bar(); build();
}
function symSvg(l, px) { const sv = document.createElementNS(NS, 'svg'); sv.setAttribute('width', px); sv.setAttribute('height', px); sv.setAttribute('viewBox', '-8 -8 16 16'); sym(l.symbol, sv, lc(l), 6.5); return sv.outerHTML; }
function lanePanel(l) {
  const ns = A.nodes.filter(n => n.stream === l.id);
  const top = ns.slice().sort((a, b) => (degree.get(b.id) || 0) - (degree.get(a.id) || 0)).slice(0, 12);
  const links = A.streams.links.filter(x => x.from === l.id || x.to === l.id).sort((a, b) => b.edges - a.edges).slice(0, 8);
  const solo = streamOn.size === 1 && streamOn.has(l.id);
  const nl = A.edges.filter(e => N.get(e.from).stream === l.id || N.get(e.to).stream === l.id).length;
  $('#pbody').innerHTML = `<div class="k">${symSvg(l, 14)}Stream</div><h2>${esc(l.label)}</h2><div class="when">${esc(l.span.label)}</div>
    <div class="stats"><span class="stat"><b>${ns.length}</b>nodes</span><span class="stat"><b>${nl}</b>links</span></div>
    <div class="links"><button data-solo="${l.id}">${solo ? 'Show all streams' : 'Show only this stream'}</button></div>
    <h3>Key nodes</h3><ul>${top.map(n => `<li><a class="n" href="#" data-id="${esc(n.id)}">${esc(n.label)}</a> <span class="m">${esc(KIND_LABEL[n.kind])}${n.time ? ' · ' + esc(lifeLabel(n)) : ''}</span></li>`).join('')}</ul>
    ${links.length ? `<h3>Linked streams</h3><ul>${links.map(x => { const o = laneById.get(x.from === l.id ? x.to : x.from); return `<li><a class="n" href="#" data-lane="${o.id}">${esc(o.label.split(' (')[0])}</a> <span class="m">${x.edges} links ${x.from === l.id ? 'out' : 'in'}</span></li>`; }).join('')}</ul>` : ''}`;
  $('#panel').classList.add('open'); $('#panel').scrollTop = 0;
}
const CHECK = { work: "the scholar's own work", cited: 'cited by the curator', mentioned: 'the article names both ends (machine check)', unverified: 'relevant article; link not yet checked', needs_source: 'curator assertion; needs a source', reviewed: 'reviewed' };
function edgePanel(e) {
  const a = N.get(e.from), b = N.get(e.to);
  const pv = e.provenance.map(p => `<li>${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.cite)}</a>` : esc(p.cite)} <span class="m">· ${esc(CHECK[p.check] || p.check)}</span></li>`).join('');
  $('#pbody').innerHTML = `<div class="k">Link · ${esc(e.type.replace(/_/g, ' '))}</div>
    <h2>${esc(a.label)} → ${esc(b.label)}</h2>
    ${e.time ? `<div class="when">${esc(e.time.label)}${e.time.derived ? ` <span class="alt">· ${esc(e.time.derived)}</span>` : ''}</div>` : ''}
    <div class="stats"><span class="stat"><b>${esc(e.conf)}</b>confidence</span><span class="stat"><b>${esc(e.basis)}</b>basis</span>${e.lineage ? `<span class="stat"><b>${esc(e.lineage)}</b>line</span>` : ''}</div>
    ${e.note ? `<p class="alt">${esc(e.note)}</p>` : ''}${e.contested ? `<p class="contest">Contested: ${esc(e.contested.note)}</p>` : ''}
    <div class="links"><button data-go="${esc(a.id)}">Open ${esc(shortLabel(a))}</button><button data-go="${esc(b.id)}">Open ${esc(shortLabel(b))}</button></div>
    <h3>Sources</h3><ul>${pv}</ul>`;
  $('#panel').classList.add('open'); $('#panel').scrollTop = 0;
}
function etip(e, ev) {
  const t = $('#tip'), a = N.get(e.from), b = N.get(e.to);
  t.innerHTML = `<b>${esc(a.label)}</b> <span>${esc(e.type.replace(/_/g, ' '))}</span> <b>${esc(b.label)}</b><br><span>${esc(e.conf)} confidence${e.basis === 'traditional' ? ' · traditional' : ''}${e.lineage ? ' · ' + esc(e.lineage) : ''} · click for sources</span>`;
  t.style.display = 'block'; t.style.left = Math.min(innerWidth - 290, ev.clientX + 12) + 'px'; t.style.top = (ev.clientY + 12) + 'px';
}
function math(root) { // KaTeX only when a note carries $…$ (formulas in practice and syllabus notes)
  if (!/\$[^$]+\$/.test(root.textContent)) return;
  const go = () => window.renderMathInElement && renderMathInElement(root, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false });
  if (window.renderMathInElement) return go();
  if (document.getElementById('katexcss')) return;
  const l = document.createElement('link'); l.id = 'katexcss'; l.rel = 'stylesheet'; l.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css'; document.head.appendChild(l);
  const s1 = document.createElement('script'); s1.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js';
  s1.onload = () => { const s2 = document.createElement('script'); s2.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js'; s2.onload = go; document.head.appendChild(s2); };
  document.head.appendChild(s1);
}
function tip(n, ev) {
  const t = $('#tip');
  t.innerHTML = `<b>${esc(n.label)}</b><br><span>${esc(KIND_LABEL[n.kind])}${n.time ? ' · ' + esc(lifeLabel(n)) : ''}</span>`;
  t.style.display = 'block';
  const r = ev.target.getBoundingClientRect();
  t.style.left = Math.min(innerWidth - 270, r.right + 8) + 'px'; t.style.top = (r.top - 6) + 'px';
}

/* ---------- filters bar ---------- */
function bar() {
  const b = $('#bar'); b.innerHTML = '';
  const all = document.createElement('button'); all.className = 'chip on'; all.textContent = 'All streams';
  all.onclick = () => { if (streamOn.size === lanes.length) { streamOn.clear(); } else lanes.forEach(l => streamOn.add(l.id)); bar(); build(); };
  b.appendChild(all);
  for (const g of groups) {
    const ls = lanes.filter(l => l.group === g.id); if (!ls.length) continue;
    const on = ls.every(l => streamOn.has(l.id)), some = ls.some(l => streamOn.has(l.id));
    const c = document.createElement('button'); c.className = 'chip ' + (on ? 'on' : some ? '' : 'off');
    c.innerHTML = `${symSvg(ls[0], 13)}${esc(g.label)}`; c.title = ls.map(l => l.label.split(' (')[0]).join(' · ');
    c.onclick = () => { if (on) ls.forEach(l => streamOn.delete(l.id)); else ls.forEach(l => streamOn.add(l.id)); if (!streamOn.size) lanes.forEach(l => streamOn.add(l.id)); bar(); build(); };
    b.appendChild(c);
  }
  const sep = document.createElement('span'); sep.style.cssText = 'flex:none;width:1px;background:#242c3d;margin:0 .2rem'; b.appendChild(sep);
  for (const { c, n } of CONCEPTS.slice(0, 14)) {
    const ch = document.createElement('button'); ch.className = 'chip concept' + (concept === c.id ? ' on' : '');
    ch.innerHTML = `<svg width="10" height="10" viewBox="-5 -5 10 10"><circle r="4" fill="none" stroke="#a86f14"/><circle r="1.3" fill="#a86f14"/></svg>${esc(c.label.split(' (')[0])}`;
    ch.title = `${n} holders`;
    ch.onclick = () => { setConcept(concept === c.id ? null : c.id); if (concept && innerWidth > 700) panel(N.get(concept)); };
    b.appendChild(ch);
  }
}
function setConcept(id) { concept = id; if (id) { view = [tf(MINY), tf(MAXY)]; layout(); } bar(); applyHighlight(); }

/* ---------- zoom / pan ---------- */
function clampView() {
  const lo = tf(MINY), span = Math.min(tf(MAXY) - lo, Math.max((tf(MAXY) - lo) / 40, view[1] - view[0]));
  const hi = tf(MAXY) + (sel && innerWidth > 700 ? span * 0.42 : 0);  // leave room for the open panel
  let a = view[0], b = a + span;
  if (a < lo) { a = lo; b = a + span; } if (b > hi) { b = hi; a = b - span; }
  view = [a, b];
}
function zoomAt(px, f) {
  const u = view[0] + (px - labW - 14) / (W - labW - 28) * (view[1] - view[0]);
  view = [u - (u - view[0]) / f, u + (view[1] - u) / f]; clampView(); layout();
}
$('#zin').onclick = () => zoomAt((W + labW) / 2, 1.6);
$('#zout').onclick = () => zoomAt((W + labW) / 2, 1 / 1.6);
$('#zfit').onclick = () => { view = [tf(MINY), tf(MAXY)]; layout(); };
svg.addEventListener('wheel', ev => {
  if (ev.ctrlKey || ev.metaKey) { ev.preventDefault(); zoomAt(ev.offsetX, Math.exp(-ev.deltaY * 0.01)); }
  else if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) { ev.preventDefault(); const d = ev.deltaX / (W - labW) * (view[1] - view[0]); view = [view[0] + d, view[1] + d]; clampView(); layout(); }
}, { passive: false });
let drag = null, dragMoved = false; const pts = new Map();
svg.addEventListener('pointerdown', ev => { pts.set(ev.pointerId, ev.clientX); if (pts.size === 1) { drag = { x: ev.clientX, y: ev.clientY, v: view.slice(), axis: null }; dragMoved = false; } if (pts.size === 2) { const xs = [...pts.values()]; drag = { pinch: Math.abs(xs[0] - xs[1]), v: view.slice(), cx: (xs[0] + xs[1]) / 2 }; } });
svg.addEventListener('pointermove', ev => {
  if (!drag) return; pts.set(ev.pointerId, ev.clientX);
  if (drag.pinch != null && pts.size === 2) { const xs = [...pts.values()], d = Math.abs(xs[0] - xs[1]); view = drag.v.slice(); zoomAt(drag.cx, d / Math.max(20, drag.pinch)); dragMoved = true; return; }
  const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
  if (!drag.axis && Math.hypot(dx, dy) > 6) { drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; if (drag.axis === 'x') { svg.setPointerCapture(ev.pointerId); svg.classList.add('drag'); } }
  if (drag.axis === 'x') { dragMoved = true; const d = -dx / (W - labW) * (drag.v[1] - drag.v[0]); view = [drag.v[0] + d, drag.v[1] + d]; clampView(); layout(); }
});
svg.addEventListener('pointerleave', () => { if (hov) hover(null); });
const end = ev => { pts.delete(ev.pointerId); if (!pts.size) { drag = null; svg.classList.remove('drag'); setTimeout(() => dragMoved = false, 0); } };
svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);

/* ---------- header controls ---------- */
$('#scaleBtn').onclick = () => { logMode = !logMode; $('#scaleBtn').textContent = logMode ? 'Log time' : 'Linear time'; $('#scaleBtn').classList.toggle('on', !logMode); view = [tf(MINY), tf(MAXY)]; build(); };
$('#schBtn').onclick = () => { showScholars = !showScholars; showScholars ? kindOff.delete('scholar') : kindOff.add('scholar'); $('#schBtn').classList.toggle('on', showScholars); const lb = document.querySelector('#legend button[data-kind="scholar"]'); if (lb) lb.classList.toggle('off', !showScholars); build(); };
$('#keyBtn').onclick = () => { const l = $('#legend'); const narrow = innerWidth <= 700; if (narrow) l.classList.toggle('show'); else l.classList.toggle('hide'); $('#keyBtn').classList.toggle('on'); };
let qt; $('#q').addEventListener('input', ev => { clearTimeout(qt); qt = setTimeout(() => { query = ev.target.value.trim(); applyHighlight(); const hit = query && A.nodes.find(n => match(n) && pos.has(n.id)); if (hit) ensureVisible(hit.id); }, 160); });
function goTo(id) { // open any node: bring its stream and kind back into view first
  const n = N.get(id); if (!n) return;
  if (!pos.has(id) && isDrawn(n)) { if (n.stream) streamOn.add(n.stream); kindOff.delete(n.kind); if (n.kind === 'scholar') { showScholars = true; $('#schBtn').classList.add('on'); } bar(); build(); }
  if (pos.has(id)) select(id, true); else panel(n);
}
$('#q').addEventListener('keydown', ev => { if (ev.key === 'Enter') { const q = query.toLowerCase(); const hits = A.nodes.filter(match); const hit = hits.find(n => n.label.toLowerCase().startsWith(q)) || hits.find(n => pos.has(n.id)) || hits[0]; if (hit) goTo(hit.id); } });

/* ---------- legend ---------- */
(function legend() {
  const kinds = ['person', 'scholar', 'text', 'school', 'lineage', 'practice', 'event', 'deity'];
  const L = $('#legend'); const parts = [];
  for (const k of kinds) {
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('width', 18); s.setAttribute('height', 16); s.setAttribute('viewBox', '-9 -8 18 16');
    const g = el('g', {}, s); glyph({ kind: k, id: '_' + k }, g, k === 'scholar' ? SCH : '#8a5a0c');
    parts.push(`<button data-kind="${k}" title="Show or hide: ${KIND_LABEL[k]}">${s.outerHTML}${KIND_LABEL[k]}</button>`);
  }
  const line = (cls, txt, st) => `<button data-edge="${cls}" title="Highlight: ${txt}"><svg width="22" height="10"><path d="M1 5H21" stroke="${st.c}" stroke-width="${st.w || 1.3}" ${st.d ? `stroke-dasharray="${st.d}"` : ''} opacity="${st.o || .9}"/></svg>${txt}</button>`;
  parts.push(line('tx', 'Transmission', { c: '#a86f14' }), line('trad', 'Traditional line', { c: '#a86f14', d: '3 3' }), line('inf', 'Influence', { c: '#1f7a6e', o: .8 }),
    line('txt', 'Text · founding', { c: '#b04a5a', o: .8 }), line('study', 'Scholar study', { c: SCH, d: '1 2.5', o: .9 }), line('par', 'Parallel', { c: '#6a5aa8', d: '5 4' }));
  parts.push(`<button data-talks="1" title="Highlight nodes with talks on Wiser"><svg width="18" height="16" viewBox="-9 -8 18 16"><circle r="6.6" fill="none" stroke="#a86f14"/><circle r="3.2" fill="#8a5a0c"/></svg>Has talks on Wiser</button>`);
  parts.push(`<div class="note">Kinds: click to show or hide. Lines: click to highlight. Solid span = life; dotted = century-level date.</div>`);
  L.innerHTML = parts.join('');
  L.addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.kind) { const k = b.dataset.kind; kindOff.has(k) ? kindOff.delete(k) : kindOff.add(k); b.classList.toggle('off', kindOff.has(k)); if (k === 'scholar') { showScholars = !kindOff.has(k); $('#schBtn').classList.toggle('on', showScholars); } build(); return; }
    const on = !b.classList.contains('on'); L.querySelectorAll('button[data-edge],button[data-talks]').forEach(x => x.classList.remove('on'));
    edgeFocus = on ? (b.dataset.edge || 'talks') : null; if (on) b.classList.add('on'); applyHighlight();
  });
})();

/* ---------- boot ---------- */
bar(); build();
addEventListener('resize', () => { clearTimeout(window._rz); window._rz = setTimeout(build, 150); });
const h = decodeURIComponent(location.hash.replace(/^#atlas\/?/, ''));
if (h.startsWith('thread=')) { setConcept(h.slice(7)); if (N.has(h.slice(7)) && innerWidth > 700) panel(N.get(h.slice(7))); }
else if (h && N.has(h)) select(h, true);
window.atlas = { select, setConcept, zoomAt, get view() { return view; }, set view(v) { view = v; clampView(); layout(); } };
})();
