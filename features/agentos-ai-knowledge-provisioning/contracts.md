# Contracts · AgentOS AI and knowledge provisioning

## Entity · Workspace AI runtime profile (`workspace-ai-profile`)

Fields: `workspaceId`, `provider`, `chatModel`, `credentialStatus`, `providerKeyReference`, `provisionStatus`, `lastReadinessRunId`

Evidence: `EV-001`, `EV-005`, `EV-006`

## Entity · Immutable vector knowledge artifact (`knowledge-artifact`)

Fields: `artifactId`, `scope`, `version`, `digest`, `embeddingProfile`, `objectReference`, `status`, `publishedAt`

Evidence: `EV-001`, `EV-008`, `EV-009`

## Entity · Workspace knowledge binding (`workspace-knowledge-binding`)

Fields: `workspaceId`, `commonArtifactId`, `moduleArtifactIds`, `recoveredVersions`, `qdrantStatus`, `origins`, `lastUpdatedAt`

Evidence: `EV-001`, `EV-010`, `EV-012`

## Entity · Uploaded module document ingestion (`module-document-ingestion`)

Fields: `documentId`, `workspaceId`, `moduleId`, `filename`, `checksum`, `scanStatus`, `extractionStatus`, `embeddingStatus`, `indexStatus`, `failureCode`, `updatedAt`

Evidence: `EV-001`, `EV-011`

## Entity · Workspace AI readiness run (`ai-readiness-run`)

Fields: `runId`, `workspaceId`, `modelStatus`, `embeddingStatus`, `qdrantStatus`, `retrievalStatus`, `startedAt`, `completedAt`, `failureCode`

Evidence: `EV-001`, `EV-014`, `EV-015`

## Operation · provisionAgentosAiRuntime

- Kind/owner: `command` / `backend`
- Inputs: workspaceId, planCode, commonKnowledgeVersion, moduleArtifactRefs, idempotencyKey
- Outputs: workspace AI profile, knowledge recovery operation, readiness run identity
- Failures: workspace not owned or not provisionable, OpenRouter management credential unavailable, workspace key mint or secret delivery failed, DeepSeek model unavailable, knowledge artifact unavailable, Qdrant recovery failed, readiness test refused
- Evidence: `EV-001`, `EV-005`, `EV-006`, `EV-007`, `EV-008`

## Operation · publishAgentosKnowledgeArtifact

- Kind/owner: `command` / `backend`
- Inputs: scope, source version, source digest, embedding profile
- Outputs: immutable artifact identity, vector digest, published status
- Failures: source package invalid, embedding profile unavailable, vectorization failed, artifact publication failed
- Evidence: `EV-001`, `EV-008`, `EV-009`, `EV-010`

## Operation · recoverAgentosWorkspaceKnowledge

- Kind/owner: `command` / `backend`
- Inputs: workspaceId, artifact identities, expected embedding profile, idempotencyKey
- Outputs: recovered versions, workspace knowledge status
- Failures: workspace unavailable, artifact digest mismatch, embedding geometry mismatch, Qdrant recovery failed, uploaded-knowledge preservation could not be proven
- Evidence: `EV-001`, `EV-004`, `EV-008`

## Operation · ingestAgentosModuleDocument

- Kind/owner: `command` / `backend`
- Inputs: workspaceId, moduleId, documentId, scan-ready object reference, idempotencyKey
- Outputs: ingestion status, indexed document identity, knowledge origin summary
- Failures: workspace or module not owned, document not scan-ready, content extraction failed, embedding failed, Qdrant indexing failed
- Evidence: `EV-001`, `EV-011`

## Operation · myAgentosAiKnowledgeReadiness

- Kind/owner: `query` / `backend`
- Inputs: workspaceId
- Outputs: provider and pinned model, masked credential status, knowledge artifact versions and origins, Qdrant status, latest readiness component verdicts, safe failure codes and timestamps
- Failures: workspace not owned, runtime not provisioned, readiness report unavailable
- Evidence: `EV-001`, `EV-002`, `EV-012`

## Operation · runAgentosAiReadinessTest

- Kind/owner: `mutation` / `backend`
- Inputs: workspaceId, idempotencyKey
- Outputs: readiness run identity, accepted status
- Failures: workspace not owned or not ready for testing, test already running, test budget or rate limit exceeded, workspace runtime unreachable
- Evidence: `EV-001`, `EV-014`, `EV-015`, `EV-016`

## Operation · reportAgentosAiReadiness

- Kind/owner: `event` / `backend`
- Inputs: workspace identity, run identity, component verdicts, safe failure code, completedAt
- Outputs: persisted owner-safe readiness summary
- Failures: workspace assertion invalid, run identity stale, report shape invalid
- Evidence: `EV-001`, `EV-012`

## Operation · reindexAgentWorkspaceKnowledge

- Kind/owner: `mutation` / `backend`
- Inputs: workspaceId, idempotencyKey
- Outputs: operationId, knowledge reindex status
- Failures: workspace not owned, runtime unavailable, reindex already running
- Evidence: `EV-013`

No field, failure or operation may appear here without routed source evidence.
