# Wiser: For You, intentions and TV mode (spec + implementation notes, 2026-10-20)

> **Status (2026-10-25):** **shipped** 2026-10-20 (For you, intentions, TV mode).

The user: "we still need a feed of recommended videos ... in the future link to profile, goals, interests, current issues
or curiosities ... but don't want it to be stale." Shipped 2026-10-20 (wiser-web 66b70b6e, wiser-api 1a53b74b).
Design rule unchanged: the current dark design; new rules are appended `fy-*`, `int-*`, `tv-*` classes on existing tokens.

## 1. For You (`#foryou`, nav tab "For you", and a rail under the Topic flash on Watch)
Code: `src/feedrank.js` (pure ranking), `src/foryou.js` (UI), wired in `src/app.js` (`fy()`, `paintForYou`, `paintFyRail`).
- Candidates: ballot talks (1–20 min + virtual passages), playable, YouTube; desktop and TV horizontal only (`!vertOK()`).
- `score = rel + 0.30·intent + 0.12·theme + 0.15·fresh + more − novelty − impressions − teacherRecency − topicFatigue − less + jitter`
  - rel (profile, taste.n ≥ 2) = 0.50·affinity (Beta facets, src/taste.js) + 0.35·q (RANKING §1) + 0.15·crowd; cold = 0.60·q + 0.40·crowd
  - fresh: published ≤ 7 days = 1 ("New this week"), ≤ 30 days fades ("New this month"); `published` now ships in clips.site.json
  - novelty: finished = never; partial −0.5; glance −0.2 fading over a week (seen.js tiers)
  - impressions: −0.015 per earlier-day impression (half-life 3 d, cap 0.3); today's impressions never reshuffle today's list
  - teacher/topic recency: decayed counts of plays (and ¼ of impressions) over ~3 days; less/more like this: 30-day fade
  - jitter ±0.015 from hash(day, device, clip): stable all day, different tomorrow
- Composition per 10 cards: slots 3 and 7 = exploration (Thompson sample of Beta(a, b) per family the profile has barely met:
  < 3 signals, no positive lean, not in the last 6 cards; an unmet teacher first); slot 9 = serendipity bridge (`nextTopics` from
  the strongest topic to a neighbour not already among the top topics); position 2 = best talk on today's theme; the rest MMR
  (λ 0.65; sim 1 same video, .85 teacher, .45 school, .2 family). Shares: theme ≤ ~30 %, intentions ≤ ~50 %. Hard rules: no teacher
  twice within 4 cards, ≤ 2 per teacher in the first 20, never two passages of one video.
- Why lines (biggest honest reason): "On your mind: Grief", "Today: uposatha", "New this week", "Because you resonated with
  Ajahn Chah", "Because Thai Forest talks resonate with you", "More on death, which resonates with you", "Something different:
  Sufism", "A bridge from Death to Rebirth", "Most resonant with listeners", cold "A good place to start: <school>".
- Actions: "Play in TV mode" (`#tv/from/<id>`), "Not interested" (hides the talk, light loss), "Less like this" (full loss for
  its facets, teacher/topic penalty), Undo. Infinite scroll in pages of 24 (160 ranked per day). Impressions via
  IntersectionObserver (≥ 60 % visible) -> `wiser.feedSeen {id: [days]}` (14 days kept).
- Storage: `wiser.feedLess`, `wiser.feedMore`, `wiser.feedSeen` (device; in Download my data and Delete everything).

## 2. Intentions (Your model -> "What you bring"), phase 1
Code: `src/intentions.js`. 20 chips in three groups (Goals, Going through, Curious about), each mapped to topic weights
(grief -> death, impermanence, sadness, kindness; anxiety -> fear, mindfulness, breath, emotions, thought; sleep -> guided
meditation, breath, thought; rebirth -> rebirth, kamma, bardo, soul; ...). Free text "What's on your mind?" matched by keyword
regexes to the same chips (no model; never leaves the device except in the private sync). Weight 1 for 14 days, then half-life
7 days, dropped below 0.15; after 14 days the section asks "Still on your mind?" (Yes, keep it / Let it go). Intentions bias
For You (+0.30·match·weight) and the Topic flash (first topic = the strongest published intention topic; next-topic score
+0.25·intent; bridge copy "On your mind: <topic>"). Private: `wiser.intentions`, synced anonymously via `PUT /intentions`
(D1 `intentions`, migration 0017), returned by `/profile/sync` (newest wins), included in `/me/export` and the local export,
removed by Delete everything / `/me/forget-device` / `DELETE /me`, moved by `/me/claim-device`.

