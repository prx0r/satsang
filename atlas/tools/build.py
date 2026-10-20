"""Compile seed.py (+ Wikidata/Wikipedia/Crossref caches) into atlas/nodes.json, edges.json, streams.json and
proto/data.js.  Run:  python3 tools/build.py   (from atlas/ or anywhere)."""
import json, os, re, sys, unicodedata, collections
HERE = os.path.dirname(os.path.abspath(__file__)); ATLAS = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import seed, fuzzydate

APP = os.path.join(ATLAS, '../app')
wd = json.load(open(f'{ATLAS}/cache/wd.json'))
cr = json.load(open(f'{ATLAS}/cache/crossref.json')) if os.path.exists(f'{ATLAS}/cache/crossref.json') else {}
people = {p['id']: p for p in json.load(open(f'{APP}/wisegraph/people.json'))['people']}
trads = {t['id']: t for t in json.load(open(f'{APP}/wisegraph/traditions.json'))['nodes']}
clips = json.load(open(f'{APP}/clips.json'))
by = collections.Counter(c.get('speaker') for c in clips)
about = collections.Counter(f for c in clips for f in (c.get('figures') or []))
ttopics = collections.defaultdict(collections.Counter)
for c in clips:
    for t in (c.get('topics') or []):
        if c.get('speaker'): ttopics[c['speaker']][t.split('/')[0]] += 1

TOPIC = {"c-rebirth": ["rebirth"], "c-karma": ["kamma"], "c-self-enquiry": ["self/self-enquiry"], "c-liberation": ["awakening"],
         "p-jhana": ["jhana"], "p-anapanasati": ["meditation/breath"]}
topic_n = collections.Counter(t for c in clips for t in (c.get('topics') or []))
for k in list(TOPIC):
    TOPIC[k] = [t for t in TOPIC[k] if topic_n[t]]
    if not TOPIC[k]: TOPIC.pop(k)

def strip(s):
    return unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower()

GENERIC = {"maharaj", "rinpoche", "swami", "sayadaw", "ajahn", "ajaan", "bhikkhu", "thera", "sister", "brother", "master",
           "saint", "tantra", "sutra", "sutras", "upanisad", "upanishad", "school", "order", "society", "the", "of", "and",
           "founded", "council", "rabbi", "sri", "shri", "mata", "lama", "roshi", "zen", "ishraqi", "line"}
