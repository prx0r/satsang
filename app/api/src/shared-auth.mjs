// The shared Satsang account (satsang-auth, auth.tantrafiles.xyz; specs/SHARED-ACCOUNT.md): wiser-api accepts its ES256 access tokens
// next to the legacy HS256 session. Verified locally against the public JWKS (env.AUTH_JWKS, committed: public keys only), falling back
// to the live JWKS URL. iss/aud/exp/alg are checked; the token's sub is the account id, also used as users.id here.
import { createLocalJWKSet, createRemoteJWKSet, jwtVerify, decodeProtectedHeader } from 'jose'
export const AUTH_ISS = 'https://auth.tantrafiles.xyz'
let local = null, localSrc = null, remote = null
function keySet(env) {
  if (env.AUTH_JWKS) { if (localSrc !== env.AUTH_JWKS) { local = createLocalJWKSet(JSON.parse(env.AUTH_JWKS)); localSrc = env.AUTH_JWKS } return local }
  return (remote ||= createRemoteJWKSet(new URL(AUTH_ISS + '/.well-known/jwks.json')))
}
export function isSharedToken(tok) { try { return decodeProtectedHeader(tok).alg === 'ES256' } catch { return false } }
export async function sharedUid(env, tok) {
  try {
    const { payload } = await jwtVerify(tok, keySet(env), { issuer: AUTH_ISS, audience: 'satsang', algorithms: ['ES256'] })
    return typeof payload.sub === 'string' && /^u_[A-Za-z0-9_-]{10,40}$/.test(payload.sub) ? payload.sub : null
  } catch { return null }
}
// first sight of a shared account here: a users row with no email/name/photo (google_sub column is NOT NULL UNIQUE: 'sa:<uid>')
export async function ensureUser(DB, uid) {
  let u = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(uid).first()
  if (!u) { await DB.prepare('INSERT OR IGNORE INTO users (id, google_sub, created_at) VALUES (?, ?, ?)').bind(uid, 'sa:' + uid, new Date().toISOString()).run(); u = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(uid).first() }
  return u
}
