# Contracts · Operations dashboard

## Entity · Operations snapshot (`entity-1`)

Fields: `expert sites`, `AgentOS workspaces`, `pod reachability`, `domains`, `wallet balance`, `unpaid invoice`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## Operation · myExpertSites

- Kind/owner: `query` / `backend`
- Inputs: none
- Outputs: owned expert sites
- Failures: transport or API refusal
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## Operation · myAgentWorkspace

- Kind/owner: `query` / `backend`
- Inputs: none
- Outputs: owned AgentOS workspace
- Failures: not found or refusal
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## Operation · myDomains

- Kind/owner: `query` / `backend`
- Inputs: none
- Outputs: owned domains
- Failures: transport or API refusal
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## Operation · myWallet

- Kind/owner: `query` / `backend`
- Inputs: none
- Outputs: wallet balance
- Failures: transport or API refusal
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

No field, failure or operation may appear here without routed source evidence.
