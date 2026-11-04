// day-gated journeys: the gate, encryption at rest, client-side decryption, anti-junk floor, holds, withdraw/leave, signatures, vouching.
import { readFileSync } from 'node:fs'
import { setup, t, done, clock } from './harness.mjs'
import { b64u, blockId, commitment, unb64u } from '../src/crypto.js'

const S = await setup(), { req, env } = S, SAT = 'https://tantrafiles.xyz'
// the browser client, loaded as the browser would (classic script attaching window.SatsangAuth)
globalThis.window = globalThis; globalThis.localStorage = { _m: {}, getItem(k) { return this._m[k] ?? null }, setItem(k, v) { this._m[k] = v }, removeItem(k) { delete this._m[k] } }
new Function(readFileSync(new URL('../client/auth.js', import.meta.url), 'utf8'))()
const client = globalThis.SatsangAuth

const words = (seed) => `Day note ${seed}. Sat for forty minutes this morning with the breath at the nostrils, mind wandering to work plans and an old argument, ` +
  `returning each time without scolding. Noticed the body settle around minute twenty, a softness in the chest, then restlessness again near the end. ` +
  `Walked slowly after, feeling feet, sounds of traffic and birds together. Intention for tomorrow: begin earlier and keep the evening quieter (${seed}).`
const A = await S.signIn('ga'), B = await S.signIn('gb'), C = await S.signIn('gc'), X = await S.signIn('gx')
const as = (u) => ({ token: u.access, origin: SAT })

let r = await req('POST', '/v1/journeys', { ...as(A), body: { title: 'Forty days of sitting' } }); t('create needs explicit consent', r.status === 400 && r.j.error === 'consent_required')
r = await req('POST', '/v1/journeys', { ...as(A), body: { title: 'Forty days of sitting', consent: true } }); const J = r.j
t('create -> id + invite, creator joined', r.status === 200 && J.id.startsWith('j_') && J.invite && J.handle)
r = await req('POST', `/v1/journeys/${J.id}/join`, { ...as(B), body: { invite: 'wrong', consent: true } }); t('wrong invite -> 404', r.status === 404)
r = await req('POST', `/v1/journeys/${J.id}/join`, { ...as(B), body: { invite: J.invite, consent: true } }); t('B joins with invite + consent', r.status === 200)
r = await req('POST', `/v1/journeys/${J.id}/join`, { ...as(C), body: { invite: J.invite, consent: true } }); t('C joins', r.status === 200)
r = await req('GET', `/v1/journeys/${J.id}`, as(X)); t('non-member sees nothing (404)', r.status === 404)

