#!/bin/sh
# Move Satsang from tantrafiles.xyz to satsang.digital once the Cloudflare zone is ACTIVE.
#   sh tools/switch-domain.sh            -> every phase below, in order (the site build can take > 2 min)
#   sh tools/switch-domain.sh <phase>... -> only those phases: check attach flip api mcp site verify
# Phases:
#   check   zone 708de8d4 must be "active" (FORCE=1 skips the check)
#   attach  Worker custom domains: satsang.digital + www -> wiser-web, api. -> wiser-api, mcp. -> wiser-mcp
#           (Workers Domains API; only the satsang.digital zone is touched; the tantrafiles.xyz domains stay attached
#           so the old hosts keep answering) + the same hosts added to each wrangler.toml so later deploys keep them
#   flip    ../domain.mjs ACTIVE='satsang' -> BASE https://satsang.digital (canonical URLs, sitemaps, JSON-LD, llms.txt,
#           OpenAPI servers, MCP discovery, site/config.json apiBase/shareBase). CORS in the API already allows both
#           hosts (SITE_ORIGINS); invite links follow BASE.
#   api     deploy wiser-api      mcp   deploy wiser-mcp (rebuilds its data + discovery with the new BASE)
#   site    full site deploy (deploy.sh): the site Worker 301s tantrafiles.xyz/www.tantrafiles.xyz/www.satsang.digital
#           to https://satsang.digital keeping path + query. api./mcp.tantrafiles.xyz keep serving (old connectors).
#   verify  curl the new hosts and the redirect
# Needs CLOUDFLARE_ACCOUNT_ID and a token (the Hark gateway injects it for api.cloudflare.com). Never buys anything.
set -e
cd "$(dirname "$0")/.."            # app/
ZONE=708de8d4f76490563107d001dc3af125
ACCT=${CLOUDFLARE_ACCOUNT_ID:-954612afb5a97bb15dddcdc70176813d}
CF=https://api.cloudflare.com/client/v4
AUTH=""; [ -n "$CLOUDFLARE_API_TOKEN" ] && AUTH="Authorization: Bearer $CLOUDFLARE_API_TOKEN"
cf() { if [ -n "$AUTH" ]; then curl -sS -H "$AUTH" -H 'content-type: application/json' "$@"; else curl -sS -H 'content-type: application/json' "$@"; fi; }
PHASES=${*:-check attach flip api mcp site verify}

addroute() { # addroute <wrangler.toml> <hostname>: add a custom_domain route if missing
  grep -q "pattern = \"$2\"" "$1" && return 0
  python3 - "$1" "$2" <<'PY'
import sys,re
f,h=sys.argv[1],sys.argv[2]; s=open(f).read()
m=re.search(r'^routes = \[(.*?)\][ \t]*$', s, re.M|re.S)
items=re.findall(r'\{[^}]*\}', m.group(1)); items.append('{ pattern = "%s", custom_domain = true }' % h)
s=s[:m.start()]+'routes = [\n'+''.join('  %s,\n' % i for i in items)+']'+s[m.end():]
open(f,'w').write(s)
PY
  echo "  route $2 -> $1"
}

for P in $PHASES; do case $P in
check)
  S=$(cf "$CF/zones/$ZONE" | python3 -c "import sys,json;print((json.load(sys.stdin).get('result') or {}).get('status'))")
  echo "zone satsang.digital: $S"
  if [ "$S" != "active" ] && [ "$FORCE" != "1" ]; then echo "not active yet: set Porkbun nameservers to ariadne.ns.cloudflare.com + burt.ns.cloudflare.com, then re-run" >&2; exit 2; fi ;;
attach)
  for pair in satsang.digital:wiser-web www.satsang.digital:wiser-web api.satsang.digital:wiser-api mcp.satsang.digital:wiser-mcp; do
    H=${pair%%:*}; SV=${pair#*:}
    R=$(cf -X PUT "$CF/accounts/$ACCT/workers/domains" -d "{\"environment\":\"production\",\"hostname\":\"$H\",\"service\":\"$SV\",\"zone_id\":\"$ZONE\"}")
    echo "$R" | python3 -c "import sys,json;d=json.load(sys.stdin);print('  attach $H -> $SV:', 'ok' if d.get('success') else d.get('errors'))"
  done
  addroute web-worker/wrangler.toml satsang.digital; addroute web-worker/wrangler.toml www.satsang.digital
  addroute api/wrangler.toml api.satsang.digital; addroute ../mcp/wrangler.toml mcp.satsang.digital ;;
flip)
  sed -i "s/^export const ACTIVE = 'legacy'/export const ACTIVE = 'satsang'/" ../domain.mjs
  echo "BASE now: $(node tools/apply-domain.mjs)" ;;
api)  (cd api && npx wrangler deploy) ;;
mcp)  sh deploy.sh mcp ;;
site) sh deploy.sh ;;
verify)
  for u in https://satsang.digital/ https://satsang.digital/llms.txt https://satsang.digital/agents https://mcp.satsang.digital/health https://mcp.satsang.digital/.well-known/mcp.json; do
    printf '  %s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "$u")" "$u"; done
  printf '  %s\n' "$(curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}' https://tantrafiles.xyz/topic/rebirth?x=1)"
  printf '  %s\n' "$(curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}' https://www.satsang.digital/agents)" ;;
*) echo "unknown phase $P" >&2; exit 1 ;;
esac; done
