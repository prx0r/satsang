#!/bin/sh
# Commit keeper/state + keeper/REPORT.md to the keeper-state branch (never main). Used by the workflows; works locally too.
# Retries on a push race (the hourly and daily jobs share one concurrency group, but a human push can still race).
set -e
ROOT=$(git rev-parse --show-toplevel); cd "$ROOT"
BR=${KEEPER_STATE_BRANCH:-keeper-state}
WT=$(mktemp -d)
git fetch -q origin "$BR" 2>/dev/null && git worktree add -q "$WT" "origin/$BR" 2>/dev/null || { git worktree add -q --detach "$WT" HEAD; (cd "$WT" && git checkout -q --orphan "$BR" && git rm -rq . >/dev/null 2>&1 || true); }
for i in 1 2 3; do
  mkdir -p "$WT/keeper/state"
  cp keeper/state/*.json "$WT/keeper/state/"; cp keeper/REPORT.md "$WT/keeper/REPORT.md"
  cat > "$WT/README.md" <<EOT
# keeper-state
Machine-written state of Satsang's keeper (see keeper/ on main): findings.json, dead.json, status.json, reverify.json, REPORT.md.
Written only by the keeper workflows. Do not edit by hand; claims and ignores go in keeper/claims.json and keeper/ignore.json on main.
EOT
  cd "$WT"; git add -A
  if git diff --cached --quiet; then echo "keeper-state: no change"; break; fi
  git -c user.name="satsang-keeper" -c user.email="keeper@users.noreply.github.com" commit -qm "keeper: ${KEEPER_CADENCE:-run} $(date -u +%Y-%m-%dT%H:%MZ)"
  if git push -q origin "HEAD:refs/heads/$BR"; then echo "keeper-state: pushed"; break; fi
  git fetch -q origin "$BR"; git reset -q --hard "origin/$BR"; cd "$ROOT"
done
cd "$ROOT"; git worktree remove --force "$WT" 2>/dev/null || true
