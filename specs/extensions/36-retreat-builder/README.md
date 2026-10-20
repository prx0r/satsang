# 36 — Retreat builder (intent → keepsake → live)

**What:** the workflow — "I want a jhana retreat" → matched talks →
strictness dial → personal timetable + rules → retreat with daily notes →
keepsake → shareable → hostable live.

**Flow:**
1. **Intent:** topic (jhana) + tradition/teacher (optional) + length +
   strictness (gentle|standard|strict). `plan_retreat` returns a plan:
   matched talks (MMR across traditions, full talks only), timetable
   scaled to strictness, rules overlay (tradition defaults + strictness
   rules), flexibility notes (what may bend without breaking the container).
2. **Strictness dial:** gentle (4–5 h/day, flexible meals, reading ok) /
   standard (6–8 h, noble silence, eight precepts) / strict (10 h+,
   full silence, no reading/writing, 04:00 wake). Tradition overlays add
   (Goenka noble-silence code, Thai chant slots, Zen oryoki formality).
   The dial changes hours and rules, never the talks.
3. **Execute:** 33-timer blocks; end-of-day notes prompt (what sat, what
   stuck, questions for a teacher); uploads attach to days (photos of
   pages, not people, by default).
4. **Keepsake:** retreat-log.json — plan + kept blocks + talks heard +
   notes + stats + teacher-prompt cards. Exportable (user's data, 10),
   printable, shareable.
5. **Share:** publish the keepsake (minus private notes) as a curation
   (05): "my 7-day jhana retreat" with the timetable, talk list and rules
   others can clone. Clones reference, never copy, the talks.
6. **Go live:** promote a shared retreat to a hosted room (35): pick
   dates, open RSVPs, run sits live. Personal → communal in one tap.

**Files:** RETREAT-BUILDER.md, strictness.json (the dial), keepsake.json
(schema), mcp-tools.json (plan_retreat), REPORT + MERGE-NOTES.
