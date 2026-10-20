# Shared id maps for integrating ../sources/<group>/ into the app (used by tools/merge-sources.py and tools/build-clips.py).
# Reviewed by hand 2026-10-20. Edit here, then re-run the merge command in BRIEF.md.
import os

def groups(src):
    """Sourcing groups that are finished (REPORT.md written), in a stable order."""
    if not os.path.isdir(src): return []
    return sorted(g for g in os.listdir(src) if os.path.isfile(os.path.join(src, g, 'REPORT.md')))

# The western group proposed its own family ids; the app already has these families (region filter keys).
TRAD_MAP = {
    'hellenic': 'platonic', 'platonism': 'platonic',          # Plato & Socrates sit on the family node, as Plato already did
    'christianity': 'christian', 'western-esotericism': 'esoteric',
}
# person ids that name an existing wisegraph entry
PERSON_MAP = {'nag-hammadi-library': 'nag-hammadi', 'goraksha': 'gorakhnath'}  # goraksha: pack 31 id for the canonical Gorakhnath (22 already uses gorakhnath)
# readings by the publisher are credited to the author (clip.delivery = 'reading'); no separate "person" for the publisher
PERSON_SKIP = {'rudolf-steiner-press'}
SPEAKER_MAP = {'rudolf-steiner-press': 'rudolf-steiner'}
TEXT_IDS = {'shiva-sutras', 'vijnana-bhairava', 'bhagavad-gita', 'nag-hammadi', 'bardo-thodol'}
# archive uploads the user chose not to trust (advaita-extra review, 2026-10-20): their rows are not merged
CHANNEL_DROP = {'Felix Wolf', 'byronevents', 'SagesAndMystics'}
# people the sources reference but did not write (added by merge-sources.py when missing)
PEOPLE_ADD = [
    {'id': 'swami-sivananda', 'name': 'Swami Sivananda', 'short': 'Swami Sivananda', 'kind': 'figure', 'tradition': 'divine-life-society',
     'wikidata': 'Q458855', 'years': '1887–1963', 'aliases': ['sivananda', 'swami sivananda', 'sivananda saraswati'],
     'bio': 'Physician turned monk who founded the Divine Life Society in Rishikesh, teaching a synthesis of yoga paths: serve, love, meditate, realise.',
     'works': [{'id': 'sivananda-bliss-divine', 'title': 'Bliss Divine', 'kind': 'book'}, {'id': 'sivananda-science-of-yoga', 'title': 'The Science of Yoga', 'kind': 'book'}]},
]
EDGES_ADD = [
    {'from': 'swami-sivananda', 'to': 'divine-life-society', 'type': 'lineage_of', 'conf': 'high'},
    {'from': 'swami-sivananda', 'to': 'swami-chidananda-saraswati', 'type': 'teacher_of', 'conf': 'high'},
]
PEOPLE_FIX = {
    'jiddu-krishnamurti': {'tradition': 'krishnamurti'},
}
# edges: corrections after review (keys are the ids as the sourcer wrote them)
EDGE_DROP = {('plotinus', 'nag-hammadi-library'),   # Plotinus wrote AGAINST the Gnostics; not an influence
             ('paramahansa-yogananda', 'anandamayi-ma')}  # a meeting (1936), not an influence (flagged by the sourcer)
EDGE_FIX = {
    ('helena-blavatsky', 'jiddu-krishnamurti'): {'from': 'theosophy', 'note': 'Raised and groomed by the Theosophical Society (after Blavatsky\'s death); left it in 1929.'},
    ('dalai-lama', 'gelug'): {'type': 'influenced', 'note': 'The Gelug school was founded by Tsongkhapa; the Dalai Lama is its best-known teacher today.'},
}

