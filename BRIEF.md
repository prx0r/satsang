# Wiser: brief

Live: https://tantrafiles.xyz (www too) · API: https://api.tantrafiles.xyz · MCP: https://mcp.tantrafiles.xyz/mcp · Code: `work/wiser/` (public mirror github.com/prx0r/satsang; tarball backups in `work/wiser/backups/`). **Current state: see the last section.**

## What it is
Two talks from the world's wisdom traditions, one quiet question: **Which resonates more?** The listener takes their time.
Every pick feeds a pairwise Bradley–Terry model (the crowd chart "Most resonant" and the listener's own model). Profiles
for teachers, figures and traditions, and topic pages that set the traditions side by side, sit around the screening.

## The mechanic (resonance, since 2026-10-20)
- Flow: a calm face-off ("A *or* B") → talk #1 full screen → talk #2 → the ballot "Which resonates more?" with two
  **Resonates** buttons (heart) and **Pass**. No countdown, no ring, no auto-pass, no timing multipliers (`RESONANCE = true`
  in `src/app.js`; `timingWeight()` returns 1). `decisionMs` is still logged, never weighed.
- A pick counts fully once **both talks played ≥ 60 s or to their end** (`GATE_SEC`, `Screen.enough()`). Otherwise it is
  kept with `lowWatch: 1` and **half weight** (applied after the skip adjustments). The ballot says so quietly and offers
  "Listen to #N again" (`backTo()`), which resumes that talk and returns to the ballot when it ends or you move on.
- **Next talk / Choose** (rail, swipe left, N / →): after the 60 s gate it is a neutral move-on; before it, the old
  "didn't land" skip (0.4 of a loss). Skip pair (swipe up, S) and Pass (P) as before.
- **This resonates** (heart on the playing talk, H): a light single-talk save, separate from pairs. Stored in
  `localStorage wiser.resonates {clip: {at, t, sec}}`, sent to `POST /resonate` (device id or session; `on:false` removes).
  `GET /resonate/counts` = public per-clip counts (not yet used by the tally).
- After a pick: "Resonated: <title>", the crowd split when there is one, Send to a friend; the next pair rises after ~2.2 s.

## Lengths, full talks, virtual clips
- 1–20 min talks play whole (start → end). `LONG_SEC = FULL_SEC = 1200`.
- **Full talk** = over 20 min and not a virtual clip (`clip.full: true`, set by `tools/build-clips.py`). Full talks leave
  the ballot pool (`inBallot()`) and the daily, and appear on profiles under **Full talks** (#watch plays them whole).
- **Virtual clip** = a 1–20 min passage of a longer official video: `{ id: "${videoId}@${start}", parent: videoId,
  start, end, segTitle? }`. Plays the parent with YouTube `start`/`end` player params, progress and `m:ss / m:ss` run against
  the passage, finished at its end. Two passages of one parent never face each other (`ytId(A) === ytId(B)` is rejected in
  `openPair`, `takeClash`, `watchOpponent`, `playFrom`). `#watch/<id>` accepts `videoId@start` (URL-encoded `%40`).
  The API's clip-id regex accepts `@`.
- Fallback (the old "240 s passage from 20 %" hack): every full talk carries `passage: [s, s+240]`. Only when **no virtual
  clips exist and fewer than 40 clips are 1–20 min** (`PASSAGE_FALLBACK`), full talks screen that passage. Virtual clips now exist
  (178), so the fallback can never switch on.

## Pages (routes)
- `#teacher/<wisegraph id>`: speakers AND figures/texts. Hero (Commons portrait, else the speaker's own talk still, else
  a monogram), years, line, tradition chips, stats, "Play a resonance round", links; About; **Works** (book-cover cards,
  "+ Read/Heard" log on device); **Talks by**; **Full talks**; **Talks about** (clips' `figures[]`); **Influenced by /
  Influenced** (wisegraph edges, people and tradition nodes); **For seekers of** (neighbours). Empty sections are hidden;
  a figure with no clips shows a calm "on their way" line. Old name slugs still fall back to the Funnier-style profile.
- `#tradition/<id>`: hero with a portrait collage, family › school breadcrumb, blurb, stats; **Lineage** tree (the whole
  family, current node highlighted, people counts); Key figures; Influenced by / Influenced; Top topics (chips → topic
  pages); Best talks.
- `#teachers` / `#traditions`: the Teachers tab with a Teachers · Traditions switch. Teachers = On video + every figure
  grouped by family. Traditions = one card per family with its schools and lineages.
- `#topic/<topic id>`: "Rebirth" + "Theravāda · Advaita Vedānta · Platonic tradition · Anthroposophy · …", portrait
  collage, one column per tradition (Wiser's one-line take from `wisegraph/topic-takes.json` + its talks, or "Talks
  arriving"), **Compare two takes** (a resonance round on that topic from two different columns; different teachers while
  only one tradition has talks) and **Play this topic** (the topic feed). Topics tab cards link here.
- `#places` (nav tab **Places**): Leaflet map on OpenStreetMap tiles (no key; attribution always shown; tiles darkened by a CSS
  filter), filters by family (chips), type, country, search, and a **Goenka centres** switch (272 dhamma.org centres, clustered
  layer, off by default). Tap a point -> place panel (type, country, traditions, description, lineage of its first teacher,
  up to 3 retreats with the official schedule link, Open place / Official site). Map | List switch; places without coordinates
  (18, incl. Hillside Hermitage, whose location is not public) are list-only (dashed card). By-country chips.
- `#place/<id>`: hero with a small map (+ nearest same-family places), type/country, tradition chain, Founded/Programmes/Teachers,
  Official site / Retreat schedule / **Directions** (Google Maps dir URL from coords, else from name+city+country); **Retreats
  and programmes** (length, format, cost model, Official schedule; no dates stored); **Lineage**; **Founded by or taught here**
  (`teachers` = founders or teachers historically tied, not "teaches here now"); **Talks by teachers of <place>**; **Contact**
  (official site, contact page, emails/phones exactly as published, each with a "source" link, "checked <date>", address +
  Directions); **Free books** (publisher's own page, linked never rehosted); **Nearby in the same family**.
- `#country/<code>`: map of the country's places (Goenka included), stats, tradition chips, places by type, dhamma.org
  non-centre site count.
- Teacher profiles: **Lineage** (teacher_of only: longest line above + students; Mun -> Lee -> Fuang -> Thanissaro renders on
  Thanissaro, Sao -> Mun on Ajahn Mun), "Living teacher" badge only when `living:true`, **Where to practise** (places tied to
  the teacher first, then their lineage node, widening to the parent if < 3; nearest first using `/geo.json`), and **Contact:
  <org>** + **Free books** when a tied place has them. Tradition profiles: **Where to practise** (places in the subtree).
  Relations read Teacher / Student / Influence, and `studied_with` always reads **Studied with** (never heir).
- `/geo.json` (wiser-web worker): Cloudflare's approximate request location `{lat,lng,country}` rounded to 0.1 deg, no-store,
  never logged. Used only to sort "Where to practise".
- Charts: crowd board is **Most resonant** ("% resonant" under tiles).
- Labels: `delivery:'reading'` (Steiner Press narrated readings) shows "Reading"; `delivery:'footage'` (archival darshan/event film) shows "Footage" and stays out of every pairing.

## Data shapes
- `clips.json` row (`app/clips.json`, copied to `site/` by `npm run build`): `id, teacher, speaker (wisegraph id), title,
  ytTitle, channel, kind:'human', media:'youtube', checked, dur, sec, format, carrier, setting:'talk', region (family),
  tradition, traditions[], figures[], topics[], style[], published, year, views, tier, transcript (bool only), tags{v,topics:
  [[topic,conf,src]],lang,band}` + `full`, `passage` for full talks + `parent, start, end, segTitle` for virtual clips.
- `site/data/wisegraph/wise.json` (built by `tools/build-wise.py`): `people{id:{n,short,k,t,years,bio,tagline,wd,works[],
  links,img{src,face,page,artist,license,licenseUrl},by[[id,type]],inf[[id,type]],seek[]}}`, `traditions{id:{label,kind,
  parent,blurb,wd,kids[],by,inf,founders[]}}`, `takes{topic:{order[],takes{tradition:line}}}`. Everything clip-related
  (talks by/about, counts, topics per tradition) is computed in the browser from clips.json (`src/wise.js`).
- `site/data/wisegraph/places.json` (built by `tools/build-wise.py` from `wisegraph/places.json` + `wisegraph/place-contacts.json`
  + `source_maps.PLACE_RESOURCES`): `{meta, places:[{id,name,type,traditions[],country,city,lat,lng,coord_precision,founded,
  teachers[],url,schedule_url,wikidata,description,offers[],goenka,retreats[{id,name,typical_length,format,cost_model,
  schedule_url}],contact{checked,page,page_src,email[[v,src]],phone[[v,src]],address[v,src]},resources[{title,url,free,licence,
  source_url,checked}]}], countries{code:{name,places,goenka,traditions{},goenka_sites}}}`. Map bundle: `site/placemap.js`
  (Leaflet 1.9.4 + markercluster 1.5.3, built by `npm run build`, versioned via `<meta name="wiser-placemap">` in deploy.sh).
- D1: `wg_places`, `wg_place_links (place, kind tradition|teacher, ref)`, `wg_retreats` (`api/migrations/0015_places.sql`,
  applied remotely 2026-10-20), filled by `wisegraph/seed.sql`.
- Votes / events / watches: unchanged from Funnier (D1 `wiser`). New table `resonates(who, clip, t, sec, created_at)`
  (`api/migrations/0014_resonates.sql`, applied remotely 2026-10-20).

## Library (2026-10-20, after the overnight sourcing merge)
**1,513 clips** = 1,335 natural + 178 virtual; 296 full talks (profile only), 10 archival footage rows (profile/topic only), so
**1,207 in the ballot pool**. By family: Buddhism 906 (Hillside 549 incl. 38 new passages), Hindu 360, Independent 82
(Krishnamurti 59), Christian 66, Platonic 64, Esoteric 35. Wisegraph (after the Place merge): 222 people (91 speakers, 126 figures, 5 texts), 42
tradition nodes, 192 edges (93 teacher_of high, 8 studied_with), 126 portraits, topic vocabulary v2 (32 roots), takes for 8 topics (v2, reviewed).
Sources merged: advaita-hindu-tantra 307, buddhist 386, western 224, advaita-extra 76 (3 archive uploads dropped by choice).

## Place layer (merged 2026-10-20)
476 places (203 curated + 273 Goenka; 458 mapped, 18 list-only) in 49 countries, 357 programmes. 106 curated places have published
contact details (70 with email, 30 with phone, 93 contact pages), 3 free-book resources (dlshq.org, dhammatalks.org, bps.lk).
Decisions: `siddha-yoga` lineage node (parent hindu, influenced by kashmir-shaivism, Muktananda its founder, his two ashrams
retagged); the 8 medium-confidence "teacher_of" edges from the places group became `studied_with`; `christian` id kept; `living`
only when Wikidata has no death date and nothing contradicts it (13 people; Chanmyay Sayadaw NOT living: Wikidata has no death
date but English Wikipedia gives 19 Sep 2026, so years 1928–2026; Bhante Gunaratana living, checked on both).
Contacts: `python3 tools/place-contacts.py` (homepage -> its contact link; mailto/plain emails on the org's own domain or a
free-mail box named after it, tel: links, schema.org address; cache in tools/cache-contacts/; `--refresh` to re-read). Hand drops
of personal addresses: `source_maps.PLACE_CONTACT_DROP`. Free books: `source_maps.PLACE_RESOURCES` (checked by hand).

## Merging the sourcing folders (`work/wiser/sources/<group>/`, only groups with a REPORT.md)
```
cd work/wiser/app
python3 tools/merge-sources.py                                 # people/traditions/edges -> wisegraph/*.json, topics-additions -> schema/topics.json (idempotent)
python3 tools/build-clips.py ../raw ../transcripts-internal    # Hillside rows + every group's candidates.json -> clips.json, teachers.json, boards/profiles/graph, seed.sql
python3 tools/place-contacts.py                                # (when places change) public contacts from official sites
python3 tools/portraits.py && python3 tools/build-wise.py      # portraits (resumable; --refresh to redo all) + wise.json + places.json + credits
sh deploy.sh && (cd api && npx wrangler d1 execute wiser --remote --file ../wisegraph/seed.sql --yes)
```
- Id maps and review decisions live in `tools/source_maps.py`: tradition ids (hellenic/platonism -> platonic, christianity ->
  christian, western-esotericism -> esoteric), person ids (nag-hammadi-library -> nag-hammadi), Steiner Press readings credited
  to `rudolf-steiner` with `delivery:'reading'`, untrusted channels (CHANNEL_DROP), edge fixes/drops, extra people
  (swami-sivananda), per-clip tradition fixes, the v2 topic nodes and TOPIC_ALIAS (karma -> kamma, reincarnation ->
  rebirth/western ...). Editorial titles for mechanical virtual titles: `tools/virtual-titles.json`.
- Candidate rows: deduped by id (Hillside first, then groups A-Z), shape-checked, `sec` = played length (passage for virtual
  clips), `dur` = full video (`parentDur` when given), topics validated against the vocabulary with roots added for leaves,
  `talk` = the parent talk's title for virtual clips whose title doesn't already name it. `setting:'footage'` -> setting talk +
  `delivery:'footage'` ("Footage" label; never in the ballot: `inBallot()` excludes it and `vote()` refuses a pick on it).
- v2 roots (guru, reality, the divine, ...) are not read from Hillside transcripts (TR_SKIP), only from titles/descriptions.
- merge-sources.py also reads `lineages.json` (teacher_of chains, influenced, lineage_of), `patches` (alias adds) and, for the
  places group, writes `wisegraph/places.json` (place tradition retags: `PLACE_TRADS`; never-pinned: `PLACE_NO_COORDS`).
- Screenshots: `sh ../tools/shots/shot-setup.sh` (rebuilds the /tmp toolchain), then `node ../tools/shots/shot3.mjs <outdir> [views]` (`LIVE=1` for the live site).
  Place views: places, placespick (Goenka on + a pick), place, placeforest, hillside, country, sivananda, mun, forest. The
  overflow check ignores Leaflet panes; "A.tile" overflow on teacher pages is the horizontal talk rail (scrolls inside itself).

## Build and deploy
```
cd work/wiser/app
python3 tools/merge-sources.py                                 # (only when sources changed)
python3 tools/build-clips.py ../raw ../transcripts-internal   # clips.json, teachers.json, data/wisegraph/{boards,profiles,graph}.json, seed.sql
python3 tools/portraits.py                                     # wisegraph/portraits.json (Wikidata P18 -> Commons, PD/CC only)
python3 tools/build-wise.py                                    # data/wisegraph/wise.json + the Portraits block in site/credits.html
sh deploy.sh build                                             # site phase A: esbuild -> site/app.js, dist/, open data, discovery, meta pages
sh deploy.sh guard                                             # site phase B: transcript guards over dist/ + open data
sh deploy.sh ship                                              # site phase C: KV uploads, embed, wrangler deploy wiser-web
sh deploy.sh mcp                                               # MCP: build data + test.mjs + deploy wiser-mcp (then node ../mcp/test-client.mjs live)
sh deploy.sh chat                                              # chat catalog + 15/15 local + deploy satsang-chat
sh deploy.sh api                                               # API: wiser-api (api.tantrafiles.xyz)
cd .. && python3 tools/check/check-data.py && sh tools/check/crawl-run.sh   # data checks + phone route crawl
sh tools/release/release.sh "<msg>"                            # commit + push prx0r/satsang (work/wiser is the work tree)
```
In the Hark sandbox (120 s per call) run build, guard and ship as separate calls (`sh deploy.sh` = all three).
The Cloudflare token is injected on the wire for api.cloudflare.com. The site ships inline inside the Worker
(`web-worker/embed.mjs`, text files only; images are hotlinked: YouTube stills, Commons thumbnails).

## Rules
- Transcripts are internal only (`work/wiser/transcripts-internal/`). No transcript text, URL or path is ever published.
  `deploy.sh` has two guards: the name grep, then `tools/check-no-transcripts.py` (samples 9-word runs from every internal
  transcript and fails if any appears in dist).
- Official uploads only (teacher, foundation, estate, publisher); embeddable; YouTube's own player; nothing downloaded.
- Portraits: Wikimedia Commons via the Wikidata P18 image only: public domain, Creative Commons, or Commons' own
  "Attribution" licence (enabled 2026-10-20 for Nisargadatta), credited on the profile and on credits.html.
- Topic takes are Wiser's own one-line summaries of textbook positions, never quotes.
- Never buy anything (domains included). The sourcing folders `work/wiser/sources/<group>/` are written by the sourcing
  agents; integration is a separate step (merge their people/traditions/edges into `app/wisegraph/`, their candidates into
  the clip build, then re-run the three tools).
- Plain words in the UI: no jargon, no "battle", no "VS", no clocks.

## State 2026-10-20 05:00
- USER RULE: the white redesign was REJECTED. Keep the current dark design (serif headings, gold). Show screenshots before deploying any design change. wiser-redesign was cancelled and never deployed; app/ is restored from backups/app-pre-redesign-20261020-0425.tgz (rejected work: backups/app-redesign-rejected-2156.tgz).
- UK pass done, not merged: sources/places-uk/ (316 places, 39 traditions, 37 people, 131 sister links, 27 events). Merging needs merge-sources extended plus a place-edges table.
- satsang.digital: Cloudflare zone 708de8d4 (pending); NS ariadne/burt.ns.cloudflare.com at Porkbun.
- 05:20: wiser-organise is running on app/ locally (orientation check, featuring teachers with ≥8 clips, the deep Rebirth hub; no deploy). Overnight deep sourcers write to sources/deep-{tibetan-eastasian,theravada-hindu,tantra,western}/ per sources/DEEP-SPEC.md (scholarly lineages first-class). Next: merge them after organise, keeping the dark design.

## Organise pass 2026-10-20 (local, NOT deployed): see specs/ORGANISE-REPORT.md
- Orientation verified for every clip (`tools/orient.py` -> `tools/format-cache.json`, applied by build-clips.py): 117 vertical / 1,836 horizontal.
- Depth rule `DEEP_MIN = 8` (src/app.js, src/wise.js): rotation, charts and the Teachers grid feature deep teachers; thin speakers fold into "More voices" and stay in topics.
- +440 clips from `sources/teachers-deep/` (built with WISER_SOURCES limited to advaita-extra, advaita-hindu-tantra, buddhist, western, teachers-deep).
- Topic hubs: `wisegraph/hubs.json` -> `tools/build-hubs.py` -> `site/data/wisegraph/hubs.json`; #topic/<id> = takes + questions + tradition rails + essays + practices + Atlas thread + teachers + places + Keep going.
- 06:10 DEPLOYED the organise pass (wiser-web 668bab25): 1,953 clips with verified orientation (117 vertical), ≥8-talk teacher grid (35) + More voices, topic hubs (rebirth, death, self, karma, meditation, awakening) from wisegraph/hubs.json via tools/build-hubs.py. D1 seed not run. deep-western (1,004) and deep-theravada-hindu (2,574) are done but NOT merged (build-clips.py reads only 5 folders; add the deep-* folders). Report: specs/ORGANISE-REPORT.md.
- 07:58 DEPLOYED deep merge (wiser-web 5f4ab68f): 9,478 clips (~5,760 ballot, ~3,700 full talks hub/profile-only), 565 people (125 scholars), 157 tradition nodes, 412 lineage edges (40 academic), 793 places. Teachers grouped by tradition→school + Scholars section. D1 seed NOT run (seed.sql is destructive). Next: implement specs/ROADMAP.md (Topic flash loop, profile D1 0016, MCP).

## Implementation pass 2026-10-20 (specs/ROADMAP.md): see the lines below
- Backup before: backups/app-pre-impl-20261020-0057.tgz.
- 08:06 API wiser-api 54c53e16: D1 migration 0016_profile.sql applied (additive: saves, practice_log, routines, journeys, taste, device_claims, profile_settings, flash_events). New endpoints (anonymous with device id): /profile/sync, /saves, /me/saves, /practice/log, /me/practice, /me/routines/:id, /journeys/:id/progress, /taste (GET/PUT), /flash/events, /me/export, /me/forget-device, /me/claim-device (auth), /me/visibility (auth), /stats/clips (public crowd quality). /votes stores `context` (flash:<topic>) inside signals JSON. DELETE /me also clears the profile tables.
- 08:27 SITE wiser-web f623593b: Topic flash is the home (Watch tab; src/flash.js + src/rank-topics.js port of mcp/src/rank.mjs + src/taste.js Beta facets): title card, 2-3 teachers from different schools (MMR, main-tier fronts, explore slot from the least-certain family, session fatigue, vertical-first per slot on phones, desktop horizontal-only via servable), calm "Which resonated?" (None of these, Listen again, keys 1/2/3/0/L), bridge card with reason (adjacency/infoGain/fit), Go deeper, Choose a topic, rest card every 4th. Pick among 3 = votes A>B, A>C with context flash:<topic> (verified in D1, test rows removed). Old pair ballot: #pair, "Two talks" link, #clash/#watch/invites, hub "Compare two takes". Hub "Play this topic" = flash locked to the topic (3 flashes). Hub question rails ordered by MMR (railOrder). Topics tab applies the TOPICS §6 gate (30 published, 3 "Talks arriving"). #me (Your model tab): taste chips + Still exploring + Not for me + Reset, journeys in progress, practice log (week dots, no streak pressure), saved talks/practices/collections, history link, Download my data (JSON + practice CSV), Delete everything (local + /me/forget-device). #collections, #collection/<id> (6 editorial: seven-days-with-death journey, rebirth-across-traditions set, kashmir-shaivism-first-syllabus, thai-forest-basics, tibetan-deity-practice-primer (orientation only), metta-in-four-traditions), #practice/<id> (76 practices from hubs + deep sourcers, 7 orientation-only; cautions above step 1; dark timer with gold ring, synthesised bells, log to device + API). Data: wisegraph/collections.json -> tools/build-collections.py -> site/data/wisegraph/collections.json. Worker: 6.37 MB raw / 1.32 MB gzip.
- Screenshots: shots-impl/ (local, a stand-in player because the sandbox Chromium cannot decode YouTube: shot-impl.mjs / shot-impl-run.sh; LIVE=1 FAKEYT=1 for the live site, POSTs to the API are stubbed in LIVE runs).
- 08:40 MCP wiser-mcp 5c286e01 -> bf9ae5ff LIVE at https://mcp.tantrafiles.xyz/mcp (custom domain; no other DNS record touched). 7 tools (search, get_topic, get_teacher, get_lineage, list_practices, get_collection, recommend). Bundles mcp/data/wiser.mcp.json (slim-data.mjs: 7,297 clips = every ballot talk + 12 full talks per teacher, 840 KB gzip), index built at startup (~80 ms) for the FREE plan's CPU budget (account is on Workers Free: 3 MB gzip script limit, 10 ms CPU). build-data.mjs now ingests collections.json (76 practices with steps/cautions/needsTeacher, 6 editorial collections), crowd stats (site/data/stats.json from tools/build-stats.mjs <- api /stats/clips) and applies the TOPICS §6 gate to topic.state (58 published incl. leaves). 12,144 records, 0 schema errors (pip install jsonschema for validate.py).
- 08:55 SITE wiser-web a41c90c4 -> a7a39165: open data LIVE. /data/index.json + /data/<kind>.json|.jsonl + /data/wiser.jsonld served from KV namespace wiser-open-data (9b56fc85…, binding DATA; 22.6 MB, outside the script size), /schema/*.json, /llms.txt, /robots.txt, /sitemap.xml + per-kind sitemaps (embedded), path pages /person|topic|tradition|practice|collection|place/<id> with server-filled title/description/canonical/JSON-LD (web-worker/build-meta.mjs -> meta.gen.js, 1,395 pages) that open the in-app route. Site Worker 7.5 MB raw / 1.49 MB gzip (limit 3 MB gzip on Free: clips.json + meta.gen.js are the big parts; next lever = move clips.json to KV like the dumps).
- deploy.sh now: build-stats -> build -> open data (build-data, dump, slim, schema check that fails on errors, llms/robots/sitemaps/schemas, build-meta) -> both transcript guards over dist AND mcp/data/wiser.json (+ grep over mcp/data, mcp/dist-data) -> KV upload -> embed -> deploy. `sh deploy.sh mcp` deploys the MCP. In this sandbox the full script can pass the 120 s tool limit (the 9-gram guard alone is ~33 s), so today's deploys ran the same steps in two calls.
- NOT done (next): teacher pages with topic-overlap MMR (RANKING §8); TV lean-back mode (LOOP §4); signed-in claim-device flow in the client (API ready; Google sign-in is not configured, GOOGLE_CLIENT_ID empty); routines UI; visualisation cycles with deitybody; topic review queues / LLM labelling / curations (ROADMAP 13-14); nightly stats job (stats refresh at each deploy, and the client reads /stats/clips live; D1 has 0 real votes so far, quality uses static terms).

## For You + intentions + TV mode, 2026-10-20 18:35 (spec + numbers: specs/FORYOU.md)
- Backup before: backups/app-pre-tv-20261020-1800.tgz. Dark design kept (fy-*/int-*/tv-* rules appended to site/style.css; nav gains "For you").
- API wiser-api 1a53b74b: D1 migration 0017_foryou.sql applied remotely (additive: intentions, clip_stats, daily_theme; seed.sql NOT run). New: PUT/GET /intentions, GET /feed/theme; /profile/sync and /me/export return intentions; forget/claim/DELETE cover them. Cron Trigger `17 19 * * *` (02:17 Phnom Penh) = nightly(): clip_stats + daily_theme; /stats/clips serves the nightly table when < 36 h old. First cron run: tonight (not triggered by hand).
- SITE wiser-web 66b70b6e (7.64 MB raw / 1.48 MB gzip, under the 3 MB Free cap; clips.json stays embedded): #foryou (src/feedrank.js + src/foryou.js), For You rail under the Topic flash, intentions in Your model (src/intentions.js), daily theme (src/themes.js + tools/build-anniversaries.mjs -> site/data/wisegraph/anniversaries.json, run by deploy.sh), TV mode #tv (src/tv.js; also #tv/topic|teacher|collection|from/<id>, ?tv=1). taste.js reads feedLess/feedMore/completions; rank-topics nextTopics has an intent term; flash cold start follows intentions.
- clips.site.json now keeps `published` (tools/build-clips.py SITE_DROP edited) so "New this week" works live.
- Sim (specs/sim/feed_sim.py): top-20 day-to-day Jaccard 0.075 (target < 0.5); hit rate 0.388 vs best-first 0.258 (+MMR 0.348); hits among opened 0.416 vs 0.236.
- Screenshots: shots-tv/ (local) and shots-tv/live, shots-tv/live-cold (LIVE=1 FAKEYT=1): `sh shot-tv-run.sh foryou tv metint flashrail flash rebirth teachers` (shot-tv.mjs seeds intentions for foryou/tv/metint/flashrail; TASTE=0 for cold).
- Known: topic tags are noisy, so some "On your mind" / theme matches are loose (tagging, not ranking); phone overflow flags on #topic/rebirth and #teachers are the existing horizontal rails; the big-screen TV hint shows in headless Chromium (pointer: none) but not on mouse desktops.

## Open directory for agents (MCP v0.2.0 + REST + discovery), 2026-10-20 ~19:45
- Backup before: backups/mcp-pre-agents-20261020-1144.tgz (mcp/ + web-worker worker/build-meta/embed/wrangler + deploy.sh). app/src, the design, sources/ untouched; seed.sql not run; app.js not rebuilt (site redeployed from the existing dist + new discovery files).
- MCP wiser-mcp f7192b4a LIVE (898 KB gzip, startup 96 ms): 14 tools = the 7 originals + OpenAI-shaped `search` ({results:[{id,title,url}]}, ids now `<kind>/<id>`) and `fetch` ({id,title,text,url,metadata}) + find_places, get_place, find_teachers, get_resources, get_lineage_path, what_to_study. All read-only-annotated; every record carries url (canonical tantrafiles.xyz), source_url, verified_on, confidence. Legacy tools accept `person/<id>` ids and URLs. Transports: Streamable HTTP POST /mcp (no auth) + legacy SSE GET /sse / POST /messages (Durable Object SseSession, SQLite class, works on Free). REST mirror /api/* + OpenAPI 3.1 /openapi.json (Custom GPT Action), CORS *, Workers Rate Limiting RL_API 120/min + RL_MCP 600/min (verified: 429s after the burst). Discovery on both hosts: /llms.txt, /llms-full.txt, /.well-known/mcp.json (+ /.well-known/mcp/server-card.json).
- Data: build-data.mjs now keeps place offers/kind/events/resources/sisters/contact page source + meta.updated/confidence/sources, edge source URLs, people's free texts, death years from anniversaries.json, and any app/site/data/wisegraph/resources*.json (no hard-coded counts anywhere; llms/agents numbers are computed). 12,144 records, 0 schema errors. Resources derived in mcp/src/resources.mjs (305, 69 free).
- SITE wiser-web 5159a722 (1.57 MB gzip): /agents (plain dark docs page), /llms-full.txt, /.well-known/mcp.json, /resource/<id> (305 plain pages with JSON-LD), every /place/<id> (incl. Goenka directory) and every /topic/<id> resolve, /text/<id> 301 -> /resource, /clip/<id> 302 -> player, /openapi.json 302 -> MCP. Open-data KV re-uploaded. 182 sampled canonical URLs: all 200. Transcript guards passed (0 found).
- Tests: `node mcp/test.mjs` all passed locally; `node mcp/test-client.mjs https://mcp.tantrafiles.xyz` 35/35 passed live (handshake 2025-06-18 + 2024-11-05, tools/list, OpenAI shapes, SSE round trip, directory tools, REST, CORS, discovery).
- Licences: mcp/LICENSE-DATA (CC BY 4.0 for Wiser curation; third-party = metadata under its own terms; contacts not for bulk mail) and mcp/LICENSE-CODE (MIT).
- USER TODO: create a public GitHub repo (e.g. github.com/<you>/wiser-open) and push mcp/ (code + LICENSE-*; data via the /data dump or a dated release, Zenodo DOI later). The connector cannot create repos. Then add `repository` to mcp/build-discovery.mjs card.
- Add it: ChatGPT > Settings > Apps & Connectors > Advanced > Developer mode > Create connector, URL https://mcp.tantrafiles.xyz/mcp, no auth. Claude > Settings > Connectors > Add custom connector, same URL. Not tested from inside ChatGPT/Claude UIs themselves (no accounts here); tested with a protocol-level client.
- Known: teacher location = tied places; "likely-living" and place status are inferred (flagged in results); shortest lineage path may prefer an influence edge over a longer teacher chain (pass lineage=dharma); fetch of clips outside the slim bundle returns isError; /agents screenshot skipped (sandbox puppeteer missing).

## State 2026-10-20 19:30 — SATSANG
- Renamed to Satsang (satsang.digital; the user switched the Porkbun NS to Cloudflare; zone 708de8d4 pending at 19:29). The satsang-rebrand agent does the name swap plus tools/switch-domain.sh.
- GitHub: prx0r/satsang (public code; vendored yt_dlp pylib excluded because push protection flagged its built-in AWS keys) and prx0r/satsang-data (PRIVATE; transcripts-internal, 20 MB). Push staging: /tmp/satsang (ephemeral).
- India study DONE at sources/deep-india-study/ (41 places, 57 resources, 48 people, 49 edges, 490 clips, 271 long lectures). NOT merged. Fixes: Dyczkowski died 2025-02-02 (deep-tantra says alive); the PhD supervisor clash (Sanderson per his site vs Gombrich in deep-tantra lineages); bad URLs ltwa.net→tibetanlibrary.org, trimbakeshwar.org (private), kamakhyatemple.org→maakamakhya.org.
- Offered next: merge India + study paths; then Atlas or curations.

## Rebrand Wiser -> SATSANG, 2026-10-20 ~20:10 (domain move prepared, NOT switched)
- Backup before: backups/pre-satsang-20261020-1930.tgz (app src/site/web-worker/api src+toml/deploy.sh/tools, mcp src/scripts/docs/discovery).
- Only names changed: wordmark "WISER" -> "SATSANG" (same letter-spaced gold serif), titles, meta/OG, page copy "Wiser" -> "Satsang", 404/credits/privacy/terms, /agents, llms*.txt, MCP serverInfo name 'satsang' + title "Satsang: an open directory of the wisdom traditions", OpenAPI title "Satsang open directory API", READMEs/LICENSE-*/OPEN-DATA. One layout fix the longer word needed: .top padding-left 128->180px (desktop) and 108->158px (<=820px) in site/style.css so the wordmark doesn't sit on the "Watch" tab. Kept: worker names wiser-web/wiser-api/wiser-mcp, D1 wiser, KV ids, localStorage keys, cookie wiser_session, atproto lexicon ids xyz.tantrafiles.wiser.*, hello@tantrafiles.xyz (the mailbox that exists).
- One BASE: work/wiser/domain.mjs (ACTIVE='legacy' -> https://tantrafiles.xyz today; 'satsang' -> https://satsang.digital, api./mcp. subdomains). Imported by app/src (share links, profile host, passport/profile schema URLs), web-worker/worker.js (canonicals, JSON-LD, /openapi.json redirect, old-host 301 when HOST != BASE), api/src (CORS = SITE_ORIGINS: both domains + www; invite links = BASE), mcp/src (canonical urls, OpenAPI servers = MCP_BASE, discovery), mcp build-data/build-discovery/build-dump (sitemaps, dumps, llms, server card name <reversed host>/satsang), tools/build-stats. tools/apply-domain.mjs writes site/config.json apiBase/shareBase; deploy.sh runs it and writes robots.txt from BASE.
- app/tools/switch-domain.sh [check attach flip api mcp site verify]: refuses unless zone 708de8d4 is active (FORCE=1 overrides); attaches satsang.digital+www -> wiser-web, api. -> wiser-api, mcp. -> wiser-mcp via the Workers Domains API (satsang zone only; tantrafiles domains stay attached) and adds them to the wrangler.tomls; flips ACTIVE; deploys api, mcp, site; verifies. After the flip tantrafiles.xyz + www (and www.satsang.digital) 301 to https://satsang.digital keeping path+query; api./mcp.tantrafiles.xyz keep answering for old connectors. The site deploy can pass 120 s: run phases in separate calls (e.g. `sh tools/switch-domain.sh check attach flip api mcp`, then the site build in two calls as deploy.sh lines 11-27 / 29-32 / 33-34).
- DEPLOYED on tantrafiles.xyz: wiser-api 007fc5c3, wiser-web a96ea684 (1.57 MB gzip), wiser-mcp 2d6239de. Transcript guards passed (243 transcripts, 9,665 samples, 0 found); schema check 12,144 records failing none; node mcp/test.mjs all passed; test-client 35/35 against https://mcp.tantrafiles.xyz. Screenshots: shots-satsang/ (desktop+phone flash, For You, Teachers; local).
- GitHub prx0r/satsang: commit 7c9b8dc "Rebrand to Satsang" pushed to main (root README notes domain.mjs + switch script).
- ZONE BLOCKER: Cloudflare zone satsang.digital still pending. Registry (RDAP) nameservers are ariadne.ns.PORKBUN.com + burt.ns.PORKBUN.com (changed 2026-10-20 04:54 +07), hosts that don't exist, so satsang.digital doesn't resolve at all (SERVFAIL). Fix at Porkbun: Domain > Authoritative Nameservers = ariadne.ns.cloudflare.com and burt.ns.cloudflare.com (delete the porkbun ones). Then: `sh app/tools/switch-domain.sh` (in phases).

## Keeper fixes, 2026-10-20 ~21:30 (domain still 'legacy')
- Fixes at the source: `app/tools/source_maps.py` KEEPER_* (people, edges, places, place merges, URL bans, moved URLs) applied by
  `app/tools/apply-keeper-fixes.py` (idempotent; merge-sources.py runs it last). Provenance (source_url, verified_on, confidence)
  now flows people/places/edges -> wise.json/places.json -> MCP meta/prov. /place/<old> 301s via `app/web-worker/redirects.json`.
- /schema/ index (mcp/build-discovery.mjs -> discovery/schema-index.html). Dyczkowski d. 2025-02-02 (Sanderson high, Gombrich low/disputed).
- DEPLOYED: wiser-web 3f6d675e, wiser-mcp 60a96e07 (keeper site hook + site_health/list_findings/next_maintenance_task live).
  Keeper daily run after: 0 error, 1 warn (bundle estimate). Commit be8fb37 on prx0r/satsang main.
- Build note: build-clips.py reads every sources/ group with a REPORT.md, so it now pulls deep-india-study (unmerged). Run it with
  WISER_SOURCES pointing at a folder of symlinks without deep-india-study. Its virtual-clip part titles are not deterministic
  (Python set order); the live clips.json was kept.

## STATE 2026-10-21 02:20 +07 (batch 6; superseded by the 2026-10-24 section at the end where they differ)
- Live versions: **wiser-web 3478290f**, **wiser-mcp 9a999aad**, wiser-api 007fc5c3 (unchanged). Domain ACTIVE='legacy' (tantrafiles.xyz).
  Bundles 572 KB / 1,002 KB gzip. MCP: 22 read-only tools (FoJin NOT added: archived, see specs/extensions/44-texts-targets/connectors/FOJIN-DECISION.md).
- Extensions merged through **45** (prx0r/satsang-extensions @ c470b06). 42-user-profile archived (planned session log in PRACTICE-ENGINE §7.1 / PRACTICE-ASK).
  New: practices 84 (+7: ease-through-the-body-trika-prep + 6 VBT dhāraṇās), collections 9 (+ **trika-prep-week** journey, **vbt-foundations** series),
  staged texts 40 linked (+26 from pack 44) / 14 held (+2: Hareesh 2018 VBT PDF, archive.org Bäumer/Lakshman Joo PDF). Open-data 13,078 records.
- engine/ belongs to the **engine-v2** agent (VBT interactive play from pack 45 + VBT-DOCTRINE/INTERACTIVE/ADAPTIVE); no other agent edits engine/.
- Repo prx0r/satsang at 0d703de (+ this log line). Pack corrections are reproducible: app/tools/patch-ext-42-45.py on a copy of the packs, then stage-extensions → merge-sources → build-wise/hubs/collections.

## STATE 2026-10-21 01:50 +07 (previous close-out; superseded above where they differ)
- Live versions: **wiser-web fe65aa0b**, **wiser-mcp f9405239**, wiser-api 007fc5c3 (unchanged). Domain ACTIVE='legacy' (tantrafiles.xyz).
  Bundles 561 KB / 995 KB gzip (Free cap 3 MB). MCP: 22 read-only tools, REST mirror + OpenAPI, discovery on both hosts.
- Counts: about **738 people** (724 in the open-data person dump), **875 places** (825 mapped), **516 edges**, 178 tradition nodes,
  9,947 clips; open-data schema 13,069 records failing none. Review queue 117 items (never live).
- Licence registry `app/wisegraph/licence-registry.json` (books / domains / urls / held, every new entry with evidenceUrl), one shared gate
  `app/tools/licence_gate.py` used by merge-sources.py (staged texts), build-wise.py (person texts, place resource links) and build-hubs.py
  (topic-hub essays). Hub essays: 46 linked, 13 held. Staged texts 14 shown. Person texts 19 linked, 1 held. Every held text answers
  /resource/<id> with a noindex "held while its licence is checked" page (28 such pages). Latest entry: Ajaan Lee "Keeping the Breath in
  Mind" (dhammatalks.org, CC BY-NC 4.0, any sale = commercial).
- Held, never live: 28 living claims; **6 internal red-flag records** (work/wiser/internal/19-red-flags, never public); D1 drafts
  **0020_curations / 0021_sessions NOT applied**; main teachers held: **Ajahn Sucitto** (Cittaviveka: Guiding Elder, not abbot),
  **Jack Kornfield** (Spirit Rock: a founding teacher), **Swami Ramdev** (Patanjali Yogpeeth: trustee/co-founder); held texts: the 13 hub
  essays + 12 staged texts (path-press-shop, Lakshmanjoo blog, utpaladeva.in, IFP, alexissanderson.com, swarayoga x2, Arsha Vidya x3,
  Vishnusahasranama PDF, Anuttara Trika Kula) + Chittick person text. 21 medium teacher_of edges show as "studied with" and stay queued.
- Keeper: 0 open linkrot errors after the 2026-10-21 pass (URL fixes in source_maps.KEEPER_URL_FIX; accepted sites in keeper/ignore.json).
- **Domain: satsang.digital still FAILS DNS as of 2026-10-21 01:30 +07 ("No Reachable Authority").** The registry still lists Porkbun's
  ariadne.ns.porkbun.com / burt.ns.porkbun.com; they must be **ariadne.ns.cloudflare.com / burt.ns.cloudflare.com** (Porkbun > Domain >
  Authoritative Nameservers). Cloudflare zone 708de8d4 stays pending until then. Only after it is active: `sh app/tools/switch-domain.sh`
  in phases. No agent touches DNS.
- Deploy in this sandbox: never build and deploy concurrently. Site = deploy.sh lines 11-27, then 29-32 (guards), then 33-34 (KV + deploy),
  each in its own call (scripts in work/wiser-closeout/); then `sh deploy.sh mcp`; then `node mcp/test-client.mjs https://mcp.tantrafiles.xyz`.
  pip install jsonschema if the schema check says it is missing.
- Repo: engine/ and specs/TEXT-TO-PRACTICE.md are owned and committed by the text-to-practice agent (e.g. 503894e); sync everything else.

## Licensing stance (user, 2026-10-21)
Satsang is non-commercial: CC BY-NC assets (e.g. LYGIA shaders, Phonon 40m voices) are acceptable with attribution. AGPL ok since repo is public (keep source open). Still preserve all licence notices; Hareesh 2018 text remains link-only (all rights reserved).

## ENGINE MILESTONE 1, 2026-10-21 ~10:30 +07 (engine-v2 agent): visuals + first VBT play SHIPPED
- Preview LIVE (Worker satsang-engine-preview, redeployed via engine/tools/deploy-preview.mjs): https://engine.tantrafiles.xyz/play/ (Trace the Sound),
  https://engine.tantrafiles.xyz/figure/ (breathing figure, front + side, ?view=front|side|both&style=…), /demo/ unchanged + a link chip to the play.
  /talk/ is NOT in this deploy (it was 404 before too); the rt agent's talk/deploy-talk.mjs layers talk/ + rt/ on top of deploy-preview --dry.
- Repo prx0r/satsang **d8bc213** (engine/ only, on top of the rt agent's 6d35bc6; engine/rt + engine/talk untouched). Secret/transcript scan clean.
- New: body/figure.mjs (SVG front + side line art: belly→ribs→collarbones, shoulders, lungs, diaphragm, nostril airflow from body/breath.mjs),
  fx/wave.mjs (wave answers the voice's loudness envelope, travels inward, fades, flat_hold), fx/glow.js (raw WebGL2 instanced additive sprites:
  breath-synced locus/field glow, prana particles riding the wave; no third-party JS), player/clock.mjs (shared clock: gated narration so each pause
  starts when the voice stops, live-speech hold, hold-open last silence + rest timer), player/play.js/.css + player/API.md (play, pause, resume,
  seek_phase, replay_phase(slow), repeat_round, set_level, extend_pause, highlight_locus, show_explainer, speak, end, dispatch, events),
  practices/vbt-trace-the-sound.json (7 gated segments, ~2:40 + open rest; closest to VBT vv. 38-41, Hareesh blog links + verse numbers only),
  renders/vbt-trace-the-sound/voice/ (Phonon 31m en, Apache-2.0, catalog voice Everly Apache-2.0, pace 0.45; whisper match 0.99; swappable via
  tools/media/tts-phonon.py --voice), schema practice-v2 v2.2 + timeline v0.3 (segment blocks, free prims), THIRD_PARTY_NOTICES.md.
- Tests green: compile 74 (65 + the new practice), pipeline 43, schema 0 errors, test-play 103, test-play-browser 21 (headless API), rt 160, talk 18.
- Shots: engine/shots/{desktop-figure-front-inhale,desktop-figure-front-exhale,desktop-figure-side-inhale,phone-figure-both-phone,desktop-figure-reduced-motion,
  phone-trace-start-card,phone-trace-find-a-sound,phone-trace-inward,tv-trace-fading,phone-trace-flat-line-rest,phone-trace-end-card,phone-trace-reduced-motion,tv-trace-tv-inward}.jpg
  (node engine/tools/shoot-play.mjs; needs sh shot-setup.sh).
- Known / next: headless software rendering runs the play at ~10 fps (no GPU here; real-device fps unmeasured); the voice (Everly) was picked
  from catalog descriptions without a human listen, pending the owner's approval; Canvas2D player.js does not draw wave/figure yet (plays use play.js);
  other VBT plays (Expand the Room, Catch the Gap, Dissolve the Edges, Merge the Sides, Tap the Centre) not built; preview Worker ~2.66 MB gzip
  (Free cap 3 MB: the next renders need R2/KV or dropping the ajahn-lee preview mp4).

## CURRENT STATE 2026-10-25 03:30 +07 (Tidy + wiring audit round; history in MERGE-LOG.md)
- Live: **wiser-web 816876fb**, **wiser-mcp 222ded79**, **satsang-chat c4914eeb**. Repo prx0r/satsang **43b476d** (tidy commit).
- **One work tree**: `work/wiser` IS the git work tree of prx0r/satsang (no more sync.py copy step). `work/satsang-chat/repo` is a
  legacy clone that release.sh fast-forwards after each push.
- **Release**: `sh tools/release/release.sh "<msg>"` (git add -A minus engine/, secret-scan.sh, commit, pull --rebase, push, mirror ff).
- **Deploy phases**: `sh app/deploy.sh build | guard | ship` (site, run as separate calls in the 120 s sandbox), `site` (all three),
  `api`, `mcp`, `chat`. Data checks: `python3 tools/check/check-data.py`; route crawl `tools/check/crawl-run.sh` (phone).
- Archive: Funnier-era tally/voting + old shot scripts under `archive/`; pycache and site/clips.json untracked. README rewritten,
  favicon + page-title fixes.

## PREVIOUS STATE 2026-10-25 01:20 +07 (Series restructure round)
- Live: **wiser-web c4496e70-c826**, **wiser-mcp b7153db4-faed**, **satsang-chat a9f0f529-23f0**. Repo prx0r/satsang **deac9f8**.
- **Nav** (src index.html): Watch · Topics · Teachers · Places · Practise (#collections) · Ask (#ask, static `.ask-navlink`, ask.js no longer
  injects it). For you, Your model, Charts and All series moved to the account menu ("Go to"). 6 items fit 390 px (last edge 374 px,
  no sideways scroll); the old "Build a path off-screen" issue is gone. Series pages light the Topics tab.
- **Series** = user-facing name for collection kind `mini-course` (ids unchanged). Routes `#series` (all, grouped by topic) and
  `#series/<id>[/<n>]`; `#courses` and `#course/<id>[/<n>]` redirect (location.replace); `#collection/<mini-course>` -> `#series/`.
  Topic pages lead with "Series on <topic>" (featured first) + the series' full retreat, then Gold, then the rest; Topics list has a
  Series strip grouped by topic. Series page (src/minicourse.js): back to its topic, caution once ("Before you begin"), session header
  "Session n of N" + one-line purpose (`unit.purpose`), step types only Listen / Practise / Read / Go deeper, a practice's caution shows
  the first time only, short `reminder` only on `remind` sessions or sessions with an orientation-only practice, "The sessions" list ends
  in "Go deeper: full retreat", "More to explore" (was "Series to go further"), "Places to go deeper".
- **Data**: `tools/tag-series.py` tags every series talk with the series topic (+root) in clips.json / clips.site.json / site/clips.json
  (17 talks fixed; `tagAll` opt-in for a series' other topics); runs at the end of build-clips.py, never writes seed.sql.
  mini_courses_src.py: `unit(..., purpose=, remind=)`, series `reminder`, `retreat` (resource id, checked: free, kind retreat, whole
  `dharmaseed.org/retreats/<n>/` url) and `R()` items; flagship got purposes, a merged caution, IMS Barre as a place.
  `site/data/wisegraph/resources-series-retreats.json`: **dharmaseed-pa-auk-ims-2011** = https://dharmaseed.org/retreats/1230/ (Pa-Auk
  Sayadaw + Sayadaw U Jagara, IMS Forest Refuge Jul-Oct 2011, 37 talks; linked whole, CC BY-NC-ND, credited). Gold unchanged 246/1,198/8,542.
- **MCP**: list_series / get_series (aliases of list_courses / get_course, which stay); list returns {series, courses}; featured first;
  get_series carries session purposes + retreat; collection url `#series/<id>`; get_topic adds `series`. 26 tools. test-client 35/35 live.
- **Chat**: deeper items link `#series/<id>` ("A Satsang series inside <topic>: ..."), prose names the series; ask.js label "Series";
  test adds a series check (prompt 1). 15/15 local + live.
- **Formula**: specs/SERIES-FORMULA.md (full recipe + commands) and specs/SERIES-FORMULA-SKILL.md (3.1k chars, for a custom skill).
- Shots: shots-series/ (local, phone 390 + desktop) and shots-series/live/. Practice-engine tests 812/812; schema 13,138 failing none;
  guards 0 found (243 / 9,665). Spend US$0.

## PREVIOUS STATE 2026-10-24 23:10 +07 (past-lives flagship round on top of gold tier + mini-courses)
- Live: **wiser-web 582fb346-a7d6**, **wiser-mcp e89ee319-aedd**, **satsang-chat c253b531-7260** (chat.tantrafiles.xyz). Repo prx0r/satsang **9085346**.
- Past-lives round (ext-47, owner's research seed): flagship mini-course **how-to-discern-past-lives** (featured + flagship, 6 sessions, 15 talks,
  orientationOnly; s1 adds practice recollection-of-past-lives-orientation, s3 practice the-five-remembrances; cover ypKa1J7KUow). 39 clips added
  (Baumer VBT 11, Beth Upton 9, Sugatavamsa 11, Sayalay Dipankara 2, Pa-Auk Sayadaw 1, Analayo 1, R. Ramanand 4; all embed-checked). Gold now
  **246 gold / 1,198 strong / 8,542 standard**; 13 mini-courses. 15 resources in `app/site/data/wisegraph/resources-past-lives.json` (4 Paid marked
  with price). Chat: catalog carries `feat:1` for featured courses (chat/tools/build-catalog.mjs) and the curator boosts them x1.6
  (chat/worker/src/curator.mjs); "how do I see past lives" returns this course. Skipped: Pa-Auk "Dependent Origination: Previous Lives"
  (unofficial re-upload only), Baumer VBT "Text Recitation" and "Mangala (Recitation)" (recitations). Schema 13,138 failing none; guards 0 found;
  mcp test-client 35/35 live; chat test 15/15 local + live.
- Previous gold-round deploy: wiser-web 90362a66, wiser-mcp 291d46ba (24 tools: + list_courses, get_course). Domain ACTIVE='legacy'. This deploy also ships the
  practice-engine agent's c6b435b ("Practise with the body" overlay, course tree site/data/wisegraph/courses.json, breathplayer.js) and the chat agent's
  b72e813 (#ask "Build a path" panel). Phase scripts in work/wiser-closeout/ were regenerated from the new deploy.sh (breathplayer cache-busting line).
- Known: on a 390 px phone the chat agent's nav link "Build a path" (9th item, injected by src/ask.js) sits past the edge of the scrollable nav; owner of ask.js to decide.
- **Gold scoring** `app/tools/build-gold.py [internal transcript dirs...]` -> `app/wisegraph/gold.json` (tiers + scores, repo) + `site/data/wisegraph/gold.json`
  (public slim: gold why-lines + strong ids) + `wisegraph/gold-candidates.json` (next judging round) + `wisegraph/gold-signals.json` (internal breakdown, NOT in repo).
  Signals: A teacher standing (Wikidata, lineage edges, places, depth, works), E views (percentile in own catalogue + global + per year; YouTube watch
  pages are bot-walled here, so no likes), C crowd (/stats/clips, still empty), T internal transcript numbers (lexical richness, filler, substance;
  numbers only), P topic centrality, F form (English, 6-75 min, specific title). Red-flag subjects x0.6 and never gold.
  Tiers: **226 gold / 1,193 strong / 8,528 standard**. Gold = editorially read (no paid LLM: the owner switched OpenRouter off; spend US$0) in
  `app/tools/gold_judgements_src.py` -> `wisegraph/gold-judgements.json` (each gold: topics + one-line why in Satsang's words; 46 read-and-passed).
  Next round: read `gold-candidates.json` entries with judged=false, add to gold_judgements_src.py, re-run build-gold.py -> build-catalog.py.
- **Mini-courses** (collection kind `mini-course`): `app/tools/mini_courses_src.py` writes 12 into `wisegraph/collections.json` and checks every ref
  (talks must be gold, practices exist, readings pass licence_gate, places exist, 3-6 talks / 1-3 practices). Then build-collections.py. New practice
  `recollection-of-past-lives-orientation` (needsTeacher; MN 4 + Visuddhimagga XIII via ATI) in `sources/ext-46-gold-courses/practices.json`.
  Courses: how-buddhist-rebirth-works, remembering-past-lives (orientation), kashmir-shaivism-first-steps, advaita-self-enquiry, anapanasati-breath,
  metta-loving-kindness, contemplating-death, neoplatonic-contemplation, hermetic-orientation (Middle Pillar orientation only), christian-contemplative-prayer,
  sufi-remembrance, zen-just-sitting. No Dharma Seed passages; Hareesh 2018 PDF never linked (VBT reading = tantra112.app link).
- **Site**: gold badge on tiles (`.gmark`), Gold rails leading topic hubs and on teacher pages (`goldRail` in src/wise.js), ranker quality +0.12 gold /
  +0.05 strong and +0.08 gold in the Topic flash (src/rank-topics.js); nav tab **Courses** -> `#courses`, player `#course/<id>[/<step>]` (src/minicourse.js:
  inline privacy-enhanced YouTube, practice links back with ?from=&unit=, progress = journeys store / POST /journeys/:id/progress); `#collection/<mini-course>`
  redirects to `#course/`. Phone nav fits 8 tabs at 390 px (12 px labels).
- **Open data / MCP**: clip.quality {tier, why, goldTopics} (gold/strong only; absent = standard), collection kind mini-course (+ level, caution,
  orientationOnly, minutes, deeper[], item title/url) in specs/schema (gen.py); slim MCP bundle keeps every gold + collection talk; get_topic adds gold + courses.
  Schema 13,091 records failing none.
- **Chat catalogue**: `app/tools/build-catalog.py` -> `app/wisegraph/catalog-for-chat.json` (+ site/data/wisegraph/catalog.json): topics (gold + strong ids,
  takes, questions), 226 gold talks with why-lines, 12 courses with resolved steps + cautions + deeper places, 85 practices with cautions, 558 places with retreats.
- Pipeline order after data changes: build-collections.py -> build-gold.py -> gold_judgements_src.py (if edited) -> mini_courses_src.py -> build-collections.py
  -> build-gold.py -> build-catalog.py -> deploy (phases A/B/C, then `sh deploy.sh mcp`, then mcp/test-client.mjs).

