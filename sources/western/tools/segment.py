# Propose virtual-clip passages from an internal transcript (SRT). Output only start/end + a short internal peek.
import re,sys,json,glob,os
TR='/workspace/projects/f9a7b7ba-e7fb-456e-891e-78ec1c0ab3dc/work/wiser/transcripts-internal/western'
def ts(s):
    h,m,r=s.split(':'); s,ms=r.split(','); return int(h)*3600+int(m)*60+int(s)+int(ms)/1000
def cues(vid):
    f=glob.glob(f'{TR}/{vid}.*srt')[0]; out=[]
    for b in open(f,encoding='utf-8',errors='replace').read().split('\n\n'):
        l=b.strip().split('\n')
        if len(l)<3 or '-->' not in l[1]: continue
        a,bb=l[1].split(' --> '); t=' '.join(l[2:]).strip()
        if t.startswith('[') : continue
        out.append((ts(a),ts(bb),t))
    return out
def blocks(cs,step=30):
    if not cs: return []
    n=int(cs[-1][0]//step)+1; B=['']*n
    for a,b,t in cs: B[int(a//step)]+=' '+t
    return B
def propose(vid,kws,k=3,minlen=240,maxlen=720,step=30):
    cs=cues(vid); B=blocks(cs,step); R=[re.compile(r'\b(%s)'%w,re.I) for w in kws]
    sc=[sum(len(r.findall(b)) for r in R) for b in B]
    cands=[]
    for L in range(minlen//step,maxlen//step+1,2):
        for i in range(0,len(B)-L):
            s=sum(sc[i:i+L]); cands.append((s/ (L**0.6),i,L,s))
    cands.sort(reverse=True); chosen=[]
    for d,i,L,s in cands:
        if s<4: break
        if any(not(i+L<=j or j+M<=i) for j,M in chosen): continue
        chosen.append((i,L))
        if len(chosen)>=k: break
    out=[]
    for i,L in sorted(chosen):
        st,en=i*step,(i+L)*step
        # snap start to the cue nearest to st
        st=min(cs,key=lambda c:abs(c[0]-st))[0]; en=min(cs,key=lambda c:abs(c[0]-en))[0]
        out.append({'start':int(st),'end':int(en),'score':sum(sc[i:i+L]),'peek':' '.join(B[i:i+2])[:260],'tail':B[i+L-1][-160:]})
    return out
if __name__=='__main__':
    vid=sys.argv[1]; kws=sys.argv[2].split('|'); k=int(sys.argv[3]) if len(sys.argv)>3 else 3
    for o in propose(vid,kws,k): print(json.dumps(o))
