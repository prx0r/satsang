// keeper/REPORT.md: a human summary of the current state.
import fs from 'node:fs'
import path from 'node:path'
import { KEEPER, nowIso } from './util.mjs'
import { rank } from './state.mjs'

export function writeReport(cfg, state, status, runs, dead, reverify) {
  const open = Object.values(state.findings).filter((o) => o.status === 'open')
  const by = (k) => open.reduce((a, o) => ((a[o[k]] = (a[o[k]] || 0) + 1), a), {})
  const sev = by('severity'), chk = by('check')
  const L = []
  L.push(`# Keeper report`, '', `Updated ${nowIso()} for ${cfg.base}. State branch: \`${cfg.stateBranch}\`. Agents: see keeper/AGENTS.md.`, '')
  L.push(`**Open findings:** ${open.length} (error ${sev.error || 0}, warn ${sev.warn || 0}, info ${sev.info || 0}). **Uptime (30 d):** ${status.uptime30d ?? 'n/a'}%. **Down now:** ${status.down?.length ? status.down.join(', ') : 'nothing'}.`)
  L.push(`**Dead:** ${dead.clips.length} clips (${dead.videos.length} videos), ${dead.urls.length} external URLs. **Re-verify queue:** ${reverify?.count ?? 0}.`, '')
  L.push('## By check', '', '| check | open | error | warn | info | last run | checked |', '|---|---:|---:|---:|---:|---|---:|')
  for (const id of Object.keys({ ...runs, ...chk }).sort()) {
    const o = open.filter((x) => x.check === id), r = runs[id] || {}
    L.push(`| ${id} | ${o.length} | ${o.filter((x) => x.severity === 'error').length} | ${o.filter((x) => x.severity === 'warn').length} | ${o.filter((x) => x.severity === 'info').length} | ${r.at || ''} | ${r.checked ?? ''}${r.total ? ' / ' + r.total : ''} |`)
  }
  L.push('', '## Top problems', '')
  for (const o of open.filter((o) => o.severity !== 'info').sort((a, b) => rank(b) - rank(a)).slice(0, 25)) L.push(`- \`${o.id}\` **${o.severity}** ${o.check}: ${o.message} — ${o.target}${o.fails > 1 ? ` (${o.fails}× in a row)` : ''}${o.claimed_by ? ` [claimed by ${o.claimed_by}]` : ''}`)
  L.push('', '## Uptime by probe (30 d)', '', '| probe | up % | avg ms | last |', '|---|---:|---:|---|')
  for (const [n, p] of Object.entries(status.probes || {}).sort()) {
    const t = Object.values(p.days).reduce((a, d) => [a[0] + d[0], a[1] + d[1], a[2] + d[2]], [0, 0, 0])
    L.push(`| ${n} | ${t[1] ? ((t[0] / t[1]) * 100).toFixed(1) : '-'} | ${t[1] ? Math.round(t[2] / t[1]) : '-'} | ${p.last ? (p.last.ok ? 'up' : 'DOWN ' + p.last.code) + ' ' + p.last.at : ''} |`)
  }
  if (status.notes?.perf) { L.push('', '## Performance (key pages)', ''); for (const [p, v] of Object.entries(status.notes.perf)) if (p !== 'at') L.push(`- ${p}: TTFB ${v.ttfb} ms, ${(v.weight / 1e6).toFixed(2)} MB (${v.assets} assets)`) }
  if (status.notes?.bundle) { L.push('', '## Worker bundles', ''); for (const k of ['site', 'mcp']) { const v = status.notes.bundle[k]; if (v?.files) L.push(`- ${k}: ${(v.gzip / 1e6).toFixed(2)} MB gzip (${(v.raw / 1e6).toFixed(2)} MB raw), ${v.basis}`) } }
  fs.writeFileSync(path.join(KEEPER, 'REPORT.md'), L.join('\n') + '\n')
}
