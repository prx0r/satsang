# Wiser Atlas: temporal knowledge graph v2

Machine schema: `schema/atlas.schema.json` (JSON Schema 2020-12). Data: `nodes.json`, `edges.json`, `streams.json`
(backbone) and `merged/` (backbone + all of wisegraph v1). Source of truth for the backbone: `tools/seed.py`; compiled
by `tools/build.py`; checked by `tools/validate.py`. v2 **extends** wisegraph v1: every v1 id is kept verbatim, and
every v2 edge says how it projects back into v1 (`legacy_type`), so `src/wise.js` and `tools/build-wise.py` keep working.

## 1. Files

| file | shape |
|---|---|
| `nodes.json` | `{_meta, nodes[]}` |
| `edges.json` | `{_meta, edges[]}` |
| `streams.json` | `{groups[], lanes[], links[]}`: swimlanes, their groups, and counts of cross-stream edges |
| `merged/*.json` | same shapes, plus `v1_only: true` on nodes imported from v1 |
| `proto/data.js`, `proto/data-merged.js` | the same data as one `window.ATLAS` blob for the prototype |

## 2. Time: the fuzzy date (`fuzzyTime`)

Every dated node has `time`; every edge has `time` (stated or derived). Years are integers, negative = BCE, no year 0.

```json
{"dsl":"c950..1016","start":950,"end":1016,"circa":true,"precision":"circa",
 "basis":"historical","confidence":"medium","label":"c. 950–1016"}
```

