# AgentOS custom module studio

> Business head: `2bf93759d04613ebeaf06f4ed3282dc9b28883c75fef7ba38904d37bebbe2201`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

An authenticated owner creates and manages workspace-owned custom module drafts through a resumable adaptive interview, supplies scanned supporting files and write-only integration secrets, reviews a backend-owned completeness profile and explicitly publishes a versioned module specification into the existing AgentOS installation lifecycle.

Included:
- Custom-module management nested under one exact ready AgentOS workspace
- Pre-persistence module creation followed by a persistent resumable module studio
- Backend-owned adaptive follow-up questions, structured module profile, missing fields, progress and completion
- Quarantined image and document attachment intake with scan, retry and removal states
- Write-only encrypted named integration-secret intake with masked configuration status
- Versioned reviewable module specification and an explicit publish or install transition

Excluded:
- Changing the existing immutable solution-module catalogue, catalogue install mutation or installation-detail route
- Changing AgentOS order, Wallet payment, workspace provisioning or readiness semantics
- Returning, rendering or logging secret values, storage credentials, scanner internals or raw control-plane access
- Publishing or installing a module automatically when a chat turn completes
- Importing TEDO product content, pricing, artifacts, actors or business rules

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `894e608bba73d791e5d2767cdc420da770c8c42b` |
| be | https://github.com/starci-lab/nivo-backend.git | `ac05d90e7b6b59eb9dc4128872f3c02ba254e59a` |

## 3. Actors and access

### Authenticated owner of one exact ready AgentOS workspace

- Browse workspace-owned custom module drafts and published modules
- Start and resume an adaptive module interview
- Answer, correct and extend module requirements
- Attach supporting images and documents
- Configure or remove named integration secrets without reading them back
- Review completeness and explicitly publish or install a ready specification

Evidence: `EV-001`

## 4. Entry points and surfaces

### Modules

- ID: `module-management`
- Route: `/[locale]/agentos/workspaces/[workspaceId]/modules`
- Purpose: Manage custom module drafts and published module identities for one exact ready workspace.
- Regions: `module-collection-header`, `custom-module-collection`
- Navigation: Back to workspace (available), Modules (active), Catalogue installations (available)

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

### Create module

- ID: `module-create`
- Route: `/[locale]/agentos/workspaces/[workspaceId]/modules/create`
- Purpose: Capture the opening module goal before creating a persistent draft and intake session.
- Regions: `opening-module-interview`
- Navigation: Back to modules (available), Create module (active)

Evidence: `EV-001`

### Module studio

- ID: `module-studio`
- Route: `/[locale]/agentos/workspaces/[workspaceId]/modules/studio/[moduleId]`
- Purpose: Complete and review one exact workspace-owned custom module through an adaptive conversation and live structured profile.
- Regions: `adaptive-module-interview`, `live-module-profile`, `module-resources`, `module-readiness`
- Navigation: Back to modules (available), Module studio (active)

Evidence: `EV-001`, `EV-002`, `EV-004`, `EV-006`, `EV-008`

## 5. Business flows

### Create a custom module through adaptive follow-up questions

Trigger: The workspace owner chooses Create module from the exact workspace module collection.

1. **workspace-owner** — Open the separate module-create route without creating a blank persisted module → The owner sees the first assistant prompt and a composer scoped to the exact workspace
2. **workspace-owner** — Submit the opening module goal → The backend creates one idempotent custom-module draft and intake session, then returns the exact persistent studio identity
3. **workspace-owner** — Answer the current backend-selected question or correct a prior answer → The answer is persisted, the structured profile and missing fields are recomputed, and the next unresolved question is returned
4. **workspace-owner** — Attach relevant images or documents and configure required integration keys → Only scan-ready attachments and masked configured-secret statuses contribute to module readiness
5. **workspace-owner** — Resolve every backend-declared missing field → The backend marks the intake complete and generates a versioned reviewable module specification

Outcomes:
- One exact workspace-owned draft and intake session remain resumable
- The owner reaches a reviewable specification only after backend-owned completion

Evidence: `EV-001`

### Resume or manage one exact custom module

Trigger: The workspace owner selects a draft or published custom module from the module collection.

1. **workspace-owner** — Choose one module belonging to the exact workspace → The route preserves workspaceId and moduleId and refuses a foreign or absent module
2. **workspace-owner** — Open the module studio → Conversation, structured profile, missing fields, attachments, masked secret statuses and current specification are restored
3. **workspace-owner** — Continue the interview or update an allowed resource → The backend recomputes readiness without losing previously accepted information

Outcomes:
- Interrupted intake resumes without creating a duplicate draft
- The owner can distinguish incomplete, ready-for-review, publishing, active and refused modules

Evidence: `EV-001`

