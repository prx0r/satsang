#!/usr/bin/env python3
"""Assemble Wiser Place-layer outputs from caches (2026-10-20). Run from tools/.
Inputs: seed_places.py, seed_people.py, seed_retreats.py, qids.py, people_qids.py, ../cache/*.json, ../vipassana-centres.json
Outputs (../): places.json, lineages.json, retreats.json, countries.json, people-additions.json, edges-additions.json, traditions-additions.json
"""
import json, re, glob, os, sys, ssl, urllib.request, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seed_places import P
from seed_people import PP
from seed_retreats import RT
OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WISER = os.path.dirname(os.path.dirname(OUT))
C = lambda f: json.load(open(f'{OUT}/cache/{f}'))
wd, osm, ph, g2 = C('wd_places.json'), C('osm.json'), C('photon.json'), C('geo2.json')
urlc, wdp, isoN = C('urlcheck.json'), C('wd_people.json'), C('iso_names.json')
TODAY = '2026-10-20'

# ---------- existing graph ids ----------
def load(f, key):
    d = json.load(open(f)); return d[key] if key in d else d[[k for k in d if k != '_note'][0]]
app_people = {p['id']: p for p in load(f'{WISER}/app/wisegraph/people.json', 'people')}
app_trad = {n['id']: n for n in load(f'{WISER}/app/wisegraph/traditions.json', 'nodes')}
app_edges = load(f'{WISER}/app/wisegraph/edges.json', 'edges')
src_people = {}
for f in glob.glob(f'{WISER}/sources/*/people-additions.json'):
    if '/places/' in f: continue
    for p in load(f, 'people'): src_people.setdefault(p['id'], p)
src_trad = {}
for f in glob.glob(f'{WISER}/sources/*/traditions-additions.json'):
    if '/places/' in f: continue
    for n in load(f, 'nodes'): src_trad.setdefault(n['id'], n)

# ---------- new traditions ----------
NEW_TRAD = [
    dict(id='goenka-vipassana', label='Goenka Vipassana (U Ba Khin line)', kind='lineage', parent='burmese', wikidata=None,
         blurb='Lay Vipassana in the line of Ledi Sayadaw, Saya Thetgyi and U Ba Khin, taught by S. N. Goenka in 10-day dana-funded courses.'),
    dict(id='kagyu', label='Kagyu', kind='lineage', parent='tibetan', wikidata='Q471187',
         blurb='Tibetan school of the mahamudra lineage from Tilopa and Naropa through Marpa and Milarepa, led by the Karmapas.'),
    dict(id='nyingma', label='Nyingma', kind='lineage', parent='tibetan', wikidata='Q848771',
         blurb='The oldest Tibetan school, tracing to Padmasambhava, home of Dzogchen.'),
]
TRAD_OK = set(app_trad) | set(src_trad) | {t['id'] for t in NEW_TRAD}
TRAD_REMAP = {'christianity': 'christian'}

# ---------- people ----------
ID_REMAP = {'ranjit-maharaj': 'sri-ranjit-maharaj'}
SKIP_PEOPLE = {'anandamayi-ma', 'swami-sivananda', 'ranjit-maharaj'}  # already in app
BAD_WD = {'mingun-sayadaw'}  # search hit was Mingun Tipitakadhara Sayadaw (1911-1992), a different monk
SPEAKER_HINT = set()
new_people = []
for pid, q, name, trad, bio, aliases in PP:
    if pid in SKIP_PEOPLE or pid in app_people or pid in src_people: continue
    w = wdp.get(pid) if pid not in BAD_WD else None
    b, d = (w or {}).get('born'), (w or {}).get('died')
    years = None
    if isinstance(b, int):
        fmt = lambda y: f'{-y} BCE' if y < 0 else str(y)
        years = f"{fmt(b)}–{fmt(d) if isinstance(d, int) else ''}"
    living = None
    if w: living = (d is None) and isinstance(b, int) and b > 1915
    new_people.append(dict(id=pid, name=name, short=name, kind='figure', role='figure', tradition=trad, traditions=[trad],
        wikidata=w['qid'] if w else None, years=years, living=living, bio=bio, aliases=aliases, works=[],
        source='Wikidata ' + w['qid'] + f' (dates, {TODAY})' if w else 'no clean Wikidata item; dates not stated'))
PEOPLE_OK = set(app_people) | set(src_people) | {p['id'] for p in new_people}
pyears = {}
for p in list(app_people.values()) + list(src_people.values()) + new_people:
    pyears.setdefault(p['id'], p.get('years'))

