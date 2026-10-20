"""Migration: project the live wisegraph v1 (app/wisegraph/people.json, traditions.json, edges.json) into atlas v2 and
merge it with the backbone. Read-only on app/. Writes atlas/merged/{nodes,edges}.json and proto/data-merged.js.

  v1 people      -> v2 person (kind speaker|figure) / text (kind text); stream from TRAD2LANE[tradition]
  v1 traditions  -> v2 school (school) / lineage (lineage); v1 families become streams.json lane groups (not nodes)
  v1 edges       -> teacher_of / influenced kept; lineage_of -> founded. Provenance: "wisegraph v1 (curated)".
Backbone values win on conflict (dates, labels, Wikidata ids); v1 adds people and edges the backbone lacks."""
import json, os, re, sys, collections
HERE = os.path.dirname(os.path.abspath(__file__)); A = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import fuzzydate
APP = os.path.join(A, '../app/wisegraph')
people = json.load(open(f'{APP}/people.json'))['people']
trads = {t['id']: t for t in json.load(open(f'{APP}/traditions.json'))['nodes']}
v1e = json.load(open(f'{APP}/edges.json'))['edges']
nodes = json.load(open(f'{A}/nodes.json'))['nodes']
edges = json.load(open(f'{A}/edges.json'))['edges']
NB = {n['id']: n for n in nodes}

TRAD2LANE = {
  'buddhism': 'early-buddhist', 'early-suttas': 'theravada', 'theravada': 'theravada', 'thai-forest': 'theravada', 'insight': 'theravada',
  'burmese': 'theravada', 'goenka-vipassana': 'theravada', 'mahayana': 'mahayana', 'zen': 'chan-zen', 'soto-zen': 'chan-zen',
  'rinzai-zen': 'chan-zen', 'plum-village': 'chan-zen', 'vajrayana': 'vajrayana', 'tibetan': 'vajrayana', 'gelug': 'vajrayana',
  'nyingma': 'vajrayana', 'hindu': 'vedanta', 'vedanta': 'vedanta', 'advaita': 'vedanta', 'inchegeri': 'vedanta',
  'ramakrishna-order': 'vedanta', 'arsha-vidya': 'vedanta', 'divine-life-society': 'yoga', 'anandamayi-sangha': 'vedanta',
  'kashmir-shaivism': 'trika', 'kriya-yoga': 'yoga', 'siddha-yoga': 'yoga', 'christian': 'christian-mystic',
  'christian-mysticism': 'christian-mystic', 'gnosticism': 'christian-mystic', 'platonic': 'greek', 'neoplatonism': 'neoplatonic',
  'renaissance-platonism': 'hermetic', 'esoteric': 'modern-esoteric', 'theosophy': 'modern-esoteric', 'anthroposophy': 'modern-esoteric',
  'fourth-way': 'modern-esoteric', 'independent': 'modern-nondual', 'modern-nondual': 'modern-nondual', 'krishnamurti': 'modern-nondual',
  'direct-path': 'modern-nondual',
}

def v1_years(s):
    """'1918–1992' 'b. 1960' '1951–' 'c. 950–1016' 'd. 1310' 'c. 5th century BCE' '14th century (revealed)' -> DSL or None"""
    if not s: return None
    s = s.replace('—', '–').replace('-', '–').strip()
    bce = 'BCE' in s or 'BC' in s
    m = re.match(r'^(c\.\s*)?(\d{1,4})\s*–\s*(c\.\s*)?(\d{1,4})\s*(BCE)?', s)
    if m:
        a, b = int(m.group(2)), int(m.group(4))
        if bce: a, b = -a, -b
        return ('c' if m.group(1) or m.group(3) else '') + f'{a}..{b}'
    m = re.match(r'^(?:b\.\s*)?(\d{4})\s*–?\s*$', s)
    if m: return f'{m.group(1)}..'
    m = re.match(r'^d\.\s*(\d{3,4})', s)
    if m: return f'?..{m.group(1)}'
    m = re.search(r'(\d{1,2})(?:st|nd|rd|th)\s*(?:–\s*(?:early\s*)?(\d{1,2})(?:st|nd|rd|th)\s*)?c', s)
    if m:
        a = int(m.group(1)); b = int(m.group(2)) if m.group(2) else None
        if bce: a = -a; b = -b if b else None
        return f'C{a}' + (f'..C{b}' if b else '') + '?'
    m = re.search(r'c\.\s*(\d{1,4})\s*(BCE)?', s)
    if m: return f'c{-int(m.group(1)) if m.group(2) else int(m.group(1))}'
    m = re.search(r'(\d{4})', s)
    if m: return f'c{m.group(1)}?'
    return None

out_nodes = {n['id']: n for n in nodes}
added = collections.Counter(); undated = []
for t in trads.values():
    if t['id'] in out_nodes or t['kind'] == 'family':
        continue
    lane = TRAD2LANE.get(t['id']) or TRAD2LANE.get(t.get('parent'))
    out_nodes[t['id']] = {"id": t['id'], "kind": "school" if t['kind'] == 'school' else "lineage", "label": t['label'], "stream": lane,
                          "streams": [lane] if lane else [], "time": None, "time_alt": [], "ids": {"wikidata": t['wikidata']} if t.get('wikidata') else {},
                          "tradition": t['id'], "legacy": {"table": "traditions", "id": t['id'], "kind": t['kind']}, "v1_only": True}
    added['tradition'] += 1
