# Satsang: the awakening algorithm (spec v1, 2026-11-04)

> **Status (2026-11-04):** **not started** as a feature. Shipped with this spec: a slice-1 proof only
> (`tools/awaken/journal-signals.mjs` + `test-journal-signals.mjs`, 10 tests, local, no UI, no deploy). Interfaces for the
> scholar track: `specs/INTERFACES-TRACK-A.md` + `specs/interfaces/*.schema.json`. Owner questions: §13.

Owner's intent (2026-11-04, paraphrased): everything built so far becomes one algorithm for awakening. The owner writes a
journal (nibbanahelp); Satsang reads it and serves what is most spiritually **urgent** for this person right now (talks,
series, practices, places and teachers, texts), not only what is similar. Downstream, translated texts become videos and
lessons, chat steers it and asks for new content, and deitybody draws the practices.

Two tracks:
- **A, scholar** (other agents own it): ipvv + svread (reading), translation-work (the canonical translation stack),
  tantrasara (the video factory). This spec only defines A's **interfaces** to B.
- **B, practitioner** (ours): Satsang, Trika practice, all the spiritual content, and the For You that reads the journal.

The rule the whole spec keeps: **relay, never advise.** Every recommendation points at a real thing by a real teacher or
text; Satsang writes labels and why-lines in its own words and never generates guidance, never diagnoses, never judges
attainment.

---

## 1. What exists today (read 2026-11-04, from code and live sites, not READMEs)

