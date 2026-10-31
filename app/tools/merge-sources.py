# Wiser: merge the sourcing folders' graph + vocabulary additions into the app (idempotent; safe to re-run).
#   ../sources/<group>/{people,traditions,edges,topics}-additions.json  ->  wisegraph/{people,traditions,edges}.json, schema/topics.json
# A group is merged only once its REPORT.md exists (a sourcer still at work is skipped).
# Clip candidates are NOT merged here: tools/build-clips.py reads ../sources/<group>/candidates.json on every build
# (same REPORT.md gate) and normalises them (see SOURCES in that file). Shared id maps live in tools/source_maps.py.
# usage: python3 tools/merge-sources.py [SOURCES_DIR]      (default ../sources)
import json, os, sys, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from source_maps import TRAD_MAP, PERSON_MAP, PERSON_SKIP, TEXT_IDS, TOPIC_NODES, TOPIC_KW_DROP, EDGE_FIX, EDGE_DROP, groups
from source_maps import TRAD_ADD, STUDIED_WITH_FROM_MEDIUM, PLACE_TRADS, PLACE_NO_COORDS, PLACE_DROP, MAIN_TEACHER_CHECK, RESOURCE_URL_FIX
MAIN_TEACHER_CHECK_PLACES = {p for p, _ in MAIN_TEACHER_CHECK}
TODAY = '2026-10-21'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, '..', 'sources')
J = lambda p: json.load(open(p))
def W(p, d): json.dump(d, open(p, 'w'), ensure_ascii=False, indent=1); open(p, 'a').write('\n')
def items(d, *keys):
    if isinstance(d, list): return d
    for k in keys:
        if isinstance(d.get(k), list): return d[k]
    return next((v for v in d.values() if isinstance(v, list)), [])
G = groups(SRC)
log = collections.Counter(); notes = []
REVIEW = []  # claims held back (living, low confidence) -> wisegraph/review-queue.json (merged with tools/stage-extensions.py's items)
REVIEW_LIVING_GROUPS = {'deep-india-study'}
LIVING_TXT = __import__('re').compile(r'^\s*(b\.|born)|\balive\b|\bliving\b|present|[–-]\s*$', __import__('re').I)  # deep groups merged under the review rules (2026-10-20); staged ext-* groups are gated by stage-extensions.py

# ---------- traditions ----------
tp = os.path.join(ROOT, 'wisegraph/traditions.json'); TD = J(tp); TR = {n['id']: n for n in TD['nodes']}
for n in TRAD_ADD:  # nodes decided at review (source_maps.TRAD_ADD)
    if n['id'] not in TR: TR[n['id']] = dict(n); log['traditions_added'] += 1
from source_maps import DEEP_TRAD_MAP, DEEP_FAMILY, DEEP_PARENT, DEEP_REPARENT, DEEP_LABEL, DEEP_PERSON_MAP, DEEP_EDGE_TYPES
DEEP = [g for g in G if g.startswith('deep-') or g == 'places-uk']
def dt(x): x = DEEP_TRAD_MAP.get(x, x); return TRAD_MAP.get(x, x)
for g in G:
    if g in DEEP: continue
    f = os.path.join(SRC, g, 'traditions-additions.json')
    if not os.path.exists(f): continue
    for n in items(J(f), 'nodes'):
        nid = TRAD_MAP.get(n['id'], n['id'])
        if nid in TR:  # existing node (or mapped onto one): fill gaps only
            for k in ('wikidata', 'blurb'):
                if not TR[nid].get(k) and n.get(k): TR[nid][k] = n[k]
            continue
        par = TRAD_MAP.get(n.get('parent'), n.get('parent'))
        TR[nid] = {'id': nid, 'label': n['label'], 'kind': n['kind'], 'parent': par, 'wikidata': n.get('wikidata'), 'blurb': n.get('blurb')}
        log['traditions_added'] += 1
# ---------- deep pass: every group's school tree -> one tradition tree (no duplicates of existing nodes) ----------
def deep_nodes():
    for g in DEEP:
        for fn in ('schools.json', 'traditions-additions.json'):
            f = os.path.join(SRC, g, fn)
            if os.path.exists(f): yield from items(J(f), 'schools', 'nodes')
pend = {}
for n in deep_nodes():
    nid0 = dt(n['id'])
    par = DEEP_PARENT.get(nid0, dt(n['parent']) if n.get('parent') else None)
    if par == nid0: continue
    if nid0 in TR:
        for k, k2 in (('wikidata', 'wikidata'), ('blurb', 'note'), ('blurb', 'blurb')):
            if not TR[nid0].get(k) and n.get(k2): TR[nid0][k] = n[k2]
        continue
    q = pend.setdefault(nid0, {'id': nid0, 'label': DEEP_LABEL.get(nid0) or n.get('label') or n.get('name'), 'parent': par,
                               'wikidata': n.get('wikidata') if isinstance(n.get('wikidata'), str) else None, 'blurb': n.get('note') or n.get('blurb') or None})
    if not q.get('blurb') and (n.get('note') or n.get('blurb')): q['blurb'] = n.get('note') or n.get('blurb')
    if q['parent'] is None and par: q['parent'] = par
for fid, f in DEEP_FAMILY.items():
    if fid not in TR: TR[fid] = {'id': fid, 'label': f['label'], 'kind': 'family', 'parent': None, 'wikidata': None, 'blurb': f['blurb']}; log['traditions_added'] += 1
    pend.pop(fid, None)
for _ in range(10):
    for nid0, q in list(pend.items()):
        if q['parent'] in TR:
            q['kind'] = 'school' if TR[q['parent']]['kind'] == 'family' else 'lineage'
            TR[nid0] = {k: q.get(k) for k in ('id', 'label', 'kind', 'parent', 'wikidata', 'blurb')}; pend.pop(nid0); log['traditions_added'] += 1
for nid0, q in pend.items(): notes.append(f'tradition {nid0}: parent {q["parent"]} unknown, skipped')
for nid0, par in DEEP_REPARENT.items():
    if nid0 in TR and par in TR and TR[nid0]['parent'] != par: TR[nid0]['parent'] = par; TR[nid0]['kind'] = 'lineage'; log['traditions_reparented'] += 1
for n in TR.values():
    if n['parent'] and n['parent'] not in TR: raise SystemExit(f'tradition {n["id"]}: parent {n["parent"]} missing')
from source_maps import TRAD_BLURB_FIX
for _k, _b in TRAD_BLURB_FIX.items():
    if _k in TR: TR[_k]['blurb'] = _b
TD['nodes'] = list(TR.values()); W(tp, TD)

# ---------- people ----------
pp = os.path.join(ROOT, 'wisegraph/people.json'); PD = J(pp); PB = {p['id']: p for p in PD['people']}
BYWD = {p['wikidata']: p['id'] for p in PD['people'] if p.get('wikidata')}
def union(a, b, key):
    out, seen = list(a or []), {key(x) for x in (a or [])}
    for x in b or []:
        if key(x) not in seen: out.append(x); seen.add(key(x))
    return out
