# Contracts · AgentOS workspace lifecycle and control center

## Entity · AgentOS catalogue order (`catalog-order`)

Fields: `id`, `status`, `catalogItemSlug`, `catalogTierId`, `invoiceId`, `workspaceId`

Evidence: `EV-002`, `EV-003`, `EV-014`

## Entity · Wallet invoice (`wallet-invoice`)

Fields: `id`, `status`, `amount`, `currency`, `orderId`

Evidence: `EV-001`, `EV-004`, `EV-014`, `EV-015`

## Entity · AgentOS workspace (`agentos-workspace`)

Fields: `id`, `name`, `status`, `hostname`, `plan`, `runtime`, `stack`

Evidence: `EV-002`, `EV-005`, `EV-010`

## Entity · Solution installation (`solution-installation`)

Fields: `installationId`, `workspaceId`, `moduleKey`, `version`, `status`, `generated agents`, `knowledge bindings`

Evidence: `EV-006`, `EV-011`

## Entity · Short-lived OpenClaw launch (`openclaw-launch`)

Fields: `workspaceId`, `launchUrl`, `expiresAt`, `state`

Evidence: `EV-007`, `EV-008`, `EV-012`, `EV-013`

## Operation · orderCatalogItem

- Kind/owner: `mutation` / `backend`
- Inputs: catalogItemSlug = nivo-ai-agent, catalogTierId
- Outputs: PendingPayment catalogue order, linked Unpaid invoice
- Failures: catalogue or order refusal
- Evidence: `EV-003`, `EV-014`

## Operation · openAgentosPaymentWaypoint

- Kind/owner: `redirect` / `frontend`
- Inputs: orderId, linked invoiceId, safe internal returnTo
- Outputs: Wallet route preserving exact AgentOS continuation
- Failures: missing order correlation or unsafe return target
- Evidence: `EV-001`, `EV-003`, `EV-004`

## Operation · payInvoice

- Kind/owner: `mutation` / `backend`
- Inputs: invoiceId
- Outputs: paid invoice
- Failures: insufficient balance or payment refusal
- Evidence: `EV-004`, `EV-015`

## Operation · myAgentWorkspaceControlCenter

- Kind/owner: `query` / `backend`
- Inputs: workspaceId
- Outputs: exact owner-scoped workspace aggregate
- Failures: not owned or not found
- Evidence: `EV-010`

## Operation · installAgentosSolutionModule

- Kind/owner: `mutation` / `backend`
- Inputs: workspaceId, moduleKey
- Outputs: installation in provisioning
- Failures: catalogue, duplicate installation or ownership refusal
- Evidence: `EV-011`

## Operation · issueAgentWorkspaceAppLaunch

- Kind/owner: `mutation` / `backend`
- Inputs: workspaceId
- Outputs: launchId, safe redirectUrl, expiresAt
- Failures: workspace inactive, application unavailable or not owned
- Evidence: `EV-012`

## Operation · renewAgentWorkspaceAppLaunch

- Kind/owner: `mutation` / `backend`
- Inputs: launchId
- Outputs: launchId, expiresAt
- Failures: launch not renewable
- Evidence: `EV-008`, `EV-013`

## Operation · revokeAgentWorkspaceAppLaunch

- Kind/owner: `mutation` / `backend`
- Inputs: launchId
- Outputs: launchId, revoked
- Failures: launch not revocable
- Evidence: `EV-008`, `EV-013`

No field, failure or operation may appear here without routed source evidence.
