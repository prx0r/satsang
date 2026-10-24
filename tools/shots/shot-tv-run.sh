#!/bin/sh
# one view per browser; one retry each. usage: sh shot-impl-run.sh view...   (LIVE=1 for the live site; OUT=dir)
cd "$(dirname "$0")"
OUT=${OUT:-../../shots/tv}
for dev in ${DEVS:-desktop phone}; do for v in "$@"; do
  for try in 1 2; do
    DEV=$dev timeout ${TMO:-100} node shot-tv.mjs $OUT $v >/tmp/shot-$dev-$v.log 2>&1; rc=$?
    pkill -9 -f "[c]hromium-1140"; [ $rc = 0 ] && break
  done
  echo "== $dev $v rc=$rc"; grep -v '^ *at ' /tmp/shot-$dev-$v.log | tail -8 | cut -c1-400
done; done