for g in G:
    if g in DEEP: continue
    f = os.path.join(SRC, g, 'people-additions.json')
    if not os.path.exists(f): continue
    for p in items(J(f), 'people'):
        pid = PERSON_MAP.get(p['id'], p['id'])
        if pid in PERSON_SKIP: continue
        if pid not in PB and p.get('wikidata') in BYWD: pid = BYWD[p['wikidata']]  # same wikidata item = same person
        kind = 'text' if pid in TEXT_IDS else (p.get('kind') or p.get('role') or 'figure')
        if kind not in ('speaker', 'figure', 'text'): kind = 'figure'
        trad = TRAD_MAP.get(p.get('tradition'), p.get('tradition'))
        if trad not in TR:
            alt = [TRAD_MAP.get(t, t) for t in p.get('traditions') or []]
            trad = next((t for t in reversed(alt) if t in TR), None)
        if pid in PB:
            q = PB[pid]
            q['works'] = union(q.get('works'), p.get('works'), lambda w: (w.get('id') or w['title']).lower())
            q['aliases'] = union(q.get('aliases'), p.get('aliases'), lambda a: a.lower())
            q['channels'] = union(q.get('channels'), p.get('channels'), lambda c: c.get('id') or c.get('url') or c.get('name'))
            for k in ('wikidata', 'years', 'bio', 'tagline', 'short') + (('source_url', 'verified_on', 'confidence') if g.startswith('ext-') else ()):
                if not q.get(k) and p.get(k): q[k] = p[k]
            if g.startswith('ext-') and not q.get('source_url') and p.get('source_note'): q['source_note'] = p['source_note']
            if p.get('links'): q['links'] = {**p['links'], **(q.get('links') or {})}
            if kind == 'speaker' and q['kind'] == 'figure' and pid not in ('ramana-maharshi',): q['kind'] = 'speaker'
            if trad and trad != q['tradition'] and TR[trad]['parent'] == q['tradition']: q['tradition'] = trad  # more specific node
            if not q['channels']: q.pop('channels')
            log['people_merged'] += 1
            continue
        if not trad: notes.append(f'person {pid}: no known tradition, skipped'); continue
        q = {'id': pid, 'name': p['name'], 'short': p.get('short'), 'kind': kind, 'tradition': trad, 'wikidata': p.get('wikidata'),
             'role': p.get('role') if p.get('role') in ('teacher', 'scholar', 'figure', 'translator', 'founder', 'author') else None,  # ext-49: a sourced role (scholar vs teacher) survives the merge
             'years': p.get('years'), 'bio': p.get('bio'), 'tagline': p.get('tagline'), 'aliases': p.get('aliases') or [],
             'channels': p.get('channels') or None, 'links': p.get('links') or None, 'works': p.get('works') or [],
             # living only when the sourcer checked Wikidata (no death date) and the person has a Wikidata item; PEOPLE_FIX can veto
             'living': True if p.get('living') is True and p.get('wikidata') and str(p.get('years') or '').endswith('–') and not g.startswith('ext-') else None,
             'source_url': p.get('source_url'), 'source_note': p.get('source_note') if not p.get('source_url') else None, 'verified_on': p.get('verified_on'), 'confidence': p.get('confidence')}
        PB[pid] = {k: v for k, v in q.items() if v is not None}
        if q['wikidata']: BYWD[q['wikidata']] = pid
        log['people_added'] += 1
    for pt in (J(f).get('patches') or []) if isinstance(J(f), dict) else []:  # alias patches on existing people
        q = PB.get(PERSON_MAP.get(pt['id'], pt['id']))
        if q and pt.get('add_aliases'):
            n0 = len(q.get('aliases') or []); q['aliases'] = union(q.get('aliases'), pt['add_aliases'], lambda a: a.lower())
            log['aliases_patched'] += len(q['aliases']) - n0
# ---------- deep pass people: role teacher|scholar|figure; tradition = the most specific school node the tree holds ----------
def deep_people():
    for g in DEEP:
        f = os.path.join(SRC, g, 'people.json')
        if g == 'places-uk' or not os.path.exists(f): f = os.path.join(SRC, g, 'people-additions.json')
        if not os.path.exists(f): continue
        d = J(f)
        wd_ok = {}
        fa = os.path.join(SRC, g, 'people-additions.json')
        if g == 'deep-tibetan-eastasian' and os.path.exists(fa): wd_ok = {x['id']: x.get('wikidata') for x in items(J(fa), 'people')}
        rows = []
        if isinstance(d, dict):
            for k in ('people', 'main', 'more_voices', 'figures'):
                rows += [x for x in d.get(k) or [] if isinstance(x, dict)]
        else: rows = d
        for x in rows:
            x = dict(x)
            if g == 'deep-tibetan-eastasian': x['wikidata'] = wd_ok.get(x['id'], None if isinstance(x.get('wikidata'), dict) else x.get('wikidata'))
            if isinstance(x.get('wikidata'), dict): x['wikidata'] = None
            yield g, x
