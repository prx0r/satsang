# Talk databases: access, audio, transcripts (2026-10-20, all verified live)

## Dharma Seed (dharmaseed.org) — YES, public access

- Stream (Listen button) + Download (MP3 to your computer, burn, share).
  Android + iOS apps exist (GitHub for the Android app).
- Licence: CC BY-NC-ND 4.0. Play/distribute UNABRIDGED, UNMODIFIED,
  CREDITED, NON-COMMERCIAL. Questions: contact@dharmaseed.org.
- **No official API.** A 2012 third-party REST API (tombh/dharma-api,
  dharma-api.com, API key, spiders over dharmaseed/audiodharma/sfzc)
  exists on GitHub — treat as dead until proven otherwise; our integration
  reads the site + apps, not that API.
- **Transcripts: they don't have any** ("we'd like to offer them, aren't
  there yet"; they invite donated transcripts). Our records stay
  metadata-only regardless — titles/descriptions/durations/links.
- Teacher uploads go through their deval bulk pipeline (MP3 + CSV) —
  relevant when living teachers contribute talks directly.

## Audiodharma (audiodharma.org) — YES, same model

- Insight Meditation Centre (Redwood City) talks, same CC BY-NC-ND ethos,
  stream + download. Second talk pool for retreat timetables.

## SuttaCentral — YES, real public APIs (verified returning JSON)

- `GET /api/suttaplex/<uid>` — blurb, difficulty (beginner/intermediate/
  advanced), translations list (lang, author, segmented?), parallel_count.
- `GET /api/bilarasuttas/<uid>/<translator>` — segmented root +
  translation text (html/root/translation/keys_order). Powers readers and
  study tools, not our records (we link suttas, store no text).
- `GET /api/...parallels` — cross-canon parallels (the comparative engine).
- Raw JSON mirrors on GitHub (suttacentral/bilara-data, sc-data).
- Per-translation licences vary — check each (Sujato's are open; legacy
  ones differ). Never assume.

## Voice (sc-voice) — UNVERIFIED endpoint

- Repo exists (sc-voice/sc-voice); site URL did not resolve from here.
  Backlog: confirm current audio endpoint before wiring sutta audio.
