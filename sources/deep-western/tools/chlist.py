import sys,json,os,concurrent.futures as F
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'pylib'))
import yt_dlp
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','raw','ch'); os.makedirs(OUT,exist_ok=True)
def lst(a):
    key,cid=a
    f=os.path.join(OUT,key+'.json')
    if os.path.exists(f): return key,len(json.load(open(f))['entries']),'cached'
    y=yt_dlp.YoutubeDL({'extract_flat':True,'quiet':True,'ignoreerrors':True,'sleep_interval_requests':1,'extractor_retries':3,'skip_download':True,'playlistend':int(os.environ.get('MAXN','600'))})
    try:
        i=y.extract_info(f'https://www.youtube.com/channel/{cid}/videos',download=False)
        e=[{'id':x['id'],'title':x.get('title'),'sec':x.get('duration'),'views':x.get('view_count')} for x in i.get('entries',[])]
        json.dump({'key':key,'cid':cid,'channel':i.get('channel') or i.get('title'),'entries':e},open(f,'w'))
        return key,len(e),i.get('channel')
    except Exception as ex: return key,0,'ERR '+str(ex)[:100]
pairs=[l.split() for l in open(sys.argv[1]) if l.strip()]
with F.ThreadPoolExecutor(1) as ex:
    for r in ex.map(lst,pairs): print(*r)
