# Deploy guard (2nd layer, after deploy.sh's grep): no transcript TEXT may ship. Takes every 9-word run from the internal
# transcripts (../../transcripts-internal/**.txt|.srt|.vtt, sampled) and fails if any appears in dist/. Exit 1 = found.
import os, re, sys, random
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TR = os.path.join(ROOT, '..', 'transcripts-internal'); DISTS = sys.argv[1:] or [os.path.join(ROOT, 'dist')] # extra dirs: mcp/data, mcp/dist-data
if not os.path.isdir(TR): print('no transcripts dir; skipped'); sys.exit(0)
norm = lambda s: re.sub(r'\s+', ' ', re.sub(r"[^a-z0-9' ]+", ' ', s.lower())).strip()
dist = ''
for DIST in DISTS:
  if os.path.isfile(DIST): dist += ' ' + norm(open(DIST, errors='ignore').read()); continue
  for d, _, fs in os.walk(DIST):
    for f in fs:
        if f.endswith(('.js', '.json', '.jsonl', '.jsonld', '.xml', '.html', '.css', '.txt')): dist += ' ' + norm(open(os.path.join(d, f), errors='ignore').read())
random.seed(7); grams = set(); files = 0
for d, _, fs in os.walk(TR):
    for f in fs:
        if not f.endswith(('.txt', '.srt', '.vtt')): continue
        files += 1
        t = open(os.path.join(d, f), errors='ignore').read()
        t = re.sub(r'\d\d:\d\d:\d\d[,.]\d+ --> .*|^\d+$|WEBVTT.*', ' ', t, flags=re.M)
        w = norm(t).split()
        for i in random.sample(range(max(1, len(w) - 9)), min(40, max(0, len(w) - 9))): grams.add(' '.join(w[i:i + 9]))
hits = [g for g in grams if g in dist]
print(f'{files} transcripts, {len(grams)} 9-word samples, {len(hits)} found in dist')
if hits: print('\n'.join(hits[:5])); sys.exit(1)
