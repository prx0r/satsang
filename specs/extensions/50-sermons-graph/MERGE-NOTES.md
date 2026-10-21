# MERGE-NOTES — 50-sermons-graph (for the lead agent)

## Merge steps

```bash
cd <satsang>
# 1. graph -> wisegraph (drives game, visuals, practice system)
cp <ext>/50-sermons-graph/sermons-graph.md app/wisegraph/sermons-graph.md
# 2. validate
python3 specs/schema/validate.py
python3 <ext>/11-site-runtime/check_pack.py --repo . --pack <ext>/50-sermons-graph
```

## Before deploy

- Graph references practices from packs 43, 44, 45. Merge those first.
- Graph references texts from pack 44. Merge that first.
- The graph drives: the NANDI game (pack 47), the visual language
  (pack 49), and the practice system. It is the single source of truth
  for what Ñāṇananda teaches and how it connects.
- The sermons are Ñāṇananda's actual voice. TTS scripts are NOT needed —
  the visuals are built around his recorded words, not the other way round.
