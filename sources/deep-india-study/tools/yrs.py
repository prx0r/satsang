import sys,os,re
sys.path.insert(0,os.path.dirname(__file__)); from fetch import key,D
for u in sys.argv[1:]:
  f=os.path.join(D,key(u)+'.txt')
  if not os.path.exists(f): print('####',u,'MISSING');continue
  tx=open(f).read().split('\nTEXT ',1)[-1]
  print('####',u,'|',tx[:300])
  seen=set()
  for m in re.finditer(r'\b(2025|2026|2027)\b',tx):
    s=tx[max(0,m.start()-160):m.end()+100]
    k=s[100:200]
    if k in seen: continue
    seen.add(k); print('  ..',s)
    if len(seen)>7: break
  em=set(re.findall(r'[\w.+-]+@[\w-]+\.[\w.]+',tx)); ph=set(re.findall(r'\+?91[\s-]?\d[\d\s-]{8,13}',tx))
  print('  EMAIL',list(em)[:5],'PHONE',list(ph)[:4])