# Topic vocabulary v2: reviewed nodes from the groups' topics-additions (keywords trimmed where they would mis-tag
# Hillside Hermitage titles: bare 'free', 'mu', 'om', 'the one', 'essence', 'appearance', 'spine').
TOPIC_NODES = {
    'consciousness': {'label': 'Consciousness', 'heat': 'Consciousness: compare takes',
                      'kw': ['consciousness', 'aware(ness)? of (being )?aware', 'pure awareness', 'witness(ing)? (consciousness|awareness)', 's[aā]k[sṣ]h?[iī]', 'chaitanya', 'caitanya', 'turiya', 'turīya', 'hard problem', 'being aware']},
    'consciousness/states': {'label': 'Waking, dream & deep sleep', 'kw': ['deep sleep', 'dreamless sleep', 'dream state', 'waking state', 'three states', 'm[aā]ndukya', 'avasth[aā]']},
    'reality': {'label': 'Reality & illusion', 'heat': 'Is the world real? compare takes',
                'kw': ['reality', 'real(ity)? of the world', 'brahman', 'non-?dual\\w*', 'advaita', 'illusion', 'unreal']},
    'reality/maya': {'label': 'Maya', 'kw': ['m[aā]y[aā]', 'superimposition', 'adhy[aā]sa', 'rope and (the )?snake', 'snake and (the )?rope']},
    'guru': {'label': 'The guru', 'heat': 'The guru: compare takes',
             'kw': ['guru\\w*', 'sadguru', 'satguru', '(spiritual|the|a true|perfect) master', 'disciple\\w*', 'initiation', 'd[iī]k[sṣ]h?[aā]', 'spiritual teacher']},
    'faith/bhakti': {'label': 'Bhakti (devotion)', 'kw': ['bhakti', 'bhakta', 'love (of|for) god', 'divine mother', 'kirtan', 'prapatti', 'ishta']},
    'faith/grace': {'label': 'Grace', 'kw': ['grace', 'kripa', 'kṛpā', 'anugraha', 'shaktipat', 'śaktipāt']},
    'self/self-enquiry': {'label': 'Self-enquiry', 'kw': ['self[- ]?enquiry', 'self[- ]?inquiry', '[aā]tma[- ]?vich[aā]ra', 'nan yar', 'n[aā]n y[aā]r', 'i am that']},
    'self/emptiness': {'label': 'Emptiness', 'kw': ['emptiness', 'sunyata', 'suññatā', 'śūnyatā', 'shunyata', 'interbeing', 'madhyamaka', 'heart sutra', 'form is emptiness']},
    'meditation/mantra': {'label': 'Mantra & japa', 'kw': ['mantra\\w*', 'japa', 'so-?ham', 'gayatri']},
    'meditation/kriya': {'label': 'Kriya, prana & kundalini', 'kw': ['kriya', 'kriyā', 'kundalini', 'kuṇḍalinī', 'pranayama', 'prāṇāyāma', 'chakras?', 'spiritual eye']},
    'meditation/koan': {'label': 'Koan', 'kw': ['koans?', 'kōans?', 'gateless (gate|barrier)', 'mumonkan', 'blue cliff', 'hua ?tou', 'mu koan', 'joshu', 'zhaozhou', 'genjo ?koan', 'genjōkōan']},
    'meditation/prayer': {'label': 'Prayer & contemplation', 'kw': ['centering prayer', 'contemplative prayer', 'lectio divina', 'jesus prayer', 'prayer of the heart', 'hesychas\\w*', 'welcoming prayer', 'theurgy']},
    'kamma/karma-yoga': {'label': 'Karma yoga', 'kw': ['karma yoga', 'selfless (work|action|service)', 'nishkama', 'niṣkāma', 'work as worship']},
    'kamma/western': {'label': 'Karma in Western esotericism', 'kw': ['karma in (theosophy|anthroposophy)', 'karmic connections?']},
    'kindness/compassion': {'label': 'Compassion', 'kw': ['compassion\\w*', 'karuna', 'karuṇā', 'bodhicitta', 'bodhichitta', 'tonglen', 'bodhisattva\\w*', 'self-compassion']},
    'death/bardo': {'label': 'Bardo', 'kw': ['bardo\\w*', 'intermediate state', 'between (death and rebirth|lives)', 'book of the dead', 'clear light of death', 'phowa']},
    'rebirth/western': {'label': 'Western reincarnation', 'kw': ['metempsychosis', 'transmigration of (the )?souls?', 'myth of er', 'between death and (a )?new birth', 'kamaloca', 'orphic\\w*']},
    'soul': {'label': 'The soul', 'heat': 'The soul: compare takes', 'kw': ['soul', 'souls', 'psyche', 'immortal soul', 'immortality of the soul', 'world.soul', 'astral body']},
    'gnosis': {'label': 'Gnosis', 'heat': 'Gnosis: compare takes', 'kw': ['gnosis', 'gnostic\\w*', 'secret knowledge', 'saving knowledge', 'nag hammadi', 'demiurge', 'archons?']},
    'divine': {'label': 'The divine', 'heat': 'God and the divine: compare takes', 'kw': ['godhead', 'divine', 'divinity', 'the sacred', 'theosis', 'deification', 'union with god', 'mystical union', 'does god exist']},
    'divine/the-one': {'label': 'The One', 'kw': ['monad', 'henads?', 'emanation', 'the good beyond being', 'alone with the alone', 'plotinus\' one']},
    'freedom': {'label': 'Freedom', 'heat': 'Freedom: compare takes', 'kw': ['freedom from the known', 'choiceless', 'conditioning', 'total freedom']},
}
TOPIC_KW_DROP = {'death': ['deathless']}
# topic ids a sourcer might use that name an existing node (karma vs kamma, reincarnation vs rebirth ...)
TOPIC_ALIAS = {
    'karma': 'kamma', 'karma/western': 'kamma/western', 'reincarnation': 'rebirth/western', 'rebirth/reincarnation': 'rebirth/western',
    'compassion': 'kindness/compassion', 'prayer': 'meditation/prayer', 'god': 'divine', 'the-one': 'divine/the-one',
    'emptiness': 'self/emptiness', 'bhakti': 'faith/bhakti', 'grace': 'faith/grace', 'devotion': 'faith', 'self-enquiry': 'self/self-enquiry',
    'bardo': 'death/bardo', 'koan': 'meditation/koan', 'mantra': 'meditation/mantra', 'samsara': 'rebirth/samsara', 'suffering': 'dukkha',
}
# clip tradition corrections (scholar channels: the passage's subject, not the speaker's default; reviewed 2026-10-20)
CLIP_TRADITION = {
    'stUXFuN-6T4@1482': 'platonic', 'stUXFuN-6T4@1028': 'platonic',              # Parmenides; the Orphics
    'vZEUo_sHoBw@1606': 'neoplatonism', 'vZEUo_sHoBw@1102': 'neoplatonism',      # Plotinus lecture
    'mXfK4nicygA@147': 'gnosticism', 'mXfK4nicygA@1439': 'gnosticism', 'mXfK4nicygA@2909': 'gnosticism',
    'ITfUCL1yTQQ@964': 'gnosticism', 'ockwMVE7PgM@58': 'gnosticism',
    'nLUd7quAHHg@164': 'gnosticism', 'nLUd7quAHHg@463': 'gnosticism',
}

