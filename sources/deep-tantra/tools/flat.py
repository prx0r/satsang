import subprocess,json,sys,os,concurrent.futures as F
D=os.path.join(os.path.dirname(__file__),'..','raw','flat')
def run(cid):
  out={}
  for tab in ['videos']:
    f=os.path.join(D,f'{cid}_{tab}.json')
    if os.path.exists(f): out[tab]=len(json.load(open(f))); continue
    p=subprocess.run(['python3','-m','yt_dlp','--flat-playlist','-J','--extractor-args','youtubetab:approximate_date',f'https://www.youtube.com/channel/{cid}/{tab}'],capture_output=True,text=True,timeout=600)
    try: es=[{k:e.get(k) for k in ('id','title','duration','view_count','timestamp','upload_date')} for e in json.loads(p.stdout).get('entries',[])]
    except Exception: es=[]; 
    json.dump(es,open(f,'w')); out[tab]=len(es)
  return cid,out
cids=[l.split('\t')[0] for l in open(os.path.join(D,'..','channels.tsv')) if l.strip()]
with F.ThreadPoolExecutor(2) as ex:
  for c,o in ex.map(run,cids): print(c,o,flush=True)
