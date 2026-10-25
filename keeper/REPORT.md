# Keeper report

Updated 2026-10-25T19:36:31Z for https://tantrafiles.xyz. State branch: `keeper-state`. Agents: see keeper/AGENTS.md.

**Open findings:** 235 (error 7, warn 15, info 213). **Uptime (30 d):** 100%. **Down now:** nothing.
**Dead:** 0 clips (0 videos), 6 external URLs. **Re-verify queue:** 485.

## By check

| check | open | error | warn | info | last run | checked |
|---|---:|---:|---:|---:|---|---:|
| bundle | 0 | 0 | 0 | 0 | 2026-10-25T09:15:15Z | 2 |
| integrity | 6 | 0 | 0 | 6 | 2026-10-25T08:42:39Z | 2724 |
| jsonld | 0 | 0 | 0 | 0 | 2026-10-25T08:42:40Z | 45 |
| leaks | 0 | 0 | 0 | 0 | 2026-10-25T08:42:45Z | 1093 |
| linkrot | 11 | 6 | 5 | 0 | 2026-10-25T08:44:33Z | 700 / 1820 |
| links | 1 | 1 | 0 | 0 | 2026-10-25T09:15:18Z | 377 / 377 |
| oembed | 10 | 0 | 10 | 0 | 2026-10-25T08:50:58Z | 2500 / 9777 |
| perf | 0 | 0 | 0 | 0 | 2026-10-25T09:15:18Z | 5 |
| provenance | 207 | 0 | 0 | 207 | 2026-10-25T08:50:59Z | 2373 |
| robots | 0 | 0 | 0 | 0 | 2026-10-25T08:50:59Z | 18 |
| sitemap | 0 | 0 | 0 | 0 | 2026-10-25T19:36:29Z | 120 / 2231 |
| uptime | 0 | 0 | 0 | 0 | 2026-10-25T19:36:31Z | 12 |

## Top problems

- `c8df15076389` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/2024/04/2.1-retraites-et-journees-de-pleine-conscience.html (6× in a row)
- `c3f5785b0c32` **error** linkrot: External link failing: HTTP 503 — https://www.koyasan.or.jp/en/ (4× in a row)
- `0036eb3fe38e` **error** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://maisondelinspir.org/ (3× in a row)
- `95eb0ca067c1` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org (3× in a row)
- `a6593c26e706` **error** linkrot: External link failing: EAI_AGAIN: fetch failed — https://namgyalmonastery.org/contact/ (3× in a row)
- `e8f8fee79110` **error** linkrot: External link failing: DEPTH_ZERO_SELF_SIGNED_CERT: fetch failed — https://publications.efeo.fr/en/livres/840_tantric-studies (3× in a row)
- `935fe75cc296` **error** links: Internal link broken: HTTP 404 — https://tantrafiles.xyz/favicon.svg (2× in a row)
- `3b77e578be5c` **warn** oembed: YouTube video is private or not embeddable — WXe4DGCbFyE
- `57f9b2224d73` **warn** oembed: YouTube video is private or not embeddable — PYWjS9yUTKc
- `63df07ee2310` **warn** oembed: YouTube video is private or not embeddable — V-KnyhNmBB8
- `658479fff7de` **warn** oembed: YouTube video is private or not embeddable — LlPLpEpl-Wc
- `674d7c590f18` **warn** oembed: YouTube video is private or not embeddable — UpVBP18UORY
- `8dbee8f2fee1` **warn** oembed: YouTube video is private or not embeddable — PJUVYlR9V6I
- `a0512ea78bad` **warn** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://www.sudoc.fr/041424565
- `b1f90deb5c63` **warn** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://devipuram.org/
- `b525919c7f42` **warn** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://bodhgayatemple.com
- `ba601b79d6a1` **warn** oembed: YouTube video is private or not embeddable — NqtNSgZbPO4
- `d40a378198fc` **warn** oembed: YouTube video is private or not embeddable — V7zBzS1vRE4
- `df0d2637603b` **warn** oembed: YouTube video is private or not embeddable — OI0JS0ojrF8
- `eb98ac3e749f` **warn** oembed: YouTube video is private or not embeddable — ItxhSw9C3Eo
- `f09bc89183eb` **warn** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://devipuram.org
- `fa0ef6ff83d9` **warn** linkrot: External link failing: UND_ERR_CONNECT_TIMEOUT: fetch failed — https://devipuram.org/sri-vidya-courses

## Uptime by probe (30 d)

| probe | up % | avg ms | last |
|---|---:|---:|---|
| api-health | 100.0 | 141 | up 2026-10-25T19:36:30Z |
| home | 100.0 | 38 | up 2026-10-25T19:36:30Z |
| hub:/person/ajahn-chah | 100.0 | 23 | up 2026-10-25T19:36:30Z |
| hub:/topic/rebirth | 100.0 | 24 | up 2026-10-25T19:36:30Z |
| hub:/tradition/buddhism | 100.0 | 21 | up 2026-10-25T19:36:30Z |
| llms.txt | 100.0 | 19 | up 2026-10-25T19:36:31Z |
| mcp-initialize | 100.0 | 548 | up 2026-10-25T19:36:31Z |
| mcp-tool-call | 100.0 | 42 | up 2026-10-25T19:36:31Z |
| mcp-tools-list | 100.0 | 59 | up 2026-10-25T19:36:31Z |
| openapi.json | 100.0 | 39 | up 2026-10-25T19:36:31Z |
| sitemap | 100.0 | 18 | up 2026-10-25T19:36:31Z |
| well-known-mcp | 100.0 | 18 | up 2026-10-25T19:36:31Z |

## Performance (key pages)

- /: TTFB 25 ms, 0.71 MB (2 assets)
- /topic/rebirth: TTFB 16 ms, 0.72 MB (2 assets)
- /person/ajahn-chah: TTFB 11 ms, 0.72 MB (2 assets)
- /place/amaravati: TTFB 16 ms, 0.01 MB (0 assets)
- /agents: TTFB 12 ms, 0.01 MB (0 assets)

## Worker bundles

- site: 0.71 MB gzip (3.46 MB raw), estimate from tracked inputs (build output absent; KV-served files excluded)
- mcp: 1.10 MB gzip (7.15 MB raw), estimate (data + src + discovery)
