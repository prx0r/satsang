# Deep tradition pass: Tantra & Śaivism — REPORT (2026-10-20)

All output is in `sources/deep-tantra/`. Nothing was written to `app/`, `atlas/` or other `sources/` folders. Transcripts are kept internally in `transcripts-internal/deep-tantra/` (14 .srt files) and are never published.

## What is here

| File | Contents |
|---|---|
| `clips.json` | **1,827 rows**: 1,721 whole uploads plus **106 virtual clips** cut from 14 long scholarly lectures. Every row passed the embed check (oEmbed 200 + `playableInEmbed` true, checked 2026-10-20). All are **horizontal**; no vertical uploads got through (shorts under 60 s were excluded). Each row has orientation, duration, speaker, school (`tradition`, plus `traditions[]`) and 1–4 topics as `[topic, conf, src]`. |
| `long-lectures.json` | 146 talks over 60 min by scholars and teachers in scope. **These are lecture recordings only.** 142 are embeddable and 99 are on official or institutional channels. 14 of them were cut into virtual clips; the rest stay listed and uncut. |
| `people.json` | 77 people. **29 main** (8 or more clips), **21 "more voices"** (1–7 clips), and the rest graph-only (historical figures and supervisors). |
| `lineages.json` | 77 edges, each with a type, confidence and source URL. |
| `schools.json` | 17 school nodes (parent, dates, key figures, symbol) plus 9 organisations. |
| `texts.json` | 23 free, legitimate links (public domain, open access, or posted by the author or publisher), plus the gaps. |
| `practices.json` | 12 practices, each explained in our own words with a source clip or page. |
| `topics-additions.json` | 6 proposed topic leaves, plus the keyword overrides this pass needed. |
| `tools/` | Tools: `pick.py` (selection), `cap.py`, `segment.py` (TextTiling virtual clips), `build.py`, `meta.py`, `graphdata.py`, `config.py`. |

There are no duplicates. IDs already in `app/site/clips.json` or `app/clips.json` were excluded, which covers the earlier Wallis (22) and Lakshmanjoo Academy (22) uploads. 5 IDs also appear in `sources/deep-theravada-hindu/clips.json`, which another agent built concurrently. They are flagged on our rows as `alsoInGroups: ["deep-theravada-hindu"]`; keep one copy when merging.

## Counts per school (`tradition` on the row)

| School | Clips | Main voices |
|---|---|---|
| kashmir-shaivism (general) | 681 | Shambhavi, Kufayev, Wallis, Lakshmanjoo, Amitabh, Shankarananda, Bäumer, Khecaranatha, Muller-Ortega, Odier |
| shakta (Kālī / Kāmākhyā / Bhairavī) | 319 | Rajarshi Nandy, Sadhguru (Linga Bhairavi), Timalsina |
| sri-vidya | 239 | Amritananda/Devipuram, Tigunait, Om Swami, Brooks |
| shaiva-siddhanta | 133 | Bodhinatha, Subramuniyaswami (archival), Goodall |
| krama | 126 | Yamajit (Twelve Kālīs), Sanderson (virtual clips), Timalsina |
| trika | 102 | Wallis, Lakshmanjoo, Dyczkowski, Sanderson (Tantrāloka readings) |
| hatha | 79 | Mallinson, Birch, Seth Powell, Singleton |
| tantra-studies | 35 | Sanderson (life interview), Filip Holm |
| siddha-siddhanta (Nāth) | 26 | D.G. White (Sinister Yogis), Mallinson |
| pratyabhijna | 26 | Wallis, Lakshmanjoo, Timalsina |
| kaula | 26 | Odier, Timalsina, Hatley, Dehejia, Wernicke-Olesen |
| spanda | 23 | Kufayev, Lakshmanjoo, Wallis |
| vajrayana (Śaiva–Buddhist overlap) | 9 | Isaacson (virtual), Mallinson |
| pashupata | 4 | Diwakar Acharya, keyword hits only |

## Depth per speaker

The table shows clips (of which virtual) / long lectures listed / minutes on file.

**Main speakers (8 or more clips)**

