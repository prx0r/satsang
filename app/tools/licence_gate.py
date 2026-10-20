"""Licence gate shared by merge-sources.py (staged texts, India resources) and build-wise.py (person free texts, place resource links).
A link is shown only when wisegraph/licence-registry.json evidences a linkable licence: book entry (by id) wins, then a url-prefix
entry, then the link's domain default (a verify-flagged default does not count). No evidence -> held (citation-only, review queue)."""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_p = os.path.join(ROOT, 'wisegraph/licence-registry.json')
LREG = json.load(open(_p)) if os.path.exists(_p) else {'books': {}, 'domains': {}}
LINKABLE = {'public-domain', 'publisher-free', 'gift-of-dhamma', 'monastery-free-reprint', 'permissioned'}
def linkable(lic): return bool(lic) and (lic in LINKABLE or lic.startswith('cc-'))
def licence_for(id_, url):
    """-> (licence class or None, why, evidenceUrl or None, entry)"""
    b = (LREG.get('books') or {}).get(id_ or '')
    if b: return b['licence'], 'book: ' + b.get('evidence', ''), b.get('evidenceUrl'), b
    for pre, e in (LREG.get('urls') or {}).items():
        if url and url.startswith(pre): return e['licence'], 'page: ' + e.get('evidence', ''), e.get('evidenceUrl'), e
    h = re.sub(r'^www\.', '', (re.match(r'https?://([^/]+)', url or '') or [None, ''])[1].lower())
    for dom, dd in (LREG.get('domains') or {}).items():
        if h == dom or h.endswith('.' + dom):
            if dd.get('verify'): return None, f'domain {dom}: default unconfirmed (verify)', dd.get('evidenceUrl'), dd
            return dd.get('default'), f'domain {dom}: ' + dd.get('evidence', ''), dd.get('evidenceUrl'), dd
    hd = (LREG.get('held') or {}).get(id_ or '') or next((e for e in (LREG.get('held') or {}).values() if url and e.get('url') == url), None)
    if hd: return None, 'checked ' + hd.get('checked', '') + ': ' + hd.get('why', ''), hd.get('evidenceUrl'), hd
    return None, 'no registry entry for the book or its domain', None, None
def no_sale(lic, entry): return bool(entry and entry.get('noSale')) or lic in ('gift-of-dhamma', 'monastery-free-reprint') or 'nc' in (lic or '')
def queue_refresh(qp, kinds, items, queued):
    """Rewrite wisegraph/review-queue.json: drop old items of these kinds, add this run's (held now). Other kinds untouched."""
    Q = json.load(open(qp)) if os.path.exists(qp) else {'_note': 'Satsang review queue: claims held back from the live site until a human checks them.', 'items': []}
    old = {(i['pack'], i['kind'], i['subject']): i for i in Q['items'] if i['kind'] in kinds}
    Q['items'] = [i for i in Q['items'] if i['kind'] not in kinds]
    for i in items: Q['items'].append({**i, 'queued': old.get((i['pack'], i['kind'], i['subject']), {}).get('queued') or queued})
    json.dump(Q, open(qp, 'w'), ensure_ascii=False, indent=1); open(qp, 'a').write('\n')
    return len(Q['items'])
