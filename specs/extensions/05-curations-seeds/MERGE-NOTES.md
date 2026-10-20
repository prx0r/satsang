# MERGE-NOTES — 05-curations-seeds (for the lead agent)

## Merge steps
```bash
cd <satsang>
# 1. migration (ROADMAP numbers this 0019; this draft is 0020 to avoid
#    colliding with 0018_topic_review / 0019 in flight — renumber on merge)
npx wrangler d1 execute wiser --remote --file <ext>/05-curations-seeds/0020_curations.sql --yes
# 2. seeds validate against specs/schema/curation.json:
python3 - <<'PY'
import json
seeds = json.load(open('<ext>/05-curations-seeds/seeds.json'))['records']
for r in seeds:
    assert r['form'] in ('curation', 'essay') and r['visibility'] == 'public'
    if 'collection' in r:
        c = r['collection']
        assert all(k in c for k in ('id', 'type', 'kind', 'title', 'units'))
        for u in c['units']:
            for it in u['items']:
                assert it['ref']['id'].split('/')[0] in ('person','tradition','clip','text','practice','topic','collection','place','event','edge','curation','essay','user')
print('seeds shape-ok:', len(seeds))
PY
# 3. import via the step-14 endpoints when built (/c/<handle>/<slug> pages);
#    until then the seeds double as API contract fixtures
```

## Before deploy
- Decide the migration number with the integrator (0018/0019 may already
  exist by merge time).
- Seeds are `moderation.state: ok` + author `user/wiser` so the first
  public `/c/` pages exist on day one; the report flow (`wg_reports`)
  is exercised by having something to report.
- `/u/wiser` public profile stays OFF by default per NORTHSTAR (seeds
  render without a public author page until the profile ships).
