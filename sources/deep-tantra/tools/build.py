# Build deep-tantra/clips.json (natural + virtual clips) and long-lectures.json.
import json, os, re, sys, glob, datetime
from collections import Counter, defaultdict
sys.path.insert(0, os.path.dirname(__file__))
from config import *
import segment as SEG
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
TODAY = '2026-10-20'
sel = json.load(open(B + '/raw/sel.json'))
pool = {e['id']: e for e in json.load(open(B + '/raw/pool.json'))}
def emb(vid):
    f = B + '/cache/ytmeta/cache/embed/' + vid + '.json'
    return json.load(open(f)) if os.path.exists(f) else None

PRIORITY = ['pratyabhijna', 'spanda', 'krama', 'kaula', 'trika', 'sri-vidya', 'shaiva-siddhanta', 'pashupata',
            'siddha-siddhanta', 'hatha', 'vajrayana', 'shakta', 'kashmir-shaivism', 'tantra-studies']
REGION = lambda s: 'buddhism' if s == 'vajrayana' else 'hindu'
FALLBACK = {'shaiva-siddhanta': 'faith', 'sri-vidya': 'divine/goddess', 'shakta': 'divine/goddess', 'krama': 'divine/goddess',
            'kaula': 'divine/goddess', 'hatha': 'meditation/hatha', 'siddha-siddhanta': 'meditation/hatha',
            'kashmir-shaivism': 'consciousness', 'trika': 'consciousness', 'pratyabhijna': 'consciousness', 'spanda': 'consciousness',
            'tantra-studies': 'texts/history', 'pashupata': 'texts/history', 'vajrayana': 'texts/history'}

def year_of(e):
    ago = (e.get('ago') or '')
    m = re.search(r'(\d+)\s+(year|yr|month|mo|week|day|hour)', ago)
    if m:
        n = int(m.group(1)); u = m.group(2)
        return 2026 - n if u in ('year', 'yr') else (2026 if u != 'month' and u != 'mo' or n < 10 else 2025)
    return None

def topics_for(r, text_src):
    tp = r['topics'][:]
    tags = []
    t = r['title']
    import pick  # reuse matcher
    for x in tp:
        conf, src = (0.9, 'title') if x in pick.kwmatch(t) else (0.7, text_src)
        tags.append([x, conf, src])
    tags.sort(key=lambda z: -z[1])
    tags = tags[:4]
    if not tags:
        prim = primary(r['schools'])
        tags = [[FALLBACK.get(prim, 'texts/tantra'), 0.4, 'rule']]
    return tags

def primary(schools):
    for p in PRIORITY:
        if p in schools: return p
    return schools[0] if schools else 'tantra-studies'

def band(sec):
    return 'short' if sec <= 420 else ('mid' if sec <= 1200 else 'long')

rows = []
drop = Counter()
for r in sel:
    e = emb(r['id'])
    if not e or e.get('oembed') != 200 or e.get('playableInEmbed') is not True:
        drop['embed'] += 1; continue
    orient = 'vertical' if (e.get('o_w') or 1) < (e.get('o_h') or 0) else 'horizontal'
    sec = e.get('dur') or r['sec']
    spk = r['speaker']; nm = SPEAKERS[spk][0]
    prim = primary(r['schools'])
    tags = topics_for(r, 'desc')
    lang = ['en', 0.6 if spk in ('rajarshi-nandy', 'om-swami') else 0.9, 'rule']
    rows.append({
        'id': r['id'], 'teacher': nm, 'speaker': spk, 'speakerFrom': r['speakerFrom'],
        'role': SPEAKERS[spk][2],
        'title': r['title'], 'ytTitle': r['title'], 'channel': r['channel'], 'channelId': r['chanId'],
        'kind': 'human', 'media': 'youtube', 'checked': TODAY, 'dur': sec, 'sec': sec,
        'format': orient, 'orientation': orient, 'orientationFrom': 'oembed',
        'carrier': r['carrier'], 'setting': 'talk', 'region': REGION(prim), 'tradition': prim,
        'school': prim, 'traditions': list(dict.fromkeys([prim] + r['schools'])),
        'figures': [], 'topics': [t[0] for t in tags], 'style': [],
        'published': None, 'publishedApprox': r.get('ago'), 'year': year_of(r), 'views': r['views'],
        'tags': {'v': 1, 'topics': tags, 'lang': lang, 'band': band(sec)},
        'embed': {'oembed': 200, 'playableInEmbed': True, 'checked': TODAY},
        'wholeTalk': sec > 1200, 'alsoInGroups': r.get('otherGroups') or [],
    })

