# oEmbed + embed-page playability check (metadata only). Cache ../cache/embed/<id>.json
import sys,os,json,re,urllib.request,urllib.parse,concurrent.futures as F,time
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
CD=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','cache','embed');os.makedirs(CD,exist_ok=True)
def get(u,ref=None):
    h={'User-Agent':UA,'Accept-Language':'en-GB,en;q=0.9','Cookie':'CONSENT=YES+1; SOCS=CAI'}
    if ref:h['Referer']=ref
    r=urllib.request.urlopen(urllib.request.Request(u,headers=h),timeout=20);return r.read().decode('utf-8','replace')
def jstr(s,k):
    m=re.search(r'"%s":"((?:[^"\\]|\\.)*)"'%k,s);return json.loads('"'+m.group(1)+'"') if m else None
def chk(v):
    f=os.path.join(CD,v+'.json')
    if os.path.exists(f):
        d=json.load(open(f))
        if d.get('oembed')==200 and d.get('embed') not in (None,) and not str(d.get('embed')).startswith('ERR'): return d
    o={'id':v}
    try:
        oj=json.loads(get('https://www.youtube.com/oembed?format=json&url='+urllib.parse.quote('https://www.youtube.com/watch?v='+v)))
        o.update(oembed=200,o_title=oj.get('title'),o_author=oj.get('author_name'),o_author_url=oj.get('author_url'),o_w=oj.get('width'),o_h=oj.get('height'),thumb_w=oj.get('thumbnail_width'),thumb_h=oj.get('thumbnail_height'))
    except urllib.error.HTTPError as e: o['oembed']=e.code
    except Exception as e: o['oembed']='ERR '+str(e)[:60]
    try:
        h=get('https://www.youtube.com/embed/'+v,ref='https://www.funnier.si/')
        s=jstr(h,'embedded_player_response')
        if not s: o['embed']='noresp'
        else:
            p=json.loads(s);ps=p.get('previewPlayabilityStatus',{})
            o['embed']=ps.get('status');o['playableInEmbed']=ps.get('playableInEmbed');o['reason']=ps.get('reason')
            m=re.search(r'"videoDurationSeconds":"(\d+)"',s);o['dur']=int(m.group(1)) if m else None
    except Exception as e:o['embed']='ERR '+str(e)[:60]
    json.dump(o,open(f,'w'));return o
ids=[l.strip() for l in open(sys.argv[1]) if l.strip()]
t0=time.time();res=[]
with F.ThreadPoolExecutor(int(sys.argv[2]) if len(sys.argv)>2 else 10) as ex:
    futs=[ex.submit(chk,v) for v in ids]
    for fu in futs:
        try: res.append(fu.result(timeout=max(1,105-(time.time()-t0))))
        except Exception: pass
ok=sum(1 for r in res if r.get('oembed')==200 and r.get('playableInEmbed'))
print('checked',len(res),'of',len(ids),'ok',ok,'secs',int(time.time()-t0))
