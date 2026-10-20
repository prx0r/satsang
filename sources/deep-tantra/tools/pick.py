import json,os,re,glob,sys
from collections import Counter,defaultdict
sys.path.insert(0,os.path.dirname(__file__)); from config import *
B=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'); W=os.path.join(B,'..','..')
pool=json.load(open(B+'/raw/pool.json'))
# existing ids
exist=set()
for f in [W+'/app/site/clips.json',W+'/app/clips.json']:
  try: exist|={(r.get('parent') or r['id'].split('@')[0]) for r in json.load(open(f))}
  except Exception as e: print('skip',f,e)
other=defaultdict(set)
for f in glob.glob(W+'/sources/*/candidates.json'):
  g=f.split('/')[-2]
  if g=='deep-tantra': continue
  try:
    d=json.load(open(f)); d=d if isinstance(d,list) else d.get('clips',[])
    for r in d: other[(r.get('parent') or r['id'].split('@')[0])].add(g)
  except Exception: pass
TOP=json.load(open(W+'/app/schema/topics.json'))['tree']
ADD={ # proposed topic leaves (topics-additions.json)
 'meditation/kundalini':[r'ku[nṇ][dḍ]alin[iī]',r'chakras?',r'cakras?',r'n[aā][dḍ][iī]s?',r'subtle body',r'energy body',r'pr[aā][nṇ]a\b',r'shaktipat',r'śaktipāt'],
 'divine/goddess':[r'goddess\w*',r'\bdevi\b',r'shakti',r'śakti',r'\bk[aā]l[iī]\b',r'lalit[aā]',r'tripura\w*',r'durga',r'yogin[iī]s?',r'mah[aā]vidy\w*',r'divine feminine',r'divine mother',r'bhairav[iī]'],
 'texts/tantra':[r'tantra\w*',r'tantr[aā]loka',r'shiva ?s[uū]tras?',r'siva ?s[uū]tras?',r'spanda',r'vij[nñ][aā]na[- ]?bhairava',r'pratyabhij\w*',r'[aā]gamas?',r'k[aā]rik[aā]'],
 'texts/history':[r'histor\w*',r'manuscripts?',r'origins?',r'medieval',r'early (tantra|yoga|śaiva|shaiva)',r'archaeolog\w*',r'inscriptions?'],
 'meditation/hatha':[r'ha[tṭ]ha',r'[aā]sanas?',r'postur\w*',r'mudr[aā]s?',r'kh?ecar[iī]',r'bandhas?'],
 'ritual':[r'ritual\w*',r'puj[aā]',r'yantra',r'ma[nṇ][dḍ]ala',r'nyasa',r'ny[aā]sa',r'initiation',r'd[iī]k[sṣ][aā]',r'worship',r'offering\w*',r'fire ceremony',r'homa'],
}
OVR={'emotions/sadness':['depress\\w*','sad','sadness','sorrow','despair','lonel\\w*','melanchol\\w*','grief'],
 'rebirth':['rebirth','reborn','re-?birth','reincarnat\\w*','past lives?','previous lives?','next life','future lives?','samsara','saṃsāra','afterlife','transmigration'],
 'kamma':['kamma','karma\\w*','results? of (actions?|deeds?)'],
 'relationships':['relationships?','parents?','family','friends?hip','friends','marriage','married','partner','romantic','children','gratitude'],
 'meditation/kriya':['kriya yoga','kriyā yoga','spiritual eye','lahiri'],
 'virtue':['virtue','virtuous','precepts?','moral\\w*','ethic\\w*','integrity','honest\\w*'],
 'craving/sensuality':['sensual\\w*','sense pleasures?','kāma','kama\\b'],
}
TRX=[]
def _walk(d,pre=''):
  for k,v in d.items():
    if isinstance(v,dict) and 'label' in v:
      tid=pre+k
      kw=OVR.get(tid,v.get('kw'))
      if kw: TRX.append((tid,re.compile(r'(?<!\w)(?:'+'|'.join(kw)+r')(?!\w)',re.I)))
      _walk(v,tid+'/')
_walk(TOP)
for tid,kws in ADD.items(): TRX.append((tid,re.compile(r'(?<!\w)(?:'+'|'.join(kws)+r')(?!\w)',re.I)))
def kwmatch(text):
  hits=[tid for tid,rx in TRX if rx.search(text)]
  # keep most specific
  out=[h for h in hits if not any(o!=h and o.startswith(h+'/') for o in hits)]
  return list(dict.fromkeys(out))
SKIPTOP={'kamma':r'\bkarma|\bkamma','faith':None}
def schools(text,default):
  s=[k for k,rx in SCHOOL_RX if re.search(rx,text,re.I)]
  if default and default not in s: s.append(default)
  return s
def main():
  global rows
  rows=[];why=Counter()
  for e in pool:
    cid=e['chanId']
    if cid not in CHANNELS: why['chan']+=1; continue
    dspk,carrier,dschool,mode=CHANNELS[cid]
    sec=e.get('sec') or 0
    if not (60<=sec<=3600): why['dur']+=1; continue
    t=e['title']; sn=e.get('snippet') or ''; text=t+' \n '+sn
    if re.search(r'[\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F]',t) or re.search(r'\[\s*hindi|\(hindi|hindi with|in hindi|tamil\b|telugu|\(tel\)|हिंदी',t,re.I): why['lang']+=1; continue
    if re.search(NONTALK,t,re.I): why['nontalk']+=1; continue
    # speaker
    spk=None; frm=None
    if dspk and re.search(SPEAKERS[dspk][1],t,re.I): spk=dspk; frm='title'
    for sid,(nm,rx,role,_) in SPEAKERS.items():
      if spk: break
      if sid==dspk: continue
      if re.search(rx,t,re.I): spk=sid; frm='title'; break
    if not spk and dspk: spk=dspk; frm='channel-default'
    if not spk:
      for sid,(nm,rx,role,_) in SPEAKERS.items():
        if re.search(rx,sn,re.I): spk=sid; frm='desc'; break
    if not spk: why['nospk']+=1; continue
    if mode in ('rel','spk') and not re.search(REL,text,re.I): why['rel']+=1; continue
    if cid in CHAN_MUST and not re.search(CHAN_MUST[cid],text,re.I): why['must']+=1; continue
    if mode=='spk' and cid=='UCbbrX9eeSQiWYHkzbqjvrpg' and spk=='seth-powell': pass
    vid=e['id']
    if vid in exist: why['exists']+=1; continue
    tp=kwmatch(text)
    sch=schools(text,SPEAKERS.get(spk,(0,0,0,dschool))[3] if mode=='spk' else dschool)
    rows.append(dict(id=vid,chanId=cid,channel=e.get('channel'),title=t,snippet=sn,sec=sec,views=e.get('views') or 0,ago=e.get('ago'),upload_date=e.get('upload_date'),speaker=spk,speakerFrom=frm,carrier=carrier,topics=tp,schools=sch,otherGroups=sorted(other.get(vid,[]))))
  print(why); print(len(rows))
  c=Counter(r['speaker'] for r in rows); print(c.most_common())
  json.dump(rows,open(B+'/raw/presel.json','w'),indent=0,ensure_ascii=False)
  open(B+'/raw/presel_ids.txt','w').write('\n'.join(r['id'] for r in rows))

if __name__=='__main__': main()
