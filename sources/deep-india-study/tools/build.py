# Build all deep-india-study outputs from tools/data_*.py + raw/ + cache/ (no network).
import json, os, re, sys, collections
T = os.path.dirname(os.path.abspath(__file__)); B = os.path.join(T, '..'); W = os.path.join(B, '..', '..')
sys.path.insert(0, T)
from data_places import PLACES, V
from data_people import PEOPLE, EDGES, RESOURCES

SPK_REMAP = {'swami-chidananda': 'swami-chidananda-saraswati', 'anand-ramanan': 'venkat-s-ramanan'}
PLACE_REMAP = {'arsha-vidya-gurukulam-saylorsburg': 'arsha-vidya-saylorsburg', 'arsha-vidya-gurukulam-anaikatti': 'arsha-vidya-anaikatti',
               'divine-life-society-rishikesh': 'sivananda-rishikesh', 'sringeri-sharada-peetham': 'sringeri'}
NAMES = {p['id']: p['name'] for p in PEOPLE}
app_people = {p['id']: p for p in json.load(open(os.path.join(W, 'app', 'wisegraph', 'people.json')))['people']}
NAMES.update({k: v['name'] for k, v in app_people.items() if k not in NAMES})
NAMES['kym-faculty'] = 'KYM faculty'

# ---------- topics ----------
tt = json.load(open(os.path.join(W, 'app', 'schema', 'topics.json')))['tree']
TOP = []
def walk(node, path):
    for k, v in node.items():
        if isinstance(v, dict) and 'label' in v:
            p = path + [k]; TOP.append(('/'.join(p), [re.compile(r'\b(?:%s)\b' % x, re.I) for x in v.get('kw', [])]))
            walk(v, p)
walk(tt, [])
TOPIDS = {t for t, _ in TOP}
RU = [(r'кундалин', 'meditation/kundalini'), (r'мантр', 'meditation/mantra'), (r'медитац|дхьян', 'meditation'), (r'пранаям|дыхан', 'meditation/breath'),
      (r'гуру', 'guru'), (r'тантр|шива-сутр|виджнян', 'texts/tantra'), (r'асан|хатха', 'meditation/hatha'), (r'пробужд', 'awakening'), (r'смерт', 'death'),
      (r'карм', 'kamma'), (r'аюрвед', 'daily-life'), (r'богин|деви|шакти', 'divine/goddess'), (r'ученичеств|посвящ', 'guru')]
DEFAULT = {'arsha-vidya': 'self/self-enquiry', 'siddha-siddhanta': 'meditation/hatha', 'svara-yoga': 'meditation/breath', 'gelug': 'texts', 'gelug-fpmt': 'texts',
           'patanjala-yoga': 'meditation', 'krishnamacharya': 'meditation/mantra', 'sringeri': 'guru', 'ramana': 'self/self-enquiry', 'vedanta-yoga': 'meditation', 'trika': 'texts/tantra'}
def tag(title, school):
    hits = []
    for tid, rxs in TOP:
        if any(r.search(title) for r in rxs): hits.append(tid)
    for rx, tid in RU:
        if re.search(rx, title, re.I) and tid in TOPIDS: hits.append(tid)
    # prefer specific leaves, de-dup parents when a child is present
    hits = list(dict.fromkeys(hits)); hits = [h for h in hits if not any(o != h and o.startswith(h + '/') for o in hits)]
    tags = [[h, 0.9, 'title'] for h in hits[:4]]
    if not tags:
        d = DEFAULT.get(school, 'texts'); tags = [[d if d in TOPIDS else 'texts', 0.5, 'school-default']]
    return tags
def lang(title):
    if re.search(r'[а-яА-Я]', title): return ['ru', 0.95, 'script']
    if re.search(r'[\u0F00-\u0FFF]', title): return ['bo', 0.95, 'script']
    if re.search(r'[\u0C80-\u0CFF]', title): return ['kn', 0.9, 'script']
    if re.search(r'[\u0B80-\u0BFF]', title): return ['ta', 0.9, 'script']
    if re.search(r'[\u0C00-\u0C7F]', title): return ['te', 0.9, 'script']
    if re.search(r'[\u0900-\u097F]', title): return ['hi', 0.8, 'script']
    return ['en', 0.7, 'rule']
