// satsang-auth policy: who may talk to the service, token lifetimes, journey gates. One place, plain numbers.
export const ISS = 'https://auth.tantrafiles.xyz'
export const AUD = 'satsang' // one audience: the three sites share one account
export const ACCESS_TTL_S = 3600 // short-lived signed session token (ES256)
export const REFRESH_DAYS = 30 // opaque, hashed at rest, rotated on every use
export const CODE_TTL_S = 120 // one-time handoff code

// sites that may use the shared account (exact origins; https only). The auth host itself serves the hosted sign-in page.
export const SITE_ORIGINS = [
  'https://tantrafiles.xyz', 'https://www.tantrafiles.xyz',
  'https://satsang.digital', 'https://www.satsang.digital', // prepared, not active yet (BRIEF)
  'https://nibbana.stonedoorway.com',
  'https://body.stonedoorway.com',
]
export function siteOrigins(env) {
  const extra = String(env?.EXTRA_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean) // local dev only; empty in production
  return [...SITE_ORIGINS, ...extra]
}
export function allowedReturn(env, url) {
  try { const u = new URL(url); if (!siteOrigins(env).includes(u.origin)) return null; u.hash = ''; return u } catch { return null }
}

// ---- journeys: the day gate and its anti-junk floor (never a quality or attainment score) ----
export const MIN_CHARS = 200 // a real paragraph, not a judgment of it
export const MAX_CHARS = 20000
export const MIN_COMPOSE_S = 90 // a ticket must be at least this old when the entry is posted
export const TICKET_MAX_H = 48
export const POST_GAP_H = 20 // at most one new day per ~day per journey
export const POSTS_PER_DAY = 6 // across all journeys, per account
export const VOUCHER_MIN_DAYS = 3

// junk floor: enough distinct characters and not one token repeated; says nothing about content
export function junkReason(text) {
  const t = text.replace(/\s+/g, ' ').trim(), n = [...t].length
  if (n < MIN_CHARS) return { error: 'too_short', min: MIN_CHARS, have: n }
  if (n > MAX_CHARS) return { error: 'too_long', max: MAX_CHARS }
  if (new Set([...t.toLowerCase()]).size < 15) return { error: 'looks_like_filler' }
  const words = t.toLowerCase().split(/\s+/).filter(Boolean), freq = new Map()
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1)
  const top = Math.max(...freq.values())
  if (words.length < 30 || top / words.length > 0.35) return { error: 'looks_like_filler' }
  return null
}
export const normText = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

// crisis/safety hold: deliberately broad; a held entry still unlocks the author's day but is never shown to anyone else.
// Crude by design (false positives are held, not punished); the author sees support links (specs/JOURNEYS-DAYGATE.md §6).
const CRISIS = /\b(suicid\w*|kill (?:my ?self|myself)|end (?:it all|my life)|take my (?:own )?life|self[- ]?harm\w*|cut(?:ting)? myself|overdos\w*|don'?t want to (?:live|be alive|exist)|no reason to live|better off dead|want to die)\b/i
export const isCrisis = (text) => CRISIS.test(text)
export const SUPPORT = 'This entry is kept just for you for now. If you are in danger or thinking of ending your life, please reach out now: findahelpline.com lists free, confidential lines in every country.'

const A = ['quiet', 'still', 'open', 'clear', 'bright', 'slow', 'deep', 'soft', 'wide', 'calm', 'plain', 'warm', 'light', 'bare', 'kind']
const N = ['heron', 'river', 'cedar', 'lamp', 'stone', 'cloud', 'field', 'reed', 'bell', 'moth', 'pine', 'shore', 'wren', 'flame', 'moon']
export function genHandle() { const r = crypto.getRandomValues(new Uint8Array(3)); return `${A[r[0] % A.length]}-${N[r[1] % N.length]}-${10 + (r[2] % 90)}` }
export const HANDLE = /^[a-z0-9](?:[a-z0-9-]{1,22})[a-z0-9]$/
