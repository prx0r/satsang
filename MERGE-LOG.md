# MERGE-LOG: prx0r/satsang-extensions -> Satsang (2026-10-20/21)

Source: prx0r/satsang-extensions @ 20789d4 (41 packs; 11 is the validation runtime). Method: each pack is gated with
`11-site-runtime/check_pack.py` (pre-merge, against this tree), staged by `app/tools/stage-extensions.py` into a normal
sourcing group `sources/ext-<pack>[-<group>]/` (dedupe, review routing, provenance), merged by `app/tools/merge-sources.py`,
built, validated, deployed, verified live, keeper run, committed. Pack docs (README/REPORT/MERGE-NOTES, scripts, SQL drafts,
spec JSON) are archived under `specs/extensions/<pack>/`. Held claims go to `app/wisegraph/review-queue.json` (never live).

Review rules applied at staging: living:true claims are held (queue); edges below medium are held; medium `teacher_of` from a
pack shows as "studied with"; works flagged check/verify are held; place `founded` years without a cited source are held;
contact values sourced off the organisation's own domain are dropped (queue); URLs the pack's own gate could not verify are
re-curled and dropped if still failing. Every staged record carries source_url, verified_on, confidence.

## Infrastructure (before batch 1)
- `app/tools/build-clips.py`: virtual-clip titles are now deterministic (full sort keys, sorted sets, part numbering by
  (start, id)); verified identical output under PYTHONHASHSEED=1 and 777. 44 machine titles changed once vs the old live file
  (e.g. "Mantra and ritual" -> "Ritual and mantra"); ids unchanged. One collection select widened to follow a retitled clip.
- `app/tools/merge-sources.py`: staged groups (places-ext, place-links, main-teachers, works-attach, years-fix, contacts,
  texts -> `site/data/wisegraph/resources-ext.json`), deep-india-study places/contacts/resources, provenance on new people,
  review-queue output. Idempotent (re-run = identical files).
