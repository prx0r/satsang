# keyless YouTube search-row metadata (title, channel, length, views, snippet). Cached. Metadata only.
import re, json, os, time, urllib.request, urllib.parse, hashlib
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
CD=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','cache','search'); os.makedirs(CD,exist_ok=True)
def _get(url):
    h={'User-Agent':UA,'Accept-Language':'en-GB,en;q=0.9','Cookie':'CONSENT=YES+1; SOCS=CAI'}
    r=urllib.request.urlopen(urllib.request.Request(url,headers=h),timeout=25); return r.geturl(), r.read().decode('utf-8','replace')
def secs(t):
    if not t: return None
    s=0
    for p in t.split(':'): s=s*60+int(p)
    return s
def txt(o):
    if not o: return ''
    if 'simpleText' in o: return o['simpleText']
    return ''.join(r.get('text','') for r in o.get('runs',[]))
def parse(h):
    m=re.search(r'var ytInitialData = (\{.+?\});</script>',h)
    if not m: return None
    d=json.loads(m.group(1)); out=[]
    def walk(x):
        if isinstance(x,dict):
            if 'videoRenderer' in x:
                v=x['videoRenderer']; ow=(v.get('ownerText') or v.get('longBylineText') or {}).get('runs',[{}])[0]
                sn=' '.join(txt(s.get('snippetText')) for s in v.get('detailedMetadataSnippets',[]))
                out.append({'id':v.get('videoId'),'title':txt(v.get('title')),'channel':ow.get('text'),
                  'chanId':ow.get('navigationEndpoint',{}).get('browseEndpoint',{}).get('browseId'),
                  'sec':secs(txt(v.get('lengthText')) or None),'views':int(re.sub(r'\D','',txt(v.get('viewCountText'))) or 0) if re.search(r'\d',txt(v.get('viewCountText'))) else 0,
                  'ago':txt(v.get('publishedTimeText')),'snippet':sn or txt((v.get('descriptionSnippet') or {}))})
            for y in x.values(): walk(y)
        elif isinstance(x,list):
            for y in x: walk(y)
    walk(d); return out
def search(q, sp=None, path=None):
    url=('https://www.youtube.com'+path+'/search?query=' if path else 'https://www.youtube.com/results?search_query=')+urllib.parse.quote(q)+'&hl=en'+('&sp='+urllib.parse.quote(sp) if sp else '')
    k=hashlib.md5(url.encode()).hexdigest(); f=os.path.join(CD,k+'.json')
    if os.path.exists(f): return json.load(open(f))
    for a in range(2):
        try:
            u,h=_get(url)
            if 'google.com/sorry' in u: time.sleep(5); continue
            r=parse(h)
            if r is not None:
                json.dump({'url':url,'q':q,'rows':r},open(f,'w')); return {'url':url,'q':q,'rows':r}
        except Exception as e: time.sleep(2)
    return {'url':url,'q':q,'rows':[],'err':True}
