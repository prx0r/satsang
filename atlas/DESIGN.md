# Wiser Atlas: design (2026-10-20)

How the Atlas view borrows from **prx0r/deitybody** and how it fits the white Wiser redesign
(`work/wiser/DESIGN-SYSTEM.md`, being written by the wiser-redesign agent; where the two disagree, DESIGN-SYSTEM wins on
tokens and type, and this file wins on graph grammar).

## 1. What deitybody actually looks like (studied 2026-10-20, `git clone --depth 1 github.com/prx0r/deitybody`)

Source: `site/lab.html` (CSS), `site/lab.js` (three.js scene, ~79 KB), `site/engine/operators.json`,
`site/engine/primitive-registry.json`, `site/frameworks/registry.json`, `docs/CATALOG.md`, `northstar.md`.

| Aspect | What deitybody does | Where |
|---|---|---|
| Ground | **White** (`renderer.setClearColor(0xffffff)`, `--bg:#ffffff`). "No dust, no backdrop. Space is the aesthetic." Only a faint grid. | lab.js l.183, l.212 |
| Ink and accents | `--ink #22242c`, `--mut #6d7180`, `--gold #a86f14`, `--gold-hi #8a5a0c`, `--teal #1f7a6e`, `--rose #b04a5a`, `--line #d9d3c1`. In the 3-D scene: GOLD `#c9a45c`, TEAL `#5ec4b6`, ROSE `#d4899a`. | lab.html `:root`, lab.js l.177 |
| Channels | The body is drawn as **channels**: suṣumṇā a thick gold tube (opacity .75), iḍā/piṅgalā thin teal/rose sine-twined threads (opacity .3), constellation edges gold at .32. Lines are the protagonists, not fills. | lab.js l.218, 263–267 |
| Element colours | Height on the body picks an element colour **and a shape**: ether violet `#9a8bd0` dot, air teal circle, heart green `#6fbf8f` circle, fire `#d0653a` triangle, water `#5a9ab0` circle, earth ochre `#c09a4a` square. Shape carries the meaning; colour reinforces it. | lab.js `styleForY()` l.826 |
| Glyph first | README rule: "Glyph first, colors pedagogical only". Phonemes are real DOM text (`.glyph`, Noto Sans Devanagari) so they stay sharp; lit state = gold + soft text-shadow + a 0.45 s pop. | README, lab.html `.glyph` |
| Primitives | A small archetype vocabulary: bindu (point), maṇḍala (concentric circles), śrī-yantra (interlocking triangles), eye, lotus, wave, mirror, pillar, flame. Each has a geometric form and a single colour. | primitive-registry.json |
| Operators | Motion verbs with symbols: appear ⭐, pulse ≋ (spanda), recognize ↻, contract ∨, expand ∧, dissolve ↓, suspend ◎, procession ⇶, condition_arise ⊸ … | operators.json |
| Motion | (1) **pulse**: a glowing sphere travels along a channel; (2) **ringPing**: a ring expands ×2.6 and fades in 0.9 s where a pulse lands; (3) **chipPop** scale .6→1.25→1; (4) bloom (UnrealBloom, strength .16) only on screens ≥640 px and never with reduced motion; (5) breath-paced timing (inhale/exhale envelopes). | lab.js l.675–707, 201 |
| Type | UI in `ui-sans-serif, system-ui` at .72–.9 rem; uppercase micro-labels with .1em tracking (`#menu h3`); Devanagari in Noto Serif/Sans Devanagari; Hebrew in Noto Sans Hebrew. Georgia only as body fallback. | lab.html |
| Chrome | Panels are translucent white (`rgba(255,255,255,.9)` + blur 12px), 1 px `--line` borders, 12 px radii, 42–52 px tap targets, one menu, one split button. Readout pill at the bottom centre. | lab.html |
| Data honesty | Every framework has a `status` (live / verify / stub / planned / needs_review) and a `provenance` string; "PEDAGOGICAL encoding, not initiatory instruction". "Geometries differ per tradition — never recolours of one skeleton." | frameworks/registry.json, CATALOG.md |

## 2. What the Atlas borrows (rules)

1. **White ground, lines as protagonists.** The page is white; lanes are thin channel lines in the stream's ink at
   16 % opacity, like iḍā/piṅgalā. No filled bands beyond a 2 % alternate tint. Grid = faint era rules only.
