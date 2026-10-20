import json,re,os,collections,datetime,math,sys
from topics_lib import tag,score
from teachers import BY
TODAY='2026-10-20'
CH={c['key']:c for c in json.load(open('channels.json'))}
E={f[:-5]:json.load(open('../cache/ytmeta/cache/embed/'+f)) for f in os.listdir('../cache/ytmeta/cache/embed')}
presel=json.load(open('../presel.json'))
CAP={'thanissaro-bhikkhu':40,'thich-nhat-hanh':35,'mingyur-rinpoche':30,'dalai-lama':28,'tara-brach':28,'tsoknyi-rinpoche':22,'jack-kornfield':22}
MON={m:i+1 for i,m in enumerate(['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'])}
def published(t,ago):
    m=re.match(r'^(\d{2})(\d{2})(\d{2})\b',t)
    if m:
        y,mo,d=int(m.group(1)),int(m.group(2)),int(m.group(3))
        if 1<=mo<=12 and 1<=d<=31: return '%04d-%02d-%02d'%(2000+y,mo,d),'title'
    m=re.search(r'\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b',t)
    if m and int(m.group(2))<=12: return '%s-%02d-%02d'%(m.group(3),int(m.group(2)),int(m.group(1))),'title'
    m=re.search(r'\b(\d{4})[ .](\d{2})[ .](\d{2})\b',t)
    if m and int(m.group(2))<=12: return '%s-%s-%s'%m.groups(),'title'
    m=re.search(r'\b(\d{1,2}) (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w* (\d{4})\b',t,re.I)
    if m: return '%s-%02d-%02d'%(m.group(3),MON[m.group(2).lower()[:3]],int(m.group(1))),'title'
    # relative "3 years ago" -> year only (upper-bound estimate)
    m=re.search(r'(\d+)\s*(yr|year|month|mo|week|day|hour)',ago or '')
    if m:
        n=int(m.group(1)); u=m.group(2)
        days=n*365 if u in('yr','year') else n*30 if u in('month','mo') else n*7 if u=='week' else n
        d=datetime.date(2026,10,20)-datetime.timedelta(days=days)
        return None,str(d.year)
    return None,None
def clean(t,sp):
    nm=BY[sp][0]; last=nm.split()[-1]
    names=['Thanissaro','Thich Nhat Hanh','Mingyur','Dalai Lama','Tsoknyi','Kornfield','Tara Brach','Brahm','Pasanno','Sumedho','Amaro','Salzberg','Goldstein','Fronsdal','Shukman','Halifax','Roshi Joan','Warner','Suzuki','Okumura','Shinge','EN sub','Teaching by','short teaching video','Plum Village']
    t=re.sub(r'^\d{6}\s+','',t); t=re.sub(r'^\d{4}\w{2,6}\s+','',t)
    t=re.sub(r'#\w+','',t)
    segs=re.split(r'\s+(?:\\\s*\\|\||—|~| - )\s+',t)
    keep=[s for s in segs if not any(n.lower() in s.lower() for n in names) or len(segs)==1]
    if not keep: keep=segs[:1]
    t=' | '.join(keep)
    t=re.sub(r'\s*\((short teaching video|EN sub\w*|[A-Z][a-z]+ [A-Z][a-z]+)\)\s*',' ',t)
    t=re.sub(r'\s*[,|]?\s*\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\s*$','',t)
    t=re.sub(r'\s*[,|]?\s*\d{4}[ .,]+\d{2}[ .,]+\d{2}.*$','',t)
    t=re.sub(r'\s*[,|]?\s*\d{1,2} \w+ \d{4}\s*$','',t)
    t=re.sub(r'^(Yongey )?Mingyur Rinpoche (on|talks about) ','',t)
    t=re.sub(r'\s*(-|,|—)\s*(Jack|Tara|from|with)\s*$','',t)
    t=re.sub(r'\s*(with|by|-)\s*(Ven\.? |Ajahn |Roshi )?('+re.escape(nm)+'|'+re.escape(last)+r')\s*$','',t,flags=re.I)
    t=re.sub(r'\s*\|\s*Dhamma Talks?\s*$','',t,flags=re.I); t=re.sub(r'^\(\d+\)\s*','',t); t=re.sub(r',\s*from\s+.*$','',t)
    t=re.sub(r'\s{2,}',' ',t).strip(' -|—~:,')
    return t or nm
