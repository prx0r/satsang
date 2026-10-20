# Sourcing report: places networks (2026-10-20, extension pack)

10 new places, 13 edges. Checked against `sources/places-uk/places.json`
(316 rows): no id overlap. `teacher_ids` verified against `wise.json`
people; `traditions` verified against the 157-node tree.

## URL checks (curl, browser UA, 2026-10-20)

| url | code | row |
|---|---|---|
| https://watpahnanachat.org | 200 | wat-pah-nanachat |
| https://abhayagiri.org | 200 | abhayagiri |
| https://belurmath.org | 200 | belur-math |
| https://vedantany.org | 200 | vedanta-society-new-york |
| https://dlshq.org | 200 | divine-life-society |
| https://www.sriramanamaharshi.org | 200 | sri-ramanasramam |
| https://rootinstitute.com | 200 | root-institute |
| https://cittaviveka.org | 200 | (edge source; row already in places-uk) |
| https://ratanagiri.org.uk | 200 | (edge source; row already in places-uk) |
| https://santacittarama.it | 403 (WAF) | santacittarama — URL-less row |
| https://tushita.info | 403 (WAF) | tushita-dharamkot — URL-less row |
| https://advaitaashrama.org | 403 (WAF) | advaita-ashrama — URL-less row |
| hartridgetemple.org | DNS fail | OMITTED (backlog) |

403 = bot-guard, not death. The three URL-less rows carry no `url`
key at all (never ship an unchecked link); the lead agent's
`place-contacts.py --refresh` pass fills them.

## Coordinates
All `approximate (unverified)` — city-level, mappable, re-checkable.
Upgrade path: Wikidata P625 per row (same as places-uk `coord_source`).
