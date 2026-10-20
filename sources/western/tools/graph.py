# Writes people-additions.json, traditions-additions.json, edges-additions.json for the western group.
import json, os
B = os.path.dirname(os.path.abspath(__file__)) + '/..'
def ch(name, cid, url): return {'name': name, 'id': cid, 'url': url, 'official': True}
def W(id_, title, kind, year=None, url=None):
    w = {'id': id_, 'title': title, 'kind': kind}
    if year is not None: w['year'] = year
    if url: w['url'] = url
    return w
P = []
def add(id_, name, kind, tradition, wikidata, years, bio, aliases, works=(), channels=(), links=None, short=None):
    P.append({'id': id_, 'name': name, 'short': short or name, 'kind': kind, 'role': 'speaker' if kind == 'speaker' else kind,
              'tradition': tradition, 'wikidata': wikidata, 'years': years, 'bio': bio, 'aliases': aliases,
              'channels': list(channels), 'links': links or {}, 'works': list(works)})
# ---- figures (no footage used; met through talks about them) ----
add('plato', 'Plato', 'figure', 'platonism', 'Q859', 'c. 428–348 BCE',
    "Athenian philosopher and student of Socrates whose dialogues set out the Forms, the immortal soul and the turn of the soul toward the Good.",
    ['plato', 'platonic', 'platonist'],
    [W('plato-republic', 'Republic', 'text'), W('plato-phaedo', 'Phaedo', 'text'), W('plato-symposium', 'Symposium', 'text'),
     W('plato-phaedrus', 'Phaedrus', 'text'), W('plato-meno', 'Meno', 'text'), W('plato-timaeus', 'Timaeus', 'text'), W('plato-myth-of-er', 'The Myth of Er (Republic X)', 'text')])
add('socrates', 'Socrates', 'figure', 'platonism', 'Q913', 'c. 470–399 BCE',
    "Athenian philosopher known through Plato and Xenophon; made self-examination and the care of the soul the work of philosophy.",
    ['socrates', 'socratic'], [W('plato-apology', 'Apology (Plato)', 'text')])
add('pythagoras', 'Pythagoras', 'figure', 'platonism', 'Q10261', 'c. 570–495 BCE',
    "Founder of a religious-philosophical community in southern Italy, remembered for number mysticism and the transmigration of souls.",
    ['pythagoras', 'pythagorean', 'pythagoreans'])
add('plotinus', 'Plotinus', 'figure', 'neoplatonism', 'Q134189', 'c. 204–270',
    "Founder of Neoplatonism; taught that all things flow from the One and that the soul can return to it through contemplation.",
    ['plotinus', 'plotinian', 'enneads'], [W('plotinus-enneads', 'Enneads', 'text', 270)])
add('proclus', 'Proclus', 'figure', 'neoplatonism', 'Q271809', '412–485',
    "Head of the Platonic Academy in Athens who systematised late Neoplatonism and joined philosophy to theurgic ritual.",
    ['proclus'], [W('proclus-elements-of-theology', 'Elements of Theology', 'text'), W('proclus-platonic-theology', 'Platonic Theology', 'text')])
add('marsilio-ficino', 'Marsilio Ficino', 'figure', 'renaissance-platonism', 'Q192374', '1433–1499',
    "Florentine priest who translated Plato and Plotinus into Latin and led the Renaissance revival of Platonism.",
    ['ficino', 'marsilio ficino'], [W('ficino-platonic-theology', 'Platonic Theology', 'text', 1482), W('ficino-de-amore', 'De Amore (Commentary on the Symposium)', 'text', 1469)])
add('jesus', 'Jesus of Nazareth', 'figure', 'christianity', 'Q302', 'c. 4 BCE – c. 30 CE',
    "Jewish teacher from Galilee whose sayings and death are the root of Christianity; read here through contemplative and Gnostic eyes.",
    ['jesus', 'christ', 'jesus of nazareth'], [W('sermon-on-the-mount', 'Sermon on the Mount', 'text'), W('gospel-of-thomas', 'Gospel of Thomas (attributed sayings)', 'text')], short='Jesus')
