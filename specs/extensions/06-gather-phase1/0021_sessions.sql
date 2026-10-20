-- Gather phase 1 storage (extension pack 06, draft for ROADMAP step 16).
-- Sessions link to Atlas nodes + syllabus steps. No dates cached long-term for recurring retreats; live sessions carry real times.
CREATE TABLE IF NOT EXISTS wg_sessions (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK (kind IN ('talk', 'qa', 'sit', 'circle', 'class', 'mentoring')),
  title TEXT NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT, tz TEXT NOT NULL DEFAULT 'UTC',
  host TEXT, atlas_nodes TEXT, -- JSON array of gids (teacher, text, concept, tradition)
  syllabus_step TEXT, -- collection id + unit n, e.g. collection/seven-days-with-death#3
  join_provider TEXT CHECK (join_provider IN ('zoom', 'meet', 'jitsi', 'livekit', 'in-person', 'webxr')),
  join_url TEXT, place TEXT, online INTEGER NOT NULL DEFAULT 1,
  recording_policy TEXT NOT NULL DEFAULT 'opt-in' CHECK (recording_policy IN ('opt-in', 'none')),
  capacity INTEGER, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS wg_sessions_starts ON wg_sessions (starts_at);
CREATE TABLE IF NOT EXISTS wg_rsvps (
  who TEXT NOT NULL, session TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'declined')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (who, session)
);
CREATE TABLE IF NOT EXISTS wg_reminders (
  who TEXT NOT NULL, session TEXT NOT NULL, channel TEXT NOT NULL CHECK (channel IN ('push', 'email', 'hark')),
  offset_min INTEGER NOT NULL DEFAULT 10, sent INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (who, session, channel, offset_min)
);
CREATE TABLE IF NOT EXISTS wg_practice_plans (
  who TEXT NOT NULL, syllabus TEXT NOT NULL, cadence TEXT NOT NULL DEFAULT 'daily',
  starts_on TEXT, active INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (who, syllabus)
);
