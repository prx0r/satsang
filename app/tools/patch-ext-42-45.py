"""Satsang review corrections applied to satsang-extensions packs 43/44/45 before staging (2026-10-21).
usage: python3 tools/patch-ext-42-45.py <copy of the packs>   (edits the copy in place; the upstream repo is never changed)
Why each change: see MERGE-LOG.md "Batch 6". Verse numbers are checked against Hareesh's own concordance and VBT blog index
(hareesh.org/blog/2023/9/27/vijaana-bhairava-tantra-translation-concordance, hareesh.org/vbt-blog-posts, read 2026-10-21)."""
import json, sys, os
X = sys.argv[1]
def J(p): return json.load(open(p))
def W(p, d): json.dump(d, open(p, 'w'), ensure_ascii=False, indent=1); open(p, 'a').write('\n')
T112 = 'https://tantra112.app/vijnana-bhairava-tantra'          # the translator's current, free full text (2026 revision)
B = 'https://hareesh.org/blog/'
TEACHER = 'The rest of the Vijñāna Bhairava (breath retention, mantra, the subtle-body and burning practices) is learned from a qualified teacher in the Trika tradition; Satsang lists places to practise.'
GROUND = 'If you feel disoriented, unreal or anxious, open the eyes, feel the feet and the seat, and stop for today.'
MENTAL = 'If you have a history of trauma, dissociation, psychosis or severe anxiety, keep sits short with eyes open, or practise with a qualified teacher or clinician.'

