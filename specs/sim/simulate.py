#!/usr/bin/env python3
"""Wiser ranking simulation (specs/RANKING.md §7). Pure Python, no dependencies.

Uses the REAL catalogue structure (speakers, traditions, families, topics, lengths, views) from mcp/data/wiser.json and
synthetic listeners with hidden tastes. Compares policies for
  A. the topic hub ordering (top 12 talks of a topic), and
  B. the Topic-flash loop (15 rounds: pick a topic, show 3 teachers from different traditions, listener taps the one that
     resonated or passes, profile updates, bridge to the next topic).
Usage: python3 simulate.py [--users 300] [--rounds 15] [--seed 7]    -> prints tables, writes results.json
"""
import json, math, os, random, statistics, sys, argparse
from collections import defaultdict, Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser(); ap.add_argument('--users', type=int, default=300); ap.add_argument('--rounds', type=int, default=15); ap.add_argument('--seed', type=int, default=7)
args = ap.parse_args()
R = random.Random(args.seed)
data = json.load(open(os.path.join(HERE, '../../mcp/data/wiser.json')))
TR = data['tradition']
def family(t):
    seen = 0
    while t in TR and TR[t].get('parent') and seen < 10: t = TR[t]['parent']; seen += 1
    return t
clips = [c for c in data['clip'].values() if c.get('inBallot')]
for c in clips:
    c['_fam'] = family(c['traditions'][0]); c['_sch'] = c['traditions'][0]
    c['_tops'] = {t['id'].split('/')[0]: t['conf'] for t in c['topics']}
by_speaker = defaultdict(list)
for c in clips: by_speaker[c['speaker']].append(c)
spk_n = {s: len(v) for s, v in by_speaker.items()}
FAMS = sorted({c['_fam'] for c in clips}); SCHS = sorted({c['_sch'] for c in clips}); TOPS = sorted({t for c in clips for t in c['_tops']})
SPKS = sorted(by_speaker)
by_topic = defaultdict(list)
for c in clips:
    for t in c['_tops']: by_topic[t].append(c)
def topic_ok(t):
    p = by_topic[t]; return len(p) >= 12 and len({c['_sch'] for c in p}) >= 3
PUB = [t for t in TOPS if topic_ok(t)]
related = {t: data['topic'].get(t, {}).get('related', []) for t in TOPS}
# co-occurrence lift
cnt = Counter(); pair = Counter()
for c in clips:
    ts = list(c['_tops'])
    for a in ts: cnt[a] += 1
    for a in ts:
        for b in ts:
            if a != b: pair[(a, b)] += 1
N = len(clips)
cooc = {k: min(1, math.log(v * N / (cnt[k[0]] * cnt[k[1]]) + 1) / math.log(6)) for k, v in pair.items() if v >= 3}
fam_mix = {t: Counter(c['_fam'] for c in by_topic[t]) for t in TOPS}

# ---------- hidden truth: clip quality; teacher "thinness" correlates with lower quality on average ----------
for c in clips:
    depth = min(1, math.log1p(spk_n[c['speaker']]) / math.log(31))
    c['_q'] = max(0, min(1, R.gauss(0.45 + 0.25 * depth, 0.18)))
# observed quality proxy (what rank.mjs sees): views percentile within speaker, depth, length fit, + noisy crowd BT
for s, lst in by_speaker.items():
    lst.sort(key=lambda c: c.get('views') or 0)
    for i, c in enumerate(lst): c['_vp'] = i / (len(lst) - 1) if len(lst) > 1 else 0.5
for c in clips:
    depth = min(1, math.log1p(spk_n[c['speaker']]) / math.log(31))
    lenfit = 1 if 240 <= c['seconds'] <= 1200 else (0.4 if c['seconds'] < 120 else 0.75)
    bt = max(0, min(1, c['_q'] + R.gauss(0, 0.2)))      # crowd BT ~ truth + noise
    thin = 0.15 if spk_n[c['speaker']] < 3 else 0
    c['_obs'] = max(0, 0.35 * bt + 0.15 * 0.5 + 0.2 * depth + 0.15 * c['_vp'] + 0.15 * lenfit - thin)

