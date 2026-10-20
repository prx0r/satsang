import json,sys,concurrent.futures as F
from ytsearch import search
qs=[l.strip() for l in sys.stdin if l.strip()]
with F.ThreadPoolExecutor(4) as ex: res=list(ex.map(search,qs))
for q,r in zip(qs,res):
    print('##',q,r.get('err') or '')
    for x in r['rows'][:14]:
        if x['sec'] and 90<=x['sec']<=1200: print('  ',x['id'],x['sec'],x['views'],x['ago'],x['channel'],x['chanId'],'|',x['title'][:75])
