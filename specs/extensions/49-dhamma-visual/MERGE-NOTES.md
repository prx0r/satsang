# MERGE-NOTES — 49-dhamma-visual (for the lead agent)

## Merge steps

```bash
cd <satsang>
# 1. language spec -> docs/
cp <ext>/49-dhamma-visual/README.md docs/DHAMMA-VISUAL.md
# 2. validate
python3 specs/schema/validate.py
python3 <ext>/11-site-runtime/check_pack.py --repo . --pack <ext>/49-dhamma-visual
```

## Before deploy

- This is the grammar. Figures (pack 48) use it. Future figures follow it.
- Install the anatomy skill: `npx skills add wheresryan22/anatomy -g`
- The 33 sermons score maps each lecture group to a visualization. Build
  order: Fig 1 (done) → Fig 2 (sign-lens) → Fig 3 (vortex) → Fig 4
  (observer) → Fig 5 (what remains) → sermon-by-sermon figures.
