# keyless YouTube search-row metadata (title, channel, length, views, ago, snippet). Cached. Metadata only.
import re, json, os, time, urllib.request, urllib.parse, hashlib, sys
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
CD=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','cache','search'); os.makedirs(CD,exist_ok=True)
def _get(url):
    h={'User-Agent':UA,'Accept-Language':'en-GB,en;q=0.9','Cookie':'CONSENT=YES+1; SOCS=CAI'}
    r=urllib.request.urlopen(urllib.request.Request(url,headers=h),timeout=25); return r.geturl(), r.read().decode('utf-8','replace')
def secs(t):
    if not t: return None
    s=0
    for p in t.split(':'):
        if not p.isdigit(): return None
        s=s*60+int(p)
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
                vc=txt(v.get('viewCountText'))
                out.append({'id':v.get('videoId'),'title':txt(v.get('title')),'channel':ow.get('text'),
                  'chanId':ow.get('navigationEndpoint',{}).get('browseEndpoint',{}).get('browseId'),
                  'sec':secs(txt(v.get('lengthText')) or None),'views':int(re.sub(r'\D','',vc)) if re.search(r'\d',vc) else 0,
                  'ago':txt(v.get('publishedTimeText')),'snippet':sn or txt((v.get('descriptionSnippet') or {}))})
            for y in x.values(): walk(y)
        elif isinstance(x,list):
            for y in x: walk(y)
    walk(d); return out
def search(q, chan=None):
    url=('https://www.youtube.com/channel/'+chan+'/search?query=' if chan else 'https://www.youtube.com/results?search_query=')+urllib.parse.quote(q)+'&hl=en'
    k=hashlib.md5(url.encode()).hexdigest(); f=os.path.join(CD,k+'.json')
    if os.path.exists(f): return json.load(open(f))
    err=None
    for a in range(2):
        try:
            u,h=_get(url)
            if 'google.com/sorry' in u: err='blocked'; time.sleep(5); continue
            rows=parse(h)
            if rows is None: err='noparse'; continue
            res={'q':q,'chan':chan,'rows':rows}; json.dump(res,open(f,'w')); return res
        except Exception as e: err=str(e)[:80]; time.sleep(3)
    return {'q':q,'chan':chan,'rows':[],'err':err}
if __name__=='__main__':
    r=search(sys.argv[1], sys.argv[2] if len(sys.argv)>2 else None)
    print(r.get('err'))
    for x in r['rows']: print(x['id'],x['sec'],x['views'],x['ago'],x['channel'],'|',x['title'][:80])
