# Topic-boundary virtual clips from timed transcripts (internal). Output: windows, never transcript text.
import re,os,sys,json,glob
from topics_lib import TOP,PRI
TRD=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../../transcripts-internal/buddhist')
def ts(s):
    h,m,r=s.split(':'); sec,ms=r.split(','); return int(h)*3600+int(m)*60+int(sec)+int(ms)/1000
def load(vid):
    fs=glob.glob(os.path.join(TRD,vid+'.*srt'))
    if not fs: return None
    raw=open(fs[0],errors='replace').read()
    cues=[]
    for b in re.split(r'\n\s*\n',raw):
        L=[l for l in b.strip().split('\n') if l.strip()]
        if len(L)<2 or '-->' not in L[1]: continue
        a,bb=[x.strip() for x in L[1].split('-->')]
        txt=' '.join(L[2:]).strip()
        if not txt: continue
        cues.append([ts(a),ts(bb),txt])
    # rolling auto-captions: keep only the newest line of each cue, drop repeats
    out=[];last=''
    for a,b,t in cues:
        line=t.split('  ')[-1]
        parts=re.split(r'(?<=\S) (?=\S)',t)
        if last and t.startswith(last): new=t[len(last):].strip()
        else: new=t
        last=t
        if new and (not out or new!=out[-1][2]): out.append([a,b,new])
    return out
def blocks(cues,size=20):
    if not cues: return []
    end=cues[-1][1]; n=int(end//size)+1; B=[{'t':i*size,'txt':''} for i in range(n)]
    for a,b,t in cues: B[int(a//size)]['txt']+=' '+t
    for b in B:
        b['words']=len(b['txt'].split()); b['hits']={}
        for tid,rx in TOP:
            c=len(rx.findall(b['txt']))
            if c: b['hits'][tid]=c
    return B
def gaps(cues):
    g=[]
    for i in range(1,len(cues)):
        if cues[i][0]-cues[i-1][1]>=1.0: g.append(cues[i][0])
    return g
GENERIC={'feeling','thought','emotions','relationships','daily-life','texts','meditation/guided','faith','impermanence'}
def windows(vid,dur,maxn=4,minlen=300,maxlen=840,size=20,minhits=5,minspread=0.25,focus=()):
    cues=load(vid)
    if not cues: return None
    B=blocks(cues,size); G=gaps(cues)
    cands=[]
    for L in range(minlen//size,maxlen//size+1,3):
        for i in range(1,len(B)-L):
            W=B[i:i+L]; words=sum(b['words'] for b in W)
            if words<L*size*1.2: continue  # too much silence
            tot={}
            for b in W:
                for t,c in b['hits'].items(): tot[t]=tot.get(t,0)+c
            best=sorted(((c*PRI.get(t,0.5),t,c) for t,c in tot.items() if t not in GENERIC),reverse=True)
            if not best or best[0][2]<minhits: continue
            # density per 1000 words, mild preference for 6-12 min
            sc=1000*best[0][0]/words*min(L*size,720)**0.5/17
            # topic coherence: hits spread over the window, not one burst
            spread=sum(1 for b in W if best[0][1] in b['hits'])/len(W)
            if spread<minspread: continue
            cands.append((sc*(0.6+spread),i,L,best[:3]+[('tot',tot)]))
    cands.sort(reverse=True); chosen=[]
    for sc,i,L,best in cands:
        s,e=i*size,(i+L)*size
        if any(not(e<=a-30 or s>=b+30) for a,b,_ ,_ in chosen): continue
        if any(best[0][1]==bt[0][1] for _,_,_,bt in chosen) and len(chosen)>=2: continue
        chosen.append((s,e,sc,best))
        if len(chosen)>=maxn: break
    for T in focus:
        if any(T in [x[1] for x in bt[:-1]] for _,_,_,bt in chosen): continue
        bestw=None
        for sc,i,L,best in cands:
            tot=best[-1][1]; c=tot.get(T,0)
            if c<3: continue
            s,e=i*size,(i+L)*size
            if any(not(e<=a-30 or s>=b+30) for a,b,_,_ in chosen): continue
            words=sum(b['words'] for b in B[i:i+L]); d=c/words
            if not bestw or d>bestw[0]: bestw=(d,s,e,sc,[(PRI.get(T,1)*c,T,c)]+[x for x in best[:-1] if x[1]!=T][:2]+[best[-1]])
        if bestw:
            if len(chosen)>=maxn: chosen.sort(key=lambda x:x[2]); chosen.pop(0)
            chosen.append((bestw[1],bestw[2],bestw[3],bestw[4]))
    out=[]
    for s,e,sc,best in sorted(chosen):
        tot=best[-1][1]; best=best[:-1]
        # snap to nearest pause before start (<=25s) and after end
        ps=[g for g in G if s-25<=g<=s+5]; s2=int(max(ps) if ps else s)
        pe=[g for g in G if e-5<=g<=e+25]; e2=int(min(pe) if pe else e)
        e2=min(e2,int(dur)-2) if dur else e2
        if e2-s2<60: continue
        tops=[]
        for k,(w,t,c) in enumerate(best):
            if k==0 or c>=0.5*best[0][2]: tops.append([t,0.75 if k==0 else 0.6,'transcript'])
        out.append({'start':max(10,s2),'end':e2,'score':round(sc,2),'topics':tops,'counts':tot})
    return out
def windows_any(vid,dur,**k):
    w=windows(vid,dur,**k)
    if w==[]: w=windows(vid,dur,minhits=3,minspread=0.12,**k)
    return w
if __name__=='__main__':
    for vid in sys.argv[1:]:
        print(vid,json.dumps(windows_any(vid,None)))
