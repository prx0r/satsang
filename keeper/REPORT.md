# Keeper report

Updated 2026-11-05T10:54:26Z for https://tantrafiles.xyz. State branch: `keeper-state`. Agents: see keeper/AGENTS.md.

**Open findings:** 316 (error 84, warn 5, info 227). **Uptime (30 d):** 100%. **Down now:** nothing.
**Dead:** 69 clips (69 videos), 14 external URLs. **Re-verify queue:** 499.

## By check

| check | open | error | warn | info | last run | checked |
|---|---:|---:|---:|---:|---|---:|
| bundle | 0 | 0 | 0 | 0 | 2026-11-01T11:23:42Z | 2 |
| integrity | 6 | 0 | 0 | 6 | 2026-11-04T11:32:25Z | 2849 |
| jsonld | 0 | 0 | 0 | 0 | 2026-11-04T11:32:26Z | 45 |
| leaks | 0 | 0 | 0 | 0 | 2026-11-04T11:32:31Z | 1186 |
| linkrot | 19 | 14 | 5 | 0 | 2026-11-04T11:34:11Z | 700 / 2090 |
| links | 1 | 1 | 0 | 0 | 2026-11-04T11:34:15Z | 383 / 383 |
| oembed | 69 | 69 | 0 | 0 | 2026-11-04T11:40:37Z | 2500 / 9777 |
| perf | 0 | 0 | 0 | 0 | 2026-11-01T11:23:47Z | 5 |
| provenance | 221 | 0 | 0 | 221 | 2026-11-04T11:40:37Z | 2490 |
| robots | 0 | 0 | 0 | 0 | 2026-11-04T11:40:38Z | 18 |
| sitemap | 0 | 0 | 0 | 0 | 2026-11-05T10:54:25Z | 120 / 2264 |
| uptime | 0 | 0 | 0 | 0 | 2026-11-05T10:54:25Z | 12 |

## Top problems

- `c8df15076389` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/2024/04/2.1-retraites-et-journees-de-pleine-conscience.html (16× in a row)
- `0036eb3fe38e` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/ (13× in a row)
- `935fe75cc296` **error** links: Internal link broken: HTTP 404 — https://tantrafiles.xyz/favicon.svg (13× in a row)
- `95eb0ca067c1` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org (13× in a row)
- `a6593c26e706` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org/contact/ (13× in a row)
- `e8f8fee79110` **error** linkrot: External link failing: HTTP 503 — https://publications.efeo.fr/en/livres/840_tantric-studies (13× in a row)
- `63df07ee2310` **error** oembed: YouTube video is private or not embeddable — V-KnyhNmBB8 (11× in a row)
- `658479fff7de` **error** oembed: YouTube video is private or not embeddable — LlPLpEpl-Wc (11× in a row)
- `8dbee8f2fee1` **error** oembed: YouTube video is private or not embeddable — PJUVYlR9V6I (11× in a row)
- `a0512ea78bad` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://www.sudoc.fr/041424565 (11× in a row)
- `d40a378198fc` **error** oembed: YouTube video is private or not embeddable — V7zBzS1vRE4 (11× in a row)
- `df0d2637603b` **error** oembed: YouTube video is private or not embeddable — OI0JS0ojrF8 (11× in a row)
- `165f629b9ea5` **error** oembed: YouTube video is private or not embeddable — kffSFvuQ9Lg (10× in a row)
- `16fdef44f3b8` **error** oembed: YouTube video is private or not embeddable — fEIC_tfDCIM (10× in a row)
- `208405d68232` **error** oembed: YouTube video is private or not embeddable — dy2A8pfI6dg (10× in a row)
- `23d2f206e938` **error** oembed: YouTube video is private or not embeddable — lIgt8-CygDs (10× in a row)
- `3251c58a1b67` **error** oembed: YouTube video is private or not embeddable — boZnvNHqJBE (10× in a row)
- `418ad364f4df` **error** oembed: YouTube video is private or not embeddable — jar-5yKZU9A (10× in a row)
- `51e33a88fb9e` **error** oembed: YouTube video is private or not embeddable — acIxZR6DV6U (10× in a row)
- `55514016e963` **error** oembed: YouTube video is private or not embeddable — iCgRb1rgdzA (10× in a row)
- `5fb0b0c46648` **error** oembed: YouTube video is private or not embeddable — dqs8pGdp8EM (10× in a row)
- `747e7c272b23` **error** oembed: YouTube video is private or not embeddable — dTQh9mqyrTM (10× in a row)
- `7ce34e9a1813` **error** oembed: YouTube video is private or not embeddable — g3C8_cOKxXM (10× in a row)
- `7d243ac50cd3` **error** linkrot: External link failing: ERR_TLS_CERT_ALTNAME_INVALID: fetch failed — https://www.abadiamontserrat.net/ (10× in a row)
- `81da6e476e72` **error** oembed: YouTube video is private or not embeddable — _SNO8mZV8rc (10× in a row)

## Uptime by probe (30 d)

| probe | up % | avg ms | last |
|---|---:|---:|---|
| api-health | 100.0 | 155 | up 2026-11-05T10:54:25Z |
| home | 100.0 | 35 | up 2026-11-05T10:54:25Z |
| hub:/person/ajahn-chah | 100.0 | 28 | up 2026-11-05T10:54:25Z |
| hub:/topic/rebirth | 100.0 | 27 | up 2026-11-05T10:54:25Z |
| hub:/tradition/buddhism | 100.0 | 25 | up 2026-11-05T10:54:25Z |
| llms.txt | 100.0 | 70 | up 2026-11-05T10:54:25Z |
| mcp-initialize | 100.0 | 596 | up 2026-11-05T10:54:25Z |
| mcp-tool-call | 100.0 | 70 | up 2026-11-05T10:54:25Z |
| mcp-tools-list | 100.0 | 59 | up 2026-11-05T10:54:25Z |
| openapi.json | 100.0 | 49 | up 2026-11-05T10:54:25Z |
| sitemap | 100.0 | 39 | up 2026-11-05T10:54:25Z |
| well-known-mcp | 100.0 | 28 | up 2026-11-05T10:54:25Z |

## Performance (key pages)

- /: TTFB 42 ms, 0.72 MB (2 assets)
- /topic/rebirth: TTFB 18 ms, 0.72 MB (2 assets)
- /person/ajahn-chah: TTFB 17 ms, 0.72 MB (2 assets)
- /place/amaravati: TTFB 21 ms, 0.01 MB (0 assets)
- /agents: TTFB 17 ms, 0.01 MB (0 assets)

## Worker bundles

- site: 0.73 MB gzip (3.56 MB raw), estimate from tracked inputs (build output absent; KV-served files excluded)
- mcp: 1.13 MB gzip (7.28 MB raw), estimate (data + src + discovery)
