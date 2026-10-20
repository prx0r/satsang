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
