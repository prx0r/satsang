# Wiser profile data: wisegraph/*.json (+ portraits.json, topic-takes.json) -> site/data/wisegraph/wise.json, and the
# portrait credits block in site/credits.html (between <!--portraits--> markers).
# The site computes everything clip-related (Talks by / Talks about / Full talks / topics per tradition) from clips.json,
# so new clips light up profiles without rebuilding this file. Run after tools/build-clips.py and tools/portraits.py.
# usage: python3 tools/build-wise.py
import json, os, re, html, datetime, collections, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda p: json.load(open(os.path.join(ROOT, p)))
TRAD = {n['id']: n for n in J('wisegraph/traditions.json')['nodes']}
PEOPLE = J('wisegraph/people.json')['people']
EDGES = J('wisegraph/edges.json')['edges']
PORT = {k: v for k, v in (J('wisegraph/portraits.json') if os.path.exists(os.path.join(ROOT, 'wisegraph/portraits.json')) else {}).items() if not k.startswith('_')}
TAKES = J('wisegraph/topic-takes.json')['topics'] if os.path.exists(os.path.join(ROOT, 'wisegraph/topic-takes.json')) else {}
PBY = {p['id']: p for p in PEOPLE}

def chain(t):
    out = []
    while t:
        out.append(t); t = TRAD[t]['parent']
    return out  # most specific first
def family(t): return chain(t)[-1]

# ---------- influence (people and tradition nodes) ----------
by, inf = collections.defaultdict(list), collections.defaultdict(list)
for e in EDGES:
    if e['type'] not in ('teacher_of', 'influenced', 'studied_with', 'academic_supervisor_of', 'translated'): continue  # studied_with = "Studied with", never shown as heir; academic_supervisor_of = "Studied under / Supervised" 
    by[e['to']].append([e['from'], e['type']]); inf[e['from']].append([e['to'], e['type']])

# ---------- "For seekers of": graph distance, then the tradition tree ----------
def kin(a, b):
    if a['id'] == b['id']: return 0
    s = 0.0
    if any(x[0] == b['id'] for x in by[a['id']] + inf[a['id']]): s += 1.0
    ca, cb = chain(a['tradition']), chain(b['tradition'])
    if ca[0] == cb[0]: s += 0.6
    elif set(ca[:2]) & set(cb[:2]): s += 0.4
    elif ca[-1] == cb[-1]: s += 0.25
    # a tradition node that influenced one of them and contains the other
    for x in by[a['id']]:
        if x[0] in TRAD and x[0] in cb: s += 0.3
    for x in by[b['id']]:
        if x[0] in TRAD and x[0] in ca: s += 0.3
    if a['kind'] == 'speaker' and b['kind'] == 'speaker': s += 0.05
    return s

# free texts (sources/deep-*/texts.json, links only) on their author's profile, matched by name
import glob, unicodedata
def _nk(x): return re.sub(r'[^a-z]', '', unicodedata.normalize('NFKD', x or '').encode('ascii', 'ignore').decode().lower())
NAMEK = {}
for p in PEOPLE:
    for a in [p['name'], p.get('short')] + list(p.get('aliases') or []):
        if a and len(_nk(a)) > 4: NAMEK.setdefault(_nk(a), p['id'])
def deep_texts():
    for f in sorted(glob.glob(os.path.join(ROOT, '..', 'sources', 'deep-*', 'texts.json'))):
        if not os.path.exists(os.path.join(os.path.dirname(f), 'REPORT.md')): continue
        d = json.load(open(f)); L = d.get('texts') if isinstance(d, dict) else d
        for t in L or []:
            url = t.get('url') or t.get('link')
            if not url or str(t.get('linkCheck', '200')) not in ('200', 'ok', 'True'): continue
            yield {'title': t['title'], 'author': t.get('author'), 'url': url, 'site': re.sub(r'^https?://(www\.)?([^/]+).*$', r'\2', url),
                   'note': t.get('note') if t.get('note') and len(t.get('note')) < 200 else None, 'school': t.get('school'), 'topics': t.get('topics') or [],
                   'licence': t.get('license') or t.get('licence') or t.get('rights') or t.get('license_note')}
TEXTS = list(deep_texts())
TEXTS_BY = collections.defaultdict(list)
# licence gate (tools/licence_gate.py, the registry merge-sources.py uses): a person's free text is linked only with registry evidence
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from licence_gate import licence_for, linkable, no_sale, queue_refresh
LHELD = []
for t in TEXTS:
    a = _nk(re.split(r'\s*\(|,| tr\.| trans', t.get('author') or '')[0])
    pid = NAMEK.get(a)
    if not pid: continue
    tid = re.sub(r'^https?://(www\.)?', '', t['url']).rstrip('/')
    lic, why, evu, ent = licence_for(None, t['url'])
    if not linkable(lic):
        LHELD.append({'pack': 'deep-texts', 'kind': 'text-licence-person', 'subject': f'person/{pid}:{tid}', 'reason': f'licence gate: free text "{t["title"][:80]}" ({t["url"]}); registry says {lic or "unregistered"} ({why[:160]}); link held off the profile', 'severity': 'verify', 'title': t['title'], **({'evidenceUrl': evu} if evu else {})}); continue
    TEXTS_BY[pid].append({**{k: v for k, v in t.items() if k in ('title', 'url', 'site', 'note') and v}, 'licence': lic, **({'licenceUrl': evu} if evu else {}), **({'noSale': True} if no_sale(lic, ent) else {})})
