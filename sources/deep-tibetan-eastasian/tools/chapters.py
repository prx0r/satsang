import json,re,os,collections
from speakers import BY
longs=json.load(open('../raw/longs.json'))
D='../cache/ytmeta/cache/shorts/'
TS=re.compile(r'^\s*[\(\[]?((?:\d{1,2}:)?\d{1,2}:\d{2})[\)\]]?\s*[-–—:|.]?\s*(.+?)\s*$')
def secs(t):
    s=0
    for p in t.split(':'): s=s*60+int(p)
    return s
out=[];stat=collections.Counter()
for r in longs:
    f=D+r['id']+'.json'
    if not os.path.exists(f): continue
    m=json.load(open(f)); d=m.get('description') or ''
    ch=[]
    for line in d.split('\n'):
        mm=TS.match(line)
        if mm and len(mm.group(2))>2: ch.append((secs(mm.group(1)),mm.group(2)))
    ch=sorted(set(ch))
    if len(ch)<3 or ch[0][0]>120: continue
    stat[r['speaker']]+=1
    dur=r['sec']
    bounds=[c[0] for c in ch]+[dur]
    for i,(st,ti) in enumerate(ch):
        en=bounds[i+1]; L=en-st
        out.append(dict(parent=r['id'],speaker=r['speaker'],start=st,end=en,len=L,seg=ti,ptitle=r['title'],ch=r['ch']))
json.dump(out,open('../raw/chapters.json','w'),ensure_ascii=False)
print(stat); print(len(out)); 
ok=[c for c in out if 60<=c['len']<=1200]; print('in range',len(ok),collections.Counter(c['speaker'] for c in ok))
