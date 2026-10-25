# Satsang Practice Media: sound + premium short videos (spec v0, 2026-10-20)

> **Status (2026-10-25):** **partial**. Voice renders exist in engine/renders (Phonon / Fish, owner has not listened yet); premium short videos not built.

Reuse the gcomedy video stack (prx0r/gcomedy series/BUILD-PIPELINE.md): HyperFrames (deterministic seek(t) render + GSAP), Fish Audio voices (word timestamps), earshot (procedural SFX bank `sfx`/`kit`, `critique`, `match`, -14 LUFS master), Jev frame QC. One source of truth: the practice Script (engine/compile.mjs timeline). The same timeline drives the live player, the sound layer and the rendered videos.

## 1. Sound design (earshot, v3 or the version pinned in gcomedy essay1/tools/earshot)
Sound vocabulary bound to Script events (grammar.json gets an `audio` map):
| Event | Sound | Notes |
|---|---|---|
| session start / end | singing bowl strike, long tail | end = two strikes |
| phase change in→hold→out | soft wooden tick or low "bleep" (sine, 40 ms, -24 dB) | optional; off by default for advanced users |
| count tick | very quiet click per count | "metronome" toggle |
| hold build | sub-bass swell rising with the hold, released on exhale | mirrors hold-glow shimmer |
| exhale / dissipate | airy noise whoosh, high-shelf rolled off | mirrors smoke |
| Kapalabhati stroke | short low thump per stroke | sync to pulse motion |
| Bhramari | a drone at the user's hum pitch (later mic-driven) | violet field |
| round end | tiny chime | |
| time up | three soft rising chimes plus a bowl | timers and routines |
| warning / safety stop | distinct two-tone, never used elsewhere | |
Build: `earshot sfx <id>` renders each from the 201-effect bank → `engine/audio/*.ogg` (mono, 48 kHz, < 30 KB each, total < 400 KB); `earshot match` verifies each against its description; loudness-normalised so cues sit -18 to -24 dB under the voice. A WebAudio fallback synth (sine/noise envelopes) for the cues so the player still works without files. Ambient beds (tanpura, room tone): royalty-free or generated only, per-practice, ducked under voice.

## 2. Narration
Fish Audio (`s2.1-pro-free`, a calm voice chosen and approved by the user; never a real teacher's voice) from the Script voice track; word timestamps saved with the cached audio (key = hash(text, voice, rate)); phase-locked lines are placed on phase events, never stretched. Languages later. Browser speechSynthesis stays the free fallback in the player.

## 3. Premium short videos (HyperFrames)
Inputs: practice JSON → compiled timeline → HyperFrames composition reusing the player's renderer as a seek(t) canvas (no separate art).
Formats: 9:16 (30–60 s "how to do X", for Shorts/Reels/TikTok) and 16:9 (2–10 min full guided session for YouTube/TV), and a square 1:1 loop for social.
Structure of a short: hook title (0–2 s, e.g. "What your attention does in Nadi Shodhana") → one full round slowed with captions → key-moment callouts (gold overlay labels for loci and phases: two-channel rule, plain voice + precise overlays) → safety line → end card "Practise along on Satsang" + URL.
Type: the site's serif for titles, Inter for captions, gold mono for counts/timers. Colours from the engine grammar only.
Audio: narration + earshot cues + bed, mixed and mastered to -14 LUFS; `earshot critique` gate.
QC: `hyperframes lint` 0 errors; probe stills at each phase; Jev checks for legibility; a human 1x watch before publishing.
Output: `engine/renders/<practice>/<format>.mp4` + a poster jpg + a chapters JSON; each becomes a VideoObject (with Clip key moments per phase) on the practice page (feeds the Google/AI-search plan in DISCOVERABILITY.md). Hosting: our own YouTube channel later (needs the user's account); until then files only.

## 4. Gates (stages, as in BUILD-PIPELINE)
1 practice JSON valid + sources/confidence → 2 compile + safety lint → 3 voice render + timestamps → 4 SFX kit render + match → 5 composition + lint + probe stills → 6 mix + earshot critique → 7 frame QC → 8 render → 9 human watch → 10 publish + VideoObject.

## 5. Open choices (refine later)
- The voice (which of the 7 Fish clones, or a new calm one).
- Cue density defaults (minimal vs metronome).
- Whether Bhramari/chant practices use the user's mic for live pitch (privacy: on-device only).
- Music beds: generate vs license.
- Wearables: haptic patterns mirror the audio cue map 1:1.
