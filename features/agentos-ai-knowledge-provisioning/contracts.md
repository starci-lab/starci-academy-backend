# Contracts · AgentOS AI and knowledge provisioning

## Entity · Workspace AI runtime profile (`workspace-ai-profile`)

Fields: `workspaceId`, `provider`, `chatModel`, `embeddingProfileId`, `credentialStatus`, `providerKeyReference`, `providerSpendUsd`, `lifetimeLimitUsd`, `provisionStatus`, `knowledgeRecoveryOperationId`, `readinessOperationId`, `aiReady`, `lastReadinessRunId`

Evidence: `EV-001`, `EV-005`, `EV-006`, `EV-017`, `EV-020`, `EV-021`, `EV-022`, `EV-025`

## Entity · Immutable vector knowledge artifact (`knowledge-artifact`)

Fields: `artifactId`, `scope`, `version`, `digest`, `embeddingProfile`, `embeddingDimension`, `globalCollectionReference`, `objectReference`, `status`, `publishedAt`

Evidence: `EV-001`, `EV-008`, `EV-009`, `EV-017`, `EV-018`

## Entity · Workspace knowledge binding (`workspace-knowledge-binding`)

Fields: `workspaceId`, `commonArtifactId`, `moduleArtifactIds`, `recoveredVersions`, `stableAlias`, `activeGeneration`, `stagingCollection`, `previousVerifiedGeneration`, `qdrantStatus`, `verifiedOriginCounts`, `verifiedCustomerPointIdentities`, `origins`, `lastUpdatedAt`

Evidence: `EV-001`, `EV-010`, `EV-012`, `EV-017`, `EV-019`

## Entity · Uploaded module document ingestion (`module-document-ingestion`)

Fields: `documentId`, `workspaceId`, `moduleId`, `filename`, `mediaType`, `sizeBytes`, `checksum`, `storageKey`, `objectRetentionStatus`, `scanStatus`, `extractionStatus`, `embeddingStatus`, `indexStatus`, `retrievalRemovedAt`, `objectDeletionDueAt`, `failureCode`, `updatedAt`

Evidence: `EV-001`, `EV-011`, `EV-017`, `EV-028`, `EV-029`

## Entity · Workspace AI readiness run (`ai-readiness-run`)

Fields: `runId`, `operationKind`, `operationId`, `workspaceId`, `modelStatus`, `embeddingStatus`, `qdrantStatus`, `retrievalStatus`, `deadlineMs`, `cooldownMs`, `inputTokenLimit`, `outputTokenLimit`, `startedAt`, `completedAt`, `failureCode`

Evidence: `EV-001`, `EV-014`, `EV-015`, `EV-017`, `EV-023`, `EV-024`

## Operation · provisionAgentosAiRuntime

