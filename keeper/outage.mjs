#!/usr/bin/env node
// Opens or closes ONE GitHub issue labelled keeper-outage from the uptime findings. Needs GITHUB_TOKEN and
// GITHUB_REPOSITORY (set in Actions). Without them it prints what it would do and exits 0.
import { readJson, loadConfig, nowIso } from './lib/util.mjs'
import { FINDINGS } from './lib/state.mjs'
const cfg = loadConfig(), token = process.env.GITHUB_TOKEN, repo = process.env.GITHUB_REPOSITORY || cfg.repo
const down = Object.values(readJson(FINDINGS, { findings: {} }).findings).filter((o) => o.check === 'uptime' && o.status === 'open')
const api = async (p, opt = {}) => { const r = await fetch('https://api.github.com/repos/' + repo + p, { ...opt, headers: { authorization: 'Bearer ' + token, accept: 'application/vnd.github+json', 'user-agent': 'satsang-keeper', 'content-type': 'application/json' } }); if (!r.ok && r.status !== 422) throw new Error(`${p} ${r.status} ${await r.text()}`); return r.status === 204 ? null : r.json() }
const body = () => `Keeper uptime probes failing on ${cfg.base}:\n\n${down.map((o) => `- **${o.target}**: ${o.message} (${o.fails} run(s) in a row, since ${o.first_seen})`).join('\n')}\n\nThis issue closes itself when every probe passes. Report: https://github.com/${repo}/blob/${cfg.stateBranch}/keeper/REPORT.md`
if (!token) { console.log(down.length ? `would open/update keeper-outage: ${down.map((o) => o.target).join(', ')}` : 'all probes up; would close any keeper-outage issue'); process.exit(0) }
await api('/labels', { method: 'POST', body: JSON.stringify({ name: 'keeper-outage', color: 'b60205', description: 'Opened and closed by keeper uptime checks' }) })
const open = await api('/issues?state=open&labels=keeper-outage&per_page=5')
if (down.length) {
  if (open.length) { await api(`/issues/${open[0].number}`, { method: 'PATCH', body: JSON.stringify({ body: body() }) }); console.log('updated issue #' + open[0].number) }
  else { const i = await api('/issues', { method: 'POST', body: JSON.stringify({ title: `Outage: ${down.map((o) => o.target).join(', ')}`, body: body(), labels: ['keeper-outage'] }) }); console.log('opened issue #' + i.number) }
} else for (const i of open) { await api(`/issues/${i.number}/comments`, { method: 'POST', body: JSON.stringify({ body: `All uptime probes pass again (${nowIso()}). Closing.` }) }); await api(`/issues/${i.number}`, { method: 'PATCH', body: JSON.stringify({ state: 'closed', state_reason: 'completed' }) }); console.log('closed issue #' + i.number) }
