# Wiser Atlas: report (2026-10-20)

Structure first: a temporal knowledge graph v2 for every tradition from the Ṛgveda (c. 1500 BCE) to living teachers,
a sourced backbone that spans all 26 streams, and a standalone white-ground timeline prototype in the deitybody grammar.
Nothing in `app/` was touched. Metadata only: no media, no transcript text, nothing bought.

## 1. What is here (`work/wiser/atlas/`)

| path | what |
|---|---|
| `DESIGN.md` | deitybody study (palette, channels, glyph-first, ringPing/pulse motion, type) → concrete Atlas rules; glyph, edge and stream-symbol grammar; interaction spec; the **Sacred Map** idea (§4) |
| `SCHEMA.md` + `schema/atlas.schema.json` | v2 schema: fuzzy time, 10 node kinds incl. **scholar**, 18 edge types, provenance + confidence + contested on every edge, streams, v1 migration |
| `nodes.json` · `edges.json` · `streams.json` | the **backbone**: 459 nodes, 693 edges, 26 lanes in 10 groups |
| `merged/` | backbone + all of wisegraph v1 (`tools/import_v1.py`): 612 nodes, 827 edges |
| `crosswalk-openpatala.json` | 18 atlas texts matched to openpatala work slugs with their translation lists |
| `proto/index.html` + `atlas.js` + `data.js` (`data-merged.js` with `?merged`) | the prototype: vanilla JS + SVG, no build, no CDN needed |
| `shots/` | desktop 1440×900 and phone 390×844 @2x screenshots (white theme) |
| `tools/` | `seed.py` (hand-curated source of truth) · `fuzzydate.py` · `enrich_wd.py` (Wikidata ids, dates) · `fetch_wp.py` (Wikipedia plain text, for the provenance mention check) · `fetch_crossref.py` (DOIs) · `build.py` · `validate.py` · `import_v1.py` · `crosswalk_openpatala.py` · `review_wd.py`, `wdsearch.py` (curation helpers) · `shots.mjs`, `interact.mjs` (headless checks) · `qid_overrides.json` |
| `cache/` | Wikidata JSON, Wikipedia plain texts (~9 MB), Crossref hits. **Internal only; never deploy** |

Rebuild: `python3 tools/enrich_wd.py && python3 tools/fetch_wp.py && python3 tools/build.py && python3 tools/import_v1.py && python3 tools/validate.py && python3 tools/validate.py --merged && node tools/shots.mjs && node tools/interact.mjs`
(Wikidata rate-limits: `enrich_wd.py` and `fetch_wp.py` stop at ~100 s and resume on the next run.)

## 2. The backbone in numbers

- Nodes: 207 persons · 64 scholars · 65 texts · 24 schools · 15 lineages · 24 concepts · 18 practices · 19 events · 14 places · 9 deities.
- Lanes (nodes): Vedic 7 · Upaniṣadic 9 · Vedānta 31 · Yoga 15 · Early Śaiva 10 · Kaula-Krama 7 · Trika 36 · Śrī Vidyā 9 ·
  Early Buddhist 10 · Theravāda 29 · Mahāyāna 18 · Vajrayāna 26 · Chan/Zen 26 · Jain 15 · Taoist 12 · Greek 9 ·
  Neoplatonic 19 · Christian mystic 24 · Hermetic 9 · Modern esoteric 13 · Western occult 18 · Modern Paganism 16 ·
  Sufi 19 · Ishrāqī 18 · Kabbalah 19 · Modern non-dual 11.
- Edges: influenced 158 · expounds 124+ · studied 89 · founded 86 · teacher_of 78 · translated 32 · commented_on 26 ·
  commentary_on 21 · parallels 21 · critical_edition_of 13 · … ; **137 cross-stream**, **43 traditional-basis**, **23 contested**;
  confidence high 498 / medium 144 / low 51.
- Ids: 424 of 459 nodes carry a Wikidata id (all checked by label and description; 70+ wrong first hits overridden in
  `tools/qid_overrides.json`, e.g. "Karma" the Belarus settlement, "Avicenna" the insect genus). 91 v1 people and 14 v1
  traditions are reused by id.
- Scholar works: 83, each with year and publisher; 10 with a DOI confirmed on Crossref (title ≥0.85 similar, year ±1, a
  book type). Other Crossref hits were reviews of the book and were rejected.
- Validation: **0 errors** on the backbone and on the merged graph.