add('meister-eckhart', 'Meister Eckhart', 'figure', 'christian-mysticism', 'Q76548', 'c. 1260–1328',
    "Dominican friar and preacher who taught detachment, the ground of the soul and the birth of God in the soul.",
    ['eckhart', 'meister eckhart'], [W('eckhart-german-sermons', 'German Sermons', 'text'), W('eckhart-on-detachment', 'On Detachment', 'text'), W('eckhart-book-of-divine-consolation', 'The Book of Divine Consolation', 'text')])
add('pseudo-dionysius', 'Pseudo-Dionysius the Areopagite', 'figure', 'christian-mysticism', 'Q312816', 'late 5th – early 6th c.',
    "Anonymous Christian Neoplatonist whose writings on the divine names and knowing God by unknowing shaped Christian mysticism.",
    ['dionysius', 'pseudo-dionysius', 'areopagite'], [W('dionysius-mystical-theology', 'The Mystical Theology', 'text'), W('dionysius-divine-names', 'The Divine Names', 'text')], short='Pseudo-Dionysius')
add('marguerite-porete', 'Marguerite Porete', 'figure', 'christian-mysticism', 'Q255132', 'd. 1310',
    "Beguine mystic burned for heresy in Paris; her book describes the soul annihilated in divine love.",
    ['porete', 'marguerite porete'], [W('porete-mirror-of-simple-souls', 'The Mirror of Simple Souls', 'text')])
add('jakob-boehme', 'Jakob Böhme', 'figure', 'christian-mysticism', 'Q77017', '1575–1624',
    "Shoemaker of Görlitz whose visionary writings on the divine abyss founded Christian theosophy.",
    ['boehme', 'böhme', 'jacob boehme'], [W('boehme-aurora', 'Aurora', 'text', 1612)])
add('rudolf-steiner', 'Rudolf Steiner', 'figure', 'anthroposophy', 'Q78484', '1861–1925',
    "Austrian esotericist who left the Theosophical Society to found Anthroposophy, teaching karma, reincarnation and a path of spiritual knowledge.",
    ['steiner', 'rudolf steiner', 'anthroposophy', 'anthroposophical'],
    [W('steiner-theosophy', 'Theosophy', 'book', 1904), W('steiner-how-to-know-higher-worlds', 'How to Know Higher Worlds', 'book', 1904),
     W('steiner-philosophy-of-freedom', 'The Philosophy of Freedom', 'book', 1894), W('steiner-karmic-relationships', 'Karmic Relationships (lectures)', 'talk', 1924)],
    links={'Rudolf Steiner Archive': 'https://rsarchive.org'})
add('helena-blavatsky', 'Helena Blavatsky', 'figure', 'theosophy', 'Q189454', '1831–1891',
    "Russian-born occultist who co-founded the Theosophical Society and spread ideas of karma and reincarnation in the West.",
    ['blavatsky', 'h.p.b.', 'hpb'], [W('blavatsky-isis-unveiled', 'Isis Unveiled', 'book', 1877), W('blavatsky-secret-doctrine', 'The Secret Doctrine', 'book', 1888), W('blavatsky-voice-of-the-silence', 'The Voice of the Silence', 'book', 1889)])
add('george-gurdjieff', 'G. I. Gurdjieff', 'figure', 'fourth-way', 'Q217771', 'c. 1866/77–1949',
    "Armenian-Greek teacher of the Fourth Way, who held that people live asleep and can wake through self-remembering and conscious work.",
    ['gurdjieff', 'g.i. gurdjieff', 'fourth way', 'the work'], [W('gurdjieff-beelzebubs-tales', "Beelzebub's Tales to His Grandson", 'book', 1950), W('gurdjieff-meetings-with-remarkable-men', 'Meetings with Remarkable Men', 'book', 1963)], short='Gurdjieff')
