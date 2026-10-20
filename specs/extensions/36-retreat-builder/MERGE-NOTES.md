# MERGE-NOTES — 36-retreat-builder (for the lead agent)

## Merge steps
```bash
cd <satsang>
# docs: RETREAT-BUILDER.md -> docs/ (the loop is product spec)
# strictness.json -> app/wisegraph/ (read by the planner + timer)
# retreat-log.json -> specs/schema/retreat-log.json + profile store tables (10)
# plan_retreat -> AGENT_TOOLS; start_retreat/retreat_today (33) consume plans
# share path writes curations (05 tables); go-live path writes rooms (35 tables)
```

## Before deploy
- The "study week, not a retreat" warning is doctrine: the planner must
  say it when the container thins, not silently accept.
- Keepsake export includes talks as links + credits, never files.
- Cloned retreats attribute the originator (curation author chain).
