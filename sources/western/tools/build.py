# Build candidates.json for the "western" group from cached metadata (oEmbed/embed checks, search rows,
# creator chapters) and internal transcripts. Transcript text never leaves transcripts-internal/.
import json, re, os, glob, datetime
from segment import cues
B = os.path.dirname(os.path.abspath(__file__)) + '/..'
APP = B + '/../../app'
TODAY = datetime.date(2026, 10, 20)
EMB = {os.path.basename(f)[:-5]: json.load(open(f)) for f in glob.glob(B + '/cache/cache/embed/*.json')}
AGE = json.load(open(B + '/raw/agemap.json'))

# ---------------- clip selection ----------------
KFA = ('tYjYL448-yY s9IS1zW6In4 kswDO60A3h8 OwCvbSiRkM8 Az9aM4J22yA _OSu1Em814U w1JRoEyOqTU 1iqZta5Jx5A 3w2_TaDME28 '
       'P4dnj0M8T2o 4or2t0229dA lLWp7n-MlCI ztLEMnrEE2s 3uJiP0Uiloc FqILkOZmpaE i5MR7pBFA0k Z5AWznA0CQ0 qEpspRmmIZ0 '
       'dnc7mOmf35A f6PFUU5iuZE cBZ-77p7yeI vctpDWt4ui4 GnEC_ERgZ1c LIAtu2l0tgY SG2ArQE83SU ciRO1VzWsk0 jfo7-cWA65s '
       'GdnR08uX53U oIBSJTRlH3Q 3v1PY5eQDbw TPFDjG2cxLk xC7ZtUdS46A DuUgFxVrnvo irDx6dcUyjQ K7fnrP33cgE').split()
KFT = ('2D2IPDRPvFY AAb0Xfpx75w 1CMWd0KW3zY xpqC24LxWus LJUNE3e7xEI zcbpDN6Ch8U VZPrIavAysY ZWdZINlJEz4 shYPmgnwS6M '
       'AWjp1aBvFvk x6QGd-7BbW0 4LoXKODc76s VtZWA1KtAt8 f1Ku-Tm_s1M VhujpXPAnUo tthRbGG9TOE fsMFPC5dKRM').split()