- `app/tools/build-wise.py`: curated contacts layered over crawled ones; places keep main_teacher/teacher_model/status.
- `app/tools/build-collections.py`: honours a practice's own `needsTeacher` and contraindications; reads ext practices and
  collections; FOLD rule (pack 03's rebirth units fold into `rebirth-across-traditions`, no twin).
- Worker size: large data files (clips.json, teachers.json, wise/places/profiles/graph/boards/hubs/collections.json) are served
  from KV (binding DATA, content-hashed keys `site/<hash>/<path>`, edge-cached, ETag/304) instead of the inline bundle:
  `app/web-worker/kv-paths.json`, `embed.mjs`, `worker.js fromKV()`. Site Worker gzip 1.57 MB -> 0.51 MB.
- specs/schema: place gains optional mainTeacher, teacherModel, mainTeacherConfidence, status (gen.py, additive).

## Batch 1: 01, 02, 08, 09, 03, 04, 05 (deployed wiser-web 27d5db88, wiser-mcp dd42e206)
| pack | result | counts / notes |
|---|---|---|
| 01-tradition-nodes | merged | 5 tradition nodes (chishti, qadiri, lurianic, franciscan-contemplative, learned-magic), 12 people, 10 edges (1 medium teacher_of Francis->Clare shown as studied with + queued) |
| 02-scholars-academic | merged (partial) | 4 academic edges, 12 works attached; 7 works flagged check by the pack held in queue; crosswalk-extension archived only (every translation URL unverified) |
| 08-places-networks | merged | 2 new places (santacittarama URL-less: WAF), 8 existing places gap-filled (2 deduped: vedanta-society-new-york->vedanta-ny, tushita-dharamkot->tushita-dharamsala), 3 sister links, teacher ties; 10 unsourced founded years held |
| 09-texts-freebooks | merged | 7 free texts -> resources-ext.json (MCP get_resources / open data) |
| 03-collections | merged | rebirth units folded into rebirth-across-traditions (5 units) |
| 04-practice-visuals | merged | Middle Pillar outline practice (needsTeacher, cautions), middle-pillar-week collection (7 units); visual spec at app/wisegraph/visuals/ (no consumer; engine/ untouched: grammar v1 has no Middle Pillar loci) |
| 05-curations-seeds | skipped (archived) | needs ROADMAP-14 /c/ endpoints; migration 0020_curations.sql NOT applied (no consumer; numbering is the owner's call); seeds archived in specs/extensions |

Post-merge gates: ids-unique "collisions" are the merged records themselves (expected); no other gate fails.
Live: 18 key/new pages 200; KV-served JSON 200, ETag 304 works; MCP test.mjs all passed, test-client all passed live.
Screenshots: shots-merge/b1/ (desktop + phone: topic, place, teacher, mun) — dark design unchanged.
Keeper: 0 error; 2 linkrot warns on pre-existing h-net.org edge sources (fetch failed, not from this merge); info 165 (was 164).

## Batch 2: 06, 07, 10, 12, 13, 14, 15, 16 (deployed wiser-web cb5c733d, wiser-mcp 6e9c01dd)
| pack | result | counts / notes |
|---|---|---|
| 06-gather-phase1 | skipped (archived) | 5 MCP tools need D1 sessions/RSVPs (write paths; the MCP is read-only); migration 0021_sessions.sql NOT applied |
| 07-mcp-atlas-tools | skipped (archived) | find_path is covered by the live get_lineage_path (lineage-class filter); get_concept_thread needs concept ingestion + /concept routes (ROADMAP-7) |
| 10-golden-path | merged | 3 teaches_at ties (2 medium -> re-check queue via teacher ties), 6 practice->teacher attributions (2 check:true held), NEW MCP tool `guide_me` |
| 12-minimal-entries | merged (partial) | 6 main-teacher links (3 medium queued); scoreboard/backlog/minimal_entry.py archived (builder outputs, not data) |
| 13-atlas-population | skipped (archived) | builder outputs only (INTEGRATION §5: do not merge); populate_places.py archived |
| 14-lineage-clusters | partial | 13 living:true proposals -> review queue (mark-dyczkowski flagged CONTRADICTED: died 2025-02-02); cluster.py + inception notes archived |
| 15-niche-hermitages | merged | 7 new places + 2 gap-filled (hillside-hermitage-lk -> hillside-hermitage), 4 people (living held), 6 contact rows (1 off-domain email dropped), 2 Path Press texts, 1 nissarana edge source re-checked |
| 16-usa-places | merged | 19 new US places + 17 gap-filled (7 deduped: sfzc, upaya, deer-park, vedanta-socal, siddha-ashram, cac, pendle-hill), 2 people (living held), 9 contacts (1 off-domain dropped), 12 main teachers (medium queued), WAF edge sources re-curled |

Places 795 -> 821 (773 mapped); people 577 -> 583; main teachers on 15 places, teacher_model on 3 more. Review queue 53.
Gates post-merge: only ids-unique self-collisions. Live: new place/person pages 200, guide_me live via MCP, test-client all passed.
Screenshots: shots-merge/b2/ (places map + pick, desktop + phone) — design unchanged.
Keeper: 0 error; linkrot warns 12 = pre-existing UK/AU/NZ sites reached by the rotating linkrot cursor this run (TLS errors / no
connection; curl from this sandbox returns 000 for them too), none from merged records; provenance info 168.

## Batch 3: 17, 18, 19, 20, 21, 22, 23 (deployed wiser-web 4a6724d2, wiser-mcp fd3674ab; closed out 2026-10-20 23:40 +07)
| pack | result | counts / notes |
|---|---|---|
| 17-south-america | merged | 4 nodes (shamanic, santo-daime, udv, shipibo-curanderismo), 2 founders, 8 places, 2 contact rows, 2 edges; safety/legal posture stated in descriptions (court-tested footing cited, not vouched) |
| 18-global-faiths | merged | 6 nodes (sikh, jain, taoist, bahai, african-diaspora, nac), 8 figures, 9 places (wudang-zixiao, golden-temple, palitana...), 6 contacts (1 off-domain dropped + queued), 4 edges |
| 19-red-flags | partial | 3 public records (deceased subject + institutional/primary source) -> app/wisegraph/redflags.json; 6 records HELD internal (work/wiser/internal/19-red-flags, review-internal.json; never public): muktananda-1994, baker-sfzc-1983, trungpa-history, nkt-shugden-dispute, desai-kripalu-1994, shambhala-sakyong-2018; 4 people (2 living held, maezumi-taizan deduped -> taizan-maezumi) |
| 20-tibetan-lineages | merged | 28 masters, 39 edges (7 medium teacher_of -> studied with + queued), 3 nodes (drukpa, drikung, shangpa), 1 years fix; tulku successions unwired (tulku_of not in schema) |
| 21-roots-anthropology | merged (partial) | 9 people, 7 edges (4 medium queued), madhyamaka node, 5 works attached; 4 works flagged check held; 1 living claim held |
| 22-tantra-web | merged | 9 people, 9 edges (3 medium queued) |
| 23-vedic-roots | merged | vedic node, 19 people (Uddalaka->Shvetaketu wired; Gargi/Yama unwired by rule), 4 edges (2 medium queued); 6 text records stay linkless (archived in specs/extensions) |

Graph after: people 661, places 837, edges 477, tradition nodes 178. Review queue 77.
Gates post-merge (check_pack vs merged tree): only ids-unique self-collisions (the merged records themselves).
Screenshots: shots-merge/b3/ (live, desktop + phone: place ceu-do-mapia, tradition jain, person longchenpa, person uddalaka;
`node shot-merge.mjs <dir> name=/path ...`, fetches through node because the sandbox proxy needs auth) — dark design unchanged,
all 200, body rgb(10,13,20).
Keeper (daily, 23:34): 0 error; 34 linkrot warns, all pre-existing UK/IN/AU/NZ sites (TLS/DNS from this sandbox), none from
merged records; integrity info 6 (pre-existing co-supervisor pairs + one deep-tantra death-year conflict); provenance info 188.
404 fix: /place/wudang and /person/uddalaka-aruni were never ids (the pack uses wudang-zixiao / uddalaka; nothing in the data or
packs links the short forms) — added as 301 aliases anyway (source_maps KEEPER_ALIAS_REDIRECTS), and apply-keeper-fixes.py now
also writes 301s for every staging dedupe in ext-idmap.json (e.g. /place/pendle-hill -> /place/pendle-hill-pa, which 404'd).
Deployed with batch 4.

## Batch 4: 24, 25, 26, 27, 28, 29, 30, 31 (deployed wiser-web a8e78e86, wiser-mcp feb8036b -> bcaa2652; 2026-10-21 ~00:20 +07)
Merge run: `python3 app/tools/merge-sources.py /tmp/srcsel` (symlink folder of the merged groups; deep-india-study stays out until
step 5 — a plain run over sources/ pulls it in; merge-sources accumulates people from wisegraph/people.json, so a wrong run must be
undone by restoring wisegraph/*.json from the last commit, as done once here).
| pack | result | counts / notes |
|---|---|---|
| 24-abhinava-rights | merged | 2 crown-text records (kind text, linkless by rule: KSTS PD but unscanned, translations copyrighted), 2 author edges, 2 works; RIGHTS.md archived (specs/extensions/24-abhinava-rights/) and applied below |
| 25-mystics-west | merged | 14 people (Rumi circle, Qunawi, Plethon->Bessarion, Pico, Augustine, Eriugena, Cusa, Parmenides, Empedocles), 11 edges, 3 works (2 Corbin works flagged check held) |
| 26-asia-europe | merged | 16 places (8 new, 8 gap-filled; bodh-gaya -> mahabodhi dedupe), Hsing Yun, 4 founder ties, 8 contact rows, 1 high main teacher (Tsuglagkhang -> Dalai Lama) |
| 27-teaching-hotspots | merged | 6 places (5 new), 3 people (2 living held), 6 contacts (1 off-domain dropped), 3 main-teacher rows (patanjali-yogpeeth medium HELD) |
| 28-licence-registry | merged | registry -> app/wisegraph/licence-registry.json; 3 licence-carrying Dhamma books; licence_tracker.py archived. **Licence gate** in merge-sources.py: a text is linked only when the registry evidences a linkable licence (book entry wins, else domain default; verify-flagged defaults don't count; default copyrighted). 11 texts shown (licenceClass + no-sale terms in MCP get_resources), 4 held citation-only + queued: accesstoinsight-library (domain verify), suttacentral-early-texts, bps-pariyatti, path-press-shop (no registry evidence) |
| 29-thai-depth | merged | 4 places (2 new; suan-mokkh -> wat-suan-mokkh), 3 people (2 living held), 3 gift-licence books (shown), 1 edge, 2 place links |
| 30-second-wave | merged | 11 people (Suhrawardi, Ghazali, Hallaj, Attar, Sanai, Mulla Sadra, Mir Damad, Juwayni, Junayd, Marinus, Aquinas), 6 edges (1 medium queued) |
| 31-second-wave-east | merged | 12 people (goraksha mapped onto canonical gorakhnath via PERSON_MAP: name-collision), 7 edges (2 medium queued); pali-canon is a kind:text record |

Owner rule applied from this batch: **medium-confidence main teachers are never live** (merge-sources skips them; they stay in the
review queue). This removed 4 that batch 2 had published (amaravati/ajahn-amaro, cittaviveka/ajahn-sucitto,
aruna-ratanagiri/ajahn-munindo, spirit-rock/jack-kornfield) + patanjali-yogpeeth/swami-ramdev. 15 high main teachers live.
Graph after: people 706 (+45), places 853 (+16), edges 503, tradition nodes 178. Review queue 94. Clips 9,478 (3 gain figure shantideva; ids unchanged).
Validation: schema 12,503 records failing none; transcript guards 0 found (243 transcripts, 9,665 samples); mcp/test.mjs all passed;
test-client all passed live; gates: only ids-unique self-collisions. Redirects live: /place/wudang, /person/uddalaka-aruni, /place/pendle-hill 301.
Screenshots: shots-merge/b4/ (live: person rumi, place patanjali-yogpeeth, place amaravati, resource refuge) — dark design unchanged.
Known: a person's own freeTexts (legacy deep sourcing, 20 rows, e.g. gutenberg/accesstoinsight) are not under the licence gate yet;
the gated 4 texts' old /resource/<id> pages now 404 (held, not redirected).

## Batch 5: 32–41 (deployed wiser-web 00b53e61, wiser-mcp 2bb46ab2; 2026-10-21 ~01:00 +07)
| pack | result | counts / notes |
|---|---|---|
| 32-schedules-stream | merged (partial) | 5 programme seeds -> staged `programmes.json` -> place retreats (suan-mokkh -> wat-suan-mokkh; recurrence, teachers, checked); NEW MCP tools `find_retreats`, `get_schedule`. No dated occurrences (never seeded); freshness = checked within 14 days, else "confirm on the official page". refresh_schedules.py + programme.json schema ARCHIVED (cron needs D1/KV state) |
| 33-virtual-retreats | archived (data used) | goenka-10day timetable -> app/wisegraph/timetables/ (plan_retreat strict level); start_retreat/retreat_today not built (stateful client runtime); DHARMA-SEED-RULES + VIRTUAL-RETREAT archived |
| 34-maps-integration | archived | keyless Directions links already live; geo_audit.py + report archived |
| 35-group-retreats | ARCHIVED | rooms/cohorts/dana need D1 tables + write paths; host_room/join_cohort not built |
| 36-retreat-builder | merged (partial) | strictness.json -> app/wisegraph/; NEW MCP tool `plan_retreat` (whole full talks only via MMR, never virtual clips/footage; timetable by strictness; rules + tradition overlay; "study week, not a retreat" warning; real retreats suggested; nothing booked). retreat-log schema + profile tables ARCHIVED (D1) |
| 37-talk-databases | archived (registry row) | dharmaseed.org added to the licence registry: CC BY-NC-ND 4.0, wholeOnly (never cut); connector contract archived; no Dharma Seed playback built |
| 38-sophia-wisdom | merged | Keating->Bourgeault edge (already present; source added), 4 Bourgeault works |
| 39-dharma-sites | merged (partial) | Birken place gap-filled (2 WAF URLs dropped by re-check); sites.json + channels archived |
| 40-retreat-mode | archived | device runtime spec (client) |
| 41-agent-shelf | merged (partial) | NEW MCP tool `compose_booking`: draft text only from published contacts (to + its source page), never sends/books/takes payment (no send path exists in the MCP; audited), refuses with the official page when no email is published. agent-claims scopes ARCHIVED (D1) |

MCP: 22 tools (14 directory + 4 retreat + 3 keeper + fetch...), all read-only annotated; REST mirror /api/retreats, /api/schedule/{id},
/api/retreat-plan, /api/booking-draft + OpenAPI. Places with programmes 352 (+5 programmes). D1 drafts 0020/0021 NOT applied.
Validation: schema 12,504 failing none; transcript guards 0 found; mcp/test.mjs all passed (7 new retreat checks); test-client all
passed live. Gates: ALL PASS except 39 (2 verify-severity WAF URLs, expected). Screenshots: shots-merge/b5/ (place wat-ram-poeng,
place birken, /agents) — dark design unchanged.

## India study live (deployed wiser-web 24b2c410, wiser-mcp 832d2214; 2026-10-21 ~00:45 +07)
- Blocker fixed: `nathas-org-natha-tradition` had country "INT" (schema needs ISO 3166 alpha-2). nathas.org (about, contacts,
  disciples pages, checked 2026-10-21) names no headquarters country (disciples "in different countries"; teachers listed in
  Moscow, Chelyabinsk...), so no honest code exists: the record is REMOVED via `source_maps.PLACE_DROP` (merge-sources skips it
  and queues a `place-dropped` review item); its people, clips and resources stay. It was never live, so no redirect.
- Merge: plain `python3 tools/merge-sources.py` (every group with a REPORT.md is now merged, India included); run twice, the
  second run is byte-identical. build-clips (clips identical, 9,947; seed.sql no longer names the dropped place), build-wise,
  build-collections. Graph: people 738, places 875 (825 mapped), edges 516, tradition nodes 178, review queue 94 items.
- Validation: schema 13,082 records failing none (jsonschema reinstalled in the sandbox); transcript guards 0 found (243
  transcripts, 9,665 samples); mcp/test.mjs all passed; test-client all passed live. Bundles: wiser-web 556 KB gzip, wiser-mcp
  995 KB gzip (keeper limit 3 MB). Live: /place/devipatan-shaktipeeth-tulsipur, /person/yogi-matsyendranath-maharaj, /place/ltwa 200.
- Screenshots: shots-merge/india/ (place devipatan, person matsyendranath, #country/IN; desktop + phone) — dark design unchanged.
  shot-merge.mjs gains `WAIT=<ms>` (desktop shots at 1.5 s can catch the loading skeleton, as b5 desktop-place-rampoeng did).

## Main-teacher check + licence registry (deployed wiser-web 05a3c9ed, wiser-mcp 24c05a86; 2026-10-21 ~01:30 +07)
Main teachers (the 5 medium ones), checked on each place's OFFICIAL site 2026-10-21 (`source_maps.MAIN_TEACHER_CHECK`, applied by merge-sources):
| place | teacher | verdict | official page |
|---|---|---|---|
| amaravati | Ajahn Amaro | PUBLISHED (high) | amaravati.org/about/male-monastic-community/ "Luang Por Amaro – Abbot" (since Nov 2010) |
| aruna-ratanagiri | Ajahn Munindo | PUBLISHED (high) | ratanagiri.org.uk home: "The abbot, Ajahn Munindo" |
| cittaviveka | Ajahn Sucitto | held | cittaviveka.org/guiding-elders: abbot 1992–2014, now Guiding Elder (not current abbot) |
| spirit-rock | Jack Kornfield | held | spiritrock.org/teachers/jack-kornfield: "a founding teacher"; no single current main teacher stated |
| patanjali-yogpeeth | Swami Ramdev | held | divyayoga.com/trustees/swami-ramdev-ji/: trustee + co-founder; no page names a main teacher |
Published rows carry `main_teacher_src` + `main_teacher_verified` -> MCP/REST `mainTeacher.sourceUrl/verifiedOn`. Held rows -> review queue kind
`main-teacher-held` with the reason (the old `main-teacher-medium` items for these 5 left the queue). Live main teachers 17 (15 + 2).

Licence registry (`app/wisegraph/licence-registry.json`, every new entry with `evidenceUrl`; shared gate `app/tools/licence_gate.py` used by
merge-sources.py AND build-wise.py; registry gains `urls` (prefix) and `held` sections):
- Now linked (evidence read 2026-10-21): accesstoinsight.org (FAQ "Copyright and terms of use", verify flag cleared), suttacentral.net (licensing page:
  free of charge, own material CC0, legacy per asserter), bps-pariyatti (bps.lk "E-Books: Free to Read"), Muktabodha (CC BY-NC 4.0), GRETIL
  (free for scholarly reference, no commercial use; noSale), Zenodo 4395629 (CC BY 4.0), OAPEN Sanderson festschrift (CC BY-NC 4.0), SOAS Mallinson
  "Nāth Saṃpradāya" (open-access repository, link only; URL -> eprints.soas.ac.uk/17972/), nathas.org articles + paramparā (footer: use allowed with
  reference), LTWA free downloads (URL -> tibetanlibrary.org/free-download-resources/), gutenberg.org (licence page), ashintejaniya.org.
  Staged texts shown 14 (was 11); India free-text claims: 7 of 19 now linked.
- Still held (terms read, unclear or restrictive; reason in registry `held` + queue): path-press-shop, Lakshmanjoo Academy blog, utpaladeva.in,
  IFP digital collections (terms page JS-only), alexissanderson.com (unreachable), swarayoga.org x2 (terms forbid reproduction), Arsha Vidya x3
  (arshavidya.org/.in: no content licence), Vishnusahasranama PDF (arshavidyananda.in terms: no reproduction), Anuttara Trika Kula (all rights reserved).
- Person free texts (20) now gated in build-wise: 19 linked (gutenberg, wikisource, ATI, dhammatalks, abhayagiri, suttacentral, ashintejaniya), 1 held
  (Chittick on ibnarabisociety.org: © the Society, no permission statement) -> queue kind `text-licence-person`. Place resource links (3) gated: all 3 linked
  (dlshq, dhammatalks, bps.lk/online-library via a `urls` entry) -> `resource-licence-place` for any future hold.
- Review queue: `text-licence`, `main-teacher-*`, `place-dropped` items are recomputed every run (resolved ones leave); now 104 items.
- The batch-4 404s: /resource/access-to-insight-theravada-library, /resource/suttacentral-early-buddhist-texts,
  /resource/buddhist-publication-society-free-booklets are 200 again (with a "Licence evidence" row); /resource/path-press-nanavira-collected-writings
  (and every other held text) answers 200 with a plain noindex "held while its licence is checked" page, no outbound link (worker `HELD`, built by
  web-worker/build-meta.mjs from the review queue).
- Known gap (not in scope): topic-hub essays (63 edition links in hubs.json -> text records) are not under the licence gate yet; e.g. the Chittick essay
  is held as a person text but still linked as a hub essay.
Validation: schema 13,082 failing none; transcript guards 0 found; mcp/test.mjs + test-client all passed; bundles 561 KB / 997 KB gzip.
Screenshots: shots-merge/verify/ (place amaravati, held resource page, ATI resource page) — dark design unchanged.

## Hub-essay licence gate (deployed wiser-web b717a293, wiser-mcp 9b42b30c; 2026-10-21 ~01:35 +07)
- `app/tools/build-hubs.py` now runs every topic-hub essay (59 distinct links / 63 text records across 11 hubs) through the shared gate
  (`app/tools/licence_gate.py`, the same registry as merge-sources.py and build-wise.py). Held essays leave the hubs and the MCP text records
  built from them, and go to the review queue as kind `text-licence-hub` (with `rid` = the resource id they would have had);
  `web-worker/build-meta.mjs` turns each into the plain noindex "held while its licence is checked" /resource page (all 13 answer 200).
  `licence_for` also matches `held` entries by `url`. Kept essays carry `licence`, `licenceUrl`, `noSale`.
- Result: **46 linked, 13 held**. Newly evidenced (terms read 2026-10-21, `evidenceUrl` on each): plato.stanford.edu (SEP Terms of Use: read/link
  licence, non-commercial distribution), ora.ox.ac.uk (ORA terms: private non-commercial study, link via the item record), sanskritdocuments.org
  (home: personal study and research, no reposting), rsarchive.org (Responsible Use: "link to the document on rsarchive.org"), Perseus Republic
  X (page footer CC BY-SA 3.0 US), ramakrishnavivekananda.info/vivekananda/ (Advaita Ashrama's support for placing the Complete Works online).
  All noSale where the terms say non-commercial.
- Held (reason in registry `held` "hub-*" + queue): Chittick "Presence with God" (ibnarabisociety.org, same as the person text), Tsadra
  Buddha-Nature, CAC daily meditations, UVA DOPS x2, Cambridge Apollo 1810/272695 (repository refused automated reading, 503), WCCM how-to,
  Chan Meditation Center publications, gururamana.org "Who Am I?" PDF (third-party copy), plumvillage.app (app home), Nikhilananda Gospel on
  ramakrishnavivekananda.info (unofficial; the permission covers the Complete Works only), Sefaria Sha'ar HaGilgulim (terms JS-only),
  vridhamma.org (organisation home). Schema 13,069 records (was 13,082: the 13 held texts) failing none.
- Known (not in scope): three practices still cite gururamana.org / the Gospel page as their how-to source (practice citations, not essay links).
- Registry: Ajaan Lee, "Keeping the Breath in Mind" (tr. Thanissaro Bhikkhu) added as book `lee-keeping-the-breath` + url prefix
  https://www.dhammatalks.org/books/KeepingTheBreath/ : CC BY-NC 4.0, noSale ("any sale, whether for commercial or non-profit purposes"),
  evidence https://www.dhammatalks.org/books/KeepingTheBreath/Section0002.html (read 2026-10-21). No current record cites it, so no rebuild.

## Keeper linkrot pass (deployed wiser-web fe65aa0b, wiser-mcp f9405239; 2026-10-21 ~01:45 +07)
- Confirming run after the hub deploy (`node keeper/run.mjs --cadence daily --only linkrot --limit 140`, open failures first): 21 failing
  (15 error, 6 warn). Each checked with Cloudflare DoH + curl, replacements found on the organisation's own site or its umbrella body.
- Fix at the source: `source_maps.KEEPER_URL_FIX` (exact cited URL -> official replacement, None = drop field), applied by
  `apply-keeper-fixes.py` to every string in wisegraph people/edges/places/place-contacts(-curated)/traditions (idempotent; re-run after
  place-contacts.py). 18 fixed: rumiscave.com -> rumis.org; vedantauk.com -> vedantauk.org; nunraw.org.uk -> nunraw-abbey.com;
  www.marygatehouse.org.uk -> marygatehouse.org; theosophyscotland.org.uk -> .org; watsanghathan.org -> watsantiwongsaram.org (same temple,
  renamed; Charity Commission 1123606); shivaashram.org.au -> theashram.com.au; vinesofobstacles.com -> vineobstacleszen.com;
  youtube @AngelasSymposium -> channel/UCPSbip_LX2AxbGeAQfLp-Ig; kopan /november-course/ (404) -> home; turvey /contact -> /contact-information/;
  gngsmethwick ?page_id=44206 (404) schedule link dropped; wisdombooks, sfvedanta, worthabbey www -> apex; ksdhighlands, williamcchittick,
  panditarama-lumbini -> http (site-side TLS faults, http 200). build-clips re-run (clips byte-identical; graph.json picks up 2 edge sources).
- Accepted in keeper/ignore.json with reasons: ishwarashram.in (403/500 bot wall), globalretreatcentre.org (incomplete TLS chain),
  dwbuk.org (Cloudflare 522). Round 2 (same command, limit 150): **0 open linkrot findings** (3 failing were ignore-pattern matches),
  dead URLs 0; open findings overall = 212 provenance/integrity info.
- Validation: schema 13,069 failing none; transcript guards 0 found (243 transcripts, 9,665 samples); mcp/test.mjs + test-client all passed
  live; bundles 561 KB / 995 KB gzip; /, /agents, /llms.txt, /llms-full.txt, /.well-known/mcp.json (+ server card), sitemaps, /robots.txt,
  /schema/ 200 (mcp host: /llms.txt, /.well-known/mcp.json, /openapi.json 200).

## Close-out 2026-10-21 ~01:50 +07
Live: wiser-web fe65aa0b, wiser-mcp f9405239 (tantrafiles.xyz; satsang.digital still not resolving, see BRIEF). Repo prx0r/satsang synced
from work/wiser (engine/ and specs/TEXT-TO-PRACTICE.md left to the text-to-practice agent; transcripts, internal/, engine/, root scratch
scripts, generated site.gen.js and secrets excluded; secret scan clean). Sync tooling: work/wiser-closeout/ (phase scripts = deploy.sh lines
11-27 / 29-32 / 33-34, sync + scan scripts).
