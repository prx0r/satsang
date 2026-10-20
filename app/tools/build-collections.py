#!/usr/bin/env python3
"""Practices + editorial collections -> site/data/wisegraph/collections.json (specs/DATA-MODEL.md §2.4, ROADMAP 9 + 12).

Practices: every hub practice (wisegraph/hubs.json, Wiser's own short summaries with a source link) plus the deep sourcers'
practices.json, merged by id (slug of the name). Each gets steps (its how-to split into sentences, seconds spread over a
default length), a needsTeacher flag (empowerment / orientation-only / historical / energy practices) and cautions.
Collections: wisegraph/collections.json (hand-authored) with item selectors resolved against clips.json at build time
(watch items keep 3 candidates so the client can skip a vertical clip on desktop or an unplayable one).
No transcripts are read. Run after build-hubs.py:  python3 tools/build-collections.py
"""
import json, re, os, unicodedata, glob, math, collections
HERE = os.path.dirname(os.path.abspath(__file__)); APP = os.path.dirname(HERE); WISER = os.path.dirname(APP)
import sys; sys.path.insert(0, HERE)
from source_maps import KEEPER_URL_MOVED
J = lambda p: json.load(open(p))
def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:60]

clips = J(os.path.join(APP, 'clips.json'))
wise = J(os.path.join(APP, 'site/data/wisegraph/wise.json')); TR = wise['traditions']; PEOPLE = wise['people']
hubs = J(os.path.join(APP, 'site/data/wisegraph/hubs.json'))['hubs']
def chain(t):
    out, g = [], 0
    while t and t in TR and g < 10: out.append(t); t = TR[t].get('parent'); g += 1
    return out or [t]
fam = lambda t: chain(t)[-1]
LABEL_TO_TRAD = {v['label'].lower(): k for k, v in TR.items()}

# ---------- practices ----------
NEEDS = re.compile(r'orientation only|empowerment|historical description|powa|phowa|khec|kundalini|bhairavi sadhana|double breath|tummo|transference', re.I)
ENERGY = re.compile(r'breath|pranayama|kundalini|kriya|double breath|bhastrika', re.I)
def steps_of(how, minutes):
    parts = [p.strip() for p in re.split(r'(?<=[.!?])\s+(?=[A-Z"“(])', how or '') if len(p.strip()) > 3]
    parts = parts[:8] or [how]
    total = minutes * 60
    # first and last steps short (settle, close), the middle ones carry the sit
    w = [1] + [3] * max(0, len(parts) - 2) + ([1] if len(parts) > 1 else [])
    s = sum(w)
    return [{'n': i + 1, 'text': t, 'seconds': int(round(total * w[i] / s))} for i, t in enumerate(parts)]
practices, BYNAME = {}, {}
ALIAS = {}  # a sourcer's own practice id -> the built id (packs 43/45 reuse deep-tantra ids such as vbt-breath-pause)
def add_practice(p, topic=None):
    name = p.get('name') or ''
    if not name: return None
    pid = BYNAME.get(slug(name)) or p.get('id') or slug(name)
    BYNAME.setdefault(slug(name), pid)
    if p.get('id') and p['id'] != pid: ALIAS.setdefault(p['id'], pid)
    how = p.get('how') or p.get('howto') or p.get('how_to') or ''
    src = p.get('url') or p.get('source_url') or (p.get('sources') or [None])[0] or (p.get('source') if str(p.get('source', '')).startswith('http') else None)
    src = KEEPER_URL_MOVED.get(src, src)  # keeper fixes (tools/source_maps.py)
    srcl = p.get('src') or p.get('source_note') or (p.get('source') if not str(p.get('source', '')).startswith('http') else '') or ''
    trad = p.get('school') or p.get('tradition') or LABEL_TO_TRAD.get(str(p.get('trad', '')).lower()) or ''
    trad_label = p.get('trad') or TR.get(trad, {}).get('label', '')
    rec = practices.get(pid)
    if not rec:
        mins = 10 if re.search(r'sit|breath|meditat|mantra|japa|prayer|awareness|zazen|shikantaza|mu\b', name + how, re.I) else 5
        needs = bool(NEEDS.search(name + ' ' + how)) or p.get('needsTeacher') is True  # the sourcer's own flag always holds (satsang-extensions 04)
        cautions = [str(x) for x in p.get('contraindications') or []][:3]
        if needs: cautions.append('Orientation only: this practice is traditionally learned from a qualified teacher in its lineage. Read and listen; do not attempt it from a summary.')
        if ENERGY.search(name + ' ' + how) and not needs: cautions.append('Keep the breath natural and unforced. Stop if you feel dizzy, anxious or unwell.')
        if re.search(r'death|dying|die|bardo|corpse', name + how, re.I): cautions.append('Reflections on death can stir grief. Go gently, and set the practice aside if it overwhelms you.')
        rec = practices[pid] = {'id': pid, 'name': name, 'tradition': trad, 'tradLabel': trad_label, 'how': how, 'source': src, 'sourceLabel': srcl,
                                'needsTeacher': needs, 'cautions': cautions, 'minutes': mins, 'topics': [], 'steps': [] if needs else steps_of(how, mins)}
    if topic and topic not in rec['topics']: rec['topics'].append(topic)
    if p.get('topics'):
        for t in p['topics']:
            r = t.split('/')[0]
            if r not in rec['topics']: rec['topics'].append(r)
    return pid
