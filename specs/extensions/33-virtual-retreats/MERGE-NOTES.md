# MERGE-NOTES — 33-virtual-retreats (for the lead agent)

## Merge steps
```bash
cd <satsang>
# VIRTUAL-RETREAT.md + DHARMA-SEED-RULES.md -> docs/ (client spec)
# timetables/ -> app/wisegraph/timetables/ (new dir; build passes through)
# mcp tools -> AGENT_TOOLS with resolvers per file
# talk-slot fill reuses rank.mjs MMR + full-talk-only filter (add the filter:
#   virtual clips and footage are discovery-only, never practice playback)
# timer: ROADMAP-9 dark timer extended with block cues (bell/voice/silent)
```

## Before deploy
- Dharma Seed integration starts with their licence page read into the
  licence registry (28-pattern) — playback ships only after that row exists.
- The retreat never claims transmission; the start screen says orientation
  scaffolding in plain words (copy in VIRTUAL-RETREAT spirit, not exact text).
- Teacher-prompt cards need live contacts — they read place.contact at
  render time, never a cached copy.
