# MERGE-NOTES — 41-agent-shelf (for the lead agent)

## Merge steps
```bash
cd <satsang>
# docs: AGENT-SHELF.md + CONSENT.md -> docs/ (agent platform law)
# compose_booking -> AGENT_TOOLS with resolver per file (reads place.contact
#   + programmes + checked dates; refuses gracefully without contacts)
# scopes -> profile store (10 tables: agent_claims {agent, scopes, expires})
# llms.txt/CONSENT -> web-worker discovery outputs (ROADMAP 7 bundle)
```

## Before deploy
- The "drafts, never sends" line is load-bearing: no SMTP credentials, no
  send path, no exceptions — audit it.
- Agent-claim UX shows scopes in words with expiry + revoke; ship that UI
  before any agent onboarding.
- First pilot: one external assistant reading taste + drafting one booking
  email end to end, user confirming send in their own mail app.
