# Keeper report

Updated 2026-10-21T06:01:40Z for https://tantrafiles.xyz. State branch: `keeper-state`. Agents: see keeper/AGENTS.md.

**Open findings:** 186 (error 2, warn 20, info 164). **Uptime (30 d):** 100%. **Down now:** nothing.
**Dead:** 0 clips (0 videos), 0 external URLs. **Re-verify queue:** 424.

## By check

| check | open | error | warn | info | last run | checked |
|---|---:|---:|---:|---:|---|---:|
| bundle | 1 | 0 | 1 | 0 | 2026-10-20T13:16:21Z | 2 |
| integrity | 11 | 0 | 5 | 6 | 2026-10-20T13:16:21Z | 2280 |
| jsonld | 0 | 0 | 0 | 0 | 2026-10-20T13:16:22Z | 44 |
| leaks | 0 | 0 | 0 | 0 | 2026-10-20T13:16:26Z | 581 |
| linkrot | 14 | 0 | 14 | 0 | 2026-10-20T13:18:02Z | 700 / 1694 |
| links | 2 | 2 | 0 | 0 | 2026-10-20T13:18:05Z | 323 / 323 |
| oembed | 0 | 0 | 0 | 0 | 2026-10-20T13:24:28Z | 2500 / 9269 |
| perf | 0 | 0 | 0 | 0 | 2026-10-20T13:24:29Z | 5 |
| provenance | 158 | 0 | 0 | 158 | 2026-10-20T13:24:29Z | 1976 |
| robots | 0 | 0 | 0 | 0 | 2026-10-20T13:24:29Z | 18 |
| sitemap | 0 | 0 | 0 | 0 | 2026-10-21T06:01:40Z | 120 / 1674 |
| uptime | 0 | 0 | 0 | 0 | 2026-10-21T06:01:40Z | 12 |

## Top problems

- `917315e3a558` **error** links: Internal link broken: HTTP 404 — https://tantrafiles.xyz/person
- `fbbc7a8a6653` **error** links: Internal link broken: HTTP 404 — https://tantrafiles.xyz/schema/
- `010a563b6d1b` **warn** integrity: Conflicting claims on academic_supervisor_of (incoming): richard-gombrich (https://en.wikipedia.org/wiki/Mark_S._G._Dyczkowski (deep-tantra lineages)) vs alexis-sanderson (https://www.anuttaratrikakula.org/about-sadaasaya-mark-dyczkowski (his own site, per deep-india-study)) — person/mark-dyczkowski
- `1549dabc3ce9` **warn** linkrot: External link failing: ENOTFOUND: fetch failed — https://bedegriffithssangha.org
- `1e7b60ff77f2` **warn** bundle: site Worker ~2.55 MB gzip = 85% of the limit (estimate from tracked inputs (build output absent)) — worker:site
- `21c330226d8d` **warn** linkrot: External link failing: ENOTFOUND: fetch failed — https://dragonbelltemple.org
- `5339093fa2bf` **warn** linkrot: External link failing: HTTP 404 — https://en.wikipedia.org/wiki/Swami_Vishnudevananda_Saraswati
- `66a501feb9e9` **warn** linkrot: External link failing: ENOTFOUND: fetch failed — https://srflondon.org.uk
- `779c10de3528` **warn** integrity: Place lists teacher "nag-hammadi", who is not in the people list — place/coptic-museum
- `9fbff351e76c` **warn** linkrot: External link failing: ERR_TLS_CERT_ALTNAME_INVALID: fetch failed — https://kanheri.dhamma.org/
- `afe8eac6ed41` **warn** linkrot: External link failing: HTTP 404 — https://en.wikipedia.org/wiki/Swami_Niranjanananda_Saraswati
- `b525919c7f42` **warn** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://bodhgayatemple.com
- `be60948a07b9` **warn** linkrot: External link failing: HTTP 404 — https://en.wikipedia.org/wiki/Sayadaw_U_Silananda
- `c6f47fa694fc` **warn** integrity: Possible duplicate places "Dhamma Khetta" (0.00 km apart) — place/dhamma-khetta2+dhamma-khetta
- `c8df15076389` **warn** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/2024/04/2.1-retraites-et-journees-de-pleine-conscience.html
- `cacb2c6a1dcc` **warn** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://bodhgayatemple.com/how-to-reach/
- `cba4a4d20165` **warn** linkrot: External link failing: HTTP 404 — https://en.wikipedia.org/wiki/Sujato
- `d24f23dc0807` **warn** integrity: Conflicting claims on years.end: none (sources/deep-tantra/people.json (b. 1951, no death)) vs 2025 (sources/deep-india-study (died 2025-02-02)) — person/mark-dyczkowski
- `dd32a7ca2ef1` **warn** integrity: Place lists teacher "nag-hammadi", who is not in the people list — place/nag-hammadi-site
- `e77638f23fcb` **warn** linkrot: External link failing: ERR_TLS_CERT_ALTNAME_INVALID: fetch failed — https://giri.dhamma.org
- `ebb655953ffd` **warn** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://sanshin.org
- `f09bc89183eb` **warn** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://devipuram.org

## Uptime by probe (30 d)

| probe | up % | avg ms | last |
|---|---:|---:|---|
| api-health | 100.0 | 136 | up 2026-10-21T06:01:40Z |
| home | 100.0 | 28 | up 2026-10-21T06:01:40Z |
| hub:/person/ajahn-chah | 100.0 | 23 | up 2026-10-21T06:01:40Z |
| hub:/topic/rebirth | 100.0 | 39 | up 2026-10-21T06:01:40Z |
| hub:/tradition/buddhism | 100.0 | 37 | up 2026-10-21T06:01:40Z |
| llms.txt | 100.0 | 26 | up 2026-10-21T06:01:40Z |
| mcp-initialize | 100.0 | 514 | up 2026-10-21T06:01:40Z |
| mcp-tool-call | 100.0 | 43 | up 2026-10-21T06:01:40Z |
| mcp-tools-list | 100.0 | 39 | up 2026-10-21T06:01:40Z |
| openapi.json | 100.0 | 46 | up 2026-10-21T06:01:40Z |
| sitemap | 100.0 | 22 | up 2026-10-21T06:01:40Z |
| well-known-mcp | 100.0 | 22 | up 2026-10-21T06:01:40Z |

## Performance (key pages)

- /: TTFB 154 ms, 0.65 MB (2 assets)
- /topic/rebirth: TTFB 31 ms, 0.65 MB (2 assets)
- /person/ajahn-chah: TTFB 29 ms, 0.65 MB (2 assets)
- /place/amaravati: TTFB 32 ms, 0.65 MB (2 assets)
- /agents: TTFB 30 ms, 0.01 MB (0 assets)

## Worker bundles

- site: 2.55 MB gzip (15.69 MB raw), estimate from tracked inputs (build output absent)
- mcp: 0.93 MB gzip (6.27 MB raw), estimate (data + src + discovery)
