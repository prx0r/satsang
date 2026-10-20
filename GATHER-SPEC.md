# Wiser Gather: spec (user vision 2026-10-20, spec only, NOT building yet)

Positioning, first step (user): Wiser = THE resource for comparative traditions: scholars, videos, education, practice. It shares roots with prx0r/patalacheckpoints, prx0r/openpatala, deitybody and sanskrithelp. Gather comes later.

## Goal
Joining a teaching, a sangha sit, a reading group or a class is effortless: the agent puts it on your calendar, reminds you, pops up and joins you in, from a phone, a laptop, a TV, VR or AR.

## Session types
- Live talk / Q&A (teacher + audience), study circle (a text + a scholar), group sit (silent, a timer, a bell), course class (a syllabus step), 1:1 mentoring.
- Each session links to Atlas nodes (teacher, text, concept, tradition) and to a syllabus step. Recordings (opt-in) become talks on the teacher's profile.

## Join layer (pick the least friction)
1. Phase 1, wrap existing tools: Zoom/Meet/Jitsi links stored per session; deep link plus a one-tap join from the reminder. Zoom Meeting SDK / Web SDK embed inside Wiser where licensing allows; otherwise open the native app.
2. Phase 2, native rooms: WebRTC via LiveKit (self-host or cloud) for sits and circles; ambient "sanctuary" UI (deitybody visual grammar, bell, timer); low-bandwidth audio-only mode.
3. Phase 3, immersive: WebXR room (Quest/Vision Pro browser): a shared space with spatial audio, a text panel and a body-map visualisation for guided practice. AR: a phone overlay of the practice map during a sit.

## Agent integration (the "no hassle" core)
- An ICS feed per user plus Google/Apple calendar add (OAuth calendar write, events carry the join URL and a Wiser deep link).
- Agent hooks: a reminder at T-10 min (push / email / Hark message), at T-1 min a "Join now" card that opens straight into the room, camera and mic preset, no waiting room for members.
- MCP tools (shared with the open-data layer): list_sessions(topic|teacher|tradition), add_to_calendar(session), join_url(session), my_schedule(), prep_for(session) → the Atlas text, the scholar notes and a 5-min primer clip.
- Practice schedule: syllabus = theory sessions + a daily practice cadence; the agent schedules the practice blocks and nudges.

## Data
sessions(id, kind, title, starts_at tz, duration, host_id, atlas_nodes[], syllabus_step?, join_provider, join_url, recording_policy), rsvps(user, session, status), reminders(user, session, channel, offset), practice_plans(user, syllabus, cadence).

## Trust / rights
Teacher consent for recording; no recording of private sits; Dharma Seed-style licences respected; minors and safeguarding policy before open rooms.

## Order
Atlas + scholars → open data/MCP + curations → syllabuses/practice (openpatala, patalacheckpoints) → Gather phase 1 → phase 2 → XR.
