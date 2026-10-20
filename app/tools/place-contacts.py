# Satsang: public contact details for curated places, exactly as each organisation publishes them on its official site.
#   wisegraph/places.json (curated rows with an official url) -> wisegraph/place-contacts.json
# Reads the homepage, follows the contact link it carries (if any), and keeps only what is written there:
#   mailto: links and plain e-mail addresses on those two pages (Cloudflare-obfuscated addresses decoded), tel: links,
#   a schema.org PostalAddress when the site publishes one. Never constructs or guesses an address. Each field carries
#   source_url + checked date. Goenka centres are skipped (their dhamma.org page is the contact). Cache: tools/cache-contacts/.
# usage: python3 tools/place-contacts.py [--refresh]
import json, os, re, sys, html, datetime, hashlib, urllib.request, urllib.parse, concurrent.futures as cf
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'tools/cache-contacts'); os.makedirs(CACHE, exist_ok=True)
TODAY = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=7)).date().isoformat()  # the user's day (Asia/Phnom_Penh)
UA = 'Mozilla/5.0 (compatible; SatsangBot/0.1; +https://tantrafiles.xyz; metadata only)'
def get(url):
    k = os.path.join(CACHE, hashlib.sha1(url.encode()).hexdigest()[:16] + '.json')
    if os.path.exists(k) and '--refresh' not in sys.argv: return json.load(open(k))
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'text/html'}), timeout=20)
        d = {'url': r.geturl(), 'status': r.status, 'html': r.read(1_500_000).decode('utf-8', 'replace')}
    except Exception as e:
        d = {'url': url, 'status': getattr(e, 'code', 0) or 0, 'html': '', 'err': str(e)[:120]}
    json.dump(d, open(k, 'w')); return d
CONTACT = re.compile(r'contact|kontakt|contatt|contacto|contato|お問い合わせ|連絡|liên hệ|ติดต่อ|get in touch|reach us|how to reach', re.I)
BAD_MAIL = re.compile(r'(example\.|sentry|wixpress|\.(png|jpe?g|gif|svg|webp)$|@2x|domain\.com|email\.com|yourname|u003e)', re.I)
def cfdecode(h):
    b = bytes.fromhex(h); return ''.join(chr(x ^ b[0]) for x in b[1:])
