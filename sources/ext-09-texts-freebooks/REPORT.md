# ext-09-texts-freebooks: staged from prx0r/satsang-extensions/09-texts-freebooks on 2026-10-20

Staged by app/tools/stage-extensions.py (dedupe, living/low-confidence claims to app/wisegraph/review-queue.json). Pack docs: specs/extensions/09-texts-freebooks/.

# Sourcing report: texts-freebooks (2026-10-20, extension pack)

New group `sources/texts-freebooks/`. 7 texts. `school` values verified
against the tradition tree (`divine-life-society`, `ramakrishna-order`,
`theravada`, `early-suttas` all exist).

## URL checks (curl, browser UA, 2026-10-20)

| url | code | text |
|---|---|---|
| https://www.dlshq.org/download/kundalini.htm | 200 | sivananda-kundalini-yoga |
| https://en.wikisource.org/wiki/The_Complete_Works_of_Swami_Vivekananda | 200 | vivekananda-complete-works |
| https://www.dhammatalks.org/suttas/AN/AN5_57.html | 200 | dhammatalks-an5-57 |
| https://www.accesstoinsight.org/tipitaka/kn/dhp/dhp.intro.budd.html | 200 | accesstoinsight-dhp |
| https://www.accesstoinsight.org | 200 | accesstoinsight-library |
| https://suttacentral.net | 200 | suttacentral-early-texts |
| https://www.bps.lk | 200 | bps-pariyatti |

Syllabus path per text (NORTHSTAR endgame: free book → theory + practice):
- `sivananda-kundalini-yoga` → Kundalini syllabus (theory chapters +
  practice schedule) with DLS place row (08) + `visual` specs later (04 pattern)
- `vivekananda-complete-works` → ramakrishna-order study track with
  Belur Math / Mayavati / Vedanta Society NY places (08)
- `dhammatalks-an5-57` → already backs a hub practice; citable in the
  rebirth set (03)
- libraries (ATI, SuttaCentral, BPS) → `editions[]` targets for text
  records as the Text entity fills out

Backlog (paths believed right, unverifiable today — sacred-texts 403s bots):
- Muller Upanishads SBE vol 1: sacred-texts.com/hin/sbe01/
- Legge Tao Te Ching: sacred-texts.com/tao/taote.htm
