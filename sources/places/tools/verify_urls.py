import json,re,sys,concurrent.futures as cf,urllib.request,ssl
sys.path.insert(0,'.')
from urls_seed import U
wd=json.load(open('../cache/wd_places.json'))
ctx=ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
H={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36','Accept':'text/html,*/*'}
def chk(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=25,context=ctx)
        b=r.read(200000).decode('utf-8','ignore'); t=re.search(r'<title[^>]*>(.*?)</title>',b,re.S|re.I)
        return dict(url=u,status=r.status,final=r.geturl(),title=(t.group(1).strip()[:90] if t else ''))
    except urllib.error.HTTPError as e: return dict(url=u,status=e.code,final=u,title='')
    except Exception as e: return dict(url=u,status=0,final=u,title=str(e)[:60])
cands=set()
for k,v in U.items():
    if v: cands.add(v)
for k,v in wd.items():
    for w in v['web']: cands.add(w)
extra=[l.strip() for l in open('extra_urls.txt')] if __import__('os').path.exists('extra_urls.txt') else []
cands|=set(extra)
cache='../cache/urlcheck.json'
try: done=json.load(open(cache))
except: done={}
todo=[u for u in cands if u not in done or done[u]['status']!=200]
with cf.ThreadPoolExecutor(16) as ex:
    for r in ex.map(chk,todo): done[r['url']]=r
json.dump(done,open(cache,'w'),indent=0,ensure_ascii=False)
bad=[r for r in done.values() if r['status']!=200]
print(len(done),'checked',len(bad),'not 200')
for r in sorted(bad,key=lambda r:r['url']): print(r['status'],r['url'],r['title'])
