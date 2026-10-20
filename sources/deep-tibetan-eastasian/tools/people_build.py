#!/usr/bin/env python3
import json, os, collections, urllib.request, urllib.parse, re, time
from speakers import S
from peopledata import P
D = os.path.join(os.path.dirname(__file__), '..')
clips = json.load(open(f'{D}/clips.json'))
pool = json.load(open(f'{D}/raw/pool.json'))
existing = {}
try:
    for r in json.load(open(f'{D}/../../app/site/clips.json')):
        existing[r.get('speaker')] = existing.get(r.get('speaker'), 0) + 1
except Exception:
    pass
cc = collections.Counter(r['speaker'] for r in clips)
cat = collections.defaultdict(collections.Counter)
chans = collections.defaultdict(collections.Counter)
for v in pool:
    sp = v.get('speaker')
    if not sp: continue
    cat[sp][v.get('kind', '?')] += 1
    chans[sp][v.get('channel')] += 1
WD_CACHE = f'{D}/cache/wikidata.json'
wd = json.load(open(WD_CACHE)) if os.path.exists(WD_CACHE) else {}
def wikidata(name):
    if name in wd: return wd[name]
    q = re.sub(r'\b(Rinpoche|Roshi|Sensei|Lama|Dr\.?|Venerable|Zen Master|HH|H\.H\.)\b', '', name).strip()
    try:
        u = 'https://www.wikidata.org/w/api.php?' + urllib.parse.urlencode(dict(action='wbsearchentities', search=q, language='en', format='json', limit=1))
        j = json.load(urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'wiser-research/0.1'}), timeout=15))
        h = j.get('search', [])
        wd[name] = dict(qid=h[0]['id'], label=h[0].get('label'), description=h[0].get('description')) if h else None
    except Exception as e:
        wd[name] = None
    time.sleep(0.2)
    return wd[name]
REL = re.compile(r'buddhis|lama|monk|nun|tibet|zen|religio|scholar|professor|teacher|translator|priest|anthropolog|author|philosoph|writer|abbot|sinolog|japanolog|tibetolog|academic|buddhist', re.I)
out, more = [], []
for sid, name, rx, fam, school, role, defch, *rest in S:
    p = P.get(sid, (None, None, None))
    w = wikidata(name)
    if w and not (w.get('description') and REL.search(w['description'])):
        w = dict(w, unverified=True)
    n = cc.get(sid, 0)
    row = dict(id=sid, name=name, role=role, family=fam, tradition=fam, school=school, years=p[0], bio=p[2],
               site=p[1], channels=[c for c, _ in chans[sid].most_common(5)], clip_count=n,
               catalogue=dict(cat[sid]), existing_app_clips=existing.get(sid, 0),
               set='main' if n >= 8 else 'more-voices', wikidata=w)
    out.append(row)
    if n < 8:
        more.append(dict(id=sid, name=name, school=school, role=role, clip_count=n, catalogue=dict(cat[sid]),
                         reason='fewer than 8 usable talks in this pass' + (' (mostly >60 min)' if cat[sid].get('long', 0) > n else '')))
json.dump(wd, open(WD_CACHE, 'w'), ensure_ascii=False, indent=0)
out.sort(key=lambda r: -r['clip_count'])
json.dump(dict(people=out, more_voices=sorted(more, key=lambda r: -r['clip_count'])), open(f'{D}/people.json', 'w'), ensure_ascii=False, indent=1)
json.dump([dict(id=r['id'], name=r['name'], role=r['role'], tradition=r['family'], school=r['school'], years=r['years'], bio=r['bio'], site=r['site'], wikidata=(r['wikidata'] or {}).get('qid') if r['wikidata'] and not r['wikidata'].get('unverified') else None) for r in out], open(f'{D}/people-additions.json', 'w'), ensure_ascii=False, indent=1)
missing = [r['id'] for r in out if not r['bio']]
print('people', len(out), 'main', sum(r['set'] == 'main' for r in out), 'more', len(more), 'no-bio', missing)
# long-talk backlog for later virtual-clip cutting
longs = [dict(id=v['id'], speaker=v.get('speaker'), title=v['title'], sec=v['sec'], channel=v['channel']) for v in pool if v.get('kind') == 'long' and v.get('speaker') and not v.get('dup')]
json.dump(longs, open(f'{D}/long-candidates.json', 'w'), ensure_ascii=False, indent=0)
print('long candidates', len(longs))
