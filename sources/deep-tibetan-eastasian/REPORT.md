# Deep tradition pass: Tibetan and East Asian Buddhism (overnight 2026-10-20)

All output is in `work/wiser/sources/deep-tibetan-eastasian/`. Nothing was written to `app/`, `atlas/` or other `sources/` folders. The app's `app/site/clips.json` was only read, for de-duplication.

## Files
| file | contents |
|---|---|
| `clips.json` | **2155 clips**. All are YouTube, all passed oEmbed and the embed-playable check, and all are horizontal (orientation comes from the oEmbed size). Each row has the SPEC shape plus `school`, and is capped at 70 per speaker. None duplicate an id in `app/site/clips.json`. |
| `people.json` | 92 people (`people`), of whom 58 have 8 or more clips, plus a `more_voices` list of 34. Fields: role, tradition, school, years, own-words bio, official site, channels, clip_count, catalogue (counts of natural, whole and long talks found), existing_app_clips, wikidata. |
| `people-additions.json` | The same people in a flat, wisegraph-ready shape. |
| `lineages.json` = `edges-additions.json` | 79 edges: 43 `teacher_of`, 14 `academic_supervisor_of`, 15 `founded`, 4 `influenced`, 3 `translated`. Each has a source_url and a confidence (56 high, 23 medium). |
| `schools.json` | 40-node sub-school tree, with parent, dates, key figures, symbol, note and an `exists_in_wisegraph` flag. |
| `traditions-additions.json` | The 31 school nodes that wisegraph does not have yet. |
| `texts.json` | 24 free, legitimate sources: official sites, publisher-free translations and open university repositories. Pirate PDF hosts were deliberately left out. |
| `practices.json` | 21 how-tos in my own words, each with a source link. Practices that need empowerment or an introduction (Dzogchen, ajikan) are marked as orientation only. |
| `topics-additions.json` | 9 suggested topic leaves, such as meditation/dzogchen, faith/pure-land, reality/threefold-truth and awakening/buddha-nature. |
| `long-candidates.json` | 1384 talks over 60 minutes, kept as a backlog for cutting virtual clips. |
| `tools/` | The pipeline: chdisc, chenum, index, merge_search, speakers, pool, pick, ytmeta, build, meta_build, people_build, peopledata. |

## Counts per school (clips.json)
gelug 342 · nyingma 281 · kagyu 274 · soto-zen 265 · rinzai-zen 188 · sanbo-zen 136 · plum-village 91 · seon 81 · bon 80 · chan 80 · sakya 75 · tendai 70 · shingon 63 · rime 58 · jonang 51 · tiantai 16 · jodo-shinshu 2 · pure-land 1 · huayan 1

## Depth per speaker (new clips; the app already holds others)
- **70 (cap):** Dzogchen Ponlop, Ringu Tulku, Tenzin Wangyal (Bön), Brad Warner, Valerie Forstman, Shinge Roshi, Chigan Roshi, Jeffrey Hopkins, Lama Jampa Thaye (Sakya/Kagyu), Kwan Um School (channel), Tendai Buddhist Institute (channel)
- **40–69:** Thich Nhat Hanh 66, Dalai Lama 65, Henry Shukman 63, Shingon Foundation 62, Mingyur 60, Dzongsar Khyentse 58, Alan Wallace 57, Khentrul Rinpoche (Jonang) 51, Robert Thurman 50, Sheng Yen 50, Tsoknyi 48, Dzigar Kongtrul 48, Hokuto Sensei 48, Anne Klein 44, Thupten Jinpa 42
- **20–39:** Jundo Cohen 35, Tsultrim Allione 34, Chozen Bays 24, Pema Chödrön 22, Shunryu Suzuki 21, Meian Elbert 21, Jiryu Rutschman-Byler 21
- **8–19:** Anam Thubten 18, Phakchok 18, Lama Zopa 18, Guo Gu 18, David Germano 17, Barry Magid 17, Elizabeth Mattis Namgyel 14, Lama Lena 13, Shenpen Hookham 13, Phap Hai 13, Kokyo Henkel 13, Tenzin Palmo 12, Tulku Thondup 12, Lama Rod Owens 11, Lama Yeshe 11, Menri Trizin 10, Willa Blythe Baker 10, Jan Willis 10, Reb Anderson 10, Paul Swanson 10, Okumura 9, Halifax 9, Donald Lopez 9, Dae Bong 9, Duncan Williams 8
- **More voices (<8):** Berzin 7, Phap Huu 7, **Sharf 7**, Garchen 6, **van Schaik 6**, **Ziporyn 6**, **Samuel 4**, **Faure 4**, **Dalton 3**, Phap Linh 3, Habito 3, Cabezón 3, Asanga Vajra 3, Sakya Trizin 2, Daido Loori 2, Chan Duc 2, Seung Sahn 2, Gyatso 2, Heine 2, Leighton 2, Dosho Port 1, K. Tanaka 1, Hirota 1, P. Gregory 1, R. Payne 1, **McRae 1**, **C. Jones 1**, and 0 for Karmapa 17, Brunnhölzl, Sodargye, Chan Khong, Kjolhede, Blum and Foulk.

