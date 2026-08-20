# Contracts · AgentOS workspace lifecycle and control center

## Entity · AgentOS workspace (`entity-1`)

Fields: `id`, `name`, `status`, `hostname`, `plan`, `runtime`, `stack`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

## Entity · Solution installation (`entity-2`)

Fields: `installationId`, `moduleKey`, `version`, `status`, `generated agents`, `knowledge bindings`

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

## Operation · orderAgentOs

- Kind/owner: `mutation` / `backend`
- Inputs: catalogItemSlug, catalogTierId
- Outputs: catalog order
- Failures: order refused
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

## Operation · myAgentWorkspaceControlCenter

- Kind/owner: `query` / `backend`
- Inputs: workspaceId
- Outputs: workspace aggregate snapshot
- Failures: not owned or not found
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

## Operation · installAgentosSolutionModule

- Kind/owner: `mutation` / `backend`
- Inputs: workspaceId, moduleKey
- Outputs: installation in provisioning
- Failures: catalog or ownership refusal
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

## Operation · issueAgentWorkspaceAppLaunch

- Kind/owner: `mutation` / `backend`
- Inputs: workspaceId
- Outputs: short-lived secure launch
- Failures: workspace inactive or not owned
- Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

No field, failure or operation may appear here without routed source evidence.