# ---------- Place layer review (sources/places, 2026-10-20) ----------
# new tradition nodes decided at review (merged before the groups' traditions-additions)
TRAD_ADD = [
    {'id': 'siddha-yoga', 'label': 'Siddha Yoga', 'kind': 'lineage', 'parent': 'hindu', 'wikidata': 'Q3483106',
     'blurb': 'Guru-yoga path founded by Swami Muktananda in the line of Bhagawan Nityananda: shaktipat, chanting and meditation, drawing on Kashmir Shaiva texts.'},
]
EDGES_ADD += [
    {'from': 'kashmir-shaivism', 'to': 'siddha-yoga', 'type': 'influenced', 'conf': 'high', 'note': 'Muktananda taught from the Shiva Sutras and other Kashmir Shaiva texts.'},
    {'from': 'muktananda', 'to': 'siddha-yoga', 'type': 'lineage_of', 'conf': 'high'},
]
PEOPLE_FIX.update({
    'muktananda': {'tradition': 'siddha-yoga'},
    # Wikidata Q5072210 has no death date, but English Wikipedia (read 2026-10-20) gives 24 July 1928 - 19 September 2026.
    # Rule: living only when Wikidata has no death date AND nothing contradicts it; here it is contradicted, so not living.
    'chanmyay-sayadaw': {'years': '1928–2026', 'living': False},
})
# medium-confidence teacher_of edges from the places group = "studied with" (never shown as heir/teacher)
STUDIED_WITH_FROM_MEDIUM = True
# place tradition retags after review (place id -> traditions)
PLACE_TRADS = {'gurudev-siddha-peeth': ['siddha-yoga'], 'shree-muktananda-ashram': ['siddha-yoga']}
# places that must never get a map pin (location not public)
PLACE_NO_COORDS = {'hillside-hermitage'}

# ---------- Place contacts + free resources (user, 2026-10-20) ----------
# Contacts come from tools/place-contacts.py (official site only). Personal staff addresses are dropped by hand here.
PLACE_CONTACT_DROP = {'mike@shedrub.org', 'adrian.rsh@anth.org.uk', 'doris.bailiss.rsh@anth.org.uk', 'webteam@belurmath.org',
                      'treasury.hq@ts-adyar.org', 'finance@kagyu.org', 'chairman@globalpagoda.org', 'zendofeedback@upaya.org'}
# Free books / courses the organisation itself publishes (link out only, never rehosted). Checked 2026-10-20.
PLACE_RESOURCES = {
    'sivananda-rishikesh': [{'title': 'Free books by Swami Sivananda and Swami Chidananda (PDF / HTML)', 'url': 'https://www.dlshq.org/download/', 'free': True,
                             'licence': 'Free downloads published by The Divine Life Society; print editions are sold separately. Linked, not rehosted.',
                             'source_url': 'https://www.dlshq.org/', 'checked': '2026-10-20'}],
    'metta-forest': [{'title': 'Books and ebooks by Thanissaro Bhikkhu (dhammatalks.org)', 'url': 'https://www.dhammatalks.org/books/', 'free': True,
                      'licence': 'Free ebooks from Metta Forest Monastery; printed copies are mailed free of charge (some limits abroad). For free distribution.',
                      'source_url': 'https://www.dhammatalks.org/books/', 'checked': '2026-10-20'}],
    'bps-kandy': [{'title': 'Buddhist Publication Society: free-to-read books and Wheel publications', 'url': 'https://www.bps.lk/online-library', 'free': True,
                   'licence': 'Read online on bps.lk, as the Society publishes them; printed books are sold.',
                   'source_url': 'https://www.bps.lk/', 'checked': '2026-10-20'}],
}

