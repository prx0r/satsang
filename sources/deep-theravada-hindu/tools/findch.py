import ytsearch,sys,json,collections,concurrent.futures as F
qs=[l.strip() for l in open(sys.argv[1]) if l.strip()]
def run(q):
    r=ytsearch.search(q); c=collections.Counter((x['channel'],x['chanId']) for x in r['rows'])
    return q,r.get('err'),c.most_common(5)
with F.ThreadPoolExecutor(4) as ex:
    for q,e,c in ex.map(run,qs): print(q,'|ERR' if e else '','|', '; '.join(f'{a} {b} x{n}' for (a,b),n in c))
