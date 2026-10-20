# Official chapter markers (the uploader's own timestamps, from the public watch page's player data) for long talks -> virtual clips. Metadata only.
import re, json, os, sys, urllib.request, concurrent.futures as F
HERE = os.path.dirname(os.path.abspath(__file__)); CD = os.path.join(HERE, '..', 'cache', 'chapters'); os.makedirs(CD, exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Accept-Language': 'en-GB,en;q=0.9', 'Cookie': 'CONSENT=YES+1; SOCS=CAI'}
def chapters(vid):
    f = os.path.join(CD, vid + '.json')
    if os.path.exists(f): return vid, json.load(open(f))
    try:
        h = urllib.request.urlopen(urllib.request.Request('https://www.youtube.com/watch?v=' + vid, headers=UA), timeout=25).read().decode('utf-8', 'replace')
    except Exception as e: return vid, None
    out = []
    for m in re.finditer(r'"chapterRenderer":\{"title":\{"simpleText":"((?:[^"\\]|\\.)*)"\},"timeRangeStartMillis":(\d+)', h):
        out.append([json.loads('"' + m.group(1) + '"'), int(m.group(2)) // 1000])
    seen = set(); ch = [x for x in out if not (x[1] in seen or seen.add(x[1]))]
    m = re.search(r'"lengthSeconds":"(\d+)"', h)
    r = {'chapters': ch, 'dur': int(m.group(1)) if m else None}
    json.dump(r, open(f, 'w')); return vid, r
if __name__ == '__main__':
    ids = sys.argv[1:]
    with F.ThreadPoolExecutor(8) as ex:
        for v, r in ex.map(chapters, ids): print(v, r and len(r['chapters']), r and r['chapters'][:4])
