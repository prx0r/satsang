# internal: print a coarse timeline of an internal transcript (never copied into candidates)
import re,sys,glob
T='/workspace/projects/f9a7b7ba-e7fb-456e-891e-78ec1c0ab3dc/work/wiser/transcripts-internal/advaita-extra'
vid=sys.argv[1]; step=int(sys.argv[2]) if len(sys.argv)>2 else 60; w=int(sys.argv[3]) if len(sys.argv)>3 else 140
f=glob.glob(f'{T}/{vid}.*srt')[0]
def ts(s):
    h,m,r=s.split(':'); s,ms=r.replace('.',',').split(','); return int(h)*3600+int(m)*60+int(s)
last=-999
for b in re.split(r'\n\s*\n',open(f,errors='replace').read().strip()):
    L=b.strip().split('\n')
    if len(L)<3 or '-->' not in L[1]: continue
    a=ts(L[1].split('-->')[0].strip())
    if a-last>=step:
        print(f'{a//60:3d}:{a%60:02d} ({a}s)',' '.join(L[2:])[:w]); last=a
