# MERGE-NOTES — 06-gather-phase1 (for the lead agent)

## Merge steps
```bash
cd <satsang>
# 1. renumber if needed (0018/0019/0020 may exist by merge time), then:
npx wrangler d1 execute wiser --remote --file <ext>/06-gather-phase1/0021_sessions.sql --yes
# 2. append the 5 specs in mcp-tools.json to AGENT_TOOLS (mcp/src/agents.mjs)
#    or LEGACY_TOOLS (mcp/src/core.mjs) + implement resolvers per notes
```

## Before deploy
- Trust/rights (GATHER-SPEC): teacher consent for recording, no recording
  of private sits, Dharma Seed-style licences respected, safeguarding
  policy before open rooms. `recording_policy` defaults `opt-in`.
- `join_url` gating (reminder window only) is a privacy rule, not just
  UX — keep it server-side.
- ICS lands in `add_to_calendar` output; the per-user ICS feed + push
  fan-out are runtime work (step 16), not this pack.
- After merge, ROADMAP step 16 unblocks: wrap Zoom/Meet/Jitsi links per
  session, T-10/T-1 reminders, one-tap join.
