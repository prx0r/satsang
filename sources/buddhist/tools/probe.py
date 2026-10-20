import sys,collections,concurrent.futures as F
sys.path.insert(0,'.'); from ytsearch import search
qs=sys.argv[1:]
cnt=collections.Counter(); names={}
with F.ThreadPoolExecutor(6) as ex:
    for r in ex.map(search,qs):
        for x in r['rows']: cnt[x['chanId']]+=1; names[x['chanId']]=x['channel']
for k,v in cnt.most_common(60): print(v,k,names[k])
