# SERIES-FORMULA: how to build a topic Series (repeatable recipe)

First used for **How to discern past lives** (`how-to-discern-past-lives`, topic `rebirth`, 2026-10-24/25). Use it for the next topics
(e.g. consciousness transference / phowa, the bardo, dream yoga, self-enquiry). A **Series** is the user-facing name for a collection of
kind `mini-course` (ids, the `#course/` redirect, MCP `list_courses`/`get_course` stay as aliases). A series always lives **inside its
topic**: the topic page shows it first, every talk in it is tagged with the topic, and it ends in a "Go deeper: full retreat" step.

Hard rules, every series: spend US$0 (no paid APIs, no LLM calls; OpenRouter stays off) · never touch DNS, `tools/switch-domain.sh` or
D1 seeds (`wisegraph/seed.sql`) · keep the dark design · Dharma Seed is CC BY-NC-ND (whole talks/retreats only, linked and credited,
never cut, trimmed or transcribed) · no transcript text anywhere public (transcript *links* to the teacher's/volunteer's own page are
fine, labelled) · held teachers (BRIEF "main teachers held": Ajahn Sucitto, Jack Kornfield, Swami Ramdev) are skipped · if a step
loops more than twice, stop and report.

All paths below are relative to `work/wiser/`. `$TDIR` = the internal transcript folder build-clips.py reads (see app/package.json "data"; internal, never published). Code is in `app/`, data builds in `app/tools/`, the repo clone is
`work/satsang-chat/repo` (prx0r/satsang), deploy phases are `work/wiser-closeout/phase{A,B,C}.sh`.

---

## 0. Seed intake
- Write the owner's seed (questions they asked, teachers/links they gave, the angle) into `sources/ext-<n>-<topic>/REPORT.md` (start
  it now; `merge-sources.py` and `build-clips.py` skip a group until REPORT.md exists).
- Decide the **topic id** it lives in (`app/schema/topics.json` tree; e.g. `rebirth`, `death/bardo`). Only add a subtopic to the tree if
  the series genuinely needs one and the topic has 6+ talks; otherwise use the hub's existing question (hubs.json `questions`).
- Name the **one question** the series answers in plain words ("How to discern past lives"). That becomes the title.

## 1. Verify official, embeddable sources
- Talks come only from the teacher's or their institution's **own** channel/playlist (or a credited upload the institution endorses).
  Unofficial re-uploads are skipped and listed in REPORT.md.
- For each YouTube id: read it off the official channel/playlist page, then check oEmbed
  (`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<id>&format=json`, 200 = embeddable) and the embed page.
  Recitations, chanting-only and promos are not talks.
- Write `sources/ext-<n>-<topic>/build.py` (copy `sources/ext-47-past-lives/build.py`): it emits `candidates.json` (clips),
  `people-additions.json`, `edges-additions.json`, and `app/site/data/wisegraph/resources-<topic>.json` (link-only resources, each
  `{id,title,url,kind,free,price?,licence,traditions,people,note,source_url,checked}`; paid ones carry `free:false` + `price`).
- Then: `cd app && python3 tools/merge-sources.py && python3 tools/build-clips.py ../raw "$TDIR"`
  (build-clips ends by running `tools/tag-series.py`; it writes `clips.json`, `clips.site.json`, `site/clips.json`).

## 2. People and lineage
- Every speaker exists in `wisegraph/people.json` (via `people-additions.json`): name, tradition, Wikidata QID when one exists,
  official site. Lineage edges (`studied_with`, `lineage_of`, `teacher_at`) only with a citable basis (`edges-additions.json`).
- Living teachers' claims go through the review rules (`stage-extensions.py` gate); never invent a lineage.

## 3. Gold judging (editorial, no LLM)
- `python3 tools/build-gold.py "$TDIR"` -> `wisegraph/gold-candidates.json` (per-topic candidates, judged=false).
- Read each candidate you might use (title, teacher, standing, length, reach, fit). Add the ones you would send a friend to
  `tools/gold_judgements_src.py` with topics + a one-line why in Satsang's own words (no transcript quotes). Mark passes too.
- Re-run `build-gold.py "$TDIR"`. **Series talks must be gold** (mini_courses_src.py refuses non-gold).

