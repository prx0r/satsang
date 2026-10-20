# Wiser: unified data model (spec, 2026-10-20)

One model for everything Wiser shows, so every view (topic hubs, the Topic-flash loop, profiles, the Atlas, the map,
MCP, dumps) reads the same records. JSON Schemas (2020-12) live in `specs/schema/*.json`, generated from
`specs/schema/gen.py`. `specs/schema/validate.py` checks real data against them: today **3,418 records normalised from
`app/site` all validate** (217 people, 42 traditions, 1,953 clips, 37 texts, 13 practices, 56 topics, 6 collections,
476 places, 618 edges; normaliser = `mcp/build-data.mjs`).

## 1. Principles
1. **Derived, not hand-kept.** Records are built from `wisegraph/*.json`, `clips.json`, the sources folders and the Atlas;
   computed fields (`depth`, `stats`, `inBallot`, `tier`) are never edited by hand.
2. **Stable ids, one per thing.** Local id = lowercase slug (`thanissaro-bhikkhu`), or the YouTube id / `videoId@start` for
   clips, or a slash path for topics (`death/bardo`). The **global id** is `<kind>/<local>` and is also the canonical URL
   path: `https://tantrafiles.xyz/person/thanissaro-bhikkhu`. Renames keep the old slug in `meta.aliases` and 301 to the new one.
   Edge ids are deterministic (`<src>~<rel>~<dst>`) so a fact can never be stored twice.
3. **Metadata only.** No media, no transcript text, URL or path anywhere in a public record (`clip.hasTranscript` is an
   internal flag and is stripped from dumps). Media stays on its host; texts are linked, never rehosted.
4. **Every claim has a source.** `meta.sources[]` and `edge.sources[]` carry `url`, `check` level
   (`work|cited|mentioned|unverified|needs_source|reviewed`) and the source's own licence.
5. **Time is fuzzy.** `fuzzyTime {start, end, precision, basis: documented|scholarly|traditional|estimate, label, alt}`;
   negative years are BCE. The traditional dating is never silently replaced; it sits in `alt`.

## 2. Entities (schema file → what it is)

