import json,urllib.request,urllib.parse,time
UA={'User-Agent':'WiserPlaces/0.1 (tradesprior@gmail.com)'}
alts={'cittaviveka':['Chithurst Buddhist Monastery','Cittaviveka'],'aruna-ratanagiri':['Aruna Ratanagiri','Harnham Buddhist Monastery'],'hartridge':['Hartridge Monastery'],
'wat-dhammasathit':['Wat Dhammasathit Rayong','Dhammasathit'],'dhammasara':['Dhammasara Monastery'],'jhana-grove':['Jhana Grove'],'dhammaloka':['Dhammaloka'],
'birken':['Birken Forest Buddhist Monastery'],'bodhivana':['Bodhivana'],'muttodaya':['Muttodaya Kloster'],'wat-suan-mokkh':['Suan Mokkh','Wat Suan Mokkh'],
'forest-hermitage-kandy':['Udawattakele Forest Hermitage','Udawatta Kele'],'hillside-hermitage':['Hillside Hermitage'],'mahasi-sasana-yeiktha':['Mahasi Meditation Centre','Mahasi Sasana Yeiktha'],
'chanmyay-yeiktha':['Chanmyay'],'panditarama':['Panditarama'],'shwe-oo-min':['Shwe Oo Min'],'imc-yangon':['International Meditation Centre Yangon','Inya Myaing'],
'imc-uk':['International Meditation Centre Heddington'],'ledi-tawya':['Ledi Tawya','Ledi Sayadaw monastery'],'dhamma-giri':['Dhamma Giri','Vipassana International Academy'],
'imc-redwood-city':['Insight Meditation Center Redwood City'],'imcw':['Insight Meditation Community of Washington'],'cloud-mountain':['Cloud Mountain Retreat'],'bhavana-society':['Bhavana Society'],
'root-institute':['Root Institute Bodhgaya'],'jamyang-london':['Jamyang Buddhist Centre'],'tsuglagkhang':['Tsuglagkhang Complex','Namgyal Monastery'],'sera-bylakuppe':['Sera Jey','Sera Monastery Bylakuppe'],
'gyuto':['Gyuto Tantric Monastery','Gyuto'],'tergar-bodhgaya':['Tergar Monastery Bodh Gaya'],'deer-park-bir':['Deer Park Institute'],'sherab-ling':['Sherabling','Palpung Sherabling'],
'eiab':['Europäisches Institut für Angewandten Buddhismus','European Institute of Applied Buddhism'],'maison-de-l-inspir':["Maison de l'Inspir"],'thai-plum-village':['Thai Plum Village'],
'tu-hieu':['Từ Hiếu','Tu Hieu Pagoda','chùa Từ Hiếu'],'upaya':['Upaya Institute and Zen Center','Upaya Zen'],'mountain-cloud':['Mountain Cloud Zen'],'hoen-ji':['Zen Center of Syracuse'],
'virupaksha-cave':['Virupaksha cave Arunachala'],'skandashram':['Skandasramam','Skandashram'],'annamalai-swami-ashram':['Annamalai Swami'],'rvc-ny':['Ramakrishna-Vivekananda Center'],
'vanmali-bhavan':['Vanmali Bhavan'],'inchegiri-math':['Inchgiri','Inchageri'],'satsang-bhavan-lucknow':['Satsang Bhavan'],'monte-sahaja':['Monte Sahaja'],
'anandamayi-kankhal':['Anandamayi Ma Ashram','Anandamayee Ashram Kankhal'],'anandamayi-varanasi':['Anandamayi Ghat'],'srf-mother-center':['Self-Realization Fellowship Mount Washington','Mount Washington Hotel Los Angeles'],
'yss-ranchi':['Yogoda Satsanga Sakha Math Ranchi','Yogoda Satsanga Society of India'],'yss-dakshineswar':['Yogoda Math Dakshineswar'],'babaji-cave':['Babaji cave','Dunagiri'],'karar-ashram':['Karar Ashram'],
'arsha-vidya-anaikatti':['Arsha Vidya Gurukulam Coimbatore'],'jyotirmath':['Jyotirmath','Jyotir Math monastery'],'sivananda-rishikesh':['Divine Life Society','Sivananda Ashram Rishikesh'],
'vasanta-vihar':['Vasanta Vihar','Krishnamurti Foundation India'],'ishber-ashram':['Ishber','Ishwar Ashram'],'bhairav-gufa-beerwah':['Bhairav Gufa','Bhairav cave Beerwah'],
'bose':['Bose Monastic Community','Comunità monastica di Bose'],'avila-encarnacion':['Monasterio de la Encarnación Ávila'],'erfurt-predigerkirche':['Predigerkirche Erfurt'],
'kf-ojai':['Krishnamurti Foundation of America','Pine Cottage Ojai'],'subiaco':['Sacro Speco','Monastery of Saint Scholastica Subiaco'],'delphi':['Delphi archaeological site','Delphi Greece'],
'assisi':['Basilica di San Francesco d\'Assisi','Basilica of San Francesco'],'bailin':['Bailin Chan Temple Zhaoxian','Zhaozhou Bailin'],'vedanta-uk':['Vedanta Centre Bourne End'],
'sri-ramanasramam':['Ramana Ashram']}
out={}
for k,qs in alts.items():
    res=[]
    for q in qs:
        r=json.load(urllib.request.urlopen(urllib.request.Request('https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&limit=4&search='+urllib.parse.quote(q),headers=UA),timeout=30))
        res+= [(x['id'],x.get('label'),x.get('description','')) for x in r.get('search',[])]
        time.sleep(0.1)
    out[k]=res
    print(k,'|',' ;; '.join(f"{a} {b} — {d[:55]}" for a,b,d in res[:5]) or 'NONE')
json.dump(out,open('../cache/search_alt.json','w'),ensure_ascii=False)
