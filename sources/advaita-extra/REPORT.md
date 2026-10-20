# Sourcing report: advaita-extra (overnight 2026-10-20)

**Ask:** "Nisargadatta has rare clips like the last satsang; also Anandamayi Ma is good."

This run follows work/wiser/sources/SPEC.md, with one exception the request approved: for **archival footage of Nisargadatta Maharaj and Anandamayi Ma** (neither has an estate channel with this footage), it uses the best embeddable long-standing archive uploads. Those rows are marked `carrier:'archive'`.

Everything was written only to this folder, plus internal transcripts in work/wiser/transcripts-internal/advaita-extra/. No media was downloaded, nothing was deployed and nothing was bought. app/ was not touched.

## Result
- **candidates.json: 79 clips**, about 12.1 hours in total.
  - 64 are whole uploads and 15 are virtual clips (`id = videoId@start`, plus `parent`, `start`, `end`, `segTitle` and `parentDur`).
  - Every clip passed the embed check on 2026-10-20: oEmbed returned 200, the /embed status was OK and playableInEmbed was true. All are horizontal.
  - 53 are `carrier:'archive'` and 26 are `carrier:'own'` (official teacher or publisher channels).
  - Bands: 51 mid and 28 short. Each clip has 1–2 topics. Sources are `title` 0.8 for whole uploads and `transcript` 0.8 for virtual clips cut from a transcript I read. The two Dehra Dun 1974 cuts are `title` 0.6.
  - Two `setting` values are used: `talk`, and **`footage`** (new) for darshan or event film where nobody is giving a talk (10 clips). If the app only knows `talk`, map `footage` to it or filter it out.
  - New optional fields:
    - `recorded`: the year the archival material was filmed, where the title gives one.
    - `subs:'en'`: Anandamayi Ma speaks Hindi or Bengali, with English subtitles burned into the video. Her rows have `tags.lang = ['hi', 0.75]`.
    - `note`: present on 5 rows that are slightly over 20 minutes or have an approximate cut.