FIGS=[('the-buddha',r'\bthe buddha\b|\bbuddha\'s\b'),('ajahn-chah',r'ajahn chah'),('ajahn-mun',r'ajahn mun'),('dogen',r'dogen|dōgen|shobogenzo|shōbōgenzō|genjo ?koan'),('nagarjuna',r'nagarjuna|nāgārjuna'),('bardo-thodol',r'tibetan book of the dead|bardo thodol'),('shunryu-suzuki',r'suzuki roshi|shunryu suzuki'),('kosho-uchiyama',r'uchiyama'),('dainin-katagiri',r'katagiri'),('ajahn-chah',r'luang por chah'),('milarepa',r'milarepa'),('linji',r'linji|rinzai gigen'),('zhaozhou',r'zhaozhou|joshu'),('goenka',r'goenka'),('mahasi-sayadaw',r'mahasi')]
FIGS=[(i,re.compile(r,re.I)) for i,r in FIGS]
def band(s): return 'short' if s<420 else ('mid' if s<1800 else 'long')
def row(v,sp,spfrom,tags,start=None,end=None,segTitle=None,parent_title=None,dur=None):
    nm,trad=BY[sp]; t=v['title']; ch=CH[v['ch']] if v.get('ch') in CH else None
    pub,yr=published(t,v.get('ago'))
    figs=[i for i,rx in FIGS if rx.search(t) and i!=sp]
    sec=(end-start) if start is not None else v['sec']
    tl=t.lower(); style=[]
    if re.search(r'\bq ?& ?a\b|answers questions|questions? and answers?|ask mingyur',tl): style.append('q-and-a')
    if 'guided' in tl: style.append('guided')
    r={'id':(v['id']+'@'+str(start)) if start is not None else v['id'],'teacher':nm,'speaker':sp,'speakerFrom':spfrom,
       'title':segTitle or clean(t,sp),'ytTitle':t,'channel':v.get('channel') or (ch and ch['name']),'kind':'human','media':'youtube','checked':TODAY,
       'dur':dur or v['sec'],'sec':sec,'format':'horizontal','carrier':'own','setting':'talk','region':'buddhism','tradition':trad,
       'traditions':sorted({trad}),'figures':figs,'topics':sorted({x[0] for x in tags}),'style':style,
       'published':pub,'year':int(pub[:4]) if pub else (int(yr) if yr else None),'yearFrom':'title' if pub else ('upload-relative' if yr else None),
       'views':v.get('views'),
       'tags':{'v':1,'topics':[[a,b,c] for a,b,c in tags],'lang':['en',0.9,'rule'],'band':band(sec)}}
    if start is not None:
        r.update({'start':start,'end':end,'parent':v['id'],'segTitle':segTitle})
    return {k:x for k,x in r.items() if x is not None}
if __name__=='__main__':
    by=collections.defaultdict(list)
    for p in presel:
        e=E.get(p['id'],{})
        if not(e.get('oembed')==200 and e.get('embed')=='OK' and e.get('playableInEmbed')): continue
        by[p['speaker']].append(p)
    out=[]
    for sp,rows in by.items():
        CORE={'rebirth','rebirth/samsara','self','self/emptiness','death/bardo','meditation/koan','kamma','death','awakening'}
        rows.sort(key=lambda p:(-sum(1 for t,c in p['_tags'] if t in CORE and c>=0.9),-p['_score']))
        for p in rows[:CAP.get(sp,60)]:
            spfrom='title' if __import__('teachers').RX and any(rx.search(p['title']) for i,n,rx,t in __import__('teachers').RX if i==sp) else 'channel-default'
            tags=[[t,round(c,2),'title' if c>=0.9 else 'desc'] for t,c in p['_tags']]
            out.append(row(p,sp,spfrom,tags))
    json.dump(out,open('../natural.json','w'),ensure_ascii=False,indent=0)
    print(len(out),collections.Counter(r['speaker'] for r in out))
