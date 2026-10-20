# Western sourcing report (2026-10-20, group "western")

**224 candidate clips** in `candidates.json`: 136 natural uploads (1–20 min) + 88 virtual clips (39 parent videos). Every clip passed oEmbed (200) and the embed page reports `playableInEmbed: true` (checked 2026-10-20 with `app/tools/yt-meta.py embed`; cache `cache/cache/embed/`). All horizontal (oEmbed thumbnail w > h); none vertical, so none flagged. Clip length: natural 1–20 min; virtual 2.5–15 min.

Krishnamurti was given priority, as the follow-up asked: **59 clips** from the two official channels (J. Krishnamurti – Official Channel / KFoundation: 42; Krishnamurti Foundation Trust: 17). That is 50 official short excerpts plus 9 virtual clips cut from 4 long talks with transcripts (Madras 1984 Talk 4 on death; London 1962 Talks 1 and 4; Ojai 1979 Seminar 5). Topic spread for K: death 15, meditation 13, self 9, thought 7, relationships 6, freedom 5, divine 4, rebirth/western 4, emotions/fear 4, dukkha 4, awakening 4, kindness 4, mindfulness 2, emotions/sadness 2, faith 2, meditation/prayer 1, soul 1, impermanence 1, virtue 1.

## Counts per figure (figures[] = discussed, not on screen)
| figure | clips |
|---|---|
| plato | 34 |
| george-gurdjieff | 19 |
| plotinus | 18 |
| jesus | 15 |
| rudolf-steiner | 13 |
| socrates | 8 |
| meister-eckhart | 8 |
| nag-hammadi-library | 6 |
| pd-ouspensky | 5 |
| proclus | 4 |
| marsilio-ficino | 4 |
| pythagoras | 4 |
| pseudo-dionysius | 3 |
| marguerite-porete | 2 |
| helena-blavatsky | 2 |
| mary-magdalene | 1 |
| jakob-boehme | 1 |

Clips with no figure are teachers speaking in their own voice: Krishnamurti, plus Rohr, Bourgeault and others on contemplation.

## Counts per topic (clip.topics, max 4 per clip)
| topic | clips |
|---|---|
| divine | 47 |
| soul | 41 |
| awakening | 38 |
| self | 32 |
| death | 28 |
| meditation | 25 |
| rebirth/western | 23 |
| meditation/prayer | 18 |
| gnosis | 18 |
| kindness | 17 |
| divine/the-one | 17 |
| virtue | 13 |
| dukkha | 11 |
| thought | 9 |
| faith | 8 |
| mindfulness | 7 |
| relationships | 7 |
| texts | 6 |
| emotions/fear | 5 |
| freedom | 5 |
| emotions/sadness | 2 |
| craving | 2 |
| kamma | 2 |
| emotions | 2 |
| kamma/western | 1 |
| impermanence | 1 |
| right-view | 1 |
| rebirth | 1 |
| renunciation | 1 |
| feeling | 1 |

Topic evidence (`tags.topics[*][2]`): title 67, manual 308, transcript 14. `manual` = topics I assigned from the video title, the creator chapter title, or my reading of the transcript passage. `title` = keyword cue in the clip title. `transcript` = 8+ cue hits inside the passage, conf 0.5, used only when a clip had fewer than 3 topics.

## Counts per speaker
| speaker | clips |
|---|---|
| jiddu-krishnamurti | 59 |
| filip-holm | 27 |
| gregory-sadler | 16 |
| justin-sledge | 15 |
| john-vervaeke | 15 |
| theodore-nottingham | 15 |
| richard-rohr | 14 |
| cynthia-bourgeault | 14 |
| rudolf-steiner-press | 11 |
| eric-steinhart | 8 |
| pierre-grimes | 7 |
| mitch-horowitz | 5 |
| pablo-sender | 3 |
| gary-lachman | 3 |
| barbara-holmes | 2 |
| charles-stang | 2 |
| michael-sugrue | 2 |
| denis-robichaud | 2 |
| john-dalton | 2 |
| jacob-needleman | 1 |
| bart-ehrman | 1 |