- Kind/owner: `command` / `backend`
- Inputs: workspaceId, planCode, embeddingProfileId, commonKnowledgeVersion, moduleArtifactRefs, idempotencyKey
- Outputs: workspace AI profile, knowledgeRecoveryOperationId, readinessOperationId, aiReady
- Failures: workspace not owned or not provisionable, OpenRouter management credential unavailable, workspace key mint or secret delivery failed, DeepSeek model unavailable, knowledge artifact unavailable, Qdrant staging generation verification failed while stable alias remains unchanged, readiness test refused while workspace and last verified knowledge remain available
- Evidence: `EV-001`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-017`, `EV-025`, `EV-026`, `EV-027`

## Operation · reconcileAgentosWorkspaceKeyLifecycle

- Kind/owner: `command` / `backend`
- Inputs: workspaceId, lifecycle event, current provider spend, plan creditGrantUsd, idempotencyKey
- Outputs: provider key status, lifetime limitUsd, usage reconciliation status
- Failures: workspace key unavailable, provider usage lookup failed, limit update failed, disable or destroy failed
- Evidence: `EV-006`, `EV-015`, `EV-017`, `EV-020`, `EV-021`, `EV-022`

## Operation · publishAgentosKnowledgeArtifact

- Kind/owner: `command` / `backend`
- Inputs: scope, source version, source digest, embedding profile nivo-qwen3-embedding-8b-4096-v1, embedding dimension 4096
- Outputs: immutable artifact identity, vector digest, published status
- Failures: source package invalid, embedding profile unavailable, vectorization failed, artifact publication failed
- Evidence: `EV-001`, `EV-008`, `EV-009`, `EV-010`, `EV-017`, `EV-018`

## Operation · recoverAgentosWorkspaceKnowledge

- Kind/owner: `command` / `backend`
- Inputs: workspaceId, artifact identities, expected embedding profile nivo-qwen3-embedding-8b-4096-v1, stable workspace alias, idempotencyKey
- Outputs: recovered versions, verified staging generation, atomic alias switch result, previous verified generation, workspace knowledge status
- Failures: workspace unavailable, artifact digest mismatch, embedding geometry mismatch, origin counts or customer point identities mismatch, scoped retrieval verification failed, Qdrant recovery failed with stable alias unchanged, uploaded-knowledge preservation could not be proven
- Evidence: `EV-001`, `EV-004`, `EV-008`, `EV-017`, `EV-019`

## Operation · ingestAgentosModuleDocument

- Kind/owner: `command` / `backend`
- Inputs: workspaceId, moduleId, documentId, quarantined object reference, allowed media type, sizeBytes no greater than 20971520, idempotencyKey
- Outputs: ingestion status, indexed document identity, knowledge origin summary, object retention or deletion status
- Failures: workspace or module not owned, media type not allowed or file exceeds 20971520 bytes, ClamAV unavailable or scan refused, content extraction failed, embedding failed, Qdrant indexing failed
- Evidence: `EV-001`, `EV-011`, `EV-017`, `EV-028`, `EV-029`

## Operation · removeAgentosModuleDocument

- Kind/owner: `mutation` / `backend`
- Inputs: workspaceId, moduleId, documentId, idempotencyKey
- Outputs: retrieval removal timestamp, object deletion status, object deletion due timestamp
- Failures: workspace, module or document not owned, retrieval point removal failed, object deletion scheduling failed
- Evidence: `EV-017`, `EV-028`, `EV-030`

## Operation · myAgentosAiKnowledgeReadiness

- Kind/owner: `query` / `backend`
- Inputs: workspaceId
- Outputs: provider and pinned model, embedding profile and dimension, masked credential status, knowledge artifact versions and origins, Qdrant status, knowledge recovery operation identity, readiness operation identity, aiReady, latest readiness component verdicts, safe failure codes and timestamps
- Failures: workspace not owned, runtime not provisioned, readiness report unavailable
- Evidence: `EV-001`, `EV-002`, `EV-012`, `EV-017`, `EV-023`

## Operation · runAgentosAiReadinessTest

- Kind/owner: `mutation` / `backend`
- Inputs: workspaceId, idempotencyKey
- Outputs: ai_readiness_test operationId, accepted status
- Failures: workspace not owned or not ready for testing, test already running, 300000 ms cooldown active, workspace runtime unreachable
- Evidence: `EV-001`, `EV-014`, `EV-015`, `EV-016`, `EV-017`, `EV-023`, `EV-024`

## Operation · reportAgentosAiReadiness

- Kind/owner: `event` / `backend`
- Inputs: workspace identity, ai_readiness_test operation identity, component verdicts, safe failure code, completedAt
- Outputs: persisted owner-safe readiness summary, aiReady true only after every check passes
- Failures: workspace assertion invalid, run identity stale, report shape invalid
- Evidence: `EV-001`, `EV-012`, `EV-017`, `EV-023`

## Operation · reindexAgentWorkspaceKnowledge

- Kind/owner: `mutation` / `backend`
- Inputs: workspaceId, idempotencyKey
- Outputs: operationId, knowledge reindex status
- Failures: workspace not owned, runtime unavailable, reindex already running
- Evidence: `EV-013`

No field, failure or operation may appear here without routed source evidence.
