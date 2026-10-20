# Verifies every YouTube clip's real orientation, keyless and metadata only (nothing downloaded):
#   1. oEmbed of https://www.youtube.com/shorts/<id>: YouTube reports the player box; a vertical upload answers taller
#      than wide (the /watch oEmbed always reports 16:9, so it can't tell).
#   2. GET https://www.youtube.com/shorts/<id> without following redirects: a Short answers 200, a regular video 303s
#      to /watch.
# vertical = (1) taller than wide, or (2) answers 200 as a Short. Results cache in tools/format-cache.json
# {ytId: {f: vertical|horizontal, w, h, shorts: status, checked}}; tools/build-clips.py applies the cache to clips.json.
# usage: python3 tools/orient.py [--all]   (--all re-checks ids already cached)
import json, os, sys, datetime, urllib.request, urllib.error, urllib.parse, concurrent.futures as F
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'tools/format-cache.json')
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept-Language': 'en-GB,en;q=0.9', 'Cookie': 'CONSENT=YES+1; SOCS=CAI'}

class NoRedir(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None
opener = urllib.request.build_opener(NoRedir)

def check(vid):
    out = {'checked': datetime.date.today().isoformat()}
    try:
        u = 'https://www.youtube.com/oembed?format=json&url=' + urllib.parse.quote('https://www.youtube.com/shorts/' + vid)
        j = json.loads(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=20).read())
        out['w'], out['h'] = j.get('width'), j.get('height')
    except urllib.error.HTTPError as e: out['oembed'] = e.code
    except Exception as e: out['oembed'] = 'ERR'
    try:
        r = opener.open(urllib.request.Request('https://www.youtube.com/shorts/' + vid, headers=UA), timeout=20); out['shorts'] = r.status
    except urllib.error.HTTPError as e: out['shorts'] = e.code
    except Exception: out['shorts'] = 'ERR'
    tall = bool(out.get('w') and out.get('h') and out['h'] > out['w'])
    if out.get('w') is None and out.get('shorts') not in (200, 303): return vid, None  # couldn't tell: leave unknown
    out['f'] = 'vertical' if (tall or out.get('shorts') == 200) else 'horizontal'
    return vid, out

if __name__ == '__main__':
    clips = json.load(open(os.path.join(ROOT, 'clips.json')))
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    ids = sorted({(c.get('parent') or c['id'].split('@')[0]) for c in clips if c.get('media') == 'youtube'})
    extra = [l.strip() for l in open(sys.argv[sys.argv.index('--ids') + 1])] if '--ids' in sys.argv else []
    ids = sorted(set(ids) | set(extra))
    todo = [i for i in ids if '--all' in sys.argv or i not in cache]
    unknown = []
    with F.ThreadPoolExecutor(16) as ex:
        for vid, r in ex.map(check, todo):
            if r: cache[vid] = r
            else: unknown.append(vid)
    json.dump(cache, open(CACHE, 'w'), indent=0, sort_keys=True)
    from collections import Counter
    print('checked', len(todo), 'unknown', len(unknown), Counter(cache[i]['f'] for i in ids if i in cache))
