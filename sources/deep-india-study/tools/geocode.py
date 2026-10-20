# OSM Photon geocoding for new places (cached, ~1 req/s). Existing app places reuse app coordinates.
import json, os, time, urllib.request, urllib.parse, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from data_places import PLACES
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
C = os.path.join(B, 'cache', 'geocode.json')
cache = json.load(open(C)) if os.path.exists(C) else {}
app = {p['id']: p for p in json.load(open(os.path.join(B, '..', '..', 'app', 'wisegraph', 'places.json')))['places']} if True else {}
for p in PLACES:
    q = p.get('geocode')
    if not q or q in cache: continue
    url = 'https://photon.komoot.io/api/?' + urllib.parse.urlencode({'q': q + ', ' + p.get('country_name', 'India'), 'limit': 1})
    try:
        d = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'wiser-sourcing/1.0'}), timeout=20))
        f = (d.get('features') or [None])[0]
        cache[q] = {'lat': f['geometry']['coordinates'][1], 'lng': f['geometry']['coordinates'][0], 'name': f['properties'].get('name'), 'type': f['properties'].get('osm_value'), 'city': f['properties'].get('city')} if f else None
    except Exception as e:
        cache[q] = {'err': str(e)[:80]}
    print(q, '->', cache[q]); time.sleep(1.1)
json.dump(cache, open(C, 'w'), ensure_ascii=False, indent=1)
