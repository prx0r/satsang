-- satsang-auth (Cloudflare D1 'satsang-auth'): one account across tantrafiles.xyz, nibbana.stonedoorway.com, body.stonedoorway.com
-- + day-gated journeys. Minimal PII: no email, no name, no photo. The Google subject is stored only as HMAC-SHA256(SUB_PEPPER, sub),
-- so the table alone cannot be joined to a Google account. Apply: wrangler d1 execute satsang-auth --remote --file schema.sql (idempotent)
CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,                 -- opaque 'u_' + random; this is the shared account id (token sub)
  sub_h TEXT NOT NULL UNIQUE,           -- HMAC(SUB_PEPPER, google sub)
  handle TEXT NOT NULL UNIQUE COLLATE NOCASE, -- pseudonym, generated, changeable
  created TEXT NOT NULL,
  last_seen TEXT
);
-- refresh tokens: stored hashed, rotated on every use; reuse of a rotated token revokes its whole family
CREATE TABLE IF NOT EXISTS refresh (
  h TEXT PRIMARY KEY, uid TEXT NOT NULL, fam TEXT NOT NULL, origin TEXT NOT NULL,
  created TEXT NOT NULL, expires TEXT NOT NULL, used INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS refresh_uid ON refresh (uid);
CREATE INDEX IF NOT EXISTS refresh_fam ON refresh (fam);
-- one-time handoff codes (hosted sign-in page -> site), bound to the return origin + a PKCE S256 challenge, 120 s
CREATE TABLE IF NOT EXISTS codes (h TEXT PRIMARY KEY, uid TEXT NOT NULL, origin TEXT NOT NULL, cc TEXT NOT NULL, expires TEXT NOT NULL, used INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS rl (k TEXT NOT NULL, win TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (k, win));

-- ---------- journeys (specs/JOURNEYS-DAYGATE.md) ----------
CREATE TABLE IF NOT EXISTS journeys (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, about TEXT, creator TEXT NOT NULL, invite_h TEXT NOT NULL,
  vouch_required INTEGER NOT NULL DEFAULT 0, key_epoch INTEGER NOT NULL DEFAULT 1, created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS members (
  jid TEXT NOT NULL, uid TEXT NOT NULL, handle TEXT NOT NULL, consent_at TEXT NOT NULL,
  pub TEXT,                              -- optional Ed25519 public key (base64url raw); when set, every entry must carry a valid signature
  PRIMARY KEY (jid, uid)
);
CREATE UNIQUE INDEX IF NOT EXISTS members_handle ON members (jid, handle);
CREATE TABLE IF NOT EXISTS vouches (jid TEXT NOT NULL, uid TEXT NOT NULL, by_uid TEXT NOT NULL, at TEXT NOT NULL, PRIMARY KEY (jid, uid, by_uid));
-- one row per member per day. ct/iv/wdek/wiv NULL = withdrawn by the author (crypto-shredded; the block id stays so the chain holds)
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY, jid TEXT NOT NULL, uid TEXT NOT NULL, day INTEGER NOT NULL,
  block TEXT NOT NULL, bid TEXT NOT NULL, sig TEXT,
  ct TEXT, iv TEXT, wdek TEXT, wiv TEXT, epoch INTEGER NOT NULL DEFAULT 1,
  held INTEGER NOT NULL DEFAULT 0,       -- 1 = crisis/safety hold: counts for the author's gate, never shown to others
  text_h TEXT,                           -- HMAC of the normalised text, only to refuse a copy of one's own earlier entry
  created TEXT NOT NULL,
  UNIQUE (jid, uid, day)
);
CREATE INDEX IF NOT EXISTS entries_day ON entries (jid, day);
