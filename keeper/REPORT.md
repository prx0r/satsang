# Keeper report

Updated 2026-11-02T11:03:56Z for https://tantrafiles.xyz. State branch: `keeper-state`. Agents: see keeper/AGENTS.md.

**Open findings:** 312 (error 84, warn 1, info 227). **Uptime (30 d):** 100%. **Down now:** nothing.
**Dead:** 69 clips (69 videos), 14 external URLs. **Re-verify queue:** 499.

## By check

| check | open | error | warn | info | last run | checked |
|---|---:|---:|---:|---:|---|---:|
| bundle | 0 | 0 | 0 | 0 | 2026-11-01T11:23:42Z | 2 |
| integrity | 6 | 0 | 0 | 6 | 2026-11-01T10:47:08Z | 2849 |
| jsonld | 0 | 0 | 0 | 0 | 2026-11-01T10:47:09Z | 45 |
| leaks | 0 | 0 | 0 | 0 | 2026-11-01T10:47:14Z | 1186 |
| linkrot | 15 | 14 | 1 | 0 | 2026-11-01T10:49:22Z | 700 / 2090 |
| links | 1 | 1 | 0 | 0 | 2026-11-01T11:23:46Z | 383 / 383 |
| oembed | 69 | 69 | 0 | 0 | 2026-11-01T10:55:47Z | 2500 / 9777 |
| perf | 0 | 0 | 0 | 0 | 2026-11-01T11:23:47Z | 5 |
| provenance | 221 | 0 | 0 | 221 | 2026-11-01T10:55:47Z | 2490 |
| robots | 0 | 0 | 0 | 0 | 2026-11-01T10:55:47Z | 18 |
| sitemap | 0 | 0 | 0 | 0 | 2026-11-02T11:03:55Z | 120 / 2264 |
| uptime | 0 | 0 | 0 | 0 | 2026-11-02T11:03:56Z | 12 |

## Top problems

- `c8df15076389` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/2024/04/2.1-retraites-et-journees-de-pleine-conscience.html (13× in a row)
- `0036eb3fe38e` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/ (10× in a row)
- `935fe75cc296` **error** links: Internal link broken: HTTP 404 — https://tantrafiles.xyz/favicon.svg (10× in a row)
- `95eb0ca067c1` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org (10× in a row)
- `a6593c26e706` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org/contact/ (10× in a row)
- `e8f8fee79110` **error** linkrot: External link failing: HTTP 503 — https://publications.efeo.fr/en/livres/840_tantric-studies (10× in a row)
- `63df07ee2310` **error** oembed: YouTube video is private or not embeddable — V-KnyhNmBB8 (8× in a row)
- `658479fff7de` **error** oembed: YouTube video is private or not embeddable — LlPLpEpl-Wc (8× in a row)
- `8dbee8f2fee1` **error** oembed: YouTube video is private or not embeddable — PJUVYlR9V6I (8× in a row)
- `a0512ea78bad` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://www.sudoc.fr/041424565 (8× in a row)
- `d40a378198fc` **error** oembed: YouTube video is private or not embeddable — V7zBzS1vRE4 (8× in a row)
- `df0d2637603b` **error** oembed: YouTube video is private or not embeddable — OI0JS0ojrF8 (8× in a row)
- `165f629b9ea5` **error** oembed: YouTube video is private or not embeddable — kffSFvuQ9Lg (7× in a row)
- `16fdef44f3b8` **error** oembed: YouTube video is private or not embeddable — fEIC_tfDCIM (7× in a row)
- `208405d68232` **error** oembed: YouTube video is private or not embeddable — dy2A8pfI6dg (7× in a row)
- `23d2f206e938` **error** oembed: YouTube video is private or not embeddable — lIgt8-CygDs (7× in a row)
- `3251c58a1b67` **error** oembed: YouTube video is private or not embeddable — boZnvNHqJBE (7× in a row)
- `418ad364f4df` **error** oembed: YouTube video is private or not embeddable — jar-5yKZU9A (7× in a row)
- `51e33a88fb9e` **error** oembed: YouTube video is private or not embeddable — acIxZR6DV6U (7× in a row)
- `55514016e963` **error** oembed: YouTube video is private or not embeddable — iCgRb1rgdzA (7× in a row)
- `5fb0b0c46648` **error** oembed: YouTube video is private or not embeddable — dqs8pGdp8EM (7× in a row)
- `747e7c272b23` **error** oembed: YouTube video is private or not embeddable — dTQh9mqyrTM (7× in a row)
- `7ce34e9a1813` **error** oembed: YouTube video is private or not embeddable — g3C8_cOKxXM (7× in a row)
- `7d243ac50cd3` **error** linkrot: External link failing: ERR_TLS_CERT_ALTNAME_INVALID: fetch failed — https://www.abadiamontserrat.net/ (7× in a row)
- `81da6e476e72` **error** oembed: YouTube video is private or not embeddable — _SNO8mZV8rc (7× in a row)

## Uptime by probe (30 d)

| probe | up % | avg ms | last |
|---|---:|---:|---|
| api-health | 100.0 | 153 | up 2026-11-02T11:03:55Z |
| home | 100.0 | 35 | up 2026-11-02T11:03:55Z |
| hub:/person/ajahn-chah | 100.0 | 26 | up 2026-11-02T11:03:55Z |
| hub:/topic/rebirth | 100.0 | 26 | up 2026-11-02T11:03:55Z |
| hub:/tradition/buddhism | 100.0 | 24 | up 2026-11-02T11:03:55Z |
| llms.txt | 100.0 | 74 | up 2026-11-02T11:03:56Z |
| mcp-initialize | 100.0 | 589 | up 2026-11-02T11:03:56Z |
| mcp-tool-call | 100.0 | 73 | up 2026-11-02T11:03:56Z |
| mcp-tools-list | 100.0 | 59 | up 2026-11-02T11:03:56Z |
| openapi.json | 100.0 | 50 | up 2026-11-02T11:03:56Z |
| sitemap | 100.0 | 37 | up 2026-11-02T11:03:56Z |
| well-known-mcp | 100.0 | 26 | up 2026-11-02T11:03:56Z |

## Performance (key pages)

- /: TTFB 42 ms, 0.72 MB (2 assets)
- /topic/rebirth: TTFB 18 ms, 0.72 MB (2 assets)
- /person/ajahn-chah: TTFB 17 ms, 0.72 MB (2 assets)
- /place/amaravati: TTFB 21 ms, 0.01 MB (0 assets)
- /agents: TTFB 17 ms, 0.01 MB (0 assets)

## Worker bundles

- site: 0.73 MB gzip (3.56 MB raw), estimate from tracked inputs (build output absent; KV-served files excluded)
- mcp: 1.13 MB gzip (7.28 MB raw), estimate (data + src + discovery)
