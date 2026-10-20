# deep-theravada-hindu: deep tradition pass (2026-10-20)

Everything here was written only to `work/wiser/sources/deep-theravada-hindu/`. `app/`, `atlas/` and the other source folders were not touched (they were read only, to avoid duplicates). Nothing was bought, no accounts were created and nothing was downloaded except metadata.

## Result
- **clips.json: 2,574 clips** from 49 official channels, about 1,270 hours in total. **75 speakers, 66 of them in the main set (8 or more clips each).**
  - Dedup: none of the clips are already in `app/clips.json`, `app/site/clips.json` or any other `sources/*/candidates.json`. 122 overlapping ids were removed.
  - Embed check: every clip passed on 2026-10-20 (oEmbed 200 plus `/embed` `playableInEmbed: true`, with a third-party Referer).
  - Orientation: all clips are horizontal, verified from oEmbed width and height. Uploads under 60 s (which includes Shorts) were excluded up front.
- **Length:** 588 short (≤7 min), 677 mid (7–30 min), 1,316 long (30–60 min).
  - Every row is a **whole talk of 60 min or less** (`wholeTalk: true`), as DEEP-SPEC allows.
  - There are **no virtual clips** in this pass. No chapters or timestamps could be read without a key, and transcripts were not attempted, given the other groups' `analyze_video` 429s. Rows over 20 min carry a `note` saying so.
  - Selection favoured 3–20 min talks wherever a speaker had enough of them.
- **people.json**
  - `main`: 66 speakers, each with role (teacher or scholar), school, years, a short bio in my own words, site, wikidata, clip_count and channels.
  - `more_voices`: 9 speakers with fewer than 8 clips, kept as the spec asks.
  - `figures`: 16 lineage figures needed by the edges.
- **lineages.json**: 75 edges, including 4 `academic_supervisor_of` (see below). Each edge has a source URL and a confidence.
- **schools.json**: a 27-node sub-school tree with clip counts and a suggested symbol for each node.
- **texts.json**: 28 free, legitimate links, each with a `linkCheck` result.
- **practices.json**: 15 practices, each with a short how-to in my own words and a source.

**Row shape:** clips follow the `app/clips.json` row, plus these fields:
- `school` and `schoolLabel`: the new sub-school.
- `orientation` and `orientationFrom`.
- `channelId`.
- `wholeTalk`, `embed{}` and `note`.

`tradition` is always an **existing** app node (thai-forest, burmese, goenka-vipassana, early-suttas, insight, ramakrishna-order, arsha-vidya, advaita, divine-life-society, theravada, hindu, buddhism). The finer school sits in `school` and in `traditions[]`, so a merge does not break if the new nodes are not imported.

## Counts per school
- **Ajahn Chah line (Wat Nong Pah Pong)** (`chah-line`): 892 clips
- **Dhammayut forest line (Ajahn Mun → Maha Boowa / Ajaan Lee)** (`mun-boowa-line`): 60 clips
- **Mahasi method (noting)** (`mahasi`): 125 clips
- **Pa-Auk (samatha-first, Abhidhamma)** (`pa-auk`): 0 clips
- **U Ba Khin / Goenka vipassanā** (`goenka-vipassana`): 37 clips
- **Mogok Sayadaw (dependent origination)** (`mogok`): 0 clips
- **Shwe Oo Min (natural awareness)** (`shwe-oo-min`): 60 clips
- **Sri Lankan Theravāda (forest & scholastic)** (`sri-lankan`): 60 clips
- **Early-Buddhism (sutta-centred)** (`early-suttas`): 93 clips
- **Insight Meditation (Western vipassanā)** (`insight`): 132 clips
- **Buddhist studies (academic)** (`buddhist-studies`): 11 clips
- **Ramakrishna Order / Vedanta Societies** (`ramakrishna-order`): 468 clips
- **Chinmaya Mission** (`chinmaya-mission`): 154 clips
- **Arsha Vidya (Swami Dayananda line)** (`arsha-vidya`): 165 clips
- **Sivananda Yoga Vedanta Centres** (`sivananda-yoga`): 209 clips
- **Bihar School of Yoga (Satyananda Yoga)** (`bihar-yoga`): 8 clips
- **Krishnamacharya line (Viniyoga / KYM)** (`krishnamacharya-yoga`): 5 clips
- **Gaudiya Vaishnava (Chaitanya / ISKCON)** (`gaudiya`): 60 clips
- **Hindu studies (academic)** (`hindu-studies`): 35 clips

