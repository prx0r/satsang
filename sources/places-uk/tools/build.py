"""Wiser Place layer, UK-first deep pass (2026-10-20).
Regenerates every output in work/wiser/sources/places-uk/ from the caches in ../cache/.
Run from tools/:  python3 build.py
Inputs (all cached, no network needed for a rebuild):
  seeds_*.py                curated UK places; sister_seeds.py abroad sister places; people_seed.py; graph_data.py
  ../cache/wd_search.json, wd_ent.json, wd_pick.json   Wikidata matches (wd_resolve.py)
  ../cache/photon.json, photon2.json                    OSM Photon geocodes (photon.py, geo_fallback.py)
  ../cache/urlcheck.json, html/                         live URL checks + homepages (urlcheck.py)
  ../cache/people_wd.json, sister_wd.json, sister_photon.json, trad_wd.json
  ../../places/places.json                              earlier places group (ids reused, never edited)
Rules: metadata only; never guess an email (none are stored); no dates for events, only usual month + official page.
"""
import json, os, re, sys, hashlib, html as H, urllib.parse, difflib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seeds import S
from sister_seeds import A
from people_seed import P
import graph_data as G
import overrides as O

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = lambda f: os.path.join(ROOT, 'cache', f)
OUT = lambda f: os.path.join(ROOT, f)
WISER = os.path.dirname(os.path.dirname(ROOT))
TODAY = '2026-10-20'
def J(f, d=None):
    return json.load(open(f)) if os.path.exists(f) else d

wd_pick = J(C('wd_pick.json'), {}); wd_ent = J(C('wd_ent.json'), {})
for _k, _q in O.WD_FORCE.items(): wd_pick[_k] = [_q, 1.0]
ph = J(C('photon.json'), {}); ph2 = J(C('photon2.json'), {}); ph3 = J(C('photon3.json'), {})
uc = J(C('urlcheck.json'), {})
pwd = J(C('people_wd.json'), {}); swd = J(C('sister_wd.json'), {}); sph = J(C('sister_photon.json'), {})
trad_wd = J(C('trad_wd.json'), {})
old = {p['id']: p for p in J(os.path.join(WISER, 'sources/places/places.json'))['places']}

# ---------- existing graph ids (read only) ----------
def L(f, k):
    d = J(f, [])
    if isinstance(d, dict): d = d.get(k) or d.get('nodes') or d.get('people') or d.get('edges') or []
    return [x for x in d if isinstance(x, dict)]
import glob
APP = os.path.join(WISER, 'app/wisegraph')
known_people = {x['id'] for x in L(os.path.join(APP, 'people.json'), 'people')}
known_trad = {x['id'] for x in L(os.path.join(APP, 'traditions.json'), 'traditions')}
known_edges = {(e['from'], e['to'], e['type']) for e in L(os.path.join(APP, 'edges.json'), 'edges')}
for f in glob.glob(os.path.join(WISER, 'sources/*/people-additions.json')):
    if '/places-uk/' in f: continue
    known_people |= {x['id'] for x in L(f, 'people') if 'id' in x}
for f in glob.glob(os.path.join(WISER, 'sources/*/traditions-additions.json')):
    if '/places-uk/' in f: continue
    known_trad |= {x['id'] for x in L(f, 'nodes') if 'id' in x}
for f in glob.glob(os.path.join(WISER, 'sources/*/edges-additions.json')):
    if '/places-uk/' in f: continue
    known_edges |= {(e['from'], e['to'], e['type']) for e in L(f, 'edges') if 'from' in e}

# ---------- URL resolution ----------
def variants(u):
    out = [u]
    if u.startswith('http://'): out.append('https://' + u[7:])
    b = out[-1]
    if b.startswith('https://www.'): out.append('https://' + b[12:])
    elif b.startswith('https://'): out.append('https://www.' + b[8:])
    return out
