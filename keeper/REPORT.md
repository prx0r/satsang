# Keeper report

Updated 2026-10-31T02:22:20Z for https://tantrafiles.xyz. State branch: `keeper-state`. Agents: see keeper/AGENTS.md.

**Open findings:** 299 (error 73, warn 13, info 213). **Uptime (30 d):** 100%. **Down now:** nothing.
**Dead:** 58 clips (58 videos), 14 external URLs. **Re-verify queue:** 485.

## By check

| check | open | error | warn | info | last run | checked |
|---|---:|---:|---:|---:|---|---:|
| bundle | 0 | 0 | 0 | 0 | 2026-10-25T09:15:15Z | 2 |
| integrity | 6 | 0 | 0 | 6 | 2026-10-30T10:26:41Z | 2802 |
| jsonld | 0 | 0 | 0 | 0 | 2026-10-30T10:26:42Z | 45 |
| leaks | 0 | 0 | 0 | 0 | 2026-10-30T10:26:46Z | 1177 |
| linkrot | 16 | 14 | 2 | 0 | 2026-10-30T10:30:29Z | 700 / 2051 |
| links | 1 | 1 | 0 | 0 | 2026-10-30T10:30:32Z | 383 / 383 |
| oembed | 69 | 58 | 11 | 0 | 2026-10-30T10:36:54Z | 2500 / 9777 |
| perf | 0 | 0 | 0 | 0 | 2026-10-25T09:15:18Z | 5 |
| provenance | 207 | 0 | 0 | 207 | 2026-10-30T10:36:54Z | 2457 |
| robots | 0 | 0 | 0 | 0 | 2026-10-30T10:36:55Z | 18 |
| sitemap | 0 | 0 | 0 | 0 | 2026-10-31T02:22:18Z | 120 / 2231 |
| uptime | 0 | 0 | 0 | 0 | 2026-10-31T02:22:19Z | 12 |

## Top problems

- `c8df15076389` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/2024/04/2.1-retraites-et-journees-de-pleine-conscience.html (11× in a row)
- `0036eb3fe38e` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/ (8× in a row)
- `95eb0ca067c1` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org (8× in a row)
- `a6593c26e706` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org/contact/ (8× in a row)
- `e8f8fee79110` **error** linkrot: External link failing: HTTP 503 — https://publications.efeo.fr/en/livres/840_tantric-studies (8× in a row)
- `935fe75cc296` **error** links: Internal link broken: HTTP 404 — https://tantrafiles.xyz/favicon.svg (7× in a row)
- `63df07ee2310` **error** oembed: YouTube video is private or not embeddable — V-KnyhNmBB8 (6× in a row)
- `658479fff7de` **error** oembed: YouTube video is private or not embeddable — LlPLpEpl-Wc (6× in a row)
- `8dbee8f2fee1` **error** oembed: YouTube video is private or not embeddable — PJUVYlR9V6I (6× in a row)
- `a0512ea78bad` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://www.sudoc.fr/041424565 (6× in a row)
- `d40a378198fc` **error** oembed: YouTube video is private or not embeddable — V7zBzS1vRE4 (6× in a row)
- `df0d2637603b` **error** oembed: YouTube video is private or not embeddable — OI0JS0ojrF8 (6× in a row)
- `165f629b9ea5` **error** oembed: YouTube video is private or not embeddable — kffSFvuQ9Lg (5× in a row)
- `16fdef44f3b8` **error** oembed: YouTube video is private or not embeddable — fEIC_tfDCIM (5× in a row)
- `208405d68232` **error** oembed: YouTube video is private or not embeddable — dy2A8pfI6dg (5× in a row)
- `23d2f206e938` **error** oembed: YouTube video is private or not embeddable — lIgt8-CygDs (5× in a row)
- `3251c58a1b67` **error** oembed: YouTube video is private or not embeddable — boZnvNHqJBE (5× in a row)
- `418ad364f4df` **error** oembed: YouTube video is private or not embeddable — jar-5yKZU9A (5× in a row)
- `51e33a88fb9e` **error** oembed: YouTube video is private or not embeddable — acIxZR6DV6U (5× in a row)
- `55514016e963` **error** oembed: YouTube video is private or not embeddable — iCgRb1rgdzA (5× in a row)
- `5fb0b0c46648` **error** oembed: YouTube video is private or not embeddable — dqs8pGdp8EM (5× in a row)
- `747e7c272b23` **error** oembed: YouTube video is private or not embeddable — dTQh9mqyrTM (5× in a row)
- `7ce34e9a1813` **error** oembed: YouTube video is private or not embeddable — g3C8_cOKxXM (5× in a row)
- `7d243ac50cd3` **error** linkrot: External link failing: ERR_TLS_CERT_ALTNAME_INVALID: fetch failed — https://www.abadiamontserrat.net/ (5× in a row)
- `81da6e476e72` **error** oembed: YouTube video is private or not embeddable — _SNO8mZV8rc (5× in a row)

## Uptime by probe (30 d)

| probe | up % | avg ms | last |
|---|---:|---:|---|
| api-health | 100.0 | 159 | up 2026-10-31T02:22:19Z |
| home | 100.0 | 39 | up 2026-10-31T02:22:18Z |
| hub:/person/ajahn-chah | 100.0 | 27 | up 2026-10-31T02:22:18Z |
| hub:/topic/rebirth | 100.0 | 28 | up 2026-10-31T02:22:18Z |
| hub:/tradition/buddhism | 100.0 | 26 | up 2026-10-31T02:22:18Z |
| llms.txt | 100.0 | 86 | up 2026-10-31T02:22:19Z |
| mcp-initialize | 100.0 | 615 | up 2026-10-31T02:22:19Z |
| mcp-tool-call | 100.0 | 81 | up 2026-10-31T02:22:19Z |
| mcp-tools-list | 100.0 | 66 | up 2026-10-31T02:22:19Z |
| openapi.json | 100.0 | 53 | up 2026-10-31T02:22:19Z |
| sitemap | 100.0 | 41 | up 2026-10-31T02:22:19Z |
| well-known-mcp | 100.0 | 28 | up 2026-10-31T02:22:19Z |

## Performance (key pages)

- /: TTFB 25 ms, 0.71 MB (2 assets)
- /topic/rebirth: TTFB 16 ms, 0.72 MB (2 assets)
- /person/ajahn-chah: TTFB 11 ms, 0.72 MB (2 assets)
- /place/amaravati: TTFB 16 ms, 0.01 MB (0 assets)
- /agents: TTFB 12 ms, 0.01 MB (0 assets)

## Worker bundles

- site: 0.71 MB gzip (3.46 MB raw), estimate from tracked inputs (build output absent; KV-served files excluded)
- mcp: 1.10 MB gzip (7.15 MB raw), estimate (data + src + discovery)
