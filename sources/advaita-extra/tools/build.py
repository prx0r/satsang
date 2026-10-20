# picks + embed/desc caches -> candidates.json (app/clips.json row shape + virtual-clip fields)
import json, re, os, glob, sys, collections
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
sys.path.insert(0,'tools'); from picks import P, V, N, A, R, S
TODAY='2026-10-20'
rows={}
for f in glob.glob('cache/search/*.json'):
    for r in json.load(open(f))['rows']:
        if r.get('id'): rows.setdefault(r['id'], r)
NAMES={N:'Nisargadatta Maharaj (archival)',A:'Anandamayi Ma (archival)',R:'Ramesh Balsekar','gautam-sachdeva':'Gautam Sachdeva','wayne-liquorman':'Wayne Liquorman',
 's-k-mullarpattan':'S. K. Mullarpattan','stephen-wolinsky':'Stephen Wolinsky','vanaja-narayanswamy':'Dr. Vanaja Narayanswamy','sri-ranjit-maharaj':'Sri Ranjit Maharaj',
 'atmananda-blanca-schlamm':'Atmananda (Blanca Schlamm)','swami-chidananda-saraswati':'Swami Chidananda','swami-kedarnath':'Swami Kedarnath','swami-vijayananda':'Swami Vijayananda','shunyamurti':'Shunyamurti'}
TRAD={N:('hindu','inchegeri',['hindu','advaita','inchegeri']),R:('hindu','inchegeri',['hindu','advaita','inchegeri']),'gautam-sachdeva':('hindu','inchegeri',['hindu','advaita','inchegeri']),
 'wayne-liquorman':('hindu','inchegeri',['hindu','advaita','inchegeri']),'s-k-mullarpattan':('hindu','inchegeri',['hindu','advaita','inchegeri']),'stephen-wolinsky':('hindu','inchegeri',['hindu','advaita','inchegeri']),
 'vanaja-narayanswamy':('hindu','inchegeri',['hindu','advaita','inchegeri']),'sri-ranjit-maharaj':('hindu','inchegeri',['hindu','advaita','inchegeri']),
 A:('hindu','anandamayi-sangha',['hindu','anandamayi-sangha']),'atmananda-blanca-schlamm':('hindu','anandamayi-sangha',['hindu','anandamayi-sangha']),'swami-kedarnath':('hindu','anandamayi-sangha',['hindu','anandamayi-sangha']),
 'swami-vijayananda':('hindu','anandamayi-sangha',['hindu','anandamayi-sangha']),'swami-chidananda-saraswati':('hindu','divine-life-society',['hindu','vedanta','divine-life-society']),'shunyamurti':('independent','independent',['independent','hindu'])}
def year_from_ago(a):
    m=re.search(r'(\d+)\s*(yr|year|mo|month|wk|week|day|hour|hr)',a or '')
    if not m: return None
    n,u=int(m.group(1)),m.group(2)
    return 2026-n if u in('yr','year') else (2026 if u in('mo','month') and n<10 else (2025 if u in('mo','month') else 2026))
def rec_year(t):
    m=re.findall(r'\b(19[3-8]\d)\b',t or ''); return int(m[0]) if m else None
def lang(sid,ch):
    if sid==A: return ['hi',0.75,'rule'],'en'          # Ma speaks Hindi/Bengali; English subtitles burned in
    if sid==N: return ['en',0.7,'rule'],None           # Marathi with consecutive English interpretation
    if ch=='Sri Ranjit Maharaj': return ['en',0.8,'rule'],None
    return ['en',0.9,'rule'],None
def base(vid,sid,carrier,setting,figs,tps,title):
    e=json.load(open(f'cache/cache/embed/{vid}.json'))
    assert e.get('oembed')==200 and e.get('embed')=='OK' and e.get('playableInEmbed'), vid
    d=json.load(open(f'cache/cache/desc/{vid}.json')) if os.path.exists(f'cache/cache/desc/{vid}.json') else {}
    r=rows.get(vid,{})
    yt=e.get('o_title') or r.get('title') or d.get('title')
    ch=e.get('o_author') or r.get('channel'); ago=r.get('ago') or d.get('published')
    lg,subs=lang(sid,ch); region,trad,trads=TRAD[sid]
    w,h=e.get('o_w') or 16,e.get('o_h') or 9
    row={'id':vid,'teacher':NAMES[sid],'speaker':sid,'speakerFrom':'curated','title':title or yt,'ytTitle':yt,'channel':ch,'channelId':r.get('chanId'),
     'kind':'human','media':'youtube','checked':TODAY,'dur':e.get('dur'),'sec':e.get('dur'),'format':'vertical' if w<h else 'horizontal',
     'carrier':carrier,'setting':setting,'region':region,'tradition':trad,'traditions':trads,'figures':figs,'topics':[t[0] for t in tps],
     'published':None,'publishedApprox':ago,'year':year_from_ago(ago),'recorded':rec_year(yt) or rec_year(title),'views':r.get('views'),
     'tags':{'v':1,'topics':[list(t) for t in tps],'lang':lg,'band':None},'embed':{'oembed':200,'playableInEmbed':True,'checked':TODAY}}
    if subs: row['subs']=subs
    return row
out=[]
for vid,(sid,carrier,setting,figs,tps,title) in P.items():
    r=base(vid,sid,carrier,setting,figs,tps,title); s=r['sec']
    r['tags']['band']='short' if s<=420 else ('mid' if s<=1800 else 'long')
    if s>1200: r['note']='natural upload %ds, slightly over the 20-min target; kept whole (no clean cut point)'%s
    out.append(r)
for vid,st,en,sid,carrier,figs,tps,seg in V:
    r=base(vid,sid,carrier,'talk',figs,tps,seg); full=r['sec']
    r.update({'id':f'{vid}@{st}','parent':vid,'start':st,'end':en,'segTitle':seg,'dur':en-st,'sec':en-st,'parentDur':full})
    r['tags']['band']='short' if en-st<=420 else 'mid'
    r['tags']['topics']=[[t[0],0.6,'title'] for t in tps] if vid=='qpSJC2MIqZg' else [[t[0],t[1],'transcript' if t[2]=='title' else t[2]] for t in tps]
    if vid=='qpSJC2MIqZg': r['note']='cut point approximate: Hindi audio, machine transcript unreliable; check the 881 s boundary by ear'
    out.append(r)
# dedupe vs existing pools
seen=set()
for f in ['../advaita-hindu-tantra/candidates.json','../../app/clips.json']:
    d=json.load(open(f)); d=d if isinstance(d,list) else d.get('clips',[])
    seen|={x['id'] for x in d}
dups=[x['id'] for x in out if x['id'] in seen or x.get('parent') in seen]
out=[x for x in out if x['id'] not in seen]
out.sort(key=lambda x:(x['speaker'],x.get('parent') or x['id'],x.get('start',0)))
json.dump(out,open('candidates.json','w'),indent=1,ensure_ascii=False)
print('candidates',len(out),'dups dropped',dups)
print(collections.Counter(x['carrier'] for x in out),collections.Counter(x['tags']['band'] for x in out),collections.Counter(x['format'] for x in out))
print(collections.Counter(x['speaker'] for x in out))
