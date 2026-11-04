# Spec: one shared account for Satsang, the journey journal and the practice lab

Status: **shipped (server + Satsang), waiting on one owner step in Google Cloud Console** (2026-11-05).
Worker `satsang-auth` at https://auth.tantrafiles.xyz (code `auth/`), D1 `satsang-auth`. Satsang's account menu uses it.
The journal (nibbanahelp) and the lab (deitybody) are **not changed**: drop-in snippet and steps in §5.
Day-gated journeys live in the same Worker: `specs/JOURNEYS-DAYGATE.md`.

## 1. Shape
```
 tantrafiles.xyz ─┐                       ┌─ Google Identity Services (button on auth.tantrafiles.xyz/signin)
 nibbana.stonedoorway.com ─┼─ redirect ──►│  ID token (RS256) ──► POST /v1/google: verify sig (Google JWKS), iss, aud, exp
 body.stonedoorway.com ────┘   + PKCE     └─ one-time code in the URL fragment ──► site POST /v1/exchange (+ verifier)
                                              ◄── access token (ES256, 1 h) + refresh token (30 d, rotating)
 every site / API verifies the access token locally against https://auth.tantrafiles.xyz/.well-known/jwks.json
```
- **One identity**: account id `u_…` (random). The same Google account gives the same id on every site.
- **Different registrable domains** (tantrafiles.xyz vs stonedoorway.com): no shared cookies. Token handoff only: the site sends
  the person to `auth.tantrafiles.xyz/signin?return=<url>&state=<rand>&cc=<S256(verifier)>`; after Google, the page redirects to
  `<url>#sa_code=<code>&sa_state=<state>`; the site (same browser, `Origin` = the site) exchanges code + verifier. Codes are single
  use, 120 s, bound to the return origin and the PKCE challenge. The fragment never reaches a server log; `auth.js` strips it from
  the address bar the moment it loads (before a hash router sees it).
- Tokens live in each site's own `localStorage` (keys `satsang.auth.*`). A refresh token works only from the site it was issued to,
  rotates on every use, and reusing a rotated one revokes its whole family (theft signal).
- Satsang could also use the inline Google button (POST `/v1/google` with just `{credential}` from an allowed origin); it does not
  today, so only one Google origin is needed (§6).

## 2. Endpoints (auth.tantrafiles.xyz)
| | |
|---|---|
| `GET /` | status (`signIn: true` when configured) |
| `GET /.well-known/jwks.json` | public ES256 key(s), CORS `*` |
| `GET /auth.js` | the drop-in client (CORS `*`) |
| `GET /signin?return&state&cc` | hosted sign-in page (Satsang dark design); refuses a return outside the allow-list |
| `POST /v1/google` | Google ID token → tokens (inline) or `{redirect}` (hosted page only) |
| `POST /v1/exchange` | code + PKCE verifier → tokens |
| `POST /v1/refresh` · `POST /v1/logout` | rotate · revoke family |
| `GET/PUT/DELETE /v1/me` | uid + pen name · change pen name · **erase the account** (tokens, journeys, everything) |
| `GET /selftest` | 60 s token, audience `satsang-selftest` (no site accepts it): proves the live key verifies against the JWKS |
| `/v1/journeys/*` | day-gated journeys (JOURNEYS-DAYGATE.md §7) |

Access token claims: `iss=https://auth.tantrafiles.xyz`, `aud=satsang`, `sub=u_…`, `handle`, `iat`, `exp` (+1 h), header `kid`.
Verify: ES256 only, check iss + aud + exp. `client/auth.js` has `SatsangAuth.verify(jwt)` (WebCrypto); Workers use `jose`
(`app/api/src/shared-auth.mjs` is a 25-line example).

## 3. Origins (CORS + return allow-list) — `auth/src/policy.js`
`https://tantrafiles.xyz`, `https://www.tantrafiles.xyz`, `https://satsang.digital`, `https://www.satsang.digital` (prepared, not
active), `https://nibbana.stonedoorway.com`, `https://body.stonedoorway.com`, and the auth host itself. Anything else: no CORS
header, and `/signin` answers 400. `EXTRA_ORIGINS` (var) is for local dev only and is empty in production.

