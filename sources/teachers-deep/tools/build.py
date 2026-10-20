# presel.json + embed cache -> candidates.json (SPEC.md row shape). Keeps rows that pass oEmbed 200 + /embed playableInEmbed,
# whose oEmbed author is the official channel, trimmed per teacher to the target depth (pick.py TARGET). Orientation is
# verified per id (app/tools/orient.py: /shorts oEmbed box + /shorts status). Metadata only.
import json, os, re, sys, datetime, collections, concurrent.futures as F
HERE = os.path.dirname(os.path.abspath(__file__)); G = os.path.join(HERE, '..'); APP = os.path.join(G, '..', '..', 'app')
sys.path.insert(0, os.path.join(APP, 'tools')); sys.path.insert(0, HERE)
from orient import check
TARGET = {'jiddu-krishnamurti': 80, 'swami-sarvapriyananda': 80, 'rupert-spira': 75, 'thanissaro-bhikkhu': 75, 'thich-nhat-hanh': 70,
          'ajahn-brahm': 65, 'tara-brach': 60, 'mingyur-rinpoche': 60, 'ajahn-pasanno': 55, 'swami-tadatmananda': 60, 'mooji': 60,
          'filip-holm': 50, 'ajahn-sumedho': 35, 'ajahn-amaro': 25, 'jack-kornfield': 45, 'dalai-lama': 50, 'francis-lucille': 45,
          'christopher-wallis': 45, 'tsoknyi-rinpoche': 40}
today = datetime.date.today().isoformat(); YEAR = datetime.date.today().year
people = {p['id']: p for p in json.load(open(os.path.join(APP, 'wisegraph/people.json')))['people']}
clips = json.load(open(os.path.join(APP, 'clips.json'))); have_n = collections.Counter(c['speaker'] for c in clips)
pre = json.load(open(os.path.join(G, 'presel.json')))
E = os.path.join(G, 'cache/ytmeta/cache/embed')
def emb(v):
    f = os.path.join(E, v + '.json'); return json.load(open(f)) if os.path.exists(f) else {}
def pub(t):
    m = re.match(r'^(\d{2})(\d{2})(\d{2})\s', t)
    if not m or not (1 <= int(m.group(2)) <= 12 and 1 <= int(m.group(3)) <= 31): return None
    return f'20{m.group(1)}-{m.group(2)}-{m.group(3)}'
def year_of(ago):
    m = re.match(r'(?:Streamed )?(\d+) (year|month|week|day|hour)', ago or '')
    if not m: return None
    n, u = int(m.group(1)), m.group(2)
    return YEAR - n if u == 'year' else (YEAR - (1 if u == 'month' and n >= 10 else 0))
def clean(t, name):
    t = re.sub(r'\s*#\w+', '', t)
    t = re.sub(r'\s*\\\s*\\.*$', '', t)  # Thanissaro: 'Title \ \ Thanissaro Bhikkhu \ \ Dhamma Talks'
    t = re.sub(r'^\d{6}\s+', '', t)  # yymmdd code (kept as published)
    for pat in [name, 'Swami Sarvapriyananda', 'Rupert Spira', 'Thich Nhat Hanh', 'Thích Nhất Hạnh', 'Ajahn Brahm', 'Tara Brach', 'J\\.? ?Krishnamurti',
                'Krishnamurti', 'Ajahn Pasanno', 'Ajahn Sumedho', 'Ajahn Amaro', 'Swami Tadatmananda', 'Mooji', 'Jack Kornfield', 'Dalai Lama',
                'Francis Lucille', 'Christopher Wallis', 'Hareesh', 'Tsoknyi Rinpoche', 'Yongey Mingyur Rinpoche', 'Mingyur Rinpoche', 'Thanissaro Bhikkhu']:
        t = re.sub(r'\s*[|\-–—:,]\s*(by\s+)?(His Holiness the\s+)?' + pat + r'\s*$', '', t, flags=re.I)
        t = re.sub(r'^\s*(His Holiness the\s+)?' + pat + r'\s*[|\-–—:]\s*', '', t, flags=re.I)
    return re.sub(r'\s{2,}', ' ', t).strip(' -|–—:') or t
drop = collections.Counter(); keep = collections.defaultdict(list); seen = set()
for r in pre:
    if r['id'] in seen: continue
    e = emb(r['id'])
    if not (e.get('oembed') == 200 and e.get('embed') == 'OK' and e.get('playableInEmbed')): drop['not_embeddable'] += 1; continue
    if e.get('o_author') and e['o_author'] != r['channel']: drop['author_mismatch'] += 1; continue
    need = max(0, TARGET[r['speaker']] - have_n[r['speaker']])
    if len(keep[r['speaker']]) >= need: drop['over_target'] += 1; continue
    keep[r['speaker']].append(r); seen.add(r['id'])
rows = [x for v in keep.values() for x in v]
with F.ThreadPoolExecutor(16) as ex: fmt = dict(ex.map(check, [x['id'] for x in rows]))
out = []
for r in rows:
    p = people[r['speaker']]; e = emb(r['id']); dur = e.get('dur') or r['sec']
    f = (fmt.get(r['id']) or {}).get('f') or 'horizontal'
    tops = sorted(r['topics'].items())
    out.append({'id': r['id'], 'teacher': p['name'], 'speaker': r['speaker'], 'speakerFrom': 'channel' if r['chanKey'] not in ('vsny', 'plumvillage', 'plumvillage-app', 'bswa', 'kft', 'abhayagiri', 'abhayagiri-amaro', 'amaravati', 'amaravati-amaro') else 'title',
                'title': clean(r['title'], p['name']), 'ytTitle': r['title'], 'channel': r['channel'], 'kind': 'human', 'media': 'youtube', 'checked': today,
                'dur': dur, 'sec': dur, 'format': f, 'carrier': 'own', 'setting': 'talk', 'tradition': p['tradition'], 'traditions': [p['tradition']],
                'figures': [], 'topics': [t for t, _ in tops], 'published': pub(r['title']), 'year': int(pub(r['title'])[:4]) if pub(r['title']) else year_of(r.get('ago')), 'yearFrom': 'title-code' if pub(r['title']) else 'upload-relative',
                'views': r.get('views'),
                'tags': {'v': 1, 'topics': [[t, c, 'title' if c >= 0.8 else 'desc'] for t, c in tops], 'lang': ['en', 0.85, 'rule']}})
json.dump(out, open(os.path.join(G, 'candidates.json'), 'w'), ensure_ascii=False, indent=0)
cnt = collections.Counter(x['speaker'] for x in out)
print('drops', dict(drop)); print('kept', len(out), collections.Counter(x['format'] for x in out))
for k, v in cnt.most_common(): print(f'  {k:26s} +{v:3d}  -> {have_n[k] + v}')
