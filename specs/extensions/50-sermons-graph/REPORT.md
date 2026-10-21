# REPORT — 50-sermons-graph (2026-10-20, extension pack)

The complete conceptual map of the 33 sermons. 18 concepts, three
dependency chains, six sermon ranges mapped to visuals.

## Files

| file | what | status |
|---|---|---|
| sermons-graph.json | 18 concepts with dependencies, practices, visuals | new, structured data |

## Verification

- JSON parses (checked at pack build).
- All practice refs exist in packs 43, 44, 45.
- All text refs exist in pack 44 (texts-targets).
- Dependency chains are acyclic (verified: the twelve-link machine, the
  sign chain, and the path through all have clear direction).
- Visual forms map to the dhamma-visual language (pack 49): metal, glass,
  water, spring, valve, pivot, cup, light, stone, spiral, fade.

## What is NOT here

- TTS scripts per sermon — the sermons are Ñāṇananda's actual voice.
  We visualise around his words, not the other way round.
- Client runtime code — the next build step.
- The full anatomy skill quality — the graph drives the visuals; the
  skill builds the geometry.
