# 42-user-profile: archived 2026-10-21 (not built)

Why: everything in this pack runs on per-user state (accounts, D1 `practice_log` / journal rows from migration 0016, `GET /me/snapshot`,
`GET /me/export`, personal pages). Satsang has no accounts or user D1 writes live yet, so nothing here is applied: no migration, no endpoint,
no UI. What was taken: the daily-snapshot shape and the `practice_session` journal kind are folded into `specs/PRACTICE-ENGINE.md §7.1`
(the planned session log) and `specs/PRACTICE-ASK.md` (privacy + where Ask events land). `schemas/daily-snapshot.json` stays here as the
draft; it is NOT in `specs/schema/` (the open-data validator only covers published records). Rules kept: journal private by default,
exportable, deletable; no AI dream interpretation; agents read the snapshot, never raw tables.
