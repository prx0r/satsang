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
        import subprocess; d = json.loads(subprocess.run(['curl','-s','-m','12','-A','wiser-sourcing/1.0',url],capture_output=True,text=True).stdout)
        f = (d.get('features') or [None])[0]
        cache[q] = {'lat': f['geometry']['coordinates'][1], 'lng': f['geometry']['coordinates'][0], 'name': f['properties'].get('name'), 'type': f['properties'].get('osm_value'), 'city': f['properties'].get('city')} if f else None
    except Exception as e:
        cache[q] = {'err': str(e)[:80]}
    print(q, '->', cache[q], flush=True); json.dump(cache, open(C, 'w'), ensure_ascii=False, indent=1); time.sleep(1.1)
json.dump(cache, open(C, 'w'), ensure_ascii=False, indent=1)
