# people-additions.json, edges-additions.json, traditions-additions.json for advaita-extra
import json, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
def ch(name,cid,official,note=None):
    d={'name':name,'id':cid,'url':'https://www.youtube.com/channel/'+cid,'official':official}
    if note: d['note']=note
    return d
P=[
 {'id':'anandamayi-ma','name':'Anandamayi Ma','short':'Anandamayi Ma','role':'figure','kind':'figure-and-speaker','tradition':'anandamayi-sangha','traditions':['hindu','anandamayi-sangha'],
  'wikidata':'Q433594','years':'1896–1982',
  'bio':'Bengali saint, born Nirmala Sundari in present-day Bangladesh, whose spontaneous states of absorption drew devotees across India for six decades; she taught that all is God and that turning towards God is the one duty.',
  'works':[{'id':'anandamayi-matri-vani','title':'Matri Vani (sayings, compiled by her ashram)','kind':'text','year':None},
           {'id':'anandamayi-words-of-ma','title':'Words of Sri Anandamayi Ma (tr. Atmananda)','kind':'book','year':None},
           {'id':'anandamayi-sad-vani','title':'Sad Vani (sayings compiled by Bhaiji)','kind':'text','year':None},
           {'id':'anandamayi-samyam-saptah','title':'Samyam Saptah question-and-answer sessions (recorded 1952–1981)','kind':'talk','year':None}],
  'aliases':['anandamayi','anandamayee','ma anandamayi','sri ma','nirmala sundari','ananda moyi','ma anandamayee'],
  'channels':[ch('SriRam108','UCl54FZfyw83SY6tIpLKDTlw',False,'long-standing devotee archive (uploads since ~2007) of ashram cine film and audio; the main source of her filmed and recorded talks; carrier=archive'),
              ch('Ashrams of India','UCoIkCVGgxsLtTgJl5V3M9cA',False,'archive site channel (ashramsofindia.com); 1930s film, Yogananda visit; carrier=archive'),
              ch('Shree shree Maa Anandamayee sangha','UC9H5_eUw-XvQDuoXd3St_Vw',None,'small channel posting current Kankhal ashram events; no talks usable; not verified as the Sangha\'s official channel')],
  'note':'No official Sangha YouTube channel with archival talks was found. She is a figure who also appears as speaker in archival recordings (carrier=archive, speaker=anandamayi-ma).'},
 {'id':'nisargadatta-maharaj','existing':True,'_merge':'union works/aliases/channels into the existing people.json entry; also mark kind figure-and-speaker (archival footage, carrier=archive)',
  'kind':'figure-and-speaker','aliases':['nisargadatta','sri nisargadatta','maruti shivrampant kambli','maharaj'],
  'works':[{'id':'nisargadatta-seeds','title':'Seeds of Consciousness (ed. Jean Dunn)','kind':'book','year':1982},
           {'id':'nisargadatta-prior','title':'Prior to Consciousness (ed. Jean Dunn)','kind':'book','year':1985},
           {'id':'nisargadatta-consciousness-absolute','title':'Consciousness and the Absolute: The Final Talks (ed. Jean Dunn)','kind':'book','year':1994},
           {'id':'nisargadatta-awaken-eternal','title':'Awaken to the Eternal (documentary, filmed 1979–81)','kind':'talk','year':1981}],
  'channels':[ch('Sri Nisargadatta Ashram','UCTDJhL2FtH2kgrOp2v9KjfQ',True,'ashram channel; The Eternal Satsang film (2DOY5B-PH2Y) and Marathi pravachans'),
              ch('John Richards','UCMYJauGJNxNqjQr1vNckaOw',False,'teacher in the Ramakant Maharaj / Inchegeri line; hosts archival Nisargadatta films; carrier=archive'),
              ch('Ashrams of India','UCoIkCVGgxsLtTgJl5V3M9cA',False,'archive excerpts from The Lost Satsang and Awaken to the Eternal; carrier=archive')],
  'note':'Archival footage is carried by the ashram channel plus long-standing archive channels; the other teacher channels speak about him.'},
 {'id':'siddharameshwar-maharaj','existing':True,'_merge':'union works/aliases','aliases':['siddharameshwar','sadguru siddharameshwar'],
  'works':[{'id':'siddharameshwar-master-self-realization','title':'Master of Self-Realization','kind':'book','year':None},{'id':'siddharameshwar-amrut-laya','title':'Amrut Laya','kind':'book','year':None}]},
 {'id':'ramesh-balsekar','name':'Ramesh Balsekar','short':'Ramesh Balsekar','role':'speaker','kind':'speaker','tradition':'inchegeri','traditions':['advaita','inchegeri'],'wikidata':'Q326591','years':'1917–2009',
  'bio':'Retired president of the Bank of India who translated for Nisargadatta Maharaj in his last years and then taught in Bombay that there is no individual doer and that everything happens by the will of the Source.',
  'works':[{'id':'balsekar-pointers','title':'Pointers from Nisargadatta Maharaj','kind':'book','year':1982},{'id':'balsekar-consciousness-speaks','title':'Consciousness Speaks','kind':'book','year':1992},{'id':'balsekar-final-truth','title':'The Final Truth','kind':'book','year':1989}],
  'aliases':['ramesh','balsekar','ramesh s. balsekar'],
  'channels':[ch('Advaita Fellowship','UCcFj1xr1KpwXpk_d5q8rdbg',True,"Wayne Liquorman's organisation (advaita.org); hosts Ramesh's first video interview")]},
 {'id':'gautam-sachdeva','name':'Gautam Sachdeva','short':'Gautam Sachdeva','role':'speaker','kind':'speaker','tradition':'inchegeri','traditions':['advaita','inchegeri'],'wikidata':None,'years':None,
  'bio':'Mumbai-based author and publisher, a long-time student of Ramesh Balsekar, who retells stories and pointers from Ramesh, Nisargadatta and Siddharameshwar in short talks.',
  'works':[{'id':'sachdeva-pointers-ramesh','title':'Pointers from Ramesh Balsekar','kind':'book','year':None},{'id':'sachdeva-explosion-of-love','title':'Explosion of Love','kind':'book','year':None},{'id':'sachdeva-siddharameshwar-podcast','title':'Podcasts: Siddharameshwar Maharaj (series)','kind':'talk','year':2020}],
  'aliases':['gautam'],'channels':[ch('Gautam Sachdeva','UCfKnLTpbPGq6egpaBmQrwdg',True)]},
 {'id':'wayne-liquorman','name':'Wayne Liquorman','short':'Wayne Liquorman','role':'speaker','kind':'speaker','tradition':'inchegeri','traditions':['advaita','inchegeri'],'wikidata':None,'years':'b. 1951',
  'bio':'American teacher and former businessman who met Ramesh Balsekar in 1987, published his books, and teaches non-doership through the Advaita Fellowship.',
  'works':[{'id':'liquorman-acceptance-of-what-is','title':'Acceptance of What Is','kind':'book','year':2000},{'id':'liquorman-enlightenment-is-not-what-you-think','title':'Enlightenment Is Not What You Think','kind':'book','year':2009},{'id':'liquorman-no-way','title':'No Way (as Ram Tzu)','kind':'book','year':1990}],
  'aliases':['wayne','ram tzu'],'channels':[ch('Advaita Fellowship','UCcFj1xr1KpwXpk_d5q8rdbg',True)],'note':'No Wikidata item found (wbsearchentities, 2026-10-20).'},
 {'id':'sri-ranjit-maharaj','name':'Sri Ranjit Maharaj','short':'Ranjit Maharaj','role':'speaker','kind':'speaker','tradition':'inchegeri','traditions':['advaita','inchegeri'],'wikidata':'Q18207386','years':'1913–2000',
  'bio':'Fellow disciple of Siddharameshwar Maharaj alongside Nisargadatta, who taught in Bombay and in Europe late in life that everything is illusion and only the Self is real.',
  'works':[{'id':'ranjit-illusion-vs-reality','title':'Illusion vs. Reality','kind':'book','year':None},{'id':'ranjit-just-one-thing','title':'Just One Thing','kind':'book','year':None}],
  'aliases':['ranjit maharaj','sadguru ranjit'],'channels':[ch('Sri Ranjit Maharaj','UCNVv5lKoj8nIlfe05cz_22w',None,'links to sadguru.com (his lineage site); likely official, not confirmed')],
  'note':'Wikidata Q18207386 has the right label and no description; verify before relying on it.'},
 {'id':'stephen-wolinsky','name':'Stephen Wolinsky','short':'Stephen Wolinsky','role':'speaker','kind':'speaker','tradition':'inchegeri','traditions':['advaita','inchegeri'],'wikidata':'Q125628687','years':None,
  'bio':'American psychologist and writer who sat with Nisargadatta Maharaj in 1979–81 and later made the film Rays of the Absolute about his legacy.',
  'works':[{'id':'wolinsky-rays-film','title':'Rays of the Absolute (film, with Science and Nonduality)','kind':'talk','year':None},{'id':'wolinsky-i-am-that-i-am','title':'I Am That I Am','kind':'book','year':None}],
  'aliases':['wolinsky','narayan'],'channels':[ch('Stephen Wolinsky','UCzryZyOW34fKNTYXRSbWNbw',True),ch('Science and Nonduality','UCG9_3MP30-PDAMuEte8HUNw',True,'co-producer of Rays of the Absolute; posts the film in chapters')]},
 {'id':'s-k-mullarpattan','name':'S. K. Mullarpattan','short':'Mullarpattan','role':'speaker','kind':'speaker','tradition':'inchegeri','traditions':['advaita','inchegeri'],'wikidata':None,'years':None,
  'bio':'One of the main interpreters at Nisargadatta Maharaj\'s Bombay talks, interviewed in Rays of the Absolute.','works':[],'aliases':['mullarpattan','saumitra mullarpattan']},
 {'id':'vanaja-narayanswamy','name':'Dr. Vanaja Narayanswamy','short':'Vanaja Narayanswamy','role':'speaker','kind':'speaker','tradition':'inchegeri','traditions':['advaita','inchegeri'],'wikidata':None,'years':None,
  'bio':'Disciple of Nisargadatta Maharaj interviewed in Rays of the Absolute.','works':[],'aliases':['vanaja']},
 {'id':'jean-dunn','name':'Jean Dunn','short':'Jean Dunn','role':'figure','kind':'figure','tradition':'inchegeri','traditions':['advaita','inchegeri'],'wikidata':None,'years':'1921–1996',
  'bio':'American disciple of Nisargadatta Maharaj who recorded and edited his last talks into three books.',
  'works':[{'id':'dunn-seeds','title':'Seeds of Consciousness (editor)','kind':'book','year':1982},{'id':'dunn-prior','title':'Prior to Consciousness (editor)','kind':'book','year':1985},{'id':'dunn-consciousness-absolute','title':'Consciousness and the Absolute (editor)','kind':'book','year':1994}],
  'aliases':['dunn'],'note':'Wikidata search returns only other people named Jean Dunn.'},
 {'id':'atmananda-blanca-schlamm','name':'Atmananda (Blanca Schlamm)','short':'Atmananda','role':'speaker','kind':'speaker','tradition':'anandamayi-sangha','traditions':['hindu','anandamayi-sangha'],'wikidata':None,'years':'1904–1985',
  'bio':'Austrian-born pianist who lived with Anandamayi Ma for decades as a brahmacharini and translated her sayings into English; interviewed in 1981.',
  'works':[{'id':'atmananda-words-of-ma','title':'Words of Sri Anandamayi Ma (translator)','kind':'book','year':1961},{'id':'atmananda-death-must-die','title':'Death Must Die (diaries)','kind':'book','year':2000}],
  'aliases':['atmananda','blanca schlamm','brahmacharini atmananda'],'note':'Not the Kerala teacher Atmananda Krishna Menon.'},
 {'id':'swami-chidananda-saraswati','name':'Swami Chidananda','short':'Swami Chidananda','role':'speaker','kind':'speaker','tradition':'divine-life-society','traditions':['hindu','vedanta','divine-life-society'],'wikidata':'Q173262','years':'1916–2008',
  'bio':'Successor of Swami Sivananda as president of the Divine Life Society in Rishikesh and a close friend of Anandamayi Ma.',
  'works':[{'id':'chidananda-light-fountain','title':'Light Fountain','kind':'book','year':None}],'aliases':['chidananda','swami chidananda saraswati'],
  'note':'Archival interviews only (SriRam108); his own order\'s channel was not enumerated this round.'},
 {'id':'swami-kedarnath','name':'Swami Kedarnath','short':'Swami Kedarnath','role':'speaker','kind':'speaker','tradition':'anandamayi-sangha','traditions':['hindu','anandamayi-sangha'],'wikidata':None,'years':None,
  'bio':'Monk of Sri Sri Mata Anandamayi Peeth, Indore, who explains Anandamayi Ma\'s teaching in English.','works':[],'aliases':['kedarnath','swami kedarnath maharaj']},
 {'id':'swami-vijayananda','name':'Swami Vijayananda','short':'Swami Vijayananda','role':'speaker','kind':'speaker','tradition':'anandamayi-sangha','traditions':['hindu','anandamayi-sangha'],'wikidata':'Q111434982','years':'1914–2010',
  'bio':'French physician (born Adolphe Weintrob) who came to Anandamayi Ma in 1951 and lived as a monk in her ashrams for nearly sixty years.',
  'works':[{'id':'vijayananda-french-doctor','title':'A French Doctor in the Himalayas','kind':'book','year':None}],'aliases':['vijayananda','adolphe weintrob'],
  'note':'Wikidata Q111434982 is labelled Adolphe Weintrob (no description); medium confidence it is the same person.'},
 {'id':'shunyamurti','name':'Shunyamurti','short':'Shunyamurti','role':'speaker','kind':'speaker','tradition':'independent','traditions':['independent','hindu'],'wikidata':None,'years':None,
  'bio':'Teacher and founder of the Sat Yoga Institute in Costa Rica; here he reads Yogananda\'s account of meeting Anandamayi Ma.','works':[],'aliases':[],
  'channels':[ch('Sat Yoga Institute','UC0ZlQpz-8gN6E0X0qd5HcSQ' if False else 'unknown',True)]},
]
# fix shunyamurti channel id from search rows
import glob
cid=None
for f in glob.glob('cache/search/*.json'):
    for r in json.load(open(f))['rows']:
        if r.get('channel')=='Sat Yoga Institute': cid=r.get('chanId')
