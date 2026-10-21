# HANDOVER — Continue Sermon Excavation (Sermons 22–33)

> **STATUS 2026-10-20: SUPERSEDED — all 33 sermons are now excavated
> and pushed. Kept for method reference only. If resuming after a
> revert, follow the same loop and see REPORT.md for current state.**

## What this is
Pack `53-nibbana-scaffold` in `satsang-extensions` (repo `prx0r/satsang-extensions`,
branch main). This handover was written when Sermons 1–21 of Ñāṇananda's "Nibbāna:
The Mind Stilled" were excavated and 22–33 remained (now all complete). This is raw
material for the 5-hour beginner movie; NOT a script yet.

## Your job for each sermon (22–33)
1. Read `/tmp/opencode/nibbana/Nibbana-NN.txt` (NN = 22…33; sermons 12 uses `12-2`,
   sermon 1 uses `01-1`). Find the header line containing "twenty-second sermon" etc.
   and join the lines after it. Read it fully (usually 8000–24000 chars of body).
2. Write `/home/ubuntu/spirit-directory/satsang-extensions/53-nibbana-scaffold/
   sermon-NN-excavation.md` with exactly these sections, using **full source
   sentences and quotes** (not summaries — user rejects fortune-cookie level work):
   - `# SERMON NN — EXCAVATION` + source line (word count)
   - `## SECTION 1: WHAT NIBBANA IS`
   - `## SECTION 2: HOW THE MECHANISM WORKS`
   - `## SECTION 3: WHAT KEEPS THE MECHANISM RUNNING` (keep spelling MECHANATION
     only if matching older files — standardize to "RUNNING")
   - `## SECTION 4: WHAT THE MECHANISM BUILDS`
   - `## SECTION 5: HOW TO SEE THROUGH IT`
   - `## SECTION 6: WHAT REMAINS`
   - `## REFUTATIONS`
   - `## EVIDENCE` (table: source | passage | Analayo parallel)
   - `## VOICE` (quotable one-liners)
   - `## PASS 2 FINDS` (misses found on re-read)
   - `## PASS 3: HOLES AND CONNECTIONS`
3. Validate: `python3 /home/ubuntu/spirit-directory/satsang-extensions/11-site-runtime/check_pack.py
   --repo /home/ubuntu/spirit-directory/satsang --pack /home/ubuntu/spirit-directory/satsang-extensions/53-nibbana-scaffold
   --receipts /tmp/opencode/receipts53`
4. Commit + push one sermon at a time:
   `cd /home/ubuntu/spirit-directory/satsang-extensions && git add 53-nibbana-scaffold/sermon-NN-excavation.md
   && git -c user.name="opencode" -c user.email="opencode@local" commit -m "excavate sermon NN (<topic>)" && git push`

## Pass-3 hole rule
After each sermon, note connections to: Sermon 4 (four modes), Sermon 18 (lotus/VBT),
the VBT practice pack, and the direct-experience ladder in `52-nibbana-arguments`.
Flag any practice a sermon commands but doesn't explain.

## Context facts
- PDFs: `https://media.dharmaseed.org/documents/Nibbana-NN.pdf`
- `50-sermons-graph/sermons-01-33-graph.md` has the series topic map — use it to
  cross-check that your excavation captures the sermon's arc.
- `54-excavation-skill/SKILL.md` = 3-pass method + 6 gates (Coverage, Organization,
  Fidelity, Argument integrity, Utility, Honesty).
- `51-nibbana-movie/PLAIN-ENGLISH.md` = language law for the eventual movie.
- Unknown `.json` shapes fail `dialect-conform-v1`; markdown files pass.
- Analayo analysis PDFs (BCBS `Nibbana-NN.pdf`) are a separate analysis layer,
  referenced via `gochema/essays/nibbana-sermons/INDEX.md`.

## Done so far (1–21)
Sermons 1–21 all pushed, ALL PASS. Latest commit `a45cd5e`.
Sermon 21 = Anurādha (sand castles, Vajira-Mara, satta redefined).

## First step for you
Read `Nibbana-22.txt`, write `sermon-22-excavation.md`, validate, commit, push.
Then 23…33 in order. After 33: update `REPORT.md` with the full series summary and
note any scaffold sections still thin.
