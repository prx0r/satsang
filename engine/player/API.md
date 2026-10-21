# Satsang play player API (engine milestone 1)

`player/play.js` is the player for **plays** (VBT "play, not meditation" practices, `kind: "segment"` scripts) and for any breath
practice that wants the SVG figure + WebGL glow layer. It is driven by one shared clock (`player/clock.mjs`): narration segments,
pauses, breath animation, the sound wave and the rest timer all read the same `t`. The realtime command bus (`engine/rt/`, owned by
the satsang-rt-bus agent) drives it through the methods below, or through `dispatch({ cmd, args })` with the same names.

The older Canvas2D player (`player/player.js`) is unchanged and keeps its own API (README "Use").

```js
import { compile } from '../compile.mjs'
import { createPlay } from '../player/play.js'          // + <link rel=stylesheet href="../player/play.css">
const grammar = await (await fetch('../grammar.json')).json()
const practice = await (await fetch('../practices/vbt-trace-the-sound.json')).json()
const media = await (await fetch('../renders/vbt-trace-the-sound/voice/manifest.json')).json().catch(() => null)
const p = createPlay(document.getElementById('stage'), { grammar, compile, practice, media, options: { voice: true } })
p.on('*', ev => bus.send(ev))         // every event, see "Events"
p.play()
```

`createPlay(root, { grammar, compile, practice, media?, options? })`
- `media`: a voice manifest (`renders/<id>/voice/manifest.json`, schema `render.json#/$defs/voice_manifest`). Its measured clip
  lengths replace the compiler's word-count estimates (`compile(..., { speech_s })`), and its files are what `speak` plays for
  scripted lines. Without it, scripted lines fall back to `window.SatsangTTS` and then `speechSynthesis`; with voice off they are
  captions only and the clock runs on the estimates.
- `options`: `{ voice: bool (default true when media), muted: bool, level: 'first-steps'|'steady'|'deep', reducedMotion: bool
  (default: prefers-reduced-motion), view: 'front'|'side'|'both', webgl: bool (default true), autoplay: bool, rest_cap_s: 600 }`.

## Commands
All commands return synchronously (a plain object `{ ok, ... }`) and emit a `command` event. Ids are timeline ids: a segment id
(`find-a-sound`), a breath id (`in-L`, `hold_in-2`), or a stage id. `round` picks the iteration when an id repeats.

| Method | Args | Does |
|---|---|---|
| `play()` | | Start (closes the start card) or restart after the end. |
| `pause()` | | Freeze the clock; stops the voice and holds the visuals where they are. |
| `resume()` | | Continue from the pause. A gated line that was cut resumes from the line's start. |
| `seek_phase(id, { round? })` | segment / breath / stage id | Jump to the start of that phase. Voice for a segment restarts with it. |
| `replay_phase(id?, { slow?: 0.5..1, round? })` | default: the current phase | Go back to the start of the phase and play it again at `slow` (default 0.75) until it ends, then 1×. Narration plays at the same rate (pitch preserved). |
| `repeat_round()` | | Plays the current round again (round practices); for a play, starts the play again from its first segment (plays are meant to be repeated). |
| `set_level(level)` | `'first-steps'` \| `'steady'` \| `'deep'` | Recompiles (first-steps = the beginner form: `safety.beginner_override`, holds over 10 s removed). Keeps your place: same phase id, same offset. |
| `extend_pause(seconds, { segment? })` | +/- seconds (pause floor 2 s) | Lengthens (or shortens) the pause of the current (or named) segment. Recompiles with `pause_adjust`; later segments shift. |
| `highlight_locus(id, { seconds?: 6, colour?: 'awareness', label?: bool })` | grammar locus or region id (aliases ok) | A breathing glow + ring on that locus for `seconds` of wall time. Does not move the clock. |
| `show_explainer({ title?, text, locus?, seconds?, pause?: true })` | | A small card over the stage (and `highlight_locus` if `locus`). Pauses by default; closing it resumes. `seconds` auto-closes. |
| `speak(text, { gate?: true, interrupt?: false })` | our own words only | Live line from the bus (e.g. a Qwen reply). Plays through `window.SatsangTTS` (else `speechSynthesis`). With `gate`, the clock holds still while it speaks, then continues. `interrupt` cuts a scripted line first. |
| `end({ reason? })` | | Ends now: the end card with the rest time ("You rested in the silence for 47 seconds"). |
| `dispatch({ cmd, args })` | `cmd` = any method name above | For the bus. `args` is an array (positional) or an object (passed as the first argument). Unknown `cmd` returns `{ ok:false, error }`. |

Also: `on(type, fn)` / `off(type, fn)` (`'*'` = all), `state` (getter), `timeline` (getter), `renderAt(t)` (deterministic still for
screenshots/tests), `set({ voice, muted, view })`, `destroy()`.

## State (`p.state`)
```js
{ t, total, playing, waiting /* gate: clock held for speech */, ended, rate, level,
  segment: { id, n, of, part: 'speak'|'pause', t0, speak_end, end } | null,
  phase: { id, phase, sub, round } | null, silence: bool /* inside a flat_hold pause */, rested_s, view }
```

## Events
`{ type, t, ...payload }`, emitted on the clock (so seeks emit nothing for skipped spans):
- `state` (play / pause / resume / ended / waiting changes), `command` `{ cmd, args, ok }`
- `segment_started` `{ id, n, of }` · `speech_started` `{ id, text, live? }` · `speech_ended` `{ id, early_s? }`
- `pause_started` `{ id, pause_s }` · `silence_entered` `{ id }` (flat line reached) · `rest_tick` `{ rested_s }` (every 5 s)
- `breath_in` / `breath_out` / `hold_started` / `rest_started` (from `body/breath.mjs breathEvents`)
- `ended` `{ reason, rested_s, total_s }` and a `practice_log` row is written to `localStorage['satsang.practice_log']`
  (`{ practice, at, seconds, rested_s, source: 'player' }`, PRACTICE-ENGINE §7.1 shape, device only).

## Clock rules (`player/clock.mjs`, pure, node-tested)
- `t` advances by real time × rate while playing.
- **Gate:** a voice entry with `gate: true` holds the clock at its `speak_end` until `speech_ended` arrives; if the speech ends
  early, the clock jumps to `speak_end`. So a pause always starts when the voice stops, whatever the voice's real length.
  With voice off or muted there is no gate (captions on estimated timing).
- **Live speech gate:** `speak(text, { gate: true })` freezes `t` until the line ends.
- **Hold open:** a segment with `hold_open: true` (the last silence of a play) does not end the play when its pause runs out; the
  clock stops at the end and the rest timer keeps counting until the user taps "I'm back", `end()`, or `rest_cap_s`.
- Rate changes (replay_phase slow) apply to the clock and to the narration's `playbackRate`.