# figures: name-match on title
FIG = {'abhinavagupta': r'abhinava', 'utpaladeva': r'utpaladeva', 'kshemaraja': r'k[sṣ]h?emar[aā]ja', 'vasugupta': r'vasugupta',
       'vijnana-bhairava': r'vij[nñ][aā]na[- ]?bhairava|vigyan(a)? bhairav|112 (ways|meditations|techniques)', 'shiva-sutras': r'[sś]iva[- ]?s[uū]tra',
       'spanda-karika': r'spanda', 'pratyabhijna-hrdayam': r'pratyabhij[nñ][aā][- ]?h[rṛ]da', 'tantraloka': r'tantr[aā]loka',
       'muktananda': r'muktananda', 'anandamayi-ma': r'anandamayi|[aā]nandamay[iī]', 'matsyendranatha': r'matsyendra', 'gorakhnath': r'gorakh|gorak[sṣ]a',
       'swami-lakshmanjoo': r'lakshman ?joo', 'bhagavad-gita': r'bhagavad|g[iī]t[aā]\b', 'lalita-tripurasundari': r'lalit[aā]|tripura ?sundar',
       'kali': r'\bk[aā]l[iī]\b', 'hathapradipika': r'ha[tṭ]ha ?prad[iī]pik', 'khecarividya': r'kh?ecar'}
for r in rows:
    r['figures'] = [f for f, rx in FIG.items() if re.search(rx, r['title'], re.I) and f != r['speaker']]

# virtual clips from internal transcripts
LECT = {  # id -> (speaker, school, short title, channel, chanId, carrier)
 'Sgj9SZ6O1IA': ('alexis-sanderson', 'shakta', 'Śāktism among the Śaivas (part 2)'),
 'hxaz7FbtPFk': ('alexis-sanderson', 'trika', 'Readings in the Tantrāloka I'),
 'MoqK8j5ewE8': ('alexis-sanderson', 'krama', 'Śāktism outside of Kashmir (part 3)'),
 'IvDDugzAgfk': ('alexis-sanderson', 'tantra-studies', 'A Life of Learning (with Christopher Wallis)'),
 '07gFSFqDUAs': ('james-mallinson', 'hatha', 'Early Haṭhayoga: Buddhist Tantric Sex to Hindu Physical Yoga'),
 'I2ZKdWb1MaQ': ('james-mallinson', 'hatha', 'New Light on Śāktism and Haṭhayoga'),
 'tgLz0xAF8oE': ('dominic-goodall', 'shaiva-siddhanta', 'How is Kuṇḍalinī conceived when she first appears in Śaivasiddhānta scriptures?'),
 'FqlUaj6-B2s': ('harunaga-isaacson', 'vajrayana', 'Śāktism and the Indian Vajrayāna: interactions and interdependence'),
 'C5XgOQB3doM': ('gavin-flood', 'kashmir-shaivism', 'The Netra-tantra and its Yogas'),
 'lNoDAl4x0gM': ('loriliai-biernacki', 'kashmir-shaivism', 'Wonder and Being in a Body'),
 'Y5DvWENynlA': ('david-gordon-white', 'siddha-siddhanta', 'Sinister Yogis (Day 1)'),
 'lASgAdZnmnc': ('mark-dyczkowski', 'trika', 'The Tantrāloka by Abhinavagupta: Content and Construction'),
 'lr53OBNbX8o': ('jason-birch', 'hatha', 'Manuscript Hunting and the History of Medieval Yogas (YSP 9)'),
 'ooJqxYH8hq4': ('douglas-brooks', 'sri-vidya', 'The Roots of Mindfulness, Part 1'),
}
ADMIN = re.compile(r'housekeeping|lunch|welcome (you|everyone|to)|it is (my|a) (great )?pleasure to introduce|please join me in welcoming|zoom|recording is|our next speaker', re.I)
virt = []; segstats = {}
import pick
for vid, (spk, school, short) in LECT.items():
    fs = glob.glob(SEG.T + '/' + vid + '*.srt')
    if not fs: continue
    segs = SEG.segment(fs[0])
    e = emb(vid); p = pool.get(vid, {})
    if not e or e.get('oembed') != 200 or e.get('playableInEmbed') is not True:
        segstats[vid] = 'not embeddable'; continue
    dur = e.get('dur') or p.get('sec')
    kept = 0
    for i, s in enumerate(segs):
        L = s['end'] - s['start']
        if L < 60 or L > 1200: continue
        if i == 0 and len(ADMIN.findall(s['text'])) >= 1 and s['start'] < 0.25 * dur and len(segs) > 3 and re.search(r'conference|lunch|exhibition', s['text'], re.I):
            continue  # pure conference admin before the speaker begins
        if ADMIN.search(s['text'][:600]) and len(ADMIN.findall(s['text'])) >= 2:
            continue
        cnt = Counter({tid: len(rx.findall(s['text'])) for tid, rx in pick.TRX})
        tp = [t for t, n in cnt.most_common() if n >= 4 and not any(o != t and o.startswith(t + '/') and cnt[o] >= 4 for o in cnt)][:3]
        tags = [[t, 0.6, 'transcript'] for t in tp]
        if not tags: tags = [[FALLBACK.get(school, 'texts/tantra'), 0.4, 'rule']]
        qa = bool(re.search(r'\bquestions?\b', ' '.join(s['terms']))) or (i == len(segs) - 1 and re.search(r'question', s['text'][:400], re.I))
        n = i + 1
        virt.append({
            'id': f'{vid}@{s["start"]}', 'parent': vid, 'start': s['start'], 'end': s['end'],
            'segTitle': f'{short} — part {n} of {len(segs)}' + (' (Q&A)' if qa else ''), 'segTitleAuto': True,
            'segKeywords': s['terms'],
            'teacher': SPEAKERS[spk][0], 'speaker': spk, 'speakerFrom': 'title', 'role': SPEAKERS[spk][2],
            'title': f'{short} — part {n}', 'ytTitle': p.get('title'), 'channel': p.get('channel'), 'channelId': p.get('chanId'),
            'kind': 'human', 'media': 'youtube', 'checked': TODAY, 'dur': L, 'sec': L, 'parentDur': dur,
            'format': 'horizontal', 'orientation': 'horizontal', 'orientationFrom': 'oembed',
            'carrier': 'institution' if p.get('chanId') in CHANNELS and CHANNELS[p.get('chanId')][1] == 'institution' else 'publisher',
            'setting': 'lecture', 'region': REGION(school), 'tradition': school, 'school': school,
            'traditions': [school], 'figures': [f for f, rx in FIG.items() if re.search(rx, s['text'], re.I)][:4],
            'topics': [t[0] for t in tags], 'style': [], 'published': None, 'publishedApprox': p.get('ago'), 'year': year_of(p),
            'views': p.get('views'), 'tags': {'v': 1, 'topics': tags, 'lang': ['en', 0.9, 'transcript'], 'band': band(L)},
            'embed': {'oembed': 200, 'playableInEmbed': True, 'checked': TODAY}, 'qa': bool(qa),
        })
        kept += 1
    segstats[vid] = kept
