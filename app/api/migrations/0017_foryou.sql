-- 0017 (2026-10-20, specs/FORYOU.md): For You + intentions + the nightly freshness job. Additive only: new tables, no ALTER, no DROP.
-- Apply: npx wrangler d1 execute wiser --remote --file migrations/0017_foryou.sql   (idempotent)
-- intentions: what the listener brings (goals, current issues, curiosities, free text), private; who = 'u:<id>' | 'd:<device>'
CREATE TABLE IF NOT EXISTS intentions (who TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL);
-- crowd quality per clip, recomputed nightly by the Cron Trigger (GET /stats/clips reads it when fresh, else computes live)
CREATE TABLE IF NOT EXISTS clip_stats (clip TEXT PRIMARY KEY, picks INTEGER NOT NULL DEFAULT 0, wins INTEGER NOT NULL DEFAULT 0, resonates INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
-- the daily editorial theme (src/themes.js), written nightly for today and tomorrow (UTC dates); GET /feed/theme
CREATE TABLE IF NOT EXISTS daily_theme (day TEXT PRIMARY KEY, theme TEXT NOT NULL, updated_at TEXT NOT NULL);
