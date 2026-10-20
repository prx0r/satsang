# GOLDEN PATH — endgame vision (2026-10-20)

> Go straight to a tradition, find a live teacher, see their exact method,
> be guided through it, then contact the teacher.

## The chain, in entities (all exist in DATA-MODEL)

```
tradition ──people(living:true)──▶ person (live teacher)
    │                                  │ teaches_at
    │                                  ▼
    │                              place (contact as published)
    ▼
practice (teachers[], texts[], steps[], sources[], needsTeacher,
          contraindications, visual)
    │                                  ▲
    └────── collection (syllabus) ──────┘
               units: watch/read/practise/reflect
               + practice{cadence} + checkpoint
               + visual specs (deitybody grammar)
                    │
                    ▼
              guided timer → streak → profile
                    │
                    └──▶ contact the teacher (place.contact, official only)
```

## Pipeline roles (reference implementations, not metaphors)

- **openpatala** — the works layer: translate works, attach editions to
  Text records, feed syllabuses (02 crosswalk pattern).
- **sanskrithelp `build_syllabus.py`** — the syllabus pattern: units REFERENCE
  material (doc/data/audio/route), each with `exit` (graduation test),
  `prereqs`, `blocks_on`, per-unit `status`. Content renders FROM structure.
  Mapping to Collection units in `syllabus-mapping.md`.
- **deitybody CATALOG** — the practice pattern: tradition → school → source →
  course → phase → practice, one runnable each; promotion human-gated
  (`needs_review → verify → live`); every practice a visualisation in one
  grammar. Mapping in `deitybody-mapping.md`.
- **satsang** — the directory that holds the chain together and serves it:
  pages, resonance, places map, MCP/API.

## What's missing (work orders)

1. `teaches_at` edges — this pack seeds 3; every living teacher needs one
   (sourcing rule: current post, official bio or place page as source).
2. Practice attribution — this pack seeds 10; all 76 practices need
   teachers[]/texts[] (sourcing rule: the teacher who teaches it, the text
   it comes from; initiated practices stay outline-only).
3. Living-teacher coverage — 21 living across ~13 traditions; whole families
   (Sufi orders, Kabbalah, pagan schools, Jain/Taoist — unsourced) have none.
   Coverage follows sourcing: no teachers without clips/verification.
4. `practice.status` — schema gap: deitybody's live/verify/stub pipeline has
   no field on the Practice entity (proposed in deitybody-mapping.md).
5. Contact reply path — one-tap email/directions exist on place pages;
   teacher-initiated contact (retreat booking, teacher Q&A) is Gather (06).