# ---------- lineages & edges ----------
H, M = 'high', 'medium'
LIN = [
 ('thai-forest-mun-lee', 'Thai Forest: Ajahn Mun → Ajaan Lee → Ajaan Fuang → Thanissaro', 'thai-forest',
  [('ajahn-sao','ajahn-mun',H),('ajahn-mun','ajaan-lee',H),('ajaan-lee','ajahn-fuang',H),('ajahn-fuang','thanissaro-bhikkhu',H)]),
 ('thai-forest-mun-chah', 'Thai Forest: Ajahn Mun → Ajahn Chah and his Western disciples', 'thai-forest',
  [('ajahn-mun','ajahn-chah',H),('ajahn-chah','ajahn-sumedho',H),('ajahn-chah','ajahn-pasanno',H),('ajahn-chah','ajahn-brahm',H),('ajahn-chah','ajahn-amaro',H),
   ('ajahn-sumedho','ajahn-amaro',H),('ajahn-chah','ajahn-liem',H),('ajahn-chah','ajahn-jayasaro',M),('ajahn-chah','ajahn-viradhammo',H),('ajahn-chah','ajahn-munindo',H),
   ('ajahn-sumedho','ajahn-sucitto',H),('ajahn-chah','jack-kornfield',H)]),
 ('thai-forest-mun-other', 'Thai Forest: other disciples of Ajahn Mun', 'thai-forest',
  [('ajahn-mun','ajahn-maha-boowa',H),('ajahn-mun','ajahn-thate',H)]),
 ('ledi-goenka', 'Ledi Sayadaw → Saya Thetgyi → U Ba Khin → S. N. Goenka', 'goenka-vipassana',
  [('ledi-sayadaw','saya-thetgyi',H),('saya-thetgyi','u-ba-khin',H),('u-ba-khin','goenka',H),('u-ba-khin','sayamagyi',H)]),
 ('mahasi', 'Mingun Jetavana Sayadaw → Mahasi Sayadaw → U Pandita / Chanmyay / Munindra → Western Insight', 'burmese',
  [('mingun-sayadaw','mahasi-sayadaw',H),('mahasi-sayadaw','sayadaw-u-pandita',H),('mahasi-sayadaw','chanmyay-sayadaw',H),('mahasi-sayadaw','anagarika-munindra',H),
   ('anagarika-munindra','joseph-goldstein',H),('anagarika-munindra','dipa-ma',H),('dipa-ma','sharon-salzberg',H),('dipa-ma','joseph-goldstein',M),
   ('sayadaw-u-pandita','joseph-goldstein',M),('sayadaw-u-pandita','sharon-salzberg',M),('sayadaw-u-pandita','jack-kornfield',M)]),
 ('shwe-oo-min', 'Shwe Oo Min Sayadaw → Sayadaw U Tejaniya', 'burmese', [('shwe-oo-min-sayadaw','sayadaw-u-tejaniya',H)]),
 ('island-hermitage', 'Nyanatiloka and the Island Hermitage line', 'theravada',
  [('nyanatiloka','nyanaponika',H),('nyanatiloka','nanavira-thera',M),('nyanaponika','bhikkhu-bodhi',M)]),
 ('hillside', 'Hillside Hermitage: Ajahn Nyanamoli and students', 'early-suttas',
  [('ajahn-nyanamoli','bhikkhu-anigha',H),('ajahn-nyanamoli','thaniyo-thero',H),('ajahn-nyanamoli','sister-medhini',H)]),
 ('kagyu-golden-rosary', 'Kagyu: Tilopa → Naropa → Marpa → Milarepa → Gampopa → 1st Karmapa', 'kagyu',
  [('tilopa','naropa',H),('naropa','marpa',H),('marpa','milarepa',H),('milarepa','gampopa',H),('gampopa','karmapa-1',H)]),
 ('kagyu-west', 'Kagyu and Nyingma teachers in the West', 'kagyu',
  [('chogyam-trungpa','pema-chodron',H),('tulku-urgyen','mingyur-rinpoche',H),('tulku-urgyen','tsoknyi-rinpoche',H),('tulku-urgyen','chokyi-nyima-rinpoche',H)]),
 ('gelug', 'Gelug: tutors of the 14th Dalai Lama; FPMT founders', 'gelug',
  [('ling-rinpoche','dalai-lama',H),('trijang-rinpoche','dalai-lama',H),('lama-yeshe','lama-zopa',H)]),
 ('soto-suzuki', 'Soto Zen: Shunryu Suzuki line (San Francisco Zen Center)', 'soto-zen',
  [('gyokujun-so-on','shunryu-suzuki',H),('kishizawa-ian','shunryu-suzuki',H),('shunryu-suzuki','richard-baker',H)]),
 ('soto-sawaki', 'Soto Zen: Kodo Sawaki → Kosho Uchiyama → Shohaku Okumura (Antaiji)', 'soto-zen',
  [('kodo-sawaki','kosho-uchiyama',H),('kosho-uchiyama','shohaku-okumura',H),('gudo-nishijima','brad-warner',H)]),
 ('sanbo-maezumi', 'Yasutani → Kapleau / Maezumi → Glassman, Loori → Halifax', 'zen',
  [('hakuun-yasutani','philip-kapleau',H),('hakuun-yasutani','taizan-maezumi',H),('taizan-maezumi','bernie-glassman',H),('taizan-maezumi','john-daido-loori',H),('bernie-glassman','joan-halifax',H)]),
 ('plum-village', 'Tu Hieu Temple → Thich Nhat Hanh', 'plum-village', [('thich-chan-that','thich-nhat-hanh',H)]),
 ('ramana', 'Ramana Maharshi → Papaji, Annamalai Swami → Mooji, Gangaji', 'advaita',
  [('ramana-maharshi','papaji',H),('ramana-maharshi','annamalai-swami',H),('papaji','mooji',H),('papaji','gangaji',H)]),
 ('inchegeri', 'Inchegeri: Bhausaheb → Siddharameshwar → Nisargadatta, Ranjit', 'inchegeri',
  [('bhausaheb-maharaj','siddharameshwar-maharaj',H),('siddharameshwar-maharaj','nisargadatta-maharaj',H),('siddharameshwar-maharaj','sri-ranjit-maharaj',H),
   ('nisargadatta-maharaj','ramesh-balsekar',H)]),
 ('lakshmanjoo', 'Kashmir Shaivism: Swami Ram → Mahatab Kak → Lakshmanjoo', 'kashmir-shaivism',
  [('swami-ram-kashmir','swami-mahtab-kak',H),('swami-mahtab-kak','swami-lakshmanjoo',H),('swami-lakshmanjoo','john-hughes',H),('swami-lakshmanjoo','alexis-sanderson',M)]),
 ('trika-classical', 'Kashmir Shaivism (classical): Lakshmanagupta → Abhinavagupta → Kshemaraja', 'kashmir-shaivism',
  [('lakshmanagupta','abhinavagupta',H),('abhinavagupta','kshemaraja',H)]),
 ('siddha-yoga', 'Bhagawan Nityananda → Swami Muktananda (Siddha Yoga)', 'kashmir-shaivism', [('bhagawan-nityananda','muktananda',H)]),
 ('ramakrishna', 'Ramakrishna → Vivekananda, Brahmananda', 'ramakrishna-order',
  [('ramakrishna','swami-vivekananda',H),('ramakrishna','swami-brahmananda',H)]),
 ('sivananda-chinmaya', 'Sivananda → Chinmayananda → Dayananda → Tadatmananda', 'vedanta',
  [('swami-sivananda','swami-chinmayananda',H),('swami-chinmayananda','swami-dayananda-saraswati',H),('swami-dayananda-saraswati','swami-tadatmananda',H)]),
 ('kriya', 'Kriya Yoga: Babaji → Lahiri Mahasaya → Sri Yukteswar → Yogananda', 'kriya-yoga',
  [('mahavatar-babaji','lahiri-mahasaya',H),('lahiri-mahasaya','sri-yukteswar',H),('sri-yukteswar','paramahansa-yogananda',H)]),
 ('christian-contemplative', 'Christian contemplative: Centering Prayer and Shantivanam', 'christian-mysticism',
  [('thomas-keating','cynthia-bourgeault',H)]),
]
INFL = [('ramana-maharshi','abhishiktananda',H,'Le Saux met Ramana in 1949; it reshaped his life'),
        ('abhishiktananda','bede-griffiths',M,'Griffiths took over Shantivanam after Le Saux')]
