# MERGE-NOTES — 07-mcp-atlas-tools (for the lead agent)

## Merge steps
```bash
cd <satsang>
# 1. specs -> AGENT_TOOLS (mcp/src/agents.mjs), resolvers per mcp-tools.json
# 2. ingestion per build-notes.md (concept entity + edge append + search docs)
# 3. node mcp/build-data.mjs && node mcp/slim-data.mjs
#    python3 specs/schema/validate.py   # 3,418 baseline stays green + concepts
#    node mcp/test.mjs                  # extend with thread + path checks
# 4. redeploy wiser-mcp; MCP Inspector must list the 2 new tools
```

## Before deploy
- `/concept/<id>` routes + JSON-LD are ROADMAP-7 work; the tools can
  ship first with `url` pointing at the future canonical path (clients
  handle it — `fetch` resolves post-7).
- `find_path` BFS cap: 10 hops max in schema, default 6; memoise per
  worker invocation (612 nodes / 827 edges is trivially small).
- Contested edges (`contested: true` in DATA-MODEL) must surface in
  `find_path` output with a flag — never silently routed through.
