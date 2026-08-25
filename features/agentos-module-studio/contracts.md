# Contracts · AgentOS module studio and adaptive operating shell

## Entities

### Workspace-owned custom module

> ID: `custom-module`

Fields: `moduleId`, `workspaceId`, `name`, `status`, `readinessPercent`, `specificationVersion`, `publishedInstallationId`, `createdAt`, `updatedAt`

Evidence: `EV-001`

### Adaptive module intake session

> ID: `module-intake-session`

Fields: `sessionId`, `moduleId`, `status`, `currentQuestion`, `missingFields`, `progress`, `updatedAt`

Evidence: `EV-001`

### Persisted module intake turn

> ID: `module-intake-message`

Fields: `messageId`, `sessionId`, `role`, `content`, `attachmentIds`, `createdAt`

Evidence: `EV-001`

### Quarantined module attachment

> ID: `module-attachment`

Fields: `attachmentId`, `moduleId`, `filename`, `mediaKind`, `mimeType`, `size`, `status`, `failureCode`, `createdAt`

Evidence: `EV-001`

### Masked module integration configuration

> ID: `module-integration-status`

Fields: `integrationId`, `moduleId`, `provider`, `label`, `configured`, `maskedHint`, `updatedAt`

Evidence: `EV-001`

### Versioned reviewable custom module specification

> ID: `module-specification`

Fields: `specificationId`, `moduleId`, `version`, `status`, `profileSnapshot`, `attachmentRefs`, `integrationRequirements`, `generatedAt`

Evidence: `EV-001`

### Extensible module kind definition

> ID: `module-kind-definition`

Fields: `kindId`, `version`, `displayName`, `configurationSchema`, `capabilities`, `workbenchKey`, `widgetKeys`, `status`

Evidence: `EV-011`, `EV-012`, `EV-013`

### Kind-specific module test run

> ID: `module-kind-test-run`

Fields: `testRunId`, `moduleId`, `kindVersion`, `testContractVersion`, `contextVersionId`, `fixture`, `assertions`, `status`, `warnings`, `createdAt`

Evidence: `EV-017`

### Kind to workbench binding

> ID: `module-workbench-binding`

Fields: `bindingId`, `kindId`, `workbenchKey`, `version`, `status`

Evidence: `EV-011`, `EV-012`, `EV-013`

### Typed module chat session

> ID: `module-chat-session`

Fields: `sessionId`, `workspaceId`, `moduleId`, `sessionType`, `title`, `status`, `createdAt`, `updatedAt`, `archivedAt`

Evidence: `EV-011`, `EV-012`, `EV-013`, `EV-015`

### Attributed module conversation message

> ID: `module-message`

Fields: `messageId`, `sessionId`, `actorId`, `role`, `content`, `widgetPayloads`, `effectiveContextVersionId`, `createdAt`

Evidence: `EV-011`, `EV-012`, `EV-013`, `EV-015`

### Versioned module business context

> ID: `module-business-context-version`

Fields: `contextVersionId`, `moduleId`, `setupSessionId`, `version`, `status`, `inheritedWorkspaceContextRef`, `moduleOverrides`, `missingFields`, `createdAt`, `appliedAt`

Evidence: `EV-015`

### Immutable effective module context

> ID: `module-effective-context-snapshot`

Fields: `effectiveContextVersionId`, `moduleId`, `sourceContextVersionId`, `resolvedProfile`, `activatedAt`, `supersededAt`

Evidence: `EV-015`

### Trusted typed widget in chat

> ID: `module-widget-instance`

Fields: `widgetId`, `messageId`, `widgetKey`, `schemaVersion`, `payload`, `status`

Evidence: `EV-011`, `EV-012`, `EV-013`

### Owner-safe module operating projection

> ID: `module-operating-profile`

Fields: `moduleId`, `kindId`, `displayName`, `status`, `activeSessionId`, `activeContextVersionId`, `workbenchKey`, `configurationReadiness`, `healthSummary`

Evidence: `EV-011`, `EV-012`, `EV-013`

## Operations

