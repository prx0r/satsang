# Text → practice: model prompts (v1, 2026-10-21)

The pipeline has exactly two places where judgement is needed: **A. extracting instructions** from passages and **B. writing narration lines**. Both are fenced by deterministic code: the model never computes offsets, timings or counts it can't quote, and its output is rejected unless `validate.mjs` passes. `extract.mjs --llm <model>` sends §A (temperature 0, JSON mode, one repair round with the validator's errors, then stop). §B is the same contract for `narration.json`.

When no model key is usable (this sandbox: the OpenRouter key is not exposed to the shell), an agent writes the draft by hand following these prompts, and `extract.mjs --draft` / `build-practice.mjs` run the identical resolution and validation. The artefacts are the same either way; `extractor.mode` records which.

---

## §A Extraction prompt (sent verbatim; `{{…}}` filled by `buildPrompt`)

You turn a meditation manual into atomic, cited instructions. You are careful, literal and conservative.

PASSAGES (id, then the exact text):
{{PASSAGES}}

BODY VOCABULARY (use only these ids for attention targets, loci, regions and paths):
{{GRAMMAR}}

INFERENCE RULES (the only allowed source of a value the text does not state):
{{RULES}}

OUTPUT: one JSON object matching this schema (`instructions_draft`): {{SCHEMA}}

Rules:
1. One instruction per atomic action (sit, recite, count N breaths, move attention from A to B, settle at A, spread from A over R, widen awareness, a caution, an image, a conditional response, the teacher's stated aim, a pointer to another method).
2. Every instruction has `spans`: `{passage, quote}`. `quote` must be copied character for character from that passage (keep curly quotes, dashes, diacritics). Never write offsets. Use several spans when an instruction spans sentences.
3. A field is either supported by the quote's words, or carries `prov.<field>` = `{basis, rule|cite, note}`:
   - `paraphrased`: the meaning is in the quote, the mapping is yours (e.g. "the nostrils" → `nose_tip`); say how in `note`.
   - `inferred`: not in the quote. Give an inference rule id from the list, or `cite` another passage id that states it. Never invent a number without one of these.
4. Counts: `count.value` must be a number the quote states ("ten times" → 10). If the text says "back and forth" with no number, the count is inferred (rule `count-by-analogy` only if parallel steps give one).
5. Conditions ("when you've reached…", "if signs appear…") go in `conditions`. Work that only happens on a condition the meditator may never meet (signs, lights, visions) gets `scripted: false` + `exclude_reason`, and `ask: true` when it should become a preloaded answer.
6. Claims of powers, outcomes and doctrine are `action: intent` or are left out via `coverage_rules` with a reason. Never turn a promised result into an instruction.
7. Cautions from another chapter may be used for safety with `prov.applies_to = {basis: inferred, rule: caution-cross-method}`.
8. `confidence` 0–1 per instruction; below 0.8 goes to human review.
9. Group instructions into `stages` (short ids, plain labels). A devotional opening is `optional: true`.
10. Every passage whose `kind_guess` contains instruction or warning must end up used by an instruction or covered by a `coverage_rules` entry with a reason.

## §B Narration prompt

You write the spoken guide for a practice, one line per timing slot, from the instructions and the practice blocks (ids given).

- Plain modern English, second person, present tense, calm. Short: a line must finish (at about 1.8 words/s) before the next line's block starts; breath-locked lines usually fit 4–5 s. Split a long instruction across the in- and out-breath blocks ("…").
- Each line: `{id, block, basis, instructions, text}` (+ `say` for pronunciation, `quote` for an optional original-text line shown under the caption).
- `basis`: `quoted` (the source's words), `paraphrased` (its meaning), `inferred` (anything the source doesn't say: an accessibility option, "at your own pace", a line used outside its condition; give `inferred.rule` and `note`), `framing` (a welcome or close, no technique).
- Numbers in a line must be counts its instructions quote. Never say an inferred count unless the line is tagged `inferred`. Never mention a body place its instructions don't use. Never narrate an unscripted instruction (signs, lights, powers).
- No promises of results; describe the teacher's results only as his description, in the Ask layer.
- `quote` lines: verbatim from one of the line's spans, ≤ 25 words, shown and never spoken (Pali is shown, not read by TTS).

## Validation (what the tools enforce)

| Check | Where | Fails when |
|---|---|---|
| quote is verbatim, unique in its passage | `extract.mjs resolve` | the model paraphrased the "quote" |
| offsets reproduce the quote; passage hash = source hash | `validate.mjs`, tests | text or offsets drift |
| count / duration / locus / attention / breath phase supported or `prov` | `validateInstructions` | a value appears from nowhere |
| `inferred` names a known rule or a real passage | `validateInstructions` | unexplained inference |
| unscripted ⇒ `exclude_reason` | schema + validator | silent drops |
| coverage: no actionable passage `uncovered` | `coverage` | instructions lost |
| narration numbers ⊆ quoted counts; inferred numbers only on inferred lines; place words ⊆ the line's loci; no unscripted instruction narrated; quote lines verbatim ≤ 25 words | `validateNarration` | the voice says what the source doesn't |
| measured speech + 0.6 s ≤ time until the next line (normal and beginner forms) | `build-practice.mjs` | the voice runs into the next instruction |
