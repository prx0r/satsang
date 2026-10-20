# Wiser Place layer: sourcing report (2026-10-20)

Data only. Nothing in `work/wiser/app/` was edited and nothing was deployed. Everything is in `work/wiser/sources/places/`; `tools/build.py` regenerates all outputs from the caches.

## Outputs
| file | what | count |
|---|---|---|
| `places.json` | monasteries, retreat centres, ashrams, temples, pilgrimage and study sites | **476** = 204 curated + 272 Goenka centres |
| `vipassana-centres.json` | full dhamma.org directory (centres + non-centre course sites) | 409 (273 centres, 136 non-centre sites, 106 countries) |
| `retreats.json` | recurring programmes per place, schedule link only, no dates | 357 (85 curated + 272 Goenka 10-day) |
| `lineages.json` | 24 lineage trees as `teacher_of` chains with years and status | 88 edges (24 already in app, 64 new) + 2 `influenced` + 8 `lineage_of` |
| `people-additions.json` | new lineage people (wisegraph shape) + an alias patch for Thanissaro ("geoffrey degraff", "ajaan geoff") | 77 people |
| `edges-additions.json` | only edges not already in app or another sources/ group | 73 |
| `traditions-additions.json` | `goenka-vipassana` (under burmese), `kagyu`, `nyingma` (under tibetan) | 3 |
| `countries.json` | per country: places, traditions, families, types, Goenka centre/non-centre counts, place ids | 107 countries |

### Place record
`id, name, type, traditions[], country (ISO2), country_name, city, lat, lng, coord_source, coord_precision, founded, founded_source, teacher_ids[], url, url_status, wikidata, description, offers[], language, source` (+ `schedule_url`, `dhamma_subdomain` for Goenka centres). `teacher_ids` are founders or teachers historically tied to the place, not a claim about who teaches there now.