VARIANTS = {
    "the-buddha": ["buddha", "gautama", "siddhartha"], "c-rebirth": ["rebirth", "reincarnation", "samsara", "metempsychosis", "transmigration"],
    "c-karma": ["karma", "kamma"], "c-liberation": ["moksha", "nirvana", "kaivalya", "mukti"],
    "c-nonduality": ["nondual", "non-dual", "nonduality", "advaita", "non-duality"], "c-emptiness": ["emptiness", "sunyata", "shunyata"],
    "c-brahman": ["brahman"], "c-atman": ["atman"], "c-the-one": ["the one", "monad", "henad"],
    "c-recognition": ["pratyabhijna"], "c-spanda": ["spanda"], "c-matrika": ["matrika", "phoneme"],
    "c-kundalini": ["kundalini", "chakra", "cakra"], "c-emanation": ["emanation"], "c-apophasis": ["apophatic", "via negativa", "negative theology"],
    "c-imaginal": ["imaginal", "mundus imaginalis", "alam al-mithal", "world of images"], "c-light": ["illumination", "ishraq"],
    "c-unity-of-being": ["wahdat al-wujud", "unity of being", "unity of existence"], "c-ein-sof": ["ein sof", "sefirot", "sephirot"],
    "c-dao": ["dao", "tao", "wu wei"], "c-buddha-nature": ["buddha-nature", "buddha nature", "tathagatagarbha"], "c-anekanta": ["anekantavada", "anekanta"],
    "c-logos": ["logos"], "c-self-enquiry": ["self-enquiry", "self-inquiry", "who am i", "atma vichara"],
    "p-anapanasati": ["anapanasati", "mindfulness of breathing"], "p-vipassana": ["vipassana", "insight meditation"],
    "p-jhana": ["jhana", "dhyana", "samatha"], "p-zazen": ["zazen", "shikantaza", "sitting meditation"], "p-koan": ["koan", "kung-an", "gong'an"],
    "p-mahamudra": ["mahamudra"], "p-six-yogas": ["six yogas", "six dharmas", "tummo"], "p-dzogchen": ["dzogchen", "great perfection"],
    "p-nyasa": ["nyasa"], "p-japa": ["japa"], "p-atma-vichara": ["self-enquiry", "self-inquiry", "who am i"], "p-pranayama": ["pranayama"],
    "p-kriya": ["kriya"], "p-theurgy": ["theurgy"], "p-jesus-prayer": ["jesus prayer", "hesychas"], "p-dhikr": ["dhikr", "zikr"],
    "p-middle-pillar": ["middle pillar"], "p-neidan": ["neidan", "internal alchemy", "inner alchemy"],
    "ev-ims-1975": ["insight meditation society"], "ev-theosophical-society": ["theosophical society"], "ev-golden-dawn": ["golden dawn"],
    "ev-eranos": ["eranos"], "ev-academy": ["academy"], "ev-samye-debate": ["samye", "council of lhasa"], "ev-parliament-1893": ["parliament"],
    "pl-varanasi": ["sarnath", "varanasi", "benares", "deer park"], "pl-bodh-gaya": ["bodh gaya", "bodhgaya", "bodhi tree"], "pl-kashmir": ["kashmir"],
    "pl-tiruvannamalai": ["tiruvannamalai", "arunachala"], "pl-samye": ["samye"], "pl-eiheiji": ["eihei-ji", "eiheiji"], "pl-wat-pah-pong": ["pah pong", "pa phong"],
    "pl-shaolin": ["shaolin"], "pl-nalanda": ["nalanda"], "d-shiva": ["shiva", "siva", "bhairava"], "d-krishna": ["krishna"], "d-kali": ["kali"],
    "d-vajradhara": ["vajradhara"], "d-hermes-trismegistus": ["hermes"], "d-dakshinamurti": ["dakshinamurti", "dakshinamurthy"], "d-tripurasundari": ["tripura", "lalita"],
    "d-rishabhanatha": ["rishabha", "rsabha", "tirthankara"], "ipk": ["pratyabhijna", "isvarapratyabhijna", "ishvarapratyabhijna"], "ipv": ["vimarsini", "vimarshini"],
    "ptv": ["paratrisika", "paratrimshika", "paratrishika"], "mmk": ["mulamadhyamakakarika", "fundamental verses"], "kaula": ["kaula", "kula"], "krama": ["krama"],
    "shiva-sutras": ["shiva sutras", "siva sutras", "shivasutra"], "spanda-karika": ["spanda"], "vijnana-bhairava": ["vijnana bhairava", "vijnanabhairava"],
    "malinivijayottara": ["malini"], "pali-canon": ["pali canon", "tipitaka"], "kagyu": ["kagyu"], "gelug": ["gelug"],
    "advaita": ["advaita"], "rinzai-zen": ["rinzai", "linji school"], "soto-zen": ["soto", "caodong"], "thai-forest": ["forest tradition", "kammatthana"],
    "inchegeri": ["inchegeri"], "kashmir-shaivism": ["kashmir shaivism", "trika", "kashmir saivism"], "shri-vidya": ["sri vidya", "shri vidya", "srividya"],
    "ramakrishna-order": ["ramakrishna"], "theosophy": ["theosophy", "theosophical"], "illuminationism": ["illumination", "ishraq"],
    "kriya-yoga": ["kriya"], "direct-path": ["direct path"], "mahavira": ["mahavira", "vardhamana"], "laozi": ["lao tzu", "lao-tzu"],
    "daodejing": ["tao te ching", "daodejing"], "zhuangzi": ["zhuangzi", "chuang tzu", "zhuang zhou"], "corpus-hermeticum": ["hermetica", "pimander", "poimandres"],
    "enneads": ["enneads"], "theology-of-aristotle": ["theology of aristotle"], "hikmat-al-ishraq": ["philosophy of illumination", "hikmat al-ishraq"],
    "asfar": ["asfar", "four journeys", "transcendent theosophy"], "zohar": ["zohar"], "platform-sutra": ["platform sutra"], "nisvasa": ["nisvasa"],
    "jesus": ["jesus", "christ"], "dalai-lama": ["dalai lama"], "papaji": ["poonja", "papaji"], "goenka": ["goenka"], "u-ba-khin": ["ba khin"],
    "ajahn-chah": ["ajahn chah", "chah"], "ajahn-mun": ["ajahn mun", "mun bhuridatto"], "ajaan-lee": ["ajaan lee", "ajahn lee"], "ajaan-fuang": ["fuang"],
    "tiantong-rujing": ["rujing"], "philokalia": ["philokalia"], "swami-ram": ["swami ram"], "mahtab-kak": ["mahtab", "mehtab"],
    "sefer-yetzirah": ["sefer yetzirah", "yetzirah"], "bahir": ["bahir"], "hekhalot": ["hekhalot", "merkabah"], "lurianic": ["lurianic"],
    "dt-suzuki": ["d. t. suzuki", "d.t. suzuki", "daisetz"], "pseudo-dionysius": ["dionysius"], "marsilio-ficino": ["ficino"], "pico": ["pico"],
    "brahma-sutras": ["brahma sutra", "brahmasutra"], "bhagavad-gita": ["gita"], "yoga-sutras": ["yoga sutra", "yogasutra"],
    "the-buddha-x": [],
}

