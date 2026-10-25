#!/usr/bin/env python3
"""Gold scoring for every clip -> wisegraph/gold.json (+ site/data/wisegraph/gold.json, the public slim copy).

Reproducible: same inputs, same output. Signals (each 0..1):
  A  teacher standing   wikidata id, lineage edges (teacher_of / studied_with / academic), places they founded or taught at,
                        catalogue depth; a public red-flag record caps the clip at 'standard'.
  E  engagement         YouTube views as already recorded in clips.json (percentile inside the speaker's own catalogue, global
                        log-views percentile, views per year). Watch pages are bot-walled from the build machine, so likes are not read.
  C  crowd              site/data/stats.json (public /stats/clips: picks, wins, resonates); neutral 0.5 until a clip has picks.
  T  transcript         INTERNAL ONLY, numbers only: lexical richness, low filler, substantive-term density for clips whose
                        transcript is in the internal folders passed as arguments (as for build-clips.py). No transcript text leaves this script.
  P  topic centrality   tag confidence (title 0.9 / description 0.7), focus (fewer topics = more central), title hits the topic.
  F  form               English, 6-75 min, specific title (not "Live Satsang", dates, class numbers), not footage/reading/short.
score = .30A + .25E + .10C + .10T + .15P + .10F   (T's weight moves to A and P when there is no transcript)

Tiers: gold = a candidate that passed the editorial reading in wisegraph/gold-judgements.json (hand judgement of the
top candidates per topic; each carries a one-line "why it's worth it" in Satsang's own words). strong = the next ~12 %
by score. standard = the rest. Candidates per topic (for the next judging round) go to wisegraph/gold-candidates.json.
Usage:  python3 tools/build-gold.py [INTERNAL_TRANSCRIPT_DIR ...]   (same internal folders as build-clips.py; none = T neutral)
"""
import json, os, re, math, sys, glob, collections, statistics
HERE = os.path.dirname(os.path.abspath(__file__)); APP = os.path.dirname(HERE); WISER = os.path.dirname(APP)
J = lambda p: json.load(open(p))

clips = J(os.path.join(APP, 'clips.json'))
_pp = J(os.path.join(APP, 'wisegraph/people.json'))['people']
people = {p['id']: p for p in _pp} if isinstance(_pp, list) else _pp
edges = J(os.path.join(APP, 'wisegraph/edges.json'))['edges']
places = J(os.path.join(APP, 'wisegraph/places.json'))['places']
redflag = {r['subject'].split('/', 1)[1] for r in J(os.path.join(APP, 'wisegraph/redflags.json'))['records'] if r['subject'].startswith('person/')}
topics_tree = J(os.path.join(APP, 'schema/topics.json'))['tree']
try: stats = J(os.path.join(APP, 'site/data/stats.json')).get('clips') or {}
except Exception: stats = {}
jpath = os.path.join(APP, 'wisegraph/gold-judgements.json')
judg = J(jpath) if os.path.exists(jpath) else {'gold': {}, 'passed': {}}

# ---------- topic labels / keywords ----------
LABEL, KW = {}, {}
def walk(tree, prefix=''):
    for k, v in tree.items():
        tid = prefix + k
        LABEL[tid] = v.get('label', k)
        KW[tid] = re.compile(r'\b(' + '|'.join(v.get('kw') or [re.escape(k)]) + r')', re.I) if v.get('kw') else None
        walk({kk: vv for kk, vv in v.items() if isinstance(vv, dict) and 'label' in vv}, tid + '/')
walk(topics_tree)

# ---------- A: teacher standing ----------
deg = collections.Counter()
for e in edges:
    w = {'teacher_of': 1.0, 'studied_with': 0.7, 'academic_supervisor_of': 0.8, 'dharma_heir_of': 1.0, 'translated': 0.6, 'expounds': 0.5, 'influenced': 0.4}.get(e.get('type'), 0)
    if w:
        deg[e.get('from')] += w; deg[e.get('to')] += w
placed = collections.Counter(t for p in places for t in p.get('teachers') or [])
def ballot(c): return not c.get('full') and c.get('delivery') not in ('footage', 'reading') and not c.get('hubOnly')
depth = collections.Counter(c['speaker'] for c in clips)
def standing(sid):
    p = people.get(sid) or {}
    a = 0.0
    a += 0.22 if p.get('wikidata') else 0
    a += 0.28 * min(1, math.log1p(deg[sid]) / math.log(8))
    a += 0.15 * min(1, placed[sid] / 2)
    a += 0.25 * min(1, math.log1p(depth[sid]) / math.log(60))
    a += 0.10 if (p.get('works') or []) else 0
    return min(1.0, a)
A = {s: standing(s) for s in depth}

