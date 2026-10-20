import json,urllib.request,urllib.parse,time,sys,os
sys.path.insert(0,os.path.dirname(__file__))
from seed_places import P
UA={'User-Agent':'WiserPlaces/0.1 (tradesprior@gmail.com)'}
def get(u):
    for i in range(3):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30))
        except Exception as e: time.sleep(2)
    raise
out={}
cf='../cache/search.json'
if os.path.exists(cf): out=json.load(open(cf))
for p in P:
    if p[0] in out: continue
    r=get('https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&limit=4&search='+urllib.parse.quote(p[1]))
    out[p[0]]=[(x['id'],x.get('label'),x.get('description','')) for x in r.get('search',[])]
    time.sleep(0.1)
json.dump(out,open(cf,'w'),indent=0,ensure_ascii=False)
for p in P:
    c=out[p[0]]
    print(p[0],'|',' ;; '.join(f"{a} {b} — {d[:60]}" for a,b,d in c[:3]) or 'NONE')