for p in people:
    if p['id'] in out_nodes:
        out_nodes[p['id']].setdefault('legacy', {"table": "people", "id": p['id'], "kind": p['kind']})
        continue
    lane = TRAD2LANE.get(p['tradition'])
    dsl = v1_years(p.get('years'))
    try: tm = fuzzydate.parse(dsl) if dsl else None
    except Exception: tm = None
    if not tm: undated.append(p['id'])
    out_nodes[p['id']] = {"id": p['id'], "kind": "text" if p['kind'] == 'text' else "person", "label": p['name'], "stream": lane,
                          "streams": [lane] if lane else [], "time": tm, "time_alt": [], "ids": {"wikidata": p['wikidata']} if p.get('wikidata') else {},
                          "tradition": p['tradition'], "legacy": {"table": "people", "id": p['id'], "kind": p['kind']}, "v1_only": True}
    added['person'] += 1
# school/lineage nodes from v1 have no dates: take the earliest member's start (derived, low confidence)
members = collections.defaultdict(list)
for n in out_nodes.values():
    if n.get('tradition') and n.get('time') and n['time'].get('start') is not None and n['kind'] in ('person', 'text'):
        members[n['tradition']].append(n['time']['start'])
for n in out_nodes.values():
    if n.get('v1_only') and n['kind'] in ('school', 'lineage') and members.get(n['id']):
        s = min(members[n['id']])
        n['time'] = {"start": s, "end": None, "open": True, "circa": True, "precision": "derived", "basis": "historical", "confidence": "low",
                     "label": f"from c. {s}" if s > 0 else f"from c. {-s} BCE", "derived": "earliest dated member (v1 import)"}

have = {(e['from'], e['to'], e.get('legacy_type') or e['type']) for e in edges}
have2 = {(e['from'], e['to']) for e in edges}
out_edges = list(edges); n0 = len(edges)
for i, e in enumerate(v1e):
    V1MAP = {'lineage_of': 'founded', 'studied_with': 'teacher_of', 'teacher_of': 'teacher_of', 'influenced': 'influenced'}
    t = V1MAP.get(e['type'], 'influenced')   # v1 'studied_with' runs teacher -> student, like teacher_of
    if e['from'] not in out_nodes or e['to'] not in out_nodes: continue
    if (e['from'], e['to'], e['type']) in have or (e['from'], e['to']) in have2: continue
    out_edges.append({"id": f"v1-{i + 1:04d}", "from": e['from'], "to": e['to'], "type": t, "conf": e.get('conf', 'medium'),
                      "basis": "historical", "time": None, "legacy_type": e['type'] if e['type'] in ('teacher_of', 'influenced', 'lineage_of') else 'teacher_of',
                      **({"lineage": trads.get(out_nodes[e['to']].get('tradition') or '', {}).get('id') or out_nodes[e['to']].get('tradition')} if t == 'teacher_of' else {}),
                      "provenance": [{"cite": "wisegraph v1 (curated, app/wisegraph/edges.json)", "check": "needs_source"}],
                      **({"note": e['note']} if e.get('note') else {})})
    added['edge'] += 1
# nodes without a lane can't be drawn; keep them, the validator reports them
os.makedirs(f'{A}/merged', exist_ok=True)
meta = {"version": "atlas-v2-merged-0.1", "from": ["atlas backbone", "wisegraph v1"], "added": dict(added), "undated_v1_people": len(undated)}
json.dump({"_meta": meta, "nodes": list(out_nodes.values())}, open(f'{A}/merged/nodes.json', 'w'), ensure_ascii=False, indent=1)
json.dump({"_meta": meta, "edges": out_edges}, open(f'{A}/merged/edges.json', 'w'), ensure_ascii=False, indent=1)
streams = json.load(open(f'{A}/streams.json'))
for l in streams['lanes']:
    l['nodes'] = sum(1 for n in out_nodes.values() if n.get('stream') == l['id'])
json.dump(streams, open(f'{A}/merged/streams.json', 'w'), ensure_ascii=False, indent=1)
# talks counts for the new nodes
clips = json.load(open(os.path.join(A, '../app/clips.json')))
by = collections.Counter(c.get('speaker') for c in clips); about = collections.Counter(f for c in clips for f in (c.get('figures') or []))
for n in out_nodes.values():
    if n.get('v1_only') and (by.get(n['id']) or about.get(n['id'])):
        n['talks'] = {"by": by.get(n['id'], 0), "about": about.get(n['id'], 0)}
with open(f'{A}/proto/data-merged.js', 'w') as f:
    f.write("window.ATLAS=" + json.dumps({"meta": meta, "nodes": list(out_nodes.values()), "edges": out_edges, "streams": streams}, ensure_ascii=False, separators=(',', ':')) + ";\n")
print(json.dumps(meta), 'undated:', undated[:12], '...' if len(undated) > 12 else '')