def variants(n):
    out = set()
    for s in [n['label'], (wd['entities'].get(_qid(n['id']) or '', {}) or {}).get('label')] + VARIANTS.get(n['id'], []) + n['alt']:
        if not s: continue
        s2 = strip(re.sub(r'\(.*?\)', '', s)).strip()
        if len(s2) >= 3: out.add(s2)
        if n['kind'] in ('person', 'scholar'):
            words = [w for w in re.split(r'[\s\-]+', s2) if w and w not in GENERIC]
            if words and len(words[-1]) >= 5: out.add(words[-1])
            if words and len(words[0]) >= 6 and n['kind'] == 'person': out.add(words[0])
    return out

def _qid(nid):
    return (wd['resolve'].get(nid) or {}).get('qid')

def wp_text(nid):
    q = _qid(nid)
    p = f'{ATLAS}/cache/wp/{q}.txt'
    return strip(open(p).read()) if q and os.path.exists(p) else None

def enwiki(nid):
    q = _qid(nid)
    return (wd['entities'].get(q or '', {}) or {}).get('enwiki')

NODES = {}
for n in seed.N:
    t = fuzzydate.parse(n['when']) if n['when'] else None
    alt = [fuzzydate.parse(n['trad'])] if n['trad'] else []
    q = _qid(n['id']); ent = wd['entities'].get(q or '', {}) or {}
    legacy = None
    if n['legacy'] == 'people' or n['id'] in people:
        legacy = {"table": "people", "id": n['id'], "kind": people[n['id']]['kind']} if n['id'] in people else None
    elif n['legacy'] == 'traditions' or n['id'] in trads:
        legacy = {"table": "traditions", "id": n['id'], "kind": trads[n['id']]['kind']} if n['id'] in trads else None
    st = next((s for s in seed.STREAMS if s[0] == n['stream']), None)
    tradition = people[n['id']]['tradition'] if n['id'] in people else (n['id'] if n['id'] in trads else (st[6] or st[5]) if st else None)
    node = {
        "id": n['id'], "kind": n['kind'], "label": n['label'],
        "stream": n['stream'], "streams": sorted(set(([n['stream']] if n['stream'] else []) + n['streams'])),
        "time": t, "time_alt": alt,
        "ids": {k: v for k, v in {"wikidata": q, "enwiki": ent.get('enwiki'), "orcid": (ent.get('orcid') or [None])[0]}.items() if v},
        "tradition": tradition, "legacy": legacy,
    }
    if n['place']: node['place'] = n['place']
    if n['note']: node['note'] = n['note']
    if n['alt']: node['alt'] = n['alt']
    if n['id'] in by or n['id'] in about:
        node['talks'] = {"by": by.get(n['id'], 0), "about": about.get(n['id'], 0)}
        if ttopics.get(n['id']): node['talks']['topics'] = [k for k, _ in ttopics[n['id']].most_common(5)]
    if n['kind'] == 'scholar': node['works'] = []
    if n['id'] in TOPIC:
        node['talks'] = {"tagged": sum(topic_n[t] for t in TOPIC[n['id']]), "topics": TOPIC[n['id']]}
    NODES[n['id']] = node

