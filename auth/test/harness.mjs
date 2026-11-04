// test harness: D1 shim over node:sqlite, a fake Google issuer (local RS256 JWKS), a clock you can move. No network.
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { generateKeyPair, exportJWK, SignJWT, createLocalJWKSet } from 'jose'
import { makeApp } from '../src/app.js'
import { b64u } from '../src/crypto.js'

export function d1(schemaPath = new URL('../schema.sql', import.meta.url)) {
  const db = new DatabaseSync(':memory:'); db.exec(readFileSync(schemaPath, 'utf8'))
  const stmt = (sql) => { let args = []; const s = {
    bind: (...a) => { args = a; return s },
    first: async () => { const r = db.prepare(sql).all(...args); return r[0] || null },
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    run: async () => { const r = db.prepare(sql).run(...args); return { success: true, meta: { changes: r.changes } } },
    _exec: () => db.prepare(sql).run(...args) }; return s }
  return { prepare: stmt, batch: async (list) => { db.exec('BEGIN'); try { const out = list.map((s) => s._exec()); db.exec('COMMIT'); return out } catch (e) { db.exec('ROLLBACK'); throw e } }, raw: db }
}
let offset = 0; const realNow = Date.now
Date.now = () => realNow() + offset
export const clock = { advance: (s) => { offset += s * 1000 }, reset: () => { offset = 0 } }

export async function setup(extra = {}) {
  const g = await generateKeyPair('RS256'), gj = await exportJWK(g.publicKey); gj.kid = 'g1'; gj.alg = 'RS256'
  const gset = createLocalJWKSet({ keys: [gj] })
  const a = await generateKeyPair('ES256', { extractable: true }), aj = await exportJWK(a.privateKey); aj.kid = 'test-1'
  const env = { DB: d1(), GOOGLE_CLIENT_ID: 'test-client.apps.googleusercontent.com', AUTH_PRIVATE_JWK: JSON.stringify(aj), SUB_PEPPER: 'pepper-test',
    JOURNEY_MASTER_KEY: b64u(crypto.getRandomValues(new Uint8Array(32))), EXTRA_ORIGINS: '', ...extra }
  const app = makeApp({ googleKeys: () => gset, clientJs: readFileSync(new URL('../client/auth.js', import.meta.url), 'utf8') })
  const googleToken = (sub, o = {}) => new SignJWT({ email: 'x@example.com', name: 'X', ...(o.claims || {}) }).setProtectedHeader({ alg: 'RS256', kid: 'g1' })
    .setIssuer(o.iss || 'https://accounts.google.com').setAudience(o.aud || env.GOOGLE_CLIENT_ID).setSubject(sub).setIssuedAt().setExpirationTime(o.exp || '1h').sign(o.key || g.privateKey)
  const req = async (method, path, { body, origin, token } = {}) => {
    const h = {}; if (body) h['content-type'] = 'application/json'; if (origin) h.origin = origin; if (token) h.authorization = 'Bearer ' + token
    const r = await app.request('https://auth.tantrafiles.xyz' + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined }, env)
    let j = null; const txt = await r.text(); try { j = JSON.parse(txt) } catch { j = txt }
    return { status: r.status, j, headers: r.headers }
  }
  const signIn = async (sub, origin = 'https://tantrafiles.xyz') => (await req('POST', '/v1/google', { body: { credential: await googleToken(sub) }, origin })).j
  return { env, app, req, googleToken, signIn, otherKey: (await generateKeyPair('RS256')).privateKey }
}
let pass = 0, fail = 0
export function t(name, ok, extra = '') { if (ok) { pass++; console.log('ok   ' + name) } else { fail++; console.log('FAIL ' + name + ' ' + extra) } }
export function done(label) { console.log(`${label}: ${pass} passed, ${fail} failed`); if (fail) process.exit(1) }
