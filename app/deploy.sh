#!/bin/sh
# Build + deploy Satsang (formerly Wiser) to Cloudflare. Public hostnames come from ../domain.mjs (tools/apply-domain.mjs). Needs CLOUDFLARE_API_TOKEN (or the Hark gateway) and CLOUDFLARE_ACCOUNT_ID.
#   sh deploy.sh            -> site = build + guard + ship (worker wiser-web on BASE + www; old hosts 301 once BASE moves)
#   sh deploy.sh build      -> site phase A: domain config, anniversaries, stats, esbuild, dist/, open data (mcp/data, dumps, schema check), meta pages
#   sh deploy.sh guard      -> site phase B: both transcript guards over dist/ and the open data (fails the deploy on any hit)
#   sh deploy.sh ship       -> site phase C: KV uploads (open data + large site files), embed, wrangler deploy wiser-web
#   sh deploy.sh api        -> API (worker wiser-api on API_BASE)
#   sh deploy.sh mcp        -> MCP (worker wiser-mcp on MCP_BASE, read-only)
#   sh deploy.sh chat       -> chat catalog + local test + worker satsang-chat (chat.tantrafiles.xyz)
#   sh deploy.sh search     -> enquiry lens: ingest_talks.py (incremental) + index upload to KV + worker satsang-search (workers.dev)
#   SKIP_DATA=1 sh deploy.sh -> site without rebuilding/uploading the open data
# In the Hark sandbox (120 s per call) run build, guard and ship as separate calls; never build and deploy concurrently.
set -e
cd "$(dirname "$0")"
WRANGLER="$(pwd)/api/node_modules/.bin/wrangler"; [ -x "$WRANGLER" ] || WRANGLER="npx wrangler"

