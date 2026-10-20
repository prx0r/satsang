# MERGE-NOTES — 14-lineage-clusters (for the lead agent)

## Merge steps
```bash
cd <satsang>
# 1. living flags (verify the 13 names, then hand-merge):
python3 - <<'PY'
import json
w = json.load(open('app/wisegraph/people.json'))
fix = json.load(open('<ext>/14-lineage-clusters/fixes/living-flags.json'))['set_living_true']
for pid in fix:
    assert pid in w['people'], pid
    w['people'][pid]['living'] = True
json.dump(w, open('app/wisegraph/people.json', 'w'), ensure_ascii=False, indent=1)
PY
# 2. cluster builder: cp cluster.py app/tools/validate/ (with 11).
#    Regenerate per tradition as the graph grows; orphans must shrink.
# 3. inception docs are vision pages: keep beside GOLDEN-PATH.md (10),
#    update the chain in the same commit that changes it.
# 4. rebuild (people.json changed): build-wise.py -> portraits unaffected -> deploy.
```

## Before deploy
- The 13 living flags are high-confidence public facts, but a flag flip
  changes lineage walks, search tiering and the golden path — spot-check
  each name against a current bio before merging.
- Orphan edges (Odier/Baret/Kufayev studentships, Flood/Biernacki
  supervisors) are NOT authored here: somebody's students is not a
  somebody. They stay backlog until sourced.
- Next clusters in P0 order: kagyu (Samye Ling chain is already clean),
  insight (Titmuss/Feldman/Batchelor + Mahasi roots), soto-zen.
  Same builder, same inception-doc pattern.
