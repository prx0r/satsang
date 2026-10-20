#!/bin/sh
# Commit keeper/state/*.json + keeper/REPORT.md to the keeper-state branch (never main), with git plumbing: a private
# index, so .gitignore, the work tree and the current branch are untouched. The branch holds only those files + README.
# Retries on a push race (the workflows share one concurrency group, but a human push can still race).
# KEEPER_PUBLISH_FRESH=1 starts the branch over (no parent) and force-pushes; only for repairing the branch.
set -e
ROOT=$(git rev-parse --show-toplevel); cd "$ROOT"
BR=${KEEPER_STATE_BRANCH:-keeper-state}
IDX=$(mktemp -u); export GIT_INDEX_FILE="$IDX"
export GIT_AUTHOR_NAME="satsang-keeper" GIT_AUTHOR_EMAIL="keeper@users.noreply.github.com" GIT_COMMITTER_NAME="satsang-keeper" GIT_COMMITTER_EMAIL="keeper@users.noreply.github.com"
README="# keeper-state
Machine-written state of Satsang's keeper (keeper/ on main): keeper/state/findings.json, dead.json, status.json,
reverify.json, runs.json, cursor.json and keeper/REPORT.md. Written only by the keeper workflows; do not edit by hand.
Claims and ignores go in keeper/claims.json and keeper/ignore.json on main (see keeper/AGENTS.md)."
ok=0
for i in 1 2 3; do
  PARENT=""
  if [ -z "$KEEPER_PUBLISH_FRESH" ] && git fetch -q --depth 1 origin "$BR" 2>/dev/null; then PARENT=$(git rev-parse -q --verify "FETCH_HEAD^{commit}" || true); fi
  rm -f "$IDX"
  for f in keeper/state/*.json keeper/REPORT.md; do
    [ -f "$f" ] || continue
    git update-index --add --cacheinfo "100644,$(git hash-object -w "$f"),$f"
  done
  git update-index --add --cacheinfo "100644,$(printf '%s\n' "$README" | git hash-object -w --stdin),README.md"
  TREE=$(git write-tree)
  if [ -n "$PARENT" ] && [ "$(git rev-parse "$PARENT^{tree}")" = "$TREE" ]; then echo "keeper-state: no change"; ok=1; break; fi
  C=$(git commit-tree "$TREE" ${PARENT:+-p "$PARENT"} -m "keeper: ${KEEPER_CADENCE:-run} $(date -u +%Y-%m-%dT%H:%MZ)")
  if git push -q ${KEEPER_PUBLISH_FRESH:+--force} origin "$C:refs/heads/$BR"; then echo "keeper-state: pushed $C"; ok=1; break; fi
  sleep $((i * 5))
done
rm -f "$IDX"
[ "$ok" = 1 ] || { echo "keeper-state: push failed"; exit 1; }
