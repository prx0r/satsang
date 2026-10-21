# MERGE-NOTES — 51-nibbana-movie (for the lead agent)

## Merge steps

```bash
cd <satsang>
# 1. practices group in
cp -r <ext>/51-nibbana-movie/sources/nibbana-movie sources/
python3 app/tools/merge-sources.py
# 2. manual -> wisegraph (no consumer yet; client runtime is next)
cp <ext>/51-nibbana-movie/nibbana-movie.md app/wisegraph/nibbana-movie.md
# 3. rebuild + validate + check
python3 app/tools/build-hubs.py
python3 app/tools/build-collections.py
python3 specs/schema/validate.py
python3 <ext>/11-site-runtime/check_pack.py --repo . --pack <ext>/51-nibbana-movie
```

## Before deploy

- Packs 43, 44, 45 must merge first (reused practice ids).
- New practices must build with needsTeacher: false — confirm via the
  built collections.json.
- Level 12 must NEVER be marked complete by any client. The runtime says:
  "What is left? Sit with that."
- The movie (video) renders via the HyperFrames pipeline — the manual
  here is the script source of truth.
