# Satsang: the hands-off sit player (spec v1, 2026-10-25)

> "I don't want to hold to breathe, I'm going to be meditating. Endgame: take a primary text and distil it into a practice routine."

`/sit/` turns a primary text into something you can sit with, hands off. You pick a practice or routine, press Begin and close your eyes. It runs by itself from the compiled timeline. Every stage traces back to a passage of the text through the TEXT-TO-PRACTICE pipeline. There is nothing to hold or tap, and there is no breath retention.

**Preview:** https://engine.tantrafiles.xyz/sit/ (engine preview Worker `satsang-engine-preview`; the live site is untouched)
- Routine, end to end: https://engine.tantrafiles.xyz/sit/?r=morning-thai-forest
- One practice at a set length: https://engine.tantrafiles.xyz/sit/?p=mn118-anapanasati&min=20
- Eyes closed + voice: https://engine.tantrafiles.xyz/sit/?p=ajahn-lee-method-1&eyes=1&voice=1
- Jump in with "From the text" open: https://engine.tantrafiles.xyz/sit/?p=ajahn-lee-method-2&t=162&still&sheet

## 1. What it does
| Need | How |
|---|---|
| Hands-off | Begin → `sit/session.mjs` lays the compiled timelines (`compile.mjs`) end to end on one clock; the player only reads the clock. No hold/release, no tapping. |
| White energy body breathes naturally | `breath/body.js` (raw WebGL2, the /breath/ body of light) is driven by the timeline's own in/out breaths (pace-guide 5 s in / 6 s out unless the text sets it). The breath track only ever has `in`/`out`. Any practice whose timeline holds or retains is **refused** (`eligible()`; e.g. Nadi Shodhana). |
| Attention light moves to each stage's locus | Each compiled `attention` / `visual` event maps to a body point via `sit/loci.mjs` (`bodyLocus(target,size)`: nose tip, forehead, crown, base of skull, throat, heart, navel, feet, fingertips, central channel, whole body, space…). A move between two points glides (body.js `setLocus` glide, ~1 s ease) instead of fading out and in. A small "attention: …" label names it. |
| Gentle stage text + soft bells | One caption line at a time (the narration script, our words), fading; quote lines shown under it where the licence allows. Bowl to begin, chime at each stage and at each join in a routine, two bowls to end. All modal-synthesised in WebAudio (no samples). |
| Length picker | "As written" + 5/10/15/20/30/45/60 min. Longer: the practice's own adjustable rounds first (e.g. Ajaan Lee's stillness breaths), then silent **open sitting** in the last stage (rule `open-sitting`, one line "Stay with this, in your own time."). Shorter: beginner form, then optional stages dropped; if it still doesn't fit, the plan says "runs N min as written". It never invents steps. |
| Eyes-closed mode | The screen goes almost black, with the HUD and captions barely visible. Bells (and voice if on) carry the session. Tap to open. Toggle on the start card, the HUD button or `E`. Wake lock while sitting. |
| Voice | Off unless chosen. Uses the rendered Fish clips where they exist (Method 1), otherwise the browser's `speechSynthesis`. Our wording only. |
| Mic | **Off by default** ("Follow my breath (mic)", opt-in). When on, the light follows the breath sound (`breath/breath.js`). If the mic is refused, it falls back to the guide with a one-line note. |
| Stop | Esc or ■ stops it at once (voice cancelled, mic released). Space pauses. End card: Sit again / Choose another. |
| Reduced motion, phone | `prefers-reduced-motion` or `?reduce`: motion at 45%, the body still breathes. Phones (<600 px or ≤2 cores) get the lighter particle tier, DPR ≤ 1.5. There is a Canvas2D orb fallback without WebGL2, 44 px+ controls and safe-area insets. The start card's Begin and plan line stay pinned while the list scrolls. |
| "From the text" | Per stage, a sheet lists the passages behind it: the segment label + paragraph (¶) or verse numbers, a **source** link, and the quote (≤ 25 words) only when `licence.terms.store_verbatim` is true. VBT shows Satsang's own wording plus verse numbers and a link to Hareesh's translation, never his text. Framing (bells, open sitting) says it is framing. |

URL params: `?p=<practice> | ?r=<routine>` `[&min=20] [&voice=1] [&eyes=1] [&beginner=1] [&reduce] [&lq|&hq]`, plus test-only `[&t=<sec>&still] [&sheet] [&end]`.

## 2. Practices built (text → practice pipeline, agent-drafted, validated by code; no model credits spent)
Extractor mode `agent-manual` for every new one. The judgement steps (instruction extraction, narration wording) are an agent draft. `extract.mjs`, `validate.mjs` and `build-practice.mjs` resolve offsets, check every number, place word and quote, and reject on any error.