# ---- 45: verse numbers, sources (the 2018 PDF is held: see licence registry), promise-free how-tos, contraindications ----
p = f'{X}/45-vbt-practices/sources/vbt-practices/practices.json'; d = J(p)
FIX = {
 'vbt-sound-dissolution': dict(name='Listening to the inner sound (VBT verses 38-39)',
   sources=[T112, B + '2024/10/1/vijnaana-bhairava-tantra-verses-38-amp-39'],
   source_note='Vijñāna Bhairava verses 38-39 (nāda-yoga), tr. Christopher Hareesh Wallis (Tantra 112 full text) and his blog post on these verses. Satsang summary in its own words.',
   howto='Sit comfortably and let the breath settle by itself. Listen for a faint inner sound, a soft ringing or hum beneath the sounds of the room. Rest attention on it lightly, without straining to hear. Let it be loud, soft, present or absent; do not follow it into images or stories. When the mind wanders, come back to listening. If the sound fades into quiet, rest in the quiet. When you finish, notice the ordinary sounds around you again.',
   contraindications=['If you live with tinnitus that distresses you, listen instead to an outer sound such as a bell or a held note as it fades (verses 40-41).', GROUND, TEACHER]),
 'vbt-body-as-consciousness': dict(name='The body as awareness (VBT verse 63)',
   sources=[T112], source_note='Vijñāna Bhairava verse 63, tr. Christopher Hareesh Wallis (Tantra 112 full text). Satsang summary in its own words.',
   howto='Sit and let attention rest on the whole body at once: not one part, the whole field of sensation. Then take the body, and the world around it, as made of awareness. Let this be felt rather than thought. When the mind narrows back to "me" and "mine", return to the wider field and rest there. The body stays where it is; only the sense of it being separate softens.',
   contraindications=[GROUND, MENTAL, TEACHER]),
 'vbt-mind-between-objects': dict(name='Resting between objects (VBT verse 62)',
   sources=[T112], source_note='Vijñāna Bhairava verse 62 (with 61), tr. Christopher Hareesh Wallis (Tantra 112 full text). Satsang summary in its own words.',
   howto='First settle with the breath for a few minutes. Then notice the moment the mind lets go of one thing, a sensation, a thought, a sound, and before it takes up the next. Rest in that in-between. Do not chase the next object and do not push it away. When you find you have already moved on, come back to the gap. Practise the breath-pause sit first; this one needs a little steadiness.',
   contraindications=[GROUND, TEACHER]),
 'vbt-space-contemplation': dict(name='Spaciousness: a wall of skin with nothing inside (VBT verses 43-48)',
   sources=[T112, B + '2025/5/1/vijaana-bhairava-tantra-verses-43-48-the-spaciousness-practices'],
   source_note='Vijñāna Bhairava verses 43-48 (the spaciousness practices; verse 48: the skin as a wall with nothing inside), tr. Christopher Hareesh Wallis (Tantra 112 full text) and his blog post on these verses. Satsang summary in its own words.',
   howto='Sit and notice the space of the room around you, the space that holds the walls and your body. Then sense the space inside the body: the chest, the mouth, the skull. Feel the skin as a thin wall with open space within and without. Let the inner and outer space be one field and rest in that openness. When the mind reaches for something solid, notice the reaching and return to space. Stay alert; this is not a blank or sleepy state.',
   contraindications=[GROUND, MENTAL, TEACHER]),
 'vbt-twelve-centres': dict(name='Touching the end-of-twelve through the day (VBT verse 51)',
   sources=[T112, B + '2025/6/1/vijaana-bhairava-tantra-verses-49-51-the-heart-lotus-and-the-end-of-twelve'],
   source_note='Vijñāna Bhairava verse 51 (the end-of-twelve, dvādaśānta, "however and wherever" through the day), tr. Christopher Hareesh Wallis (Tantra 112 full text) and his blog post on verses 49-51. The pack read "the twelve" as twelve body centres; the verse names one place, the end-of-twelve. Satsang summary in its own words.',
   howto='This is a daily-life practice, not a sit. Several times a day, while walking, waiting or eating, let attention rest for a few breaths at the space just above the crown of the head, the "end of twelve", then carry on with what you were doing. Keep the touch light and brief. The remembering is the practice.',
   contraindications=['If attention above the head brings headache, pressure or dizziness, rest it in the heart or the soles of the feet instead.', GROUND, TEACHER]),
 'vbt-inner-outer-spaces': dict(name='Merging the sense spaces (VBT verses 32-33)',
   sources=[T112, B + '2023/11/28/vijana-bhairava-tantra-verse-32-merging-the-sensual-spaces'],
   source_note='Vijñāna Bhairava verses 32-33 (merging the sensual spaces), tr. Christopher Hareesh Wallis (Tantra 112 full text) and his blog post on these verses. Satsang summary in its own words.',
   howto='Sit and bring attention to one sense contact: a sound, a touch, something seen. Notice the outer space where it arrives, the room and the distance. Then notice the inner space where it is received. Rest in both at once, the outer and the inner as one field with the sensation in the middle. When attention falls to one side, come back to both.',
   contraindications=[GROUND, TEACHER]),
}
for x in d['practices']:
    x.update(FIX[x['id']]); x['needsTeacher'] = False
d['_note'] = ('VBT practices (satsang-extensions 45, Satsang review 2026-10-21): verse numbers checked against the translator\'s concordance; '
              'sources = Tantra 112 full text (current free translation) + the translator\'s blog posts; the 2018 PDF draft is held (licence registry). '
              'Own-words how-tos, no quotes, no promised outcomes; contraindications + a find-a-teacher pointer on every record. No retention, locks, khecari or given mantras.')
W(p, d)
c = J(f'{X}/45-vbt-practices/collection-addition.json'); col = c['collections'][0]
col['intro'] = ('Seven contemplative practices from the Vijñāna Bhairava Tantra, in a progression from the breath to daily life (not the text\'s own order): '
                'the turn of the breath, the gap between objects, inner sound, the body as awareness, the sense spaces, spaciousness, and the end-of-twelve through the day. '
                'Each is a quiet sit you can do on your own. The rest of the text (breath retention, mantra, the subtle-body practices) is learned from a qualified teacher: '
                'when one of these becomes your door, take it to a teacher in the tradition.')