| Speaker | Clips (virtual) | Long lectures | Minutes |
|---|---|---|---|
| Timalsina | 110 | 27 | 795 |
| Shambhavi Sarasvati | 110 | 0 | 1,236 |
| Rajarshi Nandy | 110 | 0 | 1,872 |
| Igor Kufayev | 110 | 0 | 1,692 |
| Christopher Wallis | 110 | 7 | 2,588 |
| Bodhinatha | 110 | 0 | 1,332 |
| Amritananda/Devipuram | 110 | 0 | 1,419 |
| Yamajit | 109 | 0 | 4,366 |
| Lakshmanjoo | 109 | 0 | 809 |
| Amitabh | 109 | 0 | 829 |
| Shankarananda | 107 | 0 | 877 |
| Tigunait | 95 | 0 | 534 |
| Bäumer | 78 | 0 | 2,622 |
| Khecaranatha | 77 | 0 | 403 |
| Sadhguru | 61 | 0 | 350 |
| Muller-Ortega | 51 | 0 | 388 |
| **Sanderson** | **42 (37)** | **12** | 578 |
| Odier | 26 | 0 | 487 |
| Om Swami | 19 | 0 | 222 |
| **Mallinson** | **17 (9)** | **13** | 418 |
| Filip Holm | 17 | 0 | 490 |
| **Birch** | **16 (12)** | **9** | 228 |
| **Flood** | **12 (8)** | **3** | 184 |
| **D.G. White** | **12 (8)** | **4** | 210 |
| Kempton | 11 | 11 | 383 |
| **Dyczkowski** | **11 (9)** | **7** | 168 |
| **Brooks** | **11 (7)** | **3** | 198 |
| Subramuniyaswami | 10 | 0 | 112 |
| **Goodall** | **8 (7)** | **3** | 105 |

The cap was 110 per speaker, so channels like Kauai (579 eligible), Kufayev (549) and Jaya Kula (411) have more depth available on request.

**More voices (fewer than 8 clips):** Seth Powell 6; Borkataky-Varma 5 (5 long); **Isaacson 5 (all virtual)**; **Biernacki 4 (all virtual, 3 long)**; Singleton 3 (5 long); Bryant 3; Debra Diamond 3; Bevilacqua 3 (5 long); **Hatley 2**; Mary Reilly Nichols 2; Éric Baret 2; Wernicke-Olesen 2; and 1 each for Dehejia, Newcombe, Lorin Roche, Chinnaiyan, **Sledge**, June McDaniel, Diwakar Acharya, Tompkins and Foxen.

## Where only lecture recordings exist

These scholars have **long lectures only**. They have no short official uploads, and the ≤60-min clips come only from my transcript cuts:

