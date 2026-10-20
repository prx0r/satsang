# Teacher-depth pass (teachers-deep, 2026-10-20)

Written by the organise agent under `work/wiser/sources/teachers-deep/` only. Metadata only (channel search rows, oEmbed, /embed playability, /shorts orientation). Nothing downloaded, nothing deployed, nothing bought.

## Totals
- **candidates.json: 440 natural clips** (1–20 min official uploads), 69 vertical (verified: /shorts oEmbed box taller than wide AND /shorts answers 200), 371 horizontal.
- Every row passed oEmbed 200 + /embed `playableInEmbed: true` and its oEmbed author equals the official channel. Multi-teacher channels (VSNY, Plum Village, BSWA, Abhayagiri, Amaravati, KFT) need the teacher's name in the title.
- Selection: discovered via each channel's own search for 40 topic queries; ranked toward rebirth/death/self/karma and topic-tagged titles; trimmed per teacher to a target depth (pick.py TARGET).
- Topics: keyword cues of app/schema/topics.json on title (0.8) and search snippet (0.5). Dates: Thanissaro yymmdd title codes -> `published`; else `year` from the search row's 'N years ago' (`yearFrom: upload-relative`, an upper bound).

## Depth per teacher (before -> after)
| teacher | before | added | after | vertical added |
|---|---|---|---|---|
| mooji | 24 | 36 | 60 | 0 |
| thanissaro-bhikkhu | 40 | 35 | 75 | 0 |
| swami-tadatmananda | 26 | 34 | 60 | 0 |
| tara-brach | 28 | 32 | 60 | 3 |
| rupert-spira | 44 | 31 | 75 | 6 |
| thich-nhat-hanh | 39 | 31 | 70 | 4 |
| mingyur-rinpoche | 30 | 30 | 60 | 9 |
| swami-sarvapriyananda | 54 | 26 | 80 | 0 |
| filip-holm | 27 | 23 | 50 | 8 |
| jack-kornfield | 22 | 23 | 45 | 3 |
| francis-lucille | 22 | 23 | 45 | 10 |
| christopher-wallis | 22 | 23 | 45 | 7 |
| dalai-lama | 28 | 22 | 50 | 9 |
| jiddu-krishnamurti | 59 | 21 | 80 | 6 |
| ajahn-pasanno | 30 | 18 | 48 | 0 |
| tsoknyi-rinpoche | 22 | 18 | 40 | 4 |
| ajahn-brahm | 29 | 11 | 40 | 0 |
| ajahn-sumedho | 12 | 3 | 15 | 0 |

## Channels
| channel | clips |
|---|---|
| Moojiji | 36 |
| ArshaBodha - Swami Tadatmananda | 34 |
| Tara Brach | 32 |
| Rupert Spira | 31 |
| Yongey Mingyur Rinpoche | 30 |
| Vedanta Society of New York | 26 |
| Plum Village App | 26 |
| Let's Talk Religion | 23 |
| Jack Kornfield | 23 |
| Francis Lucille | 23 |
| Christopher Wallis (Hareesh) | 23 |
| Dalai Lama | 22 |
| Short Dhamma Talks by Thanissaro Bhikkhu | 19 |
| Abhayagiri | 18 |
| Pundarika | 18 |
| Dhamma Talks by Thanissaro Bhikkhu | 16 |
| Krishnamurti Foundation Trust | 12 |
| Buddhist Society of Western Australia | 11 |
| J. Krishnamurti - Official Channel | 9 |
| Plum Village | 5 |
| Amaravati Buddhist Monastery | 3 |

## Topics (roots)
meditation 104, emotions 75, self 60, death 60, mindfulness 58, reality 48, kindness 47, feeling 42, awakening 34, thought 31, faith 27, consciousness 26, relationships 17, dukkha 12, impermanence 11, virtue 10, right-view 10, kamma 9, renunciation 9, craving 8, texts 8, divine 6, soul 6, rebirth 6, daily-life 6, defilements 4, freedom 3, guru 2, gnosis 2, dependent-origination 1

## Gaps (honest)
- **Ajahn Brahm (40), Ajahn Pasanno (48), Ajahn Sumedho (15), Ajahn Amaro (5), Sarvapriyananda (80, but VSNY is mostly long)**: their official uploads are mostly 30–90 min talks, so natural 1–20 min clips run out. Depth there needs virtual clips. I tried the uploader's own chapter markers (tools/chapters.py) but YouTube's watch page answered with its rate-limit page (google.com/sorry, HTTP 429) while several sourcing agents were querying at once, so I stopped after one attempt rather than loop. Backlog: BSWA 'The Process of Rebirth' (EWFSAFHpx_U), 'Rebirth' (DZ3flS2elZo), 'Recollecting Past Lives' (g_tqHsSBEs0); Amaravati 'If All Things Are Not Self, What Is Reborn?' Ajahn Amaro (hKj9q2tLX_E); Abhayagiri 'Foundations, Community, Rebirth, Nibbana' (fU74K9IEaa4); VSNY rebirth talks (vmwWCax0two Swami Medhananda; YmqIDj2psyU Jeffery Long; PvBA7xXfLvk) – these are other speakers, useful for the rebirth hub once cut.
- Plum Village App/Plum Village: Vietnamese/French uploads filtered out by title.
- Not covered: Filip Holm is a scholar-presenter (Let's Talk Religion), kept as is.

## Files
- `candidates.json` (merge input), `raw_discovered.json`, `presel.json`, `tools/{discover,pick,build,chapters}.py`, `cache/` (search rows, embed checks).
