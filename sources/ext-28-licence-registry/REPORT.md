# ext-28-licence-registry: staged from prx0r/satsang-extensions/28-licence-registry on 2026-10-20

Staged by app/tools/stage-extensions.py (dedupe, living/low-confidence claims to app/wisegraph/review-queue.json). Pack docs: specs/extensions/28-licence-registry/.

# Sourcing report: licences (2026-10-20, extension pack)

Registry (6 domains) + 3 licence-carrying books. ALL EVIDENCE VERIFIED.

## The correction: availability ≠ licence

A PDF sitting on a website grants nothing by itself. What grants reuse is
the licence statement — usually on the book's copyright page, sometimes in
site terms. This pass proves the point with one domain carrying TWO
licences: dhammatalks.org hosts Thanissaro's custom gift-licence books AND
CC BY-NC 4.0 books side by side. Any per-website-only rule would mislabel
half the shelf. Hence: per-BOOK licence (from the copyright page) +
per-WEBSITE default (from terms) with the book always winning.

## What the licences actually say

- Thanissaro gift licence: copy/reformat/reprint/republish/redistribute in
  any medium free of charge, with attribution/derivation conditions. Generous
  but conditional — not public domain.
- CC BY-NC 4.0 (Maha Boowa via Thanissaro): free gift, no sale, BY-NC terms.
- Monastery colophon (Amaro/Abhayagiri): copyright reserved ONLY for sale;
  free-distribution reprint allowed unchanged. Unchanged is load-bearing —
  no excerpts-as-remix, no edits.
- Dyczkowski (anuttaratrikakula.org): free lectures are watch-only; courses
  ($150) and translations are sold = copyrighted, citation-only, no links,
  no reproduction. The user guessed right.

## URL checks (curl, browser UA, 2026-10-20)

| url | code |
|---|---|
| https://www.abhayagiri.org/media/books/amaro_small_boat_great_mountain.pdf | 200 (licence in colophon) |
| https://www.dhammatalks.org/Archive/Writings/Ebooks/Refuge_181215.pdf | 200 (licence p.2) |
| https://www.dhammatalks.org/books/ThingsAsTheyAre/Section0002.html | 200 (licence section) |