def emails(src):
    out = []
    for m in re.findall(r'href=["\']mailto:([^"\'?]+)', src, re.I): out.append(urllib.parse.unquote(m).strip())
    for m in re.findall(r'data-cfemail=["\']([0-9a-f]+)', src, re.I):
        try: out.append(cfdecode(m))
        except Exception: pass
    text = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', src, flags=re.S | re.I)
    out += re.findall(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', html.unescape(re.sub(r'<[^>]+>', ' ', text)))
    seen, res = set(), []
    for e in out:
        e = e.strip().strip('.').lower() if e.count('@') == 1 else ''
        if e and not BAD_MAIL.search(e) and e not in seen: seen.add(e); res.append(e)
    return res[:3]
def phones(src):
    res = []
    for m in re.findall(r'href=["\']tel:([^"\']+)', src, re.I):
        t = urllib.parse.unquote(m).strip()
        if len(re.sub(r'\D', '', t)) >= 7 and t not in res: res.append(t)
    return res[:3]
def address(src):
    for blk in re.findall(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', src, re.S | re.I):
        for m in re.finditer(r'"streetAddress"\s*:\s*"([^"]+)"', blk):
            seg = blk[max(0, m.start() - 400): m.end() + 400]
            parts = [m.group(1)] + [x.group(1) for k in ('addressLocality', 'addressRegion', 'postalCode', 'addressCountry') for x in [re.search(rf'"{k}"\s*:\s*"([^"]+)"', seg)] if x]
            return ', '.join(dict.fromkeys(p.strip() for p in parts if p.strip()))
    return None
def contact_link(base, src):
    for href, txt in re.findall(r'<a[^>]+href=["\']([^"\'#]+)["\'][^>]*>(.*?)</a>', src, re.S | re.I):
        if href.startswith(('mailto:', 'tel:', 'javascript:')): continue
        if CONTACT.search(href) or CONTACT.search(re.sub(r'<[^>]+>', '', txt)):
            u = urllib.parse.urljoin(base, href)
            if urllib.parse.urlparse(u).netloc.split(':')[0].removeprefix('www.') == urllib.parse.urlparse(base).netloc.removeprefix('www.'): return u
    return None
def one(p):
    h = get(p['url'])
    if not h['html']: return p['id'], None
    rec = {'checked': TODAY, 'site': h['url']}
    cl = contact_link(h['url'], h['html'])
    pages = [(h['url'], h['html'])]
    if cl:
        c = get(cl)
        if c['html'] and c['status'] == 200: rec['contact_page'] = {'url': c['url'], 'source_url': h['url']}; pages.insert(0, (c['url'], c['html']))
    for u, src in pages:
        for e in emails(src):
            if e not in [x['value'] for x in rec.get('email', [])]: rec.setdefault('email', []).append({'value': e, 'source_url': u})
        for t in phones(src):
            if t not in [x['value'] for x in rec.get('phone', [])]: rec.setdefault('phone', []).append({'value': t, 'source_url': u})
        a = address(src)
        if a and 'address' not in rec: rec['address'] = {'value': a, 'source_url': u}
    # keep the organisation's own addresses: same domain as its site, or a free-mail box named after the place;
    # role addresses first; personal / third-party addresses (a webmaster's, a PR agency's) are dropped
    dom = urllib.parse.urlparse(h['url']).netloc.lower().removeprefix('www.')
    root = '.'.join(dom.split('.')[-3:]) if re.search(r'\.(co|or|org|ac|gov|net|com)\.[a-z]{2}$', dom) else '.'.join(dom.split('.')[-2:])
    label = re.sub(r'[^a-z]', '', root.split('.')[0]); nm = re.sub(r'[^a-z]', '', p['name'].lower())
    ROLE = re.compile(r'^(info|office|contact|reception|ashram|enquir|inquir|mail|secretar|general|welcome|visit|guest|stay|booking|registr|frontdesk|sangha|monks|retreat|admin|hello|ask|pr$|intl)')
    def own(e):
        loc, d = e.split('@'); d = d.lower()
        if 'webmaster' in loc or 'mysite' in d: return False
        if d == root or d.endswith('.' + root): return True
        if d in ('gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'yahoo.co.in', 'rediffmail.com'):
            l = re.sub(r'[^a-z]', '', loc.lower()); return any(l[i:i + 6] in label + nm for i in range(max(1, len(l) - 5))) and len(l) >= 6
        return False
    if 'email' in rec:
        em = [x for x in rec['email'] if own(x['value'].removeprefix('mailto:'))]
        for x in em: x['value'] = x['value'].removeprefix('mailto:')
        em.sort(key=lambda x: not ROLE.search(x['value'].split('@')[0]))
        if em: rec['email'] = em[:2]
        else: rec.pop('email')
    if 'phone' in rec:
        ph = []
        for x in rec['phone']:
            v = html.unescape(x['value']).split(';')[0].strip()
            if re.fullmatch(r'[+(\d][\d\s().+-]{6,}', v) and re.sub(r'\D', '', v) not in [re.sub(r'\D', '', y['value']).lstrip('0') for y in ph] and re.sub(r'\D', '', v).lstrip('0') not in [re.sub(r'\D', '', y['value']).lstrip('0') for y in ph]:
                ph.append({**x, 'value': v})
        if ph: rec['phone'] = ph[:2]
        else: rec.pop('phone')
    return p['id'], rec if len(rec) > 2 else None
P = [p for p in json.load(open(os.path.join(ROOT, 'wisegraph/places.json')))['places'] if not p.get('goenka') and p.get('url')]
out = {}
with cf.ThreadPoolExecutor(12) as ex:
    for pid, rec in ex.map(one, P):
        if rec: out[pid] = rec
op = os.path.join(ROOT, 'wisegraph/place-contacts.json')
old = json.load(open(op)) if os.path.exists(op) else {}
res = {'_note': 'Public contact details exactly as each place publishes them on its official site (tools/place-contacts.py). Every value has its source_url; checked = the date it was read. Never guessed. Hand-checked rows and free resources live in tools/source_maps.py (PLACE_CONTACT_FIX, PLACE_RESOURCES).', 'places': out}
json.dump(res, open(op, 'w'), ensure_ascii=False, indent=1)
print(json.dumps({'curated_with_url': len(P), 'with_contact': len(out), 'email': sum('email' in r for r in out.values()), 'phone': sum('phone' in r for r in out.values()), 'contact_page': sum('contact_page' in r for r in out.values()), 'address': sum('address' in r for r in out.values())}))