### Review and explicitly publish one complete custom module

Trigger: The backend has generated a complete versioned module specification.

1. **workspace-owner** — Review the generated specification, its source attachments and masked integration requirements → The owner can return to the interview or proceed with the exact specification version
2. **workspace-owner** — Explicitly confirm Publish or Install with an idempotency identity → The backend accepts one asynchronous publish operation and never treats chat completion as consent
3. **workspace-owner** — Observe the publish result → Success returns the existing installation identity; refusal preserves the reviewable specification and exposes a safe retry

Outcomes:
- A complete custom specification enters the existing installation lifecycle only through explicit owner confirmation
- The existing owner-scoped installation-detail route remains the terminal runtime inspection surface

Evidence: `EV-001`, `EV-002`, `EV-004`, `EV-006`, `EV-008`

## 6. Business rules

### BR-01

Every custom module, intake session, attachment, configured-secret status and generated specification belongs to one exact authenticated owner and one exact ready AgentOS workspace.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-010`

### BR-02

The backend owns required fields, the next follow-up question, structured profile, missing fields, progress and completion; the frontend renders those results and never invents readiness.

Strength: **confirmed** · Evidence: `EV-001`

### BR-03

Each accepted answer or correction is persisted before the next question is selected, and a changed answer may change every later unresolved question.

Strength: **confirmed** · Evidence: `EV-001`

### BR-04

A custom-module draft is resumable after navigation, reload or a local operation failure without duplicating the draft or discarding previously accepted information.

Strength: **confirmed** · Evidence: `EV-001`

### BR-05

Integration key values are write-only, encrypted server-side and never returned, rendered, placed in conversation text or logged; clients receive only masked configuration status.

Strength: **confirmed** · Evidence: `EV-001`

### BR-06

An image or document attachment contributes to the module profile only after quarantine and successful scanning; uploading, scanning, ready, refused, retry and removal remain explicit states.

Strength: **confirmed** · Evidence: `EV-001`

### BR-07

Conversation completion generates a reviewable versioned specification but never publishes or installs a module without a separate explicit owner confirmation.

Strength: **confirmed** · Evidence: `EV-001`

### BR-08

Custom-module drafts and their studio do not replace or mutate the existing immutable solution-module catalogue, catalogue installation operation or installation-detail identity.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`, `EV-010`

### BR-09

Interview, attachment, secret and publish failures are independent block-state axes; a refusal preserves every other previously accepted part of the module profile.

Strength: **confirmed** · Evidence: `EV-001`

### BR-10

The TEDO page contributes interaction shape only; none of its project content, prices, artifact promises, actors or business rules becomes Nivo product truth.

Strength: **confirmed** · Evidence: `EV-001`

## 7. State model

- **Custom module collection is loading** (`module-collection-loading`, pending) → module-collection-empty, module-collection-ready, module-collection-refused — `EV-001`
- **No custom module exists in the exact workspace** (`module-collection-empty`, empty) → intake-resting — `EV-001`
- **Owned custom modules are available** (`module-collection-ready`, success) → intake-resting, intake-awaiting-answer, specification-ready, module-active — `EV-001`
- **Custom module collection could not be read** (`module-collection-refused`, error) → module-collection-loading — `EV-001`
- **Opening module question is ready without a persisted draft** (`intake-resting`, initial) → intake-submitting — `EV-001`
- **An opening answer, follow-up answer or correction is being persisted** (`intake-submitting`, pending) → intake-awaiting-answer, intake-incomplete, intake-complete, intake-refused — `EV-001`
- **The backend-selected current question awaits an answer** (`intake-awaiting-answer`, partial) → intake-submitting, attachment-uploading, secret-saving — `EV-001`
- **The structured profile remains incomplete** (`intake-incomplete`, partial) → intake-awaiting-answer, attachment-uploading, secret-saving, intake-complete — `EV-001`
- **Every backend-required module field is resolved** (`intake-complete`, success) → specification-ready — `EV-001`
- **The interview turn was refused without losing accepted profile data** (`intake-refused`, error) → intake-submitting, intake-awaiting-answer — `EV-001`
- **A module attachment is uploading to quarantine** (`attachment-uploading`, pending) → attachment-scanning, attachment-refused — `EV-001`
- **An uploaded module attachment is being scanned** (`attachment-scanning`, pending) → attachment-ready, attachment-refused — `EV-001`
- **A scanned module attachment is available to the profile** (`attachment-ready`, success) → intake-incomplete, intake-complete — `EV-001`
- **An attachment was refused or could not be scanned** (`attachment-refused`, error) → attachment-uploading, intake-incomplete — `EV-001`
- **A named integration secret is being encrypted and stored** (`secret-saving`, pending) → secret-configured, secret-refused — `EV-001`
- **A named integration secret is configured and masked** (`secret-configured`, success) → intake-incomplete, intake-complete, secret-saving — `EV-001`
- **A named integration secret was refused without being stored** (`secret-refused`, error) → secret-saving, intake-incomplete — `EV-001`
- **A complete versioned module specification is ready for review** (`specification-ready`, success) → intake-awaiting-answer, module-publishing — `EV-001`
- **The explicitly confirmed module publish is running** (`module-publishing`, pending) → module-active, module-publish-refused — `EV-001`
- **The custom module has an existing installation identity** (`module-active`, success) → terminal — `EV-001`, `EV-002`, `EV-006`, `EV-008`
- **Publishing failed while the reviewable specification remains intact** (`module-publish-refused`, error) → specification-ready, module-publishing — `EV-001`

