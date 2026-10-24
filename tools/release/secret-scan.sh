#!/bin/sh
# Secret + transcript scan over the STAGED diff of a satsang checkout. usage: sh tools/release/secret-scan.sh [checkout] (default: repo root)
# Fails on: API keys/tokens/private keys; staged paths under internal/, transcripts, .env/.dev.vars; transcript host/path strings.
# engine/ is owned by the engine agent: staging it fails unless ENGINE_OK=1.
cd "${1:-$(dirname "$0")/../..}" || exit 2
F=$(git diff --cached --name-only --diff-filter=AM)
[ -z "$F" ] && { echo "nothing staged"; exit 0; }
git diff --cached -U0 | grep '^+' | grep -nE 'ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY|xox[baprs]-[A-Za-z0-9-]{10,}|sk-[A-Za-z0-9]{32,}|sk-or-v1-[a-f0-9]{20,}|AIza[0-9A-Za-z_-]{35}|CLOUDFLARE_API_TOKEN *= *["'"'"']?[A-Za-z0-9_-]{30,}|Bearer [A-Za-z0-9._-]{30,}|r2\.cloudflarestorage\.com' > /tmp/scan-hits.txt; [ -s /tmp/scan-hits.txt ] && { cut -c1-160 /tmp/scan-hits.txt; echo "SECRET-LIKE STRINGS FOUND"; exit 1; }
echo "$F" | grep -E 'transcript|(^|/)internal/|\.env$|\.dev\.vars$' && { echo "FORBIDDEN PATH STAGED"; exit 1; }
[ "$ENGINE_OK" = 1 ] || { echo "$F" | grep -E '^engine/' && { echo "engine/ STAGED (owned by the engine agent; ENGINE_OK=1 to allow)"; exit 1; }; }
# deploy.sh and this file carry the guard patterns themselves; everything else must not mention transcript sources
git diff --cached -U0 -- . ':(exclude)app/deploy.sh' ':(exclude)tools/release/secret-scan.sh' | grep '^+' | grep -nE 'dhamma\.stream|bbballs|hillside-hermitage-documents|_djvu|transcripts-internal' > /tmp/scan-hits.txt; [ -s /tmp/scan-hits.txt ] && { cut -c1-160 /tmp/scan-hits.txt; echo "TRANSCRIPT REFERENCE"; exit 1; }
echo "secret scan clean ($(echo "$F" | wc -l) files)"
