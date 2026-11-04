# satsang-auth

One Google sign-in for tantrafiles.xyz, nibbana.stonedoorway.com and body.stonedoorway.com, plus day-gated encrypted journeys.
Live at https://auth.tantrafiles.xyz (Worker `satsang-auth`, D1 `satsang-auth`). Specs: `../specs/SHARED-ACCOUNT.md`, `../specs/JOURNEYS-DAYGATE.md`.

```
npm install                 # hono, jose, wrangler
npm test                    # 41 sign-in/token + 42 journey checks (no network; Google mocked)
npx wrangler deploy         # needs CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
node test/live.mjs          # 17 live checks
node tools/put-secrets.mjs  # first time only: AUTH_PRIVATE_JWK, SUB_PEPPER, JOURNEY_MASTER_KEY (never printed; backup in ../private/)
```
Schema: `schema.sql` (`npx wrangler d1 execute satsang-auth --remote --file schema.sql`, idempotent). Client: `client/auth.js`
(served at /auth.js; bundled into Satsang's app.js).
