#!/usr/bin/env python3
"""Data consistency check over the built site data (app/site/..., app/clips.json). Read-only; exit 1 on errors.

Checks
  refs      every collection / series item (clip, alts, practice, text, resource, place, topic), series deeper places,
            series retreat, gold talks, hub question ids -> resolve to a real record
  licence   every text/url item in a collection passes the licence gate (licence_gate.licence_for), no held id or held url is
            linked anywhere in the shipped site data, the series retreat is a whole Dharma Seed retreat (never a cut)
  topics    every topic with series/gold/hub content has talks; topics with no talks are reported (the UI's TOPICS §6 gate hides them)
  teachers  On-video teachers (teachers.json) with 0 playable talks are flagged; main held teachers have no tied claims
  ids       duplicate clip ids, series talks missing their series topic
usage: python3 tools/check/check-data.py [--json out.json]
"""
import json, os, re, sys, collections
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APP = os.path.join(ROOT, 'app'); W = os.path.join(APP, 'site/data/wisegraph')
sys.path.insert(0, os.path.join(APP, 'tools'))
from licence_gate import licence_for, linkable, LREG  # noqa: E402

J = lambda *p: json.load(open(os.path.join(*p)))
clips = J(APP, 'clips.json'); clips = clips if isinstance(clips, list) else clips.get('clips', clips)
CID = collections.Counter(c['id'] for c in clips); C = {c['id']: c for c in clips}
col = J(W, 'collections.json'); P = col['practices']; COLS = {c['id']: c for c in col['collections']}
places = {p['id'] for p in J(W, 'places.json')['places']}
wise = J(W, 'wise.json'); people = wise['people']
hubs = J(W, 'hubs.json')['hubs']
gold = J(W, 'gold.json')
topics_tree = J(APP, 'schema/topics.json')['tree']
res = {}
for f in os.listdir(W):
    if f.startswith('resources') and f.endswith('.json'):
        for r in J(W, f).get('resources', []): res[r['id']] = r
teachers = J(APP, 'site/teachers.json')['teachers']
HELD_IDS = set((LREG.get('held') or {}).keys()); HELD_URLS = {e.get('url') for e in (LREG.get('held') or {}).values() if e.get('url')}

err, warn, info = [], [], collections.defaultdict(int)
E = lambda m: err.append(m); Wn = lambda m: warn.append(m)

# ids
for k, n in CID.items():
    if n > 1: E(f'clip id duplicated {n}x: {k}')

def topic_ids(t, out, pre=''):
    for k, v in (t or {}).items():
        if isinstance(v, dict) and 'label' in v: out.add(pre + k); topic_ids(v, out, pre + k + '/')
    return out
TOPICS = topic_ids(topics_tree, set())
LEAF = {t.split('/')[-1]: t for t in TOPICS}
for h in hubs: TOPICS.add(LEAF.get(h, h))

def check_item(where, it):
    ref = it.get('ref', ''); kind, _, rid = ref.partition(':')
    if not ref: return  # reflect / note-only steps
    info['refs'] += 1
    if kind == 'clip':
        if rid not in C: E(f'{where}: clip {rid} not in clips.json')
        for a in it.get('alts', []) or []:
            a = a.split(':', 1)[-1]
            if a not in C: E(f'{where}: alt clip {a} not in clips.json')
    elif kind == 'practice':
        if rid not in P: E(f'{where}: practice {rid} missing')
    elif kind == 'place':
        if rid not in places: E(f'{where}: place {rid} missing')
    elif kind == 'topic':
        if rid not in TOPICS and rid not in LEAF: Wn(f'{where}: topic {rid} not in the vocabulary')
    elif kind in ('text', 'url', 'resource'):
        url = it.get('url', '')
        if rid in HELD_IDS or url in HELD_URLS: E(f'{where}: links a HELD text {rid} {url}')
        lic, why, ev, entry = licence_for(rid, url)
        if not lic: lic = next((b['licence'] for b in (LREG.get('books') or {}).values() if url and url in (b.get('evidenceUrl'), b.get('url'))), None)
        if kind == 'url' and not linkable(lic): info['plain_links_to_teacher_sites'] += 1; return  # a 'Go deeper' page link (lectures, a teacher's site), not a text
        if kind == 'resource' and rid in res: lic = lic or res[rid].get('licence') or ('free' if res[rid].get('free') else None)
        if not (linkable(lic) or (kind == 'resource' and rid in res) or (entry and entry.get('licence'))):
            (E if kind == 'text' else Wn)(f'{where}: {kind} {rid} {url} licence not evidenced ({why})')
    else:
        Wn(f'{where}: unknown ref kind {ref}')

