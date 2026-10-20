"""Resolve Wikidata ids for seed nodes; fetch labels, descriptions, dates, enwiki titles. Writes ../cache/wd.json"""
import json, sys, time, urllib.request, urllib.parse, os, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(__file__))
import seed
APP = os.path.join(os.path.dirname(__file__), '../../app/wisegraph')
CACHE = os.path.join(os.path.dirname(__file__), '../cache/wd.json')
UA = {"User-Agent": "WiserAtlas/0.1 (https://tantrafiles.xyz; tradesprior@gmail.com)"}
def get(url):
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return json.load(r)
        except Exception as ex:
            time.sleep(4 * (i + 1)); err = ex
    raise err
legacy = {p['id']: p.get('wikidata') for p in json.load(open(f'{APP}/people.json'))['people']}
legacy.update({t['id']: t.get('wikidata') for t in json.load(open(f'{APP}/traditions.json'))['nodes']})
cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {"resolve": {}, "entities": {}}
over = json.load(open(os.path.join(os.path.dirname(__file__), 'qid_overrides.json'))) if os.path.exists(os.path.join(os.path.dirname(__file__), 'qid_overrides.json')) else {}
def search(q):
    u = "https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode(dict(action="wbsearchentities", search=q, language="en", limit=3, format="json"))
    return [(h['id'], h.get('label'), h.get('description', '')) for h in get(u).get('search', [])]
todo = []
for n in seed.N:
    nid = n['id']
    if nid in over:
        cache['resolve'][nid] = {"qid": over[nid], "how": "override" if over[nid] else "none"}; continue
    if n['qid']:
        cache['resolve'][nid] = {"qid": n['qid'], "how": "seed"}; continue
    if legacy.get(nid):
        cache['resolve'][nid] = {"qid": legacy[nid], "how": "legacy"}; continue
    if nid in cache['resolve'] and cache['resolve'][nid].get('how') == 'search':
        continue
    todo.append(n)
def res(n):
    q = n['hint'] or n['label']
    hits = search(q)
    return n['id'], {"qid": hits[0][0] if hits else None, "how": "search", "q": q, "hits": hits}
T0 = time.time()
for n in todo:
    if time.time() - T0 > 85: break
    try:
        nid, r = res(n); cache['resolve'][nid] = r
    except Exception as ex:
        print('fail', n['id'], ex); time.sleep(5)
    time.sleep(0.35)
json.dump(cache, open(CACHE, 'w'), ensure_ascii=False, indent=0)
left = [n for n in todo if n['id'] not in cache['resolve']]
if left:
    print('searched so far; left', len(left)); sys.exit(0)
qids = sorted({r['qid'] for r in cache['resolve'].values() if r.get('qid')} - set(cache['entities']))
def ent(batch):
    u = "https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode(dict(action="wbgetentities", ids="|".join(batch), props="labels|descriptions|claims|sitelinks", languages="en|fr|de", sitefilter="enwiki", format="json"))
    out = {}
    for k, v in get(u).get('entities', {}).items():
        def yrs(p):
            ys = []
            for c in v.get('claims', {}).get(p, []):
                t = c['mainsnak'].get('datavalue', {}).get('value', {})
                if isinstance(t, dict) and 'time' in t:
                    s = t['time']; neg = s.startswith('-'); y = int(s[1:].split('-')[0]); ys.append([-y if neg else y, t.get('precision')])
            return ys
        lab = v.get('labels', {}); desc = v.get('descriptions', {})
        out[k] = {"label": (lab.get('en') or lab.get('fr') or lab.get('de') or {}).get('value'),
                  "desc": (desc.get('en') or {}).get('value', ''),
                  "P569": yrs('P569'), "P570": yrs('P570'), "P571": yrs('P571'),
                  "P31": [c['mainsnak'].get('datavalue', {}).get('value', {}).get('id') for c in v.get('claims', {}).get('P31', [])][:5],
                  "enwiki": v.get('sitelinks', {}).get('enwiki', {}).get('title'),
                  "orcid": [c['mainsnak'].get('datavalue', {}).get('value') for c in v.get('claims', {}).get('P496', [])][:1]}
    return out
batches = [qids[i:i + 40] for i in range(0, len(qids), 40)]
for b in batches:
    cache['entities'].update(ent(b)); time.sleep(1)
json.dump(cache, open(CACHE, 'w'), ensure_ascii=False, indent=0)
print("resolved", len(cache['resolve']), "entities", len(cache['entities']), "searched", len(todo))