## 4. What is stored (minimal PII)
`users(uid, sub_h, handle, created, last_seen)`. **No email, no name, no photo.** `sub_h = HMAC-SHA256(SUB_PEPPER, google sub)`,
so the table cannot be joined to a Google account without the pepper. Email is not needed: nothing is mailed. Refresh tokens and
codes are stored hashed. Rate-limit keys use a keyed hash of the IP. Erasure (`DELETE /v1/me`) removes every row for the account
here; each site erases its own data (Satsang's "Delete my account" calls both wiser-api `DELETE /me` and this).
Secrets (Worker secrets, never in git): `AUTH_PRIVATE_JWK`, `SUB_PEPPER`, `JOURNEY_MASTER_KEY`. A backup sits in the gitignored
`private/satsang-auth-secrets.json` (mode 600): losing `SUB_PEPPER` orphans every account, losing `JOURNEY_MASTER_KEY` makes every
journey entry unreadable. `auth/tools/put-secrets.mjs` (re)pushes them and never prints a value.

## 5. How each site uses the account
**Satsang (tantrafiles.xyz) — live.** Account menu → "Sign in with Google" → hosted page → back to the same tab (the hash route is
restored). `app/src/app.js` bundles `auth/client/auth.js`; every wiser-api call sends the shared access token (refreshed when near
expiry). wiser-api (`app/api/src/shared-auth.mjs`) verifies it locally against `AUTH_JWKS` (public key, in wrangler.toml) and creates a
users row on first sight (`id = u_…`, no email). On the first sign-in on a device Satsang asks **"Bring this device's history?"**: Yes →
`/me/claim-device` moves this device's anonymous picks, saves and practice log into the account and syncing starts; Not now → only
picks made from now on sync. The journal-derived profile (`wiser.journal`, concerns, tensions) stays on the device either way; there
is no journal sync (a future opt-in would be its own switch). The legacy HS256 session path still works but has no client id, so it is
unused.

**Journey journal (nibbana.stonedoorway.com) and practice lab (body.stonedoorway.com) — not integrated, by their own rules.**
nibbanahelp's AGENTS.md: "Layout (do not restructure without asking)" and "Frontend renders raw … no meta chrome. Never add
styling" — a sign-in control is chrome, so nothing was committed. deitybody's rules do not forbid it, but the lab has no server state to
sync yet, its boot-error banner shows any failed request as a red error, and menu zones are owner-governed (HANDOVER non-negotiables),
so nothing was committed there either. When the owner wants it, this is the whole integration:

```html
<!-- anywhere on the page; the site's origin is already allow-listed -->
<script src="https://auth.tantrafiles.xyz/auth.js"></script>
<button id="sa-btn" type="button">Sign in</button>
<script>
SatsangAuth.init({ onChange: function (u) {
  var b = document.getElementById('sa-btn')
  b.textContent = u ? u.handle + ' · sign out' : 'Sign in'
  b.onclick = function () { u ? SatsangAuth.signOut() : SatsangAuth.signIn() }
} })
// calling your own API: SatsangAuth.fetch(url, opts) adds "Authorization: Bearer <token>"; verify it server-side (ES256, iss, aud=satsang)
// journeys: SatsangAuth.journeys.{create, join, mine, get, ticket, post, day, withdraw, leave}  (JOURNEYS-DAYGATE.md §7)
</script>
```
- deitybody: `auth.js` is a classic script (no `?.`/`??`, no modules), matching the lab's older-browser floor. Load it after
  boot, or wrap calls so a network failure cannot reach the lab's global error banner. Deploy = their `wrangler deploy` + edge purge +
  `scripts/smoke.py`.
- nibbanahelp: the natural first user is the journey wall (opt-in, `wall: yes`, ledger §9.6), not a header button.

## 6. Owner steps (Google Cloud Console; only the owner can do these)
Reusing Funnier's OAuth client `50738620553-fq7mdin3e3baiu3v3uoup40jlvajtqb0.apps.googleusercontent.com` (verified live
2026-11-05: Google currently answers "The given origin is not allowed for the given client ID" on auth.tantrafiles.xyz).
1. https://console.cloud.google.com/apis/credentials → OAuth 2.0 Client IDs → the Funnier web client above.
2. **Authorized JavaScript origins** → add exactly: `https://auth.tantrafiles.xyz`
3. **Authorized redirect URIs**: add nothing (Google Identity Services button/popup mode uses no redirect URI).
4. Save (Google says changes can take 5 minutes to a few hours).
Optional, only if Satsang should later use the inline button instead of the hosted page: also add `https://tantrafiles.xyz` and
`https://www.tantrafiles.xyz`, and set `googleClientId` in `app/site/config.json`.

Trade-off: Google's account chooser shows the client's **OAuth consent screen app name** (Funnier's). If that should say "Satsang",
either rename the consent screen app (affects funnier.si too) or make a new client: new project (or same) → OAuth consent screen
(External, app name "Satsang", support email, scopes: openid only) → Create credentials → OAuth client ID → Web application →
origin `https://auth.tantrafiles.xyz`, no redirect URI → put the new client id in `auth/wrangler.toml` `GOOGLE_CLIENT_ID` and
redeploy (`cd auth && npx wrangler deploy`). Existing accounts should survive a client change: Google documents the ID token's `sub`
as the Google account's identifier, unique among all Google accounts (not per client); test with one account before switching.

## 7. Checks
- `cd auth && npm test` (41 sign-in/token checks + 42 journey checks, no network; Google is mocked with a local RS256 JWKS).
- `node app/api/test/shared-auth.test.mjs` (7: wiser-api accepts shared tokens, rejects tampered/selftest/legacy-as-shared).
- `node auth/test/live.mjs` (17 live: pages 200, endpoints answer, CORS allow/deny, a live-signed token verifies against the live
  JWKS, wiser-api refuses a wrong-audience token, site config points at the account).
- Shots: `node tools/shots/shot-account.mjs shots/account` (menu + hosted page, phone 390 + desktop).
- Not yet checked live: a real Google sign-in end to end (blocked on §6 step 2).

## 8. Key rotation
Add a second key to the JWKS before signing with it: put the new private JWK as `AUTH_PRIVATE_JWK`, serve old + new public keys
(small code change: `AUTH_OLD_JWKS`), update wiser-api `AUTH_JWKS`, wait 1 h (access TTL), drop the old key. Not built yet.
