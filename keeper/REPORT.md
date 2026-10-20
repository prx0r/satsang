# Keeper report

Updated 2026-10-20T13:14:56Z for https://tantrafiles.xyz. State branch: `keeper-state`. Agents: see keeper/AGENTS.md.

**Open findings:** 182 (error 2, warn 16, info 164). **Uptime (30 d):** 100%. **Down now:** nothing.
**Dead:** 0 clips (0 videos), 0 external URLs. **Re-verify queue:** 424.

## By check

| check | open | error | warn | info | last run | checked |
|---|---:|---:|---:|---:|---|---:|
| bundle | 0 | 0 | 0 | 0 | 2026-10-20T13:10:33Z | 2 |
| integrity | 12 | 0 | 6 | 6 | 2026-10-20T13:10:13Z | 2280 |
| jsonld | 0 | 0 | 0 | 0 | 2026-10-20T13:10:14Z | 44 |
| leaks | 0 | 0 | 0 | 0 | 2026-10-20T13:10:19Z | 576 |
| linkrot | 10 | 0 | 10 | 0 | 2026-10-20T13:14:56Z | 450 / 1694 |
| links | 2 | 2 | 0 | 0 | 2026-10-20T13:10:21Z | 323 / 323 |
| oembed | 0 | 0 | 0 | 0 | 2026-10-20T13:12:14Z | 600 / 9269 |
| perf | 0 | 0 | 0 | 0 | 2026-10-20T13:10:21Z | 5 |
| provenance | 158 | 0 | 0 | 158 | 2026-10-20T13:10:21Z | 1976 |
| robots | 0 | 0 | 0 | 0 | 2026-10-20T13:12:40Z | 18 |
| sitemap | 0 | 0 | 0 | 0 | 2026-10-20T13:10:12Z | 120 / 1395 |
| uptime | 0 | 0 | 0 | 0 | 2026-10-20T13:10:12Z | 12 |

## Top problems

- `917315e3a558` **error** links: Internal link broken: HTTP 404 — https://tantrafiles.xyz/person
- `fbbc7a8a6653` **error** links: Internal link broken: HTTP 404 — https://tantrafiles.xyz/schema/
- `010a563b6d1b` **warn** integrity: Conflicting claims on academic_supervisor_of (incoming): richard-gombrich (https://en.wikipedia.org/wiki/Mark_S._G._Dyczkowski (deep-tantra lineages)) vs alexis-sanderson (https://www.anuttaratrikakula.org/about-sadaasaya-mark-dyczkowski (his own site, per deep-india-study)) — person/mark-dyczkowski
- `400638440dcf` **warn** integrity: Conflicting claim: deep-india-study gives death year 2025; the data has none — person/mark-dyczkowski
- `779c10de3528` **warn** integrity: Place lists teacher "nag-hammadi", who is not in the people list — place/coptic-museum
- `c6f47fa694fc` **warn** integrity: Possible duplicate places "Dhamma Khetta" (0.00 km apart) — place/dhamma-khetta2+dhamma-khetta
- `d24f23dc0807` **warn** integrity: Conflicting claims on years.end: none (sources/deep-tantra/people.json (b. 1951, no death)) vs 2025 (sources/deep-india-study (died 2025-02-02)) — person/mark-dyczkowski
- `dd32a7ca2ef1` **warn** integrity: Place lists teacher "nag-hammadi", who is not in the people list — place/nag-hammadi-site
- `1549dabc3ce9` **warn** linkrot: External link failing: ENOTFOUND: fetch failed — https://bedegriffithssangha.org
- `21c330226d8d` **warn** linkrot: External link failing: ENOTFOUND: fetch failed — https://dragonbelltemple.org
- `e77638f23fcb` **warn** linkrot: External link failing: ERR_TLS_CERT_ALTNAME_INVALID: fetch failed — https://giri.dhamma.org
- `9fbff351e76c` **warn** linkrot: External link failing: ERR_TLS_CERT_ALTNAME_INVALID: fetch failed — https://kanheri.dhamma.org/
- `4e4922c6f4fc` **warn** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://networks.h-net.org/group/announcements/20037841/jeffrey-hopkins-1940-2024
- `1db195649ec4` **warn** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://networks.h-net.org/node/6060/pages/3914200/hopkins-jeffrey
- `be60948a07b9` **warn** linkrot: External link failing: HTTP 404 — https://en.wikipedia.org/wiki/Sayadaw_U_Silananda
- `afe8eac6ed41` **warn** linkrot: External link failing: HTTP 404 — https://en.wikipedia.org/wiki/Swami_Niranjanananda_Saraswati
- `cba4a4d20165` **warn** linkrot: External link failing: HTTP 404 — https://en.wikipedia.org/wiki/Sujato
- `5339093fa2bf` **warn** linkrot: External link failing: HTTP 404 — https://en.wikipedia.org/wiki/Swami_Vishnudevananda_Saraswati

## Uptime by probe (30 d)

| probe | up % | avg ms | last |
|---|---:|---:|---|
| api-health | 100.0 | 52 | up 2026-10-20T13:10:12Z |
| home | 100.0 | 11 | up 2026-10-20T13:10:12Z |
| hub:/person/ajahn-chah | 100.0 | 11 | up 2026-10-20T13:10:12Z |
| hub:/topic/rebirth | 100.0 | 13 | up 2026-10-20T13:10:12Z |
| hub:/tradition/buddhism | 100.0 | 11 | up 2026-10-20T13:10:12Z |
| llms.txt | 100.0 | 11 | up 2026-10-20T13:10:12Z |
| mcp-initialize | 100.0 | 296 | up 2026-10-20T13:10:12Z |
| mcp-tool-call | 100.0 | 27 | up 2026-10-20T13:10:12Z |
| mcp-tools-list | 100.0 | 24 | up 2026-10-20T13:10:12Z |
| openapi.json | 100.0 | 23 | up 2026-10-20T13:10:12Z |
| sitemap | 100.0 | 12 | up 2026-10-20T13:10:12Z |
| well-known-mcp | 100.0 | 12 | up 2026-10-20T13:10:12Z |

## Performance (key pages)

- /: TTFB 32 ms, 0.65 MB (2 assets)
- /topic/rebirth: TTFB 11 ms, 0.65 MB (2 assets)
- /person/ajahn-chah: TTFB 12 ms, 0.65 MB (2 assets)
- /place/amaravati: TTFB 11 ms, 0.65 MB (2 assets)
- /agents: TTFB 12 ms, 0.01 MB (0 assets)

## Worker bundles

- site: 1.62 MB gzip (8.99 MB raw), build output
- mcp: 0.93 MB gzip (6.27 MB raw), estimate (data + src + discovery)
