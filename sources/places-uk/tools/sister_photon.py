import json,urllib.request,urllib.parse,time
UA={'User-Agent':'WiserPlaces/0.2 (tradesprior@gmail.com)'}
Q={'iskcon-mayapur':'Sri Mayapur Chandrodaya Mandir','sivananda-val-morin':'Sivananda Ashram Yoga Camp Val-Morin','sivananda-neyyar-dam':'Sivananda Yoga Vedanta Dhanwantari Ashram','akshardham-delhi':'Akshardham Delhi','bk-mount-abu':'Pandav Bhawan Mount Abu','gretz':'Centre Védantique Ramakrishna Gretz','vedanta-chicago':'Vivekananda Vedanta Society Chicago','bonnevaux':'Bonnevaux Marçay','osho-pune':'Osho International Meditation Resort','guhyaloka':'Guhyaloka','fazal-manzil':'Fazal Manzil Suresnes','dargah-inayat-khan':'Hazrat Inayat Khan Dargah','mount-madonna':'Mount Madonna Center','nagaloka':'Nagaloka Nagpur','bihar-school-of-yoga':'Bihar School of Yoga Munger'}
out={}
for k,q in Q.items():
    try: f=json.load(urllib.request.urlopen(urllib.request.Request('https://photon.komoot.io/api/?limit=2&q='+urllib.parse.quote(q),headers=UA),timeout=25))['features']
    except Exception as e: f=[]
    time.sleep(1)
    out[k]=[dict(name=x['properties'].get('name'),cc=x['properties'].get('countrycode'),city=x['properties'].get('city') or x['properties'].get('county'),cat=x['properties']['osm_key']+'/'+x['properties']['osm_value'],lat=x['geometry']['coordinates'][1],lng=x['geometry']['coordinates'][0]) for x in f]
    r=out[k][0] if out[k] else None
    print(k,'|',r)
json.dump(out,open('../cache/sister_photon.json','w'),indent=0)