for t, h in hubs.items():
    for p in h.get('practices', []): add_practice(p, t.split('/')[0])
for f in sorted(glob.glob(os.path.join(WISER, 'sources', 'deep-*', 'practices.json')) + glob.glob(os.path.join(WISER, 'sources', 'ext-*', 'practices.json'))):
    d = J(f); L = d if isinstance(d, list) else d.get('practices', [])
    for p in L: add_practice(p)

# practice attributions from staged packs (sources/ext-*/practice-links.json): teachers who teach the method publicly
for f in sorted(glob.glob(os.path.join(WISER, 'sources', 'ext-*', 'practice-links.json'))):
    for pid, l in (J(f).get('links') or {}).items():
        if pid in practices: practices[pid]['teachers'] = sorted(set(practices[pid].get('teachers', []) + [t for t in l.get('teachers') or [] if t in PEOPLE]))
# ---------- clip selection ----------
DEEP = collections.Counter(c['speaker'] for c in clips if not c.get('full') and c.get('delivery') != 'footage' and not c.get('hubOnly'))
def ballot(c): return not c.get('full') and c.get('delivery') != 'footage' and not c.get('hubOnly')
def sec(c): return (c.get('end') or 0) - (c.get('start') or 0) if c.get('end') else c.get('dur') or c.get('sec') or 0
def score(c):
    s = DEEP[c['speaker']]
    return (1.0 if s >= 8 else 0.3) + 0.15 * math.log10(1 + (c.get('views') or 0)) + (0.3 if 240 <= sec(c) <= 1200 else 0) + (0.2 if c.get('format') != 'vertical' else 0)
def pick(sel, used, n=3):
    rx = re.compile(sel['rx'], re.I) if sel.get('rx') else None
    L = [c for c in clips if ballot(c) and c['id'] not in used
         and (not sel.get('topic') or sel['topic'] in (c.get('topics') or []))
         and (not sel.get('trad') or sel['trad'] in chain(c['tradition']))
         and (not sel.get('notTrad') or sel['notTrad'] not in chain(c['tradition']))
         and (not sel.get('speaker') or c['speaker'] == sel['speaker'])
         and (not rx or rx.search((c.get('segTitle') or c.get('title') or '') + ' ' + (c.get('ytTitle') or '')))]
    L.sort(key=score, reverse=True)
    out, sp = [], set()
    for c in L:  # different speakers among the candidates where possible
        if c['speaker'] in sp and len(L) > n: continue
        out.append(c['id']); sp.add(c['speaker'])
        if len(out) >= n: break
    return out

spec = J(os.path.join(APP, 'wisegraph/collections.json'))
# staged packs (sources/ext-*/collections.json): new ids are appended; FOLD puts a pack's units into the canonical set instead of a twin
FOLD = {'rebirth-read-and-practise': 'rebirth-across-traditions'}  # satsang-extensions 03 MERGE-NOTES: one rebirth set survives, never both
BYCOL = {c['id']: c for c in spec['collections']}
for f in sorted(glob.glob(os.path.join(WISER, 'sources', 'ext-*', 'collections.json'))):
    for c in J(f).get('collections') or []:
        tgt = BYCOL.get(FOLD.get(c['id'], ''))
        if tgt is not None:
            if not tgt.get('units'): tgt['units'] = c.get('units') or []
        elif c['id'] not in BYCOL: spec['collections'].append(c); BYCOL[c['id']] = c
out_cols, missing = [], []
for col in spec['collections']:
    used, units = set(), []
    def resolve(it):
        o = {k: v for k, v in it.items() if k not in ('select',)}
        if it.get('select'):
            ids = pick(it['select'], used, it.get('n', 3))
            if not ids: missing.append((col['id'], it.get('note') or it['select'])); return None
            used.update(ids[:1]); o['ref'] = 'clip:' + ids[0]; o['alts'] = ids[1:]
        if it.get('practice'):
            it = {**it, 'practice': it['practice'] if it['practice'] in practices else ALIAS.get(it['practice'], it['practice'])}
            if it['practice'] not in practices: missing.append((col['id'], it['practice'])); return None
            o['ref'] = 'practice:' + it['practice']; o.pop('practice')
        return o
    for u in col.get('units', []):
        items = [x for x in (resolve(i) for i in u.get('items', [])) if x]
        units.append({**{k: v for k, v in u.items() if k != 'items'}, 'items': items})
    items = [x for x in (resolve(i) for i in col.get('items', [])) if x]
    out_cols.append({**{k: v for k, v in col.items() if k not in ('units', 'items')}, 'units': units, 'items': items})

out = {'built': spec.get('version', 1), 'practices': practices, 'collections': out_cols}
dst = os.path.join(APP, 'site/data/wisegraph/collections.json')
json.dump(out, open(dst, 'w'), ensure_ascii=False, separators=(',', ':'))
print(f'{len(practices)} practices ({sum(p["needsTeacher"] for p in practices.values())} orientation-only), {len(out_cols)} collections -> {os.path.relpath(dst, APP)}')
for m in missing: print('  unresolved:', m)
