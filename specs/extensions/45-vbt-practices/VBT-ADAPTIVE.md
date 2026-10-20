# VBT-ADAPTIVE — the learning runtime (2026-10-20)

The TTS voice is interactive. The user can interrupt at any point. The
runtime sticks to a script but the journey is flexible. Every interaction
is saved as data. That data feeds back into how the system approaches
your next meditation. Over time it figures out the ideal pedagogical
approach for you, specifically, for VBT.

## The runtime model

Each practice has a script (segments + pauses). But the script is not a
recording — it's a state machine. The user is always in one of these
states:

```
LISTENING    — TTS is speaking
RESTING      — pause is active, silence
INTERRUPTED  — user said something or tapped
ASKING       — user wants something specific ("play it again")
REFLECTING   — post-practice journal moment
```

The runtime tracks transitions between states. Every transition is data.

## What the user can say or do

| input | runtime response | logged as |
|---|---|---|
| "play the sound again" | re-run the last TTS segment | `replay: segment_n` |
| "what did you say" | re-read last segment | `replay: segment_n` |
| "skip ahead" | advance to next segment | `skip: segment_n` |
| "pause" | extend current pause by 30s | `extend_pause: +30s` |
| "stop" | end session, log rest time | `early_end: at segment_n` |
| tap (no words) | advance to next segment | `advance: segment_n` |
| silence (full pause) | natural transition | `rested: segment_n, seconds` |

Every input is logged with the segment number and timestamp. The log is
the user's practice signature.

## The adaptive layer

After each session, the runtime computes a session profile:

```json
{
  "practice": "vbt-sound-dissolution",
  "date": "2026-10-20",
  "segments_completed": 5,
  "total_rest_seconds": 142,
  "replays": ["segment_2"],
  "skips": [],
  "early_end": false,
  "longest_rest": {"segment": 4, "seconds": 47},
  "interruption_pattern": "replay_early",
  "engagement_score": 0.87
}
```

This profile feeds into three things:

### 1. Session adaptation (next time you play this practice)

If you replayed segment 2 last time, the runtime adds a longer pause
there. If you skipped segment 3, it shortens or rephrases it. If you
ended early at segment 4, it offers to start from segment 4 next time.

The script adapts to you. Not the practice — the delivery.

### 2. Practice selection (which practice to play next)

The runtime learns which practice families you respond to:

- If you rest longest in sound-dissolution, suggest more sound practices
- If you skip space practices, suggest body practices instead
- If you end early on long practices, offer shorter versions
- If you replay the impossibility lines, lead with those

The suggestion comes from the session profiles, not from a fixed
curriculum.

### 3. Pedagogical model (how to teach you, generally)

Over time the runtime builds a teaching model for you:

```json
{
  "user_profile": {
    "prefers_visual_over_voice": true,
    "responds_to_impossibility_naming": true,
    "optimal_session_length_seconds": 180,
    "optimal_pause_seconds": {"short": 15, "medium": 25, "long": 40},
    "best_practice_order": ["sound", "body", "space", "gap"],
    "avoids": ["space", "dream"],
    "engages_with": ["sound", "centres", "breath"],
    "resting_pattern": "slow_start_deep_rest",
    "interruption_style": "replay_early_then_flow"
  }
}
```

This profile is private, exportable, deletable. It's the user's learning
signature. It never leaves the device/account except in full export.

## The VBT pedagogical model (general, before personalization)

VBT has 112 practices. The general pedagogical sequence, based on the
text's own structure and the upaya framework from the concordance:

1. **Breath practices first** (verses 24-26) — the most accessible,
   everyone can find the breath
2. **Gap practices next** (verses 62, 38-39) — requires basic concentration
   from breath work
3. **Sound practices** (verses 34-35) — requires sustained attention
4. **Body practices** (verses 40, 63) — requires body awareness
5. **Space practices** (verses 48, 32-33) — requires the ability to rest
   in openness without grasping
6. **Daily-life practices** (verses 36-37) — the capstone, practice
   off the cushion

The upaya framework from Hareesh's concordance maps to this:
- āṇava-upāya (individual) → breath, body, centres (effort-based)
- śākta-upāya (energy) → sound, sensation (awareness-based)
- śāmbhava-upāya (divine) → gap, space, between-objects (grace-based)

The system starts everyone at āṇava, then watches for when they're ready
for śākta, then śāmbhava. The readiness signal is behavioural, not
self-reported: when you stop replaying and start resting, you're ready
for the next level.

## What gets saved (and what doesn't)

**Saved (private, exportable, deletable):**
- Session profiles (the JSON above)
- User pedagogical profile (the teaching model)
- Practice log entries (rest seconds, which practice, when)
- Interruption patterns (what you replayed, what you skipped)

**Never saved:**
- Audio of your voice (interruptions are transcribed, not recorded)
- Anything from the practice itself (the silence is yours)
- Data shared with anyone (stays on device/account until full export)

**Deleted with account:** everything above, verified by re-export empty.

## The flywheel

```
play practice → interrupt/interact → runtime logs it
  → session profile → adapts next session
  → over time: pedagogical model → suggests next practice
  → suggests how to sit → suggests when to play
  → user plays more, interacts more, model gets sharper
```

The more you play, the better it teaches you. Not by knowing more about
VBT — by knowing more about how YOU approach VBT.
