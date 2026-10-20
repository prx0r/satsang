# Agent consent + scopes (2026-10-20)

Extends the device-claim pattern (10) to agents. One table, user-visible,
revocable per agent.

## Scopes

| scope | grants | never grants |
|---|---|---|
| `taste:read` | facets, chips, followed teachers/traditions | raw picks, notes |
| `schedule:read` | sessions, retreat logs (plan-level), reminders | keepsake contents, uploads |
| `practice:read` | active practices, streaks, stats | step-by-step logs, reflections |
| `draft:bookings` | compose_booking output | sending, payment, personal data entry |
| `saves:write` | save talks/places/collections | publishing as the user |

Default grant: taste:read only. Everything else is asked per task, in
words ("let it draft booking emails?"), expirable (30 days), revocable
anytime from the profile page. Agents authenticate per call; there are no
long-lived master tokens.

## llms.txt content spec (what agents read first)

- What this directory is + licence (CC BY 4.0 curation, metadata terms).
- Tool list with one-line shapes + the ground rules (AGENT-SHELF §rules).
- Canonical URL patterns for citation.
- Freshness rule: re-check dated claims per call; show checked dates.
- Privacy boundary: what never leaves accounts.
- Pointer to llms-full.txt (every record kind, one example each).
