# Satsang: Google AI Search and agent discoverability plan (2026-10-20)

> **Status (2026-10-25):** **mostly shipped** (JSON-LD, sitemaps incl. places, llms.txt/llms-full.txt, /data, MCP). Waits on the satsang.digital switch for the final host.

## What Google wants (developers.google.com/search/docs/appearance/ai-features, updated 2025-12-10)
- No special format or schema for AI Overviews or AI Mode. A page must be indexed and snippet-eligible.
- Levers: crawlable (robots + CDN), internal links, important content in TEXT, images and video supporting the text, structured data matching the visible text, page experience, Search Console.
- AI Mode uses "query fan-out" (many sub-queries), so many specific, answer-first pages beat a few broad ones.

## Audit of tantrafiles.xyz (live)
- Good: SSR hub pages with JSON-LD Person, canonicals, meta descriptions; a sitemap index (person 560, place 520, tradition 157, practice 76, topic 65, collection 17); llms.txt, MCP, OpenAPI.
- Gaps: the site name is still "Wiser"; pages are thin (~6 KB); no clip/talk pages (9,478 clips have no URL Google can index, so no video results); no comparison or question pages; no study-path pages; no resource pages; the homepage content is JS-only; robots.txt names no AI bots; no Search Console/Bing; no IndexNow; no markdown twins.

## Plan (order)
1. Domain: launch on satsang.digital, 301 tantrafiles (path-preserving), Search Console Domain property (DNS TXT, which we add) plus sitemap submit; Bing Webmaster plus IndexNow key file (ChatGPT search leans on Bing).
2. Talk pages /talk/<id>: title, teacher, tradition, an embedded official player, a text summary and topic chapters we write from our segmentation (no transcript text), and VideoObject + Clip (key moments) + BreadcrumbList. A video sitemap. Only for clips with our own summary; others stay noindex to avoid thin pages.
3. Question/comparison pages /q/<slug>: "What happens after death in Theravada vs Advaita vs Tibetan Buddhism"; an answer-first summary of 40–60 words, then a section per tradition with 2–3 talks at timestamps, sources and "verified on". Seeded from topic roots and Topic Flash bridges.
4. Study-path pages /study/<slug>: "Where to study Kashmir Shaivism in India", "Nath yoga", "Advaita Vedanta (Arsha Vidya)", from the deep-india-study REPORT; Place/EducationalOrganization, Course where real, dates with sources.
5. Enrich existing hubs: an intro paragraph, a visible "Sources · verified 20 Oct 2026", related links (internal mesh), FAQ-style H2s that match real queries; ProfilePage for teachers; sameAs (Wikidata, official site, YouTube channel).
6. Agents: a markdown twin of every page (/x.md and Accept: text/markdown), <link rel="alternate" type="application/json"> to the API record, Dataset schema on /data, robots allowing OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Googlebot; llms.txt pointing at the md twins; list the MCP in the official MCP registry (needs the user's go and possibly an account).
7. Measure: Search Console performance + a weekly agent probe (ask MCP tools 10 canonical questions, check cited URLs).

Guards: no transcript text, official embeds only, dark design unchanged, Worker 3 MB limit (render talk/q pages from KV/D1, not bundled).

## Staying live (proposed 2026-10-20 19:40)
Worker "satsang-watch" with Cron Triggers (Free: 50 subrequests/run, so batches of ~45):
1. Uptime every 5 min: site home + 3 hub pages, API health, MCP tools/list + one tool call, sitemap, llms.txt. Results to D1 table watch_runs; public /status page; a JSON at /status.json for agents.
2. Link rot, rolling: every external URL (official sites, resources, place websites, PDFs) is HEAD/GET-checked in round-robin batches (~13k checks/day, so everything roughly daily). YouTube clips are checked via oEmbed (catches deleted/private/non-embeddable). Dead after 3 consecutive failures, then auto-hidden from feeds/ballots and pages show "link currently down"; revived automatically when it returns.
3. Fresh content: daily YouTube channel RSS (no key) for every official channel; new uploads become candidates, horizontal + duration checks, and go into For You "fresh" after the topic tagger.
4. Freshness: records with verified_on > 90 days or programme dates in the past go to a re-verify queue; a weekly Hark scheduled task (an agent) re-checks alive status, dates and contacts with sources, writes diffs, and reports to the user.
5. Weekly report to the user: uptime %, dead links found/fixed, new talks added, records re-verified, and Search Console stats once connected.
