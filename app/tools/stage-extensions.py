# Satsang: stage packs from prx0r/satsang-extensions into normal sourcing groups (sources/ext-<pack>[-<group>]/).
# The merger (tools/merge-sources.py) then reads them like any other group. Staging is where the review rules bite:
#   - people/places are deduped against the existing graph (normalised name, aliases, Wikidata; places also by name + ~2 km)
#   - living:true claims never go live: the flag is dropped and the claim goes to the review queue
#   - edges below confidence medium go to the review queue, not live; medium teacher_of is read as studied_with by the merger
#   - every record carries source_url, verified_on, confidence
#   - URLs the pack's own urls-verified gate could not confirm are re-checked (HTTP 200); still failing -> dropped (URL-less row)
#   - contact values whose source is off the organisation's domain are dropped and queued (official-published only)
#   - red-flag records are never staged into sources/ (public repo): see tools/stage-redflags.py
# Docs travel with data: README/REPORT/MERGE-NOTES are copied into each group (REPORT.md gates the group in groups()).
# usage: python3 tools/stage-extensions.py --ext /tmp/sx --packs 01-tradition-nodes,02-scholars-academic [--receipts DIR]
import argparse, json, os, re, sys, glob, shutil, subprocess, unicodedata, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from source_maps import PERSON_MAP, TRAD_MAP
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, '..', 'sources')
QP = os.path.join(ROOT, 'wisegraph/review-queue.json')
J = lambda p: json.load(open(p))
def W(p, d): os.makedirs(os.path.dirname(p), exist_ok=True); json.dump(d, open(p, 'w'), ensure_ascii=False, indent=1); open(p, 'a').write('\n')
ap = argparse.ArgumentParser(); ap.add_argument('--ext', required=True); ap.add_argument('--packs', required=True)
ap.add_argument('--receipts', default=None); ap.add_argument('--date', default='2026-10-20')
A = ap.parse_args()
DATE = A.date

