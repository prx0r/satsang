# Wiser open data: /data dump, llms.txt, sitemap (LIVE 2026-10-20: /data/* from KV namespace wiser-open-data, /schema/*, /llms.txt, /sitemap.xml, /robots.txt, path pages /person|topic|tradition|practice|collection|place/<id> with JSON-LD)

## 1. What is published
`node build-data.mjs && node build-dump.mjs` writes `mcp/dist-data/` (6 MB raw, built from `app/site` read-only):

| file | content |
|---|---|
| `index.json` | manifest: per kind `count`, `bytes`, `sha256`, schema URL; licence block |
| `<kind>.json` / `<kind>.jsonl` | person (217), tradition (42), clip (1,953), text (37), practice (13), topic (56), collection (6), place (476), edge (618); each record valid against `specs/schema/<kind>.json` |
| `wiser.jsonld` | one schema.org `@graph` (2,800 nodes; edges folded into Person `knows`/`Role`) |
| `sitemap.xml` + `sitemap-<kind>.xml` | sitemap index + per-kind sitemaps (topics passing the gate, people, traditions, practices, collections, curated places; Goenka directory entries and clips left out) |

Serve at `https://tantrafiles.xyz/data/…` (static, from the site Worker's embed or R2), `https://tantrafiles.xyz/schema/<kind>.json`
(copy of `specs/schema/`), `https://tantrafiles.xyz/llms.txt` (this folder's `llms.txt`), `https://tantrafiles.xyz/sitemap.xml`.
Rebuilt by `deploy.sh` on every site deploy; `index.json.version` = build date. Also attach a dated zip to a GitHub release /
Zenodo later for a DOI (no account created here).

## 2. Licence notes (per field family)
- **Wiser curation** (topic intros and questions, one-line takes, practice summaries/steps, tags and confidences, lineage edges,
  tradition blurbs, bios, editorial collections): **CC BY 4.0**, attribution "Wiser (tantrafiles.xyz)".
- **Identifiers**: Wikidata QIDs and labels used as ids are CC0. Wikipedia is cited, never copied.
- **Portraits**: Wikimedia Commons files under their own licence; `image.license`, `artist`, `licenseUrl`, `page` travel
  with every record. Only PD, CC and Commons "Attribution" files are used (existing rule).
- **Talks**: never included. A clip record is metadata pointing at the official upload (YouTube Terms govern playback).
  Titles are the uploader's; `sourceTitle` is kept for attribution. Dharma Seed (CC BY-NC-ND): whole talks only, never
  virtual clips, never remixed; flagged by `media.provider: dharmaseed-audio` when added.
- **Texts**: links to the publisher's own free edition with `editions[].licence` as stated there (public domain,
  CC, or "free distribution" such as dhammatalks.org/BPS/DLS). Never rehosted.
- **Places**: names, coordinates (Wikidata/OSM, ODbL-compatible use with attribution "© OpenStreetMap contributors" where
  OSM-derived), and contact details only as published on the place's own site, each with its `source` URL and `checked`
  date. The licence block asks re-users not to use them for bulk mail.
- **Transcripts**: never. `deploy.sh`'s guards (name grep + 9-word sampling) must also scan `dist-data/` before upload.
- **User content**: only public curations/essays, under each author's chosen licence, in a separate `curation.jsonl` once
  curations exist; private material is never in a dump.

## 3. llms.txt
`mcp/llms.txt`: what Wiser is, the licence in two lines, links to the MCP endpoint, the dump manifest and the schemas,
the best entry pages, and four rules for agents (cite `url`, don't invent teacher quotes, send people to practice sources
and respect cautions, contacts as published). Also serve `/llms-full.txt` later = llms.txt + every published topic's intro and
questions (all Wiser-authored, CC BY).

## 4. Sitemap and crawlable URLs
The SPA uses hash routes (`#teacher/<id>`), which crawlers ignore. Plan:
1. The site Worker answers **path URLs** (`/person/<id>`, `/topic/<id>`, `/tradition/<id>`, `/practice/<id>`, `/collection/<id>`,
   `/place/<id>`) with `index.html` plus a server-filled `<title>`, `<meta name="description">`, canonical link, Open Graph
   tags and the page's JSON-LD node (`mcp/src/jsonld.mjs`); the client router reads `location.pathname` first and maps it
   to the existing hash view. Hash links keep working (no redirects needed).
2. `sitemap.xml` (index) → per-kind sitemaps from `build-dump.mjs`; `robots.txt`: `Sitemap: https://tantrafiles.xyz/sitemap.xml`,
   disallow nothing public, disallow `/api/me*`.
3. `lastmod` = record `meta.updated` once records carry it (today: build date).

## 5. MCP endpoint
`https://mcp.tantrafiles.xyz/mcp` (Streamable HTTP, POST JSON-RPC, JSON responses, stateless, read-only, CORS open,
Origin allow-list for browsers). See README.md. Later tools from GATHER-SPEC and the Atlas report (`find_places`,
`get_concept_thread`, `find_path`, `list_sessions`) slot into the same `TOOLS` array.

## 6. Agent access (2026-10-20, v0.2.0)
MCP 14 tools incl. OpenAI-shaped `search`/`fetch` and the directory tools (find_places, get_place, find_teachers, get_resources,
get_lineage_path, what_to_study); REST mirror + OpenAPI 3.1 at https://mcp.tantrafiles.xyz/openapi.json; legacy SSE at /sse.
Every record carries `url` (canonical), `source_url`, `verified_on`, `confidence`. Canonical `/resource/<id>` pages (plain HTML,
JSON-LD) for texts/books; `/place/<id>` now exists for every place (incl. directory entries) and every topic; `/clip/<id>` redirects
to the player; `/text/<id>` 301s to `/resource/<id>`. `/llms-full.txt` is live. Licences: `LICENSE-DATA`, `LICENSE-CODE`.
