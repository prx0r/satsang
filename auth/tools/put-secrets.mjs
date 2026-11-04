// Generate satsang-auth secrets once and push them with `wrangler secret put` (stdin). Never prints a value.
// A backup is written to ../private/satsang-auth-secrets.json (gitignored, mode 600): losing SUB_PEPPER orphans every account,
// losing JOURNEY_MASTER_KEY makes every journey entry unreadable. Refuses to overwrite an existing backup (rotate by hand).
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { generateKeyPair, exportJWK } from 'jose'
const out = new URL('../../private/satsang-auth-secrets.json', import.meta.url)
let s
if (existsSync(out)) s = JSON.parse(readFileSync(out, 'utf8'))
else {
  const kp = await generateKeyPair('ES256', { extractable: true }), jwk = await exportJWK(kp.privateKey)
  jwk.kid = 'sa-' + new Date().toISOString().slice(0, 10)
  const r = (n) => Buffer.from(crypto.getRandomValues(new Uint8Array(n))).toString('base64url')
  s = { AUTH_PRIVATE_JWK: JSON.stringify(jwk), SUB_PEPPER: r(32), JOURNEY_MASTER_KEY: r(32) }
  mkdirSync(new URL('../../private/', import.meta.url), { recursive: true }); writeFileSync(out, JSON.stringify(s, null, 1), { mode: 0o600 })
}
for (const [k, v] of Object.entries(s)) {
  execFileSync('npx', ['wrangler', 'secret', 'put', k], { cwd: new URL('..', import.meta.url).pathname, input: v, stdio: ['pipe', 'ignore', 'inherit'] })
  console.log('put', k)
}
