import subprocess,json,sys,os,concurrent.futures as F
D=os.path.join(os.path.dirname(__file__),'..','raw','flat')
def run(item):
  key,url=item
  f=os.path.join(D,key+'.json')
  if os.path.exists(f): return key,len(json.load(open(f))['entries']),'cached'
  p=subprocess.run(['python3','-m','yt_dlp','--flat-playlist','-J','--sleep-requests','2','--playlist-end','30','--extractor-args','youtubetab:approximate_date',url],capture_output=True,text=True,timeout=900,env=dict(os.environ,PYTHONPATH=os.path.join(os.path.dirname(os.path.abspath(__file__)),'pylib')))
  try:
    d=json.loads(p.stdout)
    es=[{k:e.get(k) for k in ('id','title','duration','view_count','timestamp','upload_date','url')} for e in d.get('entries',[])]
    out={'channel':d.get('channel') or d.get('uploader'),'channel_id':d.get('channel_id'),'url':url,'entries':es}
  except Exception as ex:
    return key,0,'ERR '+p.stderr[-200:]
  json.dump(out,open(f,'w')); return key,len(es),out['channel']+' '+str(out['channel_id'])
items=[l.strip().split(None,1) for l in sys.stdin if l.strip()]
with F.ThreadPoolExecutor(1) as ex:
  for r in ex.map(run,items): print(*r,flush=True)
