# Topic hubs: wisegraph/hubs.json (hand-curated essays, practices, sub-questions) + the Atlas concept thread
# (../atlas/merged, read-only: 'expounds'/'synthesis_of' edges into a concept, in time order) -> site/data/wisegraph/hubs.json.
# Links only: nothing is rehosted. usage: python3 tools/build-hubs.py
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ATLAS = os.path.join(ROOT, '..', 'atlas', 'merged')
src = json.load(open(os.path.join(ROOT, 'wisegraph/hubs.json')))
people = {p['id'] for p in json.load(open(os.path.join(ROOT, 'wisegraph/people.json')))['people']}
nodes, edges = {}, []
if os.path.isdir(ATLAS):
    nodes = {n['id']: n for n in json.load(open(os.path.join(ATLAS, 'nodes.json')))['nodes']}
    edges = json.load(open(os.path.join(ATLAS, 'edges.json')))['edges']
def thread(cid):
    out = []
    for e in edges:
        if e.get('to') != cid or e.get('from') not in nodes: continue
        n = nodes[e['from']]; t = n.get('time') or {}
        out.append({'id': n['id'], 'label': n.get('label'), 'kind': n.get('kind'), 'when': t.get('label'), 'start': t.get('start'),
                    'note': e.get('note') or '', 'person': n['id'] in people, 'how': e.get('type')})
    out.sort(key=lambda x: (x['start'] is None, x['start'] if x['start'] is not None else 0))
    for x in out: x.pop('start')
    return out
# ---------- deep pass: the groups' free texts and practices (sources/deep-*/{texts,practices}.json, links only) folded into
# the hubs they bear on: their own topic ids first, else cue words in the title / how-to. Capped per hub; the curated ones lead.
import re, glob, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from source_maps import KEEPER_URL_MOVED
TR = {n['id']: n for n in json.load(open(os.path.join(ROOT, 'wisegraph/traditions.json')))['nodes']}
def tlabel(x):
    x = {'christian-meditation': 'christian-meditation-wccm', 'learned-magic': 'western-magic', 'serene-reflection': 'ocb'}.get(x, x)
    return TR[x]['label'] if x in TR else None
CUES = {
    'rebirth': r'reincarnat|past li|bardo|transmigrat|rebirth in|next life|\breborn\b',
    'death': r'death|dying|bardo|phowa|impermanen|corpse|charnel|grief',
    'self': r'not[- ]?self|anatt|who am i|self[- ]?enquiry|self[- ]?inquiry|what am i|\bego\b',
    'kamma': r'karma|kamma|\bmerit|precept|selfless (work|action)',
    'meditation': r'meditat|breath|sitting|zazen|shamatha|calm|walking|mindful|japa|mantra|koan|huatou|noting|awareness',
    'awakening': r'awaken|enlighten|nature of mind|rigpa|liberat|nibb|buddha[- ]nature|kensho|satori',
    'faith': r'devotion|prayer|dhikr|zikr|nembutsu|nianfo|bhakti|kirtan|k[iī]rtan|jesus prayer|lectio|chant|name of god|mah[aā]mantra',
    'reality': r'non-?dual|advaita|pratyabhij|brahman|awareness itself|spanda',
    'self/emptiness': r'emptiness|sunyata|śūnyatā|madhyamaka|heart sutra|interbeing|middle way',
    'meditation/kundalini': r'ku[nṇ][dḍ]alin|chakra|cakra|subtle body|\bpr[aā][nṇ]a\b|khecar|double breath|\bbandhas?\b',
    'imaginal': r'imagin|imaginal|archetyp|daimon|dream yoga|corbin|hermetic|angel',
}
def deep_rows(name):
    for f in sorted(glob.glob(os.path.join(ROOT, '..', 'sources', 'deep-*', name))):
        if not os.path.exists(os.path.join(os.path.dirname(f), 'REPORT.md')): continue
        d = json.load(open(f)); L = d.get(name.split('.')[0]) if isinstance(d, dict) else d
        yield from (L or [])
TEXTS, PRACT = [], []
for t in deep_rows('texts.json'):
    url = t.get('url') or t.get('link')
    if not url or str(t.get('linkCheck', '200')) not in ('200', 'ok', 'True') or t.get('lang') == 'sa': continue
    TEXTS.append({'title': t['title'], 'author': t.get('author'), 'trad': tlabel(t.get('school') or t.get('tradition') or ''), 'url': url,
                  'site': re.sub(r'^https?://(www\.)?([^/]+).*$', r'\2', url), 'note': t.get('note') if t.get('note') and len(t['note']) < 220 else None,
                  '_t': set(t.get('topics') or []), '_x': ' '.join(str(t.get(k) or '') for k in ('title', 'note', 'school'))})
