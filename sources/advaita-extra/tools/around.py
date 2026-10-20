# internal: show cues around given second marks to snap virtual-clip boundaries
import re,sys,glob
T='/workspace/projects/f9a7b7ba-e7fb-456e-891e-78ec1c0ab3dc/work/wiser/transcripts-internal/advaita-extra'
vid=sys.argv[1]; marks=[int(x) for x in sys.argv[2].split(',')]; win=int(sys.argv[3]) if len(sys.argv)>3 else 25
f=glob.glob(f'{T}/{vid}.*srt')[0]
def ts(s):
    h,m,r=s.split(':'); s,ms=r.replace('.',',').split(','); return int(h)*3600+int(m)*60+int(s)
C=[]
for b in re.split(r'\n\s*\n',open(f,errors='replace').read().strip()):
    L=b.strip().split('\n')
    if len(L)<3 or '-->' not in L[1]: continue
    C.append((ts(L[1].split('-->')[0].strip()),' '.join(L[2:])))
for m in marks:
    print('==',m)
    for a,t in C:
        if m-win<=a<=m+win: print(' ',a,t[:150])
