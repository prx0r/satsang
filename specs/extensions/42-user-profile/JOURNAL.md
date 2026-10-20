# JOURNAL kinds mapping (2026-10-20)

Ochemapp's journal has entry kinds; we don't build a second journal table.
Each kind lands in an existing record:

| kind | lands in |
|---|---|
| practice_session | `practice_log` row (+note, +quality) |
| insight | essay (curation form essay, attachedTo self or topic) |
| question | teacher-prompt card (retreat log / prep_for) |
| book_note | works log entry (Read + note) |
| dream / symbol / mood_pattern | essay, private (no dream interpretation product) |
| ritual_note | practice_log note on the ritual practice |
| guidance_hypothesis / progress_marker | retreat-log notes / journey checkpoint |
| journal_entry | essay, private by default |

Rules: journal content is private by default, exportable in `/me/export`,
deletable with `DELETE /me`. Essays publish only per item with moderation
(05). No dream-symbol dictionary, no AI interpretation of dreams — the
journal records, it doesn't divine.
