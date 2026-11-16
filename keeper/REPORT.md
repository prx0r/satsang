# Keeper report

Updated 2026-11-16T12:08:40Z for https://tantrafiles.xyz. State branch: `keeper-state`. Agents: see keeper/AGENTS.md.

**Open findings:** 320 (error 85, warn 8, info 227). **Uptime (30 d):** 100%. **Down now:** nothing.
**Dead:** 69 clips (69 videos), 15 external URLs. **Re-verify queue:** 499.

## By check

| check | open | error | warn | info | last run | checked |
|---|---:|---:|---:|---:|---|---:|
| bundle | 0 | 0 | 0 | 0 | 2026-11-15T12:05:35Z | 2 |
| integrity | 6 | 0 | 0 | 6 | 2026-11-16T12:00:30Z | 2849 |
| jsonld | 0 | 0 | 0 | 0 | 2026-11-16T12:00:32Z | 45 |
| leaks | 0 | 0 | 0 | 0 | 2026-11-16T12:00:37Z | 1228 |
| linkrot | 23 | 15 | 8 | 0 | 2026-11-16T12:02:10Z | 700 / 2090 |
| links | 1 | 1 | 0 | 0 | 2026-11-16T12:02:17Z | 494 / 494 |
| oembed | 69 | 69 | 0 | 0 | 2026-11-16T12:08:39Z | 2500 / 9777 |
| perf | 0 | 0 | 0 | 0 | 2026-11-15T12:05:40Z | 5 |
| provenance | 221 | 0 | 0 | 221 | 2026-11-16T12:08:39Z | 2490 |
| robots | 0 | 0 | 0 | 0 | 2026-11-16T12:08:40Z | 18 |
| sitemap | 0 | 0 | 0 | 0 | 2026-11-16T09:41:28Z | 120 / 2264 |
| uptime | 0 | 0 | 0 | 0 | 2026-11-16T09:41:29Z | 12 |

## Top problems

- `c8df15076389` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/2024/04/2.1-retraites-et-journees-de-pleine-conscience.html (28× in a row)
- `935fe75cc296` **error** links: Internal link broken: HTTP 404 — https://tantrafiles.xyz/favicon.svg (27× in a row)
- `0036eb3fe38e` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/ (25× in a row)
- `95eb0ca067c1` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org (25× in a row)
- `a6593c26e706` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org/contact/ (25× in a row)
- `e8f8fee79110` **error** linkrot: External link failing: HTTP 503 — https://publications.efeo.fr/en/livres/840_tantric-studies (25× in a row)
- `63df07ee2310` **error** oembed: YouTube video is private or not embeddable — V-KnyhNmBB8 (23× in a row)
- `658479fff7de` **error** oembed: YouTube video is private or not embeddable — LlPLpEpl-Wc (23× in a row)
- `8dbee8f2fee1` **error** oembed: YouTube video is private or not embeddable — PJUVYlR9V6I (23× in a row)
- `d40a378198fc` **error** oembed: YouTube video is private or not embeddable — V7zBzS1vRE4 (23× in a row)
- `df0d2637603b` **error** oembed: YouTube video is private or not embeddable — OI0JS0ojrF8 (23× in a row)
- `165f629b9ea5` **error** oembed: YouTube video is private or not embeddable — kffSFvuQ9Lg (22× in a row)
- `16fdef44f3b8` **error** oembed: YouTube video is private or not embeddable — fEIC_tfDCIM (22× in a row)
- `208405d68232` **error** oembed: YouTube video is private or not embeddable — dy2A8pfI6dg (22× in a row)
- `23d2f206e938` **error** oembed: YouTube video is private or not embeddable — lIgt8-CygDs (22× in a row)
- `3251c58a1b67` **error** oembed: YouTube video is private or not embeddable — boZnvNHqJBE (22× in a row)
- `418ad364f4df` **error** oembed: YouTube video is private or not embeddable — jar-5yKZU9A (22× in a row)
- `51e33a88fb9e` **error** oembed: YouTube video is private or not embeddable — acIxZR6DV6U (22× in a row)
- `55514016e963` **error** oembed: YouTube video is private or not embeddable — iCgRb1rgdzA (22× in a row)
- `5fb0b0c46648` **error** oembed: YouTube video is private or not embeddable — dqs8pGdp8EM (22× in a row)
- `747e7c272b23` **error** oembed: YouTube video is private or not embeddable — dTQh9mqyrTM (22× in a row)
- `7ce34e9a1813` **error** oembed: YouTube video is private or not embeddable — g3C8_cOKxXM (22× in a row)
- `7d243ac50cd3` **error** linkrot: External link failing: ERR_TLS_CERT_ALTNAME_INVALID: fetch failed — https://www.abadiamontserrat.net/ (22× in a row)
- `81da6e476e72` **error** oembed: YouTube video is private or not embeddable — _SNO8mZV8rc (22× in a row)
- `827c5c3677cc` **error** oembed: YouTube video is private or not embeddable — gb6d26mdAEI (22× in a row)

## Uptime by probe (30 d)

| probe | up % | avg ms | last |
|---|---:|---:|---|
| api-health | 100.0 | 161 | up 2026-11-16T09:41:28Z |
| home | 100.0 | 30 | up 2026-11-16T09:41:28Z |
| hub:/person/ajahn-chah | 100.0 | 25 | up 2026-11-16T09:41:28Z |
| hub:/topic/rebirth | 100.0 | 25 | up 2026-11-16T09:41:28Z |
| hub:/tradition/buddhism | 100.0 | 24 | up 2026-11-16T09:41:28Z |
| llms.txt | 100.0 | 52 | up 2026-11-16T09:41:29Z |
| mcp-initialize | 100.0 | 558 | up 2026-11-16T09:41:29Z |
| mcp-tool-call | 100.0 | 60 | up 2026-11-16T09:41:29Z |
| mcp-tools-list | 100.0 | 50 | up 2026-11-16T09:41:29Z |
| openapi.json | 100.0 | 42 | up 2026-11-16T09:41:29Z |
| sitemap | 100.0 | 33 | up 2026-11-16T09:41:29Z |
| well-known-mcp | 100.0 | 25 | up 2026-11-16T09:41:29Z |

## Performance (key pages)

- /: TTFB 32 ms, 0.76 MB (2 assets)
- /topic/rebirth: TTFB 10 ms, 0.76 MB (2 assets)
- /person/ajahn-chah: TTFB 16 ms, 0.76 MB (2 assets)
- /place/amaravati: TTFB 16 ms, 0.01 MB (0 assets)
- /agents: TTFB 21 ms, 0.01 MB (0 assets)

## Worker bundles

- site: 0.76 MB gzip (3.69 MB raw), estimate from tracked inputs (build output absent; KV-served files excluded)
- mcp: 1.13 MB gzip (7.27 MB raw), estimate (data + src + discovery)
