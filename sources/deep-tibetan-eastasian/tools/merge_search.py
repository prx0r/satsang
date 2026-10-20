import json
idx=json.load(open('../raw/index.json')); ex=set(json.load(open('../exclude_parents.json')))
d=json.load(open('../raw/scholar_search.json'))
BL=set(l.strip() for l in open('search_blocklist.txt') if l.strip())
n=0
for v in d.values():
    if v['id'] in idx or (v['channel'] or '').strip() in BL: continue
    idx[v['id']]={'id':v['id'],'title':v['title'],'sec':v['sec'],'views':v['views'],'ch':'search','chanId':v['chanId'],'channel':v['channel'],'tab':'search','dup':v['id'] in ex}; n+=1
json.dump(idx,open('../raw/index.json','w'),ensure_ascii=False); print('search rows added',n)
