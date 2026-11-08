# Keeper report

Updated 2026-11-08T21:10:29Z for https://tantrafiles.xyz. State branch: `keeper-state`. Agents: see keeper/AGENTS.md.

**Open findings:** 318 (error 85, warn 6, info 227). **Uptime (30 d):** 100%. **Down now:** nothing.
**Dead:** 69 clips (69 videos), 15 external URLs. **Re-verify queue:** 499.

## By check

| check | open | error | warn | info | last run | checked |
|---|---:|---:|---:|---:|---|---:|
| bundle | 0 | 0 | 0 | 0 | 2026-11-08T11:24:41Z | 2 |
| integrity | 6 | 0 | 0 | 6 | 2026-11-08T10:44:46Z | 2849 |
| jsonld | 0 | 0 | 0 | 0 | 2026-11-08T10:44:47Z | 44 |
| leaks | 0 | 0 | 0 | 0 | 2026-11-08T10:44:52Z | 1228 |
| linkrot | 21 | 15 | 6 | 0 | 2026-11-08T10:50:13Z | 700 / 2090 |
| links | 1 | 1 | 0 | 0 | 2026-11-08T11:24:47Z | 465 / 465 |
| oembed | 69 | 69 | 0 | 0 | 2026-11-08T10:56:39Z | 2500 / 9777 |
| perf | 0 | 0 | 0 | 0 | 2026-11-08T11:24:47Z | 5 |
| provenance | 221 | 0 | 0 | 221 | 2026-11-08T10:56:39Z | 2490 |
| robots | 0 | 0 | 0 | 0 | 2026-11-08T10:56:40Z | 18 |
| sitemap | 0 | 0 | 0 | 0 | 2026-11-08T21:10:27Z | 120 / 2264 |
| uptime | 0 | 0 | 0 | 0 | 2026-11-08T21:10:28Z | 12 |

## Top problems

- `c8df15076389` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/2024/04/2.1-retraites-et-journees-de-pleine-conscience.html (20× in a row)
- `935fe75cc296` **error** links: Internal link broken: HTTP 404 — https://tantrafiles.xyz/favicon.svg (18× in a row)
- `0036eb3fe38e` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/ (17× in a row)
- `95eb0ca067c1` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org (17× in a row)
- `a6593c26e706` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org/contact/ (17× in a row)
- `e8f8fee79110` **error** linkrot: External link failing: HTTP 503 — https://publications.efeo.fr/en/livres/840_tantric-studies (17× in a row)
- `63df07ee2310` **error** oembed: YouTube video is private or not embeddable — V-KnyhNmBB8 (15× in a row)
- `658479fff7de` **error** oembed: YouTube video is private or not embeddable — LlPLpEpl-Wc (15× in a row)
- `8dbee8f2fee1` **error** oembed: YouTube video is private or not embeddable — PJUVYlR9V6I (15× in a row)
- `a0512ea78bad` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://www.sudoc.fr/041424565 (15× in a row)
- `d40a378198fc` **error** oembed: YouTube video is private or not embeddable — V7zBzS1vRE4 (15× in a row)
- `df0d2637603b` **error** oembed: YouTube video is private or not embeddable — OI0JS0ojrF8 (15× in a row)
- `165f629b9ea5` **error** oembed: YouTube video is private or not embeddable — kffSFvuQ9Lg (14× in a row)
- `16fdef44f3b8` **error** oembed: YouTube video is private or not embeddable — fEIC_tfDCIM (14× in a row)
- `208405d68232` **error** oembed: YouTube video is private or not embeddable — dy2A8pfI6dg (14× in a row)
- `23d2f206e938` **error** oembed: YouTube video is private or not embeddable — lIgt8-CygDs (14× in a row)
- `3251c58a1b67` **error** oembed: YouTube video is private or not embeddable — boZnvNHqJBE (14× in a row)
- `418ad364f4df` **error** oembed: YouTube video is private or not embeddable — jar-5yKZU9A (14× in a row)
- `51e33a88fb9e` **error** oembed: YouTube video is private or not embeddable — acIxZR6DV6U (14× in a row)
- `55514016e963` **error** oembed: YouTube video is private or not embeddable — iCgRb1rgdzA (14× in a row)
- `5fb0b0c46648` **error** oembed: YouTube video is private or not embeddable — dqs8pGdp8EM (14× in a row)
- `747e7c272b23` **error** oembed: YouTube video is private or not embeddable — dTQh9mqyrTM (14× in a row)
- `7ce34e9a1813` **error** oembed: YouTube video is private or not embeddable — g3C8_cOKxXM (14× in a row)
- `7d243ac50cd3` **error** linkrot: External link failing: ERR_TLS_CERT_ALTNAME_INVALID: fetch failed — https://www.abadiamontserrat.net/ (14× in a row)
- `81da6e476e72` **error** oembed: YouTube video is private or not embeddable — _SNO8mZV8rc (14× in a row)

## Uptime by probe (30 d)

| probe | up % | avg ms | last |
|---|---:|---:|---|
| api-health | 100.0 | 156 | up 2026-11-08T21:10:27Z |
| home | 100.0 | 32 | up 2026-11-08T21:10:27Z |
| hub:/person/ajahn-chah | 100.0 | 27 | up 2026-11-08T21:10:27Z |
| hub:/topic/rebirth | 100.0 | 26 | up 2026-11-08T21:10:27Z |
| hub:/tradition/buddhism | 100.0 | 24 | up 2026-11-08T21:10:27Z |
| llms.txt | 100.0 | 62 | up 2026-11-08T21:10:28Z |
| mcp-initialize | 100.0 | 571 | up 2026-11-08T21:10:28Z |
| mcp-tool-call | 100.0 | 65 | up 2026-11-08T21:10:28Z |
| mcp-tools-list | 100.0 | 54 | up 2026-11-08T21:10:28Z |
| openapi.json | 100.0 | 45 | up 2026-11-08T21:10:28Z |
| sitemap | 100.0 | 36 | up 2026-11-08T21:10:28Z |
| well-known-mcp | 100.0 | 27 | up 2026-11-08T21:10:28Z |

## Performance (key pages)

- /: TTFB 26 ms, 0.76 MB (2 assets)
- /topic/rebirth: TTFB 11 ms, 0.76 MB (2 assets)
- /person/ajahn-chah: TTFB 11 ms, 0.76 MB (2 assets)
- /place/amaravati: TTFB 16 ms, 0.01 MB (0 assets)
- /agents: TTFB 11 ms, 0.01 MB (0 assets)

## Worker bundles

- site: 0.76 MB gzip (3.69 MB raw), estimate from tracked inputs (build output absent; KV-served files excluded)
- mcp: 1.13 MB gzip (7.27 MB raw), estimate (data + src + discovery)
