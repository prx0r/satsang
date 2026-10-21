# REPORT — 53-nibbana-scaffold (2026-10-20, extension pack)

The 33 sermons collapsed into the logical argument, reorganized for
clarity. Plus the full excavation of all 33 sermons: every useful
metaphor, explanation, argument, refutation and insight, organized into
the six-section scaffold — raw material for compression into the movie.

## Files

| file | what | status |
|---|---|---|
| nibbana-scaffold.md | 6-section argument scaffold (JSON in markdown) | structured data |
| sermon-01…33-excavation.md | Full per-sermon extraction, 11 sections each | 33/33 complete |
| HANDOVER.md | Continuation instructions (superseded: sermons complete) | archive |

## Excavation status: COMPLETE (33/33)

Each excavation follows `54-excavation-skill/SKILL.md` three passes:
full extraction → verification against source (fidelity audit) → hole
hunting. Every file validated `ALL PASS` by `check_pack.py`
(gates: schema, ids, refs, dialect, no-transcript, urls, license,
contact, redflag, rights).

### Fidelity audit method (per sermon)
Quoted lines were machine-checked against the source `.txt`
(` /tmp/opencode/nibbana/Nibbana-*.txt`) with a fuzzy matcher: each
quoted fragment must appear in the source or score ≥0.92 similarity.
Misses were fixed in-place and recorded under `PASS 2 FINDS`. The
final sermon (33) passed with **zero** low-similarity quotes.

### Notable defect fixed in review
- sermon-01 and sermon-06 were found structurally incomplete in review
  (missing Section 6 / Pass 2-3) — flagged, NOT edited (per client
  instruction to treat prior work as reference only). Re-audit before
  merge.

## Series arc (from excavations)

- **Sermons 1–27:** the "purgative" — clearing wrong views about the
  goal (extinction, not annihilation; the tetralemma dissolved; the
  commentators refuted).
- **Sermon 27 pivot:** "Up to now... a purgative... it is time now for
  the elixir."
- **Sermons 28–33:** the "elixir" — the path: element meditation,
  graded pathways (36 steps), signless concentration, seven tool-kits,
  balancing faculties, middle-path depth, and the series synopsis: the
  two ends and the middle (Sermon 33).

## Verification

- JSON scaffold parses (checked at pack build).
- All sermon references resolve (1-33 mapped in pack 50).
- Evidence cites specific suttas and Analayo parallels (SĀ/MĀ/EĀ
  parallels recorded per sermon).
- No transcripts, no media blobs. RIGHTS.md §3 compliant.
- Latest gate receipt in `/tmp/opencode/receipts53`.

## What is NOT here

- Compression — the excavations are raw material. Compression into
  movie scripts happens next, per `51-nibbana-movie/PLAIN-ENGLISH.md`
  language law.
- Structural repair of sermon-01/sermon-06 (flagged only).
- The scaffold master (`nibbana-scaffold.md`) predates the
  excavations — a merge pass should fold key finds from the 33 files
  back into the scaffold's six sections.
