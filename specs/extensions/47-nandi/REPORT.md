# REPORT — 47-nandi (2026-10-20, extension pack)

The game: all of Ñāṇananda's work modelled as 12 stages across three
worlds. Each stage is a fabrication to see through. The boss is the
fabrication. The reward is what remains. Nibbāna is not a stage — it is
what remains when you stop fabricating.

## Files

| file | what | status |
|---|---|---|
| nandi-stages.json | 12 game stages across 3 worlds | new, structured data |
| README.md | game design doc | ships |

## Verification

- JSON parses (checked at pack build).
- All practice refs exist: concept-deconstruction-outline, signless-concentration-outline,
  vbt-mind-between-objects, vbt-sound-dissolution, seeing-right-view-outline,
  vbt-body-as-consciousness (packs 43, 44, 45).
- All text refs exist: nanananda-concept-and-reality, nanananda-magic-of-mind,
  nanananda-nibbana-mind-stilled, analayo-nibbana-mind-stilled,
  nanavira-nibbana-anatta (pack 44).
- No transcripts, no media blobs. RIGHTS.md §3 compliant.

## What is NOT here

- TTS scripts per stage — the doctrine (VBT-DOCTRINE.md) and interactive
  design (VBT-INTERACTIVE.md) from pack 45 provide the pattern; each stage's
  TTS script is the next build step.
- Client runtime code — the game engine is the next build step.
- Nibbāna is deliberately not a winnable stage. Stage 12 is always there.
  The runtime never claims you've attained it.