ROLE = {'teacher': 'teacher', 'scholar': 'scholar', 'educator': 'teacher', 'figure': 'figure', 'speaker': 'teacher'}
for g, p in deep_people():
    if p.get('role') == 'organisation': continue
    pid = DEEP_PERSON_MAP.get(p['id'], PERSON_MAP.get(p['id'], p['id']))
    if pid in PERSON_SKIP: continue
    if pid not in PB and p.get('wikidata') in BYWD: pid = BYWD[p['wikidata']]
    role = ROLE.get(p.get('role') or p.get('kind') or 'figure', 'figure')
    n_clips = int(p.get('clip_count') or 0)
    cand = [dt(p.get('school') or ''), dt(p.get('tradition') or '')] + [dt(t) for t in p.get('traditions') or []]
    trad = next((t for t in cand if t in TR), None)
    chans = [c if isinstance(c, dict) else {'name': c} for c in p.get('channels') or []]
    links = dict(p.get('links') or {})
    if p.get('site'): links.setdefault('Website', p['site'])
    if pid in PB:
        q = PB[pid]
        if role != 'figure' or not q.get('role'): q['role'] = role if role != 'figure' or q.get('role') is None else q['role']
        for k in ('wikidata', 'years', 'bio'):
            if k == 'years' and g in REVIEW_LIVING_GROUPS and LIVING_TXT.search(str(p.get(k) or '')): continue  # a living claim never fills in silently
            if not q.get(k) and p.get(k): q[k] = p[k]
        if chans: q['channels'] = union(q.get('channels'), chans, lambda c: c.get('id') or c.get('url') or c.get('name'))
        if links: q['links'] = {**links, **(q.get('links') or {})}
        if n_clips and q['kind'] == 'figure' and pid != 'ramana-maharshi': q['kind'] = 'speaker'
        if trad and trad != q['tradition'] and q['tradition'] in [TR[trad]['parent'], TR.get(TR[trad]['parent'] or '', {}).get('parent')]: q['tradition'] = trad
        log['deep_people_merged'] += 1; continue
    if not trad: notes.append(f'person {pid} ({g}): no known tradition, skipped'); continue
    ytxt = g in REVIEW_LIVING_GROUPS and bool(LIVING_TXT.search(str(p.get('years') or '')))  # "b. 1962", "(alive ...)": an implied living claim
    held = g in REVIEW_LIVING_GROUPS and (p.get('living') is True or ytxt)
    if held: REVIEW.append({'pack': g, 'kind': 'living-claim', 'subject': 'person/' + pid, 'reason': f'living claimed by the sourcer (living:{p.get("living")}, years "{p.get("years") or ""}"); years and living flag held until checked', 'severity': 'check'})
    if ytxt: p = {**p, 'years': None}
    q = {'id': pid, 'name': p['name'], 'short': p.get('short'), 'kind': 'speaker' if n_clips else 'figure', 'role': role, 'tradition': trad,
         'wikidata': p.get('wikidata'), 'years': p.get('years'), 'bio': p.get('bio'), 'aliases': p.get('aliases') or [],
         'channels': chans or None, 'links': links or None, 'works': p.get('works') or [],
         'living': True if not held and p.get('living') is True and p.get('wikidata') and str(p.get('years') or '').endswith('–') else None,
         'source_url': p.get('source_url'), 'verified_on': p.get('verified_on'), 'confidence': p.get('confidence')}
    PB[pid] = {k: v for k, v in q.items() if v not in (None, [])} | {'aliases': q['aliases'], 'works': q['works']}
    if q['wikidata']: BYWD[q['wikidata']] = pid
    log['deep_people_added'] += 1
for q in PB.values():  # every person carries a role: teacher (speaks on video), scholar (academic), figure (historical / lineage)
    if not q.get('role'): q['role'] = 'teacher' if q['kind'] == 'speaker' else ('text' if q['kind'] == 'text' else 'figure')
PLACE_TEACH = collections.defaultdict(list)  # places-uk person -> place edges (founded / abbot_of / teaches_at / associated_with)
def deep_edges(g):
    seen = set()
    for fn in ('lineages.json', 'edges-additions.json'):
        f = os.path.join(SRC, g, fn)
        if not os.path.exists(f): continue
        for e in items(J(f), 'edges'):
            if 'from' in e: a, b, url = e['from'], e['to'], e.get('source_url') or e.get('source')
            else: a, b, url = e.get('source'), e.get('target'), e.get('source_url')
            if not a or not b: continue
            a, b = DEEP_PERSON_MAP.get(a, a), DEEP_PERSON_MAP.get(b, b)
            if e.get('target_kind') == 'place': PLACE_TEACH[b].append(a); continue
            conf = (e.get('conf') or e.get('confidence') or 'medium').lower()
            if conf.startswith('low'):
                log['deep_edges_low_conf_held'] += 1
                if g in REVIEW_LIVING_GROUPS: REVIEW.append({'pack': g, 'kind': 'edge-low-confidence', 'subject': f'{a}->{b}:{e.get("type")}', 'reason': 'confidence low; held back', 'severity': 'check'})
                continue
            ty = e.get('type')
            if ty == 'founded':
                if dt(b) in TR: ty, b = 'lineage_of', dt(b)
                else: continue  # an organisation, not a graph node
            elif ty == 'lineage_of': b = dt(b)
            elif ty not in DEEP_EDGE_TYPES: log['deep_edges_type_skipped:' + str(ty)] += 1; continue
            k = (a, b, ty)
            if k in seen: continue
            seen.add(k)
            yield {k2: v for k2, v in {'from': a, 'to': b, 'type': ty, 'conf': 'high' if conf.startswith('high') else 'medium', 'note': e.get('note'), 'src': url}.items() if v}
# ---------- deep pass: lineage-only people (named by an edge, no record): a figure stub, scholar when the edge is academic ----------
from source_maps import DEEP_STUB, DEEP_STUB_SKIP
NAMES = {DEEP_PERSON_MAP.get(x['id'], x['id']): x.get('name') for g, x in deep_people() if x.get('name')}
SKIPPED = {DEEP_PERSON_MAP.get(x['id'], x['id']): x for g, x in deep_people()}
def _tc(i): return ' '.join(w[:1].upper() + w[1:] for w in i.split('-'))
for _pass in range(3):
    for g in DEEP:
        for e in list(deep_edges(g)):
            for me, other in ((e['from'], e['to']), (e['to'], e['from'])):
                if me in PB or me in TR or me in DEEP_STUB_SKIP: continue
                nm, tr = DEEP_STUB.get(me, (None, None))
                if not tr: tr = PB[other]['tradition'] if other in PB else (other if other in TR else None)
                if not tr or tr not in TR:
                    if _pass == 2: notes.append(f'stub {me}: no tradition')
                    continue
                if e['type'] == 'translated' and me == e['to'] and me not in NAMES and me not in DEEP_STUB: continue  # a text, not a person
                rec = SKIPPED.get(me) or {}
                role = 'scholar' if e['type'] == 'academic_supervisor_of' or rec.get('role') == 'scholar' else 'figure'
                PB[me] = {'id': me, 'name': nm or NAMES.get(me) or _tc(me), 'kind': 'figure', 'role': role, 'tradition': tr, 'lineageOnly': True,
                          'aliases': [], 'works': [], **{k: rec[k] for k in ('years', 'bio', 'wikidata') if rec.get(k) and not (k == 'years' and LIVING_TXT.search(str(rec[k])))}}
                if rec.get('years') and LIVING_TXT.search(str(rec['years'])):
                    REVIEW.append({'pack': 'deep-india-study' if rec.get('clip_count') is not None or rec.get('tier') else 'deep', 'kind': 'living-claim', 'subject': 'person/' + me, 'reason': f'living implied by years "{rec["years"]}" on a lineage stub; years held until checked', 'severity': 'check'})
                log['deep_people_stubs'] += 1
PLACE_TEACH.clear(); log.pop('deep_edges_low_conf_held', None)
# people referenced but not written by a sourcer, then hand corrections (source_maps.PEOPLE_ADD / PEOPLE_FIX)
from source_maps import PEOPLE_FIX, PEOPLE_ADD, EDGES_ADD
for q in PEOPLE_ADD:
    if q['id'] not in PB and q['tradition'] in TR: PB[q['id']] = dict(q); log['people_added'] += 1
for pid, fix in PEOPLE_FIX.items():
    if pid in PB:
        PB[pid].update(fix)
        if PB[pid].get('living') is False: PB[pid].pop('living')
