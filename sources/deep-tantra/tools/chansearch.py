import sys,os,json,concurrent.futures as F
sys.path.insert(0,os.path.dirname(__file__)); import ytsearch
# usage: chansearch.py CHANID q1,q2,...  (or a file of "chan\tq" lines via -f)
if sys.argv[1]=='-f': jobs=[tuple(l.rstrip('\n').split('\t')[:2]) for l in open(sys.argv[2]) if l.strip()]
else: jobs=[(sys.argv[1],q) for q in sys.argv[2].split(',')]
def run(j):
  c,q=j; r=ytsearch.search(q,path='/channel/'+c); return c,q,len(r['rows']),r.get('err')
bad=0
with F.ThreadPoolExecutor(3) as ex:
  for c,q,n,e in ex.map(run,jobs):
    if e: bad+=1
print('jobs',len(jobs),'errors',bad)