## 8. Entities and data

- **Workspace-owned custom module**: moduleId, workspaceId, name, status, readinessPercent, specificationVersion, publishedInstallationId, createdAt, updatedAt — `EV-001`
- **Adaptive module intake session**: sessionId, moduleId, status, currentQuestion, missingFields, progress, updatedAt — `EV-001`
- **Persisted module intake turn**: messageId, sessionId, role, content, attachmentIds, createdAt — `EV-001`
- **Quarantined module attachment**: attachmentId, moduleId, filename, mediaKind, mimeType, size, status, failureCode, createdAt — `EV-001`
- **Masked module integration configuration**: integrationId, moduleId, provider, label, configured, maskedHint, updatedAt — `EV-001`
- **Versioned reviewable custom module specification**: specificationId, moduleId, version, status, profileSnapshot, attachmentRefs, integrationRequirements, generatedAt — `EV-001`

## 9. Operations and APIs

- **myAgentosCustomModules** (query, backend) — input: workspaceId; output: owner-scoped custom module summaries; failures: workspace not found, workspace not ready, workspace not owned — `EV-001`
- **startAgentosCustomModuleIntake** (mutation, backend) — input: workspaceId, openingMessage, idempotencyKey; output: moduleId, sessionId, persisted opening answer, structured profile, progress, missing fields, next question; failures: workspace not ready, workspace not owned, opening message refused, duplicate identity mismatch — `EV-001`
- **myAgentosCustomModuleStudio** (query, backend) — input: workspaceId, moduleId; output: custom module, intake session, conversation, structured profile, attachments, masked integration statuses, current specification; failures: module not found, workspace or module not owned — `EV-001`
- **answerAgentosCustomModuleIntake** (mutation, backend) — input: moduleId, sessionId, message, correction target when applicable, idempotencyKey; output: persisted turn, structured profile, progress, missing fields, next question or completion, module specification when complete; failures: session not found, module or session not owned, message refused, intake engine unavailable — `EV-001`
- **prepareAgentosModuleAttachmentUpload** (mutation, backend) — input: moduleId, filename, mimeType, size, idempotencyKey; output: attachmentId, short-lived quarantine upload grant, expiresAt; failures: module not owned, unsupported file, file limit exceeded, upload grant unavailable — `EV-001`
- **finalizeAgentosModuleAttachment** (mutation, backend) — input: attachmentId, checksum; output: attachment scanning status; failures: attachment not owned, upload absent or expired, checksum mismatch, scan refused or unavailable — `EV-001`
- **removeAgentosModuleAttachment** (mutation, backend) — input: attachmentId, idempotencyKey; output: attachment removed; failures: attachment not owned, attachment locked by publishing — `EV-001`
- **saveAgentosModuleIntegrationSecret** (mutation, backend) — input: moduleId, provider, label, secret value, idempotencyKey; output: masked configured integration status; failures: module not owned, provider unsupported, secret invalid, encryption or storage unavailable — `EV-001`
- **removeAgentosModuleIntegrationSecret** (mutation, backend) — input: integrationId, idempotencyKey; output: integration no longer configured; failures: integration not owned, integration locked by publishing — `EV-001`
- **publishAgentosCustomModule** (mutation, backend) — input: moduleId, specificationVersion, acknowledgedPublish = true, idempotencyKey; output: publish operation identity, accepted status, installationId when available; failures: module not owned, intake incomplete, specification version stale, attachment not scan-ready, required integration not configured, publish not acknowledged, installation refused — `EV-001`

## 10. Acceptance conditions