| kind | schema | key fields | schema.org |
|---|---|---|---|
| Person | `person.json` | `roles[] teacher|scholar|figure|translator|founder|author`, `onVideo`, `traditions[]` (home first), `years`, `living`, `bio`, `works[]`, `image` (Commons only), `ids` (wikidata/orcid/viaf/openpatala), `depth{clips,fullTalks,about,topics,tier}` | `Person` (+`knowsAbout`, `sameAs`) |
| Tradition | `tradition.json` | `kind family|school|lineage|order|stream`, `parent`, `children[]`, `founders[]`, `keyFigures[]`, `symbol{glyph,ink}` | `DefinedTerm` in set `/tradition/` (`broader` = parent) |
| Clip | `clip.json` | `media{provider,videoId,parent,start,end,channel,carrier,embeddable}`, **`orientation{value,verified,method,checked,w,h}`**, `seconds`, `lengthClass short|talk|full`, `delivery talk|reading|footage|guided|dialogue|lecture|chant`, `speaker`, `figures[]`, `traditions[]`, `topics[{id,conf,src,question}]`, `practices[]`, `texts[]`, `stats{bt,btSe,resonates,completion,picks}` | `VideoObject`; virtual clips `["VideoObject","Clip"]` + `isPartOf`, `startOffset`, `endOffset` |
| Text | `text.json` | `kind scripture|sutta|tantra|treatise|commentary|book|essay|translation|critical_edition|article|poem`, `authors[]`, `lang`, `commentaryOn`, `translationOf`, `editions[{url,free,licence,translator,doi}]` | `Book` / `CreativeWork` (`workExample` per edition) |
| Practice | `practice.json` | `kind meditation|visualisation|enquiry|chant|ritual|movement`, `subkind`, `steps[{n,text,seconds,cue,visual,clip}]`, `duration{min,max,default}`, `level`, `posture`, `eyes`, `needsTeacher`, **`contraindications[]`**, `sources[]` (≥1), `teachers[]`, `clips[]`, `texts[]`, `visual` (deitybody id) | `HowTo` (`HowToStep`, `totalTime`, `warning`, `isBasedOn`) |
| Topic | `topic.json` | slash-path id, `parent`, `children[]`, `intro`, `questions[{id,label,blurb}]`, `related[]`, `terms[]` (punabbhava, gilgul…), `takes{tradition: line}`, `atlas`, `state seed|proposed|growing|published|merged|retired`, `mergedInto`, `depth{clips,traditions,teachers,practices,texts,places}` | `DefinedTerm` + `CollectionPage` (`hasPart` Questions) |
| Collection | `collection.json` | `kind set|journey|meditation-series|visualisation-cycle|syllabus`, `units[{n,title,day,track theory|practice|both,intro,items[],practice{id,minutes,timesPerDay,days},checkpoint}]`, `items[{ref,role watch|read|practise|listen|visit|reflect,note,optional,group}]`, `cadence`, `author`, `visibility` | set: `CreativeWork`+`Collection` with `ItemList`; journey/syllabus: `Course` + `CourseInstance(courseSchedule)` + `syllabusSections`; series/cycle: `CreativeWorkSeries` |
| Place | `place.json` | `placeType`, `traditions[]`, `country`, `geo{lat,lng,precision,public}`, `teachers[]` (founders / historically tied), `programmes[]`, `contact{email:[[v,src]],phone,address,page,checked}`, `sisters[]`, `network` | `PlaceOfWorship` / `Place` (`geo`, `address`) |
| Event | `event.json` | `eventKind historical|retreat|course|talk|sit|festival|session`, `when` (fuzzy) or `startsAt/endsAt/tz`, `place`, `online`, `joinUrl`, `recurrence` (RRULE) | `Event` / `EventSeries` |
| Edge | `edge.json` | `src`, `dst` (global ids), `rel`, `lineage dharma|academic|influence|institutional|textual|geographic`, `when`, `conf`, `basis documented|scholarly|traditional`, `contested`, `sources[]` | expressed on Person as `knows` + `Role(roleName)`; raw in dumps |
| Curation / Essay | `curation.json` | id `<handle>/<slug>`, `form curation|essay`, `author`, `visibility public|unlisted|private`, `body` (markdown + KaTeX), `collection` (same item model), `attachedTo[]`, `license`, `moderation{state,reports}` | `Collection` / `Article` |
| Profile (export) | `profile.json` | see PROFILE.md | not published |

### 2.1 Relation vocabulary (`edge.rel`)
- **Dharma lineage**: `teacher_of` (src taught dst), `studied_with` (dst studied under src; never read as "heir"),
  `ordained_by`, `dharma_heir_of` (formal transmission).
- **Academic lineage**: `academic_supervisor_of` (PhD), `edited`, `translated`. Scholars are first-class: Sanderson →
  his doctoral students is the same walk as Ajahn Mun → Ajahn Chah, filtered by `lineage`.
- `influenced`, `commented_on`, `expounds` (person → text/concept), `parallels` (cross-tradition likeness, never a claim of
  borrowing), `founded`, `lineage_of`, `member_of`, `abbot_of`, `teacher_at` (person → place), `sister_of` (place ↔ place).

### 2.2 Clip orientation (verified)
`orientation.verified = true` only when one of: oEmbed width/height (`method: oembed`), the `/shorts/` redirect
(`shorts-redirect`), a player probe, or the Data API `player.embedWidth/Height`. Unverified rows are treated as
**horizontal-unknown**: they may appear on profiles but never in the phone vertical rail or the desktop loop (LOOP §5).
Today: 1,836 horizontal + 117 vertical, all with `formatChecked`.