| Repo | What it actually is today | Live | What B can use now |
|---|---|---|---|
| **prx0r/satsang** (this repo) | Directory of traditions: 9,986 official talks (gold 246 / strong 1,198), 22 series, 85 practices with cautions and minutes, 963 places, 764 people, 184 tradition nodes, public safety records (person + place). For You (`src/feedrank.js`, `src/foryou.js`) ranks **talks only**, with taste (Beta facets), intentions (20 chips + free text, keyword-matched, device-first, synced via `PUT /intentions`), daily theme, MMR, exploration. Curator chat (`chat/worker`): deterministic safety triage → intent → BM25 → a dated path pack; no model needed. Open MCP/REST. Practice engine preview (`engine/`, /sit/). | tantrafiles.xyz, mcp., api., chat., engine. | everything below plugs into these |
| **prx0r/nibbanahelp** | A public day-by-day journal + "second brain" in markdown + git. Content types: `entries/` (one diary per day, header `day`, `visibility`), `essays/`, `tensions/` (persistent knots: `id, status open/loosening/resolved, domain, roots [lobha/dosa/moha], summary` + dated progress notes), `advice/` and `sessions/` (verbatim, immutable), `roots/graph.yaml` + antidotes. Worker: upload (notebook → R2 → cron sync → git), a relay chat that never advises (bge-m3 embed → rerank → tiered verbatim relay; a model drafts only from the relay block), Google sign-in, `GET /journeys.json` (public handle, start date, current day). `tools/me.py` + `tools/watch_queue.py` already build a private "model of me" and query Satsang's REST for a watch queue. Specs (not built): `profile-bridge.md` (export a consented bundle to Satsang), `trajectory-endgame.md` (typed trajectories, ≥ 3 transitions before any pattern speaks), `jev-register-gate.md`. **No RSS/JSON feed of posts yet.** | nibbana.stonedoorway.com | the posts (public files), tension headers, journey day |
| **prx0r/ipvv** | Trika translation + argument + essay platform and its data backend: per-work translation JSON (`site/data/translations/<work>.json`, chunk ids like `ajad-p01-v01`, per-chunk `checks` and `gate` PASS/BLOCKED, `needs: [human-review]`), argmaps, C1 commentary, essays (22), essay objects, 112 VBT practices, karaoke + R2 audio for chants, scholars/authors, `works-index.json` (`author:work` keys). Worker `ipvv-api`: RAG chat, MCP (8 tools: get_passage, get_translation, get_argument, search, get_scholar, list_works, get_themes, chat), `/api/read` (Fish TTS of a passage to R2), ORCID scholar accounts, permissioned essay use. Lanes: pipeline agent vs site agent (OWNERS.md). Its HANDOVER is candid: L2 often compressed, most works BLOCKED at the gate, "DONE labels are aspirational". | ipvv-a8u.pages.dev, ipvv-api.tradesprior.workers.dev | gate-PASS passages, essays, chant audio, an MCP to query |
| **svread** (separate repo, not reviewed here) | The reader people use (svread.pages.dev): one HTML + app.js + data vendored from ipvv. | svread.pages.dev | the canonical public URL for a passage |
| **prx0r/translation-work** | The canonical translation stack as data objects: SOURCE (sha-pinned) → T1 → L0 → ARGMAP → L2 → C1 → L3 → L4 (song) → C2 (style renders) → PROOF → SITE, each with a schema and `check.py` gate; scholar versioning with signoffs; rights: **our translation = FREE, scholar words = © their authors**. Also the parable/"seal" short-video concept (PARABLEVIDEO.MD, P1-INDEX: ~25 packages, all MACHINE_DRAFT until owner promotion) and voice scripts. ~100 work dirs (Tantrāloka 37 āhnikas, Tantrasāra 22, stotras, VBT). | via ipvv/svread | `immutable_id`, licence, proof status per chunk |
| **prx0r/tantrasara** | A video factory: slang retelling chapters (22 for Tantrasāra + a 78-unit Śiva Sūtra lane) → frozen storyboards (every paragraph cast to a voice) → Fish TTS (free tier) → word alignment → burned cards (Devanāgarī + IAST + literal + final) → mp4, with binary gates, golden diffs, and an **owner approval file that pins SHAs before any render**. One full chapter video exists on R2; the rest await approval. Review packs publish to R2 for owner sign-off. | R2 public bucket (review packs, ch01 mp4) | approved chapter videos + their storyboard metadata |
| **prx0r/deitybody** | Subtle-body atlas + practice engine (vanilla JS + Three.js): one body rig, tradition overlays, declarative timed "scores" on one clock, provenance on everything (SOURCE_ATTESTED vs PEDAGOGICAL), catalogue tree tradition → school → source → course → phase → practice with status `live/verify/stub/planned/needs_review`. Menu is Trika-only live (Mātṛkā phonemes on the body, PTv nights course, VBT). | body.stonedoorway.com/lab | practice visuals by catalogue id; the score grammar |

Honest gaps that shape this spec: (1) nibbanahelp has no feed and no stable post ids beyond file paths; (2) track A has no
export Satsang can ingest: ids, gates and licences exist but in five shapes; (3) Satsang's For You only ranks talks;
(4) nothing measures whether a recommendation helped.

---

## 2. System map

```
                    ┌──────────────── TRACK A (scholar; other owners) ────────────────┐
 Sanskrit sources ─►│ translation-work (T1…L4, PROOF) ─► ipvv site data ─► svread reader│
                    │        │                     essays, argmaps, chant audio          │
                    │        └─► tantrasara factory (storyboard → TTS → mp4, owner-approved)│
                    │        └─► parable shorts (P1 seals, owner-approved)               │
                    └───────────────┬────────────────────────────────▲────────────────┘
                     satsang-ingest/1 export (§3)            generation-request/1 (§10)
                                    ▼                                │
 nibbanahelp journal ──feed──► [device] journal signals (§4-5) ──► urgency ranker (§6) ──► For You
   entries/essays/tensions         concerns · safety · level            │   ▲                  │ "because you wrote…"
                                          │                             │   │ taste, intentions,  ▼
                                          ▼                             │   │ resonance       plays, saves, "not this"
                                 private profile (device;               │   │                      │
                                 optional anonymous sync)               │   └──────────────────────┘
                                          ▲                             ▼
 chat (#ask / chat.tantrafiles.xyz) ─steer/ask (§8)─┘        content-gap queue (§10) ─► owner approval ─► request to A
 deitybody catalogue ── practice visuals by id (§3.4) ──► Satsang practice pages / /sit/ player
```

