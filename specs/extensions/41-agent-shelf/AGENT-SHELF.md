# AGENT SHELF — third-party assistants read here (2026-10-20)

Any tool-calling assistant (phone, glasses, desktop — vendor-agnostic)
serves our users through this shelf. No partnership needed; the shelf is
open, read-scoped, and every record carries its source.

## The pattern (three calls to anything useful)

1. **Who is this user?** `profile_export` (taste chips, traditions,
   teachers followed, active practices, retreat history) — scoped read,
   user-granted, revocable.
2. **What's true?** directory tools (search → get_* → find_*). Facts with
   URLs and checked dates, never model memory.
3. **Draft, don't do.** `compose_booking` and friends return text + links
   for the user to send from their own accounts. The assistant sends via
   the USER's mail/calendar connectors, never ours.

## Task → tool map (the full shelf, working)

| user asks their bot | bot calls | user gets |
|---|---|---|
| "find me a 10-day retreat in March" | find_retreats + get_schedule | dated options with checked dates + official links |
| "book Wat Rampoeng" | get_place + compose_booking | draft email with their booking instructions embedded |
| "compare rebirth across traditions" | get_topic | takes + talks + practices, cited |
| "guide my sit today" | guide_me + retreat_today | teacher, method, timer, caution |
| "prep me for Saturday's session" | prep_for | text + scholar notes + 5-min primer |
| "who teaches near me" | find_teachers + geo | living teachers, nearest first |
| "plan my jhana retreat" | plan_retreat | talks + timetable + rules |
| "what should I study next" | recommend + taste | MMR picks + next topics |
| "is this teacher legit" | get_teacher (+ redflag if present) | bio, lineage, works, safety record |

## Ground rules for agents (served in llms.txt + MCP instructions)

- Cite record URLs, prefer high-confidence facts, confirm dates on the
  official schedule, never invent teacher quotes, respect practice
  cautions and needsTeacher, CC BY 4.0 on our curation with credit.
- Private notes, keepsake contents and practice logs NEVER leave the
  account except in the author's own export or explicit share.
- Price/dates/availability are claims about NOW: re-check per call, show
  the checked date, never cache an answer across days.
