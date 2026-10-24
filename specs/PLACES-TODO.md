# Places: standing discovery list

The open list of gaps in the place layer. Work it top-down; when a gap is closed, move the line to "Done" with the date and
the commit. Rules for any addition: official site or a primary source for every fact; contacts only as the place publishes
them (`tools/place-contacts.py`); coordinates from OSM/Wikidata or the place's own map; `confidence` high/medium only on the
map, low goes to a review file; a place tied to a person with a public safety record gets checked against
`app/wisegraph/redflags.json` and `specs/PLACES-REVIEW.md` before it ships.

## 0. Blocked: discovery batch not in the workspace (2026-10-25)
- `work/wiser-places-discovery/` (81 candidates in `candidates.jsonl`, plus `by-tradition.md`, `rejects.md`, `TODO.md`) was
  logged as written on 2026-10-25 but is **not on disk** (searched all of /workspace). Nothing from it is merged.
  When it is re-run or restored: map `school` -> tradition ids; add the ids it needs (`bon` and `sanbo-zen` and `nimatullahi`
  exist already; still to add: `halveti-jerrahi`, `jewish-renewal`, `perennial-philosophy`, `integral-yoga`; check `pure-land`);
  merge high + medium; hold low in `specs/PLACES-HELD.md`; flag the ~12 sites the crawler could not open as
  `details_unverified: true` (pass it through build-wise.py and show a "details unverified" note on /place/<id>); merge its `rejects.md` into PLACES-REVIEW.md.

## 1. Coverage gaps
- **UK Jewish**: synagogues and study houses with a contemplative or mystical programme (Jewish Renewal, Masorti/Liberal
  meditation groups, Limmud-linked retreats); only `kabbalah-centre-london` and `kabbalah-society` today.
- **UK Pa-Auk**: Pa-Auk-lineage teaching in the UK (retreats taught by Pa-Auk-trained monks, e.g. at Theravada viharas);
  confirm via the teachers' own schedules, not third-party listings.
- **Shakta pithas**: the main Shakti Peethas (Kamakhya: use maakamakhya.org, not kamakhyatemple.org; Kalighat; Tarapith;
  Vaishno Devi; Jwalamukhi; Hinglaj) as heritage/pilgrimage places with temple-board sites.
- **Tibetan schools under-represented**: Jonang (Dzamthang; Jonang centres abroad), Drikung Kagyu (Drikung Kagyu Institute,
  Dehradun; Tibetan Meditation Center, Frederick MD), Drukpa (Druk Amitabha Mountain, Kathmandu; Hemis), Rimé centres.
- **Nichiren**: Nichiren Shu temples and Nipponzan Myohoji peace pagodas (Milton Keynes, Battersea); decide how to list
  Soka Gakkai (lay organisation, many halls) without bulk-adding branches.
- **Korean Seon**: Jogye Order training monasteries (Songgwangsa, Haeinsa, Tongdosa), Templestay programme, Kwan Um School
  centres abroad.
- **Orthodox hesychast**: Mount Athos monasteries (visits via the Pilgrims' Bureau, men only: say so), St John the Baptist
  Monastery (Tolleshunt Knights, Essex), Valaam, Optina; heritage vs active status per place.

## 2. Data quality
- **Wikidata ids**: places without `wikidata` (most curated non-Goenka places) — match by name + coordinates + official site
  (SPARQL, manual confirm when the match is not unique). Adds sameAs to the JSON-LD and better entity resolution for agents.
- **Languages**: 282 places have no `language`; read from the site's `<html lang>` and its language switcher.
- **Events coverage**: only places whose own pages publish iCal or schema.org Event data appear in `/data/events.json`
  (23 places, 2026-10-25). Ask high-traffic places without a feed whether they publish one; never scrape HTML calendars
  with an LLM.
- **Reddit evidence counts**: the discovery round wanted r/Buddhism, r/streamentry etc. mention counts per place as a
  popularity signal; Reddit's JSON endpoints are blocked from the sandbox, so evidence is thread URLs only. Options: run
  the count in the weekly GitHub Action (polite UA, no login) or drop the signal.
- **Review queue**: `specs/PLACES-REVIEW.md` section C (Diamond Way, Osho, Amma, Isha, Dhammakaya) needs sources opened and
  checked before anything is asserted.

## Done
- 2026-10-25 static /place, /places, /places/<tradition>, /places/country/<cc> pages, per-place shards, events keeper,
  MCP search_places / list_events (see MERGE-LOG.md).
