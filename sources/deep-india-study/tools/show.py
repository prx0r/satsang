import sys,os,re
D=os.path.join(os.path.dirname(__file__),'..','cache','html')
sys.path.insert(0,os.path.dirname(__file__)); from fetch import key
n=int(sys.argv[1]); 
for u in sys.argv[2:]:
  f=os.path.join(D,key(u)+'.txt')
  t=open(f).read() if os.path.exists(f) else 'MISSING'
  tx=t.split('\nTEXT ',1)[-1]
  print('####',u); print(tx[:n]); print()
