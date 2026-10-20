import json,urllib.request,urllib.parse,re,time,sys
W='/workspace/projects/f9a7b7ba-e7fb-456e-891e-78ec1c0ab3dc/work/wiser/'
_d=json.load(open(W+'app/wisegraph/people.json')); _d=_d.get('people') or _d.get('nodes') if isinstance(_d,dict) else _d; P={p['id']:p for p in _d}
out=json.load(open('raw/wikidata_search.json'))
t0=time.time()
for k,v in list(out.items()):
    if not isinstance(v,str): continue
    if k in P and P[k].get('wikidata'): out[k]=[(P[k]['wikidata'],'from app people.json')]; continue
    if time.time()-t0>100: break
    n=k.replace('-',' ')
    names={'swami-swaroopananda-sivananda':'Swami Swaroopananda','ajahn-maha-boowa':'Maha Bua','krishnamacharya':'Tirumalai Krishnamacharya','srila-prabhupada':'A. C. Bhaktivedanta Swami Prabhupada','swami-sivananda':'Sivananda Saraswati','swami-satyananda':'Satyananda Saraswati','swami-vishnudevananda':'Vishnudevananda Saraswati','bks-iyengar':'B. K. S. Iyengar','pattabhi-jois':'K. Pattabhi Jois','rc-zaehner':'R. C. Zaehner','daniel-ingalls':'Daniel H. H. Ingalls','tkv-desikachar':'T. K. V. Desikachar','goenka':'S. N. Goenka','nick-sutton':'Nicholas Sutton','paul-williams':'Paul Williams'}
    n=names.get(k, re.sub(r'\b(sivananda|chinmaya)$','',n).strip())
    u='https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&limit=3&search='+urllib.parse.quote(n)
    try:
        d=json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'wiser-sourcing/1.0 (research)'}),timeout=20))
        out[k]=[(x['id'],x.get('description','')) for x in d.get('search',[])]
    except Exception as e: out[k]='ERR '+str(e)[:40]
    time.sleep(1.1)
json.dump(out,open('raw/wikidata_search.json','w'))
print(sum(1 for v in out.values() if isinstance(v,str)),'left')
