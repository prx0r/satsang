#!/usr/bin/env python3
"""Summarise crawl output: findings per route + every in-app link seen that is not in the route list.
usage: python3 tools/check/crawl-report.py <outdir> <phone|desktop> [routes.json]"""
import glob, json, os, sys, collections
O, D = sys.argv[1], sys.argv[2]
R = []
for f in sorted(glob.glob(os.path.join(O, f'{D}-*.json'))): R += [r for r in json.load(open(f)) if not r.get('crashed')]
routes = set(json.load(open(sys.argv[3]))) if len(sys.argv) > 3 else set()
print(D, len(R), 'routes crawled', f'(of {len(routes)})' if routes else '')
links = collections.Counter(); fx = 0
for r in R:
    for l in r.get('links') or []: links[l] += 1
    f = {k: r.get(k) for k in ('console', 'pageerror', 'bad', 'imgs', 'odd', 'fail') if r.get(k)}
    if (r.get('chars') or 0) < 40: f['chars'] = r.get('chars')
    if r.get('sideways'): f['sideways'] = 1
    if r.get('deadBtn'): f['unlabelled_buttons'] = r['deadBtn']
    if f: fx += 1; print(' ', r['route'], '->', r.get('hash'), r.get('view'), json.dumps(f, ensure_ascii=False)[:260])
missing = sorted(set(routes) - {r['route'] for r in R}); print('not crawled:', len(missing), missing[:10])
new = sorted(l for l in links if l.startswith('#') and l not in routes and len(l) > 1)
json.dump({'hash': new, 'path': sorted(l for l in links if l.startswith('/')), 'ext': sorted({l.split('/')[2] for l in links if l.startswith('http')})}, open(os.path.join(O, f'{D}-links.json'), 'w'))
print(fx, 'routes with findings;', len(new), 'new in-app hash links,', sum(1 for l in links if l.startswith('/')), 'path links ->', os.path.join(O, f'{D}-links.json'))
