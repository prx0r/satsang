# Satsang

A living spiritual directory: teachers, scholars, lineages, traditions, places to study and practise, free texts and practices, a topic-flash resonance feed, TV mode, and an open MCP/REST API that agents (ChatGPT, Claude) can query for sourced, dated answers.

- `app/` – site (Cloudflare Worker), API (Worker + D1), build tools, wisegraph data
- `mcp/` – read-only MCP server + REST/OpenAPI + open-data dumps (see mcp/README.md)
- `specs/` – data model, schemas, ranking, loop, profile, roadmap
- `sources/` – sourcing pipelines and metadata (official embeds and metadata only; no media)
- `atlas/` – tradition timeline knowledge graph prototype

Licences: code MIT (mcp/LICENSE-CODE); our curation CC BY 4.0 (mcp/LICENSE-DATA); third-party records are metadata only.
