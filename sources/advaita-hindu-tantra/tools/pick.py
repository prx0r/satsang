# Stage 1: tag + score + select candidates from raw/pool.json -> raw/presel.json (before embed check)
import json, re, math, collections, sys, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
APP = '../../app/'
T = json.load(open(APP + 'schema/topics.json'))['tree']
ADD = json.load(open('topics-additions.json'))['additions']
P = json.load(open('raw/pool.json'))

# ---- topic regexes
nodes = {}
def walk(d, p=''):
    for k, v in d.items():
        if isinstance(v, dict) and 'label' in v:
            nodes[p + k] = v.get('kw', [])
            walk({kk: vv for kk, vv in v.items() if isinstance(vv, dict)}, p + k + '/')
walk(T)
for a in ADD: nodes[a['id']] = a['keywords']
# Buddhist-only cues that misfire on Hindu material
SKIP_KW = {'kamma': {'intention', 'merit'}, 'rebirth': {'bhava'}, 'awakening': {'freedom'}, 'self': {'identity'}, 'faith': {'god'}, 'mindfulness': {'awareness', 'attention'}, 'feeling': {'body', 'bodily', 'pleasant', 'painful'}}
RX = {}
for n, kws in nodes.items():
    kws = [k for k in kws if k not in SKIP_KW.get(n, set())]
    if kws: RX[n] = re.compile(r'(?<![\w])(' + '|'.join(kws) + r')(?![\w])', re.I)

W = {'rebirth': 2.0, 'kamma': 1.5, 'death': 1.4, 'dukkha': 1.2, 'faith': 1.1}
PRIORITY = ['rebirth', 'self', 'death', 'meditation', 'awakening', 'dukkha', 'kamma', 'faith', 'consciousness', 'guru']
QMAP = {'rebirth': 'rebirth', 'death': 'death', 'who am I': 'self/self-enquiry', 'karma': 'kamma', 'meditation': 'meditation',
        'suffering': 'dukkha', 'awakening': 'awakening', 'devotion': 'faith/bhakti', 'bhakti': 'faith/bhakti', 'grace': 'faith/grace',
        'consciousness': 'consciousness', 'self': 'self', 'guru': 'guru', 'maya': 'reality/maya', 'fear': 'emotions/fear',
        'mind': 'thought', 'ego': 'self', 'enlightenment': 'awakening', 'grief': 'emotions/sadness', 'reincarnation': 'rebirth',
        'self enquiry': 'self/self-enquiry', 'Kriya': 'meditation/kriya'}

def clean(s): return re.sub(r'\s+', ' ', s or '').strip()
def tag(title, snip, qs):
    hits = {}
    for n, rx in RX.items():
        if rx.search(title): hits[n] = max(hits.get(n, (0,))[0], 0.9), 'title'
        elif snip and rx.search(snip): hits.setdefault(n, (0.7, 'desc'))
    # keep most specific: drop ancestor if a descendant hit
    for n in list(hits):
        if any(o != n and o.startswith(n + '/') for o in hits): hits.pop(n)
    if not hits:
        for q in qs or []:
            t = QMAP.get(q)
            if t: hits.setdefault(t, (0.5, 'search'))
    out = sorted(([n, c, s] for n, (c, s) in hits.items()), key=lambda x: -x[1])
    return out[:4]

# ---- non-talk / off-scope filter
EXC = re.compile(r'in ?focus|aa?rati|puja|pooja|\bdance|chant|recitation|\bsong|bhajan|music|celebration|darshan|convocation|calendar|\bapp\b|trailer|#shorts|community update|'
                 r'announc|invocation|alangaram|venuganam|inauguration|jayanti|procession|kumbh|festival|live ?stream|parayana|vedic|concert|flute|publication|book launch|next book|'
                 r'registration|join us|teaser|promo|donat|welcome to|webinar|vedanta q ?& ?a|\bpoem|poetry|story \+|cow lakshmi|wildlife|making .call off|kirtan|stotra|prayer for|'
                 r'merchandise|\bshop\b|ep \d+ ~|podcast ep|sanskrit song|learn to chant|class \d|\(part \d+\)|part \d+ of \d+|\d+ of \d+\)|abbreviated class|^\d+:|storytime|matins|vespers|'
                 r'\((tamil|telugu|spanish|hindi|bengali|sanskrit)\)|in tamil|in telugu|quien es|book release|projects|pronunciation|names of praise|sacred mantras|lesson \d|memorial|free weekly|coronavirus|havan|handwriting|meditation hall|clearing the barn|construction|update|engagement calendar|birthday|happy (easter|new year|christmas|diwali)|gift|sale|offer', re.I)
