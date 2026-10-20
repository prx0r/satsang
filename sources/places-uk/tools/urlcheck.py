import json,re,sys,ssl,os,urllib.request,concurrent.futures as cf
from seeds import S
ctx=ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
H={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36','Accept':'text/html,*/*','Accept-Language':'en-GB,en'}
def chk(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=20,context=ctx)
        b=r.read(300000).decode('utf-8','ignore'); t=re.search(r'<title[^>]*>(.*?)</title>',b,re.S|re.I)
        return dict(url=u,status=r.status,final=r.geturl(),title=(re.sub(r'\s+',' ',t.group(1)).strip()[:90] if t else ''),html=b)
    except urllib.error.HTTPError as e: return dict(url=u,status=e.code,final=u,title='')
    except Exception as e: return dict(url=u,status=0,final=u,title=str(e)[:60])
urls=set(sys.argv[1:]) if len(sys.argv)>1 else set()
if not urls:
    pick=json.load(open('../cache/wd_pick.json')); ent=json.load(open('../cache/wd_ent.json'))
    for s in S:
        if s[5]: urls.add(s[5])
        if pick.get(s[0]):
            for w in ent[pick[s[0]][0]]['web'][:1]: urls.add(w)
C='../cache/urlcheck.json'; done=json.load(open(C)) if os.path.exists(C) else {}
todo=[u for u in urls if u not in done]
os.makedirs('../cache/html',exist_ok=True)
import hashlib
with cf.ThreadPoolExecutor(16) as ex:
    for r in ex.map(chk,todo):
        h=r.pop('html',None)
        if h: open('../cache/html/'+hashlib.md5(r['url'].encode()).hexdigest()+'.html','w').write(h)
        done[r['url']]=r
json.dump(done,open(C,'w'),indent=0)
bad=[r for r in done.values() if r['status']!=200]
print(len(done),'checked',len(bad),'not 200')
for r in sorted(done.values(),key=lambda r:r['url']): print(r['status'],r['url'],'->',r['final'] if r['final']!=r['url'] else '','|',r['title'][:60])
