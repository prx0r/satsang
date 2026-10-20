# 05 — Curations + essays: D1 migration + seed records

**Why:** ROADMAP step 14 + NORTHSTAR "curations" layer — user-made
collections styled like topic pages (`/c/<handle>/<slug>`), drafts,
publishing at `/c/`, share cards, follow/save, personal essays attached
to curations/topics/talks/texts/practices/people, public profile
`/u/<handle>` (off by default), report flow. Schema (`curation.json`)
exists; storage + seeds don't.

**Files:**
- `0020_curations.sql` — draft D1 migration (follows `0015_places.sql`
  style; numbered 0020 to sit after 0016–0019 in ROADMAP order)
- `seeds.json` — 2 Wiser-authored seed curations + 1 seed essay,
  schema-conformant (refs use only verified gids)

**Merge:** apply migration per ROADMAP (`wrangler d1 execute`), import
seeds via the step-14 endpoints when built (or hand-insert for the demo
pages). Details in MERGE-NOTES.md.
