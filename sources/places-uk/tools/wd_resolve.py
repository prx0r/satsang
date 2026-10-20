import json,urllib.request,urllib.parse,time,os,re,difflib,concurrent.futures as cf
from seeds import S
UA={'User-Agent':'WiserPlaces/0.2 (tradesprior@gmail.com)'}
C='../cache/wd_search.json'; cache=json.load(open(C)) if os.path.exists(C) else {}
def get(u):
    for a in range(2):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=40))
        except Exception as e: time.sleep(2)
    return None
def search(q):
    r=get('https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=6&search='+urllib.parse.quote(q))
    return [x['id'] for x in (r or {}).get('search',[])]
def short(n):
    n=re.sub(r'\(.*?\)','',n); return n.split(',')[0].strip()
todo=[s for s in S if s[0] not in cache]
def work(s):
    ids=search(short(s[1]))
    if not ids and '(' in s[1]: ids=search(re.search(r'\((.*?)\)',s[1]).group(1))
    return s[0],ids
with cf.ThreadPoolExecutor(4) as ex:
    for k,ids in ex.map(work,todo): cache[k]={'cands':ids}
json.dump(cache,open(C,'w'))
# fetch entities
allq=sorted({q for v in cache.values() for q in v['cands']})
E='../cache/wd_ent.json'; ent=json.load(open(E)) if os.path.exists(E) else {}
need=[q for q in allq if q not in ent]
for i in range(0,len(need),50):
    r=get('https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims|labels|descriptions|sitelinks&languages=en&ids='+'|'.join(need[i:i+50]))
    for q,e in (r or {}).get('entities',{}).items():
        cl=e.get('claims',{})
        def v(p): return [c['mainsnak'].get('datavalue',{}).get('value') for c in cl.get(p,[]) if c['mainsnak'].get('datavalue')]
        co=v('P625')
        ent[q]=dict(label=e.get('labels',{}).get('en',{}).get('value'),desc=e.get('descriptions',{}).get('en',{}).get('value'),
          P17=[x['id'] for x in v('P17')],lat=co[0]['latitude'] if co else None,lng=co[0]['longitude'] if co else None,
          web=v('P856'),inception=(v('P571') or [{}])[0].get('time') if v('P571') else None,P31=[x['id'] for x in v('P31')],
          enwiki=e.get('sitelinks',{}).get('enwiki',{}).get('title'))
    time.sleep(0.5)
json.dump(ent,open(E,'w'))
uk={'Q145','Q21','Q22','Q25','Q26','Q9676'}
out={}
for s in S:
    best=None
    for q in cache[s[0]]['cands']:
        e=ent.get(q); 
        if not e: continue
        if not (set(e['P17'])&uk): continue
        sim=difflib.SequenceMatcher(None,short(s[1]).lower(),(e['label'] or '').lower()).ratio()
        if best is None or sim>best[1]: best=(q,sim)
    out[s[0]]=best
json.dump(out,open('../cache/wd_pick.json','w'))
for s in S:
    b=out[s[0]]
    if b: e=ent[b[0]]; print(f"{s[0]:34s} {b[0]:11s} {b[1]:.2f} {e['label']} | {(e['desc'] or '')[:55]} | {'C' if e['lat'] else '-'}")
    else: print(f"{s[0]:34s} NONE")
