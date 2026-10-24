#!/bin/sh
# Run the wiring crawl in parallel chunks, re-run the same command to resume chunks whose browser died (the sandbox kills Chromium under memory pressure).
# usage: sh tools/check/crawl-run.sh <routes.json> <outdir> <phone|desktop> <first chunk> <last chunk> [chunk size=50]
R=$1; O=$2; D=$3; A=$4; B=$5; N=${6:-50}; C="$(dirname "$0")/crawl.mjs"; mkdir -p "$O"
for i in $(seq $A $B); do s=$((i*N)); DEV=$D timeout ${TMO:-108} node "$C" "$R" "$O/$D-$i.json" $s $((s+N)) >"$O/$D-$i.log" 2>&1 & done; wait
pkill -9 -f "[c]hromium-1140"; tail -qn1 "$O"/$D-*.log | grep -v '^Node' | cut -c1-100
