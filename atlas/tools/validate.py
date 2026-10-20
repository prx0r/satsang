"""Validate atlas/nodes.json, edges.json, streams.json.
Hard errors (exit 1): duplicate ids, edges to unknown nodes, orphan nodes, unparsable dates, edges without provenance,
unknown kinds/types/confidence, start after end, scholar works without year, unknown streams.
Warnings: provenance not machine-checked, Wikidata date disagreements are reported by tools/review_wd.py."""
import json, os, sys, collections
HERE = os.path.dirname(os.path.abspath(__file__)); A = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import fuzzydate
S = json.load(open(f'{A}/schema/atlas.schema.json'))
NK = set(S['$defs']['node']['properties']['kind']['enum'])
ET = set(S['$defs']['edge']['properties']['type']['enum'])
CONF = {"high", "medium", "low"}
D = A + '/merged' if '--merged' in sys.argv else A
nodes = json.load(open(f'{D}/nodes.json'))['nodes']
edges = json.load(open(f'{D}/edges.json'))['edges']
streams = json.load(open(f'{D}/streams.json'))
lanes = {l['id'] for l in streams['lanes']}
err, warn = [], []
ids = collections.Counter(n['id'] for n in nodes)
err += [f"duplicate node id {k}" for k, v in ids.items() if v > 1]
eids = collections.Counter(e['id'] for e in edges)
err += [f"duplicate edge id {k}" for k, v in eids.items() if v > 1]
N = {n['id']: n for n in nodes}
deg = collections.Counter()
def chk_time(t, where):
    if t is None: return
    if t.get('dsl'):
        try:
            p = fuzzydate.parse(t['dsl'])
            if (p['start'], p['end']) != (t['start'], t['end']): err.append(f"{where}: time does not match its dsl")
        except Exception as ex:
            err.append(f"{where}: date does not parse ({t.get('dsl')}): {ex}")
    if t.get('start') is not None and t.get('end') is not None and t['start'] > t['end']:
        err.append(f"{where}: start after end")
    if t.get('confidence') not in CONF: err.append(f"{where}: bad time confidence")
    if t.get('basis') not in ('historical', 'traditional', 'scholarly'): err.append(f"{where}: bad basis")
for n in nodes:
    w = f"node {n['id']}"
    if n['kind'] not in NK: err.append(f"{w}: unknown kind {n['kind']}")
    if n.get('stream') and n['stream'] not in lanes: err.append(f"{w}: unknown stream {n['stream']}")
    for s in n.get('streams', []):
        if s not in lanes: err.append(f"{w}: unknown stream {s}")
    if n['kind'] not in ('concept', 'deity', 'place') and not n.get('time'): (warn if n.get('v1_only') else err).append(f"{w}: dated kind without time")
    if not n.get('stream') and n['kind'] != 'concept': (warn if n.get('v1_only') else err).append(f"{w}: no stream")
    chk_time(n.get('time'), w)
    for t in n.get('time_alt', []): chk_time(t, w + ' (alt)')
    if n.get('place') and n['place'] not in N: err.append(f"{w}: unknown place {n['place']}")
    if n['kind'] == 'scholar':
        for wk in n.get('works', []):
            if not isinstance(wk.get('year'), int): err.append(f"{w}: work without year: {wk.get('title')}")
            for t in wk.get('treats', []):
                if t not in N: err.append(f"{w}: work treats unknown node {t}")
    if not n.get('ids', {}).get('wikidata'): warn.append(f"{w}: no Wikidata id")
for e in edges:
    w = f"edge {e['id']} {e['from']} -{e['type']}-> {e['to']}"
    for k in ('from', 'to'):
        if e[k] not in N: err.append(f"{w}: unknown {k}")
    if e['from'] == e['to']: err.append(f"{w}: self loop")
    if e['type'] not in ET: err.append(f"{w}: unknown type")
    if e['conf'] not in CONF: err.append(f"{w}: bad conf")
    if not e.get('provenance'): err.append(f"{w}: no provenance")
    else:
        for p in e['provenance']:
            if not (p.get('cite') or p.get('url')): err.append(f"{w}: empty provenance entry")
        last = e['provenance'][-1]['check']
        if last in ('unverified', 'needs_source'): warn.append(f"{w}: provenance {last}")
    if e['type'] in ('teacher_of', 'initiated') and not e.get('lineage'): warn.append(f"{w}: transmission without lineage name")
    chk_time(e.get('time'), w)
    deg[e['from']] += 1; deg[e['to']] += 1
for n in nodes:
    if not deg[n['id']] and n['kind'] != 'place':
        (warn if n.get('v1_only') else err).append(f"orphan node {n['id']} ({n['kind']})")
warn += [f"place {n['id']} has no edges (linked only via node.place)" for n in nodes if not deg[n['id']] and n['kind'] == 'place' and not any(m.get('place') == n['id'] for m in nodes)]
# a place referenced via node.place counts as linked
print(f"nodes {len(nodes)}  edges {len(edges)}  lanes {len(lanes)}")
print(f"errors {len(err)}  warnings {len(warn)}")
for x in err: print("ERROR", x)
if '-v' in sys.argv:
    for x in warn: print("warn ", x)
else:
    print(collections.Counter(x.split(': ')[-1].split(' ')[0] if 'provenance' not in x else 'provenance ' + x.split('provenance ')[-1] for x in warn).most_common(8))
sys.exit(1 if err else 0)
