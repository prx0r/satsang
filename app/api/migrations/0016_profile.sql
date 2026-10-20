-- 0016 (2026-10-20, specs/PROFILE.md §7): the practitioner profile, anonymous-first. Additive only: new tables, no ALTER,
-- no DROP. Every `who` is 'u:<user id>' or 'd:<device id>' so a device works from day one and a later claim is a rewrite.
-- Apply: npx wrangler d1 execute wiser --remote --file migrations/0016_profile.sql   (idempotent)
CREATE TABLE IF NOT EXISTS saves (who TEXT NOT NULL, ref TEXT NOT NULL, list TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, PRIMARY KEY (who, ref, list));
CREATE TABLE IF NOT EXISTS practice_log (id TEXT PRIMARY KEY, who TEXT NOT NULL, practice TEXT NOT NULL, at TEXT NOT NULL, minutes REAL NOT NULL,
  routine TEXT, journey TEXT, note TEXT, quality INTEGER, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS practice_log_who ON practice_log (who, at);
CREATE TABLE IF NOT EXISTS routines (id TEXT PRIMARY KEY, who TEXT NOT NULL, name TEXT NOT NULL, blocks TEXT NOT NULL, rrule TEXT, tz TEXT, remind INTEGER DEFAULT 0, updated_at TEXT);
CREATE TABLE IF NOT EXISTS journeys (who TEXT NOT NULL, collection TEXT NOT NULL, started TEXT NOT NULL, unit INTEGER NOT NULL DEFAULT 1, done TEXT NOT NULL DEFAULT '[]',
  paused INTEGER DEFAULT 0, updated_at TEXT, PRIMARY KEY (who, collection));
CREATE TABLE IF NOT EXISTS taste (who TEXT PRIMARY KEY, facets TEXT NOT NULL, n INTEGER NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS device_claims (device TEXT PRIMARY KEY, user_id TEXT NOT NULL, at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS profile_settings (user_id TEXT PRIMARY KEY, visibility TEXT NOT NULL DEFAULT '{}', handle TEXT UNIQUE, chips TEXT);
-- Topic flash events (specs/LOOP.md §5): flash_shown {topic, clips[], slots[]}, flash_pick {topic, winner|none}, bridge {from, to, reason, action}.
-- Kept apart from watch_events, whose CHECK(kind) cannot be altered additively.
CREATE TABLE IF NOT EXISTS flash_events (id INTEGER PRIMARY KEY AUTOINCREMENT, who TEXT NOT NULL, kind TEXT NOT NULL, topic TEXT, data TEXT, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS flash_events_kind ON flash_events (kind, created_at);
CREATE INDEX IF NOT EXISTS flash_events_who ON flash_events (who, created_at);
