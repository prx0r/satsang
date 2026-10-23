# Keeper report

Updated 2026-10-23T01:30:38Z for https://tantrafiles.xyz. State branch: `keeper-state`. Agents: see keeper/AGENTS.md.

**Open findings:** 221 (error 1, warn 5, info 215). **Uptime (30 d):** 100%. **Down now:** nothing.
**Dead:** 0 clips (0 videos), 1 external URLs. **Re-verify queue:** 482.

## By check

| check | open | error | warn | info | last run | checked |
|---|---:|---:|---:|---:|---|---:|
| bundle | 1 | 0 | 1 | 0 | 2026-10-20T13:16:21Z | 2 |
| integrity | 6 | 0 | 0 | 6 | 2026-10-22T08:54:46Z | 2717 |
| jsonld | 0 | 0 | 0 | 0 | 2026-10-22T08:54:47Z | 45 |
| leaks | 0 | 0 | 0 | 0 | 2026-10-22T08:54:52Z | 1057 |
| linkrot | 5 | 1 | 4 | 0 | 2026-10-22T08:56:25Z | 700 / 1817 |
| links | 0 | 0 | 0 | 0 | 2026-10-22T08:56:28Z | 359 / 359 |
| oembed | 0 | 0 | 0 | 0 | 2026-10-22T09:02:50Z | 2500 / 9738 |
| perf | 0 | 0 | 0 | 0 | 2026-10-20T13:24:29Z | 5 |
| provenance | 209 | 0 | 0 | 209 | 2026-10-22T09:02:50Z | 2342 |
| robots | 0 | 0 | 0 | 0 | 2026-10-22T09:02:50Z | 18 |
| sitemap | 0 | 0 | 0 | 0 | 2026-10-23T01:30:37Z | 120 / 1680 |
| uptime | 0 | 0 | 0 | 0 | 2026-10-23T01:30:38Z | 12 |

## Top problems

- `c8df15076389` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/2024/04/2.1-retraites-et-journees-de-pleine-conscience.html (3× in a row)
- `1e7b60ff77f2` **warn** bundle: site Worker ~2.55 MB gzip = 85% of the limit (estimate from tracked inputs (build output absent)) — worker:site
- `46eca3f80c1e` **warn** linkrot: External link failing: HTTP 502 — https://cadw.gov.wales/contact-us
- `aa19e7e486a4` **warn** linkrot: External link failing: HTTP 502 — https://cadw.gov.wales/visit/places-to-visit/pentre-ifan-burial-chamber
- `c3f5785b0c32` **warn** linkrot: External link failing: HTTP 503 — https://www.koyasan.or.jp/en/
- `cfdbf83c6ef3` **warn** linkrot: External link failing: HTTP 502 — https://cadw.gov.wales/visit/places-to-visit/bryn-celli-ddu-burial-chamber

## Uptime by probe (30 d)

| probe | up % | avg ms | last |
|---|---:|---:|---|
| api-health | 100.0 | 165 | up 2026-10-23T01:30:37Z |
| home | 100.0 | 25 | up 2026-10-23T01:30:37Z |
| hub:/person/ajahn-chah | 100.0 | 25 | up 2026-10-23T01:30:37Z |
| hub:/topic/rebirth | 100.0 | 26 | up 2026-10-23T01:30:37Z |
| hub:/tradition/buddhism | 100.0 | 25 | up 2026-10-23T01:30:37Z |
| llms.txt | 100.0 | 21 | up 2026-10-23T01:30:38Z |
| mcp-initialize | 100.0 | 601 | up 2026-10-23T01:30:38Z |
| mcp-tool-call | 100.0 | 49 | up 2026-10-23T01:30:38Z |
| mcp-tools-list | 100.0 | 91 | up 2026-10-23T01:30:38Z |
| openapi.json | 100.0 | 49 | up 2026-10-23T01:30:38Z |
| sitemap | 100.0 | 19 | up 2026-10-23T01:30:38Z |
| well-known-mcp | 100.0 | 20 | up 2026-10-23T01:30:38Z |

## Performance (key pages)

- /: TTFB 154 ms, 0.65 MB (2 assets)
- /topic/rebirth: TTFB 31 ms, 0.65 MB (2 assets)
- /person/ajahn-chah: TTFB 29 ms, 0.65 MB (2 assets)
- /place/amaravati: TTFB 32 ms, 0.65 MB (2 assets)
- /agents: TTFB 30 ms, 0.01 MB (0 assets)

## Worker bundles

- site: 2.55 MB gzip (15.69 MB raw), estimate from tracked inputs (build output absent)
- mcp: 0.93 MB gzip (6.27 MB raw), estimate (data + src + discovery)
