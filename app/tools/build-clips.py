# Wiser data pipeline: raw channel metadata + wisegraph + (internal) transcripts -> clips.json and the published data files.
# Metadata only (yt-dlp flat channel listing, oEmbed/embed playability, search-row description snippet, the official
# Hillside Hermitage archive table). Transcripts are read for TAGGING ONLY: no transcript text, URL or source path is ever
# written to any output; a clip only carries `transcript: true`.
#
# usage: python3 tools/build-clips.py RAW_DIR TRANSCRIPT_DIR
#   RAW_DIR        videos.json (yt-dlp --flat-playlist -J of the channel /videos tab), embed.json (tools/yt-meta.py embed cache,
#                  merged), desc.json (yt-meta.py desc cache, merged), fmt.json ({id: isVertical}), archive_rows.json
#                  (archive.hillsidehermitage.org table: code, date, title, dur, yt[], pdf[])
#   TRANSCRIPT_DIR <youtube id>.txt, kept OUTSIDE the repo (internal only)
import json, os, re, sys, math, html, datetime, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW, TR = sys.argv[1], sys.argv[2]
J = lambda p: json.load(open(p))
today = datetime.date.today().isoformat()

videos = J(os.path.join(RAW, 'videos.json'))['entries']
embed = J(os.path.join(RAW, 'embed.json'))
desc = J(os.path.join(RAW, 'desc.json'))
fmt = J(os.path.join(RAW, 'fmt.json'))
arch = {y: r for r in J(os.path.join(RAW, 'archive_rows.json')) for y in r.get('yt') or []}
topics_tree = J(os.path.join(ROOT, 'schema/topics.json'))['tree']
TRAD = {n['id']: n for n in J(os.path.join(ROOT, 'wisegraph/traditions.json'))['nodes']}
PEOPLE = J(os.path.join(ROOT, 'wisegraph/people.json'))['people']
EDGES = J(os.path.join(ROOT, 'wisegraph/edges.json'))['edges']
PBY = {p['id']: p for p in PEOPLE}

def family(t):
    while TRAD[t]['parent']: t = TRAD[t]['parent']
    return t

# ---------- topics: compile the vocabulary ----------
TOP = []  # (id, root, regex, label)
for root, node in topics_tree.items():
    def add(tid, n):
        kws = n.get('kw') or []
        if kws: TOP.append((tid, root, re.compile(r'(?<![\w])(' + '|'.join(kws) + r')(?![\w])', re.I), n.get('label', tid)))
    add(root, node)
    for leaf, n in node.items():
        if isinstance(n, dict) and 'kw' in n: add(root + '/' + leaf, n)

