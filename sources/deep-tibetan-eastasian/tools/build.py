import json,re,os,glob,collections
from speakers import BY
TODAY='2026-10-20'
sel=json.load(open('../raw/sel.json'))
E={f[:-5]:json.load(open('../cache/ytmeta/cache/embed/'+f)) for f in os.listdir('../cache/ytmeta/cache/embed')}
# fresh exclusion: app + every other sources folder
ex=set()
for f in ['../../../app/clips.json']+[g for g in glob.glob('../../*/candidates.json')+glob.glob('../../*/clips.json')+glob.glob('../../*/long-candidates.json') if 'deep-tibetan-eastasian' not in g]:
    try:
        d=json.load(open(f)); d=d if isinstance(d,list) else d.get('clips',[])
        for r in d: ex.add(r.get('parent') or r['id'].split('@')[0])
    except Exception as e: pass
MON={m:i+1 for i,m in enumerate(['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'])}
def published(t):
    m=re.search(r'\b(19[5-9]\d|20[0-2]\d)[ .\-/](\d{1,2})[ .\-/](\d{1,2})\b',t)
    if m and 1<=int(m.group(2))<=12 and 1<=int(m.group(3))<=31: return '%s-%02d-%02d'%(m.group(1),int(m.group(2)),int(m.group(3)))
    m=re.search(r'\b(\d{1,2})/(\d{1,2})/(\d{2,4})\b',t)
    if m and int(m.group(1))<=12:
        y=int(m.group(3)); y=y+2000 if y<100 else y
        if 1990<y<=2026: return '%d-%02d-%02d'%(y,int(m.group(1)),int(m.group(2)))
    m=re.search(r'\b(\d{1,2})(?:st|nd|rd|th)? (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,? (\d{4})\b',t,re.I)
    if m: return '%s-%02d-%02d'%(m.group(3),MON[m.group(2).lower()],int(m.group(1)))
    m=re.search(r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.? (\d{1,2})(?:st|nd|rd|th)?,? (\d{4})\b',t,re.I)
    if m: return '%s-%02d-%02d'%(m.group(3),MON[m.group(1).lower()],int(m.group(2)))
    return None
def year(t):
    m=re.search(r'\b(19[5-9]\d|20[0-2]\d)\b',t); return int(m.group(1)) if m else None
def band(s): return 'short' if s<420 else ('mid' if s<1800 else 'long')
FIGS=[('dogen',r'dogen|dōgen|shobogenzo|shōbōgenzō|genjo ?koan'),('nagarjuna',r'nagarjuna|nāgārjuna|madhyamaka'),('milarepa',r'milarepa'),('padmasambhava',r'guru rinpoche|padmasambhava'),('tsongkhapa',r'tsongkhapa'),('shantideva',r'shantideva|śāntideva|bodhicharyavatara|way of the bodhisattva'),('gampopa',r'gampopa'),('longchenpa',r'longchen'),('dolpopa',r'dolpopa'),('machig-labdron',r'machig'),('linji',r'linji|rinzai gigen|book of rinzai'),('zhaozhou',r'zhaozhou|joshu'),('huineng',r'huineng|sixth patriarch|platform sutra'),('bodhidharma',r'bodhidharma'),('hongzhi',r'hongzhi|silent illumination'),('dahui',r'dahui|huatou|hua tou'),('zhiyi',r'zhiyi|chih-i'),('shinran',r'shinran'),('kukai',r'kukai|kūkai'),('seung-sahn',r'seung sahn'),('shunryu-suzuki',r'suzuki roshi|shunryu suzuki'),('kosho-uchiyama',r'uchiyama'),('tilopa',r'tilopa'),('naropa',r'naropa'),('marpa',r'\bmarpa'),('the-buddha',r'\bthe buddha\b')]
FIGS=[(i,re.compile(r,re.I)) for i,r in FIGS]
CHN={l.split('\t')[0]:l.rstrip('\n').split('\t') for l in open('chans.tsv')}
out=[];drop=collections.Counter()
for p in sel:
    e=E.get(p['id'],{})
    if p['id'] in ex: drop['dup-now']+=1; continue
    if not(e.get('oembed')==200 and e.get('embed')=='OK' and e.get('playableInEmbed')): drop['embed']+=1; continue
    sp=p['speaker']; _,nm,_,fam,school,role,_=BY[sp]
    w,h=e.get('o_w') or 0,e.get('o_h') or 0
    fmt='vertical' if h>w else 'horizontal'
    sec=e.get('dur') or p['sec']
    t=p['title']; pub=published(t)
    tags=[[a,round(b,2),'title'] for a,b in p['_tags']]
    st=[]
    tl=t.lower()
    if re.search(r'\bq ?& ?a\b|questions? and answers?|ask mingyur|ask me anything|answers for',tl): st.append('q-and-a')
    if re.search(r'guided|meditation:|practice session',tl): st.append('guided')
    if re.search(r'teisho',tl): st.append('teisho')
    if re.search(r'dharma talk',tl): st.append('dharma-talk')
    r={'id':p['id'],'teacher':nm,'speaker':sp,'speakerFrom':p['speakerFrom'],'role':role,
       'title':t,'ytTitle':t,'channel':CHN[p['ch']][2] if p['ch'] in CHN else p['channel'],'channelId':p['chanId'],'channelOwner':CHN[p['ch']][3] if p['ch'] in CHN else (p['channel']+' (host institution/publisher upload)'),
       'kind':'human','media':'youtube','checked':TODAY,'dur':sec,'sec':sec,'format':fmt,'orientation':fmt,
       'orientationFrom':'oembed %sx%s'%(w,h),'carrier':'own' if p['ch']!='search' else 'host','setting':'talk','region':'buddhism',
       'tradition':school,'family':fam,'school':school,'traditions':sorted({fam,school}),
       'figures':[i for i,rx in FIGS if rx.search(t) and i!=sp],'topics':sorted({x[0] for x in tags}),'style':st,
       'clipType':'natural' if sec<=1200 else 'whole-talk',
       'published':pub,'year':int(pub[:4]) if pub else year(t),'yearFrom':'title' if (pub or year(t)) else None,
       'views':p.get('views'),
       'tags':{'v':1,'topics':tags,'lang':['zh',0.9,'rule'] if p['ch']=='shengyen' else ['en',0.8,'rule'],'band':band(sec)}}
    if p['ch']=='shengyen': r['subs']='en'
    out.append({k:v for k,v in r.items() if v is not None})
# speaker counts -> main vs more voices
cnt=collections.Counter(r['speaker'] for r in out)
for r in out: r['set']='main' if cnt[r['speaker']]>=8 else 'more-voices'
json.dump(out,open('../clips.json','w'),ensure_ascii=False,indent=0)
print(len(out),drop); print(cnt.most_common())

# ensure SPEC row shape: every required key present (null when unknown)
_c=json.load(open(os.path.join(os.path.dirname(__file__),'..','clips.json')))
for _r in _c:
    for _k in 'id teacher speaker title ytTitle channel kind media checked dur sec format carrier setting region tradition traditions figures topics published year views tags school'.split():
        _r.setdefault(_k,None)
json.dump(_c,open(os.path.join(os.path.dirname(__file__),'..','clips.json'),'w'),ensure_ascii=False,indent=0)
