# MERGE-NOTES — 44-texts-targets (for the lead agent)

## Merge steps

```bash
cd <satsang>
# 1. texts group in (REPORT.md gates the group — merger reads texts.json)
cp -r <ext>/44-texts-targets/sources/texts-targets sources/
python3 app/tools/merge-sources.py
# 2. targets + connector -> docs/ + mcp/ wiring
cp <ext>/44-texts-targets/texts-targets.json docs/
cp <ext>/44-texts-targets/connectors/fojin.json mcp/src/connectors/  # or app/wisegraph/connectors/
# 3. rebuild
python3 app/tools/build-wise.py
python3 specs/schema/validate.py
python3 <ext>/11-site-runtime/check_pack.py --repo . --pack <ext>/44-texts-targets
```

## Before deploy

- texts.json merger: pack 09's MERGE-NOTES already notes that texts.json
  needs the merger extended (ROADMAP step 0). This pack rides that same
  extension — no new merger work.
- FoJin connector: wire into MCP `get_resources` as a live source lookup
  (search_corpus → sutta id, get_parallels → topic-hub compare section,
  verify_quote → chat quoting gate). The connector file is data, not code.
- Anālayo PDFs: citation row on the text record; PDF itself is free but
  we link, never store. The Hamburg URL hosts many Anālayo PDFs — treat
  it as a library pointer, not a single-text link.
- `analayo-samyukta-agama-studies` link points to the Hamburg library
  page, not a specific PDF — the individual papers are there but the
  exact URL per paper varies.
