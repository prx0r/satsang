#!/usr/bin/env python3
"""Machine-readable catalogue for the curator chat (and agents) -> wisegraph/catalog-for-chat.json (+ site/data/wisegraph/catalog.json).

Reads only public, already-built data: clips.json, wisegraph/gold.json (tools/build-gold.py), site/data/wisegraph/
{collections,places,wise,hubs}.json, schema/topics.json. No transcript is read; nothing here is internal.
Run after build-gold.py and build-collections.py:  python3 tools/build-catalog.py
"""
import json, os, re, datetime, collections
HERE = os.path.dirname(os.path.abspath(__file__)); APP = os.path.dirname(HERE); WISER = os.path.dirname(APP)
J = lambda p: json.load(open(p))
_dm = open(os.path.join(WISER, 'domain.mjs')).read()
_act = re.search(r"export const ACTIVE = '(\w+)'", _dm).group(1)
BASE = re.search(_act + r": \{ base: '([^']+)'", _dm).group(1)  # follows ../domain.mjs (legacy = tantrafiles.xyz while satsang.digital is pending)

clips = {c['id']: c for c in J(os.path.join(APP, 'clips.json'))}
gold = J(os.path.join(APP, 'wisegraph/gold.json'))
cols = J(os.path.join(APP, 'site/data/wisegraph/collections.json'))
places = J(os.path.join(APP, 'site/data/wisegraph/places.json'))['places']
wise = J(os.path.join(APP, 'site/data/wisegraph/wise.json'))
hubs = J(os.path.join(APP, 'site/data/wisegraph/hubs.json'))['hubs']
tree = J(os.path.join(APP, 'schema/topics.json'))['tree']
TR, PEOPLE = wise['traditions'], wise['people']

TOP = {}
def walk(t, pre='', parent=None):
    for k, v in t.items():
        tid = pre + k; TOP[tid] = {'id': tid, 'label': v.get('label', k), 'parent': parent}
        walk({a: b for a, b in v.items() if isinstance(b, dict) and 'label' in b}, tid + '/', tid)
walk(tree)

def sec(c): return ((c.get('end') or 0) - (c.get('start') or 0)) if c.get('end') else (c.get('sec') or c.get('dur') or 0)
def yt(c):
    vid = c.get('parent') or c['id'].split('@')[0]
    return f"https://www.youtube.com/watch?v={vid}" + (f"&t={c['start']}s" if c.get('start') else '')
def talk(cid, why=None, tier=None):
    c = clips[cid]
    return {'id': cid, 'title': c.get('segTitle') or c.get('title'), 'teacher': c.get('teacher'), 'speaker': c.get('speaker'),
            'tradition': c.get('tradition'), 'traditionLabel': TR.get(c.get('tradition'), {}).get('label'), 'minutes': round(sec(c) / 60),
            'tier': tier or gold['tiers'].get(cid, 'standard'), 'why': why, 'topics': c.get('topics') or [],
            'site': f"{BASE}/clip/{cid.replace('@', '%40')}", 'youtube': yt(c), 'channel': c.get('channel'), 'year': c.get('year')}

G = gold.get('gold') or {}
provisional = not G
talks = {}
if G:
    for cid, g in G.items():
        if cid in clips: talks[cid] = talk(cid, g.get('why'), 'gold') | {'goldTopics': g.get('topics') or []}
else:  # first run before the editorial reading: best-scored candidate per topic, clearly marked
    cand = J(os.path.join(APP, 'wisegraph/gold-candidates.json'))['topics']
    for t, L in cand.items():
        for x in L[:2]:
            talks.setdefault(x['id'], talk(x['id'], None, 'provisional') | {'goldTopics': []})['goldTopics'].append(t)

topics = []
cnt = collections.Counter(t for c in clips.values() for t in c.get('topics') or [])
for tid, t in TOP.items():
    if not cnt[tid]: continue
    h = hubs.get(tid) or {}
    takes = (wise.get('takes') or {}).get(tid, {}).get('takes') or {}
    g = [cid for cid, x in talks.items() if tid in x['goldTopics']]
    g.sort(key=lambda cid: -gold['scores'].get(cid, 0))
    strong = sorted((cid for cid, c in clips.items() if tid in (c.get('topics') or []) and gold['tiers'].get(cid) == 'strong'), key=lambda cid: -gold['scores'].get(cid, 0))[:6]
    topics.append({'id': tid, 'label': t['label'], 'parent': t['parent'], 'talks': cnt[tid], 'intro': h.get('intro'),
                   'questions': [q.get('label') for q in h.get('questions') or []], 'takes': {TR.get(k, {}).get('label', k): v for k, v in takes.items()},
                   'gold': g, 'strong': strong, 'site': f"{BASE}/topic/{tid}"})

