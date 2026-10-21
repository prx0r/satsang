# The Nibbana movie: 12 levels, manual + runtime

How to attain nibbana according to Nanananda, the 33 sermons made simple. Each level: teaching, timer-native practice, behavioural validation gate. Level 12 has no gate.

## Manual (JSON)

```json
{
  "_note": "The Nibbana movie: how to attain nibbana according to Nanananda, the 33 sermons made simple. 12 levels, each with: what to understand (teaching), what to do (practice, timer-native), how to know you got it (validation gate, behavioural). Level 12 has no gate — it is what remains. Practices supplement the graph (packs 43-45).",
  "id": "nibbana-movie",
  "type": "movie-manual",
  "tradition": "early-suttas",
  "source": "Nibbana: The Mind Stilled, all 33 sermons + Analayo analysis",
  "runtime_rule": "Complete a level's practice. When the validation gate is met (behavioural, not self-reported), the next level unlocks. The runtime tracks rest time, replays, and skips — not your opinion of yourself.",
  "levels": [
    {
      "n": 1,
      "title": "Settle",
      "teaching": "Before anything can be seen, attention must be steady enough to look. This is not a practice yet — it is the seat every practice sits on.",
      "sermons": [1, 5],
      "practice": "ease-through-the-body-trika-prep",
      "practice_note": "Borrowed from the Trika prep pack. Breath first. Everything else needs this seat.",
      "gate": {"type": "behavioural", "condition": "Sit 10 minutes without getting up. Not without thinking — without getting up.", "signal": "session log shows 10+ minute sits, 3 days running."},
      "unlocks": 2,
      "visual": "stone"
    },
    {
      "n": 2,
      "title": "The Theme",
      "teaching": "Etaṃ santaṃ etaṃ paṇītaṃ — stilling of preparations, relinquishment of assets, destruction of craving, detachment, cessation, nibbāna. This is itself a meditation subject. Hold it the way you hold the breath: not as words to believe, as a direction to face.",
      "sermons": [1],
      "practice": "theme-verse-reflection",
      "practice_howto": "Sit. Recite the theme verse slowly, in Pali then English. Rest attention on each phrase for three breaths: stilling of preparations, relinquishment of assets, destruction of craving, detachment, cessation, extinction. Do not analyse. Let each phrase land. When the mind argues, return to the next phrase. Ten minutes.",
      "gate": {"type": "behavioural", "condition": "Can recite the theme from memory and sit with each phrase without arguing with it.", "signal": "No replays on the theme segments; rest time increasing across sessions."},
      "unlocks": 3,
      "visual": "light"
    },
    {
      "n": 3,
      "title": "Name Is Name",
      "teaching": "Nāma means name, not bending. The mind names everything it meets. Each name is a sign laid over bare experience. Seeing the naming is the first crack in the wall.",
      "sermons": [1, 10],
      "practice": "concept-deconstruction-outline",
      "practice_note": "Already in pack 44. Reused here as the Level 3 gate practice.",
      "gate": {"type": "behavioural", "condition": "Notice a label being applied in real time — not after the fact, during. 'There it is, naming.'", "signal": "Journal entries name specific labels caught in the act, not general reflections."},
      "unlocks": 4,
      "visual": "glass"
    },
    {
      "n": 4,
      "title": "The Wound",
      "teaching": "Suffering is found in the nāma-rūpa world, not out there. Craving is the arrow; nāma-rūpa is the wound it sits in. The Buddha is the surgeon — but you have to locate the wound first.",
      "sermons": [1],
      "practice": "wound-location",
      "practice_howto": "Sit. When craving arises — for anything — do not follow it to its object. Instead ask: where in the body is this felt? Chest? Throat? Belly? Rest attention on the location, not the story. The location is the wound. The story is the arrow's feathers. Ten minutes, or until the craving shifts.",
      "gate": {"type": "behavioural", "condition": "Can locate craving in the body three sits running, without following its story.", "signal": "Practice log notes body locations, not craving narratives."},
      "unlocks": 5,
      "visual": "metal"
    },
    {
      "n": 5,
      "title": "The Fire Goes Out",
      "teaching": "Nibbāna means extinction — like a fire going out when its fuel is gone. Not annihilation: there was never a self to annihilate, only a fire to stop feeding. When grasping ceases, existence ceases. What remains is not nothing.",
      "sermons": [1, 22],
      "practice": "fire-contemplation",
      "practice_howto": "Light a candle (or picture one). Watch the flame. It burns because of fuel and air meeting. Now imagine the fuel running out — not blown out, just exhausted. The flame doesn't go anywhere. It stops happening. Sit with that image for ten minutes. Then close the eyes and feel the body's own little fires: hunger, wanting, restlessness. Same mechanism.",
      "gate": {"type": "behavioural", "condition": "Gets — felt, not just intellectual — that extinction is not annihilation. Journal shows the distinction in their own words.", "signal": "Journal entry distinguishes extinction from annihilation without quoting the text."},
      "unlocks": 6,
      "visual": "fade"
    },
    {
      "n": 6,
      "title": "Contact",
      "teaching": "Contact arises dependent on name-and-form. The naming quality gives the verbal impression; the striking quality gives the resistance impression. Their meeting is contact. Every contact has a tone: pleasant, unpleasant, neutral.",
      "sermons": [6, 11],
      "practice": "vbt-inner-outer-spaces",
      "practice_note": "Already in pack 45. Reused here — inner space meets outer space at every contact.",
      "gate": {"type": "behavioural", "condition": "Can feel contact as a meeting — not self meeting world, just meeting — for 30 seconds at a time.", "signal": "Rest time in inner-outer sessions passes 30 seconds without interruption."},
      "unlocks": 7,
      "visual": "gear"
    },
    {
      "n": 7,
      "title": "The Gap Widens",
      "teaching": "Between one thought and the next there is a gap. Between one perception and the next, a pause. Papañca is the mind's rush to fill every gap with story. Nippapañca is letting the gap be.",
      "sermons": [12, 14],
      "practice": "vbt-mind-between-objects",
      "practice_note": "Already in pack 45. The gap practice, now with the papañca context.",
      "gate": {"type": "behavioural", "condition": "Gaps between thoughts get longer without forcing. Measured, not felt.", "signal": "Rest time in gap sessions trends upward over five sessions."},
      "unlocks": 8,
      "visual": "spiral"
    },
    {
      "n": 8,
      "title": "The Root Pattern",
      "teaching": "The Mūla-pariyāya shows the full sequence: conceiving earth as earth, delighting in earth, 'I am earth.' Every experience gets an 'I' added after it. Seeing the adding is the practice.",
      "sermons": [13],
      "practice": "root-pattern-seeing",
      "practice_howto": "Pick one sense door — hearing is easiest. For five minutes, notice each sound and the instant 'I' gets added: 'I hear it,' 'I like it,' 'I want it to stop.' Just notice the adding. Don't stop it. The noticing IS the practice. The 'I' is a postscript, not the text.",
      "gate": {"type": "behavioural", "condition": "Catches the 'I am' being added after experience, three times in one sit.", "signal": "Journal entries quote specific 'I am' additions caught live."},
      "unlocks": 9,
      "visual": "gear"
    },
    {
      "n": 9,
      "title": "Only the Seen",
      "teaching": "Bahiya: in the seen only the seen, in the heard only the heard, in the sensed only the sensed, in the cognized only the cognized. No experiencer added. When there is no 'you' in it, there is no 'you' anywhere.",
      "sermons": [15],
      "practice": "bahiya-practice",
      "practice_howto": "Choose one sense — sight is clearest. For ten minutes: in the seen, only the seen. When 'I see it' arises, drop the 'I', keep the seeing. When commentary starts, drop it, keep the colours and shapes. This is not suppression — it is subtraction. The seeing was always just seeing.",
      "gate": {"type": "behavioural", "condition": "Rests in bare seeing for 30 seconds without adding an experiencer.", "signal": "Rest time in bahiya sessions passes 30 seconds; no replays on the instruction segments."},
      "unlocks": 10,
      "visual": "glass"
    },
    {
      "n": 10,
      "title": "The Signless",
      "teaching": "Every perception comes with a sign — a concept, a label, a category. The signless concentration rests in the experience behind the sign. The silence behind the sound. The seeing behind the seen.",
      "sermons": [7, 8, 16, 17],
      "practice": "vbt-sound-dissolution",
      "practice_note": "Already in pack 45, with TTS script and interactive design in packs 45/48.",
      "gate": {"type": "behavioural", "condition": "Rests in the flat line — the silence after sound — without chasing the next sound.", "signal": "Rest seconds in the flat-line segment trend upward; replays shift from early to late segments."},
      "unlocks": 11,
      "visual": "light"
    },
    {
      "n": 11,
      "title": "The Observer Falls",
      "teaching": "Look for the one who watches. Where is it? When you look directly, you find seeing but not a seer, hearing but not a hearer. The observer is the last sign — the subtlest fabrication. Seeing through it is the last gate.",
      "sermons": [16, 17],
      "practice": "observer-inquiry",
      "practice_howto": "Sit in signless rest. Then ask, gently: who is resting? Who is aware? Look for the looker. Do not answer with philosophy — look. If you find tension, a watcher-feeling, a subtle 'me' holding the sit together — notice it as one more sign. Let it be there without serving it. Ten minutes. The looking is the practice; there is no finding.",
      "gate": {"type": "behavioural", "condition": "Looks for the observer without finding one, and does not panic — sits with the not-finding.", "signal": "Session completes without early end; journal describes not-finding rather than new theory."},
      "unlocks": 12,
      "visual": "glass"
    },
    {
      "n": 12,
      "title": "What Remains",
      "teaching": "No new teaching. The holy life is merged in Nibbāna like rivers in the sea. The theme verse from Level 2, now earned: stilling of preparations, relinquishment of assets, destruction of craving, detachment, cessation, extinction. Sit with what is left when you stop fabricating.",
      "sermons": [19, 20, 33],
      "practice": "signless-concentration-outline",
      "practice_note": "No new practice. The signless rest from Level 10, now without a next level to reach for.",
      "gate": null,
      "gate_note": "No gate. The runtime never marks this complete. It says: 'What is left? Sit with that.' The movie ends. The practice begins.",
      "visual": "stone"
    }
  ],
  "arcs": {
    "1-2": "Foundation: seat + theme",
    "3-4": "The wound: name, concept, location",
    "5": "The fire: extinction, not annihilation",
    "6-7": "Contact and gap: meeting, pausing",
    "8-9": "Root pattern and bare sensing",
    "10-11": "Signless and observer",
    "12": "What remains"
  },
  "new_practices": ["theme-verse-reflection", "wound-location", "fire-contemplation", "root-pattern-seeing", "bahiya-practice", "observer-inquiry"]
}

```