// --- the gate ---
r = await req('GET', `/v1/journeys/${J.id}/days/1`, as(A)); t('day 1 locked before A posts', r.status === 403 && r.j.error === 'locked')
async function post(u, text, { wait = 91, day } = {}) {
  const tk = (await req('POST', `/v1/journeys/${J.id}/ticket`, as(u))).j; clock.advance(wait)
  return req('POST', `/v1/journeys/${J.id}/entries`, { ...as(u), body: { day: day ?? tk.day, text, ticket: tk.ticket } })
}
r = await post(A, words('a1'), { wait: 10 }); t('posting faster than the compose floor refused (425)', r.status === 425)
r = await post(A, 'too short'); t('too short refused', r.status === 422 && r.j.error === 'too_short')
r = await post(A, ('om ').repeat(120)); t('repeated filler refused', r.status === 422 && r.j.error === 'looks_like_filler')
r = await post(A, words('a1'), { day: 2 }); t('skipping to day 2 refused', r.status === 409 && r.j.next_day === 1)
r = await req('POST', `/v1/journeys/${J.id}/entries`, { ...as(A), body: { day: 1, text: words('a1'), ticket: '1.123.forged' } }); t('forged ticket refused', r.status === 400)
r = await post(A, words('a1')); const a1 = r.j; t('A posts day 1', r.status === 200 && a1.day === 1 && a1.held === false && a1.id.startsWith('sha256:'))
t('block id recomputes from the block', a1.id === (await blockId(a1.block)))
const raw = await env.DB.prepare('SELECT * FROM entries WHERE bid = ?').bind(a1.id).first()
t('at rest: ciphertext only (no plaintext in the row)', !JSON.stringify(raw).includes('forty minutes') && raw.ct && raw.wdek)
r = await req('GET', `/v1/journeys/${J.id}/days/1`, as(B)); t('B cannot see day 1 before posting own day 1', r.status === 403)
let d
// read via the browser client as A (adopt A's tokens into the client's storage)
const fetch0 = globalThis.fetch
globalThis.fetch = async (url, o = {}) => { const res = await S.app.request(String(url), { ...o, headers: { ...(o.headers || {}), origin: SAT } }, env); return res }
client.adopt({ access: A.access, refresh: A.refresh, expires_in: 3600, user: A.user })
d = await client.journeys.day(J.id, 1)
t('A reads own day 1 through the browser client (decrypted in the client)', d.entries.length === 1 && d.entries[0].mine && d.entries[0].text === words('a1'))
t('commitment in the block matches text + salt', d.entries[0].block.content.hash[0] === (await commitment(unb64u(d.entries[0].salt), d.entries[0].text)))
r = await post(B, words('b1')); t('B posts day 1', r.status === 200)
client.adopt({ access: B.access, refresh: B.refresh, expires_in: 3600, user: B.user })
d = await client.journeys.day(J.id, 1)
t('B now sees A and B day 1, decrypted, oldest first, by pen name', d.entries.length === 2 && d.entries[0].text === words('a1') && !d.entries[0].mine && d.entries[1].mine && !!d.entries[0].handle)
t('no uid of another member is exposed', !JSON.stringify(d).includes(A.user.uid))
r = await req('GET', `/v1/journeys/${J.id}/days/2`, as(B)); t('day 2 still locked for B', r.status === 403)

// --- crisis hold ---
r = await post(C, words('c1') + ' Some nights I want to die and I do not know why.'); t('crisis entry accepted but held, support shown', r.status === 200 && r.j.held === true && /findahelpline/.test(r.j.support))
r = await req('GET', `/v1/journeys/${J.id}/days/1`, as(C)); t('held entry still unlocks day 1 for its author', r.status === 200 && r.j.entries.some((e) => e.mine && e.held))
r = await req('GET', `/v1/journeys/${J.id}/days/1`, as(A)); t('held entry never shown to others', r.j.entries.length === 2 && r.j.entries.every((e) => e.held !== true) && r.j.entries.filter((e) => !e.mine).every((e) => !('held' in e)))

// --- pacing + continuity + duplicates ---
r = await post(A, words('a2')); t('a second day within 20 h refused', r.status === 429 && r.j.error === 'too_soon')
clock.advance(20 * 3600)
r = await post(A, words('a1')); t('copy of your own earlier entry refused', r.status === 422)
r = await post(A, words('a2')); const a2 = r.j; t('A posts day 2 after the gap', r.status === 200 && a2.block.prev === a1.id && a2.block.seq === 2)

// --- withdraw + leave ---
r = await req('DELETE', `/v1/journeys/${J.id}/entries/1`, as(B)); t('B withdraws day 1', r.status === 200)
r = await req('GET', `/v1/journeys/${J.id}/days/1`, as(A)); const wb = r.j.entries.find((e) => !e.mine)
t('withdrawn: content gone (crypto-shredded), block id kept', wb.withdrawn === true && !wb.ct && !!wb.bid)
r = await req('GET', `/v1/journeys/${J.id}/days/1`, as(B)); t('withdrawing keeps B\u2019s own day open', r.status === 200)
r = await req('POST', `/v1/journeys/${J.id}/leave`, as(B)); r = await req('GET', `/v1/journeys/${J.id}/days/1`, as(A))
t('B leaves: every B row gone today', r.j.entries.length === 1 && r.j.entries[0].mine)
const nB = await env.DB.prepare('SELECT COUNT(*) AS n FROM entries WHERE uid = ?').bind(B.user.uid).first(); t('no B entries remain at rest', nB.n === 0)