build() {
  SITE_BASE=$(node tools/apply-domain.mjs)  # site/config.json apiBase/shareBase <- ../domain.mjs
  node tools/build-anniversaries.mjs || true  # For You: teachers' death anniversaries (Wikidata P570, day precision) -> site/data/wisegraph/anniversaries.json
  node tools/build-stats.mjs || true  # crowd quality from D1 votes (public /stats/clips) -> site/data/stats.json
  npm run build
  # engine/ belongs to another agent: when engine/breath has uncommitted work, bundle the breath player from the committed HEAD copy
  if ! git -C .. diff --quiet HEAD -- engine/breath 2>/dev/null; then T=$(mktemp -d); mkdir -p "$T/engine/breath" "$T/app/src"
    for f in $(git -C .. ls-tree --name-only HEAD engine/breath/ | grep '\.js$'); do git -C .. show "HEAD:$f" > "$T/$f"; done
    cp src/breathplayer.js "$T/app/src/" && npx esbuild "$T/app/src/breathplayer.js" --bundle --format=esm --minify --target=es2022 --outfile=site/breathplayer.js "--banner:js=/*! Satsang breath player: engine/breath (body.js + breath.js), original code. */" --log-level=warning
    rm -rf "$T"; echo "breathplayer.js bundled from committed engine/breath (working tree has uncommitted engine changes)"; fi
  # enquiry lens: remind when the catalogue moved on since the last search-index ingest (run: sh deploy.sh search)
  [ "$(sha256sum clips.json | cut -c1-16)" = "$(cat ../search/.ingested 2>/dev/null)" ] || echo "NOTE: clips.json changed since the last search ingest: run 'sh deploy.sh search' (ingest_talks.py + KV upload)"
  node tools/build-place-pages.mjs  # places: slim index + per-place shards (lazy SPA load) + static /place/<id>, /places/* pages + sitemap-places.xml (from site/data/events.json)
  V=$(sha256sum site/app.js | cut -c1-10)
  rm -rf dist && cp -r site dist
  [ -f clips.site.json ] && cp clips.site.json dist/clips.json  # slim copy (tools/build-clips.py); src/app.js restores the dropped defaults
  # open data (ROADMAP 4/7): normalise -> mcp/data, dumps -> mcp/dist-data (KV), llms.txt + robots + sitemaps + schemas embedded
  if [ -d ../mcp ] && [ "$SKIP_DATA" != "1" ]; then
    (cd ../mcp && node build-data.mjs >/dev/null && node build-dump.mjs >/dev/null && node slim-data.mjs >/dev/null && node build-discovery.mjs >/dev/null)
    if python3 -c "import jsonschema" 2>/dev/null; then (cd ../mcp && python3 ../specs/schema/validate.py | tail -1 | grep -q "failing: none") || { echo "open data fails specs/schema (python3 ../specs/schema/validate.py in mcp/)" >&2; exit 1; }; else echo "jsonschema missing: schema check skipped (pip install jsonschema)"; fi
    cp ../mcp/llms.txt dist/llms.txt; cp ../mcp/discovery/llms-full.txt ../mcp/discovery/agents.html dist/; mkdir -p dist/.well-known/mcp; cp ../mcp/discovery/.well-known/mcp.json dist/.well-known/; cp ../mcp/discovery/.well-known/mcp/server-card.json dist/.well-known/mcp/; cp ../mcp/dist-data/sitemap*.xml dist/; mkdir -p dist/schema; cp ../specs/schema/*.json dist/schema/; cp ../mcp/discovery/schema-index.html dist/schema/index.html
    [ -f site/data/events.json ] && cp site/data/events.json ../mcp/dist-data/events.json  # /data/events.json (KV; the weekly events keeper may refresh it)
    printf 'User-agent: *\nAllow: /\nSitemap: %s/sitemap.xml\n' "$SITE_BASE" > dist/robots.txt
    (cd web-worker && node build-meta.mjs >/dev/null)
  fi
  M=$(sha256sum site/placemap.js | cut -c1-10)
  B=$(sha256sum site/breathplayer.js 2>/dev/null | cut -c1-10)
  sed -i "s/app\.js\"/app.js?v=$V\"/; s/style\.css\"/style.css?v=$V\"/; s/content=\"placemap\.js\"/content=\"placemap.js?v=$M\"/; s/content=\"breathplayer\.js\"/content=\"breathplayer.js?v=$B\"/" dist/index.html
}

guard() {
  # guard: transcripts are internal only; fail the deploy if anything that looks like transcript text or a transcript URL is in dist
  if grep -rIlE "dhamma\.stream|bbballs|hillside-hermitage-documents|_djvu|transcripts-internal" dist; then echo "transcript reference found in dist" >&2; exit 1; fi
  [ -f tools/check-no-transcripts.py ] || { echo "9-gram guard (private tool, not in the public repo) skipped"; }
  [ ! -f tools/check-no-transcripts.py ] || python3 tools/check-no-transcripts.py dist $([ -f ../mcp/data/wiser.json ] && echo ../mcp/data/wiser.json) ||  # the dumps and the MCP bundle are derived from wiser.json (no other text)
    { echo "transcript text found in dist or the open data" >&2; exit 1; }
  if grep -rIlE "dhamma\.stream|bbballs|hillside-hermitage-documents|_djvu|transcripts-internal|hasTranscript" ../mcp/dist-data ../mcp/data; then echo "transcript reference in the open data" >&2; exit 1; fi
}

ship() {
  if [ -d ../mcp/dist-data ] && [ "$SKIP_DATA" != "1" ]; then node -e "const fs=require('fs'),d='../mcp/dist-data/';fs.writeFileSync('/tmp/wiser-kv.json',JSON.stringify(fs.readdirSync(d).filter(f=>/\.(json|jsonl|jsonld|ndjson)$/.test(f)).map(f=>({key:'data/'+f,value:fs.readFileSync(d+f,'utf8')}))))" && (cd web-worker && npx wrangler kv bulk put /tmp/wiser-kv.json --binding DATA --remote >/dev/null && echo "open data uploaded to KV"); fi
  (cd web-worker && node embed.mjs && npx wrangler kv bulk put /tmp/wiser-site-kv.json --binding DATA --remote >/dev/null && echo "site data uploaded to KV" && npx wrangler deploy)
}

case "$1" in
  api) cd api && npx wrangler deploy ;;
  mcp) cd ../mcp && node build-data.mjs && node slim-data.mjs && node build-discovery.mjs && node test.mjs | tail -1 && $WRANGLER deploy ;;  # wiser-mcp on MCP
  search) sh tools/search-index.sh && (cd ../search/worker && $WRANGLER deploy) ;;  # satsang-search Worker (search/README.md)
  chat) cd .. && node chat/tools/build-catalog.mjs && node chat/test/test-curator.mjs >/tmp/chat-test.log && tail -2 /tmp/chat-test.log && (cd chat/worker && $WRANGLER deploy) ;;
  build) build ;;
  guard) guard ;;
  ship) ship ;;
  ""|site) build; guard; ship ;;
  *) echo "usage: sh deploy.sh [build|guard|ship|site|api|mcp|chat|search]" >&2; exit 2 ;;
esac
