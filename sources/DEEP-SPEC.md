# Deep tradition pass (2026-10-20 overnight)
Read SPEC.md first (file formats, clip rules); this extends it. Output to sources/deep-<group>/ ONLY. Do not touch app/, atlas/ or other sources/ folders (another agent is editing app/).
Goal: DEPTH over breadth. The user hates teachers with 1 video. Prefer teachers and scholars with deep official catalogues (target 8+ usable talks, ideally 30–100), organised BY TRADITION and SUB-SCHOOL.
- clips.json: official channels/embeds only (YouTube Data API/oEmbed metadata; no downloads). Each row records orientation (horizontal|vertical, verified via oEmbed width/height or the /shorts/ redirect), duration, speaker, tradition + school, topics. Long talks become 1–20 min virtual clips only where timestamps/chapters justify it, else the whole talk if ≤60 min.
- people.json: role teacher|scholar|figure; tradition/school; years; a short neutral bio; official site; clip_count. Speakers with <8 usable clips go to a "more voices" list, not the main set (keep them).
- lineages.json: edges with type: teacher_of (dharma), academic_supervisor_of (PhD), influenced, translated, founded; source URL plus confidence. SCHOLARLY LINEAGES are first-class (e.g. Sanderson supervised Mallinson, Törzsök, Goodall, Wallis?; verify each).
- texts.json: free legitimate essays/books/translations by tradition and topic (links only, never rehosted; public domain or the publisher's free offer).
- practices.json: named practices with tradition, short how-to in your own words, and a source link.
- schools.json: the sub-school tree for the group (name, parent, dates, key figures, symbol suggestion).
- REPORT.md: counts per school; depth per speaker; gaps.
No purchases, no account creation, no emails. If something loops more than twice, move on and note it.
