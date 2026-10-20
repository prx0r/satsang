import json,urllib.request,urllib.parse,time
import graph_data as G
UA={'User-Agent':'WiserPlaces/0.2 (tradesprior@gmail.com)'}
SR={'modern-paganism':'Modern paganism','druidry':'Neo-Druidism','wicca':'Wicca','heathenry':'Heathenry','goddess-spirituality':'Goddess movement',
'western-magic':'Ceremonial magic','golden-dawn':'Hermetic Order of the Golden Dawn','thelema':'Thelema','sufism':'Sufism','naqshbandi':'Naqshbandi',
'inayati':'Inayati Order','akbarian':'Akbarian','kabbalah':'Kabbalah','quaker':'Quakers','christian-meditation':'World Community for Christian Meditation',
'benedictine':'Order of Saint Benedict','cistercian':'Cistercians','franciscan':'Franciscans','carmelite':'Carmelites','ignatian':'Ignatian spirituality',
'celtic-christianity':'Celtic Christianity','orthodox-hesychasm':'Hesychasm','triratna':'Triratna Buddhist Community','fpmt':'Foundation for the Preservation of the Mahayana Tradition',
'new-kadampa':'New Kadampa Tradition','sakya':'Sakya','shambhala':'Shambhala Buddhism','serene-reflection':'Order of Buddhist Contemplatives','nipponzan-myohoji':'Nipponzan-Myōhōji-Daisanga',
'sikh':'Sikhism','iskcon':'International Society for Krishna Consciousness','gaudiya-vaishnava':'Gaudiya Vaishnavism','swaminarayan':'Swaminarayan Sampradaya',
'sivananda-yoga-vedanta':'Sivananda Yoga Vedanta Centres','satyananda-yoga':'Satyananda Yoga','brahma-kumaris':'Brahma Kumaris','transcendental-meditation':'Transcendental Meditation',
'swedenborgian':'Swedenborgianism','spiritualism':'Spiritualism'}
out={}
for t in G.TRAD:
    s=SR.get(t[0]); 
    if not s: continue
    r=json.load(urllib.request.urlopen(urllib.request.Request('https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=3&search='+urllib.parse.quote(s),headers=UA),timeout=30))
    h=r['search'][0] if r['search'] else None
    out[t[0]]=dict(qid=h['id'],label=h.get('label'),desc=h.get('description','')) if h else None
    print(t[0],'|',h and (h['id'],h.get('label'),h.get('description','')[:60]))
    time.sleep(0.2)
json.dump(out,open('../cache/trad_wd.json','w'),indent=0)
