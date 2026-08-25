# Operate Support Desk

- Identity: `support-operate`
- Route: `/[locale]/agentos/workspaces/[workspaceId]/modules/[moduleId]/operate`
- Eyebrow: Internal support operations
- Purpose: Collaborate internally in chat while operating customers and tickets in the workbench.

## Regions

### Operations chat

- Identity: `ops-chat`
- Kind: `conversation`
- Summary: Primary internal chat receives proactive notices and operator collaboration.
- Items: `ops-message` (Internal message)
- Actions: `new-ops-chat` (New collaboration chat)
- States: `ops-session-active`, `ops-notice-ready`
- Evidence: `EV-SD-001`, `EV-SD-003`

### Support workbench

- Identity: `support-workbench`
- Kind: `workbench`
- Summary: Queue, customer conversation, customer, ticket, SLA, suggested reply, sources and controls.
- Items: `conversation` (Customer conversation), `ticket` (Ticket), `sla` (SLA), `sources` (Sources)
- Actions: `approve-reply` (Approve reply), `takeover` (Take over), `resolve-ticket` (Resolve)
- States: `ticket-active`, `human-takeover`, `ticket-resolved`, `support-degraded`
- Evidence: `EV-SD-001`, `EV-SD-003`
