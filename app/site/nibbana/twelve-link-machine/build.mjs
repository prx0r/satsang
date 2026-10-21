// twelve-link-machine/build.mjs
// The Twelve-Link Machine: dependent arising as a Rube Goldberg gear chain.
// Each gear triggers the next. Remove a gear and the chain stops.
// Simplified proof of concept — full anatomy quality comes later.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

// The twelve links of dependent arising
const LINKS = [
  { id: "ignorance", name: "Ignorance", pali: "avijjā" },
  { id: "formations", name: "Formations", pali: "saṅkhāra" },
  { id: "consciousness", name: "Consciousness", pali: "viññāṇa" },
  { id: "name-form", name: "Name & Form", pali: "nāmarūpa" },
  { id: "six-senses", name: "Six Senses", pali: "saḷāyatana" },
  { id: "contact", name: "Contact", pali: "phassa" },
  { id: "feeling", name: "Feeling", pali: "vedanā" },
  { id: "craving", name: "Craving", pali: "taṇhā" },
  { id: "clinging", name: "Clinging", pali: "upādāna" },
  { id: "becoming", name: "Becoming", pali: "bhava" },
  { id: "birth", name: "Birth", pali: "jāti" },
  { id: "suffering", name: "Aging & Death", pali: "jarāmaraṇa" },
];

// Isometric projection
const AZ = 30 * Math.PI / 180;
const EL = 30 * Math.PI / 180;
function iso(x, y, z) {
  const sx = x * Math.cos(AZ) - y * Math.cos(AZ);
  const sy = x * Math.sin(AZ) + y * Math.sin(AZ) - z;
  return [sx, sy];
}

// Gear drawing
function gear(cx, cy, r, teeth, angle, removed) {
  const pts = [];
  const inner = r * 0.7;
  for (let i = 0; i < teeth; i++) {
    const a1 = angle + (i * 2 * Math.PI) / teeth;
    const a2 = a1 + Math.PI / teeth;
    const a3 = a1 + (2 * Math.PI) / teeth;
    pts.push([cx + r * Math.cos(a1), cy + r * Math.sin(a1)]);
    pts.push([cx + inner * Math.cos(a2), cy + inner * Math.sin(a2)]);
    pts.push([cx + r * Math.cos(a3), cy + r * Math.sin(a3)]);
  }
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join("") + "Z";
  // Hub
  const hub = `M${cx - r * 0.15},${cy} a${r * 0.15},${r * 0.15} 0 1,0 ${r * 0.3},0 a${r * 0.15},${r * 0.15} 0 1,0 ${-r * 0.3},0`;
  return { d, hub, removed };
}

