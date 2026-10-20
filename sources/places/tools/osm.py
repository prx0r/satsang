import json,urllib.request,urllib.parse,time,os
UA={'User-Agent':'WiserPlaces/0.1 (tradesprior@gmail.com)'}
Qs={'aruna-ratanagiri':['Aruna Ratanagiri','Harnham Buddhist Monastery'],'santacittarama':['Santacittarama'],'bps-kandy':['Buddhist Publication Society Kandy'],'nissarana-vanaya':['Nissarana Vanaya','Mitirigala Nissarana'],
'shwe-oo-min':['Shwe Oo Min Dhamma Sukha','Shwe Oo Min'],'ims-barre':['Insight Meditation Society Barre','Insight Meditation Society'],'bcbs':['Barre Center for Buddhist Studies'],'nagi-gompa':['Nagi Gompa','Nagi Gumba'],
'karme-choling':['Karme Choling','Karmê Chöling'],'sri-ramanasramam':['Sri Ramanasramam','Ramanasramam'],'mayavati':['Advaita Ashrama Mayavati','Mayavati Ashram'],'vedanta-hollywood':['Vedanta Temple Hollywood','Vedanta Society of Southern California'],
'rvc-ny':['Ramakrishna-Vivekananda Center'],'yss-ranchi':['Yogoda Satsanga Sakha Math','Yogoda Satsanga Ranchi'],'arsha-vidya-saylorsburg':['Arsha Vidya Gurukulam Saylorsburg','Arsha Vidya Gurukulam'],'sivananda-rishikesh':['Sivananda Ashram Rishikesh','Divine Life Society Rishikesh'],
'shree-muktananda-ashram':['Shree Muktananda Ashram','Muktananda Ashram South Fallsburg'],'cac':['Center for Action and Contemplation'],'bose':['Monastero di Bose'],'inchegiri-math':['Inchageri'],
'hartridge':['Hartridge Buddhist Monastery','Hartridge Monastery'],'wat-dhammasathit':['Wat Dhammasathit','วัดธรรมสถิต'],'dhammasara':['Dhammasara Nuns Monastery','Dhammasara'],'jhana-grove':['Jhana Grove'],'dhammaloka':['Dhammaloka Buddhist Centre','Dhammaloka Nollamara'],
'bodhivana':['Bodhivana Monastery'],'muttodaya':['Muttodaya'],'forest-hermitage-kandy':['Forest Hermitage Kandy','Udawattakele Forest Hermitage'],'hillside-hermitage':['Hillside Hermitage'],
'mahasi-sasana-yeiktha':['Mahasi Sasana Yeiktha','Mahasi Meditation Centre Yangon','Mahasi Yeiktha'],'chanmyay-yeiktha':['Chanmyay Yeiktha','Chanmyay Meditation Centre'],'panditarama':['Panditarama Shwe Taung Gon','Panditarama'],
'panditarama-lumbini':['Panditarama Lumbini','Panditarama International Vipassana'],'imc-yangon':['International Meditation Centre Inya Myaing','International Meditation Centre Yangon'],'imc-uk':['International Meditation Centre Splatts House','International Meditation Centre Heddington'],
'ledi-tawya':['Ledi Tawya','Ledi Monastery Monywa'],'imc-redwood-city':['Insight Meditation Center Redwood City','Insight Meditation Center'],'imcw':['Insight Meditation Community of Washington'],'cloud-mountain':['Cloud Mountain Retreat Center'],
'bhavana-society':['Bhavana Society'],'root-institute':['Root Institute Bodhgaya','Root Institute for Wisdom Culture'],'jamyang-london':['Jamyang Buddhist Centre'],'sera-bylakuppe':['Sera Jey Monastery','Sera Monastery Bylakuppe','Sera Mey Monastery'],
'gyuto':['Gyuto Monastery Sidhbari','Gyuto Tantric University','Gyuto Monastery'],'tergar-bodhgaya':['Tergar Monastery Bodhgaya','Tergar Monastery'],'deer-park-bir':['Deer Park Institute Bir','Deer Park Institute'],
'eiab':['Europäisches Institut für Angewandten Buddhismus','EIAB Waldbröl'],'maison-de-l-inspir':["Maison de l'Inspir"],'thai-plum-village':['Thai Plum Village','Plum Village Thailand'],'mountain-cloud':['Mountain Cloud Zen Center'],
'virupaksha-cave':['Virupaksha Cave','Virupaksha Guha'],'skandashram':['Skandashram','Skandasramam'],'annamalai-swami-ashram':['Annamalai Swami Ashram'],'vanmali-bhavan':['Vanmali Bhavan','Nisargadatta Maharaj'],
'satsang-bhavan-lucknow':['Satsang Bhavan Lucknow','Papaji Satsang Bhavan'],'monte-sahaja':['Monte Sahaja'],'anandamayi-kankhal':['Anandamayi Ma Ashram Kankhal','Anandamayee Ashram Kankhal','Ma Anandamayi Ashram Haridwar'],
'anandamayi-varanasi':['Anandamayi Ghat','Anandamayi Ashram Varanasi','Ma Anandamayi Ashram Bhadaini'],'srf-mother-center':['Self-Realization Fellowship Mother Center','Self-Realization Fellowship International Headquarters','Self-Realization Fellowship'],
'yss-dakshineswar':['Yogoda Satsanga Math Dakshineswar','Yogoda Math'],'babaji-cave':['Babaji Cave','Mahavatar Babaji Cave','Babaji Gufa'],'karar-ashram':['Karar Ashram Puri','Karar Ashram'],
'arsha-vidya-anaikatti':['Arsha Vidya Gurukulam Anaikatti','Arsha Vidya Gurukulam'],'vasanta-vihar':['Vasanta Vihar Chennai','Krishnamurti Foundation India'],'ishber-ashram':['Ishwar Ashram','Ishber Nishat'],
'bhairav-gufa-beerwah':['Bhairav Gufa Beerwah','Bhairav Gufa','Bhairav Cave'],'vedanta-uk':['Ramakrishna Vedanta Centre Bourne End','Ramakrishna Vedanta Centre'],'avila-encarnacion':['Monasterio de la Encarnación Ávila'],
'erfurt-predigerkirche':['Predigerkirche Erfurt'],'kf-ojai':['Krishnamurti Foundation of America Ojai','Pine Cottage Ojai','Krishnamurti Library Ojai']}
cf='../cache/osm.json'; out=json.load(open(cf)) if os.path.exists(cf) else {}
for k,qs in Qs.items():
    if k in out: continue
    res=[]
    for q in qs:
        u='https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=3&q='+urllib.parse.quote(q)
        try: r=json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30))
        except Exception as e: r=[]; print('ERR',k,e)
        time.sleep(1.1)
        res+=[dict(q=q,osm=f"{x['osm_type']}/{x['osm_id']}",name=x.get('name'),disp=x['display_name'][:110],lat=float(x['lat']),lng=float(x['lon']),cc=x.get('address',{}).get('country_code','').upper(),cat=x.get('category')+'/'+x.get('type')) for x in r]
        if res: break
    out[k]=res
    json.dump(out,open(cf,'w'),indent=0,ensure_ascii=False)
for k in Qs:
    r=out.get(k) or []
    print(k,'|',' ;; '.join(f"{x['osm']} {x['cc']} {x['lat']:.4f},{x['lng']:.4f} {x['disp'][:80]}" for x in r[:2]) or 'NONE')