series = [c for c in COLS.values() if c['kind'] == 'mini-course']
for c in COLS.values():
    for u in c.get('units', []):
        for it in u.get('items', []): check_item(f"{c['kind']} {c['id']} s{u.get('n')}", it)
    for it in c.get('items', []): check_item(f"{c['kind']} {c['id']}", it)
    for d in c.get('deeper', []) or []:
        if d.get('ref', '').startswith('place:') and d['ref'][6:] not in places: E(f"{c['id']}: deeper place {d['ref']} missing")
    r = c.get('retreat')
    if r:
        if r.get('id') not in res: E(f"{c['id']}: retreat resource {r.get('id')} not in resources*.json")
        if not re.match(r'^https://dharmaseed\.org/retreats/\d+/?$', r.get('url', '')): E(f"{c['id']}: retreat url is not a whole Dharma Seed retreat: {r.get('url')}")
    if c['kind'] == 'mini-course':
        t = c.get('topic')
        for u in c.get('units', []):
            for it in u.get('items', []):
                if it.get('ref', '').startswith('clip:') and it['ref'][5:] in C and t not in (C[it['ref'][5:]].get('topics') or []):
                    E(f"series {c['id']}: talk {it['ref'][5:]} lacks the series topic {t} (run tools/tag-series.py)")
info['series'] = len(series); info['collections'] = len(COLS)

# gold
gids = list((gold.get('gold') or {}).keys()) if isinstance(gold.get('gold'), dict) else [g.get('id') if isinstance(g, dict) else g for g in gold.get('gold', [])]
for g in gids:
    if g not in C: E(f'gold talk {g} not in clips.json')
info['gold'] = len(gids)

# held links anywhere in the shipped site data, as a reading (title + url). A practice's `source` / a hub practice's `url`
# (has `how`) and an edge's `src` are citations, which held texts allow (held = citation-only), so they are counted, not failed.
cites = collections.Counter()
def walk(o, where):
    if isinstance(o, dict):
        for k, v in o.items():
            if isinstance(v, str) and v in HELD_URLS:
                if k == 'url' and 'how' not in o and 'title' in o: E(f'held text linked as a reading in {where}: {v}')
                else: cites[v] += 1
            else: walk(v, where)
    elif isinstance(o, list):
        for x in o: walk(x, where)
for dp, _, fs in os.walk(os.path.join(APP, 'site/data')):
    for f in fs:
        if f.endswith('.json'): walk(json.load(open(os.path.join(dp, f))), f)
info['held_urls_cited_only'] = len(cites)

# topics: talks per topic, content per topic
per = collections.Counter(t for c in clips for t in set((c.get('topics') or []) + [x[0] for x in ((c.get('tags') or {}).get('topics') or [])]))
content = collections.defaultdict(list)
for c in series: content[LEAF.get(c.get('topic'), c.get('topic'))].append('series')
for t in hubs: content[LEAF.get(t, t)].append('hub')
for t, ids in ((gold.get('topics') or {}).items() if isinstance(gold.get('topics'), dict) else []): content[t].append('gold')
for t in sorted(TOPICS):
    if content.get(t) and not per.get(t): E(f'topic {t} has {"/".join(content[t])} but 0 talks')
empty = sorted(t for t in TOPICS if not per.get(t))
info['topics'] = len(TOPICS); info['topics_without_talks'] = len(empty)

# teachers
byT = collections.Counter(c.get('teacher') for c in clips)
zero = [n for n in teachers if not byT.get(n)]
for n in zero: Wn(f'teacher on the grid with 0 talks in clips.json: {n}')
spk = collections.Counter(c.get('speaker') for c in clips)
for k, pp in people.items():
    if pp.get('k') == 'speaker' and not spk.get(k): Wn(f'speaker {k} has 0 talks (profile reads "Talks arriving")')
info['teachers'] = len(teachers); info['teachers_zero'] = len(zero)
for h in ('ajahn-sucitto', 'jack-kornfield', 'swami-ramdev'):  # held: no present-tense role at a place
    p = people.get(h) or {}
    if re.search(r'\b(is (the )?(abbot|head|guiding teacher)|currently teaches|teaches (now )?at)\b', json.dumps(p), re.I): E(f'held teacher {h} carries a live role claim')

out = {'errors': err, 'warnings': warn, 'info': dict(info), 'topics_without_talks': empty}
if '--json' in sys.argv: json.dump(out, open(sys.argv[sys.argv.index('--json') + 1], 'w'), indent=1)
print(json.dumps(dict(info)))
for m in err[:60]: print('ERROR', m)
for m in warn[:60]: print('warn ', m)
print(f'{len(err)} errors, {len(warn)} warnings')
sys.exit(1 if err else 0)
