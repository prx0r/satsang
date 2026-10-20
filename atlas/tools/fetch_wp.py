"""Fetch plain-text English Wikipedia articles for every node with an enwiki sitelink (cache only; used for the
provenance mention check). ../cache/wp/<qid>.txt"""
import json, os, time, urllib.request, urllib.parse, sys
UA = {"User-Agent": "WiserAtlas/0.1 (https://tantrafiles.xyz; tradesprior@gmail.com)"}
D = os.path.join(os.path.dirname(__file__), '../cache/wp'); os.makedirs(D, exist_ok=True)
c = json.load(open(os.path.join(os.path.dirname(__file__), '../cache/wd.json')))
T0 = time.time(); n = 0
for nid, r in c['resolve'].items():
    q = r.get('qid'); e = c['entities'].get(q or '', {})
    t = e.get('enwiki')
    if not t or os.path.exists(f'{D}/{q}.txt'): continue
    if time.time() - T0 > 100: print('time cap'); break
    u = "https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode(dict(action="query", prop="extracts", explaintext=1, titles=t, format="json", redirects=1))
    try:
        d = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=25))
        txt = next(iter(d['query']['pages'].values())).get('extract', '')
        open(f'{D}/{q}.txt', 'w').write(txt); n += 1
    except Exception as ex:
        print('fail', t, ex); time.sleep(3)
    time.sleep(0.15)
print('fetched', n, 'total', len(os.listdir(D)))