Required lines, all present and drawable as threads: Plato → Plotinus → Proclus → Pseudo-Dionysius → Eckhart (with
Ammonius, Porphyry, Iamblichus, Damascius, Eriugena); Suhrawardī → Mullā Ṣadrā (via Mīr Dāmād) → Sabzavārī → Ṭabāṭabāʾī ↔
Corbin, Nasr; Vedas → Upaniṣads → Gauḍapāda → (Govinda) → Śaṅkara → Sureśvara/Padmapāda; Vasugupta → Kallaṭa;
Somānanda → Utpaladeva → Lakṣmaṇagupta → Abhinavagupta → Kṣemarāja → … → Swami Ram → Mehtab Kak → Lakshmanjoo
(→ Silburn, Jaideva Singh, Bäumer, Sanderson as students); Nāgārjuna → Āryadeva, Asaṅga → Vasubandhu; Bodhidharma →
Huike → Hongren → Huineng → Linji / Zhaozhou / Dongshan → Rujing → Dōgen; Tilopa → Nāropa → Marpa → Milarepa → Gampopa;
Ajahn Sao → Ajahn Mun → Ajaan Lee → Ajaan Fuang → Thanissaro and Ajahn Mun → Ajahn Chah → Sumedho/Brahm/Pasanno/Kornfield;
Ramana → Papaji → Mooji; Bhausaheb → Siddharameshwar → Nisargadatta → Balsekar; Atmananda → Jean Klein → Lucille → Spira.
Added on request: Western occult (Rosicrucianism, Freemasonry, SRIA, Golden Dawn with Westcott, Mathers, Yeats; Crowley and
Thelema; Dion Fortune; Regardie) and Modern Paganism (Iolo Morganwg, Ross Nichols → OBOD → Carr-Gomm; Gardner → Valiente
and Wicca; Heathenry via the Poetic Edda and Ásatrúarfélagið), linked back to Agrippa, Ficino, the Corpus Hermeticum,
Kabbala Denudata/Zohar, Iamblichus' theurgy and Theosophy; Ronald Hutton and Margaret Murray on the scholar layer.

## 3. The prototype

Open `proto/index.html` (add `?merged` for the v1-merged graph; `#atlas/<id>` deep-links a node, `#atlas/thread=c-rebirth`
a concept thread). White ground, Inter, deitybody accents (gold transmission threads, teal influence, rose text links,
violet parallels, grey dotted study threads, ringPing on select, flowing lineage on focus).
- Horizontal log-distance time axis (linear toggle); 26 swimlanes with per-tradition SVG symbols; scholars as grey
  diamonds on each lane's study margin, linked by thin dotted study threads.
- Hover any node or label: the lineage up and down and its direct links light, the rest dims. Click: zoom to the
  neighbourhood + panel (dates with confidence and the traditional alternative, talks on Wiser by/about, Wiser /
  Wikidata / Wikipedia links, every relation with lineage, confidence, contested note and a source link, scholar works
  with DOI). Hover/click any edge: its sources. Click a lane or group label: stream panel / solo. Legend rows filter
  kinds or highlight edge classes. Concept chips draw the thread (e.g. Rebirth: 16 holders across 11 streams).
- `tools/interact.mjs` exercises all of these headlessly (hover → 6 nodes / 5 edges lit; label → panel; panel link →
  next node; edge → link panel; lane → stream panel and solo; legend → kind filter 425→360 nodes; thread → concept
  panel; search "Corbin" + Enter → restores filtered streams and opens him); no page errors.
- Shots checked: no horizontal overflow at 1440 or 390 px; labels culled by measured width; panel never covers the
  selected node (the view pads for it); phone uses a 50 vh bottom sheet and hides the thread panel by default.
- Fonts: the sandbox cannot reach Google Fonts, so the screenshots use the fallback sans. On the site use the redesign's
  self-hosted `site/fonts/inter-*.woff2` and `site/katex/`.

## 4. Gaps (honest)