## Sources and verification
- **Wikidata** (wbsearchentities + wbgetentities): 152 curated places matched to a QID; coordinates (P625), inception (P571), country (P17) and website (P856). Every curated QID was checked by eye against its label/description; every Wikidata country agreed with mine. Bad matches were dropped (e.g. "Château du Prieuré" hit was a different chateau near Pontoise; "Mingun Sayadaw" hit was the 1911–1992 Tipitakadhara, not Mahasi's teacher). Doubtful inception values were nulled (SFZC building 1922, Abhayagiri 2018, Brockwood 1975, Delphi 1987, Coptic Museum, Lerab Ling, Kalady).
- **OpenStreetMap**: Nominatim + Photon for places with no Wikidata point (address geocodes only where the address came from the official site). `coord_precision` says when a point is a village/locality rather than the building (Kankhal, Anaikatti, Khetwadi, Beerwah, Kukuchina).
- **dhamma.org**: directory page (names, ISO country, city, website, schedule link, first-course year) + maps page (`position_data` coordinates). All 409 schedule URLs checked: 408 return 200 (dhamma.org 404s on bad ids, so 200 is meaningful). 20 centre subdomain sites fail; `url` is null for those and the failure is kept as `url_failed`.
- **URLs**: every url and schedule_url was fetched on 2026-10-20. `url_status`: `ok` = 200; `resolves (HTTP 202/403 bot protection)` = the official server answered but blocks bots (bswa.org, dharma.org, iltk.org, kfa.org, rzc.org, sojiji.jp, santacittarama.org, zmm.org, bhavanasociety.org); `ok (verified via fetch…)` = blocked from the sandbox proxy but confirmed with a page fetch (tibetanlibrary.org, sfvedanta.org, tisarana.ca, maisondelinspir.org, jkrishnamurti.in). URLs that failed or turned out wrong were removed: ltwa.net (now a Thai football site; LTWA is tibetanlibrary.org), rumtek.org and sayadawutejaniya.org (suspended), chanmyay.org (defaced), panditarama.net (hijacked), coptic-cairo.com (placeholder), snowmass.org (dead host), swayambhu.buddhism-foundation.org (not the site's own), shaolin.org.cn (410).
- **People**: 68 of 77 new people matched to Wikidata for dates. `living:true` means no death date on Wikidata and born after 1915 (14 people); check Chanmyay Sayadaw (b. 1928) and Bhante Gunaratana (b. 1927) before showing "living". All new people are `kind: figure`: the official-video check that would make them `speaker` was not done here.

## Counts by tradition (curated)
| tradition node | curated places |
|---|---|
| tibetan | 36 |
| thai-forest | 25 |
| gelug | 13 |
| kagyu | 13 |
| buddhism | 12 |
| ramakrishna-order | 12 |
| christian-mysticism | 12 |
| advaita | 11 |
| theravada | 10 |
| burmese | 10 |
| hindu | 9 |
| soto-zen | 9 |
| insight | 8 |
| plum-village | 8 |
| zen | 8 |
| nyingma | 7 |
| kriya-yoga | 7 |
| kashmir-shaivism | 6 |
| christian | 6 |
| rinzai-zen | 5 |
| krishnamurti | 4 |
| platonic | 4 |
| early-suttas | 2 |
| goenka-vipassana | 2 |
| inchegeri | 2 |
| anandamayi-sangha | 2 |
| arsha-vidya | 2 |
| anthroposophy | 2 |
| gnosticism | 2 |
| mahayana | 1 |
| divine-life-society | 1 |
| theosophy | 1 |
| fourth-way | 1 |
| neoplatonism | 1 |
| goenka-vipassana (dhamma.org centres) | 272 more |

| country | places | Goenka centres | Goenka non-centre sites | top traditions |
|---|---|---|---|---|
| India (IN) | 185 | 130 | 15 | goenka-vipassana 131, tibetan 12, advaita 10, hindu 8 |
| United States (US) | 55 | 14 | 6 | goenka-vipassana 14, insight 7, soto-zen 5, christian-mysticism 5 |
| Myanmar (MM) | 31 | 23 | 0 | goenka-vipassana 23, burmese 8, buddhism 1 |
| Nepal (NP) | 28 | 20 | 0 | goenka-vipassana 20, tibetan 5, buddhism 3, kagyu 2 |
| Thailand (TH) | 23 | 13 | 0 | goenka-vipassana 13, thai-forest 7, theravada 2, plum-village 1 |
| United Kingdom (GB) | 19 | 3 | 3 | thai-forest 4, tibetan 4, kagyu 3, goenka-vipassana 3 |
| Australia (AU) | 14 | 8 | 2 | goenka-vipassana 8, thai-forest 5, gelug 1, tibetan 1 |
| Sri Lanka (LK) | 14 | 6 | 0 | theravada 7, goenka-vipassana 6, early-suttas 2, buddhism 2 |
| People's Republic of China (CN) | 10 | 0 | 0 | tibetan 7, gelug 4, zen 3, kagyu 1 |
| France (FR) | 10 | 4 | 5 | goenka-vipassana 4, plum-village 2, nyingma 1, tibetan 1 |
| Canada (CA) | 8 | 5 | 3 | goenka-vipassana 5, thai-forest 2, kagyu 1, tibetan 1 |
| Japan (JP) | 8 | 2 | 0 | soto-zen 3, rinzai-zen 3, goenka-vipassana 2 |
| Italy (IT) | 7 | 1 | 0 | christian 3, thai-forest 1, gelug 1, tibetan 1 |
| Germany (DE) | 5 | 2 | 4 | goenka-vipassana 2, thai-forest 1, plum-village 1, christian-mysticism 1 |
| Greece (GR) | 5 | 0 | 1 | platonic 4, christian-mysticism 1 |
| Brazil (BR) | 5 | 5 | 4 | goenka-vipassana 5 |
| New Zealand (NZ) | 3 | 1 | 0 | thai-forest 2, goenka-vipassana 1 |
| Switzerland (CH) | 3 | 1 | 0 | thai-forest 1, anthroposophy 1, goenka-vipassana 1 |
| Egypt (EG) | 3 | 0 | 1 | gnosticism 2, christian-mysticism 1 |
| Spain (ES) | 3 | 2 | 3 | goenka-vipassana 2, christian-mysticism 1 |
| Indonesia (ID) | 3 | 3 | 0 | goenka-vipassana 3 |
| Vietnam (VN) | 2 | 1 | 1 | plum-village 1, zen 1, goenka-vipassana 1 |
| Poland (PL) | 2 | 1 | 1 | christian-mysticism 1, goenka-vipassana 1 |
| Argentina (AR) | 2 | 2 | 2 | goenka-vipassana 2 |
| Colombia (CO) | 2 | 2 | 2 | goenka-vipassana 2 |


## Gaps and judgment calls
- **No verified coordinates (17 curated)**: wat-dhammasathit, dhammasara, forest-hermitage-kandy, hillside-hermitage (location not public), chanmyay-yeiktha, shwe-oo-min, imc-yangon, imcw, cloud-mountain, bhavana-society, sera-bylakuppe, annamalai-swami-ashram, vedanta-uk, satsang-bhavan-lucknow, karar-ashram, shree-muktananda-ashram, avila-encarnacion. Overpass (the precise OSM search) is blocked from the sandbox: failed on 3 mirrors, stopped there. Nominatim also rate-limited part of a run.
- **No official URL (65 curated)**: mostly pilgrimage sites with no site of their own (Lumbini has one; Sarnath, Vulture Peak, Arunachala, Potala, Delphi etc. do not), plus sites I could not verify (Island Hermitage, Vimutti, Bodhivana, Shantivanam, Vedanta Centre UK, Snowmass, Wat Ram Poeng, Rumtek, Shwedagon).
- **No Wikidata item (9 people)**: Ajahn Liem, Ajahn Munindo, Mingun Jetavana Sayadaw, Gyokujun So-on Suzuki, Thich Chan That, Swami Ram (Kashmir), Swami Mahatab Kak, John Hughes, Lakshmanagupta. Years left blank rather than typed from memory.
- **Medium-confidence edges**: Chah→Jayasaro, Dipa Ma→Goldstein, U Pandita→Goldstein/Salzberg/Kornfield, Nyanatiloka→Ñāṇavīra, Nyanaponika→Bhikkhu Bodhi, Lakshmanjoo→Sanderson ("studied with" rather than formal heir).
- **Tradition ids**: used app ids (`christian`, not western group's `christianity`). Anandamayi ashrams use `anandamayi-sangha`, Sivananda Ashram uses `divine-life-society` (both added by advaita-extra). Siddha Yoga ashrams are tagged `kashmir-shaivism` + `hindu` with a note in the description; a `siddha-yoga` node may be cleaner.
- **Thin coverage**: Anthroposophy (2), Theosophy (1), Fourth Way (1), Neoplatonism/Platonic heritage (5), Gnostic (2), Kashmir Shaivism (6) have few physical places by nature. Not covered: Chan monasteries in Taiwan (Dharma Drum, Fo Guang Shan), Korean Seon, Mahasi branch centres outside Myanmar, FPMT's full centre list, Plum Village's Healing Spring / Stream Entering / Mountain Spring / AIAB, Vedanta Society branches beyond NY/SF/Hollywood/RVC, Ajahn Chah branches beyond the 20 listed. These would take Wiser past 600 curated places in a second pass.
- **Goenka non-centre sites** (136) carry dhamma.org's country/region centroid, so they are kept in `vipassana-centres.json` only and counted in `countries.json`, not mapped as places.
- `cost_model` in retreats.json is the usual model for that place type (dana / sliding scale / fee) and should be confirmed on the schedule page; no prices or dates are stored.
- Another workspace folder, `work/wiser/atlas/`, appeared during this run doing Wikidata/Wikipedia enrichment. I did not touch it; it may overlap with this layer.

## To merge
1. Add `traditions-additions.json` nodes, then `people-additions.json` people and the Thanissaro alias patch, then `edges-additions.json`.
2. `places.json` / `retreats.json` / `countries.json` are new files; the app has no place schema yet (NORTHSTAR "Data spine"). `teacher_ids` give the `teacher_at` edges.
