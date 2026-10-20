# 32 — Schedules stream (global, queryable per country/tradition)

**What:** the stream the user asked for — every place's programmes and
dated occurrences, queryable by country + tradition (+ length/format),
with freshness enforced so stale dates can never present as current.

**Three layers (do not merge them):**
- `programme` (stable): name, typical length, format, cost model,
  schedule_url. Timeless facts, human-written, rarely change.
- `occurrence` (event.json kind retreat/course, TTL'd): dated instances
  with `checked` date; served only when fresh AND future; always beside
  the official link. Expired rows are filtered at serve time, never shown.
- `session` (06 Gather): live sits/circles/classes with join links.

**Freshness doctrine (the scale answer):** retreat dates rot in weeks, so
machines watch and humans record. `refresh_schedules.py` (cron daily)
fetches every schedule_url, hashes content, and on change emits a review
item ("schedule changed at X, re-read") — it never invents dates. A changed
page + a human read = fresh occurrences. Unchanged pages re-stamp `checked`
automatically. Anything past TTL without re-read goes dark with a
"confirm on the official page" badge, never deleted (history matters).

**Files:** STREAM-SPEC.md, schemas/programme.json, refresh_schedules.py,
mcp-tools.json (find_retreats, get_schedule), programmes-seeds.json
(12 programmes from verified rows), REPORT + MERGE-NOTES.
