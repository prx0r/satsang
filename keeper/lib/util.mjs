// Shared helpers for keeper: config, hashing, folding, dates. Node 20+, no dependencies.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

export const KEEPER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const ROOT = path.resolve(KEEPER, '..')
export const STATE = path.join(KEEPER, 'state')

export function loadConfig() {
  const c = JSON.parse(fs.readFileSync(path.join(KEEPER, 'config.json'), 'utf8'))
  // env overrides, for the domain switch or a staging host: KEEPER_BASE, KEEPER_API, KEEPER_MCP
  if (process.env.KEEPER_BASE) c.base = process.env.KEEPER_BASE.replace(/\/$/, '')
  if (process.env.KEEPER_API) c.api = process.env.KEEPER_API.replace(/\/$/, '')
  if (process.env.KEEPER_MCP) c.mcp = process.env.KEEPER_MCP.replace(/\/$/, '')
  c.host = new URL(c.base).host
  return c
}
export const sha = (s, n = 12) => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, n)
export const fold = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
// ISO strings built from UTC parts (some sandboxes patch Date#toISOString)
const p2 = (n) => String(n).padStart(2, '0')
export const iso = (d = new Date()) => `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}T${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())}Z`
export const today = () => iso().slice(0, 10)
export const nowIso = () => iso()
export const daysBetween = (a, b = new Date()) => Math.floor((new Date(b) - new Date(a)) / 86400000)
export const readJson = (f, dflt) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch { return dflt } }
export const writeJson = (f, o, pretty = true) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, pretty ? 1 : 0) + '\n') }
export const clip = (s, n = 300) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n) + '…' : s }
export const SEV = { error: 3, warn: 2, info: 1 }
