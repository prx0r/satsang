import sys,json,collections,concurrent.futures as F
from ytsearch import search
names=[l.strip() for l in open(sys.argv[1]) if l.strip()]
out={}
def run(n): return n,search(n)
with F.ThreadPoolExecutor(6) as ex:
    for n,r in ex.map(run,names):
        c=collections.Counter(); nm={}; sec={}
        for x in r['rows']:
            c[x['chanId']]+=1; nm[x['chanId']]=x['channel']
        out[n]=[(k,nm[k],v) for k,v in c.most_common(4)]
        print(n,'|',' ; '.join(f'{nm[k]} {k} x{v}' for k,v in c.most_common(4)),'ERR' if r.get('err') else '')
json.dump(out,open('../raw_chdisc.json','a'))
