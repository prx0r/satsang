import json,urllib.request,time
from qids import Q
UA={'User-Agent':'WiserPlaces/0.1 (tradesprior@gmail.com)'}
ids=list(set(Q.values())); ent={}
for i in range(0,len(ids),50):
    u='https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims|labels|descriptions|sitelinks&languages=en&ids='+'|'.join(ids[i:i+50])
    ent.update(json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=60))['entities'])
# country iso
cq=set()
def cl(e,p): return [c['mainsnak'].get('datavalue',{}).get('value') for c in e.get('claims',{}).get(p,[]) if c['mainsnak'].get('datavalue')]
for e in ent.values():
    for v in cl(e,'P17'): cq.add(v['id'])
cq=list(cq); cent={}
for i in range(0,len(cq),50):
    u='https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids='+'|'.join(cq[i:i+50])
    cent.update(json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=60))['entities'])
iso={k:(cl(v,'P297') or [None])[0] for k,v in cent.items()}
out={}
for pid,q in Q.items():
    e=ent[q]
    co=cl(e,'P625'); web=cl(e,'P856'); inc=cl(e,'P571'); c=[iso.get(v['id']) for v in cl(e,'P17')]
    out[pid]=dict(qid=q,label=e.get('labels',{}).get('en',{}).get('value'),desc=e.get('descriptions',{}).get('en',{}).get('value'),
      lat=co[0]['latitude'] if co else None,lng=co[0]['longitude'] if co else None,web=web,inception=inc[0]['time'] if inc else None,country=c,
      enwiki=e.get('sitelinks',{}).get('enwiki',{}).get('title'))
json.dump(out,open('../cache/wd_places.json','w'),indent=0,ensure_ascii=False)
for k,v in out.items(): print(k,v['qid'],v['country'],v['lat'],v['lng'],v['inception'],v['web'][:1])
