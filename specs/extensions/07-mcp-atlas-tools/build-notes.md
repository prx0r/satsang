# build-data ingestion notes — Atlas (for the lead agent)

`mcp/build-data.mjs` currently normalises `app/site/{clips.json,
data/wisegraph/*}` + `app/schema/topics.json`. To serve the two tools:

1. Read `atlas/merged/nodes.json` → `data.concept` keyed by node id:
   `{id, type: 'concept', label, kind, streams[], time, time_alt,
   traditions[], meta: {license: 'CC-BY-4.0'}}`. Concept ids already
   carry a `c-` prefix (`c-nonduality`) — keep it; canonical URL becomes
   `/concept/<id>` (add the route + JSON-LD `DefinedTerm` per ROADMAP 7).
2. Read `atlas/merged/edges.json` → append to `data.edge` with source
   `atlas-merged-v0.1`. Atlas edge ids (`e0001`) are stable; keep them.
   Map Atlas edge `type` into the DATA-MODEL rel vocabulary (all Atlas
   types used — `expounds` etc. — already exist in the vocab).
3. Streams (`atlas/merged/streams.json` groups) become a `stream` facet
   on concepts, not a new entity kind (keeps the 11-kind model stable).
4. Search index (`buildIndex` in `core.mjs`): add concept docs
   (`doc('concept', id, label, streams+traditions)`, weight 1.2, same as
   tradition) so `search` finds threads before `get_concept_thread`.
5. `validate.py`: extend the kinds loop with `concept` + add
   `specs/schema/concept.json` (required: `id`, `type`, `label`).

Counts today: 612 concepts, 827 edges. Re-run `validate.py` — the
3,418-record baseline must stay green.
