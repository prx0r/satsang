# MERGE-NOTES — 01-tradition-nodes (for the lead agent)

## What this is
5 new sourcing groups, nodes + people + edges only, no clips.
12 new people, 5 new tradition nodes, 10 edges. Zero id overlap with
`app/` or `sources/` (checked 2026-10-20 against `wise.json`:
565 people, 157 traditions).

## Merge steps
```bash
cd <satsang>
for g in sufi-chishti sufi-qadiri kabbalah-lurianic christian-franciscan western-learned-magic; do
  cp -r <ext>/01-tradition-nodes/sources/$g sources/$g
  printf '# %s sourcing report\n\nNodes + people + edges (extension pack 2026-10-20). No clips yet.\n' "$g" > sources/$g/REPORT.md
done
python3 app/tools/merge-sources.py
python3 app/tools/build-clips.py ../raw ../transcripts-internal
python3 app/tools/portraits.py && python3 app/tools/build-wise.py
```
`merge-sources.py` must also pick up the new groups' `traditions-additions.json`
— if it globs only known groups, add these five names (same handling as
`places-uk/*-additions.json`).

## Before deploy
1. Verify the 5 null wikidata ids against labels (convention: failed check stays null).
2. Re-run the transcript guards (`specs/` + `mcp/` contain no transcript text — verified: these files are metadata only).
3. Profiles render with "on their way" until the clip pass lands.

## Follow-up (separate task)
Channel-scoped clip pass per group (teachers-deep pattern: oEmbed 200 +
playable + author match), then virtual-clip cuts. Suggested mapping note:
`learned-magic` absorbs deep-western school tags `learned-magic`,
`hermeticism`, `alchemy`, `theurgy`; `franciscan-contemplative` absorbs
school tag `franciscan-contemplative`; extend `tools/source_maps.py`
accordingly.