# ---------- E: engagement ----------
def views(c): return int(c.get('views') or 0)
by_sp = collections.defaultdict(list)
for c in clips: by_sp[c['speaker']].append(views(c))
for s in by_sp: by_sp[s].sort()
allv = sorted(views(c) for c in clips)
import bisect
def pct(L, v): return bisect.bisect_right(L, v) / max(1, len(L)) if L else 0.5
def engagement(c):
    v = views(c)
    inside = pct(by_sp[c['speaker']], v) if len(by_sp[c['speaker']]) >= 4 else 0.5
    glob_ = pct(allv, v)
    yr = c.get('year') or 2026
    age = max(0.5, 2026.8 - yr)
    vpy = min(1, math.log10(1 + v / age) / 5.5)
    return 0.45 * inside + 0.30 * glob_ + 0.25 * vpy

# ---------- C: crowd ----------
def crowd(c):
    s = stats.get(c['id'])
    if not s: return 0.5, 0
    picks = s.get('picks') or 0; conf = min(1, picks / 30)
    bt = s.get('bt'); wins = s.get('wins')
    base = 1 / (1 + math.exp(-bt)) if isinstance(bt, (int, float)) else ((wins or 0) + 1) / (picks + 2)
    res = min(0.15, 0.03 * (s.get('resonates') or 0))
    return min(1, conf * base + (1 - conf) * 0.5 + res), picks

# ---------- T: transcript quality (internal; numbers only) ----------
TDIRS = [a for a in sys.argv[1:] if os.path.isdir(a)]
tfile = {}
for d in TDIRS:
    for f in glob.glob(os.path.join(d, '**', '*'), recursive=True):
        if os.path.isfile(f) and re.search(r'\.(txt|srt|vtt|md)$', f):
            vid = os.path.basename(f).split('.')[0]
            tfile.setdefault(vid, f)
FILL = re.compile(r"\b(um+|uh+|you know|kind of|sort of|like i said|okay so|right\?)\b", re.I)
SUBST = re.compile(r"\b(mind|awareness|attention|breath|suffering|craving|self|consciousness|liberation|practice|meditation|kamma|karma|rebirth|death|god|soul|grace|love|compassion|wisdom|emptiness|nature|presence|silence|truth|virtue|desire|fear|joy|peace|body|feeling|perception|samadhi|jhana|dhamma|dharma|brahman|atman|shiva|shakti|recognition|prayer|heart)\b", re.I)
def tquality(c):
    vid = c.get('parent') or c['id'].split('@')[0]
    f = tfile.get(vid)
    if not f: return None
    raw = open(f, encoding='utf-8', errors='ignore').read()
    txt = re.sub(r'\d+\n\d\d:\d\d:\d\d[,.]\d+ --> [^\n]+\n', ' ', raw)
    txt = re.sub(r'<[^>]+>|\[[^\]]*\]\([^)]*\)', ' ', txt)
    words = re.findall(r"[a-zA-Z']+", txt.lower())
    if len(words) < 300: return None
    # srt auto-captions repeat each line twice; dedupe consecutive repeats of 6-grams cheaply by unique ratio on a window
    w = words[:6000]
    ttr = len(set(w[:2000])) / min(2000, len(w))
    fill = len(FILL.findall(' '.join(w))) / len(w)
    sub = len(SUBST.findall(' '.join(w))) / len(w)
    q = 0.45 * min(1, max(0, (ttr - 0.20) / 0.25)) + 0.30 * max(0, 1 - fill * 40) + 0.25 * min(1, sub * 25)
    return round(min(1, q), 3)

# ---------- P: topic centrality; F: form ----------
GENERIC = re.compile(r"live satsang|q ?& ?a\b|^satsang\b|dharma talk$|evening talk$|class\s*-?\s*\d+|\b\d{1,2}[./]\d{1,2}[./]\d{2,4}\b|\bpart \d+\b|episode \d+|session \d+|day \d+|^untitled|^\d+$|\(\d{4}-\d\d-\d\d\)|webinar|livestream|live stream|announcement|trailer|promo", re.I)
def text(c): return ' '.join(x for x in [c.get('segTitle'), c.get('title'), c.get('ytTitle'), c.get('talk')] if x)
def centrality(c, t):
    conf = 0.0
    for tt in (c.get('tags') or {}).get('topics') or []:
        if tt[0] == t: conf = max(conf, float(tt[1] or 0))
    if not conf and t in (c.get('topics') or []): conf = 0.6
    if not conf: return 0.0
    n = len([x for x in c.get('topics') or [] if '/' not in x]) or 1
    focus = 1 / (1 + 0.35 * (n - 1))
    kw = KW.get(t); hit = 1.0 if kw and kw.search(c.get('segTitle') or c.get('title') or '') else 0.0
    return min(1, 0.45 * conf + 0.30 * focus + 0.25 * hit)
def sec(c): return ((c.get('end') or 0) - (c.get('start') or 0)) if c.get('end') else (c.get('sec') or c.get('dur') or 0)
def form(c):
    if c.get('delivery') in ('footage', 'reading'): return 0.0
    s = sec(c); lang = ((c.get('tags') or {}).get('lang') or ['en'])[0]
    f = 0.0
    f += 0.35 if lang == 'en' else 0.05
    f += 0.35 if 360 <= s <= 4500 else 0.22 if 180 <= s < 360 else 0.18 if s > 4500 else 0.0
    f += 0.0 if GENERIC.search(text(c)) else 0.20
    f += 0.10 if c.get('format') != 'vertical' else 0.0
    return f

