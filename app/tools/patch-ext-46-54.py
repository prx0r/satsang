"""Satsang review corrections applied to satsang-extensions pack 51 before staging (2026-10-22).
usage: python3 tools/patch-ext-46-54.py <copy of the packs>   (edits the copy in place; the upstream repo is never changed)
Why: the pack cited nanavira.org (Ven. Ñāṇavīra) for practices drawn from Ven. Ñāṇananda's "Nibbāna: The Mind Stilled";
the sermons are published free at seeingthroughthenet.net (licence registry: gift-of-dhamma, evidence read 2026-10-21).
Every record also gets contraindications + the teacher pointer (house rule since batch 6), needsTeacher false, and
source notes say the how-to is Satsang's own summary. See MERGE-LOG.md "Batch 7"."""
import json, sys
X = sys.argv[1]
BOOKS = 'https://seeingthroughthenet.net/books/'   # Nibbāna: The Mind Stilled, vols 1-7 (free PDFs) + HTML edition
GROUND = 'If you feel disoriented, unreal or anxious, open the eyes, feel the feet and the seat, and stop for today.'
MENTAL = 'If you have a history of trauma, dissociation, psychosis or severe anxiety, keep sits short with eyes open, or practise with a qualified teacher or clinician.'
TEACHER = 'These are introductions drawn from the sermons; deeper practice is learned with a qualified teacher. Satsang lists places to practise.'
FIRE = 'Never leave a lit candle unattended; picturing the flame works as well.'
EXTRA = {'fire-contemplation': [FIRE, GROUND, TEACHER], 'wound-location': [GROUND, MENTAL, TEACHER],
         'observer-inquiry': [GROUND, MENTAL, TEACHER], 'bahiya-practice': [GROUND, TEACHER],
         'root-pattern-seeing': [GROUND, TEACHER], 'theme-verse-reflection': [GROUND, TEACHER]}
p = f'{X}/51-nibbana-movie/sources/nibbana-movie/practices.json'
d = json.load(open(p))
for r in d['practices']:
    r['sources'] = [BOOKS]
    note = r.get('source_note', '').rstrip('. ')
    r['source_note'] = f'{note}. From Ven. Kaṭukurunde Ñāṇananda, Nibbāna: The Mind Stilled (free at seeingthroughthenet.net). Satsang summary in its own words.'
    r['needsTeacher'] = False
    r['contraindications'] = EXTRA.get(r['id'], [GROUND, TEACHER])
d['_note'] = d['_note'].replace('Derived from Nanananda', 'Drawn from Ven. Ñāṇananda') + ' Patched by tools/patch-ext-46-54.py (sources, contraindications).'
json.dump(d, open(p, 'w'), ensure_ascii=False, indent=1); open(p, 'a').write('\n')
print('51: patched', len(d['practices']), 'practices')
