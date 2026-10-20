import json,re,math,collections,sys,os,glob
sys.path.insert(0,'tools')
from config import CH,SP
from peopledata import BIO,WD_OK,FIG
from graphdata import SCHOOLS,APPTRAD,EDGES,TEXTS,PRACTICES
CAP=60; MAIN_MIN=8; TODAY='2026-10-20'
P=json.load(open('raw/presel.json'))
E={os.path.basename(f)[:-5]:json.load(open(f)) for f in glob.glob('cache/ytmeta/cache/embed/*.json')}
# extra exclusions after review
BAD=re.compile(r'promotional|promo materials|prassad|architectural|oratorio|online pali course',re.I)
par={s[0]:s[2] for s in SCHOOLS}
def ancestors(s):
    out=[]
    while s: out.append(s); s=par.get(s)
    return out
def family(s): return ancestors(s)[-1] if ancestors(s) else None
FIGRX=[('ajahn-chah',r'ajahn chah|luang p(o|u)r? chah'),('ajahn-mun',r'ajahn mun\b|ajaan mun'),('ajaan-lee',r'ajaan lee|ajahn lee'),('the-buddha',r'\bthe buddha\b|buddha\'s'),('ramakrishna',r'ramakrishna'),('swami-vivekananda',r'vivekananda'),('sarada-devi',r'sarada|holy mother'),('adi-shankara',r'shankara|sankara'),('bhagavad-gita',r'\bgita\b|bhagavad'),('ramana-maharshi',r'ramana'),('swami-sivananda',r'swami sivananda|gurudev sivananda'),('swami-chinmayananda',r'chinmayananda|pujya gurudev'),('mahasi-sayadaw',r'mahasi'),('chaitanya-mahaprabhu',r'chaitanya'),('srila-prabhupada',r'prabhupada'),('krishnamacharya',r'krishnamacharya'),('patanjali',r'patanjali|yoga ?sutras?')]
def clean_title(t,sp):
    t=re.sub(r'#\S+','',t)
    parts=[p.strip(' -–|:\\/') for p in re.split(r'\s[|\\]\s|\s-\s|\s–\s|//',t) if p.strip(' -–|:\\/')]
    nm=SP[sp][0].split('(')[0].strip().lower()
    keep=[]
    for p in parts:
        pl=p.lower()
        last=re.sub(r'[^a-zāīūṭḍṇñṃ]','',nm.split()[-1]) if nm.split() else nm
        if (last and len(last)>3 and last[:6] in re.sub(r'[^a-zāīūṭḍṇñṃ ]','',pl)) or any(w in pl for w in ['friday dhamma','dhamma talk','chinmaya mission','his holiness']):
            if len(parts)>1: continue
        if re.fullmatch(r'[\d\s.\-/()a-z]{0,4}\d[\d\s.\-/(),a-z]*',pl) and len(parts)>1: continue
        keep.append(p)
    t=' · '.join(keep[:2]) if keep else t
    t=re.sub(r'^\d{6}\s+','',t)  # thanissaro yymmdd
    t=re.sub(r'^\d{4}\.\d{2}\.\d{2}\s+','',t)
    t=re.sub(r'\s+(by|with)\s+(ven\.?\s+|venerable\s+|swami(ni)?\s+|ajahn\s+|luang por\s+|dr\.?\s+|prof\.?\s+)*'+re.escape(SP[sp][0].split('(')[0].split()[-1])+r'.*$','',t,flags=re.I)
    t=re.sub(r'\s+(by|with)\s+Swami Sita$','',t)
    return re.sub(r'\s{2,}',' ',t).strip(' "\'·') or t
MON={m:i+1 for i,m in enumerate('jan feb mar apr may jun jul aug sep oct nov dec'.split())}
def date_of(r):
    t=r['title']
    m=re.match(r'^(\d{2})(\d{2})(\d{2})\s',t)
    if m and r['ch'].startswith('dhammatalks'): return f'20{m[1]}-{m[2]}-{m[3]}',int('20'+m[1])
    m=re.search(r'\b(20\d\d|19\d\d)[.\-](\d{1,2})[.\-](\d{1,2})\b',t)
    if m: return f'{m[1]}-{int(m[2]):02d}-{int(m[3]):02d}',int(m[1])
    m=re.search(r'\b(25\d\d)\.(\d{2})\.(\d{2})\b',t)
    if m: y=int(m[1])-543; return f'{y}-{m[2]}-{m[3]}',y
    m=re.search(r'\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Z][a-z]{2})[a-z]*\.?\s+(20\d\d|19\d\d)\b',t)
    if m and m[2].lower() in MON: return f'{m[3]}-{MON[m[2].lower()]:02d}-{int(m[1]):02d}',int(m[3])
    m=re.search(r'\b(\d{2})\.(\d{2})\.(20\d\d)\b',t)
    if m: return f'{m[3]}-{m[2]}-{m[1]}',int(m[3])
    m=re.search(r'\b(\d{1,2})\s+([A-Z][a-z]{2})[a-z]*\s+(\d{2})\b',t)
    if m and m[2].lower() in MON: return f'20{m[3]}-{MON[m[2].lower()]:02d}-{int(m[1]):02d}',int('20'+m[3])
    m=re.search(r'\b(19[5-9]\d|20[0-2]\d)\b',t)
    if m: return None,int(m[1])
    if r.get('ago'):
        m=re.search(r'(\d+)\s+year',r['ago']); 
        if m: return None,2026-int(m[1])
        if re.search(r'month|week|day|hour',r['ago']): return None,2026
    return None,None