NAT = {
 'kfa': KFA, 'kft': KFT,
 'sadler': 'mRq0oQZKArY y8VvP9rgu_I CxLloJkjY-s qgA0Z_D4KiI zNmdWbPVXlY RyHu_dohnE4 e_dT5_vFW8Y xnn0uPQ38Fg XLcjDiqJbT4 ORKS5izOVjE 9OlMb8xvmos S7rY8sSy4fQ rm5E0Vhggw8 UDK7MMEjnY4 QbZq0tUK8eA q5A5tdzjjhw 8N0BM20ryc0'.split(),
 'esoterica': 'X7YhueEp0Mo wqC0vKeRAhg 1hAYzwrUVEg FkFMG817zQ8'.split(),
 'ltr': 'ZMFzvsZrrIo DAu1fZLNUp0 jiD3KVoDCt8'.split(),
 'cac': 'm2zz9Do-n14 FA1adN1rUmQ ytxq8KEBcPE YHtsSE2-nOI mW9UkBv7eT0 9WAPAKEKHj0 CAReW87sO8s eEoZ5NYDv8Y bA-E3z6uLJ8 gIzzjWey6BM x-rqJotbr4E E-G0uQJUTg8 uPlUIDQTfjI kv7tvJO0b6Y 6lXYmy1SyfY 3EK6iIY7Sh4 ZBCs5pOEqwI gnaXgEbE5xA TC44YK8u58g LTqA-SWkKOk'.split(),
 'wwok': 'dqUIIwNJatQ FKDclJQidiw 25yWk6VmYkQ wWIHW8vWP3Y j7dthRAm6sI'.split(),
 'rsp': '90YU6fYef1M nPN-MdEnQr4 LD-g6rNVtnE aSAGYff1MJY w_ZuDFNR5cg OEmA-_m3f7s'.split(),
 'needleman': ['xwjyxzn35Jg'],
 'shambhala': 'rk_IRkkCz2A a1VSMDeRdyU IlTtO3MEuOI'.split(),
 'vervaeke': 'V-30yuhSPV0 L2Vl8nvSUiE'.split(),
 'nottingham': '97WMjE0dn4g 0MHDVcpqkLU q3yaJUpLlW0 U6Z1Yz7zPGQ E6pCKgSoqYk 6SnEhJeEGNY qm_1R-cEJa4 l1Ghan258Jo MJsNUOIk7Q0 CSrx3rsUTyQ tk_sKUKWnSI zoekAJU3Y5k 7L0L_zqBF4I jDUNvGoQ8os ew-Rj4hWLUc'.split(),
 'steinhart': '3KLPrLrR67o fJgeKlPZxmY mkYcKRdpviU 97eWPOP0bRU i4i_tpWmDCI ViwDmuPepIM xy2F8gngvNA 0FxE-jaF1kA'.split(),
 'tsa': 'iM2kC2GJ2kw etcwtsHUNcQ 6y3L3YV4_es'.split(),
 'alexoc': ['XNCsPqjCykg'],
}
# virtual clips: (parent, start, end, segTitle, source, manual topics)
V = [
 # Krishnamurti long talks (KFA, transcripts)
 ('wA5bpeRPq_o',1444,2162,'Reincarnation, and living with death every day','t',['rebirth/western','death']),
 ('wA5bpeRPq_o',2311,2791,'Death and love go together','t',['death','kindness']),
 ('wA5bpeRPq_o',4470,5027,'A silence that is not the ending of sound','t',['meditation','thought']),
 ('UkWOAsrm7fk',1469,2129,'Effort, control and the foundation of meditation','t',['meditation','thought']),
 ('UkWOAsrm7fk',4073,4379,'Stillness that memory cannot continue','t',['meditation','impermanence']),
 ('Sv4W7lAoCYk',1738,2338,'Why all our relationships are based on conflict','t',['relationships','dukkha']),
 ('Sv4W7lAoCYk',2818,3416,'Something far beyond thought','t',['thought','awakening','freedom']),
 ('XHGo_gY92WQ',3060,3767,'Relationship as the mirror in which I see myself','t',['relationships','self']),
 ('XHGo_gY92WQ',5249,5542,'Can time have a stop? Real meditation','t',['meditation','thought']),
 # Vervaeke, Awakening from the Meaning Crisis (transcripts + chapters)
 ('Lhl51bZQlM8',450,1170,'Socrates and the Oracle at Delphi','t',['self','right-view']),
 ('Lhl51bZQlM8',2642,3359,'Socrates against the sophists: self-knowledge vs self-deception','t',['self','virtue']),
 ('neDutbcedUY',119,359,'Why Plato is an inexhaustible source','t',['texts']),
 ('neDutbcedUY',2369,3091,"Plato's cave: self-knowledge and turning toward the real",'t',['awakening','self','soul']),
 ('FvLe4BuU-NM',3149,3449,'Jesus and the kairos that transforms the self','t',['awakening','divine']),
 ('Jbwm03djuJc',88,795,'Jesus, kairos and metanoia','c',['awakening','divine']),
 ('Jbwm03djuJc',915,1265,'Agape and the death of Jesus','c',['kindness','death']),
 ('Jbwm03djuJc',1860,2146,"Paul's most excellent way: love is patient",'c',['kindness','faith']),
 ('mXfK4nicygA',147,389,'Who were the Gnostics?','t',['gnosis','dukkha']),
 ('mXfK4nicygA',1439,1680,'Existential entrapment and why gnosis is needed','t',['gnosis','dukkha','awakening']),
 ('mXfK4nicygA',2909,3265,'Ritual as enactive analogy in gnosis','t',['gnosis','meditation']),
 ('ITfUCL1yTQQ',964,1679,'The Gnostic myth as a diagnosis of existential entrapment','t',['gnosis','dukkha']),
 ('ITfUCL1yTQQ',2459,3206,'Plotinus and the levels of reality','t',['divine/the-one','self','awakening']),
 ('oYwriTk-2A4',90,570,"What is a daimon? Plato's daimonic spectrum",'c',['soul','divine']),
 ('oYwriTk-2A4',570,720,"Socrates' invisible sign",'c',['soul','faith']),
 # ESOTERICA (transcripts)
 ('ZV5ubPPzT7U',212,928,'Why Plotinus attacked the Gnostics','t',['gnosis','divine']),
 ('ZV5ubPPzT7U',928,1649,'Plotinus vs the Gnostics on the soul and the cosmos','t',['soul','gnosis']),
 ('noZyUPYVyPw',568,808,'The soul as the nexus of the worlds in Proclus','t',['soul','divine']),
 ('noZyUPYVyPw',1739,2040,'Theurgy and the ascent back to the One','t',['divine/the-one','meditation/prayer','awakening']),
 ('NjwDlU9sfz8',329,1051,"Plato's four divine madnesses",'t',['divine','soul','kindness']),
 ('NjwDlU9sfz8',1051,1288,'Ficino and Bruno on divine frenzy','t',['divine','soul']),
 ('22kxcbN8B_A',88,691,'The Apocryphon of John: a secret revelation','t',['gnosis','divine']),
 ('22kxcbN8B_A',1500,2160,'Gnostic baptism and the hymn of salvation','t',['gnosis','awakening']),
 ('I4GHrs5xAIk',930,1650,"Mary Magdalene's vision: soul, mind and the ascent",'t',['soul','gnosis','death']),
 ('83rZ_8aWSXw',329,1049,'Jakob Böhme, the shoemaker mystic','t',['divine','awakening']),
 ('wLE8J4PJXcM',360,600,'The partition of the soul in Middle Platonism','t',['soul']),
 # Let's Talk Religion (chapters + transcripts)
 ('vZEUo_sHoBw',326,1102,'Plotinus: life and works','c',['texts','divine/the-one']),
 ('vZEUo_sHoBw',1102,1606,'The metaphysics of the One, Intellect and Soul','c',['divine/the-one','soul']),
 ('vZEUo_sHoBw',1606,2101,'Ascent and participatory metaphysics','c',['awakening','meditation']),
 ('vZEUo_sHoBw',2101,2717,'Alone with the Alone: union with the One','c',['divine/the-one','awakening']),
 ('vZEUo_sHoBw',2717,3071,'Neoplatonism after Plotinus: Iamblichus and Proclus','c',['divine','texts']),
 ('wA5Vnoa2GuY',1204,1364,'Theosis: becoming divine','c',['divine','awakening']),
 ('wA5Vnoa2GuY',1364,1863,'Pseudo-Dionysius and the Neoplatonic God','c',['divine/the-one','divine']),
 ('wA5Vnoa2GuY',1863,2178,'Meister Eckhart and Augustine as Christian Platonists','c',['divine','soul']),
 ('r4LoXCl7drQ',109,482,"What is 'mysticism'?",'c',['awakening','divine']),
 ('r4LoXCl7drQ',482,868,'Contemplation and theosis in early Christianity','c',['meditation/prayer','divine']),
 ('r4LoXCl7drQ',1577,1869,'Love and union with God: Marguerite Porete','c',['kindness','divine','self']),
 ('r4LoXCl7drQ',1994,2250,'Mystical practice: Hesychasm and the Cloud of Unknowing','c',['meditation/prayer']),
 ('r4LoXCl7drQ',2250,2756,'The mystical philosophy of Meister Eckhart','c',['divine','self']),
 ('stUXFuN-6T4',648,800,'Pythagoras and the Pythagoreans','c',['rebirth/western']),
 ('stUXFuN-6T4',1028,1482,'The Orphics: soul, body and the cycle of births','c',['rebirth/western','soul']),
 ('stUXFuN-6T4',1482,1690,'Parmenides: mysticism in philosophy?','c',['divine/the-one']),
 ('stUXFuN-6T4',1690,2572,'Is there mysticism in Plato?','c',['soul','awakening','divine']),
 ('HgR6YrJDUR8',258,733,'Pythagoras: transmigration of souls and a way of life','c',['rebirth/western','soul','virtue']),
 ('HgR6YrJDUR8',733,968,'The Pythagorean mystery cult','c',['renunciation','faith']),
 ('CRz7Q5JycX0',779,1570,'Dionysius on the Divine Names','c',['divine']),
 ('CRz7Q5JycX0',1570,2129,'The Mystical Theology: knowing God by unknowing','c',['divine','meditation/prayer']),
 ('Hg0c32KbA-g',751,1469,'Eckhart on the ground of God and the soul','t',['divine','soul']),
 ('Hg0c32KbA-g',1650,2369,'The birth of God in the soul, beyond time','t',['divine','awakening','soul']),
 ('ockwMVE7PgM',58,359,"What scholarship now says about 'Gnosticism'",'t',['gnosis','texts']),
 ('ockwMVE7PgM',1648,2370,'Seth and the Sethian bearers of gnosis','t',['gnosis','divine']),
 # Pierre Grimes (transcripts)
 ('I4KbSqELgy4',2548,2850,'Choosing a life in the Myth of Er','t',['rebirth/western','kamma']),
 ('I4KbSqELgy4',1560,1801,'Questions on the Myth of Er','t',['rebirth/western','soul']),
 ('Cvs52cBjpgU',2701,3415,'Plotinus: by the One all beings are beings','t',['divine/the-one']),
 ('Cvs52cBjpgU',3449,4172,'Contemplating the One','t',['divine/the-one','meditation']),
 ('SzzAokvy11o',2100,2821,"Proclus' Elements: what lies behind all causes",'t',['divine/the-one','divine']),
 ('X8reTdGzqho',779,1139,"The soul's turning and return to its source",'t',['soul','awakening']),
 ('X8reTdGzqho',2310,2972,'Plotinus on the descent of the soul into the body','t',['soul','rebirth/western']),
 # Michael Sugrue (chapters)
 ('rVxSoiHtovM',109,693,"Plato's Republic: the ring of Gyges and why be just",'c',['virtue','self']),
 ('rVxSoiHtovM',1659,1815,'The myth of the metals','c',['soul','virtue']),
 # Ficino (Lumen Christi, transcript)
 ('VB7DZTKaZU0',1049,1769,"Ficino's De Amore: love in Plato's Symposium",'t',['kindness','soul','divine']),
 ('VB7DZTKaZU0',2100,2819,'Ficino: forming the soul through philosophy, after Pythagoras','t',['soul','virtue']),
 # Theosophy / Steiner / Fourth Way (transcripts + chapters)
 ('6XLqM4caH5k',118,479,'Gary Lachman on first meeting the Gurdjieff Work','t',['awakening','self']),
 ('6XLqM4caH5k',2010,2729,"Gurdjieff's methods at the Prieuré",'t',['self','awakening','mindfulness']),
 ('6XLqM4caH5k',3750,4350,"Gurdjieff's 'toast to the idiots'",'t',['self','emotions']),
 ('z_hC2j8dNzA',1079,1799,'I am asleep: why we cannot receive new impressions','t',['awakening','self','mindfulness']),
 ('z_hC2j8dNzA',2489,3030,'Ouspensky, Gurdjieff and the trap of positive thinking','t',['thought','self']),
 ('z_hC2j8dNzA',3300,3540,'Man as an automaton','t',['self','awakening']),
 ('nLUd7quAHHg',164,396,'The divine influx: Gnosticism in the American New Age','c',['gnosis','divine']),
 ('nLUd7quAHHg',463,742,'New Age and Gnosticism: commonality and polarity','c',['gnosis']),
 ('WY3XhIbGGmo',958,1500,'Cynthia Bourgeault on Wisdom Christianity and the Gurdjieff Work (1)','t',['meditation/prayer','awakening']),
 ('WY3XhIbGGmo',2280,3000,'Cynthia Bourgeault on Wisdom Christianity and the Gurdjieff Work (2)','t',['mindfulness','self']),
 ('hrdse8DpowQ',30,690,"Rudolf Steiner's vision of humanity's destined future",'t',['rebirth/western','awakening']),
 ('hrdse8DpowQ',869,1170,'Heart thinking: seeing others in their essence','t',['kindness','thought']),
 ('lr9ARxmZeYg',13,238,'Kamaloca: the soul in the astral world after death','t',['death','craving']),
 ('lr9ARxmZeYg',541,779,'Descending from the spiritual world into a new life','t',['rebirth/western','soul']),
 ('lr9ARxmZeYg',1169,1469,'Kamaloca and a higher concept of love','t',['death','kindness']),
 ('hSit8lTt46Q',448,810,'The planetary spheres between death and a new birth','t',['death','rebirth/western']),
 ('hSit8lTt46Q',1648,2129,'Working on the spirit between death and rebirth','t',['rebirth/western','kamma']),
]
VCH = {  # channel key for virtual parents
 'wA5bpeRPq_o':'kfa','UkWOAsrm7fk':'kfa','Sv4W7lAoCYk':'kfa','XHGo_gY92WQ':'kfa',
 'Lhl51bZQlM8':'vervaeke','neDutbcedUY':'vervaeke','FvLe4BuU-NM':'vervaeke','Jbwm03djuJc':'vervaeke','mXfK4nicygA':'vervaeke','ITfUCL1yTQQ':'vervaeke','oYwriTk-2A4':'stang',
 'ZV5ubPPzT7U':'esoterica','noZyUPYVyPw':'esoterica','NjwDlU9sfz8':'esoterica','22kxcbN8B_A':'esoterica','I4GHrs5xAIk':'esoterica','83rZ_8aWSXw':'esoterica','wLE8J4PJXcM':'esoterica',
 'vZEUo_sHoBw':'ltr','wA5Vnoa2GuY':'ltr','r4LoXCl7drQ':'ltr','stUXFuN-6T4':'ltr','HgR6YrJDUR8':'ltr','CRz7Q5JycX0':'ltr','Hg0c32KbA-g':'ltr','ockwMVE7PgM':'ltr',
 'I4KbSqELgy4':'grimes','Cvs52cBjpgU':'grimes','SzzAokvy11o':'grimes','X8reTdGzqho':'grimes','rVxSoiHtovM':'sugrue','VB7DZTKaZU0':'lumen',
 '6XLqM4caH5k':'lachman','z_hC2j8dNzA':'horowitz','nLUd7quAHHg':'horowitz','WY3XhIbGGmo':'hds','hrdse8DpowQ':'dalton','lr9ARxmZeYg':'rsp','hSit8lTt46Q':'rsp',
}
# channel defaults: speaker id, teacher name
SP = {
 'kfa':('jiddu-krishnamurti','J. Krishnamurti'),'kft':('jiddu-krishnamurti','J. Krishnamurti'),
 'sadler':('gregory-sadler','Gregory B. Sadler'),'esoterica':('justin-sledge','Justin Sledge'),'ltr':('filip-holm','Filip Holm'),
 'cac':('richard-rohr','Richard Rohr'),'wwok':('cynthia-bourgeault','Cynthia Bourgeault'),'rsp':('rudolf-steiner-press','Rudolf Steiner Press (reading)'),
 'needleman':('jacob-needleman','Jacob Needleman'),'shambhala':('cynthia-bourgeault','Cynthia Bourgeault'),'vervaeke':('john-vervaeke','John Vervaeke'),
 'stang':('charles-stang','Charles Stang'),'nottingham':('theodore-nottingham','Theodore Nottingham'),'steinhart':('eric-steinhart','Eric Steinhart'),
 'tsa':('pablo-sender','Pablo Sender'),'alexoc':('bart-ehrman','Bart Ehrman'),'grimes':('pierre-grimes','Pierre Grimes'),'sugrue':('michael-sugrue','Michael Sugrue'),
 'lumen':('denis-robichaud','Denis Robichaud'),'lachman':('gary-lachman','Gary Lachman'),'horowitz':('mitch-horowitz','Mitch Horowitz'),
 'hds':('cynthia-bourgeault','Cynthia Bourgeault'),'dalton':('john-dalton','John Dalton'),
}
SP_OVERRIDE = {  # title-named speakers on CAC
 'YHtsSE2-nOI':('cynthia-bourgeault','Cynthia Bourgeault'),'gIzzjWey6BM':('cynthia-bourgeault','Cynthia Bourgeault'),
 'x-rqJotbr4E':('cynthia-bourgeault','Cynthia Bourgeault'),'LTqA-SWkKOk':('cynthia-bourgeault','Cynthia Bourgeault'),
 'mW9UkBv7eT0':('barbara-holmes','Barbara Holmes'),'ZBCs5pOEqwI':('barbara-holmes','Barbara Holmes'),
}