BOT = {202: 'HTTP 202', 403: 'HTTP 403', 429: 'HTTP 429', 500: 'HTTP 500', 522: 'HTTP 522'}
BAD_TITLE = re.compile(r'casino|gamstop|betting|slot sites|plesk|domain (is )?for sale|parked|coming soon|default web site page', re.I)
hijacked = []
def resolve_url(cands):
    cands = [c for c in cands if c]
    for c in cands:
        for v in variants(c):
            r = uc.get(v)
            if r and r['status'] == 200:
                if BAD_TITLE.search(r.get('title') or ''):
                    hijacked.append((v, r['title'][:60])); continue
                return v, 'ok', None
    for c in cands:
        for v in variants(c):
            r = uc.get(v)
            if r and r['status'] in BOT:
                return v, f"resolves ({BOT[r['status']]}: server answered, blocks bots)", None
    for c in cands:
        for v in variants(c):
            r = uc.get(v)
            if r and r['status'] == 0:
                return c, 'unverified (sandbox proxy refused the host; direct check and a fetch retry both failed)', None
    failed = [v for c in cands for v in variants(c) if v in uc]
    return None, None, (failed[0] if failed else None)

def page_html(u):
    f = C('html/' + hashlib.md5(u.encode()).hexdigest() + '.html')
    return open(f, encoding='utf-8', errors='ignore').read() if os.path.exists(f) else None

A_RE = re.compile(r'<a\b[^>]*href=["\']([^"\'#]+)["\'][^>]*>(.*?)</a>', re.S | re.I)
SCHED_WORDS = [('retreat', 5), ('programme', 4), ('program', 4), ('whats-on', 4), ("what's on", 4), ('events', 3), ('calendar', 3),
               ('timetable', 3), ('schedule', 3), ('classes', 2), ('courses', 2), ('visiting', 1), ('visit', 1)]
def links(u):
    h = page_html(u)
    if not h: return []
    final = uc.get(u, {}).get('final') or u
    out = []
    for href, txt in A_RE.findall(h):
        t = re.sub(r'<[^>]+>', ' ', txt); t = H.unescape(re.sub(r'\s+', ' ', t)).strip()
        if href.startswith(('mailto:', 'tel:', 'javascript:')): continue
        a = urllib.parse.urljoin(final, H.unescape(href))
        if urllib.parse.urlparse(a).netloc.replace('www.', '') != urllib.parse.urlparse(final).netloc.replace('www.', ''): continue
        out.append((a, t))
    return out
def segs(a):
    return [x for x in urllib.parse.urlparse(a).path.split('/') if x]
def sane(a):
    return not re.search(r'[*\s{}<>]', a)
def contact_page(u):
    ls = [(a, t) for a, t in links(u) if sane(a)]
    for a, t in ls:  # a page whose own slug is the contact page
        sg = segs(a)
        if sg and re.fullmatch(r'contact(-us|-me|us)?(\.html?|\.php)?|get-in-touch|find-us', sg[-1], re.I) and len(sg) <= 3: return a
    for a, t in ls:
        if re.fullmatch(r'(contact( us)?|get in touch)', t, re.I) and len(segs(a)) <= 2: return a
    return None
def schedule_page(u):
    best = None
    for a, t in links(u):
        s = (a + ' ' + t).lower()
        if not sane(a) or len(segs(a)) > 2 or 'mc-events' in a or re.search(r'20\d\d', a) or re.search(r'dana|private|boating|getting-here|hire|venue|donat|shop|class(es)?/[a-z]', a.lower()):
            continue  # dated one-off pages and non-programme pages are not schedule links
        for w, sc in SCHED_WORDS:
            if w in s:
                sc2 = sc + (1 if urllib.parse.urlparse(a).path.count('/') <= 2 else 0)
                if not best or sc2 > best[1]: best = (a, sc2, t)
                break
    return best[0] if best else None

