#!/usr/bin/env python3
"""Mini-courses (collection kind `mini-course`, DATA-MODEL §2.4): 3-6 gold talks in a teaching order, 1-3 practices, optional
reading, and "where to go deeper" (places already in the wisegraph). Satsang's own words. Writes them into
wisegraph/collections.json (replacing any earlier mini-course entries; other collections untouched) and checks every ref:
talks must be gold (wisegraph/gold-judgements.json), practices must exist, readings must pass tools/licence_gate.py,
places must exist. Dharma Seed is never cut (no Dharma Seed passages here); the Hareesh 2018 PDF is never linked.
Run before build-collections.py:  python3 tools/mini_courses_src.py
Unit shape: {n, title, intro?, items:[{role, ref, note?, url?, title?}]}. Course player: talk -> practice -> next (src/minicourse.js).
"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); APP = os.path.dirname(HERE); WISER = os.path.dirname(APP)
sys.path.insert(0, HERE)
from licence_gate import licence_for, linkable

W = lambda cid, note=None: {'role': 'watch', 'ref': 'clip:' + cid, **({'note': note} if note else {})}
P = lambda pid, note=None: {'role': 'practise', 'ref': 'practice:' + pid, **({'note': note} if note else {})}
T = lambda tid, note=None: {'role': 'read', 'ref': 'text:' + tid, **({'note': note} if note else {})}
U = lambda url, title, note=None: {'role': 'read', 'ref': 'url:' + url, 'url': url, 'title': title, **({'note': note} if note else {})}
D = lambda pid, note: {'ref': 'place:' + pid, 'note': note}
def unit(n, title, items, intro=None): return {'n': n, 'title': title, **({'intro': intro} if intro else {}), 'items': items}

C = []
C.append({'id': 'how-buddhist-rebirth-works', 'title': 'How Buddhist rebirth works', 'topic': 'rebirth', 'tradition': 'buddhism', 'school': 'theravada',
  'traditions': ['theravada', 'tibetan'], 'level': 'first-steps', 'minutes': 95,
  'intro': 'What the Buddha taught about death and the next life, why it is not the reincarnation of a soul, and how the Tibetan tradition maps the passage between lives. Five talks, one reflection, two short readings.',
  'units': [
    unit(1, 'What happens at death', [W('EWFSAFHpx_U@440', 'Start here: the Theravada picture of dying and what conditions the next birth.')]),
    unit(2, 'If there is no self, what is reborn?', [W('O8OiOPhGWbE', 'The classic puzzle, answered from the suttas.')]),
    unit(3, 'Kamma drives the process', [W('tzwN8i6gXio', 'Why rebirth and kamma belong together, and why that is good news.'), T('karma', 'A short essay on kamma, free from Access to Insight.')]),
    unit(4, 'Reflect on the round', [P('recollecting-the-round', 'Ten minutes with the Buddha\'s reflection on the long round of births (SN 15:3).')]),
    unit(5, 'The Tibetan view', [W('LqTa_ubCoRY', 'Rebirth in the Tibetan tradition, with stories, from a scholar trained by the Dalai Lama.')]),
    unit(6, 'Between lives: the bardo', [W('PuBZ5ohp_c0', 'The four bardos in four minutes.'), T('does-rebirth-make-sense', 'Bhikkhu Bodhi weighs whether rebirth makes sense to a modern mind.')]),
  ],
  'deeper': [D('amaravati', 'Thai forest monastery in England; retreats and weekend teachings.'), D('kopan', 'Tibetan monastery in Nepal known for its month-long introductory course.')]})

C.append({'id': 'remembering-past-lives', 'title': 'Past lives: what the texts say, and the ground to stand on', 'topic': 'rebirth', 'tradition': 'buddhism', 'school': 'theravada',
  'traditions': ['theravada'], 'level': 'steady', 'minutes': 70, 'orientationOnly': True,
  'caution': 'Orientation only. The recollection of former lives is traditionally developed under a teacher, after deep concentration is mastered. No results are promised, and memories that seem to surface can be imagination.',
  'intro': 'The suttas and the Visuddhimagga describe recollecting former lives as a by-product of a very calm mind, never a goal. Hear how teachers in the forest tradition explain it, build the real foundation (steady breath meditation), and read the sources yourself.',
  'units': [
    unit(1, 'What the suttas mean by it', [W('_4BFX_qhhyk', 'A forest monk on seeing past lives, and why it matters less than people think.')]),
    unit(2, 'Through meditation, not technique', [W('HGo0NbOROFY', 'How deep stillness is said to open this memory.')]),
    unit(3, 'The foundation: the breath', [P('mindfulness-of-breathing', 'The groundwork the texts insist on. Begin here, daily.')]),
    unit(4, 'Meditation as the window', [W('EWFSAFHpx_U@900', 'Why a still mind is the best way to understand rebirth at all.')]),
    unit(5, 'Do you have to believe it?', [W('sVc45SXDrEQ', 'A direct answer: practice does not hang on belief.')]),
    unit(6, 'The sources, and the practice as the texts give it', [P('recollection-of-past-lives-orientation', 'What the manuals describe, shown for orientation only.'),
       T('mn-4-fear-terror-bhaya-bherava-sutta', 'MN 4: the Buddha\'s own account of the three knowledges.'),
       U('https://www.accesstoinsight.org/lib/authors/nanamoli/PathofPurification2011.pdf', 'Visuddhimagga, chapter XIII (The Path of Purification, tr. Ñāṇamoli)', 'Free from Access to Insight: the classical manual\'s chapter on the higher knowledges.')]),
  ],
  'deeper': [D('bodhinyana', 'Ajahn Brahm\'s monastery in Western Australia, known for teaching deep calm.'), D('abhayagiri', 'Thai forest monastery in California with retreats and long stays.')]})

C.append({'id': 'kashmir-shaivism-first-steps', 'title': 'Kashmir Shaivism: first steps', 'topic': 'texts/tantra', 'tradition': 'hindu', 'school': 'kashmir-shaivism',
  'traditions': ['kashmir-shaivism'], 'level': 'first-steps', 'minutes': 95,
  'intro': 'The non-dual tantra of Kashmir in five talks: how its last great master taught meditation, what tantra really is, why the world is not an illusion, and the Recognition teaching. Two short practices from the tradition\'s own texts.',
  'units': [
    unit(1, 'How to meditate in this tradition', [W('Ffxb0NWuYIc', 'Swami Lakshmanjoo, the last master of the oral lineage, in eight minutes.')]),
    unit(2, 'What tantra really is', [W('ttdm75hJBf8', 'Clearing away the modern myths.')]),
    unit(3, 'The world is not an illusion', [W('k5J9E1Uu1UA', 'Where this tradition parts company with classical Vedanta.')]),
    unit(4, 'The Recognition teaching', [W('hzCiQDZQzcU', 'An introduction to the Recognition Sutras.'), P('recognition-pratyabhijna-contemplation', 'Ten minutes of the Recognition contemplation.')]),
    unit(5, 'A practice from the Vijnana Bhairava', [W('Xi2X0xQ62XQ', 'A guided practice by the text\'s best-known English translator.'), P('resting-in-the-gap-between-breaths-vijnana-bhairava-dharana', 'Resting in the gap between breaths.')]),
    unit(6, 'Read', [T('siva-sutras-english-translation-by-subhash-kak', 'The Shiva Sutras, free.'), U('https://tantra112.app/vijnana-bhairava-tantra', 'Vijnana Bhairava Tantra: all 112 practices (Tantra 112)', 'The full text, free to read online (link only).')]),
  ],
  'deeper': [D('ishwar-ashram-srinagar', 'Swami Lakshmanjoo\'s ashram in Srinagar, kept by his trust.'), D('kashmir-shaiva-institute-jammu', 'The trust\'s institute in Jammu.')]})

C.append({'id': 'advaita-self-enquiry', 'title': 'Self-enquiry: who am I?', 'topic': 'self/self-enquiry', 'tradition': 'hindu', 'school': 'advaita',
  'traditions': ['advaita'], 'level': 'first-steps', 'minutes': 70,
  'intro': 'Ramana Maharshi\'s question, taught by three living teachers: what the enquiry is, how to do it, and what it is not. One practice to take into the day.',
  'units': [
    unit(1, 'Why Ramana matters', [W('lYsXkJzyXoo', 'What one man\'s awakening at sixteen means for you.')]),
    unit(2, 'How to practise', [W('Lb3PzxwEKCQ', 'The clearest practical guide to self-enquiry on video.'), P('self-enquiry', 'Five minutes, twice a day.')]),
    unit(3, 'Who am I if not the knower?', [W('ghISLiSlUCQ', 'A crisp Vedanta enquiry into the witness.')]),
    unit(4, 'Enquiry and abidance', [W('zDKKqE-5jFU', 'Asking the question, then resting as the answer.')]),
    unit(5, 'What enquiry is not', [W('v3iGgNJsH0Y', 'A traditional teacher\'s warning against collecting information.'), T('the-real-and-the-apparent-man', 'Vivekananda on the real and the apparent self, free.')]),
  ],
  'deeper': [D('sri-ramanasramam', 'Ramana Maharshi\'s ashram at Tiruvannamalai.'), D('arsha-vidya-saylorsburg', 'Traditional Vedanta courses in Pennsylvania.')]})

C.append({'id': 'anapanasati-breath', 'title': 'Mindfulness of breathing', 'topic': 'meditation/breath', 'tradition': 'buddhism', 'school': 'theravada',
  'traditions': ['theravada', 'plum-village'], 'level': 'first-steps', 'minutes': 90,
  'intro': 'The Buddha\'s own meditation, from the first breath to a whole path. Four teachers from three lines, two practices, and the discourse itself.',
  'units': [
    unit(1, 'Why the breath', [W('eyM_c3wSh8s', 'Goenka\'s introduction: why start with the breath, and how.')]),
    unit(2, 'Breathing in, breathing out', [W('gAeRaxV-nJ8', 'The Plum Village way, simple and kind.'), P('mindfulness-of-breathing', 'Ten minutes, daily.')]),
    unit(3, 'The basics of anapanasati', [W('MJ3cgh-mV8E', 'The method as the early suttas give it.')]),
    unit(4, 'Breath as a whole path', [W('ywqCEckKXbc', 'From the Thai forest line of Ajaan Lee.'), P('anapanasati-breath-meditation-method-2', 'Ajaan Lee\'s method for working with breath energy.')]),
    unit(5, 'The path to clarity', [W('nUCMU5kDeoU', 'A longer talk from the abbot of Abhayagiri.'), T('mn-118-mindfulness-of-breathing', 'MN 118, the discourse on mindfulness of breathing.')]),
  ],
  'deeper': [D('abhayagiri', 'Thai forest monastery in California.'), D('gaia-house', 'Insight retreat centre in Devon.')]})

C.append({'id': 'metta-loving-kindness', 'title': 'Loving-kindness, step by step', 'topic': 'kindness', 'tradition': 'buddhism', 'school': 'theravada',
  'traditions': ['theravada', 'insight', 'plum-village', 'tibetan'], 'level': 'first-steps', 'minutes': 100,
  'intro': 'Metta from the teacher who brought it West, a forest monk who calls it serious practice, Ajahn Brahm at his warmest, a guided sit, and the Tibetan widening into bodhicitta.',
  'units': [
    unit(1, 'What loving-kindness is', [W('YYGqpYtFcQM', 'Sharon Salzberg, in twelve minutes.')]),
    unit(2, 'A serious practice', [W('sEGyLEoDu8I', 'Not a soft option: metta as training.'), P('metta-loving-kindness', 'Five minutes a day to start.')]),
    unit(3, 'A guided sit', [W('5luvQp--B8U', 'Thich Nhat Hanh\'s love meditation.')]),
    unit(4, 'Freeing problems with metta', [W('OswcrsyGQN0', 'Ajahn Brahm at his best: kindness meets real life.'), T('sn-1-8-goodwill-karaniya-metta-sutta', 'The Karaniya Metta Sutta, free.')]),
    unit(5, 'Widening the circle: bodhicitta', [W('cZCwVMYX0nM', 'The mind of love and awakening.'), P('tonglen', 'Tonglen, the Tibetan practice of giving and taking.')]),
  ],
  'deeper': [D('ims-barre', 'Insight Meditation Society, Massachusetts: metta retreats each year.'), D('plum-village', 'Thich Nhat Hanh\'s community in France.')]})

C.append({'id': 'contemplating-death', 'title': 'Contemplating death', 'topic': 'death', 'tradition': 'buddhism', 'school': 'theravada',
  'traditions': ['theravada', 'plum-village', 'tibetan'], 'level': 'steady', 'minutes': 100,
  'caution': 'Reflections on death can stir grief. Go gently, and set the course aside if it overwhelms you.',
  'intro': 'The Buddhist reflection on death as a source of freedom rather than fear: why to practise it, how the suttas teach it, how to rehearse it, and a gentle view of where we go.',
  'units': [
    unit(1, 'Why remember death', [W('5SBrCdRTX8o', 'Maranasati explained warmly by a Canadian abbot.')]),
    unit(2, 'How the suttas teach it', [W('8Xy01jkEsnQ@93', 'Recollecting death, step by step.'), P('mindfulness-of-death-maranasati', 'Morning and evening, five minutes.')]),
    unit(3, 'Thinking calmly about death', [W('TigyAJhht3A', 'Steady and unsentimental.'), P('the-five-remembrances', 'The five daily remembrances.')]),
    unit(4, 'Death as teacher', [W('y2793IaOnxQ', 'A Thai-forest elder on looking forward to death.')]),
    unit(5, 'Where do we go?', [W('SvcTgmF4Xug', 'Thich Nhat Hanh\'s gentle answer.'), T('salla-sutta-the-arrow', 'The Salla Sutta: the arrow of grief.')]),
  ],
  'deeper': [D('amaravati', 'Thai forest monastery in England.'), D('cittaviveka', 'Forest monastery in Sussex.')]})

C.append({'id': 'neoplatonic-contemplation', 'title': 'Plotinus and the ascent to the One', 'topic': 'divine/the-one', 'tradition': 'platonic', 'school': 'neoplatonism',
  'traditions': ['platonic'], 'level': 'steady', 'minutes': 60,
  'intro': 'The Western contemplative root: Plotinus\' map of the One, Intellect and Soul, why the soul descends, how it turns back, and what "alone with the Alone" means. Two practices from the Platonic tradition.',
  'units': [
    unit(1, 'Who was Plotinus?', [W('3KLPrLrR67o', 'Six minutes for complete beginners.')]),
    unit(2, 'One, Intellect, Soul', [W('vZEUo_sHoBw@1102', 'The three levels of reality, clearly drawn.')]),
    unit(3, 'Why the soul fell', [W('fJgeKlPZxmY', 'The descent of the soul into a body.')]),
    unit(4, 'The ascent', [W('vZEUo_sHoBw@1606', 'Turning back and taking part in what is higher.'), P('neoplatonic-contemplation', 'Turning attention from objects to the knowing.')]),
    unit(5, 'Alone with the Alone', [W('vZEUo_sHoBw@2101', 'Union with the One.'), W('Cvs52cBjpgU@3449', 'A lifelong Platonist on contemplating the One.'), P('practising-dying-melete-thanatou', 'The Platonic practice of rehearsing death.')]),
    unit(6, 'Read', [T('plotinos-complete-works-4-vols', 'The Enneads (Guthrie\'s translation), free.'), T('phaedo', 'Plato\'s Phaedo, free.')]),
  ],
  'deeper': [D('plato-academy', 'The site of Plato\'s Academy in Athens: a visit, not a retreat.')]})

C.append({'id': 'hermetic-orientation', 'title': 'Hermeticism and the Middle Pillar: an orientation', 'topic': 'gnosis', 'tradition': 'esoteric', 'school': 'hermeticism',
  'traditions': ['esoteric'], 'level': 'first-steps', 'minutes': 75, 'orientationOnly': True,
  'caution': 'Orientation only. The Middle Pillar belongs to the Golden Dawn\'s ritual curriculum and is learned within an order or from a qualified teacher. Energy visualisation is not for times of acute mental-health difficulty.',
  'intro': 'Where Western esotericism comes from: the Hermetic writings, the Golden Dawn, and its best-known exercise shown in outline. A scholar\'s history first, then one contemplative reading of the Corpus Hermeticum.',
  'units': [
    unit(1, 'The Hermetic writings', [W('kHHTt6Yiv5U', 'An introduction to the Corpus Hermeticum.')]),
    unit(2, 'The Hermetic God', [W('Mi8AC_rmL00', 'God and the craftsman of the world in the Hermetica.')]),
    unit(3, 'Ascent and rebirth in the Hermetica', [P('hermetic-ascent-and-rebirth-corpus-hermeticum-xiii', 'A contemplative reading of Corpus Hermeticum XIII.'), T('the-divine-pymander-corpus-hermeticum', 'The Divine Pymander, free.')]),
    unit(4, 'The Golden Dawn', [W('T_dtVqD0d9c', 'History and structure of the order.')]),
    unit(5, 'The Middle Pillar, in outline', [P('middle-pillar-outline', 'What the exercise is, shown for orientation only.')]),
  ],
  'deeper': []})

C.append({'id': 'christian-contemplative-prayer', 'title': 'Christian contemplative prayer', 'topic': 'meditation/prayer', 'tradition': 'christian', 'school': 'christian',
  'traditions': ['christian'], 'level': 'first-steps', 'minutes': 40,
  'intro': 'The quiet heart of Christianity: the hesychasts and the Cloud of Unknowing, the Jesus Prayer, lectio divina and meditation with a prayer word.',
  'units': [
    unit(1, 'The contemplative tradition', [W('r4LoXCl7drQ@1994', 'Hesychasm and the Cloud of Unknowing in four minutes.')]),
    unit(2, 'The Jesus Prayer', [W('03TkFLFTbhk', 'Silence and the prayer of the heart, from an Orthodox priest.'), P('the-jesus-prayer-prayer-of-the-heart', 'Ten minutes with the prayer.')]),
    unit(3, 'Lectio divina', [W('YHtsSE2-nOI', 'Praying with a Gospel passage, live.'), P('lectio-divina', 'Read, reflect, respond, rest.')]),
    unit(4, 'Meditation with a prayer word', [W('YzoDzlP0mYk', 'The WCCM way, in four minutes.'), P('christian-meditation-with-a-mantra-maranatha', 'Twenty minutes with one word.')]),
    unit(5, 'Read', [T('the-cloud-of-unknowing', 'The Cloud of Unknowing, free.'), T('the-practice-of-the-presence-of-god', 'Brother Lawrence, free.')]),
  ],
  'deeper': [D('wccm-meditatio-house', 'The World Community for Christian Meditation in the UK.'), D('snowmass', 'St Benedict\'s Monastery, Colorado, home of Centering Prayer.')]})

C.append({'id': 'sufi-remembrance', 'title': 'Sufi remembrance (dhikr)', 'topic': 'meditation/prayer', 'tradition': 'sufism', 'school': 'sufism',
  'traditions': ['sufism'], 'level': 'first-steps', 'minutes': 95,
  'intro': 'The Sufi path of love and remembrance: what dhikr is, how breath and the divine name meet, the imaginal world of the Sufis, and the women of the tradition.',
  'units': [
    unit(1, 'What is zikr?', [W('0E9efdH7hBQ', 'An introduction outdoors with Pir Zia Inayat Khan.'), P('zikr-remembrance-in-the-inayati-way', 'Remembrance in the Inayati way.')]),
    unit(2, 'Dhikr and the breath', [W('SiO6IKavFUA', 'Islamic meditation practices, introduced by a scholar of Sufism.'), P('dhikr-and-breathwork', 'Breath and the divine name.')]),
    unit(3, 'The imaginal world', [W('RxHs8Y9vifo', 'The Sufi imaginal realm, from the leading translator of Ibn Arabi.')]),
    unit(4, 'Mystical love', [W('cVSZaxcg6RY', 'Mystical love and the women of Sufism.')]),
  ],
  'deeper': [D('inayati-uk', 'The Inayati Order in the UK.'), D('beshara-chisholme', 'Beshara School in the Scottish Borders: study of Ibn Arabi.')]})

C.append({'id': 'zen-just-sitting', 'title': 'Zen: just sitting', 'topic': 'meditation/silent-illumination', 'tradition': 'buddhism', 'school': 'zen',
  'traditions': ['soto-zen', 'rinzai-zen', 'chan'], 'level': 'first-steps', 'minutes': 100,
  'intro': 'Why Zen sits, what just sitting is, and the two great roads: silent illumination and the koan. Teachers from Soto, Rinzai-style koan practice and Chan.',
  'units': [
    unit(1, 'Why we sit', [W('niPekdemiHI', 'Fundamentals, from the ground up.')]),
    unit(2, 'Zazen is not meditation', [W('CK2vijpVMFo', 'A Soto teacher on just sitting.'), P('shikantaza-just-sitting', 'Just sitting, ten minutes.')]),
    unit(3, 'Silent illumination', [W('njRtKLonBtk', 'Clear instructions from a Chan teacher.'), P('silent-illumination-mozhao', 'Silent illumination.')]),
    unit(4, 'The koan road', [W('ivCzQx7DQJs', 'Why Mu? The essential koan.'), P('koan-practice-with-mu', 'Working with Mu.')]),
  ],
  'deeper': [D('sanshin-zen', 'Shohaku Okumura\'s Soto community in Indiana.'), D('mountain-cloud', 'Mountain Cloud Zen Center, Santa Fe.')]})

# ---------- write + check ----------
J = lambda p: json.load(open(p))
spec_p = os.path.join(APP, 'wisegraph/collections.json'); spec = J(spec_p)
gold = J(os.path.join(APP, 'wisegraph/gold-judgements.json'))['gold']
clips = {c['id']: c for c in J(os.path.join(APP, 'clips.json'))}
texts = J(os.path.join(WISER, 'mcp/data/wiser.json'))['text'] if os.path.exists(os.path.join(WISER, 'mcp/data/wiser.json')) else {}
PLACES = {p['id']: p for p in J(os.path.join(APP, 'wisegraph/places.json'))['places']}; places = set(PLACES)
errs = []
for c in C:
    c.update({'kind': 'mini-course', 'author': 'Satsang', 'ordered': True})
    for u in c['units']:
        for it in u['items']:
            k, _, r = it['ref'].partition(':')
            if k == 'clip':
                if r not in clips: errs.append((c['id'], 'no clip', r))
                elif r not in gold: errs.append((c['id'], 'not gold', r))
                elif 'dharmaseed' in (clips[r].get('channel') or '').lower() and clips[r].get('parent'): errs.append((c['id'], 'Dharma Seed cut', r))
            if k == 'text':
                if r not in texts: errs.append((c['id'], 'no text', r))
                else:  # resolve once at authoring time so the site needs no text index (link only; editions already licence-gated)
                    ed = (texts[r].get('editions') or [{}])[0]
                    it['title'] = texts[r].get('title'); it['url'] = ed.get('url')
                    if not linkable(licence_for(r, it['url'] or '')[0]) and not ed.get('free'): errs.append((c['id'], 'text licence not evidenced', r))
            if k == 'url':
                lic = licence_for(None, it['url'])[0]
                if not linkable(lic) and 'tantra112.app' not in it['url']: errs.append((c['id'], 'licence not evidenced', it['url']))
                if 'hareesh' in it['url'] and '.pdf' in it['url']: errs.append((c['id'], 'Hareesh PDF is link-forbidden', it['url']))
    for d in c['deeper']:
        if d['ref'][6:] not in places: errs.append((c['id'], 'no place', d['ref']))
        else: d['name'] = PLACES[d['ref'][6:]]['name']; d['country'] = PLACES[d['ref'][6:]].get('country')
    n_talk = sum(1 for u in c['units'] for i in u['items'] if i['role'] == 'watch'); n_pr = sum(1 for u in c['units'] for i in u['items'] if i['role'] == 'practise')
    if not (3 <= n_talk <= 6 and 1 <= n_pr <= 3): errs.append((c['id'], f'{n_talk} talks / {n_pr} practices out of 3-6 / 1-3'))
spec['collections'] = [x for x in spec['collections'] if x.get('kind') != 'mini-course'] + C
json.dump(spec, open(spec_p, 'w'), ensure_ascii=False, indent=1); open(spec_p, 'a').write('\n')
print(len(C), 'mini-courses ->', os.path.relpath(spec_p, APP))
for e in errs: print('  CHECK:', e)
