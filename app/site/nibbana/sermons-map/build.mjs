// sermons-map/build.mjs — the 33-sermon series graph as an interactive SVG.
// Layered left-to-right: six arcs, 33 sermon nodes, dependency edges.
// Click a node for topic/key move/practice. No dependencies to install.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

const ARCS = [
  { id: "foundation", label: "Foundation", range: [1, 5], color: "#e8cf96", desc: "Theme, whirlpool, lives-vs-moment, satipatthana attention" },
  { id: "contact", label: "Attention to contact", range: [6, 11], color: "#d9982f", desc: "Samudaya contemplations, anidassana vinnana, comic acts, gem parable, contact-from-namarupa" },
  { id: "proliferation", label: "Proliferation dismantled", range: [12, 17], color: "#b9b3d6", desc: "Papanca, mula-pariyaya, mannana, Bahiya, arahant experience" },
  { id: "cessation", label: "Cessation clarified", range: [18, 22], color: "#7a5fc2", desc: "Misreadings cleared, two Nibbana-elements, here-and-now marvel, avyakata refused, ocean depth" },
  { id: "no-nihilism", label: "No-nihilism secured", range: [23, 27], color: "#d4899b", desc: "Rohitassa, Kalakarama attitude, tathata ground and similes" },
  { id: "path", label: "The path closed", range: [28, 33], color: "#c09a4a", desc: "Right view, aeon trappings, Mara's-army method, middle-path marks, 37 factors, eightfold convergence" },
];

const SERMONS = [
  [1, "Theme verse as meditation subject", "Nibbana = extinction, not a distant object", "signless-concentration-outline", "light"],
  [2, "Why nibbana's purpose is out of range", "Samsara = going round; Nibbana = going out", "concept-deconstruction-outline", "spiral"],
  [3, "Whirlpool worked out", "Beings circle between this-life and other-life", "concept-deconstruction-outline", "spiral"],
  [4, "Three lives vs one mind-moment", "Dependent arising reads both ways", "seeing-right-view-outline", "gear"],
  [5, "Satipatthana attention frame", "The practice frame for everything after", "four-establishments-outline", "light"],
  [6, "Samudaya contemplations", "Seeing the condition is seeing the contingency", "four-establishments-outline", "gear"],
  [7, "Kevaddha verse: anidassana vinnana", "Non-manifestative, endless, all-lustrous consciousness", "vbt-inner-outer-spaces", "glass"],
  [8, "Brahmanimantanika on anidassana", "Consciousness unestablished on any object", "signless-concentration-outline", "light"],
  [9, "Comic acts of samsaric beings", "The meditator sees the vanity of the performance", "seeing-right-view-outline", "spiral"],
  [10, "Gem parable: personality view", "Not knowing nama, the view has footing", "seeing-right-view-outline", "glass"],
  [11, "Contact from nama-rupa", "Naming + resistance meet at contact", "vbt-inner-outer-spaces", "gear"],
  [12, "Papanca vs nippapanca", "The deep dimension rediscovered", "concept-deconstruction-outline", "spiral"],
  [13, "Mula-pariyaya root pattern", "The full proliferation chain in one sutta", "concept-deconstruction-outline", "gear"],
  [14, "Methinkings: Mara's subtle bondage", "'I am' thoughts keep beings shackled", "seeing-right-view-outline", "metal"],
  [15, "Bahiya: in the seen only the seen", "No 'you' added to experience", "vbt-mind-between-objects", "light"],
  [16, "Arahant experience discourses", "Cessation with a gaze that knows no horizon", "signless-concentration-outline", "light"],
  [17, "Cessation-vision continued", "Misread discourses cohere as experience-reports", "signless-concentration-outline", "light"],
  [18, "Misreadings cleared", "Clearing the way for the two Nibbana-elements", "seeing-right-view-outline", "metal"],
  [19, "Two Nibbana-elements", "With and without fuel-remnant", "signless-concentration-outline", "fade"],
  [20, "Here-and-now marvel", "Cessation realised in this life", "signless-concentration-outline", "light"],
  [21, "Ten indeterminate points", "Why the Buddha refused them", "seeing-right-view-outline", "metal"],
  [22, "Ocean depth simile", "Deep, still, unruffled", "signless-concentration-outline", "water"],
  [23, "No-nihilism secured", "Cessation of becoming, no being to annihilate", "seeing-right-view-outline", "fade"],
  [24, "Rohitassa: world's end in this body", "No travelling; realise it here", "four-establishments-outline", "pivot"],
  [25, "Kalakarama attitude", "Experience without the experiencer added", "vbt-mind-between-objects", "glass"],
  [26, "Kalakarama deep analysis", "Tathata as ground", "signless-concentration-outline", "stone"],
  [27, "Suchness similes", "The invariant that neither comes nor goes", "signless-concentration-outline", "stone"],
  [28, "Right view = four truths", "Functional definition of samma-ditthi", "seeing-right-view-outline", "metal"],
  [29, "Aeon trappings impermanent", "Cosmic scenery changes; turn inward", "concept-deconstruction-outline", "fade"],
  [30, "Mara's-army method", "Gradual, systematic, not suppression", "four-establishments-outline", "metal"],
  [31, "Middle-path marks", "Subtle characteristics of the path", "four-establishments-outline", "gear"],
  [32, "37 factors of enlightenment", "The full toolkit converging", "four-establishments-outline", "gear"],
  [33, "Eightfold path convergence", "Ground, destination, goal — the loop closes", "signless-concentration-outline", "light"],
];

