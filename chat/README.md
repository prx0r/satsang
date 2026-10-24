# Satsang curator chat ("Build me a path")

Tell it what you want ("I want to understand how rebirth works and maybe try a past-life practice", "10 minutes a day, I'm anxious",
"a weekend retreat in the UK") and it builds a personal micro-curriculum pack: an ordered set of talks (with why-lines), practices
(with cautions, linking `#practice/<id>`), free readings (`/resource/<id>`), and where to go deeper (curated collections, places and their
published programmes). The pack can be saved as a journey.

**Live:** `https://chat.tantrafiles.xyz` (Worker `satsang-chat`; also `https://satsang-chat.tradesprior.workers.dev`).
**Frontend:** `app/src/ask.js` + `app/site/ask.css` (route `#ask`, `#ask/<packId>`; "Build me a path" entries on Watch and topic hubs).

## How it works (no model needed)
1. **Safety triage first** (`worker/src/safety.mjs`, deterministic, < 1 ms). Symptom rules and negation are ported from
   `engine/rt/safety.mjs`; the curator adds `crisis` (self-harm: crisis lines, no pack), `emergency` (seek medical help, no pack),
   `unsettled` (voices, spiritual emergency, days without sleep: see a professional; walking/kindness only), `stop`, `soften`
   (anxious, stressed, grief, trauma: gentle pack, no intense/esoteric/teacher-only practice), the `intense` flag (retention, kumbhaka,
   forceful breathing, raising kundalini: never prescribed, orientation only) and condition filters (pregnancy, blood pressure, heart,
   epilepsy, glaucoma, asthma, surgery, mental health: practices whose own cautions name it are dropped; no breath work).
2. **Intent** (`curator.mjs parseIntent`): topics from the hubs' own regexes, topic labels/terms and a small synonym table; the hub
   sub-question (e.g. "Remembering past lives"); traditions (aliases + labels); minutes per day; days; level; country (names, aliases,
   "near me" = Cloudflare's approximate country); wants (watch / practise / read / visit / deep); retreat shape (weekend, 10-day, silent,
   online, free, monastic).
3. **Retrieval**: BM25 in the Worker over the catalog (talks, practices, readings, places, collections, curated mini-courses), with
   priors: satsang-curation **gold** talks first, tier/views, topic and tradition fit, time budget, one talk per teacher, traditions spread.
   When a curated **mini-course** fits the ask it is the backbone (its order and its notes become the why-lines); a second course is
   added only when the ask names its own sub-question (rebirth + past lives).
4. **Pack**: day 1 = a way in + the daily practice; then one item a day; a closing reflection; then "go deeper". Prose is templated from
   the pack's own facts. Every item carries a real catalog id and a site URL.

## Catalog (grounding)
`node chat/tools/build-catalog.mjs` writes `chat/worker/data/catalog.json` (git-ignored; ~3.2 MB, ~0.7 MB gzip) from Satsang's own data only:
the live site (`clips.json`, `data/wisegraph/{collections,hubs,places,wise}.json`), `mcp/data/wiser.json` + `mcp/src/resources.mjs` (the same
`/resource/<id>` ids as the site and MCP), and satsang-curation's `app/wisegraph/catalog-for-chat.json` (gold talks + why-lines + mini-courses;
also read from `../../wiser/app/wisegraph/` or `CURATION_CATALOG=<file>`). Mini-courses not yet on the live site's `collections.json` are used
as backbones (their steps are live ids) but are not linked as collections until they ship. `LIVE_DIR=<folder>` reads saved copies instead of fetching.

## API
- `POST /curate {message, device?}` → NDJSON stream: `meta` (safety, intent, title, id) · `item`* · `prose` · `pack` · `done` (`?stream=0` → one JSON).
- `POST /packs {message, device}` → the server re-runs the curator and stores the pack in KV (a saved pack only ever holds catalog items) → `{id, pack}`.
- `GET /packs/<id>` · `GET /health`.
- Limits: Workers Rate Limiting 20/min per IP and 10/min per device (per-isolate fallback locally); message ≤ 600 chars; body ≤ 4 KB.

## Optional LLM (OFF)
`worker/src/llm.mjs` targets Qwen on Alibaba Cloud Model Studio (OpenAI-compatible `…/compatible-mode/v1/chat/completions`). It only re-words
the prose from the pack's facts; output with URLs, unknown names or retention advice is rejected and the template stands. It stays off until the
owner approves spend: `wrangler secret put QWEN_API_KEY`, then vars `LLM_PROVIDER="qwen"`, `QWEN_MODEL="<approved id>"` (max_tokens ≤ 400, `LLM_DAILY_CALLS`).

## Tests
`node chat/test/test-curator.mjs` (local) or `--endpoint https://chat.tantrafiles.xyz`: 15 scripted prompts incl. crisis, emergency, unsettled,
intense-request and pregnancy; every returned id is checked against the catalog and the live site (`/resource/<id>` must not be a held page).

## Deploy (this Worker only; never the site)
```
node chat/tools/build-catalog.mjs && node chat/test/test-curator.mjs
cd chat/worker && ../../app/api/node_modules/.bin/wrangler deploy     # or any wrangler 4
```