for g in G:  # staged packs: works attached to existing people, dated corrections
    f = os.path.join(SRC, g, 'works-attach.json')
    for a in (items(J(f), 'attach') if os.path.exists(f) else []):
        q = PB.get(PERSON_MAP.get(a['person'], a['person']))
        if not q: notes.append(f'works-attach {a["person"]}: unknown person'); continue
        n0 = len(q.get('works') or []); q['works'] = union(q.get('works'), a['works'], lambda w: (w.get('id') or w['title']).lower()); log['works_attached'] += len(q['works']) - n0
    f = os.path.join(SRC, g, 'years-fix.json')
    for pid, y in ((J(f).get('set_years') or {}).items() if os.path.exists(f) else []):
        if pid in PB and PB[pid].get('years') != y: PB[pid]['years'] = y; PB[pid].pop('living', None); log['years_fixed'] += 1
for k in PERSON_SKIP: PB.pop(k, None)
import re as _re
def _wkey(w): return _re.sub(r'[^a-z0-9]+', ' ', _re.sub(r'\(.*?\)', '', w['title'].lower())).strip()
for p in PB.values():  # one card per work: the sourcers sometimes re-listed a work under a new id
    seen, out = set(), []
    for w in p.get('works') or []:
        if _wkey(w) in seen: continue
        seen.add(_wkey(w)); out.append(w)
    if 'works' in p: p['works'] = out
for p in PB.values():
    if p['tradition'] not in TR: raise SystemExit(f'person {p["id"]}: tradition {p["tradition"]} missing')
PD['people'] = list(PB.values()); W(pp, PD)

# ---------- edges ----------
ep = os.path.join(ROOT, 'wisegraph/edges.json'); ED = J(ep)
EK = {(e['from'], e['to'], e['type']) for e in ED['edges']}
def nid(x): x = PERSON_MAP.get(x, x); return TRAD_MAP.get(x, x)
def group_edges(g):
    if g in DEEP: yield from deep_edges(g); return
    f = os.path.join(SRC, g, 'edges-additions.json')
    if os.path.exists(f): yield from items(J(f), 'edges')
    f = os.path.join(SRC, g, 'lineages.json')  # lineage trees (places group): teacher_of chains + influenced + lineage_of
    if os.path.exists(f):
        L = J(f)
        for t in L.get('lineages') or []:
            for e in t.get('edges') or []: yield {k: e[k] for k in ('from', 'to', 'type', 'conf', 'note') if e.get(k)}
        for e in L.get('influenced') or []: yield {**e, 'type': 'influenced', 'conf': e.get('conf') or 'high'}
        for e in L.get('lineage_of') or []: yield {**e, 'type': 'lineage_of', 'conf': e.get('conf') or 'high'}
PAIR_TEACHER = {(e['from'], e['to']) for e in ED['edges'] if e['type'] == 'teacher_of'}
for g in G:
    for e in group_edges(g):
        # a medium-confidence teacher_of from the places group means "studied with", never heir (review 2026-10-20)
        if e.get('type') == 'founded' and nid(e['to']) in TR: e = {**e, 'type': 'lineage_of'}
        if (g == 'places' or g.startswith('ext-')) and STUDIED_WITH_FROM_MEDIUM and e.get('type') == 'teacher_of' and e.get('conf') == 'medium':
            e = {**e, 'type': 'studied_with'}
            if (nid(e['from']), nid(e['to'])) in PAIR_TEACHER: continue  # already a teacher_of: keep that one
        a, b = nid(e['from']), nid(e['to'])
        if (e['from'], e['to']) in EDGE_DROP: log['edges_dropped_review'] += 1; continue
        e = {**e, 'from': a, 'to': b, **EDGE_FIX.get((e['from'], e['to']), {})}
        a, b = e['from'], e['to']
        if a not in PB and a not in TR or b not in PB and b not in TR: notes.append(f'edge {a}->{b}: unknown endpoint'); continue
        k = (a, b, e['type'])
        if k in EK or a == b: continue
        if e['type'] == 'teacher_of' and (a, b, 'studied_with') in EK:  # promote: drop the looser edge
            ED['edges'] = [x for x in ED['edges'] if (x['from'], x['to'], x['type']) != (a, b, 'studied_with')]; EK.discard((a, b, 'studied_with'))
        EK.add(k); ED['edges'].append({k2: e[k2] for k2 in ('from', 'to', 'type', 'conf', 'note', 'src', 'checked') if e.get(k2)}); log['edges_added'] += 1
for e in EDGES_ADD:
    k = (e['from'], e['to'], e['type'])
    if k not in EK and (e['from'] in PB or e['from'] in TR) and (e['to'] in PB or e['to'] in TR): EK.add(k); ED['edges'].append(dict(e)); log['edges_added'] += 1
# one relation per pair: a high-confidence teacher_of beats studied_with; a medium teacher_of yields to an existing studied_with
_k = {(e['from'], e['to'], e['type']): e for e in ED['edges']}
for (a, b, ty), e in list(_k.items()):
    if ty == 'teacher_of' and (a, b, 'studied_with') in _k:
        drop = (a, b, 'studied_with') if e.get('conf', 'high') == 'high' else (a, b, 'teacher_of')
        ED['edges'] = [x for x in ED['edges'] if (x['from'], x['to'], x['type']) != drop]; log['edges_pair_resolved'] += 1
W(ep, ED)

