-- Wiser "This resonates": a light single-talk signal (not a vote). One row per (who, clip); who = user id or 'd:<device id>'.
CREATE TABLE IF NOT EXISTS resonates (
  who TEXT NOT NULL,
  clip TEXT NOT NULL,
  t INTEGER,
  sec INTEGER,
  created_at TEXT NOT NULL,
  PRIMARY KEY (who, clip)
);
CREATE INDEX IF NOT EXISTS resonates_clip ON resonates (clip);
