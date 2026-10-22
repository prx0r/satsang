# Keeper report

Updated 2026-10-22T04:43:28Z for https://tantrafiles.xyz. State branch: `keeper-state`. Agents: see keeper/AGENTS.md.

**Open findings:** 222 (error 0, warn 7, info 215). **Uptime (30 d):** 100%. **Down now:** nothing.
**Dead:** 0 clips (0 videos), 0 external URLs. **Re-verify queue:** 482.

## By check

| check | open | error | warn | info | last run | checked |
|---|---:|---:|---:|---:|---|---:|
| bundle | 1 | 0 | 1 | 0 | 2026-10-20T13:16:21Z | 2 |
| integrity | 6 | 0 | 0 | 6 | 2026-10-21T08:52:12Z | 2717 |
| jsonld | 0 | 0 | 0 | 0 | 2026-10-21T08:52:13Z | 45 |
| leaks | 0 | 0 | 0 | 0 | 2026-10-21T08:52:18Z | 1052 |
| linkrot | 6 | 0 | 6 | 0 | 2026-10-21T08:57:26Z | 700 / 1816 |
| links | 0 | 0 | 0 | 0 | 2026-10-21T08:57:29Z | 353 / 353 |
| oembed | 0 | 0 | 0 | 0 | 2026-10-21T09:03:51Z | 2500 / 9738 |
| perf | 0 | 0 | 0 | 0 | 2026-10-20T13:24:29Z | 5 |
| provenance | 209 | 0 | 0 | 209 | 2026-10-21T09:03:51Z | 2342 |
| robots | 0 | 0 | 0 | 0 | 2026-10-21T09:03:51Z | 18 |
| sitemap | 0 | 0 | 0 | 0 | 2026-10-22T04:43:27Z | 120 / 1680 |
| uptime | 0 | 0 | 0 | 0 | 2026-10-22T04:43:28Z | 12 |

## Top problems

- `b525919c7f42` **warn** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://bodhgayatemple.com (2× in a row)
- `c8df15076389` **warn** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/2024/04/2.1-retraites-et-journees-de-pleine-conscience.html (2× in a row)
- `f09bc89183eb` **warn** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://devipuram.org (2× in a row)
- `1e7b60ff77f2` **warn** bundle: site Worker ~2.55 MB gzip = 85% of the limit (estimate from tracked inputs (build output absent)) — worker:site
- `9677df36f4b0` **warn** linkrot: External link failing: HTTP 503 — https://westernchanfellowship.org
- `ce79351ee372` **warn** linkrot: External link failing: HTTP 503 — https://westernchanfellowship.org/contact-us
- `e81e167c1c9a` **warn** linkrot: External link failing: HTTP 503 — https://westernchanfellowship.org/events-and-retreats/

## Uptime by probe (30 d)

| probe | up % | avg ms | last |
|---|---:|---:|---|
| api-health | 100.0 | 167 | up 2026-10-22T04:43:27Z |
| home | 100.0 | 27 | up 2026-10-22T04:43:27Z |
| hub:/person/ajahn-chah | 100.0 | 30 | up 2026-10-22T04:43:27Z |
| hub:/topic/rebirth | 100.0 | 29 | up 2026-10-22T04:43:27Z |
| hub:/tradition/buddhism | 100.0 | 29 | up 2026-10-22T04:43:27Z |
| llms.txt | 100.0 | 23 | up 2026-10-22T04:43:28Z |
| mcp-initialize | 100.0 | 644 | up 2026-10-22T04:43:28Z |
| mcp-tool-call | 100.0 | 55 | up 2026-10-22T04:43:28Z |
| mcp-tools-list | 100.0 | 120 | up 2026-10-22T04:43:28Z |
| openapi.json | 100.0 | 56 | up 2026-10-22T04:43:28Z |
| sitemap | 100.0 | 20 | up 2026-10-22T04:43:28Z |
| well-known-mcp | 100.0 | 21 | up 2026-10-22T04:43:28Z |

## Performance (key pages)

- /: TTFB 154 ms, 0.65 MB (2 assets)
- /topic/rebirth: TTFB 31 ms, 0.65 MB (2 assets)
- /person/ajahn-chah: TTFB 29 ms, 0.65 MB (2 assets)
- /place/amaravati: TTFB 32 ms, 0.65 MB (2 assets)
- /agents: TTFB 30 ms, 0.01 MB (0 assets)

## Worker bundles

- site: 2.55 MB gzip (15.69 MB raw), estimate from tracked inputs (build output absent)
- mcp: 0.93 MB gzip (6.27 MB raw), estimate (data + src + discovery)