Data flows, one line each:
1. **Journal → signals**: the browser fetches the public feed of the journal it was told to follow and computes concerns
   on the device (§4). Nothing derived leaves the device unless the person turns on sync.
2. **Signals → profile**: concerns become *journal intentions* in the same shape as today's intentions (so For You, the
   Topic flash and the chat all read them without new plumbing), plus a safety state and a coarse practice level.
3. **Profile → urgency ranker → For You**: the ranker picks the most urgent need first, then the best real item of the
   right *kind* for it (§6), alongside the existing taste-driven feed.
4. **A → B**: track A publishes `satsang-ingest/1` records for gate-PASS, rights-clear items; Satsang's build ingests them
   as texts, lessons, videos and practices with topics and tradition ids (§3).
5. **Chat → steering and requests**: chat turns write intentions ("more of this", "not now") and content requests (§8).
6. **Gaps → generation**: unmet urgent needs are counted, the owner approves, and a request goes to the owning A repo;
   the made thing comes back through (4) and is offered to whoever asked (§10).
7. **deitybody → practice visuals**: a Satsang practice links to a deitybody score id; the visual is drawn there or in
   the engine player (§3.4).

---

## 3. The A → B content contract (summary; full contract in `specs/INTERFACES-TRACK-A.md`)

Track A publishes one JSON file per repo at a stable public URL: `{"format": "satsang-ingest/1", "publisher": ..., "built":
..., "items": [...]}`. Satsang never scrapes A's pages and never reaches into A's repos; it reads the export at build time.
Schema: `specs/interfaces/satsang-ingest.schema.json`.