def band(sec): return 'short' if sec < 600 else 'mid' if sec <= 1200 else 'long'
def embed(vid):
    f = os.path.join(B, 'cache', 'yt', 'cache', 'embed', vid + '.json')
    return json.load(open(f)) if os.path.exists(f) else {}

def row(r, kind):
    e = embed(r['id']); sid = SPK_REMAP.get(r['speaker'], r['speaker'])
    if e.get('oembed') != 200 or not e.get('playableInEmbed'): return None
    if re.search(r'Chief Guest|Children Yoga Course|Alumni', r['title']): return None
    orient = 'horizontal' if (e.get('o_w') or 0) > (e.get('o_h') or 0) else 'vertical'
    sec = e.get('dur') or r['sec']
    tags = tag(r['title'], r['school'])
    return dict(id=r['id'], teacher=NAMES.get(sid, sid), speaker=sid, speakerFrom=r['speakerFrom'], role='teacher', title=r['title'], ytTitle=e.get('o_title') or r['title'],
                channel=e.get('o_author') or r['channel'], channelId=r['channelId'], kind='human', media='youtube', checked=V, dur=sec, sec=sec,
                format=orient, orientation=orient, orientationFrom='oembed', carrier=r['carrier'], setting='talk', region=r['region'], tradition=r['tradition'],
                school=r['school'], traditions=sorted({r['tradition'], r['school']}), figures=[], place=PLACE_REMAP.get(r['place'], r['place']),
                topics=[t[0] for t in tags], published=None, year=r.get('year'), views=r.get('views'),
                tags={'v': 1, 'topics': tags, 'lang': lang(r['title']), 'band': band(sec)}, embed={'oembed': 200, 'playableInEmbed': True, 'checked': V},
                wholeTalk=True, officialLink=r['officialLink'], alsoInGroups=[])
clips = [x for x in (row(r, 'clip') for r in json.load(open(os.path.join(B, 'raw', 'cand_capped.json')))) if x]
longs = [x for x in (row(r, 'long') for r in json.load(open(os.path.join(B, 'raw', 'long_dedup.json')))) if x]
for l in longs: l['wholeTalk'] = False; l['note'] = 'over 60 min: listed only; no virtual clips cut this pass'
cc = collections.Counter(c['speaker'] for c in clips); lc = collections.Counter(c['speaker'] for c in longs)
json.dump(clips, open(os.path.join(B, 'clips.json'), 'w'), ensure_ascii=False, indent=1)
json.dump(longs, open(os.path.join(B, 'long-lectures.json'), 'w'), ensure_ascii=False, indent=1)

# ---------- places ----------
geo = json.load(open(os.path.join(B, 'cache', 'geocode.json')))
app_places = {p['id']: p for p in json.load(open(os.path.join(W, 'app', 'wisegraph', 'places.json')))['places']}
REJECT = {'Gangchen Kyishong'}
BUILDING = {'place_of_worship', 'school', 'university', 'attraction', 'company', 'healthcare'}
out_places = []
for p in PLACES:
    p = dict(p); rid = p.pop('reuse_id', None); q = p.pop('geocode', None)
    if rid and rid in app_places:
        ap = app_places[rid]; p.setdefault('lat', ap.get('lat')); p.setdefault('lng', ap.get('lng')); p.setdefault('coord_precision', ap.get('coord_precision'))
        p['existing'] = 'app/wisegraph/places.json'; p['wikidata'] = ap.get('wikidata')
    elif 'lat' not in p:
        g = geo.get(q) if q and q not in REJECT else None
        if g and 'lat' in g:
            p['lat'], p['lng'] = round(g['lat'], 6), round(g['lng'], 6)
            p['coord_precision'] = ('osm-building' if g.get('type') in BUILDING and g.get('name') and any(w.lower() in (g['name'] or '').lower() for w in q.split(',')[0].split()[:2]) else
                                    'osm-city' if g.get('type') in ('city', 'administrative') else 'osm-area (approximate)')
            p['coord_source'] = 'OpenStreetMap via Photon: ' + str(g.get('name'))
        else:
            p['lat'] = p['lng'] = None; p['coord_precision'] = None
    if p['id'] in ('samvidalaya-varanasi','ishwar-ashram-trust-delhi','swara-yoga-peeth-rishikesh','arsha-vidya-pitham-rishikesh','ifp-pondicherry','efeo-pondicherry','muktabodha-indological-research-institute'): p['coord_precision'] = 'osm-area (approximate)'
    p.setdefault('wikidata', None)
    p['clip_count'] = sum(1 for c in clips if c['place'] == p['id'])
    out_places.append(p)
