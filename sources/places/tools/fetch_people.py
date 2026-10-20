import json,urllib.request,urllib.parse,time,os
from seed_people import PP
UA={'User-Agent':'WiserPlaces/0.1 (tradesprior@gmail.com)'}
def g(u): return json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30))
cf='../cache/people_search.json'; S=json.load(open(cf)) if os.path.exists(cf) else {}
for p in PP:
    if p[0] in S: continue
    r=g('https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&limit=3&search='+urllib.parse.quote(p[1]))
    S[p[0]]=[(x['id'],x.get('label'),x.get('description','')) for x in r['search']]; time.sleep(0.1)
json.dump(S,open(cf,'w'),ensure_ascii=False)
for p in PP: print(p[0],'|',' ;; '.join(f"{a} {b} — {c[:60]}" for a,b,c in S[p[0]][:2]) or 'NONE')