const W = 1500, H = 640;
const TOP = 110, LANES = 6, LANE_H = 78;
const LEFT = 90, RIGHT = W - 90;
const X = (n) => LEFT + ((n - 1) / 32) * (RIGHT - LEFT);
const arcOf = (n) => ARCS.findIndex((a) => n >= a.range[0] && n <= a.range[1]);
const Y = (n) => TOP + arcOf(n) * LANE_H + LANE_H / 2;

function build() {
  let s = "";
  // arc bands
  ARCS.forEach((a, i) => {
    const y = TOP + i * LANE_H;
    const x1 = X(a.range[0]) - 34, x2 = X(a.range[1]) + 34;
    s += `<rect x="${x1}" y="${y + 6}" width="${x2 - x1}" height="${LANE_H - 12}" rx="8" fill="${a.color}" opacity="0.07" stroke="${a.color}" stroke-opacity="0.25"/>`;
    s += `<text x="${x1 + 10}" y="${y + 24}" font-size="10" fill="${a.color}" font-family="monospace" opacity="0.9">${a.label}</text>`;
    s += `<text x="${x1 + 10}" y="${y + 38}" font-size="8" fill="#929aab" font-family="sans-serif" opacity="0.75">${a.desc.slice(0, 72)}</text>`;
  });
  // dependency edges (each sermon depends on previous)
  for (let n = 2; n <= 33; n++) {
    const sameArc = arcOf(n) === arcOf(n - 1);
    s += `<line x1="${X(n - 1) + 13}" y1="${Y(n - 1)}" x2="${X(n) - 13}" y2="${Y(n)}" stroke="#2a3040" stroke-width="${sameArc ? 2 : 1}" ${sameArc ? "" : 'stroke-dasharray="4,3"'}/>`;
  }
  // loop-close edge: 33 -> 1 (the series ends where it began)
  s += `<path d="M${X(33)},${Y(33) + 16} C${X(33) + 60},${Y(33) + 120} ${X(1) - 60},${Y(1) + 120} ${X(1)},${Y(1) + 16}" fill="none" stroke="#e8cf96" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.6"/>`;
  s += `<text x="${(X(1) + X(33)) / 2}" y="${Y(1) + 108}" text-anchor="middle" font-size="9" fill="#e8cf96" font-family="monospace" opacity="0.8">the loop closes: 33 ends where 1 began</text>`;
  // nodes
  SERMONS.forEach(([n, topic, move, practice, visual]) => {
    const cx = X(n), cy = Y(n);
    const arc = ARCS[arcOf(n)];
    s += `<g class="node" data-n="${n}" data-topic="${topic.replace(/"/g, "")}" data-move="${move.replace(/"/g, "")}" data-practice="${practice}" style="cursor:pointer">`;
    s += `<circle cx="${cx}" cy="${cy}" r="13" fill="#0f1320" stroke="${arc.color}" stroke-width="2" class="dot"/>`;
    s += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="9" fill="#efe9dd" font-family="monospace">${n}</text>`;
    s += `<title>S${n}: ${topic}</title></g>`;
  });

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>The 33 Sermons — series graph</title>
<style>body{margin:0;background:#0a0d14;display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:sans-serif}
svg{max-width:100%;height:auto}.node .dot{transition:all .2s}.node:hover .dot{fill:#1a1f2e;stroke-width:3}
#panel{position:fixed;right:18px;top:18px;width:320px;background:#0f1320;border:1px solid #242c3d;border-radius:8px;padding:14px;color:#efe9dd;font-size:12px;line-height:1.5}
#panel h3{margin:0 0 6px;font-size:13px;font-family:serif;color:#e8cf96}#panel .m{color:#929aab;font-size:11px}#panel .k{color:#e8cf96}</style></head>
<body><svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
<text x="${W / 2}" y="30" text-anchor="middle" font-size="17" fill="#efe9dd" font-family="serif">The 33 Sermons — Nibbāna: The Mind Stilled</text>
<text x="${W / 2}" y="50" text-anchor="middle" font-size="10" fill="#929aab" font-family="monospace">EACH SERMON BUILDS ON THE LAST · CLICK A NODE · THE LOOP CLOSES AT 33 → 1</text>
${s}</svg>
<div id="panel"><h3>Click a sermon node</h3><div class="m">Topic, key move, practice, visual form.</div></div>
<script>const D=${JSON.stringify(SERMONS.map(([n,topic,move,practice,visual])=>({n,topic,move,practice,visual})))};
document.querySelectorAll('.node').forEach(g=>{g.addEventListener('click',()=>{const d=D.find(x=>x.n==g.dataset.n);
document.getElementById('panel').innerHTML='<h3>Sermon '+d.n+'</h3><div><span class=k>Topic:</span> '+d.topic+'</div><div style="margin-top:6px"><span class=k>Key move:</span> '+d.move+'</div><div style="margin-top:6px"><span class=k>Practice:</span> <span class=m>'+d.practice+'</span></div><div><span class=k>Visual:</span> <span class=m>'+d.visual+'</span></div>';});});</script>
</body></html>`;
  writeFileSync(join(HERE, "index.html"), html);
  console.log("Built: sermons-map/index.html");
}
build();
