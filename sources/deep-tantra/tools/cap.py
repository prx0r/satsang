import json,math,re
from collections import defaultdict,Counter
rows=json.load(open('raw/presel.json'))
PRI={'meditation/kundalini','divine/goddess','texts/tantra','consciousness','guru','faith/grace','meditation/mantra','death','awakening','reality','self','ritual','texts/history','meditation/hatha','emotions'}
def score(r):
  s=math.log10((r['views'] or 0)+10)
  s+=0.6*len([t for t in r['topics'] if t.split('/')[0] in {p.split('/')[0] for p in PRI}])
  s+=0.4*len([x for x in r['schools'] if x not in ('kashmir-shaivism','tantra-studies')])
  if 120<=r['sec']<=1200: s+=1.0
  elif r['sec']>2400: s-=0.5
  if re.search(r'part \d|pt\.? ?\d|\(\d+/\d+\)|episode|ep\.? ?\d',r['title'],re.I): s-=0.3
  return s
CAP=110
by=defaultdict(list)
for r in rows: by[r['speaker']].append(r)
sel=[]
for spk,rs in by.items():
  rs.sort(key=score,reverse=True); seen=set(); out=[]
  for r in rs:
    k=re.sub(r'\W+','',r['title'].lower())[:40]
    if k in seen: continue
    seen.add(k); out.append(r)
    if len(out)>=CAP: break
  sel+=out
print(len(sel)); print(Counter(r['speaker'] for r in sel).most_common(20))
json.dump(sel,open('raw/sel.json','w'),indent=0,ensure_ascii=False)
open('raw/sel_ids.txt','w').write('\n'.join(r['id'] for r in sel))
