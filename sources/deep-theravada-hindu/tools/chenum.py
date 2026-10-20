import subprocess,json,os,sys,concurrent.futures as F
os.makedirs('raw/ch',exist_ok=True)
chs=[l.split() for l in open('tools/channels.tsv') if l.strip()]
env=dict(os.environ,PYTHONPATH='tools/pylib')
def run(c):
    k,cid=c; out={}
    for tab in ['videos','streams']:
        f=f'raw/ch/{k}.{tab}.json'
        if os.path.exists(f): out[tab]=len((json.load(open(f)) or {}).get('entries',[])); continue
        p=subprocess.run([sys.executable,'-m','yt_dlp','--flat-playlist','-J','--playlist-end','4000',f'https://www.youtube.com/channel/{cid}/{tab}'],capture_output=True,text=True,env=env,timeout=600)
        if p.stdout.strip():
            open(f,'w').write(p.stdout); out[tab]=len((json.loads(p.stdout) or {}).get('entries',[]))
        else:
            out[tab]='ERR '+p.stderr.strip()[-120:]
            if 'does not have a' in p.stderr: open(f,'w').write('null')
    return k,out
with F.ThreadPoolExecutor(5) as ex:
    for k,o in ex.map(run,chs): print(k,o,flush=True)
