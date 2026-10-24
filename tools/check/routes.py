#!/usr/bin/env python3
"""Write the route list for tools/check/crawl.mjs from the built site data.
usage: python3 tools/check/routes.py <out.json> [--all]   (default samples teachers/traditions/places; --all takes every one)"""
import json, os, random, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APP = os.path.join(ROOT, 'app'); W = os.path.join(APP, 'site/data/wisegraph')
J = lambda *p: json.load(open(os.path.join(*p)))
ALL = '--all' in sys.argv; random.seed(25)
samp = lambda xs, n: list(xs) if ALL else (random.sample(list(xs), min(n, len(xs))))
col = J(W, 'collections.json'); wise = J(W, 'wise.json'); places = J(W, 'places.json'); hubs = J(W, 'hubs.json')['hubs']
tree = J(APP, 'schema/topics.json')['tree']
def tids(t, pre=''):
    for k, v in t.items():
        if isinstance(v, dict) and 'label' in v: yield pre + k; yield from tids(v, pre + k + '/')
series = [c for c in col['collections'] if c['kind'] == 'mini-course']
others = [c for c in col['collections'] if c['kind'] != 'mini-course']
R = ['#topics', '#teachers', '#traditions', '#places', '#collections', '#ask', '#series', '#foryou', '#me', '#history', '#model', '#pair', '#tv',
     '#courses', '#course/how-to-discern-past-lives', '#course/how-to-discern-past-lives/3', '#collection/how-to-discern-past-lives', '#flash/rebirth']
R += [f'#topic/{t}' for t in tids(tree)] + [f'#topic/{h}' for h in hubs]
for s in series: R += [f"#series/{s['id']}"] + [f"#series/{s['id']}/{u['n']}" for u in s.get('units', [])]
R += [f"#collection/{c['id']}" for c in others] + [f'#practice/{p}' for p in col['practices']]
people = wise['people']; speakers = [k for k, p in people.items() if p.get('k') == 'speaker']; figs = [k for k, p in people.items() if p.get('k') != 'speaker']
R += [f'#teacher/{k}' for k in samp(speakers, 60) + samp(figs, 25)]
R += [f'#tradition/{k}' for k in samp(wise['traditions'], 30)]
pl = places['places']; R += [f"#place/{p['id']}" for p in samp([p for p in pl if not p.get('goenka')], 30) + samp([p for p in pl if p.get('goenka')], 5)]
R += [f'#country/{c}' for c in samp(places.get('countries', {}), 8)]
seen = set(); R = [r for r in R if not (r in seen or seen.add(r))]
json.dump(R, open(sys.argv[1], 'w')); print(len(R), 'routes ->', sys.argv[1])
