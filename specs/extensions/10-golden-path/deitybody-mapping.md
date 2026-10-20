# Mapping: deitybody CATALOG → satsang entities

Source taxonomy (`deitybody/docs/CATALOG.md`): tradition → school →
source → course → phase → practice (ONE runnable: body preset + sound +
timed score). Statuses: live / verify / stub / planned / needs_review
(one-way promotion by human review; nothing promotes itself).

| deitybody node | satsang entity | notes |
|---|---|---|
| tradition / school | Tradition (family/school/lineage) | direct; deitybody `yoga`, `trika`, `theravada` map to same slugs |
| source (book/teacher/oral) | Text / Person | source cites become `practice.sources[]` + `practice.texts[]`/`teachers[]` (10-links pattern) |
| course | Collection (`kind: syllabus`) | ordered units; see syllabus-mapping |
| phase (gated step) | Collection unit + `checkpoint` | exit test → checkpoint string |
| practice (runnable) | Practice + `visual` spec | steps[] + seconds + cue; visual in `app/wisegraph/visuals/` (04 pattern) |
| `needs_review` | **gap** | incoming compiler output must never render: proposed `practice.status` |
| `verify` | proposed `practice.status: verify` | encoded, needs checking against source before teaching |
| `live` | proposed `practice.status: live` | reviewed, on the menu, playable |
| `stub`/`planned` | topic-style `state` or omit | structure without content stays out of the build |

Schema proposal (`specs/schema/practice.json`): add optional
`"status": {"enum": ["live", "verify", "stub", "planned", "needs_review"]}`.
Default when absent: `verify` (safe: timer shows the orientation caution
until a human marks live). The Sivananda framework (`sivananda-k`,
currently `incoming-needs-review` with 4 compiled practices:
cakra-tour, granthi-piercing, kundalini-ascent, nadi-shodhana) is the
pilot: promote its practices through this field, never by editing content.
