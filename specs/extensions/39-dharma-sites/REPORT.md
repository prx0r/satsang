# Sourcing report: dharma sites (2026-10-20, extension pack)

10-site registry + Birken (Canada ✓) + Sona channel. Key architectural
finding: Dharma Seed runs per-centre subdomains (gaia./sr./bcbs./imsrc.),
so the talk-fetch layer reads subdomains + self-hosted libraries with one
shape. Abhayagiri's consent DB and Amaravati's AI transcripts are the two
patterns to copy (consent per teacher; search without storing transcripts).

## URL checks (curl, browser UA, 2026-10-20)

| url | code |
|---|---|
| https://birken.ca/teachings/ | 200 |
| https://www.youtube.com/@AjahnSona | 200 (28.8K subs) |
| https://gaiahouse.co.uk/dharma-talks/ | 200 (4,500 via Dharma Seed) |
| https://www.abhayagiri.org/questions/about/Overview.html | 200 (Archive consent model) |
| https://www.abhayagiri.org/ | 200 |
| https://gaiahouse.co.uk/ | 200 |
| https://sr.dharmaseed.org/talks/ | 200 |
| https://bcbs.dharmaseed.org/talks/ | 200 |
| https://www.dhammatalks.org/ | 200 |
| https://forestsangha.org/ | 200 |
| https://www.audiodharma.org/ | 200 |
| https://amaravati.org/ | 403 (WAF; content confirmed via search + subpages) |
| https://www.dharma.org/resources/audio/ | 403 (WAF; content confirmed via search) |
