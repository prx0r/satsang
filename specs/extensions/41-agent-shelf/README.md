# 41 — Agent shelf (profile-hosting for third-party assistants)

**Thesis:** we never build the assistant. Meta's, OpenAI's, anyone's —
they all get smarter the moment they can read the user's profile, taste,
schedules and contacts. We host the structured self; they do the talking.
The email gets written by the user's own bot, with our data, under the
user's own credentials. We never send mail, never impersonate, never hold
passwords.

**What the shelf holds (all already specified, wired here as one surface):**
- Profile + taste + practice log + retreat logs (10 store, `/me/export`).
- Directory reads: search, get_teacher/tradition/topic, find_places,
  get_place (contacts included), find_retreats, get_schedule,
  guide_me, plan_retreat.
- Drafts, never sends: compose_booking (place + programme + dates →
  email text with the centre's own booking instructions embedded).

**Consent model:** the user grants THEIR agent scoped access to THEIR
profile — read taste, read schedule, draft bookings, never send, never
share notes. Device-claim auth (10) extends to agent-claim: a token the
user can see, scope and revoke. Every draft shows its sources (which
contact, which schedule, checked when) so the user verifies before sending.

**Files:** AGENT-SHELF.md (the pattern + task→tool map), draft_booking
tool spec, consent/scopes spec, llms.txt content spec, REPORT + MERGE-NOTES.