## Depth per speaker (clips | ≤20 min | 20–60 min | hours | clips with ≥1 topic | channels)
| speaker | school | clips | ≤20m | 20–60m | h | topics | channels |
|---|---|---|---|---|---|---|---|
| Swami Tadatmananda | arsha-vidya | 59 | 20 | 39 | 33.8 | 25 | ArshaBodha - Swami Tadatmananda |
| Swamini Svatmavidyananda | arsha-vidya | 54 | 9 | 45 | 29.0 | 52 | Arsha Vidya Pitham; Sivananda Ashram Yoga Retreat Bahamas; Svatmavidyananda Swaminiji |
| Swami Dayananda Saraswati | arsha-vidya | 20 | 2 | 18 | 14.8 | 5 | Arsha Vidya Pitham |
| Swami Tattvavidananda | arsha-vidya | 20 | 3 | 17 | 13.1 | 8 | Arsha Vidya Pitham |
| Swami Viditatmananda | arsha-vidya | 12 | 2 | 10 | 9.4 | 1 | Arsha Vidya Pitham |
| Swami Niranjanananda Saraswati | bihar-yoga | 8 | 6 | 2 | 1.9 | 2 | Bihar School of Yoga |
| Alexander Wynne | buddhist-studies | 7 | 3 | 4 | 3.8 | 2 | Oxford Centre for Buddhist Studies; WynneAlexander |
| Richard Gombrich | buddhist-studies | 2 | 1 | 1 | 0.9 | 1 | Oxford Centre for Buddhist Studies |
| Rupert Gethin | buddhist-studies | 1 | 0 | 1 | 1.0 | 1 | The Ho Center for Buddhist Studies at Stanford |
| Steven Collins | buddhist-studies | 1 | 0 | 1 | 0.3 | 1 | University of Chicago Center for Practical Wisdom |
| Ajahn Anan | chah-line | 60 | 60 | 0 | 16.4 | 60 | Ajahn Anan Dhamma |
| Ajahn Brahm | chah-line | 60 | 43 | 17 | 19.9 | 23 | Buddhist Society of Western Australia |
| Ajahn Chandako | chah-line | 60 | 45 | 15 | 14.2 | 33 | Ajahn Chandako |
| Ajahn Cunda | chah-line | 60 | 60 | 0 | 7.0 | 22 | Abhayagiri |
| Ajahn Karuṇadhammo | chah-line | 60 | 60 | 0 | 6.0 | 15 | Abhayagiri |
| Ajahn Ñāṇiko | chah-line | 60 | 60 | 0 | 8.9 | 42 | Abhayagiri |
| Ajahn Pasanno | chah-line | 60 | 57 | 3 | 8.2 | 18 | Abhayagiri; Amaravati Buddhist Monastery |
| Ajahn Sona | chah-line | 60 | 12 | 48 | 32.9 | 56 | Ajahn Sona |
| Ajahn Sudhīro | chah-line | 60 | 33 | 27 | 19.9 | 21 | Abhayagiri |
| Ajahn Sumedho | chah-line | 60 | 0 | 60 | 43.3 | 51 | Amaravati Buddhist Monastery |
| Ajahn Sucitto | chah-line | 59 | 1 | 58 | 45.8 | 25 | Abhayagiri; Amaravati Buddhist Monastery; Cittaviveka – Chithurst Buddhist Monastery |
| Ajahn Brahmali | chah-line | 52 | 2 | 50 | 41.1 | 39 | Buddhist Society of Western Australia |
| Ajahn Jayasaro | chah-line | 41 | 18 | 23 | 20.4 | 24 | Abhayagiri; ธรรมะ โดย พระอาจารย์ชยสาโร/ Dhamma by Ajahn Jayasaro |
| Ajahn Kalyano | chah-line | 41 | 3 | 38 | 25.8 | 26 | Ajahn Kalyano Dhamma |
| Ajahn Viradhammo | chah-line | 24 | 10 | 14 | 11.2 | 6 | Cittaviveka – Chithurst Buddhist Monastery; Tisarana Buddhist Monastery |
| Ajahn Hasapanna | chah-line | 21 | 2 | 19 | 16.1 | 16 | Buddhist Society of Western Australia |
| Ajahn Ahiṃsako | chah-line | 20 | 1 | 19 | 12.0 | 5 | Cittaviveka – Chithurst Buddhist Monastery |
| Ajahn Amaro | chah-line | 20 | 1 | 19 | 15.9 | 4 | Abhayagiri; Amaravati Buddhist Monastery |
| Ajahn Karuniko | chah-line | 12 | 0 | 12 | 7.6 | 3 | Cittaviveka – Chithurst Buddhist Monastery |
| Ajahn Dtun | chah-line | 2 | 0 | 2 | 1.3 | 0 | วัดบุญญาวาส Watboonyawad - Official |
| Swami Chinmayananda | chinmaya-mission | 60 | 60 | 0 | 4.4 | 48 | ChinmayaChannel |
| Swami Swaroopananda (Chinmaya Mission) | chinmaya-mission | 60 | 50 | 10 | 7.4 | 21 | ChinmayaChannel |
| Swami Tejomayananda | chinmaya-mission | 34 | 11 | 23 | 13.5 | 28 | ChinmayaChannel |
| Bhikkhu Bodhi | early-suttas | 40 | 17 | 23 | 18.9 | 31 | Abhayagiri; BAUS Chuang Yen Monastery; Wisdom Publications Inc. |
| Bhikkhu Anālayo | early-suttas | 38 | 17 | 21 | 15.6 | 31 | Barre Center for Buddhist Studies; Wisdom Publications Inc.; Āgama Research Group |
| Bhante Sujato | early-suttas | 15 | 0 | 15 | 11.1 | 12 | Buddhist Society of Western Australia |
| Radhanath Swami | gaudiya | 60 | 60 | 0 | 6.9 | 45 | His Holiness Radhanath Swami |
| S. N. Goenka | goenka-vipassana | 37 | 22 | 15 | 13.5 | 18 | Vipassana Meditation |
| Edwin Bryant | hindu-studies | 13 | 3 | 10 | 8.7 | 0 | Edwin Bryant Official; Sivananda Ashram Yoga Retreat Bahamas |
| Gavin Flood | hindu-studies | 8 | 3 | 5 | 4.2 | 4 | HDS Center for the Study of World Religions; Oxford Centre for Hindu Studies |
| Nicholas Sutton | hindu-studies | 7 | 1 | 6 | 4.8 | 1 | Oxford Centre for Hindu Studies |
| Jeffery D. Long | hindu-studies | 5 | 2 | 3 | 2.6 | 1 | Vedanta Society of New York |
| Wendy Doniger | hindu-studies | 2 | 0 | 2 | 1.8 | 1 | American Council of Learned Societies (ACLS); The University of Chicago |
| Joseph Goldstein | insight | 60 | 1 | 59 | 51.4 | 60 | Be Here Now Network |
| Tara Brach | insight | 60 | 60 | 0 | 12.7 | 60 | Tara Brach |
| Sharon Salzberg | insight | 12 | 6 | 6 | 3.8 | 10 | Insight Meditation Society |
| T. K. V. Desikachar | krishnamacharya-yoga | 5 | 1 | 4 | 3.5 | 1 | Krishnamacharya Yoga Mandiram |
| Sayadaw U Paṇḍita | mahasi | 48 | 1 | 47 | 27.3 | 23 | Tathagata Meditation Center |
| Sayadaw U Thuzana | mahasi | 43 | 6 | 37 | 17.3 | 32 | Tathagata Meditation Center |
| Sayadaw U Nandasiri | mahasi | 25 | 1 | 24 | 12.3 | 18 | Tathagata Meditation Center |
| Sayadaw U Sīlānanda | mahasi | 9 | 0 | 9 | 6.0 | 7 | Tathagata Meditation Center |
| Thanissaro Bhikkhu | mun-boowa-line | 60 | 60 | 0 | 11.4 | 60 | Dhamma Talks by Thanissaro Bhikkhu; Short Dhamma Talks by Thanissaro Bhikkhu |
| Swami Sarvadevananda | ramakrishna-order | 60 | 1 | 59 | 54.3 | 29 | Ramakrishna Monastery; Vedanta Society of Southern California |
| Swami Tyagananda | ramakrishna-order | 60 | 1 | 59 | 45.9 | 26 | Vedanta Society, Boston |
| Swami Vedarupananda | ramakrishna-order | 58 | 0 | 58 | 50.2 | 19 | Ramakrishna Monastery; Vedanta Society of Southern California |
| Swami Sarvapriyananda | ramakrishna-order | 49 | 7 | 42 | 37.4 | 29 | Sivananda Ashram Yoga Retreat Bahamas; Vedanta Society of New York; Vedanta Society of New York - Archives; Vedanta Society of Southern California; VedantaSTL |
| Swami Ishatmananda | ramakrishna-order | 37 | 1 | 36 | 30.4 | 6 | Chicago Vedanta |
| Swami Pavitrananda | ramakrishna-order | 31 | 0 | 31 | 22.8 | 7 | Vedanta Society of New York - Archives |
| Swami Mahayogananda | ramakrishna-order | 29 | 0 | 29 | 26.7 | 10 | Ramakrishna Monastery; Vedanta Society of Southern California |
| Swami Satyamayananda | ramakrishna-order | 27 | 0 | 27 | 21.5 | 12 | Vedanta Society of Southern California |
| Swami Dhyanayogananda | ramakrishna-order | 21 | 0 | 21 | 19.8 | 10 | Ramakrishna Monastery; Vedanta Society of Southern California |
| Swami Medhananda (Ayon Maharaj) | ramakrishna-order | 18 | 0 | 18 | 16.6 | 5 | Ramakrishna Monastery; Vedanta Society of Southern California |
| Pravrajika Vrajaprana | ramakrishna-order | 16 | 0 | 16 | 12.1 | 6 | Vedanta Society of Southern California |
| Swami Chetanananda | ramakrishna-order | 15 | 1 | 14 | 13.2 | 6 | VedantaSTL |
| Swami Tathagatananda | ramakrishna-order | 14 | 0 | 14 | 12.3 | 4 | Vedanta Society of New York - Archives |
| Pravrajika Krishnaprana | ramakrishna-order | 13 | 0 | 13 | 8.4 | 6 | Vedanta Society of Southern California |
| Swami Atmavidyananda | ramakrishna-order | 11 | 0 | 11 | 9.2 | 6 | Ramakrishna Monastery; Vedanta Society of Southern California |
| Swami Shivarchanananda | ramakrishna-order | 9 | 0 | 9 | 8.7 | 7 | VedantaSTL |
| Sayadaw U Tejaniya | shwe-oo-min | 60 | 60 | 0 | 6.9 | 41 | Sayadaw U Tejaniya |
| Swami Sitaramananda | sivananda-yoga | 60 | 18 | 42 | 35.2 | 20 | Sivananda Yoga Farm |
| Swami Swaroopananda (Sivananda) | sivananda-yoga | 54 | 47 | 7 | 10.5 | 25 | Sivananda Ashram Yoga Retreat Bahamas |
| Swami Paramananda (Sivananda) | sivananda-yoga | 42 | 25 | 17 | 14.4 | 9 | Sivananda Ashram Yoga Retreat Bahamas |
| Swami Shambhudevananda | sivananda-yoga | 28 | 2 | 26 | 15.8 | 20 | Sivananda Ashram Yoga Retreat Bahamas |
| Swami Brahmananda (Sivananda) | sivananda-yoga | 25 | 4 | 21 | 10.7 | 5 | Sivananda Ashram Yoga Retreat Bahamas |
| Bhante Gunaratana | sri-lankan | 60 | 5 | 55 | 42.9 | 51 | The Bhavana Society of West Virginia; Wisdom Publications Inc. |

