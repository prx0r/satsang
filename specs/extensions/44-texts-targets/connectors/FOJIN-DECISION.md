# FoJin connector: evaluated 2026-10-21, ARCHIVED (not wired into the Satsang MCP)

Checked live: https://mcp.fojin.ai/mcp answers MCP `initialize` (serverInfo fojin 0.4.0, websiteUrl https://fojin.app) and `tools/list`
(search_corpus, read_passage, get_parallels, lookup_dictionary, ...). Code is Apache-2.0 (github.com/xr843/fojin; PyPI fojin-mcp 0.4.0).

Legitimate: yes (open source, public, cites URNs). Stable public API: not yet, so it is not added as a read-only Satsang tool:
- young and churning: repository created 2026-03-10; releases v3.3.0 -> v3.4.0 -> v4.0.0 -> v1.0.0 within two weeks (Mar 2026); MCP 0.4.0;
- one maintainer, anonymous rate-limited endpoint, no published terms or SLA for third-party proxying;
- mixed data licences passed through per source (CBETA CC BY-NC-SA, 84000 own terms, SuttaCentral CC0): a proxy tool in our MCP would
  re-serve NC/SA text under our name.
What to do instead: agents can add FoJin themselves (`https://mcp.fojin.ai/mcp`); Satsang keeps linking SuttaCentral/ATI pages. Re-evaluate when
FoJin publishes API terms and a stable versioned REST API; then a thin link-only tool (sutta id -> parallels URL, no passage text) is the shape.
The pack's `fojin_check` notes stay in texts-targets.json as editorial hints only.
