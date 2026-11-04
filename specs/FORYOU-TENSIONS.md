# For You from the journal's tensions: Resolve, Enlighten, Explain (spec + implementation, 2026-11-05)

> **Status (2026-11-05):** **shipped** (see BRIEF for the live version). Code: `app/wisegraph/knots.json` (the knot vocabulary),
> `app/tools/build-knots.mjs` → `app/site/data/wisegraph/knots.json`, `app/src/tensions.js` (pure planner), `app/src/journal.js`
> (stores the tensions, renders the blocks, "This helped" / "Not this"), `app/src/foryou.js` (blocks above the list, their talks
> removed from it). Tests: `tools/awaken/test-foryou-tensions.mjs` (15). Eval: `tools/awaken/eval-foryou.mjs` → `private/foryou/` (gitignored).

Owner's ask (2026-11-05): make For You genuinely good. For each tension in the person's journal, find talks that could
**resolve** it (a practice or teaching that works on that knot), **enlighten** it (reframes it from the view: Trika's
contraction and recognition, no-self, the witness) or **explain** it (the mechanism, the text, the tradition's map).

## 1. What the page shows
"From your journal" on For You (above the ranked list), one block per tension:
- the tension's own short title (its file name, at most four words; shown only on the person's device), a status chip
  (open / loosening / "from your entries"), and "Not this one" (mutes the block for 30 days);
- three rows, **Resolve** · *a practice or teaching that works on it*, **Enlighten** · *sees it from the view*,
  **Explain** · *what is going on*, each with 1–3 cards. A card is a talk (plays on the site's player), a transcript
  moment (an inline privacy-enhanced embed from the passage's second, "▶ From m:ss") or a practice (`#practice/<id>`);
- every card: a why-line in Satsang's words, "This helped" and "Not this";
- then "Enough for today", and the usual For You list, with every talk already in a block removed (never one talk twice).
The Watch rail shows the first pick of each role, block by block (≤ 6), why-lines prefixed with the block title.

| block | picks |
|---|---|
| open tension | Resolve 3 (2 talks + 1 practice when one fits), Enlighten 2 (a Trika lead, then another view), Explain 2 |
| loosening tension | 1 per role, gentler (guided / kindness items first, talks over 25 min last) |
| concern from the entries (U ≥ 0.4, "issues", no tension covers its knot; ≤ 2) | 1 per role, titled with the concern's label |
| resolved tension | at most one "Integration" pick (the best Enlighten item) |

## 2. Knots (generic, public, hand-written)
`app/wisegraph/knots.json`: 11 knots (craving, livelihood, shame, doubt, anger, fear, grief, relationships, restless, sloth,
illness). Each has `match` (the tension's `domain`, words in its summary or opening, its `roots`), `core` cues (does the talk
name the knot), per-role cues with a why-line each, optional `neg` cues (e.g. moral-shame talks kept low for the shame
knot: hiri is a different thing from shame about who one is), the practices that count as Resolve, and a passage regex for
transcript moments. Shared lists: `grounding` (unsettled state), `intense` (never in gentle or unsettled mode, never as
Resolve when teacher-only), `avoid` (prosperity rituals, mythology, shorts). Nothing in it comes from a journal.

## 3. Build (`app/tools/build-knots.mjs`, inside `deploy.sh build`)
Per knot × role, every eligible talk (horizontal, not footage, not held, re-uploads collapsed) is scored:
```
s = core.w + roleCue.w + 0.3·min(.8, generic role cues) + 0.3·role-topic fit + tier (gold .35, strong .2)
    + Trika (.35 on Enlighten, .15 otherwise) − neg cues − length (≤ 1 min −.5, > 45 min −.25, > 90 min −.5 unless a moment)
    + transcript evidence (a window of ≤ 3 passages with ≥ 2 knot hits: .06/hit when the title already names the knot, .2/hit when not)
```
A talk needs a core match, a specific role cue (w ≥ 1) or transcript evidence. Top 14 per role (≤ 2 per teacher) are kept as
pointers `{k, id, start?, end?, s, why, t, tr, tier, g, d}`; a passage inside a talk of 20 min or less, or at its start, is
evidence only (the talk plays whole). Transcript text never leaves the script; the committed file is kept when the internal
passages are not on the machine (`KNOTS_FORCE=1` rebuilds without moments).

## 4. Planner (`app/src/tensions.js`, on the device)
Blocks ordered open → loosening → entries → resolved, then by urgency `U = status (1 / .6 / .15) · (.5 + .5 · the knot's
concern U) · .7^(times "This helped" in 30 days, floor .3)`. One pass fills them in that order with page-wide rules: never a
held teacher (`HELD_MAIN` + person safety records), never one video twice, one talk per teacher per block, a teacher already
on the page costs .35 per earlier pick (hard stop at 3). Candidates come from the block's top knots (secondary knots at ≤ .56
weight). Trika first: on Enlighten a Trika talk within 80 % of the best leads; in open blocks within 90 % on every role.
"This helped" adds up to +.6 to items by the same teacher (+.3, ×.4 from another block), Trika (+.1) and the same knot × role
(+.1), and calls For You's "more like this" for that talk. "Not this" hides a pick for 30 days (`wiser.journalNot`).

## 5. Safety (AWAKENING-ALGORITHM §7.2, unchanged classes)
crisis / emergency → the safety card only, no picks · unsettled → Resolve only, grounding practices and talks on kindness,
mindfulness, daily life or guided sits · soften / stop → the gentle note once, no intense topic, no teacher-only or intense
practice · held teachers never. Why-lines are pointers, never promises, and pass the `BANNED` lint.

## 6. Privacy
`wiser.journal.signals.tensions` (title, status, domain, roots, opening words for matching), `wiser.journalHelped`,
`wiser.journalNot` stay on the device (Stop reading my journal deletes all four keys). The eval names tension titles and lives
in `private/foryou/` only; `deploy.sh guard` and `tools/release/secret-scan.sh` refuse it, and the guard refuses a tension store
in dist or the open data.

## 7. Tests and eval
`node tools/awaken/test-foryou-tensions.mjs` (15, synthetic tensions): titles and knot mapping; order and integration pick;
budgets (open 1–3 per role with a practice slot, loosening ≤ 1); held teacher never, even as the best match; no talk twice,
teacher limits; Trika lead; crisis / unsettled / soften; "This helped" lowers the tension and raises the helped teacher;
"Not this" and muted tensions; entry blocks; null without a journal, determinism, < 50 ms; on the real knot table every talk
names its knot in title or why and why-lines pass the lint; Trika present in open blocks; knots.json carries pointers only.
`node tools/awaken/eval-foryou.mjs [owner/repo]` runs the real public journal and writes the picks for judgement (private).
Screenshots: `node tools/shots/shot-foryou-tensions.mjs shots/foryou` (local) or `LIVE=1 …` (live).

## 8. Known limits
Transcripts cover 238 videos (Hillside-heavy), so moments rarely win for these knots. Knots beyond the four in the owner's
journal (anger, fear, grief, relationships, restless, sloth, illness) were tuned lightly. Gaps found by the eval go to the
content loop (`specs/JOURNAL-TO-VIDEO.md`) as video requests, owner-approved.
