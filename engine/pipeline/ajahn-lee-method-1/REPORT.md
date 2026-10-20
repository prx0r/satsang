# Worked example: Ajaan Lee, *Keeping the Breath in Mind*, Method 1 → `ajahn-lee-method-1`

**Source.** Ajaan Lee Dhammadharo, tr. Ṭhānissaro Bhikkhu, *Keeping the Breath in Mind & Lessons in Samādhi*, 7th ed. rev. 2017, dhammatalks.org. Method 1 (Section0008) is the practice; Method 2 (Section0009) is cited once for safety.
**Licence.** CC BY-NC 4.0. Evidence: https://www.dhammatalks.org/books/KeepingTheBreath/Section0002.html, "This work is licensed under the Creative Commons Attribution-NonCommercial 4.0 Unported." The page adds: "“Commercial” shall mean any sale, whether for commercial or non-profit purposes or entities." So verbatim storage with attribution is allowed; renders must never be sold or monetised. (The older `ajahn-lee-method-2.json` said "free distribution" and CC-BY-4.0; corrected to CC-BY-NC-4.0.)

## What was extracted
293 passages (Method 1 + Method 2), 45 instructions (36 scripted, 9 not), 7 stages. Method 1 coverage: 58 passages used by instructions, 51 out of scope with reasons, 1 non-instruction, 0 uncovered.
- **Scripted:** posture (half-lotus, hands, body straight); optional recollection of the Triple Gem (Pali shown as quote lines: *Buddho / Dhammo / Saṅgho me nātho*); buddho, dhammo, saṅgho; buddho ×3; the four counting stages **with the text's counts** (bud/dho ×10, buddho/buddho ×7, one buddho per breath ×5, three per breath ×3); stopping the count; relaxed natural breath at the nostrils; don't follow the breath in or out; broad, cheerful, open; don't force; the wide open air; the post at the edge of the sea; dropping buddho; feeling the breath; the bases: nose ↔ forehead **×7**, settle at the forehead; top of the head, breathing in there and spreading through the head; forehead ↔ top **×7**, rest on top; middle of the brain; top ↔ middle (count inferred); awareness broad; the refined breath spreading to the lower body and filling it.
- **Not scripted (kept as data):** the "intuitive powers" passage; signs (heat, cold, tingling, vapour, skull); light work (expand the white nimitta, bring it to the Fifth Base, spread it); pictures; the described results; "study with someone skilled"; "Method 2 is easier"; the knowledge/insight teaching (p12–p25, Theory tab material).
- **Ask preloads (7, status candidate):** signs, pictures, headache (→ beginner form), strain (→ Method 2), mind following the breath, why the bases, is it working.

## What was inferred (every one names a rule in `tools/extract/defaults.json`)
| What | Rule | Value | Why it isn't in the text |
|---|---|---|---|
| breath pace for the orb | `pace-guide` | in 5 s / out 6 s | the text says "relaxed and natural"; narration says "at your own pace" |
| "a moment" at a base | `moment-one-breath` | 1 breath | no length given |
| back-and-forth paced on the breath | `traverse-with-breath` | out to the far spot on the in-breath, back on the out | the text ties moves to no phase |
| top ↔ middle-of-brain repetitions | `count-by-analogy` | 7 (confidence 0.75 → review queue) | "keep moving it back and forth" with no number; the two parallel steps say seven. Narration never says a number here |
| stillness stage length | `stillness-rounds` | 6 breaths (2–40, user control) | "when you've reached this level of stillness" |
| breath-feeling / spread / whole-body breaths | `feel-breaths`, `spread-breaths`, `whole-body-breaths` | 2 / 2 / 3 + 14 s rest | none given |
| one guidance breath per narrated modifier | `guidance-breaths` | 1 each (18 blocks) | lines must not stack |
| attention at the nose tip while counting | `attention-at-nostrils` | cites p3.s3 | counting paragraph names no place |
| "still and expansive", "suffuse the entire body" used without the light sign | `condition-dropped` | flagged on the lines (L43) | in the text they follow the nimitta |
| "or any steady seat" | `posture-accessibility` | line L01 tagged inferred | text gives half-lotus |
| Method 2's headache caution applied to Method 1's head bases | `caution-cross-method` | beginner form skips stage `bases` | stated for Method 2's resting spots |
| lead-in bowl, stage chimes | `lead-in`, `stage-chime` | 6 s, chime | media convention |
Paraphrased mappings (with notes): nostrils → `nose_tip`; middle of the brain → `middle_of_head`; "down into the heart" → `middle_chest`.

## Numbers
Session 15:39 (938.6 s; beginner form 9:14 without the head bases, 4 stillness breaths). 44 narration lines (8 quoted, 32 paraphrased, 3 inferred, 1 framing), 232 s of speech, whisper match 0.97 mean (L09 "Breathing in: bud" and L23 "Bud, dho" are heard as "buddho": acceptable; L09 was rephrased twice for slot fit/clarity, then stopped). Mix: −13.98 LUFS integrated, −4.3 dBTP (session); preview −13.75 LUFS. No breath holds anywhere.

## Rebuild
```
node tools/extract/fetch.mjs sources/keeping-the-breath/source-text.json             # network; re-hashes the chapters
node tools/extract/segment.mjs sources/keeping-the-breath/source-text.json method-1,method-2 pipeline/ajahn-lee-method-1/passages.json
node tools/extract/extract.mjs pipeline/ajahn-lee-method-1/passages.json --draft pipeline/ajahn-lee-method-1/instructions.draft.json --out pipeline/ajahn-lee-method-1/instructions.json
#   or: OPENROUTER_API_KEY=… node tools/extract/extract.mjs <passages> --llm <model> --segments method-1 --context method-2:p23.s1 --out <instructions.json>
node tools/extract/build-practice.mjs pipeline/ajahn-lee-method-1                    # estimate pass (narration at 2.3 words/s)
node tools/media/tts.mjs pipeline/ajahn-lee-method-1                                 # Fish, cached by hash; rerun to resume
/workspace/pyenv/bin/python tools/media/align.py renders/ajahn-lee-method-1/voice/manifest.json   # resumable (90 s budget)
node tools/extract/build-practice.mjs pipeline/ajahn-lee-method-1 --voice renders/ajahn-lee-method-1/voice/manifest.json
node compile.mjs practices/ajahn-lee-method-1.json --out pipeline/ajahn-lee-method-1/timeline.json
/workspace/pyenv/bin/python tools/media/cues.py renders/ajahn-lee-method-1/cues
/workspace/pyenv/bin/python tools/media/mix.py pipeline/ajahn-lee-method-1/timeline.json renders/ajahn-lee-method-1
/workspace/pyenv/bin/python tools/media/mix.py pipeline/ajahn-lee-method-1/timeline.json renders/ajahn-lee-method-1 --from 528.6 --to 564.6 --out preview
node tools/media/preview.mjs ajahn-lee-method-1 528.6 564.6                          # rerun until "done"
node tools/test-text-to-practice.mjs && node tools/test-compile.mjs && python3 tools/validate-schemas.py
```
Not in git: `renders/*/voice/wav/` (TTS cache), `renders/*/cues/*.wav`, `renders/*/mix/*.m4a` (session mix 4.4 MB), `preview/frames/`, `preview-1280x720.mp4`.
