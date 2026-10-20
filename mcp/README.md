# Satsang MCP (worker wiser-mcp): the open, queryable Satsang directory for agents (https://mcp.satsang.digital/mcp; today https://mcp.tantrafiles.xyz/mcp)

> Home: **satsang.digital** (MCP `https://mcp.satsang.digital/mcp`). Until that domain is active the same paths serve on tantrafiles.xyz (`https://mcp.tantrafiles.xyz/mcp`), which then 301s / keeps answering. Hostnames live in `../domain.mjs`.

## For agents & developers
- **Connector URL (no auth): `https://mcp.satsang.digital/mcp`** (Streamable HTTP; legacy SSE: `https://mcp.satsang.digital/sse`)
- **ChatGPT**: Settings > Apps & Connectors > Advanced > Developer mode on; Connectors > Create > name Satsang, URL above,
  "No authentication". Deep research uses `search` + `fetch` (OpenAI shapes). Custom GPT: Actions > Import from URL
  `https://mcp.satsang.digital/openapi.json`, auth None.
- **Claude**: Settings > Connectors > Add custom connector > URL above. Claude Code: `claude mcp add --transport http satsang https://mcp.satsang.digital/mcp`.
- **REST / OpenAPI 3.1**: `https://mcp.satsang.digital/openapi.json`, endpoints under `/api/` (CORS `*`, 120 req/min/IP REST, 600 MCP).
- **Discovery**: `/llms.txt`, `/llms-full.txt`, `/.well-known/mcp.json` (+ `/.well-known/mcp/server-card.json`) on both hosts; docs page https://satsang.digital/agents.
- **Canonical URLs to cite**: `https://satsang.digital/{person,tradition,topic,practice,collection,place,resource,clip}/<id>` (all resolve;
  clip redirects into the player, /text/<id> 301s to /resource/<id>). Every record carries `url`, `source_url`, `verified_on`, `confidence`.
- **Licences**: data CC BY 4.0 for Satsang curation, third-party = metadata under its own terms (`LICENSE-DATA`); code MIT (`LICENSE-CODE`).
- **Test**: `node test-client.mjs https://mcp.satsang.digital` (black-box client: Streamable HTTP, SSE round trip, OpenAI shapes, REST, CORS, discovery).


Streamable-HTTP MCP server for a Cloudflare Worker, zero runtime dependencies. Reads only `data/wiser.json`, which
`build-data.mjs` normalises from `../app/site/{clips.json,data/wisegraph/*}` (+ `../app/schema/topics.json` labels; keyword
regexes dropped). Never writes to `app/`. No transcripts anywhere.