### 2.3 Practice safety
`contraindications[]` are plain cautions shown above step 1 (e.g. "breath retention: not in pregnancy or with high blood
pressure"; "intense visualisation or kundalini work: not during acute mental-health crisis; keep sits short and eyes
open if trauma surfaces"). `needsTeacher: true` hides the steps behind "This is traditionally given by a teacher"
with the source link and the places that teach it; Wiser never publishes secret or initiation-only instructions.

### 2.4 Collections: one item model, five ways to play
| kind | ordered | plays as | example |
|---|---|---|---|
| `set` | no | a hub-like page, grouped by `group` (often a tradition column) | "Rebirth: read and practise" (6 generated today from hubs) |
| `journey` | yes, `day`-numbered | resumable daily steps, one notification a day at most, progress in the profile | "Seven days with death" |
| `meditation-series` | yes | a playlist of guided practices with a timer between | "Metta in four traditions" |
| `visualisation-cycle` | yes, cyclic | each unit is one visualisation with a deitybody `visual` spec; loops weekly | "Middle Pillar, a week" |
| `syllabus` | yes | two tracks: `theory` units (texts + talks + checkpoint) and `practice` units (daily practice block with minutes/days) | "Trika: Pratyabhijñāhṛdayam in 12 weeks" |
Validation rule: `journey` and `syllabus` must be `ordered: true` (encoded in the schema).

## 3. URLs
Canonical (path) | today's route (hash) | API (future)
---|---|---
`/person/<id>` | `#teacher/<id>` | `GET /v1/person/<id>`
`/tradition/<id>` | `#tradition/<id>` | `/v1/tradition/<id>`
`/topic/<path>` | `#topic/<root>` | `/v1/topic/<path>`
`/clip/<id>` (`%40` for `@`) | `#watch/<id>` | `/v1/clip/<id>`
`/practice/<id>`, `/text/<id>`, `/collection/<id>` | new | `/v1/<kind>/<id>`
`/place/<id>`, `/country/<cc>` | `#place/<id>`, `#country/<cc>` | `/v1/place/<id>`
`/c/<handle>/<slug>` (curation), `/u/<handle>` (public profile) | new | `/v1/curation/<handle>/<slug>`
The Worker serves path URLs by returning the SPA shell with the right `<title>`, description and JSON-LD in the HTML
(server-side, from the same data), then the client maps the path to its hash view. Crawlers and agents get real pages
without a framework; old hash links keep working.

## 4. Licences on records
- `meta.license` = `CC-BY-4.0` for everything Wiser authors (intros, takes, summaries, tags, edges, editorial collections).
- User curations: author's choice (`CC-BY-4.0` default for public; private never published).
- Portrait `image.license` per Commons file. Linked texts: `editions[].licence` as published. Dharma Seed (CC BY-NC-ND):
  play whole, unchanged, credited; never a virtual clip.

## 5. Storage
- Static JSON in `site/data/` stays the read path for the site (fast, cacheable). The unified file
  `mcp/data/wiser.json` (2.3 MB raw) is what the MCP Worker and dumps read; `build-data.mjs` should move into
  `app/tools/` at integration so one build writes both.
- D1 holds only what changes per user or per vote: votes, resonates, events, practice logs, saves, curations, and the
  aggregates (`clip_stats`). See PROFILE.md §7 and ROADMAP.md for migrations.

## 6. JSON-LD mapping
Implemented in `mcp/src/jsonld.mjs` (`toJsonLd(kind, record)`), emitted as one `@graph` in `mcp/dist-data/wiser.jsonld`
(2,800 nodes). On the site each page injects its own node. Highlights: virtual clips are `Clip` + `isPartOf` the
YouTube `VideoObject` with `startOffset/endOffset`; practices are `HowTo` with `warning` from contraindications;
journeys/syllabi are `Course` with a daily `Schedule`; topics are `DefinedTerm` + `CollectionPage` whose `hasPart` are the
sub-questions; lineage is `knows` + `Role(roleName: teacher_of)` on the Person (schema.org has no teacher property).