for x in deep_rows('practices.json'):
    srcs = x.get('sources') or []
    url = x.get('source_url') or (x.get('source') if str(x.get('source', '')).startswith('http') else None) or (srcs[0] if srcs else None)
    url = KEEPER_URL_MOVED.get(url, url)  # keeper fixes (tools/source_maps.py)
    how = x.get('howto') or x.get('how_to') or ''
    PRACT.append({'name': x['name'], 'trad': tlabel(x.get('school') or x.get('tradition') or '') or 'Practice', 'how': how,
                  'src': (x.get('source') if x.get('source') and not str(x['source']).startswith('http') else None) or x.get('source_note') or (re.sub(r'^https?://(www\.)?([^/]+).*$', r'\2', url) if url else None),
                  'url': url, '_t': set(x.get('topics') or []), '_x': x['name'] + ' ' + how})
EXCL = {('rebirth', 'Hermetic ascent and rebirth (Corpus Hermeticum XIII)')}  # spiritual regeneration, not reincarnation
def fits(row, topic):
    if (topic, row.get('name') or row.get('title')) in EXCL: return False
    if topic in row['_t'] or any(t.split('/')[0] == topic for t in row['_t']): return True
    return bool(re.search(CUES.get(topic, r'^$'), row['_x'], re.I))
def fold(h, topic, key, rows, cap):
    have = {x.get('url') or x.get('name') for x in h.get(key) or []}
    add = [{k: v for k, v in r.items() if not k.startswith('_') and v} for r in rows if fits(r, topic) and (r.get('url') or r.get('name')) not in have]
    seen, out = set(), []
    for r in add:  # spread across traditions: one per tradition first, then the rest
        if r.get('trad') not in seen: out.append(r); seen.add(r.get('trad'))
    out += [r for r in add if r not in out]
    h[key] = list(h.get(key) or []) + out[:max(0, cap - len(h.get(key) or []))]
hubs = {}
for k, h in src['hubs'].items():
    h = dict(h)
    fold(h, k, 'essays', TEXTS, 24); fold(h, k, 'practices', PRACT, 14)
    h = dict(h)
    h['thread'] = thread(h['atlas']) if h.get('atlas') else []
    h['threadLabel'] = nodes.get(h.get('atlas') or '', {}).get('label')
    hubs[k] = h
# licence gate (tools/licence_gate.py, shared with merge-sources.py / build-wise.py): a hub essay is linked only when the registry
# evidences a linkable licence; held ones leave the hub (and the MCP text records built from it) and go to the review queue
# (kind text-licence-hub), where web-worker/build-meta.mjs turns each into a "held while its licence is checked" /resource page.
from licence_gate import licence_for, linkable, no_sale, queue_refresh
def _slug(s, n):
    import unicodedata
    s = ''.join(c for c in unicodedata.normalize('NFD', str(s)) if not unicodedata.combining(c))
    return re.sub(r'^-|-$', '', re.sub(r'[^a-z0-9]+', '-', s.lower()))[:n]
HHELD, HSEEN, NLINK = [], set(), set()
for k, h in hubs.items():
    keep = []
    for e in h.get('essays') or []:
        tid = _slug(e['title'], 60)
        lic, why, evu, ent = licence_for('hub-' + tid, e.get('url'))
        if not linkable(lic):
            if e['url'] not in HSEEN:
                HSEEN.add(e['url'])
                HHELD.append({'pack': 'hubs', 'kind': 'text-licence-hub', 'subject': f'hub-essay:{e["url"]}', 'reason': f'licence gate: hub essay "{e["title"][:80]}" ({e["url"]}); registry says {lic or "unregistered"} ({why[:200]}); link held off the topic hubs ({k}...)', 'severity': 'verify', 'title': e['title'], 'rid': _slug(tid, 72), **({'evidenceUrl': evu} if evu else {})})
            continue
        NLINK.add(e['url'])
        keep.append({**e, 'licence': lic, **({'licenceUrl': evu} if evu else {}), **({'noSale': True} if no_sale(lic, ent) else {})})
    h['essays'] = keep
nq = queue_refresh(os.path.join(ROOT, 'wisegraph/review-queue.json'), {'text-licence-hub'}, HHELD, '2026-10-21')
print({'hub_essay_links': len(NLINK) + len(HSEEN), 'linked': len(NLINK), 'held': len(HHELD), 'review_queue': nq})
os.makedirs(os.path.join(ROOT, 'site/data/wisegraph'), exist_ok=True)
TT = json.load(open(os.path.join(ROOT, 'schema/topics.json')))['tree']
labels = {r + '/' + l: n['label'] for r, node in TT.items() for l, n in node.items() if isinstance(n, dict) and 'kw' in n}
labels.update({r: node['label'] for r, node in TT.items() if node.get('label')})
json.dump({'checked': src.get('checked'), 'labels': labels, 'hubs': hubs}, open(os.path.join(ROOT, 'site/data/wisegraph/hubs.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print({k: {'q': len(h['questions']), 'essays': len(h['essays']), 'practices': len(h['practices']), 'thread': len(h['thread'])} for k, h in hubs.items()})