# ---------------- works -> node.works + edges
EDGE_FROM_WORK = {"critical_edition": "critical_edition_of", "translation": "translated", "book": "commentary_on", "article": "commentary_on"}
E_OUT = []
wcount = collections.Counter()
for w in seed.W:
    wcount[w['scholar']] += 1
    wid = f"w-{w['scholar']}-{wcount[w['scholar']]}"
    k = w['scholar'] + '|' + w['title']; c = cr.get(k) or {}
    doi = w['doi']
    if not doi and c.get('score', 0) >= 0.85 and c.get('year') and abs(c['year'] - w['year']) <= 1 and c.get('type') in ('book', 'monograph', 'edited-book'):
        doi = c['doi']
    work = {"id": wid, "title": w['title'], "year": w['year'], "kind": w['kind'], "publisher": w['publisher'], "lang": w['lang'],
            "treats": w['treats']}
    if doi: work['doi'] = doi; work['url'] = f"https://doi.org/{doi}"
    if w['url']: work['url'] = w['url']
    if w['note']: work['note'] = w['note']
    NODES[w['scholar']]['works'].append(work)
    sc = NODES[w['scholar']]['label']
    cite = f"{sc}, {w['title']} ({w['publisher']}, {w['year']})"
    for tx in w['treats']:
        et = EDGE_FROM_WORK[w['kind']]
        if et == 'commentary_on' and next(n for n in seed.N if n['id'] == tx)['kind'] != 'text': et = 'studied'
        E_OUT.append(dict(src=w['scholar'], type=et, dst=tx, conf="high", lineage=None, note=None, basis=None,
                          contested=None, when=str(w['year']), work=wid,
                          prov=[{"cite": cite, **({"url": work['url']} if work.get('url') else {}), "check": "work"}]))

# ---------------- edges
SRC_TIME = {"commented_on", "translated", "studied", "critical_edition_of", "commentary_on", "synthesis_of", "opposed", "expounds",
            "located_at", "schism_from", "founded_by"}
LEGACY_TYPE = {"teacher_of": "teacher_of", "initiated": "teacher_of", "influenced": "influenced", "academic_teacher_of": "teacher_of",
               "doctoral_advisor_of": "teacher_of"}
KIND_SCHOOL = {"school", "lineage"}

def edge_time(e):
    if e.get('when'):
        return fuzzydate.parse(e['when'])
    a, b = NODES[e['src']].get('time'), NODES[e['dst']].get('time')
    t = e['type']
    if t == 'parallels':
        return None
    def pick(x, derived_from):
        if not x: return None
        y = dict(x); y['derived'] = derived_from; return y
    if t in ('teacher_of', 'initiated', 'academic_teacher_of', 'doctoral_advisor_of') and a and b and a.get('start') and b.get('start'):
        s = max(a['start'], b['start'])
        ends = [z for z in (a.get('end'), b.get('end')) if z]
        en = min(ends) if ends else None
        if en is not None and en < s: en = s
        conf = min(a['confidence'], b['confidence'], key=lambda c: fuzzydate.CONF_RANK[c])
        lab = (f"c. {s}" if s > 0 else f"c. {-s} BCE") + (f"–{en}" if en and en > 0 and en != s else "")
        return {"start": s, "end": en, "circa": True, "precision": "derived", "basis": "historical" if e.get('basis') != 'traditional' else 'traditional',
                "confidence": conf, "label": lab, "derived": "overlap of lives"}
    if t == 'founded':
        return pick(b, "start of the founded node") or pick(a, "life of the founder")
    if t in SRC_TIME:
        return pick(a, "life of the source") or pick(b, "date of the target")
    return pick(b, "date of the influenced") or pick(a, "date of the source")

