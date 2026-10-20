# build-data ingestion notes — practice links (for the lead agent)

`mcp/build-data.mjs` builds practices inside `build-collections.py` output
(passed through to `data/wiser.json`). To serve attributions:

1. Read `<ext>/10-golden-path/practice-links.json` (later: `app/wisegraph/
   practice-links.json` — propose that home) keyed by practice id.
2. Attach `teachers[]` (person ids) and `texts[]` (text gids) to the matching
   built practices. Drop links whose practice id is absent (report them, as
   `build-collections.py` reports unresolved).
3. Search index: practice docs gain teacher names (`doc()` hay += names),
   so `search` for "Bäumer" finds her practices.
4. `get_teacher` shaper: add `methods[]` (practices listing this teacher).
   `list_practices`: add optional `teacher` filter.
5. `guide_me` (mcp-tool.json) resolves entirely from these joins + existing
   records — no new tables.
6. `validate.py`: practice schema gains optional `teachers`, `texts`
   (arrays of slug/gid) + proposed `status` (deitybody-mapping.md).
