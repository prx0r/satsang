# MERGE-NOTES — 12-minimal-entries (for the lead agent)

## Merge steps
```bash
cd <satsang>
# 1. schema: apply schemas/place-patch.json to specs/schema/place.json
#    (additive: main_teacher, teacher_model, description_source[_url]).
#    required[] UNTOUCHED — legacy rows complete via scoreboard, not breakage.
# 2. main teachers: set the 6 links (08 first for network rows).
#    Re-check the 3 medium-conf posts at merge time.
# 3. checker: cp minimal_entry.py app/tools/validate/ ; run monthly:
python3 app/tools/validate/minimal_entry.py \
  --places sources/places-uk/places.json \
  --links <main-teachers-live.json> \
  --out app/site/data/scoreboard.json --backlog /tmp/entry-backlog.json
# 4. backlog.json appends to review-queue.json (same item shape; jq -s merge).
#    Bio-source aggregates per tradition; teacher/contact/url per place.
```

## Before deploy
- The 6 authored links: 3 high, 3 medium (posts change — verify).
- `teacher_model` inference (goenka→rotating, quaker→none) is documented
  doctrine, not data: keep the rule in MINIMAL-ENTRY.md, never hand-set
  what doctrine decides.
- Bio rule for sourcing agents from here on: every new/edited description
  ships with `description_source` + URL when official. Paraphrase, never
  verbatim. The 316 legacy `unknown`s drain through the backlog.
- Scoreboard P0 order: Buddhism first (thai-forest 9, tibetan 20, triratna
  39 rows tell you exactly what's missing where).
