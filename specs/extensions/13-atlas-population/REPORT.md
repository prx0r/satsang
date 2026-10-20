# Population report: places into the Atlas (2026-10-20, extension pack)

Builder: `populate_places.py`. Validated: **0 errors** against
`atlas/schema/atlas.schema.json` (full schema, `$defs` resolved).

## Numbers

- 412 place nodes (`pl-<slug>`; 2 backbone collisions → hand-merge)
  includes 15-niche + 16-USA packs)
- 113 edges
  `part_of` (branch houses; v1 `sister_of` meaning in notes)
- Lanes hit: theravada, vajrayana, chan-zen, mahayana, vedanta, trika,
  christian-mystic, occult, pagan, sufi, kabbalah, early-buddhist…
- 145 laneless · 310 teacherless-in-atlas · 199 backlog items

## Best chains (place → lane → teachers → lineage → family)

- amaravati → theravada → Amaro, Sumedho → thai-forest>theravada>buddhism
- samye-ling → vajrayana → Akong, Trungpa → kagyu>tibetan>vajrayana>buddhism
- jamyang-london → vajrayana → Yeshe, Zopa → gelug>tibetan>vajrayana>buddhism
- gaia-house → theravada → Titmuss, Feldman, Burbea, Batchelor → insight>theravada>buddhism

## Lane gaps (propose lanes or mappings, by places affected)

triratna 39 · hindu 12 · sikh 10 · swaminarayan 6 · western-magic 5 ·
iskcon 5 · ramakrishna-order 4 · anthroposophy 4 · buddhism 2 · krishnamurti 2 ·
thelema 2 · golden-dawn 1 · advaita 1 · vedanta 1 · divine-life-society 1

## Missing person nodes (teachers in wisegraph, absent in atlas)

george-fox 5 · sangharakshita 4 · lama-yeshe-losal 3 · stephen-batchelor 2 ·
martine-batchelor 2 · prabhupada 2 · john-main 2 · khemadhammo, feldman,
titmuss, humphreys, kennett, crook, kelsang-gyatso, vishnudevananda,
satyananda, harding, freeman, sophrony, bulent-rauf, nazim-al-haqqani,
inayat-khan, koenig, mathers, williamson, restall-orr, jones 1 each

## Schema notes for the lead agent

- Place nodes carry `geo {lat, lng, precision}` — no `geo` prop in the
  schema today (additionalProperties allows it). Propose adding it
  (mirrors place.json geo) rather than stripping it.
- `part_of` carries branch meaning in notes; if the Atlas grows
  `sister_of`/`teaches_at` enum values later, re-project (ids are stable).
- Person backlog is the Atlas-side mirror of the P0 teacher-sourcing list:
  every name here wants an atlas person node with fuzzy time + provenance.