# ---------- users ----------
def dirichlet(keys, alpha):
    g = {k: R.gammavariate(alpha, 1) for k in keys}; s = sum(g.values()); return {k: v / s for k, v in g.items()}
class User:
    def __init__(self):
        self.fam = dirichlet(FAMS, 0.35); self.sch = dirichlet(SCHS, 0.3); self.top = dirichlet(TOPS, 0.3); self.spk = dirichlet(SPKS, 0.2)
        nf, ns, nt, np_ = max(self.fam.values()), max(self.sch.values()), max(self.top.values()), max(self.spk.values())
        self.fam = {k: v / nf for k, v in self.fam.items()}; self.sch = {k: v / ns for k, v in self.sch.items()}
        self.top = {k: v / nt for k, v in self.top.items()}; self.spk = {k: v / np_ for k, v in self.spk.items()}
        us = [self.base(c) for c in clips]; us.sort(); self.thr = us[int(0.85 * len(us))]
        self.fav = max(self.fam, key=self.fam.get)
    def base(self, c):
        tp = max((self.top.get(t, 0) * cf for t, cf in c['_tops'].items()), default=0)
        return 0.9 * self.fam[c['_fam']] + 0.6 * self.sch.get(c['_sch'], 0) + 0.7 * tp + 0.3 * self.spk.get(c['speaker'], 0) + 0.8 * c['_q']
    def util(self, c, shown_speakers):
        u = self.base(c) + R.gauss(0, 0.12)
        return u - 0.35 * shown_speakers[c['speaker']]   # fatigue: the same teacher again lands less

# ---------- ranking (mirrors mcp/src/rank.mjs) ----------
def sim(a, b):
    if a['media']['videoId'] == b['media']['videoId']: return 1
    if a['speaker'] == b['speaker']: return 0.85
    if a['_sch'] == b['_sch']: return 0.55
    if a['_fam'] == b['_fam']: return 0.3
    return 0
def mmr(cands, rel, k, lam, prefilter=150):
    sc = {id(c): rel(c) for c in cands}
    pool = sorted(cands, key=lambda c: -sc[id(c)])[:prefilter]
    maxsim = [0.0] * len(pool); picked = []
    alive = list(range(len(pool)))
    while len(picked) < k and alive:
        bi = max(alive, key=lambda i: lam * sc[id(pool[i])] - (1 - lam) * maxsim[i])
        alive.remove(bi); c = pool[bi]; picked.append(c)
        for i in alive:
            x = sim(pool[i], c)
            if x > maxsim[i]: maxsim[i] = x
    return picked
class Taste:
    def __init__(self): self.fam = defaultdict(float); self.sch = defaultdict(float); self.top = defaultdict(float); self.spk = defaultdict(float); self.n = 0; self.neg = defaultdict(float)
    def update(self, c, w):
        self.n += 1
        self.fam[c['_fam']] += w * 0.5; self.sch[c['_sch']] += w; self.spk[c['speaker']] += w
        for t, cf in c['_tops'].items(): self.top[t] += w * cf
        if w < 0: self.neg[c['_fam']] += -w
    def freeze(self):
        nz = lambda d: max([abs(v) for v in d.values()] or [1]) or 1
        self._n = (nz(self.sch), nz(self.fam), nz(self.top), nz(self.spk))
    def aff(self, c):
        if not self.n: return 0
        a, b, t_, d = self._n
        tr = max(self.sch.get(c['_sch'], 0) / a, 0.5 * self.fam.get(c['_fam'], 0) / b)
        tp = max((self.top.get(t, 0) / t_ * cf for t, cf in c['_tops'].items()), default=0)
        return 0.4 * tr + 0.4 * tp + 0.2 * self.spk.get(c['speaker'], 0) / d
    def unc(self, f):
        a = 1 + max(0, self.fam.get(f, 0)); b = 1 + self.neg.get(f, 0)
        return a * b / ((a + b) ** 2 * (a + b + 1))
