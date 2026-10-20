import ytsearch,json,sys,concurrent.futures as F
from collections import defaultdict,Counter
qs=[l.strip() for l in open(sys.argv[1]) if l.strip()]
def run(q): return q,ytsearch.search(q)
agg=defaultdict(lambda:{'n':0,'qs':set(),'titles':[],'name':None})
with F.ThreadPoolExecutor(4) as ex:
  for q,r in ex.map(run,qs):
    if r.get('err'): print('ERR',q)
    for x in r['rows'][:20]:
      a=agg[x['chanId']]; a['n']+=1; a['qs'].add(q); a['name']=x['channel']
      if len(a['titles'])<4: a['titles'].append(f"{x['sec']}s {x['title'][:70]}")
for c,a in sorted(agg.items(),key=lambda kv:-kv[1]['n']):
  if a['n']>=2: print(a['n'],c,a['name'],'|',list(a['qs'])[:3],'|',a['titles'][:3])
