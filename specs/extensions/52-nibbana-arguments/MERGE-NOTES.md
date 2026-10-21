# MERGE-NOTES — 52-nibbana-arguments (for the lead agent)

## Merge steps

```bash
cd <satsang>
# 1. arguments -> wisegraph (scaffolding for the movie scripts)
cp <ext>/52-nibbana-arguments/nibbana-arguments.md app/wisegraph/nibbana-arguments.md
# 2. validate
python3 specs/schema/validate.py
python3 <ext>/11-site-runtime/check_pack.py --repo . --pack <ext>/52-nibbana-arguments
```

## Before deploy

- This is the argument scaffolding for the nibbana movie (pack 51).
  Every line of narration in the movie scripts traces to a premise in
  this chain. Do not write movie scripts without this chain in hand.
- The direct experience ladder (6 rungs) is the on-ramp — no belief
  required at any rung. The movie's beginner-facing structure follows it.