LINEAGE_OF = [('tsongkhapa','gelug'),('karmapa-1','kagyu'),('padmasambhava','nyingma'),('bodhidharma','zen'),('vasugupta','kashmir-shaivism'),
              ('goenka','goenka-vipassana'),('thich-nhat-hanh','plum-village'),('bhausaheb-maharaj','inchegeri')]
existing = {(e['from'], e['to'], e['type']) for e in app_edges}
src_edges = set()
for f in glob.glob(f'{WISER}/sources/*/edges-additions.json'):
    if '/places/' in f: continue
    for e in load(f, 'edges'): src_edges.add((e['from'], e['to'], e['type']))
missing_ids = set()
lineages, new_edges, all_lin_edges = [], [], []
def mk(a, b, typ, conf, note=None):
    for x in (a, b):
        if x not in PEOPLE_OK and x not in TRAD_OK: missing_ids.add(x)
    e = dict(**{'from': a, 'to': b}, type=typ, conf=conf)
    if note: e['note'] = note
    return e
for lid, label, trad, chain in LIN:
    edges = []
    for a, b, conf in chain:
        e = mk(a, b, 'teacher_of', conf)
        status = 'in-app' if (a, b, 'teacher_of') in existing else ('in-other-source' if (a, b, 'teacher_of') in src_edges else 'new')
        edges.append(dict(e, from_years=pyears.get(a), to_years=pyears.get(b), status=status))
        if status == 'new' and (a, b) not in {(x['from'], x['to']) for x in new_edges}: new_edges.append(e)
    members = []
    for e in edges:
        for x in (e['from'], e['to']):
            if x not in members: members.append(x)
    lineages.append(dict(id=lid, label=label, tradition=trad, members=members, edges=edges))
for a, b, conf, note in INFL:
    e = mk(a, b, 'influenced', conf, note)
    if (a, b, 'influenced') not in existing: new_edges.append(e)
for a, t in LINEAGE_OF:
    e = mk(a, t, 'lineage_of', H)
    if (a, t, 'lineage_of') not in existing and (a, t, 'lineage_of') not in src_edges: new_edges.append(e)

