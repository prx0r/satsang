import json,urllib.request,urllib.parse,time,os,re,sys
from seeds import S
UA={'User-Agent':'WiserPlaces/0.2 (tradesprior@gmail.com)'}
pick=json.load(open('../cache/wd_pick.json'))
import overrides as O
for k,q in O.WD_FORCE.items(): pick[k]=[q,1]
REJECT=set('ksd-glasgow manjushri-kmc dechen-sheffield sheffield-buddhist-centre buddhafield karuna-bhavan bk-global-retreat-centre nishkam-soho-road st-aidans-lindisfarne northumbria-community jarrow-st-pauls woodbrooke bryn-celli-ddu pentre-ifan lastingham clava-cairns'.split())
C='../cache/photon.json'; out=json.load(open(C)) if os.path.exists(C) else {}
def q(s):
    u='https://photon.komoot.io/api/?limit=4&lang=en&bbox=-8.7,49.8,1.8,60.9&q='+urllib.parse.quote(s)
    for a in range(2):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=25))['features']
        except Exception as e: time.sleep(3)
    return None
ALT={'manjushri-kmc':'Conishead Priory','bryn-celli-ddu':'Bryn Celli Ddu','pentre-ifan':'Pentre Ifan','clava-cairns':'Clava Cairns','lastingham':'St Mary Lastingham','jarrow-st-pauls':'St Paul\'s Church Jarrow','woodbrooke':'Woodbrooke Selly Oak','nishkam-soho-road':'Guru Nanak Nishkam Sewak Jatha','st-aidans-lindisfarne':'St Mary the Virgin Holy Island','karuna-bhavan':'Karuna Bhavan','northumbria-community':'Nether Springs Felton','bk-global-retreat-centre':'Nuneham House','ksd-glasgow':'Lochside House Lochwinnoch','oxford-friends-meeting-house':'Friends Meeting House 43 St Giles Oxford','st-nons-well':'St Non\'s Well','nine-ladies':'Nine Ladies Stanton Moor','sakya-ling-reading':'Sakya Ling Reading'}
n=0
for s in S:
    k=s[0]
    if pick.get(k) and k not in REJECT: continue
    if k in out: continue
    name=ALT.get(k, re.sub(r'\(.*?\)','',s[1]).strip())
    city=s[4].split(',')[0] if s[4] else ''
    res=[]
    for qq in [f"{name} {city}".strip(), name]:
        f=q(qq); time.sleep(1.0); n+=1
        if f is None: res=None; break
        res=[dict(q=qq,name=x['properties'].get('name'),cc=x['properties'].get('countrycode'),city=x['properties'].get('city') or x['properties'].get('county'),
                  street=x['properties'].get('street'),cat=x['properties'].get('osm_key')+'/'+x['properties'].get('osm_value'),osm=f"{x['properties'].get('osm_type')}/{x['properties'].get('osm_id')}",
                  lat=x['geometry']['coordinates'][1],lng=x['geometry']['coordinates'][0]) for x in f]
        if res: break
    out[k]=res
    if n%20==0: json.dump(out,open(C,'w'))
json.dump(out,open(C,'w'))
print('done',len(out))
