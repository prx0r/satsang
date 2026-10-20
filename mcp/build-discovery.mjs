#!/usr/bin/env node
// Discovery files for agents, generated from data/wiser.json (no hard-coded counts):
//   llms.txt (also mcp/llms.txt, copied to the site by deploy.sh), discovery/llms-full.txt, discovery/mcp.json
//   (served at /.well-known/mcp.json and /.well-known/mcp/server-card.json), discovery/agents.html (BASE/agents),
//   discovery/resources.json (id -> page data for BASE/resource/<id>).
// Usage: node build-discovery.mjs   (after build-data.mjs)
import fs from 'node:fs'
import { buildIndex, TOOLS, SERVER_INFO } from './src/core.mjs'
import { canon, prov } from './src/agents.mjs'
import { BASE, HOST, MCP_BASE } from '../domain.mjs'

const dir = new URL('.', import.meta.url)
const data = JSON.parse(fs.readFileSync(new URL('data/wiser.json', dir), 'utf8'))
const ctx = buildIndex(data)
const out = new URL('discovery/', dir); fs.mkdirSync(new URL('.well-known/mcp/', out), { recursive: true })
const MCP = MCP_BASE, SITE = BASE
const C = data.meta.counts, built = ctx.built
const nRes = Object.keys(ctx.resource).length, nFree = Object.values(ctx.resource).filter((r) => r.access === 'free').length
const nPlaces = Object.keys(data.place).length, nContact = Object.values(data.place).filter((p) => p.contact?.checked).length
const countries = new Set(Object.values(data.place).map((p) => p.country)).size
const pub = Object.values(data.topic).filter((t) => t.state === 'published' && !t.parent)
const fmt = (n) => n.toLocaleString('en-GB')
const toolLine = (t) => `- \`${t.name}\`: ${t.description.split('. ')[0].replace(/\.$/, '')}.`

const llms = `# Satsang

> Satsang (${HOST}) is an open, citable directory of the world's wisdom traditions: ${fmt(C.tradition)} traditions and schools, ${fmt(C.person)} teachers, scholars and historical figures with ${fmt(C.edge)} documented lineage and influence links, ${fmt(nPlaces)} places to practise in ${countries} countries (contacts exactly as each place publishes them, ${fmt(nContact)} checked against the place's own site), ${fmt(nRes)} texts and books (${fmt(nFree)} free from their publishers), ${fmt(C.practice)} practices with cautions, ${fmt(C.topic)} topics compared across traditions and ${fmt(C.clip)} talks from official uploads. Metadata only; videos play on YouTube; transcripts are never published. Data built ${built}.

Licence: Satsang's curation is CC BY 4.0 (credit "Satsang, ${HOST}"); code is MIT. Third-party records (places, texts, talks) are metadata pointing at their sources, under those sources' terms. Wikidata ids are CC0.

## Connect (no sign-in)
- [MCP server, Streamable HTTP](${MCP}/mcp): add as a custom connector in ChatGPT (Settings > Connectors, developer mode) or Claude (Settings > Connectors > Add custom connector). Legacy SSE transport: ${MCP}/sse
- [OpenAPI 3.1 / REST](${MCP}/openapi.json): the same tools as GET endpoints under ${MCP}/api/ (CORS open, rate-limited); import as a Custom GPT Action
- [Server card](${SITE}/.well-known/mcp.json)
- [Data dump manifest](${SITE}/data/index.json): JSON, JSONL and JSON-LD per kind with checksums; [JSON Schemas](${SITE}/schema/)
- [Docs for agents and developers](${SITE}/agents)
- [Full summary for LLMs](${SITE}/llms-full.txt)

## Tools
${TOOLS.map(toolLine).join('\n')}

## Canonical URLs (cite these)
- ${SITE}/person/<id>, /tradition/<id>, /topic/<id>, /practice/<id>, /collection/<id>, /place/<id>, /resource/<id>, /clip/<id>
- Every API/MCP record carries \`url\` (canonical page), \`source_url\` (where the fact comes from), \`verified_on\` (YYYY-MM-DD) and \`confidence\` (high, medium, low).

## Start here
- [Topic flash](${SITE}/): one question, teachers from different traditions
- [Rebirth across traditions](${SITE}/topic/rebirth)
- [Places to practise](${SITE}/#places)
- [Journeys and practices](${SITE}/#collections)

## Rules for agents
- Cite the \`url\` of every record you use; give \`source_url\` for contacts, dates and programmes.
- Contacts are only those a place publishes on its own site; programme dates change, so send people to \`scheduleUrl\` and say when the record was verified.
- Do not invent what a teacher said; quote talk titles. Satsang's one-line "takes" are its own summaries.
- Practices are summaries: respect \`contraindications\` and \`needsTeacher\`, and link the \`sources\`.
- "likely-living" is an inference (teaches on video, no death year recorded); say so when it matters.
`
fs.writeFileSync(new URL('llms.txt', dir), llms)
fs.writeFileSync(new URL('llms.txt', out), llms)