| Practice (`engine/practices/`) | As written | Stages | Source text | Licence |
|---|---|---|---|---|
| `ajahn-lee-method-2`: Seven steps · Method 2 (rebuilt by the pipeline, replaces the hand-written demo) | 8:02 | long breaths with bud-dho → aware → observe → spread → four ways → resting spots (head; throat to navel) → one spot → whole body | Ajaan Lee Dhammadharo, *Keeping the Breath in Mind*, Method 2, tr. Ṭhānissaro Bhikkhu, https://www.dhammatalks.org/books/KeepingTheBreath/Section0009.html | CC BY-NC 4.0 (evidence: …/Section0002.html) |
| `ajahn-lee-method-1`: Bud-dho · Method 1 (existing worked example) | 15:39 | sitting → Triple Gem → buddho counting → the post → feeling of the breath → bases (head) → refined breath | same book, Method 1, …/Section0008.html | CC BY-NC 4.0 |
| `mn118-anapanasati`: Sixteen steps (MN 118) | 9:51 | sitting mindful → tetrads 1–4 (body, feelings, mind, mental qualities) | Ānāpānasati Sutta, tr. Ṭhānissaro Bhikkhu, https://www.dhammatalks.org/suttas/MN/MN118.html | CC BY-NC 4.0 (evidence: MajjhimaNikaya ebook copyright page) |
| `karaniya-metta`: Goodwill (Sn 1:8) | 2:29 | any posture, awake → may all beings be happy → goodwill without limit | Karaṇīya Metta Sutta, tr. Ṭhānissaro Bhikkhu, https://www.dhammatalks.org/suttas/KN/StNp/StNp1_8.html | CC BY-NC 4.0 (evidence: SuttaNipata ebook copyright page) |
| `vbt-body-as-awareness`: The body as awareness · VBT v. 63 | 2:10 | the whole body at once → body and world as awareness | Satsang's own summary (`sources/ext-45-vbt-practices`) of VBT v. 63; translation consulted: Christopher Hareesh Wallis, https://tantra112.app/vijnana-bhairava-tantra (link + verse only) | our words CC BY 4.0; Wallis translation all rights reserved, never quoted (rule `cite-only-source`) |
| `vbt-space-contemplation`: Spaciousness · VBT vv. 43–48 | 3:27 | space of the room → space inside the body → a thin wall of skin → one field of space | as above, vv. 43–48, plus Hareesh's blog post on vv. 43–48 (linked) | as above; the blog link is labelled "all rights reserved: linked only, never quoted" |

Sources are pinned in `engine/sources/{keeping-the-breath, mn118-anapanasati, snp-1-8-goodwill, satsang-vbt-summaries}/` (edition, licence evidence URL + verbatim sentence, sha256 per segment). Unscripted on purpose: signs/lights and powers (Ajaan Lee), and the VBT retention, mantra and subtle-body practices (teacher only).

New inference rules (`tools/extract/defaults.json`): `sweep-one-breath`, `step-breaths`, `explore-breaths`, `phrase-breaths`, `open-sitting`, `cite-only-source`, `resting-base-default`, `non-body-step-visual`, `first-tetrad-beginner`.

## 3. Routines (`engine/routines/*.json`, schema `engine/schema/routine.json`)
| Routine | Items | Total |
|---|---|---|
| `morning-thai-forest` | Ajaan Lee Method 2 settling steps only (`only_stages`: long-breaths, aware, observe, spread) 5 min → Method 1 20 min (29 stillness breaths + open sitting) → Goodwill 2.5 min | 27:30 |
| `anapanasati-sixteen` | MN 118 15 min → Goodwill 3 min | 18:00 |
| `vbt-spacious` | VBT v. 63 5 min → VBT vv. 43–48 10 min | 15:00 |

A routine item is `{practice, minutes?, label?, beginner?, skip_stages?, only_stages?}`. Licences are inherited (the Thai-forest routines are CC BY-NC: not for sale, paywall or monetised renders).

