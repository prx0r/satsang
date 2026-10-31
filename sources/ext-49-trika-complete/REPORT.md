# ext-49 Trika complete (2026-10-31)

Owner priority: Trika / Kashmir Shaivism complete, with every significant master (living or historical) and every live
practice place or teaching circle on the site, with sourced details. Leads came from the private ipvv repo
(prelim/authors-works.md, prelim/research.md, works/scholarship/WORK.md, manifests/ALL-TRANSLATIONS-INVENTORY.md) and the
2026-10-26 chat notes; every published fact was read on a fetched page on 2026-10-31 (official site first; Wikipedia, university
or publisher pages for historical figures and scholars). No quotes over 25 words; no owner details.

## Counts (people in kashmir-shaivism / trika / pratyabhijna / spanda / krama, texts excluded; places tagged with any of them)
| | before | after |
|---|---|---|
| Trika people | 42 (15 figure, 17 teacher, 10 scholar) | 65 (20 figure, 23 teacher, 22 scholar) |
| Trika places | 12 (incl. 3 temples/pilgrimage sites, ishber-ashram duplicate) | 23 |
| Edges touching Trika people | 51 (33 lineage) | 64 (46 lineage) |

## Files
- `people-additions.json` 23 people (role carried through the merge: merge-sources now keeps a sourced `role` for ext packs).
- `edges-additions.json` 14 lineage edges (medium teacher_of becomes studied_with at merge).
- `places-ext.json` 11 places / teaching circles (descriptions ≤200 chars; coords only for published addresses, via OSM Nominatim).
- `place-links.json` Bäumer + Sadananda Das → deer-park-bir; John & Denise Hughes, George Barselaar → lakshmanjoo-academy.
- `programmes.json` 5 recurring programmes (Deer Park seminar, Bäumer retreat seminars, Lakshmanjoo Academy fall retreat, Tantravimarśa course, Mount Eliza weekly satsang).
- `years-fix.json` Swami Ram 1852–1914 (Lakshmanjoo Academy; Wikipedia 1854–1915), Mahtab Kak 1870–1942, Shankarananda b. 1942.
- `keeper-fixes.json` (new hook: source_maps loads it into KEEPER_*): John Hughes → teacher + bio; Swami Ram / Mahtab Kak / Shankarananda bios;
  Lakshmanjoo→Bäumer edge to high (initiated 1987, utpaladeva.in); Rudi→Khecaranatha to high (heartofc.org); Anuttara Trika Kula renamed
  "the continuing circle of the late Mark Dyczkowski" with a dated description; Deer Park tagged kashmir-shaivism (its program page);
  Ishwar Ashram Srinagar gets the site-precise OSM node; **ishber-ashram merged into ishwar-ashram-srinagar** (301 /place/ishber-ashram).
- `redflags-public.json` place-level public safety record for the-ashram-mount-eliza (The Age 2015, ABC 2021, Wikipedia Shiva Ashram).

## People added
Classical / Kashmiri line: shambhunatha (Abhinavagupta's Kaula guru), bhutiraja (one of his named teachers), bhatta-narayana
(Stavacintāmaṇi poet, late 9th–early 10th c.), lalleshwari (Lal Ded, c. 1320–1392), shivopadhyaya (VBT commentator, KSTS),
swami-manakak (initiated Swami Ram, c. 1860), maheshwar-nath-razdan (Lakshmanjoo's Sanskrit/Śaiva teacher 1926–33).
Scholars (role scholar): isabelle-ratie, raffaele-torella, john-nemec, david-peter-lawrence, jurgen-hanneder, lyne-bansat-boudon,
kanti-chandra-pandey, navjivan-rastogi (Padma Shri 2024), raniero-gnoli (1930–2025), baljinath-pandit (1916–2007), sadananda-das.
Teachers: george-barselaar, denise-hughes, alka-tyagi, gabriel-pradipaka, swami-chetanananda-tmc (Rudi's successor; distinct from the
Ramakrishna monk swami-chetanananda).

## Places added
tantra-illuminated (Wallis), tantravimarsha (Alka Tyagi), the-movement-center (Chetanananda, Oregon), the-ashram-mount-eliza
(Shankarananda; safety record), jaya-kula (Shambhavi, Portland), heart-of-consciousness (Khecaranatha: Nityakash Maui + Rudrakash
Richmond), blue-throat-yoga (Muller-Ortega), daniel-odier-seminars (itinerant, Europe), parabhairavayoga (Pradīpaka), trika-in
(Amitabh Ji, Bengaluru), kashmir-shaivism-school-of-yoga (Dharamsala).

## Lineage graph after merge
Classical: Vasugupta → Kallaṭa (teacher_of, promoted from studied_with); Somānanda → Utpaladeva → Lakṣmaṇagupta → Abhinavagupta →
Kṣemarāja (already present); Śambhunātha → Abhinavagupta; Bhūtirāja → Abhinavagupta; Kṣemarāja → Yogarāja (studied_with, traditional).
Modern: Manakak → Swami Ram → Mahtab Kak → Lakshmanjoo (Razdan studied_with) → John Hughes, Denise Hughes, George Barselaar,
Dyczkowski, Silburn, Bäumer (now high) [+ Jaideva Singh, Padoux medium, unchanged]. Academic: Bansat-Boudon → Ratié (PhD), Sanderson →
Ratié (studied_with), K.C. Pandey → Rastogi. Nityananda line: Nityananda → Rudi; Muktananda → Rudi; Rudi → Chetanananda, Khecaranatha.

## Held / not published (unverified or judgment calls)
- Vasugupta → Somānanda: not added (the sources read do not make Somānanda his pupil; ipvv's note is a lineage convention).
- Lakshmanjoo → Raniero Gnoli / Rameshwar Jha / Jaideva Singh: Wikipedia lists them as visitors with "citation needed"; Gnoli has no edge,
  existing Jaideva Singh medium edge unchanged.
- Jankinath Kaul "Kamal", Pran Nath Kaul, Ramakant Angiras, Prabha Devi: ishwarashram.in returned HTTP 500; not added.
- Torella's birth year and K.C. Pandey's dates: no fetched page stated them; left blank.
- Bhāskara, Maheśvarānanda, Sāhib Kaul, Induraja, Vāmanātha: candidates, not researched this round.
- Fireflies Intercultural Centre (Bangalore) and Swami Rama Sadhaka Grama (Rishikesh): venues of Bäumer's seminars, recorded in the
  Samvidalaya programme, not as Trika places (tagging an interfaith ashram as Kashmir Shaivism would overclaim).
- Igor Kufayev, Éric Baret circles: not checked this round.
- Swami Shankarananda: person-level safety record (which would hold his talks from the lens/gold) left to the owner; place record added.
- The Movement Center's own schema.org still gives a Portland street address while its footer gives a PO Box in Wedderburn, OR, and
  Chetanananda sits in Gold Beach; the contact block shows what the site publishes.
- Medium confidence: trika-in, parabhairavayoga, kashmir-shaivism-school-of-yoga (self-described lineages), shivopadhyaya (no date).