```
node build-data.mjs     # -> data/wiser.json (all records valid vs ../specs/schema; counts computed, never hard-coded)
node slim-data.mjs      # -> data/wiser.mcp.json (Worker bundle)
node build-discovery.mjs # -> llms.txt, discovery/{llms-full.txt, mcp.json, .well-known/*, agents.html, resources.json}
node test.mjs           # local end-to-end: starts an HTTP server, legacy checks + test-client.mjs (60 checks)
node test-client.mjs <base-url>   # same client checks against any deployment
node serve-local.mjs    # http://127.0.0.1:8799/mcp for Claude Desktop / MCP Inspector (npx @modelcontextprotocol/inspector)
node build-dump.mjs     # -> dist-data/ (open-data dump, JSON-LD, sitemaps), see OPEN-DATA.md
python3 ../specs/schema/validate.py   # schema check of data/wiser.json
```
Deploy: `sh ../app/deploy.sh mcp` (= build-data, slim-data, build-discovery, test, wrangler deploy; custom domain mcp.satsang.digital).
The site deploy (`sh ../app/deploy.sh`) copies llms.txt, llms-full.txt, agents.html and .well-known/* into the site and builds /resource pages.
The Worker bundles `data/wiser.mcp.json` (slim-data.mjs: every ballot talk + 12 full talks per teacher; ≈ 840 KB gzip) and
builds its index at startup (≈ 75 ms) so requests fit the free plan's CPU budget. The full set is the /data dump.

## Protocol
- Streamable HTTP: `POST /mcp` JSON-RPC 2.0 (single or batch) -> `application/json` (or one SSE frame per reply if the client
  accepts only `text/event-stream`). Notifications -> `202`. `GET /mcp` -> `405` (stateless, no server-initiated stream). `DELETE` -> `204`.
- Legacy HTTP+SSE (2024-11-05): `GET /sse` -> `event: endpoint` (`/messages?sessionId=...`), `POST /messages` -> `202`, replies on
  the stream. Each stream lives in a Durable Object (`SseSession`, SQLite class, Workers Free) so any isolate can push to it; 20 s pings.
- Methods: `initialize` (2025-06-18, 2025-03-26, 2024-11-05), `ping`, `tools/list`, `tools/call` (`content[0].text` JSON +
  `structuredContent`), `resources/list|read` (`wiser://meta`). All tools carry `annotations.readOnlyHint: true`.
- No auth. Origin allow-list (satsang.digital, tantrafiles.xyz, localhost, openai/chatgpt/claude/anthropic) for browser calls;
  server-side clients send no Origin. Rate limits: Workers Rate Limiting bindings `RL_API` 120/min, `RL_MCP` 600/min per IP
  (per-isolate bucket as fallback). CORS `*` everywhere.

## Tools (14)
| tool | input | returns |
|---|---|---|
| `search` | `query`, `kinds[]?`, `limit?` | **exactly** `{results:[{id,title,url}]}` (OpenAI connector/deep-research shape); `id` = `<kind>/<id>` |
| `fetch` | `id` (search id or satsang.digital URL) | `{id,title,text,url,metadata}`; metadata: kind, source_url, verified_on, confidence, licence (+ kind fields) |
| `find_places` | `tradition` (incl. schools), `school`, `country`, `region`, `type`, `status active|heritage|any`, `living_teacher`, `offers[]`, `query`, `limit` | place cards with provenance |
| `get_place` | `id` | contacts as published (value + source + checked), programmes with `as_of`, teachers, sisters, events, resources, geo |
| `find_teachers` | `tradition`, `school`, `living`, `country`/`region` (via tied places), `role`, `on_video`, `query` | people with `living` = living / likely-living (inferred) / deceased / unknown + basis |
| `get_resources` | `tradition`, `person`, `topic`, `free`, `kind`, `query` | texts/books/libraries; `access` free / paid-or-unknown / no-link |
| `get_lineage_path` | `from`, `to`, `lineage all|dharma|academic|influence|institutional`, `max_hops` | shortest documented chain, each step with confidence + source_url |
| `what_to_study` | `tradition`, `limit` | 4 steps: free resources + talks > practices + journeys > teachers (living first) > places |
| `get_topic`, `get_teacher`, `get_lineage`, `list_practices`, `get_collection`, `recommend` | as before (ids may now be prefixed `person/...` or URLs) | as before, plus provenance fields and canonical URLs |

## Files
`src/core.mjs` (index, legacy tools, JSON-RPC, transports, fetch handler) · `src/agents.mjs` (provenance, canonical URLs, fetch + directory tools) · `src/resources.mjs` (resource ids, shared with the site) · `src/rest.mjs` (REST routes + OpenAPI) · `build-discovery.mjs` · `test-client.mjs` · `LICENSE-DATA` · `LICENSE-CODE` · `src/rank.mjs` (ranking, ../specs/RANKING.md) · `src/jsonld.mjs`
(schema.org mapping) · `src/worker.mjs` (Worker entry) · `build-data.mjs` · `build-dump.mjs` · `serve-local.mjs` · `test.mjs` ·
`llms.txt` · `OPEN-DATA.md` · `wrangler.toml` · `package.json`.

## Known limits
- Live signals (crowd BT, completion, resonate counts) are not in the static data, so quality leans on views-within-teacher,
  depth and length until `site/data/stats.json` exists (ROADMAP step 3).
- New sources are picked up automatically when merged into `app/site` (clips.json, wisegraph/{wise,graph,places,hubs,collections}.json,
  and any `wisegraph/resources*.json` rows `{title,url,free,licence,traditions[],people[],kind,source_url,checked}`); nothing counts by hand.
- Teacher location = places they founded or are tied to (no residence data). "likely-living" = on video, no death year (Wikidata P570 via
  anniversaries.json); treat as inferred. Place `status` is inferred from type/offers/programmes.
- The Worker bundles the slim set (all non-clip records + ballot clips + 12 full talks per teacher): `fetch` of a clip outside it fails; full set in /data.
- Search is substring scoring, fine at this size (≈ 3.4 k docs, < 30 ms); move to a prebuilt inverted index or Workers AI
  embeddings past ~50 k docs.
