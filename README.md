# Satsang

A living spiritual directory: teachers, scholars, lineages, traditions, places to study and practise, free texts and practices, a topic-flash resonance feed, TV mode, and an open MCP/REST API that agents (ChatGPT, Claude) can query for sourced, dated answers.

- **Live:** https://satsang.digital (MCP `https://mcp.satsang.digital/mcp`, API `https://api.satsang.digital`). Until the satsang.digital zone is active it serves on https://tantrafiles.xyz (MCP `https://mcp.tantrafiles.xyz/mcp`).
- `domain.mjs` – the one place for public hostnames (BASE); `app/tools/switch-domain.sh` attaches the satsang.digital Worker domains, flips BASE, redeploys and makes tantrafiles.xyz 301 (path kept).
- `app/` – site (Cloudflare Worker), API (Worker + D1), build tools, wisegraph data
- `mcp/` – read-only MCP server + REST/OpenAPI + open-data dumps (see mcp/README.md)
- `specs/` – data model, schemas, ranking, loop, profile, roadmap
- `sources/` – sourcing pipelines and metadata (official embeds and metadata only; no media)
- `atlas/` – tradition timeline knowledge graph prototype

Deploy: `sh app/deploy.sh` (site), `sh app/deploy.sh api`, `sh app/deploy.sh mcp`. Worker names (wiser-web, wiser-api, wiser-mcp), the D1 database and KV namespaces keep their original internal names.

Licences: code MIT (mcp/LICENSE-CODE); our curation CC BY 4.0 (mcp/LICENSE-DATA); third-party records are metadata only.
