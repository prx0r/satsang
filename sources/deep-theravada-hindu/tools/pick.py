import json,glob,os,re,math,collections,sys
sys.path.insert(0,'tools'); from config import *
W='/workspace/projects/f9a7b7ba-e7fb-456e-891e-78ec1c0ab3dc/work/wiser/'
existing=set(json.load(open('raw/existing_ids.json')))
rows={}
for r in json.load(open('raw/pool.json')):
    rows[r['id']]=dict(id=r['id'],ch=r['ch'],title=r['title'] or '',sec=r['sec'],views=r['views'],snippet='',ago=None,src='flat')
cid2key={v[0]:k for k,v in CH.items() if not k.startswith('vsny_long')}
for f in glob.glob('raw/chs_*.json'):
    key=os.path.basename(f)[4:-5]
    for vid,r in json.load(open(f)).items():
        k=key if key in CH else cid2key.get(r.get('chanId'))
        if not k: continue
        o=rows.setdefault(vid,dict(id=vid,ch=k,title=r['title'],sec=r['sec'],views=r['views'],snippet='',ago=None,src='search'))
        o['snippet']=o['snippet'] or r.get('snippet',''); o['ago']=o['ago'] or r.get('ago')
        if o['ch']=='vsny' and key=='vsny_long': o['ch']='vsny_long'
for s,d in json.load(open('raw/schol.json')).items():
    for vid,r in d.items():
        k=cid2key.get(r.get('chanId'))
        if not k: continue
        o=rows.setdefault(vid,dict(id=vid,ch=k,title=r['title'],sec=r['sec'],views=r['views'],snippet='',ago=None,src='search'))
        o['snippet']=o['snippet'] or r.get('snippet',''); o['ago']=o['ago'] or r.get('ago')
# topics
T=json.load(open(W+'app/schema/topics.json'))['tree']
TOP=[]
def walk(d,p=''):
    for k,v in d.items():
        if isinstance(v,dict) and 'label' in v:
            kws=v.get('kw',[])+v.get('pali',[])
            if kws: TOP.append((p+k,re.compile(r'\b('+'|'.join(kws)+r')\b',re.I)))
            walk(v,p+k+'/')
walk(T)
OFF={'kamma':r'intention|merit','awakening':r'freedom','self':r'identity','faith':r'god','mindfulness':r'awareness|attention','feeling':r'body|pleasant|painful'}
def tag(t,sn):
    out=[]
    for tid,rx in TOP:
        m=rx.search(t); src,c='title',0.9
        if not m and sn: m=rx.search(sn); src,c='desc',0.7
        if m:
            root=tid.split('/')[0]
            if root in OFF and re.fullmatch(OFF[root],m.group(0),re.I) and '/' not in tid: continue
            out.append([tid,c,src])
    # keep most specific: drop root if a leaf of it present
    ids={x[0] for x in out}
    out=[x for x in out if not any(i.startswith(x[0]+'/') for i in ids)]
    out.sort(key=lambda x:-x[1]); return out[:4]
nonlatin=re.compile(r'[\u0900-\u0DFF\u0E00-\u0E7F\u1000-\u109F\u3040-\u9FFF\uAC00-\uD7AF\u0600-\u06FF\u0400-\u04FF]')
def attribute(r):
    rules,default=RULES.get(r['ch'],([],None))
    for txt,how in ((r['title'],'title'),):
        for rx,sp in rules:
            if rx.search(txt): return sp,how
    if r['ch'] in SNIPPET_OK and r['snippet']:
        for rx,sp in rules:
            if sp and rx.search(r['snippet']): return sp,'desc'
    return default,'channel-default'
cands=[];drop=collections.Counter()
for r in rows.values():
    if r['id'] in existing: drop['existing']+=1; continue
    if not r['sec'] or r['sec']<60: drop['short/unknown']+=1; continue
    if r['sec']>3600: drop['>60min']+=1; continue
    t=r['title']
    if nonlatin.search(t): drop['nonlatin']+=1; continue
    if NONTALK.search(t): drop['nontalk']+=1; continue
    sp,how=attribute(r)
    if not sp: drop['nospeaker']+=1; continue
    r['speaker']=sp; r['speakerFrom']=how; r['topics']=tag(t,r['snippet'])
    cands.append(r)
print(drop, len(cands))
by=collections.defaultdict(list)
for r in cands: by[r['speaker']].append(r)
CAP=int(os.environ.get('CAP','60'))
def score(r):
    s=0
    if r['sec']<=1200: s+=3
    if 180<=r['sec']<=1200: s+=1
    s+=1.5*min(len(r['topics']),2)
    s+=math.log10((r['views'] or 0)+10)
    if re.search(r'\bpart \d|\d+ ?of ?\d+|day[- ]?\d+',r['title'],re.I): s-=1.5
    if re.search(r'q ?& ?a|questions? (and|&) answers?',r['title'],re.I): s-=0.5
    return s
presel=[]
for sp,rs in by.items():
    rs.sort(key=score,reverse=True)
    seen=set(); pick=[]
    for r in rs:
        k=re.sub(r'\W+','',r['title'].lower())[:40]
        if k in seen: continue
        seen.add(k); pick.append(r)
        if len(pick)>=int(CAP*1.25): break
    presel+=pick
    print(f'{sp:32s} avail {len(rs):4d} short {sum(1 for r in rs if r["sec"]<=1200):4d} presel {len(pick)}')
json.dump(presel,open('raw/presel.json','w'))
open('raw/presel_ids.txt','w').write('\n'.join(r['id'] for r in presel))
print('presel',len(presel))
