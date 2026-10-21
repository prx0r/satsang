# Satsang practice engine v0

Practice instructions become a real-time picture of what the breath and attention are doing in the body. Spec: `../specs/PRACTICE-ENGINE.md` (§3 script). Visual language: `GRAMMAR.md` + `grammar.json` (extends prx0r/deitybody).

**Preview:** https://engine.tantrafiles.xyz (standalone Worker `satsang-engine-preview`; the live site Worker is untouched)

```
engine/
  grammar.json            loci, regions, paths, colours, motions, verbs, safety (machine-readable grammar)
  GRAMMAR.md              the grammar explained, plus what was taken from deitybody
  compile.mjs             practice v2 → timeline (browser + node CLI), safety caps
  schema/practice-v2.json practice v1 + facets + safety + script blocks
  schema/timeline.json    compiled output (§3 tracks in absolute seconds)
  practices/*.json        6 demo practices (our wording, cited); ajahn-lee-method-1 is built by the text→practice pipeline
  player/engine.js        Canvas2D renderer (~30 KB, no deps): body, channels, particle fluid, bloom, attention, orb
  player/player.js/.css   DOM shell: controls, captions, narration hook, bells, keyboard/TV, gate + info cards
  demo/index.html         loads any practice: /demo/?p=<id>[&t=<sec>&beginner=1&voice=1]
  tools/test-compile.mjs  65 compiler checks       tools/shoot.mjs  headless screenshots → shots/
  sources/<text>/         SourceText: edition, licence evidence, hashed chapter text (TEXT-TO-PRACTICE §2)
  pipeline/<practice>/    passages → instructions → head + narration → timeline (+ ask preloads, build report, REPORT.md)
  tools/extract/          fetch, segment, extract (LLM-or-agent, validated), build-practice, validate, defaults.json (inference rules), PROMPT.md
  tools/media/            tts.mjs (Fish, cached) · align.py (whisper words) · cues.py (bowl synth + earshot) · mix.py (-14 LUFS) · preview.mjs (offline player → mp4)
  tools/test-text-to-practice.mjs  43 pipeline checks   tools/validate-schemas.py  every artefact vs schema/
  renders/<practice>/     voice clips + manifest, cue kit, mix reports, preview video (caches gitignored)
  tools/deploy-preview.mjs  preview Worker + custom domain (curl via the credential gateway)
  shots/                  tv-* (1920×1080) and phone-* (390×844 @2x) key phases
```

## Use

```js
import { compile } from './compile.mjs'
import { createPlayer } from './player/player.js'      // + <link rel=stylesheet href=player/player.css>
const grammar = await (await fetch('grammar.json')).json()
const p = createPlayer(el, { grammar, compile, practice, options: { beginner: false, voice: false } })
p.play(); p.pause(); p.seek(30); p.renderAt(30); p.set({ rounds: 7, beginner: true })
```
CLI: `node compile.mjs practices/nadi-shodhana-sivananda.json --beginner --rounds 3 > timeline.json`

**Keys:** Space/K play-pause · Esc stop · R restart · +/− rounds · > speed · B beginner · V voice · M sound · I info · F fullscreen · 1–5 switch practice (demo). Media keys work; every control is a focusable 44–60 px button for TV remotes.

**Text → practice:** `../specs/TEXT-TO-PRACTICE.md`. Worked example: Ajaan Lee, Keeping the Breath in Mind, Method 1 (CC BY-NC 4.0) → `/demo/?p=ajahn-lee-method-1` with Fish narration and the generated cue kit; preview video `/renders/ajahn-lee-method-1/preview/preview-960x540.mp4`. Optional stages: `&skip=recollection`.

**Narration hook:** captions are the voice track (our words). Set `window.SatsangTTS = { speak(text) → Promise, cancel() }` to use a real TTS (e.g. a server endpoint fronting Fish Audio that caches clips by text hash); otherwise the browser's `speechSynthesis` is used. Voice is off by default, and nothing is generated server-side yet.