# ---------------- figures, traditions ----------------
FIG = [
 (r'\bplato|platonic|republic|phaedo|symposium|meno\b|apology|allegory of the cave|cave\b|timaeus|myth of er|myth of the metals|ring of gyges|daimon', 'plato'),
 (r'socrat', 'socrates'), (r'plotin|enneads|alone with the alone', 'plotinus'), (r'proclus|elements of theology|theurgy', 'proclus'),
 (r'ficino|de amore', 'marsilio-ficino'), (r'pythagor', 'pythagoras'),
 (r'\bjesus|\bchrist\b|kairos and metanoia|lord.s prayer|agape', 'jesus'),
 (r'eckhart|granum', 'meister-eckhart'), (r'dionysius', 'pseudo-dionysius'), (r'porete|simple souls', 'marguerite-porete'),
 (r'b[oö]e?hme|shoemaker', 'jakob-boehme'),
 (r'steiner|kamaloca|anthropos|between death and (a )?new birth|death and rebirth', 'rudolf-steiner'),
 (r'blavatsky', 'helena-blavatsky'),
 (r'gurdjieff|fourth way|the work\b|self.?remember|prieur|toast to the idiots|i am asleep|automaton|conscious labor|law of three|denying force', 'george-gurdjieff'),
 (r'ouspensky', 'pd-ouspensky'),
 (r'apocryphon|thunder|great invisible spirit|gospel of thomas|nag hammadi|sethian', 'nag-hammadi-library'),
 (r'mary magdalene|gospel of mary', 'mary-magdalene'),
]
TRAD_OF = {'plato':'platonism','socrates':'platonism','pythagoras':'platonism','plotinus':'neoplatonism','proclus':'neoplatonism',
 'marsilio-ficino':'renaissance-platonism','jesus':'christianity','meister-eckhart':'christian-mysticism','pseudo-dionysius':'christian-mysticism',
 'marguerite-porete':'christian-mysticism','jakob-boehme':'christian-mysticism','rudolf-steiner':'anthroposophy','helena-blavatsky':'theosophy',
 'george-gurdjieff':'fourth-way','pd-ouspensky':'fourth-way','nag-hammadi-library':'gnosticism','mary-magdalene':'gnosticism','jiddu-krishnamurti':'krishnamurti'}
