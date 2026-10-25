#!/bin/sh
# Commit + push work/wiser (the prx0r/satsang work tree): stage everything .gitignore allows (engine/ left to its owner),
# secret/transcript scan, commit, pull --rebase, push, then fast-forward the legacy clone work/satsang-chat/repo so every checkout matches.
# usage: [RELEASE_EXCLUDE="specs/SIT-PLAYER.md ..."] sh tools/release/release.sh "commit message"
set -e
cd "$(dirname "$0")/../.."
[ -n "$1" ] || { echo 'usage: sh tools/release/release.sh "message"' >&2; exit 2; }
set -- "$1"; X=''; for e in $RELEASE_EXCLUDE; do X="$X :(exclude)$e"; done   # RELEASE_EXCLUDE="path ...": other owners' uncommitted files
# shellcheck disable=SC2086
git add -A -- . ':(exclude)engine' $X
sh tools/release/secret-scan.sh .
git commit -q -m "$1"
git pull --rebase --autostash --quiet origin main   # other agents (engine, chat) push too
git push --quiet origin HEAD:main
git log --oneline -1
C=../satsang-chat/repo; [ -d "$C/.git" ] && git -C "$C" pull --rebase --quiet origin main && echo "mirror $C -> $(git -C "$C" rev-parse --short HEAD)" || true
