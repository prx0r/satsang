# ext-48 places discovery (2026-10-25)

Staged from `work/wiser-places-discovery/` (candidates.jsonl, 78; regenerated batch replacing the lost 81) by
`work/wiser-places-discovery/stage.py`. Raw batch also in private prx0r/satsang-data `places-discovery/`.

- `places-ext.json`: 78 places (53 high, 25 medium). 9 `details_unverified` (site blocked/offline: alton-abbey, st-cecilias-ryde,
  menri-dolanji, drikung-kagyu-institute, tibetan-meditation-center, chion-in, simonopetra, montserrat, lotus-temple).
  Geocoded at merge: satipanya (the place's own travel page), drala-jong (SA44 4RY postcode), menri-dolanji (Dolanji village,
  Wikipedia), druk-amitabha (the place's own schema.org geo), st-peter-on-the-wall (Wikidata Q5073092). No map point (no fixed
  premises): british-taoist-association, hamakom-uk.
- `traditions-additions.json`: halveti-jerrahi (sufism), jewish-renewal (jewish), integral-yoga-aurobindo (hindu),
  integral-yoga-satchidananda (divine-life-society), nichiren (mahayana), soka-gakkai (nichiren). perennial-philosophy is mapped
  to the existing `perennialism` (source_maps.TRAD_MAP); aleph-renewal retagged jewish-renewal (PLACE_TRADS); nipponzan-myohoji
  reparented under nichiren (DEEP_REPARENT).
- `redflags-public.json`: place-level safety records for school-of-philosophy-london (Townend inquiry, St James/St Vedast schools),
  iyi-new-york and yogaville (2023 Adult Survivors Act suit; 2026 NY Slip Op 00217). Shown on /place/<id>, in the place shard and in
  MCP get_place, like person records.
- Contacts are not staged: tools/place-contacts.py reads them from each official site (as published, with source and date).
- Dropped by the batch (not here): hemis, sutton-courtenay-abbey, osmanli-dergahi (see specs/PLACES-REVIEW.md section D).