The `more_voices` set (fewer than 8 usable official clips) is: Alexander Wynne 7, Nicholas Sutton 7, Jeffery D. Long 5, T. K. V. Desikachar 5, Ajahn Dtun 2, Richard Gombrich 2, Wendy Doniger 2, Rupert Gethin 1 and Steven Collins 1. Swami Niranjanananda (8) is just inside `main`.

## Channels and their official basis
All channels are the teacher's own, or belong to their monastery, order, foundation, publisher or host institution. Each channel's official basis is recorded in `tools/config.py` (`CH`).
- **Thai Forest:** BSWA, Amaravati, Abhayagiri, Cittaviveka, Tisarana, Ajahn Sona (Birken), dhammatalks.org (two channels), Wat Boonyawad (Official), Ajahn Anan Dhamma, Ajahn Chandako, Ajahn Kalyano Dhamma (medium confidence), Ajahn Jayasaro (English titles only).
  - watmarpjan.org links Ajahn Anan's channel directly. Wat Marp Jan's site also says the Friday talk and Q&A are Ajahn Anan's, so "Friday Dhamma" titles are attributed to him.
- **Burmese:**
  - Tathagata Meditation Center (Mahasi line; U Pandita, U Silananda, U Thuzana, U Nandasiri).
  - Vipassana Meditation (@vipassanameditation; dhamma.org video pages embed it; English titles only, and only titles naming Goenka or a discourse).
  - Sayadaw U Tejaniya (Wikidata Q7429084 lists this channel id; medium confidence. The buddhist group skipped it, and I accepted it on that evidence).
