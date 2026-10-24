# Keeper report

Updated 2026-10-24T23:13:08Z for https://tantrafiles.xyz. State branch: `keeper-state`. Agents: see keeper/AGENTS.md.

**Open findings:** 222 (error 2, warn 5, info 215). **Uptime (30 d):** 100%. **Down now:** nothing.
**Dead:** 0 clips (0 videos), 2 external URLs. **Re-verify queue:** 482.

## By check

| check | open | error | warn | info | last run | checked |
|---|---:|---:|---:|---:|---|---:|
| bundle | 1 | 0 | 1 | 0 | 2026-10-20T13:16:21Z | 2 |
| integrity | 6 | 0 | 0 | 6 | 2026-10-24T08:23:19Z | 2717 |
| jsonld | 0 | 0 | 0 | 0 | 2026-10-24T08:23:20Z | 45 |
| leaks | 0 | 0 | 0 | 0 | 2026-10-24T08:23:25Z | 1057 |
| linkrot | 6 | 2 | 4 | 0 | 2026-10-24T08:28:35Z | 700 / 1817 |
| links | 0 | 0 | 0 | 0 | 2026-10-24T08:28:38Z | 359 / 359 |
| oembed | 0 | 0 | 0 | 0 | 2026-10-24T08:35:01Z | 2500 / 9738 |
| perf | 0 | 0 | 0 | 0 | 2026-10-20T13:24:29Z | 5 |
| provenance | 209 | 0 | 0 | 209 | 2026-10-24T08:35:01Z | 2342 |
| robots | 0 | 0 | 0 | 0 | 2026-10-24T08:35:02Z | 18 |
| sitemap | 0 | 0 | 0 | 0 | 2026-10-24T23:13:08Z | 120 / 2128 |
| uptime | 0 | 0 | 0 | 0 | 2026-10-24T23:13:08Z | 12 |

## Top problems

- `c8df15076389` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/2024/04/2.1-retraites-et-journees-de-pleine-conscience.html (5× in a row)
- `c3f5785b0c32` **error** linkrot: External link failing: HTTP 503 — https://www.koyasan.or.jp/en/ (3× in a row)
- `0036eb3fe38e` **warn** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/ (2× in a row)
- `95eb0ca067c1` **warn** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org (2× in a row)
- `a6593c26e706` **warn** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org/contact/ (2× in a row)
- `e8f8fee79110` **warn** linkrot: External link failing: DEPTH_ZERO_SELF_SIGNED_CERT: fetch failed — https://publications.efeo.fr/en/livres/840_tantric-studies (2× in a row)
- `1e7b60ff77f2` **warn** bundle: site Worker ~2.55 MB gzip = 85% of the limit (estimate from tracked inputs (build output absent)) — worker:site

## Uptime by probe (30 d)

| probe | up % | avg ms | last |
|---|---:|---:|---|
| api-health | 100.0 | 144 | up 2026-10-24T23:13:08Z |
| home | 100.0 | 43 | up 2026-10-24T23:13:08Z |
| hub:/person/ajahn-chah | 100.0 | 24 | up 2026-10-24T23:13:08Z |
| hub:/topic/rebirth | 100.0 | 25 | up 2026-10-24T23:13:08Z |
| hub:/tradition/buddhism | 100.0 | 22 | up 2026-10-24T23:13:08Z |
| llms.txt | 100.0 | 18 | up 2026-10-24T23:13:08Z |
| mcp-initialize | 100.0 | 556 | up 2026-10-24T23:13:08Z |
| mcp-tool-call | 100.0 | 42 | up 2026-10-24T23:13:08Z |
| mcp-tools-list | 100.0 | 65 | up 2026-10-24T23:13:08Z |
| openapi.json | 100.0 | 41 | up 2026-10-24T23:13:08Z |
| sitemap | 100.0 | 18 | up 2026-10-24T23:13:08Z |
| well-known-mcp | 100.0 | 19 | up 2026-10-24T23:13:08Z |

## Performance (key pages)

- /: TTFB 154 ms, 0.65 MB (2 assets)
- /topic/rebirth: TTFB 31 ms, 0.65 MB (2 assets)
- /person/ajahn-chah: TTFB 29 ms, 0.65 MB (2 assets)
- /place/amaravati: TTFB 32 ms, 0.65 MB (2 assets)
- /agents: TTFB 30 ms, 0.01 MB (0 assets)

## Worker bundles

- site: 2.55 MB gzip (15.69 MB raw), estimate from tracked inputs (build output absent)
- mcp: 0.93 MB gzip (6.27 MB raw), estimate (data + src + discovery)
