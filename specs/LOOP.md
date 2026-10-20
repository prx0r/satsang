# Wiser: the main loop, "Topic flash" (spec, 2026-10-20)

We are not battling any more. The front door is a calm **journey through topics**: a topic's name fills the screen,
two or three teachers from different traditions speak to it one after another, you tap the one that resonated (or
none), and a bridge carries you to a related topic. Every tap still feeds the pairwise model (a pick among 3 = two
pairwise wins), so the crowd chart and the personal taste keep learning.

**Design rule: the current dark design, unchanged.** Tokens from `site/style.css`: `--bg #0a0d14`, `--bg2 #0f1320`,
`--panel #141a27`, `--line #242c3d`, `--text #efe9dd`, `--muted #929aab`, `--red #d9982f` (amber), `--red2 #e9b764`,
`--gold #e8cf96`, `--glow rgba(217,152,47,.28)`; `--display` Cormorant Garamond (all headings and the topic name),
`--sans` Inter Tight (body), `--mono` JetBrains Mono (small uppercase labels, the existing `.marquee` style). No new
colours, fonts or components beyond reusing the existing screen, ballot and card patterns. Plain words: no "battle",
no "VS", no clocks, no countdowns.

## 1. The sequence (one "flash")
1. **Title card** (≈ 2.5 s, tap to skip): full screen `--bg`; centred, the topic name in `--display` at
   `clamp(48px, 9vw, 128px)`, `--text`; under it a 64 px gold hairline that draws left→right (0.9 s ease-out); then
   the question in italic serif `--muted` ("Does anything carry on after death?"); then, in `.marquee` mono caps,
   the three traditions about to speak: `THERAVĀDA · ADVAITA VEDĀNTA · PLATONIC`. A faint portrait collage of the three
   teachers fades in behind at 12 % opacity (the existing hero collage treatment).
2. **Teacher 1 → 2 → 3** in sequence, each the existing full-screen talk screen (`.screen`) with a slim lower label:
   serif name, mono tradition, the talk title. Before each, a 1.2 s **name card** (no countdown): "Ajahn Chah" in serif,
   "Thai Forest" in mono gold, a portrait if we have one. Each talk plays whole if it is a 1–20 min clip or passage
   (unchanged rules). "Next teacher" (swipe left / → / N) after the 60 s gate is a neutral move-on; before it, the
   existing light "didn't land" signal.
3. **"Which resonated?"** ballot (the existing ballot, generalised from 2 to 3): three cards in a row (phone: a stack),
   each a still with the teacher's name in serif and tradition in mono, a heart **Resonates** button in amber.
   Below: **None of these** (quiet text button) and **Listen to #N again** (the existing `backTo()`). No countdown, no
   ring, no auto-advance; it waits as long as you like.
4. **After the tap**: "Resonated: <title>" in serif, the crowd's split if there is one, Save · Send to a friend. Then
   the **bridge card** (≈ 2 s, or tap): a gold thread line draws from the current topic name (small, top) to the next
   (large, centre) with one line of reason from RANKING §4.1: "Rebirth → **Karma**: what carries on is what you do". Two
   quiet options under it: **Go deeper here** (another flash on the same topic, different traditions) and **Choose a topic**
   (the topic grid). Otherwise the next title card rises.

**Pick semantics.** A pick of A among {A, B, C} logs pairwise votes A>B and A>C with `context: 'flash:<topic>'`
(the existing `votes` table; `UNIQUE(user_id,a,b)` holds). "None of these" logs a light −0.15 to each (events, not
votes). Low-watch rules unchanged (both/all talks ≥ 60 s or ended for full weight).

**Choosing the three** (RANKING §4.3): different schools, ideally different families; slots 1–2 main-tier best fit, slot 3
the explore slot; never two passages of one video; no teacher already seen this session unless the user tapped
"Go deeper". Two-teacher flashes are allowed when the topic has fewer than 3 traditions with main-tier talks on the
current device's format (then the ballot is the current two-card one).

**Session shape.** Flashes chain without end, but after every 4th the bridge card offers a soft pause: "That was four
topics. Rest here, or keep going" with the practice of the last topic ("Try the five remembrances, 5 minutes").
Getting people off the screen is a feature.

