import json,os,re,glob,collections,subprocess
from segment import windows_any
from topics_lib import tree,ADD
from build import row,clean,CH
from teachers import RX,BY
LBL={}
for r,n in tree.items():
    LBL[r]=n['label']
    for l,m in n.items():
        if isinstance(m,dict) and 'label' in m: LBL[r+'/'+l]=m['label']
for a in ADD: LBL[a['id']]=a['label']
TRD='../../../transcripts-internal/buddhist'
vids=sorted({os.path.basename(f).split('.')[0] for f in glob.glob(TRD+'/*.srt')})
app={r['id']:r for r in json.load(open('../../../app/clips.json'))}
disc=json.load(open('../raw_discovered.json'))
# embed check for parents
open('../parents_ids.txt','w').write('\n'.join(vids))
subprocess.run('cd .. && YT_META_DIR=cache/ytmeta python3 tools/ytmeta.py embed parents_ids.txt 80 6',shell=True)
E={v:json.load(open('../cache/ytmeta/cache/embed/%s.json'%v)) for v in vids if os.path.exists('../cache/ytmeta/cache/embed/%s.json'%v)}
SPK={'goMZEENFpmQ':'shohaku-okumura','_Jt_GrMkL5o':'shohaku-okumura','K14RZURM458':'pa-auk-sayadaw','9AtOQ3A55DM':'joan-halifax','lyY9rq663kQ':'henry-shukman'}
out=[];log=[]
for v in vids:
    e=E.get(v,{})
    if not(e.get('oembed')==200 and e.get('embed')=='OK' and e.get('playableInEmbed')): log.append((v,'not embeddable')); continue
    if v in app:
        p=app[v]; dur=p['dur']; ptitle=p['title']
    else:
        d=disc[v]; dur=d['sec']
        sp=SPK.get(v)
        if not sp:
            for i,n,rx,t in RX:
                if rx.search(d['title']): sp=i;break
        ptitle=clean(d['title'],sp)
    from topics_lib import tag as _t0
    _pt=app[v]['ytTitle'] if v in app else disc[v]['title']
    W=windows_any(v,dur,focus=[t for t,c in _t0(_pt) if t in ('rebirth','rebirth/samsara','self','self/emptiness','kamma','death','awakening','meditation/koan','death/bardo','dukkha')])
    if not W: log.append((v,'no topical window (caption quality or diffuse topic)')); continue
    from topics_lib import tag as _tag
    ptitle_raw=app[v]['ytTitle'] if v in app else disc[v]['title']
    ptop=[t for t,c in _tag(ptitle_raw)]
    for w in W:
        have={t[0] for t in w['topics']}
        for t in ptop:
            if t not in have and w['counts'].get(t,0)>=2 and len(w['topics'])<4: w['topics'].append([t,0.6,'transcript']); have.add(t)
        lab=LBL.get(w['topics'][0][0],w['topics'][0][0])
        pt=re.sub(r'^(Shohaku Okumura|Roshi Joan|Okumura Roshi)\s*(-\s*|on |talks on )','',ptitle)
        pt=re.split(r'\s+\|\s+',pt)[0]
        if len(pt)>60 and ':' in pt: pt=pt.split(':')[0]
        pt=re.sub(r'\s+Dharma Talk$','',pt)
        L=[c for c in pt if c.isalpha()]
        if L and sum(c.isupper() for c in L)/len(L)>0.7: pt=pt.title()
        pt=pt.replace('NIbbana','Nibbana')
        seg='%s: %s'%(lab,pt[:1].upper()+pt[1:])
        if v in app:
            r=dict(app[v]); 
            for k in ('start','end','tier','transcript','short','code','full','passage','status'): r.pop(k,None)
            r.update({'id':'%s@%d'%(v,w['start']),'title':seg,'segTitle':seg,'start':w['start'],'end':w['end'],'parent':v,'sec':w['end']-w['start'],'dur':dur,'checked':'2026-10-20',
                      'topics':sorted({t[0] for t in w['topics']}),'tags':{'v':1,'topics':w['topics'],'lang':['en',0.9,'rule'],'band':'short' if w['end']-w['start']<420 else 'mid'}})
            if app[v].get('code'): r['code']=app[v]['code']
            r['virtual']=True
        else:
            r=row(d,sp,'title' if any(i==sp and rx.search(d['title']) for i,n,rx,t in RX) else 'channel-default',w['topics'],start=w['start'],end=w['end'],segTitle=seg,dur=dur)
            r['virtual']=True
        out.append(r)
json.dump(out,open('../virtual.json','w'),ensure_ascii=False,indent=0)
print(len(out)); print(collections.Counter(r['speaker'] for r in out)); print(log)
for r in out: print(r['id'],r['sec'],r['title'][:80])
