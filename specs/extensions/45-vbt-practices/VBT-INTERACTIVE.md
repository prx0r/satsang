# VBT-INTERACTIVE — the play system (2026-10-20)

Derived from VBT-DOCTRINE.md. Each VBT practice becomes an interactive
experience: TTS voice with timed pauses, a visual element that mirrors
what the practice is doing, and a game-like interaction model. Not
meditation. Play.

## The TTS pattern

Every interactive practice follows the same rhythm:

```
[TTS speaks one sentence]
[PAUSE — silence — 10-20 seconds]
[TTS speaks the next sentence]
[PAUSE]
...
```

The pause IS the practice. The silence after the voice is where it
happens. The TTS names the impossibility directly: you can't force the
mind, you can't not try, you're in a waiting room, the mind is too noisy
to know quiet. That naming is the teaching.

## Practice-by-practice design

### 1. Sound Dissolution (VBT 34-35) — "Trace the Sound"

**Visual:** A sound wave on screen — active, wavy, bright. As the TTS
speaks, the wave responds. During each pause, the wave slowly fades:
bright → dim → flat line → gone. The silence after the last TTS line is
the flat line. Hold it.

**TTS script:**
> "Find a sound. Any sound. The room tone, a fan, traffic, your own
> breath." [pause 10s]
> "Now trace that sound inward. Follow it to where it becomes a
> vibration. Not the source — the sensation." [pause 15s]
> "The sound is fading now. Not because you're making it fade. Because
> that's what sounds do." [pause 20s]
> "What's left when the sound is gone?" [pause 30s — the wave is flat
> now. Hold the silence.]
> "That silence was always there. You just couldn't hear it over the
> noise." [pause 10s]

**Interaction:** Tap to advance the TTS segment. Or let it auto-advance.
The wave animation runs on its own timeline synced to the TTS. After the
last line, the flat line holds for 30 seconds with no voice — just the
wave and the user's own hearing.

**Game element:** Track how long the user rests in the flat line before
tapping to end. Not scored — just noticed. "You rested in the silence for
47 seconds." Save to practice log.

### 2. Castle With Nothing Inside (VBT 48) — "Expand the Room"

**Visual:** Three concentric circles. Outer (room), middle (body), inner
(between thoughts). As TTS speaks, the corresponding circle glows. During
pauses, all three circles slowly merge into one — the boundaries dissolve.

**TTS script:**
> "Look at the room around you. The space between the walls." [pause 10s]
> "Now feel the space inside your body. Between the organs. Inside the
> skull." [pause 10s]
> "Now the space between your thoughts. The gap." [pause 10s]
> "All three spaces. One field. No boundaries." [pause 20s]
> "A castle with nothing inside. What does that feel like?" [pause 30s]

**Interaction:** The circles respond to breath rate (if wearables
available) or a slow simulated breath. Tap to advance.

### 3. Mind Between Objects (VBT 62) — "Catch the Gap"

**Visual:** Small objects (dots, thoughts, sensations) appear on screen,
one at a time, and fade. Between each object there's a gap — a moment of
empty screen. The practice is to rest in that gap, not chase the next
object.

**TTS script:**
> "Watch the dots. They appear and disappear. Don't chase them." [pause
> 15s — dots appear and fade]
> "See the gap between them? That's where the mind rests. Not on the dot.
> In the space after it." [pause 20s]
> "The mind will try to grab the next dot. Let it miss." [pause 20s]
> "You can't force the gap open. You can't not look for it. It's already
> there." [pause 30s]

**Interaction:** The dots slow down over time — fewer per minute. The gaps
get longer. The game is noticing when you're chasing versus resting.

### 4. Body As Consciousness (VBT 63) — "Dissolve the Edges"

**Visual:** A body outline. The edges of the outline are sharp at first.
As TTS speaks, the edges blur and soften. The body doesn't disappear — it
stops being separate from the field around it.

**TTS script:**
> "Feel your body sitting. The edges of your skin." [pause 10s]
> "Now imagine the body is made of the same thing as the room. Same
> awareness. Same field." [pause 15s]
> "The edges are softening. Not because you're blurring them. Because
> they were never solid." [pause 20s]
> "Body as consciousness. Universe as consciousness. Same thing." [pause
> 30s]

### 5. Inner And Outer Spaces (VBT 32-33) — "Merge the Sides"

**Visual:** Two halves of the screen. Left = inner space, right = outer
space. A sense-contact point appears in the middle. As TTS speaks, the
two halves slowly merge into one field.

### 6. Twelve Centres (VBT 36-37) — "Tap the Centre"

**Visual:** A body map with twelve centres. One lights up at random.
Tap it. Brief, game-like, 30 seconds per play. Repeatable throughout the
day. This is the "play not meditation" practice par excellence.

**TTS:** Minimal. "Where are you right now? Tap the centre that's calling."
[pause] Done. 30 seconds. Go back to your day.

**Game element:** Track which centres the user taps most. That's their
habit pattern. Feed it back gently: "You've been visiting the heart a lot
today."

## Architecture

- **TTS:** Fish Audio (already wired in this environment) or any TTS with
  pause control. The script is a JSON array of {text, pause_seconds}.
- **Visuals:** deitybody-v1 grammar already has the primitives —
  sphere, channel, pulse, appear, circulate. The sound wave is a new
  primitive (waveform, fade). The concentric circles are sphere × 3 with
  a merge motion.
- **Timing:** The practice record's `seconds` field drives the total
  duration. Each TTS segment maps to a step. The pause between segments
  is the step's `seconds` minus TTS duration.
- **Practice log:** Each play writes to `practice_log` with the actual
  rest time in the silence. That's the metric — not minutes sitting, but
  seconds resting in the gap.
- **Repeat throughout the day:** No session limit. The twelve-centres
  practice is designed for 10+ plays per day. Others are 3-5 minute plays.

## What makes it play, not meditation

1. Short. 30 seconds to 5 minutes. Not a sit.
2. Visual. You're watching something happen, not just sitting.
3. TTS names the impossibility. No spiritual bypassing.
4. The silence after the voice is the reward, not a chore.
5. Repeatable. Play it on the bus, in bed, between meetings.
6. No streak pressure. Play again or don't. The practice doesn't care.
7. The game element is noticing, not achieving. How long did you rest?
   Which centre did you tap? That's it.