## 2. Phone (vertical-first)
```
┌──────────────────────┐   Title card                     ┌──────────────────────┐  Ballot (stacked)
│                      │                                  │  WHICH RESONATED?    │  mono caps, muted
│                      │                                  │ ┌──────────────────┐ │
│       Rebirth        │  serif, --text, ~56px            │ │ still            │ │  --panel card,
│       ───────        │  gold hairline draws             │ │ Ajahn Chah       │ │  serif name
│  Does anything carry │  italic serif, --muted           │ │ THAI FOREST   ♡  │ │  amber heart
│   on after death?    │                                  │ └──────────────────┘ │
│                      │                                  │ ┌──────────────────┐ │
│ THERAVĀDA · ADVAITA  │  mono caps, gold                 │ │ Swami S.  ADVAITA ♡│ │
│     · PLATONIC       │                                  │ └──────────────────┘ │
│                      │                                  │ ┌──────────────────┐ │
│   (portrait collage  │  12% behind                      │ │ C. Stang PLATONIC ♡│ │
│     very faint)      │                                  │ └──────────────────┘ │
│        tap to begin  │  muted, small                    │ None of these · Listen again │
└──────────────────────┘                                  └──────────────────────┘
```
- **Vertical-first**: on a touch device in portrait, each slot prefers a verified-vertical clip (`orientation.verified`
  and `value: vertical`) on the topic from a main-tier teacher; if none exists for that tradition, a horizontal clip
  plays **letterboxed** in a 16:9 band in the upper third, with the teacher label and the topic title filling the dark
  space below (it is calm, not empty). Rotating to landscape plays horizontal full-bleed.
- Swipe up = next teacher, swipe left = skip this flash (to the bridge), long-press = save. Thumb zone holds every button.
- Existing `FORMAT_PREFS.mobile` (vertical share 0.8, minPool 6) becomes per-slot rather than per-round.

## 3. Desktop (horizontal-only)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Wiser                       (existing top bar and tabs, unchanged)     ☺   │  existing top bar
│                                                                              │
│                                   Rebirth                                    │  serif ~110px
│                                   ───────                                    │
│                     Does anything carry on after death?                      │
│                                                                              │
│              THERAVĀDA  ·  ADVAITA VEDĀNTA  ·  PLATONIC TRADITION            │
│                    ○ Ajahn Chah   ○ Swami Sarvapriyananda   ○ Charles Stang  │  three small round portraits
│                                                                              │
│                               Begin  ▸                                       │  amber
└──────────────────────────────────────────────────────────────────────────────┘
 Ballot: three --panel cards side by side (16:9 stills), serif names, mono traditions, amber hearts; "None of these"
 and "Listen to #2 again" centred below. Bridge: "Rebirth ──────── Karma" with the reason line beneath.
```
- **HARD rule (existing, kept)**: a mouse/trackpad device never gets a vertical clip, in any mode (`vertOK()` =
  primary pointer coarse). Desktop flashes draw only from verified-horizontal clips.
- Keys: Space play/pause · N / → next teacher · 1/2/3 pick · 0 none · L listen again · D go deeper · T topics.

## 4. Lean-back TV mode
For a TV browser, a cast target or a laptop on a big screen: `#tv` or `?tv=1`, or auto when `(pointer: none)` /
user-agent hints a TV.
- **Horizontal only**, full-bleed, 10-foot type (topic name 160 px+, labels ≥ 28 px), safe-area insets of 5 %.
- **No ballot by default**: flashes auto-continue (talk → talk → bridge → next topic). The remote's OK button during a
  talk = "This resonates" (the existing single-talk heart, a light signal), shown as a small gold heart that blooms in
  a corner. Back = topics grid (D-pad navigable, focus ring = the gold glow `--glow`).
- **Ambient between flashes**: the bridge card holds 6 s with the slow gold thread animation; optional "sit" interlude
  (a 3-minute silent timer with a bell, the practice of the topic) offered every 4th flash.
- Sound: auto-advance never jumps in volume (existing per-clip loudness offsets from `/clips/audio`).

## 5. Data the loop needs (all present or derivable)
- Published topics (TOPICS §6 gate) with label + one-line question (hub question or topic blurb) → `topic.questions[0]`
  or `topic.intro` first sentence.
- Per-topic candidate clips with `orientation.verified`, tier, quality q, tradition → `mcp/data/wiser.json` already has
  them; the site can compute them in `src/wise.js` from `clips.json` as it does for hubs.
- Next-topic scores → `nextTopics()` in `mcp/src/rank.mjs` (port to `src/rank.js`).
- Events: `flash_shown {topic, clips[], slots[]}`, `flash_pick {topic, winner|none}`, `bridge {from, to, reason, action}`
  in the existing `/events` endpoint (lexicon additions).

## 6. Where the old pair mode goes
"Compare two takes" on topic hubs and the `#clash` / invite links keep the two-card resonance round exactly as it is.
The home screen opens on Topic flash; a small "Two talks" link in the marquee keeps the classic round for those who
like it.