- **Provenance quality.** Every edge has a source, but the check levels differ: 71 `work` (the scholar's own book),
  1 `cited`, 495 `mentioned` (the cited Wikipedia article names the other end: necessary, not proof), 121 `unverified`
  (a relevant article is cited but the link was not found in it, mostly tantra, Śrī Vidyā, Chan sub-lines and scholar
  edges), 5 `needs_source` (Jñānanetra → Krama, Yoginīhṛdaya and Kāmakalāvilāsa → mātṛkā, Amṛtānanda's Dīpikā, nyāsa ~
  Middle Pillar). None is `reviewed` yet; a human pass should start with the 126 unverified/needs_source edges.
  v1 edges imported into `merged/` all carry `needs_source`.
- **Missing Wikidata ids (35)**, mostly concepts and Kashmir figures with no item (Lakṣmaṇagupta, Jayaratha,
  Śivopādhyāya, Swami Ram, Mehtab Kak, Christopher Wallis, Amṛtānanda), plus al-Fārābī and Isaac Luria, whose search
  hits were wrong; their correct items need setting by hand in `qid_overrides.json`.
- **Compressed lines.** Long lineages are modelled with "via …" notes rather than every link (Huineng → Linji via
  Nanyue, Mazu, Baizhang, Huangbo; Dongshan → Rujing; Kṣemarāja → Swami Ram; the 24 tīrthaṅkaras; Gelug and Nyingma
  successions; the Sufi orders' silsilas are absent). This is a structural backbone, not a complete genealogy.
- **Thin streams.** Jain, Taoist, Kabbalah and Christian mysticism have their main nodes but few transmission edges;
  Sufi orders (Qādirī, Naqshbandī, Chishtī, Mevlevī) and East Asian Mahāyāna schools (Tiantai, Huayan, Pure Land) are
  missing; Sikh, Indigenous, Shinto, African and Gnostic sub-streams are not modelled.
- **Undated nodes.** Undated places and all concepts are not drawn on the timeline (concepts appear as threads and
  chips); 53 v1 people without `years` are imported but not drawn.
- **Scholar lineages** are partly inferred (Sanderson → Dyczkowski supervision is `low`); ORCID ids are not filled yet.
- **Dates**: Wikidata disagreements were reviewed and 13 corrected (e.g. Ratié b. 1976, Gnoli and Dyczkowski d. 2025,
  Padoux d. 2017, Dundas d. 2023); a few deliberate disagreements remain (Carr-Gomm b. 1952 per Wikipedia vs 1945 on
  Wikidata; Vasugupta c. 800–850 vs Wikidata 860–925).

## 5. Contested items (all carried as `contested` on the edge and shown in rose)

Śaṅkara's Māṇḍūkya-kārikā-bhāṣya, his founding of the Daśanāmī maṭhas and his authorship of the Saundaryalaharī · the
unity of the Yoga Sūtra and Bhāṣya (Maas) · Spanda Kārikā authorship (Vasugupta vs Kallaṭa) · how far the Buddha answers
the Upaniṣads · Goenka as "founder" of vipassanā (really a systematiser) · the Hongren → Huineng robe story and Shenhui's
role · Laozi's historicity and the layered Daodejing · Hermes Trismegistus as author (Casaubon) · Zohar authorship
(Shimon bar Yochai vs Moses de León vs a circle) · tathāgatagarbha ~ ātman · Origen and reincarnation · Nāgārjuna and
"nonduality" · a Rosicrucian origin of Freemasonry · the Golden Dawn Cipher Manuscripts and Sprengel charter · Iolo
Morganwg's forgeries · Murray's witch-cult thesis · Gardner's New Forest coven · the Digambara–Śvetāmbara split.
Plus every `basis: traditional` link (43): revelations (Śiva → Vasugupta, Vajradhara → Tilopa, Crowley's Book of the Law),
the Chan patriarchs, Dakṣiṇāmūrti → Gauḍapāda, Kapila and Sāṃkhya, Mahavatar Babaji, Bodhidharma at Shaolin.

## 6. Proposed integration plan

### 6.1 Route `#atlas` on tantrafiles.xyz
1. Copy `proto/atlas.js` into `app/src/atlas.js` as a module exporting `mountAtlas(el, data, opts)`; keep the SVG
   renderer, drop the standalone header (use the site's header and filter bar), take tokens from DESIGN-SYSTEM.md.
2. Route `#atlas` (overview), `#atlas/<id>` (selected node), `#atlas/thread=<concept>`, `#atlas/stream=<lane>`. Add an
   "Atlas" entry on the Teachers · Traditions tab and a "See on the Atlas" link on every `#teacher/` and `#tradition/` page.
3. Data: `tools/build-atlas.py` in the app (port of `build.py` + `import_v1.py`) writes `site/data/atlas.json`
   (~0.6 MB raw, ~86 KB gzip) at build time; panels link to `#teacher/<id>` for v1 nodes instead of opening a new tab.
4. Guards: `deploy.sh` must not ship `atlas/cache/` (it contains Wikipedia text); add `atlas.json` to the existing
   transcript guard's scan (it is metadata only, so it passes).

### 6.2 D1 tables (migration `0015_atlas.sql`)
```sql
CREATE TABLE atlas_nodes (id TEXT PRIMARY KEY, kind TEXT NOT NULL, label TEXT NOT NULL, stream TEXT, streams TEXT,
  t_start INTEGER, t_end INTEGER, t_precision TEXT, t_basis TEXT, t_conf TEXT, t_label TEXT, time_alt TEXT,
  wikidata TEXT, enwiki TEXT, orcid TEXT, patala TEXT, tradition TEXT, legacy_table TEXT, place TEXT, note TEXT,
  status TEXT DEFAULT 'live', updated_at INTEGER);
CREATE TABLE atlas_edges (id TEXT PRIMARY KEY, src TEXT NOT NULL REFERENCES atlas_nodes(id), dst TEXT NOT NULL REFERENCES atlas_nodes(id),
  type TEXT NOT NULL, lineage TEXT, conf TEXT NOT NULL, basis TEXT NOT NULL, t_start INTEGER, t_end INTEGER, t_label TEXT,
  note TEXT, contested TEXT, legacy_type TEXT, work_id TEXT, status TEXT DEFAULT 'live');
CREATE TABLE atlas_provenance (edge_id TEXT NOT NULL REFERENCES atlas_edges(id), ord INTEGER, cite TEXT, url TEXT, doi TEXT,
  check_level TEXT NOT NULL, reviewed_by TEXT, reviewed_at INTEGER, PRIMARY KEY (edge_id, ord));
CREATE TABLE atlas_works (id TEXT PRIMARY KEY, scholar TEXT NOT NULL REFERENCES atlas_nodes(id), title TEXT NOT NULL, year INTEGER NOT NULL,
  kind TEXT NOT NULL, publisher TEXT, doi TEXT, url TEXT, isbn TEXT, lang TEXT, treats TEXT, patala_work TEXT);
CREATE TABLE atlas_streams (id TEXT PRIMARY KEY, label TEXT, grp TEXT, ord INTEGER, t_start INTEGER, t_end INTEGER, ink TEXT, symbol TEXT,
  legacy_family TEXT, legacy_school TEXT);
CREATE TABLE atlas_clip_links (clip TEXT NOT NULL, node TEXT NOT NULL REFERENCES atlas_nodes(id), role TEXT NOT NULL,  -- by|about|topic|passage
  start_sec INTEGER, end_sec INTEGER, conf REAL, src TEXT, PRIMARY KEY (clip, node, role));
CREATE INDEX atlas_edges_src ON atlas_edges(src); CREATE INDEX atlas_edges_dst ON atlas_edges(dst);
CREATE INDEX atlas_nodes_time ON atlas_nodes(stream, t_start); CREATE INDEX atlas_clip_node ON atlas_clip_links(node, role);
```
`wg_traditions / wg_people / wg_edges` (0012) stay; a view `wg_edges_v2` can expose `atlas_edges` with `legacy_type` for old readers.
Corrections from users go to an `atlas_suggestions` queue (node/edge id, proposed change, source URL, user), never straight into the graph.

### 6.3 How talks attach to nodes
- `by`: `clip.speaker` = node id (exists today). `about`: `clip.figures[]` (exists; title/description aliases, and 4+
  transcript mentions, which stay internal). Both become `atlas_clip_links` rows at build time.
- `topic`: clip topics map to concept nodes (`rebirth` → `c-rebirth`, `kamma` → `c-karma`, `self/self-enquiry` →
  `c-self-enquiry`, `jhana` → `p-jhana`, `meditation/breath` → `p-anapanasati`); extend `TOPIC` in `build.py` as the
  topic schema grows, so concept threads can say "66 talks on rebirth".
- `passage`: a virtual clip (`videoId@start`) can attach to a **text** node when the talk expounds that text (e.g. a
  Vijñāna Bhairava dhāraṇā), with `start_sec/end_sec`; the panel then offers "Hear a passage on this".
- The panel already shows counts; on the site it should list the top talks and offer "Play a resonance round from this
  lineage" (pairs drawn from nodes in `lineageChain(id)`), and topic pages can link "See this thread on the Atlas".

### 6.4 Open data and MCP
- Public read API (`api.tantrafiles.xyz/atlas/…`): `GET /atlas/node/:id`, `/atlas/lineage/:id?hops=n`,
  `/atlas/thread/:concept`, `/atlas/stream/:id?from=&to=`, `/atlas/path?from=&to=` (shortest influence path, e.g.
  Plotinus → Corbin), `/atlas/scholar/:id/works`.
- MCP tools alongside the planned ones: `get_lineage`, `get_concept_thread`, `find_path`, `get_scholarship(text)`
  (who edited/translated a text, with DOIs), `when(id)` (fuzzy dates with basis), `contested(id)`.
- Dumps: `atlas-nodes.jsonl`, `atlas-edges.jsonl` under CC BY 4.0 for our curation (Wikidata ids are CC0; Wikipedia is
  cited, not copied); JSON-LD on node pages (`schema:Person` / `CreativeWork` / `DefinedTerm`, `sameAs` Wikidata,
  `isBasedOn` for provenance); `llms.txt` pointing at the dumps. Never transcripts.

### 6.5 User curations
A curation is an ordered path through the graph plus talks: "From Plotinus to Corbin", "Rebirth in five traditions",
"The Kagyu line in 10 talks". Store `curations(id, author, title, intro_md, status)`, `curation_items(curation, ord,
node|edge|clip, note_md)`; render as a thread on the Atlas (the same gold flowing line) and as a page like `#topic/`.
Users can attach essays (KaTeX allowed) to nodes or edges; they show under "Readings" in the panel, moderated, never
merged into the graph without review.

## 7. Scholars layer → prx0r/openpatala (read-only look, 2026-10-20)

openpatala (README points to the repo as `prx0r/wiggly`) is "the identity, provenance and epistemic memory layer"
for Sanskrit works: opaque ids (`PTW_` work, `PTP_` person, `PTED_` edition, `PTTR_` translation, `PTMS_` manuscript),
`ExternalIdentifier` with schemes PANDIT, GRETIL, DOI, ORCID, WIKIDATA, ARCHIVE_ORG, IIIF, CTS…, assertions with
`epistemic_mode` and `asserted_by`, an append-only event ledger, a translation-availability index (260 works, keyed by
slug: `tantraloka`, `isvarapratyabhijnakarika`, `netratantra`… with translators, tiers A/B, copyright hints) and an MCP
server (`resolve`, `get_bundle`, `search`, `get_frontier`, `get_health`).
How the two link:
- **Text nodes ↔ patala works.** `crosswalk-openpatala.json` already matches 18 atlas texts (Tantrāloka, Tantrasāra,
  ĪPK, ĪPV, Pratyabhijñāhṛdayam, Śivadṛṣṭi, Śiva Sūtras, Spanda Kārikā, Vijñāna Bhairava, Mālinīvijayottara, Niśvāsa,
  Svacchanda, Kulārṇava, PTV, Bhagavad Gītā, Kaṭha, Śvetāśvatara, Atharvaveda). Store the patala id in `node.ids.patala`
  once its `PTW_` ids are stable; until then the slug.
- **Scholar works ↔ patala editions/translations.** Each `works[]` item (`critical_edition`, `translation`) is a patala
  `EDITION` or `TRANSLATION`; join on DOI where present, else title + year; store `work.ids.patala`. Scholars ↔ patala
  `PERSON` via ORCID / Wikidata.
- **Coverage questions.** patala's `get_frontier` (works lacking translations) × the atlas tells us which texts that
  matter to a lineage have no English (a "translate next" list for the translating-works pipeline).
- **Syllabuses.** A syllabus = ordered steps, each a `practice` node (practice schedule) or a `text` node + passage range
  (theory), with talks attached. Practice steps link to deitybody frameworks (`site/frameworks/<id>/practices/*.json`)
  through a `visual_spec` id; theory steps link to patala passages and available translations; rendered videos attach
  as clips. The Atlas shows a syllabus as a thread, exactly like a concept thread.
openpatala was not modified.

## 8. Notes for the integrator

- `app/wisegraph/` changed during this run (the places merge added `places.json`, more people and a `studied_with` edge
  type). `import_v1.py` reads it live and maps `studied_with` → `teacher_of`; re-run it after every integrate.
- The backbone duplicates no v1 ids: 91 v1 people and 14 v1 traditions are *the same nodes* (labels and dates from the
  backbone win in the atlas; v1 stays the source for bios, works, links and portraits).
- No scheduled tasks were created. No files outside `work/wiser/atlas/` were written (the openpatala and deitybody
  clones live in `/tmp`).
