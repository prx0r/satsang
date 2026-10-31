# Satsang keeper fixes: apply the reviewed corrections in tools/source_maps.py (KEEPER_*) to wisegraph/*.json.
# Idempotent; tools/merge-sources.py runs it last so a re-merge keeps the fixes. Also writes web-worker/redirects.json
# (/place/<old id> -> /place/<kept id>) for merged duplicates.
# usage: python3 tools/apply-keeper-fixes.py
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from source_maps import KEEPER_VERIFIED as V, KEEPER_PEOPLE, KEEPER_EDGES, KEEPER_PLACES, KEEPER_PLACE_MERGE, KEEPER_URL_BAN, KEEPER_ALIAS_REDIRECTS, KEEPER_URL_FIX
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda p: json.load(open(os.path.join(ROOT, p)))
def W(p, d): f = os.path.join(ROOT, p); json.dump(d, open(f, 'w'), ensure_ascii=False, indent=1); open(f, 'a').write('\n')
log = {}
def n(k): log[k] = log.get(k, 0) + 1

# people
PD = J('wisegraph/people.json'); BY = {p['id']: p for p in PD['people']}
for pid, fix in KEEPER_PEOPLE.items():
    p = BY.get(pid)
    if not p: log.setdefault('missing', []).append('person/' + pid); continue
    for k, v in fix.items():
        if k == 'links': p['links'] = {**(p.get('links') or {}), **v}
        else: p[k] = v
    p['verified_on'] = fix.get('verified_on', V); n('people')
W('wisegraph/people.json', PD)

# edges
ED = J('wisegraph/edges.json')
for fx in KEEPER_EDGES:
    a, b = fx['match']; hit = [e for e in ED['edges'] if e['from'] == a and e['to'] == b]
    if not hit: log.setdefault('missing', []).append(f'edge/{a}->{b}'); continue
    for e in hit: e.update(fx['set']); e['checked'] = fx['set'].get('checked', V); n('edges')
# one edge per (from, to, type): a type change can create a duplicate
seen, keep = set(), []
for e in ED['edges']:
    k = (e['from'], e['to'], e['type'])
    if k in seen: n('edges_deduped'); continue
    seen.add(k); keep.append(e)
ED['edges'] = keep
W('wisegraph/edges.json', ED)

# places
PL = J('wisegraph/places.json'); P = {p['id']: p for p in PL['places']}
for pid, fix in KEEPER_PLACES.items():
    p = P.get(pid)
    if not p: log.setdefault('missing', []).append('place/' + pid); continue
    p.update(fix)
    if 'url' in fix or 'source_url' in fix: p['url_checked'] = p['verified_on'] = fix.get('verified_on', V)
    n('places')
redirects = {}
for old, new in KEEPER_PLACE_MERGE.items():
    if new not in P: log.setdefault('missing', []).append('place/' + new); continue
    if old in P:
        o, k = P[old], P[new]
        for f in ('url', 'schedule_url', 'lat', 'lng', 'founded', 'description'):  # keep the better-sourced record; fill only its gaps
            if k.get(f) in (None, '') and o.get(f) not in (None, ''): k[f] = o[f]
        k['aliases'] = sorted(set((k.get('aliases') or []) + [old]))
        k['verified_on'] = V; k['source_url'] = k.get('schedule_url') or k.get('url')
        PL['places'] = [p for p in PL['places'] if p['id'] != old]; del P[old]
        for p in PL['places']:  # sister links
            if p.get('sisters'): p['sisters'] = [([new] + list(s[1:]) if isinstance(s, list) and s[0] == old else s) for s in p['sisters']]
        n('places_merged')
    redirects[f'/place/{old}'] = f'/place/{new}'
for p in PL['places']:
    for f in ('url', 'schedule_url'):
        u = p.get(f) or ''
        for bad, good in KEEPER_URL_BAN.items():
            if bad in u:
                if good: p[f] = good
                else: p.pop(f, None)
                p['verified_on'] = V; n('urls_banned')
if any(p['id'] in KEEPER_PLACE_MERGE for p in PL['places']): raise SystemExit('merge failed')
for c in PL.get('countries') or []:  # recount after merges
    ps = [p for p in PL['places'] if p['country'] == c.get('code')]
    if 'places' in c: c['places'] = len(ps)
    if 'goenka' in c: c['goenka'] = sum(1 for p in ps if p.get('goenka'))
    if isinstance(c.get('traditions'), dict) and KEEPER_PLACE_MERGE:
        t = {}
        for p in ps:
            for x in p.get('traditions') or []: t[x] = t.get(x, 0) + 1
        if sum(t.values()) <= sum(c['traditions'].values()): c['traditions'] = dict(sorted(t.items(), key=lambda kv: -kv[1]))
W('wisegraph/places.json', PL)

# place contacts: drop merged ids
CP = J('wisegraph/place-contacts.json')
for old in KEEPER_PLACE_MERGE:
    if old in CP['places']: del CP['places'][old]; n('contacts_dropped')
W('wisegraph/place-contacts.json', CP)

# pack ids deduped onto existing records at staging (wisegraph/ext-idmap.json) and hand aliases keep their slugs: 301 to the kept id
PEOPLE_IDS = {x['id'] for x in J('wisegraph/people.json')['people']}
IM = J('wisegraph/ext-idmap.json') if os.path.exists(os.path.join(ROOT, 'wisegraph/ext-idmap.json')) else {}
ALIAS = {'people': dict(IM.get('people') or {}), 'places': dict(IM.get('places') or {})}
for kind, m in KEEPER_ALIAS_REDIRECTS.items(): ALIAS.setdefault(kind, {}).update(m)
for kind, route, ids in (('people', 'person', PEOPLE_IDS), ('places', 'place', set(P))):
    for old, new in sorted(ALIAS.get(kind, {}).items()):
        if old != new and new in ids and old not in ids: redirects.setdefault(f'/{route}/{old}', f'/{route}/{new}')
json.dump(redirects, open(os.path.join(ROOT, 'web-worker/redirects.json'), 'w'), indent=1, sort_keys=True)
# exact cited URLs that the keeper linkrot pass found dead or moved (source_maps.KEEPER_URL_FIX): replace everywhere in wisegraph
# (None drops a dict field or a list item). Matches with or without the trailing slash. Re-run after tools/place-contacts.py.
_FIX = {}
for a, b in KEEPER_URL_FIX.items(): _FIX[a] = b; _FIX[a.rstrip('/')] = b; _FIX[a.rstrip('/') + '/'] = b
def _walk(x):
    if isinstance(x, dict):
        for k in list(x):
            v = x[k]
            if isinstance(v, str) and v in _FIX:
                if _FIX[v] is None: x.pop(k); n('urls_fixed_dropped')
                else: x[k] = _FIX[v]; n('urls_fixed')
            else: _walk(v)
    elif isinstance(x, list):
        for i in range(len(x) - 1, -1, -1):
            v = x[i]
            if isinstance(v, str) and v in _FIX:
                if _FIX[v] is None:
                    if all(isinstance(y, str) for y in x): x.pop(i); n('urls_fixed_dropped')
                else: x[i] = _FIX[v]; n('urls_fixed')
            else: _walk(v)
for f in ('people.json', 'edges.json', 'places.json', 'place-contacts.json', 'place-contacts-curated.json', 'traditions.json'):
    if os.path.exists(os.path.join(ROOT, 'wisegraph', f)):
        d = J('wisegraph/' + f); before = json.dumps(d, sort_keys=True); _walk(d)
        if json.dumps(d, sort_keys=True) != before: W('wisegraph/' + f, d)
print(json.dumps(log, ensure_ascii=False))
