# Keeper report

Updated 2026-11-23T13:49:07Z for https://tantrafiles.xyz. State branch: `keeper-state`. Agents: see keeper/AGENTS.md.

**Open findings:** 380 (error 148, warn 5, info 227). **Uptime (30 d):** 100%. **Down now:** nothing.
**Dead:** 114 clips (114 videos), 33 external URLs. **Re-verify queue:** 499.

## By check

| check | open | error | warn | info | last run | checked |
|---|---:|---:|---:|---:|---|---:|
| bundle | 0 | 0 | 0 | 0 | 2026-11-22T12:43:35Z | 2 |
| integrity | 6 | 0 | 0 | 6 | 2026-11-23T13:37:16Z | 2849 |
| jsonld | 0 | 0 | 0 | 0 | 2026-11-23T13:37:19Z | 45 |
| leaks | 0 | 0 | 0 | 0 | 2026-11-23T13:37:24Z | 1228 |
| linkrot | 37 | 33 | 4 | 0 | 2026-11-23T13:42:35Z | 700 / 2090 |
| links | 1 | 1 | 0 | 0 | 2026-11-23T13:42:44Z | 487 / 487 |
| oembed | 115 | 114 | 1 | 0 | 2026-11-23T13:49:06Z | 2500 / 9777 |
| perf | 0 | 0 | 0 | 0 | 2026-11-22T12:43:42Z | 5 |
| provenance | 221 | 0 | 0 | 221 | 2026-11-23T13:49:06Z | 2490 |
| robots | 0 | 0 | 0 | 0 | 2026-11-23T13:49:07Z | 18 |
| sitemap | 0 | 0 | 0 | 0 | 2026-11-23T09:03:12Z | 120 / 2264 |
| uptime | 0 | 0 | 0 | 0 | 2026-11-23T09:03:13Z | 12 |

## Top problems

- `935fe75cc296` **error** links: Internal link broken: HTTP 404 — https://tantrafiles.xyz/favicon.svg (35× in a row)
- `c8df15076389` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/2024/04/2.1-retraites-et-journees-de-pleine-conscience.html (35× in a row)
- `0036eb3fe38e` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/ (32× in a row)
- `95eb0ca067c1` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org (32× in a row)
- `a6593c26e706` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org/contact/ (32× in a row)
- `e8f8fee79110` **error** linkrot: External link failing: HTTP 503 — https://publications.efeo.fr/en/livres/840_tantric-studies (32× in a row)
- `63df07ee2310` **error** oembed: YouTube video is private or not embeddable — V-KnyhNmBB8 (30× in a row)
- `658479fff7de` **error** oembed: YouTube video is private or not embeddable — LlPLpEpl-Wc (30× in a row)
- `8dbee8f2fee1` **error** oembed: YouTube video is private or not embeddable — PJUVYlR9V6I (30× in a row)
- `d40a378198fc` **error** oembed: YouTube video is private or not embeddable — V7zBzS1vRE4 (30× in a row)
- `df0d2637603b` **error** oembed: YouTube video is private or not embeddable — OI0JS0ojrF8 (30× in a row)
- `165f629b9ea5` **error** oembed: YouTube video is private or not embeddable — kffSFvuQ9Lg (29× in a row)
- `16fdef44f3b8` **error** oembed: YouTube video is private or not embeddable — fEIC_tfDCIM (29× in a row)
- `208405d68232` **error** oembed: YouTube video is private or not embeddable — dy2A8pfI6dg (29× in a row)
- `23d2f206e938` **error** oembed: YouTube video is private or not embeddable — lIgt8-CygDs (29× in a row)
- `3251c58a1b67` **error** oembed: YouTube video is private or not embeddable — boZnvNHqJBE (29× in a row)
- `418ad364f4df` **error** oembed: YouTube video is private or not embeddable — jar-5yKZU9A (29× in a row)
- `51e33a88fb9e` **error** oembed: YouTube video is private or not embeddable — acIxZR6DV6U (29× in a row)
- `55514016e963` **error** oembed: YouTube video is private or not embeddable — iCgRb1rgdzA (29× in a row)
- `5fb0b0c46648` **error** oembed: YouTube video is private or not embeddable — dqs8pGdp8EM (29× in a row)
- `747e7c272b23` **error** oembed: YouTube video is private or not embeddable — dTQh9mqyrTM (29× in a row)
- `7ce34e9a1813` **error** oembed: YouTube video is private or not embeddable — g3C8_cOKxXM (29× in a row)
- `7d243ac50cd3` **error** linkrot: External link failing: ERR_TLS_CERT_ALTNAME_INVALID: fetch failed — https://www.abadiamontserrat.net/ (29× in a row)
- `81da6e476e72` **error** oembed: YouTube video is private or not embeddable — _SNO8mZV8rc (29× in a row)
- `827c5c3677cc` **error** oembed: YouTube video is private or not embeddable — gb6d26mdAEI (29× in a row)

## Uptime by probe (30 d)

| probe | up % | avg ms | last |
|---|---:|---:|---|
| api-health | 100.0 | 162 | up 2026-11-23T09:03:12Z |
| home | 100.0 | 27 | up 2026-11-23T09:03:12Z |
| hub:/person/ajahn-chah | 100.0 | 24 | up 2026-11-23T09:03:12Z |
| hub:/topic/rebirth | 100.0 | 24 | up 2026-11-23T09:03:12Z |
| hub:/tradition/buddhism | 100.0 | 24 | up 2026-11-23T09:03:12Z |
| llms.txt | 100.0 | 52 | up 2026-11-23T09:03:13Z |
| mcp-initialize | 100.0 | 548 | up 2026-11-23T09:03:13Z |
| mcp-tool-call | 100.0 | 60 | up 2026-11-23T09:03:13Z |
| mcp-tools-list | 100.0 | 44 | up 2026-11-23T09:03:13Z |
| openapi.json | 100.0 | 41 | up 2026-11-23T09:03:13Z |
| sitemap | 100.0 | 33 | up 2026-11-23T09:03:13Z |
| well-known-mcp | 100.0 | 26 | up 2026-11-23T09:03:13Z |

## Performance (key pages)

- /: TTFB 28 ms, 0.76 MB (2 assets)
- /topic/rebirth: TTFB 14 ms, 0.76 MB (2 assets)
- /person/ajahn-chah: TTFB 14 ms, 0.76 MB (2 assets)
- /place/amaravati: TTFB 16 ms, 0.01 MB (0 assets)
- /agents: TTFB 12 ms, 0.01 MB (0 assets)

## Worker bundles

- site: 0.76 MB gzip (3.69 MB raw), estimate from tracked inputs (build output absent; KV-served files excluded)
- mcp: 1.13 MB gzip (7.27 MB raw), estimate (data + src + discovery)