rows, tq_n = {}, 0
for c in clips:
    a = A.get(c['speaker'], 0.2); e = engagement(c); cr, picks = crowd(c); t = tquality(c); f = form(c)
    tops = [x for x in c.get('topics') or []]
    P = {tp: centrality(c, tp) for tp in tops}
    pmax = max(P.values()) if P else 0.0
    if t is None: s = 0.35 * a + 0.25 * e + 0.10 * cr + 0.20 * pmax + 0.10 * f
    else: s = 0.30 * a + 0.25 * e + 0.10 * cr + 0.10 * t + 0.15 * pmax + 0.10 * f; tq_n += 1
    flagged = c['speaker'] in redflag
    if flagged: s *= 0.6
    rows[c['id']] = {'s': round(s, 4), 'A': round(a, 3), 'E': round(e, 3), 'C': round(cr, 3), 'P': {k: round(v, 3) for k, v in P.items() if v}, 'F': round(f, 2), 'picks': picks, 'flag': flagged}

def eligible(c):
    r = rows[c['id']]
    return not r['flag'] and c.get('delivery') not in ('footage', 'reading') and r['F'] >= 0.55 and sec(c) >= 240

# ---------- candidates per topic (MMR: one per speaker, prefer different schools) ----------
BY = {c['id']: c for c in clips}
cands = {}
for t in LABEL:
    L = [c for c in clips if t in (c.get('topics') or []) and eligible(c)]
    if len(L) < 3: continue
    L.sort(key=lambda c: rows[c['id']]['s'] * 0.65 + rows[c['id']]['P'].get(t, 0) * 0.35, reverse=True)
    out, sp, sch = [], set(), collections.Counter()
    for c in L:
        if c['speaker'] in sp: continue
        if sch[c.get('school') or c.get('tradition')] >= 2: continue
        out.append(c['id']); sp.add(c['speaker']); sch[c.get('school') or c.get('tradition')] += 1
        if len(out) >= 8: break
    cands[t] = out

# ---------- tiers ----------
gold = {}
for cid, g in (judg.get('gold') or {}).items():
    if cid in BY and not rows[cid]['flag']: gold[cid] = g
order = sorted((c for c in clips if c['id'] not in gold), key=lambda c: rows[c['id']]['s'], reverse=True)
n_strong = int(0.12 * len(clips))
strong = set()
for c in order:
    if len(strong) >= n_strong: break
    if rows[c['id']]['flag'] or c.get('delivery') in ('footage',): continue
    strong.add(c['id'])
tier = {cid: ('gold' if cid in gold else 'strong' if cid in strong else 'standard') for cid in BY}

out = {'built': 'tools/build-gold.py', 'weights': '.30A+.25E+.10C+.10T+.15P+.10F (no transcript: .35A+.25E+.10C+.20P+.10F); red flag x0.6 and never gold',
       'counts': collections.Counter(tier.values()), 'transcriptScored': tq_n, 'crowdClips': sum(1 for r in rows.values() if r['picks']),
       'gold': {cid: {**g, 'score': rows[cid]['s']} for cid, g in sorted(gold.items(), key=lambda x: -rows[x[0]]['s'])},
       'tiers': tier, 'scores': {cid: rows[cid]['s'] for cid in BY}}
json.dump(out, open(os.path.join(APP, 'wisegraph/gold.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
# internal detail (signal breakdown incl. transcript numbers) never ships: wisegraph/ is not copied to site/
json.dump({'signals': rows}, open(os.path.join(APP, 'wisegraph/gold-signals.json'), 'w'), separators=(',', ':'))
json.dump({'note': 'Top candidates per topic for the editorial gold reading (tools/build-gold.py). Judge, then record in gold-judgements.json.',
           'topics': {t: [{'id': cid, 'speaker': BY[cid]['speaker'], 'title': BY[cid].get('segTitle') or BY[cid]['title'], 'min': round(sec(BY[cid]) / 60),
                           'views': views(BY[cid]), 's': rows[cid]['s'], 'judged': cid in gold or cid in (judg.get('passed') or {})} for cid in L]
                      for t, L in cands.items()}},
          open(os.path.join(APP, 'wisegraph/gold-candidates.json'), 'w'), ensure_ascii=False, indent=0)
# public slim copy for the site: gold why-lines + tier for gold/strong only (standard is the default)
slim = {'gold': {cid: {'why': g['why'], 'topics': g.get('topics') or []} for cid, g in gold.items()},
        'strong': sorted(strong)}
os.makedirs(os.path.join(APP, 'site/data/wisegraph'), exist_ok=True)
json.dump(slim, open(os.path.join(APP, 'site/data/wisegraph/gold.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print('tiers', dict(out['counts']), '| transcript-scored', tq_n, '| crowd clips', out['crowdClips'], '| topics with candidates', len(cands))