rows_all = rows + virt
json.dump(rows_all, open(B + '/clips.json', 'w'), indent=1, ensure_ascii=False)

# long lectures (lecture recordings only; not cut)
lp = json.load(open(B + '/raw/long_pre.json'))
OFFICIAL_EXTRA = {'UCjnWysJh9-r9wo82zlbMT3A', 'UCDy2RvseIW8ZPY4z7rBVfNg', 'UCi1Yd0I01shhy-uknz-SQBQ', 'UCzofJ1X3IBvCD22fZ9PcBkA', 'UCTglIUBtUn7885IUQXfcGNg',
                  'UCq4FSmoqt_jFa4rL5WZBqfw', 'UCcAWkY-P7FOqkny32mTrHsg', 'UCWo0JwlldgP3A0-G1PocruQ', 'UCwlZZGmE1e_6PI2e-HOPOQw', 'UCOdpuUDkF7U6vjOntjUMGrw',
                  'UCaGXIGzco1v27eC4_6bWCAQ', 'UCnlVpm_PkNiFlTWFb0sEUDg', 'UCuVI-LZ3g3VOSkHnz_9PNpQ', 'UCYj2E1aXXV21YOQGrU4ayRQ'}
longs = []
for x in lp:
    e = emb(x['id'])
    ok = bool(e and e.get('oembed') == 200 and e.get('playableInEmbed') is True)
    off = x['chanId'] in CHANNELS or x['chanId'] in OFFICIAL_EXTRA
    longs.append(dict(x, embeddable=ok, officialChannel=off, cut=x['id'] in LECT and isinstance(segstats.get(x['id']), int),
                      note='lecture recording only (>60 min); no chapters available' if x['id'] not in LECT else 'cut into virtual clips from internal transcript'))
longs.sort(key=lambda z: (z['speaker'], -z['sec']))
json.dump(longs, open(B + '/long-lectures.json', 'w'), indent=1, ensure_ascii=False)

c = Counter(r['speaker'] for r in rows_all)
print('natural', len(rows), 'virtual', len(virt), 'drop', drop, 'segstats', segstats)
print(c.most_common())
print(Counter(r['tradition'] for r in rows_all).most_common())
json.dump({'by_speaker': c, 'by_school': Counter(r['tradition'] for r in rows_all), 'segstats': segstats}, open(B + '/raw/counts.json', 'w'), indent=1)
