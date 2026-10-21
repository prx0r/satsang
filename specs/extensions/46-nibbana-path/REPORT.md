# REPORT — 46-nibbana-path (2026-10-20, extension pack)

The removal chain: a dependency graph of fabrications to see through,
based on Ñāṇananda, Ñāṇavīra, and Anālayo. Nibbāna is not a node — it
is what remains when all nodes are seen through.

## Files

| file | what | status |
|---|---|---|
| nibbana-path.json | 12-node dependency graph + runtime spec | new, structured data |

## Verification

- JSON parses (checked at pack build).
- All practice refs exist in the graph (vbt-breath-pause, four-establishments-outline, seeing-right-view-outline, signless-concentration-outline, concept-deconstruction-outline) — some are in pack 43/44, some are proposed.
- All text refs exist in pack 44 texts-targets (nanavira-*, nanananda-*, analayo-*).
- All sutta refs exist in pack 44 texts-targets (mn-10, sn-48-10, snp-4-11, mn-111).
- No transcripts, no media blobs. RIGHTS.md §3 compliant.

## What is NOT here

- This is a graph, not a practice collection. The practices it references
  are in packs 43, 44, and 45. This pack wires them into a dependency chain.
- The runtime is a spec, not code. The client implementation is the next step.
- Nibbāna is deliberately not a node. The terminal state is "what remains
  when you stop fabricating" — not a state the runtime claims you've reached.