// llms-full: llms.txt + Satsang-authored text (CC BY): topic intros/questions/takes, tradition blurbs, practice summaries
const L = [llms, '\n# Topics (Satsang curation, CC BY 4.0)\n']
for (const t of pub) {
  L.push(`## ${t.label} (${canon('topic', t.id)})`, t.intro || '')
  for (const q of t.questions || []) L.push(`- ${q.label}${q.blurb ? ': ' + q.blurb : ''}`)
  for (const [tr, s] of Object.entries(t.takes || {})) L.push(`- ${data.tradition[tr]?.label || tr}: ${s}`)
  L.push('')
}
L.push('\n# Traditions\n')
const fams = Object.values(data.tradition).filter((t) => !t.parent)
const walk = (t, d) => { L.push(`${'  '.repeat(d)}- ${t.label} (${canon('tradition', t.id)})${t.blurb ? ': ' + t.blurb : ''}`); for (const k of t.children || []) if (data.tradition[k] && data.tradition[k].parent === t.id) walk(data.tradition[k], d + 1) }
for (const f of fams) walk(f, 0)
L.push('\n# Practices\n')
for (const p of Object.values(data.practice)) L.push(`- ${p.name} (${p.traditionLabel || p.traditions[0]}; ${canon('practice', p.id)})${p.needsTeacher ? ' [traditionally given by a teacher]' : ''}${p.contraindications?.length ? ' Cautions: ' + p.contraindications.join(' ') : ''}`)
L.push('\n# Places by country\n')
const byC = {}; for (const p of Object.values(data.place)) (byC[p.country] ||= []).push(p)
for (const [c, ps] of Object.entries(byC).sort((a, b) => b[1].length - a[1].length)) L.push(`- ${c}: ${ps.length} places (${ps.filter((p) => !p.network).slice(0, 8).map((p) => p.name).join('; ')}${ps.length > 8 ? '; ...' : ''})`)
fs.writeFileSync(new URL('llms-full.txt', out), L.join('\n') + '\n')

// server card (/.well-known/mcp.json). Follows the MCP server.json shape (name/title/description/version/remotes) plus a tool list.
const card = {
  $schema: 'https://static.modelcontextprotocol.io/schemas/2025-09-29/server.schema.json',
  name: HOST.split('.').reverse().join('.') + '/satsang', title: SERVER_INFO.title, version: SERVER_INFO.version,
  description: 'Open, read-only directory of the world\u2019s wisdom traditions: traditions, teachers and lineages, places to practise with published contacts, free texts, practices and talks. Every record has a canonical URL, source_url, verified_on and confidence.',
  websiteUrl: `${SITE}/agents`,
  remotes: [{ type: 'streamable-http', url: `${MCP}/mcp` }, { type: 'sse', url: `${MCP}/sse` }],
  authentication: { required: false }, protocolVersions: ['2025-06-18', '2025-03-26', '2024-11-05'],
  capabilities: { tools: { listChanged: false }, resources: {} },
  tools: TOOLS.map((t) => ({ name: t.name, title: t.title, description: t.description, readOnly: true })),
  openapi: `${MCP}/openapi.json`, llms: `${SITE}/llms.txt`, data: `${SITE}/data/index.json`,
  license: { data: 'CC-BY-4.0', code: 'MIT', attribution: `Satsang (${HOST})` }, updated: built,
}
fs.writeFileSync(new URL('mcp.json', out), JSON.stringify(card, null, 2))
fs.writeFileSync(new URL('.well-known/mcp.json', out), JSON.stringify(card, null, 2))
fs.writeFileSync(new URL('.well-known/mcp/server-card.json', out), JSON.stringify(card, null, 2))

