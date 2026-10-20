# MERGE-NOTES — 04-practice-visuals (for the lead agent)

## Merge steps
```bash
cd <satsang>
# 1. practice -> existing group file (dedupe by id)
python3 - <<'PY'
import json
p = json.load(open('sources/deep-western/practices.json'))
add = json.load(open('<ext>/04-practice-visuals/practices-additions.json'))['practices']
have = {x['id'] for x in p['practices']}
p['practices'].extend([x for x in add if x['id'] not in have])
json.dump(p, open('sources/deep-western/practices.json', 'w'), ensure_ascii=False, indent=1)
PY
# 2. visual spec -> NEW dir (no consumer yet; ROADMAP-15 wires the timer)
mkdir -p app/wisegraph/visuals
cp <ext>/04-practice-visuals/visuals/middle-pillar.json app/wisegraph/visuals/
# 3. cycle -> collections (same snippet as 03-MERGE-NOTES)
# 4. rebuild: build-hubs.py -> build-collections.py (expect zero unresolved) -> build -> deploy
```

## Before deploy
- Verify the Wikipedia Middle Pillar URL (flagged in file). If wrong,
  replace with the Regardie book page or drop the link (keep the text citation).
- `needsTeacher: true` means the timer shows the orientation-only caution
  above step 1 (ROADMAP step 9 behaviour) — confirm the client does this
  for build-generated practices too, not just hub ones.
- Visual grammar keys (`appear`, `pulse`, `circulate`, sphere/square/loop,
  breath envelope) follow `atlas/DESIGN.md` §1 operators/primitives.
  `circulate` is new (a looped pulse along a channel) — add it to the
  operator registry when the timer consumer lands.
