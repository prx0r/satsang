# MERGE-NOTES — 10-golden-path (for the lead agent)

## Merge steps
```bash
cd <satsang>
# 0. merge 08 FIRST (abhayagiri place row must exist for the teaches_at edge)
# 1. edges: append edges-teacher-at.json edges to the places additions merge
#    (same target_kind: place shape). Re-check the 2 medium-conf posts first.
# 2. practice-links.json -> propose home app/wisegraph/practice-links.json,
#    wire per build-notes.md (normaliser + search + get_teacher methods[] +
#    list_practices teacher filter + validate.py schema additions)
# 3. guide_me spec -> AGENT_TOOLS; resolvers per mcp-tool.json
# 4. schema proposals (practice.status; unit.requires[] / unit state):
#    integrator decision — document in DATA-MODEL, do not half-add
# 5. rebuild all; validate.py green; deploy
```

## Before deploy
- 2 teaches_at edges are medium-confidence (posts change): verify against
  the official sites at merge time, downgrade or drop.
- 2 practice links carry `check:true` (Muller-Ortega, Green): verify lineage
  authorisation / attribution before serving.
- Initiated-practice rule holds end to end: `needsTeacher` practices show
  orientation + cautions + teacher contact, never full instructions.
  `guide_me` output for a figure/text (no living teacher) is the study
  path, never a contact hunt — no personal addresses, ever.
- GOLDEN-PATH.md is the vision page: keep it current as links land
  (update the coverage table in the same commit that changes reality).
