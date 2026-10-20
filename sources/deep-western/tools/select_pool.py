import json,re,os,collections
from rules import CH,SEARCH,SP,SCHOOL_KW
R='../raw'
W='../../..'
existing=set()
for f in [W+'/app/site/clips.json',W+'/app/clips.json',W+'/sources/western/candidates.json']:
    try:
        for x in json.load(open(f)):
            existing.add(x['id'].split('@')[0]); 
            if x.get('parent'): existing.add(x['parent'])
    except Exception as e: print('skip',f,e)
def pick(rows,cfg,key):
    out=[]
    for x in rows:
        t=x['title'] or ''; s=x.get('sec')
        if not s or s<max(60,cfg.get('minsec',60)) or s>3600: continue
        if cfg.get('drop') and re.search(cfg['drop'],t,re.I): continue
        if cfg.get('need') and not re.search(cfg['need'],t,re.I): continue
        sp=None
        for p,v in cfg.get('rules',[]):
            if re.search(p,t,re.I): sp=v;break
        sp=sp or cfg.get('default')
        if not sp: continue
        out.append(dict(id=x['id'],title=t,sec=s,views=x.get('views') or 0,channel=cfg['channel'],speaker=sp,src=key))
    return out
pool=[]
for k,cfg in CH.items():
    rows=json.load(open(f'{R}/ch/{k}.json'))['entries']
    pool+=pick(rows,cfg,k)
cs=json.load(open(f'{R}/chsearch1.json'))
for kq,rows in cs.items():
    k=kq.split('|')[0]
    rows=[dict(id=r['id'],title=r['title'],sec=r['sec'],views=r['views']) for r in rows if r.get('chanId') or True]
    # keep only rows actually on that channel
    pool+=[p for p in pick(rows,SEARCH[k],k)]
# filter channel identity for search rows
seen=set();out=[];dup=0
for p in pool:
    if p['id'] in existing: dup+=1; continue
    if p['id'] in seen: continue
    seen.add(p['id']); out.append(p)
# caps per (src,speaker)
caps={k:v.get('cap') for k,v in CH.items()}
g=collections.defaultdict(list)
for p in out: g[(p['src'],p['speaker'])].append(p)
final=[]
for (src,sp),L in g.items():
    L.sort(key=lambda x:-x['views'])
    c=caps.get(src)
    final+=L[:c] if c else L
for p in final:
    fam,school=SP[p['speaker']]
    if p['speaker'] in ('justin-sledge','angela-puca','john-vervaeke','arthur-versluis','wouter-hanegraaff'):
        for pat,sc in SCHOOL_KW:
            if re.search(pat,p['title'],re.I): school=sc;break
    p['family']=fam;p['school']=school
json.dump(final,open(f'{R}/pool.json','w'),indent=0)
print('pool',len(final),'dups vs existing',dup)
c=collections.Counter(p['speaker'] for p in final)
for k,v in c.most_common(): print(v,k)
