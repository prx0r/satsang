#!/usr/bin/env node
// keeper runner: node keeper/run.mjs --cadence hourly|daily|weekly|all [--only id[,id]] [--limit n] [--budget seconds]
// Runs the checks for a cadence, merges findings into state/findings.json (consecutive fails, auto-close on pass),
// writes state/dead.json, state/status.json, state/reverify.json, state/runs.json and keeper/REPORT.md.
import fs from 'node:fs'
import path from 'node:path'
import { KEEPER, STATE, loadConfig, readJson, writeJson, nowIso, today, iso } from './lib/util.mjs'
import { makeHttp } from './lib/http.mjs'
import { makeData } from './lib/data.mjs'
import { loadFindings, merge, overlay, prune, save, DEAD_CHECKS } from './lib/state.mjs'
import { writeReport } from './lib/report.mjs'

const args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d }
const cadence = arg('cadence', 'hourly'), only = arg('only') ? arg('only').split(',') : null, limitN = arg('limit') ? Number(arg('limit')) : null
const budget = Number(arg('budget', cadence === 'hourly' ? 600 : 2400)) * 1000
const cfg = loadConfig()
const ORDER = { hourly: ['hourly'], daily: ['daily'], weekly: ['weekly'], all: ['hourly', 'daily', 'weekly'] }[cadence]
if (!ORDER) { console.error('cadence must be hourly|daily|weekly|all'); process.exit(2) }

// one runner at a time on this checkout (Actions also has a concurrency group); a stale lock (> 1 h) is taken over
const LOCK = path.join(STATE, '.lock')
fs.mkdirSync(STATE, { recursive: true })
try { const st = fs.statSync(LOCK); if (Date.now() - st.mtimeMs < 3600e3) { console.error(`keeper: another run holds ${LOCK} (pid ${fs.readFileSync(LOCK, 'utf8')}); exiting`); process.exit(3) } } catch { /* no lock */ }
fs.writeFileSync(LOCK, String(process.pid))
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(130))
process.on('exit', () => { try { if (fs.readFileSync(LOCK, 'utf8') === String(process.pid)) fs.unlinkSync(LOCK) } catch { /* gone */ } })

const checks = []
for (const f of fs.readdirSync(path.join(KEEPER, 'checks')).filter((f) => f.endsWith('.mjs')).sort()) checks.push((await import(path.join(KEEPER, 'checks', f))).default)
let run = checks.filter((c) => (only ? only.includes(c.id) : ORDER.includes(c.cadence)))
// weekly = full sweeps of the rolling checks too
if (cadence === 'weekly' && !only) run = checks.filter((c) => ['weekly', 'hourly'].includes(c.cadence) || c.id === 'links')

const http = makeHttp({ userAgent: cfg.userAgent, hostMs: { 'www.youtube.com': 150 } })
const data = makeData(cfg, http)
const state = loadFindings()
const cursor = readJson(path.join(STATE, 'cursor.json'), {})
const status = readJson(path.join(STATE, 'status.json'), { base: cfg.base, probes: {}, notes: {} })
const runs = readJson(path.join(STATE, 'runs.json'), {})
const t0 = Date.now()

const ctx = {
  today: today(), cfg, http, data, cadence: cadence === 'all' ? 'daily' : cadence, state,
  limit: (n) => (limitN ? Math.min(n, limitN) : n),
  timeUp: () => Date.now() - t0 > budget,
  // rolling window over a stable sorted list: open failures first (up to a third), then from the cursor, wrapping
  rolling(name, items, n, failing) {
    if (!items.length) return []
    const set = new Set(items), pick = []
    if (failing) for (const o of Object.values(state.findings)) { const t = failing(o); if (t && set.has(t) && pick.length < Math.ceil(n / 3)) pick.push(t) }
    const have = new Set(pick); let i = (cursor[name] || 0) % items.length, steps = 0
    while (pick.length < Math.min(n, items.length) && steps < items.length) { const t = items[i]; if (!have.has(t)) { pick.push(t); have.add(t) } i = (i + 1) % items.length; steps++ }
    cursor[name] = i
    return pick
  },
  status: {
    record(name, ok, ms, code) {
      const p = (status.probes[name] ||= { days: {}, last: null })
      const d = (p.days[today()] ||= [0, 0, 0]) // [up, total, ms sum]
      d[0] += ok ? 1 : 0; d[1] += 1; d[2] += Math.round(ms || 0)
      p.last = { ok, ms: Math.round(ms || 0), code, at: nowIso() }
    },
    note(k, v) { status.notes[k] = { ...v, at: nowIso() } },
  },
  autofixed: [],
  autofix(name, obj) { writeJson(path.join(STATE, name + '.json'), obj); ctx.autofixed.push(name) },
}

