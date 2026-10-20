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
