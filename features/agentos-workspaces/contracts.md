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

## Entity · Short-lived n8n launch (`n8n-launch`)

Fields: `workspaceId`, `app = N8N`, `launchId`, `redirectUrl`, `expiresAt`, `state`

Evidence: `EV-019`, `EV-020`, `EV-025`

## Entity · Workspace operation (`workspace-operation`)

Fields: `operationId`, `workspaceId`, `kind`, `status`, `requestedAt`, `completedAt`, `failure`

Evidence: `EV-018`, `EV-021`, `EV-025`

## Entity · Verified workspace backup (`workspace-backup`)

Fields: `backupId`, `workspaceId`, `reason`, `status`, `checksum`, `verifiedAt`

Evidence: `EV-021`, `EV-025`

## Entity · MCP-Qdrant knowledge runtime (`knowledge-runtime`)

Fields: `mcpHealth`, `qdrantHealth`, `documentCount`, `origins`, `lastUpdatedAt`, `reindexStatus`

Evidence: `EV-022`, `EV-023`, `EV-024`, `EV-025`

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
- Inputs: workspaceId, app = OPENCLAW | N8N
- Outputs: launchId, safe redirectUrl, expiresAt
- Failures: workspace inactive, application unavailable or not owned
- Evidence: `EV-012`, `EV-019`, `EV-020`, `EV-025`

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

## Operation · updateAgentWorkspaceRuntime

- Kind/owner: `mutation` / `backend`
- Inputs: workspaceId, idempotencyKey
- Outputs: operationId, accepted status, target supported release
- Failures: not owned, workspace not ready, update already running, unsupported release
- Evidence: `EV-018`, `EV-025`

## Operation · requestAgentWorkspacePlanChange

- Kind/owner: `mutation` / `backend`
- Inputs: workspaceId, catalogTierId, idempotencyKey
- Outputs: adjustment orderId, linked invoiceId, awaiting-payment status
- Failures: not owned, same or invalid plan, catalogue refusal
- Evidence: `EV-001`, `EV-025`

## Operation · applyPaidAgentWorkspacePlanChange

- Kind/owner: `command` / `backend`
- Inputs: paid adjustment orderId, workspaceId
- Outputs: operationId, plan-applying status
- Failures: invoice not paid, capacity unavailable, workspace no longer eligible
- Evidence: `EV-001`, `EV-025`

## Operation · createAgentWorkspaceBackup

- Kind/owner: `mutation` / `backend`
- Inputs: workspaceId, idempotencyKey
- Outputs: operationId, backupId after verification
- Failures: not owned, workspace not ready, snapshot or verification failure
- Evidence: `EV-021`, `EV-025`

## Operation · restartAgentWorkspaceRuntime

- Kind/owner: `mutation` / `backend`
- Inputs: workspaceId, idempotencyKey
- Outputs: operationId, non-destructive restart accepted
- Failures: not owned, workspace not ready, restart already running
- Evidence: `EV-021`, `EV-025`

## Operation · rebuildAgentWorkspaceRuntime

- Kind/owner: `mutation` / `backend`
- Inputs: workspaceId, acknowledgedRebuild = true, idempotencyKey
- Outputs: operationId, fresh verified backupId, rebuild accepted
- Failures: not owned, confirmation missing, backup or verification failure, reinstall failure
- Evidence: `EV-021`, `EV-025`

## Operation · myAgentWorkspaceOperations

- Kind/owner: `query` / `backend`
- Inputs: workspaceId
- Outputs: owner-scoped operation history and current operation
- Failures: not owned or not found
- Evidence: `EV-025`

## Operation · myAgentWorkspaceKnowledgeRuntime

- Kind/owner: `query` / `backend`
- Inputs: workspaceId
- Outputs: MCP health, Qdrant health, documentCount, origins, lastUpdatedAt, reindexStatus
- Failures: not owned, runtime unavailable
- Evidence: `EV-022`, `EV-023`, `EV-024`, `EV-025`

## Operation · reindexAgentWorkspaceKnowledge

- Kind/owner: `mutation` / `backend`
- Inputs: workspaceId, idempotencyKey
- Outputs: operationId, knowledge-reindexing status
- Failures: not owned, runtime unavailable, reindex already running
- Evidence: `EV-022`, `EV-025`

No field, failure or operation may appear here without routed source evidence.
