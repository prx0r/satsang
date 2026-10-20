import json,os,glob,re
from collections import defaultdict
B=os.path.join(os.path.dirname(__file__),'..')
names={}
for l in open(B+'/raw/channels.tsv'):
  p=l.rstrip('\n').split('\t'); names[p[0]]=p[1]
pool={}
for f in glob.glob(B+'/cache/search/*.json'):
  d=json.load(open(f)); u=d['url']
  m=re.search(r'/channel/([^/]+)/search',u)
  for r in d['rows']:
    if not r.get('id'): continue
    if m and r.get('chanId') not in (None,m.group(1)): continue
    cid=r.get('chanId') or (m.group(1) if m else None)
    if not cid: continue
    e=pool.setdefault(r['id'],{'id':r['id'],'chanId':cid,'channel':r.get('channel'),'title':r['title'],'sec':r.get('sec'),'views':r.get('views'),'ago':r.get('ago'),'snippet':r.get('snippet') or '','via':[]})
    if m: e['via'].append('chan:'+d['q'])
    else: e['via'].append('q:'+d['q'])
    if r.get('snippet') and len(r['snippet'])>len(e['snippet']): e['snippet']=r['snippet']
for f in glob.glob(B+'/raw/flat/*_videos.json')+glob.glob(B+'/raw/flat/*_streams.json'):
  cid=os.path.basename(f).split('_')[0] if not os.path.basename(f).startswith('UC') else os.path.basename(f)[:24]
  for r in json.load(open(f)):
    e=pool.setdefault(r['id'],{'id':r['id'],'chanId':cid,'channel':names.get(cid),'title':r['title'],'sec':r.get('duration'),'views':r.get('view_count'),'ago':None,'snippet':'','via':[]})
    e['via'].append('flat'); e['upload_date']=r.get('upload_date') or e.get('upload_date')
    if e['sec'] is None: e['sec']=r.get('duration')
json.dump(list(pool.values()),open(B+'/raw/pool.json','w'),indent=0)
c=defaultdict(lambda:[0,0,0]);nm={}
for e in pool.values():
  x=c[e['chanId']]; x[0]+=1; nm[e['chanId']]=e['channel']
  s=e['sec'] or 0
  if 60<=s<=1200: x[1]+=1
  elif 1200<s<=3600: x[2]+=1
for k,v in sorted(c.items(),key=lambda kv:-kv[1][0]):
  if v[0]>=8: print(v,k,nm[k])
print(len(pool))