| ID | Contract | Owner / actor | Inputs / from | Outputs / to | Failures / idempotency | Evidence |
|---|---|---|---|---|---|---|
| `read-custom-modules` | query · `myAgentosCustomModules` | backend | workspaceId | owner-scoped custom module summaries | workspace not found; workspace not ready; workspace not owned | `EV-001` |
| `start-module-intake` | mutation · `startAgentosCustomModuleIntake` | backend | workspaceId, openingMessage, idempotencyKey | moduleId; sessionId; persisted opening answer; structured profile; progress; missing fields; next question | workspace not ready; workspace not owned; opening message refused; duplicate identity mismatch | `EV-001` |
| `read-module-studio` | query · `myAgentosCustomModuleStudio` | backend | workspaceId, moduleId | custom module; intake session; conversation; structured profile; attachments; masked integration statuses; current specification | module not found; workspace or module not owned | `EV-001` |
| `answer-module-intake` | mutation · `answerAgentosCustomModuleIntake` | backend | moduleId, sessionId, message, correction target when applicable, idempotencyKey | persisted turn; structured profile; progress; missing fields; next question or completion; module specification when complete | session not found; module or session not owned; message refused; intake engine unavailable | `EV-001` |
| `prepare-module-attachment` | mutation · `prepareAgentosModuleAttachmentUpload` | backend | moduleId, filename, mimeType, size, idempotencyKey | attachmentId; short-lived quarantine upload grant; expiresAt | module not owned; unsupported file; file limit exceeded; upload grant unavailable | `EV-001` |
| `finalize-module-attachment` | mutation · `finalizeAgentosModuleAttachment` | backend | attachmentId, checksum | attachment scanning status | attachment not owned; upload absent or expired; checksum mismatch; scan refused or unavailable | `EV-001` |
| `remove-module-attachment` | mutation · `removeAgentosModuleAttachment` | backend | attachmentId, idempotencyKey | attachment removed | attachment not owned; attachment locked by publishing | `EV-001` |
| `save-module-secret` | mutation · `saveAgentosModuleIntegrationSecret` | backend | moduleId, provider, label, secret value, idempotencyKey | masked configured integration status | module not owned; provider unsupported; secret invalid; encryption or storage unavailable | `EV-001` |
| `remove-module-secret` | mutation · `removeAgentosModuleIntegrationSecret` | backend | integrationId, idempotencyKey | integration no longer configured | integration not owned; integration locked by publishing | `EV-001` |
| `publish-custom-module` | mutation · `publishAgentosCustomModule` | backend | moduleId, specificationVersion, acknowledgedPublish = true, idempotencyKey | publish operation identity; accepted status; installationId when available | module not owned; intake incomplete; specification version stale; attachment not scan-ready; required integration not configured; publish not acknowledged; installation refused | `EV-001` |
| `open-module-setup-session` | owner action · Open or resume the single module setup session | `workspace-owner` | `context-setup-required` | `setup-session-ready` | unique module plus setup session type | `EV-015` |
| `answer-module-setup` | owner action · Persist a private setup turn and recompute the draft context | `workspace-owner` | `setup-session-ready` | `context-draft` | operation-specific | `EV-015` |
| `publish-module-context` | owner action · Explicitly apply one exact module context version | `workspace-owner` | `context-publishing` | `context-active` | context-version-specific | `EV-015` |
| `read-module-chat-sessions` | owner action · Read the fixed Setup entry and execute chat session collection | `workspace-owner` | `module-shell-loading` | `execute-session-active` | read-only | `EV-015` |
| `create-execute-session` | owner action · Create a new execute chat session | `workspace-owner` | `execute-session-active` | `execute-session-empty` | operation-specific | `EV-015` |
| `rename-execute-session` | owner action · Rename one execute chat session | `workspace-owner` | `execute-session-active` | `execute-session-active` | operation-specific | `EV-015` |
| `archive-execute-session` | owner action · Archive one execute chat session | `workspace-owner` | `execute-session-active` | `execute-session-archived` | operation-specific | `EV-015` |
| `open-module-operating-shell` | owner action · Open module operating shell | `workspace-owner` | `module-shell-loading` | `module-shell-ready` | operation-specific | `EV-011`, `EV-014` |
| `send-module-message` | owner action · Send module conversation message | `workspace-owner` | `chat-sending` | `module-shell-ready` | operation-specific | `EV-011`, `EV-014` |
| `load-kind-workbench` | owner action · Resolve and load kind workbench | `workspace-owner` | `workbench-loading` | `workbench-ready` | operation-specific | `EV-011`, `EV-014` |
| `invoke-widget-action` | owner action · Invoke trusted widget action | `workspace-owner` | `widget-ready` | `module-shell-ready` | operation-specific | `EV-011`, `EV-014` |
| `read-module-settings` | owner action · Read module-scoped settings | `workspace-owner` | `module-shell-ready` | `module-settings-ready` | operation-specific | `EV-011`, `EV-014` |
| `save-module-settings` | owner action · Save module-scoped settings | `workspace-owner` | `module-settings-saving` | `module-settings-ready` | operation-specific | `EV-011`, `EV-014` |
| `read-module-diagnostics` | owner action · Read advanced module diagnostics | `workspace-owner` | `module-shell-ready` | `module-diagnostics-ready` | operation-specific | `EV-011`, `EV-014` |
| `open-module-test` | owner action · Open the kind-specific sandbox test workbench | `workspace-owner` | `context-review-ready` | `module-test-ready` | installation-and-context-version | `EV-017` |
| `run-module-test` | owner action · Run one isolated kind-specific test contract | `workspace-owner` | `module-test-ready` | `module-test-running` | test-run-key | `EV-017` |
