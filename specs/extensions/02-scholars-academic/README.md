# 02 — Scholars first-class: works + academic lineage

**Why:** NORTHSTAR (user, 2026-10-20 03:27) makes scholars first-class —
profiles with works attached, academic lineage walkable like dharma
lineage, leading into openpatala (translate works here, render videos,
build syllabuses). The graph has ~99 scholar-ish bios but works are
thin and `academic_supervisor_of` edges barely exist.

**What:** `works-attach.json` (19 famous, verifiable books/translations
attached to 16 scholars already in the graph) + `edges-academic.json`
(4 documented supervisor relations, conf high) + openpatala crosswalk
extension rows (translation pipeline targets).

**Merge:** hand-merge works into `app/wisegraph/people.json` (or extend
`merge-sources.py` to read `works-attach.json`); edges via the standard
additions flow. Details in MERGE-NOTES.md.

**Honesty rule used:** every work is a famous publication confidently
attributable (title + year + author). Where memory is medium-confidence
it is marked `check: true` for the lead agent to verify, never shipped
as fact.
