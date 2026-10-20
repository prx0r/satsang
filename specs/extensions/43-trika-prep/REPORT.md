# REPORT — 43-trika-prep (2026-10-20, extension pack)

Autonomous Trika foundation: one new safe practice + one visual + one
7-day journey reusing two existing deep-tantra practices. No data rows
beyond the practice; no URLs shipped except the inherited dhammatalks
source (see group REPORT).

## Files

| file | what | status |
|---|---|---|
| sources/trika-prep/practices.json | 1 practice: ease-through-the-body-trika-prep | new, own-words howto, publisher-free source |
| sources/trika-prep/REPORT.md | group evidence (merger requires it) | ships |
| visuals/gap-rest.json | deitybody-v1 cues for vbt-breath-pause | new, pedagogical encoding |
| collection-addition.json | trika-prep-week journey, 7 practice-only units | new, zero watch selects |

## Verification

- JSON parses (checked at pack build).
- New practice name avoids the NEEDS regex; builder must emit
  `needsTeacher: false` with generated steps.
- Reused ids (`vbt-breath-pause`, `recognition-contemplation`) exist in
  `sources/deep-tantra/practices.json` — not redefined here.
- No transcripts, no media blobs, no copied instructions. RIGHTS.md §3:
  publisher-free teaching → outline in our own words.

## Deliberately out of scope

Full Tantrasara syllabus, Six Yogas mapping, neelakantha/mantra rows,
retention or lock practices. Those stay teacher-gated; this pack is the
door, not the house.
