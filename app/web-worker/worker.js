// wiser-web (Satsang site): serves the static site (embedded by embed.mjs from ../dist) on BASE (../../domain.mjs); www. 301s to the apex,
// and once BASE moved off tantrafiles.xyz the old hosts 301 to BASE keeping the path.
import SITE from './site.gen.js'
import META from './meta.gen.js' // path pages: title, description, JSON-LD (build-meta.mjs)
import RES from './resources.gen.js' // /resource/<id> plain pages (build-meta.mjs <- mcp/discovery/resources.json)
import { withoutDeadClips } from './keeper-dead.mjs' // keeper: hide dead clips (fail-open; keeper/AGENTS.md)
import REDIRECTS from './redirects.json' // keeper: merged duplicate records, /place/<old> -> /place/<kept> (tools/apply-keeper-fixes.py)
import { BASE, HOST, MCP_BASE, SITE_ORIGINS } from '../../domain.mjs' // public hostnames (one place)
const OUR_HOSTS = SITE_ORIGINS.map((o) => new URL(o).host)
const hdr = (type, extra = {}) => ({ 'content-type': type, 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin', ...extra })
export default {
  async fetch(req, env) {
    const u = new URL(req.url)
    if (u.hostname !== HOST && OUR_HOSTS.includes(u.hostname)) { const to = new URL(u.pathname + u.search, BASE); return Response.redirect(to.toString(), 301) }
    if (/^\/u\/[A-Za-z0-9_]{3,20}\/?$/.test(u.pathname)) return Response.redirect(u.origin + '/#u/' + u.pathname.split('/')[2], 302)
    if (u.pathname === '/geo.json') { // approximate (city-level) location from Cloudflare, for "nearest first"; never logged or stored
      const cf = req.cf || {}, lat = Number(cf.latitude), lng = Number(cf.longitude)
      return new Response(JSON.stringify(isFinite(lat) && isFinite(lng) && cf.latitude ? { lat: Math.round(lat * 10) / 10, lng: Math.round(lng * 10) / 10, country: cf.country || null } : {}), { headers: hdr('application/json; charset=utf-8', { 'cache-control': 'private, no-store' }) })
    }
    let p = decodeURIComponent(u.pathname); if (p.endsWith('/')) p += 'index.html'
    const moved = REDIRECTS[p.replace(/\/(index\.html)?$/, '')]; if (moved) return Response.redirect(u.origin + moved + u.search, 301)
    // open data dumps (KV wiser-open-data; mcp/build-dump.mjs): /data/index.json, /data/<kind>.json|.jsonl, /data/wiser.jsonld
    if (/^\/data\/[a-z]+\.(json|jsonl|jsonld)$/.test(p) && !SITE[p] && env && env.DATA) {
      const body = await env.DATA.get(p.slice(1), 'stream')
      if (body) return new Response(req.method === 'HEAD' ? null : body, { headers: hdr(p.endsWith('.jsonl') ? 'application/x-ndjson; charset=utf-8' : p.endsWith('.jsonld') ? 'application/ld+json; charset=utf-8' : 'application/json; charset=utf-8', { 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*' }) })
    }
    // agent-facing canonical URLs: /resource/<id> (plain page), /text/<id> -> /resource/<id>, /clip/<id> -> player, /openapi.json -> MCP host
    if (/^\/text\/[^/]+\/?$/.test(p)) return Response.redirect(u.origin + '/resource/' + encodeURIComponent(p.split('/')[2]), 301)
    if (/^\/clip\/.+/.test(p)) return Response.redirect(u.origin + '/#watch/' + encodeURIComponent(p.slice(6).replace(/\/$/, '')), 302)
    if (p === '/openapi.json' || p === '/.well-known/openapi.json') return Response.redirect(MCP_BASE + '/openapi.json', 302)
    const rm = p.match(/^\/resource\/([^/]+)\/?$/)
    if (rm) { const r = RES[rm[1]]; return new Response(req.method === 'HEAD' ? null : resourcePage(rm[1], r), { status: r ? 200 : 404, headers: hdr('text/html; charset=utf-8', { 'cache-control': 'public, max-age=3600' }) }) }
    // path pages: /person/<id> etc. serve the app with server-filled metadata; the client opens the in-app route
    const pm = p.match(/^\/(person|topic|tradition|practice|collection|place)\/(.+?)\/?$/)
    if (pm && META[`/${pm[1]}/${pm[2]}`] && SITE['/index.html']) {
      const [t, d, ld] = META[`/${pm[1]}/${pm[2]}`], esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
      const canon = BASE + p.replace(/\/$/, '')
      let html = SITE['/index.html'][1].replace('<head>', '<head>\n<base href="/">')
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(t)}</title>`)
        .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(d)}"><link rel="canonical" href="${canon}">`)
        .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(t)}">`)
        .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(d)}">`)
      if (ld) html = html.replace('</head>', `<script type="application/ld+json">${ld.replace(/</g, '\\u003c')}</script>\n</head>`)
      return new Response(req.method === 'HEAD' ? null : html, { headers: hdr('text/html; charset=utf-8', { 'cache-control': 'public, max-age=600' }) })
    }
    const f = SITE[p] || SITE[p + '.html']
    if (!f) { const nf = SITE['/404.html']; return new Response(nf ? nf[1] : 'Not found', { status: 404, headers: hdr('text/html; charset=utf-8') }) }
    if (p === '/clips.json' && req.method !== 'HEAD') return new Response(await withoutDeadClips(f[1], SITE['/index.html']?.[1]?.length), { headers: hdr(f[0], { 'cache-control': 'public, max-age=300', 'access-control-allow-origin': '*' }) }) // keeper hook
    const cache = p === '/index.html' ? 'no-cache' : /\.json$/.test(p) ? 'public, max-age=300' : u.searchParams.has('v') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600'
    return new Response(req.method === 'HEAD' ? null : f[1], { headers: hdr(f[0], { 'cache-control': cache, ...(/\.json$/.test(p) ? { 'access-control-allow-origin': '*' } : {}) }) })
  },
}

// /resource/<id>: a citable plain page in the site's dark static-page style (as credits.html), with schema.org JSON-LD.
function resourcePage(id, r) {
  const e = (x) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const canon = BASE + '/resource/' + encodeURIComponent(id)
  const head = (t, d) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(t)} \u00b7 Satsang</title><meta name="theme-color" content="#0a0d14"><meta name="description" content="${e(d)}"><link rel="canonical" href="${canon}"><style>body{margin:0;background:#0a0d14;color:#efe9dd;font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}main{max-width:720px;margin:0 auto;padding:40px 22px 60px}a{color:#e9b764}.brand{font:600 22px/1 Georgia,serif;letter-spacing:.18em;color:#e9b764;text-decoration:none}h1{font-size:32px;margin:28px 0 6px;font-family:Georgia,serif;font-weight:500}.muted{color:#929aab;font-size:14px}.btn{display:inline-block;margin:14px 0;padding:10px 16px;border:1px solid #e9b764;border-radius:8px;text-decoration:none}dl{display:grid;grid-template-columns:max-content 1fr;gap:4px 14px;font-size:14px}dt{color:#929aab}</style>`
  if (!r) return head('Not found', 'Unknown resource') + '</head><body><main><a class="brand" href="/">SATSANG</a><h1>Resource not found</h1><p class="muted"><a href="/agents">Search it through the API</a></p></main></body></html>'
  const ld = { '@context': 'https://schema.org', '@type': r.k === 'book' ? 'Book' : 'CreativeWork', '@id': canon, url: canon, name: r.t, author: r.au.length ? r.au.map(([pid, n]) => ({ '@type': 'Person', name: n, url: BASE + '/person/' + pid })) : r.an ? { '@type': 'Person', name: r.an } : undefined,
    isAccessibleForFree: r.a === 'free' ? true : undefined, sameAs: r.u || undefined, about: r.tr.map(([tid, l]) => ({ '@type': 'DefinedTerm', name: l, url: BASE + '/tradition/' + tid })), license: r.l || undefined, dateModified: r.v }
  const access = r.a === 'free' ? 'Free from the publisher' : r.a === 'no-link' ? 'No edition linked yet' : 'Published work, not known to be free'
  return head(r.t, `${r.t}${r.an ? ' by ' + r.an : ''}: ${access}.`) + `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script></head><body><main><a class="brand" href="/">SATSANG</a>
<h1>${e(r.t)}</h1><p class="muted">${e(r.k)}${r.au.length ? ' \u00b7 ' + r.au.map(([pid, n]) => `<a href="/person/${e(pid)}">${e(n)}</a>`).join(', ') : r.an ? ' \u00b7 ' + e(r.an) : ''}${r.tr.length ? ' \u00b7 ' + r.tr.map(([tid, l]) => `<a href="/tradition/${e(tid)}">${e(l)}</a>`).join(', ') : ''}</p>
${r.s ? `<p>${e(r.s)}</p>` : ''}${r.n ? `<p class="muted">${e(r.n)}</p>` : ''}
${r.u ? `<a class="btn" href="${e(r.u)}" rel="noopener">${r.a === 'free' ? 'Read it free' : 'Open'} on ${e(r.pub || new URL(r.u).hostname)}</a>` : ''}
<dl><dt>Access</dt><dd>${e(access)}</dd>${r.l ? `<dt>Terms</dt><dd>${e(r.l)}</dd>` : ''}<dt>Source</dt><dd>${r.src ? `<a href="${e(r.src)}" rel="noopener">${e(r.src)}</a>` : 'n/a'}</dd><dt>Verified</dt><dd>${e(r.v || '')} \u00b7 confidence ${e(r.c || '')}</dd></dl>
<p class="muted">Satsang links to the publisher\u2019s own edition and never rehosts texts. Data: CC BY 4.0 (Satsang curation). <a href="/agents">For agents and developers</a></p></main></body></html>`
}