**Safety (enforced by compiler and player):** max hold 30 s (or the practice's lower cap); beginner mode applies `safety.beginner_override`, then strips holds over 10 s; a start card shows contraindications and `needs_teacher` before anything plays; `prefers-reduced-motion` drops trails, jitter and ripples and thins the particles.

**Performance:** every visual is an analytic function of t (seeded), so seeking is exact. Particle count is about 300–900 sprites a frame, with one trail buffer, one glow buffer and a 1/5-scale bloom. That is roughly 18 ms a frame at 1280×720 in software rendering (headless), so a GPU-composited device holds 60 fps comfortably.

## Milestone 1 (2026-10-21): visuals + the first VBT play
**Preview:** https://engine.tantrafiles.xyz/play/ (Trace the Sound) · https://engine.tantrafiles.xyz/figure/ (the breathing figure, front + side)

```
  body/breath.mjs        breath model: lung volume → belly / ribs / collarbones / shoulders / diaphragm / airflow (pure)
  body/figure.mjs        seated figure as crisp SVG line art, front + side, driven by breathState (pure geometry + DOM builder)
  fx/wave.mjs            the sound wave: answers the voice, travels inward, fades, holds a flat line (pure)
  fx/glow.js             raw WebGL2 glow layer (instanced additive sprites): breath-synced locus glow, prana particles riding the wave
  player/clock.mjs       the shared clock: gated narration (pause starts when the voice stops), pauses, hold-open, rest timer (pure)
  player/play.js/.css    the play player (SVG + WebGL + clock + narration), API for the realtime bus: player/API.md
  player/figure.css      the figure's line-art style (dark deitybody look)
  play/index.html        /play/?p=<id>[&voice=0&view=front|side|both&still=<t>|end&rested=<s>&level=first-steps&reduced=1]
  figure/index.html      /figure/?view=front|side|both&style=full|abdominal|thoracic|clavicular|natural[&t=<s>&reduced=1]
  practices/vbt-trace-the-sound.json   the play (7 gated segments; closest to VBT vv. 38-41, link + verse numbers only)
  renders/vbt-trace-the-sound/voice/   pre-rendered Phonon narration (mp3 + manifest with dur_s, 25 fps loudness env, whisper match)
  tools/media/tts-phonon.py            narration renderer (swap the voice: --voice <catalog name>, --model hf://…)
  tools/test-play.mjs (103 checks) · tools/test-play-browser.mjs (21 API checks, headless) · tools/shoot-play.mjs → shots/
  THIRD_PARTY_NOTICES.md               every licence (Phonon 31m + Everly voice Apache-2.0; no third-party JS shipped)
```
- Reduced motion (`prefers-reduced-motion` or `&reduced=1`): no WebGL, the wave shape holds still (only its amplitude eases), the figure
  breathes at 45 % with no airflow streaks, no CSS animation.
- Narration: `python3 tools/media/tts-phonon.py practices/<id>.json` then `/workspace/pyenv/bin/python tools/media/align.py
  renders/<id>/voice/manifest.json`. The player reads only the manifest, so any TTS that writes the same manifest is a drop-in.
- Tests: `node tools/test-compile.mjs` · `node tools/test-text-to-practice.mjs` · `python3 tools/validate-schemas.py` ·
  `node tools/test-play.mjs` · `node tools/test-play-browser.mjs` (needs `sh ../shot-setup.sh`). Deploy: `node tools/deploy-preview.mjs`.

## Next
1. A `#practice` tab in app/site: lazy-load `player/*` + `grammar.json` on the tab (about 60 KB uncompressed). Practice cards come from the v2 practices, with a "Play" button that opens the player full-bleed. Route `/x/<id>/script.json` = `compile()` output (spec §8).
2. The Sivananda book miner (spec §5) emits practice v2 with `do: [{verb…}]` blocks; the compiler resolves verbs through `grammar.verbs`; anything with retention or `confidence < 0.8` goes to the keeper review queue.
3. Grammar v1.1: posture variants (lying, for yoga nidra), granthis, the Tibetan three channels and the middle pillar (deitybody frameworks), and a camera that moves between `full` and `upper` views inside a practice.