Of the named scholars, Jinpa, Thurman, Germano, Willis, Baker and Swanson reached 8 or more. Sharf, Ziporyn, Faure, van Schaik, Samuel, Dalton, McRae and Jones did not. Most of their public material is lectures over 60 minutes on university channels (see long-candidates), or there is very little of it.

## Scholarly lineages (verified)
Each edge was checked against a dissertation record, CV, acknowledgement or official obituary:
- Gómez → **Sharf** (Michigan 1991) and → Foulk (1987)
- Munro → **Ziporyn** (Michigan 1996)
- Weinstein → **McRae** (Yale 1983)
- Hérail → **Faure** (Paris 7, 1984). Yanagida Seizan influenced both McRae and Faure.
- Lopez → **Dalton** (Michigan 2002)
- Groner → **C. Jones** (Virginia 1996)
- Nagatomi → **Thurman** (Harvard 1972)
- Sopa → Hopkins (high), and Sopa → Cabezón and **Germano** (medium: they are named on Sopa's UW list of PhD students)
- Hopkins → Lopez and Klein (medium: the source says they graduated from his programme, not that he was the formal advisor)

Dharma ties: Wangyal → Thurman and Hopkins; Lama Yeshe → **Willis**; Lama Norlha and Kalu Rinpoche → **Willa Baker**; Rabten → Wallace. Translation ties: **Jinpa** and Hopkins → Dalai Lama.

**Not established:** PhD supervisors for Jinpa (Cambridge 1998), Samuel (Cambridge 1975), van Schaik (Manchester 2000), Willis (Columbia 1976), Swanson (Wisconsin 1985), Gyatso and Baker (Harvard 2013). None of these are guessed in the files.

## Gaps and caveats
1. **No virtual clips.** Watch-page fetches, which would supply chapters, descriptions and publish dates, were rate-limited (HTTP 429) for about 2195 ids. A yt-dlp retry also failed ("Failed to extract any player response"). I stopped after two tries, per the loop rule. As a result:
   - `published` and `year` are filled only where the title carries a date (564 of 2155).
   - Long talks are not cut; they are listed in `long-candidates.json`. Lama Lena (254), Thurman (173) and Allione (86) are the biggest pools.
   - Next step: clear the err files in `cache/ytmeta` and run a slow, paced chapter fetch.
2. **Topics are thin.** 761 clips (35%) have no topic. Tagging is title-only because descriptions and transcripts were unavailable. The keyword lists were extended with Tibetan and East Asian vocabulary (koan cases, teisho, Dzogchen, tathāgatagarbha, nembutsu and others). No topics were invented.
3. **Weak schools:** Pure Land and Shin (3 clips), Huayan (1) and Tiantai outside the Tendai Institute (16). Kenneth Tanaka, Charles Jones, Dennis Hirota and Mark Blum mostly appear in long IBS/BCA lectures. Ziporyn's Tiantai talks are few and long.
4. **Channel-level speakers.** `kwan-um-school`, `tendai-buddhist-institute` and `shingon-foundation` are channels, not people. Kwan Um mixes several Zen Masters, and Shingon includes Koyasan culture pieces. I filtered out off-topic titles (projection mapping, food culture, WWSF climate interviews, goma ritual footage, promos), but some mixed content remains. Splitting these into individual teachers needs descriptions.
5. **Excluded:**
   - Khenpo Sodargye's channel, which says it uses AI voice cloning and lip-sync.
   - Dharma Seed (licence).
   - Pirate PDF hosts for texts, such as the terebess McRae scan.
   - Karmapa content, which was mostly long and multilingual. The Karmapa Thaye Dorje (kibi) claimant was kept distinct and not attributed.
6. **Language.** 50 Sheng Yen GDD clips are tagged `zh` (Chinese audio). Everything else is English, by rule.
7. **Wikidata** is mostly null. The lookup was rate-limited after a few hits and I did not loop. Weak matches are flagged `unverified`: Ponlop, Ringu and Lama Lena returned the wrong entities, and `people-additions.json` drops them.
8. **Two dates to check.** The Columbia memorial page records Robert Thurman's death in June 2026. The 34th Menri Trizin is the current Bön head, not Lungtok Tenpai Nyima (d. 2017).
9. No transcripts were collected in this pass, so `transcripts-internal/` is empty. The `.srt` files appearing in `web/downloads/` belong to other agents.
10. 7 ids failed the embed check (401) and were dropped. 30 duplicates found at build time were dropped.