# ---------- coordinates ----------
def coord_for(k, name):
    p = wd_pick.get(k)
    if p and k not in O.WD_REJECT:
        e = wd_ent[p[0]]
        if e['lat'] is not None:
            return e['lat'], e['lng'], f"Wikidata {p[0]} P625", 'as recorded on Wikidata'
    if k in O.PH_ACCEPT and ph.get(k):
        x = ph[k][0]
        return x['lat'], x['lng'], f"OpenStreetMap {x['osm']} via Photon ('{x['name']}')", O.PH_PREC.get(k, 'building')
    if k in O.PH3_ACCEPT and ph3.get(k):
        x = ph3[k][0]
        return x['lat'], x['lng'], f"OpenStreetMap {x['osm']} via Photon ('{x['name']}')", 'building'
    if k in ph2 and k not in O.FB_REJECT and ph2[k]['res']:
        x = ph2[k]['res'][0]
        src = f"OpenStreetMap {x['osm']} via Photon (query '{ph2[k]['q']}')" + (f"; {ph2[k]['src']}" if ph2[k]['src'] else '')
        return x['lat'], x['lng'], src, O.FB_PREC_OVERRIDE.get(k, ph2[k]['prec'])
    if k == 'the-vedanta-branston':
        return 53.193893, -0.4700913, "OpenStreetMap via Photon (village of Branston; venue address published on rupertspira.com)", 'village'
    if k == 'krishnamurti-centre' and old.get('brockwood'):
        o = old['brockwood']; return o['lat'], o['lng'], 'same estate as Brockwood Park (sources/places)', 'estate (Brockwood Park)'
    if k in old and old[k].get('lat') is not None:
        o = old[k]; return o['lat'], o['lng'], o['coord_source'] + ' (sources/places)', o['coord_precision']
    return None, None, None, None

def year_of(t):
    m = re.match(r'[+-](\d{4})', t or ''); return int(m.group(1)) if m else None

ISO = {'GB': 'United Kingdom', 'IN': 'India', 'US': 'United States', 'FR': 'France', 'CA': 'Canada', 'ES': 'Spain'}
NATION = lambda lat, lng, city: None

# ---------- build UK places ----------
places = []; gaps = []
for s in S:
    k, name, typ, trads, city, url, teachers, desc, offers = s
    if k in O.DROP: continue
    name2, city2 = O.PH_RENAME.get(k, (name, city))
    pk = wd_pick.get(k) if k not in O.WD_REJECT else None
    e = wd_ent.get(pk[0]) if pk else None
    cands = [O.URL_FIX.get(k) or url] + ((e['web'][:1]) if e else [])
    u, ustat, ufail = resolve_url(cands) if k not in O.URL_BLOCK else (None, None, None)
    desc = O.DESC_FIX.get(k, desc)
    lat, lng, csrc, cprec = coord_for(k, name)
    if lat is None:
        gaps.append((k, 'no verified coordinates'))
    if u is None:
        gaps.append((k, 'no official URL' + (f' (failed: {ufail})' if ufail else '')))
    founded = year_of(e['inception']) if e and e.get('inception') else None
    rec = dict(id=k, name=name2, type=typ, traditions=trads.split(), country='GB', country_name='United Kingdom', city=city2 or None,
               lat=round(lat, 6) if lat is not None else None, lng=round(lng, 6) if lng is not None else None,
               coord_source=csrc, coord_precision=cprec, founded=founded,
               founded_source=(f"Wikidata {pk[0]} P571" if founded else None),
               teacher_ids=[t for t in teachers.split() if t], url=u, url_status=ustat, url_checked=TODAY if u else None,
               contact_page=None, contact_page_source=None, schedule_url=None, schedule_source=None,
               wikidata=pk[0] if pk else None, wikidata_note=O.WD_NOTE.get(k), enwiki=(e or {}).get('enwiki'),
               description=desc, offers=[o for o in offers.split('|') if o], language='en', source='curated (places-uk)')
    if ufail and not u:
        rec['url_failed'] = ufail
        bad = [t for v, t in hijacked if v == ufail]
        if bad: rec['url_failed_reason'] = 'live page shows unrelated content: ' + bad[0]
    if k in O.URL_BLOCK: rec['url_removed'] = O.URL_BLOCK[k]
    if u and ustat == 'ok':
        cp = contact_page(u)
        if cp: rec['contact_page'] = cp; rec['contact_page_source'] = f'link published on {u} (read {TODAY})'
        sp = schedule_page(u) if typ not in ('sacred-site',) else None
        if sp and any(w in ' '.join(rec['offers']) for w in ['retreat', 'class', 'course', 'sit', 'festival', 'study', 'meeting', 'guest', 'workshop', 'programme', 'pilgrim', 'visit', 'school', 'talk', 'event', 'langar', 'worship', 'service', 'kirtan', 'satsang', 'dhikr', 'lecture', 'gathering', 'symposia', 'rites', 'moots', 'ceremon', 'books']):
            rec['schedule_url'] = sp; rec['schedule_source'] = f'link published on {u} (read {TODAY}); no dates stored'
    places.append(rec)