practices = []
for p in cols['practices'].values():
    practices.append({'id': p['id'], 'name': p['name'], 'tradition': p.get('tradLabel') or p.get('tradition'), 'minutes': p.get('minutes'),
                      'needsTeacher': p.get('needsTeacher'), 'cautions': p.get('cautions') or [], 'summary': (p.get('how') or '')[:400],
                      'source': p.get('source'), 'sourceLabel': p.get('sourceLabel'), 'topics': p.get('topics') or [], 'site': f"{BASE}/practice/{p['id']}"})

PL = {p['id']: {'id': p['id'], 'name': p['name'], 'country': p.get('country'), 'url': p.get('url'), 'site': f"{BASE}/place/{p['id']}"} for p in places}
courses, other = [], []
for c in cols['collections']:
    rec = {'id': c['id'], 'kind': c['kind'], 'title': c['title'], 'topic': c.get('topic'), 'intro': c.get('intro'), 'site': f"{BASE}/collection/{c['id']}"}
    if c['kind'] == 'mini-course':
        steps = []
        for u in c.get('units') or []:
            for it in u.get('items') or []:
                ref = it.get('ref') or ''
                kind, _, rid = ref.partition(':')
                st = {'unit': u['n'], 'unitTitle': u.get('title'), 'role': it.get('role'), 'ref': ref, 'note': it.get('note')}
                if kind == 'clip' and rid in clips: st['talk'] = {k: v for k, v in talk(rid, (G.get(rid) or {}).get('why')).items() if k in ('id', 'title', 'teacher', 'minutes', 'why', 'site', 'youtube', 'tier')}
                if kind == 'practice' and rid in cols['practices']:
                    p = cols['practices'][rid]; st['practice'] = {'id': rid, 'name': p['name'], 'needsTeacher': p.get('needsTeacher'), 'cautions': p.get('cautions') or [], 'site': f"{BASE}/practice/{rid}"}
                if kind == 'place': st['place'] = rid
                if kind in ('url', 'text') or it.get('url'): st['url'] = it.get('url')
                if it.get('title') and kind in ('url', 'text'): st['title'] = it['title']
                if it.get('by'): st['by'] = it['by']
                if u.get('listenFor'): st['listenFor'] = u['listenFor']
                steps.append(st)
        rec.update({'level': c.get('level'), 'traditions': c.get('traditions') or [], 'caution': c.get('caution'), 'deeper': [dict(PL.get(d['ref'][6:], {}), note=d.get('note')) for d in c.get('deeper') or []], 'steps': steps})
        for k in ('featured', 'stepCaution', 'further', 'school', 'orientationOnly'):
            if c.get(k): rec[k] = c[k]
        courses.append(rec)
    else: other.append(rec)

pl = []
for p in places:
    if not (p.get('retreats') or p.get('teachers')): continue
    pl.append({'id': p['id'], 'name': p['name'], 'type': p.get('type'), 'traditions': p.get('traditions') or [], 'country': p.get('country'), 'city': p.get('city'),
               'url': p.get('url'), 'teachers': p.get('teachers') or [], 'site': f"{BASE}/place/{p['id']}",
               'retreats': [{'name': r.get('name'), 'length': r.get('typical_length'), 'format': r.get('format'), 'cost': r.get('cost_model'), 'schedule': r.get('schedule_url')} for r in p.get('retreats') or []]})

ref_people = {x['speaker'] for x in talks.values()}
teachers = {pid: {'name': PEOPLE[pid].get('n'), 'tradition': PEOPLE[pid].get('t'), 'years': PEOPLE[pid].get('years'), 'bio': PEOPLE[pid].get('bio'), 'site': f"{BASE}/person/{pid}"}
            for pid in sorted(ref_people) if pid in PEOPLE}

out = {'meta': {'name': 'Satsang curator catalogue', 'built': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%MZ'), 'base': BASE, 'provisional': provisional,
                'license': 'CC BY 4.0 (Satsang editorial data). Talks stay on their hosts; link, never rehost.',
                'tiers': 'gold = editorially read and recommended (each with a why-line); strong = top ~12% by signals; standard = the rest. Counts: ' + json.dumps(gold.get('counts')),
                'rules': ['Recommend gold first, then strong. Quote the why-line, never a transcript.',
                          'Practices marked needsTeacher are orientation only: describe and point to a teacher or place, never give steps.',
                          'Always pass on a practice\'s cautions before suggesting it.', 'No promises of results (past-life memories, powers, awakening).'],
                'counts': {'topics': len(topics), 'goldTalks': len(talks), 'courses': len(courses), 'collections': len(other), 'practices': len(practices), 'places': len(pl)}},
       'topics': topics, 'talks': talks, 'courses': courses, 'collections': other, 'practices': practices, 'places': pl, 'teachers': teachers}
for dst in [os.path.join(APP, 'wisegraph/catalog-for-chat.json'), os.path.join(APP, 'site/data/wisegraph/catalog.json')]:
    json.dump(out, open(dst, 'w'), ensure_ascii=False, separators=(',', ':'))
print('catalog', out['meta']['counts'], 'provisional' if provisional else '', round(os.path.getsize(os.path.join(APP, 'wisegraph/catalog-for-chat.json')) / 1024), 'KB')