# ---------- coordinates ----------
OSM_PICK = {  # place id -> (cache, osm id, precision)
 'aruna-ratanagiri':('osm','node/1469823576','site'),'santacittarama':('osm','way/848477475','site'),'bps-kandy':('osm','node/4420064289','site'),
 'nissarana-vanaya':('osm','node/1571683688','site'),'nagi-gompa':('osm','way/206938169','site'),'mayavati':('osm','node/7479937248','site (charitable hospital inside the ashram campus)'),
 'vedanta-hollywood':('osm','node/358828059','site'),'arsha-vidya-saylorsburg':('osm','node/5938999101','site'),'bose':('osm','relation/10214666','site'),
 'inchegiri-math':('osm','node/1435574634','village'),'hartridge':('osm','way/966988412','site'),'jhana-grove':('osm','way/130003582','site'),
 'dhammaloka':('osm','node/443546519','site'),'bodhivana':('osm','node/4331636890','site'),'muttodaya':('osm','way/211242567','site'),
 'mahasi-sasana-yeiktha':('osm','node/4476533713','site'),'panditarama':('osm','node/5075111921','site'),'panditarama-lumbini':('osm','node/3494422031','site'),
 'imc-uk':('ph','N/9353891383','site'),'ledi-tawya':('ph','R/3591203','site'),'imc-redwood-city':('ph','W/240418201','site'),'root-institute':('ph','N/5351909821','site'),
 'jamyang-london':('ph','W/340420733','site'),'gyuto':('ph','W/227387579','site'),'tergar-bodhgaya':('ph','W/312606488','site'),'deer-park-bir':('ph','W/493568469','site'),
 'eiab':('ph','W/420079907','site'),'thai-plum-village':('ph','N/5530557621','site'),'mountain-cloud':('ph','N/357590922','site'),'virupaksha-cave':('ph','N/2154075221','site'),
 'skandashram':('ph','W/1553558898','site'),'monte-sahaja':('ph','N/4887303830','site'),'anandamayi-varanasi':('ph','N/1538127086','ghat beside the ashram'),
 'yss-dakshineswar':('ph','N/11270909654','site'),'vasanta-vihar':('ph','W/188445647','site'),'ishber-ashram':('ph','N/1795367771','site'),'erfurt-predigerkirche':('ph','W/30528740','site'),
 'sivananda-rishikesh':('ph','W/323211395','site'),
 'ims-barre':('g2','way/9275078','street address'),'bcbs':('g2','way/211967902','street address'),'karme-choling':('g2','node/12737745609','street address'),
 'cac':('g2','way/172346153','street address'),'srf-mother-center':('g2','way/927956822','site'),'rvc-ny':('g2','way/266940373','street address'),
 'anandamayi-kankhal':('g2','node/2377440464','locality (Kankhal)'),'arsha-vidya-anaikatti':('g2','node/245589432','village (Anaikatti)'),
 'vanmali-bhavan':('g2','node/245655646','locality (Khetwadi); exact building not mapped'),'bhairav-gufa-beerwah':('g2','node/6724075376','town (Beerwah); cave not mapped'),
}
EXTRA_PH = {'sri-ramanasramam':('W/619680753',12.22401,79.05677,'site'),'kf-ojai':('W/604046806',34.45891,-119.18324,'site'),
            'yss-ranchi':('W/287120329',23.35452,85.33488,'site'),'maison-de-l-inspir':('W/267552120',48.87177,3.33547,'site'),
            'babaji-cave':('N/342105049',29.84024,79.45175,'village (Kukuchina trailhead); cave not mapped')}
def osm_coord(pid):
    if pid in EXTRA_PH:
        o, la, ln, pr = EXTRA_PH[pid]; return la, ln, f'OSM {o} via Photon', pr
    if pid not in OSM_PICK: return None
    src, oid, pr = OSM_PICK[pid]
    pool = {'osm': osm, 'ph': ph, 'g2': g2}[src].get(pid, [])
    for x in pool:
        if x['osm'] == oid: return x['lat'], x['lng'], f"OSM {oid} via {'Nominatim' if src != 'ph' else 'Photon'}", pr
    return None

