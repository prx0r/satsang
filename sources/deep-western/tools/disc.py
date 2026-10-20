import json,sys,collections,concurrent.futures as F
from ytsearch import search
names=[l.strip() for l in open(sys.argv[1]) if l.strip()]
out={}
with F.ThreadPoolExecutor(5) as ex:
    for n,r in zip(names, ex.map(lambda q: search(q), names)):
        out[n]=r['rows']
json.dump(out,open('../raw/disc_'+sys.argv[1].split('/')[-1]+'.json','w'))
for n,rows in out.items():
    c=collections.Counter((x['channel'],x['chanId']) for x in rows)
    print('##',n,len(rows),'|', '; '.join(f'{k[0]}({k[1]}):{v}' for k,v in c.most_common(5)))
