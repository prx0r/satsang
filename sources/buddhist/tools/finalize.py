import json,collections
from topics_lib import ADD,KWADD
nat=json.load(open('../natural.json')); vir=json.load(open('../virtual.json'))
# drop natural rows that duplicate a parent id of a virtual (none expected) and dedupe ids
seen=set(); cand=[]
for r in nat+vir:
    if r['id'] in seen: continue
    seen.add(r['id']); r.pop('virtual',None) if False else None; cand.append(r)
app_people={p['id'] for p in json.load(open('../../../app/wisegraph/people.json'))['people']}
add_people={p['id'] for p in json.load(open('../people-additions.json'))['people']}
allp=app_people|add_people
missing=collections.Counter()
for r in cand:
    if r['speaker'] not in allp: missing['speaker:'+r['speaker']]+=1
    r['figures']=[f for f in r.get('figures',[]) if f in allp or missing.update(['figure:'+f])]
print('missing',missing)
json.dump(cand,open('../candidates.json','w'),ensure_ascii=False,indent=0)
trad={'_note':'buddhist group tradition nodes to add (2026-10-20). Wikidata via wbsearchentities; burmese has no clean item.','nodes':[
 {'id':'plum-village','label':'Plum Village','kind':'lineage','parent':'zen','wikidata':'Q60763315','blurb':'Thich Nhat Hanh\'s Vietnamese Thiền community of engaged, mindful living.'},
 {'id':'soto-zen','label':'Sōtō Zen','kind':'lineage','parent':'zen','wikidata':'Q749085','blurb':'Dōgen\'s school of just-sitting (shikantaza); San Francisco Zen Center, Sanshin.'},
 {'id':'rinzai-zen','label':'Rinzai Zen','kind':'lineage','parent':'zen','wikidata':'Q639625','blurb':'The koan school of Japanese Zen; Zen Studies Society.'},
 {'id':'gelug','label':'Gelug','kind':'lineage','parent':'tibetan','wikidata':'Q319218','blurb':'The Tibetan school of Tsongkhapa, headed in practice by the Dalai Lamas.'},
 {'id':'burmese','label':'Burmese meditation lineages','kind':'lineage','parent':'theravada','wikidata':None,'blurb':'Myanmar\'s modern meditation schools: Mahasi noting, Pa-Auk samatha-vipassanā, U Ba Khin and Goenka.'}]}
json.dump(trad,open('../traditions-additions.json','w'),ensure_ascii=False,indent=1)
E=lambda f,t,ty,c,n=None: {k:v for k,v in {'from':f,'to':t,'type':ty,'conf':c,'note':n}.items() if v}
edges={'_note':'buddhist group edges to add (2026-10-20). Same shape as app/wisegraph/edges.json.','edges':[
 E('ajahn-chah','ajahn-sumedho','teacher_of','high'),E('ajahn-chah','ajahn-brahm','teacher_of','high'),E('ajahn-chah','ajahn-pasanno','teacher_of','high'),
 E('ajahn-chah','ajahn-amaro','teacher_of','high'),E('ajahn-sumedho','ajahn-amaro','teacher_of','high','Amaro trained under Sumedho in England after Thailand.'),
 E('ajahn-chah','jack-kornfield','teacher_of','high'),E('mahasi-sayadaw','jack-kornfield','influenced','high','Kornfield also practised with Mahasi Sayadaw.'),
 E('mahasi-sayadaw','insight','lineage_of','high','Noting method at the root of the Western Insight movement.'),
 E('mahasi-sayadaw','joseph-goldstein','influenced','medium'),E('jack-kornfield','tara-brach','influenced','medium'),
 E('ajahn-mun','ajaan-lee','teacher_of','high'),E('ajaan-lee','thanissaro-bhikkhu','influenced','high','Thanissaro trained under Ajaan Fuang, Ajaan Lee\'s student, and translated Lee\'s breath method.'),
 E('thich-nhat-hanh','plum-village','lineage_of','high'),E('dogen','soto-zen','lineage_of','high'),
 E('dogen','shunryu-suzuki','influenced','high'),E('dogen','shohaku-okumura','influenced','high','Okumura is a leading English translator of Dōgen.'),
 E('kosho-uchiyama','shohaku-okumura','teacher_of','high'),E('dogen','brad-warner','influenced','medium'),
 E('zhaozhou','henry-shukman','influenced','medium','Shukman teaches the Mu koan.'),
 E('tulku-urgyen','mingyur-rinpoche','teacher_of','high'),E('tulku-urgyen','tsoknyi-rinpoche','teacher_of','high'),
 E('dalai-lama','gelug','lineage_of','high'),E('nagarjuna','mahayana','influenced','high','Madhyamaka emptiness teaching.'),
 E('pa-auk-sayadaw','burmese','lineage_of','high'),E('goenka','burmese','lineage_of','high'),
 E('ajahn-chah','ajahn-nyanamoli','influenced','medium','Hillside Hermitage talks repeatedly discuss Ajahn Chah (e.g. "Die Before You Die").'),
 E('goenka','ajahn-nyanamoli','influenced','low','Discussed critically in Hillside Hermitage talks, not a teacher.') ]}
edges['edges']=[e for e in edges['edges'] if e['conf']!='low']
json.dump(edges,open('../edges-additions.json','w'),ensure_ascii=False,indent=1)
topics={'_note':'Proposed topic leaves (2026-10-20). Each is a new leaf under an existing root in app/schema/topics.json; keywords are regex fragments in the same style as kw. kwAdd proposes extra cues for existing nodes (used by this sourcer internally).','leaves':[{'root':a['root'],'id':a['id'],'label':a['label'],'keywords':a['keywords']} for a in ADD],
 'kwAdd':KWADD,'kwRemove':{'death':['deathless'],'_why':'"deathless" is an awakening term (amata) and mis-tags awakening passages as death; keep it under awakening only.'}}
json.dump(topics,open('../topics-additions.json','w'),ensure_ascii=False,indent=1)
# counts
nv=[r for r in cand if 'parent' not in r]; vv=[r for r in cand if 'parent' in r]
c=collections.Counter(r['teacher'] for r in nv); cv=collections.Counter(r['teacher'] for r in vv)
t=collections.Counter(x for r in cand for x in r['topics']); 
fam=collections.Counter(r['tradition'] for r in cand)
json.dump({'natural':dict(c),'virtual':dict(cv),'topics':dict(t),'traditions':dict(fam),'total':len(cand),'n_nat':len(nv),'n_vir':len(vv),'hh_virtual':sum(1 for r in vv if r['channel']=='Hillside Hermitage'),'channels':dict(collections.Counter(r['channel'] for r in cand))},open('../counts.json','w'),indent=1,ensure_ascii=False)
print(len(cand),len(nv),len(vv))
