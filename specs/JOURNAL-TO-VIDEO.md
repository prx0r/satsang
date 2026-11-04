# Journal to video: the content loop (spec v1, 2026-11-04)

> **Status (2026-11-04):** **spec + first manual run (files only)**. Nothing published, nothing rendered, no uploader built.
> Parent: `specs/AWAKENING-ALGORITHM.md` (§3 A→B contract, §10 gap → generation queue). Interfaces:
> `specs/INTERFACES-TRACK-A.md`, `specs/interfaces/*.schema.json`. First run artefacts live in the gitignored `private/`
> folder of this work tree (diary-derived: never in a public repo until de-personalised and owner-approved).

The owner writes a public journal (prx0r/nibbanahelp). An open tension in it becomes a question; the Trika texts are
probed for what they say about it; an essay is drafted that cites those passages; the essay becomes a video through the
tantrasara factory; the owner approves and publishes it to his channel; Satsang ingests the published video and offers it in
For You; what viewers do with it flows back as signals. One loop, seven steps, every step behind a file the next step reads.

## 0. The channel today (read 2026-11-04 from the public channel page, its RSS feed and YouTube oEmbed only)

| | |
|---|---|
| Channel | **svatantrya**, `@svatantryart`, channel id `UCeHTI-PklIN4kOmZnxspl_Q`, description "freedom" |
| Videos | **4** public uploads, 2026-11-02 to 2026-11-04 (RSS feed and channel page agree) |
| Titles | `Tantrasara · A Humorous Exposition [01] — Abhinavagupta \| Kashmir Shaivism` (7:22); `Bhairavastava · Hymn to Bhairava — Abhinavagupta \| Kashmir Shaivism Chant` (2:06); `Anuttarāṣṭikā · Eight Verses on the Unsurpassable — …Chant` (3:00); `Dehasthadevatācakra · Circle of Deities in the Body — …Chant` (2:43) |
| Format | landscape; two lanes: (1) **exposition** chapters from the tantrasara factory (granny narration, Devanāgarī/IAST cards), (2) short **chant** videos of Abhinavagupta's hymns (ipvv karaoke + R2 audio lane) |
| Title pattern | `<Work> · <English title> — <Author> \| Kashmir Shaivism[ Chant]` |
| Not in Satsang yet | none of the 4 is in the catalogue (the owner's own channel is not a sourced channel; ingesting it is step 6 below) |

A third lane is added by this loop: **essay** videos (a question from a tension, answered by the texts). Proposed title
pattern, same family: `<Question> · <Work, verses> — Kṣemarāja | Kashmir Shaivism Essay`.

## 1. The loop

```
 [1] tension (nibbanahelp, public)          id  nh:tension:<id>@<git sha>
      │  de-personalise → a question (private)
 [2] question                               id  q-YYYY-MM-DD-NN            private/content-loop/<run>/question.json
      │  probe: ipvv MCP/RAG · translation-work passages · Satsang talks (MCP/REST)
 [3] passage pack                           id  pp-<q id>                  private/…/passages.json (ids + our one-line readings)
      │  outline → draft (own words; own translations quoted; scholars linked)
 [4] essay                                  id  essay:<slug>@vN            private/…/essay-outline.md → (approved) ipvv essays/ or translation-work
      │  owner approval #1 (de-personalisation + rights) → tantrasara chapter in its CHAPTER-FORMAT
 [5] video                                  id  tantrasara:essay-<slug>    chapters/essay-<slug>.md → storyboard_essay-<slug>.json
      │  review pack → owner approval #2 (approved_essay-<slug>.json, SHAs pinned) → render (Fish free tier) → gates
 [6] publish (owner, by hand) → YouTube     id  yt:<videoId>               owner uploads to @svatantryart
      │  tantrasara satsang-export.json item kind video, media.host youtube, fulfils [q id]
 [7] Satsang ingest + For You               id  clip <videoId> / tantrasara:video:essay-<slug>
      │  "Made after you wrote about …" to the owner's device only; ranks like any talk for everyone else
 [8] signals back                           plays, finishes, resonates, chat asks (Satsang) · views, comments (YouTube, owner OAuth, read-only)
      └──► the private gap queue (AWAKENING §10) and the tension's own status (nibbanahelp, set by the owner only)
```

### Steps, artefacts, owners

| # | Step | Artefact (shape) | Id | Owning repo | Public? |
|---|---|---|---|---|---|
| 1 | Pick a tension | the tension file as published (header `id, status, domain, roots, summary`) | `nh:tension:<id>@<sha>` | nibbanahelp | already public (the owner's choice) |
| 2 | Turn it into a question | `question.json` `{id, from: nh:tension:<id>@<sha>, question, depersonalised: true, concerns: [Satsang concern ids], topics: [Satsang topic ids], created}` | `q-YYYY-MM-DD-NN` | Satsang (private/) | **no** |
| 3 | Probe the texts | `passages.json` `[{ingest id or chunk id, work, verses, gate, review, licence, why (our words)}]` + talks `[{clip id, teacher, tier, why}]` | `pp-<q id>` | Satsang (private/), reading A's exports | no (ids only; becomes public with the essay) |
| 4 | Essay | `essay-outline.md` → `essay.md` (front matter: `id, question, passages[], talks[], rights, status: DRAFT/APPROVED`) | `essay:<slug>@vN` | draft: Satsang private/; approved: **ipvv** `site/data/essays/` (its essay lane) | only after approval #1 |
| 5 | Video | tantrasara chapter markdown in CHAPTER-FORMAT + `storyboard_<unit>.json` (its own builder/validator) + `overrides`, `glossary`, `approved_<unit>.json` | `tantrasara:essay-<slug>` | **tantrasara** (a new `essays/` lane, like its `shiva/` lane: NEW-LANE.md pattern) | review pack on R2 (owner only) |
| 6 | Publish | the uploaded YouTube video | `yt:<videoId>` | the owner (manual upload) | yes |
| 7 | Ingest | `satsang-ingest/1` item from tantrasara's export: `kind: video`, `media {url: youtube watch url, host: youtube}`, `people: [kshemaraja]`, `topics`, `review {status: ACCEPTED, gate: PASS, by: owner}`, `rights {licence: FREE for our translation; channel owner's video}`, `fulfils: [q id]` | `tantrasara:video:essay-<slug>` + Satsang clip id = `<videoId>` | Satsang (catalogue: the channel joins the sourced channels as `svatantrya`, an owner channel) | yes |
| 8 | Signals | Satsang: the existing watch log, resonates, flash picks, chat requests (AWAKENING §8). YouTube: views, likes, comment count via the Data API `videos.list part=statistics` with the owner's OAuth (read-only scope), weekly, aggregated per video | per video | Satsang private queue | aggregates only |

### Approvals (two, both files, both the owner's)
1. **Essay approval** (after step 4): `approved_essay-<slug>.json {essay_sha, depersonalised: true, rights_checked: true, date, by: owner}`.
   Checklist the approval asserts: no name, place, amount, relationship, body detail, date or quote from the diary; the
   question stands on its own for any reader; every quote is our own translation (≤ 25 words each) or the source language;
   every scholar is linked, never quoted at length; no advice, no promise, no diagnosis (AWAKENING §7.1 lint).
2. **Render approval** (after the storyboard): tantrasara's own `approved_<unit>.json` pinning storyboard + glossary SHAs.
   Render refuses without it (tantrasara law). No upload happens without the owner; Satsang and its agents never upload.

### Privacy
- A tension is public because the owner made it so, but the loop treats it as private input: the question, passage pack and
  essay draft are derived personal data and live in a gitignored `private/` folder (or the private satsang-data repo) until
  approval #1. `tools/release/secret-scan.sh` refuses any staged path under `private/` and `tools/awaken/out/`.
- The published essay and video carry **no trace of the diary**: they answer a general question. No "I wrote…", no day
  numbers, no link to the journal unless the owner adds one himself.
- Signals from YouTube are aggregates per video; comment text is never stored by Satsang (counts only); nothing is joined
  to a person.

### Rights
- Our translations (ipvv / translation-work, licence FREE) may be quoted on screen and in the essay, in short units, and are
  labelled "draft translation" until their review status is REVIEWED/ACCEPTED (owner default 2026-11-04 for the site;
  the same label applies in the essay and on the video cards).
- Source texts: GRETIL e-texts are CC BY-NC-SA: the Sanskrit line is shown with credit (the existing tantrasara card lane).
- Scholars' and teachers' words stay theirs: linked talks and books, never quoted beyond a few words, never read aloud.
- Dharma Seed material is never cut or reused (CC BY-NC-ND); YouTube talks are linked, never clipped into the video.

### Repo ownership (who builds what)
| Repo | Builds | Does not |
|---|---|---|
| nibbanahelp | nothing new; the owner keeps writing and sets tension status | no feed change required (Satsang reads the repo via GitHub; a `/feed.json` stays optional) |
| Satsang | steps 2–3 tooling (a `tools/loop/` CLI later: tension → question → passage pack from A's exports + Satsang MCP), the ingest of the owner channel (7), signals (8), "Made after you asked" | never writes essays for publication, never renders, never uploads |
| ipvv | the essay lane (approved essays as data objects, its permissioned-essay rules) and the MCP the probe reads | — |
| translation-work | passages, review status, licences | — |
| tantrasara | an `essays/` lane: chapter → storyboard → review pack → approval → render, all under its gates | no publish step |
| YouTube Data API (later) | an optional uploader with the owner's OAuth (`youtube.upload`), spec only: the owner presses publish; unlisted first, public after a last look | not built in this round |

### Failure and stop rules
- The probe finds no gate-PASS passage on the question: the run stops and records `no_source` in the run file (it does not
  fall back to scholars' words or to a model's paraphrase).
- Anything that loops more than twice (a storyboard that will not validate, an ingest that fails) stops and is reported.
- A tension whose wording trips the safety triage at `unsettled` or above is never used for a public essay.

## 2. First manual run (2026-11-04): run-001

Files (gitignored, not published): `private/content-loop/run-001-2026-11-04/` → `README.md` (the pick and why),
`question.json`, `passages.json`, `essay-outline.md`, `chapter-essay-hiding.md` (tantrasara CHAPTER-FORMAT stub) and
`storyboard-essay-hiding.json` (the output of tantrasara's own `build_storyboard.py`, run locally as a free dry run: parse,
cast, validate; no TTS, no render, nothing uploaded).

- **Tension picked**: the only tension in the public journal whose status is `open` (the others are `loosening`). Which one,
  and the essay's headline, are recorded only in the private run README: this public repo carries nothing about the diarist.
- **Why it qualifies**: still open; its roots map onto the Recognition teaching's account of contraction, the coverings (mala)
  and the five acts; it is answerable from gate-PASS passages we already hold (Pratyabhijñāhṛdaya, ipvv `phrdaya`, 20/20 chunks
  PASS, licence FREE, still `needs: human-review` → "draft translation"); and Satsang has gold and strong talks on those verses
  (Bäumer's Pratyabhijñā Hṛdayam course, Wallis on the Recognition Sutras, Lakshmanjoo on mala and grace).
- **Probe note**: ipvv-api's MCP `search` and `list_works` returned `[]` for every query on 2026-11-04, so the probe read ipvv's
  published translation JSON (sivasutra, spanda and vbt are BLOCKED at the gate and were not used).
- **Dry run**: tantrasara's `build_storyboard.py` on the stub: 17 blocks, 0 warnings, 1 error (the opener bell asset path exists
  only on the owner's box). No TTS, no render.

## 3. Open questions (owner)
1. Essay lane home: ipvv `site/data/essays/` (proposed) or translation-work?
2. Channel ingest: may Satsang add `@svatantryart` as a sourced channel now (4 videos, marked as the site owner's own work), or
   only once the first essay video exists?