# ---------- urls ----------
from urls_seed import U
URL_OVERRIDE = {'ltwa': 'https://tibetanlibrary.org', 'vedanta-sf': 'https://www.sfvedanta.org', 'tisarana': 'https://tisarana.ca', 'vasanta-vihar': 'https://www.jkrishnamurti.in',
                'maison-de-l-inspir': 'https://www.maisondelinspir.org', 'sri-ramanasramam': 'https://www.sriramanamaharshi.org', 'arunachala': None, 'virupaksha-cave': 'https://www.sriramanamaharshi.org',
                'skandashram': 'https://www.sriramanamaharshi.org', 'coptic-museum': 'https://egymonuments.gov.eg/en/museums/the-coptic-museum', 'iona-abbey': 'https://www.historicenvironment.scot/visit-a-place/places/iona-abbey-and-nunnery/',
                'sera-bylakuppe': 'https://www.serajeymonastery.org/', 'sera-je': None, 'namdroling': 'https://www.namdroling.net/', 'sivananda-rishikesh': 'https://www.sivanandaonline.org',
                'tassajara': 'https://www.sfzc.org/locations/tassajara', 'green-gulch': 'https://www.sfzc.org/locations/green-gulch-farm', 'sfzc-city-center': 'https://www.sfzc.org/locations/city-center',
                'wat-suan-mokkh': 'https://www.suanmokkh-idh.org', 'subiaco': 'https://monasterosanbenedettosubiaco.it/', 'srf-encinitas': 'https://encinitastemple.org', 'srf-lake-shrine': 'https://lakeshrine.org',
                'ims-barre': 'https://www.dharma.org', 'santacittarama': 'https://www.santacittarama.org', 'zen-mountain-monastery': 'https://zmm.org', 'gethsemani': 'https://monks.org', 'snowmass': None,
                'kopan': 'https://kopanmonastery.org/', 'babaji-cave': None, 'karar-ashram': 'https://kararashram.org', 'shaolin': None, 'rumtek': None, 'shwe-oo-min': None, 'chanmyay-yeiktha': None,
                'panditarama': None, 'swayambhunath': None, 'kushinagar': None, 'jyotirmath': None, 'goerlitz-boehme': None, 'arunachaleswarar': None, 'amarnath': None, 'potala': None,
                'shwedagon': None, 'vedanta-uk': None, 'shantivanam': None, 'island-hermitage': None, 'bodhivana': None, 'vimutti': None, 'annamalai-swami-ashram': None,
                'kf-ojai': 'https://www.kfa.org', 'jhana-grove': 'https://bswa.org/location/jhana-grove-meditation-retreat-centre/', 'dhammasara': 'https://bswa.org/location/dhammasara-nuns-monastery/',
                'dhammaloka': 'https://bswa.org/location/dhammaloka-buddhist-centre/', 'bodhinyana': 'https://bswa.org/location/bodhinyana-monastery/', 'satsang-bhavan-lucknow': 'https://www.avadhuta.com',
                'mayavati': 'https://advaitaashrama.org', 'rmic': 'https://www.sriramakrishna.org', 'anandamayi-varanasi': 'https://www.anandamayi.org', 'anandamayi-kankhal': 'https://www.anandamayi.org',
                'ltwa2': None, 'bhavana-society': 'https://bhavanasociety.org', 'ilt-pomaia': 'https://www.iltk.org', 'rochester-zen-center': 'https://www.rzc.org', 'sojiji': 'https://www.sojiji.jp',
                'hoen-ji': 'https://www.zencenterofsyracuse.org', 'wat-ram-poeng': None, 'ishber-ashram': 'https://www.ishwarashramtrust.com', 'palyul': None, 'kagyu-samye-dzong-london': 'https://www.london.samye.org',
                'samye-ling': 'https://www.samyeling.org', 'goetheanum': 'https://goetheanum.ch', 'assisi': 'https://www.sanfrancescoassisi.org', 'st-catherine-sinai': 'https://www.sinaimonastery.com',
                'temple-of-the-tooth': 'https://www.sridaladamaligawa.lk', 'global-vipassana-pagoda': 'https://www.globalpagoda.org', 'gaia-house': 'https://gaiahouse.co.uk', 'wat-pah-pong': 'https://www.watnongpahpong.org',
                'wat-asokaram': 'https://www.watasokaram.org', 'metta-forest': 'https://www.watmetta.org', 'abhayagiri': 'https://www.abhayagiri.org', 'amaravati': 'https://amaravati.org', 'cittaviveka': 'https://cittaviveka.org',
                'aruna-ratanagiri': 'https://www.ratanagiri.org.uk', 'birken': 'https://www.birken.ca', 'wat-pah-ban-taad': 'https://www.luangta.com', 'na-uyana': 'https://nauyana.org', 'nissarana-vanaya': 'https://www.nissarana.lk',
                'bps-kandy': 'https://www.bps.lk', 'deer-park-monastery': 'https://deerparkmonastery.org', 'upaya': 'https://www.upaya.org', 'zcla': 'https://zcla.org', 'dai-bosatsu': None, 'engakuji': 'https://www.engakuji.or.jp',
                'myoshinji': 'https://www.myoshinji.or.jp/english/', 'rishi-valley': 'https://www.rishivalley.org', 'brockwood': 'https://www.brockwood.org.uk', 'dakshineswar': 'https://www.dakshineswarkalitemple.org',
                'belur-math': 'https://belurmath.org', 'vedanta-ny': 'https://www.vedantany.org', 'yss-ranchi': 'https://yssofindia.org', 'yss-dakshineswar': 'https://yssofindia.org', 'bose': 'https://www.monasterodibose.it',
                'gampo-abbey': 'https://gampoabbey.org', 'spirit-rock': 'https://www.spiritrock.org', 'throssel-hole': 'https://throssel.org.uk', 'eiheiji': 'https://daihonzan-eiheiji.com/en/', 'antaiji': 'https://antaiji.org',
                'plum-village': 'https://plumvillage.org', 'ka-nying-shedrub-ling': 'https://shedrub.org', 'tergar-osel-ling': 'https://tergar.org', 'tergar-bodhgaya': 'https://tergar.org', 'imc-uk': 'https://internationalmeditationcentre.org/',
                'imc-yangon': None, 'dhamma-giri': 'https://giri.dhamma.org', 'monte-sahaja': 'https://mooji.org', 'shree-muktananda-ashram': 'https://www.siddhayoga.org', 'gurudev-siddha-peeth': 'https://www.siddhayoga.org',
                'pa-auk-tawya': 'https://www.paaukforestmonastery.org/', 'mahabodhi': 'https://bodhgayatemple.com', 'lumbini': 'https://lumbinidevtrust.gov.np', 'sringeri': 'https://www.sringeri.net', 'tushita-dharamsala': 'https://tushita.info',
                'root-institute': 'https://rootinstitute.ngo', 'jamyang-london': 'https://jamyang.co.uk', 'tsuglagkhang': 'https://namgyalmonastery.org', 'holy-isle': 'https://www.holyisle.org', 'ktd': 'https://kagyu.org',
                'lerab-ling': 'https://www.lerabling.org', 'dzogchen-beara': 'https://dzogchenbeara.org', 'karme-choling': 'https://www.karmecholing.org', 'shambhala-mountain': 'https://www.dralamountain.org', 'deer-park-bir': 'https://www.deerpark.in',
                'sherab-ling': 'https://www.palpung.org', 'eiab': 'https://eiab.eu', 'thai-plum-village': 'https://thaiplumvillage.org', 'mountain-cloud': 'https://www.mountaincloud.org', 'blue-cliff': 'https://www.bluecliffmonastery.org',
                'magnolia-grove': 'https://magnoliagrovemonastery.org', 'sanshin-zen': 'https://www.sanshinji.org', 'imc-redwood-city': 'https://www.insightmeditationcenter.org', 'imcw': 'https://imcw.org', 'cloud-mountain': 'https://cloudmountain.org',
                'bcbs': 'https://www.buddhistinquiry.org', 'chenrezig-institute': 'https://www.chenrezig.com.au', 'hartridge': 'https://www.hartridgemonastery.org', 'dhammapala': 'https://dhammapala.ch', 'muttodaya': 'https://muttodaya.org',
                'bodhinyanarama': 'https://bodhinyanarama.net.nz', 'mahasi-sasana-yeiktha': 'https://www.mahasi.org.mm', 'panditarama-lumbini': 'https://www.panditarama-lumbini.info', 'hillside-hermitage': 'https://www.hillsidehermitage.org',
                'arsha-vidya-saylorsburg': 'https://arshavidya.org', 'arsha-vidya-anaikatti': 'https://www.arshavidya.in', 'vedanta-hollywood': 'https://vedanta.org', 'rvc-ny': 'https://www.ramakrishna.org', 'srf-mother-center': 'https://yogananda.org',
                'cac': 'https://cac.org', 'taize': 'https://www.taize.fr', 'spencer-abbey': 'https://spencerabbey.org', 'new-camaldoli': 'https://contemplation.com', 'grande-chartreuse': 'https://www.chartreux.org',
                'rudolf-steiner-house': 'https://www.rsh.anth.org.uk', 'ts-adyar': 'https://www.ts-adyar.org', 'sri-maha-bodhi': None, 'wat-pah-nanachat': 'https://www.watpahnanachat.org'}