NONLATIN = re.compile(r'[\u0900-\u0DFF]')  # Indic scripts
PARTS = re.compile(r'\bpart (one|two|1|2)\b', re.I)

# ---- speakers
SPEAKER_RX = re.compile(r'(?:\||—|–| - |by |: )\s*((?:Swami|Pravrajika|Brother|Sister|Sri|Dr\.?|Prof\.?|Smt\.?)\s+[A-Z][\w\.]+(?:\s+[A-Z][\w\.]+){0,2})')
CH_DEFAULT = {
    'UCxXWjjtATq3OM545gMh9PUg': ('rupert-spira', 'Rupert Spira'),
    'UCAYslZlNuBDD7FMvpjWLtoQ': ('francis-lucille', 'Francis Lucille'),
    'UCpw2gh99XM6Mwsbksv0feEg': ('mooji', 'Mooji'),
    'UCBj2I1l_ubQuWrdJV2Ns_Tg': ('adyashanti', 'Adyashanti'),
    'UC7i47784NqiOl244eGEJDew': ('swami-tadatmananda', 'Swami Tadatmananda'),
    'UCpESGVz_4KaI3duvhfedf7g': ('christopher-wallis', 'Christopher Wallis (Hareesh)'),
    'UCKYC_hMs3JRWaM_dfi_BnxA': ('swami-lakshmanjoo', 'Swami Lakshmanjoo'),
    'UCBcqQGNwcSEwlv6gJXP-U9A': ('david-godman', 'David Godman'),
}
TRAD = {  # channel -> (region, tradition, traditions)
    'UCeNlB-eW4MP1syhRGcYcEmA': ('hindu', 'advaita', ['vedanta', 'advaita']),
    'UCBcqQGNwcSEwlv6gJXP-U9A': ('hindu', 'advaita', ['vedanta', 'advaita']),
    'UCZOKv_xnTzyLD9RJmbBUV9Q': ('hindu', 'ramakrishna-order', ['vedanta', 'advaita', 'ramakrishna-order']),
    'UCoeQClkDRaj9uABKHfHJUdw': ('hindu', 'ramakrishna-order', ['vedanta', 'ramakrishna-order']),
    'UCuv4AUvgAgut3zdiPmvG5Pw': ('hindu', 'ramakrishna-order', ['vedanta', 'ramakrishna-order']),
    'UCqr3sDl5CzjQwOHiVLal4gQ': ('hindu', 'kriya-yoga', ['kriya-yoga']),
    'UCpESGVz_4KaI3duvhfedf7g': ('hindu', 'kashmir-shaivism', ['kashmir-shaivism']),
    'UCKYC_hMs3JRWaM_dfi_BnxA': ('hindu', 'kashmir-shaivism', ['kashmir-shaivism']),
    'UCxXWjjtATq3OM545gMh9PUg': ('hindu', 'direct-path', ['advaita', 'direct-path']),
    'UCAYslZlNuBDD7FMvpjWLtoQ': ('hindu', 'direct-path', ['advaita', 'direct-path']),
    'UC7i47784NqiOl244eGEJDew': ('hindu', 'arsha-vidya', ['vedanta', 'advaita', 'arsha-vidya']),
    'UCBj2I1l_ubQuWrdJV2Ns_Tg': ('independent', 'modern-nondual', ['independent', 'modern-nondual', 'zen']),
    'UCpw2gh99XM6Mwsbksv0feEg': ('hindu', 'advaita', ['advaita']),
}
def slug(s): return re.sub(r'[^a-z0-9]+', '-', s.lower().replace('.', '')).strip('-')
NAME_FIX = {'Swami Sarvapriyananda': 'swami-sarvapriyananda', 'Brother Chidananda': 'brother-chidananda'}
def speaker(p):
    r = _speaker(p)
    return (r[0], re.sub(r'\s+', ' ', r[1]), r[2]) if r else None