# ---------- places (sources/places: places.json + retreats.json + countries.json -> wisegraph/places.json) ----------
def merge_places():
    f = os.path.join(SRC, 'places', 'places.json')
    if 'places' not in G or not os.path.exists(f): return None
    R = collections.defaultdict(list)
    rp = os.path.join(SRC, 'places', 'retreats.json')
    for r in (items(J(rp), 'retreats') if os.path.exists(rp) else []):  # programmes: schedule link only, never dates
        R[r['place_id']].append({k: r[k] for k in ('id', 'name', 'typical_length', 'format', 'cost_model', 'schedule_url') if r.get(k)})
    out, seen = [], set()
    for p in items(J(f), 'places'):
        if p['id'] in seen: log['places_dup'] += 1; continue
        seen.add(p['id'])
        trads = PLACE_TRADS.get(p['id']) or [TRAD_MAP.get(t, t) for t in p.get('traditions') or []]
        trads = list(dict.fromkeys(t for t in trads if t in TR))
        if not trads: notes.append(f'place {p["id"]}: no known tradition, skipped'); continue
        lat, lng = p.get('lat'), p.get('lng')
        if p['id'] in PLACE_NO_COORDS or lat is None or lng is None: lat = lng = None
        q = {'id': p['id'], 'name': p['name'], 'type': p['type'], 'traditions': trads, 'country': p.get('country'), 'country_name': p.get('country_name'),
             'city': p.get('city'), 'lat': lat, 'lng': lng, 'coord_precision': p.get('coord_precision') if lat is not None else None,
             'founded': p.get('founded'), 'teachers': [t for t in (PERSON_MAP.get(x, x) for x in p.get('teacher_ids') or []) if t in PB],
             'url': p.get('url'), 'schedule_url': p.get('schedule_url'), 'wikidata': p.get('wikidata'), 'description': p.get('description'),
             'offers': p.get('offers') or None, 'language': p.get('language'), 'goenka': True if p.get('dhamma_subdomain') else None,
             'retreats': R.get(p['id']) or None}
        out.append({k: v for k, v in q.items() if v is not None})
    # ---------- places-uk (deep pass): same ids = same place (UK file's contact page + schedule win); sisters; events ----------
    if 'places-uk' in G:
        BYID = {p['id']: p for p in out}
        def uk_row(p):
            trads = list(dict.fromkeys(t for t in (dt(x) for x in p.get('traditions') or []) if t in TR))
            if not trads: notes.append(f'place {p["id"]} (places-uk): no known tradition, skipped'); return None
            lat, lng = p.get('lat'), p.get('lng')
            if p['id'] in PLACE_NO_COORDS or lat is None or lng is None: lat = lng = None
            url = p.get('url') if not p.get('url_removed') and not p.get('url_failed') else None
            tch = [t for t in (PERSON_MAP.get(x, x) for x in (p.get('teacher_ids') or []) + PLACE_TEACH.get(p['id'], [])) if t in PB]
            q = {'id': p['id'], 'name': p['name'], 'type': p['type'], 'traditions': trads, 'country': p.get('country'), 'country_name': p.get('country_name'),
                 'city': p.get('city'), 'lat': lat, 'lng': lng, 'coord_precision': p.get('coord_precision') if lat is not None else None,
                 'founded': p.get('founded'), 'teachers': list(dict.fromkeys(tch)) or None, 'url': url, 'schedule_url': p.get('schedule_url'),
                 'contact_page': p.get('contact_page'), 'url_checked': p.get('url_checked'), 'wikidata': p.get('wikidata'), 'description': p.get('description'),
                 'offers': p.get('offers') or None, 'language': p.get('language')}
            return {k: v for k, v in q.items() if v is not None}
        uk = items(J(os.path.join(SRC, 'places-uk', 'places.json')), 'places')
        sis = J(os.path.join(SRC, 'places-uk', 'sisters.json')) if os.path.exists(os.path.join(SRC, 'places-uk', 'sisters.json')) else {}
        for p in uk + (sis.get('places') or []):
            r = uk_row(p)
            if not r: continue
            if r['id'] in BYID:  # the same place: fill gaps, prefer the UK file's contact page and schedule link
                q = BYID[r['id']]
                for k in ('contact_page', 'schedule_url', 'url_checked'):
                    if r.get(k): q[k] = r[k]
                for k, v in r.items():
                    if k not in q: q[k] = v
                if r.get('teachers'): q['teachers'] = list(dict.fromkeys((q.get('teachers') or []) + r['teachers']))
                log['places_uk_merged'] += 1
            else:
                out.append(r); BYID[r['id']] = r; log['places_uk_added'] += 1
        INV = {'branch_of': 'branch', 'sister_of': 'sister_of'}
        for e in sis.get('edges') or []:
            a, b = BYID.get(e['from']), BYID.get(e['to'])
            if not a or not b: log['place_edges_unknown'] += 1; continue
            a.setdefault('sisters', []).append([b['id'], e['type']] + ([e['note']] if e.get('note') else []))
            b.setdefault('sisters', []).append([a['id'], INV[e['type']]])
            log['place_edges'] += 1
        ev = os.path.join(SRC, 'places-uk', 'events.json')
        for e in (items(J(ev), 'events') if os.path.exists(ev) else []):
            q = BYID.get(e.get('place_id'))
            if not q: log['events_unplaced'] += 1; continue
            q.setdefault('events', []).append({k: v for k, v in {'name': e['name'], 'kind': e.get('kind'), 'when': e.get('usual_month') or e.get('recurrence'),
                                                                 'url': e.get('official_url'), 'note': e.get('note')}.items() if v})
            log['events'] += 1
    merge_ext_places(out)
    # staged programmes (satsang-extensions 32): recurring patterns appended to the place's retreats (dedupe by id); no dated instances, ever
    PB2 = {p['id']: p for p in out}
    for g in [g for g in G if g.startswith('ext-')]:
        f = os.path.join(SRC, g, 'programmes.json')
        for r in (items(J(f), 'programmes') if os.path.exists(f) else []):
            q = PB2.get(r['place'])
            if not q: log['programmes_unplaced'] += 1; continue
            rs = q.get('retreats') or []
            if any(x.get('id') == r['id'] for x in rs): continue
            rs.append({k: v for k, v in {'id': r['id'], 'name': r['name'], 'typical_length': r.get('typical_length'), 'format': r.get('format'), 'cost_model': {'donation': 'dana'}.get(r.get('cost_model'), r.get('cost_model')),
                                         'schedule_url': r.get('schedule_url'), 'recurrence': r.get('recurrence'), 'teachers': r.get('teachers'), 'checked': r.get('checked'), 'source': g}.items() if v})
            q['retreats'] = rs; log['programmes_ext'] += 1
    # countries: recomputed from the merged places (so retags count), plus dhamma.org's non-centre course sites
    C0 = {c['iso2']: c for c in items(J(os.path.join(SRC, 'places', 'countries.json')), 'countries')} if os.path.exists(os.path.join(SRC, 'places', 'countries.json')) else {}
    C = {}
    for p in out:
        c = C.setdefault(p['country'], {'code': p['country'], 'name': p.get('country_name') or p['country'], 'places': 0, 'goenka': 0, 'traditions': collections.Counter()})
        c['places'] += 1; c['goenka'] += 1 if p.get('goenka') else 0
        for t in p['traditions']: c['traditions'][t] += 1
    for k, c in C.items():
        c['traditions'] = dict(c['traditions'].most_common())
        nc = (C0.get(k) or {}).get('vipassana_noncentre_sites')
        if nc: c['goenka_sites'] = nc
    log['places'] = len(out); log['places_mapped'] = sum(1 for p in out if p.get('lat') is not None); log['retreats'] = sum(len(p.get('retreats') or []) for p in out)
    return {'_note': 'Generated by tools/merge-sources.py from sources/places (2026-10-20). Metadata only: names, coordinates, official links, '
            'recurring programmes with the official schedule link (no dates). teachers = founders or teachers historically tied to the place, '
            'not a claim about who teaches there now.', 'places': out, 'countries': sorted(C.values(), key=lambda c: -c['places'])}