# ---------- Deep tradition pass (sources/deep-*, places-uk; integrated 2026-10-20) ----------
# Every group's schools.json / traditions-additions.json is merged into ONE tradition tree. Ids that name the same school
# in two groups (or an existing node) are folded here; existing nodes keep their parent unless DEEP_REPARENT says otherwise.
DEEP_TRAD_MAP = {
    'christian-meditation': 'christian-meditation-wccm', 'orthodox-hesychasm': 'hesychasm', 'franciscan-contemplative': 'franciscan',
    'gaudiya-vaishnava': 'gaudiya', 'sivananda-yoga-vedanta': 'sivananda-yoga', 'satyananda-yoga': 'bihar-yoga',
    'learned-magic': 'western-magic', 'thien': 'plum-village-thien', 'serene-reflection': 'ocb',
}
# new families (parent None in a sourcer's tree); labels decided at review
DEEP_FAMILY = {
    'sufism': {'label': 'Sufism', 'blurb': 'The inner, mystical path of Islam: remembrance of God (dhikr), the master and the order, the poetry of love.'},
    'jewish': {'label': 'Jewish mysticism', 'blurb': 'Merkavah, Kabbalah, the Zohar and Hasidism: the contemplative and mystical currents of Judaism.'},
    'philosophy-of-the-sacred': {'label': 'Philosophy of the sacred', 'blurb': 'Contemporary philosophers and scientists on consciousness, meaning and the sacred: idealism, the divided brain, the meaning crisis, perennialism.'},
    'modern-paganism': {'label': 'Modern Paganism', 'blurb': 'Druidry, Wicca, Heathenry and goddess spirituality: nature-centred traditions revived or founded in the modern era.'},
    'sikh': {'label': 'Sikhism', 'blurb': 'The path of the ten Gurus and the Guru Granth Sahib: remembrance of the one Name, honest work and sharing.'},
}
DEEP_PARENT = {'kabbalah': 'jewish', 'tantra-studies': 'hindu', 'perennialism': 'philosophy-of-the-sacred'}
DEEP_REPARENT = {'kashmir-shaivism': 'shaivism'}   # existing node, moved under the new Śaivism umbrella (family unchanged: hindu)
DEEP_LABEL = {'tantra-studies': 'Tantra studies (academic)', 'buddhist-studies': 'Buddhist studies (academic)', 'hindu-studies': 'Hindu studies (academic)',
              'western-magic': 'Western magic', 'plum-village-thien': 'Thiền'}
