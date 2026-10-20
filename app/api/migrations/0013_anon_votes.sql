-- anonymous device votes (user_id 'd:<device id>') are rate-limited per device and per hashed IP, in hourly windows
CREATE TABLE IF NOT EXISTS rate_limits (k TEXT NOT NULL, win TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (k, win));
CREATE INDEX IF NOT EXISTS votes_user ON votes (user_id, created_at);
