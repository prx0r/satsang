#!/bin/sh
# one view per browser (the sandbox's Chromium loses renderers when old browsers linger); one retry each; leftovers killed
cd "$(dirname "$0")"
for dev in ${DEVS:-desktop phone}; do for v in "$@"; do
  for try in 1 2; do
    SITE_DIR=${SITE_DIR:-/tmp/wdist} DEV=$dev timeout 70 node shot-deep.mjs shots-deep $v >/tmp/shot-$dev-$v.log 2>&1; rc=$?
    pkill -9 -f "[c]hromium-1140"; [ $rc = 0 ] && break
  done
  echo "$dev $v: rc=$rc $(grep -v '^ *at ' /tmp/shot-$dev-$v.log | tail -1 | cut -c1-160)"
done; done
