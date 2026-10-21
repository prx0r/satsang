# NANDI game stages

12 stages across 3 worlds from Nanananda's three books.
Each stage: fabrication (boss), practice (weapon), text (map), reward (loot).
Nibbana is not a stage — it is what remains when you stop fabricating.

## Stages (JSON)

```json
{
  "_note": "NANDI game stages (2026-10-20 extension pack 47). Three worlds from Nanananda's three books: Concept and Reality (proliferation), Magic of the Mind (signless), Nibbana Mind Stilled (stillness). 12 stages total. Each stage: fabrication (boss), practice (weapon), text (map), reward (loot), readiness signal (gate). The terminal state is nibbana — what remains when you stop fabricating.",
  "id": "nandi",
  "type": "game-stages",
  "tradition": "early-suttas",
  "worlds": [
    {
      "id": "proliferation",
      "name": "The Proliferation",
      "source": "Concept and Reality (Nanananda)",
      "theme": "The mind's habit of expanding every experience into a story (papancha). You don't stop the story. You see it being made."
    },
    {
      "id": "signless",
      "name": "The Signless",
      "source": "Magic of the Mind (Nanananda)",
      "theme": "Signless concentration (animitta samadhi). When signs stop, what remains is nibbana."
    },
    {
      "id": "stillness",
      "name": "The Stillness",
      "source": "Nibbana: The Mind Stilled (Nanananda + Analayo)",
      "theme": "The progressive stilling of the mind. Nibbana as here-and-now experience, not a metaphysical elsewhere."
    }
  ],
  "stages": [
    {
      "n": 1,
      "world": "proliferation",
      "id": "story-machine",
      "name": "The Story Machine",
      "fabrication": "The mind turning experience into narrative. 'And then' — always reaching for the next thing.",
      "practice": "concept-deconstruction-outline",
      "text": "nanananda-concept-and-reality",
      "reward": "You see the story being made. The story continues. You just see it.",
      "tts_pause_pattern": [10, 15, 20, 30],
      "readiness": "When you stop following the story and start watching it."
    },
    {
      "n": 2,
      "world": "proliferation",
      "id": "the-label",
      "name": "The Label",
      "fabrication": "The mind naming everything. 'Sound.' 'Thought.' 'Me.' The label is a sign that obscures bare experience.",
      "practice": "signless-concentration-outline",
      "text": "nanananda-magic-of-mind",
      "reward": "You see the label being applied. Behind the label, something was always there.",
      "tts_pause_pattern": [10, 15, 25, 30],
      "readiness": "When you notice the label before it finishes forming."
    },
    {
      "n": 3,
      "world": "proliferation",
      "id": "concept-web",
      "name": "The Concept Web",
      "fabrication": "One concept leads to another. 'Sound' → 'fan' → 'broken' → 'need to fix' → 'anger.' One label becomes a life.",
      "practice": "concept-deconstruction-outline",
      "text": "nanananda-concept-and-reality",
      "reward": "You watch the web expand without cutting it. The web spins. You see it spin.",
      "tts_pause_pattern": [10, 20, 20, 30],
      "readiness": "When you watch the web without getting caught in it."
    },
    {
      "n": 4,
      "world": "signless",
      "id": "the-sign",
      "name": "The Sign",
      "fabrication": "Every perception comes with a sign: a concept, a label, a category. The sign is made, not given.",
      "practice": "signless-concentration-outline",
      "text": "nanananda-magic-of-mind",
      "reward": "You see the sign being made. The making itself is visible.",
      "tts_pause_pattern": [10, 15, 25, 30],
      "readiness": "When you see the sign arising, not just the sign."
    },
    {
      "n": 5,
      "world": "signless",
      "id": "gap-between-signs",
      "name": "The Gap Between Signs",
      "fabrication": "Between one sign and the next, there is a gap. The mind rushes to fill it. The gap is the doorway.",
      "practice": "vbt-mind-between-objects",
      "text": "nanananda-magic-of-mind",
      "reward": "You rest in the gap. Not for long. But the gap is real.",
      "tts_pause_pattern": [10, 20, 25, 30],
      "readiness": "When you rest in the gap without rushing to the next sign."
    },
    {
      "n": 6,
      "world": "signless",
      "id": "the-signless",
      "name": "The Signless",
      "fabrication": "When signs stop, what remains? Not nothing. Something that was always there, obscured by the signs.",
      "practice": "vbt-sound-dissolution",
      "text": "nanananda-magic-of-mind",
      "reward": "The silence was always there. You just couldn't hear it over the noise.",
      "tts_pause_pattern": [10, 15, 20, 30],
      "readiness": "When you rest in the silence without trying to hold it."
    },
    {
      "n": 7,
      "world": "stillness",
      "id": "noisy-mind",
      "name": "The Noisy Mind",
      "fabrication": "The mind is so noisy, you don't even know what quiet sounds like.",
      "practice": "vbt-sound-dissolution",
      "text": "analayo-nibbana-mind-stilled",
      "reward": "You hear the noise clearly. That hearing is the first quiet.",
      "tts_pause_pattern": [10, 15, 20, 30],
      "readiness": "When you hear the noise without trying to stop it."
    },
    {
      "n": 8,
      "world": "stillness",
      "id": "waiting-room",
      "name": "The Waiting Room",
      "fabrication": "'Am I doing it right? Why am I not seeing it? Shall I watch a video about it?' The waiting-room mind.",
      "practice": "seeing-right-view-outline",
      "text": "analayo-nibbana-mind-stilled",
      "reward": "You name the waiting room. The naming is the practice.",
      "tts_pause_pattern": [15, 20, 25, 30],
      "readiness": "When you sit in the waiting room without trying to leave it."
    },
    {
      "n": 9,
      "world": "stillness",
      "id": "the-impossible",
      "name": "The Impossible",
      "fabrication": "You can't force the mind to submit. You can't not try either. The impossibility is the teaching.",
      "practice": "seeing-right-view-outline",
      "text": "analayo-nibbana-mind-stilled",
      "reward": "The impossibility stops being a problem. It becomes the door.",
      "tts_pause_pattern": [15, 20, 25, 30],
      "readiness": "When the impossibility stops being frustrating and starts being interesting."
    },
    {
      "n": 10,
      "world": "stillness",
      "id": "the-softening",
      "name": "The Softening",
      "fabrication": "Something softens. Not because you made it soften. Because you stopped making it hard.",
      "practice": "vbt-body-as-consciousness",
      "text": "analayo-nibbana-mind-stilled",
      "reward": "The softening is visible. It wasn't you who did it.",
      "tts_pause_pattern": [10, 20, 25, 30],
      "readiness": "When you notice the softening without claiming it."
    },
    {
      "n": 11,
      "world": "stillness",
      "id": "observer-falls",
      "name": "The Observer Falls",
      "fabrication": "The one who was watching is itself a sign. When the observer is seen through, what remains?",
      "practice": "seeing-right-view-outline",
      "text": "nanavira-nibbana-anatta",
      "reward": "Seeing without a seer. Hearing without a hearer.",
      "tts_pause_pattern": [15, 20, 25, 30],
      "readiness": "When you look for the observer and find only seeing."
    },
    {
      "n": 12,
      "world": "stillness",
      "id": "what-remains",
      "name": "What Remains",
      "fabrication": "Nibbana. Not a state. What is left when you stop fabricating. The game ends. The practice begins.",
      "practice": "signless-concentration-outline",
      "text": "nanananda-nibbana-mind-stilled",
      "reward": "The runtime does not say 'you have attained nibbana.' It says: 'What is left? Sit with that.'",
      "tts_pause_pattern": [20, 30, 30, 30],
      "readiness": "The runtime never marks this stage complete. It is always there. You return to it. That is the practice."
    }
  ]
}

```