# ---------- places from staged packs (sources/ext-*/places-ext.json, place-links.json, main-teachers.json) + deep-india-study ----------
EXT_CONTACTS = {}
def merge_ext_places(out):
    BYID = {p['id']: p for p in out}
    def put(r, src):
        r = {k: v for k, v in r.items() if v not in (None, [], '')}
        if r['id'] in BYID:  # the same place: the existing record wins; fill gaps only, add teachers
            q = BYID[r['id']]
            for k, v in r.items():
                if k not in q: q[k] = v
            if r.get('teachers'): q['teachers'] = list(dict.fromkeys((q.get('teachers') or []) + r['teachers']))
            log['places_ext_merged:' + src] += 1
        else:
            out.append(r); BYID[r['id']] = r; log['places_ext_added:' + src] += 1
    def trads_of(p):
        return list(dict.fromkeys(t for t in (dt(x) for x in p.get('traditions') or []) if t in TR))
    for g in G:
        f = os.path.join(SRC, g, 'places-ext.json')
        if not os.path.exists(f): continue
        for p in items(J(f), 'places'):
            trads = PLACE_TRADS.get(p['id']) or trads_of(p)
            if not trads and p['id'] not in BYID: notes.append(f'place {p["id"]} ({g}): no known tradition, skipped'); continue
            lat, lng = p.get('lat'), p.get('lng')
            if p['id'] in PLACE_NO_COORDS or lat is None or lng is None: lat = lng = None
            put({'id': p['id'], 'name': p['name'], 'type': p.get('type') or 'centre', 'traditions': trads, 'country': p.get('country'), 'country_name': p.get('country_name'),
                 'city': p.get('city'), 'lat': lat, 'lng': lng, 'coord_precision': p.get('coord_precision') if lat is not None else None, 'founded': p.get('founded'),
                 'teachers': [t for t in (PERSON_MAP.get(x, x) for x in p.get('teacher_ids') or []) if t in PB], 'url': p.get('url'), 'schedule_url': p.get('schedule_url'),
                 'contact_page': p.get('contact_page'), 'url_checked': p.get('url_checked'), 'wikidata': p.get('wikidata'), 'description': (p.get('description') or '')[:200] or None,
                 'offers': p.get('offers') or None, 'language': p.get('language'), 'source_url': p.get('source_url'), 'verified_on': p.get('verified_on'), 'confidence': p.get('confidence'),
                 'details_unverified': True if p.get('details_unverified') else None}, g)  # site blocked/offline at discovery: shown as "details unverified" on /place/<id>
    # deep India study: places-uk shape + contact block (strings, one source page) + alive status; dated "upcoming" items stay out (no dates stored)
    f = os.path.join(SRC, 'deep-india-study', 'places.json')
    if 'deep-india-study' in G and os.path.exists(f):
        for p in items(J(f), 'places'):
            if p['id'] in PLACE_DROP:
                REVIEW.append({'pack': 'deep-india-study', 'kind': 'place-dropped', 'subject': 'place/' + p['id'], 'reason': PLACE_DROP[p['id']], 'severity': 'verify'})
                log['places_dropped'] += 1; continue
            trads = PLACE_TRADS.get(p['id']) or trads_of(p)
            if not trads and p['id'] not in BYID: notes.append(f'place {p["id"]} (deep-india-study): no known tradition, skipped'); continue
            url = p.get('url')
            for bad, good in KEEPER_URL_BAN.items():
                if url and bad in url: url = good
            lat, lng = p.get('lat'), p.get('lng')
            if p['id'] in PLACE_NO_COORDS or lat is None or lng is None: lat = lng = None
            alive = (p.get('alive') or {}).get('status')
            desc = (p.get('study') or '').split('. ')[0][:200] or None
            put({'id': p['id'], 'name': p['name'], 'type': p.get('type') or 'centre', 'traditions': trads, 'country': p.get('country'), 'country_name': p.get('country_name'),
                 'city': p.get('city'), 'lat': lat, 'lng': lng, 'coord_precision': p.get('coord_precision') if lat is not None else None,
                 'teachers': [t for t in (DEEP_PERSON_MAP.get(x, PERSON_MAP.get(x, x)) for x in p.get('teachers') or []) if t in PB], 'url': url,
                 'contact_page': (p.get('contact') or {}).get('page'), 'url_checked': p.get('verified_on'), 'wikidata': p.get('wikidata'), 'description': desc,
                 'language': (p.get('language') or [None])[0] if isinstance(p.get('language'), list) else p.get('language'),
                 'status': 'unknown' if alive == 'unknown' else None, 'source_url': p.get('source_url'), 'verified_on': p.get('verified_on'), 'confidence': p.get('confidence')}, 'deep-india-study')
            c = p.get('contact') or {}
            srcp = c.get('page') or p.get('source_url') or url
            if (c.get('email') or c.get('phone')) and srcp:
                EXT_CONTACTS[p['id']] = {'checked': p.get('verified_on') or '2026-10-20', 'site': url,
                                         **({'contact_page': {'url': c['page'], 'source_url': p.get('source_url') or c['page']}} if c.get('page') else {}),
                                         **{k: [{'value': v, 'source_url': srcp} for v in c.get(k) or []] for k in ('email', 'phone') if c.get(k)}}
    # person -> place ties and place -> place sisters (staged packs + the India study's founded/abbot_of/teaches_at edges)
    links = []
    for g in G:
        f = os.path.join(SRC, g, 'place-links.json')
        if os.path.exists(f): links += items(J(f), 'links')
    f = os.path.join(SRC, 'deep-india-study', 'lineages.json')
    if 'deep-india-study' in G and os.path.exists(f):
        for e in items(J(f), 'edges'):
            a, b = e.get('from') or e.get('source'), e.get('to') or e.get('target')
            if b in BYID and e.get('type') in ('founded', 'abbot_of', 'teaches_at') and not str(e.get('confidence') or e.get('conf') or '').lower().startswith('low'):
                links.append({'from': DEEP_PERSON_MAP.get(a, a), 'to': b, 'type': e['type']})
    INV = {'branch_of': 'branch', 'sister_of': 'sister_of'}
    for e in links:
        a, b = PERSON_MAP.get(e['from'], e['from']), e['to']
        if e['type'] in INV:
            A, B = BYID.get(a), BYID.get(b)
            if not A or not B: log['place_links_unknown'] += 1; continue
            if any(s[0] == b for s in A.get('sisters') or []): continue
            A.setdefault('sisters', []).append([b, e['type']] + ([e['note']] if e.get('note') else []))
            B.setdefault('sisters', []).append([a, INV[e['type']]]); log['place_sisters'] += 1
        else:
            P0 = BYID.get(b)
            if not P0 or a not in PB: log['place_links_unknown'] += 1; continue
            if a not in (P0.get('teachers') or []): P0['teachers'] = (P0.get('teachers') or []) + [a]; log['place_teachers_linked'] += 1
    # one main teacher per place (MINIMAL-ENTRY: teacher_model single|rotating|none); medium ones are queued for re-check by the stager
    for g in G:
        f = os.path.join(SRC, g, 'main-teachers.json')
        for m in (items(J(f), 'links') if os.path.exists(f) else []):
            P0, t = BYID.get(m['place']), PERSON_MAP.get(m['teacher'], m['teacher'])
            if P0 and not t and m.get('model') in ('rotating', 'none'): P0['teacher_model'] = m['model']; log['teacher_model_set'] += 1; continue  # no single teacher by design
            if not P0 or t not in PB: log['main_teacher_unknown'] += 1; notes.append(f'main teacher {m["teacher"]} @ {m["place"]}: unknown'); continue
            chk = MAIN_TEACHER_CHECK.get((m['place'], t))
            if chk and chk['verdict'] == 'hold':
                log['main_teacher_held_checked'] += 1
                REVIEW.append({'pack': g.replace('ext-', ''), 'kind': 'main-teacher-held', 'subject': 'place/' + m['place'], 'reason': f'main teacher {t}: checked on the official site {chk["verified_on"]}: {chk["why"]} ({chk["source_url"]}); held', 'severity': 'verify'}); continue
            if chk: m = {**m, 'conf': 'high'}  # verified on the place's official page (source_maps.MAIN_TEACHER_CHECK)
            if (m.get('conf') or 'medium') != 'high': log['main_teacher_medium_held'] += 1; continue  # owner rule 2026-10-20: medium main teachers stay in the review queue, never live
            P0['main_teacher'] = t; P0['teacher_model'] = m.get('model') or 'single'; P0['main_teacher_conf'] = m.get('conf') or 'medium'
            if chk: P0['main_teacher_src'] = chk['source_url']; P0['main_teacher_verified'] = chk['verified_on']; log['main_teachers_verified'] += 1
            if t not in (P0.get('teachers') or []): P0['teachers'] = (P0.get('teachers') or []) + [t]
            log['main_teachers'] += 1
