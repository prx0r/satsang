# 01 — New tradition nodes (streams with clips or people, no nodes yet)

**Why:** deep-western sourced 1,004 clips across schools that have no
tradition node (`learned-magic` 35, `franciscan-contemplative` 30), and
the NORTHSTAR strategy names Sufi orders + Kabbalah lineages as missing.
Columns with no node show no takes, no lineage tree, no "where to
practise". Nodes follow sources: every node here has people attached
below; clips are a follow-up sourcing pass (see REPORT.md).

**Merge:** copy `sources/<group>/` into `satsang/sources/` (5 new
groups), run the standard merge (`merge-sources.py` → `build-clips.py`
→ `portraits.py` → `build-wise.py`), deploy. Details in MERGE-NOTES.md.

Groups:
- `sources/sufi-chishti/` — Chishti order node + Muinuddin, Nizamuddin, Khusrau
- `sources/sufi-qadiri/` — Qadiri order node + Abdul Qadir Gilani
- `sources/kabbalah-lurianic/` — Lurianic lineage node + Luria, Vital
- `sources/christian-franciscan/` — Franciscan contemplative node + Francis, Clare, Bonaventure
- `sources/western-learned-magic/` — Learned magic node + Ficino (exists), Agrippa, Dee, Bruno

Deliberately NOT noded (no clips, no people — nodes follow sources):
martinism, chaos-magick, theosophy-lodges (place-level, see 08),
jain/taoist/shinto/confucian schools (await a sourcing pass),
ecstatic-kabbalah/christian-kabbalah (covered by kabbalah + Idel/Matt
scholar records in 02), new-monasticism/taize (await places).
