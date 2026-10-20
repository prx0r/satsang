# MERGE-NOTES — 02-scholars-academic (for the lead agent)

## What this is
19 works attached to 16 scholars + 4 academic-supervisor edges +
2 openpatala crosswalk targets. All person ids verified present in
`wise.json` (2026-10-20).

## Merge steps
```bash
cd <satsang>
# 1. works: hand-merge (merge-sources.py does not read works yet)
python3 - <<'PY'
import json
w = json.load(open('app/wisegraph/people.json'))
att = json.load(open('<ext>/02-scholars-academic/works-attach.json'))['attach']
for a in att:
    p = w['people'][a['person']]
    have = {x['id'] for x in p.get('works', [])}
    for x in a['works']:
        x = {k: v for k, v in x.items() if k != 'check'}
        if x['id'] not in have: p.setdefault('works', []).append(x)
json.dump(w, open('app/wisegraph/people.json', 'w'), ensure_ascii=False, indent=1)
PY
# 2. verify every check:true work (7) against publisher/WorldCat first
# 3. edges: append edges-academic.json edges to the next additions merge
# 4. crosswalk: verify URLs, then merge rows into atlas/crosswalk-openpatala.json
# 5. rebuild: build-wise.py -> portraits unaffected -> deploy
```

## Before deploy
- 7 works carry `check:true` (medium-confidence memory of title/year).
  Verify, correct or drop each. The other 12 are high-confidence.
- `get_lineage` with `lineage: academic` now walks supervisor chains
  (Sanderson-era graph + these 4 edges) — no code change needed; the
  MCP tool already accepts the `academic` enum.
