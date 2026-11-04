// wiser-api accepts the shared Satsang account's ES256 tokens (src/shared-auth.mjs). node test/shared-auth.test.mjs
import { SignJWT } from 'jose'
import { setup, d1, t, done } from '../../../auth/test/harness.mjs'
import { isSharedToken, sharedUid, ensureUser } from '../src/shared-auth.mjs'

const S = await setup(), A = await S.signIn('g-shared')
const jwks = (await S.req('GET', '/.well-known/jwks.json')).j, env = { AUTH_JWKS: JSON.stringify(jwks) }
t('shared token recognised (ES256)', isSharedToken(A.access))
t('shared token verifies -> account id', (await sharedUid(env, A.access)) === A.user.uid)
t('tampered shared token -> null', (await sharedUid(env, A.access.slice(0, -3) + 'xyz')) === null)
const self = (await S.req('GET', '/selftest')).j.token
t('selftest token (other aud) -> null', (await sharedUid(env, self)) === null)
const legacy = await new SignJWT({ uid: 'x' }).setProtectedHeader({ alg: 'HS256' }).setIssuer('wiser-api').setExpirationTime('1h').sign(new TextEncoder().encode('s'))
t('legacy HS256 session is not taken for a shared token', !isSharedToken(legacy))
const DB = d1(new URL('../schema.sql', import.meta.url))
const u = await ensureUser(DB, A.user.uid); t('first sight creates a users row with no email/name', u.id === A.user.uid && u.google_sub === 'sa:' + A.user.uid && u.email === null && u.name === null)
const u2 = await ensureUser(DB, A.user.uid); t('second sight reuses it', u2.id === u.id && (await DB.prepare('SELECT COUNT(*) AS n FROM users').first()).n === 1)
done('wiser-api shared account')
