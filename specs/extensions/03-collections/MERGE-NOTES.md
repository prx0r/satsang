# MERGE-NOTES — 03-collections (for the lead agent)

## Merge steps
```bash
cd <satsang>
python3 - <<'PY'
import json
spec = json.load(open('app/wisegraph/collections.json'))
add = json.load(open('<ext>/03-collections/collections-additions.json'))['collections']
have = {c['id'] for c in spec['collections']}
spec['collections'].extend([c for c in add if c['id'] not in have])
json.dump(spec, open('app/wisegraph/collections.json', 'w'), ensure_ascii=False, indent=1)
PY
python3 app/tools/build-collections.py   # expect no 'unresolved' for the new id
npm run build --prefix app && sh app/deploy.sh
```

## Integrator option (preferred)
Canonical holds a `rebirth-across-traditions` stub (0 units). Fold this
pack's 5 units into that id instead of adding `rebirth-read-and-practise`
(a stub + a twin is the old mass-duplication smell). Either way, one
rebirth set survives — never both.

## Before deploy
- `build-collections.py` prints `unresolved: (<id>, ...)` for any select
  or practice that fails to resolve. Both collections were authored with
  broad selects + verified practice slugs, but clip drift since 2026-10-20
  can orphan a select — if one fails, widen the select, never invent a ref.
- `powa` practice intentionally NOT referenced (orientation-only); the
  rebirth set keeps death practices to the gentle ones.
- With these two, ROADMAP step 12's first three collections are complete:
  `seven-days-with-death` + `rebirth-read-and-practise` + `metta-in-four-traditions`.
