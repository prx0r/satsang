#!/usr/bin/env python3
"""Series live inside topics (2026-10-25, specs/SERIES-FORMULA.md step 10): every talk in a series is tagged with the series'
topic (and that topic's root, as build-clips.py does for leaves), so it also appears in the topic's own talk lists.
Reads wisegraph/collections.json (kind mini-course = a Series; its `topic`, plus `topics` when `tagAll` is set) and patches
clips.json, clips.site.json and site/clips.json in place. The confidence list (clip.tags.topics) gets [topic, 1.0, 'series'].
Idempotent. Never writes the D1 seed (wisegraph/seed.sql) - the site, the MCP bundle and the chat catalog read clips.json.
Runs at the end of tools/build-clips.py; run by hand after tools/mini_courses_src.py:  python3 tools/tag-series.py
"""
import json, os, sys
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda p: json.load(open(os.path.join(APP, p)))
spec = J('wisegraph/collections.json')
want = {}  # clip id -> set(topics)
for c in spec.get('collections', []):
    if c.get('kind') != 'mini-course' or not c.get('topic'): continue
    tps = [c['topic']] + (c.get('topics', []) if c.get('tagAll') else [])
    tps = sorted({t for x in tps for t in ([x, x.split('/')[0]] if '/' in x else [x])})
    for u in c.get('units', []):
        for it in u.get('items', []):
            if str(it.get('ref', '')).startswith('clip:'): want.setdefault(it['ref'][5:], set()).update(tps)

def patch(rows):
    n = 0
    for r in rows:
        add = want.get(r.get('id'), set()) - set(r.get('topics') or [])
        if not add: continue
        r['topics'] = sorted(set(r.get('topics') or []) | add); n += 1
        tg = r.get('tags')
        if isinstance(tg, dict) and isinstance(tg.get('topics'), list):
            have = {t[0] for t in tg['topics'] if isinstance(t, list) and t}
            tg['topics'] += [[t, 1.0, 'series'] for t in sorted(add - have)]
    return n

out = {}
for f, kw in (('clips.json', {'ensure_ascii': False, 'indent': 0}), ('clips.site.json', {'ensure_ascii': False, 'separators': (',', ':')}), ('site/clips.json', {'ensure_ascii': False, 'separators': (',', ':')})):
    p = os.path.join(APP, f)
    if not os.path.exists(p): continue
    rows = json.load(open(p)); n = patch(rows)
    if n: json.dump(rows, open(p, 'w'), **kw)
    out[f] = n
missing = [cid for cid in want if cid not in {r['id'] for r in J('clips.json')}]
print('series topic tags:', json.dumps(out), f'({len(want)} series talks)', ('MISSING ' + ', '.join(missing)) if missing else '')
sys.exit(1 if missing else 0)
