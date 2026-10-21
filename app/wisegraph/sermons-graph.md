# The 33 sermons graph

Everything Nanananda describes, modelled as a dependency graph.
18 concepts, three dependency chains, six sermon ranges.
This is the data layer that drives the game, the visuals, and the practice system.

## Graph (JSON)

```json
{
  "_note": "The 33 sermons graph (2026-10-20 extension pack 50). Everything Nanananda describes in Nibbana: The Mind Stilled, modelled as a dependency graph. Each concept: what it is, what it depends on, what depends on it, the practice that sees through it, the visual form. This is the data layer that drives the game (pack 47), the visuals (pack 49), and the practice system (packs 43-45).",
  "id": "sermons-graph",
  "type": "concept-graph",
  "tradition": "early-suttas",
  "source": "Nibbana: The Mind Stilled (Nanananda, 33 lectures) + Analayo's analysis",
  "core_insight": "Nibbana is not something you attain. It is what is left when you stop fabricating. The mind builds signs (concepts, labels, categories). When the signs stop, what remains was always there.",

  "concepts": [
    {
      "id": "avijja",
      "name": "Ignorance",
      "pali": "avijjā",
      "definition": "Not seeing things as they are. The fundamental not-seeing that keeps the whole machine running. Not stupidity — a seeing that is covered over.",
      "depends_on": [],
      "depends_on_note": "Avijjā is the root. It doesn't depend on anything. It is the first fabrication.",
      "depended_on_by": ["sankhara"],
      "practice": "seeing-right-view-outline",
      "text": "nanavira-foundation-of-ethics",
      "visual": "metal",
      "visual_form": "The first gear. Dark. Turning. Everything downstream depends on it.",
      "level": 0,
      "sermon_range": "1-5 (introduction: what nibbana is and isn't)"
    },
    {
      "id": "sankhara",
      "name": "Formations",
      "pali": "saṅkhāra",
      "definition": "Volitional activities. The mind's habit of constructing. Every thought, every intention, every act of attention is a saṅkhāra. Not 'formations' as a thing — the ACT of forming.",
      "depends_on": ["avijja"],
      "depends_on_note": "Ignorance drives the formations. When you don't see clearly, the mind forms.",
      "depended_on_by": ["viññāṇa"],
      "practice": "signless-concentration-outline",
      "text": "nanananda-magic-of-mind",
      "visual": "metal",
      "visual_form": "Gears meshing. Each tooth is a volition. The meshing IS the forming.",
      "level": 0,
      "sermon_range": "6-10 (the three characteristics as lived)"
    },
    {
      "id": "viññāṇa",
      "name": "Consciousness",
      "pali": "viññāṇa",
      "definition": "Awareness that has been coloured by the formations. Not pure awareness — awareness-plus-a-habit. The light seen through a coloured lens.",
      "depends_on": ["sankhara"],
      "depends_on_note": "Formations colour the consciousness. Pure awareness is always there, but consciousness is what awareness becomes when it's filtered.",
      "depended_on_by": ["nāmarūpa"],
      "practice": "vbt-sound-dissolution",
      "text": "nanananda-magic-of-mind",
      "visual": "glass",
      "visual_form": "A lens. Coloured by what passes through it. The light is always there; the colour is the formation.",
      "level": 0,
      "sermon_range": "6-10 (the three characteristics as lived)"
    },
    {
      "id": "nāmarūpa",
      "name": "Name & Form",
      "pali": "nāmarūpa",
      "definition": "The mind's naming and shaping of experience. 'This is a sound.' 'This is me.' 'This is not me.' Name (nāma) is the concept; form (rūpa) is the shape the concept gives to raw experience.",
      "depends_on": ["viññāṇa"],
      "depends_on_note": "Consciousness names and forms. Without the coloured consciousness, there is no name, no form — just experience.",
      "depended_on_by": ["saḷāyatana"],
      "practice": "concept-deconstruction-outline",
      "text": "nanananda-concept-and-reality",
      "visual": "glass",
      "visual_form": "Labels appearing on things. The label is the name; the thing it's stuck to is the form.",
      "level": 0,
      "sermon_range": "11-16 (dependent arising: the twelve links)"
    },
    {
      "id": "saḷāyatana",
      "name": "Six Sense Bases",
      "pali": "saḷāyatana",
      "definition": "The six doors of perception: eye, ear, nose, tongue, body, mind. Each one is a gate. What comes through the gate is contact.",
      "depends_on": ["nāmarūpa"],
      "depends_on_note": "Name and form create the sense bases. The mind builds the doors before anything walks through them.",
      "depended_on_by": ["phassa"],
      "practice": "vbt-inner-outer-spaces",
      "text": "analayo-direct-path",
      "visual": "glass",
      "visual_form": "Six doors in a wall. Light comes through each one. The doors are made, not given.",
      "level": 0,
      "sermon_range": "11-16 (dependent arising: the twelve links)"
    },
    {
      "id": "phassa",
      "name": "Contact",
      "pali": "phassa",
      "definition": "The moment a sense base meets its object. Eye sees form. Ear hears sound. Mind meets thought. This is the moment where experience begins. Not the sense base alone, not the object alone — the meeting.",
      "depends_on": ["saḷāyatana"],
      "depends_on_note": "The sense bases are the doors. Contact is what happens when something walks through.",
      "depended_on_by": ["vedanā"],
      "practice": "vbt-inner-outer-spaces",
      "text": "analayo-direct-path",
      "visual": "water",
      "visual_form": "A drop hitting water. The ripple is contact. Everything downstream starts here.",
      "level": 1,
      "sermon_range": "11-16 (dependent arising: the twelve links)"
    },
    {
      "id": "vedanā",
      "name": "Feeling",
      "pali": "vedanā",
      "definition": "The pleasant, unpleasant, or neutral quality of contact. Not emotion — the raw tone. Before the story, before the label, there is a tone. Pleasant. Unpleasant. Neutral.",
      "depends_on": ["phassa"],
      "depends_on_note": "Contact has a tone. The tone is not chosen. It arises with the contact.",
      "depended_on_by": ["taṇhā"],
      "practice": "concept-deconstruction-outline",
      "text": "nanananda-concept-and-reality",
      "visual": "water",
      "visual_form": "The ripple's quality — warm or cold. The water doesn't choose its temperature.",
      "level": 1,
      "sermon_range": "11-16 (dependent arising: the twelve links)"
    },
    {
      "id": "taṇhā",
      "name": "Craving",
      "pali": "taṇhā",
      "definition": "The thirst that arises from feeling. Pleasant → want more. Unpleasant → want it to stop. Neutral → want something else. The spring that pushes and pulls.",
      "depends_on": ["vedanā"],
      "depends_on_note": "Feeling feeds craving. The pleasant tone makes the spring push toward. The unpleasant tone makes it pull away.",
      "depended_on_by": ["upādāna"],
      "practice": "concept-deconstruction-outline",
      "text": "nanananda-concept-and-reality",
      "visual": "spring",
      "visual_form": "A coiled spring. Pushes toward the pleasant. Pulls from the unpleasant. Always moving.",
      "level": 1,
      "sermon_range": "11-16 (dependent arising: the twelve links)"
    },
    {
      "id": "upādāna",
      "name": "Clinging",
      "pali": "upādāna",
      "definition": "Craving that has grasped. The spring has caught something. Not just wanting — holding. The valve that has closed.",
      "depends_on": ["taṇhā"],
      "depends_on_note": "Craving grasps. When the spring catches, clinging begins. The valve closes.",
      "depended_on_by": ["bhava"],
      "practice": "concept-deconstruction-outline",
      "text": "nanananda-concept-and-reality",
      "visual": "valve",
      "visual_form": "A gate that has shut. What's inside stays in. What's outside stays out.",
      "level": 2,
      "sermon_range": "11-16 (dependent arising: the twelve links)"
    },
    {
      "id": "bhava",
      "name": "Becoming",
      "pali": "bhava",
      "definition": "The pivot from one state to another. The shift from 'I am this' to 'I am that.' Becoming is not a thing — it's the turning. The pivot point.",
      "depends_on": ["upādāna"],
      "depends_on_note": "Clinging turns into becoming. The valve's closing forces a new state.",
      "depended_on_by": ["jāti"],
      "practice": "seeing-right-view-outline",
      "text": "nanavira-nibbana-anatta",
      "visual": "pivot",
      "visual_form": "A point that turns. From this state to that state. The turn is the becoming.",
      "level": 2,
      "sermon_range": "11-16 (dependent arising: the twelve links)"
    },
    {
      "id": "jāti",
      "name": "Birth",
      "pali": "jāti",
      "definition": "The arising of a new self-sense. Not physical birth — the moment the mind says 'I am.' The moment a new identity appears. Each moment of becoming is a birth.",
      "depends_on": ["bhava"],
      "depends_on_note": "Becoming gives birth. Each pivot creates a new 'I.'",
      "depended_on_by": ["jarāmaraṇa"],
      "practice": "seeing-right-view-outline",
      "text": "nanavira-nibbana-anatta",
      "visual": "pivot",
      "visual_form": "A new gear appearing. It looks solid. It's just the last pivot in a long chain.",
      "level": 2,
      "sermon_range": "11-16 (dependent arising: the twelve links)"
    },
    {
      "id": "jarāmaraṇa",
      "name": "Aging & Death",
      "pali": "jarāmaraṇa",
      "definition": "The suffering that follows birth. If 'I am' is born, 'I am not' must follow. The cup fills. Sorrow, lamentation, pain, despair — all downstream of the birth of a self-sense.",
      "depends_on": ["jāti"],
      "depends_on_note": "Birth brings death. The self-sense that was born must pass. The cup fills.",
      "depended_on_by": [],
      "practice": "seeing-right-view-outline",
      "text": "nanavira-foundation-of-ethics",
      "visual": "cup",
      "visual_form": "A vessel filling. Each drop is a self-sense that was born and will pass. The cup doesn't choose to fill.",
      "level": 2,
      "sermon_range": "11-16 (dependent arising: the twelve links)"
    },

    {
      "id": "nimitta",
      "name": "Sign",
      "pali": "nimitta",
      "definition": "The mental sign that comes with every perception. 'Sound.' 'Thought.' 'Me.' The sign is a concept that overlays bare experience. It is made, not given. Every sign obscures what's behind it.",
      "depends_on": ["nāmarūpa"],
      "depends_on_note": "Name and form produce signs. The sign is the name in action — the label being applied in real time.",
      "depended_on_by": ["papañca"],
      "practice": "signless-concentration-outline",
      "text": "nanananda-magic-of-mind",
      "visual": "glass",
      "visual_form": "A coloured lens. Everything seen through it is tinted. Remove the lens and the colour goes — the light was always white.",
      "level": 3,
      "sermon_range": "17-22 (papañca and signs)"
    },
    {
      "id": "papañca",
      "name": "Proliferation",
      "pali": "papañca",
      "definition": "The mind's habit of expanding every experience into a story. 'Sound' → 'fan' → 'broken' → 'need to fix' → 'landlord' → 'anger.' One sign becomes a web becomes a life. The vortex.",
      "depends_on": ["nimitta"],
      "depends_on_note": "Signs proliferate. One label triggers the next. The web expands. The vortex spins.",
      "depended_on_by": ["saṅkhāra"],
      "practice": "concept-deconstruction-outline",
      "text": "nanananda-concept-and-reality",
      "visual": "spiral",
      "visual_form": "A vortex. One drop spirals outward. Complexity grows. You are inside it.",
      "level": 3,
      "sermon_range": "17-22 (papañca and signs)"
    },

    {
      "id": "animitta",
      "name": "Signless",
      "pali": "animitta",
      "definition": "What remains when signs stop. Not nothing. Something that was always there, obscured by the signs. The light without filters. The sound without labels. The experience without the concept.",
      "depends_on": [],
      "depends_on_note": "Animitta doesn't depend on anything. It is what remains when the dependencies are removed.",
      "depended_on_by": [],
      "practice": "vbt-sound-dissolution",
      "text": "nanananda-magic-of-mind",
      "visual": "light",
      "visual_form": "Pure light. No lens. No filter. What was always there.",
      "level": 4,
      "sermon_range": "23-28 (signless concentration)"
    },
    {
      "id": "animitta-samādhi",
      "name": "Signless Concentration",
      "pali": "animitta samādhi",
      "definition": "The practice of resting in the signless. Not making the signs stop. Seeing the signs being made, and resting in what's behind them. The doorway.",
      "depends_on": ["animitta"],
      "depends_on_note": "The signless concentration rests in the signless. It is the practice of the signless, not the signless itself.",
      "depended_on_by": [],
      "practice": "signless-concentration-outline",
      "text": "nanananda-magic-of-mind",
      "visual": "light",
      "visual_form": "Removing lenses one by one. The light gets brighter. Not because you added light — because you removed the filter.",
      "level": 4,
      "sermon_range": "23-28 (signless concentration)"
    },

    {
      "id": "anicca",
      "name": "Impermanence",
      "pali": "anicca",
      "definition": "Everything that arises passes. Not a theory — a thing you see directly. When you see it, the views it undermines fall away. The gear fades.",
      "depends_on": [],
      "depends_on_note": "Anicca is a characteristic of reality, not a fabrication. It is seen, not made.",
      "depended_on_by": [],
      "practice": "vbt-sound-dissolution",
      "text": "nanananda-nibbana-mind-stilled",
      "visual": "fade",
      "visual_form": "Metal fading to stone. The gear was never solid. It was always fading.",
      "level": 5,
      "sermon_range": "6-10 (the three characteristics as lived)"
    },
    {
      "id": "dukkha",
      "name": "Suffering",
      "pali": "dukkha",
      "definition": "Not pain — the unsatisfactoriness of conditioned experience. The cup that fills and overflows. The self-sense that is born and must pass. The wanting that never finishes.",
      "depends_on": ["jarāmaraṇa"],
      "depends_on_note": "Suffering is downstream of birth and death. The cup fills because self-senses keep being born into it.",
      "depended_on_by": [],
      "practice": "seeing-right-view-outline",
      "text": "nanavira-foundation-of-ethics",
      "visual": "cup",
      "visual_form": "The cup overflowing. Not dramatic. Just full. That's dukkha.",
      "level": 5,
      "sermon_range": "6-10 (the three characteristics as lived)"
    },
    {
      "id": "anattā",
      "name": "Not-Self",
      "pali": "anattā",
      "definition": "There is no permanent, independent self at the centre of experience. Look for the observer and you find seeing, not a seer. The observer is itself a fabrication.",
      "depends_on": [],
      "depends_on_note": "Anattā is a characteristic of reality, not a fabrication. It is seen, not made.",
      "depended_on_by": [],
      "practice": "seeing-right-view-outline",
      "text": "nanavira-nibbana-anatta",
      "visual": "light",
      "visual_form": "The camera watching a mirror. The mirror cracks. Behind it: no camera. Just the room.",
      "level": 5,
      "sermon_range": "6-10 (the three characteristics as lived)"
    },

    {
      "id": "nibbāna",
      "name": "Nibbāna",
      "pali": "nibbāna",
      "definition": "Not a state you attain. Not a place you go. What is left when you stop fabricating. The signless, the unconditioned, the end of making. The machine is off. The ground remains.",
      "depends_on": [],
      "depends_on_note": "Nibbāna depends on nothing. It is what remains when the dependencies are removed. It was always there.",
      "depended_on_by": [],
      "practice": "signless-concentration-outline",
      "text": "nanananda-nibbana-mind-stilled",
      "visual": "stone",
      "visual_form": "The empty machine. Base plate still there. Mounts still there. Holes where the gears were. Nothing moves. That's nibbāna.",
      "level": 6,
      "sermon_range": "29-33 (what remains)"
    }
  ],

  "dependency_chains": {
    "the_machine": {
      "name": "The Twelve-Link Machine",
      "chain": ["avijja", "sankhara", "viññāṇa", "nāmarūpa", "saḷāyatana", "phassa", "vedanā", "taṇhā", "upādāna", "bhava", "jāti", "jarāmaraṇa"],
      "removal_rule": "Remove any link and the chain stops. The links after it don't fire. That's nibbāna: not a state, a stopped machine."
    },
    "the_signs": {
      "name": "The Sign Chain",
      "chain": ["nāmarūpa", "nimitta", "papañca"],
      "removal_rule": "Name and form make signs. Signs proliferate. See the signs being made and the proliferation slows."
    },
    "the_path": {
      "name": "The Path Through",
      "chain": ["animitta-samādhi", "animitta", "nibbāna"],
      "removal_rule": "Signless concentration rests in the signless. What remains when signs stop is nibbāna."
    }
  },

  "sermon_map": {
    "1-5": {"topic": "What nibbāna is and isn't", "concepts": ["nibbāna", "animitta"], "visual": "empty-machine"},
    "6-10": {"topic": "The three characteristics as lived", "concepts": ["anicca", "dukkha", "anattā"], "visual": "fading-gear + overflowing-cup + cracked-mirror"},
    "11-16": {"topic": "Dependent arising: the twelve links", "concepts": ["avijja", "sankhara", "viññāṇa", "nāmarūpa", "saḷāyatana", "phassa", "vedanā", "taṇhā", "upādāna", "bhava", "jāti", "jarāmaraṇa"], "visual": "twelve-link-machine"},
    "17-22": {"topic": "Papañca and signs", "concepts": ["nimitta", "papañca"], "visual": "vortex (first-person) + sign-lens (first-person)"},
    "23-28": {"topic": "Signless concentration", "concepts": ["animitta-samādhi", "animitta"], "visual": "lenses-removed (first-person)"},
    "29-33": {"topic": "What remains", "concepts": ["nibbāna"], "visual": "still-machine + unfiltered-light (first-person)"}
  }
}

```