def series_key(t): return re.sub(r'[\d\W_]+',' ',t.lower()).strip()[:28]
by=collections.defaultdict(list)
for r in P:
    e=E.get(r['id'])
    if not e or e.get('oembed')!=200 or e.get('playableInEmbed') is not True: continue
    if BAD.search(r['title']): continue
    r['_e']=e; by[r['speaker']].append(r)
rows=[];depth={}
for sp,rs in by.items():
    pick=[];ser=collections.Counter()
    for r in rs:  # already score-sorted
        k=series_key(r['title'])
        if ser[k]>=6: continue
        ser[k]+=1; pick.append(r)
        if len(pick)>=CAP: break
    depth[sp]=len(pick)
    for r in pick:
        name,role,school,slabel=SP[sp]
        e=r['_e']; w,h=e.get('o_w'),e.get('o_h')
        orient='vertical' if (w and h and h>w) else 'horizontal'
        dur=e.get('dur') or r['sec']
        pub,yr=date_of(r)
        apptrad=APPTRAD.get(school,school)
        trads=list(dict.fromkeys([school]+ancestors(school)+[apptrad]))
        lang_conf=0.7 if r['ch'] in ('chinmaya','anan','avpitham','kym','bsy','goenka_vm','jayasaro','boonyawad','tathagata') else 0.9
        figs=[f for f,rx in FIGRX if re.search(rx,r['title'],re.I) and f!=sp]
        cn=CH[r['ch']]
        carrier={'teacher channel':'own','scholar channel':'own'}.get(cn[3], 'host' if 'institution' in cn[3] else ('publisher' if 'publisher' in cn[3] else 'own'))
        topics=r['topics']
        row=dict(id=r['id'],teacher=name,speaker=sp,speakerFrom=r['speakerFrom'],title=clean_title(r['title'],sp),ytTitle=r['title'],
            channel=cn[1],channelId=cn[0],kind='human',media='youtube',checked=TODAY,dur=dur,sec=dur,format=orient,orientation=orient,
            orientationFrom='oembed width/height',carrier=carrier,setting='talk',region=family(school) if family(school) in ('buddhism','hindu') else 'hindu',
            tradition=apptrad,school=school,schoolLabel=slabel,traditions=trads,figures=figs,topics=[t[0] for t in topics],style=[],
            published=pub,year=yr,views=r['views'],
            tags=dict(v=1,topics=topics,lang=['en',lang_conf,'rule'],band='short' if dur<=420 else ('mid' if dur<=1800 else 'long')),
            formatChecked=TODAY,wholeTalk=True,embed=dict(oembed=200,playableInEmbed=True,checked=TODAY))
        if dur>1200: row['note']='whole talk 20–60 min (no chapters/timestamps available keylessly; virtual cuts deferred)'
        rows.append(row)
rows.sort(key=lambda x:(x['region'],x['school'],x['speaker'],-(x['views'] or 0)))
json.dump(rows,open('clips.json','w'),ensure_ascii=False,indent=1)
# people
people=[];more=[]
for sp,(name,role,school,slabel) in SP.items():
    if sp not in depth: continue
    yrs,site,bio=BIO.get(sp,(None,None,''))
    chans=sorted({(r['channel'],r['channelId']) for r in rows if r['speaker']==sp})
    p=dict(id=sp,name=name,role=role,kind='speaker',tradition=APPTRAD.get(school,school),school=school,schoolLabel=slabel,years=yrs,bio=bio,site=site,
        wikidata=WD_OK.get(sp),clip_count=depth[sp],channels=[dict(name=a,id=b,url='https://www.youtube.com/channel/'+b,official=True) for a,b in chans],
        tier='main' if depth[sp]>=MAIN_MIN else 'more-voices')
    (people if p['tier']=='main' else more).append(p)
for fid,(name,yrs,school,bio) in FIG.items():
    people.append(dict(id=fid,name=name,role='figure',kind='figure',tradition=APPTRAD.get(school,school),school=school,years=yrs,bio=bio,site=None,wikidata=WD_OK.get(fid),clip_count=0,tier='figure'))
json.dump(dict(main=[p for p in people if p['tier']=='main'],more_voices=more,figures=[p for p in people if p['tier']=='figure']),open('people.json','w'),ensure_ascii=False,indent=1)
json.dump([dict(**{'from':a,'to':b,'type':t,'conf':c,'source':s},**({'note':n} if n else {})) for a,b,t,c,s,n in EDGES],open('lineages.json','w'),ensure_ascii=False,indent=1)
json.dump([dict(title=a,author=b,school=c,topics=d,url=e,rights=f,linkCheck=g) for a,b,c,d,e,f,g in TEXTS],open('texts.json','w'),ensure_ascii=False,indent=1)
json.dump([dict(name=a,school=b,howto=c,source=d) for a,b,c,d in PRACTICES],open('practices.json','w'),ensure_ascii=False,indent=1)
cnt=collections.Counter(r['school'] for r in rows)
json.dump([dict(id=a,label=b,parent=c,dates=d,keyFigures=e,symbol=f,note=g,existsInApp=h,clips=cnt.get(a,0)) for a,b,c,d,e,f,g,h in SCHOOLS],open('schools.json','w'),ensure_ascii=False,indent=1)
print(len(rows),'clips;',len(people),'people+fig;',len(more),'more voices')
print(cnt.most_common())
print(sorted(depth.items(),key=lambda x:-x[1]))
