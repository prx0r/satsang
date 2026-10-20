import json,re,collections
from speakers import assign,BY
from topics_lib import tag,score
idx=json.load(open('../raw/index.json'))
FOREIGN=re.compile(r'[\u0400-\u04FF\u0E00-\u0FFF\u1100-\u11FF\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]')
VIET=re.compile(r'[ạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹđ]',re.I)
LANGW=re.compile(r'\b(partie|parte|teil|tag \d|d[ií]a \d|jour|enseñanzas|enseignements|gespr[aä]che|ph[aá]p h[oộ]i|espa[nñ]ol|fran[cç]ais|deutsch|italiano|portugu[eê]s|chinese translation|en español|en fran|subt[ií]tulos|sous-titres|русск|vietnamese|tiếng|ngày|bài giảng|[\[(]廣東話|cantonese|mandarin|in tibetan\)?$|\(in tibetan\)|tibetan only|les |histoires|êtres|bouddhisme)\b',re.I)
NONTALK=re.compile(r'\b(projection mapping|food culture|suggested reading|hospitality|goma|fire ritual|hoshimatsuri|immune|wwsf\d*|join us|online course|course introduction|endangered archives|takes the mound|book review|climate summit|new:|stains and burns|graphic novel|preview of|book recommendation|podcast trailer|ceremony|ceremonies|puja|sadhana|sādhana|chant(ing)?|recitation|mantra recitation|zazenkai|sunday sit|sitting|weekly zazen|morning service|evening service|gongy[oō]|fusatsu|jukai|wedding|birthday|long life|long-life|tsok|feast|livestream of prayers|prayers? for|prayer|losar|greeting|new year message|message from|donor|fundrais|trailer|teaser|promo|announcement|welcome to|welcome video|music|song|concert|band\b|film|documentary|tour\b|webcam|test\b|memorial service|offering ceremony|oryoki|empowerment|lung\b|oral transmission|medicine buddha with|drupchen|drubcho|mani retreat|smoke offering|sang offering|life release|closing ceremony|opening ceremony|photographing|banquet|gala|benefit|auction|interview with .* about the|book launch|art\b|calligraphy|craft|how to set up)\b',re.I)
rows=[]
for v in idx.values():
    if v['dup']: continue
    sp,src=assign(v['title'],v['ch'])
    if not sp: continue
    t=v['title']; sec=v['sec'] or 0
    if sec<60: continue
    if FOREIGN.search(t) or LANGW.search(t): continue
    vt=VIET.findall(re.sub(r'ph[aá]p \w+|ch[aâ]n \w+|th[ií]ch nh[aấ]t h[aạ]nh|nghi[eê]m|t[uừ]','',t,flags=re.I))
    if len(vt)>=3: continue
    if NONTALK.search(t): continue
    if v['ch'] in ('treeleaf','jundo') and re.search(r'unit \d|zenathon|sit with|samu|rohatsu|day \d|zazen|sitting|netcast|webcam|\.flv',t,re.I): continue
    if v['ch'] in ('siddharthas-intent',) and not re.search(r'\[english|\b(january|february|march|april|may|june|july|august|september|october|november|december)\b',t,re.I): continue
    if v['ch'] in ('karmapa','kibi','garchen','siddharthas-intent') and not re.search(r'\b(the|and|of|on|day|teachings?|with|in)\b',t,re.I): continue
    if re.search(r'opening remarks|closing remarks',t,re.I): continue
    if v['ch']=='sodargye': continue   # AI voice-cloned translations, not the teacher's own voice
    tg=tag(t)
    kind='natural' if sec<=1200 else ('whole' if sec<=3600 else 'long')
    rows.append(dict(v,speaker=sp,speakerFrom=src,kind=kind,_tags=tg,_score=score(tg)))
json.dump(rows,open('../raw/pool.json','w'),ensure_ascii=False)
c=collections.defaultdict(collections.Counter)
for r in rows: c[r['speaker']][r['kind']]+=1
for k,v in sorted(c.items(),key=lambda kv:-sum(kv[1].values())): print(k,dict(v))