// --- signed entries (ledger continuity) ---
r = await req('POST', '/v1/journeys', { ...as(X), body: { title: 'Signed path', consent: true } }); const JS = r.j
const kp = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']), pub = b64u(new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey)))
r = await req('POST', `/v1/journeys/${JS.id}/key`, { ...as(X), body: { pub } }); t('register an Ed25519 key', r.status === 200)
let tk = (await req('POST', `/v1/journeys/${JS.id}/ticket`, as(X))).j; clock.advance(91)
r = await req('POST', `/v1/journeys/${JS.id}/entries`, { ...as(X), body: { day: 1, text: words('x1'), ticket: tk.ticket } }); t('with a key, unsigned entries refused', r.status === 400 && r.j.error === 'signature_required')
const salt = b64u(crypto.getRandomValues(new Uint8Array(16))), at = new Date(Date.now()).toISOString()
r = await req('POST', `/v1/journeys/${JS.id}/entries`, { ...as(X), body: { day: 1, text: words('x1'), ticket: tk.ticket, salt, at, sig: b64u(new Uint8Array(64)) } })
t('bad signature refused, server returns the block to sign', r.status === 400 && r.j.error === 'bad_signature' && r.j.id)
const idBytes = Uint8Array.from(r.j.id.slice(7).match(/../g).map((h) => parseInt(h, 16)))
const sig = b64u(new Uint8Array(await crypto.subtle.sign({ name: 'Ed25519' }, kp.privateKey, idBytes)))
r = await req('POST', `/v1/journeys/${JS.id}/entries`, { ...as(X), body: { day: 1, text: words('x1'), ticket: tk.ticket, salt, at, sig } })
t('signed entry accepted, author is the key', r.status === 200 && r.j.block.author === 'ed25519:' + pub)

// --- vouching ---
r = await req('POST', '/v1/journeys', { ...as(A), body: { title: 'Vouched circle', consent: true, vouch_required: true } }); const JV = r.j
await req('POST', `/v1/journeys/${JV.id}/join`, { ...as(C), body: { invite: JV.invite, consent: true } })
tk = (await req('POST', `/v1/journeys/${JV.id}/ticket`, as(C))).j; clock.advance(91)
r = await req('POST', `/v1/journeys/${JV.id}/entries`, { ...as(C), body: { day: 1, text: words('cv1'), ticket: tk.ticket } }); t('vouch-required journey: unvouched member cannot post', r.status === 403 && r.j.error === 'needs_vouch')
const cHandle = (await req('GET', `/v1/journeys/${JV.id}`, as(C))).j.me.handle
r = await req('POST', `/v1/journeys/${JV.id}/vouch`, { ...as(A), body: { handle: cHandle } }); t('creator vouches', r.status === 200)
r = await req('POST', `/v1/journeys/${JV.id}/entries`, { ...as(C), body: { day: 1, text: words('cv1'), ticket: tk.ticket } }); t('vouched member posts', r.status === 200)

// --- no rankings: the journey view carries no counts of others ---
r = await req('GET', `/v1/journeys/${J.id}`, as(A)); t('journey view: own days only, no counts/streaks of anyone', r.status === 200 && r.j.unlocked_days.join() === '1,2' && !/count|streak|rank/i.test(JSON.stringify(r.j)))
// --- erasure removes journeys data ---
r = await req('DELETE', '/v1/me', as(C)); const nC = await env.DB.prepare('SELECT (SELECT COUNT(*) FROM entries WHERE uid = ?) + (SELECT COUNT(*) FROM members WHERE uid = ?) AS n').bind(C.user.uid, C.user.uid).first()
t('account erasure removes every journey row', nC.n === 0)
globalThis.fetch = fetch0
done('journeys')
