# Pass 2 for a sectioned book: resolve the hand-authored rulebook (rules.src.tsv: our paraphrases + short verbatim anchors)
# to passage ids against the private texts, and write rules.json (public). Fails on any anchor that is missing, ambiguous
# within its section, or longer than 25 words.
# usage: python3 tools/extract/book-rules.py <public source dir> <private dir>
import json, re, sys, collections
SEV = ['hard-stop', 'caution', 'guidance', 'info', 'traditional']
def main():
    pub, priv = sys.argv[1:3]
    S = json.load(open(f'{pub}/sections.json')); byord = {s['ordinal']: s for s in S['sections']}
    P = json.load(open(f'{priv}/passages.json'))['passages']; bysec = collections.defaultdict(list)
    for p in P: bysec[p['segment']].append(p)
    rules, errs = [], []
    for line in open(f'{pub}/rules.src.tsv', encoding='utf-8'):
        if line.startswith('#') or not line.strip(): continue
        rid, scope, sev, anchors, para = line.rstrip('\n').split('|', 4)
        assert sev in SEV, (rid, sev)
        src, quote = [], None
        for a in re.split(r';(?=\d+:)', anchors):
            n, snip = a.split(':', 1); s = byord[int(n)]
            text = open(f'{priv}/{s["file"]}', encoding='utf-8').read()
            if len(snip.split()) > 25: errs.append(f'{rid}: anchor over 25 words'); continue
            k = text.count(snip)
            if k != 1: errs.append(f'{rid}: anchor found {k}x in {s["id"]}: {snip[:60]}'); continue
            a0 = text.index(snip); a1 = a0 + len(snip)
            ids = [p['id'] for p in bysec[s['id']] if p['start'] < a1 and p['end'] > a0]
            src.append({'section': s['id'], 'passages': ids, 'start': a0, 'end': a1})
            if quote is None: quote = {'text': snip, 'cite': ids[0]}
        rules.append({'id': rid, 'paraphrase': para, 'scope': scope.split(','), 'severity': sev, 'sources': src,
                      'passage_ids': sorted({i for x in src for i in x['passages']}), 'quote': quote})
    if errs: print('\n'.join(errs)); sys.exit(1)
    c = collections.Counter(r['severity'] for r in rules)
    res = {'type': 'book_rules', 'schema_version': 1, 'source': S['source'], 'pass': 2, 'status': 'review',
           'severity_legend': {'hard-stop': 'engine/player must enforce or block', 'caution': 'warning on the start card or a cap on progression',
                               'guidance': 'default behaviour or copy', 'info': 'Ask material only, never scripted', 'traditional': 'recorded, not enforced or ported'},
           'counts': dict(c), 'rules': rules}
    json.dump(res, open(f'{pub}/rules.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1); open(f'{pub}/rules.json', 'a').write('\n')
    print(len(rules), 'rules', dict(c))
main()
