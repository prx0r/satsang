# Keeper report

Updated 2026-10-28T21:03:41Z for https://tantrafiles.xyz. State branch: `keeper-state`. Agents: see keeper/AGENTS.md.

**Open findings:** 289 (error 31, warn 45, info 213). **Uptime (30 d):** 100%. **Down now:** nothing.
**Dead:** 23 clips (23 videos), 7 external URLs. **Re-verify queue:** 485.

## By check

| check | open | error | warn | info | last run | checked |
|---|---:|---:|---:|---:|---|---:|
| bundle | 0 | 0 | 0 | 0 | 2026-10-25T09:15:15Z | 2 |
| integrity | 6 | 0 | 0 | 6 | 2026-10-28T10:00:00Z | 2802 |
| jsonld | 0 | 0 | 0 | 0 | 2026-10-28T10:00:01Z | 45 |
| leaks | 0 | 0 | 0 | 0 | 2026-10-28T10:00:07Z | 1177 |
| linkrot | 17 | 7 | 10 | 0 | 2026-10-28T10:01:54Z | 700 / 2051 |
| links | 1 | 1 | 0 | 0 | 2026-10-28T10:01:57Z | 383 / 383 |
| oembed | 58 | 23 | 35 | 0 | 2026-10-28T10:08:20Z | 2500 / 9777 |
| perf | 0 | 0 | 0 | 0 | 2026-10-25T09:15:18Z | 5 |
| provenance | 207 | 0 | 0 | 207 | 2026-10-28T10:08:20Z | 2457 |
| robots | 0 | 0 | 0 | 0 | 2026-10-28T10:08:20Z | 18 |
| sitemap | 0 | 0 | 0 | 0 | 2026-10-28T21:03:38Z | 120 / 2231 |
| uptime | 0 | 0 | 0 | 0 | 2026-10-28T21:03:40Z | 12 |

## Top problems

- `c8df15076389` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/2024/04/2.1-retraites-et-journees-de-pleine-conscience.html (9× in a row)
- `0036eb3fe38e` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/ (6× in a row)
- `95eb0ca067c1` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org (6× in a row)
- `a6593c26e706` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org/contact/ (6× in a row)
- `e8f8fee79110` **error** linkrot: External link failing: DEPTH_ZERO_SELF_SIGNED_CERT: fetch failed — https://publications.efeo.fr/en/livres/840_tantric-studies (6× in a row)
- `935fe75cc296` **error** links: Internal link broken: HTTP 404 — https://tantrafiles.xyz/favicon.svg (5× in a row)
- `63df07ee2310` **error** oembed: YouTube video is private or not embeddable — V-KnyhNmBB8 (4× in a row)
- `658479fff7de` **error** oembed: YouTube video is private or not embeddable — LlPLpEpl-Wc (4× in a row)
- `8dbee8f2fee1` **error** oembed: YouTube video is private or not embeddable — PJUVYlR9V6I (4× in a row)
- `a0512ea78bad` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://www.sudoc.fr/041424565 (4× in a row)
- `d40a378198fc` **error** oembed: YouTube video is private or not embeddable — V7zBzS1vRE4 (4× in a row)
- `df0d2637603b` **error** oembed: YouTube video is private or not embeddable — OI0JS0ojrF8 (4× in a row)
- `165f629b9ea5` **error** oembed: YouTube video is private or not embeddable — kffSFvuQ9Lg (3× in a row)
- `16fdef44f3b8` **error** oembed: YouTube video is private or not embeddable — fEIC_tfDCIM (3× in a row)
- `208405d68232` **error** oembed: YouTube video is private or not embeddable — dy2A8pfI6dg (3× in a row)
- `23d2f206e938` **error** oembed: YouTube video is private or not embeddable — lIgt8-CygDs (3× in a row)
- `3251c58a1b67` **error** oembed: YouTube video is private or not embeddable — boZnvNHqJBE (3× in a row)
- `418ad364f4df` **error** oembed: YouTube video is private or not embeddable — jar-5yKZU9A (3× in a row)
- `51e33a88fb9e` **error** oembed: YouTube video is private or not embeddable — acIxZR6DV6U (3× in a row)
- `55514016e963` **error** oembed: YouTube video is private or not embeddable — iCgRb1rgdzA (3× in a row)
- `5fb0b0c46648` **error** oembed: YouTube video is private or not embeddable — dqs8pGdp8EM (3× in a row)
- `747e7c272b23` **error** oembed: YouTube video is private or not embeddable — dTQh9mqyrTM (3× in a row)
- `7ce34e9a1813` **error** oembed: YouTube video is private or not embeddable — g3C8_cOKxXM (3× in a row)
- `7d243ac50cd3` **error** linkrot: External link failing: ERR_TLS_CERT_ALTNAME_INVALID: fetch failed — https://www.abadiamontserrat.net/ (3× in a row)
- `81da6e476e72` **error** oembed: YouTube video is private or not embeddable — _SNO8mZV8rc (3× in a row)

## Uptime by probe (30 d)

| probe | up % | avg ms | last |
|---|---:|---:|---|
| api-health | 100.0 | 155 | up 2026-10-28T21:03:38Z |
| home | 100.0 | 39 | up 2026-10-28T21:03:38Z |
| hub:/person/ajahn-chah | 100.0 | 26 | up 2026-10-28T21:03:38Z |
| hub:/topic/rebirth | 100.0 | 27 | up 2026-10-28T21:03:38Z |
| hub:/tradition/buddhism | 100.0 | 26 | up 2026-10-28T21:03:38Z |
| llms.txt | 100.0 | 98 | up 2026-10-28T21:03:40Z |
| mcp-initialize | 100.0 | 621 | up 2026-10-28T21:03:39Z |
| mcp-tool-call | 100.0 | 88 | up 2026-10-28T21:03:40Z |
| mcp-tools-list | 100.0 | 70 | up 2026-10-28T21:03:39Z |
| openapi.json | 100.0 | 54 | up 2026-10-28T21:03:40Z |
| sitemap | 100.0 | 42 | up 2026-10-28T21:03:40Z |
| well-known-mcp | 100.0 | 28 | up 2026-10-28T21:03:40Z |

## Performance (key pages)

- /: TTFB 25 ms, 0.71 MB (2 assets)
- /topic/rebirth: TTFB 16 ms, 0.72 MB (2 assets)
- /person/ajahn-chah: TTFB 11 ms, 0.72 MB (2 assets)
- /place/amaravati: TTFB 16 ms, 0.01 MB (0 assets)
- /agents: TTFB 12 ms, 0.01 MB (0 assets)

## Worker bundles

- site: 0.71 MB gzip (3.46 MB raw), estimate from tracked inputs (build output absent; KV-served files excluded)
- mcp: 1.10 MB gzip (7.15 MB raw), estimate (data + src + discovery)
