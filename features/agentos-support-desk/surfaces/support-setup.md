# Set up Support Desk

- Identity: `support-setup`
- Route: `/[locale]/agentos/workspaces/[workspaceId]/modules/[moduleId]/setup`
- Eyebrow: Private business setup
- Purpose: AI-guided interview with one candidate revision.

## Regions

### Private Setup chat

- Identity: `setup-chat`
- Kind: `conversation`
- Summary: AI asks the highest-risk unresolved question and preserves one draft.
- Items: `setup-message` (Setup message)
- Actions: `answer-setup` (Send)
- States: `setup-draft-open`, `setup-interviewing`, `setup-review-ready`
- Evidence: `EV-SD-001`, `EV-SD-002`

### Business understanding

- Identity: `business-understanding`
- Kind: `summary`
- Summary: Gate coverage, provenance, conflicts and unresolved risks.
- Items: `gate-progress` (Understanding progress), `active-setup` (Business setup in use)
- Actions: `test-candidate` (Test), `apply-candidate` (Apply), `abandon-candidate` (Abandon)
- States: `setup-interviewing`, `setup-review-ready`, `context-applying`, `context-active`
- Evidence: `EV-SD-001`, `EV-SD-002`
