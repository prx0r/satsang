import json,re,os
APP=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../../app')
tree=json.load(open(os.path.join(APP,'schema/topics.json')))['tree']
ADD=[ # proposed new leaves (also written to topics-additions.json)
 {'root':'self','id':'self/emptiness','label':'Emptiness','keywords':['emptiness','empty of','sunyata','suññatā','śūnyatā','shunyata','sunnata','interbeing','madhyamaka','nagarjuna','nāgārjuna','heart sutra','form is emptiness','dependent arising and emptiness']},
 {'root':'kindness','id':'kindness/compassion','label':'Compassion','keywords':['compassion\\w*','karuna','karuṇā','bodhicitta','bodhichitta','tonglen','bodhisattva\\w*','self-compassion']},
 {'root':'death','id':'death/bardo','label':'Bardo','keywords':['bardo\\w*','intermediate state','between (death and rebirth|lives)','book of the dead','clear light of death','phowa']},
 {'root':'meditation','id':'meditation/koan','label':'Koan','keywords':['koans?','kōans?','gateless (gate|barrier)','mumonkan','blue cliff','hua ?tou','mu koan','mu','joshu','zhaozhou','genjo ?koan','genjōkōan','case \\d+','teisho','entangling vines','hekiganroku','shoyoroku','kidoroku','book of serenity','mumonkan','huatou','hua-tou','silent illumination']},
]
KWADD={'meditation':['zazen','shikantaza','just sitting','sesshin','dzogchen','mahamudra','mind training','lojong','shamatha','śamatha','samatha','calm abiding','vipashyana','vipaśyanā','chan practice','nianfo','nembutsu','visualization','deity yoga','tantra','vajrayana'],'awakening':['buddha[- ]nature','true nature','big mind','original face','rigpa','tathagatagarbha','tathāgatagarbha','gotra','kensho','kenshō','satori','great perfection','clear light','luminosity','enlightenment','nirvana','realization'],'self':['small self','big self','selflessness','ego','anatman','anātman','who am i'],'faith':['shinjin','amida','amitabha','amitābha','pure land','other[- ]power','tariki','devotion'],'dukkha':['dissatisfaction']}
TOP=[]
def comp(kws): return re.compile(r'(?<![\w])('+'|'.join(kws)+r')(?![\w])',re.I)
for root,node in tree.items():
    if node.get('kw'): TOP.append((root,comp([k for k in node['kw'] if not (root=='death' and k=='deathless')]+KWADD.get(root,[]))))
    for leaf,n in node.items():
        if isinstance(n,dict) and n.get('kw'): TOP.append((root+'/'+leaf,comp(n['kw'])))
for a in ADD: TOP.append((a['id'],comp(a['keywords'])))
PRI={'rebirth':3,'rebirth/samsara':3,'self':3,'self/emptiness':3,'death':3,'death/bardo':3,'awakening':3,'dukkha':2.5,'kamma':2.5,'meditation':2,'meditation/koan':2.5,'meditation/breath':1.5,'kindness/compassion':2,'impermanence':2,'dependent-origination':2,'jhana':2,'mindfulness':1.5,'craving':1.5,'emotions/fear':1.2,'emotions/anger':1.2,'kindness':1,'right-view':1,'emotions':0.8,'thought':0.8,'feeling':0.6,'faith':0.6,'virtue':1,'renunciation':1,'defilements':1,'relationships':0.6,'daily-life':0.5,'texts':0.6,'sense-restraint':1,'emotions/sadness':1,'emotions/boredom':0.8,'craving/sensuality':1,'meditation/guided':0.3}
def tag(title,snip='',tr_hits=None):
    hits={}
    for tid,rx in TOP:
        if rx.search(title): hits[tid]=0.9
        elif snip and rx.search(snip): hits[tid]=max(hits.get(tid,0),0.7)
    if tr_hits:
        for t,c in tr_hits.items(): hits.setdefault(t,c)
    # leaf implies root: drop root if a leaf of it is present with >= conf
    for t in list(hits):
        if '/' in t:
            r=t.split('/')[0]
            if r in hits and hits[r]<=hits[t]: del hits[r]
    ranked=sorted(hits.items(),key=lambda kv:(-kv[1],-PRI.get(kv[0],0.5)))[:4]
    return ranked
def score(ranked): return sum(PRI.get(t,0.5)*c for t,c in ranked)
