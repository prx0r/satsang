// Satsang: the one place that names the public hostnames. Imported by the site (src/), the site Worker (app/web-worker),
// the API (app/api), the MCP (mcp/src) and the build scripts, so canonical URLs, sitemaps, JSON-LD, llms.txt, the OpenAPI
// servers and the MCP discovery files all follow it.
//
// ACTIVE = 'satsang' -> https://satsang.digital (+ api./mcp. subdomains)  [the default home]
// ACTIVE = 'legacy'  -> https://tantrafiles.xyz, used while the satsang.digital zone is pending so nothing points at a dead domain.
// tools/switch-domain.sh flips this line once the Cloudflare zone is active.
export const ACTIVE = 'legacy'

export const NAME = 'Satsang'
export const WORDMARK = 'SATSANG'
export const CONTACT_EMAIL = 'hello@tantrafiles.xyz' // the mailbox that exists today; change once mail runs on satsang.digital
export const DOMAINS = {
  satsang: { base: 'https://satsang.digital', api: 'https://api.satsang.digital', mcp: 'https://mcp.satsang.digital' },
  legacy: { base: 'https://tantrafiles.xyz', api: 'https://api.tantrafiles.xyz', mcp: 'https://mcp.tantrafiles.xyz' },
}
const D = DOMAINS[ACTIVE] || DOMAINS.satsang
export const BASE = D.base
export const API_BASE = D.api
export const MCP_BASE = D.mcp
export const HOST = new URL(BASE).host
// every site origin we own, old and new (CORS, share links, URL parsing)
export const SITE_ORIGINS = Object.values(DOMAINS).flatMap((d) => [d.base, d.base.replace('://', '://www.')])
// regex source matching any of our site URLs with a trailing slash, e.g. for stripping "https://satsang.digital/" off an id
export const SITE_URL_RE = '^https?:\\/\\/(www\\.)?(' + Object.values(DOMAINS).map((d) => new URL(d.base).host.replace(/\./g, '\\.')).join('|') + ')\\/?'
