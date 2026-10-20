# 03 — Editorial collection: "Rebirth: read and practise"

**Why:** ROADMAP step 12's first collections have since landed in canonical
(`seven-days-with-death`, `metta-in-four-traditions`, plus a `rebirth-across-traditions`
stub with 0 units — found by the runtime's ids gate, 2026-10-20). This pack
is the flesh for that stub, authored in the exact `wisegraph/collections.json`
editorial format (`select` resolved at build by `tools/build-collections.py`,
`{practice}` refs against merged practices). The metta draft was dropped:
canonical already carries it.

**Refs used (all verified 2026-10-20):**
- practice slugs from hub names (same slugger as build): `the-five-remembrances`,
  `mindfulness-of-death-maranasati` (both already in production),
  `recollecting-the-round`, `preparing-for-the-bardo`, `self-enquiry-who-dies`,
  `practising-dying-melete-thanatou`, `goodwill-metta`, `welcoming-practice` (deep id)
- selects use only proven keys: `topic` (rebirth, death — hub roots),
  `trad` (theravada, thai-forest, tibetan, advaita, platonic, christian, sufism),
  `rx` title regexes kept broad so the build resolves them

**Merge:** append the two objects to `app/wisegraph/collections.json`
`collections[]`, run `build-collections.py`, check no `unresolved` lines
for these ids, rebuild, deploy. Details in MERGE-NOTES.md.
