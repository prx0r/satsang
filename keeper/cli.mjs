#!/usr/bin/env node
// keeper CLI for agents and people.
//   node keeper/cli.mjs findings [--severity error|warn|info] [--check id] [--status open|fixed|ignored|all] [--limit n] [--json]
//   node keeper/cli.mjs next [--check id] [--n 1]       top-priority unclaimed open work, as JSON
//   node keeper/cli.mjs explain <finding id>            the finding, what its check means, and how to fix and PR it
//   node keeper/cli.mjs status                          uptime + counts
// Reads keeper/state/*.json locally; with --remote (or when local state is missing) reads the keeper-state branch.
import fs from 'node:fs'
import path from 'node:path'
import { KEEPER, STATE, loadConfig, SEV, daysBetween, nowIso } from './lib/util.mjs'
import { rank } from './lib/state.mjs'

const [cmd = 'findings', ...rest] = process.argv.slice(2)
const flag = (k, d) => { const i = rest.indexOf('--' + k); return i >= 0 ? (rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[i + 1] : true) : d }
const cfg = loadConfig()
async function load(name) {
  const f = path.join(STATE, name + '.json')
  if (!flag('remote') && fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'))
  const r = await fetch(`${cfg.stateRaw}/${name}.json`, { headers: { 'user-agent': cfg.userAgent } })
  if (!r.ok) throw new Error(`cannot read ${name}.json from ${cfg.stateRaw} (HTTP ${r.status})`)
  return r.json()
}
const claimsFile = JSON.parse(fs.readFileSync(path.join(KEEPER, 'claims.json'), 'utf8')).claims || {}
const claimed = (o) => { const c = claimsFile[o.id] || (o.claimed_by ? o : null); return c && (c.pr || daysBetween(c.claimed_at) <= 7) }
const checkDoc = async (id) => { try { return (await import(path.join(KEEPER, 'checks', id + '.mjs'))).default } catch { return null } }

const st = await load('findings')
let all = Object.values(st.findings)
if (cmd === 'findings') {
  const s = flag('status', 'open'), sev = flag('severity'), chk = flag('check'), lim = Number(flag('limit', 50))
  all = all.filter((o) => (s === 'all' || o.status === s) && (!sev || o.severity === sev) && (!chk || o.check === chk)).sort((a, b) => rank(b) - rank(a))
  if (flag('json')) console.log(JSON.stringify(all.slice(0, lim), null, 1))
  else { for (const o of all.slice(0, lim)) console.log(`${o.id}  ${o.severity.padEnd(5)} ${o.check.padEnd(10)} ${o.fails}x  ${o.message}  <${o.target}>${claimed(o) ? '  [claimed]' : ''}`); console.log(`(${all.length} ${s}${all.length > lim ? ', showing ' + lim : ''}; updated ${st.updated})`) }
} else if (cmd === 'next') {
  const chk = flag('check'), n = Number(flag('n', 1))
  const pick = all.filter((o) => o.status === 'open' && !claimed(o) && (!chk || o.check === chk) && !(o.autofix && o.severity === 'info')).sort((a, b) => rank(b) - rank(a) || (a.first_seen < b.first_seen ? -1 : 1)).slice(0, n)
  const out = []
  for (const o of pick) { const c = await checkDoc(o.check); out.push({ ...o, how_to_fix: c?.doc, claim: `add "${o.id}": {"claimed_by": "<you>", "claimed_at": "${nowIso()}"} to keeper/claims.json in your PR`, pr_title: `keeper: fix ${o.id} (${o.check})` }) }
  console.log(JSON.stringify(n === 1 ? out[0] || null : out, null, 1))
} else if (cmd === 'explain') {
  const id = rest[0]; const o = st.findings[id]
  if (!o) { console.error(`no finding ${id}`); process.exit(1) }
  const c = await checkDoc(o.check)
  console.log(JSON.stringify(o, null, 1))
  console.log(`\nCheck "${o.check}" (${c?.cadence}): ${c?.doc || ''}`)
  console.log(`\nWorkflow: claim it (keeper/claims.json in a PR to main) -> fix at the source -> PR titled "keeper: fix ${o.id} (${o.check})" with "Fixes keeper finding ${o.id}" in the body -> the next ${c?.cadence || 'scheduled'} run closes it when it passes. Rules: keeper/AGENTS.md.`)
} else if (cmd === 'status') {
  const s = await load('status')
  const open = all.filter((o) => o.status === 'open')
  console.log(JSON.stringify({ base: s.base, updated: s.updated, uptime30d: s.uptime30d, down: s.down, open: open.length, bySeverity: Object.fromEntries(Object.keys(SEV).map((k) => [k, open.filter((o) => o.severity === k).length])) }, null, 1))
} else { console.error('commands: findings | next | explain <id> | status'); process.exit(2) }