FAMILY = {'platonism':'hellenic','neoplatonism':'hellenic','renaissance-platonism':'hellenic','christianity':'christianity','christian-mysticism':'christianity',
 'gnosticism':'western-esotericism','theosophy':'western-esotericism','anthroposophy':'western-esotericism','fourth-way':'western-esotericism','krishnamurti':'independent','western-esotericism':'western-esotericism','hellenic':'hellenic'}
SPEAKER_TRAD = {'jiddu-krishnamurti':'krishnamurti','richard-rohr':'christian-mysticism','cynthia-bourgeault':'christian-mysticism','barbara-holmes':'christian-mysticism',
 'theodore-nottingham':'fourth-way','rudolf-steiner-press':'anthroposophy','pablo-sender':'theosophy','jacob-needleman':'fourth-way','gregory-sadler':'platonism',
 'eric-steinhart':'neoplatonism','pierre-grimes':'platonism','michael-sugrue':'platonism','john-vervaeke':'platonism','charles-stang':'platonism','bart-ehrman':'gnosticism',
 'denis-robichaud':'renaissance-platonism','gary-lachman':'fourth-way','mitch-horowitz':'western-esotericism','john-dalton':'anthroposophy','justin-sledge':'western-esotericism','filip-holm':'christian-mysticism'}

