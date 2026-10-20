# MERGE-NOTES — 15-niche-hermitages (for the lead agent)

## Merge steps
```bash
cd <satsang>
# places + people + edges: standard additions merge (dedupe by id)
# contacts: append place-contacts-niche.json rows to app/wisegraph/place-contacts.json
# channels: hand to the next teachers-deep-style clip pass (oEmbed 200 +
#   playable + author match), NOT into clips.json directly
# texts: append to the texts-freebooks group (09) or merge with it
# rebuild: merge-sources -> build-clips -> portraits (4 new figures, no art
#   expected) -> build-wise -> deploy + D1 seed
```

## Before deploy
- Meetirigala row has no URL (WAF). Ships with full contacts (checked
  2026-10-20); re-run place-contacts.py --refresh before it gets a link.
- The 4 new teachers are figures: the official-video check promotes them
  to speakers when the channel clip pass lands (Hillside/SBS channels first).
- Pa-Auk lineage check: Na Uyana + Brahma Vihari rows sit under the pa-auk
  node (exists); Dipankara/Ariyananda teacher_of edges to Pa-Auk Sayadaw
  stay medium until a second source confirms.
