# MERGE-NOTES — 53-nibbana-scaffold (for the lead agent)

## Merge steps

```bash
cd <satsang>
# 1. scaffold + excavation -> docs (study layer)
cp <ext>/53-nibbana-scaffold/nibbana-scaffold.md docs/NIBBANA-SCAFFOLD.md
cp <ext>/53-nibbana-scaffold/sermon-01-excavation.md docs/SERMON-01-EXCAVATION.md
# 2. validate
python3 specs/schema/validate.py
python3 <ext>/11-site-runtime/check_pack.py --repo . --pack <ext>/53-nibbana-scaffold
```

## Before deploy

- Scaffold is the master argument structure. Movie scripts read from it.
- Sermon 1 excavation is raw material. Sermons 2-33 are next — same
  method: read, extract everything useful, organize into sections.
- Compression into movie scripts happens after all 33 are excavated.
