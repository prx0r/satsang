import sys,os,json,concurrent.futures as F
sys.path.insert(0,'pylib');import yt_dlp
OUT='../raw/chapters';os.makedirs(OUT,exist_ok=True)
def g(v):
    f=f'{OUT}/{v}.json'
    if os.path.exists(f): return v,json.load(open(f)).get('chapters')
    y=yt_dlp.YoutubeDL({'quiet':True,'skip_download':True,'ignoreerrors':True,'noplaylist':True})
    try:
        i=y.extract_info('https://www.youtube.com/watch?v='+v,download=False)
        if not i: return v,'ERR'
        d={'id':v,'title':i.get('title'),'channel':i.get('channel'),'duration':i.get('duration'),'upload_date':i.get('upload_date'),'chapters':i.get('chapters'),'width':i.get('width'),'height':i.get('height')}
        json.dump(d,open(f,'w'));return v,d['chapters']
    except Exception as e: return v,'ERR '+str(e)[:80]
ids=sys.argv[1:]
with F.ThreadPoolExecutor(3) as ex:
    for v,c in ex.map(g,ids): print(v, (len(c) if isinstance(c,list) else c))
