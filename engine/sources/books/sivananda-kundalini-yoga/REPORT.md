# Sivananda, *Kundalini Yoga*: passes 0–2 (read-only)

**Status:** review. Read-only extraction: nothing was compiled into practices and nothing was deployed. Labels and rules are an agent draft that still needs a human sign-off before pass 3.

Source: Swami Sivananda, *Kundalini Yoga*, Divine Life Society, Tenth Edition 1994, WWW edition 1999, ISBN 81-7052-052-5. Online at https://www.dlshq.org/download/kundalini-yoga/ (one HTML page). Fetched 2026-10-26 (+07), which was 2026-10-25 18:48 GMT by the server's clock.

## What is where

| File (public, this folder) | What it holds |
|---|---|
| `source-config.json` | Input for pass 0: edition, licence evidence, and a pointer to the private text. |
| `source-text.json` | The standard SourceText (schema `source-text.json`), with one segment per section: heading, anchor URL, chars, sha256. `store_verbatim: false`. |
| `sections.json` | The section map: 189 sections, with id, ordinal, heading, level, part, anchor, URL, paragraphs, words, chars, sha256 and private file name. Also has the page, body and book hashes and per-part totals. |
| `passage-index.json` | 5,489 sentence passages (`satsang-segment/1`). Each has its id, offsets, a 16-hex hash, kind_guess and numbers, but **no text**. |
| `labels.tsv` → `map.json`, `MAP.md` | Pass 1. My labels, tiers and paraphrases, plus key terms counted in the private texts. |
| `rules.src.tsv` → `rules.json` | Pass 2. 59 rules. Each has our paraphrase, scope and severity, plus short verbatim anchors (≤25 words) that resolve to passage ids. |

**Private text:** stored in `prx0r/satsang-data` (a private repo) under `books/sivananda-kundalini-yoga/`. It holds `page.html` (the page exactly as fetched), `page.headers.txt`, `book.txt`, `sections/<id>.txt` and `passages.json` (passages with their text). The public repo holds no passage longer than 25 words; this was checked by searching every public file for each passage over 25 words, with 0 found.

**Tools added:** `engine/tools/extract/book-sections.py` (pass 0, stdlib only), `book-passages.mjs` (reuses `segment.mjs`), `book-map.py` and `book-rules.py`. Also a schema, `engine/schema/book-source.json`, and a `sources/books/*` block in `tools/validate-schemas.py`. All of them pass, with 0 schema errors across the repo, and a tampered label or an empty `passage_ids` is rejected.

### Reproduce
```
D=<satsang-data>/books/sivananda-kundalini-yoga; S=sources/books/sivananda-kundalini-yoga
curl -sL https://www.dlshq.org/download/kundalini-yoga/ -o $D/page.html
python3 tools/extract/book-sections.py $D/page.html $D $S/sections.json --url https://www.dlshq.org/download/kundalini-yoga/
node tools/extract/book-passages.mjs $S $D && python3 tools/extract/book-map.py $S $D && python3 tools/extract/book-rules.py $S $D
python3 tools/validate-schemas.py
```

## Pass 0: pin