VERIFIED_BY_FETCH = {'https://tibetanlibrary.org', 'https://www.sfvedanta.org', 'https://tisarana.ca', 'https://www.maisondelinspir.org', 'https://www.jkrishnamurti.in', 'https://kfionline.org'}
def url_status(u):
    if not u: return None
    if u in VERIFIED_BY_FETCH: return 'ok (verified via fetch; blocked from sandbox)'
    r = urlc.get(u)
    if not r: return 'unchecked'
    if r['status'] == 200: return 'ok'
    if r['status'] in (202, 403): return f"resolves (HTTP {r['status']} bot protection)"
    return f"FAIL {r['status']}"
def pick_url(pid):
    if pid in URL_OVERRIDE: return URL_OVERRIDE[pid]
    cands = list(wd.get(pid, {}).get('web', [])) + ([U[pid]] if U.get(pid) else [])
    for c in cands:
        for v in (c, 'https://' + c[7:] if c.startswith('http://') else c):
            if urlc.get(v, {}).get('status') == 200: return v
    return None

# ---------- curated places ----------
BAD_INCEPTION = {'sfzc-city-center', 'abhayagiri', 'kalady', 'delphi', 'brockwood', 'coptic-museum', 'jyotirmath', 'lerab-ling'}
PLACE_TRAD_REMAP = {'anandamayi-kankhal': ['anandamayi-sangha'], 'anandamayi-varanasi': ['anandamayi-sangha'], 'sivananda-rishikesh': ['divine-life-society']}
NAME_FIX = {'shambhala-mountain': 'Drala Mountain Center (formerly Shambhala Mountain Center)', 'tsuglagkhang': 'Tsuglagkhang complex (Namgyal Monastery)',
            'sera-je': 'Sera Monastery (Lhasa)', 'vanmali-bhavan': "Nisargadatta Maharaj's flat, Vanmali Bhavan, Khetwadi"}
TEACHER_REMAP = {'ranjit-maharaj': 'sri-ranjit-maharaj'}
places, problems = [], []
for pid, q, typ, trads, iso, city, teachers, desc, offers, lang in P:
    w = wd.get(pid)
    lat = lng = None; csrc = cprec = None
    if w and w.get('lat') is not None:
        lat, lng, csrc, cprec = w['lat'], w['lng'], f"Wikidata {w['qid']} P625", 'as recorded on Wikidata'
    else:
        oc = osm_coord(pid)
        if oc: lat, lng, csrc, cprec = oc
    if pid == 'dhamma-giri':
        vc = {c['subdomain']: c for c in json.load(open(f'{OUT}/vipassana-centres.json'))['centres']}
        if 'giri' in vc: lat, lng, csrc, cprec = vc['giri']['lat'], vc['giri']['lng'], 'dhamma.org map', 'site'
    founded = None
    if w and w.get('inception') and pid not in BAD_INCEPTION:
        m = re.search(r'([+-])0*(\d{1,4})-', w['inception']) or re.search(r'(\+)\w{3} (\d{4})-', w['inception'])
        if m: founded = int(m.group(2)) * (-1 if m.group(1) == '-' else 1)
    wc = [c for c in (w or {}).get('country', []) if c]
    if wc and iso not in wc: problems.append(f'{pid}: my country {iso} vs Wikidata {wc}')
    tr = PLACE_TRAD_REMAP.get(pid, [TRAD_REMAP.get(t, t) for t in trads])
    for t in tr:
        if t not in TRAD_OK: problems.append(f'{pid}: unknown tradition {t}')
    tids = [TEACHER_REMAP.get(t, t) for t in teachers]
    for t in tids:
        if t not in PEOPLE_OK: missing_ids.add(t)
    u = pick_url(pid)
    places.append(dict(id=pid, name=NAME_FIX.get(pid, q if not w else (w.get('label') or q)), type=typ, traditions=tr, country=iso,
        country_name=isoN.get(iso), city=city, lat=round(lat, 6) if lat is not None else None, lng=round(lng, 6) if lng is not None else None,
        coord_source=csrc, coord_precision=cprec, founded=founded, founded_source=f"Wikidata {w['qid']} P571" if founded is not None else None,
        teacher_ids=tids, url=u, url_status=url_status(u), wikidata=w['qid'] if w else None, description=desc or None,
        offers=offers, language=lang, source='curated'))

