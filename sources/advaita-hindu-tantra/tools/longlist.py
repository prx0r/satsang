import json, re, collections, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
src = open('tools/pick.py').read()
pre = src.split('rows = []; drop')[0].replace("os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))", '')
g = {}; exec(pre, g)
P = json.load(open('raw/pool.json'))
out = []
for p in P:
    t = g['clean'](p['title']); sn = g['clean'](p['snippet'])
    if not p['sec'] or p['sec'] <= 1200 or p['sec'] > 7200: continue
    if g['NONLATIN'].search(t) or g['EXC'].search(t) or p['chanId'] == 'UCuv4AUvgAgut3zdiPmvG5Pw': continue
    sp = g['speaker'](p)
    if not sp: continue
    tp = [x for x in g['tag'](t, sn, None) if x[2] == 'title']
    figs = g['figures'](p, sp[0]); rare = set(figs) & g['RARE_FIG']
    if not (rare or (tp and tp[0][0].split('/')[0] in g['PRIORITY'])): continue
    out.append({'id': p['id'], 'title': t, 'channel': p['channel'], 'speaker': sp[0], 'sec': p['sec'], 'views': p['views'], 'topics': [x[0] for x in tp], 'figures': figs, 'why': 'rare-figure' if rare else 'priority-topic'})
out.sort(key=lambda x: (x['why'] != 'rare-figure', -(x['views'] or 0)))
keep = []; n = collections.Counter()
for x in out:
    if n[x['channel']] >= 6: continue
    n[x['channel']] += 1; keep.append(x)
json.dump({'_note': 'INTERNAL work list, not candidates: official talks longer than 20 min worth cutting into 1-20 min virtual clips once transcripts can be fetched (analyze_video failed twice this run). Embeddability not yet checked.', 'videos': keep}, open('long-candidates.json', 'w'), indent=1, ensure_ascii=False)
print(len(keep), dict(n))
for x in keep[:20]: print(x['channel'][:12], x['sec'], x['title'][:70], x['figures'])
