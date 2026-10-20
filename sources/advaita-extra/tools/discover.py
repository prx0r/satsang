import json,sys,concurrent.futures as F
sys.path.insert(0,'tools'); from ytsearch import search
Q=["Nisargadatta Maharaj last satsang","Nisargadatta Maharaj rare video","Nisargadatta Maharaj original footage","Nisargadatta Maharaj 1981 video","Nisargadatta Maharaj Awaken to the Eternal","Nisargadatta Maharaj speaking video","Nisargadatta Maharaj film","Nisargadatta Maharaj satsang 1980","Nisargadatta Maharaj Jean Dunn video","Nisargadatta Maharaj talks with english translation video","Nisargadatta Maharaj footage Bombay","Nisargadatta Maharaj home movie",
"Anandamayi Ma rare footage","Anandamayi Ma video","Anandamayi Ma darshan film","Anandamayi Ma speaking","Anandamayi Ma documentary","Shree Shree Anandamayee Sangha","Anandamayi Ma ashram Kankhal","Anandamayi Ma Arnaud Desjardins film","Ma Anandamayi Sangha video","Anandamayi Ma Kirtan footage 1970s","Anandamayi Ma interview","Anandamayi Ma Matri Vani",
"talk about Anandamayi Ma","Swami Sarvapriyananda Anandamayi Ma","Anandamayi Ma Rupert Spira","Mooji Nisargadatta","Ramesh Balsekar video","Ramesh Balsekar talk","Sri Ranjit Maharaj video","Siddharameshwar Maharaj","Jean Dunn Nisargadatta","Stephen Wolinsky Nisargadatta","Nisargadatta Maharaj explained","David Godman Nisargadatta","Anandamayi Ma story teacher","Atmananda Krishna Menon Anandamayi","Radha Burnier Anandamayi","Swami Vijayananda Anandamayi","Swami Kedarnath Anandamayi","Anandamayi Ma Bhaiji","Atmananda Blanca Anandamayi","Sri Anandamayi Ma documentary English","Ma Anandamayi French film Arnaud Desjardins","Nisargadatta Maharaj I Am That reading","Nisargadatta Maharaj video interview Maurice Frydman","Ramesh Balsekar Nisargadatta"]
def go(q): return q,search(q)
out={}
with F.ThreadPoolExecutor(6) as ex:
  for q,r in ex.map(go,Q): out[q]=r
json.dump(out,open('raw/search.json','w'),ensure_ascii=False)
rows={}
for q,r in out.items():
  for x in r['rows']:
    if x['id'] and x['id'] not in rows: x['q']=q; rows[x['id']]=x
print(len(rows), sum(1 for r in out.values() if r.get('err')))
json.dump(list(rows.values()),open('raw/rows.json','w'),ensure_ascii=False)
