import json, seed, fuzzydate as f
c = json.load(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'../cache/wd.json')))
import sys
mode = sys.argv[1] if len(sys.argv) > 1 else 'all'
for n in seed.N:
    r = c['resolve'].get(n['id'], {}); q = r.get('qid'); en = c['entities'].get(q, {}) if q else {}
    flag = ''
    t = f.parse(n['when']) if n['when'] else None
    if n['kind'] in ('person', 'scholar') and t and en:
        b = [y for y, p in en.get('P569', []) if p and p >= 9]; d = [y for y, p in en.get('P570', []) if p and p >= 9]
        if b and t['start'] and t['precision'] != 'century' and min(abs(x - t['start']) for x in b) > 3: flag += f" BIRTH wd={b}"
        if d and t['end'] and t['precision'] != 'century' and min(abs(x - t['end']) for x in d) > 3: flag += f" DEATH wd={d}"
        if b and not t['start'] and not t.get('start_unknown'): flag += f" wd-birth={b}"
        if t['precision'] == 'century' and b: flag += f" (wd birth {b} death {d})"
        if t.get('open') and d: flag += f" WD-DEAD {d}"
    if mode == 'all' or (mode == 'search' and r.get('how') == 'search') or (mode == 'flag' and flag):
        print(f"{n['id']:28} {q or '-':11} {(en.get('label') or '')[:30]:30} | {en.get('desc','')[:55]:55}{flag}")
