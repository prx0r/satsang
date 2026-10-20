import json,concurrent.futures as F
from ytsearch import search
CH={c['id']:c for c in json.load(open('channels.json'))}
T=['Thich Nhat Hanh','Mingyur Rinpoche','Dalai Lama','Tsoknyi Rinpoche','Ajahn Brahm','Tara Brach','Jack Kornfield','Ajahn Sumedho','Ajahn Pasanno','Ajahn Amaro','Shohaku Okumura','Henry Shukman','Joan Halifax','Joseph Goldstein','Gil Fronsdal','Sharon Salzberg','Thanissaro','Brad Warner','Suzuki Roshi']
TOP=['rebirth','reincarnation','past lives','no self','not self','anatta','emptiness','karma','bardo','after death','koan','what is the self','interbeing','no birth no death']
jobs=[(t+' '+q,sp) for t in T for q in TOP for sp in ('EgIYAw==','EgIYAQ==')]
out=json.load(open('../raw_discovered.json')); n0=len(out)
key={c['id']:c['key'] for c in CH.values()}
def run(j): return search(j[0],sp=j[1])
with F.ThreadPoolExecutor(6) as ex:
    for r in ex.map(run,jobs):
        for x in r['rows']:
            if x['chanId'] in key and x['id'] not in out:
                out[x['id']]=dict(x,ch=key[x['chanId']],queries=[r['q']])
json.dump(out,open('../raw_discovered.json','w'),ensure_ascii=False)
print(n0,len(out))