people = {}
RFPL = {}  # place-level records (subject place/<id>), attached to the place rows below
RF = {}  # public safety records (wisegraph/redflags.json): shown to agents as a dated, sourced note; never a verdict
if os.path.exists(os.path.join(ROOT, 'wisegraph/redflags.json')):
    for r in json.load(open(os.path.join(ROOT, 'wisegraph/redflags.json')))['records']:
        _k, _i = r['subject'].split('/', 1)
        (RF if _k == 'person' else RFPL).setdefault(_i, []).append({k: r.get(k) for k in ('id', 'status', 'happened', 'summary', 'reports', 'updated')})
for p in PEOPLE:
    t = p['tradition']
    seek = sorted((q for q in PEOPLE if q['id'] != p['id']), key=lambda q: (-kin(p, q), q['name']))
    seek = [q['id'] for q in seek if kin(p, q) >= 0.25][:8]
    img = PORT.get(p['id'])
    people[p['id']] = {k: v for k, v in {
        'n': p['name'], 'short': p.get('short'), 'k': p['kind'], 't': t, 'years': p.get('years'), 'bio': p.get('bio'),
        'tagline': p.get('tagline'), 'wd': p.get('wikidata'), 'living': True if p.get('living') is True else None,
        'works': [{k2: w.get(k2) for k2 in ('id', 'title', 'year', 'kind') if w.get(k2) is not None} for w in p.get('works', [])],
        'links': p.get('links') or None,
        'img': {'src': img['thumb'], 'face': img.get('face'), 'w': img.get('w'), 'h': img.get('h'), 'page': img['page'], 'artist': img['artist'], 'license': img['license'], 'licenseUrl': img.get('licenseUrl')} if img else None,
        'by': by.get(p['id']) or None, 'inf': inf.get(p['id']) or None, 'seek': seek or None,
        'ro': p.get('role') if p.get('role') in ('scholar', 'teacher') else None, 'lo': True if p.get('lineageOnly') else None,
        'texts': TEXTS_BY.get(p['id']) or None,
        'safety': RF.get(p['id']) or None,
        'src': p.get('sources') or ([p['source_url']] if p.get('source_url') else None), 'vo': p.get('verified_on'), 'cf': p.get('confidence'),  # keeper fixes: provenance of hand-checked facts
    }.items() if v not in (None, [], {})}

traditions = {}
for n in TRAD.values():
    kids = [m['id'] for m in TRAD.values() if m['parent'] == n['id']]
    traditions[n['id']] = {k: v for k, v in {'label': n['label'], 'kind': n['kind'], 'parent': n['parent'], 'blurb': n.get('blurb'), 'wd': n.get('wikidata'),
        'kids': kids or None, 'by': by.get(n['id']) or None, 'inf': inf.get(n['id']) or None,
        'founders': [e['from'] for e in EDGES if e['type'] == 'lineage_of' and e['to'] == n['id']] or None}.items() if v not in (None, [], {})}

out = {'meta': {'built': datetime.date.today().isoformat(), 'source': 'wisegraph/*.json', 'portraits': 'Wikimedia Commons via Wikidata P18 (public domain / CC / Commons Attribution)'},
       'people': people, 'traditions': traditions, 'takes': TAKES}
wg = os.path.join(ROOT, 'site/data/wisegraph'); os.makedirs(wg, exist_ok=True)
json.dump(out, open(os.path.join(wg, 'wise.json'), 'w'), ensure_ascii=False, separators=(',', ':'))