ids_uk = {p['id'] for p in places}

# ---------- sisters: new abroad places ----------
sister_places = []
for s in A:
    k, name, typ, trads, cc, city, url, teachers, desc, _ = s
    w = swd.get(k); lat = lng = None; csrc = cprec = None; qid = None
    if w and w.get('lat') is not None:
        lat, lng, csrc, cprec, qid = w['lat'], w['lng'], f"Wikidata {w['qid']} P625", 'as recorded on Wikidata', w['qid']
    elif w: qid = w['qid']
    if lat is None and sph.get(k) and k not in ('sivananda-neyyar-dam', 'akshardham-delhi', 'bk-mount-abu', 'fazal-manzil'):
        x = sph[k][0]; lat, lng, csrc, cprec = x['lat'], x['lng'], f"OpenStreetMap via Photon ('{x['name']}')", 'building/locality'
    cands = [url] + ((w or {}).get('web') or [])
    u, ustat, ufail = resolve_url(cands)
    if u is None and url: u, ustat = url, 'not live-checked (sister layer)'
    sister_places.append(dict(id=k, name=name, type=typ, traditions=trads.split(), country=cc, country_name=ISO.get(cc), city=city,
        lat=round(lat, 6) if lat is not None else None, lng=round(lng, 6) if lng is not None else None, coord_source=csrc, coord_precision=cprec,
        teacher_ids=[t for t in teachers.split() if t], url=u, url_status=ustat, wikidata=qid, description=desc, source='curated (places-uk sisters)'))
ids_sister = {p['id'] for p in sister_places}
ids_old = set(old)
all_place_ids = ids_uk | ids_sister | ids_old

# ---------- people ----------
FIX_QID = {'john-main': ('Q610095', 1926, 1982), 'swami-vishnudevananda': ('Q173267', 1927, 1993), 'inayat-khan': ('Q120411', 1882, 1927),
           'karl-koenig': ('Q85037', 1902, 1966)}
people = []
for pid, name, srch, trads, bio, aliases in P:
    if pid in known_people: continue
    w = pwd.get(pid)
    if pid in FIX_QID: q, b, d = FIX_QID[pid]
    elif w: q, b, d = w['qid'], w['born'], w['died']
    else: q = b = d = None
    if pid == 'julian-of-norwich': b = d = None  # Wikidata dates are placeholders; c. 1343 - after 1416
    years = (f"{b}–{d}" if d else f"{b}–") if b else ('c. 1343–after 1416' if pid == 'julian-of-norwich' else None)
    living = bool(b and not d and b > 1915)
    people.append(dict(id=pid, name=name, short=name, kind='figure', role='figure', tradition=trads.split()[0], traditions=trads.split(),
                       wikidata=q, years=years, living=living, bio=bio, aliases=[a for a in aliases.split('|') if a], works=[],
                       source=(f"Wikidata {q} (dates, {TODAY})" if q else 'no Wikidata item found; dates left blank')))
ids_people = known_people | {p['id'] for p in people}

# ---------- traditions ----------
trad_nodes = []
for tid, label, kind, parent, qid, blurb in G.TRAD:
    if tid in known_trad: continue
    # QIDs come from a label search (trad_check.py) checked by eye; typed-from-memory QIDs were all discarded.
    chk = trad_wd.get(tid)
    ok_q = chk['qid'] if chk and tid not in ('heathenry', 'akbarian') else None
    trad_nodes.append(dict(id=tid, label=label, kind=kind, parent=parent, wikidata=ok_q, blurb=blurb,
                           **({'wikidata_label': chk['label']} if ok_q else {})))
