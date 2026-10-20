# MERGE-NOTES — 34-maps-integration (for the lead agent)

## Merge steps
```bash
cd <satsang>
# Layer 0 now (no key): direction links on place pages
#   https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>
# geo_audit.py -> app/tools/validate/ ; geo-report.json regenerates monthly
# Layer 1 after the owner creates the key: Worker secrets + referrer
#   restriction + budget alerts, then embed/autocomplete/photos per README
```

## Before deploy
- Photo rendering requires Google attribution beside every photo (terms).
- Cache policy: geocode/photo responses in D1 within ToS limits; refresh,
  don't hoard.
- 27 places lack coordinates (geo-report backlog) — list-only cards until
  filled; never plot a guess.
