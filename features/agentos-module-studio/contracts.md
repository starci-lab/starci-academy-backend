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

### Kind to workbench binding

> ID: `module-workbench-binding`

Fields: `bindingId`, `kindId`, `workbenchKey`, `version`, `status`

Evidence: `EV-011`, `EV-012`, `EV-013`

### Persistent module conversation

> ID: `module-conversation`

Fields: `conversationId`, `workspaceId`, `moduleId`, `status`, `createdAt`, `updatedAt`

Evidence: `EV-011`, `EV-012`, `EV-013`

### Attributed module conversation message

> ID: `module-message`

Fields: `messageId`, `conversationId`, `actorId`, `role`, `content`, `widgetPayloads`, `createdAt`

Evidence: `EV-011`, `EV-012`, `EV-013`

### Trusted typed widget in chat

> ID: `module-widget-instance`

Fields: `widgetId`, `messageId`, `widgetKey`, `schemaVersion`, `payload`, `status`

Evidence: `EV-011`, `EV-012`, `EV-013`

### Owner-safe module operating projection

> ID: `module-operating-profile`

Fields: `moduleId`, `kindId`, `displayName`, `status`, `conversationId`, `workbenchKey`, `configurationReadiness`, `healthSummary`

Evidence: `EV-011`, `EV-012`, `EV-013`

## Operations

| ID | Contract | Owner / actor | Inputs / from | Outputs / to | Failures / idempotency | Evidence |
|---|---|---|---|---|---|---|
| `read-custom-modules` | query · `myAgentosCustomModules` | backend | `workspaceId` | owner-scoped custom module summaries | workspace not found; workspace not ready; workspace not owned | `EV-001` |
| `start-module-intake` | mutation · `startAgentosCustomModuleIntake` | backend | `workspaceId`, `openingMessage`, `idempotencyKey` | module, session, profile, progress and next question | workspace or message refused; duplicate identity mismatch | `EV-001` |
| `read-module-studio` | query · `myAgentosCustomModuleStudio` | backend | `workspaceId`, `moduleId` | module, intake, conversation, resources and specification | module absent or not owned | `EV-001` |
| `answer-module-intake` | mutation · `answerAgentosCustomModuleIntake` | backend | exact session turn | persisted answer, recomputed profile and next question | refused turn preserves accepted state | `EV-001` |
| `prepare-module-attachment` | mutation · attachment preparation | backend | exact module and file metadata | quarantined upload identity | unsupported or unauthorized upload | `EV-001` |
| `finalize-module-attachment` | mutation · attachment finalization | backend | exact upload identity | scanning or ready attachment | scan or ownership refusal | `EV-001` |
| `remove-module-attachment` | mutation · attachment removal | backend | exact attachment identity | removed attachment status | absent or unauthorized attachment | `EV-001` |
| `save-module-secret` | mutation · write-only secret save | backend | provider, label and secret value | masked configured status | validation or storage refusal | `EV-001` |
| `remove-module-secret` | mutation · secret removal | backend | exact integration identity | unconfigured status | absent or unauthorized integration | `EV-001` |
| `publish-custom-module` | mutation · explicit module publish | backend | exact specification version and idempotency identity | installation identity or safe refusal | incomplete, stale or refused specification | `EV-001` |
| `open-module-operating-shell` | owner action | `workspace-owner` | `module-shell-loading` | `module-shell-ready` | operation-specific | `EV-011`, `EV-014` |
| `send-module-message` | owner action | `workspace-owner` | `chat-sending` | `module-shell-ready` | operation-specific | `EV-011`, `EV-014` |
| `load-kind-workbench` | owner action | `workspace-owner` | `workbench-loading` | `workbench-ready` | operation-specific | `EV-011`, `EV-014` |
| `invoke-widget-action` | owner action | `workspace-owner` | `widget-ready` | `module-shell-ready` | operation-specific | `EV-011`, `EV-014` |
| `read-module-settings` | owner action | `workspace-owner` | `module-shell-ready` | `module-settings-ready` | operation-specific | `EV-011`, `EV-014` |
| `save-module-settings` | owner action | `workspace-owner` | `module-settings-saving` | `module-settings-ready` | operation-specific | `EV-011`, `EV-014` |
| `read-module-diagnostics` | owner action | `workspace-owner` | `module-shell-ready` | `module-diagnostics-ready` | operation-specific | `EV-011`, `EV-014` |