from source_maps import KEEPER_URL_BAN, PLACE_DROP

PL = merge_places()
if PL: W(os.path.join(ROOT, 'wisegraph/places.json'), PL)

# ---------- topics vocabulary ----------
tpp = os.path.join(ROOT, 'schema/topics.json'); TP = J(tpp); tree = TP['tree']
for tid, spec in TOPIC_NODES.items():  # reviewed nodes (labels, trimmed keywords) built from the groups' topics-additions
    root, _, leaf = tid.partition('/')
    if not leaf:
        node = tree.setdefault(root, {})
        node.update({k: v for k, v in spec.items() if k in ('label', 'heat', 'kw')})
    else:
        if root not in tree: raise SystemExit(f'topic {tid}: root missing')
        tree[root][leaf] = {'label': spec['label'], 'kw': spec['kw']}
    log['topic_nodes'] += 1
for g in G:  # keyword proposals for existing nodes (kwAdd / kwRemove)
    f = os.path.join(SRC, g, 'topics-additions.json')
    if not os.path.exists(f): continue
    d = J(f)
    if g in DEEP or not isinstance(d, dict): continue  # deep-pass leaves are reviewed into source_maps.TOPIC_NODES instead
    for root, kws in (d.get('kwAdd') or {}).items():
        if root in tree:
            for k in kws:
                if k not in tree[root]['kw']: tree[root]['kw'].append(k)
    for root, kws in (d.get('kwRemove') or {}).items():
        if root in tree and isinstance(kws, list): tree[root]['kw'] = [k for k in tree[root]['kw'] if k not in kws]
for root, kws in TOPIC_KW_DROP.items():
    if root in tree: tree[root]['kw'] = [k for k in tree[root]['kw'] if k not in kws]
TP['version'] = 2
TP['_note'] = (TP.get('_note', '').split(' | v2')[0] + ' | v2 (2026-10-20): merged the sourcing groups\' topics-additions (tools/merge-sources.py); '
               'rebirth stays the cross-tradition root with Western reincarnation as a leaf, karma likewise (kamma/western).')
W(tpp, TP)
# staged packs: curated contacts (official-published, per-value source) + texts/resources for the open data
import re
CUR = {}
for g in G:
    f = os.path.join(SRC, g, 'place-contacts.json')
    if os.path.exists(f):
        for pid, c in (J(f).get('places') or {}).items(): CUR[pid] = c
for pid, c in EXT_CONTACTS.items(): CUR.setdefault(pid, c)
W(os.path.join(ROOT, 'wisegraph/place-contacts-curated.json'), {'_note': 'Hand-checked contacts from staged sourcing groups (sources/ext-*/place-contacts.json, deep-india-study places). '
  'Exactly as published, each value with its source_url. Layered over place-contacts.json by tools/build-wise.py (curated wins).', 'places': CUR})
log['contacts_curated'] = len(CUR)
RES = []
# Licence gate (satsang-extensions 28 + RIGHTS.md): a text is shown (linked) only when the licence registry evidences a licence that allows
# linking: the book's own registry entry wins, else its link's domain default (a verify-flagged default does not count). No registry
# evidence, or a copyrighted / paid-course / mixed default -> held (citation-only, review queue). Default is copyrighted, never assumed free.
from licence_gate import licence_for, linkable, no_sale
def licence_of(t):
    lic, why, _, _ = licence_for(t['id'], t.get('link'))
    return lic, why
TEXT_KINDS = {'book', 'books', 'text', 'texts', 'article', 'articles', 'e-text-library', 'note', 'journal', 'manuscript-library', 'bibliography', 'ebook', 'pdf'}
log['texts_licence_shown'] = log['texts_licence_held'] = 0
for g in [g for g in G if g.startswith('ext-')]:  # staged packs only (the older deep groups' texts.json are not wired; unchanged)
    f = os.path.join(SRC, g, 'texts.json')
    ft = os.path.join(SRC, g, 'teaching-targets.json')  # satsang-extensions 44: how to teach a text (teach_as, read_order); practices_to_derive stay plans (specs/extensions/44)
    TT = (J(ft).get('targets') or {}) if os.path.exists(ft) else {}
    for t in (items(J(f), 'texts') if os.path.exists(f) else []):
        if not t.get('link'): log['texts_linkless_held'] += 1; continue
        lic, why, evu, ent = licence_for(t['id'], t.get('link'))
        if not linkable(lic):
            log['texts_licence_held'] += 1
            REVIEW.append({'pack': g, 'kind': 'text-licence', 'subject': 'text/' + t['id'], 'reason': f'licence gate: {lic or "unregistered"} ({why}); held citation-only until the registry evidences a linkable licence', 'severity': 'verify', 'title': t['title'], **({'evidenceUrl': evu} if evu else {})}); continue
        log['texts_licence_shown'] += 1
        sch = TRAD_MAP.get(t.get('school'), t.get('school'))
        RES.append({'id': t['id'], 'title': t['title'], 'url': t['link'], 'kind': t.get('kind') or 'book', 'free': True,
                    'licence': t.get('licence') or lic, 'licenceClass': lic, 'licenceEvidence': why[:200], **({'licenceEvidenceUrl': evu} if evu else {}), 'noSale': no_sale(lic, ent),
                    'traditions': [x for x in dict.fromkeys([sch] + [TRAD_MAP.get(y, y) for y in t.get('traditions') or []]) if x in TR],
                    'people': [x for x in dict.fromkeys([PERSON_MAP.get(y, y) for y in [t.get('author')] + list(t.get('authors') or []) if y]) if x in PB],
                    **({'teach': {k2: v2 for k2, v2 in (('teachAs', TT[t['id']].get('teach_as')), ('readOrder', TT[t['id']].get('read_order'))) if v2}} if t['id'] in TT else {}),
                    'note': t.get('note'), 'source_url': t['link'], 'checked': t.get('checked') or '2026-10-20', 'group': g})