# person ids that are the same person in two groups
DEEP_PERSON_MAP = {'srila-prabhupada': 'bhaktivedanta-swami-prabhupada'}
# clip rows dropped at review (deep pass)
DEEP_CARRIER_DROP = {'devotee-archive?'}         # unverified "Swami Lakshman Joo" Delhi channel (deep-tantra)
# publisher rows kept, with the carrier made explicit (publisher = the teacher's own publisher, allowed by the official-upload rule)
DEEP_CARRIER_LABEL = {'Be Here Now Network': 'publisher (Be Here Now Network, Insight Hour podcast)', 'Wisdom Publications Inc.': 'publisher (Wisdom Publications)'}
# speakers that are channels, not people (kept, shown as the organisation)
DEEP_ORG_SPEAKERS = {'kwan-um-school', 'tendai-buddhist-institute', 'shingon-foundation', 'nimatullahi-order'}
# lineage edge types shown on profiles (build-wise.py); low-confidence edges never merge
DEEP_EDGE_TYPES = {'teacher_of', 'academic_supervisor_of', 'influenced', 'translated', 'studied_with'}
# lineage-only people the deep groups' edges name but did not write as records: name (diacritics) and tradition decided here;
# anyone else gets a title-cased id and the tradition of the person or school at the other end of the edge
DEEP_STUB = {
    'luis-gomez': ('Luis O. Gómez', None), 'francine-herail': ('Francine Hérail', None), 'yanagida-seizan': ('Yanagida Seizan', 'chan'),
    'masatoshi-nagatomi': ('Masatoshi Nagatomi', None), 'geshe-lhundub-sopa': ('Geshe Lhundub Sopa', 'gelug'), 'geshe-ngawang-wangyal': ('Geshe Ngawang Wangyal', 'gelug'),
    'geshe-rabten': ('Geshe Rabten', 'gelug'), 'tsenzhab-serkong': ('Tsenzhab Serkong Rinpoche', 'gelug'), 'dilgo-khyentse': ('Dilgo Khyentse Rinpoche', 'nyingma'),
    'lopon-tenzin-namdak': ('Lopön Tenzin Namdak', 'bon'), 'chogyal-namkhai-norbu': ('Chögyal Namkhai Norbu', 'dzogchen'), 'kalu-rinpoche': ('Kalu Rinpoche', 'shangpa-kagyu'),
    'lama-norlha': ('Lama Norlha Rinpoche', 'kagyu'), 'karma-thinley': ('Karma Thinley Rinpoche', 'sakya'), 'dainin-katagiri': ('Dainin Katagiri', 'soto-zen'),
    'charlotte-joko-beck': ('Charlotte Joko Beck', 'ordinary-mind'), 'yamada-ryoun': ('Yamada Ryōun', 'sanbo-zen'), 'yamada-koun': ('Yamada Kōun', 'sanbo-zen'),
    'joan-rieck': ('Joan Rieck', 'sanbo-zen'), 'dolpopa': ('Dolpopa Sherab Gyaltsen', 'jonang'), 'zhiyi': ('Zhiyi', 'tiantai'), 'saicho': ('Saichō', 'tendai'),
    'kukai': ('Kūkai', 'shingon'), 'honen': ('Hōnen', 'jodo-shu'), 'shinran': ('Shinran', 'jodo-shinshu'), 'fazang': ('Fazang', 'huayan'),
    'khenpo-munsel': ('Khenpo Münsel', 'nyingma'), 'wangdor-rinpoche': ('Wangdor Rinpoche', 'nyingma'), 'gyatrul-rinpoche': ('Gyatrul Rinpoche', 'nyingma'),
    'henry-corbin': ('Henry Corbin', 'imaginal'), 'carl-jung': ('Carl Jung', 'jungian'), 'james-hillman': ('James Hillman', 'jungian'),
    'gershom-scholem': ('Gershom Scholem', 'kabbalah'), 'alexander-altmann': ('Alexander Altmann', 'kabbalah'), 'shlomo-pines': ('Shlomo Pines', 'jewish'),
    'ephraim-gottlieb': ('Ephraim Gottlieb', 'kabbalah'), 'abraham-joshua-heschel': ('Abraham Joshua Heschel', 'hasidism'), 'zalman-schachter-shalomi': ('Zalman Schachter-Shalomi', 'neo-hasidism'),
    'rene-guenon': ('René Guénon', 'perennialism'), 'hazrat-inayat-khan': ('Hazrat Inayat Khan', 'inayati'), 'vilayat-inayat-khan': ('Vilayat Inayat Khan', 'inayati'),
    'abdullah-daghestani': ('Abdullah Fa\'izi ad-Daghestani', 'naqshbandi'), 'munes-ali-shah': ('Munes Ali Shah', 'nimatullahi'), 'rumi': ('Rumi', 'mevlevi-rumi'),
    'pierre-hadot': ('Pierre Hadot', 'platonic'), 'antoine-faivre': ('Antoine Faivre', 'western-esotericism-scholarship'), 'egil-asprem': ('Egil Asprem', 'western-esotericism-scholarship'),
    'marco-pasi': ('Marco Pasi', 'western-esotericism-scholarship'), 'nicholas-goodrick-clarke': ('Nicholas Goodrick-Clarke', 'western-esotericism-scholarship'),
    'thomas-taylor': ('Thomas Taylor', 'neoplatonism'), 'iamblichus': ('Iamblichus', 'theurgy'), 'porphyry': ('Porphyry', 'neoplatonism'), 'syrianus': ('Syrianus', 'neoplatonism'),
    'john-dillon': ('John Dillon', 'neoplatonism'), 'crystal-addey': ('Crystal Addey', 'neoplatonism'), 'gregory-shaw': ('Gregory Shaw', 'theurgy'), 'tim-addey': ('Tim Addey', 'neoplatonism'),
}
DEEP_STUB_SKIP = {'michel-foucault', 'prometheus-trust-org'}
# deep-pass title-tagging fixes (per topic id: keywords dropped / added for the deep catalogues only; Hillside tagging unchanged)
DEEP_TOPIC_FIX = {
    'emotions/sadness': {'drop': ['sad\\w*'], 'add': ['sad', 'sadness', 'saddened']},
    'relationships': {'drop': ['mother', 'father', 'parents?']},
    'rebirth': {'drop': ['bhava']},
    'kamma': {'drop': ['intention', 'merit']},
    'virtue': {'drop': ['lie', 'lying']},
    'craving/sensuality': {'drop': ['pleasures?', 'sensual pleasures?', 'porn\\w*', 'sex\\w*']},
    'impermanence': {'drop': ['change', 'changing', 'uncertain\\w*']},
    'death/bardo': {'drop': ['bardo\\w*'], 'add': ['bardos?']},
    'feeling': {'drop': ['body', 'bodily', 'kaya', 'kāya', 'pleasant']},
    'guru': {'drop': ['(spiritual|the|a true|perfect) master'], 'add': ['spiritual master', 'perfect master', 'true master']},
    'craving': {'drop': ['passion']},
}
# short topic names for machine-cut passage titles ('<a> and <b> (from <lecture>)')
DEEP_TOPIC_SHORT = {'divine/goddess': 'the Goddess', 'faith/ritual': 'ritual', 'texts/tantra': 'the tantras', 'texts/history': 'history of the texts',
                    'divine': 'the divine', 'guru': 'the guru', 'self': 'the self', 'faith': 'devotion', 'reality': 'reality', 'meditation/kundalini': 'kuṇḍalinī',
                    'meditation/hatha': 'haṭha yoga', 'texts': 'the texts', 'right-view': 'right view', 'faith/grace': 'grace', 'soul': 'the soul',
                    'meditation/mantra': 'mantra', 'consciousness/states': 'states of consciousness', 'kindness/compassion': 'compassion', 'self/emptiness': 'emptiness'}
