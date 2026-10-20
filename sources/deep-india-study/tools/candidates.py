# Build clip candidates from raw/flat channel listings (metadata only). Output raw/candidates.json + raw/long.json
import json, re, os
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CH = {  # key: (place_id, carrier, region, tradition, school, default_speaker, official_link_source)
 'avg_pitham':   ('arsha-vidya-gurukulam-saylorsburg', 'own-org', 'hindu', 'advaita-vedanta', 'arsha-vidya', None, 'https://arshavidya.org/ (links youtube.com/c/ArshaVidyaGurukulam)'),
 'avg_anaikatti':('arsha-vidya-gurukulam-anaikatti', 'own-org', 'hindu', 'advaita-vedanta', 'arsha-vidya', 'swami-sadatmananda', 'https://arshavidya.in/ (links youtube.com/@avganaikatti)'),
 'natha_channel':('nathas-org-natha-tradition', 'own-org', 'hindu', 'nath', 'siddha-siddhanta', 'yogi-matsyendranath-maharaj', 'https://nathas.org/en/ (links youtube.com/user/NathaChannel)'),
 'swarayoga':    ('swara-yoga-peeth-rishikesh', 'own-org', 'hindu', 'svara-yoga', 'svara-yoga', 'swami-charanashrit-giri', 'https://www.swarayoga.org/ (links youtube.com/@SwaraYogaPeeth)'),
 'dls':          ('divine-life-society-rishikesh', 'own-org', 'hindu', 'sivananda', 'vedanta-yoga', None, 'https://www.sivanandaonline.org/ (links channel UCDvqCbXY7BietQqqDrZgzOA)'),
 'ltwa':         ('ltwa-dharamsala', 'institution', 'buddhist', 'tibetan', 'gelug', None, 'https://tibetanlibrary.org/ (links channel UCNOCWZS-Sq4sYpZGh8GuHZA)'),
 'ramanasramam': ('sri-ramanasramam', 'own-org', 'hindu', 'advaita-vedanta', 'ramana', None, 'https://www.sriramanamaharshi.org/ (links youtube.com/user/SriRamanaDevotee)'),
 'kdham':        ('kaivalyadhama-lonavla', 'institution', 'hindu', 'yoga', 'patanjala-yoga', None, 'channel name match (Kaivalyadhama Yoga Institute); site footer shows a YouTube icon'),
 'kym':          ('krishnamacharya-yoga-mandiram', 'institution', 'hindu', 'yoga', 'krishnamacharya', 'kym-faculty', 'channel name match (Krishnamacharya Yoga Mandiram)'),
 'root':         ('root-institute-bodhgaya', 'own-org', 'buddhist', 'tibetan', 'gelug-fpmt', None, 'https://www.rootinstitute.ngo/ course pages cite its YouTube channel'),
 'sringeri':     ('sringeri-sharada-peetham', 'own-org', 'hindu', 'advaita-vedanta', 'sringeri', None, 'https://www.sringeri.net/ (links youtube.com/@sharadapeetham)'),
 'iat':          ('ishwar-ashram-srinagar', 'own-org?', 'hindu', 'kashmir-shaivism', 'trika', None, 'channel name match (Ishwar Ashram Trust); NOT linked from kashmirshaivainstitute.com'),
}
SPK = [  # regex -> speaker id
 (r'Viditatmananda', 'swami-viditatmananda'), (r'Tattvavidananda', 'swami-tattvavidananda'),
 (r'Dayananda', 'swami-dayananda-saraswati'), (r'Svatmavidyananda', 'swamini-svatmavidyananda'),
 (r'Muktatmananda', 'swami-muktatmananda'), (r'Sachidananda', 'swami-sachidananda-avg'),
 (r'Advayatmananda', 'swami-advayatmananda'), (r'Paraprajnananda', 'swamini-paraprajnananda'),
 (r'Pratyagbodhananda', 'swami-pratyagbodhananda'), (r'Sakshatk', 'swami-sakshatkrtananda'),
 (r'InnerLeisure|Inner Leisure|Shankarananda', 'swami-shankarananda-avg'),
 (r'Лакшминат|Lakshminath', 'yogi-lakshminath'), (r'Алламанат|Allamanath', 'yogi-allamanath'),
 (r'Матсьендранат|Matsyendranath', 'yogi-matsyendranath-maharaj'),
 (r'Atmaswarupananda', 'swami-atmaswarupananda'), (r'Chidananda', 'swami-chidananda'),
 (r'Krishnananda', 'swami-krishnananda'),
 (r'LHAKDOR|Lhakdor|ལྷག་རྡོར', 'geshe-lhakdor'),
 (r'Venkat', 'venkat-s-ramanan'), (r'Anand Ramanan', 'anand-ramanan'),
 (r'Santosh Pandey', 'santosh-pandey'), (r'Bhogal', 'r-s-bhogal'), (r'O\.\s?P\.?\s?Tiwari|Dr\. O\.', 'o-p-tiwari'),
 (r'Gache', 'tenzin-gache'), (r'Legtsok', 'tenzin-legtsok'), (r'Tenzin Zopa', 'geshe-tenzin-zopa'),
 (r'Mahasannidhanam|Bharati Tirtha|Bharathi Theertha', 'bharati-tirtha'),
 (r'Sannidhanam|Anugraha Bhash|Vidhushekhara', 'vidhushekhara-bharati'),
]
EXCL = re.compile(r'bhajan|kirtan|concert|puja|pooja|abhishek|aarti|arati|prabhat pheri|glimpse|highlight|celebration|ceremony|in focus|infocus|darshan|procession|alankara|homa|havan|pran-?pratist|kanha|ashtottara|namavali|parayana|anniversary|award|survey|food|prayer flags|liberating|jayanti puja|pattabhishek|yatra|message for|congratulat|podcast|alumni|program\b|programme\b|BVAP|sankirtana|mahamangalarathi|veena|hospital|initiatives|calamity', re.I)
def speaker(title, default):
    for rx, sid in SPK:
        if re.search(rx, title): return sid, 'title'
    return default, 'channel-default' if default else None
