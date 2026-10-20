# Deep pass: India study + living traditions (Trika, Nāth, Svara, Vedānta). REPORT, 2026-10-20

Everything is in `sources/deep-india-study/`. I did not write to `app/`, `atlas/`, `specs/`, `mcp/` or any other `sources/` folder. `tools/build.py` rebuilds every output from `tools/data_*.py`, `raw/` and `cache/` with no network access. Every record carries `source_url`, `verified_on: 2026-10-20` and a confidence level.

## ⚠️ Corrections to existing data (read first)
1. **Mark Dyczkowski died on 2 Feb 2025 in Varanasi.** `deep-tantra/people.json` still lists him as "b. 1951", as if he were alive. Sources: Brian Campbell on the INDOLOGY list (https://list.indology.info/pipermail/indology/2025-February/060196.html) and the obituary in the Journal of Dharma Studies (https://link.springer.com/article/10.1007/s42240-025-00218-y). His Tantrāloka translation was finished in 2024. His teaching continues online as the Anuttara Trika Kula Reading Circles, led by his students Arjun Seernels and Brian Campbell (since 5 Apr 2026).
2. **Who supervised Dyczkowski's PhD is disputed.** His official bio says his Oxford PhD was "under the guidance of Professor Alexis Sanderson", and Wikipedia and LibraryThing agree. `deep-tantra/lineages.json`, however, has `richard-gombrich → mark-dyczkowski academic_supervisor_of`. I added the Sanderson edge with high confidence and flagged the conflict. One of the two needs to be settled before either is published.
3. **Two domains no longer belong to the institutions.** `ltwa.net` is now an unrelated Thai site; the library is at tibetanlibrary.org. `trimbakeshwar.org` is a private puja-booking site, not the temple trust. For Kamakhya, the Devalaya's own site is **maakamakhya.org**, not kamakhyatemple.org.

## Outputs
| file | contents | count |
|---|---|---|
| `places.json` | Living places to study or practise. Shape follows places-uk, plus lineage, study, apply, contact, language, cost_notes, `upcoming[]` with `as_of`, and `alive{status,evidence}` | **41** (36 in India, 2 in Nepal, 3 sister/online bodies: AVG Saylorsburg, Lakshmanjoo Academy, nathas.org). 8 reuse existing app place ids, flagged `existing` |
| `resources.json` | Legitimate links only, each marked free, paid or mixed | **57** (37 free, 16 paid, 4 mixed or see page; Dyczkowski 16, Lakshmanjoo/IAT/Bäumer 9, digital libraries 5, Sanderson 4, Nāth 6, Svara 6, Arsha Vidya 9, other 2) |
| `people.json` | Living teachers, plus figures needed for lineage edges, plus count-only update rows for ids that already exist | **48** (43 authored records; 2 of them are updates to deep-tantra people: Dyczkowski, Bäumer) |
| `lineages.json` | Lineage, academic and founding edges, all sourced | **49** (founded 19, teacher_of 13, abbot_of 12, influenced 2, academic_supervisor_of 1, translated 1, teaches_at 1) |
| `clips.json` | Talks from official channels, 1–60 min, whole talks | **490** |
| `long-lectures.json` | Talks over 60 min: listed only, not cut | **271** |

### Alive status (41 places)
**alive 36 · unknown 5 · dormant 0**
- **Unknown:** IAT Delhi (weekly puja is described, but no dated programme), Devi Patan (no official site), Arsha Vijnana Gurukulam Nagpur (site fetch failed; listed in the Aug 2025 journal), BHU SVDV (the site is built in JavaScript and could not be read), Maharaja's Sanskrit College Mysore (Wikipedia only).
- **Partly dormant, noted inside "alive" records:** the Samvidalaya library in Varanasi has been "temporarily closed" since its 2023 notice, though Bäumer announced seminars for 2026. Anuttara Trika Kula continues only online since its founder died.

### Places by tradition
- **Trika / Kashmir Shaivism (7):** Ishwar Ashram Srinagar, Kashmir Shaiva Institute Jammu, IAT Delhi, Lakshmanjoo Academy, Anuttara Trika Kula, Samvidalaya/Bäumer, Muktabodha.
- **Nāth (6):** Gorakhnath Math, Yogi Mahasabha Haridwar, Kadri Jogi Mutt, Devi Patan, nathas.org, Trimbakeshwar.
- **Svara (1):** Swara Yoga Peeth (swarayoga.org).
- **Arsha Vidya (4):** Rishikesh (dayananda.org), Anaikatti, Nagpur, Saylorsburg.
- **Yoga (5):** BSY Munger, Kaivalyadhama, KYM, DLS Rishikesh, Ramanasramam.
- **Śrī Vidyā / Śākta (4):** Devipuram, Sringeri, CSU Sringeri campus, Kamakhya.
- **Sanskrit and research (8):** Sampurnanand, BHU, IFP, EFEO Pondicherry, Madras Sanskrit College, KSRI, Mysore; Muktabodha is counted above.
- **Buddhist (7):** LTWA, CIHTS Sarnath, Root Institute, Dhamma Bodhi, Dhamma Giri, Kopan, Rangjung Yeshe.

### Clips: depth per speaker
All 490 clips passed the embed check (oEmbed 200 and `playableInEmbed` true) and all are horizontal. 58 ids that already existed elsewhere in the project were removed. The cap was 110 per speaker.
- **Main (8 or more clips):** Swami Sadatmananda 110 (+24 long) · Yogi Matsyendranath 110 (+105 long) · KYM faculty 98 (institution) · Swami Charanashrit Giri 23 · Swami Dayananda (archival) 15 (+23) · Swamini Svatmavidyananda 14 (+13) · Swami Tattvavidananda 14 (+10) · Yogi Lakshminath 12 · Dr Venkat S. Ramanan 12 (+11) · Geshe Lhakdor 10 (+5) · Swami Muktatmananda 8 (+14) · Yogi Allamanath 8 · Swami Atmaswarupananda 8.
- **More voices:** O.P. Tiwari 7 · Sachidananda 6 · Santosh Pandey 6 · Vidhushekhara Bharati 5 · Viditatmananda 3 (+16 long) · Advayatmananda 3 · Pratyagbodhananda 3 · Shankarananda (AVG) 3 (+6) · Tenzin Gache 3 (+4) · and 6 others with 1–2.
- **Channels used**, each confirmed as linked from the official site unless noted: AVG Anaikatti (@avganaikatti), "Arsha Vidya Pitham" (youtube.com/c/ArshaVidyaGurukulam, linked from arshavidya.org; Saylorsburg content), NathaChannel, Swara Yoga Peeth, DLS HQ, LTWA, Sri Ramanasramam, Sringeri (@sharadapeetham), Root Institute.
  - Matched by channel name only: Kaivalyadhama, KYM, and the Ishwar Ashram Trust channel (2 talks, both over 60 min).
- **Caveats on the clips:**
  - The Anaikatti class videos carry no teacher name. I attributed them to the chief ācārya Swami Sadatmananda, marked `speakerFrom: inferred`.
  - NathaChannel is mostly in Russian (`tags.lang = ru`).
  - Topics come from title keywords; rows tagged `school-default` (conf 0.5) are weak.
  - No virtual clips were cut and no transcripts were taken.

## Gaps
- **Trika in India:** apart from the Ishwar Ashram Trust centres, I found no living Kashmir Śaiva teacher in Srinagar, Jammu or Varanasi with a dated public programme. Possible leads (IAT faculty such as Prof. Ramakant Angiras; Varanasi pandits) have no official pages. Dyczkowski has no official YouTube channel.
- **Nāth:** Gorakhnath Math advertises no course. Nāth akharas, Asthal Bohar, Nepal sites (Caughera, Gorakhnath cave at Gorkha) and Haridwar Nāth centres have no official web presence, so they are not listed. The Gorakhnath Mandir YouTube channel was skipped on purpose: it mixes the mahant's political office with temple content.
- **Svara:** swarayoga.org is the only svara-specific school found. The Bihar School of Yoga teaches svara too, but has no public video channel.
- **Arsha Vidya:** there is no official channel for Swami Paramarthananda (the auto-generated "Topic" channel was rejected). The Rishikesh ashram channel was not identified separately. Viditatmananda's talks are mostly over 60 min.
- **Rate limits:** YouTube returned 403 on long channel listings, so LTWA and Sringeri were harvested only 30 videos deep and DLS 90.
  - The Bihar School of Yoga, Muktabodha, IFP and Devipuram got no new clips (Devipuram is already in deep-tantra).
  - Unreachable today: alexissanderson.com and sarit.indology.info (502), and CIHTS's old domain cuts.ac.in.
- **Coordinates:** 4 places have none (two online bodies, nathas.org, LTWA, where the geocoder returned a wrong match). Many others are area-level from OpenStreetMap, labelled `osm-area (approximate)`.
- **Copyright:** archive.org, Scribd and pdfcoffee copies of Dyczkowski's SUNY and Indica books are not authorised, so they are excluded. The free Jñānapravāha copy of the Gītā Home Study is flagged with low confidence until permission is confirmed.

## Study paths (start online, then go to India)
**Trika / Kashmir Śaivism**
1. **Online:** start with the Lakshmanjoo Academy's free weekly sangha and its four-week "Meditation in Kashmir Shaivism" webinar. Add Dyczkowski's free lectures (the Heart Lecture, Locating Trika) and *The Doctrine of Vibration* (SUNY).
2. **Go deeper online:** join the Anuttara Trika Kula Reading Circles on the Tantrāloka, read Sanderson's free papers ("The Śaiva Age" on Zenodo; the OAPEN festschrift), and read the original texts in the Muktabodha e-text library.
3. **In India:** the Ishwar Ashram Trust residential retreat in Srinagar (Sept; ₹12,800 in 2025) or the Lakshmanjoo Academy retreat in Kashmir (27 Sep–8 Oct 2026, sold out). Bäumer's five-day text-and-meditation seminars are near Varanasi, Rishikesh or Srinagar. For Sanskrit, Sampurnanand or BHU in Varanasi; for manuscripts, IFP/EFEO Pondicherry.

**Nāth**
1. **Online:** Mallinson's "Nāth Saṃpradāya" (free PDF), the parampara and articles pages on nathas.org, and NathaChannel (in Russian, some English and French subtitles). Online courses with Yogi Lakshminath.
2. **With a teacher:** nathas.org seminars (Montreal 17–18 Oct 2026; France each summer), contact natha.seminar@gmail.com.
3. **In India:** darśan and daily aarti at the Gorakhnath Math in Gorakhpur (Makar Sankranti mela in January). Devi Patan in Tulsipur, seat of Matsyendranath's guru. Kadri Jogi Mutt in Mangaluru. Nāth akharas at the Haridwar Ardh Kumbh (Jan–Apr 2027) and the Nashik–Trimbakeshwar Simhastha (2027).
4. **Svara alongside:** swarayoga.org's free tools, then its Level I course, then Rishikesh in person.

**Vedānta (Arsha Vidya)**
1. **Online:** the AVG Anaikatti YouTube classes (Gītā, Vicāra Sāgara), the free articles on arshavidya.org/arshavidya.in, and the Sunday Gītā classes on the Saylorsburg channel. Swami Shankarananda's Zoom classes run through Anaikatti.
2. **Short residential:** a retreat at Anaikatti or Rishikesh, or the DLS two-month Yoga-Vedanta course (men who are Indian citizens only).
3. **Long residential:** Anaikatti's 108-day and one-year courses (next: 8 Jan–15 Mar 2027, applications closed 15 Sep 2026), or the Rishikesh 3-month and 3-year courses. Book only through dayananda.org: the ashram warns of a fraudulent look-alike site.

## Tools
- `tools/fetch.py`: cached page fetch.
- `tools/flat.py`: channel listings via yt-dlp 2026.8.19, installed locally in `tools/pylib`, metadata only.
- `tools/candidates.py`: speaker and topic rules.
- `tools/yt-meta.py embed`: embed check.
- `tools/geocode.py`: OpenStreetMap/Photon geocoding, cached.
- `tools/build.py`: builds all outputs.
- Caches are in `cache/` (html, yt/embed, geocode.json); raw listings are in `raw/flat/`.

No purchases, no accounts and no emails were made.