// Generate the page
function build() {
  const W = 900, H = 500;
  const gearR = 28, teeth = 12;
  const spacing = 72;
  const startX = 60, cy = 220;

  // Base plate
  const plate = `<rect x="20" y="${cy + 45}" width="${W - 40}" height="18" rx="3" fill="#1a1f2e" stroke="#2a3040" stroke-width="1"/>`;

  // Gears
  const gearSvg = LINKS.map((link, i) => {
    const cx = startX + i * spacing;
    const g = gear(cx, cy, gearR, teeth, i * 0.13, false);
    return `
      <g class="gear-group" data-link="${link.id}" data-index="${i}" style="cursor:pointer">
        <title>${link.name} (${link.pali})</title>
        <circle cx="${cx}" cy="${cy + 40}" r="4" fill="#2a3040"/> <!-- mount -->
        <path d="${g.d}" fill="#0f1320" stroke="#e8cf96" stroke-width="1.5" class="gear-body"/>
        <circle cx="${cx}" cy="${cy}" r="${gearR * 0.15}" fill="none" stroke="#e8cf96" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy}" r="2" fill="#e8cf96"/>
        <text x="${cx}" y="${cy + gearR + 18}" text-anchor="middle" font-size="9" fill="#929aab" font-family="monospace">${i + 1}</text>
        <text x="${cx}" y="${cy - gearR - 10}" text-anchor="middle" font-size="8" fill="#929aab" font-family="sans-serif" opacity="0.7">${link.pali}</text>
      </g>`;
  }).join("");

  // Chain links (arrows between gears)
  const chain = LINKS.slice(0, -1).map((_, i) => {
    const x1 = startX + i * spacing + gearR + 2;
    const x2 = startX + (i + 1) * spacing - gearR - 2;
    return `<line x1="${x1}" y1="${cy}" x2="${x2}" y2="${cy}" stroke="#2a3040" stroke-width="1" stroke-dasharray="3,2" class="chain-link" data-after="${i}"/>`;
  }).join("");

  // Ball track (top)
  const track = `<path d="M${startX - 20},${cy - 60} L${startX + 11 * spacing + 20},${cy - 60}" stroke="#242c3d" stroke-width="2" fill="none"/>`;

  // Ball
  const ball = `<circle cx="${startX - 15}" cy="${cy - 60}" r="6" fill="#e8cf96" class="ball" opacity="0.8"/>`;

  // Catch cup
  const cup = `<path d="M${startX + 11 * spacing + 15},${cy - 65} L${startX + 11 * spacing + 15},${cy - 45} L${startX + 11 * spacing + 35},${cy - 45} L${startX + 11 * spacing + 35},${cy - 65}" fill="none" stroke="#d9982f" stroke-width="1.5"/>`;

  // Title
  const title = `
    <text x="${W / 2}" y="30" text-anchor="middle" font-size="16" fill="#efe9dd" font-family="serif">The Twelve-Link Machine</text>
    <text x="${W / 2}" y="48" text-anchor="middle" font-size="10" fill="#929aab" font-family="monospace">DEPENDENT ARISING · PAṬICCASAMUPPĀDA</text>
    <text x="${W / 2}" y="${H - 15}" text-anchor="middle" font-size="9" fill="#929aab" font-family="sans-serif" opacity="0.6">Click any gear to remove it. The machine stops. That is nibbāna.</text>`;

  // Readout
  const readout = `
    <rect x="${W - 200}" y="${H - 80}" width="180" height="55" rx="4" fill="#0f1320" stroke="#2a3040" stroke-width="1"/>
    <text x="${W - 190}" y="${H - 60}" font-size="9" fill="#929aab" font-family="monospace">LINKS ACTIVE: <tspan id="active-count" fill="#e8cf96">12</tspan></text>
    <text x="${W - 190}" y="${H - 45}" font-size="9" fill="#929aab" font-family="monospace">STATUS: <tspan id="machine-status" fill="#e8cf96">RUNNING</tspan></text>`;

  const html = `<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; background: #0a0d14; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  svg { max-width: 100%; height: auto; }
  .gear-group:hover .gear-body { fill: #1a1f2e; stroke: #e9b764; }
  .gear-group.removed .gear-body { fill: #0a0d14; stroke: #2a3040; stroke-dasharray: 2,2; }
  .gear-group.removed circle { fill: #2a3040 !important; }
  .gear-group.removed text { opacity: 0.3 !important; }
  .ball { transition: cx 0.5s ease; }
</style>
</head>
<body>
<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${plate}
  ${track}
  ${chain}
  ${gearSvg}
  ${ball}
  ${cup}
  ${title}
  ${readout}
</svg>
<script>
  const gears = document.querySelectorAll('.gear-group');
  const chains = document.querySelectorAll('.chain-link');
  const ball = document.querySelector('.ball');
  const activeEl = document.getElementById('active-count');
  const statusEl = document.getElementById('machine-status');
  let removed = new Set();

  gears.forEach(g => {
    g.addEventListener('click', () => {
      const idx = parseInt(g.dataset.index);
      const linkId = g.dataset.link;
      if (removed.has(idx)) {
        // Restore
        removed.delete(idx);
        g.classList.remove('removed');
        chains[idx - 1]?.style.setProperty('opacity', '1');
        chains[idx]?.style.setProperty('opacity', '1');
      } else {
        // Remove
        removed.add(idx);
        g.classList.add('removed');
        // Hide all chains after this point
        for (let i = idx - 1; i < chains.length; i++) {
          chains[i]?.style.setProperty('opacity', '0.15');
        }
      }
      updateState();
    });
  });

  function updateState() {
    const active = 12 - removed.size;
    activeEl.textContent = active;
    if (active === 12) {
      statusEl.textContent = 'RUNNING';
      statusEl.setAttribute('fill', '#e8cf96');
      ball.setAttribute('opacity', '0.8');
    } else if (active === 0) {
      statusEl.textContent = 'STILL';
      statusEl.setAttribute('fill', '#efe9dd');
      ball.setAttribute('opacity', '0.15');
    } else {
      const firstRemoved = Math.min(...removed);
      statusEl.textContent = 'STOPPED AT ' + firstRemoved;
      statusEl.setAttribute('fill', '#d9982f');
      ball.setAttribute('opacity', '0.3');
    }
  }
</script>
</body>
</html>`;

  writeFileSync(join(HERE, "index.html"), html);
  console.log("Built: twelve-link-machine/index.html");
}

build();
