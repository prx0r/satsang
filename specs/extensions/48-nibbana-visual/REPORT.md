# REPORT — 48-nibbana-visual (2026-10-20, extension pack)

The megaseries: dependent arising, nibbāna, perception, signs, and the
vortex modelled as interactive isometric figures using wheresryan22/anatomy
(8100 stars, MIT). The first figure: the twelve-link machine.

## Files

| file | what | status |
|---|---|---|
| README.md | series design + trojan horse strategy | ships |
| figures/twelve-link-machine/build.mjs | Fig 1: twelve-link machine (gear chain) | new, working proof of concept |
| figures/twelve-link-machine/index.html | built page (click any gear to stop the chain) | generated |

## Verification

- Build script runs clean (`node build.mjs`).
- Generated HTML opens in browser, gears are clickable, chain stops on removal.
- Simplified proof of concept — full anatomy skill quality (80+ parts, WebGL
  shaders, audit) is the next build step.

## External dependency

- `wheresryan22/anatomy` (MIT, 8100 stars) — the interactive isometric
  figure skill. Installed via `npx skills add wheresryan22/anatomy -g`.
  Works with OpenCode via `-a opencode`.

## What is NOT here

- Figs 2-5 (sign-lens, papañca vortex, observer machine, what remains) —
  designed in README, not yet built.
- Video production (TTS + figure animation + editing) — the next step.
- Full anatomy skill quality on Fig 1 — the proof of concept is
  functional but simplified; the full version uses the skill's kit
  (iso-kit, lathe, tube, audit) for 80+ parts and WebGL shaders.