prov_stats = collections.Counter()
def provenance(e):
    if e.get('prov'):
        return e['prov']
    out = []
    if e.get('cite'):
        c = e['cite']
        out.append({"cite": c, "url": c, "check": "cited"} if c.startswith('http') else {"cite": c, "check": "cited"})
    s, d = e['src'], e['dst']
    for art, other in ((d, s), (s, d)):
        txt = wp_text(art)
        if txt is None: continue
        for v in sorted(variants(NODES[other] | {"alt": seed_alt.get(other, [])}), key=len, reverse=True):
            if re.search(r'(?<![a-z])' + re.escape(v) + r'(?![a-z])', txt):
                title = enwiki(art)
                out.append({"cite": f"Wikipedia, \"{title}\"", "url": "https://en.wikipedia.org/wiki/" + title.replace(' ', '_'),
                            "check": "mentioned", "match": v})
                return out
    # a scholar's own work on the target (or on a text by / about the target)
    if NODES[s]['kind'] == 'scholar':
        rel = {d} | {x['dst'] for x in seed.E if x['src'] == d and x['type'] in ('founded', 'commented_on')} | \
              {x['src'] for x in seed.E if x['dst'] == d and x['type'] == 'expounds'}
        for w in NODES[s].get('works', []):
            if rel & set(w['treats']):
                out.append({"cite": f"{NODES[s]['label']}, {w['title']} ({w['publisher']}, {w['year']})", **({"url": w['url']} if w.get('url') else {}), "check": "work"})
                return out
    if out:
        return out
    # nothing matched: cite the most relevant article/entity, marked unverified
    for art in (d, s):
        if enwiki(art):
            title = enwiki(art)
            out.append({"cite": f"Wikipedia, \"{title}\"", "url": "https://en.wikipedia.org/wiki/" + title.replace(' ', '_'), "check": "unverified"})
            return out
    for art in (s, d):
        if _qid(art):
            out.append({"cite": f"Wikidata {_qid(art)}", "url": f"https://www.wikidata.org/wiki/{_qid(art)}", "check": "unverified"})
            return out
    out.append({"cite": "Wiser atlas seed (curated); source needed", "check": "needs_source"})
    return out

seed_alt = {n['id']: n['alt'] for n in seed.N}
for n in seed.N:  # node dict lacks 'alt' key sometimes; variants() expects it
    NODES[n['id']].setdefault('alt', n['alt'])

EDGES = []
for i, e in enumerate(list(seed.E) + E_OUT):
    rec = {"id": f"e{i + 1:04d}", "from": e['src'], "to": e['dst'], "type": e['type'], "conf": e['conf'],
           "basis": e.get('basis') or "historical", "time": edge_time(e), "provenance": provenance(e)}
    if e.get('lineage'): rec['lineage'] = e['lineage']
    if e.get('note'): rec['note'] = e['note']
    if e.get('contested'): rec['contested'] = {"status": "contested", "note": e['contested']}
    if e.get('work'): rec['work'] = e['work']
    lt = LEGACY_TYPE.get(e['type'])
    if e['type'] == 'founded' and NODES[e['dst']]['kind'] in KIND_SCHOOL: lt = 'lineage_of'
    if lt: rec['legacy_type'] = lt
    s1, s2 = NODES[e['src']].get('stream'), NODES[e['dst']].get('stream')
    if s1 and s2 and s1 != s2: rec['cross_stream'] = True
    prov_stats[rec['provenance'][-1]['check']] += 1
    EDGES.append(rec)

for n in NODES.values():
    if not n.get('alt'): n.pop('alt', None)