ids_trad = known_trad | {t['id'] for t in trad_nodes}

# ---------- edges ----------
edges = []; dangling = []
def add(e):
    key = (e['from'], e['to'], e['type'])
    if key in known_edges or any((x['from'], x['to'], x['type']) == key for x in edges): return
    edges.append(e)
for pid, plc, typ, years, conf, src in G.PLACE_EDGES:
    if pid not in ids_people: dangling.append(('person', pid)); continue
    if plc not in all_place_ids: dangling.append(('place', plc)); continue
    e = dict(**{'from': pid, 'to': plc, 'type': typ, 'conf': conf, 'target_kind': 'place'})
    if years: e['years'] = years
    e['source'] = src; add(e)
for a, b, typ, conf in G.PEOPLE_EDGES:
    if a not in ids_people or (b not in ids_people and b not in ids_trad):
        dangling.append(('edge', f'{a}->{b}')); continue
    add({'from': a, 'to': b, 'type': typ, 'conf': conf})
# tradition parent edges are carried by node.parent; place teacher_ids not covered by an explicit edge become 'associated_with'
explicit = {(e['from'], e['to']) for e in edges if e.get('target_kind') == 'place'}
for p in places:
    keep = []
    for t in p['teacher_ids']:
        if t in ids_people: keep.append(t)
        else: dangling.append(('teacher_id', f"{p['id']}:{t}"))
    p['teacher_ids'] = keep
    for t in keep:
        if (t, p['id']) not in explicit:
            add({'from': t, 'to': p['id'], 'type': 'associated_with', 'conf': 'medium', 'target_kind': 'place'})
    p['traditions'] = [t for t in p['traditions'] if t in ids_trad] or ['independent']
for sp in sister_places:
    sp['traditions'] = [t for t in sp['traditions'] if t in ids_trad] or ['independent']
    sp['teacher_ids'] = [t for t in sp['teacher_ids'] if t in ids_people]

sis_edges = []
for a, b, typ, note in G.SISTERS:
    if a not in all_place_ids or b not in all_place_ids:
        dangling.append(('sister', f'{a}->{b}')); continue
    sis_edges.append({'from': a, 'to': b, 'type': typ, 'note': note})

# ---------- events ----------
events = []
for eid, name, kind, rec, month, plc, url, trad, note in G.EVENTS:
    u, ustat, ufail = resolve_url([url])
    events.append(dict(id=eid, name=name, kind=kind, recurrence=rec, usual_month=month, place_id=plc or None,
                       place_known=(plc in all_place_ids) if plc else None, official_url=u,
                       url_status=ustat or ('not live-checked' if not ufail else f'failed ({ufail})'), tradition=trad if trad in ids_trad else None,
                       note=note or None, dates_stored=False))

# ---------- India hotspots (main centres only) ----------
HOT = {'Rishikesh': ['sivananda-rishikesh', 'parmarth-niketan'], 'Tiruvannamalai': ['sri-ramanasramam', 'arunachala', 'skandashram', 'virupaksha-cave', 'arunachaleswarar'],
       'Belur / Kolkata': ['belur-math', 'dakshineswar'], 'Dharamsala': ['tsuglagkhang', 'tushita-dharamsala', 'ltwa'], 'Bodh Gaya': ['mahabodhi', 'root-institute', 'tergar-bodhgaya'],
       'Varanasi': ['kashi-vishwanath', 'sarnath', 'anandamayi-varanasi'], 'Igatpuri': ['dhamma-giri'], 'Pune': ['osho-pune'],
       'Srinagar (Kashmir Shaivism)': ['ishber-ashram', 'shankaracharya-temple'], 'Mayapur / Vrindavan': ['iskcon-mayapur', 'krishna-balaram-mandir'],
       'Munger': ['bihar-school-of-yoga'], 'Mount Abu': ['bk-mount-abu'], 'Nagpur': ['nagaloka']}
hotspots = [{'hotspot': h, 'place_ids': [x for x in v if x in all_place_ids], 'missing': [x for x in v if x not in all_place_ids]} for h, v in HOT.items()]

