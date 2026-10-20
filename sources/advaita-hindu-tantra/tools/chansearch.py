import ytsearch,sys,json,concurrent.futures as F
chs=[l.split('\t')[0] for l in open('../raw/channels.tsv')]
qs=sys.argv[1].split(',')
jobs=[(c,q) for c in chs for q in qs]
def run(j):
    c,q=j; r=ytsearch.search(q,path='/channel/'+c); return c,q,len(r['rows']),r.get('err')
with F.ThreadPoolExecutor(4) as ex:
    for c,q,n,e in ex.map(run,jobs): 
        if e or n==0: print(c,q,n,e)
print('done',len(jobs))
