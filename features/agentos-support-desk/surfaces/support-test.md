# Test Support Desk

- Identity: `support-test`
- Route: `/[locale]/agentos/workspaces/[workspaceId]/modules/[moduleId]/test`
- Eyebrow: Trust evidence
- Purpose: Run sandbox conversations and inspect grounded policy evidence.

## Regions

### Conversation scenario

- Identity: `test-scenario`
- Kind: `form`
- Summary: Customer persona, messages and expected behavior.
- Items: `test-messages` (Test conversation)
- Actions: `run-test` (Run test)
- States: `support-test-ready`, `support-test-running`
- Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`

### Evidence

- Identity: `test-evidence`
- Kind: `details`
- Summary: Assertions, sources, policy decisions and draft binding.
- Items: `test-result` (Result)
- Actions: None
- States: `support-test-reviewed`, `support-test-refused`
- Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`