add('pd-ouspensky', 'P. D. Ouspensky', 'figure', 'fourth-way', 'Q434266', '1878–1947',
    "Russian writer who studied with Gurdjieff and set out the Fourth Way system for Western readers.",
    ['ouspensky'], [W('ouspensky-in-search-of-the-miraculous', 'In Search of the Miraculous', 'book', 1949), W('ouspensky-fourth-way', 'The Fourth Way', 'book', 1957)], short='Ouspensky')
add('mary-magdalene', 'Mary Magdalene', 'figure', 'gnosticism', 'Q63070', '1st c.',
    "Follower of Jesus and witness of the resurrection; the Gospel of Mary presents her as receiver of secret teaching on the soul's ascent.",
    ['mary magdalene', 'gospel of mary'], [W('gospel-of-mary', 'Gospel of Mary', 'text')])
P.append({'id': 'nag-hammadi-library', 'name': 'Nag Hammadi library', 'short': 'Nag Hammadi', 'kind': 'text', 'role': 'figure', 'tradition': 'gnosticism',
          'wikidata': 'Q222999', 'years': 'codices c. 350–400 CE; found 1945',
          'bio': "Thirteen Coptic codices found in Upper Egypt in 1945, holding Gnostic and early Christian texts.",
          'aliases': ['nag hammadi', 'apocryphon of john', 'thunder perfect mind', 'gospel of thomas', 'holy book of the great invisible spirit'],
          'channels': [], 'links': {}, 'works': [W('apocryphon-of-john', 'Apocryphon of John', 'text'), W('gospel-of-thomas-nh', 'Gospel of Thomas', 'text'),
          W('thunder-perfect-mind', 'Thunder, Perfect Mind', 'text'), W('great-invisible-spirit', 'Holy Book of the Great Invisible Spirit', 'text')]})
# ---- speakers ----
add('jiddu-krishnamurti', 'J. Krishnamurti', 'speaker', 'krishnamurti', 'Q179266', '1895–1986',
    "Raised by the Theosophical Society as its World Teacher, he dissolved its order in 1929 and spent six decades speaking on freedom from the known.",
    ['krishnamurti', 'jiddu krishnamurti', 'j. krishnamurti', 'k'],
    [W('k-freedom-from-the-known', 'Freedom from the Known', 'book', 1969), W('k-first-and-last-freedom', 'The First and Last Freedom', 'book', 1954),
     W('k-truth-is-a-pathless-land', 'Truth is a Pathless Land (dissolution speech)', 'talk', 1929), W('k-ending-of-time', 'The Ending of Time (with David Bohm)', 'book', 1985)],
    [ch('J. Krishnamurti - Official Channel', 'UC88A5W9XyWx7WSwthd5ykhw', 'https://www.youtube.com/@kfoundation'),
     ch('Krishnamurti Foundation Trust', 'UCX8wFEiD_FaLPgHM6wPD0Wg', 'https://www.youtube.com/channel/UCX8wFEiD_FaLPgHM6wPD0Wg')],
    {'Website': 'https://kfoundation.org', 'KFT': 'https://kfoundation.org'}, short='Krishnamurti')
