# VIRTUAL-RETREAT engine spec (2026-10-20)

One virtual retreat = a programme + a timetable + talk slots + rules +
a timer + a completion record. No transmission is claimed anywhere.

## Assembly (per retreat)

1. **Programme** (32): length, format, cost, recurrence. The retreat
   inherits these; the official schedule page stays linked throughout.
2. **Timetable** (`timetables/<id>.json`): blocks with start/minutes/kind/
   cue. Kinds: wake, sit, walk, chant, meal, talk, rest, interview-prep.
   Sources: published centre schedules (structural facts, linked).
3. **Talk slots**: filled at runtime from full-talk records matching the
   programme's topic/tradition (MMR pick, like collections). NEVER virtual
   clips cut for the retreat, NEVER re-edited audio. See DHARMA-SEED-RULES.
4. **Rules**: the centre's published code (silence, precepts, schedule
   discipline) shown BEFORE start, acknowledged with a tap. No invented rules.
5. **Teacher gap**: sit-to-report slots become "take this to a teacher"
   cards carrying the teacher/centre contact. The engine never plays teacher.
6. **Timer + log**: existing practice-timer pattern (ROADMAP 9); completion
   = kept the blocks, nothing mystical. Streaks stay device-local unless
   the profile syncs them (10).

## First timetables

- `goenka-10day` (this pack, MBMC skeleton). Next: suan-mokkh-10day
  (IDH structure: noble silence, 2 meals, interviews — needs sourcing),
  rampoeng-26day (26-day arc + interview cadence — needs sourcing),
  thai-forest-weekend (5-precept, chant-heavy — needs sourcing).