def _speaker(p):
    c = p['chanId']; t = p['title']; sn = p['snippet'] or ''
    if c in CH_DEFAULT: return CH_DEFAULT[c] + ('channel-default',)
    m = SPEAKER_RX.search(t)
    if m:
        n = re.sub(r'[\.,]$', '', m.group(1)).strip()
        return slug(n), n, 'title'
    if c == 'UCZOKv_xnTzyLD9RJmbBUV9Q' and re.search(r'^Swami Sarvapriyananda (speaks|discusses|elaborates|explains|answers|responds)', sn):
        return 'swami-sarvapriyananda', 'Swami Sarvapriyananda', 'desc'
    if c == 'UCqr3sDl5CzjQwOHiVLal4gQ':
        m = re.search(r'(Brother \w+|Sister \w+|Sri \w+ Mata|Swami \w+)', t + ' ' + sn)
        if m: return slug(m.group(1)), m.group(1), 'desc'
        if re.search(r"Yogananda('s)? (own )?voice|in his own voice|recording of (paramahansa )?yogananda", t + ' ' + sn, re.I):
            return 'paramahansa-yogananda', 'Paramahansa Yogananda', 'title'
    if c == 'UCeNlB-eW4MP1syhRGcYcEmA':
        if re.search(r'Venkat S|Anand (S\.? )?Ramanan', t): return 'venkat-s-ramanan', 'Dr. Venkat S. Ramanan', 'title'
        if re.search(r'Nochur', t): return 'nochur-venkataraman', 'Sri Nochur Venkataraman', 'title'
        m = re.match(r'(Smt\.?\s+\w+\s+\w+) talks', t)
        if m: n = m.group(1); return slug(n), n, 'title'
        m = re.match(r"((?:Dr\.?|Smt\.?|Sri)?\s*[A-Z][\w\.]*(?:\s+[A-Z][\w\.]*){0,3})(?:'s recollections| - Devotee)", t) or re.search(r"(Sri [A-Z]\w* [A-Z]\w*)[’']s message", t)
        if m: n = m.group(1).strip(); return slug(n), n, 'title'
        m = re.search(r'Interview\s*[-–:]\s*([A-Z][\w\.]*(?:\s+[A-Z][\w\.]*){0,3})', t)
        if m: n = m.group(1).strip(); return slug(n), n, 'title'
        m = re.search(r'(?:talk by|interview(?: with)?|by)\s+((?:Dr\.?|Sri|Smt\.?|Prof\.?)?\s*[A-Z][\w\.]*(?:\s+[A-Z][\w\.]*){0,3})', t)
        if m and len(m.group(1)) > 3:
            n = m.group(1).strip(); return slug(n), n, 'title'
        m = re.match(r'(?:Smt\.?|Sri|Dr\.?)?\s*([A-Z][\w\.]*(?:\s+[A-Z][\w\.]*){0,3})\s+Interview', t)
        if m: return slug(m.group(0).replace('Interview', '').strip()), m.group(0).replace('Interview', '').strip(), 'title'
        return 'sri-ramanasramam', 'Sri Ramanasramam', 'channel-default'
    return None

RARE_FIG = {'ramakrishna', 'swami-vivekananda', 'nisargadatta-maharaj', 'mahavatar-babaji', 'lahiri-mahasaya', 'sri-yukteswar', 'abhinavagupta', 'sarada-devi', 'adi-shankara', 'shiva-sutras', 'ramana-maharshi'}
# ---- figures
PEOPLE = json.load(open(APP + 'wisegraph/people.json'))['people']
FIG = {x['id']: [a for a in x.get('aliases', [])] for x in PEOPLE if x['kind'] in ('figure', 'text')}
FIG.update({
    'ramana-maharshi': ['ramana', 'maharshi', 'maharishi ramana', 'bhagavan sri ramana'],
    'nisargadatta-maharaj': ['nisargadatta', 'nisarga'],
    'ramakrishna': ['ramakrishna', 'thakur'], 'swami-vivekananda': ['vivekananda'],
    'paramahansa-yogananda': ['yogananda', 'gurudeva', 'autobiography of a yogi'], 'mahavatar-babaji': ['babaji'],
    'lahiri-mahasaya': ['lahiri'], 'sri-yukteswar': ['yukteswar', 'yukteshwar'], 'abhinavagupta': ['abhinavagupta', 'abhinava', 'tantraloka', 'tantrāloka'],
    'shiva-sutras': ['shiva sutras?', 'śiva sūtras?', 'shiva-sutra'], 'adi-shankara': ['shankara', 'shankaracharya', 'śaṅkara', 'sankara', 'vivekachudamani'],
    'sarada-devi': ['holy mother', 'sarada devi', 'sri sarada'], 'papaji': ['papaji', 'poonja', 'poonjaji'],
    'jesus': ['jesus', 'christ'], 'the-buddha': ['buddha'], 'jiddu-krishnamurti': ['krishnamurti'],
    'vijnana-bhairava': ['vijñāna-bhairava', 'vijnana bhairava', 'vijñāna bhairava', 'vbt'], 'atmananda-krishna-menon': ['atmananda'],
    'jean-klein': ['jean klein'], 'bhagavad-gita': ['bhagavad gita'], 'meister-eckhart': ['eckhart'],
})
FRX = {f: re.compile(r'(?<![\w])(' + '|'.join(a) + r')(?![\w])', re.I) for f, a in FIG.items() if a}
def figures(p, spk):
    s = p['title'] + ' ' + (p['snippet'] or '')
    out = [f for f, rx in FRX.items() if rx.search(s)]
    if p['chanId'] == 'UCeNlB-eW4MP1syhRGcYcEmA' and 'ramana-maharshi' not in out and re.search(r'bhagavan|arunachala', s, re.I): out.append('ramana-maharshi')
    for f in ('bhagavad-gita', 'swami-vivekananda', 'adi-shankara'):
        if f in out and not FRX[f].search(p['title']) and not re.search(r"(vivekananda[’']s|vivekananda (said|says|taught|wrote|explains|declared)|bhagavad gita|shankaracharya)", p['snippet'] or '', re.I): out.remove(f)
    if 'jesus' in out and not re.search(r'jesus|christ\b', p['title'], re.I): out.remove('jesus')
    return [f for f in out if f != spk]

