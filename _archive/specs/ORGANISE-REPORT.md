# Organise pass (2026-10-20), local only, NOT deployed

Backup before any change: `backups/app-pre-organise-20261019-2209.tgz` (restore: `tar xzf` from `work/wiser/`).
Design untouched: no CSS edits. All new UI reuses existing classes (whero, stats, wchip, rail/tile, pprog/pprg cards, wgrid/wtile, wtopics).

## Numbers, before -> after
| | before | after |
|---|---|---|
| clips | 1,513 | **1,953** (+440 natural, from official channels) |
| format | 1,513 "horizontal" (defaulted, never checked) | **1,836 horizontal + 117 vertical, all verified** |
| ballot pool (1–20 min, not footage) | 1,207 | 1,647 |
| ballot pool from deep teachers (>=8 talks) | 1,072 | 1,512 |
| speakers | 94 | 94 (no data deleted) |
| speakers >=8 talks (front-facing) | 38 | 38 (35 on the grid; 3 of the 38 are archival/figure rows) |
| speakers >=40 talks | 5 | **18** |
| 1-clip speakers | 24 | 24, now folded into "More voices" |
| rebirth-tagged clips | 66 | 72 (+ hub regex pool: **81** talks on #topic/rebirth) |

Depth for the major teachers (after): Nyanamoli 549, Krishnamurti 80, Sarvapriyananda 80, Spira 75, Thanissaro 75, TNH 70,
Mooji 60, Tadatmananda 60, Mingyur 60, Tara Brach 60, Dalai Lama 50, Filip Holm 50, Pasanno 48, Lucille 45, Wallis 45, Kornfield 45,
Brahm 40, Tsoknyi 40. Short of target: Brahm, Pasanno, Sumedho (15), Amaro (5): their official uploads are mostly 30–90 min.

## 1. Orientation
- `app/tools/orient.py`: per YouTube id, the oEmbed of `/shorts/<id>` (player box taller than wide = vertical) plus
  `/shorts/<id>` status without following redirects (200 = Short, 303 = regular). Cache `app/tools/format-cache.json`
  (1,831 ids, 0 unknown). `build-clips.py` now applies it after merging (`format`, `formatChecked`, `short`).
- Result: 48 of the old 1,513 were vertical (Dalai Lama, Tsoknyi, Tara Brach, Mingyur, Lucille...). 69 of the 440 new are vertical.
- App rules (unchanged code paths, verified in screenshots): phones prefer vertical 80% of rounds (`FORMAT_PREFS`), horizontal
  allowed; desktop never gets vertical (`servable`). Checks: phone pool 106 vertical of 1,508; desktop pool **0 vertical of 1,402**;
  a shared `#clash` link with two vertical clips on desktop is refused with the "plays on phones only" note.

## 2. Teacher curation (threshold: 8 talks, `DEEP_MIN` in src/app.js and src/wise.js)
- Main rotation (`pool()`, `roundFormat()`): deep teachers only, unless the scope leaves fewer than two teachers; a topic feed
  (`cat:` feeds, "Play this topic") keeps every voice.
- Charts: teacher shelves and top talks show deep teachers only; the wisegraph "On video" board hides thin speakers.
- Teachers grid: "On video" shows the 35 deep speakers; the other 56 fold into a "More voices: their talks live inside the
  topics" chip list. Profiles (#teacher/<id>) still exist for everyone. Nothing deleted.

## 3. Deeper catalogues: `sources/teachers-deep/` (REPORT.md there)
440 natural 1–20 min clips from 22 official channels (VSNY, Rupert Spira, dhammatalks x2, Plum Village x2, Mingyur, BSWA,
Tara Brach, J. Krishnamurti Official + KFT, Abhayagiri, Amaravati, ArshaBodha, Moojiji, Let's Talk Religion, Jack Kornfield,
Dalai Lama, Francis Lucille, Hareesh, Pundarika). Channel-scoped search rows, oEmbed 200 + /embed playable, oEmbed author =
the channel, name match on multi-teacher channels, non-talk and non-English titles filtered, topics tagged from title/snippet.
- Virtual clips NOT added this pass: chapter markers needed the watch page, and YouTube answered with its rate-limit page
  (google.com/sorry, 429) while the other sourcing agents were querying. I stopped after one attempt. Backlog of long rebirth talks is in that REPORT.

## 4. Topic hubs
- Data: `app/wisegraph/hubs.json` (hand-curated, Wiser's own words) -> `tools/build-hubs.py` -> `site/data/wisegraph/hubs.json`
  (adds the Atlas concept thread from `atlas/merged`, read-only).
- **#topic/rebirth**: intro, stats (81 talks · 5 traditions · 24 teachers · 19 essays · 7 practices), jump chips, the existing
  per-tradition takes, then 7 sub-questions as rails (What is reborn? · Remembering past lives · Karma and the next life ·
  Between lives: the bardo · The West: Er, Pythagoras, Steiner · Dying and near-death · Ending the round), "Rebirth in <family>"
  rails, 19 essays (dhammatalks, Access to Insight/BPS, SuttaCentral, Vivekananda's Complete Works, Gutenberg Upanishads/Gita/Phaedo,
  Perseus Republic X, Steiner Archive, Sefaria Sha'ar HaGilgulim, Wikisource Bardo Thödol, UVA DOPS), 7 practices (five
  remembrances, maranasati, recollecting the round, powa intro, preparing for the bardo, self-enquiry "who dies?", Socratic
  practice of dying), "Rebirth through time" (16 Atlas holders, oldest first), teachers to go deeper with (+ More voices),
  Where to practise (places of the traditions in the pool), related topics, and **Keep going**: each press appends the next
  neighbouring topic's unseen talks and essays, then queues that topic's neighbours, until every topic is walked.
- Generalised: death, self, kamma, meditation, awakening have hub entries (questions, essays, practices; Atlas threads for
  self/kamma/awakening). Every other topic gets the same template automatically (leaf sub-topics as questions, tradition
  rails, teachers, places, related, Keep going), just without essays/practices. Topics index: the six hubs lead, labelled
  "Explore: talks, essays, practices".
- Every essay/practice URL was checked HTTP 200 on 2026-10-20 (33 URLs). Links only; nothing rehosted.

## Screenshots: `work/wiser/shots-organise/`
desktop-rebirth, phone-rebirth (full page, two Keep going presses), desktop-teachers, phone-teachers, phone-vballot (two vertical
Shorts on the ballot) + its intro/theatre, desktop-vertical-link-* (desktop refuses the vertical pair), desktop-topics, desktop-death.
Script: `work/wiser/shot-organise.mjs` (`sh shot-setup.sh` first; `DEV=phone|desktop`).

## Ready to deploy (when you say so)
Files changed in app/: src/app.js, src/wise.js, src/places.js, tools/build-clips.py (format step), tools/orient.py (new),
tools/build-hubs.py (new), tools/format-cache.json (new), wisegraph/hubs.json (new), clips.json + site/ outputs (rebuilt).
Both transcript guards pass on a site/ copy (grep guard clean; 9,665 samples, 0 found).
Deploy steps: `python3 tools/build-hubs.py && npm run build && sh deploy.sh` then the D1 seed (`wisegraph/seed.sql`).

## Caveats
- **Merge set**: I built clips.json with `WISER_SOURCES` pointing at only advaita-extra, advaita-hindu-tantra, buddhist, western,
  teachers-deep. While I worked, other agents wrote `REPORT.md` into `sources/deep-theravada-hindu/` and `sources/deep-western/`
  (their files are `clips.json`, not `candidates.json`, so a plain `build-clips.py` currently ignores them, but check before
  rebuilding). Not reviewed by me.
- Phone overflow note: the takes row (`.wtakes`) and rails scroll sideways inside themselves (existing behaviour).
- On phones the collage at the top of the rebirth hero showed two broken portrait tiles in the screenshot (Commons images that
  did not load in the headless browser); the same collage code is already live.
- Thin-speaker "More voices" on topic hubs lists only speakers whose talks are in that topic's pool.