def clean_title(t):
    t = re.sub(r'\s*(---|--|\||-)\s*(by\s+)?(Ajahn\s+)?Nyanamoli Thero.*$', '', t, flags=re.I)
    t = re.sub(r'\s*-\s*by\s+.*Hillside Hermitage.*$', '', t, flags=re.I)
    t = re.sub(r'\s*(---|--|\||-|,)\s*by\s+(Ajahn|Bhikkhu|Sister|Ven\.?|Venerable)?\s*[\w\u0100-\u017f]+( Thero| Thera)?\s*(,.*)?$', '', t, flags=re.I)
    t = re.sub(r'\s*,?\s*Hillside Hermitage,? Sri Lanka\s*$', '', t, flags=re.I)
    t = re.sub(r'\s*\|\s*Q&A with Ajahn Nyanamoli\s*$', ' | Q&A', t, flags=re.I)
    t = re.sub(r'\s*[|,-]\s*(Hillside ?Hermitage(\.org)?|Hillsidehermitage\.org|Ajahn Nyanamoli)\s*$', '', t, flags=re.I)
    t = t.strip(' -|')
    letters = [ch for ch in t if ch.isalpha()]
    if letters and sum(ch.isupper() for ch in letters) / len(letters) > 0.7:  # SHOUTING TITLES -> Title Case, keep short codes
        small = {'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'is', 'of', 'on', 'or', 'the', 'to', 'vs', 'with', 'from'}
        words = t.lower().split(' ')
        t = ' '.join(w if (i and w in small) else (w.upper() if w in {'q&a', 'nod', 'mn', 'sn', 'an'} else w[:1].upper() + w[1:]) for i, w in enumerate(words))
    return t

def speaker_of(t):
    tl = t.lower()
    if 'thaniyo' in tl: return 'thaniyo-thero', 'title'
    if 'medhini' in tl: return 'sister-medhini', 'title'
    if 'anigha' in tl or 'anīgha' in tl: return 'bhikkhu-anigha', 'title'
    return 'ajahn-nyanamoli', ('title' if 'nyanamoli' in tl else 'channel-default')

# ---------- transcripts: densities (internal) ----------
# The v2 roots added for other traditions (guru, reality, the divine, ...) are not read from Hillside transcripts: there
# their cue words mean something else (a sutta 'disciple' is not a guru). Titles and descriptions still tag them.
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from source_maps import TOPIC_NODES
TR_SKIP = {t for t in TOPIC_NODES if '/' not in t}
def words(s): return len(re.findall(r"\w+", s))
TXT = {}
for f in os.listdir(TR):
    if f.endswith('.txt'): TXT[f[:-4]] = open(os.path.join(TR, f), errors='replace').read()
dens = {}  # id -> {topic: per-1000-words}
for vid, s in TXT.items():
    n = max(300, words(s)); d = {}
    for tid, root, rx, _ in TOP:
        c = len(rx.findall(s))
        if c: d[tid] = 1000.0 * c / n
    dens[vid] = d
# per-topic corpus percentile threshold: a transcript topic counts when its density is in the top 25% of transcripts that mention it at all
thr = {}
for tid, *_ in TOP:
    xs = sorted(d[tid] for d in dens.values() if tid in d)
    thr[tid] = xs[int(0.75 * (len(xs) - 1))] if len(xs) >= 8 else (xs[-1] if xs else 1e9)

FIG = [(p['id'], re.compile(r'(?<![\w])(' + '|'.join(re.escape(a) for a in p['aliases']) + r')(?![\w])', re.I)) for p in PEOPLE if p['kind'] != 'speaker' and p.get('aliases')]

clips, stats, removed = [], collections.Counter(), []
NONTALK = re.compile(r'(?i)hermitage life|walkabout|quiet duties|snake|concrete|repairs|we found a cave|searching for a "?meditation cave|cave discovery')
views = sorted(v.get('view_count') or 0 for v in videos)
q = lambda f: views[int(f * (len(views) - 1))]
KING, INDIE = q(0.75), q(0.4)
WIN, FULL = 240, 1200  # passage fallback length; over FULL seconds = a full talk (profile only)
for v in videos:
    vid = v['id']; e = embed.get(vid, {})
    if not (e.get('oembed') == 200 and e.get('embed') == 'OK' and e.get('playableInEmbed')):
        stats['dropped_not_embeddable'] += 1; continue
    if e.get('o_author') and e['o_author'] != 'Hillside Hermitage':
        stats['dropped_not_official'] += 1; continue
    raw_title = v['title']; title = clean_title(raw_title)
    if NONTALK.search(raw_title):  # monastery-life vlogs (building work, wildlife, caves): not talks, kept out of the arena
        removed.append({'id': vid, 'title': raw_title, 'why': 'monastery-life vlog, not a talk'}); stats['dropped_not_a_talk'] += 1; continue
    sp, spsrc = speaker_of(raw_title)
    P = PBY[sp]
    dsn = (desc.get(vid) or {}).get('snippet') or ''
    dur = int(v.get('duration') or e.get('dur') or 0)
    vert = bool(fmt.get(vid))
    a = arch.get(vid) or {}
    # topics
    hits = {}
    for tid, root, rx, _ in TOP:
        if rx.search(raw_title): hits[tid] = max(hits.get(tid, 0), 0.9)
        elif dsn and rx.search(dsn): hits[tid] = max(hits.get(tid, 0), 0.7)
    src_tr = vid in TXT
    if src_tr:
        d = dens[vid]
        ranked = sorted((t for t in d if d[t] >= thr[t] and d[t] >= 0.6 and t.split('/')[0] not in TR_SKIP), key=lambda t: -d[t] / max(thr[t], 1e-6))[:4]
        for t in ranked: hits.setdefault(t, 0.6)
    tids = sorted(hits)
    roots = sorted({t.split('/')[0] for t in tids})
    topics = sorted(set(roots) | {t for t in tids if '/' in t})
    # figures discussed: title + description snippet; transcript only on 4+ mentions (the Buddha is in every talk, so title only)
    figs = []
    for fid, rx in FIG:
        if rx.search(raw_title) or (dsn and rx.search(dsn)): figs.append(fid)
        elif src_tr and fid != 'the-buddha' and len(rx.findall(TXT[vid])) >= 4: figs.append(fid)
    trads = sorted({P['tradition']} | {PBY[f]['tradition'] for f in figs})
    # format style tags (a real link only when two talks share one)
    tl = raw_title.lower(); style = []
    if re.search(r'\bq ?& ?a\b|questions? and answers?', tl): style.append('q-and-a')
    if 'guided' in tl: style.append('guided')
    if re.search(r'\b(sutta|mn ?\d|sn ?\d|an ?\d|majjhima|samyutta|anguttara)\b', tl): style.append('sutta-study')
    if re.search(r'nanavira|ñāṇavīra|notes on dhamma|\bnod\b', tl): style.append('nanavira')
    c = {
        'id': vid, 'teacher': P['name'], 'speaker': sp, 'speakerFrom': spsrc,
        'title': title, 'ytTitle': raw_title, 'channel': 'Hillside Hermitage', 'kind': 'human', 'media': 'youtube',
        'checked': today, 'dur': dur, 'sec': dur, 'format': 'vertical' if vert else 'horizontal', 'short': vert or None,
        'carrier': 'own', 'setting': 'talk', 'region': family(P['tradition']), 'tradition': P['tradition'],
        'traditions': trads, 'figures': figs, 'topics': topics, 'style': style,
        'published': a.get('date'), 'year': int(a['date'][:4]) if a.get('date') else None, 'code': a.get('code'),
        'views': v.get('view_count'), 'tier': 'king' if (v.get('view_count') or 0) >= KING else ('indie' if (v.get('view_count') or 0) <= INDIE else None),
        'transcript': src_tr or None,
        'tags': {'v': 1, 'topics': [[t, round(hits[t], 2), 'title' if hits[t] >= 0.9 else ('desc' if hits[t] >= 0.7 else 'transcript')] for t in tids],
                 'lang': ['en', 0.9, 'rule'], 'band': 'short' if dur < 420 else ('mid' if dur < 1800 else 'long')},
    }
    # Wiser length rule (2026-10-20): talks of 1-20 min play whole. A talk over 20 min is a "full talk": it stays on the
    # teacher's profile (Full talks) and leaves the ballot pool, unless it is cut into virtual clips (rows with parent/start/end,
    # id `${videoId}@${start}`, from the sourcing pipeline). Until any virtual clips exist, `passage` keeps the old fallback
    # (a WIN-second passage from 20% in); the app only screens it when its 1-20 min pool runs dry (src/app.js PASSAGE_FALLBACK).
    if dur > FULL:
        c['full'] = True
        s = int(min(max(60, dur * 0.2), dur - WIN)); c['passage'] = [s, s + WIN]
    clips.append({k: x for k, x in c.items() if x is not None})
    stats['vertical' if vert else 'horizontal'] += 1
    if src_tr: stats['transcript_matched'] += 1
    if not topics: stats['untagged'] += 1

# ---------- the sourcing groups' candidates (../sources/<group>/candidates.json, merged once REPORT.md exists) ----------
# Each row is validated, de-duplicated by id (virtual id = videoId@start; first seen wins: Hillside above, then groups A-Z),
# normalised (sec = played length: the passage for a virtual clip; dur = the full video), its topics checked against the
# merged vocabulary (aliases such as karma -> kamma resolved, roots added for leaves so #topic/<root> groups them), and its
# tradition / figures mapped onto the wisegraph ids. Teacher caps are the sourcers' own. Rows that fail are counted, not kept.
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from source_maps import groups, TRAD_MAP, PERSON_MAP, SPEAKER_MAP, TOPIC_ALIAS, CHANNEL_DROP, CLIP_TRADITION
SRC = os.environ.get('WISER_SOURCES') or os.path.join(ROOT, '..', 'sources')
VALID = set()
for root, node in topics_tree.items():
    VALID.add(root); VALID.update(root + '/' + k for k, n in node.items() if isinstance(n, dict) and 'kw' in n)
VT = J(os.path.join(ROOT, 'tools/virtual-titles.json'))['titles'] if os.path.exists(os.path.join(ROOT, 'tools/virtual-titles.json')) else {}
seen_ids = {c['id'] for c in clips}
src_stats = collections.Counter(); src_drop = collections.Counter()
def norm_topic(t):
    t = TOPIC_ALIAS.get(t, t)
    return t if t in VALID else None
def band(s): return 'short' if s < 420 else ('mid' if s < 1800 else 'long')
from source_maps import DEEP_TRAD_MAP, DEEP_PERSON_MAP, DEEP_CARRIER_DROP, DEEP_CARRIER_LABEL, DEEP_TOPIC_FIX, DEEP_LECTURE, DEEP_TOPIC_SHORT
def dt(x): x = DEEP_TRAD_MAP.get(x, x); return TRAD_MAP.get(x, x)
def gfile(g):  # older groups write candidates.json, the deep pass writes clips.json
    for fn in ('candidates.json', 'clips.json'):
        if os.path.exists(os.path.join(SRC, g, fn)): return os.path.join(SRC, g, fn)
    return None
# deep-pass title tagging: the vocabulary minus the cue words the sourcers found mis-firing on these catalogues
# ('sad\w*' matched sādhana/Sadhguru, 'mother' the Divine Mother, 'bhava' Bhairava/bhāva, 'change' climate change, 'bardo\w*' Bardon,
# 'body' the subtle body, 'master' The Master and his Emissary, 'intention'/'merit', 'lie')
DEEP_TOP = []
for tid, root, rx, lab in TOP:
    fx = DEEP_TOPIC_FIX.get(tid)
    if fx is None: DEEP_TOP.append((tid, rx)); continue
    node = topics_tree[root] if tid == root else topics_tree[root][tid.split('/')[1]]
    kws = [k for k in node['kw'] if k not in fx.get('drop', [])] + fx.get('add', [])
    if kws: DEEP_TOP.append((tid, re.compile(r'(?<![\w])(' + '|'.join(kws) + r')(?![\w])', re.I)))
DEEP_MASK = re.compile(r'(?i)the master and his emissary|climate change|subtle body|bardon\b|sadhguru|divine mother')
SUSPECT = {'emotions/sadness', 'emotions', 'impermanence', 'guru', 'feeling', 'relationships', 'rebirth', 'kamma', 'virtue', 'craving/sensuality', 'craving'}
def deep_tags(title):
    t = DEEP_MASK.sub(' ', title)
    return {tid for tid, rx in DEEP_TOP if rx.search(t)}
# natural uploads of 1-20 min across every source: a virtual passage of one of these is a duplicate
NAT_SHORT = {c['id'] for c in clips if not c.get('full')}
for g in groups(SRC):
    f = gfile(g)
    if f:
        for r in J(f):
            if not r.get('parent') and '@' not in str(r.get('id')) and 60 <= int(r.get('dur') or 0) <= FULL: NAT_SHORT.add(str(r.get('id')))
VSPAN = collections.defaultdict(list)  # parent -> accepted (start, end)
def strip_speaker(t, names):  # 'Abiding in Emptiness | Yongey Mingyur Rinpoche' -> 'Abiding in Emptiness'
    for n in sorted({x for x in names if x and len(x) > 3}, key=lambda x: (-len(x), x)):  # deterministic (ties by name)
        e = re.escape(n)
        t2 = re.sub(r'\s*[|\-\u2013\u2014:~,]\s*(with |by )?(Prof\.?|Dr\.?|Ven\.?)?\s*' + e + r'\s*$', '', t, flags=re.I)
        t2 = re.sub(r'^\s*(Prof\.?|Dr\.?)?\s*' + e + r'\s*[|\-\u2013\u2014:~]\s*', '', t2, flags=re.I)
        if len(t2) >= 8 and t2 != t: return t2.strip(' -|:')
    return t
for g in groups(SRC):
    f = gfile(g)
    if not f: continue
    deep = g.startswith('deep-')
    for r in J(f):
        if deep:
            if r.get('carrier') in DEEP_CARRIER_DROP: src_drop['carrier_unverified'] += 1; continue
            if re.search(r'(?i)\bhindi\b|in hindi|\u0939\u093f\u0902\u0926\u0940|book launch', r.get('ytTitle') or r.get('title') or ''): src_drop['not_english_or_not_talk'] += 1; continue
            r = dict(r); r['speaker'] = DEEP_PERSON_MAP.get(r.get('speaker'), r.get('speaker'))
            if r.get('carrier') == 'publisher' and r.get('channel') in DEEP_CARRIER_LABEL: r['carrier'] = DEEP_CARRIER_LABEL[r['channel']]
            if r.get('parent'):
                if r['parent'] in NAT_SHORT: src_drop['virtual_of_natural'] += 1; continue
                try: a0, b0 = int(r['start']), int(r['end'])
                except Exception: src_drop['bad_virtual'] += 1; continue
                if any(min(b0, b1) - max(a0, a1) > 0.5 * min(b0 - a0, b1 - a1) for a1, b1 in VSPAN[r['parent']]): src_drop['virtual_overlap'] += 1; continue
        rid = str(r.get('id') or '')
        if not rid or rid in seen_ids: src_drop['duplicate' if rid else 'no_id'] += 1; continue
        if r.get('media', 'youtube') != 'youtube' or not r.get('title') or not r.get('channel'): src_drop['bad_shape'] += 1; continue
        if r['channel'] in CHANNEL_DROP: src_drop['channel_not_trusted'] += 1; continue
        sp = SPEAKER_MAP.get(r.get('speaker'), r.get('speaker')); sp = PERSON_MAP.get(sp, sp)
        if sp not in PBY: src_drop['unknown_speaker'] += 1; continue
        dur = int(r.get('parentDur') or r.get('dur') or 0)
        virt = r.get('parent') is not None or '@' in rid
        if virt:
            try: s0, e0 = int(r['start']), int(r['end'])
            except Exception: src_drop['bad_virtual'] += 1; continue
            if rid != f"{r['parent']}@{s0}" or not (60 <= e0 - s0 <= FULL) or (dur and e0 > dur + 2): src_drop['bad_virtual'] += 1; continue
            sec = e0 - s0; dur = max(dur, e0)
        else:
            if not (60 <= dur): src_drop['bad_length'] += 1; continue
            sec = dur
        trad = CLIP_TRADITION.get(rid) or TRAD_MAP.get(r.get('tradition'), r.get('tradition'))
        if deep: trad = next((t for t in (dt(r.get('school') or ''), dt(r.get('tradition') or '')) if t in TRAD), PBY[sp]['tradition'])
        if trad not in TRAD: trad = PBY[sp]['tradition']
        figs = []
        for x in r.get('figures') or []:
            x = PERSON_MAP.get(x, x)
            if x in PBY and x != sp and x not in figs: figs.append(x)
        reading = r.get('speaker') == 'rudolf-steiner-press' or r.get('delivery') == 'reading'
        footage = r.get('setting') == 'footage' or r.get('delivery') == 'footage'  # darshan / event film: no teaching to compare
        if reading and 'rudolf-steiner' in figs and sp == 'rudolf-steiner': figs.remove('rudolf-steiner')
        trs = {trad} | {dt(t) for t in r.get('traditions') or []} | {PBY[x]['tradition'] for x in figs}
        trs = sorted(t for t in trs if t in TRAD)
        # topics: aliases, vocabulary check, roots for leaves; the confidence list follows the same rules
        conf = {}
        for tt in (r.get('tags') or {}).get('topics') or []:
            t = norm_topic(tt[0])
            if t and (t not in conf or tt[1] > conf[t][0]): conf[t] = [float(tt[1]), tt[2] if len(tt) > 2 else 'source']
        tps = set()
        for t in r.get('topics') or []:
            t2 = norm_topic(t)
            if t2: tps.add(t2)
            else: src_stats['topic_dropped:' + str(t)] += 1
        tps |= set(conf)
        if deep:
            mine = deep_tags(r.get('ytTitle') or r['title'])
            if r.get('parent'):  # a passage: the lecture's title describes the whole talk, not this passage (weak tag, never used to name it)
                for t in mine:
                    if t not in conf: conf[t] = [0.5, 'talk']; tps.add(t)
                mine = set()
            for t in list(tps):  # drop a sourcer's title cue the fixed vocabulary does not confirm; drop weak school defaults when titles say more
                src = conf.get(t, [0, 'source'])[1]
                if (src == 'title' and t in SUSPECT and t not in mine and not any(m.startswith(t + '/') for m in mine)) or (src in ('school-default', 'rule') and mine):
                    tps.discard(t); conf.pop(t, None)
            for t in mine:
                tps.add(t)
                if t not in conf or conf[t][0] < 0.9: conf[t] = [0.9, 'title']
            tps = {t for t in tps if '/' in t or t in mine or t in conf or any(x.startswith(t + '/') for x in tps)}
        for t in sorted(tps):
            if '/' in t:
                root = t.split('/')[0]; tps.add(root)
                if root not in conf and t in conf: conf[root] = list(conf[t])
        if not tps: src_stats['untagged'] += 1
        title = VT.get(rid) or r['title']
        if deep and not VT.get(rid):
            P0 = PBY[sp]; title = strip_speaker(clean_title(title), [P0['name'], P0.get('short')] + list(P0.get('aliases') or []))
            if r.get('segTitleAuto'):  # machine segment title -> '<topic> and <topic> (from <lecture>)', named only from its tagged topics
                lec = DEEP_LECTURE.get(r.get('ytTitle'), strip_speaker(r.get('ytTitle') or '', [P0['name']]))
                labs = []
                ok = [t for t in sorted(tps) if conf.get(t, [0, 'talk'])[1] != 'talk' and not (t in ('texts/tantra', 'texts') and 'tantr' in lec.lower())]
                ok = [t for t in ok if not any(x.startswith(t + '/') for x in ok)]
                NAMEABLE = {'faith/ritual', 'meditation/mantra', 'guru', 'reality', 'consciousness', 'awakening', 'self', 'divine', 'death', 'rebirth', 'faith', 'meditation',
                            'mindfulness', 'meditation/breath', 'soul', 'gnosis', 'renunciation', 'imaginal'}
                ok = [t for t in ok if '/' in t and not t.startswith(('emotions/', 'craving/')) or t in NAMEABLE]
                for t in sorted(ok, key=lambda t: (-conf.get(t, [0])[0], '/' not in t, t)):  # full key: titles never depend on set order (PYTHONHASHSEED)
                    lab = DEEP_TOPIC_SHORT.get(t) or ((topics_tree[t] if '/' not in t else topics_tree[t.split('/')[0]][t.split('/')[1]]).get('label') or '').lower()
                    if lab and lab not in labs and not any(lab in x or x in lab for x in labs): labs.append(lab)
                if r.get('qa'): title = f'Questions and answers (from {lec})'
                elif labs: t0 = ' and '.join(labs[:2]); title = t0[0].upper() + t0[1:] + f' (from {lec})'
                else: title = None
                if title is None: src_stats['virtual_hub_only'] += 1; title = f'From {lec}'; r = {**r, 'hubOnly': True}
        style = sorted(set(r.get('style') or []) | ({'reading'} if reading else set()) | ({'footage'} if footage else set()))
        c = {
            'id': rid, 'teacher': PBY[sp]['name'], 'speaker': sp, 'speakerFrom': r.get('speakerFrom'),
            'title': title, 'ytTitle': r.get('ytTitle') or r['title'], 'channel': r['channel'], 'kind': 'human', 'media': 'youtube',
            'checked': r.get('checked') or today, 'dur': dur, 'sec': sec,
            'format': 'vertical' if r.get('format') == 'vertical' else 'horizontal', 'short': True if r.get('format') == 'vertical' else None,
            'carrier': r.get('carrier') or 'own', 'setting': 'talk', 'delivery': 'reading' if reading else ('footage' if footage else None),
            'recorded': r.get('recorded'), 'subs': r.get('subs'),
            'region': family(trad), 'tradition': trad, 'traditions': trs, 'figures': figs, 'topics': sorted(tps), 'style': style,
            'published': r.get('published'), 'year': r.get('year'), 'code': r.get('code'),
            'views': r.get('views'), 'tier': None, 'transcript': True if r.get('transcript') else None,
            'tags': {'v': 1, 'topics': [[t, round(conf[t][0], 2) if t in conf else 0.5, conf[t][1] if t in conf else 'source'] for t in sorted(tps)],
                     'lang': (r.get('tags') or {}).get('lang') or ['en', 0.9, 'rule'], 'band': band(sec)},
        }
        if r.get('hubOnly'): c['hubOnly'] = True
        if deep and r.get('segTitleAuto'): c['segAuto'] = True
        if r.get('school') and deep: c['school'] = dt(r['school'])
        if virt:
            VSPAN[r['parent']].append((s0, e0))
            c.update({'parent': r['parent'], 'start': s0, 'end': e0, 'segTitle': title})
            if '(from ' not in title:  # the talk this passage comes from, for "from <talk>" under the title
                tk = re.sub(r'\s*--\s*Courtesy of.*$', '', re.sub(r'^Audio \| ', '', c['ytTitle']).split(' | ')[0]).strip()
                tk = re.sub(r'^\d{4}-\d{2}-\d{2}\s+NS[A-Z]+(\s+\d+)?\s+-\s+', '', tk)  # archive date + series code
                tk = clean_title(tk)  # SHOUTING -> Title Case
                pre = title.split(': ')[0].lower() if ': ' in title else ''
                if not (pre and (pre in tk.lower() or pre.split()[-1] in tk.lower())):  # the title already names its talk
                    c['talk'] = tk if len(tk) <= 80 else tk[:78].rsplit(' ', 1)[0] + '\u2026'
        elif dur > FULL:
            c['full'] = True; s = int(min(max(60, dur * 0.2), dur - WIN)); c['passage'] = [s, s + WIN]
        clips.append({k: x for k, x in c.items() if x is not None})
        seen_ids.add(rid); src_stats['merged:' + g] += 1; src_stats['virtual' if virt else 'natural'] += 1
# machine-cut passages that came out with the same title in one lecture: number them in order
_seg = collections.defaultdict(list)
for c in clips:
    if c.get('segAuto'): _seg[(c['parent'], c['title'])].append(c)
for (pa, ti), L in sorted(_seg.items()):
    if len(L) > 1:
        for i, c in enumerate(sorted(L, key=lambda c: (c['start'], c['id']))):
            c['title'] = c['segTitle'] = ti.replace(' (from ', f', part {i + 1} (from ', 1) if ' (from ' in ti else f'{ti}, part {i + 1}'
stats.update({k: v for k, v in src_stats.items() if not k.startswith('topic_dropped')})
if src_drop: stats.update({'source_dropped:' + k: v for k, v in src_drop.items()})
dropped_topics = {k.split(':', 1)[1]: v for k, v in src_stats.items() if k.startswith('topic_dropped')}
if dropped_topics: print('topics not in the vocabulary (dropped):', dropped_topics, file=sys.stderr)
# verified orientation (tools/orient.py: /shorts oEmbed box + /shorts status, metadata only) beats any defaulted value
FC = os.path.join(ROOT, 'tools/format-cache.json')
if os.path.exists(FC):
    fc = J(FC); fstat = collections.Counter()
    for c in clips:
        r = fc.get(c.get('parent') or c['id'].split('@')[0])
        if not r: fstat['format_unverified'] += 1; continue
        c['format'] = r['f']; c['formatChecked'] = r.get('checked')
        if r['f'] == 'vertical': c['short'] = True
        else: c.pop('short', None)
        fstat['format_' + r['f']] += 1
    stats.update(fstat)
# tier (most watched / hidden gem) per channel family is meaningless across channels: recompute on the whole pool
allv = sorted(c.get('views') or 0 for c in clips)
qa = lambda f: allv[int(f * (len(allv) - 1))]
KING2, INDIE2 = qa(0.75), qa(0.4)
for c in clips:
    if c.get('channel') != 'Hillside Hermitage' or c.get('parent'):
        v = c.get('views') or 0
        t = 'king' if v >= KING2 else ('indie' if v and v <= INDIE2 else None)
        if t: c['tier'] = t
        else: c.pop('tier', None)

json.dump(removed, open(os.path.join(ROOT, 'tools/removed-nontalk.json'), 'w'), ensure_ascii=False, indent=1)
clips.sort(key=lambda c: (c.get('published') or '0000', c['id']), reverse=True)
json.dump(clips, open(os.path.join(ROOT, 'clips.json'), 'w'), ensure_ascii=False, indent=0)
os.makedirs(os.path.join(ROOT, 'site'), exist_ok=True)
# the deployed copy (clips.site.json -> dist/clips.json, see deploy.sh) is slimmed (9k+ rows ship inside the Worker): tagging evidence, check dates and duplicate titles stay in app/clips.json (published is kept: For You's freshness, 2026-10-20)
SITE_DROP = ('tags', 'speakerFrom', 'checked', 'formatChecked', 'transcript', 'segAuto', 'school', 'recorded')
def slim(c):
    o = {k: v for k, v in c.items() if k not in SITE_DROP}
    if o.get('ytTitle') == o.get('title'): o.pop('ytTitle')
    if o.get('segTitle') == o.get('title'): o.pop('segTitle')
    if o.get('carrier') == 'own': o.pop('carrier')
    if o.get('kind') == 'human': o.pop('kind')
    if o.get('media') == 'youtube': o.pop('media')
    if o.get('setting') == 'talk': o.pop('setting')
    if o.get('style') == []: o.pop('style')
    if o.get('figures') == []: o.pop('figures')
    if o.get('sec') == o.get('dur') and not o.get('parent'): o.pop('sec')
    return o
json.dump([slim(c) for c in clips], open(os.path.join(ROOT, 'clips.site.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
json.dump(clips, open(os.path.join(ROOT, 'site/clips.json'), 'w'), ensure_ascii=False, separators=(',', ':'))  # full shape (the MCP data build reads it); deploy.sh ships clips.site.json

# ---------- teachers.json (the site's teacher records: speakers with clips, plus figures for profiles) ----------
nclips = collections.Counter(c['speaker'] for c in clips)
fclips = collections.Counter(f for c in clips for f in c['figures'])
def rec(p):
    t = p['tradition']
    return {'slug': p['id'], 'kind': p['kind'], 'short': p.get('short'), 'tagline': p.get('tagline', ''), 'bio': p.get('bio', ''),
            'tradition': t, 'traditionLabel': TRAD[t]['label'], 'family': family(t), 'familyLabel': TRAD[family(t)]['label'],
            'years': p.get('years'), 'wikidata': p.get('wikidata'), 'links': p.get('links', {}),
            'facts': [x for x in [TRAD[TRAD[t]['parent']]['label'] if TRAD[t]['parent'] else None, p.get('years')] if x],
            'specials': [{'id': w['id'], 'title': w['title'], 'year': w.get('year'), 'kind': w.get('kind')} for w in p.get('works', [])],
            'clips': nclips.get(p['id'], 0), 'about': fclips.get(p['id'], 0)}
teachers = {p['name']: rec(p) for p in PEOPLE if nclips.get(p['id'])}  # anyone with talks on the site (incl. archival figures, readings)
json.dump({'_note': 'Generated by tools/build-clips.py from wisegraph/. Teacher records for speakers with talks on the site.', 'teachers': teachers},
          open(os.path.join(ROOT, 'site/teachers.json'), 'w'), ensure_ascii=False, indent=1)

# ---------- data/wisegraph: boards (funnygraph-shaped), profiles, graph ----------
wg = os.path.join(ROOT, 'site/data/wisegraph'); os.makedirs(wg, exist_ok=True)
people = {}
for p in PEOPLE:
    t = p['tradition']
    people[p['id']] = {'n': p['name'], 'r': family(t), 'c': TRAD[t]['label'], 'k': p['kind'], 'clips': nclips.get(p['id'], 0), 'about': fclips.get(p['id'], 0)}
neighbors = collections.defaultdict(list)
for e in EDGES:
    if e['from'] in PBY and e['to'] in PBY:
        neighbors[e['from']].append([e['to'], e['type']]); neighbors[e['to']].append([e['from'], e['type']])
# same-tradition neighbours as weak links
for p in PEOPLE:
    for q2 in PEOPLE:
        if p['id'] != q2['id'] and p['tradition'] == q2['tradition'] and not any(x[0] == q2['id'] for x in neighbors[p['id']]):
            neighbors[p['id']].append([q2['id'], 'same-tradition'])
for k in people: people[k]['nb'] = [[x[0], 0.6 if x[1] != 'same-tradition' else 0.3] for x in neighbors[k]][:8]
rank_sp = sorted([p for p in PEOPLE if p['kind'] == 'speaker'], key=lambda p: (-nclips.get(p['id'], 0), p['name']))
rank_fg = sorted([p for p in PEOPLE if p['kind'] != 'speaker'], key=lambda p: (-fclips.get(p['id'], 0), p['name']))
fams = [n for n in TRAD.values() if n['kind'] == 'family']
by_trad = []
for f in fams:
    rows = [p for p in PEOPLE if family(p['tradition']) == f['id']]
    rows.sort(key=lambda p: (p['kind'] != 'speaker', -nclips.get(p['id'], 0), -fclips.get(p['id'], 0), p['name']))
    if rows: by_trad.append({'k': f['id'], 'label': f['label'], 'rows': [[p['id'], i + 1, nclips.get(p['id'], 0)] for i, p in enumerate(rows)]})
boards = {
    'speakers': {'label': 'On video', 'rows': [[p['id'], i + 1, nclips.get(p['id'], 0)] for i, p in enumerate(rank_sp)]},
    'traditions': {'label': 'By tradition', 'groups': by_trad},
    'figures': {'label': 'Sources', 'rows': [[p['id'], i + 1, fclips.get(p['id'], 0)] for i, p in enumerate(rank_fg)]},
}
meta = {'sha': 'local', 'synced': today, 'source': 'wisegraph (this repo: wisegraph/*.json)'}
json.dump({'meta': meta, 'people': people, 'boards': boards}, open(os.path.join(wg, 'boards.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
profiles = {}
for p in PEOPLE:
    profiles[p['id']] = {'bio': p.get('bio', ''), 'years': p.get('years'), 'wikidata': p.get('wikidata'),
                         'specials': [{'title': w['title'], 'year': w.get('year'), 'kind': w.get('kind')} for w in p.get('works', [])],
                         'neighbors': [x[0] for x in neighbors[p['id']]][:8],
                         'about': [c['id'] for c in clips if p['id'] in c['figures']][:12]}
json.dump(profiles, open(os.path.join(wg, 'profiles.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
json.dump({'traditions': list(TRAD.values()), 'people': [{k: p.get(k) for k in ('id', 'name', 'kind', 'tradition', 'wikidata', 'years')} for p in PEOPLE], 'edges': EDGES},
          open(os.path.join(wg, 'graph.json'), 'w'), ensure_ascii=False, separators=(',', ':'))

# ---------- D1 seed for the wisegraph tables (api/migrations/0012_wisegraph.sql creates them) ----------
def s(x): return 'NULL' if x is None else "'" + str(x).replace("'", "''") + "'"
L = ['-- generated by tools/build-clips.py; apply after 0012: wrangler d1 execute wiser --remote --file ../wisegraph/seed.sql',
     'DELETE FROM wg_clip_links; DELETE FROM wg_edges; DELETE FROM wg_works; DELETE FROM wg_people; DELETE FROM wg_traditions;']
for n in TRAD.values(): L.append(f"INSERT INTO wg_traditions (id,label,kind,parent,wikidata) VALUES ({s(n['id'])},{s(n['label'])},{s(n['kind'])},{s(n['parent'])},{s(n['wikidata'])});")
for p in PEOPLE:
    L.append(f"INSERT INTO wg_people (id,name,kind,tradition,wikidata,years,bio) VALUES ({s(p['id'])},{s(p['name'])},{s(p['kind'])},{s(p['tradition'])},{s(p.get('wikidata'))},{s(p.get('years'))},{s(p.get('bio'))});")
    for w in p.get('works', []): L.append(f"INSERT OR IGNORE INTO wg_works (id,person,title,year,kind) VALUES ({s(w['id'])},{s(p['id'])},{s(w['title'])},{s(w.get('year'))},{s(w.get('kind'))});")
for e in EDGES: L.append(f"INSERT INTO wg_edges (src,dst,type,conf,note) VALUES ({s(e['from'])},{s(e['to'])},{s(e['type'])},{s(e.get('conf'))},{s(e.get('note'))});")
for c in clips:
    L.append(f"INSERT INTO wg_clip_links (clip,kind,ref) VALUES ({s(c['id'])},'speaker',{s(c['speaker'])});")
    for f in c['figures']: L.append(f"INSERT INTO wg_clip_links (clip,kind,ref) VALUES ({s(c['id'])},'figure',{s(f)});")
    for t in c['traditions']: L.append(f"INSERT INTO wg_clip_links (clip,kind,ref) VALUES ({s(c['id'])},'tradition',{s(t)});")
    for t in c['topics']: L.append(f"INSERT INTO wg_clip_links (clip,kind,ref) VALUES ({s(c['id'])},'topic',{s(t)});")
_pp = os.path.join(ROOT, 'wisegraph/places.json')  # Place layer (api/migrations/0015_places.sql)
if os.path.exists(_pp):
    L.append('DELETE FROM wg_retreats; DELETE FROM wg_place_links; DELETE FROM wg_places;')
    for x in json.load(open(_pp))['places']:
        L.append(f"INSERT INTO wg_places (id,name,type,country,city,lat,lng,founded,url,schedule_url,wikidata,description) VALUES ({s(x['id'])},{s(x['name'])},{s(x['type'])},{s(x.get('country'))},{s(x.get('city'))},{'NULL' if x.get('lat') is None else x['lat']},{'NULL' if x.get('lng') is None else x['lng']},{'NULL' if x.get('founded') is None else int(x['founded'])},{s(x.get('url'))},{s(x.get('schedule_url'))},{s(x.get('wikidata'))},{s(x.get('description'))});")
        for t in x['traditions']: L.append(f"INSERT INTO wg_place_links (place,kind,ref) VALUES ({s(x['id'])},'tradition',{s(t)});")
        for t in x.get('teachers') or []: L.append(f"INSERT INTO wg_place_links (place,kind,ref) VALUES ({s(x['id'])},'teacher',{s(t)});")
        for r in x.get('retreats') or []: L.append(f"INSERT OR IGNORE INTO wg_retreats (id,place,name,typical_length,format,cost_model,schedule_url) VALUES ({s(r['id'])},{s(x['id'])},{s(r['name'])},{s(r.get('typical_length'))},{s(r.get('format'))},{s(r.get('cost_model'))},{s(r.get('schedule_url'))});")
open(os.path.join(ROOT, 'wisegraph/seed.sql'), 'w').write('\n'.join(L) + '\n')

tc = collections.Counter(t for c in clips for t in c['topics'] if '/' not in t)
print(json.dumps({'clips': len(clips), **stats, 'speakers': dict(nclips), 'figures_linked': dict(fclips), 'topics': dict(tc.most_common())}, ensure_ascii=False))
# series live inside topics: every talk in a series carries the series' topic (tools/tag-series.py; after the D1 seed, which it never touches)
import subprocess as _sp; _sp.run([sys.executable, os.path.join(ROOT, 'tools', 'tag-series.py')], check=False)
