# Satsang

Current-state brief (rewritten 2026-10-25). History: `MERGE-LOG.md` (round by round) and `_archive/BRIEF-history.md`
(the old BRIEF with every STATE section, plus the full reference on the resonance mechanic, routes, data shapes and the
sourcing merge). Open work: `OPEN-THREADS.md`.

## What it is
A living directory of the world's wisdom traditions: teachers, scholars, lineages, traditions, places to study and
practise, free texts and practices, Series (short topic courses), a resonance loop ("Which resonates more?"), TV mode,
an enquiry lens (semantic search) and an open MCP/REST API that agents can query for sourced, dated answers.
Non-commercial and open (repo public, AGPL/MIT code, CC BY 4.0 curation).

## Live (2026-10-25)
| Piece | Where | Worker / version |
|---|---|---|
| Site | https://tantrafiles.xyz (www too) | wiser-web daec752e (2026-10-31) |
| API (votes, resonates, profile, stats) | https://api.tantrafiles.xyz | wiser-api 6c2d43e0 (nightly cron 19:17 UTC) |
| MCP + REST + open data | https://mcp.tantrafiles.xyz/mcp | wiser-mcp 912792ed (2026-10-31) |
| Chat / path builder | https://chat.tantrafiles.xyz | satsang-chat c4914eeb |
| Search (enquiry lens) | https://satsang-search.tradesprior.workers.dev | satsang-search a0a6d033 |
| Practice engine preview (/sit/, /breath/, /play/) | https://engine.tantrafiles.xyz/sit/ | satsang-engine-preview (not on the main site) |

satsang.digital is prepared but **not active**: its nameservers at Porkbun must point to Cloudflare first, then the owner
runs `app/tools/switch-domain.sh` (`domain.mjs` ACTIVE='legacy' until then).

## Current state in one screen
- Catalogue: 9,986 talks (official uploads only), gold tier 246 / strong 1,198 / standard 8,542, 22 series, 85 practices,
  963 places with crawlable pages (ext-49 Trika round 2026-10-31: +11, ishber-ashram merged) (78 from the 2026-10-25 discovery batch; 9 marked "details unverified"; place-level safety
  records shown like person ones), 184 tradition nodes, open data dumps, events keeper (weekly).
- Nav: Watch · Topics · Teachers · Places · Practise · Ask; For you / Your model / Charts / All series in the account menu.
- Enquiry lens on every tab (`?q=`), held / red-flag teachers filtered.
- Practise tab uses the breathplayer overlay ("Practise with the body"). The hands-off sit player (`engine/sit/`,
  `specs/SIT-PLAYER.md`) is committed (ce1ee78) and previewed, **not** wired into the Practise tab: awaits the owner.
- Crowd tally: `GET /stats/clips` counts signed-in votes fully, anonymous device votes at half weight, and "This resonates"
  as a down-weighted single-talk pseudo-win (anon half again); anon resonates are rate-limited. Real volume is still tiny.

## Build, deploy, release
```
cd app && sh deploy.sh build && sh deploy.sh guard && sh deploy.sh ship   # site (separate calls in the 120 s sandbox)
sh deploy.sh api | mcp | chat | search                                   # the other Workers
cd .. && python3 tools/check/check-data.py && sh tools/check/crawl-run.sh  # data checks + phone route crawl
node app/tools/test-practice-engine.mjs                                  # practice data + engine checks
sh tools/release/release.sh "<msg>"                                      # commit + push prx0r/satsang (engine/ left out)
RELEASE_ENGINE=1 RELEASE_ONLY=engine sh tools/release/release.sh "engine: <msg>"   # engine/ in its own commit
```
Data pipeline order after catalogue changes: build-collections.py → build-gold.py → mini_courses_src.py → build-collections.py
→ build-gold.py → build-catalog.py → deploy (site, mcp, chat, search).
Places pipeline (new places = a `sources/ext-*/places-ext.json` pack): merge-sources.py → place-contacts.py → apply-keeper-fixes.py →
build-wise.py → deploy build/guard/ship + mcp. Safety records live in `sources/*/redflags-public.json` (subject `person/<id>` or
`place/<id>`); merge-sources keeps records added by hand to wisegraph/redflags.json. Engine tests: `cd engine && node tools/test-compile.mjs &&
node tools/test-text-to-practice.mjs && node tools/test-sit.mjs && python3 tools/validate-schemas.py` (needs `pip install jsonschema`).

## Rules
- Transcripts are internal only (the internal transcript folder, gitignored); no transcript text, URL or path is ever published. deploy.sh guards
  and `tools/release/secret-scan.sh` enforce it.
- Official uploads only; embeddable; YouTube's own player; nothing downloaded.
- Portraits: Wikimedia Commons via Wikidata P18 only (PD / CC), credited.
- Topic takes are Satsang's own one-line summaries, never quotes. Hareesh Wallis texts are link-only (all rights reserved).
- Licensing stance (owner, 2026-10-21): non-commercial; CC BY-NC assets are fine with attribution; keep all licence notices.
- Never buy anything (domains included); never spend credits (OpenRouter off; Workers AI free allocation only).
- No DNS changes, no switch-domain.sh, no D1 seeds without the owner.
- Plain words in the UI: no jargon, no "battle", no "VS", no clocks. Screenshots (phone 390 px + desktop) before deploy.
- Never delete owner or agent work: move it into `_archive/`.
- If something loops more than twice, stop and note it here or in OPEN-THREADS.md.

## Doc map
- `README.md` layout + deploy · `OPEN-THREADS.md` open work · `MERGE-LOG.md` history.
- `specs/`: each spec opens with a Status line (shipped / partial / not started). Current working specs: SIT-PLAYER,
  TEXT-TO-PRACTICE, SERIES-FORMULA, PLACES-TODO, PLACES-REVIEW. `specs/extensions/` = merge records.
- `search/README.md` (lens Worker), `mcp/README.md`, `chat/README.md`, `keeper/README.md`, `engine/README.md`.
- `_archive/` old briefs and one-off reports; `archive/` Funnier-era code.