## 4. Session arc (template)
4-8 sessions (flagship) or 3-6 talks (short series). Each session = 1-3 talks (+1 optional short), at least one practice, a
**one-line purpose** (`purpose=`), and a "What to listen for" (`listenFor=`). Default arc:
1. **Claims**: what the tradition actually claims, in its own primary voice; the safe foundation practice starts here.
2. **Mechanism**: how it is said to work (the technical account: e.g. rebirth-linking, transference of consciousness at death).
3. **Nuance**: the subtleties that stop misreadings (e.g. futures are possibilities, not fates; which kamma ripens).
4. **Comparative tradition**: one other tradition telling the same story differently (one session, not a survey).
5. **Evidence / critique**: a careful scholar or critic; hold both without forcing a verdict.
6. **Liberation / integration**: where the traditions end (freedom now, ordinary life), not collecting experiences.
Then the **Go deeper: full retreat** step (section 8). Set `remind=True` on sessions where the orientation reminder matters.

## 5. Practices and safety
- Practices live in `sources/ext-<n>/practices.json` or the existing set (`site/data/wisegraph/collections.json` `practices`).
  Each has plain steps, a source link, and `cautions` (first caution is the one shown).
- **No retention** ever (no breath holds, kumbhaka, forceful breathing); the breath engine never prescribes holds.
- Anything traditionally given by a teacher/empowerment (phowa, kundalini, past-life recollection, Middle Pillar, koan work) is
  `needsTeacher: true` and **orientation only**: what it is, where it is taught, why it is learned from a teacher. No steps.
- Every series with orientation material sets `orientationOnly: True`, a `caution` (shown once, in the hero, under "Before you
  begin": orientation only, not independently verified, no results promised, stop if distressing) and a short `reminder` line
  (shown only on `remind` sessions or sessions holding an orientation-only practice). A practice's caution shows the first time.
- Safe foundation first (mindfulness of breathing, five remembrances, a VBT gap-between-breaths dhāraṇā without holds).

## 6. Readings, licence-checked
- `T('<text-id>')` for texts already in `mcp/data/wiser.json` (resolved + licence-gated at authoring time), or `U(url, title)` for a
  url that passes `tools/licence_gate.py` (public domain, publisher-free, gift-of-dhamma, CC). Never the Hareesh 2018 PDF.
- Listen/visit links (`L(...)`, `V(...)`) must be a checked free resource in `site/data/wisegraph/resources*.json`.
- "More to explore" (`further: [...resource ids]`): link-only; paid ones say Paid + price. Satsang sells nothing.

## 7. Author the series
In `app/tools/mini_courses_src.py` (helpers `W` watch, `P` practise, `T`/`U` read, `L` listen, `V` visit, `R` retreat, `TR`
transcript link, `OPT` optional, `D` place, `unit(n, title, purpose=, remind=, items=[...], listenFor=)`):
```python
C.insert(0, {'id': '<slug>', 'title': '<the one question>', 'featured': True, 'flagship': True, 'cover': '<yt id>',
  'topic': '<topic id>', 'topics': [...], 'tradition': '<family>', 'school': '<school>', 'traditions': [...],
  'level': 'first-steps|steady|deep', 'minutes': <total>, 'orientationOnly': True,
  'caution': '...', 'reminder': 'Reminder: orientation only. ...', 'intro': '...',
  'units': [unit(1, '...', purpose='...', remind=True, items=[W(...), P(...), T(...)], listenFor='...'), ...],
  'retreat': '<dharmaseed resource id>', 'further': [...], 'deeper': [D('<place id>', '...'), ...]})
```
Only one series per topic should be `featured` (the topic page and chat lead with it; chat boosts it x1.6).

## 8. Dharma Seed retreat step ("Go deeper: full retreat")
- Search `https://dharmaseed.org/talks/?page_items=100&search=<term>&sort=-rec_date` and `https://dharmaseed.org/retreats/` (centre
  pages such as `bcbs.dharmaseed.org/retreats`). Prefer a **whole retreat** taught in the series' own method/lineage (past lives:
  retreat 1230, Pa-Auk Sayadaw + Sayadaw U Jagara, IMS Forest Refuge 2011, 37 talks). Open the retreat page and verify the talk list.
  Skip held teachers. If nothing is close, skip the step and list candidates in REPORT.md / MERGE-LOG.
- Add it to `app/site/data/wisegraph/resources-series-retreats.json`: `{id, title, url: "https://dharmaseed.org/retreats/<n>/",
  kind: "retreat", free: true, by, centre, year, talks, licence: "Dharma Seed, CC BY-NC-ND 4.0: complete talks, linked unchanged and
  credited", licenceUrl, traditions, people, topics, note, source_url, checked}`.
