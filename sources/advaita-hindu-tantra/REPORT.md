# Sourcing report: advaita-hindu-tantra (overnight 2026-10-20)

Done under work/wiser/sources/SPEC.md. Everything is written to this folder only. Nothing in app/ was touched, nothing was deployed, nothing was downloaded, nothing was bought.

## Result
- **candidates.json**: **307 clips** from 12 official channels, about 50 hours in total. All are whole, naturally short uploads between 60 s and 1200 s. There are no virtual clips (see "Failures").
  - Every clip passed an embed check on 2026-10-20: oEmbed returned 200, the /embed page status was OK, and playableInEmbed was true.
  - All 307 are horizontal. Bands: 195 mid (>420 s) and 112 short (≤420 s).
  - Each clip has 1–4 topics, given as `[topic, conf, src]` in tags.topics. Sources are title 0.9, desc (search-row description snippet) 0.7, search (found by an in-channel topic search, used only when nothing else matched) 0.5, and rule 0.5.
  - Fields added beyond the clips.json shape: `channelId`, `publishedApprox` (YouTube's relative "N yr ago"), and `embed{}`. `published` is null for every clip because exact upload dates could not be fetched (watch and /shorts pages were blocked). `year` is estimated from publishedApprox.
- **people-additions.json**: 52 entries (speakers and figures, each with a bio and works).
  - 9 entries have `existing:true`. They are already in people.json (Ramana, Nisargadatta, Ramakrishna, Vivekananda, Yogananda, Babaji, Lahiri, Abhinavagupta, Shiva Sutras) and should be merged as a union of works, aliases and channels.
  - Wikidata ids were checked with wbsearchentities. They are null where no clean item exists (Tadatmananda, Wallis, minor monastics and devotees). David Godman's item Q5234180 is described as "Indian sage", so it was left unverified and null.
- **traditions-additions.json**: 3 new lineage nodes.
  - `direct-path` (under advaita): Atmananda, Jean Klein, Lucille, Spira.
  - `arsha-vidya` (under advaita): Swami Dayananda, Tadatmananda.
  - `modern-nondual` (under independent): Adyashanti.
- **edges-additions.json**: 24 edges. They cover Ramana→Papaji→Mooji, Klein→Lucille→Spira, Babaji→Lahiri→Yukteswar→Yogananda→SRF monastics, Dayananda→Tadatmananda, Abhinavagupta→Lakshmanjoo→Wallis, and others.
- **topics-additions.json**: 11 proposed nodes.
  - New roots: `consciousness`, `reality`, `guru`.
  - New leaves: `consciousness/states`, `reality/maya`, `faith/bhakti`, `faith/grace`, `self/self-enquiry`, `meditation/mantra`, `meditation/kriya`, `kamma/karma-yoga`.
  - **candidates.json already uses these ids**, so merge topics-additions into schema/topics.json before importing.
- **long-candidates.json** (internal work list, not candidates): 72 official talks longer than 20 minutes, up to 6 per channel. Each one names a rare figure in its title, or has a priority topic in its title. They are worth cutting into virtual clips once transcripts work. Their embeddability has not been checked yet.

## Counts per teacher (clips | top topic roots)
| teacher | clips | topics |
|---|---|---|
| Swami Sarvapriyananda | 54 | reality 18, kamma 12, faith 12, self 11, consciousness 11 |
| Rupert Spira | 44 | consciousness 17, death 16, meditation 13, dukkha 13, awakening 12 |
| Swami Tadatmananda | 26 | reality 14, awakening 6, meditation 5, kamma 5, death 4 |
| Mooji | 24 | self 11, consciousness 8, meditation 7, awakening 6, faith 5 |
| Christopher Wallis (Hareesh) | 22 | meditation 12, consciousness 4, emotions 3, faith 3, guru 3 |
| Francis Lucille | 22 | reality 8, consciousness 7, awakening 6, self 6, meditation 5 |
| Swami Lakshmanjoo | 22 | faith 11, guru 9, meditation 7, consciousness 7, reality 5 |
| Adyashanti | 22 | meditation 8, thought 5, awakening 5, faith 5, consciousness 4 |
| David Godman | 13 | self 6, faith 5, meditation 3, death 3, reality 3 |
| Brother Chidananda | 11 | meditation 8, emotions 3, awakening 3, faith 3, self 2 |
| Sri Mrinalini Mata | 7 | meditation 3, faith 2, guru 2, kamma 1, thought 1 |
| Swami Sarvadevananda | 6 | awakening 2, dukkha 1, self 1, guru 1, kindness 1 |
| Swami Mahayogananda | 4 | meditation 2, faith 1, rebirth 1, awakening 1 |
| Swami Satyamayananda | 3 | meditation 1, guru 1, reality 1, consciousness 1, craving 1 |
| Dr. Venkat S. Ramanan | 3 | faith 2, self 1 |
| Brother Anandamoy | 2 | kamma 1, meditation 1, kindness 1, guru 1 |
| Brother Bhumananda | 2 | meditation 2, consciousness 2, thought 1 |
| Ramana Maharshi (archival footage) | 2 | guru 1, self 1 |
| Pravrajika Vidyaprana | 2 | self 1, faith 1 |
| Brother Satyananda | 1 | meditation 1 |
| Dr. Santa Ramachandran | 1 | faith 1 |
| Mangalam Kalyanam | 1 | relationships 1, faith 1 |
| Dhiruben Patel | 1 | faith 1 |
| Swami Vedarupananda | 1 | awakening 1, consciousness 1 |
| Brother Prafullananda | 1 | kamma 1, right-view 1 |
| Sister Usha | 1 | kindness 1, relationships 1, consciousness 1 |
| Swami Atmavidyananda | 1 | consciousness 1 |
| Sri Daya Mata | 1 | daily-life 1, guru 1 |
| Brother Achalananda | 1 | meditation 1 |
| Aparna Krishnamoorthy | 1 | faith 1, consciousness 1 |
| Brother Kamalananda | 1 | emotions 2, meditation 1 |
| Ganapathi Raman | 1 | faith 1 |
| Swami Atmaghanananda | 1 | kindness 1, faith 1 |
| Sethulakshmi | 1 | dukkha 1, self 1 |
| Sri Nochur Venkataraman | 1 | guru 1 |

Teacher cap: Sarvapriyananda is the largest at 54, under the ~60 cap.

## Counts per topic root (clip mentions | leaves)
| topic | clips | leaves |
|---|---|---|
| meditation | 88 | meditation/guided 12, meditation/breath 5, meditation/kriya 16, meditation/mantra 10 |
| consciousness | 70 | consciousness/states 3 |
| reality | 63 | reality/maya 11 |
| self | 62 | self/self-enquiry 25 |
| faith | 61 | faith/grace 19, faith/bhakti 35 |
| awakening | 54 |  |
| death | 40 |  |
| guru | 34 |  |
| dukkha | 31 |  |
| kamma | 31 | kamma/karma-yoga 5 |
| emotions | 29 | emotions/fear 8, emotions/sadness 8, emotions/anger 2, emotions/boredom 2 |
| thought | 18 |  |
| rebirth | 13 |  |
| relationships | 12 |  |
| kindness | 11 |  |
| feeling | 10 |  |
| right-view | 8 |  |
| craving | 7 | craving/sensuality 1 |
| daily-life | 5 |  |
| impermanence | 3 |  |
| defilements | 2 |  |

Cross-tradition priority topics, by number of clips: meditation 88, consciousness 70, self 62 (self-enquiry 25), faith/devotion 61 (bhakti 35, grace 19), awakening 54, death 40, guru 34, suffering 31, karma 31, rebirth 13. Rebirth is the thinnest because few short official clips deal with it. Rupert Spira and the VSNY/VSSC Q&As carry most of it.

## Figures linked (clips naming them in title or description)
ramana-maharshi 18 (2 are Sri Ramanasramam archival or film clips with speaker=ramana-maharshi), paramahansa-yogananda 18, bhagavad-gita 14, vijnana-bhairava 8, abhinavagupta 6, ramakrishna 6, nisargadatta-maharaj 5, shiva-sutras 4, sarada-devi 2, swami-vivekananda 2, jesus 2, papaji 1, adi-shankara 1, mahavatar-babaji 1.

Gaps:
- **Vivekananda, Babaji, Lahiri and Yukteswar are thin in short clips.** On VSNY and VSSC, talks about them are mostly 1–2 hour lectures (see long-candidates.json). The SRF short uploads name Yogananda but rarely the earlier gurus.
- **Nisargadatta has no official estate channel.** No estate or official channel could be found. He is reached through talks on the teachers' own channels: David Godman (3), Rupert Spira (2) and Mooji.

## Channels used (all official: teacher, foundation, ashram, order or publisher)
| channel | id | clips | rights notes |
|---|---|---|---|
| Vedanta Society of New York | UCZOKv_xnTzyLD9RJmbBUV9Q | 54 | Ramakrishna Order; Swami Sarvapriyananda |
| Rupert Spira | UCxXWjjtATq3OM545gMh9PUg | 44 | teacher's own |
| Self-Realization Fellowship | UCqr3sDl5CzjQwOHiVLal4gQ | 28 | Yogananda's organisation; SRF monastics |
| ArshaBodha - Swami Tadatmananda | UC7i47784NqiOl244eGEJDew | 26 | Arsha Bodha Center (teacher's own) |
| Moojiji | UCpw2gh99XM6Mwsbksv0feEg | 24 | Mooji's official channel |
| Adyashanti | UCBj2I1l_ubQuWrdJV2Ns_Tg | 22 | Open Gate Sangha; **about 80% of uploads have embedding disabled** (oEmbed 401). Only embeddable ones were kept |
| Christopher Wallis (Hareesh) | UCpESGVz_4KaI3duvhfedf7g | 22 | teacher's own (Tantra Illuminated) |
| Francis Lucille | UCAYslZlNuBDD7FMvpjWLtoQ | 22 | teacher's own; 12 tagged uploads were not embeddable and were dropped |
| Lakshmanjoo Academy | UCKYC_hMs3JRWaM_dfi_BnxA | 22 | official archive and publisher of Swami Lakshmanjoo |
| Vedanta Society of Southern California | UCoeQClkDRaj9uABKHfHJUdw | 18 | Ramakrishna Order |
| David Godman | UCBcqQGNwcSEwlv6gJXP-U9A | 13 | author's own channel; talks about Ramana, Nisargadatta and Papaji |
| Sri Ramanasramam | UCeNlB-eW4MP1syhRGcYcEmA | 12 | official ashram channel; devotee interviews, president's talks, archival footage |

Belur Math (UCuv4AUvgAgut3zdiPmvG5Pw, official Ramakrishna Math & Mission) was enumerated, but **0 clips were kept**. Its short uploads are almost all ceremonies, music, or Bengali/Hindi speeches that could not be confirmed as English.

No fan re-uploads or compilation channels were used. Channels such as "Soul Spirit Self" and "Samaneri Jayasāra" showed up in search and were excluded.

## Method
1. **Enumerated channels.** Channel /videos tabs were listed with yt-dlp 2026.08.19 in flat-playlist mode (pip-upgraded; the system 2025.04.30 build is broken). Pages stop at about 10, hitting HTTP 403 on the API, so listings cap at about 300–450 per channel. Rupert Spira returned only 31 this way. This was supplemented by keyless in-channel searches: 13 channels × about 30 topic and figure queries, each returning title, length, views, a description snippet and an "ago" label. Pool size: 6,206 unique uploads.
2. **Filtered.** Kept 60–1200 s only. Dropped non-talks (chanting, bhajans, puja, celebrations, "In Focus" news, promos, book launches, course parts), Indic-script or non-English titles, uploads with no attributable speaker, and Ramanasramam uploads that are not talks or interviews. 1,071 rows were left after topic tagging and the embed check.
3. **Tagged topics.** topics.json kw regexes plus the additions were matched on the title and the description snippet. Buddhist-only cues that misfire here were switched off: kamma "intention/merit", awakening "freedom", self "identity", faith "god", mindfulness "awareness/attention" (non-dual "awareness" goes to consciousness), and feeling "body/pleasant/painful". Only the most specific node is kept.
4. **Selected.** Scoring weights priority topics, with extra weight on rebirth, karma, death, suffering and devotion, plus views and named figures. Each channel has a quota, each speaker is capped at 60, primary topics are spread within each teacher, and near-duplicate titles are removed. A figure-fill pass then swaps in clips naming under-covered figures.
5. **Checked embeds.** Ran tools/yt-meta.py embed on all 1,071 tagged rows (oEmbed plus /embed playability with a third-party Referer).

Scripts are in tools/: pool.py, pick.py, build.py, graph.py, longlist.py, chansearch.py, ytsearch.py and yt-meta.py (a copy of app/tools). Caches are in cache/ and raw/. Rerun with `python3 tools/pool.py && python3 tools/pick.py && python3 tools/build.py && python3 tools/graph.py`.

## Failures (stopped after two failures, as the spec says)
- **Transcripts.** `analyze_video` failed twice. The first attempt (BPwhIPFYcUY) timed out in transcription transport. The second (Su2b-OpNTlc) returned HTTP 429. The other fallbacks are also blocked from the sandbox: watch pages redirect to google.com/sorry, /shorts pages return 429 (so there are no full descriptions, chapters or exact dates), the timedtext endpoint returns empty, and yt-dlp single-video extraction gets 403. Following the spec, I stopped trying. **No transcripts were fetched, no virtual clips were made, and work/wiser/transcripts-internal/advaita-hindu-tantra/ is empty.** The candidates rely on naturally short official clips. long-candidates.json lists the long talks to cut once transcripts are reachable. Other sourcers in this workspace appear to be getting .srt files now, so a retry later may work.
- **Exact publish dates** are not available (see above). `published` is null and `year` comes from the relative "ago" label.

## Judgment calls to review
- Rupert Spira and Francis Lucille sit under a new `direct-path` lineage within advaita (region hindu). Adyashanti sits under independent/modern-nondual with a secondary tag of zen. Mooji is advaita.
- Lakshmanjoo Academy is treated as the official estate and publisher, so Swami Lakshmanjoo is role=speaker (archival recordings of him).
- 2 Sri Ramanasramam archival or film clips ("Bhagavan With Squirrel" and "Maharshi – The Journey") use speaker `ramana-maharshi`. His people entry stays role=figure.
- Minor SRF and VSSC monastics and Ramanasramam devotees have short generic bios based only on what their uploads show. Their wikidata is null.
- Texts (Shiva Sutras, Vijñāna Bhairava, Bhagavad Gita) are role=figure because the spec allows only speaker or figure. Each carries a note saying to treat it as kind=text.