# lecture names for those titles (the uploads' own titles, minus speaker and series codes)
DEEP_LECTURE = {
    'Ep 71 ~ A Life of Learning with Alexis Sanderson': 'A Life of Learning, with Christopher Wallis',
    'YSP 9 Jason Birch | Manuscript Hunting and the History of Medieval Yogas': 'Manuscript Hunting and the History of Medieval Yogas',
    'Prof. Alexis Sanderson - Śāktism outside of Kashmir (part 3)': 'Śāktism outside Kashmir, part 3',
    'The Tantrāloka by Abhinavagupta : Content and Construction Speaker Dr. Mark Dyczkowski [Part- 1(B)]': 'The Tantrāloka: Content and Construction',
    'The Netra-tantra and its Yogas - Gavin Flood': 'The Netra-tantra and its Yogas',
    'Sinister Yogis (Day 1) - by David Gordon White': 'Sinister Yogis, day 1',
    'How is Kuṇḍalinī conceived when she first appears in Śaivasiddhānta scriptures? Dominic Goodall EFEO': 'Kuṇḍalinī in the early Śaivasiddhānta scriptures',
    'The Roots of Mindfulness Part 1, with Professor Douglas Brooks': 'The Roots of Mindfulness, part 1',
    'Prof. Alexis Sanderson -  Śāktism among the Śaivas (part 2)': 'Śāktism among the Śaivas, part 2',
    'Prof. Alexis Sanderson - Readings in the Tantrāloka I': 'Readings in the Tantrāloka I',
    'Early Haṭhayoga: Buddhist Tantric Sex to Hindu Physical Yoga with Dr James Mallinson': 'Early Haṭhayoga: from Buddhist Tantra to Physical Yoga',
    'Prof. Isaacson - Interactions, Intersections, Interdependence: Śāktism and the Indian Vajrayāna': 'Śāktism and the Indian Vajrayāna',
    'Dr James Mallinson - New Light on Śāktism and Haṭhayoga': 'New Light on Śāktism and Haṭhayoga',
    'Wonder and Being in a Body with Loriliai Biernacki': 'Wonder and Being in a Body',
}
# Deep-pass topic nodes (proposed by deep-tibetan-eastasian / deep-tantra / deep-western; kept where depth >= 12 clips across
# >= 2 traditions, checked by tools/build-clips.py output on 2026-10-20; DEEP_TOPIC_HELD lists the ones that fell short)
TOPIC_NODES.update({
    'meditation/kriya': {'label': 'Kriya Yoga', 'kw': ['kriya', 'kriyā', 'pranayama', 'prāṇāyāma', 'spiritual eye']},
    'meditation/kundalini': {'label': 'Kundalini & the subtle body', 'kw': ['ku[nṇ][dḍ]alin[iī]', 'chakras?', 'cakras?', 'n[aā][dḍ][iī]s', 'subtle body', 'energy body', 'shaktipat', 'śaktipāt', 'serpent power']},
    'meditation/hatha': {'label': 'Haṭha yoga', 'kw': ['ha[tṭ]ha ?yoga', 'ha[tṭ]hayoga', '[aā]sanas?', 'mudr[aā]s?', 'kh?ecar[iī]', 'bandhas?']},
    'meditation/dzogchen': {'label': 'Dzogchen', 'kw': ['dzogchen', 'rigpa', 'great perfection', 'trekch[oö]', 'th[oö]gal']},
    'meditation/lojong': {'label': 'Lojong (mind training)', 'kw': ['lojong', 'mind training', 'seven points', 'tonglen']},
    'meditation/silent-illumination': {'label': 'Silent illumination & just sitting', 'kw': ['silent illumination', 'mozhao', 'shikantaza', 'just sitting', 'zazen']},
    'faith/pure-land': {'label': 'Pure Land', 'kw': ['pure land', 'amida', 'amitabha', 'amitābha', 'nembutsu', 'nianfo', 'shinjin', 'other power']},
    'faith/ritual': {'label': 'Ritual, worship & initiation', 'kw': ['ritual\\w*', 'puj[aā]', 'yantras?', 'ma[nṇ][dḍ]alas?', 'ny[aā]sa', 'worship', 'homa', 'empowerments?', 'deity yoga']},
    'awakening/buddha-nature': {'label': 'Buddha-nature', 'kw': ['buddha[- ]nature', 'tath[aā]gatagarbha', 'shentong']},
    'divine/goddess': {'label': 'The Goddess', 'kw': ['goddess\\w*', 'devi', 'dev[iī]', 'shakti', 'śakti', 'k[aā]l[iī]', 'lalit[aā]', 'tripura\\w*', 'durga', 'yogin[iī]s', 'mah[aā]vidy\\w*', 'divine feminine', 'divine mother', 'bhairav[iī]']},
    'texts/tantra': {'label': 'The tantras', 'kw': ['tantras', 'tantra[- ]s[aā]stra', 'tantr[aā]loka', 'shiva ?s[uū]tras?', 'śiva ?s[uū]tras?', 'spanda', 'vij[nñ][aā]na[- ]?bhairava', 'pratyabhij\\w*', '[aā]gamas', 'k[aā]rik[aā]s?']},
    'imaginal': {'label': 'The imaginal', 'heat': 'The imaginal: compare takes',
                 'kw': ['imaginal', 'mundus imaginalis', 'active imagination', 'archetyp\\w*', 'daimon\\w*', 'imagination', 'corbin', 'hillman', 'visionary', 'world soul', 'anima mundi']},
    'reality/nonduality': {'label': 'Nonduality', 'kw': ['non-?dual\\w*', 'advaita', 'not[- ]two', 'oneness', 'no separation']},
})
TOPIC_ALIAS.update({'ritual': 'faith/ritual', 'goddess': 'divine/goddess', 'kundalini': 'meditation/kundalini', 'nonduality': 'reality/nonduality'})
DEEP_TOPIC_HELD = {'meditation/mahamudra': '6 clips (below 12)', 'texts/history': 'too broad (history/origins match everything)', 'reality/threefold-truth': 'too few', 'reality/interpenetration': 'too few', 'guru/tantra': 'folded into faith/ritual (empowerment, deity yoga)'}