| field | meaning |
|---|---|
| `start`, `end` | widest plausible bounds. `end:null, open:true` = ongoing (living teacher, active school). `start_unknown` for "d. 866". |
| `precision` | `year` · `circa` · `century` · `derived` (inferred, e.g. edge time from overlapping lives) |
| `basis` | `historical` (received critical dating) · `traditional` (the tradition's own, often hagiographic) · `scholarly` (a modern revision that differs from received history) |
| `confidence` | `high` · `medium` · `low` |
| `label` | display string ("6th c. BCE", "563–483 BCE (traditional)", "1960–") |
| `derived` | edges only: how a missing time was inferred |

Competing datings go in `time_alt[]` (the Buddha: historical c. 480–400 BCE, traditional 563–483 BCE; Śaṅkara c. 700–750
vs traditional 788–820; Milarepa; Patañjali c. 325–425 CE vs traditional 2nd c. BCE; the Zohar c. 1280–1300 vs 2nd c.).

Compact authoring DSL (`tools/fuzzydate.py`): `-428..-348` years · `c950..1016` circa · `C-6` century BCE · `C8..C9`
century range · `1960..` open · `?..866` unknown start · trailing `?` low / `!` high confidence · prefix `t:` traditional,
`s:` scholarly.

## 3. Nodes

```json
{"id":"abhinavagupta","kind":"person","label":"Abhinavagupta","stream":"trika","streams":["trika"],
 "time":{…},"time_alt":[],"ids":{"wikidata":"Q320619","enwiki":"Abhinavagupta"},
 "tradition":"kashmir-shaivism","legacy":{"table":"people","id":"abhinavagupta","kind":"figure"},
 "place":"pl-kashmir","talks":{"by":0,"about":6}}
```

| kind | what | v1 equivalent |
|---|---|---|
| `person` | teacher, lineage holder, founder, figure | people.json kind speaker / figure |
| `scholar` | academic who studies, edits or translates (not a lineage holder by default) | (new) |
| `text` | scripture, treatise, corpus | people.json kind text |
| `school` | tradition or school of thought | traditions.json kind school |
| `lineage` | a transmission line or order | traditions.json kind lineage |
| `concept` | doctrine (rebirth, nonduality, the One, emptiness); undated, cross-stream | (new) |
| `practice` | method (ānāpānasati, zazen, nyāsa, theurgy, dhikr, Middle Pillar) | (new; later links to deitybody practices) |
| `place` | monastery, city, pilgrimage site | v1 `places.json` (being added by the places agent) |
| `deity` | figure of devotion or revelation source (Śiva, Vajradhara, Hermes Trismegistus) | (new) |
| `event` | council, founding, discovery, schism | (new) |

Ids: lowercase-hyphen; v1 ids unchanged; new non-person kinds use prefixes `c-` `p-` `pl-` `d-` `ev-`.
`ids` holds external identifiers: `wikidata`, `enwiki`, `orcid`, and room for `viaf`, `patala`, `pandit`, `gretil`, `cts`.
`tradition` is the most specific v1 traditions.json id (so tradition chips keep working). `talks` is computed from
`app/clips.json` (`by` = speaker, `about` = figures[], `tagged` for concepts mapped to clip topics).

**Scholars** carry `works[]`:

```json
{"id":"w-raffaele-torella-1","title":"The Īśvarapratyabhijñākārikā of Utpaladeva with the Author's Vṛtti: critical edition and annotated translation",
 "year":1994,"kind":"critical_edition","publisher":"Rome: IsMEO (Serie Orientale Roma 71)","treats":["ipk"],"lang":"en"}
```
`kind`: book · critical_edition · translation · article · commentary; `doi`/`url`/`isbn` when public; `treats` = node ids
of the primary texts or figures. Each work generates an edge (`critical_edition_of`, `translated`, `commentary_on` for a
text, `studied` otherwise) with the work itself as provenance.

## 4. Edges

```json
{"id":"e0102","from":"lakshmanagupta","to":"abhinavagupta","type":"teacher_of","lineage":"trika-line",
 "conf":"high","basis":"historical","time":{"start":950,"end":1000,"precision":"derived","confidence":"medium","label":"c. 950–1000","derived":"overlap of lives"},
 "provenance":[{"cite":"Wikipedia, \"Abhinavagupta\"","url":"https://en.wikipedia.org/wiki/Abhinavagupta","check":"mentioned","match":"laksmanagupta"}],
 "legacy_type":"teacher_of"}
```

| type | direction | notes |
|---|---|---|
| `teacher_of` | teacher → student | transmission; `lineage` names the line (kagyu, trika-line, thai-forest, chan-patriarchs, golden-dawn, gardnerian, obod…) |
| `initiated` | initiator → initiate | formal initiation (Mathers → Crowley, Gardner → Valiente) |
| `influenced` | source → influenced | node or tradition level |
| `commented_on` | commentator → text | Kṣemarāja → Śiva Sūtras |
| `translated` | translator → text (or text → its translation) | Ficino → Corpus Hermeticum; Enneads → Theology of Aristotle |
| `founded` | founder/author → school, lineage, text, place, event | authorship of texts is `founded` (v1 `lineage_of` maps here) |
| `schism_from` | splinter → parent | |
| `synthesis_of` | synthesiser → what is synthesised | Mullā Ṣadrā → Illuminationism |
| `opposed` | critic → criticised | Rāmānuja → Śaṅkara; al-Ghazālī → Avicenna |
| `located_at` | person/event → place or event | |
| `expounds` | person/text → concept or practice | drives concept threads |
| `parallels` | either way | cross-tradition equivalence with a `note` (Plotinus' One ~ Brahman), never an influence claim |
| `part_of` | member → whole | Upaniṣad → Veda; order → movement |
| `studied` | scholar → figure/tradition/concept | |
| `critical_edition_of` | scholar → text | |
| `commentary_on` | scholar → text | a scholarly study of a specific text |
| `doctoral_advisor_of`, `academic_teacher_of` | teacher → student | academic lineage, kept apart from spiritual transmission |

Every edge carries:
- `conf`: high · medium · low.
- `basis`: historical · traditional. **Traditional** = asserted by the tradition (revelation to Vasugupta, Vajradhara →
  Tilopa, the Chan patriarch line, Śaṅkara's maṭhas, Bodhidharma at Shaolin).
- `provenance[]` (≥1): `{cite, url?, check}` where `check` is `work` (the scholar's own publication) · `cited` (curator
  source) · `mentioned` (machine check: the cited Wikipedia article names the other end; necessary, not sufficient) ·
  `unverified` (relevant article cited, mention not found) · `needs_source` · `reviewed` (a person checked it).
- `contested` (optional): `{status, note, positions[]}` for disputed attributions and lineages.
- `time`: stated, or derived (teacher_of = overlap of lives; founded = start of the founded thing; others = the source's life).
- `legacy_type`: how the edge appears in v1 (`teacher_of`, `influenced`, `lineage_of`); absent = v2 only.
- `cross_stream`: true when the ends sit in different lanes.

## 5. Streams (swimlanes)

26 lanes in 10 groups, ordered top to bottom, each with `span`, display `colour` (dark theme) and `ink` (white theme),
a `symbol` id (DESIGN.md §3.3) and `legacy {family, school}` pointing at v1 traditions.json:

Vedic and Hindu: vedic → upanishadic → vedanta (Advaita) · yoga (Sāṃkhya, Haṭha, Kriyā) ·
Tantra: shaiva-tantra (early Śaiva) · kaula-krama · trika (Kashmir Śaivism) · shri-vidya ·
Buddhist: early-buddhist → theravada · mahayana · vajrayana · chan-zen ·
Jain · Chinese: taoist ·
Greek and Western: greek → neoplatonic → christian-mystic · hermetic (Renaissance) → modern-esoteric (Theosophy) ·
Occult and Pagan: occult (Rosicrucian, Masonic, Golden Dawn, Thelema) · pagan (Druidry, Wicca, Heathenry) ·
Islamic: sufi · ishraqi (falsafa → Suhrawardī → Mullā Ṣadrā → Corbin) · Jewish: kabbalah · Modern: modern-nondual.

`streams.links[]` counts cross-stream edges (influence, transmission, commentary, translation; not parallels), e.g.
trika ↔ shaiva-tantra (9/8), occult → pagan (6), vedanta → modern-nondual (5), hermetic → occult (5), kabbalah → occult (3:
Kabbala Denudata → Golden Dawn, Mystical Qabalah), neoplatonic → ishraqi (Theology of Aristotle), chan-zen →
christian-mystic (Suzuki → Merton).

## 6. Migration from wisegraph v1 (`tools/import_v1.py`)

| v1 | v2 |
|---|---|
| people.json `kind: speaker / figure` | node `kind: person`, same id; `legacy.kind` keeps speaker/figure |
| people.json `kind: text` | node `kind: text` |
| people.json `years` string | parsed into `time` ("1918–1992", "b. 1960", "c. 950–1016", "d. 1310", "c. 5th century BCE"); unparseable stays null and is warned |
| people.json `tradition` | `tradition` unchanged; `stream` from the `TRAD2LANE` map |
| traditions.json `family` | not a node: becomes `streams.lanes[].legacy.family` (the site's region filter) |
| traditions.json `school` / `lineage` | node `kind: school` / `lineage`, same id; time derived from its earliest dated member |
| edges.json `teacher_of` / `influenced` | same type; provenance "wisegraph v1 (curated)", `check: needs_source` |
| edges.json `lineage_of` | `founded` (`legacy_type: lineage_of`) |
| edges.json `studied_with` (new in v1 since the places merge) | `teacher_of`, `legacy_type: teacher_of` |
| works[] on people | unchanged in v1; v2 adds scholar `works[]` with year/publisher/DOI/treats |

Rules: backbone values win (dates, labels, Wikidata ids); v1 adds people and edges the backbone lacks; an edge already
present in either direction is not duplicated. Today's run: +131 people, +22 traditions, +134 edges → 612 nodes,
827 edges, 0 validation errors (`python3 tools/validate.py --merged`); 53 v1 people have no `years` and are listed
but not drawn.

Projection back to v1 (for `build-wise.py`): keep `legacy_type` edges, map `founded`→`lineage_of` when the target is a
school/lineage, map scholar edges to nothing (or a new v1 type `studied` once `src/wise.js` renders it).

## 7. Validation (`tools/validate.py`)

Hard errors: duplicate node or edge ids; edges to unknown nodes; orphan nodes (any kind but place); unparsable or
self-inconsistent dates (dsl vs start/end, start after end); bad confidence or basis; edges without provenance or with
an empty entry; unknown kinds, edge types or streams; scholar works without a year or treating unknown nodes.
Warnings: no Wikidata id; provenance `unverified` / `needs_source`; teacher_of without a lineage name. In merged mode
v1-only nodes downgrade "no stream / no time / orphan" to warnings.

Today: backbone 459 nodes, 693 edges, **0 errors**, 162 warnings.
