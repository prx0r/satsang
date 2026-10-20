import json,urllib.request,urllib.parse,time,os
UA={'User-Agent':'WiserPlaces/0.1 (tradesprior@gmail.com)'}
T={'sri-ramanasramam':('Ramana',12.23,79.06,.05),'bcbs':('Buddhist Studies',42.42,-72.1,.15),'ims-barre':('Insight Meditation',42.42,-72.1,.15),'karme-choling':('Karm',44.33,-72.05,.2),
'shree-muktananda-ashram':('Muktananda|Siddha Yoga',41.71,-74.6,.15),'cac':('Action and Contemplation',35.08,-106.65,.2),'wat-dhammasathit':('ธรรมสถิต|Dhammasathit',12.68,101.28,.4),
'dhammasara':('Dhammasara',-31.8,116.2,.4),'forest-hermitage-kandy':('Hermitage|Udawatta',7.3,80.64,.04),'imc-yangon':('International Meditation|Ba Khin',16.83,96.15,.12),
'cloud-mountain':('Cloud Mountain',46.28,-122.9,.3),'bhavana-society':('Bhavana',39.15,-78.45,.3),'imcw':('Insight Meditation',38.95,-77.05,.3),'sera-bylakuppe':('Sera',12.42,75.97,.12),
'maison-de-l-inspir':('Inspir',48.9,3.25,.2),'annamalai-swami-ashram':('Annamalai Swami',12.23,79.06,.05),'vanmali-bhavan':('Nisargadatta|Vanmali',18.96,72.82,.03),
'satsang-bhavan-lucknow':('Satsang|Poonja|Papaji',26.85,80.95,.15),'anandamayi-kankhal':('Anand',29.93,78.15,.06),'srf-mother-center':('Self-Realization',34.1,-118.21,.04),
'babaji-cave':('Babaji',29.8,79.45,.3),'karar-ashram':('Karar|Yukteswar',19.8,85.83,.06),'arsha-vidya-anaikatti':('Arsha',11.1,76.8,.2),'bhairav-gufa-beerwah':('Bhairav',34.0,74.6,.15),
'vedanta-uk':('Vedanta|Ramakrishna',51.58,-0.71,.06),'avila-encarnacion':('Encarnaci',40.66,-4.7,.03),'kf-ojai':('Krishnamurti',34.45,-119.25,.1),'shwe-oo-min':('Shwe Oo Min|ရွှေဥမင်',16.95,96.12,.2),
'chanmyay-yeiktha':('Chanmyay|ချမ်းမြေ့',16.85,96.15,.1),'hillside-hermitage':('Hillside',7.0,80.5,1.5),'rvc-ny':('Ramakrishna',40.78,-73.96,.03),'yss-ranchi':('Yogoda',23.36,85.33,.06),'sri-ramanasramam2':('Ashram',12.2197,79.0603,.004)}
cf='../cache/overpass.json'; out=json.load(open(cf)) if os.path.exists(cf) else {}
for k,(rx,la,ln,r) in T.items():
    if k in out: continue
    q=f'[out:json][timeout:25];nwr["name"~"{rx}",i]({la-r},{ln-r},{la+r},{ln+r});out center 8;'
    try:
        d=json.load(urllib.request.urlopen(urllib.request.Request('https://overpass-api.de/api/interpreter',data=urllib.parse.urlencode({'data':q}).encode(),headers=UA),timeout=40))
        out[k]=[dict(osm=f"{e['type']}/{e['id']}",name=e.get('tags',{}).get('name'),lat=e.get('lat',e.get('center',{}).get('lat')),lng=e.get('lon',e.get('center',{}).get('lon')),tags={t:e['tags'][t] for t in ('amenity','religion','website','tourism','building') if t in e.get('tags',{})}) for e in d['elements']]
    except Exception as ex: print('ERR',k,ex); continue
    json.dump(out,open(cf,'w'),indent=0,ensure_ascii=False); time.sleep(1)
for k in T: print(k,'|',' ;; '.join(f"{x['osm']} {x['name']} {x['lat']},{x['lng']} {x['tags']}" for x in out.get(k,[])[:4]) or 'NONE')
