import json,math,collections
pool=json.load(open('../raw/pool.json'))
CAP={'sheng-yen':50,'robert-thurman':50,'jundo-cohen':35}
LCAP=25
by=collections.defaultdict(list)
for r in pool: by[r['speaker']].append(r)
sel=[];longs=[]
for sp,l in by.items():
    nw=[r for r in l if r['kind']!='long']
    nw.sort(key=lambda r:(-r['_score'],-(math.log10((r['views'] or 0)+1))))
    sel+=nw[:CAP.get(sp,70)]
    lg=[r for r in l if r['kind']=='long']
    lg.sort(key=lambda r:(-r['_score'],-(r['views'] or 0)))
    longs+=lg[:LCAP]
json.dump(sel,open('../raw/sel.json','w'),ensure_ascii=False); json.dump(longs,open('../raw/longs.json','w'),ensure_ascii=False)
open('../raw/sel_ids.txt','w').write('\n'.join(r['id'] for r in sel)); open('../raw/long_ids.txt','w').write('\n'.join(r['id'] for r in longs))
print(len(sel),len(longs))