- **AC-01** The exact workspace module collection exposes loading, empty, ready and refused states plus a Create module action without replacing the existing catalogue-installation surface. — `EV-001`, `EV-003`, `EV-004`, `EV-006`
- **AC-02** Opening the create route persists nothing; the first submitted answer idempotently creates the exact draft and session and continues on the persistent module-studio route. — `EV-001`
- **AC-03** Every accepted answer or correction updates the persisted conversation, profile, progress and missing fields before returning a backend-selected next question or completion result. — `EV-001`
- **AC-04** An interrupted custom-module draft restores its exact conversation, live profile, unresolved fields, attachments, masked integrations and specification without duplication. — `EV-001`
- **AC-05** Image and document attachments expose uploading, scanning, ready, refused, retry and removal outcomes and contribute to readiness only after successful scanning. — `EV-001`
- **AC-06** A submitted integration key is never returned or rendered; success exposes only provider, label, masked hint and configured status, while refusal proves nothing was stored. — `EV-001`
- **AC-07** The Publish module action is unavailable until backend-owned completeness produces a reviewable specification and requires explicit acknowledgement of the exact version. — `EV-001`
- **AC-08** Successful publishing returns an existing installation identity and uses the current exact-workspace installation-detail route; refusal preserves the specification and provides a safe retry. — `EV-001`, `EV-002`, `EV-004`, `EV-006`, `EV-008`
- **AC-09** Interview, attachment, secret and publishing failures preserve every unrelated accepted profile field and remain local block states inside the unchanged module-studio page architecture. — `EV-001`
- **AC-10** No Nivo surface or operation adopts TEDO-specific content, pricing, deliverables or artifact promises; only the owner-approved adaptive-interview interaction shape is retained. — `EV-001`

## 11. Explicit unknowns

- **Which exact MIME types, per-file size, file count, retention period and scanner own production module attachments?** — Implementation must not invent limits or retain unscanned uploads without an approved policy.
- **Which named integration providers are supported and which provider-owned verification proves a submitted key is usable?** — The studio may render generic provider and key fields, but provider-specific validation and labels remain unavailable until resolved.
- **Which AgentOS plans permit custom modules and what workspace module quota applies?** — Create and publish entitlement or quota refusal cannot be implemented as a product fact until plan policy is decided.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | owner | `decision:61d6f1623ea6e38071da694af5f70c638e394b00aec62b162567ec1064be447c` | owner-decision | Create Nivo agentos-module-studio for an authenticated owner of one exact ready AgentOS workspace: create and manage workspace-owned custom module drafts; collect requirements through a backend-owned adaptive follow-up interview that persists answers, computes missing fields and exposes progress; accept image and document attachments through quarantined scanned uploads with retry and removal; store named integration keys as write-only encrypted server-side secrets and return only masked configuration status; generate a reviewable module specification only when complete; require an explicit publish/install action; preserve existing catalogue installation and installation-detail flows; use the TEDO page only as interaction-shape evidence and import none of its product facts. |
| EV-002 | fe | `apps/app/src/app/[locale]/(console)/agentos/workspaces/[workspaceId]/modules/[installationId]/page.tsx:3` | route | The current frontend mounts one exact owner-scoped module installation detail under workspaceId and installationId. |
| EV-003 | fe | `apps/app/src/components/blocks/agentos/AgentOSSolutionModuleCenter/index.tsx:26` | ui | The current connected module center owns the immutable catalogue and exact-workspace installation list reads. |
| EV-004 | fe | `apps/app/src/components/blocks/agentos/AgentOSSolutionModuleCenter/index.tsx:62` | ui | The current frontend installs a catalogue key idempotently and links installed rows to the existing exact-workspace installation-detail route. |
| EV-005 | fe | `apps/app/src/modules/api/console.ts:330` | contract | The current frontend contract defines two immutable catalogue keys, installation summaries and an install input with workspace, catalogue key and idempotency identity. |
| EV-006 | fe | `apps/app/src/modules/api/console.ts:593` | api | The current frontend operations read the catalogue, exact-workspace installations and one installation detail and submit the existing install mutation. |
| EV-007 | be | `src/features/core/api/core/graphql/mutations/agent-workspace/install-agentos-solution-module/graphql-types/input.ts:11` | contract | The current backend install input accepts one exact workspace, one of two fixed catalogue keys and an idempotency identity. |
| EV-008 | be | `src/modules/platform/databases/postgresql/primary/entities/agentos-module-installation.entity.ts:21` | schema | The current backend installation is an immutable package lifecycle row owned by an exact workspace and unique by workspace plus module key. |
| EV-009 | be | `src/modules/bussiness/agentos-solution-modules/types/manifest.ts:1` | contract | The current solution-module manifest is an immutable Nivo-owned package contract with fixed keys, versions, agent templates, channel roles, tool bindings and knowledge locator. |
| EV-010 | be | `src/features/core/api/core/graphql/queries/agent-workspace/my-agentos-module-installations/my-agentos-module-installations.handler.ts:20` | api | The current backend installation collection is read through exact user and workspace ownership. |
