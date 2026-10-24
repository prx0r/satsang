#!/bin/sh
# Enquiry-lens pipeline step (search/README.md): run after the catalogue changes (clips.json, gold.json, collections.json, wise.json).
#   sh app/tools/search-index.sh          -> ingest_talks.py (incremental: embeds only new/changed talk docs) + upload to KV + flip idx/current
#   SKIP_INGEST=1 sh app/tools/search-index.sh   -> upload only
# Local model only (bge-small, CPU); no paid service. In the Hark sandbox a call may hit 120 s: rerun, the store is append-only.
set -e
W="$(cd "$(dirname "$0")/../.." && pwd)"; S="${SEARCH_INDEX_ROOT:-$W/../wiser-search-index}"
if [ "$SKIP_INGEST" != "1" ]; then
  [ -f "$S/scripts/ingest_talks.py" ] || { echo "search index builder not found at $S (set SEARCH_INDEX_ROOT)" >&2; exit 1; }
  . "$S/scripts/env.sh"   # reads the live catalogue at $S/../wiser/app (catalog.py)
  i=0; while [ $i -lt 6 ]; do i=$((i+1))
    OUT=$(python3 "$S/scripts/ingest_talks.py" --json --budget ${BUDGET:-80} | tail -1); echo "$OUT"
    echo "$OUT" | grep -q '"pending": *0' && break
  done
fi
node "$W/search/tools/upload-index.mjs" --index "$S/index"
sha256sum "$W/app/clips.json" | cut -c1-16 > "$W/search/.ingested"   # build() compares this stamp and reminds when the catalogue moved on
