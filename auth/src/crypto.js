// satsang-auth crypto helpers (WebCrypto only: runs the same in Workers, Node 20+ and browsers).
// Journeys use envelope encryption: each entry gets a fresh AES-256-GCM data key (DEK); the DEK is wrapped
// (AES-256-GCM) by the day key K_d = HKDF-SHA256(JOURNEY_MASTER_KEY, info = "kd:<journey>:<day>:<epoch>").
// The server holds JOURNEY_MASTER_KEY, so it is a trusted key-holder, NOT end-to-end (specs/JOURNEYS-DAYGATE.md §4).
const te = new TextEncoder(), td = new TextDecoder()
const S = crypto.subtle

export const b64u = (u8) => { let s = ''; for (const x of u8) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }
export const unb64u = (s) => { const b = atob(String(s).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(s).length + 3) % 4)); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u }
export const rand = (n) => crypto.getRandomValues(new Uint8Array(n))
export const hex = (u8) => [...u8].map((x) => x.toString(16).padStart(2, '0')).join('')
export async function sha256(data) { return new Uint8Array(await S.digest('SHA-256', typeof data === 'string' ? te.encode(data) : data)) }
export async function hmac(keyStr, msg) {
  const k = await S.importKey('raw', te.encode(keyStr), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await S.sign('HMAC', k, te.encode(msg)))
}
export function timingSafeEq(a, b) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0 }

// canonical JSON (sorted keys, no whitespace, integers only): the journey-ledger C(block) (nibbanahelp specs/journey-ledger.md §2.4)
export function canon(v) {
  if (v === null || typeof v === 'boolean' || typeof v === 'string') return JSON.stringify(v)
  if (typeof v === 'number') { if (!Number.isInteger(v)) throw new Error('canon: integers only'); return String(v) }
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']'
  if (typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'
  throw new Error('canon: bad type')
}
export async function blockId(block) { return 'sha256:' + hex(await sha256('nibbana-journey/v1/block\n' + canon(block))) }
// salted commitment (ledger §9.2): reveals nothing once the salt is erased
export async function commitment(saltU8, text) {
  const t = te.encode(text), p = te.encode('nibbana-journey/v1/content\n'), buf = new Uint8Array(p.length + saltU8.length + t.length)
  buf.set(p); buf.set(saltU8, p.length); buf.set(t, p.length + saltU8.length)
  return 'sha256:' + hex(await sha256(buf))
}

// ---- day keys ----
export async function dayKeyRaw(masterB64, journeyId, day, epoch = 1) {
  const ikm = await S.importKey('raw', unb64u(masterB64), 'HKDF', false, ['deriveBits'])
  const bits = await S.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: te.encode('satsang-journeys/v1'), info: te.encode(`kd:${journeyId}:${day}:${epoch}`) }, ikm, 256)
  return new Uint8Array(bits)
}
const aes = (raw, use) => S.importKey('raw', raw, { name: 'AES-GCM' }, false, use)

// encrypt one entry: returns everything needed to store it; the raw DEK never leaves this function
export async function sealEntry(kdRaw, entryId, plaintextObj) {
  const dek = rand(32), iv = rand(12), wiv = rand(12), aad = te.encode('entry:' + entryId)
  const ct = new Uint8Array(await S.encrypt({ name: 'AES-GCM', iv, additionalData: aad }, await aes(dek, ['encrypt']), te.encode(JSON.stringify(plaintextObj))))
  const wdek = new Uint8Array(await S.encrypt({ name: 'AES-GCM', iv: wiv, additionalData: te.encode('dek:' + entryId) }, await aes(kdRaw, ['encrypt']), dek))
  dek.fill(0)
  return { ct: b64u(ct), iv: b64u(iv), wdek: b64u(wdek), wiv: b64u(wiv) }
}
// the same routine the browser runs once the server has released K_d (client/auth.js openEntry)
export async function openEntry(kdRaw, entryId, e) {
  const dek = new Uint8Array(await S.decrypt({ name: 'AES-GCM', iv: unb64u(e.wiv), additionalData: te.encode('dek:' + entryId) }, await aes(kdRaw, ['decrypt']), unb64u(e.wdek)))
  const pt = await S.decrypt({ name: 'AES-GCM', iv: unb64u(e.iv), additionalData: te.encode('entry:' + entryId) }, await aes(dek, ['decrypt']), unb64u(e.ct))
  return JSON.parse(td.decode(pt))
}

// Ed25519 signature over the 32 raw bytes of a block id (ledger §2.4); pub = base64url raw 32-byte key
export async function verifyEd25519(pubB64u, idStr, sigB64u) {
  try {
    const k = await S.importKey('raw', unb64u(pubB64u), { name: 'Ed25519' }, false, ['verify'])
    const idBytes = Uint8Array.from(idStr.replace(/^sha256:/, '').match(/../g).map((h) => parseInt(h, 16)))
    return await S.verify({ name: 'Ed25519' }, k, unb64u(sigB64u), idBytes)
  } catch { return false }
}
