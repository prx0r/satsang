#!/usr/bin/env python3
"""ext-47-past-lives (2026-10-24): the owner's research seed for the flagship course "How to discern past lives".
Writes candidates.json, people-additions.json, edges-additions.json and app/site/data/wisegraph/resources-past-lives.json.
Every video id below was read off the official channel/playlist page and checked with YouTube oEmbed + the embed page
(playable in embed, duration) on 2026-10-24 (cache: /tmp/ytm, tools/yt-meta.py embed|desc). No transcripts are copied:
Beth Upton transcript pages and the Lakshmanjoo Academy verse page are LINKED only (course item `transcript`).
Run: python3 sources/ext-47-past-lives/build.py   (then merge-sources.py -> build-clips.py, see REPORT.md)
"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); WISER = os.path.dirname(os.path.dirname(HERE)); APP = os.path.join(WISER, 'app')
CHECKED = '2026-10-24'

def row(vid, speaker, teacher, title, yt, channel, dur, views, year, tradition, traditions, region, topics, carrier='own', figures=(), yearFrom='upload-relative', published=None):
    return {'id': vid, 'teacher': teacher, 'speaker': speaker, 'speakerFrom': 'channel-default', 'title': title, 'ytTitle': yt, 'channel': channel,
            'kind': 'human', 'media': 'youtube', 'checked': CHECKED, 'dur': dur, 'sec': dur, 'format': 'horizontal', 'carrier': carrier, 'setting': 'talk',
            'region': region, 'tradition': tradition, 'traditions': traditions, 'figures': list(figures), 'topics': [t for t, _ in topics],
            'published': published, 'year': year, 'yearFrom': yearFrom, 'views': views,
            'tags': {'v': 1, 'topics': [[t, c, 'title'] for t, c in topics], 'lang': ['en', 0.9, 'rule']}}

C = []
# --- Bettina Sharada Bäumer: Vijñāna Bhairava Tantra retreat lectures (Swami Rama Sadhaka Grama, Rishikesh, Nov 2014; her own channel,
#     playlist PLHROeEJSfAPSWxWFdunW_cTRcOF4sQLPP, linked from utpaladeva.in). Lectures 4, 6, 8, 10, 15, 17 + Mangala were already live.
VBT = [('hm6HIqlovWo', 'Vijnana Bhairava 1 - INTRODUCTION', 4559, 28562), ('bYWa-giW7tc', 'Vijnana Bhairava 2 (Verse 1 to Verse 11)', 3834, 8256),
       ('U422lV4-R9g', 'Vijnana Bhairava  3  (Verse 12 to Verse 23)', 5319, 4657), ('4mr0LSZOa70', 'Vijnana Bhairava 5  (Verse 28 to Verse 35)', 5941, 2433),
       ('07HhVfQ2UOE', 'Vijnana Bhairava 7  (Verse 43 to Verse 60)', 5162, 1503), ('ujSeDB5Xya4', 'Vijnana Bhairava 9 (Verse 72 to Verse 83)', 3977, 810),
       ('11PnHNOGq14', 'Vijnana Bhairava  11', 4818, 829), ('g4McSOzIs7I', 'Vijnana Bhairava  12', 4226, 759), ('CJNrHpRYSbQ', 'Vijnana Bhairava 13', 5495, 817),
       ('19kC0dESdwg', 'Vijnana Bhairava 14', 5036, 772), ('6VyuTAuj3oM', 'Vijnana Bhariva 16', 5439, 855)]
for vid, yt, dur, views in VBT:
    t = ' '.join(yt.replace('Bhariva', 'Bhairava').split())
    C.append(row(vid, 'bettina-baumer', 'Bettina Sharada Bäumer', t.replace('Vijnana Bhairava', 'Vijñāna Bhairava Tantra, retreat lecture'), yt, 'Bettina Sharada Bäumer',
                 dur, views, 2020, 'kashmir-shaivism', ['kashmir-shaivism'], 'hindu', [('texts/tantra', 0.9), ('meditation', 0.7), ('consciousness', 0.6)], figures=['vijnana-bhairava']))

# --- Beth Upton (her own channel UCEhrqktws4X8qRaAr-JJwPQ, linked from bethupton.com/teachings-talks): Pa-Auk method lessons.
UP = [('uZ02opOsQwY', 'Why should I believe in past lives?', 328, 3310, 2024, [('rebirth', 0.9), ('faith', 0.6)]),
      ('tcur6EplDVA', 'Discerning the rebirth moment', 367, 1653, 2024, [('rebirth', 0.9), ('dependent-origination', 0.8)]),
      ('VUq2MkODCBE', 'The tenth link of dependent origination - bhava paccaya jati', 302, 542, 2024, [('dependent-origination', 0.9), ('rebirth', 0.8)]),
      ('-aa1pGtGHXw', 'Discerning future nama rupa', 324, 1241, 2024, [('rebirth', 0.9), ('dependent-origination', 0.8)]),
      ('SGd6A3kYg-A', 'Practicing vipassana past, present, and future', 289, 1556, 2024, [('rebirth', 0.8), ('impermanence', 0.8), ('dependent-origination', 0.6)]),
      ('CMlFd94Dtlk', 'Discerning the undoing of dependent origination', 404, 1684, 2024, [('dependent-origination', 0.9), ('awakening', 0.7), ('rebirth', 0.7)]),
      ('KFjdByRnQkE', 'Which kamma produces our next life?', 983, 2912, 2025, [('kamma', 0.9), ('rebirth', 0.9)]),
      ('wCIhw-ujFso', 'Craving and future lives', 186, 1280, 2026, [('craving', 0.9), ('rebirth', 0.9)]),
      ('ml_PjiWVTec', 'Discerning causes and conditions', 375, 1072, 2023, [('dependent-origination', 0.9), ('rebirth', 0.7)])]
for vid, t, dur, views, yr, tp in UP:
    C.append(row(vid, 'beth-upton', 'Beth Upton', t[0].upper() + t[1:], t, 'Beth Upton', dur, views, yr, 'pa-auk', ['pa-auk', 'theravada'], 'buddhism', tp))

# --- Sayalay Dīpaṅkarā (her own channel "Sayalay Dipankara")
C.append(row('Um--CNljhLs', 'sayalay-dipankara', 'Sayalay Dipankara', 'How to recall your past lives: dependent origination', 'How to Recall your Past Lives - Dependent Origination | Sayalay Dipankara',
             'Sayalay Dipankara', 4104, 3422, 2022, 'pa-auk', ['pa-auk', 'theravada'], 'buddhism', [('rebirth', 0.9), ('dependent-origination', 0.8), ('jhana', 0.6)]))
C.append(row('1Ed8ILABR3U', 'sayalay-dipankara', 'Sayalay Dipankara', 'Process of rebirth and its cause', 'Process of Rebirth and its Cause | Ven. Sayalay Dipankara',
             'Sayalay Dipankara', 2585, 1835, 2022, 'pa-auk', ['pa-auk', 'theravada'], 'buddhism', [('rebirth', 0.9), ('kamma', 0.7), ('death', 0.6)], yearFrom='description', published='2022-06-26'))

# --- Pa-Auk Sayadaw: Dependent Origination, Korea 2008, part 2 of 2. Uploaded by Setti Wessels, the documentary maker whose film
#     "Sketch of an Excellent Man" Pa-Auk Meditation Centre Singapore hosts "with courtesy from settiwessels.com"
#     (https://sites.google.com/pamc.org.sg/sayadawdhamma). carrier 'publisher' (trusted documentarian, not the monastery itself).
C.append(row('ypKa1J7KUow', 'pa-auk-sayadaw', 'Pa-Auk Sayadaw', 'Dependent origination (part 2 of 2), Korea 2008', 'Pa Auk Sayadaw 2of2 Dependent Origination English (Korea 2008) with English Subtitles',
             'Setti Wessels', 5056, 7609, 2008, 'pa-auk', ['pa-auk', 'burmese', 'theravada'], 'buddhism', [('dependent-origination', 0.9), ('rebirth', 0.8)], carrier='publisher', yearFrom='title'))

# --- Ven. Sugatavaṃsa: Abhidhamma Part VII, Dependent Origination (Paṭiccasamuppāda), English, from 21 July 2022. Pa-Auk Meditation Centre
#     Singapore channel, playlist PL3No3Acmeuj3aC2zcMEYGZzhHxBsUGJ8y, linked from https://sites.google.com/pamc.org.sg/sgtvsdhamma
SG = [('jwIel8vss9o', 1, '2022-07-21', 2629, 216), ('Agwh3PJoVOY', 2, '2022-08-04', 4068, 87), ('96QhDCpr-Wo', 3, '2022-08-11', 3492, 75),
      ('wQndqt6YEtA', 4, '2022-08-18', 3464, 48), ('4_oQeUcfU74', 5, '2022-08-25', 3854, 39), ('qzNBCXGobiU', 6, '2022-09-01', 4755, 38),
      ('QOYrE90EBMM', 7, '2022-09-08', 4537, 63), ('4CDmDrxhXLQ', 8, '2022-09-15', 4088, 57), ('gQ_Caq3QI3k', 9, '2022-09-22', 3980, 47),
      ('3oltU3I0134', 10, '2022-09-29', 3901, 50), ('ueoktqr6s0A', 11, '2022-10-06', 2951, 39)]
for vid, n, d, dur, views in SG:
    C.append(row(vid, 'sugatavamsa', 'Ven. Sugatavaṃsa', f'Dependent origination (Abhidhamma part 7), lesson {n}', f'{d.replace("-", "")} Abhidhamma Part 7 Paṭiccasamuppāda {n:02d} - by Ven Sugatavaṃsa',
                 'Pa-Auk Meditation Centre Singapore', dur, views, 2022, 'pa-auk', ['pa-auk', 'theravada'], 'buddhism', [('dependent-origination', 0.9), ('rebirth', 0.6), ('texts', 0.5)],
                 carrier='own-org', yearFrom='title', published=d))

# --- Bhikkhu Anālayo: Rebirth in early Buddhism and current research, Harvard Divinity School, April 2018, with Daniel Aitken and
#     Charles Hallisey (Āgama Research Group, his own research group's channel)
C.append(row('3hlvwOZupoU', 'bhikkhu-analayo', 'Bhikkhu Anālayo', 'Rebirth in early Buddhism and current research (Harvard, April 2018)',
             'Bhikkhu Anālayo, Daniel Aitken, Charles Hallisey | Rebirth in early Buddhism | April 2018', 'Āgama Research Group', 8076, 662, 2018,
             'early-suttas', ['early-suttas', 'theravada'], 'buddhism', [('rebirth', 0.9)], carrier='own-org', yearFrom='title'))

# --- Dr R. Ramanand: Fundamental Tenets of Kashmir Śaivism, four lectures, January 2023 (P.G. Department of Sanskrit, Sree Krishna College,
#     Guruvayur, with the Abhinavagupta Institute of Advanced Studies)
RM = [('ukNWsqtv9Uk', 'I', 5474, 3848), ('_eZ1f89L5ws', 'II', 5905, 1534), ('ebHkjWUzX0c', 'III', 5422, 1975), ('k7qh-TQyuUg', 'IV', 6604, 1286)]
for vid, n, dur, views in RM:
    C.append(row(vid, 'r-ramanand', 'Dr R. Ramanand', f'Fundamental tenets of Kashmir Śaivism, lecture {n}', f'FUNDAMENTAL TENETS OF KASHMIR SAIVISM BY DR. R. RAMANAND, Lecture {n}',
                 'P.G. Department of Sanskrit, Sree Krishna College,', dur, views, 2023, 'kashmir-shaivism', ['kashmir-shaivism'], 'hindu',
                 [('texts/tantra', 0.8), ('consciousness', 0.6), ('reality', 0.5)], carrier='institution'))

people = [
 {'id': 'beth-upton', 'name': 'Beth Upton', 'kind': 'speaker', 'role': 'teacher', 'tradition': 'pa-auk', 'traditions': ['pa-auk', 'theravada'], 'years': 'b. 1982',
  'bio': 'English meditation teacher; ordained as a nun at Pa-Auk in Myanmar in 2008 and trained five years under Pa-Auk Sayadaw, disrobing in 2018. Teaches the Pa-Auk samatha-vipassanā system one to one and online, on a donation basis, with short video lessons on every stage.',
  'channels': [{'name': 'Beth Upton', 'id': 'UCEhrqktws4X8qRaAr-JJwPQ', 'url': 'https://www.youtube.com/channel/UCEhrqktws4X8qRaAr-JJwPQ', 'official': True}],
  'links': {'Website': 'https://bethupton.com/', 'Online groups': 'https://bethupton.com/online-instruction/'}, 'aliases': ['beth upton'], 'works': [],
  'source_url': 'https://bethupton.com/about-me/', 'verified_on': CHECKED, 'confidence': 'high'},
 {'id': 'sayalay-dipankara', 'name': 'Sayalay Dipankara', 'kind': 'speaker', 'tradition': 'pa-auk',
  'channels': [{'name': 'Sayalay Dipankara', 'official': True}]},
 {'id': 'pa-auk-sayadaw', 'name': 'Pa-Auk Sayadaw', 'kind': 'speaker', 'tradition': 'burmese'},
 {'id': 'sugatavamsa', 'name': 'Ven. Sugatavaṃsa', 'short': 'Sugatavaṃsa', 'kind': 'speaker', 'role': 'teacher', 'tradition': 'pa-auk', 'traditions': ['pa-auk', 'theravada'],
  'bio': 'Theravāda monk who teaches the Abhidhamma and Pāli courses at Pa-Auk Meditation Centre Singapore, including a full English course on dependent origination (2022, repeated 2025).',
  'channels': [{'name': 'Pa-Auk Meditation Centre Singapore', 'id': 'UCUJYhS7U-1AnCxqlRJ42TeQ', 'url': 'https://www.youtube.com/channel/UCUJYhS7U-1AnCxqlRJ42TeQ', 'official': True}],
  'links': {'Teacher page': 'https://sites.google.com/pamc.org.sg/sgtvsdhamma'}, 'aliases': ['sugatavamsa', 'ven sugatavamsa', 'venerable sugatavamsa'], 'works': [],
  'source_url': 'https://sites.google.com/pamc.org.sg/sgtvsdhamma', 'verified_on': CHECKED, 'confidence': 'medium'},
 {'id': 'r-ramanand', 'name': 'Dr R. Ramanand', 'short': 'R. Ramanand', 'kind': 'speaker', 'role': 'scholar', 'tradition': 'kashmir-shaivism', 'traditions': ['kashmir-shaivism'],
  'bio': 'Indian scholar of tantra and Kashmir Śaivism linked with the Abhinavagupta Institute of Advanced Studies; gave four public lectures on the fundamental tenets of Kashmir Śaivism at Sree Krishna College, Guruvayur, in January 2023.',
  'aliases': ['r ramanand', 'dr ramanand', 'ramanand'], 'works': [],
  'source_url': 'https://www.youtube.com/watch?v=ukNWsqtv9Uk', 'verified_on': CHECKED, 'confidence': 'medium'},
]
edges = [
 {'from': 'pa-auk-sayadaw', 'to': 'beth-upton', 'type': 'studied_with', 'conf': 'high', 'note': 'Ordained at Pa-Auk in 2008; five years training under Pa-Auk Sayadaw.', 'src': 'https://bethupton.com/about-me/', 'checked': CHECKED},
 {'from': 'beth-upton', 'to': 'pa-auk', 'type': 'lineage_of', 'conf': 'high'},
 {'from': 'sugatavamsa', 'to': 'pa-auk', 'type': 'lineage_of', 'conf': 'medium', 'note': 'Teaches the Abhidhamma courses at Pa-Auk Meditation Centre Singapore (no published account of his own training found).', 'src': 'https://sites.google.com/pamc.org.sg/sgtvsdhamma', 'checked': CHECKED},
 {'from': 'sayalay-dipankara', 'to': 'pa-auk', 'type': 'lineage_of', 'conf': 'high'},
]
# series and free audio, listed as resources (link only; Paid where paid; never bought)
R = lambda id_, title, url, kind, free, licence, people, trads, note, src=None, price=None: {k: v for k, v in {
    'id': id_, 'title': title, 'url': url, 'kind': kind, 'free': free, 'licence': licence, 'price': price, 'traditions': trads, 'people': people, 'note': note,
    'source_url': src or url, 'checked': CHECKED, 'group': 'ext-47-past-lives'}.items() if v is not None}
resources = [
 R('dyczkowski-karma-and-rebirth', 'Karma and Rebirth: a lecture by Mark Dyczkowski (free audio)', 'https://www.anuttaratrikakula.org/karma-and-rebirth/', 'audio-lecture', True,
   'free to listen on the official archive (link only)', ['mark-dyczkowski'], ['trika', 'kashmir-shaivism'], 'How karma and rebirth are causally linked in Kashmir Śaivism. Listen on the archive\'s page.'),
 R('dyczkowski-development-of-tantras-ciis-2010', 'Development of Tantras in the Context of Buddhism and Upanishads (CIIS, 15 June 2010; free audio)', 'https://www.anuttaratrikakula.org/development-of-tantras-in-the-context-of-buddhism-and-upanishads/',
   'audio-lecture', True, 'free to listen on the official archive (link only)', ['mark-dyczkowski'], ['trika', 'kashmir-shaivism'], 'A talk at the California Institute of Integral Studies: the first verse of the Tantrāloka and how the tantras grew beside Buddhism and the Upaniṣads.'),
 R('dyczkowski-locating-trika', 'Locating Trika (free course, Mark Dyczkowski)', 'https://www.anuttaratrikakula.org/locating-trika/', 'audio-course', True,
   'free to listen on the official archive (link only)', ['mark-dyczkowski'], ['trika', 'kashmir-shaivism'], 'Short units placing Abhinavagupta\'s Trika within the wider tantric corpus.'),
 R('dyczkowski-doctrine-of-vibration-course', 'The Doctrine of Vibration: 15 lectures (Mark Dyczkowski) — Paid', 'https://www.anuttaratrikakula.org/doctrine-of-vibration/', 'course', False,
   'paid course on the official archive', ['mark-dyczkowski'], ['trika', 'kashmir-shaivism'], 'The Spanda teaching chapter by chapter. Paid: US$50 for 15 audios and videos (price as listed 2026-10-24).', price='US$50'),
 R('dyczkowski-journey-through-tantraloka', 'A Journey Through the Tantrāloka: 32 lessons (Mark Dyczkowski) — Paid', 'https://www.anuttaratrikakula.org/a-journey-through-tantraloka-chapter-1-37/', 'course', False,
   'paid course on the official archive', ['mark-dyczkowski'], ['trika', 'kashmir-shaivism'], 'A tour of all 37 chapters, about 50 hours. Paid: US$100 (price as listed 2026-10-24).', price='US$100'),
 R('lakshmanjoo-paramarthasara-series', 'Paramārthasāra: Essence of the Supreme Reality, five-part video series (Swami Lakshmanjoo) — Paid', 'https://lakshmanjoo.mykajabi.com/purchase-video-series-paramathasara',
   'video-series', False, 'paid video series from the Lakshmanjoo Academy', ['swami-lakshmanjoo'], ['kashmir-shaivism'], 'Abhinavagupta\'s hundred verses with Lakshmanjoo\'s commentary, about 5 hours. Paid: US$99 (price as listed 2026-10-24).',
   src='https://www.lakshmanjooacademy.org/online-courses', price='US$99'),
 R('lakshmanjoo-wisdom-of-kashmir-shaivism-series', 'The Wisdom of Kashmir Shaivism, seven-part video series (Swami Lakshmanjoo) — Paid', 'https://www.lakshmanjooacademy.org/purchase-video-series-wisdom-of-kashmir-shaivism',
   'video-series', False, 'paid video series from the Lakshmanjoo Academy', ['swami-lakshmanjoo'], ['kashmir-shaivism'], 'The verses Lakshmanjoo chose in 1987 for daily recitation, with his explanations, about 7 hours. Paid: US$99 (price as listed 2026-10-24).',
   src='https://www.lakshmanjooacademy.org/online-courses', price='US$99'),
 R('hymc-netra-tantra-study-group', 'Netra Tantra study group, parts 1-4 (Himalayan Yoga & Meditation Center)', 'https://www.hymc.org/monthly-study-group', 'study-group', True,
   'free recordings on the centre\'s own page (link only)', ['bettina-baumer'], ['kashmir-shaivism'], 'A monthly study group reading the Netra Tantra in Bettina Bäumer\'s translation. A group\'s readings, not her own lectures.'),
 R('ramanand-fundamental-tenets-series', 'Fundamental Tenets of Kashmir Śaivism: four lectures by Dr R. Ramanand (January 2023)', 'https://www.youtube.com/watch?v=ukNWsqtv9Uk', 'video-series', True,
   'free on YouTube (official college upload)', ['r-ramanand'], ['kashmir-shaivism'], 'Four long public lectures, hosted by Sree Krishna College, Guruvayur. All four are on Satsang as full talks.'),
 R('baumer-vbt-retreat-playlist', 'Vijñāna Bhairava Tantra: complete retreat lectures (Bettina Sharada Bäumer, Rishikesh 2014)', 'https://www.youtube.com/playlist?list=PLHROeEJSfAPSWxWFdunW_cTRcOF4sQLPP', 'video-series', True,
   'free on her own YouTube channel', ['bettina-baumer'], ['kashmir-shaivism'], 'The ten-day course at Swami Rama Sadhaka Grama (Nov 2014), 17 lectures. All lectures are on Satsang as full talks.', src='https://www.ahymsin.org/docs2/News/1411Nov/06.html'),
 R('baumer-vatulanatha-playlist', 'Vātūlanātha Sūtras: 13 sūtras on sudden awakening (Bettina Sharada Bäumer, 2021)', 'https://www.youtube.com/playlist?list=PLHROeEJSfAPSLoJrKRSz4dVlQmuTdRLZR', 'video-series', True,
   'free on her own YouTube channel', ['bettina-baumer'], ['kashmir-shaivism'], 'Short talks, one per sūtra, with an introduction.'),
 R('baumer-youtube-playlists', 'Bettina Sharada Bäumer: all teaching playlists', 'https://www.youtube.com/@bettinasharadabaumer174/playlists', 'video-series', True,
   'free on her own YouTube channel (linked from utpaladeva.in)', ['bettina-baumer'], ['kashmir-shaivism'], 'Vijñāna Bhairava, Netra Tantra, Śiva Sūtras, Spanda, Pratyabhijñāhṛdayam and more.', src='https://www.utpaladeva.in/'),
 R('sugatavamsa-dependent-origination-series', 'Dependent Origination (Abhidhamma part 7): free lecture series by Ven. Sugatavaṃsa', 'https://sites.google.com/pamc.org.sg/sgtvsdhamma', 'video-series', True,
   'free from Pa-Auk Meditation Centre Singapore', ['sugatavamsa'], ['pa-auk'], 'Eleven English lessons from July 2022 (on Satsang as full talks) and a 2025 repeat; notes downloadable from the centre.'),
 R('upton-discerning-causes-and-conditions', 'Beth Upton: Discerning Causes and Conditions sequence (lessons with volunteer transcripts)', 'https://samathavipassanabhavana.wordpress.com/2024/08/16/discerning-causes-and-conditions/', 'lesson-sequence', True,
   'volunteer transcription site, not run by Beth Upton (link only)', ['beth-upton'], ['pa-auk'], 'Her video lessons on past lives, rebirth and dependent origination in order, each with a transcript made by a volunteer.'),
 R('upton-online-groups', 'Beth Upton: online groups and one-to-one guidance (donation basis)', 'https://bethupton.com/online-instruction/', 'teaching', True,
   'teacher\'s own site', ['beth-upton'], ['pa-auk'], 'Where to learn the Pa-Auk method from a trained teacher; one-to-one slots are announced in her newsletter.'),
]
J = lambda p, o: (json.dump(o, open(p, 'w'), ensure_ascii=False, indent=1), open(p, 'a').write('\n'))
J(os.path.join(HERE, 'candidates.json'), C)
J(os.path.join(HERE, 'people-additions.json'), {'people': people})
J(os.path.join(HERE, 'edges-additions.json'), {'edges': edges})
J(os.path.join(APP, 'site/data/wisegraph/resources-past-lives.json'), {'_note': 'ext-47-past-lives (sources/ext-47-past-lives/build.py). Link only; Paid marked; nothing bought.', 'resources': resources})
print(len(C), 'clips,', len(people), 'people rows,', len(edges), 'edges,', len(resources), 'resources')
