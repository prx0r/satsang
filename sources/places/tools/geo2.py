import json,urllib.request,urllib.parse,time,os
UA={'User-Agent':'WiserPlaces/0.1 (tradesprior@gmail.com)'}
Q={'sri-ramanasramam':['Sri Ramanasramam, Tiruvannamalai','Ramana Maharshi Ashram'],'ims-barre':['1230 Pleasant Street, Barre, Massachusetts'],'bcbs':['149 Lockwood Road, Barre, Massachusetts'],
'karme-choling':['369 Patneaude Lane, Barnet, Vermont'],'shree-muktananda-ashram':['371 Brickman Road, South Fallsburg'],'cac':['1823 Five Points Road SW, Albuquerque'],
'imc-yangon':['31A Inya Myaing Road, Yangon'],'cloud-mountain':['373 Agren Road, Castle Rock, Washington'],'bhavana-society':['Back Creek Road, High View, West Virginia','Bhavana Society High View'],
'imcw':['Insight Meditation Community of Washington, Takoma Park'],'sera-bylakuppe':['Sera Jey Monastic University, Bylakuppe','Sera Mey Monastic University'],'maison-de-l-inspir':['Maison de l\'Inspir, Villeneuve-sur-Bellot'],
'srf-mother-center':['3880 San Rafael Avenue, Los Angeles'],'vedanta-uk':['Unity House, Blind Lane, Bourne End'],'avila-encarnacion':['Monasterio de la Encarnación, Ávila'],
'kf-ojai':['1098 McAndrew Road, Ojai'],'rvc-ny':['17 East 94th Street, New York'],'anandamayi-kankhal':['Anandamayi Ma Ashram, Kankhal, Haridwar','Kankhal, Haridwar'],
'karar-ashram':['Karar Ashram, Puri'],'arsha-vidya-anaikatti':['Anaikatti, Coimbatore'],'wat-dhammasathit':['Wat Dhammasathit, Rayong'],'dhammasara':['Dhammasara, Gidgegannup'],
'hillside-hermitage':['Hillside Hermitage, Sri Lanka'],'chanmyay-yeiktha':['Chanmyay Yeiktha Meditation Centre, Kaba Aye Pagoda Road, Yangon'],'shwe-oo-min':['Shwe Oo Min Dhamma Sukha Tawya, Mingaladon'],
'satsang-bhavan-lucknow':['Satsang Bhavan, Indira Nagar, Lucknow'],'annamalai-swami-ashram':['Annamalai Swami Ashram, Palakottu, Tiruvannamalai'],'babaji-cave':['Kukuchina, Uttarakhand'],
'yss-ranchi':['Yogoda Satsanga Sakha Math, Ranchi','Yogoda Satsanga, Ranchi'],'forest-hermitage-kandy':['Forest Hermitage, Kandy'],'vanmali-bhavan':['Khetwadi, Mumbai'],'bhairav-gufa-beerwah':['Beerwah, Budgam']}
cf='../cache/geo2.json'; out=json.load(open(cf)) if os.path.exists(cf) else {}
for k,qs in Q.items():
    if out.get(k): continue
    res=[]
    for q in qs:
        u='https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=2&q='+urllib.parse.quote(q)
        try: r=json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30))
        except Exception as e: print('ERR',k,e); r=[]; time.sleep(5)
        time.sleep(1.6)
        res+=[dict(q=q,osm=f"{x['osm_type']}/{x['osm_id']}",name=x.get('name'),disp=x['display_name'][:110],lat=float(x['lat']),lng=float(x['lon']),cc=x.get('address',{}).get('country_code','').upper(),cat=x.get('category')+'/'+x.get('type')) for x in r]
        if res: break
    out[k]=res; json.dump(out,open(cf,'w'),indent=0,ensure_ascii=False)
for k in Q:
    r=out.get(k) or []
    print(k,'|',' ;; '.join(f"{x['osm']} {x['cc']} {x['lat']:.4f},{x['lng']:.4f} {x['disp'][:85]} [{x['cat']}]" for x in r[:2]) or 'NONE')
