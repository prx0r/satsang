# 06 — Gather phase 1: sessions storage + agent tools

**Why:** GATHER-SPEC.md is spec-only ("NOT building yet"); ROADMAP step 16
is "Gather phase 1". This pack is the storage + tool-contract half:
D1 tables + MCP tool specs in the exact `core.mjs` TOOLS shape. Wrapping
existing tools (Zoom/Meet/Jitsi links) and the ICS feed are lead-agent
runtime work; nothing here assumes a provider.

**Files:**
- `0021_sessions.sql` — draft D1 migration (sessions, rsvps, reminders,
  practice_plans; style follows `0015_places.sql`)
- `mcp-tools.json` — 5 tool specs (`list_sessions`, `my_schedule`,
  `add_to_calendar`, `join_url`, `prep_for`) with inputSchema + resolver
  notes mapping each field to tables/records that already exist

**Merge:** apply migration; append tool specs to `mcp/src/agents.mjs`
(or `core.mjs` AGENT_TOOLS — integrator picks the file, shapes match).
Details in MERGE-NOTES.md.
