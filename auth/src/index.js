// satsang-auth Worker entry. Production always verifies Google ID tokens against Google's published JWKS (no test override here).
import { createRemoteJWKSet } from 'jose'
import { makeApp } from './app.js'
import CLIENT_JS from '../client/auth.js' // bundled as text (wrangler.toml [[rules]]), served at /auth.js

const GOOGLE = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))
const app = makeApp({ googleKeys: () => GOOGLE, clientJs: CLIENT_JS })
export default app