- **Sanderson.** He has no short talks anywhere official. The OCHS "Readings in the Tantrāloka I–XII" and "Śāktism among the Śaivas / outside Kashmir" run 60–110 min each. I cut 4 of them into 37 virtual clips: Tantrāloka I, Śāktism pt 2 and pt 3, and the Wallis interview "A Life of Learning". **Tantrāloka II–VIII and IX–XII are still uncut.** The transcript service returned 429 rate-limit errors when called in parallel, and the last two calls failed, so I stopped there.
- **Dyczkowski.** Only BHU, INDICA, Sacred Earth and SAND lectures exist; I cut one BHU Tantrāloka lecture. He has no channel of his own.
- **Goodall, Isaacson, Biernacki, Flood (Netra-tantra), Hatley, Wernicke-Olesen, Torella, Hanneder.** These are conference or institutional lectures (OCHS, SOAS CYS, Vimarsha). Goodall, Isaacson, Biernacki and Flood are partly cut.
- **Mallinson, Birch and Singleton.** Their material is mostly 60–110 min podcasts (Yogic Studies, Keen on Yoga, Embodied Philosophy) and SOAS lectures. Some 15–35 min pieces exist and are in `clips.json`.
- **Ben Williams and Somadeva Vasudeva.** Long podcast interviews only, so they are graph-only for now. Vasudeva's one hit is on a non-official podcast (The Arnava Show).
- **No video found at all:** Törzsök, Csaba Kiss and Padoux in English (Padoux's are French or absent), **Silburn and Jaideva Singh (both deceased, no recordings), Péter-Dániel Szántó, Nina Mirnig, Alex Watson and Peter Bisschop.**

The virtual-clip titles are machine-made ("<lecture> — part n of N", plus `segKeywords`) and flagged `segTitleAuto: true`. **An editor should rename them before publishing.** Segments are 6–18 min and cut at lexical-cohesion minima. Segments that were pure conference housekeeping were dropped, and Q&A segments are flagged `qa: true`.

## Verified academic lineages (summary)

These are in `lineages.json`, each with a source:

- **Sanderson supervised** Goodall, Törzsök, Mallinson, Birch and Csaba Kiss (all high confidence). For Vasudeva the link is **low confidence and unverified**; no source read today names his supervisor.
- **Not Sanderson's students:**
  - Hatley was supervised by Isaacson (Penn 2007).
  - Isaacson was supervised by Vetter at Leiden; Sanderson is recorded as an "influenced" edge via his Oxford postdoc.
  - Wallis was supervised by Goldman and von Rospatt (Berkeley 2014); Sanderson is "influenced", high confidence.
  - Dyczkowski was supervised by Gombrich; Sanderson "guided" his research, recorded as influenced.
  - Singleton was supervised by De Michelis.
  - Silburn was supervised by Renou.
- **Teacher lines:**
  - Lakshmanjoo taught Dyczkowski (initiated 1976), Silburn, Padoux, Sanderson, Bäumer and Jaideva Singh. Some of these are medium confidence.
  - Muktananda taught Kempton (Swami Durgananda, 1982) and Shankarananda.
  - Sundaramoorthy taught Brooks; Anandamayi Ma taught Shambhavi.
  - Yogaswami taught Subramuniyaswami, who taught Bodhinatha.
  - Swami Rama taught Tigunait; Rudi taught Khecaranatha.
  - Somānanda taught Utpaladeva, who taught Lakṣmaṇagupta.
- **D.G. White's PhD advisor was not confirmed.** He is held only as an "influenced" placeholder.

## Officialness judgements

- **Kept as official** (own or organisation channels): Rajarshi Nandy, Om Swami, Igor Kufayev, Tridevi Chamunda Mandir (Yamajit), Trika School of Tantra (Amitabh; lineage unverified), Vimarsha Foundation (Timalsina's own), Himalayan Institute, Heart of Consciousness and Daniel Odier.
- **Flagged:** the "Swami Lakshman Joo" Delhi channel (UCy5lVhjiaB5PTX_bmF9WPpg). Its provenance is unverified, so its 18 rows have `carrier: devotee-archive?`. Drop them if the rule is strict.
- **Not used:** Vishudha Avatar Baba, plus the exclusions listed in the brief.
- **Bhairavi Sadhana** is Isha's Linga Bhairavi practice. Sadhguru's channel was filtered to Bhairavi, Devi and sādhana titles only.

## Gaps and caveats

1. **Vajrayāna origins are thin** (9 rows). The Shaiva–Buddhist overlap is mainly in the Isaacson OCHS cut and in Mallinson's Amṛtasiddhi and early-haṭha clips. More is needed:
   - Szántó and Dalton talks were not found on official channels.
   - Sanderson's "Śaiva Age" lecture was not found as video.
2. **Pāśupata has 4 rows**, and only keyword hits. It needs a targeted search (Bisschop, Acharya on the Pāśupatasūtra).
3. **ESOTERICA** (Sledge) has almost no Indic tantra content. Only 1 clip qualifies after filtering out Western alchemy.
4. **Free English translations** of the Vijñāna Bhairava, Spanda, Pratyabhijñāhṛdayam and Tantrāloka do not exist legitimately. Only the Sanskrit KSTS scans are free.
5. **Topic tagging** comes from keywords on titles and snippets (conf 0.9 for title, 0.7 for description) and on transcripts for virtual clips (0.6, needing at least 4 hits). Six new leaves are proposed in `topics-additions.json`. Without them, many rows would fall back to `consciousness` or `divine/goddess` at conf 0.4 (`src: rule`).
6. **`year`** is approximate, derived from YouTube's "N years ago". `published` is null because watch pages are blocked (429/403).
7. **Language:** Hindi and Devanagari titles were dropped. Rajarshi Nandy and Om Swami carry lang confidence 0.6 because some talks mix in Hindi. French Odier uploads were dropped.
8. **Speaker attribution:** 1,312 rows are `speakerFrom: channel-default`. Kauai and Devipuram uploads occasionally feature other monks or speakers (e.g. Sundari Amma), so spot-check before featuring.

## Loops stopped (rule: more than twice → move on)

- **Transcript fetch:** 5 parallel calls returned 429, then 2 sequential calls failed with "history changed". I stopped at 14 transcripts.
- **Single-video yt-dlp metadata** stayed blocked (429/403). I used flat listings and oEmbed instead.