def norm(s):
    s = unicodedata.normalize('NFKD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'\(.*?\)', ' ', s)
    s = re.sub(r'\b(the|of|and|sri|shri|swami|ajahn|ven|venerable|bhante|lama|rinpoche|sayadaw|roshi|guru|saint|st|dr|prof|bhikkhu|bhikshuni|bhikkhuni|maharaj|ji)\b', ' ', s)
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()
def pnorm(s):
    s = unicodedata.normalize('NFKD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'\(.*?\)', ' ', s)
    s = re.sub(r'\b(the|of|and|centre|center|monastery|ashram|ashrama|temple|vihara|wat|math|mutt|institute|society|foundation|retreat|meditation|buddhist|zen|dhamma)\b', ' ', s)
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()
def km(a, b):
    if None in (a.get('lat'), a.get('lng'), b.get('lat'), b.get('lng')): return 1e9
    p = math.pi / 180; x = (b['lng'] - a['lng']) * p * math.cos((a['lat'] + b['lat']) / 2 * p); y = (b['lat'] - a['lat']) * p
    return 6371 * math.hypot(x, y)
def host(u):
    m = re.match(r'https?://([^/]+)', u or ''); h = (m.group(1) if m else '').lower()
    return h[4:] if h.startswith('www.') else h
def regdom(h):
    parts = h.split('.')
    return '.'.join(parts[-3:]) if len(parts) > 2 and parts[-2] in ('co', 'org', 'ac', 'gov', 'net', 'or', 'com') and len(parts[-1]) == 2 else '.'.join(parts[-2:])

# ---------- the existing graph (after earlier batches) ----------
PEOPLE = J(os.path.join(ROOT, 'wisegraph/people.json'))['people']
TRADS = {n['id'] for n in J(os.path.join(ROOT, 'wisegraph/traditions.json'))['nodes']}
PLACES = J(os.path.join(ROOT, 'wisegraph/places.json'))['places']
PID = {p['id'] for p in PEOPLE}
PBYNAME, PBYWD = {}, {}
for p in PEOPLE:
    for n in [p.get('name'), p.get('short')] + list(p.get('aliases') or []):
        k = norm(n)
        if len(k) >= 5: PBYNAME.setdefault(k, set()).add(p['id'])
    if p.get('wikidata'): PBYWD[p['wikidata']] = p['id']
PLID = {p['id']: p for p in PLACES}
PLBYNAME = {}
for p in PLACES:
    for n in [p.get('name')] + list(p.get('aliases') or []):
        k = pnorm(n)
        if len(k) >= 4: PLBYNAME.setdefault(k, []).append(p)

QUEUE = J(QP) if os.path.exists(QP) else {'_note': 'Satsang review queue: claims held back from the live site until a human checks them (tools/stage-extensions.py, '
                                            '11-site-runtime/review_queue.py). Regenerated per pack; edit decisions into tools/source_maps.py, never here.', 'items': []}
QKEYS = {(i['pack'], i['kind'], i['subject']) for i in QUEUE['items']}
def queue(pack, kind, subject, reason, severity='verify', **kw):
    k = (pack, kind, subject)
    if k in QKEYS: return
    QKEYS.add(k); QUEUE['items'].append({'pack': pack, 'kind': kind, 'subject': subject, 'reason': reason, 'severity': severity, 'queued': DATE, **kw})

# URLs the pack's own urls-verified gate flagged (receipts), re-checked live once
FLAGGED = set()
if A.receipts:
    for f in glob.glob(os.path.join(A.receipts, '*.json')):
        for g in J(f).get('gates') or []:
            if g['id'].startswith('urls-verified'):
                for x in g['failures']:
                    m = re.search(r'(https?://\S+)', x.get('reason', ''))
                    if m: FLAGGED.add(m.group(1))
_ok = {}
def url_ok(u):
    if u not in _ok:
        try:
            r = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '-L', '-m', '15', '-A',
                                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', u], capture_output=True, text=True, timeout=20)
            _ok[u] = r.stdout.strip() == '200'
        except Exception: _ok[u] = False
    return _ok[u]
def clean_url(u, pack, subj):
    if not u or not re.match(r'https?://', str(u)): return None
    if u in FLAGGED and not url_ok(u):
        queue(pack, 'url-unverified', subj, f'URL not confirmed (WAF or down on {DATE}): {u}; shipped URL-less'); return None
    return u

def conf_of(x, default='medium'):
    c = str(x.get('conf') or x.get('confidence') or default).lower()
    return 'high' if c.startswith('high') else 'low' if c.startswith('low') else 'medium'
def src_url(x):
    for k in ('source_url', 'source', 'src'):
        v = x.get(k)
        if isinstance(v, str):
            m = re.search(r'https?://\S+', v)
            if m: return m.group(0).rstrip(').,;')
    v = str(x.get('source') or '')
    m = re.search(r'\b((?:[a-z0-9-]+\.)+(?:org|com|net|edu|lk|in|uk|us|de|fr|it|jp|th|au|nz|ca|io|info|br|pe|cr)(?:/[\w%./-]*)?)', v)  # a cited site written without the scheme
    if m and not re.search(r'@', v): return 'https://' + m.group(1).rstrip('.')
    if x.get('wikidata'): return f'https://www.wikidata.org/wiki/{x["wikidata"]}'
    return None

def pack_files(pdir):
    """(group_suffix, path) for every JSON data file in a pack; sources/<g>/ subgroups keep their group name"""
    out = []
    for f in sorted(glob.glob(os.path.join(pdir, '**', '*.json'), recursive=True)):
        rel = os.path.relpath(f, pdir)
        if rel.split(os.sep)[0] in ('receipts', 'out', 'clusters', 'schemas'): continue
        m = re.match(r'sources/([^/]+)/', rel)
        out.append((m.group(1) if m else None, f))
    return out

IMP = os.path.join(ROOT, 'wisegraph/ext-idmap.json')  # dedupe decisions, cumulative across packs (later packs reference earlier packs' ids)
IDMAP = J(IMP) if os.path.exists(IMP) else {'_note': 'Pack id -> existing id, decided by tools/stage-extensions.py dedupe (normalised name / Wikidata / name + distance).', 'people': {}, 'places': {}}
INTERNAL = os.path.join(ROOT, '..', 'internal')  # never synced to git: sensitive pack material (red flags under human review)
SENSITIVE = {'19-red-flags'}
STRONG = {'institutional', 'investigation', 'regulator', 'court'}
def dead(pid, extra):
    y = str((extra.get(pid) or {}).get('years') or next((p.get('years') for p in PEOPLE if p['id'] == pid), '') or '')
    return bool(re.search(r'\d{3,4}\s*$', y)) and (extra.get(pid) or {}).get('living') is not True
summary = {}
for pack in [p.strip() for p in A.packs.split(',') if p.strip()]:
    pdir = os.path.join(A.ext, pack)
    if not os.path.isdir(pdir): print('missing pack', pack, file=sys.stderr); continue
    nn = pack.split('-')[0]
    G = {}  # group dir -> data
    PMAP, PLMAP = dict(IDMAP['people']), dict(IDMAP['places'])  # deduped ids -> existing ids, from every pack staged so far (applied at write time)
    def grp(sub):
        gid = f'ext-{pack}' if not sub else f'ext-{nn}-{sub}'
        return G.setdefault(gid, {'traditions': [], 'people': [], 'edges': [], 'places': [], 'contacts': {}, 'main': [], 'works': [], 'texts': [], 'place_links': [], 'years': {}})
    st = summary.setdefault(pack, {})
    def inc(k, n=1): st[k] = st.get(k, 0) + n
    for sub, f in pack_files(pdir):
        base = os.path.basename(f); d = J(f); g = grp(sub)
        if base.startswith('traditions'):
            for n in d.get('nodes') or []:
                n = dict(n); n['id'] = TRAD_MAP.get(n['id'], n['id'])
                n.update({'source_url': src_url(n), 'verified_on': DATE, 'confidence': conf_of(n, 'high')})
                g['traditions'].append(n); inc('traditions')
        elif base.startswith('people'):
            for p in d.get('people') or []:
                p = dict(p); pid0 = p['id']
                pid = PERSON_MAP.get(pid0, pid0)
                if pid not in PID:  # dedupe: Wikidata, then normalised name/aliases
                    hit = PBYWD.get(p.get('wikidata')) if p.get('wikidata') else None
                    if not hit:
                        cands = set()
                        for n in [p.get('name'), p.get('short')] + list(p.get('aliases') or []):
                            cands |= PBYNAME.get(norm(n), set())
                        if len(cands) == 1: hit = next(iter(cands))
                        elif len(cands) > 1: queue(pack, 'person-ambiguous', pid0, f'name matches several existing people: {sorted(cands)}; staged as new id', 'check')
                    if hit: p['id'] = hit; PMAP[pid0] = hit; inc('people_deduped'); st.setdefault('dedupe', []).append(f'{pid0}->{hit}')
                if p.get('living') is True:
                    queue(pack, 'living-claim', 'person/' + p['id'], f'living:true claimed ({p.get("source") or "no source"}); not set live until checked', 'check')
                    p['living'] = None; inc('living_held')
                p['source_url'] = src_url(p); p['verified_on'] = DATE; p['confidence'] = conf_of(p, 'high' if p.get('wikidata') else 'medium')
                g['people'].append(p); inc('people')
        elif base.startswith('edges'):
            for e in d.get('edges') or []:
                e = dict(e); c = conf_of(e)
                a, b = e.get('from'), e.get('to')
                if c == 'low':
                    queue(pack, 'edge-low-confidence', f'{a}->{b}:{e.get("type")}', f'confidence low: {e.get("note") or ""}'.strip(), 'check'); inc('edges_low_held'); continue
                u = clean_url(src_url(e), pack, f'{a}->{b}')
                row = {'from': a, 'to': b, 'type': e['type'], 'conf': c, 'note': e.get('note'), 'src': u, 'checked': DATE if u else None}
                if e.get('target_kind') == 'place' or e['type'] in ('sister_of', 'branch_of', 'teaches_at', 'abbot_of') and (b in PLID or e.get('target_kind') == 'place'):
                    g['place_links'].append({k: v for k, v in row.items() if v}); inc('place_links')
                elif e['type'] == 'founded' and b not in TRADS:
                    g['place_links'].append({k: v for k, v in row.items() if v}); inc('place_links')
                else:
                    if e['type'] == 'teacher_of' and c == 'medium': queue(pack, 'edge-medium-teacher', f'{a}->{b}', 'medium teacher_of: shown as "studied with" until checked', 'verify')
                    g['edges'].append({k: v for k, v in row.items() if v}); inc('edges')
        elif base.startswith('places'):
            for p in d.get('places') or []:
                p = dict(p); pid0 = p['id']
                if pid0 not in PLID:
                    hit = None
                    for q in PLBYNAME.get(pnorm(p.get('name')), []):
                        if km(p, q) < 30 or q.get('lat') is None or p.get('lat') is None: hit = q['id']; break
                    if not hit:
                        for q in PLACES:
                            if km(p, q) < 2 and set(pnorm(p['name']).split()) & set(pnorm(q['name']).split()): hit = q['id']; break
                    if hit: p['id'] = hit; PLMAP[pid0] = hit; inc('places_deduped'); st.setdefault('dedupe', []).append(f'place {pid0}->{hit}')
                url = p.get('url') if p.get('url_status', 'ok') == 'ok' else None
                p['url'] = clean_url(url, pack, 'place/' + p['id'])
                if p.get('contact_page'): p['contact_page'] = clean_url(p['contact_page'], pack, 'place/' + p['id'] + '#contact')
                if 'founded_source' in p and re.search(r'verif|traditional', str(p.get('founded_source')), re.I) and not re.search(r'https?://', str(p['founded_source'])):
                    queue(pack, 'place-founded', 'place/' + p['id'], f'founded {p.get("founded")} not sourced ({p["founded_source"]}); held back'); p.pop('founded', None)
                p['source_url'] = p['url'] or src_url(p) or p.get('contact_page'); p['verified_on'] = p.get('url_checked') or DATE
                p['confidence'] = 'high' if p['url'] else 'medium'
                g['places'].append(p); inc('places')
        elif base.startswith('place-contacts'):
            for pid, c in (d.get('places') or {}).items():
                c = json.loads(json.dumps(c)); site = regdom(host(c.get('site') or (PLID.get(pid) or {}).get('url') or ''))
                for f2 in ('email', 'phone'):
                    keep = []
                    for v in c.get(f2) or []:
                        sh = regdom(host(v.get('source_url')))
                        if site and sh and sh != site:
                            queue(pack, 'contact-offdomain', f'place/{pid}#{f2}', f'{f2} source off the official domain ({v.get("source_url")}); dropped'); inc('contacts_dropped'); continue
                        keep.append(v)
                    if keep: c[f2] = keep
                    else: c.pop(f2, None)
                g['contacts'][pid] = c; inc('contacts')
        elif base.startswith('main-teachers'):
            for m in d.get('links') or []:
                if conf_of(m) == 'low': queue(pack, 'main-teacher-low', f'place/{m["place"]}', 'low confidence main teacher', 'check'); continue
                if conf_of(m) == 'medium': queue(pack, 'main-teacher-medium', f'place/{m["place"]}', f'main teacher {m["teacher"]} (medium): {m.get("note") or "re-check current post"}')
                g['main'].append({**m, 'conf': conf_of(m)}); inc('main_teachers')
        elif base.startswith('works-attach'):
            for w in d.get('attach') or []:
                ok = []
                for x in w.get('works') or []:
                    if x.get('check') or x.get('verify'): queue(pack, 'work-check', f'person/{w["person"]}#{x.get("id") or x.get("title")}', 'work flagged check/verify by the pack', 'check'); continue
                    ok.append(x)
                if ok: g['works'].append({'person': PERSON_MAP.get(w['person'], w['person']), 'works': ok}); inc('works', len(ok))
        elif base.startswith('texts'):
            for t in d.get('texts') or []:
                t = dict(t); t['link'] = clean_url(t.get('link'), pack, 'text/' + t['id'])
                g['texts'].append(t); inc('texts')
        elif base.startswith('collection'):
            g.setdefault('collections', []).extend(d.get('collections') or []); inc('collections', len(d.get('collections') or []))
        elif base.startswith('practices'):
            g.setdefault('practices', []).extend(d.get('practices') or []); inc('practices', len(d.get('practices') or []))
        elif os.sep + 'visuals' + os.sep in f:  # practice visual specs: no consumer yet (engine/ grammar v1.1 will read them)
            dst = os.path.join(ROOT, 'wisegraph', 'visuals', base); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy(f, dst); inc('visuals')
        elif base == 'practice-links.json':  # practice -> teachers/texts attributions (golden path); check:true held
            for pid, l in (d.get('links') or {}).items():
                if l.get('check'): queue(pack, 'practice-link-check', 'practice/' + pid, l.get('note') or 'attribution flagged check by the pack', 'check'); continue
                if l.get('teachers'): g.setdefault('practice_links', {})[pid] = {'teachers': [PERSON_MAP.get(t, t) for t in l['teachers']], 'texts': l.get('texts') or []}
            inc('practice_links', len(g.get('practice_links') or {}))
        elif base.startswith('redflags'):  # red flags: public only with a strong primary source, a deceased subject and a factual status; the rest stays internal
            os.makedirs(os.path.join(INTERNAL, pack), exist_ok=True); shutil.copy(f, os.path.join(INTERNAL, pack, base))
            extra = {}
            for f2 in glob.glob(os.path.join(pdir, 'people*.json')):
                for x in J(f2).get('people') or []: extra[x['id']] = x
            for r in d.get('records') or []:
                kind, sid = r['subject'].split('/', 1)
                strong = any(x.get('kind') in STRONG for x in r.get('reports') or [])
                ok = kind == 'person' and strong and dead(sid, extra) and r.get('status') in ('addressed', 'historical') and r.get('visibility') == 'public'
                if ok:
                    reps = [{'outlet': x.get('outlet'), 'kind': x.get('kind'), 'url': x['url'], 'date': x.get('date')} for x in r['reports'] if url_ok(x['url'])]
                    if not any(x['kind'] in STRONG for x in reps): ok = False
                if ok:
                    summ = r['summary'] if len(r['summary']) <= 520 else r['summary'][:520].rsplit('. ', 1)[0] + '.'
                    g.setdefault('redflags', []).append({'id': r['id'], 'subject': r['subject'], 'status': r['status'], 'happened': r.get('happened'), 'category': r.get('category'),
                                                        'summary': summ, 'reports': reps, 'updated': r.get('updated') or DATE, 'verified_on': DATE, 'confidence': 'high'}); inc('redflags_public')
                else:
                    held = J(os.path.join(INTERNAL, 'review-internal.json')) if os.path.exists(os.path.join(INTERNAL, 'review-internal.json')) else {'items': []}
                    if r['id'] not in {i['id'] for i in held['items']}: held['items'].append({'id': r['id'], 'subject': r['subject'], 'why': 'red flag held for a human re-read (living subject, press-only or dispute)', 'queued': DATE})
                    W(os.path.join(INTERNAL, 'review-internal.json'), held); inc('redflags_internal')
        elif base.startswith('programmes'):  # satsang-extensions 32: recurring programme patterns only (never dated instances); schedule link re-checked
            for r in d.get('programmes') or []:
                r = dict(r); r['place'] = PLMAP.get(r['place'], IDMAP['places'].get(r['place'], r['place']))
                if r['place'] not in PLID: queue(pack, 'programme-unplaced', 'programme/' + r['id'], f'place {r["place"]} not in the graph; held'); continue
                u = r.get('schedule_url')
                if u and not url_ok(u): queue(pack, 'url-unverified', 'programme/' + r['id'], f'schedule link not 200 on {DATE}: {u}; shipped without it'); u = None
                r['schedule_url'] = u; r['teachers'] = [PMAP.get(t, t) for t in r.get('teachers') or []]; r['checked'] = DATE if u else None
                g.setdefault('programmes', []).append({k: v for k, v in r.items() if v not in (None, [], '')}); inc('programmes')
        elif base == 'years.json':
            g['years'].update(d.get('set_years') or {}); inc('years_fixes', len(d.get('set_years') or {}))
        elif base == 'living-flags.json':
            for pid in d.get('set_living_true') or []:
                queue(pack, 'living-claim', 'person/' + pid, 'pack proposes living:true; held for review' + (' (CONTRADICTED: died 2025-02-02, keeper fix)' if pid == 'mark-dyczkowski' else ''), 'check'); inc('living_held')
        else:
            inc('spec_files')  # platform/spec files: copied to specs/extensions/<pack>/ (not data)
            dst = os.path.join(INTERNAL if pack in SENSITIVE else os.path.join(ROOT, '..', 'specs', 'extensions'), pack, os.path.relpath(f, pdir)); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy(f, dst)
    # docs travel with data; scripts, SQL drafts and other non-JSON pack files are archived with them (never applied here)
    DOCS = os.path.join(INTERNAL, pack) if pack in SENSITIVE else os.path.join(ROOT, '..', 'specs', 'extensions', pack)
    for fx in glob.glob(os.path.join(pdir, '**', '*'), recursive=True):
        rel = os.path.relpath(fx, pdir)
        if os.path.isdir(fx) or fx.endswith(('.json', '.pyc')) or rel.split(os.sep)[0] in ('receipts', 'out', 'clusters') or '__pycache__' in rel or rel.endswith('.md') and os.sep not in rel: continue
        dst = os.path.join(DOCS, rel); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy(fx, dst)
    for md in glob.glob(os.path.join(pdir, '*.md')):
        dst = os.path.join(DOCS, os.path.basename(md)); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy(md, dst)
    ESRC = {}
    for g in G.values():
        for e in g['edges'] + g['place_links']:
            if e.get('src'):
                for k in (e['from'], e['to']): ESRC.setdefault(k, e['src'])
    for g in G.values():
        for p in g['people']:
            if not p.get('source_url'):
                u = ESRC.get(p['id']) or next((ESRC[k] for k, v in PMAP.items() if v == p['id'] and k in ESRC), None)
                if u: p['source_url'] = u; p['source_basis'] = 'edge source (the record that names this person)'
                else: p['confidence'] = 'medium' if p.get('confidence') == 'high' else p['confidence']
                p['source_note'] = p.get('source')
    M = lambda x: PMAP.get(x, PLMAP.get(x, x))
    for g in G.values():
        for e in g['edges'] + g['place_links']: e['from'], e['to'] = M(e['from']), M(e['to'])
        for m in g['main']: m['place'], m['teacher'] = PLMAP.get(m['place'], m['place']), PMAP.get(m['teacher'], m['teacher'])
        for p in g['places']: p['teacher_ids'] = [PMAP.get(t, t) for t in p.get('teacher_ids') or []]
        g['contacts'] = {PLMAP.get(k, k): v for k, v in g['contacts'].items()}
        for w in g['works']: w['person'] = PMAP.get(w['person'], w['person'])
        for r in g.get('redflags') or []: k, i = r['subject'].split('/', 1); r['subject'] = f'{k}/{PMAP.get(i, i)}'
    for gid, g in G.items():
        if not any(g.values()): continue
        gd = os.path.join(SRC, gid); os.makedirs(gd, exist_ok=True)
        if g['traditions']: W(os.path.join(gd, 'traditions-additions.json'), {'_note': f'staged from satsang-extensions/{pack}', 'nodes': g['traditions']})
        if g['people'] or g['works']:
            ppl = g['people']
            W(os.path.join(gd, 'people-additions.json'), {'_note': f'staged from satsang-extensions/{pack}', 'people': ppl})
        if g['edges']: W(os.path.join(gd, 'edges-additions.json'), {'_note': f'staged from satsang-extensions/{pack}', 'edges': g['edges']})
        if g['places']: W(os.path.join(gd, 'places-ext.json'), {'_note': f'staged from satsang-extensions/{pack}', 'places': g['places']})
        if g['contacts']: W(os.path.join(gd, 'place-contacts.json'), {'_note': f'staged from satsang-extensions/{pack}', 'places': g['contacts']})
        if g['main']: W(os.path.join(gd, 'main-teachers.json'), {'_note': f'staged from satsang-extensions/{pack}', 'links': g['main']})
        if g['works']: W(os.path.join(gd, 'works-attach.json'), {'_note': f'staged from satsang-extensions/{pack}', 'attach': g['works']})
        if g['texts']: W(os.path.join(gd, 'texts.json'), {'_note': f'staged from satsang-extensions/{pack}', 'texts': g['texts']})
        if g['place_links']: W(os.path.join(gd, 'place-links.json'), {'_note': f'staged from satsang-extensions/{pack}', 'links': g['place_links']})
        if g.get('collections'): W(os.path.join(gd, 'collections.json'), {'_note': f'staged from satsang-extensions/{pack}', 'collections': g['collections']})
        if g.get('practices'): W(os.path.join(gd, 'practices.json'), {'_note': f'staged from satsang-extensions/{pack}', 'practices': g['practices']})
        if g.get('practice_links'): W(os.path.join(gd, 'practice-links.json'), {'_note': f'staged from satsang-extensions/{pack}', 'links': g['practice_links']})
        if g.get('redflags'): W(os.path.join(gd, 'redflags-public.json'), {'_note': 'Safety records published under the Satsang rule: a strong primary source (institutional statement, investigation, regulator), a deceased subject and a factual status; summaries are dry and attributed. Others stay internal for a human re-read.', 'records': g['redflags']})
        if g.get('programmes'): W(os.path.join(gd, 'programmes.json'), {'_note': f'staged from satsang-extensions/{pack}: recurring patterns + official schedule link, no dates', 'programmes': g['programmes']})
        if g['years']: W(os.path.join(gd, 'years-fix.json'), {'_note': f'staged from satsang-extensions/{pack}', 'set_years': g['years']})
        rep = os.path.join(pdir, 'REPORT.md') if not os.path.exists(os.path.join(pdir, 'sources', gid.split('-', 2)[-1], 'REPORT.md')) else os.path.join(pdir, 'sources', gid.split('-', 2)[-1], 'REPORT.md')
        hdr = f'# {gid}: staged from prx0r/satsang-extensions/{pack} on {DATE}\n\nStaged by app/tools/stage-extensions.py (dedupe, living/low-confidence claims to app/wisegraph/review-queue.json). Pack docs: specs/extensions/{pack}/.\n\n'
        open(os.path.join(gd, 'REPORT.md'), 'w').write(hdr + ('' if pack in SENSITIVE else open(rep).read() if os.path.exists(rep) else ''))
    st['groups'] = sorted(k for k, g in G.items() if any(g.values()))
    IDMAP['people'].update({k: v for k, v in PMAP.items() if k != v}); IDMAP['places'].update({k: v for k, v in PLMAP.items() if k != v})
    W(IMP, IDMAP)
W(QP, QUEUE)
print(json.dumps({'packs': summary, 'queue': len(QUEUE['items'])}, ensure_ascii=False))
