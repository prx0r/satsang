# keeper

Satsang's self-maintenance module: scheduled checks on GitHub Actions (no extra Cloudflare service), state on the
`keeper-state` branch, a CLI and three read-only MCP tools for agents. Node 20, no dependencies.

- `run.mjs` runner, `checks/*.mjs` plugins `{id, cadence, doc, full?, run(ctx) -> {findings, passed}}`, `lib/` helpers.
- `cli.mjs` findings / next / explain / status. `outage.mjs` keeps one `keeper-outage` issue. `publish.sh` writes state.
- Workflows: `.github/workflows/keeper-{hourly,daily,weekly}.yml` (cron + workflow_dispatch, one concurrency group).
- Config: `config.json` (BASE, limits, AI bot list). Overlays edited by PR: `claims.json`, `ignore.json`, `known-conflicts.json`.
- Site hook: `app/web-worker/keeper-dead.mjs` marks dead clips `"status":"removed"` in /clips.json (fail-open, 1 h cache).
- MCP: `mcp/src/keeper.mjs` adds `site_health`, `list_findings`, `next_maintenance_task`.

How agents use it: [AGENTS.md](AGENTS.md).
