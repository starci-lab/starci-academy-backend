# Contracts · AgentOS custom module studio

## Entity · Workspace-owned custom module (`custom-module`)

Fields: `moduleId`, `workspaceId`, `name`, `status`, `readinessPercent`, `specificationVersion`, `publishedInstallationId`, `createdAt`, `updatedAt`

Evidence: `EV-001`

## Entity · Adaptive module intake session (`module-intake-session`)

Fields: `sessionId`, `moduleId`, `status`, `currentQuestion`, `missingFields`, `progress`, `updatedAt`

Evidence: `EV-001`

## Entity · Persisted module intake turn (`module-intake-message`)

Fields: `messageId`, `sessionId`, `role`, `content`, `attachmentIds`, `createdAt`

Evidence: `EV-001`

## Entity · Quarantined module attachment (`module-attachment`)

Fields: `attachmentId`, `moduleId`, `filename`, `mediaKind`, `mimeType`, `size`, `status`, `failureCode`, `createdAt`

Evidence: `EV-001`

## Entity · Masked module integration configuration (`module-integration-status`)

Fields: `integrationId`, `moduleId`, `provider`, `label`, `configured`, `maskedHint`, `updatedAt`

Evidence: `EV-001`

## Entity · Versioned reviewable custom module specification (`module-specification`)

Fields: `specificationId`, `moduleId`, `version`, `status`, `profileSnapshot`, `attachmentRefs`, `integrationRequirements`, `generatedAt`

Evidence: `EV-001`

## Operation · myAgentosCustomModules

- Kind/owner: `query` / `backend`
- Inputs: workspaceId
- Outputs: owner-scoped custom module summaries
- Failures: workspace not found, workspace not ready, workspace not owned
- Evidence: `EV-001`

## Operation · startAgentosCustomModuleIntake

- Kind/owner: `mutation` / `backend`
- Inputs: workspaceId, openingMessage, idempotencyKey
- Outputs: moduleId, sessionId, persisted opening answer, structured profile, progress, missing fields, next question
- Failures: workspace not ready, workspace not owned, opening message refused, duplicate identity mismatch
- Evidence: `EV-001`

## Operation · myAgentosCustomModuleStudio

- Kind/owner: `query` / `backend`
- Inputs: workspaceId, moduleId
- Outputs: custom module, intake session, conversation, structured profile, attachments, masked integration statuses, current specification
- Failures: module not found, workspace or module not owned
- Evidence: `EV-001`

## Operation · answerAgentosCustomModuleIntake

- Kind/owner: `mutation` / `backend`
- Inputs: moduleId, sessionId, message, correction target when applicable, idempotencyKey
- Outputs: persisted turn, structured profile, progress, missing fields, next question or completion, module specification when complete
- Failures: session not found, module or session not owned, message refused, intake engine unavailable
- Evidence: `EV-001`

## Operation · prepareAgentosModuleAttachmentUpload

- Kind/owner: `mutation` / `backend`
- Inputs: moduleId, filename, mimeType, size, idempotencyKey
- Outputs: attachmentId, short-lived quarantine upload grant, expiresAt
- Failures: module not owned, unsupported file, file limit exceeded, upload grant unavailable
- Evidence: `EV-001`

## Operation · finalizeAgentosModuleAttachment

- Kind/owner: `mutation` / `backend`
- Inputs: attachmentId, checksum
- Outputs: attachment scanning status
- Failures: attachment not owned, upload absent or expired, checksum mismatch, scan refused or unavailable
- Evidence: `EV-001`

## Operation · removeAgentosModuleAttachment

- Kind/owner: `mutation` / `backend`
- Inputs: attachmentId, idempotencyKey
- Outputs: attachment removed
- Failures: attachment not owned, attachment locked by publishing
- Evidence: `EV-001`

## Operation · saveAgentosModuleIntegrationSecret

- Kind/owner: `mutation` / `backend`
- Inputs: moduleId, provider, label, secret value, idempotencyKey
- Outputs: masked configured integration status
- Failures: module not owned, provider unsupported, secret invalid, encryption or storage unavailable
- Evidence: `EV-001`

## Operation · removeAgentosModuleIntegrationSecret

- Kind/owner: `mutation` / `backend`
- Inputs: integrationId, idempotencyKey
- Outputs: integration no longer configured
- Failures: integration not owned, integration locked by publishing
- Evidence: `EV-001`

## Operation · publishAgentosCustomModule

- Kind/owner: `mutation` / `backend`
- Inputs: moduleId, specificationVersion, acknowledgedPublish = true, idempotencyKey
- Outputs: publish operation identity, accepted status, installationId when available
- Failures: module not owned, intake incomplete, specification version stale, attachment not scan-ready, required integration not configured, publish not acknowledged, installation refused
- Evidence: `EV-001`

No field, failure or operation may appear here without routed source evidence.
