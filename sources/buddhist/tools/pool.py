import json,re,collections
from teachers import RX,BY
CH={c['key']:c for c in json.load(open('channels.json'))}
d=json.load(open('../raw_discovered.json'))
SINGLE={'bswa':'ajahn-brahm','thanissaro':'thanissaro-bhikkhu','thanissaro-short':'thanissaro-bhikkhu','mingyur':'mingyur-rinpoche','dalailama':'dalai-lama','pundarika':'tsoknyi-rinpoche','pundarika-uk':'tsoknyi-rinpoche','tarabrach':'tara-brach','kornfield':'jack-kornfield','plumvillage-app':'thich-nhat-hanh'}
NON=re.compile(r'(?i)trailer|promo|chant|ceremony|time-?lapse|construction|birthday|anniversary|year in review|interview with|day in the life|registration|announcement|retreat \d{4} trailer|online (retreat|program|class)|fundrais|donat|#shorts|richard gere|laurie anderson|richard davidson|celebration|concert|song|music video|paritta|ordination|puja|service|tour|welcome to|invitation|book launch|course overview|transmission overview|sign up|join us|livestream|live stream|q&a session announcement|book of quotes|new book|kathina|journey with|music meditation|feat\.|evertalk|\d\.\d\dpm|\d{1,2}/\d{1,2}/\d{4}|talking about reality|in conversation with|podcast trailer|documentary|losar|tashi delek|a message from')
pool=[]; why=collections.Counter()
for v in d.values():
    s=v['sec'] or 0
    if not (60<=s<=1200): why['len']+=1; continue
    t=v['title']
    if NON.search(t): why['nontalk']+=1; continue
    if re.search(r'[\u0E00-\u0E7F\u4e00-\u9fff\u1000-\u109F\u0600-\u06FF]',t) or re.search(r'(?i)\b(apakah|cara|bagaimana|untuk|dengan|tentang)\b',t): why['nonenglish']+=1; continue
    if len(re.findall(r'(?i)\b(wie|und|der|die|das|mit|während|für|ein|eine|ist|sich|vergangene|leben|umgang|schmerzen|meditación|la|el|los|que|para|comment|pour|les|des)\b',t))>=2 or re.search(r'(?i)während|umgang mit|vergangene',t): why['nonenglish']+=1; continue
    if not re.search(r'[A-Za-z]{4,}.*[A-Za-z]{4,}',re.sub(r'(?i)january|february|march|april|may|june|july|august|september|october|november|december','',t)): why['nontitle']+=1; continue
    if v['ch']=='abhayagiri' and re.match(r'(?i)ajahn chah',t): why['figure-reading']+=1; continue
    sp=None
    dflt=SINGLE.get(v['ch'])
    if dflt and any(i==dflt and rx.search(t) for i,n,rx,tr in RX): sp=dflt
    if not sp:
        for i,n,rx,tr in RX:
            if rx.search(t): sp=i; break
    if not sp and re.search(r'(?i)\b(ajahn|bhante|venerable|ven\.|ayya|sister|brother|br\.|sr\.|lama|geshe|khenpo|sayadaw|luang por)\s+[A-Z]',t): why['other-speaker']+=1; continue
    if v['ch']=='imc' and not sp and re.search(r'(?i)gil fronsdal',v.get('snippet','')): sp='gil-fronsdal'
    if not sp: sp=SINGLE.get(v['ch'])
    # channel-default only applies where the name-matched speaker could not be someone else
    if v['ch'] in ('pundarika','pundarika-uk','tergar','plumvillage','plumvillage-app') and sp and not re.search(BY[sp][0].split()[-1],t,re.I):
        # allow PV app "Teaching by Thich Nhat Hanh"-less titles only if snippet names him
        if not re.search(BY[sp][0].split()[-1],v.get('snippet',''),re.I) and v['ch'] not in ('pundarika','pundarika-uk'): why['nospeaker']+=1; continue
    if not sp: why['nospeaker']+=1; continue
    pool.append(dict(v,speaker=sp))
print(why, len(pool))
print(collections.Counter(p['speaker'] for p in pool))
json.dump(pool,open('../pool.json','w'),ensure_ascii=False)
open('../pool_ids.txt','w').write('\n'.join(p['id'] for p in pool))
