# MINIMAL ENTRY — one place, complete (2026-10-20)

**The standard:** every place ships with five things. No exceptions for new
entries; legacy rows get there via the scoreboard + backlog, never by
lowering the bar.

```
place: id / type / name / traditions / country   (exists: schema-required)
  + url                                          (54 UK rows missing → backlog)
  + main_teacher                                 (NEW — 249 missing → backlog)
  + contact                                      (exists in schema; 168 missing → backlog)
  + description + description_source              (NEW provenance — 316 unknown → see rule)
```

## main_teacher (new field)

One person id: the teacher responsible **now** (abbot, spiritual director,
resident minister). `teachers[]` keeps meaning founders / historically tied
— main_teacher answers "who do I go learn from", not "who founded this".

`teacher_model` rides with it: `single` (one responsible teacher),
`rotating` (qualified teachers rotate by design — Goenka centres, urban
dharma centres, Gaia House programmes), `none` (no clergy by doctrine —
Quaker meeting houses). Model is inferred where form or doctrine decides
(tradition: goenka-vipassana→rotating, quaker→none; type: centre→rotating,
monastery/retreat/ashram/hermitage→single); temples, pilgrimage sites and
bookshops vary too much to default and stay backlog. A place with model
`single` and no main_teacher is incomplete, full stop — that item names the
exact post to fill (abbot, spiritual director, resident minister).

## description_source (new field)

Every description carries provenance — this is the "about page or gened"
rule, enforced:

| value | meaning |
|---|---|
| `official` | paraphrase of the org's own about page (never verbatim); `description_source_url` required |
| `wiser` | our own words, written for the directory |
| `unknown` | legacy rows only; every one is a backlog item until re-sourced |

Descriptions stay short (current range 16–160 chars, avg 64): one or two
lines, what it is + who it's for. No verbatim copying, ever.

## Completeness is a scoreboard, not a gate

Missing data is not bad data. `minimal_entry.py` scores every place
(teacher / contact / url / bio-sourced) into `scoreboard.json` and emits
backlog items for the review queue. Gates keep blocking bad contacts and
bad formats; the scoreboard directs the sourcing work, tradition by
tradition, Buddhism first.