2. **Glyph first, colour second.** A node's *kind* is its shape; its *stream* is its colour. Never encode kind by colour.
3. **Transmission is gold.** Teacher → student threads use deitybody's suṣumṇā gold (`#a86f14`), 1.4 px, 55 %; a
   *traditional* (hagiographic) link is the same thread dashed 3/3; a low-confidence link is thinner. On focus the line
   **flows** (dash offset animation, 1.6 s), the Atlas equivalent of deitybody's travelling pulse.
4. **Influence is teal, texts are rose, parallels violet, scholarship grey-dotted.** Same palette roles as the body:
   teal = air/relationship, rose = the textual/ritual channel, violet = ether (equivalence across traditions), grey
   dotted = the thin "study" thread from a scholar to what they study.
5. **ringPing on arrival.** Selecting a node pings a gold ring (0.9 s, ×4.6 radius, fade). Nothing else animates by
   default. `prefers-reduced-motion` stops all flow and pings.
6. **Concept threads are the suṣumṇā of an idea.** In thread mode one glowing gold line runs through every holder of a
   concept in time order across all lanes; parallels (Plotinus' One ~ Brahman) run as a violet second thread.
7. **Status is visible.** Contested links say so in rose; traditional dates and lines are labelled "traditional";
   provenance that a machine has not confirmed says "to check". Same spirit as deitybody's `verify` status.
8. **One standard grammar, tradition-specific marks.** Every stream gets its own symbol drawn from the same primitive
   kit (circles, triangles, petals, rays) rather than a recolour of one icon (§3.3).
9. **Calm chrome.** Translucent white panels, 1 px warm-grey borders, 10–14 px radii, ≥36 px tap targets, uppercase
   micro-labels at .68 rem / .12 em tracking, everything else in the system sans.

## 3. Visual grammar (as implemented in `proto/`)

### 3.1 Node glyphs (shape = kind)
| kind | glyph | deitybody source |
|---|---|---|
| person (teacher, lineage holder, figure) | filled circle; radius grows with degree | bindu |
| scholar | open diamond, grey, on the lane's lower "study margin" | (new) |
| text | open palm-leaf rectangle with a centre rule | (manuscript) |
| school | open hexagon with a dot | maṇḍala |
| lineage | double ring | maṇḍala |
| practice | open triangle | fire / flame |
| place | open square | earth |
| deity | six-pointed star (two triangles) | śrī-yantra |
| event | vertical tick with a ring | pillar + ringPing |
| concept | not on the timeline; ring + dot chip | bindu |

Extra marks: a gold halo ring = this node has talks on Wiser (`talks.by + talks.about > 0`); a horizontal span line =
life or activity range (dotted when century-level or low confidence); a dotted ghost ring linked by an arc = the
*traditional* date when it differs from the historical one (the Buddha, Śaṅkara, Milarepa, Patañjali, the Zohar).

### 3.2 Edge grammar
| class | edge types | stroke |
|---|---|---|
| tx | teacher_of, initiated | gold 1.4 px, 55 % (dashed when basis = traditional) |
| inf | influenced (cross-stream arcs bow away; same-stream grey) | teal 1 px, 26 % |
| txt | founded, commented_on, translated (person/text), expounds, synthesis_of, part_of, located_at, schism_from | rose 1 px, 26 % |
| opp | opposed | rose dotted |
| study | studied, critical_edition_of, commentary_on, academic_teacher_of, doctoral_advisor_of, scholar translated | grey 0.7 px dotted 1/2.5, 10 % |
| par | parallels | violet dashed, hidden until focus |

### 3.3 Stream symbols (one mark per tradition, same primitive kit)
Vedic agni (filled triangle) · Upaniṣadic bindu · Vedānta pūrṇa (double circle) · Yoga lotus · Early Śaiva trident ·
Kaula-Krama yoni (downward triangle + dot) · Trika triad (three points in a circle) · Śrī Vidyā yantra (interlocking
triangles) · Early Buddhist and Theravāda wheel · Mahāyāna wheel with hub · Vajrayāna vajra · Chan/Zen ensō ·
Jain siddhaśilā (crescent + dot) · Taoist taiji · Greek monad · Neoplatonic emanation (concentric rings) · Christian
cross · Hermetic Mercury · Modern esoteric ouroboros · Western occult pentagram · Modern Paganism triple moon · Sufi
spiral · Ishrāqī sun · Kabbalah tree · Modern non-dual vesica. Drawn as SVG paths in `sym()` (`proto/atlas.js`), so no
font coverage is needed; the per-stream `ink` and `symbol` live in `streams.json` for the redesign to reuse.

### 3.4 Time
Horizontal, **log-distance from the present**: `x ∝ −ln(2026 + 120 − year)`. With K = 120 the 1 500 years before 1 CE
take about the same width as 1 CE–1500, and the dense 19th–20th centuries get room. A "Linear time" toggle exists for
honesty. Ticks thin themselves (≥34 px apart). Zoom: + / − / Fit, ctrl-wheel or pinch; pan: horizontal drag or
trackpad. Selecting a node zooms to its transmission neighbourhood (2 hops, ±450 years) and leaves room for the panel.

### 3.5 Layout
Lanes grouped (Vedic and Hindu · Tantra · Buddhist · Jain · Chinese · Greek and Western · Occult and Pagan · Islamic ·
Jewish · Modern), each lane packed into ≤4 rows (more when a lane is dense), plus a scholar margin of ≤2 rows under a
dotted rule. Labels are culled by priority (selected → highlighted → talks → degree), tried right then left, measured
with canvas `measureText`. Lane labels and symbols sit in a fixed left column above a white fade.

### 3.6 Interaction (no dead UI; verified by `tools/interact.mjs`)
- Node or label **hover**: previews the lineage (teachers and students up and down the line, plus direct links); the rest dims to 14 %.
- Node or label **click**: zooms to the neighbourhood, pings, opens the panel (kind · stream symbol, dates with
  confidence and traditional alternative, talks counts, links to Wiser / Wikidata / Wikipedia / the stream, every
  relation grouped with lineage name, confidence, contested note and source link, scholar works with DOI).
- Edge **hover**: thickens and shows "A influenced B · confidence · line"; **click**: link panel with all provenance.
- **Thread** hover and click: concept panel. Concept chips toggle threads; the thread pill opens the concept.
- Lane label **click**: stream panel (span, key nodes, linked streams, "Show only this stream"). Group label click solos the group.
- Legend: kind rows toggle that kind; line rows and "Has talks" highlight that class.
- Search: live highlight; Enter opens the best match, restoring its stream or kind if it was filtered out.
- Keyboard: nodes, lanes and threads are focusable; Enter or Space opens them.

### 3.7 Type and formulas
UI sans: Inter (Geist as the alternative), falling back to the system sans. Uppercase micro-labels as in deitybody.
Sanskrit diacritics need a font with full Latin Extended Additional coverage (Inter has it). KaTeX is wired in lazily:
any panel note that contains `$…$` loads KaTeX + auto-render (the app now ships `site/katex/`; point to it on integration).

## 4. Design idea: the "Sacred Map" (recorded 2026-10-20, not built)

A geographic twin of the Atlas in the same grammar, fed by the same graph (place nodes + `located_at`, `teacher_of`,
`founded` edges, the places sourcing in `work/wiser/sources/places*/`).

- **Ground**: a white, almost empty map: coastlines and major rivers as 0.5 px warm-grey lines, no labels until
  zoomed, no tiles (vector, Natural Earth 1:50m). "Space is the aesthetic."
- **Places as glyphs**: monastery or centre = open square (earth); pilgrimage site = six-point star; seat of a
  lineage = double ring; retreat centre = square with a dot; the stream's ink and symbol. Size = number of
  teachers or talks attached.
- **Lineage threads between places**: a transmission edge whose two people have known places draws a great-circle
  thread in gold (Nālandā → Samye → Lhasa; Kashmir → Chidambaram; Wat Pah Pong → Amaravati → Abhayagiri;
  Alexandria → Athens → Florence → London). Traditional links dashed; flow on hover, ringPing on arrival.
- **Time scrub**: a thin log-time axis under the map with a draggable window (default a century). Only nodes and
  threads alive in the window draw; dragging animates threads appearing in date order, so you see Buddhism travel
  east, Neoplatonism travel to Baghdad and back to Florence, Theosophy to Adyar, the Thai Forest to England.
- **Linked brushing**: selecting on the Atlas highlights on the map and back; the panel is shared.
- **Data needed**: `place` on people (birth, seat, death), lat/lng on place nodes (the places agent already resolves
  OSM/Wikidata coordinates), and an optional `at` place on edges ("initiated at Samye").
- **Honesty**: places of legendary events (Bodhidharma at Shaolin, Vasugupta at Mahādeva) carry `basis: traditional`
  and draw dashed.

## 5. Not borrowed
three.js, bloom and the 3-D body (the Atlas is 2-D SVG); audio; phoneme content. Those belong to the Practise layer,
which the Atlas links to through `practice` nodes and, later, `visual_spec` ids (see REPORT.md §6).
