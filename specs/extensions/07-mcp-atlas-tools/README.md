# 07 — MCP Atlas tools: `get_concept_thread` + `find_path`

**Why:** ROADMAP step 8 — "Add Atlas tools (`get_concept_thread`,
`find_path`) and `find_places` when the Atlas lands." `find_places`
shipped (`mcp/src/agents.mjs`). These two didn't. The data is ready:
`atlas/merged/` holds 612 concept nodes + 827 edges across 9 streams
(indic, tantra, buddhist, sramana, chinese, western, occult, islamic…).

**Files:**
- `mcp-tools.json` — 2 tool specs in the exact `core.mjs` TOOLS shape
- `build-notes.md` — what `build-data.mjs` must ingest (files, id
  mapping, search indexing) so the tools resolve

**Merge:** append specs to `AGENT_TOOLS`, extend `build-data.mjs` per
notes, rebuild `mcp/data/wiser.json`, redeploy the worker. Details in
MERGE-NOTES.md.