# ---------------- topics ----------------
T = json.load(open(APP + '/schema/topics.json'))['tree']
ADD = json.load(open(B + '/topics-additions.json'))['topics']
KW = []  # (id, regex, isleaf)
def walk(d, p=''):
    for k, v in d.items():
        if isinstance(v, dict) and 'label' in v:
            i = p + k; kids = [x for x in v if isinstance(v[x], dict) and 'label' in v[x]]
            KW.append((i, re.compile(r'(?<!\w)(%s)(?!\w)' % '|'.join(v.get('kw', [])), re.I) if v.get('kw') else None, not kids))
            walk(v, i + '/')
walk(T)
for a in ADD:
    KW.append((a['id'], re.compile(r'(?<!\w)(%s)(?!\w)' % '|'.join(a['keywords']), re.I), a.get('leaf', True)))
VALID = {k for k, _, _ in KW}
# western clips: route reincarnation cues to rebirth/western, not samsara
NOISY = {'kamma': r'intention|merit', 'mindfulness': r'attention', 'faith': r'god|gods|prayer|grace', 'right-view': r'wisdom', 'feeling': r'body', 'relationships': r'relationships?'}

def tag(texts, manual, transcript=None):
    got = {}
    for i, rx, leaf in KW:
        if not rx: continue
        for txt, src in texts:
            hits = rx.findall(txt or '')
            if not hits: continue
            if i in NOISY and all(re.fullmatch(NOISY[i], h if isinstance(h, str) else h[0], re.I) for h in hits): continue
            c = 0.8 if leaf else 0.7
            if src == 'desc': c = 0.4
            if (i not in got) or got[i][1] < c: got[i] = [i, c, src]
    if 'rebirth' in got or 'rebirth/samsara' in got:
        got.pop('rebirth', None); got.pop('rebirth/samsara', None); got['rebirth/western'] = ['rebirth/western', 0.8, 'title']
    if transcript:
        for i, rx, leaf in KW:
            if rx and i not in got and len(got) + len(manual) < 3 and len(rx.findall(transcript)) >= 8:
                got[i] = [i, 0.5, 'transcript']
        got.pop('rebirth/samsara', None)
    for m in manual:
        assert m in VALID, m
        got[m] = [m, 0.9, 'manual']
    # drop parents when a child is present
    for k in list(got):
        if any(o != k and o.startswith(k + '/') for o in got): got.pop(k)
    trip = sorted(got.values(), key=lambda t: (-t[1], t[0]))[:4]
    return trip