alive = collections.Counter(p['alive']['status'] for p in out_places)
json.dump({'_note': 'deep-india-study places (2026-10-20): living places to study/practise in India and Nepal (+3 key sister/online bodies). Shape follows sources/places-uk (id,name,type,traditions,country,city,lat,lng,coord_precision,teachers,url,wikidata) plus lineage, study, apply, contact (official published contacts only), language, cost_notes, upcoming[{title,dates,as_of,source_url}], alive{status: alive|dormant|unknown, evidence}, source_url, verified_on, confidence. existing = same place already in app/wisegraph/places.json (same id: merge). Dates are as printed by the source; dates in the past are kept as evidence of life.',
           'places': out_places}, open(os.path.join(B, 'places.json'), 'w'), ensure_ascii=False, indent=1)

# ---------- people ----------
dt = {p['id'] for p in json.load(open(os.path.join(W, 'sources', 'deep-tantra', 'people.json')))['people']}
out_people = []
for p in PEOPLE:
    p = dict(p); p.setdefault('kind', 'speaker' if (cc[p['id']] + lc[p['id']]) else 'figure')
    if p['id'] in app_people and 'existing' not in p: p['existing'] = 'app'
    p['clip_count'] = cc[p['id']]; p['long_lectures_listed'] = lc[p['id']]
    p['tier'] = 'main' if cc[p['id']] >= 8 else 'more-voices' if cc[p['id']] or lc[p['id']] else 'graph-only'
    out_people.append(p)
# speakers that already exist in app/deep-tantra: add count-only update records
known = {p['id'] for p in out_people}
for sid in sorted(set(cc) | set(lc)):
    if sid in known: continue
    out_people.append({'id': sid, 'name': NAMES.get(sid, sid), 'existing': 'app' if sid in app_people else ('deep-tantra' if sid in dt else None), 'update': True,
                       'clip_count': cc[sid], 'long_lectures_listed': lc[sid], 'tier': 'main' if cc[sid] >= 8 else 'more-voices', 'verified_on': V})
json.dump({'_note': 'deep-india-study people. role teacher|scholar|figure|institution. tier main >= 8 embeddable clips in this group; more-voices 1-7 clips or only long lectures; graph-only = lineage node. existing = id already present in app/wisegraph/people.json ("app") or sources/deep-tantra ("deep-tantra"): merge fields, do not duplicate. update:true rows carry only counts/corrections.',
           'main': sorted(p['id'] for p in out_people if p.get('tier') == 'main'), 'more_voices': sorted(p['id'] for p in out_people if p.get('tier') == 'more-voices'),
           'people': out_people}, open(os.path.join(B, 'people.json'), 'w'), ensure_ascii=False, indent=1)
json.dump({'_note': 'Edges typed teacher_of | academic_supervisor_of | influenced | translated | founded (person->org/place) | abbot_of (head/director/president of a place) | teaches_at. conf high = stated in the cited source; medium = secondary or inferred; source_url on every edge.',
           'edges': EDGES}, open(os.path.join(B, 'lineages.json'), 'w'), ensure_ascii=False, indent=1)
json.dump({'_note': 'deep-india-study resources: legitimate links only (official sites, publishers, author-posted or open-access PDFs). access free|paid|mixed. Unauthorised archive.org/scribd/pdfcoffee uploads of Dyczkowski books were seen and deliberately NOT listed.',
           'resources': RESOURCES}, open(os.path.join(B, 'resources.json'), 'w'), ensure_ascii=False, indent=1)
print('places', len(out_places), dict(alive), 'clips', len(clips), 'long', len(longs), 'people', len(out_people), 'edges', len(EDGES), 'resources', len(RESOURCES))
print('clips/speaker', cc.most_common()); print('long/speaker', lc.most_common())
print('no coords', [p['id'] for p in out_places if p.get('lat') is None])
print('topics', collections.Counter(t for c in clips for t in c['topics']).most_common(25))
