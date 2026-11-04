// satsang-auth: one Google sign-in for tantrafiles.xyz (Satsang), nibbana.stonedoorway.com (journal) and body.stonedoorway.com (lab),
// plus day-gated, encrypted journeys. Hono on Cloudflare Workers + D1 'satsang-auth'. Spec: specs/SHARED-ACCOUNT.md, specs/JOURNEYS-DAYGATE.md.
//
// Identity: Google ID token (Google Identity Services) verified server-side (signature via Google's JWKS, iss, aud = our client id, exp)
// -> our own ES256 access token (1 h, public JWKS at /.well-known/jwks.json so every site verifies locally) + a rotating refresh token.
// Cross-domain (tantrafiles.xyz vs stonedoorway.com): token handoff, never shared cookies.
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwtVerify, SignJWT, importJWK } from 'jose'
import * as P from './policy.js'
import { b64u, unb64u, rand, hex, sha256, hmac, timingSafeEq, blockId, commitment, dayKeyRaw, sealEntry, verifyEd25519 } from './crypto.js'
import { signinPage } from './pages.js'

const now = () => new Date().toISOString()
const plus = (s) => new Date(Date.now() + s * 1000).toISOString()
async function body(c) { try { return await c.req.json() } catch { return null } }

export function makeApp({ googleKeys, clientJs = '' }) {
  const app = new Hono()
  app.onError((err, c) => { console.error(err); return c.json({ error: 'server_error' }, 500) })
  app.notFound((c) => c.json({ error: 'not_found' }, 404))

  // public, read-only: any origin
  const open = (c) => { c.header('access-control-allow-origin', '*'); c.header('vary', 'origin') }
  // everything under /v1 is credentialed by Bearer token (no cookies), allowed only from the listed site origins + the auth host
  app.use('/v1/*', async (c, next) => {
    const allow = [...P.siteOrigins(c.env), new URL(c.req.url).origin]
    return cors({ origin: (o) => (allow.includes(o) ? o : null), allowHeaders: ['content-type', 'authorization'], allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], maxAge: 86400 })(c, next)
  })

  // ---------- keys ----------
  let keyCache = null
  async function keys(env) {
    if (keyCache && keyCache.src === env.AUTH_PRIVATE_JWK) return keyCache
    if (!env.AUTH_PRIVATE_JWK) return null
    const jwk = JSON.parse(env.AUTH_PRIVATE_JWK)
    const pub = { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, kid: jwk.kid, alg: 'ES256', use: 'sig' }
    keyCache = { src: env.AUTH_PRIVATE_JWK, kid: jwk.kid, priv: await importJWK({ ...jwk, alg: 'ES256' }, 'ES256'), pubKey: await importJWK(pub, 'ES256'), pub }
    return keyCache
  }
  const configured = (env) => !!(env.GOOGLE_CLIENT_ID && env.AUTH_PRIVATE_JWK && env.SUB_PEPPER)
  async function access(env, u) {
    const k = await keys(env)
    return new SignJWT({ handle: u.handle }).setProtectedHeader({ alg: 'ES256', kid: k.kid, typ: 'JWT' })
      .setIssuer(P.ISS).setAudience(P.AUD).setSubject(u.uid).setIssuedAt().setExpirationTime(`${P.ACCESS_TTL_S}s`).sign(k.priv)
  }
  async function issue(env, u, origin, fam = null) {
    const r = b64u(rand(32)), f = fam || 'f_' + b64u(rand(12))
    await env.DB.prepare('INSERT INTO refresh (h, uid, fam, origin, created, expires) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(hex(await sha256(r)), u.uid, f, origin, now(), plus(P.REFRESH_DAYS * 86400)).run()
    return { access: await access(env, u), expires_in: P.ACCESS_TTL_S, refresh: r, user: { uid: u.uid, handle: u.handle } }
  }
  async function bearer(c) {
    const h = c.req.header('authorization') || ''; if (!h.startsWith('Bearer ')) return null
    const k = await keys(c.env); if (!k) return null
    try { const { payload } = await jwtVerify(h.slice(7).trim(), k.pubKey, { issuer: P.ISS, audience: P.AUD, algorithms: ['ES256'] }); return payload.sub || null } catch { return null }
  }
  const authed = async (c, next) => {
    const uid = await bearer(c); if (!uid) return c.json({ error: 'unauthorized' }, 401)
    const u = await c.env.DB.prepare('SELECT * FROM users WHERE uid = ?').bind(uid).first(); if (!u) return c.json({ error: 'unauthorized' }, 401)
    c.set('u', u); await next()
  }
  async function limit(env, k, max, winS = 3600) {
    const win = String(Math.floor(Date.now() / 1000 / winS))
    const r = await env.DB.prepare('INSERT INTO rl (k, win, n) VALUES (?, ?, 1) ON CONFLICT (k, win) DO UPDATE SET n = n + 1 RETURNING n').bind(k, win).first()
    return (r?.n || 1) <= max
  }
  const ipKey = async (c) => hex(await hmac(c.env.SUB_PEPPER || '', 'ip|' + (c.req.header('cf-connecting-ip') || 'local'))).slice(0, 24)

  // ---------- public ----------
  app.get('/', (c) => c.json({ ok: true, service: 'satsang-auth', signIn: configured(c.env), jwks: P.ISS + '/.well-known/jwks.json', client: P.ISS + '/auth.js',
    sites: P.SITE_ORIGINS, spec: 'https://github.com/prx0r/satsang/blob/main/specs/SHARED-ACCOUNT.md' }))
  app.get('/.well-known/jwks.json', async (c) => {
    open(c); c.header('cache-control', 'public, max-age=3600')
    const k = await keys(c.env); return c.json({ keys: k ? [k.pub] : [] })
  })
  // live check: a 60 s token for sub 'selftest' with audience 'satsang-selftest' (no site accepts it), so anyone can confirm the
  // published JWKS verifies what this Worker signs, without a Google sign-in. Grants nothing.
  app.get('/selftest', async (c) => {
    open(c); c.header('cache-control', 'no-store'); const k = await keys(c.env); if (!k) return c.json({ error: 'not_configured' }, 503)
    const tok = await new SignJWT({}).setProtectedHeader({ alg: 'ES256', kid: k.kid, typ: 'JWT' }).setIssuer(P.ISS).setAudience('satsang-selftest').setSubject('selftest').setIssuedAt().setExpirationTime('60s').sign(k.priv)
    return c.json({ token: tok, aud: 'satsang-selftest', verify_with: P.ISS + '/.well-known/jwks.json' })
  })
  app.get('/auth.js', (c) => { open(c); c.header('content-type', 'text/javascript; charset=utf-8'); c.header('cache-control', 'public, max-age=300'); return c.body(clientJs) })
  app.get('/signin', (c) => {
    const ret = P.allowedReturn(c.env, c.req.query('return') || ''), cc = c.req.query('cc') || '', st = c.req.query('state') || ''
    c.header('content-security-policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/client; frame-src https://accounts.google.com/gsi/; connect-src 'self' https://accounts.google.com/gsi/; style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style; img-src 'self' data: https://*.googleusercontent.com")
    c.header('referrer-policy', 'no-referrer'); c.header('x-frame-options', 'DENY')
    if (!ret || !/^[A-Za-z0-9_-]{43}$/.test(cc) || !/^[A-Za-z0-9_-]{8,64}$/.test(st)) return c.html(signinPage({ error: 'This sign-in link is not from a Satsang site.' }), 400)
    return c.html(signinPage({ clientId: c.env.GOOGLE_CLIENT_ID || '', ret: ret.toString(), cc, state: st, site: ret.host }))
  })

  // ---------- sign-in ----------
  // body: { credential } from a listed site (inline Google button; Satsang)  -> tokens
  //       { credential, return, state, cc } from the hosted page               -> { redirect } with a one-time code
  app.post('/v1/google', async (c) => {
    if (!configured(c.env)) return c.json({ error: 'sign_in_not_configured' }, 503)
    if (!(await limit(c.env, 'si:' + (await ipKey(c)), 30))) return c.json({ error: 'rate_limited' }, 429)
    const b = await body(c), cred = b?.credential
    if (typeof cred !== 'string' || cred.length > 4096) return c.json({ error: 'missing_credential' }, 400)
    let p
    try { ({ payload: p } = await jwtVerify(cred, googleKeys(c.env), { issuer: ['accounts.google.com', 'https://accounts.google.com'], audience: c.env.GOOGLE_CLIENT_ID, algorithms: ['RS256'] })) }
    catch { return c.json({ error: 'invalid_credential' }, 401) }
    if (!p.sub || typeof p.exp !== 'number') return c.json({ error: 'invalid_credential' }, 401)
    const sub_h = hex(await hmac(c.env.SUB_PEPPER, 'google|' + p.sub)), DB = c.env.DB
    let u = await DB.prepare('SELECT * FROM users WHERE sub_h = ?').bind(sub_h).first(), fresh = false
    if (!u) {
      for (let i = 0; i < 5 && !u; i++) {
        const nu = { uid: 'u_' + b64u(rand(15)), handle: P.genHandle() }
        try { await DB.prepare('INSERT INTO users (uid, sub_h, handle, created, last_seen) VALUES (?, ?, ?, ?, ?)').bind(nu.uid, sub_h, nu.handle, now(), now()).run(); u = nu; fresh = true }
        catch (e) { if (!/UNIQUE/i.test(String(e))) throw e; u = await DB.prepare('SELECT * FROM users WHERE sub_h = ?').bind(sub_h).first() }
      }
      if (!u) return c.json({ error: 'server_error' }, 500)
    } else await DB.prepare('UPDATE users SET last_seen = ? WHERE uid = ?').bind(now(), u.uid).run()
    const origin = c.req.header('origin') || '', self = new URL(c.req.url).origin
    if (b.return !== undefined) { // hosted page handoff: only from our own page, only back to a listed site
      if (origin !== self) return c.json({ error: 'bad_origin' }, 403)
      const ret = P.allowedReturn(c.env, String(b.return)); const cc = String(b.cc || ''), st = String(b.state || '')
      if (!ret || !/^[A-Za-z0-9_-]{43}$/.test(cc) || !/^[A-Za-z0-9_-]{8,64}$/.test(st)) return c.json({ error: 'bad_return' }, 400)
      const code = b64u(rand(24))
      await DB.prepare('INSERT INTO codes (h, uid, origin, cc, expires) VALUES (?, ?, ?, ?, ?)').bind(hex(await sha256(code)), u.uid, ret.origin, cc, plus(P.CODE_TTL_S)).run()
      ret.hash = `sa_code=${code}&sa_state=${encodeURIComponent(st)}`
      return c.json({ redirect: ret.toString(), fresh })
    }
    if (!P.siteOrigins(c.env).includes(origin)) return c.json({ error: 'bad_origin' }, 403)
    return c.json({ ...(await issue(c.env, u, origin)), fresh })
  })
  // one-time code + PKCE verifier -> tokens; the browser's Origin must be the site the code was minted for
  app.post('/v1/exchange', async (c) => {
    const b = await body(c), code = String(b?.code || ''), ver = String(b?.verifier || ''), origin = c.req.header('origin') || ''
    if (!code || !/^[A-Za-z0-9_-]{43,128}$/.test(ver)) return c.json({ error: 'bad_request' }, 400)
    const DB = c.env.DB, h = hex(await sha256(code))
    const row = await DB.prepare('UPDATE codes SET used = 1 WHERE h = ? AND used = 0 RETURNING *').bind(h).first()
    if (!row || row.expires < now() || row.origin !== origin) return c.json({ error: 'invalid_code' }, 400)
    if (!timingSafeEq(b64u(await sha256(ver)), row.cc)) return c.json({ error: 'invalid_code' }, 400)
    const u = await DB.prepare('SELECT * FROM users WHERE uid = ?').bind(row.uid).first(); if (!u) return c.json({ error: 'invalid_code' }, 400)
    await DB.prepare('DELETE FROM codes WHERE expires < ?').bind(now()).run()
    return c.json(await issue(c.env, u, origin))
  })
  app.post('/v1/refresh', async (c) => {
    const b = await body(c), r = String(b?.refresh || ''), origin = c.req.header('origin') || ''
    if (!r) return c.json({ error: 'bad_request' }, 400)
    const DB = c.env.DB, row = await DB.prepare('SELECT * FROM refresh WHERE h = ?').bind(hex(await sha256(r))).first()
    if (!row || row.origin !== origin || row.expires < now()) return c.json({ error: 'invalid_refresh' }, 401)
    if (row.used) { await DB.prepare('DELETE FROM refresh WHERE fam = ?').bind(row.fam).run(); return c.json({ error: 'invalid_refresh', reason: 'reused' }, 401) } // theft signal
    const ok = await DB.prepare('UPDATE refresh SET used = 1 WHERE h = ? AND used = 0 RETURNING h').bind(row.h).first()
    if (!ok) return c.json({ error: 'invalid_refresh' }, 401)
    const u = await DB.prepare('SELECT * FROM users WHERE uid = ?').bind(row.uid).first(); if (!u) return c.json({ error: 'invalid_refresh' }, 401)
    return c.json(await issue(c.env, u, origin, row.fam))
  })
  app.post('/v1/logout', async (c) => {
    const b = await body(c), r = String(b?.refresh || '')
    if (r) { const row = await c.env.DB.prepare('SELECT fam FROM refresh WHERE h = ?').bind(hex(await sha256(r))).first(); if (row) await c.env.DB.prepare('DELETE FROM refresh WHERE fam = ?').bind(row.fam).run() }
    return c.json({ ok: true })
  })
  app.get('/v1/me', authed, (c) => { const u = c.get('u'); return c.json({ uid: u.uid, handle: u.handle, created: u.created, stored: ['uid', 'hashed Google subject', 'handle', 'created', 'last seen'] }) })
  app.put('/v1/me', authed, async (c) => {
    const b = await body(c), h = String(b?.handle || '').toLowerCase()
    if (!P.HANDLE.test(h)) return c.json({ error: 'bad_handle', rule: '3-24 chars: a-z, 0-9, hyphen' }, 400)
    try { await c.env.DB.prepare('UPDATE users SET handle = ? WHERE uid = ?').bind(h, c.get('u').uid).run() } catch { return c.json({ error: 'handle_taken' }, 409) }
    return c.json({ ok: true, handle: h })
  })
  // erasure: the account, every token, every journey membership/entry/vouch. Sites erase their own data (Satsang: wiser-api DELETE /me).
  app.delete('/v1/me', authed, async (c) => {
    const id = c.get('u').uid, DB = c.env.DB
    await DB.batch([
      DB.prepare('DELETE FROM entries WHERE uid = ?').bind(id), DB.prepare('DELETE FROM members WHERE uid = ?').bind(id),
      DB.prepare('DELETE FROM vouches WHERE uid = ? OR by_uid = ?').bind(id, id), DB.prepare('DELETE FROM refresh WHERE uid = ?').bind(id),
      DB.prepare('DELETE FROM codes WHERE uid = ?').bind(id), DB.prepare('DELETE FROM users WHERE uid = ?').bind(id),
    ])
    return c.json({ ok: true, erased: true })
  })

  mountJourneys(app, authed, limit)
  return app
}

// ======================================================================================================================
// Day-gated journeys. A member sees others' Day N only after posting their own Day N. Entries are encrypted at rest (AES-256-GCM DEK
// per entry, wrapped by day key K_d); the server releases K_d to a member only once their own Day N entry exists.
function mountJourneys(app, authed, limit) {
  const J = '/v1/journeys'
  const master = (env) => env.JOURNEY_MASTER_KEY
  async function member(c, jid) { return c.env.DB.prepare('SELECT m.*, j.creator, j.vouch_required, j.key_epoch, j.title FROM members m JOIN journeys j ON j.id = m.jid WHERE m.jid = ? AND m.uid = ?').bind(jid, c.get('u').uid).first() }
  async function lastEntry(DB, jid, uid) { return DB.prepare('SELECT day, bid, created FROM entries WHERE jid = ? AND uid = ? ORDER BY day DESC LIMIT 1').bind(jid, uid).first() }
  const series = async (env, jid, uid) => hex(await hmac(env.SUB_PEPPER, `series|${jid}|${uid}`)).slice(0, 16)
  async function ticketMac(env, jid, uid, day, iat) { return b64u(await hmac(env.SUB_PEPPER, `ticket|${jid}|${uid}|${day}|${iat}`)) }
  async function joinAs(DB, jid, u, consentAt) {
    let handle = u.handle
    for (let i = 0; i < 4; i++) {
      try { await DB.prepare('INSERT INTO members (jid, uid, handle, consent_at) VALUES (?, ?, ?, ?)').bind(jid, u.uid, handle, consentAt).run(); return handle }
      catch (e) { if (!/UNIQUE/i.test(String(e))) throw e; if (await DB.prepare('SELECT 1 FROM members WHERE jid = ? AND uid = ?').bind(jid, u.uid).first()) return null; handle = u.handle + '-' + (2 + i) }
    }
    return null
  }

  app.post(J, authed, async (c) => {
    if (!master(c.env)) return c.json({ error: 'journeys_not_configured' }, 503)
    const b = (await body(c)) || {}, u = c.get('u')
    const title = String(b.title || '').trim().slice(0, 80), about = String(b.about || '').trim().slice(0, 400)
    if (title.length < 3) return c.json({ error: 'bad_title' }, 400)
    if (b.consent !== true) return c.json({ error: 'consent_required', text: CONSENT }, 400)
    if (!(await limit(c.env, 'jc:' + u.uid, 3, 86400))) return c.json({ error: 'rate_limited' }, 429)
    const id = 'j_' + b64u(rand(9)), invite = b64u(rand(9))
    await c.env.DB.prepare('INSERT INTO journeys (id, title, about, creator, invite_h, vouch_required, created) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, title, about || null, u.uid, hex(await sha256(invite)), b.vouch_required ? 1 : 0, now()).run()
    const handle = await joinAs(c.env.DB, id, u, now())
    return c.json({ id, invite, handle, note: 'Share the invite only with people you trust. Anyone with it can join after signing in.' })
  })
  app.post(`${J}/:jid/join`, authed, async (c) => {
    const b = (await body(c)) || {}, jid = c.req.param('jid'), u = c.get('u')
    if (b.consent !== true) return c.json({ error: 'consent_required', text: CONSENT }, 400)
    if (!(await limit(c.env, 'jj:' + u.uid, 20))) return c.json({ error: 'rate_limited' }, 429)
    const j = await c.env.DB.prepare('SELECT * FROM journeys WHERE id = ?').bind(jid).first()
    if (!j || !timingSafeEq(hex(await sha256(String(b.invite || ''))), j.invite_h)) return c.json({ error: 'not_found' }, 404)
    const handle = await joinAs(c.env.DB, jid, u, now())
    return c.json({ ok: true, handle: handle || (await member(c, jid))?.handle })
  })
  app.get(`${J}/mine`, authed, async (c) => {
    const r = await c.env.DB.prepare(`SELECT j.id, j.title, m.handle, (SELECT MAX(day) FROM entries e WHERE e.jid = j.id AND e.uid = m.uid) AS last_day
      FROM members m JOIN journeys j ON j.id = m.jid WHERE m.uid = ? ORDER BY j.created`).bind(c.get('u').uid).all()
    return c.json({ journeys: (r.results || []).map((x) => ({ ...x, last_day: x.last_day || 0 })) })
  })
  app.get(`${J}/:jid`, authed, async (c) => {
    const jid = c.req.param('jid'), m = await member(c, jid); if (!m) return c.json({ error: 'not_found' }, 404)
    const DB = c.env.DB, le = await lastEntry(DB, jid, m.uid), last = le?.day || 0
    const vouched = !m.vouch_required || m.creator === m.uid || !!(await DB.prepare('SELECT 1 FROM vouches WHERE jid = ? AND uid = ?').bind(jid, m.uid).first())
    const canPostAt = le ? new Date(Date.parse(le.created) + P.POST_GAP_H * 3600e3).toISOString() : now()
    return c.json({ id: jid, title: m.title, vouch_required: !!m.vouch_required, me: { handle: m.handle, last_day: last, next_day: last + 1, can_post_at: canPostAt, vouched, signing_key: !!m.pub },
      unlocked_days: Array.from({ length: last }, (_, i) => i + 1), rules: { min_chars: P.MIN_CHARS, min_compose_s: P.MIN_COMPOSE_S, gap_hours: P.POST_GAP_H } })
  })
  app.post(`${J}/:jid/key`, authed, async (c) => {
    const jid = c.req.param('jid'), m = await member(c, jid); if (!m) return c.json({ error: 'not_found' }, 404)
    const b = (await body(c)) || {}, pub = String(b.pub || '')
    if (m.pub) return c.json({ error: 'key_already_set' }, 409)
    if (!/^[A-Za-z0-9_-]{43}$/.test(pub)) return c.json({ error: 'bad_key', want: 'base64url raw Ed25519 public key (32 bytes)' }, 400)
    await c.env.DB.prepare('UPDATE members SET pub = ? WHERE jid = ? AND uid = ?').bind(pub, jid, m.uid).run()
    return c.json({ ok: true })
  })
  app.post(`${J}/:jid/vouch`, authed, async (c) => {
    const jid = c.req.param('jid'), m = await member(c, jid); if (!m) return c.json({ error: 'not_found' }, 404)
    const DB = c.env.DB, le = await lastEntry(DB, jid, m.uid)
    if (m.creator !== m.uid && (le?.day || 0) < P.VOUCHER_MIN_DAYS) return c.json({ error: 'not_yet', rule: `vouch after posting ${P.VOUCHER_MIN_DAYS} days` }, 403)
    const b = (await body(c)) || {}, t = await DB.prepare('SELECT uid FROM members WHERE jid = ? AND handle = ?').bind(jid, String(b.handle || '')).first()
    if (!t || t.uid === m.uid) return c.json({ error: 'not_found' }, 404)
    await DB.prepare('INSERT OR IGNORE INTO vouches (jid, uid, by_uid, at) VALUES (?, ?, ?, ?)').bind(jid, t.uid, m.uid, now()).run()
    return c.json({ ok: true })
  })
  // a compose ticket: fetched when the writing box opens; an entry is accepted only once its ticket is MIN_COMPOSE_S old
  app.post(`${J}/:jid/ticket`, authed, async (c) => {
    const jid = c.req.param('jid'), m = await member(c, jid); if (!m) return c.json({ error: 'not_found' }, 404)
    if (!(await limit(c.env, 'jt:' + m.uid, 30))) return c.json({ error: 'rate_limited' }, 429)
    const le = await lastEntry(c.env.DB, jid, m.uid), day = (le?.day || 0) + 1, iat = Math.floor(Date.now() / 1000)
    return c.json({ ticket: `${day}.${iat}.${await ticketMac(c.env, jid, m.uid, day, iat)}`, day, ready_at: new Date((iat + P.MIN_COMPOSE_S) * 1000).toISOString() })
  })
  app.post(`${J}/:jid/entries`, authed, async (c) => {
    if (!master(c.env)) return c.json({ error: 'journeys_not_configured' }, 503)
    const jid = c.req.param('jid'), m = await member(c, jid); if (!m) return c.json({ error: 'not_found' }, 404)
    const DB = c.env.DB, b = (await body(c)) || {}
    if (m.vouch_required && m.creator !== m.uid && !(await DB.prepare('SELECT 1 FROM vouches WHERE jid = ? AND uid = ?').bind(jid, m.uid).first())) return c.json({ error: 'needs_vouch' }, 403)
    const le = await lastEntry(DB, jid, m.uid), day = (le?.day || 0) + 1
    if (b.day !== day) return c.json({ error: 'wrong_day', next_day: day }, 409) // continuity: Day N follows Day N-1, no skipping, no backfill
    if (le && Date.now() - Date.parse(le.created) < P.POST_GAP_H * 3600e3) return c.json({ error: 'too_soon', can_post_at: new Date(Date.parse(le.created) + P.POST_GAP_H * 3600e3).toISOString() }, 429)
    const [td, ti, tm] = String(b.ticket || '').split('.'), iat = Number(ti)
    if (Number(td) !== day || !Number.isInteger(iat) || !tm || !timingSafeEq(tm, await ticketMac(c.env, jid, m.uid, day, iat))) return c.json({ error: 'bad_ticket' }, 400)
    const age = Date.now() / 1000 - iat
    if (age < P.MIN_COMPOSE_S) return c.json({ error: 'too_fast', ready_at: new Date((iat + P.MIN_COMPOSE_S) * 1000).toISOString() }, 425)
    if (age > P.TICKET_MAX_H * 3600) return c.json({ error: 'ticket_expired' }, 400)
    const text = typeof b.text === 'string' ? b.text.replace(/\r\n/g, '\n').trim() : ''
    const junk = P.junkReason(text); if (junk) return c.json(junk, 422)
    const text_h = hex(await hmac(c.env.SUB_PEPPER, 'text|' + m.uid + '|' + P.normText(text)))
    if (await DB.prepare('SELECT 1 FROM entries WHERE uid = ? AND text_h = ?').bind(m.uid, text_h).first()) return c.json({ error: 'duplicate_of_your_earlier_entry' }, 422)
    if (!(await limit(c.env, 'jp:' + m.uid, P.POSTS_PER_DAY, 86400))) return c.json({ error: 'rate_limited' }, 429)
    // the ledger block (nibbanahelp specs/journey-ledger.md §2.3): signed by the member when they registered a key
    let salt, at
    if (m.pub) {
      salt = /^[A-Za-z0-9_-]{22,43}$/.test(String(b.salt || '')) ? unb64u(b.salt) : null
      at = typeof b.at === 'string' && Math.abs(Date.parse(b.at) - Date.now()) < 600e3 ? new Date(Date.parse(b.at)).toISOString() : null
      if (!salt || !at || !b.sig) return c.json({ error: 'signature_required', need: ['salt', 'at', 'sig'] }, 400)
    } else { salt = rand(16); at = now() }
    const ser = await series(c.env, jid, m.uid)
    const block = { v: 1, log: `auth.tantrafiles.xyz/journeys/${jid}/${ser}`, seq: day, prev: le?.bid || null, kind: 'entry', at, day, backfill: false,
      content: { hash: [await commitment(salt, text)], bytes: new TextEncoder().encode(text).length, visibility: 'wall' }, author: m.pub ? 'ed25519:' + m.pub : 'satsang-auth:' + ser }
    const bid = await blockId(block)
    if (m.pub && !(await verifyEd25519(m.pub, bid, String(b.sig)))) return c.json({ error: 'bad_signature', id: bid, block }, 400)
    const held = P.isCrisis(text) ? 1 : 0, id = 'e_' + b64u(rand(12))
    const kd = await dayKeyRaw(master(c.env), jid, day, m.key_epoch)
    const sealed = await sealEntry(kd, id, { text, salt: b64u(salt) }); kd.fill(0)
    try {
      await DB.prepare('INSERT INTO entries (id, jid, uid, day, block, bid, sig, ct, iv, wdek, wiv, epoch, held, text_h, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(id, jid, m.uid, day, JSON.stringify(block), bid, m.pub ? String(b.sig) : null, sealed.ct, sealed.iv, sealed.wdek, sealed.wiv, m.key_epoch, held, text_h, now()).run()
    } catch (e) { if (/UNIQUE/i.test(String(e))) return c.json({ error: 'wrong_day' }, 409); throw e }
    return c.json({ ok: true, day, id: bid, block, held: !!held, unlocked: day, ...(held ? { support: P.SUPPORT } : {}) })
  })
  // the gate: Day d opens to a member only once their own Day d entry exists (held or withdrawn still counts: they posted it)
  app.get(`${J}/:jid/days/:d`, authed, async (c) => {
    const jid = c.req.param('jid'), d = Number(c.req.param('d')), m = await member(c, jid); if (!m) return c.json({ error: 'not_found' }, 404)
    if (!Number.isInteger(d) || d < 1) return c.json({ error: 'bad_day' }, 400)
    const DB = c.env.DB
    if (!(await DB.prepare('SELECT 1 FROM entries WHERE jid = ? AND uid = ? AND day = ?').bind(jid, m.uid, d).first())) return c.json({ error: 'locked', day: d, hint: `Post your own day ${d} to open everyone's day ${d}.` }, 403)
    const r = await DB.prepare(`SELECT e.id, e.uid, e.block, e.bid, e.sig, e.ct, e.iv, e.wdek, e.wiv, e.epoch, e.held, e.created, mm.handle FROM entries e
      JOIN members mm ON mm.jid = e.jid AND mm.uid = e.uid WHERE e.jid = ? AND e.day = ? AND (e.held = 0 OR e.uid = ?) ORDER BY e.created`).bind(jid, d, m.uid).all()
    const rows = r.results || [], epochs = [...new Set(rows.map((x) => x.epoch))], keys = {}
    for (const ep of epochs) keys[ep] = b64u(await dayKeyRaw(master(c.env), jid, d, ep))
    return c.json({ day: d, keys, entries: rows.map((x) => ({ id: x.id, handle: x.handle, mine: x.uid === m.uid, held: x.uid === m.uid ? !!x.held : undefined, at: x.created,
      bid: x.bid, block: JSON.parse(x.block), sig: x.sig, epoch: x.epoch, withdrawn: !x.ct, ...(x.ct ? { ct: x.ct, iv: x.iv, wdek: x.wdek, wiv: x.wiv } : {}) })) })
  })
  // withdraw one entry: the ciphertext and wrapped key are deleted (crypto-shred); the block id stays so the chain still verifies
  app.delete(`${J}/:jid/entries/:d`, authed, async (c) => {
    const jid = c.req.param('jid'), d = Number(c.req.param('d')), m = await member(c, jid); if (!m) return c.json({ error: 'not_found' }, 404)
    await c.env.DB.prepare('UPDATE entries SET ct = NULL, iv = NULL, wdek = NULL, wiv = NULL, text_h = NULL WHERE jid = ? AND uid = ? AND day = ?').bind(jid, m.uid, d).run()
    return c.json({ ok: true, withdrawn: d })
  })
  // leave: membership, every entry (block included) and every vouch go, today
  app.post(`${J}/:jid/leave`, authed, async (c) => {
    const jid = c.req.param('jid'), uid = c.get('u').uid, DB = c.env.DB
    await DB.batch([DB.prepare('DELETE FROM entries WHERE jid = ? AND uid = ?').bind(jid, uid), DB.prepare('DELETE FROM vouches WHERE jid = ? AND (uid = ? OR by_uid = ?)').bind(jid, uid, uid),
      DB.prepare('DELETE FROM members WHERE jid = ? AND uid = ?').bind(jid, uid)])
    return c.json({ ok: true, left: jid })
  })
}

export const CONSENT = 'I choose to share my journey entries with the other members of this journey. They are religious/philosophical and possibly health-related (special-category) data; I can withdraw an entry or leave and erase everything at any time. Members see my entries for a day only after posting their own. Entries are encrypted at rest; the Satsang server holds the keys (not end-to-end).'