f = os.path.join(SRC, 'deep-india-study', 'resources.json')
if 'deep-india-study' in G and os.path.exists(f):
    for r in items(J(f), 'resources'):
        if r['id'] in RESOURCE_URL_FIX: r = {**r, 'url': RESOURCE_URL_FIX[r['id']]}
        if not str(r.get('url') or '').startswith('http'): continue
        if str(r.get('confidence') or '').lower().startswith('low'):
            REVIEW.append({'pack': 'deep-india-study', 'kind': 'resource-low-confidence', 'subject': 'resource/' + r['id'], 'reason': r.get('notes') or 'low confidence (permission unconfirmed)', 'severity': 'check'}); continue
        if r.get('kind') in TEXT_KINDS and r.get('access') == 'free':  # licence gate for texts: a free-text claim needs registry evidence (book or domain default)
            lic, why, evu, ent = licence_for(r['id'], r['url'])
            if not linkable(lic):
                log['texts_licence_held'] += 1
                REVIEW.append({'pack': 'deep-india-study', 'kind': 'text-licence', 'subject': 'resource/' + r['id'], 'reason': f'licence gate: free text claimed, registry says {lic or "unregistered"} ({why}); held until the registry evidences a linkable licence', 'severity': 'verify', 'title': r['title'], **({'evidenceUrl': evu} if evu else {})}); continue
        else: lic = evu = ent = why = None
        RES.append({'id': r['id'], 'title': r['title'], 'url': r['url'], 'kind': r.get('kind'), 'free': r.get('access') == 'free', 'licence': {'free': 'free from the publisher', 'paid': 'paid', 'mixed': 'mixed: some free, some paid'}.get(r.get('access'), r.get('access')),
                    **({'licenceClass': lic, 'licenceEvidence': why[:200], 'noSale': no_sale(lic, ent)} if lic else {}), **({'licenceEvidenceUrl': evu} if lic and evu else {}),
                    'traditions': [t for t in (r.get('traditions') or []) if t in TR], 'people': [x for x in [DEEP_PERSON_MAP.get(r.get('person') or '', r.get('person'))] if x in PB],
                    'note': r.get('notes'), 'source_url': r.get('source_url') or r['url'], 'checked': r.get('verified_on'), 'confidence': r.get('confidence'), 'group': 'deep-india-study'})
os.makedirs(os.path.join(ROOT, 'site/data/wisegraph'), exist_ok=True)
json.dump({'_note': 'Texts and resources from staged sourcing groups (tools/merge-sources.py). Links to the publisher only; never rehosted.', 'resources': RES},
          open(os.path.join(ROOT, 'site/data/wisegraph/resources-ext.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
log['resources_ext'] = len(RES)
# staged safety records (public subset only; tools/stage-extensions.py keeps the rest internal) -> wisegraph/redflags.json
RF = []
_PLIDS = {p['id'] for p in (PL or {}).get('places', [])}
def _rf_ok(r): k, i = r['subject'].split('/', 1); return (k == 'person' and i in PB) or (k == 'place' and i in _PLIDS)
for g in G:
    f = os.path.join(SRC, g, 'redflags-public.json')
    if os.path.exists(f): RF += [r for r in items(J(f), 'records') if _rf_ok(r)]
# records added by hand to wisegraph/redflags.json (e.g. vishnudevananda-2019, swami-rama-1997, places round 2026-10-25) are kept, not wiped by a re-merge
_rfp = os.path.join(ROOT, 'wisegraph/redflags.json'); _ids = {r['id'] for r in RF}
for r in (J(_rfp).get('records') or [] if os.path.exists(_rfp) else []):
    if r['id'] not in _ids and _rf_ok(r): RF.append(r); _ids.add(r['id']); log['redflags_hand_kept'] += 1
W(os.path.join(ROOT, 'wisegraph/redflags.json'), {'_note': 'Public safety records (satsang-extensions 19 under the Satsang publication rule). Dry, attributed, dated; each with its primary reports.', 'records': RF})
log['redflags_public'] = len(RF)
# review queue: merge this run's held claims into wisegraph/review-queue.json (stage-extensions.py writes the staged packs' items)
qp = os.path.join(ROOT, 'wisegraph/review-queue.json')
Q = J(qp) if os.path.exists(qp) else {'_note': 'Satsang review queue: claims held back from the live site until a human checks them.', 'items': []}
REFRESH_KINDS = {'text-licence', 'main-teacher-medium', 'main-teacher-held', 'place-dropped'}  # recomputed every run: a resolved claim leaves the queue
_old = {(i['pack'], i['kind'], i['subject']): i for i in Q['items']}
Q['items'] = [i for i in Q['items'] if i['kind'] not in REFRESH_KINDS or (i['kind'] == 'main-teacher-medium' and i['subject'].split('/', 1)[1] not in MAIN_TEACHER_CHECK_PLACES)]
for i in REVIEW:
    if i['kind'] in REFRESH_KINDS and (i['pack'], i['kind'], i['subject']) in _old: i['queued'] = _old[(i['pack'], i['kind'], i['subject'])].get('queued')
QK = {(i['pack'], i['kind'], i['subject']) for i in Q['items']}
for i in REVIEW:
    if (i['pack'], i['kind'], i['subject']) not in QK: QK.add((i['pack'], i['kind'], i['subject'])); Q['items'].append({**i, 'queued': i.get('queued') or TODAY})
W(qp, Q); log['review_queue'] = len(Q['items'])
print(json.dumps({'groups': G, **log, 'traditions': len(TR), 'people': len(PB), 'edges': len(ED['edges']), 'topic_roots': len(tree), 'notes': notes}, ensure_ascii=False))
# keeper fixes last (source_maps.KEEPER_*), so a re-merge never brings back a corrected fact
import subprocess; subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'apply-keeper-fixes.py')], check=True)
