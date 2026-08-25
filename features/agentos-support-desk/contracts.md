# Business contracts

## Entities

### Installed Support Desk identity

- Identity: `support-desk-module`
- Fields: `moduleId`, `workspaceId`, `kindKey`, `status`, `operatingMode`, `activeContextVersionId`, `primaryOpsSessionId`
- Evidence: `EV-SD-006`

### Public-safe Nivo support bootstrap

- Identity: `nivo-support-knowledge-package`
- Fields: `packageKey`, `version`, `digest`, `documents`, `testFixtures`
- Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`

### Private candidate revision interview

- Identity: `support-setup-session`
- Fields: `sessionId`, `moduleId`, `basedOnContextVersionId`, `status`, `draftDigest`, `createdBy`, `createdAt`
- Evidence: `EV-SD-001`, `EV-SD-002`

### Business-understanding gate

- Identity: `support-setup-gate`
- Fields: `gateKey`, `required`, `status`, `facts`, `provenance`, `conflicts`, `updatedAt`
- Evidence: `EV-SD-001`, `EV-SD-002`

### Immutable applied business context

- Identity: `support-context-version`
- Fields: `contextVersionId`, `moduleId`, `ordinal`, `digest`, `setupSessionId`, `appliedBy`, `appliedAt`
- Evidence: `EV-SD-001`, `EV-SD-002`

### Customer-owned knowledge source

- Identity: `support-knowledge-source`
- Fields: `sourceId`, `moduleId`, `files`, `status`, `revision`, `indexRevision`, `permissionScope`
- Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`

### Write-only integration credential status

- Identity: `support-credential-binding`
- Fields: `bindingId`, `moduleId`, `provider`, `label`, `maskedHint`, `verificationStatus`, `updatedAt`
- Evidence: `EV-SD-001`, `EV-SD-004`

### Digest-bound sandbox evidence

- Identity: `support-test-run`
- Fields: `testRunId`, `moduleId`, `draftDigest`, `contextVersionId`, `scenario`, `assertions`, `result`, `createdAt`
- Evidence: `EV-SD-001`, `EV-SD-002`, `EV-SD-003`

### External customer conversation

- Identity: `customer-conversation`
- Fields: `conversationId`, `moduleId`, `channel`, `externalIdentity`, `customerId`, `takeoverStatus`, `contextVersionId`, `lastActivityAt`
- Evidence: `EV-SD-001`, `EV-SD-003`

### Support work item

- Identity: `support-ticket`
- Fields: `ticketId`, `conversationId`, `intent`, `priority`, `status`, `assigneeId`, `slaPolicyId`, `dueAt`
- Evidence: `EV-SD-001`, `EV-SD-003`

### Internal collaborative Execute session

- Identity: `support-ops-session`
- Fields: `sessionId`, `moduleId`, `isPrimary`, `title`, `status`, `createdAt`
- Evidence: `EV-SD-001`, `EV-SD-003`

### Internal collaborative message or notice

- Identity: `support-ops-message`
- Fields: `messageId`, `sessionId`, `actor`, `content`, `noticeMetadata`, `contextVersionId`, `createdAt`
- Evidence: `EV-SD-001`, `EV-SD-003`

### Attributable trusted action decision

- Identity: `support-action-decision`
- Fields: `decisionId`, `conversationId`, `ticketId`, `proposal`, `policyResult`, `actorId`, `contextVersionId`, `idempotencyKey`, `createdAt`
- Evidence: `EV-SD-001`, `EV-SD-003`

## Operations

### open-initial-support-setup

- Kind: `mutation`
- Contract name: `openInitialSupportSetupRevision`
- Owner: `backend`
- Inputs: `moduleId`, `idempotencyKey`
- Outputs: `setupSession`, `candidate`
- Refusals: `module not owned`, `open draft already exists`

### open-later-support-setup

- Kind: `mutation`
- Contract name: `openLaterSupportSetupRevision`
- Owner: `backend`
- Inputs: `moduleId`, `basedOnContextVersionId`, `idempotencyKey`
- Outputs: `setupSession`, `candidate`
- Refusals: `active version mismatch`, `open draft already exists`

### answer-support-setup

- Kind: `mutation`
- Contract name: `answerSupportSetup`
- Owner: `backend`
- Inputs: `sessionId`, `message`, `idempotencyKey`
- Outputs: `persisted turn`, `gates`, `next question`, `draft digest`
- Refusals: `session unavailable`, `unsafe attachment`

### abandon-support-setup

