// satsang-auth: sign-in, tokens, handoff, refresh rotation, CORS, erasure. node test/auth.test.mjs
import { jwtVerify, createLocalJWKSet } from 'jose'
import { setup, t, done } from './harness.mjs'
import { b64u, sha256 } from '../src/crypto.js'

const S = await setup()
const { req, googleToken, env } = S
const SAT = 'https://tantrafiles.xyz', BODY = 'https://body.stonedoorway.com', NIB = 'https://nibbana.stonedoorway.com'

// 1 config + jwks + client
let r = await req('GET', '/'); t('root answers, sign-in configured', r.status === 200 && r.j.signIn === true)
r = await req('GET', '/.well-known/jwks.json'); const jwks = r.j
t('jwks: one ES256 public key, no private part', jwks.keys.length === 1 && jwks.keys[0].alg === 'ES256' && !jwks.keys[0].d && r.headers.get('access-control-allow-origin') === '*')
r = await req('GET', '/auth.js'); t('auth.js served as JS', r.status === 200 && /SatsangAuth/.test(r.j) && /javascript/.test(r.headers.get('content-type')))

r = await req('GET', '/selftest'); const st0 = await jwtVerify(r.j.token, createLocalJWKSet(jwks), { issuer: 'https://auth.tantrafiles.xyz', audience: 'satsang-selftest' })
t('selftest token verifies against the JWKS', st0.payload.sub === 'selftest')
r = await req('GET', '/v1/me', { token: r.j.token, origin: SAT }); t('selftest token is useless as a session (wrong aud)', r.status === 401)

// 2 Google verification
r = await req('POST', '/v1/google', { body: { credential: await googleToken('g-1') }, origin: SAT })
t('valid Google token from Satsang -> tokens', r.status === 200 && r.j.access && r.j.refresh && r.j.user.uid.startsWith('u_') && r.j.fresh === true)
const first = r.j
const { payload } = await jwtVerify(first.access, createLocalJWKSet(jwks), { issuer: 'https://auth.tantrafiles.xyz', audience: 'satsang' })
t('access token verifies locally against the public JWKS (iss, aud, ES256)', payload.sub === first.user.uid && payload.exp - payload.iat === 3600)
t('no email/name in the access token', !('email' in payload) && !('name' in payload))
const row = await env.DB.prepare('SELECT * FROM users').first()
t('users row holds no email/name/photo and no raw Google sub', !Object.values(row).some((v) => String(v).includes('example.com') || v === 'g-1') && Object.keys(row).join() === 'uid,sub_h,handle,created,last_seen')
r = await req('POST', '/v1/google', { body: { credential: await googleToken('g-1') }, origin: SAT }); t('same Google account -> same uid, not fresh', r.j.user.uid === first.user.uid && r.j.fresh === false)
r = await req('POST', '/v1/google', { body: { credential: await googleToken('g-1', { aud: 'someone-else' }) }, origin: SAT }); t('wrong aud rejected', r.status === 401)
r = await req('POST', '/v1/google', { body: { credential: await googleToken('g-1', { iss: 'https://evil.example' }) }, origin: SAT }); t('wrong iss rejected', r.status === 401)
r = await req('POST', '/v1/google', { body: { credential: await googleToken('g-1', { exp: Math.floor(Date.now() / 1000) - 10 }) }, origin: SAT }); t('expired rejected', r.status === 401)
r = await req('POST', '/v1/google', { body: { credential: await googleToken('g-1', { key: S.otherKey }) }, origin: SAT }); t('forged signature rejected', r.status === 401)
r = await req('POST', '/v1/google', { body: { credential: await googleToken('g-1') }, origin: 'https://evil.example' }); t('direct mode from an unlisted origin refused', r.status === 403)
r = await req('POST', '/v1/google', { body: { credential: 'x.y.z' }, origin: SAT }); t('garbage credential rejected', r.status === 401)

// 3 CORS allow-list
r = await req('OPTIONS', '/v1/refresh', { origin: BODY }); t('CORS: body.stonedoorway.com allowed', r.headers.get('access-control-allow-origin') === BODY)
r = await req('OPTIONS', '/v1/refresh', { origin: 'https://evil.example' }); t('CORS: unlisted origin gets no allow header', !r.headers.get('access-control-allow-origin'))

