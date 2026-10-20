import json,urllib.request,urllib.parse,time
from people_seed import P
UA={'User-Agent':'WiserPlaces/0.2 (tradesprior@gmail.com)'}
def get(u):
    for a in range(2):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=40))
        except Exception: time.sleep(2)
out={}
for p in P:
    r=get('https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=5&search='+urllib.parse.quote(p[2]))
    ids=[x['id'] for x in (r or {}).get('search',[])]
    pick=None
    if ids:
        e=get('https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims|labels|descriptions&languages=en&ids='+'|'.join(ids))['entities']
        for q in ids:
            cl=e[q].get('claims',{})
            if not any(c['mainsnak'].get('datavalue',{}).get('value',{}).get('id')=='Q5' for c in cl.get('P31',[])): continue
            def yr(pp):
                v=[c['mainsnak']['datavalue']['value']['time'] for c in cl.get(pp,[]) if c['mainsnak'].get('datavalue')]
                return int(v[0][1:5]) if v else None
            pick=dict(qid=q,label=e[q].get('labels',{}).get('en',{}).get('value'),desc=e[q].get('descriptions',{}).get('en',{}).get('value'),born=yr('P569'),died=yr('P570'))
            break
    out[p[0]]=pick
    print(p[0],'->',pick and (pick['qid'],pick['label'],(pick['desc'] or '')[:50],pick['born'],pick['died']))
    time.sleep(0.3)
json.dump(out,open('../cache/people_wd.json','w'),indent=0)
