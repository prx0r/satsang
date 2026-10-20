import json,glob,os,re
W='/workspace/projects/f9a7b7ba-e7fb-456e-891e-78ec1c0ab3dc/work/wiser/'
existing=set()
for f in [W+'app/clips.json',W+'app/site/clips.json']+glob.glob(W+'sources/*/candidates.json'):
    if 'deep-theravada-hindu' in f: continue
    try:
        for r in json.load(open(f)): existing.add(r.get('parent') or r['id'].split('@')[0]); existing.add(r['id'])
    except Exception as e: print('skip',f,e)
pool={}
for f in sorted(glob.glob('raw/ch/*.json')):
    k,tab=os.path.basename(f).split('.')[:2]
    d=json.load(open(f))
    if not d: continue
    for e in d.get('entries',[]):
        if not e or not e.get('id'): continue
        r=pool.setdefault(e['id'],{'id':e['id'],'ch':k,'title':e.get('title'),'sec':e.get('duration'),'views':e.get('view_count'),'tab':tab,'live':e.get('live_status')})
json.dump(list(pool.values()),open('raw/pool.json','w'))
json.dump(sorted(existing),open('raw/existing_ids.json','w'))
print(len(pool),'pool;',len(existing),'existing; overlap',sum(1 for i in pool if i in existing))