for (const c of run) {
  const s = Date.now()
  let res
  try { res = await c.run(ctx) } catch (e) { res = { findings: [{ target: 'check:' + c.id, key: 'crash', severity: 'warn', message: `keeper check ${c.id} crashed: ${e.message}`, evidence: { stack: String(e.stack).split('\n').slice(0, 4).join(' | ') } }], passed: [], crashed: true } }
  merge(state, c, { ...res, full: (res.full ?? c.full) && !res.crashed }, cfg)
  if (!res.crashed) merge(state, { id: c.id }, { findings: [], passed: [['check:' + c.id, 'crash']] }, cfg)
  const { findings, passed, full, ...rest } = res
  runs[c.id] = { at: nowIso(), cadence, ms: Date.now() - s, failing: findings.length, passed: passed?.length || 0, ...rest }
  console.log(`${c.id.padEnd(11)} ${String(findings.length).padStart(5)} failing  ${String(passed?.length || 0).padStart(5)} passing  ${((Date.now() - s) / 1000).toFixed(1)}s  ${JSON.stringify(rest).slice(0, 160)}`)
}

overlay(state); prune(state)
// trim uptime history to cfg.uptimeDays
const cut = iso(new Date(Date.now() - cfg.uptimeDays * 86400000)).slice(0, 10)
for (const p of Object.values(status.probes)) for (const d of Object.keys(p.days)) if (d < cut) delete p.days[d]
status.base = cfg.base; status.updated = nowIso()
const up = Object.values(status.probes).reduce((a, p) => { for (const d of Object.values(p.days)) { a[0] += d[0]; a[1] += d[1] } return a }, [0, 0])
status.uptime30d = up[1] ? Math.round((up[0] / up[1]) * 10000) / 100 : null
status.open = Object.values(state.findings).filter((o) => o.status === 'open').reduce((a, o) => ((a[o.severity] = (a[o.severity] || 0) + 1), a), {})
status.down = Object.values(state.findings).filter((o) => o.check === 'uptime' && o.status === 'open').map((o) => o.target)

// autofix: dead.json (clips and URLs dead after cfg.deadAfter consecutive failures). Site and MCP read it, fail-open.
const deadF = Object.values(state.findings).filter((o) => DEAD_CHECKS.has(o.check) && o.status === 'open' && o.fails >= cfg.deadAfter)
const deadVideos = deadF.filter((o) => o.check === 'oembed').map((o) => o.target).sort()
const clipIds = new Set(); for (const o of deadF.filter((o) => o.check === 'oembed')) for (const id of o.evidence?.clips || []) clipIds.add(id)
// clip ids beyond the 20 kept in evidence: expand from the dump when it is loaded
if (deadVideos.length) { try { const dv = new Set(deadVideos); for (const c of await data.dump('clip')) if (dv.has(c.media?.videoId)) clipIds.add(c.id) } catch { /* evidence ids only */ } }
const dead = { updated: nowIso(), rule: `dead after ${cfg.deadAfter} consecutive failing runs; 403/429 count as unknown, never dead`, clips: [...clipIds].sort(), videos: deadVideos, urls: deadF.filter((o) => o.check === 'linkrot').map((o) => o.target).sort() }
writeJson(path.join(STATE, 'dead.json'), dead); ctx.autofixed.push('dead')

save(state)
writeJson(path.join(STATE, 'cursor.json'), cursor)
writeJson(path.join(STATE, 'status.json'), status, false)
writeJson(path.join(STATE, 'runs.json'), runs)
writeReport(cfg, state, status, runs, dead, readJson(path.join(STATE, 'reverify.json'), null))
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s; open: ${JSON.stringify(status.open)}; dead clips ${dead.clips.length}, urls ${dead.urls.length}; uptime30d ${status.uptime30d}%`)
// exit code: 0 always (failures are findings, not crashes); outage handling is keeper/outage.mjs
