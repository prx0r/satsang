// Findings state: merge a run into keeper/state/findings.json with consecutive-failure counts, auto-close on pass,
// ignore/claim overlays from keeper/ignore.json and keeper/claims.json (both edited on main, by PR).
import fs from 'node:fs'
import path from 'node:path'
import { STATE, KEEPER, readJson, writeJson, nowIso, sha, SEV, daysBetween } from './util.mjs'

export const FINDINGS = path.join(STATE, 'findings.json')
export const findingId = (check, target, key = '') => sha(`${check}|${target}|${key}`)
export const DEAD_CHECKS = new Set(['linkrot', 'oembed'])

export function loadFindings() { return readJson(FINDINGS, { updated: null, findings: {} }) }

export function merge(state, check, result, cfg) {
  const F = state.findings, now = nowIso(), seen = new Set()
  for (const f of result.findings) {
    const id = findingId(check.id, f.target, f.key)
    seen.add(id)
    const old = F[id]
    const fails = old && old.status === 'open' ? (old.fails || 0) + 1 : 1
    let severity = f.severity || 'warn'
    if (DEAD_CHECKS.has(check.id) && f.severity !== 'info') severity = fails >= cfg.deadAfter ? 'error' : 'warn'
    F[id] = {
      id, check: check.id, severity, target: f.target, key: f.key || undefined, message: f.message, evidence: f.evidence,
      first_seen: old && old.status === 'open' ? old.first_seen : now, last_seen: now, fails,
      autofix: f.autofix || undefined, status: old?.status === 'ignored' ? 'ignored' : 'open',
      claimed_by: old?.claimed_by, claimed_at: old?.claimed_at,
    }
  }
  const close = (id) => { const o = F[id]; if (o && o.status === 'open') { o.status = 'fixed'; o.fixed_at = now; o.fails = 0 } }
  for (const target of result.passed || []) { const [t, k] = Array.isArray(target) ? target : [target, '']; const id = findingId(check.id, t, k); if (!seen.has(id)) close(id) }
  if (result.full) for (const [id, o] of Object.entries(F)) if (o.check === check.id && !seen.has(id)) close(id)
}

export function overlay(state) {
  const ignore = readJson(path.join(KEEPER, 'ignore.json'), { ids: [], patterns: [] })
  const claims = readJson(path.join(KEEPER, 'claims.json'), { claims: {} }).claims || {}
  const pats = (ignore.patterns || []).map((p) => ({ check: p.check, re: new RegExp(p.target) }))
  for (const o of Object.values(state.findings)) {
    const ign = (ignore.ids || []).includes(o.id) || pats.some((p) => (!p.check || p.check === o.check) && p.re.test(o.target))
    if (ign && o.status === 'open') o.status = 'ignored'
    if (!ign && o.status === 'ignored') o.status = 'open'
    const c = claims[o.id]
    if (c) { o.claimed_by = c.claimed_by; o.claimed_at = c.claimed_at; if (c.pr) o.pr = c.pr } else { delete o.claimed_by; delete o.claimed_at; delete o.pr }
  }
}

export function prune(state, days = 30) {
  for (const [id, o] of Object.entries(state.findings)) if (o.status === 'fixed' && daysBetween(o.fixed_at) > days) delete state.findings[id]
}

export const rank = (o) => (SEV[o.severity] || 0) * 1e6 + Math.min(o.fails || 0, 999) * 1e3 - (o.autofix ? 500 : 0)

export function save(state) { // one finding per line: small, readable git diffs on the keeper-state branch
  state.updated = nowIso()
  const ids = Object.keys(state.findings).sort()
  const body = ids.map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(state.findings[id])}`).join(',\n')
  fs.mkdirSync(STATE, { recursive: true })
  fs.writeFileSync(FINDINGS, `{"updated": ${JSON.stringify(state.updated)}, "count": ${ids.length}, "findings": {\n${body}\n}}\n`)
}
