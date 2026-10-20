# Wiser Place layer: UK-first deep pass (2026-10-20)

Data only. I wrote nothing outside `work/wiser/sources/places-uk/`. `app/`, `atlas/` and `sources/places/` were read, never edited. `tools/build.py` rebuilds every output from `cache/` with no network calls.

## Outputs
| file | what | count |
|---|---|---|
| `places.json` | UK places across all traditions (same record shape as `sources/places/places.json`, plus `contact_page`, `schedule_url`, `url_checked`, `wikidata_note`, `enwiki`) | **316** (297 new, 19 reuse the `sources/places` ids for the same places). 289 have coordinates. |
| `traditions-additions.json` | new tradition nodes | 39 |
| `people-additions.json` | UK founders and the main teachers tied to places (wisegraph shape, all `kind: figure`) | 37 |
| `edges-additions.json` | person→place `founded` / `abbot_of` / `teaches_at` with years and a source URL, plus `associated_with` from `teacher_ids`, plus lineage edges | 122 |
| `sisters.json` | 20 new places abroad, 131 `branch_of`/`sister_of` edges, and an `india_hotspots` index | 20 places / 131 edges / 13 hotspots |
| `events.json` | recurring festivals, gatherings, programmes and weekly sits. No dates: just the usual month and the official page | 27 |

### Place types
centre 57 · temple 51 · pilgrimage 46 · retreat-centre 37 · sacred-site 34 · monastery 31 · study-centre 24 · organisation 19 · meeting-house 8 · bookshop 7 · ashram 2. I added `centre`, `sacred-site`, `meeting-house`, `bookshop` and `organisation` to the earlier type list.

### Coverage by family (a place can count in more than one)
Buddhist 101 (Triratna 39, Tibetan 20 incl. Kagyu 13, OBC Soto Zen 7, Thai Forest 6, Theravada 12, Goenka 3) · Christian contemplative and pilgrimage 76 (Benedictine 15, Celtic 14) · Pagan, Druid, Wicca and Heathen 49 (druidry 14, heathenry 4, wicca 3) · Hindu, Vedanta and yoga 31 · Western esoteric 26 (Theosophy 6, Anthroposophy 5, Golden Dawn, Thelema and Inner Light 8) · Quaker 15 · Sikh 10 (major gurdwaras only) · Sufi 6 · Nondual, Krishnamurti and Fourth Way 6 · Kabbalah 2.

## Sources and verification
- **Wikidata.** I matched 124 places to a QID (search, then `wbgetentities`) and kept them only if P17 is the UK and the label/description fits. I checked every match by eye (`cache/wd_resolve.txt`). Coordinates come from P625 and `founded` from P571. 16 wrong matches were rejected, for example a disused railway station for Conishead Priory and a Handsworth church for St Mary's Lindisfarne. Where a QID is a related entity (the building, the village, the island), `wikidata_note` says so. Tradition QIDs come from a label search. The QIDs I first typed from memory were all wrong and were thrown out; two that had no good match (heathenry, akbarian) are left null.
- **OpenStreetMap (Photon, about 1 request per second).** I used it for places with no Wikidata point and only accepted a hit when its name matched. `coord_precision`: Wikidata 122 · building 102 · street/address 11 · village/locality 18 · town/district 18 · **city 16** (Triratna and other urban centres whose building I could not pin down, shown at the city centre) · none 27.
- **URLs.** I live-checked every URL on 2026-10-20 (plain-http URLs were retried as https; the sandbox proxy 404s all http). `url_status`:
  - `ok`: 195.
  - `resolves (HTTP 202/403/…)`: 41. The server answered but blocks bots.
  - `unverified`: 26. The sandbox proxy refused the host, and a web-fetch retry also failed, so it failed twice and I recorded it as a gap. This includes Ramakrishna Vedanta Centre (vedantauk.com), ISKCON Soho, Wat Buddhapadipa, Central Gurdwara, Nunraw, Marygate House and Theosophy Scotland.
  - I read the page **title** of every 200 response, which caught two bad sites. `stwinefrideswell.org.uk` now serves a casino page and `ealingabbey.org.uk` serves a Plesk placeholder. Both were removed and recorded in `url_failed_reason`.
  - Two more were removed by hand (`url_removed`): Downside Abbey's Wikidata site now serves Downside School, and the thyateira.org.uk archdiocese site is not Tolleshunt Knights' own.
