# TextTiling-style virtual clips from internal transcripts (never published). 6-18 min segments at lexical-cohesion minima.
import re,os,json,glob,math,sys
from collections import Counter
T=os.path.join(os.path.dirname(__file__),'..','..','..','transcripts-internal','deep-tantra')
STOP=set("""a an the and or but if then so of to in on at by for with from as is are was were be been being it its this that these those i you he she we they me him her us them my your his our their not no yes do does did done have has had having will would shall should can could may might must just also very really quite like um uh okay ok right well know think going get got say said one two thing things way something actually kind sort mean lot there here what which who whom when where why how all any some more most other such only own same than too s t don now even much many into about over out up down again further once because while during before after above below off between through under until each both few nor yeah let see look go come make made people time little bit""".split())
def parse(f):
  cues=[];txt=open(f,encoding='utf-8',errors='replace').read()
  for b in re.split(r'\n\s*\n',txt):
    m=re.search(r'(\d+):(\d+):(\d+)[,.](\d+)\s*-->',b)
    if not m: continue
    s=int(m.group(1))*3600+int(m.group(2))*60+int(m.group(3))
    t=' '.join(l for l in b.split('\n') if '-->' not in l and not l.strip().isdigit())
    t=re.sub(r'<[^>]+>','',t)
    cues.append((s,t))
  # dedupe rolling captions
  out=[];prev=''
  for s,t in cues:
    if t.strip()==prev: continue
    out.append((s,t)); prev=t.strip()
  return out
def toks(t): return [w for w in re.findall(r"[a-zāīūṛṝḷṅñṭḍṇśṣṃḥ]+",t.lower()) if w not in STOP and len(w)>2]
def segment(f,minlen=360,maxlen=1080,blk=30,win=6):
  cues=parse(f)
  if not cues: return []
  end=cues[-1][0]+5; nb=end//blk+1
  B=[Counter() for _ in range(nb)]; BT=['']*nb
  for s,t in cues: B[s//blk].update(toks(t)); BT[s//blk]+=' '+t
  def cos(a,b):
    num=sum(a[k]*b.get(k,0) for k in a); da=math.sqrt(sum(v*v for v in a.values())); db=math.sqrt(sum(v*v for v in b.values()))
    return num/(da*db) if da and db else 0
  gaps=[]
  for i in range(1,nb):
    L=sum(B[max(0,i-win):i],Counter()); R=sum(B[i:i+win],Counter()); gaps.append(cos(L,R))
  # depth
  depth=[]
  for i,g in enumerate(gaps):
    lp=max(gaps[max(0,i-8):i+1]); rp=max(gaps[i:i+9]); depth.append((lp-g)+(rp-g))
  # greedy boundaries
  cand=sorted(range(len(depth)),key=lambda i:-depth[i])
  bounds=[0,end]
  for i in cand:
    t=(i+1)*blk
    if all(abs(t-b)>=minlen for b in bounds): bounds.append(t)
    bounds.sort()
    if all(bounds[k+1]-bounds[k]<=maxlen for k in range(len(bounds)-1)): break
  bounds.sort()
  # snap to cue starts
  starts=[s for s,_ in cues]
  def snap(t): return min(starts,key=lambda s:abs(s-t)) if t not in (0,end) else t
  bounds=sorted(set(snap(b) for b in bounds))
  segs=[]
  allc=Counter(); [allc.update(b) for b in B]
  for a,b in zip(bounds,bounds[1:]):
    if b-a<60: continue
    c=Counter()
    for k in range(a//blk,min(nb,b//blk+1)): c.update(B[k])
    # distinctive terms
    sc={w:c[w]*math.log((sum(allc.values())+1)/(allc[w]+1)) for w in c if c[w]>=3}
    top=[w for w,_ in sorted(sc.items(),key=lambda kv:-kv[1])[:4]]
    text=' '.join(BT[k] for k in range(a//blk,min(nb,b//blk+1)))
    segs.append(dict(start=int(a),end=int(b),terms=top,text=text))
  return segs
if __name__=='__main__':
  for f in sorted(glob.glob(T+'/*.srt')):
    s=segment(f); print(os.path.basename(f),len(s),[ (x['start']//60,(x['end']-x['start'])//60,x['terms'][:3]) for x in s][:12])
