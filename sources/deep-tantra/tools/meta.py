import json, os, sys, re
from collections import Counter, defaultdict
sys.path.insert(0, os.path.dirname(__file__))
from config import SPEAKERS, CHANNELS
import graphdata as G
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
clips = json.load(open(B + '/clips.json'))
pool = json.load(open(B + '/raw/pool.json'))
longs = json.load(open(B + '/long-lectures.json'))
cnt = Counter(c['speaker'] for c in clips)
vcnt = Counter(c['speaker'] for c in clips if c.get('parent'))
lcnt = Counter(l['speaker'] for l in longs)
chans = defaultdict(set)
for c in clips: chans[c['speaker']].add(c['channel'])
# fix Rudi source to a real clip url
rudi = next((p for p in pool if 'Double-Breath' in p['title']), None)
for e in G.E:
    if e['from_'] == 'swami-rudrananda' and rudi: e['source'] = 'https://www.youtube.com/watch?v=' + rudi['id']

# ---------------- people.json ----------------
people = []
ids = set(G.PEOPLE) | set(cnt)
for pid in sorted(ids):
    d = dict(G.PEOPLE.get(pid, {}))
    if not d:
        nm, rx, role, school = SPEAKERS[pid]
        d = dict(name=nm, role=role, school=school, years=None, bio=None, site=None)
    n = cnt.get(pid, 0)
    people.append({
        'id': pid, 'name': d['name'], 'role': d['role'], 'kind': 'figure' if d['role'] == 'figure' else 'speaker',
        'tradition': d.get('school'), 'school': d.get('school'), 'years': d.get('years'), 'bio': d.get('bio'),
        'site': d.get('site'), 'wikidata': d.get('wikidata'), 'existing': bool(d.get('existing')),
        'clip_count': n, 'virtual_clips': vcnt.get(pid, 0), 'long_lectures_listed': lcnt.get(pid, 0),
        'channels': sorted(chans.get(pid, [])), 'tier': 'main' if n >= 8 else ('more-voices' if n > 0 else 'graph-only'),
    })
main = [p['id'] for p in people if p['tier'] == 'main']
more = [p['id'] for p in people if p['tier'] == 'more-voices']
json.dump({'_note': 'deep-tantra people (2026-10-20). role teacher|scholar|educator|figure. tier main = >=8 embeddable clips here; more-voices = 1-7; graph-only = lineage nodes without clips. existing:true = id already in app/wisegraph/people.json (merge, do not duplicate). Sanderson is kind figure in app; propose role scholar.',
           'main': main, 'more_voices': more, 'people': people}, open(B + '/people.json', 'w'), indent=1, ensure_ascii=False)

# ---------------- lineages.json ----------------
edges = [{'from': e['from_'], 'to': e['to'], 'type': e['type'], 'conf': e['conf'], 'source': e['source'], 'note': e['note']} for e in G.E]
json.dump({'_note': 'Edges typed teacher_of | academic_supervisor_of | influenced | translated | founded. conf high = stated in the cited source; medium = standard account, source not re-read today; low = plausible but UNVERIFIED (keep out of the public graph until checked). academic_supervisor_of only where a thesis supervisor is documented. Targets that are texts/orgs (shiva-sutras, blue-throat-yoga...) are node ids proposed in schools.json/texts.json.',
           'edges': edges}, open(B + '/lineages.json', 'w'), indent=1, ensure_ascii=False)

