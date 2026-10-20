# MERGE-NOTES — 45-vbt-practices (for the lead agent)

## Merge steps

```bash
cd <satsang>
# 1. group in (REPORT.md gates the group)
cp -r <ext>/45-vbt-practices/sources/vbt-practices sources/
python3 app/tools/merge-sources.py
# 2. collection -> collections (dedupe by id)
python3 - <<'PY'
import json
c = json.load(open('app/wisegraph/collections.json'))
add = json.load(open('<ext>/45-vbt-practices/collection-addition.json'))['collections']
have = {x['id'] for x in c['collections']}
c['collections'].extend([x for x in add if x['id'] not in have])
json.dump(c, open('app/wisegraph/collections.json', 'w'), ensure_ascii=False, indent=1)
PY
# 3. rebuild: build-hubs -> build-collections (expect zero unresolved) -> validate -> check_pack
python3 app/tools/build-hubs.py
python3 app/tools/build-collections.py
python3 specs/schema/validate.py
python3 <ext>/11-site-runtime/check_pack.py --repo . --pack <ext>/45-vbt-practices
```

## Before deploy

- New practice names must NOT trip the NEEDS regex — confirm all six
  build with `needsTeacher: false`.
- `vbt-breath-pause` must still resolve (pre-existing deep-tantra row,
  reused by id in the collection, not redefined).
- Timer shows the breath caution above step 1 for sound-dissolution and
  body-as-consciousness (ENERGY rule) — confirm client behaviour.
- The collection is practice-only + reflect items, so build-collections
  must emit zero unresolved refs.