RARE_FIG_ = {'ramakrishna', 'swami-vivekananda', 'nisargadatta-maharaj', 'mahavatar-babaji', 'lahiri-mahasaya', 'sri-yukteswar', 'abhinavagupta', 'sarada-devi', 'adi-shankara', 'shiva-sutras', 'ramana-maharshi'}
QUOTA = {'UCxXWjjtATq3OM545gMh9PUg': 44, 'UCZOKv_xnTzyLD9RJmbBUV9Q': 54, 'UCpw2gh99XM6Mwsbksv0feEg': 24, 'UCBj2I1l_ubQuWrdJV2Ns_Tg': 22,
         'UCAYslZlNuBDD7FMvpjWLtoQ': 22, 'UC7i47784NqiOl244eGEJDew': 26, 'UCpESGVz_4KaI3duvhfedf7g': 22, 'UCKYC_hMs3JRWaM_dfi_BnxA': 22,
         'UCqr3sDl5CzjQwOHiVLal4gQ': 28, 'UCeNlB-eW4MP1syhRGcYcEmA': 18, 'UCBcqQGNwcSEwlv6gJXP-U9A': 14, 'UCoeQClkDRaj9uABKHfHJUdw': 18,
         'UCuv4AUvgAgut3zdiPmvG5Pw': 6}
SPK_CAP = 60

rows = []; drop = collections.Counter()
for p in P:
    t = clean(p['title']); sn = clean(p['snippet'])
    if not p['sec'] or p['sec'] < 60 or p['sec'] > 1200: drop['length'] += 1; continue
    if NONLATIN.search(t): drop['lang'] += 1; continue
    if EXC.search(t): drop['nontalk'] += 1; continue
    if p['chanId'] == 'UCuv4AUvgAgut3zdiPmvG5Pw' and not re.search(r'english', t + ' ' + sn, re.I): drop['belur-nonEnglish'] += 1; continue
    if p['chanId'] == 'UCeNlB-eW4MP1syhRGcYcEmA' and not re.search(r'talk|interview|speech|address|footage|film|documentary|remini|memor|with bhagavan|bhagavan with|life of|teachings|recollect|import of|lecture|satsang|about|devotee|remembers|message|journey|who is', t, re.I): drop['ramanasramam-nontalk'] += 1; continue
    sp = speaker(p)
    if not sp: drop['no-speaker'] += 1; continue
    tp = tag(t, sn, p.get('q'))
    if not tp and p['chanId'] in ('UCeNlB-eW4MP1syhRGcYcEmA', 'UCBcqQGNwcSEwlv6gJXP-U9A') and re.search(r'devotee|interview|remembers|recollection|memories', t, re.I): tp = [['faith/bhakti', 0.5, 'rule']]
    if not tp:
        f0 = figures(p, sp[0])
        if set(f0) & RARE_FIG: tp = [['texts' if re.search(r'reading|parable|gospel|kathamrita', t, re.I) else 'guru', 0.5, 'rule']]
    if not tp: drop['no-topic'] += 1; continue
    figs = figures(p, sp[0])
    pr = sum(1 for n, c, s in tp if n.split('/')[0] in PRIORITY)
    score = sum(c * W.get(n.split('/')[0], 1) for n, c, s in tp if n.split('/')[0] in PRIORITY) * 2 + sum(c for n, c, s in tp) * 0.5 + math.log10((p['views'] or 0) + 10) * 0.6 + 0.6 * min(len(figs), 2) + sum(1.6 for f in figs if f in RARE_FIG)
    if p['chanId'] == 'UCeNlB-eW4MP1syhRGcYcEmA' and sp[0] == 'sri-ramanasramam': score -= 0.5
    rows.append(dict(p, title=t, snippet=sn, spk=sp, topics=tp, figs=figs, score=round(score, 3), prio=pr))

