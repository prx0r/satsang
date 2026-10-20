# Chapter markers (key moments) for a video id, read from a YouTube search-results row. Metadata only. Cached.
import re,json,os,time,urllib.request,urllib.parse,hashlib,sys
from ytsearch import _get, txt
CD=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','cache','chapters'); os.makedirs(CD,exist_ok=True)
def find(d,vid):
    if isinstance(d,dict):
        if 'videoRenderer' in d and d['videoRenderer'].get('videoId')==vid: return d['videoRenderer']
        for v in d.values():
            r=find(v,vid)
            if r: return r
    elif isinstance(d,list):
        for v in d:
            r=find(v,vid)
            if r: return r
def markers(x,out):
    if isinstance(x,dict):
        if 'macroMarkersListItemRenderer' in x:
            m=x['macroMarkersListItemRenderer']
            st=m.get('onTap',{}).get('watchEndpoint',{}).get('startTimeSeconds')
            out.append({'t':st,'title':txt(m.get('title')),'time':txt(m.get('timeDescription'))})
        for v in x.values(): markers(v,out)
    elif isinstance(x,list):
        for v in x: markers(v,out)
def chapters(vid,q):
    f=os.path.join(CD,vid+'.json')
    if os.path.exists(f): return json.load(open(f))
    res={'id':vid,'found':False,'chapters':[]}
    for qq in [q, q+' '+vid]:
        try:
            u,h=_get('https://www.youtube.com/results?search_query='+urllib.parse.quote(qq)+'&hl=en')
        except Exception as e: res['err']=str(e)[:60]; time.sleep(3); continue
        m=re.search(r'var ytInitialData = (\{.+?\});</script>',h)
        if not m: res['err']='noparse'; continue
        vr=find(json.loads(m.group(1)),vid)
        if not vr: continue
        res['found']=True; res['err']=None
        out=[]; markers(vr,out); res['chapters']=out
        sn=' '.join(txt(s.get('snippetText')) for s in vr.get('detailedMetadataSnippets',[]))
        res['snippet']=sn; res['ago']=txt(vr.get('publishedTimeText'))
        break
    json.dump(res,open(f,'w')); return res
if __name__=='__main__':
    r=chapters(sys.argv[1],sys.argv[2]); print(json.dumps(r,indent=0)[:2000])
