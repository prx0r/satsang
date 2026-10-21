# Sermon 1 graph — Nibbāna: The Mind Stilled, Sermon 01

Everything Ñāṇananda says in Sermon 1, modelled as a dependency graph.
Working backwards from nibbāna, exactly as the sermon does: start at
extinction, walk back to the wound (nāma-rūpa), walk back to childlike
knowing.

Source: Nibbana-01-1.pdf (BCBS/Dharma Seed, free). 7571 words.
Theme: Etaṃ santaṃ etaṃ paṇītaṃ — stilling of all preparations,
relinquishment of all assets, destruction of craving, detachment,
cessation, extinction.

## Graph (JSON)

```json
{
  "id": "sermon-01",
  "type": "sermon-graph",
  "tradition": "early-suttas",
  "source": "Nibbana: The Mind Stilled, Sermon 01 (free PDF, BCBS/Dharma Seed)",
  "method": "working backwards from nibbana",
  "terminal": "nibbana-extinction",
  "terminal_note": "Nibbana = extinction of the fires = destruction of craving (tanhakkhayo). Not a distant object. What remains when fabrication stops.",
  "nodes": [
    {
      "id": "theme-verse",
      "name": "Theme verse as meditation subject",
      "pali": "Etam santam etam panitam: sabbasankharasamatho, sabbupadhipatinissaggo, tanhakkhayo, virago, nirodho, nibbanam",
      "section": "opening",
      "says": "The six-part theme (stilling of preparations, relinquishment of assets, destruction of craving, detachment, cessation, extinction) is itself a kammatthana: upasamanussati, reflection on peace. Frames all 11 sermons; creates meditative attention, not academic debate.",
      "depends_on": [],
      "frames": ["six-qualities", "commentary-failure", "nama-is-name", "nibbana-extinction"],
      "practice": "signless-concentration-outline",
      "texts": ["nanananda-nibbana-mind-stilled"],
      "visual": "light"
    },
    {
      "id": "six-qualities",
      "name": "Six qualities of Dhamma (purpose)",
      "pali": "svakkhata, sanditthika, akalika, ehipassika, opanayika, paccattam veditabbo vinnuhi",
      "section": "purpose",
      "says": "The sermons succeed if they drive home that Dhamma is well-proclaimed, seen here-and-now, timeless, inviting, leading onward, understood each one by himself.",
      "depends_on": ["theme-verse"],
      "practice": "seeing-right-view-outline",
      "texts": ["nanananda-nibbana-mind-stilled"],
      "visual": "light"
    },
    {
      "id": "commentary-failure",
      "name": "Why commentaries fail on deep suttas",
      "section": "background",
      "says": "Four reasons: Ani-sutta prophecy (monks lose interest in sunnata suttas); precept-vs-realization debate (precept won, realization sidelined); basket passed hand to hand in the dark (valuable things slip out); semantic overdrawing (lucid words buried). Depth is seen through lucidity, as a tank bottom is seen only when water is lucid.",
      "depends_on": ["theme-verse"],
      "motivates": "return to the suttas themselves",
      "practice": "seeing-right-view-outline",
      "texts": ["nanananda-nibbana-mind-stilled"],
      "suttas": ["sn-48-10-indriya"],
      "visual": "metal"
    },
    {
      "id": "nama-is-name",
      "name": "Nama means name (not bending)",
      "pali": "nama",
      "section": "deep dive 1",
      "says": "Commentaries render nama as 'bending' (arammana-bending). The suttas mean 'name'. Evidence: Sopaka story (Buddha's 10 questions to the 7-year-old arahant, #2 = namanca rupanca); 'Name has conquered everything' verse + Chinese SA 1020 parallel; Akkheyya verse (beings established on the nameable, yoked to death by not comprehending it).",
      "depends_on": ["commentary-failure"],
      "evidence": ["sopaka-story", "name-conquered-verse+SA1020", "akkheyya-verse"],
      "practice": "concept-deconstruction-outline",
      "texts": ["nanananda-concept-and-reality"],
      "fojin_check": "Snp parallels for the Akkheyya verse; verify_quote before shipping.",
      "visual": "glass"
    },
    {
      "id": "mn9-definition",
      "name": "Sister Phala's definition (MN 9)",
      "pali": "vedana, sanna, cetana, phasso, manasikaro = namam; four great primaries + dependent form = rupam",
      "section": "deep dive 1",
      "says": "MN 9 defines nama as the five (feeling, perception, intention, contact, attention) and rupa as the four primaries plus dependent form. MA 29 parallel has the four immaterial aggregates; Ekottarika-agama parallel matches MN 9. The definition is lucid — no bending needed.",
      "depends_on": ["nama-is-name"],
      "parallels": ["MA29", "EA-parallel-via-Analayo-2011"],
      "practice": "concept-deconstruction-outline",
      "texts": ["nanananda-concept-and-reality", "analayo-direct-path"],
      "suttas": ["mn-10-satipatthana"],
      "fojin_check": "MN 9 + Madhyama-agama parallel: get_parallels.",
      "visual": "glass"
    },
    {
      "id": "toddler-knowing",
      "name": "The toddler and the rubber ball",
      "section": "deep dive 1",
      "says": "A toddler given a rubber ball knows it by smell, feel, taste, rolling — by contact, feeling, perception, intention, attention — not by the conventional name 'rubber ball'. That is the prototype of nama: direct knowing before convention. The world later adds names for easy communication; with others' sanction they become convention.",
      "depends_on": ["mn9-definition"],
      "practice": "concept-deconstruction-outline",
      "texts": ["nanananda-concept-and-reality"],
      "visual": "light"
    },
    {
      "id": "meditator-childlike",
      "name": "Meditator returns to childlike knowing",
      "pali": "satisampajanna; paccattam veditabbo",
      "section": "deep dive 1",
      "says": "The meditator must come back to the child's state — equanimity with knowledge, not ignorance — using mindfulness and full awareness. However fluent in conventional names, comprehension of nama-rupa uses the five factors. Each must understand his own nama-rupa world himself; no one else can do it, and no technical terms denote it.",
      "depends_on": ["toddler-knowing"],
      "practice": "four-establishments-outline",
      "texts": ["nanananda-concept-and-reality", "analayo-direct-path"],
      "suttas": ["mn-10-satipatthana"],
      "visual": "light"
    },
    {
      "id": "wound-and-surgeon",
      "name": "Nama-rupa is the wound; craving is the arrow",
      "pali": "acchecchi tanham idha namarupe",
      "section": "deep dive 1",
      "says": "Suffering is found in the nama-rupa world, not out there. The aim is to cut craving right here in nama-rupa. The Buddha is the incomparable surgeon (sallakatto anuttaro) who pulls the poison-tipped arrow of craving (tanhasallassa hantara). The bandage goes on the wound — so first locate and clean the wound: comprehend nama-rupa.",
      "depends_on": ["meditator-childlike", "rupa-nominal-form"],
      "practice": "concept-deconstruction-outline",
      "texts": ["nanananda-concept-and-reality"],
      "visual": "metal"
    },
    {
      "id": "rupa-nominal-form",
      "name": "Rupa is nominal form (not mind-vs-matter)",
      "section": "deep dive 2",
      "says": "No rigid mind/matter split: rupa exists in relation to nama, known with its help. The four primaries are known by behaviour (hardness/softness, cohesion/dissolution, hot/cold, motion/inflation); rupasanna is the net result. 'Name' is a formal/apparent name; 'form' is a nominal form — form only in name.",
      "depends_on": ["mn9-definition"],
      "practice": "concept-deconstruction-outline",
      "texts": ["nanananda-concept-and-reality"],
      "visual": "glass"
    },
    {
      "id": "jata-tangle",
      "name": "The Jata tangle snapped where nama-rupa ceases",
      "pali": "yattha namanca rupanca asesam uparujjhati, patigham rupasanna ca, etthesa chijjate jata",
      "section": "deep dive 2",
      "says": "Jata Sutta riddle: the tangle within and without. Second verse: arahants with lust/hate/ignorance faded have disentangled it. Third verse: where name-and-form cease without remainder, plus resistance (patigha = the knock-against reaction, known by the blind worldling) and perception of form — there the tangle snaps. That is Nibbana. Names perpetuate ignorance; insight is the only release. The meditator slows down like a patient to develop mindfulness.",
      "depends_on": ["rupa-nominal-form", "wound-and-surgeon"],
      "suttas": ["sn-48-10-indriya"],
      "practice": "signless-concentration-outline",
      "texts": ["nanananda-nibbana-mind-stilled"],
      "fojin_check": "Jata Sutta parallels: get_parallels.",
      "visual": "spiral"
    },
    {
      "id": "nibbana-extinction",
      "name": "Nibbana is extinction (not exit-from-weaving)",
      "section": "deep dive 3",
      "says": "Reject the vana=weaving etymology (no sutta support). The suttas use extinction: Ratanasutta lamp simile (Nibbanti dhira yathayam padipo), Dhatuvibhanga torch simile, Aggivacchagotta fire simile with philosophical depth. Of 33 Asankhata-samyutta epithets, Nibbana won out because of the fire allusion.",
      "depends_on": ["jata-tangle"],
      "rejects": "vanasankhataya-tanhaya etymology",
      "practice": "signless-concentration-outline",
      "texts": ["nanananda-nibbana-mind-stilled"],
      "visual": "light"
    },
    {
      "id": "fire-simile",
      "name": "Fire burns by fuel; existence burns by grasping",
      "pali": "idappaccayata; upadanapaccaya bhavo",
      "section": "deep dive 3",
      "says": "Wood burns because of fire, fire because of wood — this-to-that relatedness. Upadana is both fuel and grasping: firewood catches fire, fire catches wood. Existence is a fire kept up by grasping; when grasping ceases, existence ceases. Settles the being/non-being dilemma (katham asatah sat jayeta) and the Vedic nāsadāsīn no sadāsīt confusion.",
      "depends_on": ["nibbana-extinction"],
      "practice": "seeing-right-view-outline",
      "texts": ["nanananda-nibbana-mind-stilled"],
      "visual": "gear"
    },
    {
      "id": "tetralemma-dissolved",
      "name": "Tetralemma dissolved (where did the fire go?)",
      "pali": "nibbuto tveva sankham gacchati",
      "section": "deep dive 3",
      "says": "Vacchagotta's annihilation charge answered: when fire goes out with fuel exhausted, asking its direction is absurd — it is reckoned as 'gone out'. Same for the Tathagata after death (exists / not / both / neither all miss). Upasiva verses: flame thrown by wind reaches its end, cannot be reckoned; with all phenomena uprooted, all pathways of speech are uprooted.",
      "depends_on": ["fire-simile"],
      "practice": "seeing-right-view-outline",
      "texts": ["nanananda-nibbana-mind-stilled", "nyanadipa-silent-sages-of-old"],
      "fojin_check": "Upasiva (Parayana) parallels: get_parallels for the Chinese.",
      "visual": "fade"
    },
    {
      "id": "tanhakkhayo-synonym",
      "name": "Destruction of craving IS Nibbana (full synonym)",
      "pali": "tanhakkhayo; dukkhanirodho; pipasavinayo",
      "section": "deep dive 3",
      "says": "Third noble truth: destruction of that very craving (tassayeva tanhaya asesaviraganirodho). Udana bliss verse: all sense and divine bliss not worth 1/16th of craving-destruction bliss. Udapana well verse: having cut craving at the root, what wandering remains. Thirst quenched gratis (laddha mudha nibbutim), not at cost. Existence is an elevenfold fire; when fires are out, nothing more is needed.",
      "depends_on": ["fire-simile"],
      "rejects": "khayamatta-na-nibbanam (commentarial 'destruction alone is not Nibbana')",
      "practice": "signless-concentration-outline",
      "texts": ["nanananda-nibbana-mind-stilled"],
      "visual": "light"
    },
    {
      "id": "buddhaghosa-refuted",
      "name": "Buddhaghosa's heretic argument refuted",
      "section": "deep dive 3",
      "says": "Visuddhimagga heretic: if Nibbana is lust-extinction, even animals have it (they extinguish lust by enjoyment). Refuted: animals warm up (Magandiya skin-disease simile — scratching beside hot embers), arahants cool down (sitibhuto, nibbuto). Ragakkhayo dosakkhayo mohakkhayo IS Nibbana (Asankhata-samyutta); commentarial nibbanam-agamma periphrasis (staircase to an unseen palace) contradicts it.",
      "depends_on": ["tanhakkhayo-synonym"],
      "practice": "seeing-right-view-outline",
      "texts": ["nanananda-nibbana-mind-stilled", "nyanamoli-visuddhimagga"],
      "visual": "metal"
    },
    {
      "id": "radha-chain",
      "name": "Radha chain: right vision to Nibbana, which has no beyond-purpose",
      "pali": "sammadassana > nibbida > viraga > vimutti > nibbana; nibbanogadham brahmacariyam",
      "section": "close",
      "says": "Radha series: right vision is for disgust (nibbida, for samsara); disgust for dispassion; dispassion for release; release for Nibbana. 'What is the purpose of Nibbana?' is out of range — the holy life is merged in Nibbana like rivers in the sea. No glimpse of a distant object needed: perfect the path and Nibbana is right there (exam simile: answering correctly IS passing, anna certificate; Nanda completed training and was already in Nibbana).",
      "depends_on": ["tanhakkhayo-synonym"],
      "practice": "signless-concentration-outline",
      "texts": ["nanananda-nibbana-mind-stilled"],
      "suttas": ["sn-48-10-indriya"],
      "fojin_check": "Radha-samyutta parallels: get_parallels.",
      "visual": "pivot"
    },
    {
      "id": "craving-forward-bent",
      "name": "Craving is forward-bent; its destruction ends progression",
      "pali": "bhavanetti; tanha ponobhavika",
      "section": "close",
      "says": "Craving inclines forward like a carrot before a donkey (bhavanetti, leader in becoming): this is for that, that for the other, infinite progression, existence again and again. Making destruction-of-craving the aim breaks the progression: when attained, nothing more is to be done. So tanhakkhayo is a full-fledged synonym of Nibbana — asking Nibbana's purpose assumes an aim beyond the ultimate aim, which is incoherent.",
      "depends_on": ["radha-chain"],
      "practice": "seeing-right-view-outline",
      "texts": ["nanananda-nibbana-mind-stilled"],
      "visual": "spring"
    }
  ],
  "working_backwards": {
    "note": "The sermon works backwards from nibbana, exactly as requested: start at extinction, walk back to the wound (nama-rupa), walk back to childlike knowing.",
    "chain": [
      "nibbana-extinction",
      "tanhakkhayo-synonym",
      "fire-simile",
      "wound-and-surgeon",
      "meditator-childlike",
      "toddler-knowing",
      "mn9-definition"
    ]
  },
  "sermon_map": {
    "opening": ["theme-verse"],
    "purpose": ["six-qualities"],
    "background": ["commentary-failure"],
    "deep-dive-1": ["nama-is-name", "mn9-definition", "toddler-knowing", "meditator-childlike", "wound-and-surgeon"],
    "deep-dive-2": ["rupa-nominal-form", "jata-tangle"],
    "deep-dive-3": ["nibbana-extinction", "fire-simile", "tetralemma-dissolved", "tanhakkhayo-synonym", "buddhaghosa-refuted"],
    "close": ["radha-chain", "craving-forward-bent"]
  }
}
```
