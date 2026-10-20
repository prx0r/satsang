# PROFILE-BUILD — ship list (2026-10-20)

Beyond PROFILE.md's spec + 0016 tables, in merge order:

1. **Daily snapshot builder** (`app/tools/build-snapshot.py`, cron at
   03:00): reads votes/resonates/practice_log/journeys/saves → writes
   `site/data/snapshots/<who>.json`?? NO — snapshots are per-user; they
   are computed on READ (`GET /me/snapshot` builds from live rows, cached
   1h), never prebuilt files. Same shape as the schema here. Agents
   (41) read this endpoint, never raw tables.
2. **Personal pages** (`#u/<handle>` public, `#me` private): profile chips,
   active practices + streak dots, journeys in progress with resume,
   published curations, wishlist places. Reuses profile/teacher/tradition
   components; no new design language.
3. **Journal UI**: entry composer with kind picker (JOURNAL.md mapping),
   timeline, export included. Private; publish-via-essay flow only.
4. **Taste UI** ("What resonates with you"): chips + sentence + Still
   exploring + Reset + per-chip Not-for-me (spec §2, all client-computable).
5. **`profile_export` (41-shelf shape)**: `GET /me/export?scope=` returns
   the profile.json subset the agent's scopes allow (CONSENT scopes:
   taste/schedule/practice/saves — notes, keepsake contents and uploads
   NEVER leave except full user export). This endpoint is what Meta/OpenAI
   bots call; it returns the daily-snapshot shape by default (small),
   full profile only on explicit user export.
6. **Routines/timers/journeys/resume**: per spec §§3–4 + 03-collections
   resume + 33-timer cues. Nothing new specified here — referenced so the
   build doesn't forget them.
