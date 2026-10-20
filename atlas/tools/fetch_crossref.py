"""Look up each scholarly work on Crossref; keep a DOI only when the title matches closely. ../cache/crossref.json"""
import json, os, time, urllib.request, urllib.parse, difflib, unicodedata, re, seed
C = os.path.join(os.path.dirname(__file__), '../cache/crossref.json')
cache = json.load(open(C)) if os.path.exists(C) else {}
UA = {"User-Agent": "WiserAtlas/0.1 (mailto:tradesprior@gmail.com)"}
def norm(s): return re.sub(r'[^a-z0-9 ]', '', unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower())
names = {n['id']: n['label'] for n in seed.N}
T0 = time.time()
for w in seed.W:
    k = w['scholar'] + '|' + w['title']
    if k in cache: continue
    if time.time() - T0 > 100: break
    title = w['title'].split(' (')[0].split(':')[0] if len(w['title']) > 60 else w['title']
    q = dict(**{"query.bibliographic": w['title'], "query.author": names[w['scholar']].split('(')[0]}, rows=5, select="DOI,title,issued,publisher,type")
    try:
        d = json.load(urllib.request.urlopen(urllib.request.Request("https://api.crossref.org/works?" + urllib.parse.urlencode(q), headers=UA), timeout=30))
        best = None
        for it in d['message']['items']:
            t = (it.get('title') or [''])[0]
            r = difflib.SequenceMatcher(None, norm(t), norm(w['title'].split(' (')[0])).ratio()
            r2 = difflib.SequenceMatcher(None, norm(t), norm(w['title'].split(':')[0])).ratio()
            y = ((it.get('issued') or {}).get('date-parts') or [[None]])[0][0]
            sc = max(r, r2)
            if not best or sc > best['score']:
                best = dict(score=round(sc, 3), doi=it['DOI'], title=t, year=y, publisher=it.get('publisher'), type=it.get('type'))
        cache[k] = best
    except Exception as ex:
        cache[k] = {"error": str(ex)}
    time.sleep(0.3)
json.dump(cache, open(C, 'w'), indent=0, ensure_ascii=False)
ok = [(k, v) for k, v in cache.items() if v and v.get('score', 0) >= 0.85]
print(len(cache), 'looked up;', len(ok), 'matched')
for k, v in ok: print(' ', v['score'], v['year'], v['doi'], '|', k[:80])
