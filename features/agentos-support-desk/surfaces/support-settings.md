# Support Desk settings

- Identity: `support-settings`
- Route: `/[locale]/agentos/workspaces/[workspaceId]/modules/[moduleId]/settings`
- Eyebrow: Readiness and integrations
- Purpose: Configure knowledge, policy, mode and write-only integrations.

## Regions

### Go-live gates

- Identity: `go-live-readiness`
- Kind: `summary`
- Summary: Context, knowledge, policy, channel and credential readiness.
- Items: `readiness-axis` (Readiness)
- Actions: `enable-live` (Enable Live), `pause-live` (Pause)
- States: `context-active`, `channel-ready`, `support-live`, `support-paused`
- Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`

### Telegram

- Identity: `telegram-credential`
- Kind: `form`
- Summary: Write-only bot credential and masked verification status.
- Items: `telegram-token` (Bot token)
- Actions: `save-token` (Save and verify)
- States: `channel-unverified`, `channel-verifying`, `channel-ready`, `channel-refused`
- Evidence: `EV-SD-001`, `EV-SD-004`

### Support knowledge

- Identity: `support-knowledge`
- Kind: `collection`
- Summary: Nivo bootstrap and customer-owned file collections.
- Items: `knowledge-files` (Files)
- Actions: None
- States: `context-active`
- Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`
