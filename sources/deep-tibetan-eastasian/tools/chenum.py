import json,os,sys,subprocess,concurrent.futures as F
D='../raw/ch'; os.makedirs(D,exist_ok=True)
rows=[l.rstrip('\n').split('\t') for l in open('chans.tsv') if l.strip()]
def run(r):
    k,cid=r[0],r[1]; out={}
    for tab in ['videos','streams']:
        f=f'{D}/{k}.{tab}.json'
        if not os.path.exists(f):
            p=subprocess.run(['python3','-m','yt_dlp','--flat-playlist','-J','--playlist-end','1500',f'https://www.youtube.com/channel/{cid}/{tab}'],capture_output=True,text=True,env=dict(os.environ,PYTHONPATH='pylib'),timeout=110)
            open(f,'w').write(p.stdout or '{}')
        try: d=json.load(open(f)); out[tab]=len(d.get('entries') or [])
        except: out[tab]=-1
    return k,r[2],out
with F.ThreadPoolExecutor(6) as ex:
    for k,n,o in ex.map(run,rows): print(k,n,o)
