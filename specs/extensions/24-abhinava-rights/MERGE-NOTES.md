# MERGE-NOTES — 24-abhinava-rights (for the lead agent)

## Merge steps
```bash
cd <satsang>
mkdir -p sources/abhinava-texts
cp <ext>/24-abhinava-rights/people-abhinava.json \
   <ext>/24-abhinava-rights/works-attach-3.json \
   <ext>/24-abhinava-rights/edges-texts.json sources/abhinava-texts/
# + works hand-merge per 02-snippet; schema decisions below
# rebuild: merge -> portraits (no art expected) -> build-wise -> deploy
```

## Before deploy
- Proposed rel: `author_of` (person → text). Until it exists, expounds +
  author note is the honest mapping — do not use lineage_of.
- Proposed fields: `derivation` on Practice/Collection, licence taxonomy
  on text editions. Integrator decision with DATA-MODEL update, not half-add.
- KSTS scans + GRETIL/Muktabodha e-texts join via 09-texts when verified
  (never from memory). Dyczkowski's in-progress Tantraloka translation
  stays citation-only until its licence is known.