- In the series: `'retreat': '<id>'` (shown as the final step, a section after the sessions, and on the topic page) and
  `R('<id>', '<note>')` as the last item of the last session. `mini_courses_src.py` checks: resource exists, free, kind retreat,
  url is a whole `dharmaseed.org/retreats/<n>/` page. Never embed a cut or a single trimmed passage.

## 9. Places
- `deeper: [D('<place id>', note)]` only for places already in `wisegraph/places.json` (the home of the method, a centre in the line,
  the place the retreat was recorded). Add a place through the places pipeline first if it is missing.

## 10. Topic tagging (data, not just UI)
- `python3 tools/tag-series.py`: every series talk gets the series `topic` (+ root) in `clips.json`, `clips.site.json`,
  `site/clips.json` (`tags.topics` gets `[topic, 1.0, 'series']`). Set `'tagAll': True` on a series to tag its other `topics` too.
  It never writes `wisegraph/seed.sql`. It also runs at the end of `build-clips.py`, so a rebuild keeps the tags.

## 11. Build order, chat catalog, featured flag
```sh
cd work/wiser/app
python3 tools/mini_courses_src.py          # writes series into wisegraph/collections.json; prints CHECK lines on any problem (must be none)
python3 tools/tag-series.py                # series talks -> topic tags
python3 tools/build-collections.py         # -> site/data/wisegraph/collections.json
python3 tools/build-courses.py             # course tree (practice "where this sits"); series href #series/<id>
python3 tools/build-gold.py "$TDIR"   # tiers must be unchanged unless you judged new gold
python3 tools/build-catalog.py             # -> wisegraph/catalog-for-chat.json (series: label 'series', featured, reminder, retreat, purposes)
node tools/test-practice-engine.mjs        # data + engine checks all passed
```

## 12. Tests, screenshots, deploy, commit
```sh
pip install -q jsonschema                  # once per box (phase A's schema check)
cd work/wiser && sh tools/shots/shot-setup.sh          # once per box: /tmp/chromium + puppeteer-core
node tools/shots/shot-series.mjs shots/<topic> home topics topic series s1 s3 s6 index oldlink menu   # edit ALL hashes for the new series; look at the PNGs (390 px: no sideways scroll)
cd mcp && node build-data.mjs && node build-dump.mjs && node slim-data.mjs && node build-discovery.mjs && python3 ../specs/schema/validate.py | tail -1 && node test.mjs | tail -1
cd ../app && sh ../../wiser-closeout/phaseA.sh && sh ../../wiser-closeout/phaseB.sh && sh ../../wiser-closeout/phaseC.sh   # wiser-web
sh deploy.sh mcp && (cd ../mcp && node test-client.mjs | tail -1)                            # wiser-mcp, live test
cd ../.. && python3 wiser-closeout/sync.py wiser satsang-chat/repo                          # copies changed tracked files; copy NEW files by hand
cd satsang-chat/repo && node chat/tools/build-catalog.mjs && node chat/test/test-curator.mjs  # 15/15 local
cd chat/worker && ../../../../wiser/app/api/node_modules/.bin/wrangler deploy && cd ../.. && node chat/test/test-curator.mjs --endpoint https://chat.tantrafiles.xyz   # 15/15 live
git add -A <paths> && sh ../../wiser-closeout/secret-scan.sh . && git commit -m "..." && git pull --rebase && git push
```
Then update `BRIEF.md` CURRENT STATE and `MERGE-LOG.md` (live version ids, repo sha, counts, what was skipped and why).

## Checklist (copy into REPORT.md)
- [ ] seed + topic id + the one question · [ ] official ids, oEmbed-checked, skips listed · [ ] people/edges with basis
- [ ] series talks all gold (why-lines in Satsang's words) · [ ] 4-8 sessions, purpose + listenFor each, practice each
- [ ] no retention; teacher-required = orientation only; caution once + short reminder · [ ] readings licence-gated; paid marked
- [ ] Dharma Seed whole retreat (or candidates reported) · [ ] places exist · [ ] tag-series run · [ ] featured flag (one per topic)
- [ ] mini_courses_src CHECK-free · gold tiers stable · practice-engine tests · schema failing none · guards 0 found
- [ ] mcp test + test-client live · chat 15/15 local + live · screenshots looked at · commit + push · BRIEF/MERGE-LOG