SPK = [
 ('justin-sledge', 'Justin Sledge', 'western-esotericism', None, None, "Historian of philosophy and religion who presents ESOTERICA, a channel on the history of mysticism, Gnosticism and Hermeticism.", ['sledge', 'dr justin sledge', 'esoterica'],
  [W('esoterica-middle-platonism', 'Being and Logos: Introduction to Middle Platonism', 'talk series')], [ch('ESOTERICA', 'UCoydhtfFSk1fZXNRnkGnneQ', 'https://www.youtube.com/@TheEsotericaChannel')]),
 ('filip-holm', 'Filip Holm', 'christian-mysticism', 'Q134521272', None, "Swedish scholar of religion and educator who runs Let's Talk Religion, long-form videos on mysticism across traditions.", ['filip holm', "let's talk religion"],
  [W('ltr-christmas-with-eckhart', 'Christmas with Meister Eckhart', 'talk series')], [ch("Let's Talk Religion", 'UC9dRb4fbJQIbQ3KHJZF_z0g', 'https://www.youtube.com/@LetsTalkReligion')]),
 ('john-vervaeke', 'John Vervaeke', 'platonism', 'Q109279267', None, "Cognitive scientist at the University of Toronto whose lecture series traces wisdom from Socrates and Plato through Gnosis and Neoplatonism.", ['vervaeke'],
  [W('vervaeke-awakening-from-the-meaning-crisis', 'Awakening from the Meaning Crisis', 'talk series', 2019)], [ch('John Vervaeke’s Lectern', 'UCpqDUjTsof-kTNpnyWper_Q', 'https://www.youtube.com/@johnvervaeke')]),
 ('charles-stang', 'Charles Stang', 'platonism', None, None, "Harvard Divinity School scholar of early Christian mysticism, heard here in dialogue with John Vervaeke on daimons and the higher self.", ['stang'],
  [W('stang-our-divine-double', 'Our Divine Double', 'book', 2016)], []),
 ('gregory-sadler', 'Gregory B. Sadler', 'platonism', None, None, "Philosophy educator whose short 'Core Concepts' lectures walk through Plato's dialogues passage by passage.", ['sadler'],
  [W('sadler-core-concepts', 'Philosophy Core Concepts', 'talk series')], [ch('Gregory B. Sadler - That Philosophy Guy', 'UCEtxsMx4qsoitFwjBdLU_gA', 'https://www.youtube.com/@gbsadler')]),
 ('pierre-grimes', 'Pierre Grimes', 'platonism', None, '1924–2023', "Platonist philosopher and founder of the Noetic Society, who read Plato, Plotinus and Proclus as a living practice he called philosophical midwifery.", ['grimes'],
  [W('grimes-noetic-society-seminars', 'Noetic Society Friday seminars', 'talk series')], [ch('Pierre Grimes and the Noetic Society', 'UCwpMRCoVgSJ-rKyV1yhWljg', 'https://www.youtube.com/channel/UCwpMRCoVgSJ-rKyV1yhWljg')]),
 ('michael-sugrue', 'Michael Sugrue', 'platonism', 'Q114232273', '1957–2024', "American historian whose Great Minds lectures on Plato and the Western canon became widely watched online.", ['sugrue'],
  [W('sugrue-great-minds', 'Great Minds of the Western Intellectual Tradition', 'talk series', 1992)], [ch('Michael Sugrue', 'UCFaYLR_1aryjfB7hLrKGRaQ', 'https://www.youtube.com/channel/UCFaYLR_1aryjfB7hLrKGRaQ')]),
 ('eric-steinhart', 'Eric Steinhart', 'neoplatonism', 'Q60334246', None, "Philosophy professor whose short lectures explain Plotinus' One, emanation and the soul's fall and return.", ['steinhart'],
  [W('steinhart-plotinus-lectures', 'Plotinus lectures', 'talk series')], [ch('Eric Steinhart', 'UCy7OHMeM4GulufLYodVwxsQ', 'https://www.youtube.com/channel/UCy7OHMeM4GulufLYodVwxsQ')]),
 ('denis-robichaud', 'Denis Robichaud', 'renaissance-platonism', None, None, "Historian of Renaissance philosophy and author of a study of Ficino's Plato, speaking at the Lumen Christi Institute.", ['robichaud'],
  [W('robichaud-platos-persona', "Plato's Persona: Marsilio Ficino, Renaissance Humanism, and Platonic Traditions", 'book', 2018)], []),
 ('richard-rohr', 'Richard Rohr', 'christian-mysticism', 'Q320767', 'b. 1943', "Franciscan friar and founder of the Center for Action and Contemplation, teaching the contemplative mind and the Universal Christ.", ['rohr', 'richard rohr'],
  [W('rohr-universal-christ', 'The Universal Christ', 'book', 2019), W('rohr-falling-upward', 'Falling Upward', 'book', 2011)],
  [ch('Center for Action and Contemplation', 'UCMkqKAtSgijU439fJUNHnkA', 'https://www.youtube.com/@CACRadicalGrace')]),
 ('cynthia-bourgeault', 'Cynthia Bourgeault', 'christian-mysticism', 'Q88863043', 'b. 1947', "Episcopal priest and teacher of Centering Prayer and Wisdom Christianity who draws openly on Gurdjieff's Work.", ['bourgeault', 'cynthia bourgeault'],
  [W('bourgeault-wisdom-jesus', 'The Wisdom Jesus', 'book', 2008), W('bourgeault-centering-prayer', 'Centering Prayer and Inner Awakening', 'book', 2004), W('bourgeault-law-of-three', 'The Holy Trinity and the Law of Three', 'book', 2013)],
  [ch('Wisdom Way of Knowing', 'UCkQOtYKee6GBY6y4vol3FNg', 'https://www.youtube.com/channel/UCkQOtYKee6GBY6y4vol3FNg')]),
 ('barbara-holmes', 'Barbara A. Holmes', 'christian-mysticism', 'Q113585746', None, "Writer and teacher on African American mysticism and contemplative practice, a CAC core faculty member.", ['barbara holmes'],
  [W('holmes-joy-unspeakable', 'Joy Unspeakable: Contemplative Practices of the Black Church', 'book', 2004)], []),
 ('theodore-nottingham', 'Theodore Nottingham', 'fourth-way', None, None, "Author and teacher who presents Gurdjieff's Fourth Way alongside the Christian contemplative tradition on his own channel.", ['nottingham'],
  [W('nottingham-fourth-way-videos', 'Fourth Way and inner Christianity talks', 'talk series')], [ch('Theodore Nottingham', 'UCe4MMC-2xAHvKDPxQo_A1YA', 'https://www.youtube.com/channel/UCe4MMC-2xAHvKDPxQo_A1YA')]),
 ('jacob-needleman', 'Jacob Needleman', 'fourth-way', 'Q15458882', '1934–2022', "Philosopher at San Francisco State and long-time member of the Gurdjieff Work, writer on lost Christianity and the inner life.", ['needleman'],
  [W('needleman-lost-christianity', 'Lost Christianity', 'book', 1980), W('needleman-what-is-god', 'What Is God?', 'book', 2009)], [ch('Jacob Needleman', 'UCdwPlk0ofvoxbo9PB_1aQ3Q', 'https://www.youtube.com/channel/UCdwPlk0ofvoxbo9PB_1aQ3Q')]),
 ('gary-lachman', 'Gary Lachman', 'fourth-way', 'Q742923', 'b. 1955', "Writer on consciousness and the Western esoteric tradition, author of studies of Ouspensky, Steiner and Blavatsky.", ['lachman'],
  [W('lachman-in-search-of-pd-ouspensky', 'In Search of P. D. Ouspensky', 'book', 2004), W('lachman-rudolf-steiner', 'Rudolf Steiner: An Introduction to His Life and Work', 'book', 2007)], []),
 ('mitch-horowitz', 'Mitch Horowitz', 'western-esotericism', 'Q6880902', 'b. 1965', "Historian of alternative spirituality and writer on New Thought, Gnosticism and Gurdjieff.", ['horowitz'],
  [W('horowitz-occult-america', 'Occult America', 'book', 2009)], [ch('Mitch Horowitz', 'UCrh57VATxMZhMLz36ztIokg', 'https://www.youtube.com/channel/UCrh57VATxMZhMLz36ztIokg')]),
 ('pablo-sender', 'Pablo Sender', 'theosophy', None, None, "Theosophical Society speaker and author who teaches Blavatsky's approach to meditation and the inner self.", ['pablo sender'],
  [W('sender-evolution-of-the-higher-consciousness', 'Evolution of the Higher Consciousness', 'book')], []),
 ('john-dalton', 'John Dalton', 'anthroposophy', None, None, "Speaker at the Theosophical Society in England and Wales on Rudolf Steiner's indications for the future.", ['john dalton'], [], []),
 ('bart-ehrman', 'Bart D. Ehrman', 'gnosticism', 'Q127876', 'b. 1955', "New Testament scholar at UNC Chapel Hill who writes on early Christian diversity, including the Gnostics.", ['ehrman'],
  [W('ehrman-lost-christianities', 'Lost Christianities', 'book', 2003)], []),
 ('rudolf-steiner-press', 'Rudolf Steiner Press (audio readings)', 'speaker', None, None, "UK publisher of Steiner's works whose channel posts narrated readings of his lectures; the voice is a reader, not Steiner.", ['rudolf steiner press'],
  [], [ch('Rudolf Steiner Press Audio', 'UCTuPXQlrmPfDB7YLJWywnAg', 'https://www.youtube.com/channel/UCTuPXQlrmPfDB7YLJWywnAg')]),
]
for s in SPK:
    i, n, trad, wd, yrs, bio, al, works, chans = s
    if i == 'rudolf-steiner-press': trad = 'anthroposophy'
    add(i, n, 'speaker', trad, wd, yrs, bio, al, works, chans)