- **Contact pages.** `contact_page` is the contact link exactly as published on the official homepage (148 places). I stored no email addresses or phone numbers.
- **Schedule links.** `schedule_url` is the official retreats/programme/what's-on page linked from the homepage (133 places). Dated one-off pages, donation and venue-hire pages were filtered out. No dates are stored.
- **Directories used:** the Triratna community links list (all UK centres and retreat centres), the Samye Ling and Karmapa affiliated-centre lists, the FPMT UK page, the OBC UK temple list (Reading Buddhist Priory has closed, so it is excluded), and the Theosophical Society in England and Wales branch page.

## Teachers attached to places (edges-additions.json, `target_kind: place`)
- **Amaravati:** Ajahn Sumedho founded it in 1984 and was abbot 1984–2010. Ajahn Amaro has been abbot since 2010 (back from a year's sabbatical on 31 March 2026).
- **Chithurst:** Ajahn Sumedho founded it in 1979. Ajahn Sucitto was abbot 1992–2014.
- **Harnham:** Ajahn Munindo has been abbot since 1991.
- **Gaia House:** Christina Feldman and Christopher Titmuss founded it in 1983. Rob Burbea was resident teacher 2005–2015. Stephen and Martine Batchelor taught there (medium confidence: they were on the teacher council and are now patrons).
- **Samye Ling:** Akong Rinpoche and Trungpa founded it in 1967. Lama Yeshe Losal has been abbot since 1995.
- **Throssel Hole:** Jiyu-Kennett founded it in 1972. Daishin Morgan was abbot 1982–2019. The current abbot, Rev. Master Berwyn Watson, has no Wikidata item and no years, so I did not add him as a person.
- **Rupert Spira:** he teaches at The Vedanta in Branston, Lincolnshire (his UK seven-day retreats), Colet House (day meetings) and Rudolf Steiner House (weekends).
- **Adyashanti:** Mount Madonna Center, California (silent retreats until 2020; he has since retired from live teaching), so there is no UK venue.
- **Ajahn Brahm:** abbot of Bodhinyana (BSWA), with no year and medium confidence. His UK links are biographical (born in London, studied at Cambridge), not a place, so there is no UK edge.
- **Others:** Sangharakshita (London Buddhist Centre, Adhisthana), John Main (Ealing 1975), Prabhupada (Bhaktivedanta Manor 1973), Sophrony (Tolleshunt Knights 1959), Ross Nichols (OBOD 1964), Philip Carr-Gomm (OBOD chief 1988–2020), Dion Fortune (Inner Light), Crowley (Boleskine; Blythe Road), Mathers (Blythe Road), Gerald Gardner→Valiente (lineage), Bede Griffiths (Prinknash, Pluscarden), Krishnamurti (Brockwood 1969), Karl König (Camphill 1939–40) and others.
- Years and confidence come from the official site or Wikipedia, and each edge carries its source URL. 'Medium' rows are ones I could not tie to a primary page.

## Sister places (sisters.json)
- **Ajahn Chah network:** 13 `branch_of` Wat Pah Pong, plus founder links. Amaravati↔Abhayagiri via Ajahn Amaro; Amaravati↔Wat Pah Nanachat (where he ordained).
- **Ramakrishna Order:** the Ramakrishna Vedanta Centre, Gretz, NY, SF, Hollywood, Chicago, Mayavati and RMIC are all `branch_of` Belur Math.
- **ISKCON:** the UK temples are `branch_of` Mayapur; the Manor is sister to Krishna Balaram Mandir.
- **OBC:** the UK priories are `branch_of` Throssel; Throssel is sister to Shasta Abbey, which is sister to Sojiji.
- **Samye Ling:** the Samye Dzongs, Holy Isle and Purelands are branches; Samye Ling is sister to Rumtek, Tsurphu and Sherab Ling.
- **Others:**
  - FPMT centres to Kopan, Tushita and ILTK.
  - Rigpa to Lerab Ling.
  - All Triratna centres to Adhisthana, which is sister to Guhyaloka and Nagaloka.
  - Sivananda London to Val-Morin, Neyyar Dam and Rishikesh; Satyananda to Munger.
  - BAPS to Akshardham Delhi; Brahma Kumaris to Mount Abu.
  - WCCM to Bonnevaux; Prinknash to Shantivanam; Woodbrooke to Pendle Hill, PA.
  - TS lodges to Adyar; Rudolf Steiner House to the Goetheanum; Colet House and the Gurdjieff Society to the Prieuré.
  - Inayati to Fazal Manzil and the Delhi dargah.
  - The Goenka centres to Dhamma Giri; IMC Splatts to IMC Yangon.
- **OBOD** has no abroad mother house; its gatherings are in Glastonbury.
- **India hotspots** (main centres only, most already in `sources/places`): Rishikesh, Tiruvannamalai, Belur, Dharamsala, Bodh Gaya, Varanasi, Igatpuri, Pune, Srinagar, Mayapur/Vrindavan, Munger, Mount Abu, Nagpur.
- **New abroad places with no verified coordinates:** Sivananda Val-Morin, Neyyar Dam, Akshardham Delhi, BK Mount Abu, Osho Pune and Fazal Manzil. The Photon hits were wrong and were rejected. The Chicago Vedanta URL returned 404.

## Events (events.json)
- **Festivals and gatherings:** Glastonbury Goddess Conference (late July/early August), Stonehenge summer and winter solstice open access, OBOD Summer (early June) and Winter (December) Gatherings, Mind Body Spirit London (late May) and Birmingham (November), Buddhafield Festival (July), Witchfest (November; month to confirm), Walsingham National Pilgrimage, Vesak and Kathina at Amaravati, Janmashtami at the Manor, Diwali at Neasden, Vaisakhi in Southall.
- **Programmes:** Rupert Spira's retreats at The Vedanta; the Samye Ling, Gaia House and Throssel programmes.
- **Weekly sits:** LBC drop-ins, Triratna drop-ins (a type row), Quaker Meeting for Worship (a type row, linked to Quakers in Britain's find-a-meeting page), WCCM weekly groups, Samye Dzong London, Amaravati Sunday talks, Goddess Temple open temple.
- **Not found:** no UK edition of Science and Nonduality (SAND runs online and US events). No "Beyond Words" festival could be identified; tell me the organiser and I'll add it. The Holywell pilgrimage row has no URL because the shrine's domain is hijacked.

## Gaps and judgment calls
- **27 places have no coordinates.**
  - Most are organisations with no public premises: Druid Network, Pagan Federation, BDO, Asatru UK, Children of Artemis, Inayati UK, Kabbalah Society, Inner Light, Gurdjieff Society, Headless Way, Bede Griffiths Sangha, WCCM, Plum Village UK, Buddhafield.
  - The rest are London centres I could not pin: Zenways, Kwan Um, Diamond Way, Satyananda Yoga, Amma UK, Blavatsky House, Thames Buddhist Vihara, Wisdom Books, Aeon Books.
  - Also Come-to-Good Meeting House, Camas and Gothic Image.
- **54 places have no official URL.** Many are temples, sites and meeting houses that have none, or none I could find without guessing (Peace Pagodas, Leicester and Wolverhampton gurdwaras, Lindisfarne, Brigflatts, Long Meg).
- **Dropped:** the "Helios Fountain" (Edinburgh), "Speaking Tree" (Glastonbury) and "Arcturus" (Totnes) bookshops, which I could not verify. So the Edinburgh esoteric bookshop slot is still empty. Also dropped: FDCW (not a UK centre) and FPMT's "Centre of Compassion" study group (no published location).
- **Medium-confidence facts:** Holy Isle founded 1992, LBC 1978, Manjushri 1976, Beshara at Chisholme 1975, Druid Network 2003. The Bede Griffiths years at Prinknash and Pluscarden are approximate.
- **Tradition ids:**
  - I used app ids (`christian`, `esoteric`, `divine-life-society`).
  - `new-kadampa` hangs under `tibetan` with the contested Gelug link noted.
  - `sivananda-yoga-vedanta` and `satyananda-yoga` hang under `divine-life-society`.
  - Sacred sites are tagged with the modern traditions that use them (druidry, modern-paganism), not with a claim about their builders.
- **People:**
  - All are `figure`; the official-video check was not done.
  - `living:true` means no Wikidata death date and born after 1915.
  - Christina Feldman's QID (Q112482429) has no description; treat it as medium.
  - Julian of Norwich has Wikidata placeholder dates, so her years are written as "c. 1343–after 1416".
- **Overlap:** `atlas/` was being edited by another agent during this run. I did not touch it and it may overlap with this layer.

## To merge
1. Add the `traditions-additions.json` nodes, then `people-additions.json`, then `edges-additions.json`. Person→place edges carry `target_kind: "place"` and need a place-edge table.
2. `places.json` ids that already exist in `sources/places` (amaravati, samye-ling, gaia-house, etc.) are the same place: prefer this file's `contact_page` and `schedule_url`. `sisters.json` places are new abroad places, and its edges go into a place-to-place table. `events.json` links by `place_id`.