open('raw/tagged_ids.txt', 'w').write('\n'.join(r['id'] for r in rows))
EMB = {}
for r in rows:
    f = 'cache/cache/embed/' + r['id'] + '.json'
    if os.path.exists(f):
        e = json.load(open(f)); EMB[r['id']] = e
rows = [r for r in rows if r['id'] not in EMB or (EMB[r['id']].get('oembed') == 200 and EMB[r['id']].get('embed') == 'OK' and EMB[r['id']].get('playableInEmbed'))]
print('after embed filter', len(rows), 'unchecked', sum(1 for r in rows if r['id'] not in EMB))
# select: per channel quota, per speaker cap, prefer priority-topic coverage; dedupe near-identical titles
by = collections.defaultdict(list)
for r in rows: by[r['chanId']].append(r)
sel = []; spk_n = collections.Counter(); seen = set()
for c, l in by.items():
    l.sort(key=lambda r: -r['score'])
    q = QUOTA.get(c, 10); n = 0; tcount = collections.Counter()
    for r in l:
        if n >= q: break
        k = re.sub(r'[\W\d]+', '', r['title'].lower())[:64]
        if k in seen: continue
        if spk_n[r['spk'][0]] >= SPK_CAP: continue
        top = r['topics'][0][0].split('/')[0]
        if tcount[top] >= max(4, q // 3): continue  # spread topics within a teacher
        seen.add(k); spk_n[r['spk'][0]] += 1; tcount[top] += 1; n += 1; sel.append(r)

# figure-fill: make sure the named figures of this group are reachable; swap out the weakest non-figure clip of the same channel
FILL = {'ramakrishna': 7, 'swami-vivekananda': 7, 'sarada-devi': 3, 'nisargadatta-maharaj': 7, 'ramana-maharshi': 16, 'mahavatar-babaji': 3,
        'lahiri-mahasaya': 3, 'sri-yukteswar': 3, 'paramahansa-yogananda': 14, 'abhinavagupta': 6, 'shiva-sutras': 4, 'adi-shankara': 4}
selids = {r['id'] for r in sel}
for f, tgt in FILL.items():
    have = sum(1 for r in sel if f in r['figs'])
    for r in sorted([r for r in rows if f in r['figs'] and r['id'] not in selids], key=lambda r: -r['score']):
        if have >= tgt: break
        k = re.sub(r'[\W\d]+', '', r['title'].lower())[:64]
        if k in seen or spk_n[r['spk'][0]] >= SPK_CAP: continue
        victims = [v for v in sel if v['chanId'] == r['chanId'] and not (set(v['figs']) & set(FILL))]
        if victims:
            v = min(victims, key=lambda v: v['score']); sel.remove(v); selids.discard(v['id']); spk_n[v['spk'][0]] -= 1
        sel.append(r); selids.add(r['id']); seen.add(k); spk_n[r['spk'][0]] += 1; have += 1
json.dump(sel, open('raw/presel.json', 'w'), indent=0, ensure_ascii=False)
open('raw/presel_ids.txt', 'w').write('\n'.join(r['id'] for r in sel))
print('pool', len(P), 'tagged', len(rows), 'selected', len(sel), dict(drop))
print(collections.Counter(r['channel'] for r in sel))
print(collections.Counter(r['spk'][1] for r in sel).most_common(40))
tc = collections.Counter(n.split('/')[0] for r in sel for n, c, s in r['topics']); print(tc.most_common())