def next_topic(prev, taste, seen, use_ig=True):
    best, bs = None, -1e9
    for t in PUB:
        if t in seen: continue
        adj = 0.5 if prev is None else min(1, (1 if t in related.get(prev, []) else 0) + cooc.get((prev, t), 0))
        tot = sum(fam_mix[t].values())
        ig = sum(n / tot * taste.unc(f) for f, n in fam_mix[t].items()) * 12 if use_ig else 0
        fit = max(0, taste.top.get(t, 0)) / max([1] + list(taste.top.values())) if taste.n else 0
        depth = min(1, math.log1p(len(by_topic[t])) / math.log(200))
        s = 0.45 * adj + 0.3 * ig + (0.15 if use_ig else 0.45) * fit + 0.1 * depth
        if s > bs: best, bs = t, s
    return best
def flash_pick(pool, rel, k=3, explore=None):
    """k clips from k different schools (the Topic-flash rule), by MMR on rel. With explore (a taste), the last slot goes
    to the best clip from the family the profile is least sure about (RANKING §4.3)."""
    out, used_sch = [], set()
    take = k - 1 if explore is not None and explore.n else k
    for c in mmr(pool, rel, 40, 0.6):
        if c['_sch'] in used_sch or any(c['speaker'] == o['speaker'] for o in out): continue
        out.append(c); used_sch.add(c['_sch'])
        if len(out) == take: break
    if take < k:
        rest = [c for c in pool if c['_sch'] not in used_sch and all(c['speaker'] != o['speaker'] for o in out)]
        if rest: out.append(max(rest, key=lambda c: 0.5 * c['_obs'] + 0.5 * 12 * explore.unc(c['_fam'])))
    return out

# ---------- A. hub ordering ----------
def hub_eval(users, k=12):
    rows = defaultdict(list)
    topics = [t for t in PUB if len({c['_sch'] for c in by_topic[t]}) >= 4][:12]
    for t in topics:
        pool = by_topic[t]
        conf = lambda c: c['_tops'].get(t, 0.3)
        lists = {
            'random': R.sample(pool, min(k, len(pool))),
            'most viewed': sorted(pool, key=lambda c: -(c.get('views') or 0))[:k],
            'quality only': sorted(pool, key=lambda c: -(0.6 * c['_obs'] + 0.4 * conf(c)))[:k],
            'quality + MMR (Wiser)': mmr(pool, lambda c: 0.6 * c['_obs'] + 0.4 * conf(c), k, 0.55),
        }
        for name, L in lists.items():
            for u in users:
                shown = Counter(); tot = 0; best = 0; hits = 0
                for c in L:
                    x = u.util(c, shown); shown[c['speaker']] += 1; tot += x; hits += x >= u.thr
                    best = max(best, x)
                rows[name].append({'mean_util': tot / len(L), 'hits': hits / len(L), 'best_in_list': best,
                                   'schools': len({c['_sch'] for c in L}), 'teachers': len({c['speaker'] for c in L}),
                                   'thin_share': sum(spk_n[c['speaker']] < 3 for c in L) / len(L)})
    return {n: {m: round(statistics.mean(r[m] for r in v), 3) for m in v[0]} for n, v in rows.items()}

