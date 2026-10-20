import json,re,collections,datetime,os
from rules import SP,FAMILY_LABEL
from meta import S,FIG,ORGS,E
R='../raw';O='..';W='../../..'
TODAY='2026-10-20'
pool=json.load(open(f'{R}/pool.json'))
tree=json.load(open(f'{W}/app/schema/topics.json'))['tree']
# topic matchers
tm=[]
for root,v in tree.items():
    tm.append((root,v.get('kw',[])))
    for leaf,lv in v.items():
        if isinstance(lv,dict) and 'kw' in lv: tm.append((f'{root}/{leaf}',lv['kw']))
EXTRA={'divine/the-one':[r'the one\b',r'henosis',r'plotin\w*',r'neoplaton\w*'],'gnosis':[r'gnos\w*',r'hermet\w*',r'esoteric\w*',r'kabbal\w*',r'qabal\w*',r'zohar',r'sefir\w*',r'mystic\w*'],
 'soul':[r'souls?',r'nafs',r'psyche',r'daimon\w*',r'angel\w*'],'divine':[r'god\b',r'divine',r'allah',r'sacred',r'theurg\w*',r'tawhid'],'meditation/prayer':[r'pray\w*',r'jesus prayer',r'dhikr',r'zikr',r'remembrance',r'centering',r'lectio',r'hesych\w*'],
 'meditation/mantra':[r'mantra',r'maranatha'],'kindness':[r'\blove\b',r'mercy',r'compassion'],'death':[r'death',r'dying',r'afterlife',r'after death'],'consciousness':[r'conscious\w*',r'hemispher\w*',r'idealism',r'\bmind\b'],
 'texts':[r'masnavi',r'zohar',r'torah',r'parash\w*',r'qur.?an',r'corpus hermeticum',r'enneads',r'bible',r'genesis'],'faith/grace':[r'grace'],'self':[r'true self',r'\bego\b',r'nafs'],'reality':[r'reality',r'imaginal',r'mundus imaginalis']}
SCHOOL_DEF={'hermeticism':'gnosis','theurgy':'divine','neoplatonism':'divine/the-one','renaissance-platonism':'soul','platonism':'soul','kabbalah':'divine','zohar':'texts','merkavah':'gnosis','neo-hasidism':'texts','hasidism':'divine',
 'gnosticism':'gnosis','sufism':'divine','akbarian':'divine','naqshbandi':'divine','inayati':'meditation','nimatullahi':'kindness','mevlevi-rumi':'texts','perennialism':'divine','imaginal':'reality','jungian':'soul','archetypal-cosmology':'reality',
 'christian-meditation-wccm':'meditation/mantra','franciscan-contemplative':'meditation/prayer','wisdom-christianity':'meditation/prayer','christian-mysticism':'meditation/prayer','hesychasm':'meditation/prayer','philosophy-of-the-sacred':'consciousness',
 'analytic-idealism':'consciousness','presocratic-mysticism':'awakening','western-esotericism-scholarship':'gnosis','learned-magic':'gnosis','alchemy':'gnosis','christian-theosophy':'gnosis','rosicrucianism':'gnosis','theosophy':'gnosis'}
def rx(k): return re.compile(r'(?<![\w])(?:'+k+r')(?![\w])',re.I)
CM=[(t,[rx(k) for k in kws]) for t,kws in tm]+[(t,[rx(k) for k in kws]) for t,kws in EXTRA.items()]
def topics(title,school):
    hits=collections.OrderedDict()
    for t,pats in CM:
        if any(p.search(title) for p in pats): hits.setdefault(t,[t,0.7,'title'])
    out=list(hits.values())
    BAD={'guru':r'master and (his|the) emissary|awaken the master|master of demons','impermanence':r'^(?!.*imperman)','death/bardo':r'bardon','right-view':r'angel of wisdom','dukkha':r'education and government'}
    out=[h for h in out if not (h[0] in BAD and re.search(BAD[h[0]],title,re.I))]
    # prefer leaves over their own roots
    leaves={h[0].split('/')[0] for h in out if '/' in h[0]}
    out=[h for h in out if not ('/' not in h[0] and h[0] in leaves)]
    out=out[:4]
    if not out: out=[[SCHOOL_DEF.get(school,'divine'),0.4,'school-default']]
    return out