### 3.1 What every item must carry
| Field | Why B needs it | Where A already has it |
|---|---|---|
| `id` = `<publisher>:<kind>:<native id>` (immutable) | dedupe, links, "seen", requests closed by id | ipvv chunk ids, translation-work `immutable_id`, tantrasara `chNN`, deitybody catalogue ids |
| `kind`: passage · essay · lesson · video · audio · practice · chant | picks the For You format per need (§6.3) | implicit today |
| `title`, `summary` (A's own words, ≤ 300 chars, no quote over 25 words) | cards, search | C1 essence / essay intro |
| `url` (public page) and, for media, `media {url, host, duration_s, captions_url}` | play / open | svread URL, R2 mp4 |
| `work {id, title, author}` + `tradition` (a Satsang tradition id, e.g. `kashmir-shaivism`) | facets, taste, lineage pages | works-index `author:work` |
| `people`: Satsang person ids (authors, teachers voiced) | teacher pages, held-teacher filter | authors/scholars json (map once) |
| `topics`: `[{id, w, basis: manual|rules|model}]` using Satsang topic ids (`app/schema/topics.json`) | urgency matching | themes / concepts (map once) |
| `concepts`, `practice_links` (Satsang practice ids, deitybody score ids, engine ids) | "practise this" from a passage | VBT map, deitybody catalogue |
| `level`: first-steps · steady · deep | pitch to the person's level | — (new) |
| `safety {intensity 1–5, contraindications[], needs_teacher, initiation_required}` | the same filters the chat applies | practice records |
| `review {status: MACHINE_DRAFT|REVIEWED|ACCEPTED, gate: PASS|BLOCKED, by?, date}` | **ingest gate** | `checks/gate/needs`, signoffs, approved_chNN |
| `rights {licence, attribution, embeddable, quote_limit_words}` | licence gate (Satsang's existing registry rules) | FREE / © scholar / source licences |
| `provenance {source_sha, edition, pipeline, version, model?}` | trust, re-ingest on change | sha-pinned SOURCE, PROOF |
| `updated` | incremental ingest | build dates |

### 3.2 Ingest gate (Satsang side, deterministic)
An item is shown only if: `review.gate == PASS`, `review.status ∈ {REVIEWED, ACCEPTED}` (MACHINE_DRAFT is held: owner
question 2), the licence passes `app/tools/licence_gate.py` rules (link-only for all-rights-reserved, embed only if
`embeddable`), every `people` id resolves and none is a held teacher (`redflags.json` person subjects + HELD_MAIN), every
`topics` id exists, and `tradition` resolves. Failures go to `wisegraph/review-queue.json` with the reason, like every other
pack. No item text is rehosted; Satsang stores the record and links out.

### 3.3 Where they surface in B
Passages and essays → "Texts" (the resource cards and `/resource/<id>` pages) and For You "read" slots; videos and
lessons → talk-like cards (non-YouTube media plays in Satsang's own player with the host's URL); chants and practices →
Practise tab and the engine. All carry the A attribution line.

### 3.4 deitybody
deitybody stays the visual engine. Contract: a Satsang practice may carry `visual: {provider: "deitybody", id:
"<catalogue node id>", status}`; Satsang renders a "See it on the body" link (and later an embed) only when the node's
status is `live`. deitybody exports its catalogue (`site/data/catalog.json`) as `satsang-ingest/1` items of kind `practice`
with `provenance.basis: SOURCE_ATTESTED|PEDAGOGICAL`; `needs_review` nodes never cross.

---

## 4. Journal → signals (no model)

### 4.1 Source
- **Target**: nibbanahelp adds `GET /feed.json` (JSON Feed 1.1) on its Worker, public items only, CORS open to Satsang's
  origins. Item: `{id: "<diarist>/<kind>/<slug>", url, date_published, date_modified, title, content_text, _nibbana:
  {kind: entry|essay|tension, day, status, domain, roots, summary, visibility: "public"}}`. This is nibbanahelp's lane:
  Satsang asks for it, does not build it there.
- **Until then**: the public GitHub repo is the feed (contents API → `entries/`, `essays/`, `tensions/` markdown, header
  blocks as schema; journey start from `/journeys.json`). The proof reads a local clone.
- **Consent**: Satsang reads a journal only when its owner pastes the feed URL (or handle) into Your model → "Read my
  journal". Satsang never crawls anyone's journal on its own, and never reads `visibility: private` items even if served.

### 4.2 Per post, deterministic (all reused, no new vocabularies to maintain twice)
1. Split into paragraphs; per paragraph run `matchText` (the intention keyword regexes, `app/src/intentions.js`) plus the
   few extra concern patterns (doubt, dullness, shame and self-judgment, money and livelihood: the hindrances and knots the
   chips lack). Each hit adds `1/√(hits in that paragraph)` so a list of everything counts less than one clear sentence.
2. Run the curator's `triage()` (`chat/worker/src/safety.mjs`) on each paragraph: most severe class wins, negation
   respected, plus the `intense` flag and the disclosed `conditions`.
3. Tension files add their header: `domain` → concern (money → livelihood, addiction → craving, identity → shame,
   relationship, health → illness, doubt), `roots` → lobha → craving, dosa → anger, moha → doubt (weight 0.5), and the
   summary through `matchText`. The tension's `status` is the trend.
4. Practice words (sitting, noting, breath …; jhāna, nimitta, retreat, samāveśa …) count towards a coarse level.

Weights: post kind (tension 1, entry 0.7, essay 0.4 — an essay is a distillation, not a state), recency (full for 14 days,
then half-life 7 days, as intentions), persistence (`1 + 0.25·ln(distinct days)`), trend (open 1, loosening 0.6, resolved
0.15).

### 4.3 With a free or local model (optional, never required)
- **Embeddings** (Workers AI free allocation, `@cf/baai/bge-m3`, which nibbanahelp already uses; or a local model on the
  owner's box): embed each paragraph once; concern prototypes are the embedded chip labels + their topic labels; cosine
  above a calibrated floor adds evidence with `basis: model`. Catches "I keep snapping at my brother" without the word
  anger. Calibration set: 40–60 paragraphs labelled by the owner (§11).
- **Fenced extraction** (local Ollama model, or a Workers AI instruct model within the free allocation): the model may only
  choose concern ids from the closed list and return paragraph indices as evidence; code verifies the indices and drops
  anything else (the TEXT-TO-PRACTICE rule: the model never writes values the code cannot check). Fail-open to rules.
- A model never writes a why-line, a label shown as the person's words, or advice. No paid model, ever (BRIEF rules).

### 4.4 Output (private)
```json
{ "version": "satsang-journal-signals/0.1", "built": "…",
  "concerns": [{ "id": "grief", "label": "Grief", "need": "issues", "U": 0.71, "standing": false, "trend": "open",
                 "topics": {"death": 1, "impermanence": 1}, "evidence": [{"doc": "entries/day-06.md", "day": 6, "date": "…"}] }],
  "safety": { "class": "soften", "at": "…", "intense": false, "conditions": [] },
  "level": { "value": "steady", "basis": "practice words in your posts (not a judgement of attainment)" } }
```
Stored as `localStorage wiser.journal` (with the feed URL and fetch time). Evidence is ids and day numbers, never text.

---

## 5. The spiritual-urgency model

### 5.1 Urgency is not relevance
| | relevance (today's For You) | urgency (new) |
|---|---|---|
| question | what will resonate with this taste? | what does this person most need to meet **now**? |
| driven by | resonance picks, plays, saves (Beta facets) | what they are going through, from their own writing |
| time | slow, cumulative | fast, decays in weeks, ends when the knot loosens |
| target | more of what they like | the **antidote** and the next step, often not what they like |
| item kind | talks | the kind the need calls for: a practice for an active obstacle, a talk for a question, a text for a doctrinal question, a place or teacher for readiness to go deeper |
| failure | stale, samey | intrusive, wrong, or harmful: hence §7 |

### 5.2 Need strength
For each concern `c`:
```
U(c) = 1 − exp(−raw/4)
raw  = needW(c) · Σ_posts [ hitWeight · kindW(post) · recency(post) ] · persistence(c) · trend(c) · standingDamp(c)
needW: something being gone through (issues, hindrances) 1.0 · a goal 0.6 · a curiosity 0.4
standingDamp: 0.35 when the concern appears in > 60 % of ≥ 4 posts (the journal's constant theme is taste, not urgency)
```
Evidence from the proof run on the live journal (2026-11-04): without `needW` and `standingDamp` the journal's constant
subject (awakening) and its spiritual vocabulary filled the top; with them, the top concerns were the ones the open tension
files name, and curiosities fell below them. Precision is unmeasured until the owner labels a set (§11).

### 5.3 Stage, obstacles, questions, without a diagnosis
- **Obstacles** = concerns with `need: issues` (the five hindrances + life knots).
- **Questions** = curiosities (rebirth, consciousness, non-duality, the texts …) and posts with question marks on a topic.
- **Practice level** `new | steady | deep` from practice words and the journey day: used only to pitch items (practice
  `level`, talk length, first-steps collections), shown as "Pitched at: steady practice · change", always overridable.
  Satsang never infers or names an attainment, a stage of insight, a dark night or a mental state.
- **Trend** comes from the person (tension status they set), not from Satsang's guess.

---

## 6. For You ranking changes (building on FORYOU.md and RANKING.md)

### 6.1 Slice 1 (minimal change)
Journal concerns enter `rankFeed` as intents (`X.intents`) with `source: 'journal'`, `w = U`, and their own `why`:
```
intent term:  +0.30 · match(c, concern.topics) · U          (unchanged formula; journal intents share the ≤ 50 % intent cap)
why line:     "Because you wrote about grief (day 6)"         (feedrank whyOf: use it.why when present)
row:          a "From your journal" rail on For You (≤ 6 cards: top 2 concerns × best 3 items), above the main list
```
`journalIntents()` in the proof already emits this shape.

### 6.2 Urgent slot (phase 2)
Per 10 cards, slot 1 and slot 6 are **urgent** slots when any concern has `U ≥ 0.35`:
```
urgent(c, item) = U(c) · fit(item, c) · formatFit(item.kind, c.need) · q(item) · levelFit(item) · safeOK(item)
fit       = max over topics of concern.topics[t] · item topic conf    (antidote-weighted chip topics, e.g. craving → sense-restraint)
formatFit = issues: practice 1, talk .8, series .7, text .4 · questions: talk 1, text .9, series .8, practice .3
            goals ("go deeper", "awakening") + level deep: place/retreat .9, teacher 1, series .9
levelFit  = 1 at the person's level, .6 one step off, 0 two steps off for practices
safeOK    = 0 for any item the safety state excludes (§7.2); 0 for held teachers and their talks
```
Rules: at most 2 urgent cards in the first 10 and 3 a day; one concern never takes both slots; an urgent item dismissed
("Not this") mutes its concern for 30 days; a concern served 3 days running without a play steps down a slot (no nagging).

### 6.3 New candidate kinds
For You today ranks talks only. Phase 2 adds practices (85 records with topics, minutes, cautions, needsTeacher), series
and collections, texts (resources + A's passages and essays), places with programmes, and teachers. Each kind gets a card
already used elsewhere on the site; the main list stays talk-first; other kinds appear mainly through urgent slots and the
journal rail.

### 6.4 Unchanged
Taste, MMR, exploration slots, daily theme, novelty and impressions, the teacher/topic hard rules, determinism per
(day, device). Cold start without a journal is today's feed exactly.

---

## 7. Guardrails

### 7.1 No diagnosis, no advice, no voice theft
- Labels are Satsang's chip labels ("Grief", "Shame and self-judgment"); why-lines are "Because you wrote about <label>
  (day N)". A lint (`BANNED` in the proof: depressed, disorder, addicted, psychosis, dark night, enlightened, attained …)
  fails the build if any why or label template could apply such a word to the person.
- Never quote the person back at length (≤ 8 words, and only from a post they marked public); never present generated
  text as theirs (nibbanahelp's VOICE RULE).
- Never claim an outcome ("this will help"). Copy is pointers: "a talk on…", "a practice for…".

### 7.2 Safety from posts (reuses the curator triage verbatim)
| Journal safety class (most severe in the last 14 days) | For You does |
|---|---|
| crisis (self-harm wording) | Top card is the curator's crisis card (same wording and lines as the chat, `LINES.crisis`); urgent slots off; no practices with breath work or intensity > 1; no "go deeper" items. Stays until 14 days pass with no such wording. Nobody is notified; nothing is sent anywhere. |
| emergency | The medical-help card first; no practice suggestions that day. |
| unsettled (voices, spiritual emergency, days without sleep) | The "talk to a person" card; only grounding practices (walking, kindness, gentle body); no esoteric, kundalini, retention or tantric practice; no retreat or guru suggestions. |
| stop / soften (panic, anxious, grief, trauma) | Gentle mode: no holds, intensity ≤ 2, the gentle note once on the rail. |
| intense flag (asks for retention, kundalini) | Orientation only, as the chat does. |
| conditions disclosed | practices whose cautions name the condition are dropped (`practiceExcluded`). |
False positives (a sutta quote about death) cost one gently worded card; false negatives are why the class only ever adds care
and never removes the person's own choices.

### 7.3 Teachers and places
- Held teachers (person safety records, e.g. Sogyal, Maezumi, Yogi Bhajan, Swami Rama, Vishnudevananda, Shankarananda; and
  HELD_MAIN) are never surfaced by the urgency ranker, even on a perfect topic match; their talks stay findable by direct
  search as today.
- Places with a place-level safety record are never an urgent suggestion; they show their record wherever they appear.
- Teacher-only practices (`needsTeacher`, `initiation_required`) appear as orientation plus "where it is taught".
- The ranker never pushes dependency on a guru: "teacher" urgent items are always ≥ 2 options from different lineages.

### 7.4 Getting off the screen
The journal rail ends with "Enough for today" after its cards; urgent practice cards default to a timer, not a video;
nothing in the urgency layer uses streak pressure or notifications.

---

## 8. The chat feedback loop

Satsang's chat (`#ask` on the site, the `satsang-chat` Worker) already parses intent deterministically. Three additions:
1. **Steering** (device-local, same intentions store, `source: 'chat'`): "more like this / less of this / not now /
   I'm going through X / I'm ready to go deeper" become intention writes or mutes. The chat replies with what changed
   ("For You will lean towards grief for two weeks").
2. **Asking for content**: "is there a video on …", "make a lesson on verse 12" → if the catalogue has it, link it; if not,
   a `generation-request/1` record (§10) with `requested_by: device` and the topic/work; the reply says honestly that a
   person reviews requests and nothing is promised.
3. **Outcomes**: a chat pack saved as a journey, items played to the end, and tension status changes in the journal are
   the only success signals. They feed taste (as resonates do) and, in phase 5, outcome learning with nibbanahelp's
   ≥ 3-transitions rule: never "people like you", never prediction copy.
Owner steering: the owner's own chat turns use the same mechanism; there is no hidden admin channel into other people's feeds.

---

## 9. Privacy

- The journal is public; the **derived profile is private**: concerns, safety class, level and evidence ids live on the
  device (`wiser.journal`). They are never in the public repo, the open data dumps, the MCP, the search index, logs or
  analytics. The proof writes to `tools/awaken/out/` (gitignored).
- Sync is opt-in and anonymous, identical to intentions (`PUT /intentions`, device id, newest wins, in Download my data,
  removed by Delete everything, `/me/forget-device`, `DELETE /me`). The server stores the derived concerns, never the posts.
- "Stop reading my journal" deletes `wiser.journal` and the feed URL at once.
- Aggregates for content gaps (§10) are counts by concern id and topic only, kept server-side only once ≥ 5 distinct devices
  share a cell; until then gaps are computed from the owner's own device and the chat requests.
- Satsang does not read another person's journal unless that person connects it.

---

## 10. Content gap → generation queue (human approval)

```
demand(cell) = Σ_devices U(concern) for concerns mapping to (topic, tradition?, kind, level)  + 1 per chat request
supply(cell) = reviewed items in that cell (gold/strong talks count 1, standard .5, A items 1)
gap(cell)    = demand · (1 − min(1, supply/3)) · feasible(cell)
feasible     = 1 if a gate-PASS, rights-clear A source exists for the topic (e.g. a translated verse on it), else .3 (talk sourcing)
```
1. A nightly job (or the owner's box) writes the top gaps to a **private** queue (private satsang-data repo or local file,
   never the public repo): `{cell, gap, sources: [ingest ids], suggested_kind, requested_by: [device ids hashed]}`.
2. The owner approves, edits or drops each row (a short review page or a markdown table; owner question 3).
3. Approved rows become `generation-request/1` records (`specs/interfaces/generation-request.schema.json`) filed with the
   owning A repo (a file in its `requests/` folder, or an issue): tantrasara for chapter/verse videos, translation-work for
   a passage or a parable short, ipvv for an essay. A's own gates and approvals (approved_chNN, PROOF, signoffs) apply.
4. When A publishes the result, its ingest record carries `fulfils: [request id]`; Satsang closes the request and offers
   the item once to each requesting device ("Made after you asked"), then it ranks like anything else.
Satsang never generates the content itself and never spends credits to do so.

---

## 11. Acceptance tests

Slice 1 (proof shipped: `node tools/awaken/test-journal-signals.mjs`, 10 pass, synthetic posts only):
1. A recent grief post makes grief the top concern and sets the soften class.
2. Crisis wording sets the crisis class; the most severe class wins.
3. Negation does nothing ("I am not anxious").
4. Private items are never read.
5. A loosening tension weighs less than an open one, and is labelled loosening.
6. Old posts fade (half-life 7 days after 14).
7. A new need and an older interest are both kept (ordering is the ranker's job).
8. Why-lines start "Because you wrote about", are ≤ 80 chars and pass the banned-word lint.
9. Deterministic for the same input and day.
10. 60 posts in < 50 ms.

Slice 1 UI (to write with the feature):
11. With a journal connected, For You shows the "From your journal" rail with ≤ 6 cards whose why-lines name a concern and
    a day; without one, For You is byte-identical to today's for the same device and day.
12. Crisis fixture: the crisis card is first, no practice with breath work in the first 20 cards, no urgent slots.
13. Held-teacher fixture (a perfect topic match by a person with a safety record): never in the rail or urgent slots.
14. "Not this" mutes the concern for 30 days; "Stop reading my journal" empties the rail and `wiser.journal`.
15. Download my data includes the journal profile; Delete everything removes it locally and from the sync row.
16. Guard: `deploy.sh guard` + `secret-scan.sh` fail if any `tools/awaken/out` file or a `wiser.journal` payload is in dist,
    open data or the repo.
17. Owner-labelled evaluation: on 40–60 of the owner's own paragraphs (labels kept private), top-3 concern precision ≥ 0.7
    before the urgent slot (6.2) turns on.

---

## 12. Roadmap

| Phase | What | Owner of the work | Done when |
|---|---|---|---|
| 0 (this commit) | Spec, interfaces, slice-1 proof (rules, tests), OPEN-THREADS S38 | Satsang | tests pass; nothing deployed |
| **1 – first shippable slice** | nibbanahelp `/feed.json` (or GitHub fallback) → `app/src/journal.js` (the proof's pure functions moved into the app) → "Read my journal" in Your model → journal intents → "From your journal" rail with why-lines + safety states + mute/disconnect; tests 11–16 | Satsang (+ a one-route ask to nibbanahelp) | live behind the Your model toggle, owner uses it a week |
| 2 | Urgent slots; For You candidates beyond talks (practices, series, texts, places, teachers) with formatFit and levelFit; chat steering writes; owner-labelled eval (test 17) | Satsang | precision ≥ 0.7; owner says the order feels right |
| 3 | A → B ingest: `satsang-ingest/1` exports from ipvv/translation-work (gate-PASS, reviewed), tantrasara (approved videos), deitybody (live catalogue nodes); Satsang ingest gate + Texts/Video/Practice surfaces; optional embeddings (free) and fenced extraction | A owners export; Satsang ingests | ≥ 1 export per A repo validates and shows on the site |
| 4 | Content-gap queue + owner approval + `generation-request/1` to A; "Made after you asked" | Satsang + A | first requested video/lesson delivered end to end |
| 5 | Outcome learning (journal tension status, journeys) with ≥ 3-transition rule; practice visuals embedded from deitybody in the sit player | Satsang + nibbanahelp | a pattern only speaks with ≥ 3 supporting transitions |

---

## 13. Open questions for the owner
1. **Where the journal profile lives**: device-only first (the browser reads the public feed; recommended), or also
   synced so it follows you across devices?
2. **Machine drafts from track A**: may Satsang show gate-PASS items still marked MACHINE_DRAFT, labelled "draft
   translation", or only REVIEWED/ACCEPTED ones (current proposal)?
3. **Generation requests**: only yours, or any visitor's chat requests too (always behind your approval), and where you
   want to approve them (a page, or a markdown table in the private data repo)?