# ---------- write ----------
types = sorted({p['type'] for p in places})
json.dump(dict(_note=("Wiser Place layer, UK-first deep pass (2026-10-20). Same record shape as sources/places/places.json plus "
                      "contact_page (the public contact page URL exactly as linked from the official homepage; no emails stored), "
                      "schedule_url (official programme/retreat page; no dates), url_checked, wikidata_note, enwiki. "
                      "Coordinates: Wikidata P625 first, else OpenStreetMap via Photon with coord_precision; null where unverified. "
                      "teacher_ids are founders/teachers historically tied to the place. Ids shared with sources/places are the same place."),
               types=types, places=places), open(OUT('places.json'), 'w'), indent=1, ensure_ascii=False)
json.dump(dict(_note="places-uk tradition nodes (2026-10-20). Same shape as app/wisegraph/traditions.json additions. Wikidata ids checked against their English labels (trad_wd.json); a failed check leaves wikidata null.",
               nodes=trad_nodes), open(OUT('traditions-additions.json'), 'w'), indent=1, ensure_ascii=False)
json.dump(dict(_note="places-uk people additions (2026-10-20): UK founders and the main teachers attached to UK places. Wisegraph shape; all kind 'figure' (official-video check not done). Dates from Wikidata. Bios are Wiser's own words. Ids already in app/ or another sources/ group are not repeated.",
               people=people), open(OUT('people-additions.json'), 'w'), indent=1, ensure_ascii=False)
json.dump(dict(_note=("places-uk edges (2026-10-20). Person->place edges carry target_kind 'place' and type founded | abbot_of | teaches_at "
                      "(with years and a source URL) or associated_with (from a place's teacher_ids). Person->person/tradition edges use the app types. "
                      "Only edges not already in app/ or another sources/ group."),
               edges=edges), open(OUT('edges-additions.json'), 'w'), indent=1, ensure_ascii=False)
json.dump(dict(_note=("Sister places layer (2026-10-20): each UK place's parent and sibling network abroad. edges: branch_of (formal affiliation to a mother "
                      "house) or sister_of (same lineage/network, or a documented founder link). Place ids resolve to places-uk/places.json, the places "
                      "array below (new abroad places), or sources/places/places.json."),
               places=sister_places, edges=sis_edges, india_hotspots=hotspots), open(OUT('sisters.json'), 'w'), indent=1, ensure_ascii=False)
json.dump(dict(_note="Recurring events, festivals, programmes and weekly sits (2026-10-20). No dates are stored: usual_month + the official page only. place_id links to places-uk (or sources/places). 'type' rows (weekly-sit with a generic name) describe a kind of session held at many places.",
               events=events), open(OUT('events.json'), 'w'), indent=1, ensure_ascii=False)

# ---------- stats for REPORT ----------
from collections import Counter
st = dict(places=len(places), with_coords=sum(p['lat'] is not None for p in places), with_url=sum(bool(p['url']) for p in places),
          url_ok=sum(p['url_status'] == 'ok' for p in places), url_bot=sum((p['url_status'] or '').startswith('resolves') for p in places),
          url_unverified=sum((p['url_status'] or '').startswith('unverified') for p in places), with_wd=sum(bool(p['wikidata']) for p in places),
          with_contact=sum(bool(p['contact_page']) for p in places), with_schedule=sum(bool(p['schedule_url']) for p in places),
          types=Counter(p['type'] for p in places), trads=Counter(t for p in places for t in p['traditions']),
          precision=Counter((p['coord_precision'] or 'none').split(' ')[0] for p in places),
          sister_places=len(sister_places), sister_edges=len(sis_edges), sister_types=Counter(e['type'] for e in sis_edges),
          people=len(people), edges=len(edges), edge_types=Counter(e['type'] for e in edges), trad_nodes=len(trad_nodes), events=len(events),
          dangling=dangling, gaps=gaps, hijacked=sorted(set(hijacked)), new_vs_old=sum(p['id'] not in old for p in places))
json.dump(st, open(C('build_stats.json'), 'w'), indent=1, default=list)
print(json.dumps({k: v for k, v in st.items() if k not in ('gaps',)}, indent=0, default=str)[:4000])
