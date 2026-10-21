# MERGE-NOTES — 48-nibbana-visual (for the lead agent)

## Merge steps

```bash
cd <satsang>
# 1. figures -> site (static HTML pages)
mkdir -p site/nibbana
cp -r <ext>/48-nibbana-visual/figures/* site/nibbana/
# 2. docs -> docs/
cp <ext>/48-nibbana-visual/README.md docs/NIBBANA-VISUAL.md
# 3. validate
python3 specs/schema/validate.py
python3 <ext>/11-site-runtime/check_pack.py --repo . --pack <ext>/48-nibbana-visual
```

## Before deploy

- The twelve-link machine is a simplified proof of concept. The full
  version uses the anatomy skill's kit for 80+ parts and WebGL shaders.
  Install with: `npx skills add wheresryan22/anatomy -g`
- Figs 2-5 are designed in README but not yet built. Build order:
  Fig 1 (done) → Fig 2 (sign-lens) → Fig 3 (vortex) → Fig 4 (observer)
  → Fig 5 (what remains).
- Video production: TTS the doctrine voice (VBT-DOCTRINE.md), animate
  the figure, edit together. The trojan horse strategy is in README.
