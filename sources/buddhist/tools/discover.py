import json,sys,concurrent.futures as F
from ytsearch import search
CH=json.load(open('channels.json'))
Q=["rebirth","reincarnation","karma","kamma","not self","no self","anatta","self","ego","death","dying","meditation","breath","awakening","enlightenment","nirvana","nibbana","suffering","dukkha","emptiness","compassion","impermanence","fear","anger","mindfulness","craving","desire","jhana","dependent origination","letting go","love","bardo","koan","Dogen","grief","happiness","mind","insight","concentration","wisdom","the self","after death"]
jobs=[(c,q) for c in CH for q in Q]
out={}
def run(j):
    c,q=j; return c,q,search(q,path='/channel/'+c['id'])
with F.ThreadPoolExecutor(6) as ex:
    for c,q,r in ex.map(run,jobs):
        for x in r['rows']:
            if x['chanId']!=c['id']: continue
            o=out.setdefault(x['id'],dict(x,ch=c['key'],queries=[]))
            o['queries'].append(q)
        if r.get('err'): print('ERR',c['key'],q,file=sys.stderr)
json.dump(out,open('../raw_discovered.json','w'),ensure_ascii=False)
import collections
cnt=collections.Counter(v['ch'] for v in out.values()); inr=collections.Counter(v['ch'] for v in out.values() if v['sec'] and 60<=v['sec']<=1200)
for k in cnt: print(k,cnt[k],'in-range',inr[k])
