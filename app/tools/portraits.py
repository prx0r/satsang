# Satsang portraits: Wikidata P18 (image) -> Wikimedia Commons file + licence metadata. Commons only, no other source.
# Keeps only public-domain / CC0 / CC BY / CC BY-SA files. Writes wisegraph/portraits.json (the credits record, also read by
# tools/build-wise.py for profiles and the Credits page). Hotlinks Commons thumbnails (upload.wikimedia.org); nothing is downloaded.
# usage: python3 tools/portraits.py   (re-run after adding people; existing entries are refreshed)
import json, os, re, urllib.request, urllib.parse, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {'User-Agent': 'SatsangPortraits/1.0 (https://tantrafiles.xyz; hello@tantrafiles.xyz)'}
def get(u): return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40))
people = json.load(open(os.path.join(ROOT, 'wisegraph/people.json')))['people']
qids = [p['wikidata'] for p in people if p.get('wikidata')]
p18 = {}
for i in range(0, len(qids), 40):
    d = get('https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=' + '|'.join(qids[i:i + 40]))
    for q, e in d.get('entities', {}).items():
        c = e.get('claims', {}).get('P18')
        if c: p18[q] = c[0]['mainsnak']['datavalue']['value']
# Public domain, Creative Commons, and Commons' own 'Attribution' licence (a free licence that only requires credit; user
# decision 2026-10-20, for Nisargadatta's portrait). Every portrait is credited on its profile and on credits.html.
OK = re.compile(r'^(public domain|pd\b.*|cc0.*|cc[- ]by(-sa)?[- ]\d.*|cc[- ]by(-sa)?|attribution)$', re.I)
ATTR_URL = 'https://commons.wikimedia.org/wiki/Template:Attribution'
import sys, time
REFRESH = '--refresh' in sys.argv  # default: keep entries already in portraits.json, look up only new people (resumable)
PREV = json.load(open(os.path.join(ROOT, 'wisegraph/portraits.json'))) if os.path.exists(os.path.join(ROOT, 'wisegraph/portraits.json')) else {}
def strip(s): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s or ''))).strip()
out = {} if REFRESH else {k: v for k, v in PREV.items() if any(p['id'] == k for p in people)}
NOIMG = set(PREV.get('_none', [])) if not REFRESH else set()
out.pop('_none', None)
t0 = time.time()
for p in people:
    if p['id'] in out or p['id'] in NOIMG: continue
    if time.time() - t0 > 90: print('time budget reached; re-run to continue'); break
    f = p18.get(p.get('wikidata'))
    if not f: NOIMG.add(p['id']); continue
    t = 'File:' + f
    d = get('https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=800&titles=' + urllib.parse.quote(t))
    pg = next(iter(d['query']['pages'].values()))
    ii = (pg.get('imageinfo') or [None])[0]
    if not ii: continue
    m = ii.get('extmetadata', {})
    lic = strip(m.get('LicenseShortName', {}).get('value'))
    if not OK.match(lic):
        print('skip (licence)', p['id'], lic); NOIMG.add(p['id']); continue
    artist = strip(m.get('Artist', {}).get('value')) or 'Unknown author'
    h = len(artist) // 2
    if len(artist) % 2 == 0 and artist[:h] == artist[h:]: artist = artist[:h]  # Commons often doubles 'Unknown author'
    artist = re.sub(r'\s*\(.*$', '', artist).strip() or artist
    if len(artist) > 80: artist = artist[:77] + '…'
    d2 = get('https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=200&titles=' + urllib.parse.quote(t))
    small = ((next(iter(d2['query']['pages'].values())).get('imageinfo') or [{}])[0].get('thumburl') or '').split('?')[0]
    out[p['id']] = {'file': f, 'face': small or None, 'thumb': (ii.get('thumburl') or '').split('?')[0], 'w': ii.get('thumbwidth'), 'h': ii.get('thumbheight'),
                    'page': ii.get('descriptionurl'), 'artist': artist, 'license': lic,
                    'licenseUrl': strip(m.get('LicenseUrl', {}).get('value')) or (ATTR_URL if lic.lower() == 'attribution' else None), 'source': 'Wikimedia Commons via Wikidata P18'}
    print(p['id'], lic, '|', artist[:40])
json.dump({**out, '_none': sorted(NOIMG)}, open(os.path.join(ROOT, 'wisegraph/portraits.json'), 'w'), ensure_ascii=False, indent=1)
print(len(out), 'portraits')