- `page_sha256` = `f2f1deb6…a7d9df18`. This is the hash of the file bytes and is **not stable**: WordPress puts a different Akismet nonce in every response. Two fetches gave different page hashes.
- `body_html_sha256` = `fc6a1af8…1207720`. This covers the `<div class="post-content">` up to `</article>` and is stable across both fetches.
- `book_text_sha256` = `a2552451…22788e28`. This is the normalised text, and it is also stable.
- Licence evidence is in segment `s001-title-page`: *"This WWW reprint is for free distribution"* and *"© The Divine Life Trust Society"*. The copy says the print edition can be bought from the DLS store. The licence is recorded as `publisher-free` (the same as the dlshq.org entry in the app's licence registry). It is non-commercial and grants no explicit right to adapt, so we publish only our own paraphrases and quotes of 25 words or fewer.
- **Sections: 189**, with 70,189 words (headings excluded) and 415,040 chars. This is fewer than the ~200 / ~72k estimate for two reasons:
  - 11 part-title headings (PRANAYAMA, ASANAS and so on) have no body text of their own, so they became part labels.
  - The two title-page h3 lines were folded into `s001`.
- Parts (sections / words):

  | Part | Sections | Words |
  |---|---|---|
  | Front matter | 9 | 3,189 |
  | Opening essays | 10 | 9,157 |
  | Preliminary | 15 | 6,073 |
  | Kundalini theory | 25 | 7,491 |
  | Yoga Sadhana | 7 | 4,976 |
  | Pranayama | 14 | 4,224 |
  | Asanas | 14 | 4,789 |
  | Mudras–Bandhas | 15 | 2,688 |
  | Miscellaneous | 9 | 4,201 |
  | Addenda | 21 | 10,228 |
  | Yoga-Kundalini Upanishad | 33 | 7,123 |
  | Appendix articles | 16 | 5,525 |
  | Glossary | 1 | 525 |

  The HTML does not mark three of these boundaries: opening essays, appendix articles and glossary. I set them where the book changes content (the prayer ends, the Upanishad says "Thus ends", the Glossary heading).
- Passages: 5,489. The kind_guess regexes were tuned for Ajaan Lee, so here they mostly say "description". They are hints only.

## Pass 1: map

**Labels:**

| Label | Sections |
|---|---|
| theory | 79 |
| practice | 41 |
| rules | 26 |
| teacher-only | 18 |
| story | 15 |
| front-matter | 10 |

**Tiers:**

| Tier | Sections |
|---|---|
| beginner-ok | 119 (mostly reading-only) |
| needs-review | 39 |
| teacher-only | 31 |

**Runnable candidates:** 23 sections, which make 21 distinct candidate ids. All of them are needs-review or worse except dharana and yoga mudra.

### Proposed first batch for pass 3 (as briefed)
| Candidate | Section(s) | Tier | Note |
|---|---|---|---|
| sukha-purvaka | s071 (+ s012 near-duplicate) | needs-review | 3:12:6 Oms (1:4:2), mula bandha in the hold, attention at muladhara, 6→20 rounds. Beginner form = 1:2 with no hold (rule `beginners-no-kumbhaka`). |
| nadi-suddhi | s070 | **teacher-only** | The book's Nadi Suddhi is the *bija* (samanu) form: 16 japa in, **64 held**, 32 out, cycling Yam/Ram/Tham/Vam/Lam with imagery. It is not plain anuloma viloma. Only a no-hold reading is runnable; otherwise treat it as Ask/reference. |
| bhastrika | s072 (+ s149 Upanishad) | needs-review | 10 rapid breaths a round building to 20–25, then a comfortable hold; 3 rounds. The hold is capped by the engine and stripped for beginners. |
| suryabheda | s073 / s147 | s073 **teacher-only**, s147 needs-review | s073 holds until sweating with jalandhara. The Upanishad form (s147) states no hold and is the runnable basis. |
| ujjayi | s074 / s148 | needs-review | Soft throat sound on the inhale, comfortable hold, exhale through the left nostril or both. |
| bandhas: mula, jalandhara, uddiyana, bandha-traya | s096, s097, s098, s150 | needs-review | Mula works as a modifier in any phase. Jalandhara only goes with a hold. Uddiyana is an exhaled hold, so the retention rules apply. |
| kapalabhati | s066 | needs-review | About 1 per second, 10 per round, +10 per round up to 120, no hold. |

### Second batch
- dharana (s118): beginner-ok
- yoga-mudra (s102): beginner-ok
- trataka (s065): needs-review; sun-gazing is excluded
- nada-anahata (s111): needs-review; no sounds may be promised
- sitali (s149): needs-review
- maha-mudra (s099): needs-review
- maha-bandha (s100): needs-review
- yoni-mudra (s107): needs-review
- kundalini-pranayama-muladhara (s012): needs-review
- kundalini-bhavana-pranayama (s013): needs-review
- change-nostril-flow (s044): needs-review; the nauli and khechari methods are excluded

**Teacher-only by default** (per the brief and the book): dhauti, basti, sutra neti, nauli, plavini, khechari/lambika (s104, s158–162, s175), vajroli, shakti chalana, maha vedha, Sarasvati chalana, the bija bhuta-shuddhi pranayama (s137/s174), kevala/forced-apana work (s153), the Upanishad's kumbhaka schedule, siddhis, pranic and distant healing, and lotus-in-headstand.

## Pass 2: rulebook

There are 59 rules. By severity:

| Severity | Rules |
|---|---|
| hard-stop | 8 |
| caution | 20 |
| guidance | 23 |
| info | 5 |
| traditional | 3 |

Every rule cites passage ids, and every anchor resolved uniquely on the first run.

**Top five:**
1. `beginners-no-kumbhaka` (hard-stop, pranayama): beginners breathe in and out only, exhaling twice as long as they inhale (1:2), for some days before any hold (s080 #14). This is the beginner form of every retention practice.
2. `no-suffocation` (hard-stop, pranayama): never feel suffocation, and never need recovery breaths between rounds (s080 #17).
3. `kumbhaka-no-face-strain` (hard-stop, pranayama): straining the face during a hold means you are past your capacity (s080 #4).
4. `advanced-mudras-guru-only` (hard-stop): khechari, shakti chalana, vajroli and the other advanced courses only with a teacher's sanction (s109 #5, s104, s105).
5. `kumbhaka-weekly-build` (caution, pranayama): build the hold to about 4 s in week 1, 8 s in week 2 and 12 s in week 3, then gradually (s080 #16). The engine's 30 s cap still applies on top of this.

Close behind: `trataka-sun-guide` (hard-stop), `gradual-no-violence`, `purity-before-awakening`, `no-premature-awakening` and `empty-stomach`.

## Conflicts and surprises

**Inside the book**
- **Suryabheda.** s073 holds the breath until sweat appears; the Upanishad (s147) gives no hold and has you exhale "after purifying the skull".
- **Breath sound.** The general rule is a silent breath (s080 #11, with an exception for bhastrika and kapalabhati), but ujjayi (s074) is defined by its throat sound.
- **Kumbhaka schedules.** s080 says to go gradually (4/8/12 s by week). The Upanishad's s151 says 4 kumbhakas, then 10 + 5, then 20, adding 5 a day with all three locks. These are irreconcilable, so the Upanishad schedule is teacher-only.
- **Speed of awakening.** The practice sections promise speed ("Kundalini will be awakened quickly", s012/s071; "Even a few days' practice will convince you", s013). Hints on Yoga says premature awakening is not desirable (s136). Under spec rule §1.4 none of these promises can be narrated.
- **Kapalabhati.** s066 asks for "Puraka very long and mild" but also one expulsion per second. The two are in tension, so the inhale timing needs a ruling.

**Duplicates:**
- s012 and s071 are the same 3:12:6 exercise; s173 ends with a third copy.
- s174 is s013's opening plus s137's inner-ascent text.
- s181 = s011.
- s182 = s010.

**Text quality:**
- The Devanagari in s004–s006, s008 and the bija glyphs in s070 are in a legacy font and come out garbled. The transliteration and English are fine.
- There is a stray "Chapter One" at the end of s019.
- "welt-ventilated" (sic) in s080 is kept verbatim.

**Content not to port:**
- Health claims throughout: curing consumption, leprosy, asthma and "all diseases".
- Gendered and renunciate rules: avoid women and householders, sleep apart from your wife. These are kept as `traditional` and recorded only.
- Plavini floating claims and the siddhis.

## Disagreements with the hand-built Sivananda practices

Both hand-built practices cite *The Science of Pranayama*, not this book, so these are cross-book differences. Nothing was edited.

**`nadi-shodhana-sivananda`**
- **Name.** This book's "Nadi Suddhi" is the bija 16:64:32 form. The hand-built practice actually matches this book's **Sukha Purvaka** (s071).
- **Ratio.** Both use 1:4:2. The book counts in Oms (3:12:6); the hand-built practice counts 4:16:8 one-second counts.
- **Rounds.** The book starts at 6 rounds, twice daily, rising to 20. The hand-built default is 5.
- **Mula bandha.** The book adds mula bandha and attention on the chakra and Kundalini during the hold. The hand-built practice has attention at the muladhara but **no mula bandha**.
- **Brow outro.** The hand-built rest with attention at the brow is not in this book.
- **Hold progression.** The hand-built standard form holds 16 counts straight away. The book wants the hold built up over weeks (rules `kumbhaka-weekly-build` and `beginners-no-kumbhaka`). The beginner override (4/0/8) agrees with the book.
- **Contraindications.** The hand-built list (pregnancy, BP, glaucoma) is modern; the book has none. The book's stop signs are facial strain, suffocation, needing recovery breaths and fatigue. Of these the hand-built `stop_if` has only "gasping on the next inhale". Add facial strain and fatigue.

**`kapalabhati-sivananda`**
- **Rate and progression.** One per second matches. On how to progress, the two disagree:
  - The book starts at **10** per round and adds 10 "to each round" up to 120.
  - The hand-built default is 20 strokes (10 only in the beginner override) and says "add 10 a week", which comes from *Science of Pranayama*, not this book.
- **Inhale.** The book's inhale is "very long and mild". The hand-built uses a 0.68 s passive inhale. This needs a ruling, since the book is not self-consistent here either.
- **Brow rest and contraindications.** The 20 s rest with attention at the brow and the contraindication list are modern additions; the book has neither. The hand-built confidence note already says so.
- **Classification.** The book calls kapalabhati a shat-karma but also a pranayama, which is consistent with `needsTeacher: true` / needs-review.

**Licence note:** both hand-built practices declare `meta.license: CC-BY-4.0` for our own wording, while the source is publisher-free. This book's licence line grants free distribution only, not adaptation. That is fine for our own paraphrased wording, but it is worth a line in the licence registry.

## Open for pass 3
1. A human signs off on the labels and tiers in `labels.tsv`. Teacher-only calls to check: s063 (neti), s073 (suryabheda), s070 (nadi suddhi).
2. Decide whether the hand-built `nadi-shodhana-sivananda` is re-sourced to s071 (Sukha Purvaka) or keeps its *Science of Pranayama* basis.
3. Add a book entry for this text to `app/wisegraph/licence-registry.json`. That file is outside engine/, so it was not touched here.
