import sys,os,re,hashlib,urllib.request,concurrent.futures as F,html,json
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
D=os.path.join(os.path.dirname(__file__),'..','cache','html')
def key(u): return re.sub(r'[^a-z0-9]+','_',u.lower())[:120]
def get(u):
  f=os.path.join(D,key(u)+'.txt')
  if os.path.exists(f): return u,'cached',open(f).read()
  try:
    r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':UA}),timeout=25)
    h=r.read().decode('utf-8','replace'); final=r.geturl(); st=r.status
  except Exception as e:
    return u,'ERR '+str(e)[:80],''
  links=re.findall(r'href=["\']([^"\']+)',h)
  t=re.sub(r'(?is)<(script|style).*?</\1>',' ',h); t=re.sub(r'<[^>]+>',' ',t); t=html.unescape(re.sub(r'\s+',' ',t))
  out=f'URL {u}\nFINAL {final}\nSTATUS {st}\nLINKS '+' '.join(sorted(set(links)))[:6000]+'\nTEXT '+t
  open(f,'w').write(out); return u,st,out
if __name__=='__main__':
  urls=[l.strip() for l in sys.stdin if l.strip()]
  with F.ThreadPoolExecutor(6) as ex:
    for u,st,t in ex.map(get,urls):
      tx=t.split('\nTEXT ',1)[-1] if t else ''
      yrs=sorted(set(re.findall(r'\b(2025|2026|2027)\b',tx)))
      print('==',u,st,'len',len(tx),'yrs',yrs)