## Counts per channel (cap ~60; largest is the KFoundation channel at 42)
| channel | clips |
|---|---|
| J. Krishnamurti - Official Channel | 42 |
| Let's Talk Religion | 27 |
| Center for Action and Contemplation | 20 |
| Krishnamurti Foundation Trust | 17 |
| John Vervaeke’s Lectern | 17 |
| Gregory B. Sadler - That Philosophy Guy | 16 |
| ESOTERICA | 15 |
| Theodore Nottingham | 15 |
| Rudolf Steiner Press Audio | 11 |
| Eric Steinhart | 8 |
| Pierre Grimes and the Noetic Society | 7 |
| Wisdom Way of Knowing | 5 |
| Theosophical Society in England & Wales | 5 |
| Mitch Horowitz | 5 |
| Shambhala Publications | 3 |
| Theosophical Society | 3 |
| Michael Sugrue | 2 |
| Lumen Christi Institute | 2 |
| HDS Center for the Study of World Religions | 2 |
| Jacob Needleman | 1 |
| More Alex O'Connor | 1 |

## Region / tradition
| region (family) | clips |
|---|---|
| hellenic | 64 |
| independent | 59 |
| christianity | 56 |
| western-esotericism | 45 |

| tradition | clips |
|---|---|
| krishnamurti | 59 |
| platonism | 45 |
| christian-mysticism | 41 |
| fourth-way | 21 |
| neoplatonism | 19 |
| christianity | 15 |
| anthroposophy | 11 |
| gnosticism | 8 |
| theosophy | 3 |
| western-esotericism | 2 |

