# Pick the new natural clips (1-20 min official uploads) per teacher from raw_discovered.json, balanced toward a target
# depth, topic-tagged from title + search snippet against app/schema/topics.json. Writes ../presel.json + ../presel_ids.txt.
import json, os, re, collections, sys
from discover import CH
HERE = os.path.dirname(os.path.abspath(__file__)); APP = os.path.join(HERE, '..', '..', '..', 'app')
clips = json.load(open(os.path.join(APP, 'clips.json')))
have_yt = {(c.get('parent') or c['id'].split('@')[0]) for c in clips}
have_n = collections.Counter(c['speaker'] for c in clips)
tree = json.load(open(os.path.join(APP, 'schema/topics.json')))['tree']
TOP = []
for root, node in tree.items():
    def add(tid, n):
        if n.get('kw'): TOP.append((tid, re.compile(r'(?<![\w])(' + '|'.join(n['kw']) + r')(?![\w])', re.I)))
    add(root, node)
    for leaf, n in node.items():
        if isinstance(n, dict) and 'kw' in n: add(root + '/' + leaf, n)
TARGET = {'jiddu-krishnamurti': 80, 'swami-sarvapriyananda': 80, 'rupert-spira': 75, 'thanissaro-bhikkhu': 75, 'thich-nhat-hanh': 70,
          'ajahn-brahm': 65, 'tara-brach': 60, 'mingyur-rinpoche': 60, 'ajahn-pasanno': 55, 'swami-tadatmananda': 60, 'mooji': 60,
          'filip-holm': 50, 'ajahn-sumedho': 35, 'ajahn-amaro': 25, 'jack-kornfield': 45, 'dalai-lama': 50, 'francis-lucille': 45,
          'christopher-wallis': 45, 'tsoknyi-rinpoche': 40}
NONTALK = re.compile(r'(?i)\b(chant(ing)?|music|song|kirtan|bhajan|aarti|arati|trailer|teaser|announcement|coming soon|livestream|live ?stream|'
                     r'fundrais\w*|donat\w*|appeal|registration|register now|promo|highlights|montage|ceremony|puja|pooja|robe offering|kathina|'
                     r'birthday celebration|losar|tashi delek|a message from|message from|update (&|and) message|update from|recitation|tribute|testimonial|richard gere|in memoriam|announc\w*|tour of|walking tour|sangha news|update from|happy new year|merry christmas|podcast trailer|ad\b|'
                     r'en espa[ñn]ol|fran[cç]ais|deutsch|portugu[eê]s|italiano|vietnamese|ti[eế]ng vi[eệ]t|hindi|bengali|bangla|tamil|chinese|中文|日本語)')
VIET = re.compile('[ạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹđơư]', re.I)
NAMES = re.compile(r'(?i)th[ií]ch nh[aấ]t h[aạ]nh|thầy')
PRIO = ['rebirth', 'reincarnation', 'past lives', 'after death', 'bardo', 'karma', 'death', 'dying', 'self', 'no self', 'who am I', 'soul', 'awakening']
raw = json.load(open(os.path.join(HERE, '..', 'raw_discovered.json')))
byk = {c[0]: c for c in CH}
cand = collections.defaultdict(dict)
drops = collections.Counter()
for k, r in raw.items():
    key = r['ch']; ch = byk[key]; sp = ch[3]; t = r['title'] or ''
    vid = r['id']
    if not vid or vid in have_yt: drops['have'] += 1; continue
    if not r.get('sec') or not (60 <= r['sec'] <= 1200): drops['length'] += 1; continue
    if ch[4] and not re.search(ch[4], t, re.I): drops['name'] += 1; continue
    if NONTALK.search(t): drops['nontalk'] += 1; continue
    if VIET.search(NAMES.sub('', t)) or sum(ord(x) > 0x2FF for x in t) > 3: drops['lang'] += 1; continue
    # another teacher named in a single-teacher channel's title (e.g. guests): keep only clear single-teacher titles
    if sp == 'ajahn-brahm' and re.search(r'(?i)brahmali|ajahn [a-z]+ and ajahn', t): drops['other'] += 1; continue
    if sp == 'ajahn-pasanno' and re.search(r'(?i)ajahn (amaro|karunadhammo|jotipalo|ñaniko|naniko|kovilo)', t) and 'pasanno' not in t.lower(): drops['other'] += 1; continue
    txt = t + ' ' + (r.get('snippet') or '')
    tops = {}
    for tid, rx in TOP:
        if rx.search(t): tops[tid] = max(tops.get(tid, 0), 0.8)
        elif r.get('snippet') and rx.search(r['snippet']): tops[tid] = max(tops.get(tid, 0), 0.5)
    for tid in list(tops):
        if '/' in tid: tops.setdefault(tid.split('/')[0], tops[tid])
    prio = sum(3 for q in r['queries'] if q in PRIO) + len(r['queries']) + 4 * sum(1 for x in tops if x.split('/')[0] in ('rebirth', 'death', 'self', 'kamma')) + 2 * len(tops)
    o = cand[sp].get(vid)
    if not o or prio > o['prio']:
        cand[sp][vid] = {'id': vid, 'title': t, 'channel': ch[2], 'chanKey': key, 'speaker': sp, 'sec': r['sec'], 'views': r.get('views'), 'ago': r.get('ago'),
                         'snippet': r.get('snippet'), 'topics': tops, 'queries': r['queries'], 'prio': prio + min(3, (r.get('views') or 0) / 50000)}
sel = []
for sp, d in cand.items():
    need = max(0, TARGET.get(sp, 40) - have_n[sp])
    rows = sorted(d.values(), key=lambda x: -x['prio'])
    tagged = [x for x in rows if x['topics']]
    pick = (tagged + [x for x in rows if not x['topics']])[:int(need * 1.35) + 4]  # headroom for the embed check
    sel += pick
    print(f'{sp:26s} have {have_n[sp]:3d} target {TARGET.get(sp,40):3d} found {len(rows):4d} (tagged {len(tagged):4d}) preselect {len(pick)}')
print('drops', dict(drops))
json.dump(sel, open(os.path.join(HERE, '..', 'presel.json'), 'w'), ensure_ascii=False, indent=0)
open(os.path.join(HERE, '..', 'presel_ids.txt'), 'w').write('\n'.join(x['id'] for x in sel) + '\n')
print('preselected', len(sel))
