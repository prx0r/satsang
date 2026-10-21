# Third-party notices: Satsang practice engine (engine/)

Satsang is non-commercial (owner's licensing stance, 2026-10-21). Every third-party piece the engine ships or uses at build time is listed
here with its licence. Code in engine/ is our own unless listed.

## Shipped with the preview (runtime)
| What | Where | Licence | Notes |
|---|---|---|---|
| Narration audio for "Trace the Sound" | `renders/vbt-trace-the-sound/voice/*.mp3` | Generated with Phonon 31m English (model weights **Apache-2.0**, https://huggingface.co/gradium/phonon-31m-en, pinned snapshot 8c64b55e) and the catalog voice **Everly** (gradium/phonon-voices, **Apache-2.0**, https://huggingface.co/gradium/phonon-voices) | Text is Satsang's own wording (after the owner's VBT doctrine). A generic catalog voice, not named after or cloned from any teacher. Swappable: `python3 tools/media/tts-phonon.py <practice> --voice <name>` rewrites the manifest; the player reads only the manifest. Phonon 40m voices/models are CC BY-NC 4.0 (acceptable here as non-commercial) but are not used by default. |
| Fonts: Cormorant Garamond, Inter Tight | loaded from Google Fonts | SIL Open Font License 1.1 | Same as the live site. |

No third-party JavaScript is bundled. The WebGL2 glow layer (`fx/glow.js`), the SVG figure (`body/figure.mjs`), the wave (`fx/wave.mjs`) and the
clock (`player/clock.mjs`) are original code. No Three.js, regl, paper-design/shaders or LYGIA code is included (all were allowed; none
turned out to be needed). Technique credit, no code copied: instanced point-sprite particles with additive blending as popularised by
mapbox/webgl-wind (ISC) and fieldplay (MIT).

## Build-time tools (not shipped)
| Tool | Licence | Used for |
|---|---|---|
| ptts 0.4.0, Phonon runtime (gradium-ai/xn-ptts) | MIT OR Apache-2.0 | Pre-rendering narration (`tools/media/tts-phonon.py`) |
| faster-whisper + Whisper base.en | MIT | Word timestamps + intelligibility gate (`tools/media/align.py`) |
| FFmpeg | LGPL-2.1+ (system binary) | Trim, loudness-normalise (-18 LUFS), mp3 encode |
| puppeteer-core, Chromium (Playwright build) | Apache-2.0 / BSD-3-Clause | Headless tests and screenshots |

## Texts and sources
- Vijñāna Bhairava Tantra vv. 38-41: the play "Trace the Sound" is our own, loosely after these verses. Christopher Wallis (Hareesh)'s
  translation (2018 PDF) is **all rights reserved**: we link to his per-verse blog posts and give verse numbers only; no text is reproduced.
  Links: https://hareesh.org/blog/2024/10/1/vijnaana-bhairava-tantra-verses-38-amp-39 · https://hareesh.org/blog/2024/12/7/vijaana-bhairava-tantra-verses-40-amp-41 ·
  free full text (link only): https://tantra112.app/vijnana-bhairava-tantra
- Visual grammar extends prx0r/deitybody (the owner's own project); see GRAMMAR.md.
- Ajaan Lee, "Keeping the Breath in Mind" (dhammatalks.org, CC BY-NC 4.0) and Sivananda texts: see pipeline/*/REPORT.md and sources/*/source-text.json.
