import ytsearch,json,sys,concurrent.futures as F
# usage: chsearch.py key chanId "q1|q2|..."
key,cid,qs=sys.argv[1],sys.argv[2],sys.argv[3].split('|')
out={}
def run(q): return ytsearch.search(q,path='/channel/'+cid)['rows']
with F.ThreadPoolExecutor(4) as ex:
    for rows in ex.map(run,qs):
        for r in rows:
            if r.get('chanId') in (cid,None): out[r['id']]=r
f=f'../raw/chs_{key}.json'
try: old=json.load(open(f))
except: old={}
old.update(out); json.dump(old,open(f,'w')); print(key,len(old))
