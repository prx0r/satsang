# MERGE-NOTES — 13-atlas-population (for the lead agent)

## Merge steps
```bash
cd <satsang>
# 1. regenerate (paths must match the merge-time tree):
python3 <ext>/13-atlas-population/populate_places.py \
  --repo . --ext <ext> --out /tmp/atlas-pop
# 2. review backlog first: lane gaps need lane proposals, missing persons
#    need atlas person nodes (fuzzy time + provenance + Wikidata check).
# 3. append nodes/edges to atlas/merged/ (keep _meta counts honest) AND to
#    atlas/nodes.json + edges.json? NO — backbone vs merged: these are
#    wisegraph-derived, so merged/ only (v1_only pattern, legacy.table=places).
#    The backbone seed.py stays hand-curated.
# 4. rebuild proto blob (data-merged.js) + run atlas validate.py --merged +
#    headless shots; deploy with the next app build.
```

## Before deploy
- `geo` needs the schema patch (REPORT) or a strip decision — do not ship
  nodes that fail `atlas/schema` validation either way.
- Re-run the traceback after every places merge; orphans must shrink
  monotonically — a merge that grows the teacherless count is a red flag.
- Lane proposals (triratna, sikh, modern-hindu-folk…) belong in
  `streams.json` + DESIGN review, not in this builder's overrides.