# ---------------- schools.json ----------------
S = [
 ('shaivism', 'hindu', 'Śaivism', 'c. 2nd c. CE (Pāśupata) – present', ['lakulisha', 'abhinavagupta'], 'trident (triśūla)', 'Umbrella for Śiva-centred traditions: the ascetic Atimārga and the initiatory Mantramārga.'),
 ('pashupata', 'shaivism', 'Pāśupata (Atimārga)', 'c. 2nd–12th c.', ['lakulisha'], 'ash-smeared ascetic / staff (lakuṭa)', 'Earliest Śaiva ascetic order; ash, feigned madness, provoking censure.'),
 ('shaiva-siddhanta', 'shaivism', 'Śaiva Siddhānta', 'c. 5th c. – present', ['sivaya-subramuniyaswami', 'bodhinatha-veylanswami', 'dominic-goodall'], 'Śiva liṅga with three lines of ash', 'Mainstream ritual Śaivism of the Mantramārga; Sanskrit āgamas, later the Tamil Śaiva temple tradition. Kauai Aadheenam teaches a monistic form.'),
 ('kashmir-shaivism', 'shaivism', 'Kashmir Shaivism (non-dual Śaiva Tantra)', 'c. 9th c. – present', ['vasugupta', 'abhinavagupta', 'swami-lakshmanjoo'], 'Śiva–Śakti in one (ardhanārīśvara) or trident of three goddesses', 'EXISTING node (school under hindu). Proposed parent: shaivism. Covers Trika, Pratyabhijñā, Spanda and Krama as practised in Kashmir.'),
 ('trika', 'kashmir-shaivism', 'Trika', 'c. 9th–12th c. (texts); revived 20th c.', ['abhinavagupta', 'kshemaraja'], 'triśūla with three goddesses Parā, Parāparā, Aparā', 'Abhinavagupta\'s synthesis around the Mālinīvijayottara; Tantrāloka.'),
 ('pratyabhijna', 'kashmir-shaivism', 'Pratyabhijñā (Recognition)', 'c. 900–1050', ['somananda', 'utpaladeva', 'abhinavagupta', 'kshemaraja'], 'mirror (pratibimba)', 'Philosophical school: liberation as recognising oneself as Śiva.'),
 ('spanda', 'kashmir-shaivism', 'Spanda (Vibration)', 'c. 850 – present', ['vasugupta', 'kshemaraja'], 'ripple / vibrating wave', 'Śiva Sūtras and Spanda Kārikās: consciousness as pulsation.'),
 ('krama', 'kashmir-shaivism', 'Krama / Kālīkula (Mahārtha)', 'c. 9th–13th c.; living Kālī practice', ['abhinavagupta', 'yamajit'], 'Kālī with the wheel of twelve Kālīs', 'Kālī-centred phases (krama) of cognition; Twelve Kālīs.'),
 ('kaula', 'shaktism', 'Kaula / Kula', 'c. 9th c. – present', ['matsyendranatha', 'judit-torzsok', 'shaman-hatley'], 'circle of yoginīs (yoginī-cakra)', 'Clan (kula) cults of yoginīs and Bhairava; source of many later Śākta and haṭha practices.'),
 ('shaktism', 'hindu', 'Śāktism', 'c. 6th c. – present', ['anandamayi-ma', 'sravana-borkataky-varma'], 'downward triangle / Devī', 'Goddess-centred traditions; parent of Kaula, Śrī Vidyā and Kālī lines.'),
 ('shakta', 'shaktism', 'Śākta practice (Kālī, Kāmākhyā, Bhairavī)', 'living', ['rajarshi-nandy', 'sadhguru'], 'Kālī\'s sword / Kāmākhyā yoni-pīṭha', 'Bucket for living goddess practice not tied to a single classical school (Kāmākhyā upāsanā, Linga Bhairavi, Daśa Mahāvidyā).'),
 ('sri-vidya', 'shaktism', 'Śrī Vidyā', 'c. 11th c. – present', ['amritananda', 'rajmani-tigunait', 'douglas-brooks', 'om-swami'], 'Śrī Yantra / Śrī Chakra', 'Worship of Lalitā Tripurasundarī through the Śrī Chakra and the fifteen-syllable mantra.'),
 ('siddha-siddhanta', 'shaivism', 'Nāth / Siddha Siddhānta', 'c. 12th c. – present', ['gorakhnath', 'matsyendranatha', 'david-gordon-white'], 'split earrings (kuṇḍala) and horn whistle', 'Nāth yogī order (Gorakhnāth); Siddha Siddhānta Paddhati; alchemy and haṭha.'),
 ('hatha', 'siddha-siddhanta', 'Haṭha Yoga (premodern)', 'c. 11th c. – present', ['james-mallinson', 'jason-birch', 'mark-singleton'], 'figure in a seated posture with mudrā', 'Physical-yogic methods first set out in Vajrayāna and Śaiva circles (Amṛtasiddhi, Dattātreyayogaśāstra, Haṭhapradīpikā).'),
 ('vajrayana', 'buddhism', 'Vajrayāna (Indian tantric Buddhism)', 'c. 7th c. – present', ['harunaga-isaacson', 'peter-daniel-szanto'], 'vajra and bell', 'EXISTING node. Here: its Indian origins and its borrowings from Śaiva/Śākta tantra (Sanderson\'s thesis; Isaacson, Szántó, Mallinson on the Amṛtasiddhi).'),
 ('siddha-yoga', 'kashmir-shaivism', 'Siddha Yoga', '1956 – present', ['muktananda'], 'blue pearl', 'EXISTING lineage node; kept as the modern channel through which Kashmir Shaiva texts reached Kempton, Shankarananda, Muller-Ortega.'),
 ('tantra-studies', None, 'Academic study of tantra', '19th c. – present', ['alexis-sanderson', 'andre-padoux', 'gavin-flood'], 'palm-leaf manuscript', 'Not a tradition: a field tag for scholarly lectures (philology, history).'),
]
schools = [{'id': i, 'parent': p, 'name': n, 'dates': d, 'key_figures': k, 'symbol': sym, 'note': note,
            'clips_here': sum(1 for c in clips if c['tradition'] == i)} for i, p, n, d, k, sym, note in S]
