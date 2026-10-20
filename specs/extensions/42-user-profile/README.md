# 42 — User profile build (snapshot packet + personal pages + journal)

**What:** the build layer on top of PROFILE.md's spec + D1 tables — what
actually ships, borrowed from ochemapp where it earned it.

**Borrowed (proven patterns, not code):**
- **Daily snapshot packet** (DailySnapshot pattern): one computed JSON per
  user per day — taste chips, due practices, journey positions, streak,
  suggested-next. Deterministic from events; fields NEVER removed (backward
  compat with stored snapshots); agents/LLM render FROM it, never from raw
  votes. This is what third-party bots read (41-shelf).
- **Client-id auth** (x-client-id header ≥8 chars, session fallback):
  aligns exactly with satsang's `d:<device>` anonymous-first model.
- **Journal kinds** (journal_entry, dream, practice_session, insight,
  question, symbol, book_note…): mapped onto our records, not a new table
  (see JOURNAL.md).
- **Portable backup** (gist-sync pattern): `/me/export` IS the backup —
  same JSON re-imports into a fresh account (spec §5 already says this).

**Files:** PROFILE-BUILD.md (ship list), schemas/daily-snapshot.json,
JOURNAL.md (kinds mapping), profile_export shape (for 41), REPORT +
MERGE-NOTES.