- **Dedupe:** none of the 79 ids (or parent ids) are in advaita-hindu-tantra/candidates.json or app/clips.json. The Godman and Spira talks about Nisargadatta that the earlier run already holds (2Hw0QpKR3s8, M9wjuR5Z3oU, VPbqU9DBR3M, jFKht8MQRYU, rQPTwNhFC7E) were left out on purpose.
- **people-additions.json:** 16 entries.
  - `anandamayi-ma` (new) is a figure-and-speaker, with Wikidata Q433594, years 1896–1982, a bio, works (Matri Vani, Words of Sri Anandamayi Ma, Sad Vani, the Samyam Saptah recordings), aliases and archive channels.
  - Merges for `nisargadatta-maharaj` (existing, with kind figure-and-speaker, Jean Dunn's three books, Awaken to the Eternal, and channels) and `siddharameshwar-maharaj` (existing).
  - New speakers or figures: ramesh-balsekar (Q326591), gautam-sachdeva, wayne-liquorman, sri-ranjit-maharaj (Q18207386, unverified because the item has no description), stephen-wolinsky (Q125628687), s-k-mullarpattan, vanaja-narayanswamy, jean-dunn, atmananda-blanca-schlamm, swami-chidananda-saraswati (Q173262), swami-kedarnath, swami-vijayananda (Q111434982, labelled "Adolphe Weintrob", medium confidence) and shunyamurti.
  - Work years are null where I could not verify them.
- **edges-additions.json:** 15 edges. They cover Siddharameshwar→Ranjit, Nisargadatta→Ramesh / Jean Dunn / Wolinsky / Mullarpattan / Vanaja, Ramesh→Wayne Liquorman / Gautam Sachdeva, Anandamayi→Atmananda / Vijayananda (teacher_of), Anandamayi→Kedarnath / Chidananda (influenced), and Anandamayi→anandamayi-sangha (lineage_of). Siddharameshwar→Nisargadatta is already in app edges.json. One edge, Yogananda→Anandamayi (low), is flagged: it records a meeting, not an influence.
- **traditions-additions.json:** `anandamayi-sangha` (lineage under hindu) and `divine-life-society` (lineage under vedanta). Their Wikidata ids are null.
- **long-candidates.json:** 17 long or borderline uploads to cut later. Each has a reason, and the embed status where it was checked.
- **Topics:** these use the ids in app/schema/topics.json plus the advaita-hindu-tantra additions (consciousness, reality, guru, faith/bhakti, faith/grace, self/self-enquiry, reality/maya, meditation/mantra, consciousness/states). No new topic nodes were needed.

## Counts
| speaker | clips | of which virtual |
|---|---|---|
| Anandamayi Ma (archival) | 27 | 2 |
| Nisargadatta Maharaj (archival) | 19 | 10 |
| Gautam Sachdeva | 10 | – |
| Ramesh Balsekar | 4 | 3 |
| Wayne Liquorman | 4 | – |
| Sri Ranjit Maharaj | 3 | – |
| Stephen Wolinsky / S. K. Mullarpattan / Vanaja Narayanswamy (Rays of the Absolute) | 2 / 1 / 1 | – |
| Swami Chidananda / Swami Kedarnath / Swami Vijayananda | 2 / 2 / 2 | – |
| Atmananda (Blanca Schlamm) | 1 | – |
| Shunyamurti | 1 | – |

By figure, counting clips whose `figures` include them: Anandamayi Ma 35, Nisargadatta 34, Siddharameshwar 6, Ramesh 4 (plus 4 where he speaks), Yogananda 2, Jean Dunn 1, Mullarpattan 1, Swami Sivananda 1. `swami-sivananda` has no people entry yet; add a stub or drop it from `_JFnlzUynBc.figures`.

Topic roots (mentions): faith 34 (mostly bhakti), guru 25, self 15, meditation 13, awakening 9, reality 9, death 9, consciousness 9, kamma 4, rebirth 3, and a few others.

## The "last satsang" and other rare Nisargadatta film
- **The Eternal Satsang** (2DOY5B-PH2Y, 101 min) is on the **Sri Nisargadatta Ashram** channel (UCTDJhL2FtH2kgrOp2v9KjfQ). It was posted for his 32nd punyatithi.
  - This is the film that circulates as "The Lost Satsang" (1979–81). In it Maharaj gives the age of his body as 83, so it dates from his last year or two.
  - Fan re-uploads under the "Lost Satsang" title exist on Sabine NowHere, chad sexington and Михаил Медведев. They were **not** used, because the ashram's own upload is better.
  - I cut 6 virtual clips at speaker-turn boundaries, each 6–9.5 minutes: beingness and the idea of God; the Self needs no religion; "I am" arises in the womb; stabilise in "I am" first; death is certain; Parabrahman, his guru and 83 years like a dream.
- **"You Are Not – An Afternoon with Sri Nisargadatta Maharaj"** (Pzjz2QF2lRA, 35 min, John Richards). I cut 4 virtual clips from it.
- **Excerpts on Ashrams of India:** from The Lost Satsang ("Sai Baba is Parabrahman") and from Awaken to the Eternal (Diana Masson), plus a short clip of Jean Dunn.
- **Felix Wolf (Uzd0txiRN2E):** an abridged *Awaken to the Eternal* (20:31, 890k views). It is kept and flagged; see the review list.
- **His mahasamadhi**, 8 September 1981 (John Richards, 92ErlxH67Fo).
- **A Mumbai satsang from 1977** (byronevents).
- **Not found:** a separately titled "last satsang" film, i.e. footage dated after The Eternal Satsang. The Medicine of One "Final Talks" uploads are audiobook readings of Jean Dunn's books, not his voice, so they were excluded.

## Channel for each archival clip (carrier:'archive')
| channel | id | clips | what it is / rights note |
|---|---|---|---|
| SriRam108 | UCl54FZfyw83SY6tIpLKDTlw | 32 (27 Ma + 5 disciple interviews) | Devotee archive of Kankhal and Bhimpura ashram cine film and audio, uploading since about 2007. It is the main and often the only source of Ma's subtitled talks. It is not the Sangha's official channel. |
| Sri Nisargadatta Ashram | UCTDJhL2FtH2kgrOp2v9KjfQ | 6 (virtual, from The Eternal Satsang) | The ashram's own channel, so the closest thing to an estate upload. Marked archive per the request. |
| John Richards | UCMYJauGJNxNqjQr1vNckaOw | 6 (1 whole on death + mahasamadhi + 4 virtual) | Teacher in the Ramakant Maharaj / Inchegeri line who posts lineage archive films. |
| Ashrams of India | UCoIkCVGgxsLtTgJl5V3M9cA | 5 (3 Nisargadatta + 2 Ma: 1930s film, Yogananda's 1935 visit) | Archive project of the ashramsofindia.com site. It posts excerpts from published films and links the sources. |
| Felix Wolf | UCMY6Z7FVK32PKJwyHkPEH7Q | 1 | Large spiritual-film archive channel. The upload is an abridged cut of the Inner Directions film; review it. |
| SagesAndMystics | UCsLklmxD25Ak7TYEEh39ciA | 1 | Its description links NetiNetiFilms.com (the Prior to Consciousness film publisher). It is possibly the publisher's own channel, but this was not verified. |
| byronevents | UCuDficDVB5r4B96DyJzN_wQ | 1 | "Satsang in Mumbai 1977". Provenance is unknown; review it. |

## Official channels for talks about the figures (carrier:'own')
| channel | id | clips |
|---|---|---|
| Gautam Sachdeva | UCfKnLTpbPGq6egpaBmQrwdg | 10: Nisargadatta stories, 2 Siddharameshwar podcast episodes, 3 Ramesh pointers |
| Advaita Fellowship (advaita.org, Wayne Liquorman) | UCcFj1xr1KpwXpk_d5q8rdbg | 4 Wayne talks (Nisargadatta's anger, pointers, meeting Ramesh, divine hypnosis) + 3 virtual clips from Ramesh Balsekar's first video interview (3fByNIZWwm4) |
| Science and Nonduality | UCG9_3MP30-PDAMuEte8HUNw | 5 chapters of *Rays of the Absolute* (Mullarpattan, Siddharameshwar's samadhi, the Bombay centre, Vanaja, Ramesh) + "Prior to Being" (Nisargadatta audio, counted as archive) |
| Sri Ranjit Maharaj | UCNVv5lKoj8nIlfe05cz_22w | 3 (Brittany 1996–97). It links to sadguru.com and is probably official. |
| Sat Yoga Institute | UC9K9r4Wh9OO18BZP4KP9vGQ | 1: Shunyamurti reads Yogananda on Anandamayi Ma |

The official teacher channels had little else short and on-topic about Anandamayi Ma. VSNY, VSSC, SRF, Mooji, Rupert Spira, Lucille, ArshaBodha and Wallis were searched in-channel for Anandamayi and Nisargadatta. Mooji's "The Purest Truth" (22:29) is in long-candidates. Adyashanti's Nisargadatta short (olQPM2UF4H8) is "Video unavailable" in embed.

## Transcripts (internal only; nothing copied into candidates)
- Fetched with the deferred `analyze_video` tool and saved in work/wiser/transcripts-internal/advaita-extra/:
  - 2DOY5B-PH2Y (en)
  - Pzjz2QF2lRA (en)
  - 3fByNIZWwm4 (en-orig)
  - qpSJC2MIqZg (machine "en" from Hindi; unreliable)
  - ltXaLlAkoDQ (hi)
  - LwSGLWj7L3Q (nl; Dutch narration)
- The first batch hit HTTP 429 on 3 of 5 calls. The single retry of each succeeded, so no step failed twice.
- yt-dlp subtitle extraction failed (403, "no player response"). I did not retry it, because analyze_video worked.
- I had to re-install yt-dlp 2026.08.19 via pip (`python3 -m pip install -U yt-dlp`, a tool only and no media), because the sandbox's python3 had lost the module.
- Cut points snap to transcript cue starts at speaker turns. The Nisargadatta transcripts mix Marathi and English interpretation and are coarse (cues of about 30 s), so a boundary can land a few seconds into a sentence. Check them by ear before publishing.

## For review
1. **Archive carriers outside the request's preferred list:** Felix Wolf (abridged Inner Directions film), byronevents (1977 clip of unknown provenance) and SagesAndMystics (probably Neti Neti Films). Dropping all three leaves 76 clips.
2. **Disciple interviews on SriRam108** (Atmananda 1981, Swami Chidananda, Swami Kedarnath, Swami Vijayananda; 7 clips). The request's exception covered footage of Ma herself. I read these archival interviews with her direct disciples as within its spirit, but they are not on the speakers' own channels.
3. **Slightly over 20 minutes, kept whole:** ltXaLlAkoDQ (20:39, 435k views), eNW2R18miWc (20:35) and Uzd0txiRN2E (20:31).
4. **Dehra Dun 1974 cut:** the split at 881 s (qpSJC2MIqZg) is approximate because the Hindi transcript is unusable.
5. **Footage clips:** 10 have `setting:'footage'`, a new value.
6. **Language:** the Anandamayi rows are Hindi with burned-in English subtitles. The Nisargadatta rows are Marathi with live English interpretation (tagged en 0.7).
7. **Wikidata:** Ranjit Maharaj (Q18207386) and Vijayananda (Q111434982) should be confirmed. Wayne Liquorman, Gautam Sachdeva, Shunyamurti, Jean Dunn and Kedarnath have no clean item and are left null.
8. **Trimmed:** 8 lower-value picks were removed to stay within the 30–80 target. They are listed as `DROPPED` in tools/picks.py.

## Method and files
- Discovery: 53 keyless YouTube searches plus 90 in-channel searches (18 channels × 5 queries), and flat channel listings with yt-dlp for 12 channels. Caches are in cache/search/ and raw/chan/.
- Embed check and search-row metadata: tools/yt-meta.py (a copy of the app tool) in `embed` and `desc` modes. Cache: cache/cache/{embed,desc}/.
- Hand curation is in tools/picks.py. tools/build.py writes candidates.json, tools/graph.py writes the people, edges and traditions files, and tools/peek.py and tools/around.py are internal transcript helpers for choosing cut points.
- Rebuild with `python3 tools/build.py && python3 tools/graph.py`.
- `published` is null throughout. `year` is the upload year estimated from YouTube's "N yr ago". `recorded` is the year of the archival material where the title gives it.
