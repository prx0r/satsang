# Sourcing report: golden-path links (2026-10-20, extension pack)

3 `teaches_at` edges + 10 practice attributions. Person/place/tradition/text
ids verified against `wise.json` (565 people) and places-uk (316 rows);
abhayagiri resolves via 08 (merge 08 first).

## URL checks (curl, browser UA, 2026-10-20)

| url | code | use |
|---|---|---|
| https://abhayagiri.org | 200 | pasanno→abhayagiri edge source |
| https://amaravati.org | 403 (WAF) | amaro→amaravati edge source — UNVERIFIED, re-check at merge |
| (none shipped) | — | titmuss→gaia-house source is a check-note, not a link |

The amaravati edge is medium-confidence end to end (post + link both
re-check). The gate correctly FAILs it into the review queue.
