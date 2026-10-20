# Teacher-depth pass: official channels x topic queries via the channel's own search (keyless search rows, metadata only).
import json, sys, os, concurrent.futures as F
from ytsearch import search
HERE = os.path.dirname(os.path.abspath(__file__))
# (key, channel id, channel name, speaker, name-match regex for multi-teacher channels or None)
CH = [
 ('vsny', 'UCZOKv_xnTzyLD9RJmbBUV9Q', 'Vedanta Society of New York', 'swami-sarvapriyananda', r'sarvapriyananda'),
 ('spira', 'UCxXWjjtATq3OM545gMh9PUg', 'Rupert Spira', 'rupert-spira', None),
 ('thanissaro', 'UC6FSq_ptJ-I6aTHT-XA_e0Q', 'Dhamma Talks by Thanissaro Bhikkhu', 'thanissaro-bhikkhu', None),
 ('thanissaro-short', 'UCQRkIum1cnPNI5QZ0XtIMWw', 'Short Dhamma Talks by Thanissaro Bhikkhu', 'thanissaro-bhikkhu', None),
 ('plumvillage', 'UCcv7KJIAsiddB2YRegvrF7g', 'Plum Village', 'thich-nhat-hanh', r'thich nhat hanh|th[ií]ch nh[aấ]t h[aạ]nh|thay\b'),
 ('plumvillage-app', 'UCytzR1tkUYoF5DjGYiYkhGQ', 'Plum Village App', 'thich-nhat-hanh', r'thich nhat hanh|th[ií]ch nh[aấ]t h[aạ]nh'),
 ('mingyur', 'UCv-oUk8x6SGHMOLrCMDNrsw', 'Yongey Mingyur Rinpoche', 'mingyur-rinpoche', None),
 ('bswa', 'UC6M_EhnSSdTG_SXUp6IAWmQ', 'Buddhist Society of Western Australia', 'ajahn-brahm', r'ajahn brahm(?!ali)|brahmavamso'),
 ('tarabrach', 'UCE3E-d8dUieqIbKYIO5-pFg', 'Tara Brach', 'tara-brach', None),
 ('jk', 'UC88A5W9XyWx7WSwthd5ykhw', 'J. Krishnamurti - Official Channel', 'jiddu-krishnamurti', None),
 ('kft', 'UCX8wFEiD_FaLPgHM6wPD0Wg', 'Krishnamurti Foundation Trust', 'jiddu-krishnamurti', r'krishnamurti'),
 ('abhayagiri', 'UCFAuQ5fmYYVv5_Dim0EQpVA', 'Abhayagiri', 'ajahn-pasanno', r'pasanno'),
 ('abhayagiri-amaro', 'UCFAuQ5fmYYVv5_Dim0EQpVA', 'Abhayagiri', 'ajahn-amaro', r'ajahn amaro'),
 ('amaravati', 'UCsgmmAelfZ2kfXZ08xlHpDw', 'Amaravati Buddhist Monastery', 'ajahn-sumedho', r'sumedho'),
 ('amaravati-amaro', 'UCsgmmAelfZ2kfXZ08xlHpDw', 'Amaravati Buddhist Monastery', 'ajahn-amaro', r'ajahn amaro'),
 ('tadatmananda', 'UC7i47784NqiOl244eGEJDew', 'ArshaBodha - Swami Tadatmananda', 'swami-tadatmananda', None),
 ('mooji', 'UCpw2gh99XM6Mwsbksv0feEg', 'Moojiji', 'mooji', None),
 ('ltr', 'UC9dRb4fbJQIbQ3KHJZF_z0g', "Let's Talk Religion", 'filip-holm', None),
 ('kornfield', 'UC5JayBKk-Bynk6XnUnU7vLA', 'Jack Kornfield', 'jack-kornfield', None),
 ('dalailama', 'UCiPJ_g02LuOgOG0ZNk5j1jA', 'Dalai Lama', 'dalai-lama', None),
 ('lucille', 'UCAYslZlNuBDD7FMvpjWLtoQ', 'Francis Lucille', 'francis-lucille', None),
 ('wallis', 'UCpESGVz_4KaI3duvhfedf7g', 'Christopher Wallis (Hareesh)', 'christopher-wallis', None),
 ('pundarika', 'UCchLmxF7jugFQg-gXIyeyFA', 'Pundarika', 'tsoknyi-rinpoche', None),
]
Q = ['rebirth', 'reincarnation', 'past lives', 'karma', 'death', 'dying', 'after death', 'bardo', 'self', 'no self', 'ego', 'who am I',
     'awakening', 'enlightenment', 'liberation', 'meditation', 'breath', 'awareness', 'consciousness', 'mind', 'suffering', 'fear',
     'anger', 'love', 'compassion', 'emptiness', 'impermanence', 'desire', 'happiness', 'God', 'soul', 'reality', 'thought', 'grief',
     'guru', 'practice', 'faith', 'freedom', 'time', 'peace']
if __name__ == '__main__':
    keys = sys.argv[1:] or [c[0] for c in CH]
    outp = os.path.join(HERE, '..', 'raw_discovered.json')
    out = json.load(open(outp)) if os.path.exists(outp) else {}
    jobs = [(c, q) for c in CH if c[0] in keys for q in Q]
    def run(j):
        c, q = j; return c, q, search(q, path='/channel/' + c[1])
    errs = 0
    with F.ThreadPoolExecutor(8) as ex:
        for c, q, r in ex.map(run, jobs):
            if r.get('err'): errs += 1
            for x in r['rows']:
                if x['chanId'] and x['chanId'] != c[1]: continue
                o = out.setdefault(x['id'] + '|' + c[0], dict(x, ch=c[0], queries=[]))
                if q not in o['queries']: o['queries'].append(q)
    json.dump(out, open(outp, 'w'), ensure_ascii=False)
    import collections
    print('errors', errs, collections.Counter(v['ch'] for v in out.values()))