def band(s): return 'short' if s <= 75 else 'mid' if s <= 180 else 'long' if s <= 420 else 'xl'
def published(vid):
    a = (AGE.get(vid) or {}).get('ago') or ''
    m = re.search(r'(\d+)\s*(yr|year|mo|month|wk|week|day|hr|hour)', a)
    if not m: return None, None
    n, u = int(m.group(1)), m.group(2)
    days = {'yr':365,'year':365,'mo':30,'month':30,'wk':7,'week':7,'day':1,'hr':0,'hour':0}[u] * n
    d = TODAY - datetime.timedelta(days=days)
    return d.isoformat(), d.year
CLEAN = [r'\s*\|\s*J\. Krishnamurti\s*$', r'\s*\|\s*Krishnamurti( & [\w .]+)?\s*$', r'\s*\|\s*Philosophy Core Concepts\s*$', r'\s+[Bb]y Rudolf St(ei|ie)ner\s*$',
         r'\s*—\s*Richard Rohr.s (“|")?Daily Meditations(”|")?.*$', r'\s*\|\s*Homilies with Richard Rohr \| CAC Podcasts\s*$', r'\s*-\s*Philosophy Core Concepts\s*$']
def clean(t):
    for c in CLEAN: t = re.sub(c, '', t)
    return t.strip()
