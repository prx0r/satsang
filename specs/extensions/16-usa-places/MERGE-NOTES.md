# MERGE-NOTES — 16-usa-places (for the lead agent)

## Merge steps
```bash
cd <satsang>
# places + people + edges: standard additions merge (dedupe by id).
# 4 new people are figures; the official-video check promotes speakers later.
# contacts: append place-contacts-usa.json rows to app/wisegraph/place-contacts.json.
# main teachers: set per main-teachers-usa.json (re-check the 1 medium post).
# 10 URL-less rows: re-run place-contacts.py --refresh; add URLs only from
#    a real browser check, never from memory.
# rebuild: merge -> clips (no new clips this pack) -> portraits -> build-wise
#   -> minimal_entry.py scoreboard -> deploy + D1 seed.
```

## Before deploy
- vedanta.org = VSSC Hollywood needs confirmation (row flagged in REPORT).
- Aleph HQ city + ADF HQ city queued (rows carry approximate coords only).
- White Plum/ZCLA unsourced (no verified URL) — next pass.
- Himalayan Institute + Pendle Hill need contact details (rows are thin).
- Goenka rows use rotating model + dhamma.org scheduling (doctrine, correct).
