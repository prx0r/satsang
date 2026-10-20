import json,urllib.request,urllib.parse,time,os
UA={'User-Agent':'WiserPlaces/0.2 (tradesprior@gmail.com)'}
# (id, query, precision, source-of-address)
Q=[
('ksd-cardiff','250 Cowbridge Road East, Cardiff','address','address published on london.samye.org affiliated centres'),
('portobello-priory','27 Brighton Place, Edinburgh','address','address published by obcon.org'),
('telford-priory','The Rock, Telford','street','address published by obcon.org (49 The Rock)'),
('turning-wheel-temple','Chadderton Close, Leicester','street','address published by obcon.org'),
('ts-nottingham','73 Maid Marian Way, Nottingham','address','address published by theosophicalsociety.org.uk'),
('glasgow-buddhist-centre','72 Berkeley Street, Glasgow','address','venue published by triratna.scot'),
('edinburgh-buddhist-centre','Ormidale Terrace, Edinburgh','street','venue published by triratna.scot'),
('ksd-highlands','Upper Drumbuie, Drumnadrochit','locality','address published by samyeling.org'),
('buddhist-society','Eccleston Square, London','street','Buddhist Society address, 58 Eccleston Square'),
('julian-centre-norwich','St Julian\'s Church, Norwich','building','OSM'),
('ksd-glasgow','Lochwinnoch','town','address published by ksdglasgow.org.uk (Lochside House)'),
('great-ocean-dharma-refuge','Felindre Farchog','village','address published by obcon.org'),
('dragon-bell-temple','Shillingford St George','village','obcon/throssel list'),
('forest-hermitage-uk','Sherbourne, Warwick','village',''),
('birmingham-buddhist-vihara','Dhammatalaka Peace Pagoda','building','OSM'),
('samatha-trust-greenstreete','Llangunllo','village',''),
('sharpham-trust','Sharpham House, Ashprington','building','OSM'),
('maenllwyd','Rhayader','town',''),
('land-of-joy','Otterburn, Northumberland','village',''),
('lam-rim-wales','Raglan','village',''),
('palpung-wales','Brynmawr','town',''),
('dzogchen-community-uk','Llandrindod Wells','town',''),
('padmaloka','Surlingham','village',''),
('vajraloka','Corwen','town',''),
('rivendell','High Hurstwood','village',''),
('wat-sanghathan','Handsworth, Birmingham','district',''),
('karuna-bhavan','Lesmahagow','village',''),
('vedanta-uk','Blind Lane, Bourne End','street','RVC address (Blind Lane House, Bourne End)'),
('bk-global-retreat-centre','Nuneham House','building','OSM'),
('chinmaya-uk','Harrow','town',''),
('central-gurdwara-london','Queensdale Road, London','street','Central Gurdwara, 62 Queensdale Road'),
('alnmouth-friary','Alnmouth','village',''),
('northumbria-community','Felton, Northumberland','village',''),
('glenthorne','Glenthorne, Grasmere','building','OSM'),
('odinist-fellowship-temple','Newark-on-Trent','town',''),
('chalice-orchard','Glastonbury','town',''),
('obod','Lewes','town','OBOD office town'),
('library-of-avalon','Glastonbury','town',''),
('isle-of-avalon-foundation','Glastonbury','town',''),
('gothic-image','Gothic Image, High Street, Glastonbury','building','OSM'),
('blythe-road','Blythe Road, Hammersmith','street','Wikipedia: 36 Blythe Road'),
('sasana-ramsi','Colindale','district',''),
('santimiterama','Watford','town',''),
('wat-charoen-bhavana','Manchester','city',''),
('iona-community-camas','Camas, Fionnphort','locality',''),
('arcturus-books','Totnes','town',''),
('maharishi-garden-village','Rainford','village',''),
('tiratanaloka','Brecon','town',''),
('dechen-sheffield','Sheffield','city',''),
('sheffield-buddhist-centre','Sheffield','city',''),
('krishnamurti-centre','Brockwood Park','building','OSM'),
('liverpool-buddhist-centre','Liverpool','city',''),('norwich-buddhist-centre','Norwich','city',''),('nottingham-buddhist-centre','Nottingham','city',''),
('oxford-buddhist-centre','Oxford','city',''),('southampton-buddhist-centre','Southampton','city',''),('worcester-buddhist-centre','Worcester','city',''),
('ipswich-buddhist-centre','Ipswich','town',''),('leeds-buddhist-centre','Leeds','city',''),('llangollen-buddhist-centre','Llangollen','town',''),
('mid-essex-buddhist-centre','Chelmsford','city',''),('brighton-buddhist-centre','Brighton','city',''),('brixton-buddhist-centre','Brixton','district',''),
('birmingham-buddhist-centre-x','x','x',''),
('ibn-arabi-society','Oxford','city',''),('ts-scotland','Great King Street, Edinburgh','street','TS Scotland, 28 Great King Street'),
('doreen-valiente-foundation','Brighton','city',''),('helios-fountain','Edinburgh','city',''),('speaking-tree','Glastonbury','town',''),
('buddhist-society-bookshop','Cambridge','city',''),('samatha-manchester','Manchester','city',''),
('telford-x','x','x',''),
]
C='../cache/photon2.json'; out=json.load(open(C)) if os.path.exists(C) else {}
for k,q,prec,src in Q:
    if q=='x' or k in out: continue
    u='https://photon.komoot.io/api/?limit=3&lang=en&bbox=-8.7,49.8,1.8,60.9&q='+urllib.parse.quote(q)
    try: f=json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=25))['features']
    except Exception as e: f=None
    time.sleep(1)
    out[k]=dict(q=q,prec=prec,src=src,res=[dict(name=x['properties'].get('name'),street=x['properties'].get('street'),city=x['properties'].get('city') or x['properties'].get('county'),cat=x['properties'].get('osm_key')+'/'+x['properties'].get('osm_value'),lat=x['geometry']['coordinates'][1],lng=x['geometry']['coordinates'][0],osm=f"{x['properties'].get('osm_type')}/{x['properties'].get('osm_id')}") for x in (f or [])])
    json.dump(out,open(C,'w'))
for k,v in out.items():
    r=v['res'][0] if v['res'] else None
    print(f"{k:28s} {v['q'][:30]:30s} -> {(r['name'] or '')[:28] if r else 'NONE':28s} | {(r['city'] or '')[:15] if r else ''} | {r['cat'] if r else ''} | {r and round(r['lat'],4)},{r and round(r['lng'],4)}")