# ---------- B. topic-flash loop ----------
def loop_eval(users, rounds, policy):
    per_round_hit = [0.0] * rounds; fams_found = []; fav_found_by5 = 0; util_all = []
    for u in users:
        taste = Taste(); seen_t = []; seen_c = set(); shown = Counter(); prev = None; found = set(); fav5 = False
        for r in range(rounds):
            if policy == 'random':
                t = R.choice([x for x in PUB if x not in seen_t] or PUB)
                pool = [c for c in by_topic[t] if c['id'] not in seen_c]
                show = []
                for c in R.sample(pool, len(pool)):
                    if c['_sch'] not in {s['_sch'] for s in show}: show.append(c)
                    if len(show) == 3: break
            else:
                use_ig = policy != 'exploit only (no info gain)'
                t = next_topic(prev, taste, seen_t, use_ig=use_ig)
                pool = [c for c in by_topic[t] if c['id'] not in seen_c]
                taste.freeze()
                if policy == 'quality only (no profile)': rel = lambda c: c['_obs']
                else: rel = lambda c: (0.55 * taste.aff(c) + 0.45 * c['_obs']) if taste.n else c['_obs']
                if policy.startswith('Wiser'):
                    base_rel = rel
                    rel = lambda c: base_rel(c) - 0.3 * shown[c['speaker']]      # session fatigue: a teacher already met ranks lower
                    show = flash_pick(pool, rel, 3, explore=taste)
                else:
                    show = flash_pick(pool, rel, 3)
            us = [(u.util(c, shown), c) for c in show]
            for _, c in us: shown[c['speaker']] += 1; seen_c.add(c['id'])
            hits = [c for x, c in us if x >= u.thr]
            per_round_hit[r] += len(hits) / max(1, len(us)); util_all += [x for x, _ in us]
            for c in hits: found.add(c['_fam'])
            if r < 5 and any(c['_fam'] == u.fav for c in hits): fav5 = True
            # feedback: tap the best one if it resonated, else Pass
            if us:
                bx, bc = max(us, key=lambda z: z[0])
                if bx >= u.thr * 0.92:
                    taste.update(bc, 1.0)
                    for x, c in us:
                        if c is not bc: taste.update(c, -0.25)
                else:
                    for x, c in us: taste.update(c, -0.35)
            seen_t.append(t); prev = t
        fams_found.append(len(found)); fav_found_by5 += fav5
    n = len(users)
    return {'hit_rate_all': round(sum(per_round_hit) / (n * rounds), 3),
            'hit_rate_r1_3': round(sum(per_round_hit[:3]) / (n * 3), 3),
            'hit_rate_r11_15': round(sum(per_round_hit[-5:]) / (n * 5), 3),
            'mean_util': round(statistics.mean(util_all), 3),
            'families_with_a_hit': round(statistics.mean(fams_found), 2),
            'favourite_family_found_by_round5': round(fav_found_by5 / n, 3)}

users = [User() for _ in range(args.users)]
print(f"catalogue: {len(clips)} ballot clips, {len(SPKS)} teachers, {len(SCHS)} schools in {len(FAMS)} families, {len(PUB)} publishable topics; {len(users)} synthetic users\n")
A = hub_eval(users)
print("A. Topic hub top-12 (12 deep topics x all users)")
cols = ['mean_util', 'hits', 'best_in_list', 'schools', 'teachers', 'thin_share']
print(f"{'policy':28}" + ''.join(f"{c:>14}" for c in cols))
for n, v in A.items(): print(f"{n:28}" + ''.join(f"{v[c]:>14}" for c in cols))
B = {}
for pol in ['random', 'quality only (no profile)', 'exploit only (no info gain)', 'Wiser (taste x quality, MMR, info gain)']:
    B[pol] = loop_eval(users, args.rounds, pol)
print(f"\nB. Topic-flash loop, {args.rounds} rounds x 3 teachers")
cols = list(next(iter(B.values())).keys())
print(f"{'policy':42}" + ''.join(f"{c:>18}" for c in cols))
for n, v in B.items(): print(f"{n:42}" + ''.join(f"{v[c]:>18}" for c in cols))
json.dump({'seed': args.seed, 'users': args.users, 'rounds': args.rounds, 'hub': A, 'loop': B}, open(os.path.join(HERE, 'results.json'), 'w'), indent=1)
