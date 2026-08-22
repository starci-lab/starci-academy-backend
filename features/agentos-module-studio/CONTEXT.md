# AgentOS custom module studio

> Business identity: `nivo/agentos-module-studio@f1e1843c1737fe9db47454df9d995b3c9aeb2d41947bbc1baf7abe3f46004300`
>
> Source heads: authority `pending` · `fe@894e608bba73`, `be@ac05d90e7b6b`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** An authenticated owner creates and manages workspace-owned custom module drafts through a resumable adaptive interview, supplies scanned supporting files and write-only integration secrets, reviews a backend-owned completeness profile and explicitly publishes a versioned module specification into the existing AgentOS installation lifecycle.

**Primary actor.** Authenticated owner of one exact ready AgentOS workspace

**Primary outcome.** One exact workspace-owned draft and intake session remain resumable

**Never does.** Changing the existing immutable solution-module catalogue, catalogue install mutation or installation-detail route

## Invariants

- `BR-01` — Every custom module, intake session, attachment, configured-secret status and generated specification belongs to one exact authenticated owner and one exact ready AgentOS workspace.
- `BR-02` — The backend owns required fields, the next follow-up question, structured profile, missing fields, progress and completion; the frontend renders those results and never invents readiness.
- `BR-03` — Each accepted answer or correction is persisted before the next question is selected, and a changed answer may change every later unresolved question.
- `BR-04` — A custom-module draft is resumable after navigation, reload or a local operation failure without duplicating the draft or discarding previously accepted information.
- `BR-05` — Integration key values are write-only, encrypted server-side and never returned, rendered, placed in conversation text or logged; clients receive only masked configuration status.

## Primary flow

```text
intake-resting → intake-submitting → intake-awaiting-answer → intake-incomplete → specification-ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `module-management` | `/[locale]/agentos/workspaces/[workspaceId]/modules` | Manage custom module drafts and published module identities for one exact ready workspace. | [surface](surfaces/module-management.md) |
| `module-create` | `/[locale]/agentos/workspaces/[workspaceId]/modules/create` | Capture the opening module goal before creating a persistent draft and intake session. | [surface](surfaces/module-create.md) |
| `module-studio` | `/[locale]/agentos/workspaces/[workspaceId]/modules/studio/[moduleId]` | Complete and review one exact workspace-owned custom module through an adaptive conversation and live structured profile. | [surface](surfaces/module-studio.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `myAgentosCustomModules` | backend | workspaceId | owner-scoped custom module summaries |
| `startAgentosCustomModuleIntake` | backend | workspaceId, openingMessage, idempotencyKey | moduleId, sessionId, persisted opening answer, structured profile, progress, missing fields, next question |
| `myAgentosCustomModuleStudio` | backend | workspaceId, moduleId | custom module, intake session, conversation, structured profile, attachments, masked integration statuses, current specification |
| `answerAgentosCustomModuleIntake` | backend | moduleId, sessionId, message, correction target when applicable, idempotencyKey | persisted turn, structured profile, progress, missing fields, next question or completion, module specification when complete |
| `prepareAgentosModuleAttachmentUpload` | backend | moduleId, filename, mimeType, size, idempotencyKey | attachmentId, short-lived quarantine upload grant, expiresAt |
| `finalizeAgentosModuleAttachment` | backend | attachmentId, checksum | attachment scanning status |
| `removeAgentosModuleAttachment` | backend | attachmentId, idempotencyKey | attachment removed |
| `saveAgentosModuleIntegrationSecret` | backend | moduleId, provider, label, secret value, idempotencyKey | masked configured integration status |

## Explicit unknowns

- `attachment-policy-limits` — Which exact MIME types, per-file size, file count, retention period and scanner own production module attachments? Impact: Implementation must not invent limits or retain unscanned uploads without an approved policy.
- `integration-provider-validation` — Which named integration providers are supported and which provider-owned verification proves a submitted key is usable? Impact: The studio may render generic provider and key fields, but provider-specific validation and labels remain unavailable until resolved.
- `module-plan-entitlements` — Which AgentOS plans permit custom modules and what workspace module quota applies? Impact: Create and publish entitlement or quota refusal cannot be implemented as a product fact until plan policy is decided.

## LOADS

| Need | Read |
|---|---|
| Scope, terminology and exclusions | [overview.md](overview.md) |
| Actor permissions and ownership | [actors.md](actors.md) |
| One user journey | `flows/<flow-id>.md` |
| One renderable screen | `surfaces/<surface-id>.md` |
| Business invariants | [rules.md](rules.md) |
| State transitions | [states.md](states.md) |
| Entities, inputs, outputs and failures | [contracts.md](contracts.md) |
| Completion and regression proof | [acceptance.md](acceptance.md) |
| Machine rendering/query | [model.json](model.json) |
| Exact source provenance | [evidence.json](evidence.json) |

## Context rule

Do not load every module by default. `CONTEXT.md` plus the one flow or surface being changed is the normal prompt. `model.json` is authoritative for machines; Markdown files are generated projections. Unknowns remain unknown until routed source or an explicit owner decision resolves them.
