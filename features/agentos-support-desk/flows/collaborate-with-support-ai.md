# Operate Support Desk through internal collaboration

- Identity: `collaborate-with-support-ai`
- Trigger: An authorized support operator opens Operate.
- Evidence: `EV-SD-001`, `EV-SD-003`

## Steps

1. **Open the designated primary operations chat**
   - Actor: `support-operator`
   - Surface: `support-operate`
   - State: `ops-session-active`
   - Result: The internal collaboration session resumes independently of all customer conversations
2. **Receive an AI notice produced from a registered event or approved schedule**
   - Actor: `support-operator`
   - Surface: `support-operate`
   - State: `ops-notice-ready`
   - Result: The notice includes source, severity, reason, affected identity and next action and obeys deduplication and notification policy
3. **Inspect queues, customer conversation, ticket, SLA, suggested response, sources and controls**
   - Actor: `support-operator`
   - Surface: `support-operate`
   - State: `ticket-active`
   - Result: The right workbench preserves the exact selected operational identity
4. **Assign, approve, take over, resolve or ask AI for analysis**
   - Actor: `support-operator`
   - Surface: `support-operate`
   - State: `ops-session-active`
   - Result: Every mutation is permission-checked, attributable and idempotent

## Outcomes

- Internal collaboration and customer messaging remain different identities
- Additional Execute chats may be created but never replace the primary operations session
