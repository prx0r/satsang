-- Curations and essays (extension pack 05, drafts ROADMAP step 14's 0019_curations.sql).
-- User-authored collections + essays. Public pages CC BY 4.0 by default; private rows never leave the account except in export.
CREATE TABLE IF NOT EXISTS wg_curations (
  handle TEXT NOT NULL, slug TEXT NOT NULL, form TEXT NOT NULL CHECK (form IN ('curation', 'essay')),
  author TEXT NOT NULL, title TEXT NOT NULL, visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'unlisted', 'private')),
  intro TEXT, body TEXT, license TEXT NOT NULL DEFAULT 'CC-BY-4.0',
  attached_to TEXT, -- JSON array of gids (essays: what it is attached to)
  moderation_state TEXT NOT NULL DEFAULT 'queued' CHECK (moderation_state IN ('ok', 'queued', 'hidden', 'removed')),
  reports INTEGER NOT NULL DEFAULT 0, saves INTEGER NOT NULL DEFAULT 0, follows INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (handle, slug)
);
CREATE INDEX IF NOT EXISTS wg_curations_visibility ON wg_curations (visibility, moderation_state);
CREATE TABLE IF NOT EXISTS wg_curation_items ( -- ordered items of a curation's embedded collection
  handle TEXT NOT NULL, slug TEXT NOT NULL, n INTEGER NOT NULL,
  ref TEXT NOT NULL, role TEXT CHECK (role IN ('watch', 'read', 'practise', 'listen', 'visit', 'reflect')),
  note TEXT, optional INTEGER NOT NULL DEFAULT 0, grp TEXT,
  PRIMARY KEY (handle, slug, n)
);
CREATE TABLE IF NOT EXISTS wg_reports ( -- moderation reports on public curations/essays
  id INTEGER PRIMARY KEY AUTOINCREMENT, handle TEXT NOT NULL, slug TEXT NOT NULL,
  reporter TEXT, reason TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'upheld', 'dismissed')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS wg_reports_target ON wg_reports (handle, slug, state);