P[-1]['channels']=[ch('Sat Yoga Institute',cid,True)] if cid else []
json.dump({'_note':'advaita-extra people additions (2026-10-20). Work years are null where not verified. existing:true = merge into the people.json entry (union works/aliases/channels). kind figure-and-speaker = a figure who also appears as speaker in archival recordings (carrier=archive). Wikidata via wbsearchentities.','people':P},open('people-additions.json','w'),indent=1,ensure_ascii=False)
E=[
 {'from':'siddharameshwar-maharaj','to':'sri-ranjit-maharaj','type':'teacher_of','conf':'high'},
 {'from':'nisargadatta-maharaj','to':'ramesh-balsekar','type':'teacher_of','conf':'high','note':'Ramesh translated for Maharaj from 1978 and was acknowledged by him.'},
 {'from':'nisargadatta-maharaj','to':'jean-dunn','type':'teacher_of','conf':'high','note':'She recorded and edited his last talks.'},
 {'from':'nisargadatta-maharaj','to':'stephen-wolinsky','type':'teacher_of','conf':'medium'},
 {'from':'nisargadatta-maharaj','to':'s-k-mullarpattan','type':'teacher_of','conf':'medium','note':'Interpreter and devotee.'},
 {'from':'nisargadatta-maharaj','to':'vanaja-narayanswamy','type':'teacher_of','conf':'medium'},
 {'from':'ramesh-balsekar','to':'wayne-liquorman','type':'teacher_of','conf':'high'},
 {'from':'ramesh-balsekar','to':'gautam-sachdeva','type':'teacher_of','conf':'high'},
 {'from':'siddharameshwar-maharaj','to':'gautam-sachdeva','type':'influenced','conf':'medium','note':'Gautam\'s podcast series on Siddharameshwar\'s talks.'},
 {'from':'anandamayi-ma','to':'atmananda-blanca-schlamm','type':'teacher_of','conf':'high'},
 {'from':'anandamayi-ma','to':'swami-vijayananda','type':'teacher_of','conf':'high'},
 {'from':'anandamayi-ma','to':'swami-kedarnath','type':'influenced','conf':'medium','note':'Monk of Anandamayi Peeth; teaches her philosophy.'},
 {'from':'anandamayi-ma','to':'swami-chidananda-saraswati','type':'influenced','conf':'medium','note':'Long association; Chidananda describes her as a guide.'},
 {'from':'anandamayi-ma','to':'anandamayi-sangha','type':'lineage_of','conf':'high'},
 {'from':'paramahansa-yogananda','to':'anandamayi-ma','type':'influenced','conf':'low','note':'Not influence: he met her in 1936 and wrote the chapter "The Bengali Joy-Permeated Mother"; consider a "met" edge type instead.'},
]
json.dump({'_note':'advaita-extra edge additions (same shape as app/wisegraph/edges.json).','edges':E},open('edges-additions.json','w'),indent=1,ensure_ascii=False)
T=[{'id':'anandamayi-sangha','label':'Anandamayi Ma Sangha','kind':'lineage','parent':'hindu','wikidata':None,'blurb':'The ashrams and monastics around Anandamayi Ma (Shree Shree Anandamayee Sangha, Kankhal and Varanasi), devotional and non-sectarian.'},
   {'id':'divine-life-society','label':'Divine Life Society','kind':'lineage','parent':'vedanta','wikidata':None,'blurb':'The order founded by Swami Sivananda in Rishikesh, carried on by Swami Chidananda.'}]
json.dump({'_note':'advaita-extra tradition node additions. Wikidata null where not verified.','nodes':T},open('traditions-additions.json','w'),indent=1,ensure_ascii=False)
print(len(P),len(E),len(T))
