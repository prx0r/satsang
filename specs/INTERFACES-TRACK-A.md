# Interfaces for track A (scholar) owners: what Satsang reads and what it sends (v1, 2026-11-04)

> **Status (2026-11-04):** **proposed**, nothing wired. Context: `specs/AWAKENING-ALGORITHM.md` §3 and §10.
> Schemas: `specs/interfaces/satsang-ingest.schema.json`, `specs/interfaces/generation-request.schema.json` (JSON Schema 2020-12).

For the agents who own **ipvv / svread**, **translation-work**, **tantrasara** and **deitybody**. Satsang (track B) does not
write to your repos, does not scrape your pages and does not change your gates. Two touch points only:

1. **You publish** one export file of finished, rights-clear items. Satsang reads it at build time.
2. **Satsang sends** owner-approved content requests to you. You decide whether and how to make them, under your own gates.

## 1. The export you publish (`satsang-ingest/1`)

One JSON file per repo at a stable public URL (suggested, change if you prefer and tell us):

| Repo | Suggested URL | Typical kinds |
|---|---|---|
| ipvv (+ svread links) | `https://ipvv-a8u.pages.dev/data/satsang-export.json` | passage, essay, chant, practice (VBT) |
| translation-work | emitted into the ipvv export (it already emits site data) or its own file | passage, lesson, video (parable shorts) |
| tantrasara | `<R2 public base>/tantrasara/satsang-export.json` | video (approved chapters, sūtra units) |
| deitybody | `https://body.stonedoorway.com/data/satsang-export.json` | practice (live catalogue nodes) |

```json
{ "format": "satsang-ingest/1", "publisher": "ipvv", "built": "2026-11-04T10:00:00Z", "items": [ {
  "id": "ipvv:passage:ajad-p01-v01",
  "kind": "passage",
  "title": "Ajaḍapramātṛsiddhi, verse 1",
  "summary": "Our own one-paragraph statement of what the verse does (≤ 300 chars, no quote over 25 words).",
  "url": "https://svread.pages.dev/#ajadapramatrsiddhi/ajad-p01-v01",
  "work": { "id": "utpaladeva:ajadapramatrsiddhi", "title": "Ajaḍapramātṛsiddhi", "author": "utpaladeva" },
  "tradition": "kashmir-shaivism",
  "people": ["utpaladeva"],
  "topics": [ { "id": "consciousness", "w": 0.9, "basis": "manual" }, { "id": "self", "w": 0.6, "basis": "rules" } ],
  "concepts": ["prakasa", "vimarsa"],
  "practice_links": [],
  "level": "deep",
  "safety": { "intensity": 1, "contraindications": [], "needs_teacher": false, "initiation_required": false },
  "review": { "status": "REVIEWED", "gate": "PASS", "by": "owner", "date": "2026-11-03" },
  "rights": { "licence": "FREE", "attribution": "Translation: ipvv / translation-work (FREE)", "embeddable": true, "quote_limit_words": 25 },
  "provenance": { "source_sha": "sha16…", "edition": "KSTS …", "pipeline": "translation-work", "version": "2.0.0" },
  "updated": "2026-11-03"
} ] }
```
(The values above are illustrative of the shape, not claims about that verse.)

### Field rules
- **`id`** is `<publisher>:<kind>:<your own immutable id>` and never changes for the same thing. Re-publishing a better
  version keeps the id and bumps `updated` / `provenance.version`. Use what you already have: translation-work
  `immutable_id` or chunk id, ipvv chunk id, tantrasara `chNN` / sūtra unit id, deitybody catalogue node id.
- **`tradition`, `people`, `topics`** use Satsang ids. Lists: open-data dumps at `https://tantrafiles.xyz/data/` (`person.json`, `tradition.json`, `topic.json`, `practice.json`);
  topic ids also in Satsang's `app/schema/topics.json` (e.g. `self`, `consciousness`,
  `reality/nonduality`, `meditation`, `texts/tantra`, `divine/goddess`, `death`, `kindness`). An unknown id holds the item
  (it is listed back to you, never guessed). `basis` says how you tagged it: `manual`, `rules`, `model`.
- **`level`**: `first-steps` (no background needed), `steady` (some practice or reading), `deep` (assumes the system).
- **`safety`**: required for `practice` and `chant`; `needs_teacher` / `initiation_required` make Satsang show it as
  orientation plus where it is taught, never as a script.
- **`review`**: Satsang shows an item only when `gate` is `PASS`. `REVIEWED` / `ACCEPTED` items show plainly; `MACHINE_DRAFT`
  items show labelled "draft translation" (owner default 2026-11-04). BLOCKED items never show.
- **`rights`**: `licence` is one of `FREE`, an SPDX id (`CC-BY-4.0`, `CC-BY-NC-4.0` …), or `ALL-RIGHTS-RESERVED`. Scholar
  words (© their authors) are `ALL-RIGHTS-RESERVED` and are link-only in Satsang. `embeddable: false` means link out only.
- **`media`** (video/audio): `{ "url", "host": "r2|youtube|other", "duration_s", "captions_url"?, "poster"? }`. Satsang plays
  R2/other media in its own player from your URL; it never downloads or rehosts.
- **`practice_links`**: ids of Satsang practices (`https://tantrafiles.xyz/#practice/<id>`), deitybody nodes
  (`deitybody:<node id>`), or engine practices (`engine:<id>`).
- **`fulfils`**: request ids this item answers (§2), so the person who asked can be told.
- No transcript text, no full source text, no quote over 25 words in any field. Summaries are your own words.

### What Satsang does with it
Validates against the schema, applies its ingest gate (review, licence, held-teacher, ids), lists failures back in its
review queue (`app/wisegraph/review-queue.json`, kind `ingest-*`, visible in the repo), and shows the rest as Texts,
videos, lessons and practices with your attribution line. It re-reads the file on each data build; removing an item from
your export removes it from Satsang on the next build.

## 2. Requests Satsang sends (`generation-request/1`)

Only after the Satsang owner approves a row in the private gap queue. Delivered as a JSON file in your repo's
`requests/` folder by pull request, or as a GitHub issue with the JSON in the body (your choice: tell us which).

```json
{ "format": "generation-request/1", "id": "req-2026-11-20-01", "created": "2026-11-20",
  "to": "tantrasara", "kind": "video",
  "ask": "A short video on verse 12 of the Bhairavastava for first-steps listeners",
  "topic": "kindness/compassion", "tradition": "kashmir-shaivism", "level": "first-steps",
  "sources": ["ipvv:passage:bh-p12"],
  "why": "gap: 7 urgent needs on this topic, 0 reviewed items at first-steps",
  "requested_by_count": 3, "approved_by": "owner", "status": "open" }
```
- `requests` carry **no personal data**: no device ids, no journal content, only counts.
- Your status back is a field in your export item (`fulfils`) or an edit of the request's `status` (`accepted`,
  `declined` with a reason, `made`). Declining is normal; Satsang never re-files a declined request by itself.
- Your gates stand: Satsang never asks you to skip an approval, a PROOF, a signoff or a render lock.

## 3. Versioning
`format` strings are versioned (`/1`). A breaking change gets `/2` and both are read for one release. Schema files live in
this repo under `specs/interfaces/`; propose changes by issue or by a note in the satsang OPEN-THREADS.