// 4 hosted handoff (stonedoorway sites): page -> code -> exchange with PKCE, origin-bound, single use
const ver = b64u(crypto.getRandomValues(new Uint8Array(32))), cc = b64u(await sha256(ver)), st = 'state12345'
r = await req('GET', `/signin?return=${encodeURIComponent(BODY + '/lab')}&state=${st}&cc=${cc}`); t('signin page renders for a listed site', r.status === 200 && /accounts\.google\.com\/gsi\/client/.test(r.j) && /body\.stonedoorway\.com/.test(r.j))
r = await req('GET', `/signin?return=${encodeURIComponent('https://evil.example/')}&state=${st}&cc=${cc}`); t('signin page refuses an unlisted return', r.status === 400)
r = await req('POST', '/v1/google', { body: { credential: await googleToken('g-2'), return: BODY + '/lab', state: st, cc }, origin: 'https://auth.tantrafiles.xyz' })
const red = new URL(r.j.redirect), code = new URLSearchParams(red.hash.slice(1)).get('sa_code')
t('handoff returns a redirect to the site with a code in the fragment', r.status === 200 && red.origin === BODY && red.pathname === '/lab' && !!code && red.hash.includes('sa_state=' + st))
r = await req('POST', '/v1/google', { body: { credential: await googleToken('g-2'), return: BODY + '/lab', state: st, cc }, origin: BODY }); t('handoff mode only from the auth page origin', r.status === 403)
r = await req('POST', '/v1/exchange', { body: { code, verifier: ver }, origin: NIB }); t('code exchanged from the wrong site refused', r.status === 400)
r = await req('POST', '/v1/google', { body: { credential: await googleToken('g-2'), return: BODY + '/lab', state: st, cc }, origin: 'https://auth.tantrafiles.xyz' })
const code2 = new URLSearchParams(new URL(r.j.redirect).hash.slice(1)).get('sa_code')
r = await req('POST', '/v1/exchange', { body: { code: code2, verifier: b64u(crypto.getRandomValues(new Uint8Array(32))) }, origin: BODY }); t('wrong PKCE verifier refused', r.status === 400)
const ver3 = b64u(crypto.getRandomValues(new Uint8Array(32))), cc3 = b64u(await sha256(ver3))
r = await req('POST', '/v1/google', { body: { credential: await googleToken('g-2'), return: BODY + '/lab', state: st, cc: cc3 }, origin: 'https://auth.tantrafiles.xyz' })
const code3 = new URLSearchParams(new URL(r.j.redirect).hash.slice(1)).get('sa_code')
r = await req('POST', '/v1/exchange', { body: { code: code3, verifier: ver3 }, origin: BODY }); const bodyTok = r.j
t('right site + verifier -> tokens', r.status === 200 && bodyTok.access && bodyTok.refresh)
r = await req('POST', '/v1/exchange', { body: { code: code3, verifier: ver3 }, origin: BODY }); t('code is single use', r.status === 400)

// 5 same person across sites = same uid
const satG2 = await S.signIn('g-2'); t('one account: Satsang and the lab get the same uid', satG2.user.uid === bodyTok.user.uid)

// 6 refresh rotation + reuse detection + origin binding
r = await req('POST', '/v1/refresh', { body: { refresh: bodyTok.refresh }, origin: SAT }); t('refresh token bound to its site', r.status === 401)
r = await req('POST', '/v1/refresh', { body: { refresh: bodyTok.refresh }, origin: BODY }); const rot = r.j
t('refresh rotates', r.status === 200 && rot.refresh && rot.refresh !== bodyTok.refresh)
r = await req('POST', '/v1/refresh', { body: { refresh: bodyTok.refresh }, origin: BODY }); t('reusing a rotated refresh token is refused', r.status === 401 && r.j.reason === 'reused')
r = await req('POST', '/v1/refresh', { body: { refresh: rot.refresh }, origin: BODY }); t('reuse revokes the whole family', r.status === 401)

// 7 me / handle / logout / erase
r = await req('GET', '/v1/me', { token: first.access, origin: SAT }); t('/v1/me with Bearer', r.status === 200 && r.j.uid === first.user.uid && /^[a-z]+-[a-z]+-\d+$/.test(r.j.handle))
r = await req('GET', '/v1/me', { token: first.access.slice(0, -4) + 'AAAA', origin: SAT }); t('tampered access token refused', r.status === 401)
r = await req('PUT', '/v1/me', { token: first.access, body: { handle: 'Bad Handle!' }, origin: SAT }); t('bad handle refused', r.status === 400)
r = await req('PUT', '/v1/me', { token: first.access, body: { handle: 'still-water' }, origin: SAT }); t('handle changed', r.status === 200)
r = await req('PUT', '/v1/me', { token: satG2.access, body: { handle: 'still-water' }, origin: SAT }); t('handle unique', r.status === 409)
r = await req('POST', '/v1/logout', { body: { refresh: first.refresh }, origin: SAT }); r = await req('POST', '/v1/refresh', { body: { refresh: first.refresh }, origin: SAT }); t('logout revokes the refresh token', r.status === 401)
r = await req('DELETE', '/v1/me', { token: satG2.access, origin: SAT }); t('erase account', r.status === 200)
const left = await env.DB.prepare("SELECT (SELECT COUNT(*) FROM users WHERE uid = ?) + (SELECT COUNT(*) FROM refresh WHERE uid = ?) AS n").bind(satG2.user.uid, satG2.user.uid).first()
t('erasure leaves no user or token rows', left.n === 0)
r = await req('GET', '/v1/me', { token: satG2.access, origin: SAT }); t('erased account token no longer works', r.status === 401)

// 8 not configured -> 503
const S2 = await setup({ GOOGLE_CLIENT_ID: '' }); r = await S2.req('POST', '/v1/google', { body: { credential: 'x' }, origin: SAT }); t('no client id -> 503 sign_in_not_configured', r.status === 503)
done('auth')