# ---------------- streams
INK = {"vedic": "#a86f14", "upanishadic": "#9a7414", "vedanta": "#8a5a0c", "yoga": "#b07a2a", "shaiva-tantra": "#c0502a",
       "kaula-krama": "#a8382a", "trika": "#d0653a", "shri-vidya": "#b04a5a", "early-buddhist": "#1f7a6e", "theravada": "#23866f",
       "mahayana": "#3f8f5a", "vajrayana": "#6a5aa8", "chan-zen": "#3a7a9a", "jain": "#7a8a2a", "taoist": "#2f7f6a", "greek": "#8a6a2a",
       "neoplatonic": "#9a7a3a", "christian-mystic": "#7a5a3a", "hermetic": "#8a6f3c", "modern-esoteric": "#7a5c3e", "occult": "#9a2f4a",
       "pagan": "#3f7a3a", "sufi": "#1f7a7a", "ishraqi": "#2a8a8a", "kabbalah": "#5a4aa0", "modern-nondual": "#44495a"}
SYMBOL = {"vedic": "agni", "upanishadic": "bindu", "vedanta": "purna", "yoga": "lotus", "shaiva-tantra": "trident", "kaula-krama": "yoni",
          "trika": "triad", "shri-vidya": "yantra", "early-buddhist": "wheel", "theravada": "wheel", "mahayana": "wheel-hub", "vajrayana": "vajra",
          "chan-zen": "enso", "jain": "siddhashila", "taoist": "taiji", "greek": "monad", "neoplatonic": "emanation", "christian-mystic": "cross",
          "hermetic": "mercury", "modern-esoteric": "ouroboros", "occult": "pentagram", "pagan": "triple-moon", "sufi": "spiral", "ishraqi": "sun",
          "kabbalah": "tree", "modern-nondual": "vesica"}
lanes = []
for order, (sid, label, group, span, colour, fam, school) in enumerate(seed.STREAMS):
    lanes.append({"id": sid, "label": label, "group": group, "order": order, "span": fuzzydate.parse(span), "colour": colour,
                  "ink": INK[sid], "symbol": SYMBOL[sid],
                  "legacy": {"family": fam, "school": school}, "nodes": sum(1 for n in NODES.values() if n['stream'] == sid)})
cross = collections.Counter()
for e in EDGES:
    if e.get('cross_stream') and e['type'] not in ('parallels',):
        a, b = NODES[e['from']]['stream'], NODES[e['to']]['stream']
        cross[(a, b)] += 1
STREAMS = {"_note": "Swimlanes for the Wiser Atlas timeline. Lanes are ordered top to bottom; groups band them. 'links' counts cross-stream edges (influence, transmission, commentary, translation) between lanes.",
           "groups": [{"id": g, "label": l} for g, l in seed.GROUPS], "lanes": lanes,
           "links": [{"from": a, "to": b, "edges": n} for (a, b), n in cross.most_common()]}

meta = {"version": "atlas-v2-seed-0.1", "built": __import__('datetime').datetime.now(__import__('zoneinfo').ZoneInfo('Asia/Phnom_Penh')).date().isoformat(),
        "license_note": "metadata only; no transcripts, no media", "counts": dict(collections.Counter(n['kind'] for n in NODES.values())),
        "edges": len(EDGES), "provenance_checks": dict(prov_stats)}
json.dump({"_meta": meta, "nodes": list(NODES.values())}, open(f'{ATLAS}/nodes.json', 'w'), ensure_ascii=False, indent=1)
json.dump({"_meta": meta, "edges": EDGES}, open(f'{ATLAS}/edges.json', 'w'), ensure_ascii=False, indent=1)
json.dump(STREAMS, open(f'{ATLAS}/streams.json', 'w'), ensure_ascii=False, indent=1)
os.makedirs(f'{ATLAS}/proto', exist_ok=True)
with open(f'{ATLAS}/proto/data.js', 'w') as f:
    f.write("window.ATLAS=" + json.dumps({"meta": meta, "nodes": list(NODES.values()), "edges": EDGES, "streams": STREAMS}, ensure_ascii=False, separators=(',', ':')) + ";\n")
print(json.dumps(meta, indent=1))
