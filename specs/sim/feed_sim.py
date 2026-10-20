#!/usr/bin/env python3
"""For You feed simulation (specs/FORYOU.md §6). Reuses simulate.py's real catalogue (mcp/data/wiser.json ballot clips),
hidden clip quality and synthetic listeners, and replays a steady listener over N days.

Each day the policy ranks the catalogue; the listener looks at the top 20 and opens the first OPEN cards in order
(position bias), finishes the ones that resonate (utility >= their own 85th percentile), and the profile learns
(a hit = a win for its facets, a miss = a light loss). Finished talks never come back. Day-level boredom: a teacher
watched in the last 3 days lands 0.25 lower per watch, a topic watched in the last 2 days 0.08 lower (assumption, the
same shape as the session fatigue in simulate.py). The listener's taste never changes ("steady").

Policies
  best-first   score = 0.55 affinity + 0.45 quality, finished excluded, nothing else (the stale baseline)
  best-first+MMR   the same with MMR diversity (λ 0.65)
  Wiser feed   src/feedrank.js: rel + daily theme (capped share) + impressions fade + teacher/topic recency + daily jitter,
               2 Thompson exploration slots and 1 topic bridge per 10, MMR (λ 0.65), hard teacher-spacing rules
Metrics: Jaccard overlap of the top 20 between consecutive days (target < 0.5), hit rate of the top 20, hits among the
talks opened, distinct teachers and families in the top 20 across the run, families with a hit.
Usage: python3 feed_sim.py [--users 200] [--days 14] [--seed 7]   (writes feed_results.json)
"""
import sys, os, math, random, statistics, json, argparse
from collections import Counter, defaultdict
HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser(); ap.add_argument('--users', type=int, default=200); ap.add_argument('--days', type=int, default=14); ap.add_argument('--seed', type=int, default=7); ap.add_argument('--open', type=int, default=4)
A_ = ap.parse_args()
sys.argv = [sys.argv[0], '--seed', str(A_.seed), '--users', '1']
src = open(os.path.join(HERE, 'simulate.py')).read().split('users = [User()')[0]
exec(compile(src, 'simulate.py', 'exec'))   # clips, User, Taste, sim, PUB, by_topic, related, cooc, fam_mix, R ...

TOPK, OPEN = 20, A_.open
IMP = float(os.environ.get("IMP", "0.015")); JIT = float(os.environ.get("JIT", "0.03"))  # tuned 2026-10-20: see FORYOU.md §6
THEMES = [('t', t) for t in PUB if len(by_topic[t]) >= 30] + [('f', f) for f in FAMS if sum(c['_fam'] == f for c in clips) >= 30]
def theme_of(day): return THEMES[(hash(('theme', day, A_.seed)) & 0xffffffff) % len(THEMES)]
def theme_match(th, c): return (th[0] == 't' and th[1] in c['_tops']) or (th[0] == 'f' and c['_fam'] == th[1])
def jit(day, uid, c): return ((hash((day, uid, c['id'])) & 0xffff) / 65535 - 0.5) * JIT
def h32(*x): return hash(x) & 0xffffffff

def beta_sample(al, be, rr): x = rr.gammavariate(al, 1); y = rr.gammavariate(be, 1); return x / (x + y)

def rank(policy, uid, day, taste, finished, imps, recentT, recentTop, rr):
    taste.freeze()
    pool = []
    th = theme_of(day)
    for c in clips:
        if c['id'] in finished: continue
        rel = (0.55 * taste.aff(c) + 0.45 * c['_obs']) if taste.n else c['_obs']
        if policy.startswith('best'):
            pool.append((rel, c)); continue
        s = rel + 0.12 * theme_match(th, c)
        imp = sum(IMP * 0.5 ** ((day - d) / 3) for d in imps.get(c['id'], ()) if d < day)
        s -= min(0.9, imp)
        s -= min(0.5, 0.12 * recentT.get(c['speaker'], 0))
        s -= min(0.3, 0.06 * max([recentTop.get(t, 0) for t in c['_tops']] or [0]))
        s += jit(day, uid, c)
        pool.append((s, c))
    pool.sort(key=lambda z: -z[0])
    if policy == 'best-first':
        return [c for _, c in pool[:TOPK]]
    pool = pool[:600]
    out = []; used = set(); perT = Counter(); nth = 0
    sc = {id(c): s for s, c in pool}
    def ok(c): return c['id'] not in used and all(o['speaker'] != c['speaker'] for o in out[-4:]) and not (len(out) < 20 and perT[c['speaker']] >= 2)
    def push(c): out.append(c); used.add(c['id']); perT[c['speaker']] += 1
    def mmr_next(theme_cap):
        best, bv = None, -1e9
        for s, c in pool:
            if not ok(c): continue
            if theme_cap and theme_match(th, c): s -= 0.12
            ms = max([sim(c, p) for p in out[-8:]] or [0])
            v = 0.65 * s - 0.35 * ms
            if v > bv: best, bv = c, v
        return best
    while len(out) < TOPK:
        i = len(out); slot = i % 10; done = False
        if policy == 'Wiser feed':
            if i == 1:
                L = [c for s, c in pool if theme_match(th, c) and ok(c)]
                if L: push(L[0]); nth += 1; done = True
            if not done and slot in (3, 7):
                near = {o['_fam'] for o in out[-6:]}
                fams = [f for f in FAMS if taste.fam.get(f, 0) < 1.0 and f not in near and any(c['_fam'] == f and ok(c) for _, c in pool)]
                if fams:
                    def draw(f):
                        al = 2 + max(0, taste.fam.get(f, 0)); be = 2 + taste.neg.get(f, 0)
                        return beta_sample(al, be, rr) + (0.15 if taste.fam.get(f, 0) == 0 else 0)
                    bf = max(fams, key=draw)
                    L = sorted((c for _, c in pool if c['_fam'] == bf and ok(c)), key=lambda c: -(c['_obs'] + (0.1 if taste.spk.get(c['speaker'], 0) == 0 else -0.15) + jit(day, uid, c)))
                    if L: push(L[0]); done = True
            if not done and slot == 9 and taste.n:
                top = max(taste.top, key=taste.top.get) if taste.top else None
                if top:
                    nbrs = sorted((t for t in PUB if t != top), key=lambda t: -((1 if t in related.get(top, []) else 0) + cooc.get((top, t), 0)))[:4]
                    for t in nbrs:
                        L = [c for s, c in pool if t in c['_tops'] and ok(c)]
                        if L: push(L[0]); done = True; break
        if not done:
            c = mmr_next(policy == 'Wiser feed' and nth >= max(2, 0.3 * len(out)))
            if c is None: break
            if theme_match(th, c): nth += 1
            push(c)
    return out

