-- Place layer: monasteries, retreat centres, ashrams, temples, pilgrimage and study sites (wisegraph/places.json).
-- Metadata only: official links and recurring programmes with the official schedule link; no dates are stored.
CREATE TABLE IF NOT EXISTS wg_places (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, country TEXT, city TEXT,
  lat REAL, lng REAL, founded INTEGER, url TEXT, schedule_url TEXT, wikidata TEXT, description TEXT
);
CREATE INDEX IF NOT EXISTS wg_places_country ON wg_places (country);
CREATE TABLE IF NOT EXISTS wg_place_links ( -- place -> tradition node | person (teacher_at: founders/teachers historically tied to it)
  place TEXT NOT NULL, kind TEXT NOT NULL CHECK (kind IN ('tradition', 'teacher')), ref TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS wg_place_links_ref ON wg_place_links (kind, ref);
CREATE TABLE IF NOT EXISTS wg_retreats ( -- recurring programmes; schedule_url is the official page (dates live there, not here)
  id TEXT PRIMARY KEY, place TEXT NOT NULL, name TEXT NOT NULL, typical_length TEXT, format TEXT, cost_model TEXT, schedule_url TEXT
);
CREATE INDEX IF NOT EXISTS wg_retreats_place ON wg_retreats (place);
