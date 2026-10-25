# Wiser: the practitioner profile (spec, 2026-10-20)

> **Status (2026-10-25):** **partial**. Shipped: device-first profile (saves, practice log, journeys, taste, export/delete; D1 0016_profile). Not shipped: Google sign-in (GOOGLE_CLIENT_ID empty) so device claim is untested live; curations/essays (§ curations, ROADMAP 14).

The profile is what Wiser learns from you and what you keep: your taste across traditions, what you saved, what you
practise, the journeys you are on. **Private by default, exportable whole, deletable whole.** It starts anonymous on the
device (Funnier's pattern, already live in Wiser's API) and merges into an account only when you choose to sign in.

## 1. Identity: device first, account optional
- **Device id** (`localStorage wiser.device`, `/^[A-Za-z0-9_-]{8,64}$/`, made by `deviceId()` in `src/app.js`) stands in for
  the user as `who = 'd:<id>'` on `/votes`, `/resonate`, `/events` (live today; rate-limited per device and hashed IP in
  `rate_limits`, migration 0013).
- **Account**: Google sign-in (existing `/auth/google`; `users` table). Later: email magic link (no passwords stored).
- **Merge (new): `POST /me/claim-device {device}`** after sign-in. In one D1 batch:
  `UPDATE OR IGNORE votes SET user_id = :uid WHERE user_id = 'd:'||:dev` then `DELETE FROM votes WHERE user_id = 'd:'||:dev`
  (the IGNORE keeps the account's own vote when both judged the same pair); the same for `resonates (who)`, `saves`,
  `practice_log`, `journeys`, `routines`. Writes a `device_claims(device, user_id, at)` row so a device can be claimed
  once (a second claim by another account is refused: protects shared devices from silently merging into a stranger).
  The client then re-reads `/me/profile-data` and drops its local copies except as cache.
- **Several devices**: each claims into the same account; taste is recomputed from the union of events.

## 2. Resonance → taste vector
Signals, from strongest to weakest:
1. Pairwise pick in a resonance round / Topic flash "which resonated" (full weight once both talks played ≥ 60 s or to
   their end; `lowWatch` half weight; already implemented as `GATE_SEC`).
2. "This resonates" heart on a playing talk (single-talk save; weight 0.5 of a pick).
3. Completion (watched ≥ 80 %: +0.2), Listen again (+0.3), Next before the 60 s gate (−0.4 of a loss, as today), Pass on a
   whole flash (−0.15 to each shown).
4. Saves, journey enrolments, practice minutes (practice is taste too: +0.1 per logged session to that practice's
   traditions and topics, capped per day).

**Model.** Per user, one Bayesian vector over four facets: `traditions` (family and school nodes), `topics` (roots + leaves),
`teachers`, `styles` (delivery, length class, guided vs talk, language). Each facet value keeps a Beta posterior
`(a, b)` starting from the crowd prior (`a0 = 1 + 2·crowdShare`, `b0 = 1 + 2·(1 − crowdShare)`): a win/resonate adds to `a`
for every facet value of the winner, a loss adds `0.6` to `b` for the loser's values (scaled by the signal weight above).
Facet weight = posterior mean − prior mean, in [−1, 1]; uncertainty = posterior variance (used by RANKING §4 for
information gain). The pairwise Bradley–Terry model on clips (live today, `rank.js`) stays the per-clip layer; the taste
vector is the per-user layer that generalises across clips, teachers and topics never seen.
- Recomputed client-side after every pick (cheap; < 300 facet values) and server-side nightly from events for signed-in
  users (`GET /me/taste` already exists in the Funnier code path; extend its payload with the four facets).
- Shown to the user as **"What resonates with you"**: top traditions and topics as gold-bordered chips, a sentence
  ("You lean towards Thai Forest and Advaita, and towards talks on death and the self"), and **"Still exploring"**: the
  facets with the most uncertainty. Never shows numbers. "Reset my taste" and per-chip "Not for me" (sets b += 3).

## 3. What a profile holds
| area | content | default visibility |
|---|---|---|
| Taste | facets above | private (can be shown as chips on a public profile) |
| Saved | talks, passages, practices, texts, places, collections, curations; optional named lists ("For the commute") | private |
| Practice log | `{practice, at, minutes, routine?, journey?, note?, quality 1–5}` from the timer or added by hand | private |
| Routines / timers | named blocks: `[{practice, minutes, bell}]`, an RRULE schedule and timezone, reminders on/off | private |
| Journeys in progress | `{collection, started, unit, done[], paused}`; resume lands on the next unit | private |
| Works log | Read / Heard / Want (exists on device as "+ Read/Heard") | private |
| Places | wishlist / booked / been | private |
| Curations and essays | drafts private; publish per item | per item |
| Public practice profile | handle, avatar, chosen chips, published curations, optionally "practising X" and streak | **off** until turned on |

**Streaks without pressure.** Days practised this week (dots), total hours, longest run. No streak-loss warnings, no red;
missing a day shows nothing. Plain words ("12 sits this month"), no clocks in the main UI (timers live inside practice).

## 4. Practice timer (lives inside a practice or routine)
Dark full-screen: the practice name in the serif display face, one gold hairline ring that fills slowly (no countdown
numerals unless tapped), bells at the step `seconds` cues, screen dimmed, keep-awake. End: "Log this sit" with minutes
pre-filled, an optional note and a quality tap. Routines chain blocks (e.g. 5 min breath → 15 min metta → 2 min dedication).
Offline-first: the log is written to `localStorage wiser.practice` and flushed through the existing `queue`/`flushQueue()`.

## 5. Export and deletion (own your data)
- `GET /me/export` → one JSON file matching `specs/schema/profile.json` (taste, votes, resonates, saved, practice log,
  routines, journeys, works log, places, curations with bodies) plus a CSV of the practice log. Anonymous users get the
  same from the device ("Download my data" builds it locally from `localStorage`).
- `DELETE /me` → removes the user row and every row keyed to `u:<id>` or a claimed device; public curations are either
  deleted or (if the author ticks it) transferred to "anonymous" under their licence. The existing `/export/votes`
  (aggregate, anonymised) is unaffected.
- Import: the same JSON can be imported into a fresh account (moves between instances, satsang.digital later).

## 6. Public vs private, and safety
- Visibility per area (`profile.visibility.{profile,taste,practice,curations}`), all `private` at first.
- A public practice profile can join "people practising X" lists only if both the profile and that practice are public.
  No DMs in v1; connection = follow a curator. Minors: no public profile under 18 (self-declared at publish time).
- Essays and curations go through moderation (report button → queue; hidden at 3 reports pending review).

## 7. D1 (new tables, migration `0016_profile.sql`)
```sql
CREATE TABLE IF NOT EXISTS saves (who TEXT NOT NULL, ref TEXT NOT NULL, list TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, PRIMARY KEY (who, ref, list));
CREATE TABLE IF NOT EXISTS practice_log (id TEXT PRIMARY KEY, who TEXT NOT NULL, practice TEXT NOT NULL, at TEXT NOT NULL, minutes REAL NOT NULL,
  routine TEXT, journey TEXT, note TEXT, quality INTEGER, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS practice_log_who ON practice_log (who, at);
CREATE TABLE IF NOT EXISTS routines (id TEXT PRIMARY KEY, who TEXT NOT NULL, name TEXT NOT NULL, blocks TEXT NOT NULL, rrule TEXT, tz TEXT, remind INTEGER DEFAULT 0, updated_at TEXT);
CREATE TABLE IF NOT EXISTS journeys (who TEXT NOT NULL, collection TEXT NOT NULL, started TEXT NOT NULL, unit INTEGER NOT NULL DEFAULT 1, done TEXT NOT NULL DEFAULT '[]',
  paused INTEGER DEFAULT 0, updated_at TEXT, PRIMARY KEY (who, collection));
CREATE TABLE IF NOT EXISTS taste (who TEXT PRIMARY KEY, facets TEXT NOT NULL, n INTEGER NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS device_claims (device TEXT PRIMARY KEY, user_id TEXT NOT NULL, at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS profile_settings (user_id TEXT PRIMARY KEY, visibility TEXT NOT NULL DEFAULT '{}', handle TEXT UNIQUE, chips TEXT);
```
Curations go in `0017_curations.sql` (`curations(id, author, slug, form, title, intro, body, visibility, license, status,
created_at, updated_at)`, `curation_items(curation, ord, ref, role, note, grp)`, `reports(ref, who, reason, at)`).
All `who` columns accept `u:<id>` or `d:<device>` so anonymous use works from day one and the claim step is a rewrite.

## 8. API (new)
`POST /me/claim-device` · `GET/PUT /me/taste` · `POST /saves` `{ref, list, on}` · `GET /me/saves` · `POST /practice/log` ·
`GET /me/practice?from=&to=` · `PUT /me/routines/:id` · `POST /journeys/:collection/progress {unit, done}` ·
`GET /me/export` · `DELETE /me` · `PUT /me/visibility`. Anonymous variants take `device` in the body like `/resonate`.
