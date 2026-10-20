# MERGE-NOTES — 08-places-networks (for the lead agent)

## Merge steps
```bash
cd <satsang>
# 1. places: append rows (dedupe by id) to the places source the merger reads
python3 - <<'PY'
import json
p = json.load(open('sources/places-uk/places.json'))
add = json.load(open('<ext>/08-places-networks/places-networks.json'))['places']
have = {x['id'] for x in p['places']}
p['places'].extend([x for x in add if x['id'] not in have])
json.dump(p, open('sources/places-uk/places.json', 'w'), ensure_ascii=False, indent=1)
PY
# 2. edges: append edges-networks.json edges to sources/places-uk/edges-additions.json
# 3. python3 app/tools/place-contacts.py   # fills the 3 URL-less rows + contact details
# 4. merge-sources.py -> portraits (no new people) -> build-wise.py -> deploy + D1 seed
```

## Before deploy
- 3 rows have no URL (WAF-blocked at check time). If `place-contacts.py`
  cannot verify them either, they ship list-only (dashed card per BRIEF)
  — never with a guessed link.
- Coordinates are approximate: run the Wikidata P625 pass before the map
  goes public with these rows.
- `sister_of` threads now connect 6 Ajahn Chah houses + 3 Vedanta houses:
  check the `#place` "Nearby in the same family" panel renders them.