## 3. The daily theme (`src/themes.js`, shared by site and API)
Priority: feast days (Easter, Ash Wednesday, Good Friday, Vesak = first full moon of May, Mahashivaratri = 2 days before the
Feb/Mar new moon, Diwali around the Kartika new moon, All Saints, All Souls, Bodhi Day 8 Dec, Rumi's Shab-e Arus 17 Dec,
Christmas) > a teacher's death anniversary (`site/data/wisegraph/anniversaries.json` from `tools/build-anniversaries.mjs`:
Wikidata P570 with DAY precision only, Gregorian dates from 1583, people with ≥ 3 talks; 30 people today) > uposatha (full and
new moon, Meeus ch. 49) > seasons every other day (Lent, Easter week, Advent, twelve days, Ramadan from a table of expected
dates 2025–2030) > a deterministic rotation of 24 editorial themes (never yesterday's; themes with < 12 talks skipped).
Lunar dates are approximations and regional practice differs; copy says "around" where it matters.

## 4. TV mode (`#tv`, `#tv/topic/<id>`, `#tv/teacher/<id>`, `#tv/collection/<id>`, `#tv/from/<clip>`, `?tv=1`)
Code: `src/tv.js`. Full screen (requests Fullscreen), header/footer hidden, horizontal talks only, auto-continuing from the For You
ranking (or the chosen source). Overlay: why (mono gold), title (serif, 34–72 px), teacher + tradition; key legend; idle-hide
after 3.5 s; "Up next" card in the last 10 s; a topic title card (2.6 s) when the next talk changes topic. Keys / remote:
OK/Enter heart (resonates), ↑ more like this, ↓ less like this (and skips that teacher's queued talks), → / N next (a skip
before the 60 s gate is the light "didn't land" signal), ← previous, Space pause, T topics (D-pad navigable grid, gold glow
focus), Esc / Back exit. Plays are logged to the watch log (finished = +0.2 completion in the taste). Buttons: Watch title card
"TV mode", the Watch rail, the For You header and every card; a big-screen hint (pointer: none, ≥ 1800 px or a TV user agent).

## 5. Freshness ops
- Deploy: `tools/build-anniversaries.mjs` and `tools/build-stats.mjs` run first in deploy.sh.
- Nightly Cron Trigger on wiser-api (`17 19 * * *` UTC = 02:17 Phnom Penh): recomputes `clip_stats` (picks, wins, resonates from
  D1) and writes `daily_theme` for today and tomorrow (UTC). `GET /stats/clips` serves the nightly table when < 36 h old, else
  computes live; `GET /feed/theme?date=` serves the stored theme or computes one. The client computes its own theme in local
  time (so uposatha follows the listener's date); the API copy is for the MCP and other readers.

## 6. Simulation (`specs/sim/feed_sim.py` -> feed_results.json; seed 11 in feed_results-seed11.json)
Real catalogue (5,650 ballot talks from mcp/data/wiser.json), simulate.py's hidden quality and listeners; a steady listener
looks at the top 20 each day and opens the first 4; day-level boredom for a teacher/topic watched in the last days (assumption).
`PYTHONHASHSEED=0 python3 feed_sim.py --users 40 --days 14` (≈ 60 s).

| policy | Jaccard top 20, day to day | hit rate top 20 | hits among opened | teachers seen | families with a hit |
|---|---|---|---|---|---|
| best-first | 0.347 | 0.258 | 0.236 | 34.3 | 1.95 |
| best-first + MMR | 0.432 | 0.348 | 0.292 | 47.1 | 3.68 |
| **Wiser feed** | **0.075** | **0.388** | **0.416** | **61.5** | **4.60** |
Seed 11 (30 users): Wiser 0.076 / 0.370 / 0.364 vs best-first 0.299 / 0.260 / 0.240.
Tuning note: a strong impressions penalty (0.12–0.3) made the list turn over completely (J ≈ 0) and a ±0.06 jitter cost hit
rate; 0.015 and ±0.015 kept the hit rate. Turnover now comes mostly from the daily theme, recency and exploration.
Honest reading: the user model does not reward novelty for itself (only boredom with repeats), so the sim shows turnover costs
nothing and diversity pays; whether listeners prefer this much daily change needs live data (log impressions/opens per slot).
