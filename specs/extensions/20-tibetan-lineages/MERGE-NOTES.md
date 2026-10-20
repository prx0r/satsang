# MERGE-NOTES — 20-tibetan-lineages (for the lead agent)

## Merge steps
```bash
cd <satsang>
cp -r <ext>/20-tibetan-lineages/sources/tibetan-masters sources/
# years fix: set tulku-thondup years (Lotsawa-sourced)
# standard additions merge -> portraits (mostly historical, no art expected)
#   -> build-wise -> cluster.py reruns (nyingma/kagyu/sakya/gelug/jonang)
#   -> deploy
```

## Before deploy
- Re-verify the 6 medium edges (Tsangpa/Ling Repa, Tulku Urgyen ×2,
  Appey→Dzongsar, Yizhin→Kalu, Chenga→Tsongkhapa). Downgrade or drop.
- Proposed schema addition: `tulku_of` edge rel (reincarnation succession,
  distinct from studied-with). Until it exists, tulku lines stay unwired —
  do not use teacher_of for them.
- Next: Taranatha + Jonang tail, Vimalamitra/Shantarakshita trio, Yeshe
  Tsogyal, Garab-Dorje→Shri Simha Indian chain, Sakya Trichen + Appey line,
  Mingyur/Tsoknyi/Garchen teachers, Dalai Lama teaching links (as opposed
  to successions), Karmapa dispute note.