json.dump({'_note': "western group additions (2026-10-20). kind: speaker | figure | text (role mirrors kind for the sourcing spec). Wikidata ids from wbsearchentities 2026-10-20; null = no clean item found or not checked. Bios in our own words.", 'people': P},
          open(B + '/people-additions.json', 'w'), indent=1, ensure_ascii=False)

T = [
 ('hellenic', 'Greek philosophy & Platonism', 'family', None, 'Q193589', "Plato's philosophy and the schools that grew from it."),
 ('platonism', 'Platonism', 'school', 'hellenic', 'Q193589', 'Socrates, Pythagoras and Plato: the soul, the Forms and philosophy as preparation for death.'),
 ('neoplatonism', 'Neoplatonism', 'lineage', 'platonism', 'Q162145', 'Plotinus, Porphyry, Iamblichus and Proclus: emanation from the One and the return of the soul.'),
 ('renaissance-platonism', 'Renaissance Platonism', 'lineage', 'platonism', None, 'Ficino and the Florentine revival of Plato and Plotinus.'),
 ('christianity', 'Christianity', 'family', None, 'Q5043', None),
 ('christian-mysticism', 'Christian mysticism', 'school', 'christianity', 'Q655970', 'Dionysius, Eckhart, Porete and Böhme to Centering Prayer and today\'s contemplative teachers.'),
 ('western-esotericism', 'Western esotericism', 'family', None, 'Q7988482', 'Gnosticism, Hermeticism, Theosophy, Anthroposophy and the Fourth Way.'),
 ('gnosticism', 'Gnosticism', 'school', 'western-esotericism', 'Q48420', 'Salvation through gnosis: the Nag Hammadi texts, Sethians and Valentinians.'),
 ('theosophy', 'Theosophy', 'school', 'western-esotericism', 'Q327625', "Blavatsky's Theosophical Society (1875) and its teachings on karma and reincarnation. Wikidata is the Society item."),
 ('anthroposophy', 'Anthroposophy', 'lineage', 'theosophy', 'Q184719', "Rudolf Steiner's spiritual science, which split from the Theosophical Society in 1912–13."),
 ('fourth-way', 'The Fourth Way', 'school', 'western-esotericism', 'Q470418', "Gurdjieff's Work: waking from sleep through self-remembering, carried on by Ouspensky and the Gurdjieff Foundations."),
 ('independent', 'Independent teachers', 'family', None, None, 'Teachers outside any tradition or lineage.'),
 ('krishnamurti', 'Krishnamurti', 'school', 'independent', None, 'J. Krishnamurti\'s teaching after he left Theosophy in 1929: no path, no authority, freedom from the known.'),
]
json.dump({'_note': 'western group tradition nodes (2026-10-20), same shape as app/wisegraph/traditions.json.',
           'nodes': [dict(id=a, label=b, kind=c, parent=d, wikidata=e, **({'blurb': f} if f else {})) for a, b, c, d, e, f in T]},
          open(B + '/traditions-additions.json', 'w'), indent=1, ensure_ascii=False)

