# MERGE-NOTES — 46-nibbana-path (for the lead agent)

## Merge steps

```bash
cd <satsang>
# 1. graph -> new file in wisegraph (no consumer yet; client runtime is the next step)
cp <ext>/46-nibbana-path/nibbana-path.md app/wisegraph/nibbana-path.md
# 2. validate
python3 specs/schema/validate.py
python3 <ext>/11-site-runtime/check_pack.py --repo . --pack <ext>/46-nibbana-path
```

## Before deploy

- This graph references practices from packs 43, 44, 45. Those must be
  merged first for the practice refs to resolve.
- The runtime is a spec. The client implementation (walking the user
  through the chain, tracking progress, suggesting next node) is the
  next build step.
- The terminal state (nibbana) is deliberately not a node. The runtime
  must never claim the user has "attained nibbana." It says: "What is
  left when you stop fabricating? Sit with that."
