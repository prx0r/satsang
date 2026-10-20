# MERGE-NOTES — 43-trika-prep (for the lead agent)

## Merge steps

```bash
cd <satsang>
# 1. group in (REPORT.md gates the group — merger skips dirs without one)
cp -r <ext>/43-trika-prep/sources/trika-prep sources/
python3 app/tools/merge-sources.py
# 2. visual spec -> visuals dir (no consumer yet; ROADMAP-15 wires the timer)
mkdir -p app/wisegraph/visuals
cp <ext>/43-trika-prep/visuals/gap-rest.json app/wisegraph/visuals/
# 3. journey -> collections (dedupe by id)
python3 - <<'PY'
import json
c = json.load(open('app/wisegraph/collections.json'))
add = json.load(open('<ext>/43-trika-prep/collection-addition.json'))['collections']
have = {x['id'] for x in c['collections']}
c['collections'].extend([x for x in add if x['id'] not in have])
json.dump(c, open('app/wisegraph/collections.json', 'w'), ensure_ascii=False, indent=1)
PY
# 4. rebuild: build-hubs.py -> build-collections.py (expect zero unresolved:
#    journey is practice-only + reflect) -> validate.py -> check_pack
python3 app/tools/build-hubs.py
python3 app/tools/build-collections.py
python3 specs/schema/validate.py
python3 <ext>/11-site-runtime/check_pack.py --repo . --pack <ext>/43-trika-prep
```

## Before deploy

- New practice must NOT trip the NEEDS regex (no kundalini/retention/empowerment
  language) — confirm `needsTeacher: false` and steps generated in the built
  `site/data/wisegraph/collections.json`.
- `vbt-breath-pause` and `recognition-contemplation` must still resolve (pre-existing
  deep-tantra rows, reused by id here, not redefined).
- Timer shows the breath caution above step 1 (ENERGY rule) — confirm client
  behaviour per 04-MERGE-NOTES.
