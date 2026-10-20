# MERGE-NOTES — 32-schedules-stream (for the lead agent)

## Merge steps
```bash
cd <satsang>
# docs: STREAM-SPEC.md -> docs/ (freshness doctrine)
# programme.json -> specs/schema/programme.json
# refresh_schedules.py -> app/tools/validate/ (+ cron daily, state in D1/kv)
# mcp tools -> AGENT_TOOLS (find_retreats, get_schedule)
# programmes seeds -> app/wisegraph/programmes.json (new file, build passes through)
# occurrences: event.json rows written per human re-read, never seeded
```

## Before deploy
- Cron needs fetch egress + state store; failures become queue items, never pages.
- TTL default 14 days for occurrences; programmes timeless.
- Serve-time filters (fresh + future only) are load-bearing — test with expired fixtures.