- Kind: `mutation`
- Contract name: `abandonSupportSetup`
- Owner: `backend`
- Inputs: `sessionId`
- Outputs: `abandoned session`
- Refusals: `session not owned`, `already applied`

### run-support-test

- Kind: `mutation`
- Contract name: `runSupportTest`
- Owner: `backend`
- Inputs: `moduleId`, `draftDigest or contextVersionId`, `scenario`, `assertions`
- Outputs: `isolated test evidence`
- Refusals: `stale draft`, `unsafe live action`, `unsupported assertion`

### apply-support-context

- Kind: `mutation`
- Contract name: `applySupportContext`
- Owner: `backend`
- Inputs: `moduleId`, `sessionId`, `draftDigest`, `idempotencyKey`
- Outputs: `immutable context version`, `active binding`
- Refusals: `incomplete gates`, `stale digest`, `concurrent apply`

### save-telegram-credential

- Kind: `mutation`
- Contract name: `saveSupportTelegramCredential`
- Owner: `backend`
- Inputs: `moduleId`, `write-only token`
- Outputs: `masked credential status`
- Refusals: `invalid credential`, `verification refused`

### verify-support-channel

- Kind: `mutation`
- Contract name: `verifySupportChannel`
- Owner: `backend`
- Inputs: `moduleId`, `provider`
- Outputs: `channel readiness`
- Refusals: `credential unavailable`, `provider refused`

### enable-support-live

- Kind: `mutation`
- Contract name: `enableSupportLive`
- Owner: `backend`
- Inputs: `moduleId`, `operatingMode`, `idempotencyKey`
- Outputs: `live readiness`
- Refusals: `context not active`, `knowledge not ready`, `channel not ready`, `policy not ready`

### pause-support-live

- Kind: `mutation`
- Contract name: `pauseSupportLive`
- Owner: `backend`
- Inputs: `moduleId`, `reason`
- Outputs: `paused status`
- Refusals: `module not live`

### accept-inbound-support-event

- Kind: `command`
- Contract name: `acceptInboundSupportEvent`
- Owner: `backend`
- Inputs: `verified provider event`
- Outputs: `conversation`, `message`, `ticket`
- Refusals: `signature invalid`, `duplicate event`, `module not live`

### evaluate-support-turn

- Kind: `command`
- Contract name: `evaluateSupportTurn`
- Owner: `backend`
- Inputs: `conversationId`, `messageId`
- Outputs: `classification`, `retrieval evidence`, `proposed response`, `policy result`
- Refusals: `context unavailable`, `knowledge unavailable`, `unsafe request`

### approve-support-reply

- Kind: `mutation`
- Contract name: `approveSupportReply`
- Owner: `backend`
- Inputs: `decisionId`, `actorId`, `idempotencyKey`
- Outputs: `approved decision`
- Refusals: `permission refused`, `stale decision`, `takeover active`

### send-eligible-auto-reply

- Kind: `command`
- Contract name: `sendEligibleAutoReply`
- Owner: `backend`
- Inputs: `decisionId`, `idempotencyKey`
- Outputs: `provider send evidence`
- Refusals: `fresh validation refused`, `provider failure`

### take-over-conversation

- Kind: `mutation`
- Contract name: `takeOverSupportConversation`
- Owner: `backend`
- Inputs: `conversationId`, `actorId`
- Outputs: `takeover status`
- Refusals: `conversation unavailable`

### resume-conversation-ai

- Kind: `mutation`
- Contract name: `resumeSupportConversationAI`
- Owner: `backend`
- Inputs: `conversationId`, `actorId`
- Outputs: `AI resumed`
- Refusals: `permission refused`, `readiness refused`

### assign-support-ticket

- Kind: `mutation`
- Contract name: `assignSupportTicket`
- Owner: `backend`
- Inputs: `ticketId`, `assigneeId`
- Outputs: `updated ticket`
- Refusals: `permission refused`, `ticket resolved`

### resolve-support-ticket

- Kind: `mutation`
- Contract name: `resolveSupportTicket`
- Owner: `backend`
- Inputs: `ticketId`, `resolution`, `actorId`
- Outputs: `resolved ticket`
- Refusals: `permission refused`, `evidence incomplete`

### post-proactive-support-notice

- Kind: `command`
- Contract name: `postProactiveSupportNotice`
- Owner: `backend`
- Inputs: `registeredEventId`, `dedupeKey`, `notice`
- Outputs: `primary ops message`
- Refusals: `event unregistered`, `quiet-hour policy deferred`, `duplicate notice`
