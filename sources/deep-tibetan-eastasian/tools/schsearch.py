import json,sys,re,concurrent.futures as F
from ytsearch import search
Q=json.load(open(sys.argv[1]))
res={}
def run(q): return q,search(q)
with F.ThreadPoolExecutor(6) as ex:
    for q,r in ex.map(run,[x[0] for x in Q]):
        res[q]=r['rows']
out={}
for q,rx in Q:
    R=re.compile(rx,re.I)
    for x in res[q]:
        if R.search(x['title']+' '+(x.get('snippet') or '')) and x['sec'] and x['sec']>=120:
            out.setdefault(x['id'],dict(x,q=q))
            print(q[:25],'|',x['sec'],x['channel'],'|',x['title'][:85])
json.dump(out,open(sys.argv[2],'w'),ensure_ascii=False)
