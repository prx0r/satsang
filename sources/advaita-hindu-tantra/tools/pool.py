import json,glob,os
chs=dict(l.rstrip('\n').split('\t') for l in open('raw/channels.tsv'))
pool={}
for f in glob.glob('raw/flat/*.json'):
    cid=os.path.basename(f)[:-5]
    try: d=json.load(open(f))
    except: continue
    for e in d.get('entries',[]):
        if not e or not e.get('id'): continue
        pool[e['id']]={'id':e['id'],'title':e.get('title'),'chanId':cid,'channel':d['channel'],'sec':e.get('duration'),'views':e.get('view_count'),'snippet':e.get('description') or '','ago':None,'src':['flat']}
for f in glob.glob('cache/search/*.json'):
    d=json.load(open(f))
    if '/channel/' not in d['url']: continue
    cid=d['url'].split('/channel/')[1].split('/')[0]
    for r in d['rows']:
        if r['chanId'] and r['chanId']!=cid: continue
        p=pool.setdefault(r['id'],{'id':r['id'],'title':r['title'],'chanId':cid,'channel':r['channel'],'sec':r['sec'],'views':r['views'],'snippet':'','ago':None,'src':[]})
        if r['snippet'] and len(r['snippet'])>len(p['snippet']): p['snippet']=r['snippet']
        p['ago']=p['ago'] or r['ago']; p['sec']=p['sec'] or r['sec']; p['views']=p['views'] or r['views']
        p.setdefault('q',[]).append(d['q']); 
        if 'search' not in p['src']: p['src'].append('search')
json.dump(list(pool.values()),open('raw/pool.json','w'),indent=0)
import collections
print(len(pool)); print(collections.Counter(p['channel'] for p in pool.values()))
inr=[p for p in pool.values() if p['sec'] and 60<=p['sec']<=1200]
print('in range',len(inr),collections.Counter(p['channel'] for p in inr))
