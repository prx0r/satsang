"""Match atlas text/person nodes to openpatala work slugs (data/translation-availability.json). Read-only on openpatala.
usage: python3 tools/crosswalk_openpatala.py /path/to/openpatala  -> atlas/crosswalk-openpatala.json"""
import json, sys, os, re, unicodedata
HERE = os.path.dirname(os.path.abspath(__file__)); A = os.path.dirname(HERE)
OP = sys.argv[1] if len(sys.argv) > 1 else '/tmp/openpatala'
works = json.load(open(f'{OP}/data/translation-availability.json'))['works']
nodes = json.load(open(f'{A}/nodes.json'))['nodes']
def k(s): return re.sub(r'[^a-z]', '', unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower())
MANUAL = {"ipk": "isvarapratyabhijnakarika", "ipv": "isvarapratyabhijnavimarsini", "pratyabhijnahridayam": "pratyabhijnahrdaya",
          "shivadrishti": "sivadrsti", "nisvasa": "nisvasaguhyasutra", "kularnava": "kularnavatantra", "svacchanda-tantra": "svacchandatantra",
          "vijnana-bhairava": "vijnanabhairava", "shiva-sutras": "sivasutra", "spanda-karika": "spandakarika", "tantraloka": "tantraloka",
          "tantrasara": "tantrasara", "ptv": "paratrisikavivarana", "malinivijayottara": "malinivijayottaratantra", "yogini-hridaya": "yoginihrdaya"}
out = {}
for n in nodes:
    if n['kind'] not in ('text',): continue
    cand = [MANUAL.get(n['id'])] + [k(n['label']), k(n['label'].split('(')[0])]
    hit = next((c for c in cand if c and c in works), None)
    if not hit:  # prefix match on the long form
        kk = k(n['label'].split('(')[0])
        hit = next((w for w in works if len(kk) > 6 and (w.startswith(kk) or kk.startswith(w)) and len(w) > 6), None)
    if hit:
        w = works[hit]
        out[n['id']] = {"patala_work": hit, "author": w.get('author'), "has_english": w.get('has_english'),
                        "translations": [{"translator": t.get('translator'), "tier": t.get('tier'), "url": t.get('url'), "type": t.get('type')} for t in (w.get('translations') or [])][:6],
                        "copyright_hint": w.get('copyright_hint')}
json.dump(out, open(f'{A}/crosswalk-openpatala.json', 'w'), ensure_ascii=False, indent=1)
print(len(out), 'of', sum(n['kind'] == 'text' for n in nodes), 'texts matched:', sorted(out))
