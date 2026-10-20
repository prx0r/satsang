# MERGE-NOTES — 42-user-profile (for the lead agent)

## Merge steps
```bash
cd <satsang>
# docs: PROFILE-BUILD.md + JOURNAL.md -> docs/ (build law)
# daily-snapshot.json -> specs/schema/ + GET /me/snapshot (computed on read, cached 1h)
# profile_export shape -> 41-agent-shelf resolver + scope filtering per CONSENT.md
# personal pages + journal UI + taste UI: app work per PROFILE-BUILD order
# D1: 0016 already has the tables — no new migration here
```

## Before deploy
- Snapshot endpoint is THE agent surface: load-test it before any external
  bot onboarding (it's per-user computed; cache hard).
- Journal dream/symbol entries: record-only doctrine (no AI dream
  interpretation, ever) — state it in the composer placeholder text.
- Export parity test: `/me/export` output re-imports cleanly (round-trip
  in CI, with the sample profile from specs).