out, longs, skipped = [], [], 0
for key, (place, carrier, region, trad, school, dflt, linksrc) in CH.items():
    f = os.path.join(B, 'raw', 'flat', key + '.json')
    if not os.path.exists(f): continue
    d = json.load(open(f))
    for e in d['entries']:
        t = e.get('title') or ''; dur = e.get('duration')
        if not dur or dur < 60 or EXCL.search(t): skipped += 1; continue
        sid, sfrom = speaker(t, dflt)
        if key == 'avg_anaikatti' and sid == 'swami-sadatmananda': sfrom = 'inferred: chief acharya conducts the Gurukulam classes (arshavidya.in/teachers)'
        if not sid: skipped += 1; continue
        if key == 'avg_anaikatti' and not re.search(r'CLASS|Class|Satsang|Meditation|Inner|USV|USIntro', t): skipped += 1; continue
        row = dict(id=e['id'], title=t, ytTitle=t, channel=d['channel'], channelId=d['channel_id'], channelKey=key, place=place,
                   speaker=sid, speakerFrom=sfrom, carrier=carrier, region=region, tradition=trad, school=school, sec=int(dur), officialLink=linksrc,
                   year=int(e['upload_date'][:4]) if e.get('upload_date') else None, views=e.get('view_count'))
        (out if dur <= 3600 else longs).append(row)
json.dump(out, open(os.path.join(B, 'raw', 'candidates.json'), 'w'), ensure_ascii=False, indent=0)
json.dump(longs, open(os.path.join(B, 'raw', 'long.json'), 'w'), ensure_ascii=False, indent=0)
open(os.path.join(B, 'raw', 'cand_ids.txt'), 'w').write('\n'.join(r['id'] for r in out + longs) + '\n')
import collections
print('cands', len(out), 'long', len(longs), 'skipped', skipped)
print(collections.Counter(r['speaker'] for r in out).most_common())
print('long', collections.Counter(r['speaker'] for r in longs).most_common())
