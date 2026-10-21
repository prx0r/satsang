# REPORT — 51-nibbana-movie (2026-10-20, extension pack)

The Nibbana movie: 12 levels from settle to what-remains, each with
teaching, timer-native practice, and behavioural validation gate.
Six new practices supplement the graph (packs 43-45).

## Files

| file | what | status |
|---|---|---|
| nibbana-movie.json | 12-level manual + runtime spec | new, structured data |
| sources/nibbana-movie/practices.json | 6 new practices | new, own-words howto, free source |
| sources/nibbana-movie/REPORT.md | group evidence (merger requires it) | ships |

## Verification

- JSON parses (checked at pack build).
- New practices avoid the NEEDS regex — all build with needsTeacher: false.
- Reused practice ids exist in packs 43-45 (ease-through-the-body,
  concept-deconstruction, seeing-right-view, signless-concentration,
  four-establishments, vbt-inner-outer-spaces, vbt-mind-between-objects,
  vbt-sound-dissolution).
- No transcripts, no media blobs. RIGHTS.md §3 compliant.
- Level 12 deliberately has no gate — the runtime never marks it complete.

## What is NOT here

- TTS scripts per level — the pattern is VBT-INTERACTIVE.md (pack 45).
- Client runtime code — the spec is here; the engine is the next build.
- The movie itself (video) — HyperFrames pipeline (pack 48/49) is the renderer.
