# Keeper: how an agent maintains Satsang

Keeper is Satsang's self-maintenance module. GitHub Actions run its checks on a schedule and publish the results to the
`keeper-state` branch. Any agent (Hark, Claude Code, ChatGPT with the MCP, a person) can pick up the work the same way.

## Where the state is
| file (branch `keeper-state`) | what |
|---|---|
| `keeper/state/findings.json` | every finding: `{id, check, severity, target, message, evidence, first_seen, last_seen, fails, autofix?, status: open|fixed|ignored, claimed_by?, claimed_at?}` |
| `keeper/state/dead.json` | clip ids / video ids / URLs dead after 3 consecutive failing runs (403/429 never count). The site hides dead clips from it. |
| `keeper/state/reverify.json` | records to re-verify on the web: stale `verified_on` (> 90 days), past programme dates, unknown or inferred living status, low-confidence places |
| `keeper/state/status.json` | uptime per probe, last 30 days; open counts; perf and bundle notes |
| `keeper/REPORT.md` | human summary |

Raw URLs: `https://raw.githubusercontent.com/prx0r/satsang/keeper-state/keeper/state/<file>`. The MCP server also exposes
read-only tools `site_health`, `list_findings` and `next_maintenance_task` over the same files.

## Picking up work
```
node keeper/cli.mjs next                    # top-priority unclaimed finding, as JSON, with how_to_fix (reads keeper-state if no local state)
node keeper/cli.mjs findings --severity error [--check linkrot] [--remote]
node keeper/cli.mjs explain <finding id>
node keeper/cli.mjs status
```
1. **Read** `findings.json` (or `cli.mjs next`). Priority: severity, then consecutive fails, then age. Skip findings claimed in the last 7 days.
2. **Claim** in a PR to `main`: add `"<id>": {"claimed_by": "<agent or person>", "claimed_at": "<ISO time>", "pr": "<url once open>"}`
   to `keeper/claims.json`. Keeper copies claims onto findings on its next run. One finding (or one tight group with the same root cause) per PR.
3. **Fix at the source**, never in generated output: data in `app/wisegraph/*.json`, `app/tools/source_maps.py`,
   `sources/<group>/`; pages in `app/web-worker/build-meta.mjs`; agent docs in `mcp/build-discovery.mjs`. Cite the source URL
   for every fact you change and set its check date. Rebuild with the steps in BRIEF.md when the fix needs it.
4. **PR** titled `keeper: fix <id> (<check>)`, body `Fixes keeper finding <id>` + what you verified and where. Remove your claim line in the same PR.
5. Keeper closes the finding on the next run where its target passes (hourly for uptime/sitemap, daily for the rest).
   A finding that is correct but accepted goes in `keeper/ignore.json` (by id, or `{check, target: regex}`), with a reason in the PR.

Deploys are separate: merging a data fix does not publish it. Deploy only with the user's go-ahead and BRIEF.md's steps.

## Checks
| id | cadence | what |
|---|---|---|
| uptime | hourly | home, 3 hubs, API health, MCP initialize/tools/list/real call, sitemap, llms.txt, openapi.json, .well-known/mcp.json. Opens/closes one `keeper-outage` issue. |
| sitemap | hourly (weekly full) | child sitemaps 200 + lastmod + on BASE; rolling locs answer 200 without redirect, canonical = loc, no noindex |
| links | daily (weekly bigger) | internal links from sitemap pages, /agents, llms*.txt |
| linkrot | daily | every external URL in the open-data dump, rolling, 1 req/host/s, HEAD then GET |
| oembed | daily | every clip's YouTube video via oEmbed (removed / private / not embeddable) |
| jsonld | daily | JSON-LD parses, has type/name, url = canonical, name matches the title |
| provenance | daily | source_url / verified_on / confidence (MCP's own `prov()`), stale, past dates, unknown living status; writes reverify.json |
| integrity | daily | duplicate people/places, lineage cycles, dangling edges/refs, contradictions, cross-source conflicts, `keeper/known-conflicts.json` |
| leaks | daily | no transcript text/fields, no secrets, no R2 URLs in the public bundle or any tracked repo file |
| robots | daily | AI/search crawlers allowed (config `aiBots`), Sitemap line, llms.txt names BASE + MCP, llms counts = /data/index.json |
| bundle | weekly | Worker scripts under 3 MB gzip (Workers Free) |
| perf | weekly | TTFB and page weight for 5 key pages |

Autofixes are limited to `dead.json` and `reverify.json`. Everything else is a proposal for an agent or a person.

## Never
- Never publish transcripts: no transcript text, transcript URL, path or file in the site, the data, the MCP or this repo. Transcripts live only in the private `satsang-data` repo.
- Official uploads and official embeds only (teacher, foundation, estate, publisher); YouTube's own player; nothing downloaded or rehosted.
- Keep the dark design (serif headings, gold). Any visual change needs screenshots and the user's yes before deploy.
- Never run `wisegraph/seed.sql` against D1 (it is destructive). Migrations are additive only.
- No DNS changes, no zone or route changes, no domain or plan purchases, no purchases of any kind.
- Never print or commit secrets or tokens; never weaken the deploy.sh transcript guards.
- Never invent facts, dates, contacts or quotes; every changed fact cites its source.
- Never edit the `keeper-state` branch by hand; never force-push `main`.
- Don't touch another agent's claimed finding or in-flight work; coordinate through claims and PRs.

## Running keeper yourself
```
node keeper/run.mjs --cadence hourly|daily|weekly|all [--only id,id] [--limit n] [--budget seconds]
sh keeper/publish.sh          # commit state to keeper-state (needs push rights)
```
BASE is `keeper/config.json` `base` (`KEEPER_BASE` / `KEEPER_API` / `KEEPER_MCP` override it). Local extras:
`KEEPER_SOURCES=<dir>` adds a sourcing tree to the conflict scan; `KEEPER_TRANSCRIPTS=<dir>` samples 9-word runs from the
internal transcripts against the public bundle (never set this in CI).