# ---------- Goenka centres (dhamma.org) ----------
VC = json.load(open(f'{OUT}/vipassana-centres.json'))['centres']
def chk(u):
    ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=20, context=ctx); return u, r.status
    except urllib.error.HTTPError as e: return u, e.code
    except Exception: return u, 0
need = [c['schedule_url'] for c in VC if urlc.get(c['schedule_url'], {}).get('status') != 200]
need += [('https://' + c['url'][7:] if c['url'] and c['url'].startswith('http://') else c['url']) for c in VC if c['url']]
need = [u for u in set(need) if u and urlc.get(u, {}).get('status') != 200]
if need and os.environ.get('CHECK', '1') == '1':
    with cf.ThreadPoolExecutor(32) as ex:
        for u, s in ex.map(chk, need): urlc[u] = dict(url=u, status=s, final=u, title='')
    json.dump(urlc, open(f'{OUT}/cache/urlcheck.json', 'w'), indent=0, ensure_ascii=False)
curated_ids = {p['id'] for p in places}
vipassana_places = []
for c in VC:
    if c['subdomain'] == 'ss' and not c['country']: c['country'] = 'SS'
    c['coord_precision'] = 'site (dhamma.org map pin)' if c['is_center'] else 'country/region centroid used by dhamma.org for non-centre course sites'
    hu = 'https://' + c['url'][7:] if c['url'] and c['url'].startswith('http://') else c['url']
    c['url'] = hu; c['url_status'] = url_status(hu)
    if c['url_status'] and c['url_status'].startswith('FAIL'): c['url_failed'] = hu; c['url'] = None; c['schedule_url_status'] = url_status(c['schedule_url'])
    c['country_name'] = isoN.get(c['country'])
    if not c['is_center']: continue
    if c['id'] in curated_ids:
        for p in places:
            if p['id'] == c['id']: p['schedule_url'] = c['schedule_url']; p['dhamma_subdomain'] = c['subdomain']
        continue
    vipassana_places.append(dict(id=c['id'], name=c['name'], type='retreat-centre', traditions=['goenka-vipassana'], country=c['country'], country_name=c['country_name'],
        city=c['city'], lat=c['lat'], lng=c['lng'], coord_source='dhamma.org/en-US/maps', coord_precision='site (dhamma.org map pin)', founded=c['founded'],
        founded_source='dhamma.org directory: first course year' if c['founded'] else None, teacher_ids=['goenka'], url=c['url'], url_status=c['url_status'],
        schedule_url=c['schedule_url'], wikidata=None, description=f"{c['name']}: a centre in S. N. Goenka's Vipassana network running 10-day residential courses on a donation basis.",
        offers=['residential retreats', '10-day courses'], language=None, source='dhamma.org directory', dhamma_subdomain=c['subdomain']))
json.dump({'_note': 'S. N. Goenka Vipassana centres and non-centre course sites parsed from dhamma.org directory + maps (fetched 2026-10-20). Non-centre sites carry the country/region centroid dhamma.org uses, not a venue. url_status / schedule_url_status checked 2026-10-20.', 'centres': VC},
          open(f'{OUT}/vipassana-centres.json', 'w'), indent=1, ensure_ascii=False)
ALL = places + vipassana_places
json.dump({'_note': f'Wiser Place layer v1 ({TODAY}). Curated monasteries, retreat centres, ashrams, temples, pilgrimage and study sites per tradition, plus every Goenka Vipassana centre from dhamma.org. Coordinates: Wikidata P625 first, else OpenStreetMap (Nominatim/Photon) with coord_precision stated; null where no verified point. founded: Wikidata P571 (or dhamma.org first-course year). url_status from a live check on {TODAY}. Descriptions are Wiser\'s own words. teacher_ids are founders or teachers historically tied to the place, not a claim about who teaches there now.',
           'types': ['monastery', 'retreat-centre', 'ashram', 'temple', 'pilgrimage', 'study-centre'], 'places': ALL},
          open(f'{OUT}/places.json', 'w'), indent=1, ensure_ascii=False)

# ---------- retreats ----------
PIDS = {p['id'] for p in ALL}
retreats = []
for pid, name, length, fmt, cost, url in RT:
    if pid not in PIDS: problems.append(f'retreat for unknown place {pid}')
    retreats.append(dict(id=f"{pid}--{re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')[:40]}", place_id=pid, name=name, typical_length=length, format=fmt,
                         cost_model=cost, schedule_url=url, url_status=url_status(url)))
for c in vipassana_places + [p for p in places if p.get('dhamma_subdomain')]:
    retreats.append(dict(id=f"{c['id']}--10-day", place_id=c['id'], name='10-day Vipassana course (Goenka)', typical_length='10 days (also 3-day, Satipatthana, 20- to 60-day for old students where offered)',
                         format='silent residential course with recorded instructions by S. N. Goenka, conducted by assistant teachers', cost_model='dana: no charge; donations only from those who have completed a course',
                         schedule_url=c['schedule_url'], url_status=url_status(c['schedule_url'])))
