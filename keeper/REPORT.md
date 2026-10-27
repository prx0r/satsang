# Keeper report

Updated 2026-10-27T10:33:24Z for https://tantrafiles.xyz. State branch: `keeper-state`. Agents: see keeper/AGENTS.md.

**Open findings:** 266 (error 13, warn 40, info 213). **Uptime (30 d):** 100%. **Down now:** nothing.
**Dead:** 5 clips (5 videos), 7 external URLs. **Re-verify queue:** 485.

## By check

| check | open | error | warn | info | last run | checked |
|---|---:|---:|---:|---:|---|---:|
| bundle | 0 | 0 | 0 | 0 | 2026-10-25T09:15:15Z | 2 |
| integrity | 6 | 0 | 0 | 6 | 2026-10-27T09:19:59Z | 2802 |
| jsonld | 0 | 0 | 0 | 0 | 2026-10-27T09:20:00Z | 45 |
| leaks | 0 | 0 | 0 | 0 | 2026-10-27T09:20:04Z | 1177 |
| linkrot | 12 | 7 | 5 | 0 | 2026-10-27T09:23:34Z | 700 / 2051 |
| links | 1 | 1 | 0 | 0 | 2026-10-27T09:23:36Z | 383 / 383 |
| oembed | 40 | 5 | 35 | 0 | 2026-10-27T09:29:58Z | 2500 / 9777 |
| perf | 0 | 0 | 0 | 0 | 2026-10-25T09:15:18Z | 5 |
| provenance | 207 | 0 | 0 | 207 | 2026-10-27T09:29:58Z | 2457 |
| robots | 0 | 0 | 0 | 0 | 2026-10-27T09:29:58Z | 18 |
| sitemap | 0 | 0 | 0 | 0 | 2026-10-27T10:33:23Z | 120 / 2231 |
| uptime | 0 | 0 | 0 | 0 | 2026-10-27T10:33:24Z | 12 |

## Top problems

- `c8df15076389` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/2024/04/2.1-retraites-et-journees-de-pleine-conscience.html (8× in a row)
- `c3f5785b0c32` **error** linkrot: External link failing: HTTP 503 — https://www.koyasan.or.jp/en/ (6× in a row)
- `0036eb3fe38e` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/ (5× in a row)
- `95eb0ca067c1` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org (5× in a row)
- `a6593c26e706` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org/contact/ (5× in a row)
- `e8f8fee79110` **error** linkrot: External link failing: DEPTH_ZERO_SELF_SIGNED_CERT: fetch failed — https://publications.efeo.fr/en/livres/840_tantric-studies (5× in a row)
- `935fe75cc296` **error** links: Internal link broken: HTTP 404 — https://tantrafiles.xyz/favicon.svg (4× in a row)
- `63df07ee2310` **error** oembed: YouTube video is private or not embeddable — V-KnyhNmBB8 (3× in a row)
- `658479fff7de` **error** oembed: YouTube video is private or not embeddable — LlPLpEpl-Wc (3× in a row)
- `8dbee8f2fee1` **error** oembed: YouTube video is private or not embeddable — PJUVYlR9V6I (3× in a row)
- `a0512ea78bad` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://www.sudoc.fr/041424565 (3× in a row)
- `d40a378198fc` **error** oembed: YouTube video is private or not embeddable — V7zBzS1vRE4 (3× in a row)
- `df0d2637603b` **error** oembed: YouTube video is private or not embeddable — OI0JS0ojrF8 (3× in a row)
- `165f629b9ea5` **warn** oembed: YouTube video is private or not embeddable — kffSFvuQ9Lg (2× in a row)
- `16fdef44f3b8` **warn** oembed: YouTube video is private or not embeddable — fEIC_tfDCIM (2× in a row)
- `208405d68232` **warn** oembed: YouTube video is private or not embeddable — dy2A8pfI6dg (2× in a row)
- `23d2f206e938` **warn** oembed: YouTube video is private or not embeddable — lIgt8-CygDs (2× in a row)
- `3251c58a1b67` **warn** oembed: YouTube video is private or not embeddable — boZnvNHqJBE (2× in a row)
- `418ad364f4df` **warn** oembed: YouTube video is private or not embeddable — jar-5yKZU9A (2× in a row)
- `51e33a88fb9e` **warn** oembed: YouTube video is private or not embeddable — acIxZR6DV6U (2× in a row)
- `55514016e963` **warn** oembed: YouTube video is private or not embeddable — iCgRb1rgdzA (2× in a row)
- `5fb0b0c46648` **warn** oembed: YouTube video is private or not embeddable — dqs8pGdp8EM (2× in a row)
- `747e7c272b23` **warn** oembed: YouTube video is private or not embeddable — dTQh9mqyrTM (2× in a row)
- `7ce34e9a1813` **warn** oembed: YouTube video is private or not embeddable — g3C8_cOKxXM (2× in a row)
- `7d243ac50cd3` **warn** linkrot: External link failing: ERR_TLS_CERT_ALTNAME_INVALID: fetch failed — https://www.abadiamontserrat.net/ (2× in a row)

## Uptime by probe (30 d)

| probe | up % | avg ms | last |
|---|---:|---:|---|
| api-health | 100.0 | 143 | up 2026-10-27T10:33:23Z |
| home | 100.0 | 37 | up 2026-10-27T10:33:23Z |
| hub:/person/ajahn-chah | 100.0 | 22 | up 2026-10-27T10:33:23Z |
| hub:/topic/rebirth | 100.0 | 23 | up 2026-10-27T10:33:23Z |
| hub:/tradition/buddhism | 100.0 | 22 | up 2026-10-27T10:33:23Z |
| llms.txt | 100.0 | 19 | up 2026-10-27T10:33:24Z |
| mcp-initialize | 100.0 | 574 | up 2026-10-27T10:33:23Z |
| mcp-tool-call | 100.0 | 43 | up 2026-10-27T10:33:24Z |
| mcp-tools-list | 100.0 | 59 | up 2026-10-27T10:33:23Z |
| openapi.json | 100.0 | 40 | up 2026-10-27T10:33:24Z |
| sitemap | 100.0 | 19 | up 2026-10-27T10:33:24Z |
| well-known-mcp | 100.0 | 19 | up 2026-10-27T10:33:24Z |

## Performance (key pages)

- /: TTFB 25 ms, 0.71 MB (2 assets)
- /topic/rebirth: TTFB 16 ms, 0.72 MB (2 assets)
- /person/ajahn-chah: TTFB 11 ms, 0.72 MB (2 assets)
- /place/amaravati: TTFB 16 ms, 0.01 MB (0 assets)
- /agents: TTFB 12 ms, 0.01 MB (0 assets)

## Worker bundles

- site: 0.71 MB gzip (3.46 MB raw), estimate from tracked inputs (build output absent; KV-served files excluded)
- mcp: 1.10 MB gzip (7.15 MB raw), estimate (data + src + discovery)
