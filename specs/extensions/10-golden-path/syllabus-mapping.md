# Mapping: sanskrithelp syllabus → satsang Collection (syllabus)

Source pattern (`sanskrithelp/scripts/build_syllabus.py`): `U(id, title,
phase, track, sources[S(kind, ref)], practice_ref, exit, prereqs, status,
blocks_on)` — units reference material, none copied; content renders FROM
structure; per-unit status; regenerable (`build_syllabus.py` + validation).

Target: Collection `kind: syllabus`, units carry `track`, `practice{id,
minutes, timesPerDay, days}`, `checkpoint`, items `ref+role+note`.

| syllabus field | Collection field | notes |
|---|---|---|
| `U.id` | unit `n` (order) + item group | ids kept in `note` for traceability |
| `title` | `title` | verbatim |
| `phase` | `day` (journeys) or unit order | phases gate: see prereqs |
| `track` | `track` (theory\|practice\|both) | direct |
| `sources[] S(kind, ref)` | items `ref` + `role` | doc→read, audio→listen, data→read, route→visit/practise |
| `practice_ref` | unit `practice{id, minutes, timesPerDay, days}` | parse cadence from the ref string |
| `exit` (graduation test) | `checkpoint` | direct — openpatala-style self-check |
| `prereqs` / `blocks_on` | NOT in schema — **gap** | proposal: `unit.requires[]` (unit indexes); client hides locked units |
| per-unit `status` | NOT in schema — **gap** | proposal: reuse `visibility`-style `state: draft\|live` per unit |

Converter sketch (draft — field decisions above pending integrator):
`scripts/syllabus2collection.py` reads a `syllabus.json` (units +
checkpoints shapes as in `public/memory/syllabus.json`), emits a
Collection draft with `author` set to the source course, every item
`optional: true` until a human reviews, and a REPORT of unmapped refs.
Sanskrithelp's matrika course (`matrka-course-v1`, 26 units) is the
pilot input: its phoneme→locus units map to `practise` items against
deitybody matrika visuals, its checkpoints map to `checkpoint` strings.
