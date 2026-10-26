# Keeper report

Updated 2026-10-26T19:18:42Z for https://tantrafiles.xyz. State branch: `keeper-state`. Agents: see keeper/AGENTS.md.

**Open findings:** 247 (error 7, warn 27, info 213). **Uptime (30 d):** 100%. **Down now:** nothing.
**Dead:** 0 clips (0 videos), 6 external URLs. **Re-verify queue:** 485.

## By check

| check | open | error | warn | info | last run | checked |
|---|---:|---:|---:|---:|---|---:|
| bundle | 0 | 0 | 0 | 0 | 2026-10-25T09:15:15Z | 2 |
| integrity | 6 | 0 | 0 | 6 | 2026-10-26T09:20:43Z | 2802 |
| jsonld | 0 | 0 | 0 | 0 | 2026-10-26T09:20:44Z | 45 |
| leaks | 0 | 0 | 0 | 0 | 2026-10-26T09:20:49Z | 1176 |
| linkrot | 10 | 6 | 4 | 0 | 2026-10-26T09:23:31Z | 700 / 2051 |
| links | 1 | 1 | 0 | 0 | 2026-10-26T09:23:34Z | 383 / 383 |
| oembed | 23 | 0 | 23 | 0 | 2026-10-26T09:29:57Z | 2500 / 9777 |
| perf | 0 | 0 | 0 | 0 | 2026-10-25T09:15:18Z | 5 |
| provenance | 207 | 0 | 0 | 207 | 2026-10-26T09:29:57Z | 2457 |
| robots | 0 | 0 | 0 | 0 | 2026-10-26T09:29:57Z | 18 |
| sitemap | 0 | 0 | 0 | 0 | 2026-10-26T19:18:41Z | 120 / 2231 |
| uptime | 0 | 0 | 0 | 0 | 2026-10-26T19:18:42Z | 12 |

## Top problems

- `c8df15076389` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/2024/04/2.1-retraites-et-journees-de-pleine-conscience.html (7× in a row)
- `c3f5785b0c32` **error** linkrot: External link failing: HTTP 503 — https://www.koyasan.or.jp/en/ (5× in a row)
- `0036eb3fe38e` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/ (4× in a row)
- `95eb0ca067c1` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org (4× in a row)
- `a6593c26e706` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org/contact/ (4× in a row)
- `e8f8fee79110` **error** linkrot: External link failing: DEPTH_ZERO_SELF_SIGNED_CERT: fetch failed — https://publications.efeo.fr/en/livres/840_tantric-studies (4× in a row)
- `935fe75cc296` **error** links: Internal link broken: HTTP 404 — https://tantrafiles.xyz/favicon.svg (3× in a row)
- `63df07ee2310` **warn** oembed: YouTube video is private or not embeddable — V-KnyhNmBB8 (2× in a row)
- `658479fff7de` **warn** oembed: YouTube video is private or not embeddable — LlPLpEpl-Wc (2× in a row)
- `8dbee8f2fee1` **warn** oembed: YouTube video is private or not embeddable — PJUVYlR9V6I (2× in a row)
- `a0512ea78bad` **warn** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://www.sudoc.fr/041424565 (2× in a row)
- `d40a378198fc` **warn** oembed: YouTube video is private or not embeddable — V7zBzS1vRE4 (2× in a row)
- `df0d2637603b` **warn** oembed: YouTube video is private or not embeddable — OI0JS0ojrF8 (2× in a row)
- `165f629b9ea5` **warn** oembed: YouTube video is private or not embeddable — kffSFvuQ9Lg
- `16fdef44f3b8` **warn** oembed: YouTube video is private or not embeddable — fEIC_tfDCIM
- `208405d68232` **warn** oembed: YouTube video is private or not embeddable — dy2A8pfI6dg
- `23d2f206e938` **warn** oembed: YouTube video is private or not embeddable — lIgt8-CygDs
- `2c467457d20a` **warn** linkrot: External link failing: DEPTH_ZERO_SELF_SIGNED_CERT: fetch failed — https://www.chalicewell.org.uk
- `3251c58a1b67` **warn** oembed: YouTube video is private or not embeddable — boZnvNHqJBE
- `418ad364f4df` **warn** oembed: YouTube video is private or not embeddable — jar-5yKZU9A
- `51e33a88fb9e` **warn** oembed: YouTube video is private or not embeddable — acIxZR6DV6U
- `55514016e963` **warn** oembed: YouTube video is private or not embeddable — iCgRb1rgdzA
- `5fb0b0c46648` **warn** oembed: YouTube video is private or not embeddable — dqs8pGdp8EM
- `6f07d5f70cdc` **warn** linkrot: External link failing: HTTP 504 — https://www.deerpark.in/contact-us/
- `747e7c272b23` **warn** oembed: YouTube video is private or not embeddable — dTQh9mqyrTM

## Uptime by probe (30 d)

| probe | up % | avg ms | last |
|---|---:|---:|---|
| api-health | 100.0 | 144 | up 2026-10-26T19:18:41Z |
| home | 100.0 | 37 | up 2026-10-26T19:18:41Z |
| hub:/person/ajahn-chah | 100.0 | 22 | up 2026-10-26T19:18:41Z |
| hub:/topic/rebirth | 100.0 | 23 | up 2026-10-26T19:18:41Z |
| hub:/tradition/buddhism | 100.0 | 22 | up 2026-10-26T19:18:41Z |
| llms.txt | 100.0 | 18 | up 2026-10-26T19:18:42Z |
| mcp-initialize | 100.0 | 567 | up 2026-10-26T19:18:41Z |
| mcp-tool-call | 100.0 | 43 | up 2026-10-26T19:18:42Z |
| mcp-tools-list | 100.0 | 60 | up 2026-10-26T19:18:42Z |
| openapi.json | 100.0 | 38 | up 2026-10-26T19:18:42Z |
| sitemap | 100.0 | 18 | up 2026-10-26T19:18:42Z |
| well-known-mcp | 100.0 | 19 | up 2026-10-26T19:18:42Z |

## Performance (key pages)

- /: TTFB 25 ms, 0.71 MB (2 assets)
- /topic/rebirth: TTFB 16 ms, 0.72 MB (2 assets)
- /person/ajahn-chah: TTFB 11 ms, 0.72 MB (2 assets)
- /place/amaravati: TTFB 16 ms, 0.01 MB (0 assets)
- /agents: TTFB 12 ms, 0.01 MB (0 assets)

## Worker bundles

- site: 0.71 MB gzip (3.46 MB raw), estimate from tracked inputs (build output absent; KV-served files excluded)
- mcp: 1.10 MB gzip (7.15 MB raw), estimate (data + src + discovery)
