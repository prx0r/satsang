# MERGE-NOTES — 47-nandi (for the lead agent)

## Merge steps

```bash
cd <satsang>
# 1. stages -> new file (no consumer yet; client game engine is next)
cp <ext>/47-nandi/nandi-stages.md app/wisegraph/nandi-stages.md
# 2. validate
python3 specs/schema/validate.py
python3 <ext>/11-site-runtime/check_pack.py --repo . --pack <ext>/47-nandi
```

## Before deploy

- Stages reference practices from packs 43, 44, 45. Merge those first.
- Stage 12 (nibbana) must NEVER be marked complete by the runtime. It is
  always there. The runtime says: "What is left? Sit with that."
- TTS scripts per stage are the next build step. Use the doctrine
  (VBT-DOCTRINE.md) and interactive design (VBT-INTERACTIVE.md) from
  pack 45 as the pattern.
- The game engine (client runtime) is the next build step. The stage
  data is ready; the engine walks the user through it.
