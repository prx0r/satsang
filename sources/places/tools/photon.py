import json,urllib.request,urllib.parse,time,os,sys
from osm import Qs
UA={'User-Agent':'WiserPlaces/0.1 (tradesprior@gmail.com)'}
osm=json.load(open('../cache/osm.json'))
extra={'shwe-oo-min':['Shwe Oo Min','Dhammasukha'],'ims-barre':['Insight Meditation Society Barre','Insight Meditation Society Pleasant Street'],'chanmyay-yeiktha':['Chanmyay Yeiktha Yangon','Chanmyay Yeiktha'],
 'hillside-hermitage':['Hillside Hermitage Sri Lanka'],'karme-choling':['Karme Choling Barnet'],'sri-ramanasramam':['Sri Ramana Ashram Tiruvannamalai','Ramanasramam'],'rvc-ny':['Ramakrishna Vivekananda Center New York'],
 'imc-yangon':['International Meditation Centre Yangon','Inya Myaing Road meditation'],'gyuto':['Gyuto Monastery'],'cac':['Center for Action and Contemplation Albuquerque']}
cf='../cache/photon.json'; out=json.load(open(cf)) if os.path.exists(cf) else {}
todo=[k for k in Qs if not osm.get(k)]+list(extra)
for k in todo:
    if k in out: continue
    res=[]
    for q in extra.get(k,Qs.get(k,[])):
        u='https://photon.komoot.io/api/?limit=3&q='+urllib.parse.quote(q)
        try: r=json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=20))
        except Exception as e: print('ERR',k,e); r={'features':[]}
        time.sleep(0.4)
        for f in r['features']:
            p=f['properties']; c=f['geometry']['coordinates']
            res.append(dict(q=q,osm=f"{p.get('osm_type')}/{p.get('osm_id')}",name=p.get('name'),disp=', '.join(str(p.get(x)) for x in ['name','street','city','state','country'] if p.get(x)),lat=c[1],lng=c[0],cc=(p.get('countrycode') or '').upper(),cat=f"{p.get('osm_key')}/{p.get('osm_value')}"))
        if res: break
    out[k]=res
    json.dump(out,open(cf,'w'),indent=0,ensure_ascii=False)
for k in todo:
    r=out.get(k) or []
    print(k,'|',' ;; '.join(f"{x['osm']} {x['cc']} {x['lat']:.4f},{x['lng']:.4f} {x['disp'][:70]} [{x['cat']}]" for x in r[:3]) or 'NONE')