def figures_for(text, speaker):
    f = []
    for rx, fid in FIG:
        if re.search(rx, text, re.I) and fid not in f and fid != speaker: f.append(fid)
    if 'jakob-boehme' in f and 'helena-blavatsky' in f: f.remove('helena-blavatsky')
    return f

def row(vid, ck, title, sec, start=None, end=None, seg=None, manual=(), transcript=None, extra_text=''):
    e = EMB[vid]
    sp, teacher = SP_OVERRIDE.get(vid) or SP[ck]
    yt = e['o_title']
    figs = figures_for(' '.join([yt, seg or '', extra_text]), sp)
    if ck == 'rsp' and 'rudolf-steiner' not in figs: figs.insert(0, 'rudolf-steiner')
    trads = []
    for fg in figs:
        t = TRAD_OF.get(fg)
        if t and t not in trads: trads.append(t)
    st = SPEAKER_TRAD.get(sp)
    if not trads and st: trads = [st]
    if sp == 'jiddu-krishnamurti': trads = ['krishnamurti']
    trad = trads[0]
    texts = [(seg or title, 'title')]
    pub, yr = published(vid)
    r = {
      'id': f'{vid}@{start}' if start is not None else vid,
      'teacher': teacher, 'speaker': sp, 'speakerFrom': 'title' if vid in SP_OVERRIDE else 'channel-default',
      'title': seg or title, 'ytTitle': yt, 'channel': e['o_author'], 'kind': 'human', 'media': 'youtube', 'checked': '2026-10-20',
      'dur': e['dur'], 'sec': sec, 'format': 'horizontal', 'carrier': 'own', 'setting': 'talk',
      'region': FAMILY[trad], 'tradition': trad, 'traditions': sorted(set([FAMILY[t] for t in trads] + trads)),
      'figures': figs, 'topics': [], 'style': [], 'published': pub, 'publishedApprox': bool(pub), 'year': yr,
      'views': (AGE.get(vid) or {}).get('views'),
      'tags': {'v': 1, 'topics': tag(texts, list(manual), transcript), 'lang': ['en', 0.9, 'rule'], 'band': band(sec)},
    }
    r['topics'] = sorted(t[0] for t in r['tags']['topics'])
    if start is not None:
        r.update({'start': start, 'end': end, 'parent': vid, 'segTitle': seg})
        if transcript is not None: r['transcript'] = True
    return r

