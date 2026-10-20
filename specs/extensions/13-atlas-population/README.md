# 13 — Atlas population: all UK places + branch networks, traced back

**What:** the Atlas holds 612 nodes but only 14 places — the 316 UK places
(plus 10 network places) were never in it. This pack puts them there:
326 place nodes + 71 teacher/branch edges in `atlas.schema.json` shape,
every place traced back place → lane → teachers → lineage → family.

**Files:**
- `populate_places.py` — builder (reads canonical places + place edges +
  packs 08/10/12; never writes to the repo)
- `out/atlas-places.json` — 326 place nodes (`pl-<slug>`, geo included)
- `out/atlas-place-edges.json` — 71 edges (`located_at` for teaches_at/
  abbot/associated, `founded`, `part_of` for branch houses with the v1
  `sister_of` meaning kept in notes)
- `out/traceback.json` — the family tree per place (chain to family root)
- `out/backlog.json` — lane gaps + missing person nodes (review-queue shape)
- `REPORT.md` — numbers, best chains, gap lists

**Honest limits:** 115 places lane-less (no lane for their tradition —
Triratna's 39 lead), 252 teacherless in-atlas (teachers exist in wisegraph
but have no atlas person node — Sangharakshita, George Fox, Inayat Khan
top the list). Both are directed work lists, not failures. Lane assignment
never guesses: ambiguous schools and missing lanes go null + backlog.
