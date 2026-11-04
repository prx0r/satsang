/*! Satsang shared account: drop-in client (no dependencies). https://auth.tantrafiles.xyz/auth.js
 * One Google sign-in across tantrafiles.xyz, nibbana.stonedoorway.com and body.stonedoorway.com.
 * Usage:  <script src="https://auth.tantrafiles.xyz/auth.js"></script>
 *         SatsangAuth.init({ onChange: function (user) { ... } })   // user = { uid, handle } or null
 *         SatsangAuth.signIn()  /  SatsangAuth.signOut()  /  SatsangAuth.fetch(url, opts)  (adds the Bearer token)
 * Tokens live in this site's localStorage only (one site never reads another's). ES2017, no optional chaining (old Safari ok).
 * Spec: https://github.com/prx0r/satsang/blob/main/specs/SHARED-ACCOUNT.md */
(function (root) {
  'use strict'
  var AUTH = 'https://auth.tantrafiles.xyz', K = 'satsang.auth.', listeners = []
  var ls = { get: function (k) { try { return JSON.parse(localStorage.getItem(K + k)) } catch (e) { return null } },
    set: function (k, v) { try { v == null ? localStorage.removeItem(K + k) : localStorage.setItem(K + k, JSON.stringify(v)) } catch (e) {} } }
  function b64u(u8) { var s = ''; for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }
  function unb64u(s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u }
  function rnd(n) { return crypto.getRandomValues(new Uint8Array(n)) }
  function sha256(str) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (b) { return new Uint8Array(b) }) }
  function emit() { var u = ls.get('user'); for (var i = 0; i < listeners.length; i++) try { listeners[i](u) } catch (e) {} }
  function post(path, body, token) {
    var h = { 'content-type': 'application/json' }; if (token) h.authorization = 'Bearer ' + token
    return fetch(AUTH + path, { method: 'POST', headers: h, body: JSON.stringify(body || {}) }).then(function (r) { return r.json().catch(function () { return {} }).then(function (j) { return { ok: r.ok, status: r.status, j: j } }) })
  }
  function adopt(t) { // store a token set from /v1/google, /v1/exchange or /v1/refresh
    if (!t || !t.access || !t.refresh) return null
    ls.set('access', t.access); ls.set('exp', Date.now() + (t.expires_in || 3600) * 1000 - 60000); ls.set('refresh', t.refresh); ls.set('user', t.user || null); emit(); return t.user || null
  }
  function clear() { ls.set('access', null); ls.set('exp', null); ls.set('refresh', null); ls.set('user', null); emit() }
  var refreshing = null
  function token() { // a valid access token or null (refreshes when near expiry; refresh tokens rotate)
    var a = ls.get('access'), exp = ls.get('exp') || 0
    if (a && Date.now() < exp) return Promise.resolve(a)
    var r = ls.get('refresh'); if (!r) return Promise.resolve(null)
    if (!refreshing) refreshing = post('/v1/refresh', { refresh: r }).then(function (x) { refreshing = null; if (x.ok) { adopt(x.j); return x.j.access } if (x.status === 401) clear(); return null }, function () { refreshing = null; return null })
    return refreshing
  }
  function authFetch(url, opts) {
    opts = opts || {}
    return token().then(function (t) { var h = {}; var src = opts.headers || {}; for (var k in src) h[k] = src[k]; if (t) h.authorization = 'Bearer ' + t
      var o = {}; for (var k2 in opts) o[k2] = opts[k2]; o.headers = h; return fetch(url, o) })
  }
  function api(method, path, body) {
    return authFetch(AUTH + path, { method: method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {} }).then(function (j) { return { ok: r.ok, status: r.status, j: j } }) })
  }
  // hosted sign-in (different registrable domains): redirect to auth.tantrafiles.xyz, come back with #sa_code, exchange with PKCE
  function signIn() {
    var ver = b64u(rnd(32)), st = b64u(rnd(16))
    try { sessionStorage.setItem(K + 'pkce', JSON.stringify({ v: ver, s: st })) } catch (e) {}
    return sha256(ver).then(function (h) {
      var ret = location.href.split('#')[0]
      location.assign(AUTH + '/signin?return=' + encodeURIComponent(ret) + '&state=' + st + '&cc=' + b64u(h))
    })
  }
  // the code is taken out of the URL the moment this script runs, before any hash router sees it
  var pending = null
  try {
    pending = /[#&]sa_code=([A-Za-z0-9_-]+)&sa_state=([A-Za-z0-9_-]+)/.exec(location.hash || '')
    if (pending) { try { history.replaceState(null, '', location.pathname + location.search) } catch (e) { location.hash = '' } }
  } catch (e) {}
  function handleReturn() {
    var m = pending; pending = null
    if (!m) return Promise.resolve(null)
    var p = null; try { p = JSON.parse(sessionStorage.getItem(K + 'pkce')); sessionStorage.removeItem(K + 'pkce') } catch (e) {}
    if (!p || p.s !== m[2]) return Promise.resolve(null)
    return post('/v1/exchange', { code: m[1], verifier: p.v }).then(function (x) { return x.ok ? adopt(x.j) : null })
  }
  function signOut() { var r = ls.get('refresh'); clear(); return r ? post('/v1/logout', { refresh: r }).catch(function () {}) : Promise.resolve() }
  function init(o) {
    o = o || {}; if (o.onChange) listeners.push(o.onChange)
    return handleReturn().then(function () { return token() }).then(function () { var u = ls.get('user'); emit(); return u })
  }
  // local verification of an access token against the public JWKS (ES256), e.g. before trusting it in your own code
  var jwksP = null
  function verify(jwt) {
    var parts = String(jwt).split('.'); if (parts.length !== 3) return Promise.resolve(null)
    var hdr, pl; try { hdr = JSON.parse(new TextDecoder().decode(unb64u(parts[0]))); pl = JSON.parse(new TextDecoder().decode(unb64u(parts[1]))) } catch (e) { return Promise.resolve(null) }
    if (hdr.alg !== 'ES256' || pl.iss !== AUTH || pl.aud !== 'satsang' || !(pl.exp * 1000 > Date.now())) return Promise.resolve(null)
    if (!jwksP) jwksP = fetch(AUTH + '/.well-known/jwks.json').then(function (r) { return r.json() })
    return jwksP.then(function (set) {
      var jwk = null; for (var i = 0; i < set.keys.length; i++) if (set.keys[i].kid === hdr.kid) jwk = set.keys[i]
      if (!jwk) return null
      return crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y, ext: true }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
        .then(function (k) { return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, unb64u(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1])) })
        .then(function (ok) { return ok ? pl : null })
    })
  }
  // ---- day-gated journeys: the server releases day keys; entries are decrypted here, in the browser ----
  function aes(raw, use) { return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [use]) }
  function openEntry(kdB64, e) {
    var te = new TextEncoder()
    return aes(unb64u(kdB64), 'decrypt').then(function (kd) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64u(e.wiv), additionalData: te.encode('dek:' + e.id) }, kd, unb64u(e.wdek)) })
      .then(function (dek) { return aes(new Uint8Array(dek), 'decrypt') })
      .then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64u(e.iv), additionalData: te.encode('entry:' + e.id) }, k, unb64u(e.ct)) })
      .then(function (pt) { return JSON.parse(new TextDecoder().decode(pt)) })
  }
  var journeys = {
    create: function (title, about, opts) { return api('POST', '/v1/journeys', { title: title, about: about, consent: true, vouch_required: !!(opts && opts.vouch_required) }) },
    join: function (jid, invite) { return api('POST', '/v1/journeys/' + jid + '/join', { invite: invite, consent: true }) },
    mine: function () { return api('GET', '/v1/journeys/mine') },
    get: function (jid) { return api('GET', '/v1/journeys/' + jid) },
    ticket: function (jid) { return api('POST', '/v1/journeys/' + jid + '/ticket') },
    post: function (jid, day, text, ticket, signed) { var b = { day: day, text: text, ticket: ticket }; if (signed) { b.salt = signed.salt; b.at = signed.at; b.sig = signed.sig } return api('POST', '/v1/journeys/' + jid + '/entries', b) },
    day: function (jid, d) { // -> { locked } or { day, entries: [{ handle, mine, at, text|withdrawn, block, bid }] }
      return api('GET', '/v1/journeys/' + jid + '/days/' + d).then(function (x) {
        if (!x.ok) return { locked: x.status === 403, status: x.status, error: x.j.error, hint: x.j.hint }
        return Promise.all(x.j.entries.map(function (e) {
          if (e.withdrawn) return Promise.resolve({ handle: e.handle, mine: e.mine, at: e.at, withdrawn: true, bid: e.bid, block: e.block })
          return openEntry(x.j.keys[e.epoch], e).then(function (p) { return { handle: e.handle, mine: e.mine, held: e.held, at: e.at, text: p.text, salt: p.salt, bid: e.bid, block: e.block, sig: e.sig } })
        })).then(function (list) { return { day: x.j.day, entries: list } })
      })
    },
    withdraw: function (jid, d) { return api('DELETE', '/v1/journeys/' + jid + '/entries/' + d) },
    leave: function (jid) { return api('POST', '/v1/journeys/' + jid + '/leave') },
  }
  root.SatsangAuth = { init: init, signIn: signIn, signOut: signOut, user: function () { return ls.get('user') }, token: token, fetch: authFetch, api: api,
    adopt: adopt, verify: verify, journeys: journeys, openEntry: openEntry, onChange: function (f) { listeners.push(f) }, base: AUTH,
    eraseAccount: function () { return api('DELETE', '/v1/me').then(function (x) { if (x.ok) clear(); return x }) } }
})(typeof window !== 'undefined' ? window : globalThis)
