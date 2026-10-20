# Wiser: ranking (spec, 2026-10-20)

What to show first, everywhere: the hub's talks, the Topic flash's teachers, the next topic, a teacher's best talks.
Reference implementation: `mcp/src/rank.mjs` (used live by the MCP server's `get_topic`, `get_teacher`, `recommend`).
Evidence: `specs/sim/simulate.py` (§7). One goal: **the most interesting thing for this listener, across traditions,
from teachers with real depth**.

## 1. Clip quality q ∈ [0, 1]
```
q = 0.35·BT' + 0.15·completion + 0.20·depth + 0.15·viewsPct + 0.15·lengthFit − thin
BT'        = conf·σ(bt) + (1 − conf)·0.5      conf = min(1, picks/30)   (crowd Bradley–Terry from resonance picks)
completion = share of plays reaching ≥ 80 % (or the passage end), shrunk to 0.5 with 20 pseudo-plays
depth      = min(1, ln(1 + teacherClips) / ln 31)
viewsPct   = percentile of views WITHIN the teacher's own catalogue (fair to small official channels)
lengthFit  = 1 for 4–20 min, 0.75 for 2–4 min, 0.4 under 2 min
thin       = 0.15 if the teacher has < 3 clips
```
Live inputs (`bt`, `picks`, `completion`, resonate counts) come from a nightly `clip_stats` table (D1) published as
`site/data/stats.json`; until then they sit at neutral 0.5 and the static terms carry the order.

## 2. Topic hub ordering (diversity across traditions)
Relevance `rel(c) = 0.6·q + 0.4·topicConf(c)` (+ `0.5·affinity(c, taste)` when a profile exists, see §3).
Order by **Maximal Marginal Relevance**:
`next = argmax_c λ·rel(c) − (1 − λ)·max_{s∈picked} sim(c, s)`, λ = 0.55, with
`sim = 1 same parent video · 0.85 same teacher · 0.55 same school · 0.30 same family · 0 otherwise`.
Per sub-question rail: the same MMR on that question's clips (k = 8). The "By tradition" columns keep their own order:
q within a tradition. Hard rules: no two passages of one parent video next to each other; no more than 2 talks per
teacher in the first 12; a footage or reading row never leads a rail.
Sim result (§7): MMR doubles distinct schools in the top 12 (10.2 vs 5.6) and raises hits from 0.149 (quality only) and
0.115 (random) to **0.203**.

## 3. Personal affinity (taste)
From PROFILE §2: `affinity(c) = 0.4·max(school weight, ½ family weight) + 0.4·max_topic(weight·conf) + 0.2·teacher weight`.
Personalised relevance `rel = 0.55·affinity + 0.45·q`. **Session fatigue**: `−0.3` per earlier appearance of the same
teacher in this session (a listener met Ajahn Chah twice already; a third time lands less).

## 4. Next-topic discovery (the bridge)
For each published topic t (gate: TOPICS §6), excluding topics seen this session:
```
score(t) = 0.45·adjacency(prev, t) + 0.30·infoGain(t) + 0.15·fit(t) + 0.10·depth(t)
adjacency = min(1, [t ∈ prev.related] + lift(prev, t))      lift = co-occurrence of topics on the same clips, ln-scaled, n ≥ 3
infoGain  = 12 · Σ_family share_t(family) · Var(Beta_user(family))    (how much a pick here would teach us; max-normalised to 1)
fit       = user's topic weight / max weight
depth     = min(1, ln(1 + clips) / ln 200)
```
4.1 **Bridge copy**: the card explains the link in plain words from the reason with the biggest term: "Rebirth leads to
Karma: what carries on is what you do" (adjacency), "Something different: Sufi and Christian voices on Prayer" (infoGain).
4.2 **Atlas edges as adjacency too**: topics whose Atlas concept nodes share a thread or `parallels` edge get +0.3.
4.3 **Explore slot**: in a Topic flash of 3, slots 1–2 are the best fit from different traditions (MMR on personalised
rel); slot 3 is the best-quality talk from the **family the profile is least sure about** (max Beta variance). This
is the single change that made the loop beat pure exploitation in the sim (hit rate 0.216 vs 0.170).

## 5. Avoiding thin teachers
- Tiering (computed in `person.depth.tier`): **main** ≥ 8 ballot clips (35 today), **more voices** 1–7 (56), figures.
- Topic flash slots 1–2 only from main-tier teachers; the explore slot may use a more-voices teacher only if their clip's
  `BT'` ≥ 0.6 with ≥ 30 picks (earned depth).
- Hub rails: more-voices teachers appear after position 8, and the `thin` penalty in q applies below 3 clips.
- Teacher pages for more-voices speakers show "More voices" and link to their main-tier neighbours.

## 6. Cold start
No profile → `rel = q` and λ = 0.45 (more diversity). The first flash is a **broad, deep topic** (published, ≥ 6 families,
highest depth: today rebirth, meditation, self, death) with three teachers from three families, one of them the
crowd's most-resonant teacher on that topic. Every pick after that updates the taste (PROFILE §2) and the Beta
posteriors start from the crowd prior, so even the second flash is personal. Cold start for a **new clip**: q from its
static terms, plus an exploration bonus `+0.1·(1 − conf)` in the explore slot only, so it can earn picks without
crowding proven talks. New **topic**: enters the loop only after the gate; first 200 impressions use the explore slot.

## 7. Simulation (specs/sim/simulate.py → results.json)
Real catalogue structure (1,530 ballot clips, 88 teachers, 26 schools, 6 families, 28 publishable topics, real views and
lengths, from `mcp/data/wiser.json`); 300 synthetic listeners with sparse hidden tastes over families, schools, topics and
teachers (Dirichlet α 0.2–0.35), hidden clip quality correlated with teacher depth, and fatigue for a repeated teacher.
A "hit" = a talk above the listener's own 85th-percentile utility. `python3 simulate.py --users 300 --seed 7` (≈25 s).

**A. Hub top 12 (12 deep topics × 300 users)**
| policy | mean utility | hit rate | best in list | schools | teachers | thin share |
|---|---|---|---|---|---|---|
| random | 0.780 | 0.115 | 1.650 | 5.75 | 6.9 | 0.035 |
| most viewed | 0.672 | 0.103 | 1.612 | 5.25 | 5.7 | 0.007 |
| quality only | 0.795 | 0.149 | 1.706 | 5.58 | 6.3 | 0.000 |
| **quality + MMR (Wiser)** | **1.100** | **0.203** | **1.848** | **10.17** | **10.9** | 0.014 |

**B. Topic-flash loop (15 rounds × 3 teachers)**
| policy | hit rate | rounds 1–3 | rounds 11–15 | mean utility | families with a hit | favourite family found by round 5 |
|---|---|---|---|---|---|---|
| random | 0.106 | 0.147 | 0.075 | 0.760 | 2.22 | 0.600 |
| quality only (no profile) | 0.143 | 0.290 | 0.083 | 0.716 | 2.75 | **0.937** |
| exploit only (no info gain, no explore slot) | 0.170 | 0.230 | 0.110 | 0.943 | 2.71 | 0.777 |
| **Wiser (taste × quality, MMR, info gain, explore slot, fatigue)** | **0.216** | **0.340** | **0.155** | **1.070** | **2.88** | 0.897 |
Seed 11 (150 users) reproduces the order: Wiser 0.211 vs random 0.104.

Honest reading: Wiser roughly **doubles the hit rate of random** and beats pure exploitation by 27 %, while finding more
families that resonate. Pure quality ranking finds a listener's favourite family slightly faster (it shows the
best-known talk in each family), at a much lower hit rate. The MMR gain is partly built into the user model (fatigue for
a repeated teacher); that assumption matches the user's own complaint about one-video and same-teacher runs, but it should
be checked against live data: log impressions and picks per slot (`events` with `slot: fit|explore`), then replay
offline and A/B the λ and the explore share.

## 8. Teacher pages
A teacher's talks: MMR on q with λ = 0.8 and `sim` by topic overlap instead of tradition (so their range shows, not ten
talks on one theme); full talks below; "Talks about" by q. (The MCP prototype still uses the default `sim` here, which only separates
passages of one video; switching to topic-overlap sim is ROADMAP step 4.)