# ---------- places: a compact copy for the site (#places, #place/<id>, #country/<code>, "Where to practise") ----------
pp = os.path.join(ROOT, 'wisegraph/places.json')
if os.path.exists(pp):
    PLS = json.load(open(pp))
    KEEP = ('id', 'name', 'type', 'traditions', 'country', 'city', 'lat', 'lng', 'coord_precision', 'founded', 'teachers', 'url', 'schedule_url', 'wikidata', 'description', 'offers', 'goenka', 'retreats', 'contact', 'resources', 'sisters', 'events', 'source_url', 'verified_on', 'confidence', 'aliases', 'main_teacher', 'teacher_model', 'main_teacher_conf', 'main_teacher_src', 'main_teacher_verified', 'status', 'details_unverified')
    import sys as _s; _s.path.insert(0, os.path.join(ROOT, 'tools'))
    from source_maps import PLACE_CONTACT_DROP, PLACE_RESOURCES
    cp_ = os.path.join(ROOT, 'wisegraph/place-contacts.json')
    CON = json.load(open(cp_))['places'] if os.path.exists(cp_) else {}
    cc_ = os.path.join(ROOT, 'wisegraph/place-contacts-curated.json')  # hand-checked rows from staged packs (merge-sources.py) win over the crawler's
    if os.path.exists(cc_): CON = {**CON, **json.load(open(cc_))['places']}
    rows = []
    for x in PLS['places']:
        c = CON.get(x['id'])
        if c and not x.get('goenka'):  # Goenka centres: their dhamma.org page is the contact
            k = {'checked': c['checked']}
            if c.get('contact_page'): k['page'] = c['contact_page']['url']; k['page_src'] = c['contact_page']['source_url']
            seen = set()
            for f in ('email', 'phone'):
                v = []
                for y in c.get(f) or []:
                    key = y['value'].lower() if f == 'email' else re.sub(r'\D', '', y['value'])[-9:]
                    if y['value'].lower() in PLACE_CONTACT_DROP or key in seen: continue
                    seen.add(key); v.append([y['value'], y['source_url']])
                if v: k[f] = v
            if c.get('address'): k['address'] = [c['address']['value'], c['address']['source_url']]
            if len(k) > 1: x = {**x, 'contact': k}
        if not x.get('contact') and x.get('contact_page') and not x.get('goenka'):  # places-uk: the contact link as published on the homepage
            x = {**x, 'contact': {'checked': x.get('url_checked') or '2026-10-20', 'page': x['contact_page'], 'page_src': x.get('url') or x['contact_page']}}
        if x['id'] in PLACE_RESOURCES:  # hand-checked free-book links, under the same licence gate
            keep = []
            for y in PLACE_RESOURCES[x['id']]:
                lic, why, evu, ent = licence_for(None, y['url'])
                if not linkable(lic):
                    LHELD.append({'pack': 'place-resources', 'kind': 'resource-licence-place', 'subject': f'place/{x["id"]}:{y["url"]}', 'reason': f'licence gate: registry says {lic or "unregistered"} ({why[:160]}); link held off the place page', 'severity': 'verify', 'title': y['title'], **({'evidenceUrl': evu} if evu else {})}); continue
                keep.append({**y, 'licenceClass': lic, **({'licenceUrl': evu} if evu else {})})
            if keep: x = {**x, 'resources': keep}
        r = {k: x[k] for k in KEEP if x.get(k) is not None}
        r['name'] = r['name'][:1].upper() + r['name'][1:]  # Wikidata labels can start lower-case ('archaeological Site of Delphi')
        if r.get('lat') is not None: r['lat'], r['lng'] = round(r['lat'], 5), round(r['lng'], 5)
        if RFPL.get(r['id']): r['safety'] = RFPL[r['id']]  # place-level public safety records (dated, sourced; never a verdict)
        if r.get('goenka'): r.pop('description', None)  # the Goenka description is one boilerplate line, rebuilt in the browser
        rows.append(r)
    json.dump({'meta': {'built': datetime.date.today().isoformat(), 'map': 'OpenStreetMap contributors', 'sources': 'Wikidata, OpenStreetMap (Nominatim/Photon), dhamma.org directory, official sites'},
               'places': rows, 'countries': {c['code']: {k: v for k, v in c.items() if k != 'code'} for c in PLS['countries']}},
              open(os.path.join(wg, 'places.json'), 'w'), ensure_ascii=False, separators=(',', ':'))

# ---------- credits.html: one line per portrait ----------
cp = os.path.join(ROOT, 'site/credits.html'); s = open(cp).read()
e = html.escape
rows = []
for pid, r in sorted(PORT.items(), key=lambda kv: PBY.get(kv[0], {}).get('name', kv[0])):
    lic = f'<a href="{e(r["licenseUrl"])}" rel="noopener license">{e(r["license"])}</a>' if r.get('licenseUrl') else e(r['license'])
    rows.append(f'<li>{e(PBY.get(pid, {}).get("name", pid))}: <a href="{e(r["page"])}" rel="noopener">{e(r["file"])}</a>, {e(r["artist"])}, {lic}</li>')
block = ('<!--portraits--><h2>Portraits</h2><p class="muted">From Wikimedia Commons (the Wikidata image of each person), public domain, Creative Commons or Commons&rsquo; Attribution licence (credit required), shown unmodified apart from cropping.</p><ul>'
         + ''.join(rows) + '</ul><!--/portraits-->')
if '<!--portraits-->' in s: s = re.sub(r'<!--portraits-->.*?<!--/portraits-->', lambda m: block, s, flags=re.S)
else: s = s.replace('<p class="muted"><a href="./">Back to Wiser</a>', block + '\n<p class="muted"><a href="./">Back to Wiser</a>')
open(cp, 'w').write(s)
nq = queue_refresh(os.path.join(ROOT, 'wisegraph/review-queue.json'), {'text-licence-person', 'resource-licence-place'}, LHELD, '2026-10-21')  # held links -> review queue
print(json.dumps({'people': len(people), 'portraits': len(PORT), 'traditions': len(traditions), 'takes': len(TAKES), 'licence_held_links': len(LHELD), 'person_texts': sum(len(v) for v in TEXTS_BY.values()), 'review_queue': nq}))
