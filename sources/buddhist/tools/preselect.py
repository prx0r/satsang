import json,re,math,collections
from topics_lib import tag,score
pool=json.load(open('../pool.json'))
GENERIC=re.compile(r'(?i)guided meditation|^meditation$|q ?& ?a$')
by=collections.defaultdict(list)
for p in pool:
    # snippet boilerplate (Thanissaro copyright) is useless
    sn=p.get('snippet','')
    if 'Creative Commons' in sn: sn=''
    r=tag(p['title'],sn)
    p['_tags']=r; p['_score']=score(r)+0.15*math.log10(1+p['views'])
    if not r: continue
    by[p['speaker']].append(p)
CAP={'thanissaro-bhikkhu':110,'thich-nhat-hanh':70,'mingyur-rinpoche':70,'tara-brach':55,'dalai-lama':55,'tsoknyi-rinpoche':45,'jack-kornfield':40}
sel=[]
for sp,rows in by.items():
    CORE={'rebirth','rebirth/samsara','self','self/emptiness','death/bardo','meditation/koan','kamma','death','awakening'}
    rows.sort(key=lambda p:(-sum(1 for t,c in p['_tags'] if t in CORE and c>=0.9),-p['_score']))
    # dedupe near-identical titles
    seen=set(); keep=[]
    for p in rows:
        k=re.sub(r'\W+',' ',re.sub(r'^\d{6}\s*','',p['title']).lower())[:40]
        if k in seen: continue
        seen.add(k); keep.append(p)
    sel+=keep[:CAP.get(sp,40)]
print(len(sel),collections.Counter(p['speaker'] for p in sel))
json.dump(sel,open('../presel.json','w'),ensure_ascii=False)
open('../presel_ids.txt','w').write('\n'.join(p['id'] for p in sel))