json.dump({'_note': f'Recurring retreat programmes per place ({TODAY}). No dates are stored: schedule_url points at the official page that lists current dates. cost_model is the usual model for that place; confirm on the page.', 'retreats': retreats},
          open(f'{OUT}/retreats.json', 'w'), indent=1, ensure_ascii=False)

# ---------- countries ----------
parent = {}
for d in (app_trad, src_trad):
    for k, n in d.items(): parent.setdefault(k, n.get('parent'))
for t in NEW_TRAD: parent[t['id']] = t['parent']
def family(t):
    seen = 0
    while parent.get(t) and seen < 10: t = parent[t]; seen += 1
    return t
countries = {}
for p in ALL:
    cc = p['country'] or 'ZZ'
    c = countries.setdefault(cc, dict(iso2=cc, name=isoN.get(cc), places=0, traditions={}, families={}, types={}, vipassana_centres=0, place_ids=[]))
    c['places'] += 1; c['place_ids'].append(p['id']); c['types'][p['type']] = c['types'].get(p['type'], 0) + 1
    if p['source'] == 'dhamma.org directory' or p.get('dhamma_subdomain'): c['vipassana_centres'] += 1
    for t in p['traditions']: c['traditions'][t] = c['traditions'].get(t, 0) + 1
    for f in {family(t) for t in p['traditions']}: c['families'][f] = c['families'].get(f, 0) + 1
for c in VC:
    if not c['is_center']:
        cc = c['country'] or 'ZZ'
        x = countries.setdefault(cc, dict(iso2=cc, name=isoN.get(cc), places=0, traditions={}, families={}, types={}, vipassana_centres=0, place_ids=[]))
        x['vipassana_noncentre_sites'] = x.get('vipassana_noncentre_sites', 0) + 1
clist = sorted(countries.values(), key=lambda c: -c['places'])
json.dump({'_note': f'Per-country counts ({TODAY}) from places.json (curated + Goenka centres) and vipassana-centres.json non-centre sites. traditions counts a place once per tradition it lists; families rolls up to the top-level tradition family.', 'countries': clist},
          open(f'{OUT}/countries.json', 'w'), indent=1, ensure_ascii=False)

# ---------- graph additions ----------
json.dump({'_note': f'places group people additions ({TODAY}). Same shape as app/wisegraph/people.json entries; all role/kind figure (official-video check not done in this pass). years and living from Wikidata P569/P570 where an item exists; living=true means no death date on Wikidata and born after 1915. Bios are Wiser\'s own words. Existing ids (anandamayi-ma, swami-sivananda, sri-ranjit-maharaj) are not duplicated.',
           'people': new_people,
           'patches': [dict(id='thanissaro-bhikkhu', add_aliases=['geoffrey degraff', 'geoff degraff', 'ajaan geoff', 'than geoff'], note='Thanissaro Bhikkhu was born Geoffrey DeGraff; aliases let clips that say "Ajaan Geoff" match.')]},
          open(f'{OUT}/people-additions.json', 'w'), indent=1, ensure_ascii=False)
json.dump({'_note': f'places group edges ({TODAY}). Same shape as app/wisegraph/edges.json. Only edges not already in app/wisegraph/edges.json or another sources/*/edges-additions.json.', 'edges': new_edges},
          open(f'{OUT}/edges-additions.json', 'w'), indent=1, ensure_ascii=False)
json.dump({'_note': f'places group tradition nodes ({TODAY}).', 'nodes': NEW_TRAD}, open(f'{OUT}/traditions-additions.json', 'w'), indent=1, ensure_ascii=False)
json.dump({'_note': f'Lineage trees ({TODAY}) as teacher_of chains. status: in-app = already in app/wisegraph/edges.json; in-other-source = proposed by another sources/ group; new = in edges-additions.json here. *_years from the person records (Wikidata dates). conf: high = textbook, medium = widely stated but looser (e.g. studied with rather than formal heir).',
           'lineages': lineages, 'influenced': [dict(**{'from': a, 'to': b}, conf=c, note=n) for a, b, c, n in INFL], 'lineage_of': [dict(**{'from': a, 'to': t}) for a, t in LINEAGE_OF]},
          open(f'{OUT}/lineages.json', 'w'), indent=1, ensure_ascii=False)

stats = dict(curated=len(places), vipassana_centres=len(vipassana_places), all_places=len(ALL), vc_all=len(VC), retreats=len(retreats), people=len(new_people), edges=len(new_edges),
             lineages=len(lineages), countries=len(clist), missing_ids=sorted(missing_ids), problems=problems,
             no_coords=[p['id'] for p in places if p['lat'] is None], no_url=[p['id'] for p in places if not p['url']],
             bad_urls=[(p['id'], p['url'], p['url_status']) for p in ALL if p['url'] and p['url_status'] and not p['url_status'].startswith(('ok', 'resolves'))],
             bad_sched=[(r['place_id'], r['schedule_url'], r['url_status']) for r in retreats if not (r['url_status'] or '').startswith(('ok', 'resolves'))])
json.dump(stats, open(f'{OUT}/cache/build_stats.json', 'w'), indent=1, ensure_ascii=False)
print(json.dumps({k: (v if not isinstance(v, list) or len(v) < 60 else f'{len(v)} items') for k, v in stats.items()}, indent=1, ensure_ascii=False))
