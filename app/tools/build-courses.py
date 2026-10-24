#!/usr/bin/env python3
"""Course tree: tradition > school > course > phase > practice -> site/data/wisegraph/courses.json.

Non-destructive layer over collections (specs/DATA-MODEL.md §2.4): every collection (any kind, mini-course included) becomes a
course node; its units become phases (or the groups in wisegraph/courses.json "phases"); the practices it asks for hang off
each phase. Every practice also sits on its school's shelf, so all 84 have exactly one tradition > school home even when no
course uses them yet. Shape: wisegraph/courses.schema.json. Placement, first match wins:
  1. wisegraph/courses.json placements[course]           (explicit)
  2. the collection's own school (or tradition) field, placed through wise.json like a practice (mini-courses carry a
     family tradition such as buddhism plus a school such as theravada; the school decides)
  3. the lowest common ancestor of its practices' traditions in wise.json, cut at the first traditionRoots node
     (tradition = that root, school = the LCA below it, or the root's generalSchool)
  4. "across" (Across traditions > Side by side) when the practices span roots.
Run after build-collections.py:  python3 tools/build-courses.py
"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); APP = os.path.dirname(HERE)
J = lambda p: json.load(open(p))
CFG = J(os.path.join(APP, 'wisegraph/courses.json'))
COL = J(os.path.join(APP, 'site/data/wisegraph/collections.json'))
TR = J(os.path.join(APP, 'site/data/wisegraph/wise.json'))['traditions']
P, CS = COL['practices'], COL['collections']
ROOTS = CFG['traditionRoots']; LAB = CFG.get('labels', {}); GEN = CFG.get('generalSchool', {})

def chain(t):
    out = []
    while t and t in TR and len(out) < 12: out.append(t); t = TR[t].get('parent')
    return out
def label(t): return LAB.get(t) or TR.get(t, {}).get('label') or t.replace('-', ' ').capitalize()
def root_of(ch):
    for i, t in enumerate(ch):
        if t in ROOTS: return t, i
    return (ch[-1], len(ch) - 1) if ch else (None, -1)
def place_trads(trads):
    """[tradition ids] -> (tradition, school) by the rules above."""
    chs = [chain(t) for t in trads if t and chain(t)]
    if not chs: return 'across', None
    roots = {root_of(c)[0] for c in chs}
    if len(roots) > 1: return 'across', None
    r = roots.pop()
    common = [t for t in chs[0] if all(t in c for c in chs[1:])]   # ancestors shared by all, lowest first
    lca = common[0] if common else r
    return r, (None if lca == r else lca)
def school_id(trad, school): return school or (GEN.get(trad) or {}).get('id') or trad
def school_label(trad, school): return label(school) if school else (GEN.get(trad) or {}).get('label') or label(trad)

def practice_refs(items):
    return [i['ref'][9:] for i in items if str(i.get('ref', '')).startswith('practice:') and i['ref'][9:] in P]

T = {}  # tradition id -> node
def node(trad, school):
    t = T.setdefault(trad, {'id': trad, 'label': label(trad), 'schools': {}})
    sid = school_id(trad, school)
    return t['schools'].setdefault(sid, {'id': sid, 'label': school_label(trad, school), 'tradition': trad, 'courses': [], 'practices': []})

course_index, practice_index = {}, {pid: {'courses': []} for pid in P}
for c in CS:
    units = c.get('units') or []
    pr_all = []
    for u in units: pr_all += practice_refs(u.get('items', []))
    pr_all += practice_refs(c.get('items', []))
    pl = CFG.get('placements', {}).get(c['id']) or {}
    if pl.get('tradition'): trad, school = pl['tradition'], pl.get('school')
    elif c.get('school') in TR: trad, school = place_trads([c['school']])        # mini-courses carry family tradition + school ids
    elif c.get('tradition') in TR or c.get('tradition') == 'across': trad, school = place_trads([c['tradition']]) if c['tradition'] in TR else ('across', None)
    else: trad, school = place_trads([P[p].get('tradition') for p in pr_all])
    groups = CFG.get('phases', {}).get(c['id']) or [{'title': None, 'units': [u['n']]} for u in units]
    byn = {u['n']: u for u in units}
    phases = []
    for gi, g in enumerate(groups, 1):
        us = [byn[n] for n in g['units'] if n in byn]
        if not us: continue
        prs, seen = [], set()
        for u in us:
            for pid in practice_refs(u.get('items', [])):
                if pid in seen: continue
                seen.add(pid); pu = u.get('practice') or {}
                prs.append({k: v for k, v in {'id': pid, 'unit': u['n'], 'minutes': pu.get('minutes') or P[pid].get('minutes'), 'days': pu.get('days'), 'timesPerDay': pu.get('timesPerDay')}.items() if v is not None})
        roles = {}
        for u in us:
            for i in u.get('items', []): roles[i.get('role', 'other')] = roles.get(i.get('role', 'other'), 0) + 1
        ph = {'id': f"{c['id']}/{gi}", 'n': gi, 'title': g.get('title') or us[0].get('title') or f'Phase {gi}', 'units': [u['n'] for u in us],
              'unitTitles': [u.get('title') or '' for u in us], 'practices': prs, 'items': roles}
        days = [u.get('day') for u in us if u.get('day')]
        if days: ph['days'] = [min(days), max(days)]
        tracks = sorted({u['track'] for u in us if u.get('track')})
        if tracks: ph['track'] = tracks[0] if len(tracks) == 1 else 'both'
        phases.append(ph)
    loose = [p for p in practice_refs(c.get('items', [])) if p not in {x['id'] for ph in phases for x in ph['practices']}]
    course = {k: v for k, v in {
        'id': c['id'], 'title': c['title'], 'kind': c.get('kind', 'set'), 'collection': c['id'], 'href': (f"#course/{c['id']}" if c.get('kind') == 'mini-course' else f"#collection/{c['id']}"),
        'intro': c.get('intro'), 'topic': c.get('topic'), 'cadence': c.get('cadence'), 'author': c.get('author'),
        'orientationOnly': c.get('orientationOnly') or None, 'level': c.get('level'), 'phases': phases, 'practices': loose or None,
        'units': len(units), 'minutes': sum(x.get('minutes') or 0 for ph in phases for x in ph['practices']) or None}.items() if v is not None}
    s = node(trad, school); s['courses'].append(course)
    course_index[c['id']] = {'tradition': trad, 'school': s['id']}
    for ph in phases:
        for x in ph['practices']: practice_index[x['id']]['courses'].append({'course': c['id'], 'phase': ph['n'], 'unit': x['unit']})
    for pid in loose: practice_index[pid]['courses'].append({'course': c['id'], 'phase': None})

# every practice on exactly one school shelf (its own tradition), courses or not
for pid, p in sorted(P.items(), key=lambda kv: kv[1]['name']):
    trad, school = place_trads([p.get('tradition')])
    s = node(trad, school); s['practices'].append(pid)
    practice_index[pid].update({'tradition': trad, 'school': s['id']})

# order: traditions by cfg.order then by size; courses by cfg.sequence then title; schools general first then by courses
order = CFG.get('order', [])
def tkey(t): return (order.index(t['id']) if t['id'] in order else len(order), -sum(len(s['courses']) * 5 + len(s['practices']) for s in t['schools'].values()), t['label'])
out_t = []
for t in sorted(T.values(), key=tkey):
    seq = CFG.get('sequence', {}).get(t['id'], [])
    schools = []
    for s in sorted(t['schools'].values(), key=lambda s: (s['id'] != school_id(t['id'], None), -len(s['courses']), s['label'])):
        LV = {'first-steps': 0, 'steady': 1, 'deep': 2}
        s['courses'].sort(key=lambda c: (seq.index(c['id']) if c['id'] in seq else len(seq), LV.get(c.get('level'), 1), c['title']))
        schools.append(s)
    out_t.append({'id': t['id'], 'label': t['label'], 'blurb': TR.get(t['id'], {}).get('blurb') or None, 'schools': schools,
                  'stats': {'schools': len(schools), 'courses': sum(len(s['courses']) for s in schools), 'practices': sum(len(s['practices']) for s in schools)}})
    if not out_t[-1]['blurb']: out_t[-1].pop('blurb')
out = {'version': CFG['version'], 'built': COL.get('built', 1), 'levels': ['tradition', 'school', 'course', 'phase', 'practice'],
       'traditions': out_t, 'index': {'course': course_index, 'practice': practice_index}}
dst = os.path.join(APP, 'site/data/wisegraph/courses.json')
json.dump(out, open(dst, 'w'), ensure_ascii=False, separators=(',', ':'))
nc = sum(t['stats']['courses'] for t in out_t)
print(f"{len(out_t)} traditions, {sum(t['stats']['schools'] for t in out_t)} schools, {nc} courses, "
      f"{sum(len(c['phases']) for t in out_t for s in t['schools'] for c in s['courses'])} phases, {len(P)} practices -> {os.path.relpath(dst, APP)}")
