# REPORT — 44-texts-targets (2026-10-20, extension pack)

Early-sutta lineage texts + FoJin connector + teaching targets. Link-only;
free and legitimate. Every URL verified HTTP 200 on 2026-10-20 with browser UA.

## URL table

| url | status | checked | licence | notes |
|---|---|---|---|---|
| https://hareesh.org/vbt-blog-posts | 200 | 2026-10-21 | see app/wisegraph/licence-registry.json | Satsang review: corrected link |
| https://seeingthroughthenet.net/books/ | 200 | 2026-10-21 | see app/wisegraph/licence-registry.json | Satsang review: corrected link |
| https://www.buddhismuskunde.uni-hamburg.de/pdf/5-personen/analayo/sastudies.pdf | 200 | 2026-10-21 | see app/wisegraph/licence-registry.json | Satsang review: corrected link |
| https://www.pathpresspublications.com/en/page/books | 200 | 2026-10-21 | see app/wisegraph/licence-registry.json | Satsang review: corrected link |
| https://nanavira.org/writings | 200 | 2026-10-20 | free (author estate) | free PDF/EPUB/MOBI for all Ñāṇavīra texts |
| https://www.pathpress.org/author/pathpress/ | 200 | 2026-10-20 | free PDF | Dhamma Within Reach + Silent Sages of Old + Aṭṭhakavagga |
| https://www.pathpresspublications.com/en/page/books | 200 | 2026-10-20 | free + paid mix | full catalogue; Aṭṭhakavagga is €0.00 |
| https://www.accesstoinsight.org/lib/authors/nanamoli/PathofPurification2011.pdf | 200 | 2026-10-20 | free (BPS digital edition) | Visuddhimagga translation |
| https://www.accesstoinsight.org/lib/authors/gunaratana/wheel351.html | 200 | 2026-10-20 | free (ATI, author-posted) | Gunaratana jhāna book |
| https://www.dhammatalks.org/suttas/MN/MN131.html | 200 | 2026-10-20 | free (Thanissaro translation) | MN 131 |
| https://suttacentral.net/snp4.11/en/sujato | 200 | 2026-10-20 | CC0 root, Sujato translation | Aṭṭhakavagga core sutta |
| https://suttacentral.net/sn48.10/en/sujato | 200 | 2026-10-20 | CC0 root | signless concentration basis |
| https://suttacentral.net/mn10/en/sujato | 200 | 2026-10-20 | CC0 root | Satipaṭṭhāna |
| https://suttacentral.net/mn111/en/sujato | 200 | 2026-10-20 | CC0 root | jhāna progression |
| https://suttacentral.net/an2.188/en/sujato | 200 | 2026-10-20 | CC0 root | two faculties |
| https://www.bps.lk | 200 | 2026-10-20 | free booklets (BPS) | Ñāṇananda books — BPS main library |
| https://www.buddhismuskunde.uni-hamburg.de/pdf/5-personen/analayo/direct-path.pdf | 200 | 2026-10-20 | free PDF (author-posted) | Anālayo Satipaṭṭhāna: Direct Path + free PDF library |
| https://bcbs.dharmaseed.org/teacher/439 | 200 | 2026-10-20 | free PDF (BCBS / Dharma Seed) | Anālayo Nibbāna: Mind Stilled — 33 lectures with PDFs |
| https://www.buddhistinquiry.org/resources/publications | 200 | 2026-10-20 | free (BCBS, author-posted) | Anālayo full publication list with free downloads |
| https://dharmaseed.org/teacher/439 | 200 | 2026-10-20 | free (Dharma Seed, CC BY-NC-ND) | Anālayo talks + retreat PDFs |
| https://fojin.app | 200 | 2026-10-20 | Apache-2.0 (code) / per-source (data) | FoJin Buddhist canon platform |
| https://mcp.fojin.ai/mcp | 200 | 2026-10-20 | Apache-2.0 (code) / anon rate-limited | FoJin MCP server (streamable-http) |
| https://hareesh.org/blog | 200 | 2026-10-20 | free (author blog) | Hareesh VBT verse-by-verse blog series |
| https://hareesh.org/blog/2023/9/27/vijaana-bhairava-tantra-translation-concordance | 200 | 2026-10-20 | free (author blog) | VBT master translation concordance (8 EN + 2 FR + 1 DE + 1 ES) |
| https://static1.squarespace.com/static/555e47f7e4b02f649df32c58/t/5b155bb90e2e72f442d84263/1528126411131/VBT%20translation%20WALLIS-2.pdf | 200 | 2026-10-20 | free PDF (author-posted) | Hareesh complete VBT translation |
| https://tantra112.app/vijnana-bhairava-tantra | 200 | 2026-10-20 | free (Hareesh) | Full VBT text online, all 112 practices |
| https://archive.org/details/vbt-complete-translation/mode/2up | 200 | 2026-10-20 | free (Archive, opensource) | VBT complete translation PDF |
| https://ia801801.us.archive.org/7/items/vijnana-bhairava-tantra_20210216/Vijnana%20Bhairava%20Tantra_text.pdf | 200 | 2026-10-20 | copyrighted (Indica 2002), Archive PDF | Baumer tr. + Lakshman Joo commentary |

## What is NOT here

- Clearing the Path / Notes on Dhamma / Seeking the Path — paid Path Press,
  citation-only per RIGHTS.md.
- Seeing That Frees (Burbea) — copyrighted, citation-only; its sources are
  all covered by the free texts above.
- No text copies stored. Links only.

## FoJin integration

Connector at `connectors/fojin.json` feeds:
- `verify_quote` before any sutta quote ships to chat or practice text
- `get_parallels` for topic-hub cross-tradition compare sections
- `lookup_dictionary` for archaic Pali terms in practice steps
- each targets entry carries a `fojin_check` field naming which tool to use

## Teaching targets

Full teaching plan in `texts-targets.json` — every text carries: teach_as
approach, practice_families, practices_to_derive (with full practice.json
records), collection_target, read_order, fojin_check.