# natural-clip manual topics where titles carry no cue
NAT_MANUAL = json.load(open(B + '/tools/nat_manual.json')) if os.path.exists(B + '/tools/nat_manual.json') else {}
TR = '/workspace/projects/f9a7b7ba-e7fb-456e-891e-78ec1c0ab3dc/work/wiser/transcripts-internal/western'
def seg_text(vid, a, b):
    try: return ' '.join(t for s, _, t in cues(vid) if a <= s < b)
    except Exception: return None

out = []; skipped = []
for ck, ids in NAT.items():
    for vid in ids:
        e = EMB.get(vid)
        if not e or not (e.get('oembed') == 200 and e.get('embed') == 'OK' and e.get('playableInEmbed')):
            skipped.append((vid, 'embed')); continue
        d = e['dur']
        if not (60 <= d <= 1200): skipped.append((vid, f'dur {d}')); continue
        out.append(row(vid, ck, clean(e['o_title']), d, manual=NAT_MANUAL.get(vid, [])))
for vid, a, b, seg, src, man in V:
    e = EMB.get(vid)
    assert e and e.get('embed') == 'OK' and e.get('playableInEmbed'), vid
    b = min(b, e['dur']); assert 60 <= b - a <= 1200, (vid, a, b)
    txt = seg_text(vid, a, b) if src == 't' else None
    out.append(row(vid, VCH[vid], seg, b - a, a, b, seg, man, transcript=txt))
ids = [r['id'] for r in out]; assert len(ids) == len(set(ids))
json.dump(out, open(B + '/candidates.json', 'w'), indent=1, ensure_ascii=False)
print(len(out), 'clips; skipped', skipped)
print('no topics:', [(r['id'], r['title']) for r in out if not r['topics']])
