# HANDOVER — user profile build (for the next agent, 2026-10-20)

Goal: the profile a practitioner lives in — taste, saves, practice log,
routines, journeys, journal, export — wired into every surface of the site.
Spec: satsang `specs/PROFILE.md` + 0016 migration (already merged upstream).
Build law: `PROFILE-BUILD.md`. Shapes: `schemas/daily-snapshot.json`.
Journal mapping: `JOURNAL.md`. Agent surface: 41-agent-shelf
(`profile_export` + CONSENT scopes).

## Dev roadmap (in order, each shippable, each gated)

### Phase 0 — store (D1 + API, no UI)
- Confirm 0016 tables live (`saves`, `practice_log`, `routines`, `journeys`,
  `taste`, `device_claims`, `profile_settings`); add NOTHING new.
- Ship endpoints: `claim-device`, `saves` CRUD, `practice/log` + `practice`
  range read, `routines` PUT, `journeys/:id/progress`, `taste` read.
- Anonymous path first: every endpoint accepts `d:<device>` exactly like
  `/resonate` does today. Claim-merge tested with a fixture device.
- Done when: curl round-trip for all endpoints, anon + claimed.

### Phase 1 — snapshot endpoint (the spine everything reads)
- `GET /me/snapshot`: compute from live rows per `daily-snapshot.json`
  (chips, exploring, due, journeys, streak, suggested_next), cache 1h.
- Same shape feeds: personal pages, agents (41 `profile_export` =
  snapshot + scope filter), retreat builder defaults (36), guide_me
  personalization.
- Load-test before any bot onboarding (per-user compute; cache hard).
- Done when: snapshot matches hand-computed fixture; p95 < 300ms cached.

### Phase 2 — personal pages (`#me` private, `#u/<handle>` public-off)
- `#me`: chips, active practices + streak dots, journeys with resume,
  wishlist places, published curations. Reuse profile/teacher/tradition
  components; no new design language.
- `#u/<handle>`: stays OFF until the user turns it on (spec §6); minors
  never (self-declared at publish).
- Done when: screenshots phone + desktop, owner-approved.

### Phase 3 — journal composer + timeline
- Kind picker per JOURNAL.md mapping (practice_session→log, insight→essay
  draft, question→teacher-prompt, book_note→works log, dream/symbol→
  private essay, ritual_note→log note). Placeholder states the doctrine:
  the journal records, never divines (no AI dream interpretation, ever).
- Timeline + export-included + delete-with-account.
- Done when: each kind lands in the right record (matrix test).

### Phase 4 — taste UI + routines/timer/journeys wiring
- "What resonates with you": chips + sentence + Still exploring + Reset +
  per-chip Not-for-me (all client-computable per spec §2).
- Routines chain blocks (5 breath → 15 metta → dedication); timer cues
  from practice steps (33); journey resume across devices (03).
- Done when: a 7-day journey resumes on a second device.

### Phase 5 — export, agents, profile sync
- `/me/export` round-trip CI (export → import → identical snapshot).
- `profile_export?scope=` per CONSENT.md; agent pilot: one external bot
  reading taste + drafting one booking email, user sends from own mail app.
- Notes/keepsake/uploads NEVER leave except full user export. Audit this.

## Connection map (profile ↔ rest of site)

| site surface | profile touchpoint | pack |
|---|---|---|
| Resonance rounds / flash | picks → taste facets; hearts → saves | spec §2 |
| Collections/journeys | enrol → journeys rows; resume reads them | 03 |
| Practice timer | log writes practice_log; cues from steps | 33 + spec §4 |
| Retreat builder/keeper | retreat-log links practice rows; keepsake exports | 36 |
| Curations/essays | drafts private; publish per item; reports table | 05 |
| Places | wishlist/booked/been; contacts feed booking drafts | 41 compose_booking |
| MCP/agents | daily-snapshot + scoped export; drafts never sends | 41 |
| Red flags/safety | caution surfaces on teacher/place pages regardless of profile | 19 |
| D1 | 0016 tables only; curations in 0017; sessions in 0021 | 05/06 |

## Traps (don't rediscover)

- Snapshots compute on READ, never prebuilt files (per-user data).
- Notes/keepsakes/uploads stay device/account-private; the ONLY exit is
  explicit export/share. Any feature leaking them is a launch-blocker.
- Taste shows words, never numbers; streaks show dots, never shame.
- Journal dream entries: no interpretation features, ever.
- `DELETE /me` must actually delete (verify by re-export: empty).