E = [
 ('socrates', 'plato', 'teacher_of', 'high', None), ('pythagoras', 'plato', 'influenced', 'high', 'Transmigration and number mysticism, via the Pythagoreans.'),
 ('plato', 'plotinus', 'influenced', 'high', None), ('plotinus', 'proclus', 'influenced', 'high', 'Through Porphyry and Iamblichus.'),
 ('proclus', 'pseudo-dionysius', 'influenced', 'high', None), ('plotinus', 'marsilio-ficino', 'influenced', 'high', 'Ficino translated the Enneads (1492).'),
 ('proclus', 'marsilio-ficino', 'influenced', 'medium', None), ('plato', 'marsilio-ficino', 'influenced', 'high', 'Ficino translated the complete dialogues (1484).'),
 ('pseudo-dionysius', 'meister-eckhart', 'influenced', 'high', None), ('plotinus', 'meister-eckhart', 'influenced', 'medium', 'Through Augustine and Dionysius.'),
 ('marguerite-porete', 'meister-eckhart', 'influenced', 'medium', 'Widely argued from parallels with the Mirror of Simple Souls.'),
 ('meister-eckhart', 'jakob-boehme', 'influenced', 'medium', None),
 ('jakob-boehme', 'helena-blavatsky', 'influenced', 'medium', 'Through the Christian theosophical current.'),
 ('helena-blavatsky', 'theosophy', 'lineage_of', 'high', None),
 ('helena-blavatsky', 'rudolf-steiner', 'influenced', 'high', 'Steiner led the German section of the Theosophical Society, 1902–1912.'),
 ('helena-blavatsky', 'jiddu-krishnamurti', 'influenced', 'high', 'Raised within the Theosophical Society (Besant, Leadbeater) as its World Teacher; left in 1929.'),
 ('rudolf-steiner', 'anthroposophy', 'lineage_of', 'high', None),
 ('george-gurdjieff', 'pd-ouspensky', 'teacher_of', 'high', None), ('george-gurdjieff', 'fourth-way', 'lineage_of', 'high', None),
 ('george-gurdjieff', 'jacob-needleman', 'influenced', 'high', 'Needleman was a member of the Gurdjieff Foundation.'),
 ('george-gurdjieff', 'cynthia-bourgeault', 'influenced', 'high', 'Her Law of Three and Wisdom School draw on the Work.'),
 ('george-gurdjieff', 'theodore-nottingham', 'influenced', 'high', None),
 ('jiddu-krishnamurti', 'krishnamurti', 'lineage_of', 'high', None),
 ('plotinus', 'neoplatonism', 'lineage_of', 'high', None), ('plato', 'platonism', 'lineage_of', 'high', None),
 ('marsilio-ficino', 'renaissance-platonism', 'lineage_of', 'high', None),
 ('nag-hammadi-library', 'gnosticism', 'lineage_of', 'high', None),
 ('plotinus', 'nag-hammadi-library', 'influenced', 'medium', 'Opposition, not borrowing: Ennead II.9 Against the Gnostics.'),
 ('jesus', 'christianity', 'lineage_of', 'high', None), ('pierre-grimes', 'plato', 'influenced', 'medium', 'reverse not meant: Grimes is a reader of Plato'),
]
E = [e for e in E if e[0] != 'pierre-grimes']
json.dump({'_note': 'western group edges (2026-10-20), same shape as app/wisegraph/edges.json. Directed from -> to.',
           'edges': [dict(**{'from': a, 'to': b, 'type': c, 'conf': d}, **({'note': n} if n else {})) for a, b, c, d, n in E]},
          open(B + '/edges-additions.json', 'w'), indent=1, ensure_ascii=False)
print(len(P), 'people', len(T), 'nodes', len(E), 'edges')
