# Nibbāna path graph

The removal chain: each node is a fabrication to see through.
Nibbāna is what remains when all nodes are seen through.

## Graph (JSON)

```json
{
  "_note": "Nibbana dependency graph (2026-10-20 extension pack 46). The removal chain: each node is a fabrication the mind has built. Seeing through one requires seeing through its dependencies first. Nibbana is not a node — it is what remains when all nodes are seen through. Sources: Nanananda (Nibbana - The Mind Stilled, Concept and Reality, Magic of the Mind), Nanavira (Notes on Dhamma, Nibbana and Anatta), Analayo (33 lectures, Direct Path).",
  "id": "nibbana-path",
  "type": "dependency-graph",
  "tradition": "early-suttas",
  "core_insight": "Nibbana is not something you attain. It is what is left when you stop fabricating. The mind builds signs (concepts, labels, categories). When the signs stop, what remains was always there.",
  "framework": {
    "nanananda": "The mind makes signs (nimitta). Signless concentration (animitta samadhi) is the doorway. When signs cease, nibbana is experienced here and now.",
    "nanavira": "The three characteristics (anicca, dukkha, anatta) are not theories. They are things you see directly. When you see them, the views they undermine fall away.",
    "analayo": "The Pali and Chinese parallels confirm: nibbana is a here-and-now experience, not a metaphysical elsewhere. The early tradition was consistent on this."
  },
  "terminal": {
    "id": "nibbana",
    "name": "Nibbana — what remains",
    "description": "Not a state you build. Not a place you go. What is left when the mind stops fabricating. The signless, the unconditioned, the end of making.",
    "depends_on": ["concept-making", "the-observer", "time"],
    "practice": "signless-concentration-outline",
    "texts": ["nanananda-nibbana-mind-stilled", "analayo-nibbana-mind-stilled", "nanavira-nibbana-anatta"],
    "suttas": ["sn-48-10-indriya", "mn-10-satipatthana"]
  },
  "nodes": [
    {
      "id": "stable-attention",
      "name": "Stable attention",
      "level": 0,
      "fabrication": "The mind scattered, chasing every object. Not yet able to rest.",
      "see_through": "Let the breath settle. Attention finds a home base. The chasing softens.",
      "depends_on": [],
      "practice": "ease-through-the-body-trika-prep",
      "texts": ["nyanamoli-visuddhimagga", "mn-10-satipatthana"],
      "suttas": ["mn-10-satipatthana"],
      "fojin_check": "MN 10: get_parallels for the body establishment."
    },
    {
      "id": "body-awareness",
      "name": "Body awareness",
      "level": 0,
      "fabrication": "The mind lost in thought, unaware of the body sitting.",
      "see_through": "Establish mindfulness in the body. Breath, posture, the whole field of body-sensation. The body becomes the ground.",
      "depends_on": ["stable-attention"],
      "practice": "four-establishments-outline",
      "texts": ["analayo-direct-path", "mn-10-satipatthana"],
      "suttas": ["mn-10-satipatthana"],
      "fojin_check": "MN 10 + Madhyama-agama parallel: get_parallels."
    },
    {
      "id": "identity-view",
      "name": "Identity view (sakkayaditthi)",
      "level": 1,
      "fabrication": "The sense that there is a solid 'I' who has this body, these thoughts, this practice. The first fetter.",
      "see_through": "Look for the one who is practising. Where is it? What is it made of? When you look directly, the 'I' is not findable as a thing. It is a process, not an entity.",
      "depends_on": ["body-awareness"],
      "practice": "seeing-right-view-outline",
      "texts": ["nanavira-nibbana-anatta", "nanavira-foundation-of-ethics", "nyanamoli-dhamma-within-reach"],
      "suttas": ["mn-10-satipatthana"],
      "fojin_check": "verify_quote for any anatta citation before shipping."
    },
    {
      "id": "doubt",
      "name": "Doubt (vicikiccha)",
      "level": 1,
      "fabrication": "'Am I doing it right? Should I try something else? Is this the right path? Is it you saying this?' The waiting-room mind.",
      "see_through": "Doubt is not resolved by finding the right answer. It is resolved by seeing that the one who doubts is the same one who fabricates. When the fabricator is seen through, doubt has nothing to stand on.",
      "depends_on": ["identity-view"],
      "practice": "seeing-right-view-outline",
      "texts": ["nanavira-foundation-of-ethics", "nyanamoli-dhamma-within-reach"],
      "suttas": ["mn-10-satipatthana"],
      "fojin_check": null
    },
    {
      "id": "attachment-to-rites",
      "name": "Attachment to rites and rituals (silabbataparamasa)",
      "level": 1,
      "fabrication": "'If I follow the rules correctly, if I do the right practice, if I sit the right way, I will be free.' The third fetter.",
      "see_through": "Freedom is not produced by following rules. Rules are tools for stabilising the mind so it can see. When you see that no practice produces nibbana — that nibbana is what remains when fabrication stops — attachment to rites falls away.",
      "depends_on": ["doubt"],
      "practice": "seeing-right-view-outline",
      "texts": ["nanavira-foundation-of-ethics", "pannobhasa-atthakavagga"],
      "suttas": ["snp-4-11-atthakavagga-sutta"],
      "fojin_check": "Snp 4.11: get_parallels to the Chinese version."
    },
    {
      "id": "sensual-desire",
      "name": "Sensual desire (kamaraga)",
      "level": 2,
      "fabrication": "Grasping at pleasant experience. Reaching for the next good sensation, the next nice thought, the next hit of calm.",
      "see_through": "See that pleasant experience is impermanent. It arises, it passes. The grasping is what creates the suffering of wanting more. Let the pleasant be pleasant without reaching for it.",
      "depends_on": ["attachment-to-rites"],
      "practice": "concept-deconstruction-outline",
      "texts": ["nanananda-concept-and-reality", "analayo-nibbana-mind-stilled"],
      "suttas": ["mn-10-satipatthana"],
      "fojin_check": "verify_quote for any dukkha citation."
    },
    {
      "id": "ill-will",
      "name": "Ill-will (vyapada)",
      "level": 2,
      "fabrication": "Pushing away unpleasant experience. Resisting pain, boredom, fear, confusion. The other side of desire.",
      "see_through": "See that unpleasant experience is also impermanent. The resistance is what creates the suffering of wanting it to stop. Let the unpleasant be unpleasant without pushing it away.",
      "depends_on": ["sensual-desire"],
      "practice": "concept-deconstruction-outline",
      "texts": ["nanananda-concept-and-reality"],
      "suttas": ["mn-10-satipatthana"],
      "fojin_check": null
    },
    {
      "id": "form-craving",
      "name": "Form craving (ruparaga)",
      "level": 3,
      "fabrication": "Grasping at concentration states. The jhana, the stillness, the luminosity — these become the new objects of craving.",
      "see_through": "Even the most beautiful concentration is impermanent. It is a form, and forms pass. Do not replace sensual desire with concentration desire. See through both.",
      "depends_on": ["ill-will"],
      "practice": "signless-concentration-outline",
      "texts": ["nanananda-magic-of-mind", "analayo-nibbana-mind-stilled"],
      "suttas": ["sn-48-10-indriya", "mn-111-anupada"],
      "fojin_check": "SN 48.10: get_parallels for the signless concentration."
    },
    {
      "id": "formless-craving",
      "name": "Formless craving (aruparaga)",
      "level": 3,
      "fabrication": "Grasping at formless states. Infinite space, infinite consciousness, nothingness, neither-perception-nor-non-perception — these become the new objects of craving.",
      "see_through": "Even the formless is a state, and states pass. The formless is not nibbana. It is a refined form of fabrication.",
      "depends_on": ["form-craving"],
      "practice": "signless-concentration-outline",
      "texts": ["nanananda-nibbana-mind-stilled"],
      "suttas": ["mn-111-anupada"],
      "fojin_check": null
    },
    {
      "id": "concept-making",
      "name": "Concept-making (pannatti)",
      "level": 4,
      "fabrication": "The mind's fundamental habit of labeling. 'This is a sound.' 'This is a thought.' 'This is me.' 'This is not me.' Every concept is a sign (nimitta) that obscures bare experience.",
      "see_through": "Notice the mind making signs in real time. A sound arises — the mind labels it 'sound.' A thought arises — the mind labels it 'thought.' See the labeling itself. See that the sign is made, not given. Rest in the experience behind the sign. This is the signless.",
      "depends_on": ["formless-craving"],
      "practice": "signless-concentration-outline",
      "texts": ["nanananda-magic-of-mind", "nanananda-concept-and-reality", "analayo-nibbana-mind-stilled"],
      "suttas": ["sn-48-10-indriya"],
      "fojin_check": "SN 48.10: the signless concentration basis. get_parallels + verify_quote."
    },
    {
      "id": "the-observer",
      "name": "The observer",
      "level": 4,
      "fabrication": "The sense of a separate one who watches. The 'I' who sees the signs. The witness. The one who is waiting in the waiting room.",
      "see_through": "Look for the observer. Where is it? When you look directly, you find seeing, but not a seer. Hearing, but not a hearer. The observer is itself a fabrication — the last and most subtle sign.",
      "depends_on": ["concept-making"],
      "practice": "seeing-right-view-outline",
      "texts": ["nanavira-nibbana-anatta", "nanananda-nibbana-mind-stilled"],
      "suttas": ["sn-48-10-indriya"],
      "fojin_check": null
    },
    {
      "id": "time",
      "name": "Time (past and future as real)",
      "level": 4,
      "fabrication": "The sense that the past was real and the future will be real. The mind reaching backward and forward, never resting in what is actually here.",
      "see_through": "The past is a memory — a present-moment event. The future is an imagination — a present-moment event. When the mind stops treating them as real, only the present remains. And the present, seen clearly, is already unconditioned.",
      "depends_on": ["the-observer"],
      "practice": "signless-concentration-outline",
      "texts": ["nanananda-concept-and-reality", "nanavira-sketch-proofs-rebirth"],
      "suttas": ["mn-10-satipatthana"],
      "fojin_check": null
    }
  ],
  "runtime": {
    "description": "The runtime walks the user through the dependency chain. Each node is a fabrication to see through. The runtime tracks which nodes have been 'seen through' (based on session data, not self-report) and suggests the next node in the chain.",
    "entry_point": "stable-attention",
    "progression": "level 0 -> 1 -> 2 -> 3 -> 4 -> nibbana",
    "readiness_signal": "When the user stops replaying and starts resting, they are ready for the next level. The signal is behavioural, not self-reported.",
    "session_model": "Each session targets one node. The user sits with the practice for that node. The runtime logs rest time, interruptions, replays. After enough sessions on a node, the runtime marks it 'seen through' and suggests the next node in the dependency chain.",
    "nibbana_condition": "When all nodes at level 4 are marked seen through, the runtime does not say 'you have attained nibbana.' It says: 'What is left when you stop fabricating? Sit with that.' Nibbana is not a node. It is what remains when the graph is empty."
  }
}

```