def run(policy, users):
    J, hit20, hitOpen, teachers, fams_all, famhit = [], [], [], [], [], []
    for uid, u in enumerate(users):
        taste = Taste(); finished = set(); imps = defaultdict(list); watchT = []; watchTop = []
        rr = random.Random(h32('ts', uid, A_.seed)); prev = None; T_seen = set(); F_seen = set(); fh = set()
        for day in range(A_.days):
            recentT = Counter(); recentTop = Counter()
            for d, s in watchT:
                if day - d <= 3: recentT[s] += 0.5 ** ((day - d) / 3)
            for d, t in watchTop:
                if day - d <= 2: recentTop[t] += 0.5 ** ((day - d) / 3)
            L = rank(policy, uid, day, taste, finished, imps, recentT, recentTop, rr)
            ids = [c['id'] for c in L]
            if prev is not None: J.append(len(set(ids) & set(prev)) / max(1, len(set(ids) | set(prev))))
            prev = ids
            # the listener's day-level boredom
            bT = Counter(); bTop = Counter()
            for d, s in watchT:
                if day - d <= 3: bT[s] += 1
            for d, t in watchTop:
                if day - d <= 2: bTop[t] += 1
            def util(c): return u.base(c) + R.gauss(0, 0.12) - 0.25 * bT[c['speaker']] - 0.08 * max([bTop[t] for t in c['_tops']] or [0])
            us = [util(c) for c in L]
            hit20.append(sum(x >= u.thr for x in us) / max(1, len(us)))
            for c in L: imps[c['id']].append(day); T_seen.add(c['speaker']); F_seen.add(c['_fam'])
            opened = 0; hits = 0
            for x, c in zip(us, L):
                if opened >= OPEN: break
                opened += 1
                if x >= u.thr:
                    hits += 1; finished.add(c['id']); taste.update(c, 1.0); fh.add(c['_fam'])
                    watchT.append((day, c['speaker'])); watchTop += [(day, t) for t in c['_tops']]
                else:
                    taste.update(c, -0.25); finished.add(c['id']) if x < u.thr * 0.8 else None
            hitOpen.append(hits / max(1, opened))
        teachers.append(len(T_seen)); fams_all.append(len(F_seen)); famhit.append(len(fh))
    m = lambda v: round(statistics.mean(v), 3)
    return {'jaccard_top20_day_to_day': m(J), 'hit_rate_top20': m(hit20), 'hits_among_opened': m(hitOpen), 'teachers_seen': m(teachers), 'families_seen': m(fams_all), 'families_with_a_hit': m(famhit)}

users = [User() for _ in range(A_.users)]
print(f"catalogue: {len(clips)} ballot clips; {A_.users} steady listeners x {A_.days} days; top {TOPK}, opening {OPEN} a day\n")
res = {}
for pol in ['best-first', 'best-first+MMR', 'Wiser feed']:
    res[pol] = run(pol, users)
cols = list(res['best-first'].keys())
print(f"{'policy':18}" + ''.join(f"{c:>26}" for c in cols))
for n, v in res.items(): print(f"{n:18}" + ''.join(f"{v[c]:>26}" for c in cols))
json.dump({'seed': A_.seed, 'users': A_.users, 'days': A_.days, 'open': OPEN, 'results': res}, open(os.path.join(HERE, 'feed_results.json'), 'w'), indent=1)