- **Sri Lankan / early suttas:**
  - Bhavana Society (Gunaratana).
  - BAUS Chuang Yen (Bhikkhu Bodhi's sutta classes).
  - Āgama Research Group, BCBS and Wisdom Publications (Anālayo, Bodhi).
- **Insight:** IMS, Tara Brach, and **Be Here Now Network** for Joseph Goldstein's *Insight Hour* (60 clips).
  - Flag: BHNN is the podcast's publisher, not Goldstein's own channel. The buddhist group excluded BHNN "to stay strict". Drop `carrier: publisher` rows if you want the strict reading.
- **Scholars:** OCBS (Gombrich), Stanford Ho Center (Gethin), UChicago Center for Practical Wisdom (Collins), UChicago and ACLS (Doniger), OCHS (Flood, Sutton), Edwin Bryant Official, and VSNY (Jeffery Long).
- **Ramakrishna Order:** VSNY plus its Archives channel, VSSC, Ramakrishna Monastery, Vedanta Society Boston, St. Louis and Chicago.
- **Chinmaya:** ChinmayaChannel. Hindi Ramcharitmanas/Kabir song series and music were excluded. Language confidence is set to 0.7 on these rows because some long Tejomayananda series may be partly Hindi.
- **Arsha Vidya:** Arsha Vidya Pitham (Rishikesh), Svatmavidyananda's channel, ArshaBodha.
- **Gaudiya:** His Holiness Radhanath Swami.
- **Yoga:** Sivananda Bahamas and Sivananda Yoga Farm, Bihar School of Yoga, KYM.

## Attribution rules (`tools/config.py`)
- Single-teacher channels default to that teacher.
- Multi-teacher channels need the teacher's name in the **title**. For OCBS and OCHS only, a search-result description snippet was also accepted (13 rows have `speakerFrom: desc`).
- Name clashes were split into separate ids:
  - `swami-swaroopananda-chinmaya` (head of the Chinmaya Mission) vs `swami-swaroopananda-sivananda` (Sivananda acharya).
  - The Sivananda Paramananda and Brahmananda are not the Ramakrishna-era swamis of the same names, and their Wikidata is left null for that reason.

## Scholarly lineages (first-class)
The `academic_supervisor_of` edges are each sourced to the thesis or an obituary:
- **Lance Cousins → Rupert Gethin** (Manchester PhD 1987; Gethin's own memorial essay).
- **Richard Gombrich → Steven Collins** (Oxford DPhil 1979; Gethin's JPTS obituary of Collins, and Paul Williams).
- **Richard Gombrich → Alexander Wynne** (Oxford DPhil 2003; the acknowledgements in *Origin of Buddhist Meditation*).
- **Daniel Ingalls → Wendy Doniger** (medium confidence; Wikipedia, not re-checked against the thesis).

Further edges:
- `influenced`: Gethin → Wynne and Paul Williams → Wynne (Bristol undergraduate teachers).
- `founded`: Gombrich → OCBS.

Not established (no reliable source found quickly, so these are left out rather than guessed): the doctoral supervisors of Gavin Flood, Edwin Bryant, Anantanand Rambachan, Jeffery Long and Bhikkhu Anālayo.

## Correction to the brief
**Ajahn Dtun** was ordained at Wat Nong Pah Pong with **Ajahn Chah as preceptor** (1978) and trained with Ajahn Piak and Ajahn Anan, so he is filed under `chah-line`, not the Mun / Maha Boowa line. Sources: Nigrodharama Forest Monastery, and Abhayagiri's edition of his autobiography. That leaves Thanissaro Bhikkhu as the only Dhammayut (Ajahn Mun → Ajaan Lee → Ajaan Fuang) voice with an official English catalogue.

## Gaps and honest notes
- **Rob Burbea / Hermes Amāra:** skipped. Still no official YouTube channel; the "Rob Burbea Talks" channel is unofficial, and Dharma Seed is CC BY-NC-ND.
- **Pa-Auk:** zero clips. The Pa-Auk Singapore channel is Ven. Janakābhivaṃsa's Pāli classes, partly in Chinese.
- **Mogok:** zero clips. The official channel is Burmese only.
- **Ñāṇananda:** his English "Nibbāna – The Mind Stilled" sermons sit on a "Katukurunde Nanananda Bhikkhu" channel. I could not tie it to seeingthroughthenet.net / Pothgulgala, so it was excluded. Backlog: confirm with Pothgulgala.
- **Nyanaponika / BPS:** there is no video. They are covered in texts.json and lineages.
- **Wat Pah Nanachat:** almost all uploads are Thai, so there are no English clips. Ajahn Jayasaro's English talks cover this monastery's line.
- **Maha Boowa line, other than Thanissaro:** no official English channel was found.
- **Scholars are thin (more_voices).** Gombrich, Gethin, Collins and Doniger each have only 1–2 official, embeddable uploads. Flood has 8, and only on OCHS. Bryant has 13: he has a deep catalogue, but most of it runs over 60 min. Rambachan had 0 on channels I could confirm as official; "Discourse on Hinduism" was not verified, so his hits there were dropped. Jeffery Long has 5, all on VSNY.
- **Topics:** 57% of clips have at least one topic. Flat channel listings carry no description, so tagging used titles only, with no forced defaults. Topic ids come from `app/schema/topics.json` v2, and no new topic ids were proposed.
- **Dates:** 29% have a year (from dates in the title, Thanissaro's yymmdd codes, Thai BE dates converted, or "N years ago"). `published` is set only where a full date was in the title.
- **Channel listings stop at about 200–500 entries.** This applies to VSNY, Chinmaya, Tara Brach and others: yt-dlp flat pagination ends early. In-channel search topped up scholars and Goldstein only.
- **Wikidata:** ids were checked by description. 25 lookups hit HTTP 429 twice and were left null (the spec allows moving on after two failures). Clashing hits were rejected, for example the Joseph Goldstein biochemist, the wrong Niranjanananda and Ajahn Chandako's "former monk" item.
- **Overlap:** the OCHS channel was also enumerated by the deep-tantra sourcer. I took only Flood and Sutton from it, and none of Sanderson's talks.

## Backlog (virtual cuts, once transcripts are reachable)
- Bhikkhu Bodhi's MN and AN classes (BAUS, 30–60 min parts).
- Joseph Goldstein's Insight Hour (about 55 min each; satipaṭṭhāna series).
- Bryant's long Yoga Sūtra and Bhāgavata lectures.
- Ajahn Sumedho's Amaravati talks (40–55 min).
- Sayadaw U Pandita's 2014–15 retreat days (TMC).
- Edwin Bryant at VSNY.

## Files
- **Deliverables:** `clips.json`, `people.json`, `lineages.json`, `texts.json`, `practices.json`, `schools.json`, `REPORT.md`.
- **Tools:** `tools/` contains `config.py` (channels and attribution), `pick.py` (pool → preselect), `build.py` (outputs), `peopledata.py` and `graphdata.py` (bios, edges, texts, practices), `chenum.py` (yt-dlp flat enumeration), `chsearch.py`, `schol.py`, `findch.py`, `yt-meta.py` (embed check) and `pylib/` (yt-dlp 2026.08.19, installed locally).
- **Metadata caches:** `raw/` and `cache/`.
- **Rerun:** `python3 tools/pool.py && python3 tools/pick.py && YT_META_DIR=cache/ytmeta python3 tools/yt-meta.py embed raw/presel_ids.txt 100 10 && python3 tools/build.py`.
