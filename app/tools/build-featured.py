#!/usr/bin/env python3
"""Featured tradition (owner, 2026-11-04: Trika front and centre) -> site/data/wisegraph/featured.json.

Reads the hand-curated wisegraph/featured.json (order = display order) and resolves it against the catalogue:
  people  -> name, kind, and N best talks each (gold first, then strong, then gold-signals score; YouTube, servable, not footage)
  series  -> collections that exist (title, kind, href)
  texts   -> text records in the wisegraph
  places  -> places that exist, have no place-level safety record and are not "details unverified"
Hard rule: a person with a person-level public safety record (wisegraph/redflags.json) is dropped, and so is any talk by one.
Fails (exit 1) on an unknown id, so a typo never ships silently. Satsang's own words only (notes come from the config).
Run after build-gold.py and build-collections.py; deploy.sh build runs it.
"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); APP = os.path.dirname(HERE)
J = lambda p: json.load(open(os.path.join(APP, p)))
cfg = J('wisegraph/featured.json')
clips = J('clips.json')
gold = J('site/data/wisegraph/gold.json'); G, S = set(gold['gold']), set(gold['strong'])
sig = J('wisegraph/gold-signals.json')['signals']
_pp = J('wisegraph/people.json')['people']; people = {p['id']: p for p in _pp} if isinstance(_pp, list) else _pp
flags = J('wisegraph/redflags.json')['records']
held_p = {r['subject'].split('/', 1)[1] for r in flags if r['subject'].startswith('person/')}
held_pl = {r['subject'].split('/', 1)[1] for r in flags if r['subject'].startswith('place/')}
places = {p['id']: p for p in J('wisegraph/places.json')['places']}
cols = {c['id']: c for c in J('site/data/wisegraph/collections.json')['collections']}
errs, dropped = [], []

def tier(c): return 2 if c['id'] in G else 1 if c['id'] in S else 0
def ok(c): return c.get('media') == 'youtube' and c.get('format') != 'vertical' and not c.get('footage') and c.get('kind') not in ('footage', 'reading')

out_people, talks = [], []
for x in cfg['people']:
    pid = x['id']; p = people.get(pid)
    if not p: errs.append('unknown person ' + pid); continue
    if pid in held_p: dropped.append(pid); continue
    out_people.append({'id': pid, 'n': p.get('name'), 'kind': p.get('kind'), 'note': x.get('note', '')})
    k = int(x.get('talks') or 0)
    if k:
        L = sorted([c for c in clips if c.get('speaker') == pid and ok(c)], key=lambda c: (-tier(c), -(sig.get(c['id'], {}).get('s') or 0), c['id']))
        if not L: errs.append('no playable talks for ' + pid)
        for c in L[:k]: talks.append({'id': c['id'], 'speaker': pid, 'tier': ['standard', 'strong', 'gold'][tier(c)]})
# interleave: each person's best talk first (in featured order), then their second, ...
by = {}
for t in talks: by.setdefault(t['speaker'], []).append(t)
order = []
for r in range(max([len(v) for v in by.values()] or [0])):
    for x in out_people:
        v = by.get(x['id'], [])
        if r < len(v): order.append(v[r])
series = []
for sid in cfg['series']:
    c = cols.get(sid)
    if not c: errs.append('unknown series ' + sid); continue
    series.append({'id': sid, 'title': c.get('title'), 'kind': c.get('kind'), 'href': ('#series/' if c.get('kind') == 'mini-course' else '#collection/') + sid, 'units': len(c.get('units') or [])})
texts = []
for tid in cfg['texts']:
    p = people.get(tid)
    if not p or p.get('kind') != 'text': errs.append('unknown text ' + tid); continue
    texts.append({'id': tid, 'n': p.get('short') or p.get('name')})
pls = []
for pid in cfg['places']:
    p = places.get(pid)
    if not p: errs.append('unknown place ' + pid); continue
    if pid in held_pl or p.get('details_unverified'): dropped.append('place/' + pid); continue
    pls.append({'id': pid, 'n': p.get('name'), 'city': p.get('city') or '', 'country': p.get('country_name') or p.get('country') or ''})
if errs: print('build-featured: ' + '; '.join(errs), file=sys.stderr); sys.exit(1)
out = {'version': 1, 'tradition': cfg['tradition'], 'label': cfg['label'], 'line': cfg['line'], 'people': out_people, 'talks': order,
       'series': series, 'texts': texts, 'places': pls, 'foryou_cold': cfg.get('foryou_cold', 4)}
json.dump(out, open(os.path.join(APP, 'site/data/wisegraph/featured.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print(f"featured {cfg['tradition']}: {len(out_people)} people, {len(order)} talks ({sum(t['tier']=='gold' for t in order)} gold), {len(series)} series, {len(texts)} texts, {len(pls)} places" + (f"; dropped {dropped}" if dropped else ''))