# ---------- keeper fixes (keeper/REPORT.md findings, reviewed 2026-10-20) ----------
# Applied to wisegraph/*.json by tools/apply-keeper-fixes.py (idempotent; merge-sources.py runs it last, so a re-merge keeps them).
# Every changed fact carries source_url + verified_on + confidence.
KEEPER_VERIFIED = '2026-10-20'
KEEPER_PEOPLE = {
    'mark-dyczkowski': {
        'years': '1951–2025', 'living': False, 'died': '2025-02-02', 'died_place': 'Varanasi',
        'bio': 'English Indologist and sitarist who lived four decades in Varanasi; initiated by Lakshmanjoo in 1976; translator of the Spanda texts, '
               'the Manthānabhairava Tantra and the 11-volume Tantrāloka. Died in Varanasi on 2 February 2025. Since April 2026 his students '
               'Arjun Seernels and Brian Campbell lead the Anuttara Trika Kula Reading Circles.',
        'source_url': 'https://link.springer.com/article/10.1007/s42240-025-00218-y',
        'sources': ['https://link.springer.com/article/10.1007/s42240-025-00218-y',
                    'https://list.indology.info/pipermail/indology/2025-February/060196.html',
                    'https://www.anuttaratrikakula.org/reading-circles/'],
        'confidence': 'high',
    },
    # official site: sanshin.org (an old domain that no longer answers) -> the Sanshin Zen Community's own site
    'shohaku-okumura': {'links': {'Website': 'https://www.sanshinji.org'}, 'source_url': 'https://www.sanshinji.org/', 'confidence': 'high'},
}
# edges matched on (from, to); 'type' may change. Wikipedia moved pages; dead source URLs replaced.
KEEPER_EDGES = [
    # Dyczkowski's doctorate (Oxford): his own site says he researched "under the guidance of Professor Alexis Sanderson";
    # Wikipedia (and the 2025 Journal of Dharma Studies obituary) name Richard Gombrich as his supervisor. Kept both, Gombrich disputed.
    {'match': ('alexis-sanderson', 'mark-dyczkowski'), 'set': {'type': 'academic_supervisor_of', 'conf': 'high',
        'note': 'Oxford DPhil on Kashmir Shaivism "under the guidance of Professor Alexis Sanderson" (his own site).',
        'src': 'https://www.anuttaratrikakula.org/about-sadaasaya-mark-dyczkowski/'}},
    {'match': ('richard-gombrich', 'mark-dyczkowski'), 'set': {'type': 'academic_supervisor_of', 'conf': 'low',
        'note': 'Disputed: Wikipedia and the 2025 Journal of Dharma Studies obituary name Gombrich as his formal Oxford supervisor; '
                'his own site names only Alexis Sanderson (see keeper/known-conflicts.json dyczkowski-supervisor).',
        'src': 'https://en.wikipedia.org/wiki/Mark_S._G._Dyczkowski'}},
    {'match': ('ajahn-brahm', 'bhante-sujato'), 'set': {'src': 'https://en.wikipedia.org/wiki/Bhante_Sujato'}},
    {'match': ('mahasi-sayadaw', 'sayadaw-u-silananda'), 'set': {'src': 'https://tbsa.org/usilananda/biography-uslnd',
        'note': 'Taught Vipassanā in the Mahāsi tradition; came to the US with Mahāsi Sayadaw in 1979 and stayed (TBSA).'}},
    {'match': ('swami-sivananda', 'swami-vishnudevananda'), 'set': {'src': 'https://en.wikipedia.org/wiki/Vishnudevananda_Saraswati'}},
    {'match': ('swami-vishnudevananda', 'sivananda-yoga'), 'set': {'src': 'https://en.wikipedia.org/wiki/Vishnudevananda_Saraswati'}},
    {'match': ('swami-satyananda', 'swami-niranjanananda'), 'set': {'src': 'https://en.wikipedia.org/wiki/Niranjanananda_Saraswati'}},
]
KEEPER_PLACES = {
    'bede-griffiths-sangha': {'url': 'https://bedegriffithssangha.org.uk/', 'offers': ['online meditation (monthly Zoom Ashram)'],
        'description': 'UK community founded after Bede Griffiths\u2019 death; it no longer meets in person and now gathers monthly online (Zoom Ashram) and keeps his resources.',
        'source_url': 'https://bedegriffithssangha.org.uk/', 'confidence': 'high'},
    'dragon-bell-temple': {'url': 'https://dragonbelltemple.org.uk/', 'source_url': 'https://obcon.org/dragon-bell-temple/', 'confidence': 'high'},
    'srf-london': {'url': 'https://yoganandalondon.org/', 'source_url': 'https://yogananda.org/locations/london-meditation-center', 'confidence': 'high'},
    'dhamma-giri': {'url': 'https://giri.vridhamma.org/', 'source_url': 'https://www.dhamma.org/en/schedules/schgiri', 'confidence': 'high'},
    'dhamma-kanheri': {'url': 'https://kanheri.vridhamma.org/', 'source_url': 'https://www.dhamma.org/en/schedules/schkanheri', 'confidence': 'high'},
    'maison-de-l-inspir': {'url': 'https://maisondelinspir.org/', 'source_url': 'https://maisondelinspir.org/', 'confidence': 'high'},
    # 'nag-hammadi' is the codices (a text), not a teacher: places tie to people only
    'coptic-museum': {'teachers': []},
    'nag-hammadi-site': {'teachers': []},
    # India study: Library of Tibetan Works and Archives = tibetanlibrary.org (ltwa.net is not its site)
    'ltwa': {'url': 'https://tibetanlibrary.org', 'source_url': 'https://tibetanlibrary.org', 'confidence': 'high'},
}
# duplicate places: old id -> kept id (/place/<old> 301s to the kept page)
KEEPER_ALIAS_REDIRECTS = {  # short slugs people reach for (seen 404 after batch 3): 301 to the canonical id; never reused as ids
    'places': {'wudang': 'wudang-zixiao'},
    'people': {'uddalaka-aruni': 'uddalaka'},
}
KEEPER_PLACE_MERGE = {'dhamma-khetta2': 'dhamma-khetta'}   # same centre, same dhamma.org page text; schkhetta (1976) kept
# India study bad URLs, applied wherever these places exist (none of them are in the live data on 2026-10-20)
KEEPER_URL_BAN = {'trimbakeshwar.org': None, 'kamakhyatemple.org': 'https://maakamakhya.org', 'ltwa.net': 'https://tibetanlibrary.org'}
# cited URLs that moved (practices/texts read straight from sources/deep-*): old -> current official page
# India study places removed before merge (reason recorded in the review queue). Schema requires an ISO-3166 alpha-2 country.
# nathas-org-natha-tradition: pack gave country "INT"; nathas.org (about, contacts, disciples pages, checked 2026-10-21) names no
# headquarters country (disciples "in different countries"; teachers listed in Moscow, Chelyabinsk...), so no honest ISO code exists.
PLACE_DROP = {'nathas-org-natha-tradition': 'country "INT" is not ISO 3166; nathas.org (about/contacts/disciples, checked 2026-10-21) states no headquarters country; schema requires one, so the record is removed (people and resources kept)'}
KEEPER_URL_MOVED = {'https://sanshin.org': 'https://www.sanshinji.org/'}