## Files
- `candidates.json`: clip rows in the app/clips.json shape. Extra fields: `publishedApprox` (true when `published` comes from YouTube's relative "N yr ago", so expect about ±6 months; null when no search row was found), and `start`/`end`/`parent`/`segTitle` on virtual clips. On virtual rows `dur` = the full parent length and `sec` = `end − start` (the playable passage), and `band` is computed from `sec`. This differs from the one virtual row in app/clips.json, where `sec` holds the full length. Say which you want and I'll flip it.
- `people-additions.json`: 38 entries (17 figures + the Nag Hammadi library as a text + 20 speakers). Each has a bio in my own words, `works` (specials such as Republic, Enneads, Elements of Theology, Platonic Theology, Theosophy, How to Know Higher Worlds, In Search of the Miraculous, Beelzebub's Tales, Freedom from the Known), aliases, channels, and Wikidata ids from wbsearchentities/wbgetentities (null when no clean item was found).
- `traditions-additions.json`: 13 nodes. Families: hellenic, christianity, western-esotericism, independent. Schools and lineages: platonism > neoplatonism, renaissance-platonism; christian-mysticism; gnosticism; theosophy > anthroposophy; fourth-way; krishnamurti.
- `edges-additions.json`: 29 edges. They include Socrates→Plato→Plotinus→Proclus→Ficino (plus Plotinus/Plato→Ficino, Proclus→Dionysius→Eckhart), Blavatsky (Theosophy)→Steiner and →Krishnamurti, Gurdjieff→Ouspensky (teacher_of), and Gurdjieff→Needleman/Bourgeault/Nottingham, along with lineage_of edges.
- `topics-additions.json`: proposed leaves soul, gnosis, meditation/prayer, divine, divine/the-one ("the One"), rebirth/western (karma and reincarnation in Western thought), kamma/western and freedom. They are used in candidates.json but **not yet merged** into app/schema/topics.json. The app must add them before these ids validate.
- `tools/`: ytsearch.py (keyless search rows), chapters.py (creator chapter markers read from search results), segment.py (passage proposals from internal SRTs), build.py, graph.py, nat_manual.json.
- Transcripts (internal only): `work/wiser/transcripts-internal/western/*.srt`, 30 files. No transcript text appears in candidates or any other output.

## Channels used and rights notes
Every clip is a first-party upload by the teacher, their foundation or estate, their publisher, or the institution that hosted and recorded the talk:
- Official teacher/foundation channels: J. Krishnamurti – Official Channel (KFA/KFT), Krishnamurti Foundation Trust, Center for Action and Contemplation (Rohr), Wisdom Way of Knowing (Bourgeault's organisation), Jacob Needleman, Theodore Nottingham, Mitch Horowitz, Pierre Grimes and the Noetic Society, Michael Sugrue (estate-run since 2024).
- Scholars' own channels: ESOTERICA (Justin Sledge), Let's Talk Religion (Filip Holm), John Vervaeke's Lectern, Gregory B. Sadler, Eric Steinhart.
- Publisher / host institution: Shambhala Publications (Bourgeault), Rudolf Steiner Press Audio, Theosophical Society in England & Wales (Lachman, Dalton), Theosophical Society in America (Pablo Sender), Lumen Christi Institute (Robichaud on Ficino), HDS Center for the Study of World Religions (Bourgeault on Gurdjieff), More Alex O'Connor (Alex O'Connor's official clips channel; a Bart Ehrman interview he produced).
- **Rudolf Steiner Press Audio** posts narrated readings of Steiner's lectures over a still image, not talks by a living teacher. They are tagged with speaker `rudolf-steiner-press` and figure `rudolf-steiner` so the UI can show "reading". Drop them if the feed should be talk-only.
- Bourgeault's Helen Daly series (WWOK, 3 clips) is a two-person conversation. Speaker is set to Bourgeault (channel default).
- No fan re-uploads, no Dharma Seed, no downloads, nothing bought.

## What failed or was skipped (stop-after-two-failures rule)
- **Captions via yt-dlp**: blocked (player API 403 for every client tried). Watch pages returned 429, so I could not read descriptions or exact upload dates. Fallbacks: the `analyze_video` tool for transcripts, creator chapters read from search-result rows, and relative "ago" dates.
- **analyze_video**: heavily rate-limited (429) because other sourcers share it. 30 transcripts succeeded. These videos failed twice or more and were **dropped**: 7SpjMTa_ccw (Bourgeault, Centering Prayer), oLOL6WB5U28 (Brierley, karma and reincarnation), MuSJnfIa1bo (Lachman on Blavatsky), x4vd21slhmw (Sugrue Republic VI–X), zu4XVOXPkYg (Needleman on Gurdjieff; the transcription timed out). These were never attempted: aLmJMoUinTU, -XpwLyeq2BY, RALOxHgVDlo, _bClyhR2ZPc, ilzLWw2fyYo, LaaA5hJAI0c, dl8qaVRiK5U, 9TEXUTyP4rI (Laird), W9I4acZQWIk, LtxFOb7t_Go, xq0HePGcCJc, 6nFRWUyGqLg (Anthroposophical Society in America), ZAQ8DsXDxQ0 (Pagels), V7gPhN9fUIE, wXmOpQ8sq1M, fdZnc-I-aII, qVhXAmjg4OQ, rh2l8ZvG7xA, VkP3g3H3eOA, mhGXgegKeSI, BdD2CfQGjNE, oiSPUz4wBTw, yTw7Jf1iErI, mRh4lwtgfVE, WH3DWGbhtgU. Their embed checks passed. A rerun of analyze_video at a quiet hour plus segment.py would add about 40–60 more virtual clips.
- **AkMojj1P6H0** (Martin Laird, ISBS 2019): the transcript shows a multi-speaker event, and I could not isolate Laird's passage with confidence. Skipped. **Martin Laird has no clips**: he has no official channel, and his host-uploaded talks needed transcripts that failed.
- **Gurdjieff Foundation**: no official YouTube channel found. Gurdjieff and Ouspensky coverage comes from Nottingham, Horowitz, Lachman, Bourgeault and Needleman.
- **Goetheanum**: almost entirely German. Its only English Steiner-karma clip had an unnamed speaker and was skipped. The Anthroposophical Society in America has only long talks without transcripts. Steiner is therefore covered through RSP readings, and the TS England & Wales Dalton talk: 13 clips.
- 4 natural clips over 20:00 were excluded by the length rule (ztLEMnrEE2s, FqILkOZmpaE, ORKS5izOVjE, ZMFzvsZrrIo).
- Virtual-clip boundaries come from creator chapters or 30-second transcript blocks snapped to caption cues. Auto-captions on the 1962 London Krishnamurti talks and some Grimes seminars are rolling and repetitive, so boundaries can be off by a sentence. A quick spot-check in the player is advised before the clips go live.
- No scheduled tasks were created. Nothing in work/wiser/app/ was edited.