## 4. Tests (all passing, 2026-10-25)
- `node tools/test-compile.mjs`: **110** compiler checks (existing).
- `node tools/test-text-to-practice.mjs`: **43** (Method 1 worked example, validators' teeth).
- `node tools/test-sit.mjs` (**new, 250**): for **every** pipeline it checks the source hashes and licence evidence; that segmentation, offset resolution and the build are deterministic (`practices/<id>.json` is byte-for-byte what the builder makes); that instructions validate; that every span reproduces in the source; that no actionable passage is dropped; the narration lint and timing slots; that it compiles with no holds (normal + beginner); that it is eligible; and that it quotes only where the licence allows, at ≤ 25 words. VBT checks: own wording, verse numbers and translation link. Session checks: retention practices are refused; every practice fits 5/10/20/30 min or says it runs as written; every focus target lands on the body. Routine checks: every item runs; total ≈ minutes asked; natural breath only, continuous across joins (max gap < 0.6 s) to the end; stages in order; one bowl, chimes at joins, bowls to end; morning routine = settling → Method 1 → goodwill using only the settling stages.
- `python3 tools/validate-schemas.py`: 0 errors (now also validates `routines/*.json`).
- `node tools/shoot-sit.mjs`: 11 headless shots, all checks ok, written to `engine/shots/sit-*.jpg`. Desktop is 1280×800 and phone is 390×844 @2x. Shots cover the start card, Method 1 head bases, the Method 2 spread with "From the text", the VBT sheet, reduced motion, the routine start card, goodwill reached at 25:40, Method 1 inside the routine, eyes closed, and the end card. The shots were run against a local server: the headless browser here has no route to the public preview. The deployed files were then checked byte-identical to local by sha1.
- Known warning (not an error): `vbt-space-contemplation` L04 mentions the base of the skull, which none of its instructions name as a locus.

## 5. Files (engine/ only; committed 2026-10-25 in its own commit, see MERGE-LOG "Sit player commit")
New: `engine/sit/{index.html, sit.js, session.mjs, loci.mjs}`, `engine/routines/*.json`, `engine/schema/routine.json`, `engine/pipeline/{ajahn-lee-method-2, karaniya-metta, mn118-anapanasati, vbt-body-as-awareness, vbt-space-contemplation}/`, `engine/practices/{karaniya-metta, mn118-anapanasati, vbt-body-as-awareness, vbt-space-contemplation}.json`, `engine/sources/{mn118-anapanasati, snp-1-8-goodwill, satsang-vbt-summaries}/`, `engine/tools/{test-sit.mjs, shoot-sit.mjs}`, `engine/shots/sit-*.jpg` (+ `breath-*.jpg` from the earlier breath run).
Modified: `engine/breath/body.js` (additive: same-kind locus glide + optional `gain` on a locus object; the defaults the app's breathplayer uses are unchanged), `engine/practices/ajahn-lee-method-2.json` (now pipeline-built), `engine/tools/extract/{build-practice.mjs (head.sources[].licence override), defaults.json (9 rules), fetch.mjs (pdf_pages + repo-local segments)}`, `engine/schema/source-text.json` (`pdf_pages`, `local`), `engine/tools/validate-schemas.py` (routines), `engine/talk/deploy-talk.mjs` (ships `sit/` + `routines/`, `/sit` redirect), `engine/README.md` (/sit/ section).
Also new: `specs/SIT-PLAYER.md` (this file).
`app/tools/test-practice-engine.mjs` was run against the changed `breath/body.js` before the commit: 813/813 passed. Release path: `RELEASE_ENGINE=1 sh tools/release/release.sh "msg"` stages engine/ too (default release still leaves engine/ out).

## 6. Switching the main site's "Practise with the body" to /sit/ (spec only; app/ not edited)
Today `app/src/collections.js` `withTheBody()` imports `site/breathplayer.js` (from `app/src/breathplayer.js`). That opens `engine/breath` as an overlay parameterised by `app/wisegraph/practice-body.json` (one locus, pace, lead) and logs via `logSheet(... 'player')`.

1. **Map app practice ids → sit ids.** Add `sit` to the entries in `practice-body.json`, e.g. `anapanasati-breath-meditation-method-2 → {sit:{p:'ajahn-lee-method-2'}}`, `goodwill-metta → {sit:{p:'karaniya-metta'}}`, `vbt-body-as-consciousness → {sit:{p:'vbt-body-as-awareness'}}`, `vbt-space-contemplation → {sit:{p:'vbt-space-contemplation'}}`. Add Method 1 and MN 118 when the app gains those practice pages. Routines can hang off course phases as `{sit:{r:'morning-thai-forest'}}`.
2. **Open:** when `p.body.sit` exists, open a full-screen overlay holding an `<iframe allow="autoplay; microphone; screen-wake-lock" src="<engine>/sit/?p=<id>&min=<minutes>">`. Pass `&reduce` when the site's reduced-motion is on and `&eyes=1` when the user chose eyes-closed. Otherwise keep the current breathplayer, which stays the fallback for the 53 single-locus practices.
3. **Log:** listen for `message` events with `data.type === 'satsang-sit-end'`. The payload is `{kind, id, items[], seconds, total, full}`; call `logSheet(p, minutes, Math.max(1, Math.round(seconds/60)), full, ctx, 'sit')`. The same detail is also dispatched in-page as a `sit-end` CustomEvent for a same-origin embed.
4. **Hosting:** either ship `engine/{sit,breath,compile.mjs,grammar.json,practices,routines,pipeline/*/instructions.json,sources/*/source-text.json,renders/*/voice}` under the site (same origin, no iframe needed), or keep the iframe on engine.tantrafiles.xyz until the release. Both work with relative paths.
5. **Copy:** the button reads "Sit with it (hands-off)". Keep the existing "timer" path for needsTeacher / text-only practices, which /sit/ refuses anyway.
6. **Licence display:** keep CC BY-NC attributions visible on the practice page. NC practices must not appear behind any paywall.