orgs = [{'id': 'tantra-illuminated', 'kind': 'organisation', 'founder': 'christopher-wallis', 'site': 'https://tantrailluminated.com'},
        {'id': 'blue-throat-yoga', 'kind': 'organisation', 'founder': 'paul-muller-ortega', 'site': 'https://www.bluethroatyoga.com', 'founded': 2006},
        {'id': 'jaya-kula', 'kind': 'organisation', 'founder': 'shambhavi-sarasvati', 'site': 'https://jayakula.org'},
        {'id': 'devipuram', 'kind': 'temple', 'founder': 'amritananda', 'site': 'https://devipuram.org'},
        {'id': 'rajanaka', 'kind': 'organisation', 'founder': 'douglas-brooks', 'site': 'https://rajanaka.com'},
        {'id': 'vimarsha-foundation', 'kind': 'organisation', 'founder': 'sthaneshwar-timalsina', 'site': 'https://www.vimarshafoundation.org'},
        {'id': 'hatha-yoga-project', 'kind': 'research project', 'founder': 'james-mallinson', 'site': 'https://yoga.ames.ox.ac.uk/hyp'},
        {'id': 'universal-shaiva-fellowship', 'kind': 'organisation', 'founder': 'john-hughes', 'site': 'https://www.universalshaivafellowship.org'},
        {'id': 'kauai-aadheenam', 'kind': 'monastery', 'founder': 'sivaya-subramuniyaswami', 'site': 'https://www.himalayanacademy.com'}]
json.dump({'_note': 'Proposed tradition nodes (wisegraph traditions shape: id, parent, name). kashmir-shaivism, vajrayana and siddha-yoga already exist; do not duplicate. Clip rows use these ids in tradition/traditions[].', 'schools': schools, 'organisations': orgs},
          open(B + '/schools.json', 'w'), indent=1, ensure_ascii=False)
print('people', len(people), 'main', len(main), 'more', len(more), 'edges', len(edges))
