# Satsang topic Series (skill)

Use when asked to build a Series (ex "mini-course") for a topic on tantrafiles.xyz, e.g. consciousness transference. Full recipe with
exact commands: work/wiser/specs/SERIES-FORMULA.md (read it first; the past-lives series is the worked example).

($TDIR = the internal transcript folder from app/package.json "data".)
Rules: spend US$0 (no paid APIs/LLMs) · never touch DNS, switch-domain.sh or D1 seeds · dark design only · Dharma Seed = CC BY-NC-ND:
whole talks/retreats only, linked + credited, never cut or transcribed · no transcript text public · skip held teachers (Sucitto,
Kornfield, Ramdev) · a loop >2x = stop and report.

Steps
1. Seed intake: sources/ext-<n>-<topic>/REPORT.md; pick the topic id it lives in; name the one question (= title).
2. Sources: talks only from official channels/playlists; oEmbed-check every id; skip re-uploads/recitations (list them). build.py ->
   candidates.json, people/edges additions, site/data/wisegraph/resources-<topic>.json (paid marked with price).
   Then merge-sources.py + build-clips.py ../raw "$TDIR".
3. People/lineage with a citable basis only.
4. Gold: build-gold.py "$TDIR" -> read gold-candidates.json -> add why-lines (own words) to gold_judgements_src.py.
   Series talks must be gold.
5. Session arc, 4-8 sessions, 1-3 talks + a practice each, each with purpose= and listenFor=:
   claims -> mechanism -> nuance -> comparative tradition -> evidence/critique -> liberation/integration -> Go deeper: full retreat.
6. Practices: no retention ever; teacher/empowerment practices = needsTeacher, orientation only (no steps); safe foundation first.
   Series: orientationOnly, caution (shown once in hero), short reminder (remind=True sessions only).
7. Readings via licence_gate (T()/U()); listen/visit links must be checked free resources.
8. Dharma Seed: search dharmaseed.org talks/retreats for a whole retreat in the series' own method; verify the talk list; add to
   resources-series-retreats.json (kind retreat, free, by, centre, year, talks, licence, note); series 'retreat': id + R(id) last item.
   Nothing exact -> skip and report candidates.
9. Places: D(place id) only for places in wisegraph/places.json.
10. Author in app/tools/mini_courses_src.py; one featured series per topic.
11. Build (in app/): mini_courses_src.py (no CHECK lines) -> tag-series.py -> build-collections.py -> build-courses.py ->
    build-gold.py "$TDIR" (tiers stable) -> build-catalog.py -> node tools/test-practice-engine.mjs.
12. Verify: tools/shots/shot-series.mjs (edit hashes) phone 390 + desktop, look at PNGs, no sideways scroll; mcp build + validate.py + test.mjs.
13. Deploy (in app/, separate calls): sh deploy.sh build; sh deploy.sh guard; sh deploy.sh ship (wiser-web); sh deploy.sh mcp +
    node ../mcp/test-client.mjs live; sh deploy.sh chat (catalog + 15/15 local + deploy), then 15/15 --endpoint live.
14. Release: sh tools/release/release.sh "<msg>" (from work/wiser); update BRIEF CURRENT STATE + MERGE-LOG (versions, sha, skips), release again.

Report: where the series sits (topic), sessions, retreat URL or candidates, live versions, commit sha, screenshot paths, skips.