def band(s): return 'short' if s<=75 else 'mid' if s<=180 else 'long' if s<=420 else 'xl'
emb={}
clips=[]
for p in pool:
    e=json.load(open(f'{O}/cache/embed/{p["id"]}.json'))
    if not (e.get('oembed')==200 and e.get('playableInEmbed')): continue
    sp=p['speaker'];m=S[sp];fam,school=p['family'],p['school']
    tg=topics(p['title'],school)
    ori='horizontal' if (e.get('o_w') or 0)>(e.get('o_h') or 0) else 'vertical'
    host = None if m.get('ch') and m['ch'][0]==p['channel'] else p['channel']
    clips.append({'id':p['id'],'teacher':m['name'],'speaker':sp,'speakerFrom':'title-rule' if host else 'channel-default','title':re.sub(r'\s+',' ',p['title']).strip(),'ytTitle':e.get('o_title') or p['title'],
      'channel':p['channel'],'channelAuthorUrl':e.get('o_author_url'),'kind':'human','media':'youtube','checked':TODAY,'dur':e.get('dur') or p['sec'],'sec':e.get('dur') or p['sec'],
      'format':ori,'orientation':ori,'orientationSource':'oembed width/height %sx%s'%(e.get('o_w'),e.get('o_h')),'carrier':'own' if not host else 'host',
      'setting':'talk','region':fam,'tradition':school,'traditions':sorted({fam,school}),'school':school,'figures':[],'topics':[t[0] for t in tg],'style':[],
      'published':None,'year':None,'views':p['views'],'tags':{'v':1,'topics':tg,'lang':['en',0.8,'rule'],'band':band(e.get('dur') or p['sec'])},
      'embed':{'oembed':200,'playableInEmbed':True,'checked':TODAY},'wholeTalk':(e.get('dur') or p['sec'])>1200,'src':p['src']})
# language flags: Arabic/Persian/Hebrew script in titles
for c in clips:
    if re.search(r'[\u0600-\u06FF]',c['title']): c['tags']['lang']=['mixed',0.5,'title-script']
json.dump(clips,open(f'{O}/clips.json','w'),ensure_ascii=False,indent=1)
# people
cnt=collections.Counter(c['speaker'] for c in clips)
sch=collections.defaultdict(collections.Counter)
for c in clips: sch[c['speaker']][c['school']]+=1
people=[];more=[]
for sp,m in S.items():
    n=cnt.get(sp,0)
    if n==0: continue
    fam,school=SP[sp]
    row={'id':sp,'name':m['name'],'role':m['role'],'tradition':fam,'traditionLabel':FAMILY_LABEL[fam],'school':school,'schoolsInClips':dict(sch[sp]),'years':m['years'],'bio':m['bio'],'site':m['site'],
         'channels':[{'name':m['ch'][0],'id':m['ch'][1],'url':'https://www.youtube.com/channel/'+m['ch'][1]}] if m.get('ch') else [],'clip_count':n,
         'hosts':sorted({c['channel'] for c in clips if c['speaker']==sp})}
    (people if n>=8 else more).append(row)
people.sort(key=lambda r:-r['clip_count']);more.sort(key=lambda r:-r['clip_count'])
figs=[{'id':k,'name':v,'role':'figure'} for k,v in FIG.items()]
json.dump({'_note':'deep-western people (2026-10-20). main = 8+ usable embeddable official clips in clips.json; more_voices = fewer (kept). figures = lineage nodes with no clips here. clip_count counts this folder only (excludes clips already in app/site/clips.json and sources/western).','main':people,'more_voices':more,'figures':figs,'orgs':[{'id':k,'name':v,'role':'organisation'} for k,v in ORGS.items()]},open(f'{O}/people.json','w'),ensure_ascii=False,indent=1)
ed=[{'from':a,'to':b,'type':t,'source':u,'confidence':c,**({'note':n} if n else {})} for a,b,t,u,c,n in E]
json.dump({'_note':'Directed from -> to. Types: teacher_of (spiritual), academic_supervisor_of (PhD/MA), influenced, translated, founded. Every edge carries the URL I checked (2026-10-20) unless the note says otherwise.','edges':ed},open(f'{O}/lineages.json','w'),ensure_ascii=False,indent=1)
print('clips',len(clips),'main',len(people),'more',len(more),'edges',len(ed))
for r in people: print(r['clip_count'],r['id'],r['schoolsInClips'])
print('more:',[(r['id'],r['clip_count']) for r in more])
print(collections.Counter(c['school'] for c in clips))
print(collections.Counter(t for c in clips for t in c['topics']).most_common(30))
print('default-topic clips',sum(1 for c in clips if c['tags']['topics'][0][2]=='school-default'))
