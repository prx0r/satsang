# MERGE-NOTES — 09-texts-freebooks (for the lead agent)

## Merge steps
```bash
cd <satsang>
cp -r <ext>/09-texts-freebooks/sources/texts-freebooks sources/
# extend the merger to read texts.json (ROADMAP step 0 already requires
# reading practices.json/texts.json/schools.json/lineages.json from deep
# groups — texts-freebooks rides the same extension)
python3 app/tools/merge-sources.py
# texts -> Text records (text.json: required id/type/title only) ->
#   build-wise.py -> MCP get_resources serves them -> deploy
```

## Before deploy
- Re-check all 7 links (publishers move pages; the REPORT table is dated
  2026-10-20).
- `get_resources` in `mcp/src/agents.mjs` should surface the two
  syllabus-priority books (Sivananda, Vivekananda) with their place +
  collection links — that join is the endgame loop in miniature.
- Licence discipline holds: linked, credited, never rehosted.