# ---------- main teachers checked on each place's OFFICIAL site (2026-10-21) ----------
# (place, teacher) -> verdict. 'publish' = the official page states it now (published with conf high + source); 'hold' = it does not
# (kept in the review queue with the reason). Applied by merge-sources.py over the packs' medium-confidence main-teacher rows.
MAIN_TEACHER_CHECK = {
    ('amaravati', 'ajahn-amaro'): {'verdict': 'publish', 'verified_on': '2026-10-21', 'source_url': 'https://amaravati.org/about/male-monastic-community/',
        'why': 'Male Monastic Community page lists "Luang Por Amaro – Abbot" (abbot since November 2010).'},
    ('aruna-ratanagiri', 'ajahn-munindo'): {'verdict': 'publish', 'verified_on': '2026-10-21', 'source_url': 'https://ratanagiri.org.uk/',
        'why': 'Home page: "The abbot, Ajahn Munindo, received bhikkhu precepts from ... Ajahn Chah ... in 1976."'},
    ('cittaviveka', 'ajahn-sucitto'): {'verdict': 'hold', 'verified_on': '2026-10-21', 'source_url': 'https://www.cittaviveka.org/guiding-elders',
        'why': 'Guiding Elders page: Luang Por Sucitto "was the abbot ... from 1992 until 2014" and is now a Guiding Elder, not the current abbot'},
    ('spirit-rock', 'jack-kornfield'): {'verdict': 'hold', 'verified_on': '2026-10-21', 'source_url': 'https://www.spiritrock.org/teachers/jack-kornfield',
        'why': 'teacher page calls him "a founding teacher of ... Spirit Rock"; the site names no single current main teacher (a teachers community)'},
    ('patanjali-yogpeeth', 'swami-ramdev'): {'verdict': 'hold', 'verified_on': '2026-10-21', 'source_url': 'https://divyayoga.com/trustees/swami-ramdev-ji/',
        'why': 'official trust site lists him as a trustee and co-founder of Divya Yog Mandir Trust (with Acharya Balkrishna, under Swami Shankar Dev); no page states a main teacher of Patanjali Yogpeeth'},
}
# India study resource links replaced by the publisher's own current page (old link moved / pointed at a home page)
RESOURCE_URL_FIX = {
    'mallinson-nath-sampradaya': 'https://eprints.soas.ac.uk/17972/',  # old eprints PDF path; the record now lives on SOAS Research Online (this URL redirects there)
    'ltwa-free-downloads': 'https://tibetanlibrary.org/free-download-resources/',  # was the LTWA home page; this is the Library's free-downloads page
}
