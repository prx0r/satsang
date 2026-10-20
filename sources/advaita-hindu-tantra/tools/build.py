# Stage 2: raw/presel.json + embed/desc caches -> candidates.json (app/clips.json row shape)
import json, re, os, collections, sys
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
sys.path.insert(0, 'tools')
S = json.load(open('raw/presel.json'))
src = open('tools/pick.py').read()
TRAD = eval(src.split('TRAD = ')[1].split('\n}\n')[0] + '\n}')
TODAY = '2026-10-20'
SPK_FIX = {'dr-venkat-s-ramanan': ('venkat-s-ramanan', 'Dr. Venkat S. Ramanan'), 'swami-satyamayanada': ('swami-satyamayananda', 'Swami Satyamayananda'),
           'dr-santa-ramachandran': ('santa-ramachandran', 'Dr. Santa Ramachandran'), 'smt-mangalam-kalyanam': ('mangalam-kalyanam', 'Mangalam Kalyanam'),
           'smt-aparna-krishnamoorthy': ('aparna-krishnamoorthy', 'Aparna Krishnamoorthy'), 'smt-sethulakshmi': ('sethulakshmi', 'Sethulakshmi'),
           'smt-sulochana-natarajan': ('sulochana-natarajan', 'Sulochana Natarajan')}

def year_from_ago(a):
    if not a: return None
    m = re.search(r'(\d+)\s*(yr|year|mo|month|wk|week|day|hour|hr|minute)', a)
    if not m: return None
    n, u = int(m.group(1)), m.group(2)
    if u in ('yr', 'year'): return 2026 - n
    if u in ('mo', 'month'): return 2026 if n < 10 else 2025
    return 2026

def style(r):
    t = r['title']; s = []
    if re.search(r'guided (meditation|contemplation|affirmation)|^meditation[:\s-]', t, re.I): s.append('guided')
    if re.search(r'\?', t) or re.search(r'Ask Swami|Q ?& ?A|question', r['snippet'] or '', re.I): s.append('q-and-a')
    if re.search(r'verse|sutras? \d|gita|Vijñāna-bhairava|Aksharamanamalai|Ashtavakra|Upadesha|shloka|chapter', t, re.I): s.append('text-study')
    return s

out = []
for r in S:
    e = json.load(open('cache/cache/embed/%s.json' % r['id']))
    if not (e.get('oembed') == 200 and e.get('embed') == 'OK' and e.get('playableInEmbed')): continue
    d = {}
    f = 'cache/cache/desc/%s.json' % r['id']
    if os.path.exists(f): d = json.load(open(f))
    sn = r['snippet'] or d.get('snippet') or ''
    ago = r.get('ago') or d.get('published')
    region, trad, trads = TRAD[r['chanId']]
    sid, sname, sfrom = r['spk']
    sid, sname = SPK_FIX.get(sid, (sid, sname))
    if sid == 'sri-ramanasramam' and re.search(r'^Bhagavan With|footage|archival|Maharshi - The Journey', r['title'], re.I): sid, sname, sfrom = 'ramana-maharshi', 'Ramana Maharshi (archival footage)', 'title'
    sec = e.get('dur') or r['sec']
    w, h = e.get('o_w') or 16, e.get('o_h') or 9
    fmt = 'vertical' if w < h else 'horizontal'
    tps = r['topics']
    out.append({
        'id': r['id'], 'teacher': sname, 'speaker': sid, 'speakerFrom': sfrom,
        'title': re.sub(r'\s*[|—–-]\s*(Swami Sarvapriyananda|Brother Chidananda|Sri Mrinalini Mata|Rupert Spira|Francis Lucille.*?)\s*$', '', r['title']).strip() or r['title'],
        'ytTitle': e.get('o_title') or r['title'], 'channel': r['channel'], 'channelId': r['chanId'],
        'kind': 'human', 'media': 'youtube', 'checked': TODAY, 'dur': sec, 'sec': sec, 'format': fmt,
        'carrier': 'own', 'setting': 'talk', 'region': region, 'tradition': trad, 'traditions': trads,
        'figures': r['figs'], 'topics': [t[0] for t in tps], 'style': style(r),
        'published': None, 'publishedApprox': ago, 'year': year_from_ago(ago), 'views': r['views'],
        'tags': {'v': 1, 'topics': tps, 'lang': ['en', 0.85 if r['chanId'] == 'UCeNlB-eW4MP1syhRGcYcEmA' else 0.9, 'rule'],
                 'band': 'short' if sec <= 420 else ('mid' if sec <= 1800 else 'long')},
        'embed': {'oembed': 200, 'playableInEmbed': True, 'checked': TODAY},
    })
out.sort(key=lambda x: (x['channel'], -(x['views'] or 0)))
json.dump(out, open('candidates.json', 'w'), indent=1, ensure_ascii=False)
print('candidates', len(out))
print(collections.Counter(x['format'] for x in out), collections.Counter(x['tags']['band'] for x in out))
