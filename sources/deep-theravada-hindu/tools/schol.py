import ytsearch,json,sys,concurrent.futures as F,collections
Q={'wendy-doniger':['Wendy Doniger','Wendy Doniger lecture Hinduism','Wendy Doniger interview','Wendy Doniger Kama Sutra','Wendy Doniger myth'],
'anantanand-rambachan':['Anantanand Rambachan','Anantanand Rambachan Advaita','Rambachan nonduality lecture','Rambachan Hindu theology'],
'jeffery-long':['Jeffery Long','Jeffery D. Long Vedanta','Jeffery Long Hinduism lecture','Jeffery Long Ramakrishna'],
'gavin-flood':['Gavin Flood','Gavin Flood lecture','Gavin Flood Hinduism','Gavin Flood religion interview'],
'edwin-bryant':['Edwin Bryant','Edwin Bryant Bhagavata','Edwin Bryant yoga lecture','Edwin Bryant Krishna'],
'richard-gombrich':['Richard Gombrich','Richard Gombrich Buddha','Richard Gombrich lecture Oxford'],
'alexander-wynne':['Alexander Wynne','Alexander Wynne Buddha','Alexander Wynne OCBS'],
'rupert-gethin':['Rupert Gethin','Rupert Gethin Buddhism','Rupert Gethin mindfulness'],
'steven-collins':['Steven Collins nirvana','Steven Collins Buddhism'],
'bhikkhu-analayo':['Analayo','Bhikkhu Analayo talk','Analayo satipatthana meditation','Analayo rebirth','Analayo early Buddhism'],
'bhante-sujato':['Bhante Sujato','Ajahn Sujato talk','Sujato sutta'],
'joseph-goldstein':['Joseph Goldstein','Joseph Goldstein mindfulness','Joseph Goldstein insight'],
'bhikkhu-bodhi':['Bhikkhu Bodhi','Bhikkhu Bodhi interview'],
'ajahn-brahmali':['Ajahn Brahmali','Ajahn Brahmali sutta'],
'swami-dayananda-saraswati':['Swami Dayananda Saraswati english talk','Pujya Swami Dayananda Saraswati'],
'swami-paramarthananda':['Swami Paramarthananda english'],
'sayadaw-u-pandita':['Sayadaw U Pandita dhamma talk english'],
'goenka':['S N Goenka english discourse','Goenka vipassana english'],
}
out={}
def run(j):
    s,q=j; return s,q,ytsearch.search(q)['rows']
jobs=[(s,q) for s,qs in Q.items() for q in qs]
with F.ThreadPoolExecutor(4) as ex:
    for s,q,rows in ex.map(run,jobs):
        for r in rows: r['q']=q; out.setdefault(s,{})[r['id']]=r
json.dump(out,open('../raw/schol.json','w'))
for s,d in out.items():
    c=collections.Counter((r['channel'],r['chanId']) for r in d.values())
    print('\n#',s, c.most_common(12))