TITLES = {6: 'Spaciousness', 7: 'The end-of-twelve through the day'}
INTROS = {2: 'When the mind lets go of one thing and before it takes up the next, rest in the middle. Build on day 1\'s steadiness.',
          6: 'The space of the room, the space inside the body, the skin as a thin wall between: one open field.',
          7: 'Not a sitting practice. A few times today, let attention touch the space just above the crown for a breath or two, then carry on.'}
for u in col['units']:
    if u['n'] in TITLES: u['title'] = TITLES[u['n']]
    if u['n'] in INTROS: u['intro'] = INTROS[u['n']]
c['_note'] += ' | Satsang review 2026-10-21: intro/units corrected (order claim, twelve centres -> end-of-twelve, teacher pointer).'
W(f'{X}/45-vbt-practices/collection-addition.json', c)

# ---- 43: the practice gets the teacher pointer + contraindications; the visual keeps the dark design ----
p = f'{X}/43-trika-prep/sources/trika-prep/practices.json'; d = J(p)
for x in d['practices']:
    x['needsTeacher'] = False
    x['contraindications'] = ['Keep the breath natural; never hold it or force it.', GROUND,
                              'This week is a foundation only. Initiated Trika practice (mantra, breath retention, subtle-body work) is learned from a qualified teacher in the tradition.']
W(p, d)
v = J(f'{X}/43-trika-prep/visuals/gap-rest.json')
v['ground'] = '#0b0b0d'; v['cues'][0]['color'] = '#e8e1cf'
v['_note'] += ' | Satsang 2026-10-21: ground and settle cue moved to the dark palette (the site keeps its dark design).'
W(f'{X}/43-trika-prep/visuals/gap-rest.json', v)
c = J(f'{X}/43-trika-prep/collection-addition.json')
c['collections'][0]['intro'] = ('Seven days of foundation for Abhinavagupta and VBT study: steady breath, the turn of the breath, and recognition. Ten minutes a day. '
                                'Initiated practices are not here: when the gap is steady, take the next step with a qualified teacher in the tradition.')
W(f'{X}/43-trika-prep/collection-addition.json', c)

# ---- 44: links corrected to the right page; titles cleaned ----
p = f'{X}/44-texts-targets/sources/texts-targets/texts.json'; d = J(p)
STN = 'https://seeingthroughthenet.net/books/'
PPP = 'https://www.pathpresspublications.com/en/page/books'
LINK = {'nanananda-concept-and-reality': STN, 'nanananda-magic-of-mind': STN, 'nanananda-nibbana-mind-stilled': STN,
        'nyanadipa-silent-sages-of-old': PPP, 'nyanamoli-dhamma-within-reach': PPP,
        'analayo-samyukta-agama-studies': 'https://www.buddhismuskunde.uni-hamburg.de/pdf/5-personen/analayo/sastudies.pdf',
        'hareesh-vbt-blog-series': 'https://hareesh.org/vbt-blog-posts'}
for t in d['texts']:
    if t['id'] in LINK: t['link'] = LINK[t['id']]
    if t['id'].startswith(('hareesh-', 'tantra112')): t['authors'] = ['christopher-wallis']
    if t['id'].startswith('analayo-'): t['authors'] = ['bhikkhu-analayo']
    if t['id'] == 'hareesh-vbt-translation':
        t['note'] = (t.get('note') or '') + ' Satsang: the 2018 first-draft PDF; the translator says it has since been considerably improved (final translation in Tantra 112).'
W(p, d)
ROWS = '\n'.join(f'| {u} | 200 | 2026-10-21 | see app/wisegraph/licence-registry.json | Satsang review: corrected link |' for u in sorted(set(LINK.values())))
rep = open(f'{X}/44-texts-targets/REPORT.md').read().replace('| https://nanavira.org/writings |', ROWS + '\n| https://nanavira.org/writings |', 1)
open(f'{X}/44-texts-targets/REPORT.md', 'w').write(rep)
open(f'{X}/44-texts-targets/sources/texts-targets/REPORT.md', 'w').write(rep)
print('patched', X)