// /agents page: plain HTML in the site's dark static-page style (same as credits.html)
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const agents = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>For agents and developers · Satsang</title><meta name="theme-color" content="#0a0d14">
<meta name="description" content="Connect ChatGPT, Claude or any agent to Satsang, an open directory of the wisdom traditions: MCP server, REST/OpenAPI, data dumps, CC BY 4.0.">
<link rel="canonical" href="${SITE}/agents"><link rel="alternate" type="text/plain" href="${SITE}/llms.txt" title="llms.txt">
<style>
body{margin:0;background:#0a0d14;color:#efe9dd;font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:760px;margin:0 auto;padding:40px 22px 60px}
a{color:#e9b764} .brand{font:600 22px/1 Georgia,serif;letter-spacing:.18em;color:#e9b764;text-decoration:none}
h1{font-size:34px;margin:28px 0 4px;font-family:Georgia,serif;font-weight:500} h2{font-size:19px;margin:30px 0 8px} .muted{color:#929aab;font-size:14px}
li{margin:4px 0} code,pre{font:13px/1.5 "JetBrains Mono",ui-monospace,monospace;background:#121725;border:1px solid #1f2638;border-radius:6px}
code{padding:1px 5px} pre{padding:12px 14px;overflow:auto} .url{display:block;margin:8px 0;padding:10px 12px;font-size:15px;color:#e9b764}
table{border-collapse:collapse;width:100%;font-size:14px} td{border-top:1px solid #1f2638;padding:6px 8px 6px 0;vertical-align:top} td:first-child{white-space:nowrap}
</style>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Dataset', name: 'Satsang open data', url: `${SITE}/agents`, description: card.description, license: 'https://creativecommons.org/licenses/by/4.0/', creator: { '@type': 'Organization', name: 'Satsang', url: SITE }, distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${SITE}/data/index.json` }], dateModified: built }).replace(/</g, '\\u003c')}</script>
</head><body><main><a class="brand" href="/">SATSANG</a>
<h1>For agents and developers</h1>
<p class="muted">Satsang is an open, citable directory of the wisdom traditions. Ask ChatGPT, Claude or your own agent about traditions, teachers, lineages, retreats and free texts, and get answers that link back to a page here and to the original source.</p>

<h2>Connector URL</h2>
<code class="url">${MCP}/mcp</code>
<p class="muted">No sign-in. Read-only. Streamable HTTP (MCP ${esc(card.protocolVersions.join(', '))}); legacy SSE at <code>${MCP}/sse</code>.</p>

<h2>Add it to ChatGPT</h2>
<ol><li>Settings &rarr; Apps &amp; Connectors &rarr; Advanced &rarr; turn on Developer mode (Plus, Pro, Business, Enterprise or Edu).</li>
<li>Connectors &rarr; Create: name <b>Satsang</b>, URL <code>${MCP}/mcp</code>, Authentication <b>No authentication</b>.</li>
<li>In a chat, open the tools menu, enable Satsang, and ask e.g. &ldquo;Find residential Theravada retreats in the UK with contact pages&rdquo;. Deep research can use its <code>search</code> and <code>fetch</code> tools.</li></ol>
<p class="muted">Custom GPT instead: Configure &rarr; Actions &rarr; Import from URL <code>${MCP}/openapi.json</code>, authentication None.</p>

<h2>Add it to Claude</h2>
<ol><li>Claude.ai or Claude Desktop: Settings &rarr; Connectors &rarr; Add custom connector &rarr; URL <code>${MCP}/mcp</code>.</li>
<li>Claude Code: <code>claude mcp add --transport http satsang ${MCP}/mcp</code></li>
<li>Other clients (Cursor, VS Code, MCP Inspector): server type HTTP/streamable, same URL.</li></ol>

<h2>Tools</h2>
<table>${TOOLS.map((t) => `<tr><td><code>${esc(t.name)}</code></td><td>${esc(t.description.split('. ')[0].replace(/\.$/, ''))}.</td></tr>`).join('')}</table>

<h2>REST and data</h2>
<ul><li>OpenAPI 3.1: <a href="${MCP}/openapi.json">${MCP}/openapi.json</a> &middot; e.g. <a href="${MCP}/api/places?tradition=theravada&amp;country=GB&amp;offers=residential">/api/places?tradition=theravada&amp;country=GB&amp;offers=residential</a>, <a href="${MCP}/api/study/thai-forest">/api/study/thai-forest</a>, <a href="${MCP}/api/lineage/path?from=thanissaro-bhikkhu&amp;to=ajahn-sao">/api/lineage/path</a></li>
<li>Bulk data: <a href="/data/index.json">/data/index.json</a> (JSON, JSONL, JSON-LD per kind, with checksums) and <a href="/schema/">JSON Schemas</a></li>
<li>Summaries for language models: <a href="/llms.txt">/llms.txt</a>, <a href="/llms-full.txt">/llms-full.txt</a>; server card: <a href="/.well-known/mcp.json">/.well-known/mcp.json</a></li></ul>

<h2>What is in it</h2>
<p>${fmt(C.tradition)} traditions and schools &middot; ${fmt(C.person)} people &middot; ${fmt(C.edge)} lineage links &middot; ${fmt(nPlaces)} places in ${countries} countries &middot; ${fmt(nRes)} texts and books (${fmt(nFree)} free) &middot; ${fmt(C.practice)} practices &middot; ${fmt(C.topic)} topics &middot; ${fmt(C.clip)} talks. Built ${esc(built)}.</p>
<p class="muted">Every answer carries <code>url</code> (the page to cite), <code>source_url</code>, <code>verified_on</code> and <code>confidence</code>. Contacts are shown only as each place publishes them; please do not use them for bulk mail. Programme dates change: follow the place&rsquo;s schedule link.</p>

<h2>Licence</h2>
<p class="muted">Satsang&rsquo;s curation (topic intros, takes, practice summaries, tags, lineage edges, collections) is <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit &ldquo;Satsang, ${HOST}&rdquo;. Third-party records are metadata pointing at their sources, under those sources&rsquo; terms. Code is MIT. Transcripts are never published.</p>
<p class="muted"><a href="/">Back to Satsang</a> &middot; <a href="/credits">Credits</a> &middot; <a href="/privacy">Privacy</a></p>
</main></body></html>
`
fs.writeFileSync(new URL('agents.html', out), agents)

// /schema/ index (keeper links check: llms.txt and /agents link to it): the JSON Schemas in ../specs/schema, served at /schema/<file>
const schemaDir = new URL('../specs/schema/', dir)
const schemas = fs.existsSync(schemaDir) ? fs.readdirSync(schemaDir).filter((f) => f.endsWith('.json')).sort().map((f) => { let j = {}; try { j = JSON.parse(fs.readFileSync(new URL(f, schemaDir), 'utf8')) } catch { /* listed without a title */ } return { f, title: j.title || f.replace(/\.json$/, ''), d: String(j.description || '').split('. ')[0] } }) : []
const schemaIndex = agents.slice(0, agents.indexOf('<style>')).replace(/<title>[^<]*<\/title>/, '<title>JSON Schemas · Satsang</title>')
  .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="JSON Schemas (draft 2020-12) for Satsang\'s open data records.">')
  .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${SITE}/schema/">`)
  + agents.slice(agents.indexOf('<style>'), agents.indexOf('</style>') + 8)
  + `\n</head><body><main><a class="brand" href="/">SATSANG</a>\n<h1>JSON Schemas</h1>\n<p class="muted">JSON Schema draft 2020-12 for every record kind in the <a href="/data/index.json">open data dumps</a> and the MCP results. Licence: CC BY 4.0.</p>\n<table>${schemas.map((x) => `<tr><td><a href="/schema/${esc(x.f)}"><code>${esc(x.f)}</code></a></td><td>${esc(x.title)}${x.d ? `<br><span class="muted">${esc(x.d.replace(/\.$/, ''))}.</span>` : ''}</td></tr>`).join('')}</table>\n<p class="muted"><a href="/agents">For agents and developers</a></p>\n</main></body></html>\n`
fs.writeFileSync(new URL('schema-index.html', out), schemaIndex)

// resource pages data (served by the site worker as plain HTML at /resource/<id>)
const res = {}
for (const r of Object.values(ctx.resource)) { const p = prov(ctx, 'resource', r); res[r.id] = { t: r.title, k: r.kind, a: r.access, u: r.url, l: r.licence, ...(r.licenceUrl ? { lu: r.licenceUrl } : {}), pub: r.publisher, au: (r.authors || []).map((x) => [x, data.person[x]?.name || x]), an: r.authorName, tr: (r.traditions || []).map((x) => [x, data.tradition[x]?.label || x]), s: r.summary, n: r.note, src: p.source_url, v: p.verified_on, c: p.confidence } }
fs.writeFileSync(new URL('resources.json', out), JSON.stringify(res))
console.log('discovery:', { tools: TOOLS.length, resources: nRes, free: nFree, llms: llms.length, llmsFull: fs.statSync(new URL('llms-full.txt', out)).size })
