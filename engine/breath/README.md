# /breath/ — one breathing page

A seated body made only of light on a white page, always breathing. Self-contained: `index.html` + `breath.js` (the breath) +
`body.js` (raw WebGL2 renderer). No libraries, no command bus, no narration. Live: https://engine.tantrafiles.xyz/breath/

Look follows prx0r/deitybody's lab: white bare canvas, soft bloom, GOLD #c9a45c / TEAL #5ec4b6 (ida, screen right) /
ROSE #d4899a (pingala, screen left), sushumna up the centre, the seated canon from `site/engine/primitives/vitruvian-figure.js`
sampled as particles (motes on the surface, light threads along the limbs, haze, seven loci). Original code; no deitybody or
three.js code is copied.

## Breath
- **Idle**: pacer 4.2 s in / 6.0 s out (~5.9 breaths/min), smooth turns, never a hold.
- **Hold / release** (pointer or Space): the body mirrors the hand (light fills up the centre while held, recedes and loosens
  into aura on release). After two or more breaths, when the hand rests, the pacer carries on at the hand's rhythm and leads it.
- **Mic** (opt-in button): the breath-sound envelope (a proxy, not a measurement) brightens and stirs the light directly; the rhythm
  is read by autocorrelation of the last ~40 s, the pacer adopts it, phase-locks to the louder (assumed exhale) onsets, and leads.
- **Leading** (after deitybody TĀ 4.91): +4% every 3 cycles, exhale first, out ≤ 1.6 × in, cycle ≤ 11 s (~5.5/min), no holds or
  retention; with the mic it waits when the breather hasn't caught up and eases back when they don't follow.
- **Stop** (■ or Esc): mic released, sound off, the body dims to a slow resting breath. Tap to begin again.
- Sound (optional): band-passed noise per phase, after deitybody's `breathSound`; muted while the mic listens.

Phones: half the particles, DPR ≤ 1.5. `prefers-reduced-motion` (or `?reduce`): motion at 45%, still breathing.
Test params: `?hq` / `?lq` force the particle tier. `node breath/shoot.mjs` (needs `../shot-setup.sh`) writes `shots/breath-*.jpg`
and checks hold/release, rhythm adoption, a synthetic mic breather and one-tap stop.
