import json,sys,concurrent.futures as F
from ytsearch import search
CH={c['key']:c for c in json.load(open('channels.json'))}
TOP=["rebirth","karma","self","death","meditation","awakening","suffering","emptiness","compassion","fear","koan","Dogen","impermanence","mind","love","letting go","nirvana","zazen","enlightenment","practice"]
spec={'sfzc':['Suzuki Roshi','Shunryu Suzuki'],'upaya':['Joan Halifax','Roshi Joan'],'sanshin':['Okumura','Dogen Okumura','Shobogenzo'],'amaravati':['Ajahn Sumedho','Ajahn Amaro'],'abhayagiri':['Ajahn Pasanno','Ajahn Amaro'],
 'imc':['Gil Fronsdal'],'ims':['Joseph Goldstein','Sharon Salzberg'],'spiritrock':['Jack Kornfield','Joseph Goldstein'],'plumvillage':['Thich Nhat Hanh'],'bswa':['Ajahn Brahm short','Ajahn Brahm Q&A'],
 'hardcorezen':['Brad Warner'],'zss':['Zen'],'mountaincloud':['Henry Shukman'],'pamc':['Pa-Auk Sayadaw','Pa-Auk Tawya Sayadaw english']}
jobs=[(k,(n+' '+t).strip()) for k,ns in spec.items() for n in ns for t in TOP]
jobs+=[(k,t) for k in ['hardcorezen','zss','mountaincloud'] for t in TOP]
out=json.load(open('../raw_discovered.json'))
def run(j):
    k,q=j; return k,q,search(q,path='/channel/'+CH[k]['id'])
n0=len(out)
with F.ThreadPoolExecutor(6) as ex:
    for k,q,r in ex.map(run,jobs):
        for x in r['rows']:
            if x['chanId']!=CH[k]['id']: continue
            o=out.setdefault(x['id'],dict(x,ch=k,queries=[])); o['queries'].append(q)
json.dump(out,open('../raw_discovered.json','w'),ensure_ascii=False)
print(n0,len(out))
