# Wiser — north star (user, 2026-10-20)

> **Status (2026-10-25):** **partial**. Vision doc (user's words). Shipped: traditions, lineages, teachers, places map + place pages, retreats, open data/MCP. Not started: Gather (GATHER-SPEC), user curations.

User's words (verbatim):
"we could also add like countries and actual places of interest for each tradition living teachers, lineages in each tradition eg Ajahn Mun, Lee, Geoff and also like collate love retreats in each country, Tushita ones amaravati, vipassana this has the potential to be beautiful, we can also add like dharma seed type player right ... I realised the endgame here as an add on is basically having our own visual engine that basically for like meditation instruction can render visuals ... prx0r/deitybody is good start on this also in this repo and prx0r/sanskrithelp we also generate syllabuses for like structured pathways for all this content so we could map that to teachers / traditions then also have visuals and guided meditations etc"

Related north star in prx0r/deitybody/northstar.md: full structured syllabus + practice per tradition (Trika, Buddhism, Vipassana, Tibetan, occult/Qabalah middle pillar), each practice becomes a visualisation mapped on a standard body with a standardised visualisation grammar; later realtime AI-guided meditation with voice + wearables.

## Layers
1. Discover (live): resonance arena of 1–20 min talks, teachers/figures, traditions, topics compared across traditions.
2. Place: countries, monasteries/centres, living teachers, retreat centres (Tushita, Amaravati, Goenka Vipassana, Plum Village, Spirit Rock...), lineage trees (Ajahn Mun → Ajahn Lee → Ajahn Fuang → Thanissaro Bhikkhu / Geoffrey DeGraff).
3. Listen: full-talk player (Dharma Seed style). Dharma Seed is CC BY-NC-ND: play talks complete and unchanged, credit the teacher, non-commercial.
4. Learn: syllabuses / structured pathways per tradition (sanskrithelp's generator), each step mapped to teachers, talks and texts in wisegraph.
5. Practise: visual engine (deitybody body map + visualisation grammar) rendering meditation instructions; guided meditations; later realtime AI guidance.

## Data spine
wisegraph gains: places (country, lat/lng, type monastery|centre|retreat|pilgrimage), teacher_at edges, retreat programmes (link out, no dates cached long-term), practices (id, tradition, source text, steps), syllabus (ordered practices + talks + texts), visual specs (body loci, glyphs, colour, motion in the shared grammar).

## Next, AFTER the current integration + places work (user, 2026-10-20 03:14)
"expose all the data by mcp or make it structured so ChatGPT and other agents can reference it ... per topic ... people can create their own like playlists but they feel more like curations like the rebirth page ... a collection of lectures / clips and also potentially allow for your own writings and interpretations and publish them"
- Open data: public read API + MCP server (tools: search_talks, get_topic_compare, get_teacher, get_tradition, get_lineage, find_places), JSON-LD/schema.org on pages, llms.txt, CC-licensed metadata dumps. Metadata only; never transcripts.
- Curations: user-made collections styled like topic compare pages (title, intro essay, ordered talks/passages grouped by tradition, notes per item), with drafts, publishing at /c/<slug>, share cards, follow/save. Writings: personal essays/interpretations attached to curations or talks, published under the author's profile; moderation + report flow.

## Scholars + openpatala (user, 2026-10-20 03:27)
Scholar profiles as a first-class kind (Corbin on Islamic mysticism; Ratié and Torella on Utpaladeva; Biernacki and Dyczkowski on Abhinavagupta), with their works attached. Leads into prx0r/openpatala: translate works here, render videos and educational content, and build syllabuses split into a practice schedule and theory.

## Endgame: org profiles → free books → syllabus → personal practice (user, 2026-10-20 03:57)
- Teacher/org profiles (e.g. Sivananda): official site and platform (DLS Rishikesh, dlshq.org), location and directions, PUBLIC contact details only (official email or contact page as published), retreats with sign-up links.
- Free books: only where the publisher offers them free (DLS publishes Sivananda's works free online, incl. Kundalini Yoga), linked or rendered per its terms with credit, never rehosted against a licence. Turn into syllabus: theory chapters + practices, with video passages, timers, and an "add to daily routine" option.
- User profile mirroring Funnier: resonance taste, saved talks, curations/writings, active practices with streaks/tracking, retreats booked or wishlisted; one-tap email to a place, directions, sign-up. An optional public practice profile to connect with others doing the same practice (privacy default off).
- Pipeline link: openpatala / patalacheckpoints (syllabus + checkpoints), deitybody (visual practice), sanskrithelp (terms/mantras). Gather (GATHER-SPEC.md) for live sessions.

## Strategy + ideas (user, 2026-10-20 04:04)
- Start with the UK, mapped fully across every tradition, rather than all of India. Then follow sister places out from it (the Amaravati/Ajahn Chah branch network, the Ramakrishna Math/Vedanta network and others), plus India hotspots and main centres only.
- Missing streams to add: occult and Western magic (Golden Dawn, Thelema, Theosophy lodges), Druidry (OBOD, the Druid Network), Wicca and modern paganism, Heathenry, Sufi orders, Kabbalah, and the Christian contemplative tradition (Quakers, WCCM, Julian of Norwich).
- Goenka Vipassana centres are already plotted (409 entries from dhamma.org).
- IDEA: a map in the deitybody visual style (a "sacred map": glyphs by kind, lineage threads drawn between places, a timeline scrub).
- Principle: it's all derived from data, so set the structure first and play with the views later.

## Design + endgame notes (user, 2026-10-20 04:33)
- Vibe: mostly white with black text, ChatGPT-style sans plus KaTeX, BOLD symbols for each school (a Kashmir Shaivism mandala that pops), subtle per-school theming on profiles, fluid glass, crisp, snappy micro-interactions, minimal. The map is bare white like deitybody, with countries, gentle animations, pop-ups and contacts.
- Design toolkit: Leonxlnx/taste-skill and Impeccable (design judgement); React Bits, Motion Primitives, Magic UI and 21st.dev (patterns; the app is vanilla JS, so port the ideas); GSAP; Codrops; Shader Skills.
- Endgame: a chat function to navigate ("find me a good text"), an e-reader.
- Later, not essential: an astrology observatory (prx0r/ochemapp?).
