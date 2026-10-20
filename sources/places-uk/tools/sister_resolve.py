import json,urllib.request,urllib.parse,time,os
from sister_seeds import A
UA={'User-Agent':'WiserPlaces/0.2 (tradesprior@gmail.com)'}
def get(u):
    for a in range(2):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=40))
        except Exception: time.sleep(2)
out={}
for s in A:
    r=get('https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=4&search='+urllib.parse.quote(s[9]))
    ids=[x['id'] for x in (r or {}).get('search',[])]
    if not ids: out[s[0]]=None; print(s[0],'NONE'); continue
    e=get('https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims|labels|descriptions&languages=en&ids='+'|'.join(ids))['entities']
    best=None
    for q in ids:
        x=e[q]; cl=x.get('claims',{})
        co=[c['mainsnak']['datavalue']['value'] for c in cl.get('P625',[]) if c['mainsnak'].get('datavalue')]
        web=[c['mainsnak']['datavalue']['value'] for c in cl.get('P856',[]) if c['mainsnak'].get('datavalue')]
        lab=x.get('labels',{}).get('en',{}).get('value'); d=x.get('descriptions',{}).get('en',{}).get('value')
        cand=dict(qid=q,label=lab,desc=d,lat=co[0]['latitude'] if co else None,lng=co[0]['longitude'] if co else None,web=web[:1])
        if best is None: best=cand
        if co: best=cand; break
    out[s[0]]=best; print(s[0],best['qid'],best['label'],'|',(best['desc'] or '')[:50],'|',best['lat'],best['lng'],best['web'])
    time.sleep(0.3)
json.dump(out,open('../cache/sister_wd.json','w'),indent=0)
