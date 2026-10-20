import json,os,glob
ex=set(json.load(open('../exclude_parents.json')))
rows=[l.rstrip('\n').split('\t') for l in open('chans.tsv') if l.strip()]
idx={}
for k,cid,name,owner in rows:
    for f in [f'../raw/ch/{k}.videos.json',f'../raw/ch/{k}.streams.json']+sorted(glob.glob(f'../raw/ch/{k}.pl-*.json')):
        tab=f.split('.')[-2]
        try: d=json.load(open(f)) or {}
        except: continue
        for e in d.get('entries') or []:
            if not e or not e.get('id') or e['id'] in idx: continue
            idx[e['id']]={'id':e['id'],'title':e.get('title') or '','sec':int(e['duration']) if e.get('duration') else None,'views':e.get('view_count'),'ch':k,'chanId':cid,'channel':name,'tab':tab,'dup':e['id'] in ex}
json.dump(idx,open('../raw/index.json','w'),ensure_ascii=False)
import collections
st=collections.defaultdict(lambda:[0,0,0,0,0,0])
for v in idx.values():
    s=st[v['ch']]; s[0]+=1; sec=v['sec'] or 0
    if v['dup']: s[5]+=1
    elif sec<60: s[1]+=1
    elif sec<=1200: s[2]+=1
    elif sec<=3600: s[3]+=1
    else: s[4]+=1
print('ch total <60 1-20m 20-60m >60m dup')
for k,s in st.items(): print(k,s)
