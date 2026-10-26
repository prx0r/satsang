# Keeper report

Updated 2026-10-26T09:29:57Z for https://tantrafiles.xyz. State branch: `keeper-state`. Agents: see keeper/AGENTS.md.

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
| sitemap | 0 | 0 | 0 | 0 | 2026-10-26T06:12:16Z | 120 / 2231 |
| uptime | 0 | 0 | 0 | 0 | 2026-10-26T06:12:16Z | 12 |

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
- `7d243ac50cd3` **warn** linkrot: External link failing: ERR_TLS_CERT_ALTNAME_INVALID: fetch failed — https://www.abadiamontserrat.net/
- `2c467457d20a` **warn** linkrot: External link failing: DEPTH_ZERO_SELF_SIGNED_CERT: fetch failed — https://www.chalicewell.org.uk
- `6f07d5f70cdc` **warn** linkrot: External link failing: HTTP 504 — https://www.deerpark.in/contact-us/
- `c609c7457c7b` **warn** oembed: YouTube video is private or not embeddable — YJCQDGDwrT8
- `f1a47006eeb1` **warn** oembed: YouTube video is private or not embeddable — YN3KzoTKT6A
- `81da6e476e72` **warn** oembed: YouTube video is private or not embeddable — _SNO8mZV8rc
- `51e33a88fb9e` **warn** oembed: YouTube video is private or not embeddable — acIxZR6DV6U
- `a261b57ae887` **warn** oembed: YouTube video is private or not embeddable — bFk6cPkNh9g
- `3251c58a1b67` **warn** oembed: YouTube video is private or not embeddable — boZnvNHqJBE
- `747e7c272b23` **warn** oembed: YouTube video is private or not embeddable — dTQh9mqyrTM
- `5fb0b0c46648` **warn** oembed: YouTube video is private or not embeddable — dqs8pGdp8EM
- `208405d68232` **warn** oembed: YouTube video is private or not embeddable — dy2A8pfI6dg

## Uptime by probe (30 d)

| probe | up % | avg ms | last |
|---|---:|---:|---|
| api-health | 100.0 | 142 | up 2026-10-26T06:12:16Z |
| home | 100.0 | 38 | up 2026-10-26T06:12:16Z |
| hub:/person/ajahn-chah | 100.0 | 22 | up 2026-10-26T06:12:16Z |
| hub:/topic/rebirth | 100.0 | 23 | up 2026-10-26T06:12:16Z |
| hub:/tradition/buddhism | 100.0 | 20 | up 2026-10-26T06:12:16Z |
| llms.txt | 100.0 | 18 | up 2026-10-26T06:12:16Z |
| mcp-initialize | 100.0 | 559 | up 2026-10-26T06:12:16Z |
| mcp-tool-call | 100.0 | 42 | up 2026-10-26T06:12:16Z |
| mcp-tools-list | 100.0 | 57 | up 2026-10-26T06:12:16Z |
| openapi.json | 100.0 | 38 | up 2026-10-26T06:12:16Z |
| sitemap | 100.0 | 17 | up 2026-10-26T06:12:16Z |
| well-known-mcp | 100.0 | 19 | up 2026-10-26T06:12:16Z |

## Performance (key pages)

- /: TTFB 25 ms, 0.71 MB (2 assets)
- /topic/rebirth: TTFB 16 ms, 0.72 MB (2 assets)
- /person/ajahn-chah: TTFB 11 ms, 0.72 MB (2 assets)
- /place/amaravati: TTFB 16 ms, 0.01 MB (0 assets)
- /agents: TTFB 12 ms, 0.01 MB (0 assets)

## Worker bundles

- site: 0.71 MB gzip (3.46 MB raw), estimate from tracked inputs (build output absent; KV-served files excluded)
- mcp: 1.10 MB gzip (7.15 MB raw), estimate (data + src + discovery)
