# Wiser sourcing spec (overnight 2026-10-20)
Each sourcer writes ONLY to work/wiser/sources/<group>/ — never edits work/wiser/app/, never deploys.
Outputs:
- candidates.json: array of clip rows in the SAME shape as app/clips.json rows (id, teacher, speaker, title, ytTitle, channel, kind:'human', media:'youtube', checked, dur, sec, format, carrier, setting:'talk', region(=tradition family), tradition, traditions[], figures[], topics[], published, year, views, tags{v:1,topics:[[topic,conf,src]],lang,band}) PLUS optional virtual-clip fields: start (s), end (s), parent (full video id), segTitle. A virtual clip is a 1-20 min passage of a longer official video played via YouTube start/end params; its id = `${videoId}@${start}`.
- people-additions.json: wisegraph people (same shape as app/wisegraph/people.json entries): id, name, role 'speaker'|'figure', traditions, wikidata, bio (1-2 sentences, own words), works (specials: title, year, kind book|talk|retreat|text), aliases.
- traditions-additions.json / edges-additions.json: same shapes as app/wisegraph/*.json.
- topics-additions.json: new topic leaves proposed (root, id, label, keywords).
- REPORT.md: counts, channels used, rights notes.
Rules: official uploads by the teacher/their foundation/estate/publisher only (no fan reuploads); every clip passes an embeddability check (oEmbed + embed page playable); horizontal only for the main pool (flag vertical with format:'vertical'); target length 1-20 min — keep natural clips in range; for longer talks create virtual clips at topic boundaries using transcripts; transcripts INTERNAL only (save under work/wiser/transcripts-internal/<group>/, never in candidates). No media downloads. Never buy anything. Dharma Seed is CC BY-NC-ND audio: do NOT cut it; skip it this round.
Topics: use app/schema/topics.json ids; each clip 1-4 topics with confidence.
