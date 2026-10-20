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

## Next
1. A `#practice` tab in app/site: lazy-load `player/*` + `grammar.json` on the tab (about 60 KB uncompressed). Practice cards come from the v2 practices, with a "Play" button that opens the player full-bleed. Route `/x/<id>/script.json` = `compile()` output (spec §8).
2. The Sivananda book miner (spec §5) emits practice v2 with `do: [{verb…}]` blocks; the compiler resolves verbs through `grammar.verbs`; anything with retention or `confidence < 0.8` goes to the keeper review queue.
3. Grammar v1.1: posture variants (lying, for yoga nidra), granthis, the Tibetan three channels and the middle pillar (deitybody frameworks), and a camera that moves between `full` and `upper` views inside a practice.
