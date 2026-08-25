# Business specification · AgentOS module studio and adaptive operating shell

## Authority

- Status: `in-progress`
- Basis: `owner-intent`
- Previous head: `2bf93759d04613ebeaf06f4ed3282dc9b28883c75fef7ba38904d37bebbe2201`
- Required roles: `fe`, `be`

## Summary

An authenticated workspace owner creates, installs and operates many module instances. Every module has exactly one kind, inherits one persistent collaborative chat, and resolves its kind to one adaptive workbench while configuration and technical diagnostics remain progressively disclosed.

## Scope

### Included

- Module collection, custom-module studio and installed-module operation inside one exact ready AgentOS workspace
- Exactly-one-kind identity for every module instance and an extensible kind registry
- One persistent collaborative chat inherited by every module kind
- One kind-resolved adaptive workbench operating beside the shared chat
- Typed trusted widgets rendered inside chat from structured payloads
- Module-scoped knowledge, integrations, permissions and settings separated from workspace-scoped AI readiness
- Progressively disclosed lifecycle and technical diagnostics
- Existing resumable custom-module interview, scanned attachments, write-only secrets, review and explicit publish transition

### Excluded

- Changing AgentOS order, Wallet payment, workspace provisioning or workspace readiness semantics
- Treating infrastructure containers, hashes, embeddings or storage identifiers as the primary module experience
- Binding the business model to a closed enum of chatbot, document, spreadsheet or calendar kinds
- Rendering arbitrary untrusted HTML or scripts inside chat
- Choosing STI, CTI, JSONB or physical plugin storage before an architecture decision
- Returning reusable workspace, provider, storage or integration credentials

## Business rules

- **BR-01** — Every custom module, intake session, attachment, configured-secret status and generated specification belongs to one exact authenticated owner and one exact ready AgentOS workspace.
- **BR-02** — The backend owns required fields, the next follow-up question, structured profile, missing fields, progress and completion; the frontend renders those results and never invents readiness.
- **BR-03** — Each accepted answer or correction is persisted before the next question is selected, and a changed answer may change every later unresolved question.
- **BR-04** — A custom-module draft is resumable after navigation, reload or a local operation failure without duplicating the draft or discarding previously accepted information.
- **BR-05** — Integration key values are write-only, encrypted server-side and never returned, rendered, placed in conversation text or logged; clients receive only masked configuration status.
- **BR-06** — An image or document attachment contributes to the module profile only after quarantine and successful scanning; uploading, scanning, ready, refused, retry and removal remain explicit states.
- **BR-07** — Conversation completion generates a reviewable versioned specification but never publishes or installs a module without a separate explicit owner confirmation.
- **BR-08** — Custom-module drafts and their studio do not replace or mutate the existing immutable solution-module catalogue, catalogue installation operation or installation-detail identity.
- **BR-09** — Interview, attachment, secret and publish failures are independent block-state axes; a refusal preserves every other previously accepted part of the module profile.
- **BR-10** — The TEDO page contributes interaction shape only; none of its project content, prices, artifact promises, actors or business rules becomes Nivo product truth.
- **BR-11** — Every module instance belongs to one exact workspace and has exactly one immutable kind identity for a published version.
- **BR-12** — Every module kind inherits the same persistent collaborative chat contract.
- **BR-13** — Every registered module kind resolves to exactly one workbench definition; a missing or incompatible binding is an explicit unavailable state.
- **BR-14** — A new module kind is added through registry, schema, capabilities and workbench registration without modifying Module Core, Chat Core or the persistent shell.
- **BR-15** — Chatbot, document, spreadsheet, calendar and similar workbenches are examples, not a closed business enum.
- **BR-16** — Widgets in chat are typed trusted payloads rendered by registered widget definitions; arbitrary HTML, scripts and undeclared actions are refused.
- **BR-17** — Module-scoped knowledge and integrations are configured on the exact module; provider credentials, global model readiness and shared knowledge origins remain workspace-owned.
- **BR-18** — The primary module route is an operating surface with chat and workbench; package metadata and runtime internals are secondary diagnostics.
- **BR-19** — Conversation, workbench, configuration and diagnostics are independent state axes so one failure does not erase or falsely disable unrelated accepted state.
- **BR-20** — Responsive presentation may collapse navigation, chat and workbench into drill-down surfaces, but preserves the same module identity and active work context.

## Journeys

- `create-and-complete-module` — Create a custom module through adaptive follow-up questions
- `resume-and-manage-module` — Resume or manage one exact custom module
- `review-and-publish-module` — Review and explicitly publish one complete custom module
- `operate-kind-module` — Operate one module through shared chat and its adaptive workbench
- `configure-and-diagnose-module` — Configure a module without mixing workspace operations or runtime diagnostics

## Surfaces

- `module-management` — Modules: `/[locale]/agentos/workspaces/[workspaceId]/modules`
- `module-create` — Create module: `/[locale]/agentos/workspaces/[workspaceId]/modules/create`
- `module-studio` — Module studio: `/[locale]/agentos/workspaces/[workspaceId]/modules/studio/[moduleId]`
- `module-operating-shell` — Module workspace: `/[locale]/agentos/workspaces/[workspaceId]/modules/[moduleId]/operate`
- `module-settings` — Module settings: `/[locale]/agentos/workspaces/[workspaceId]/modules/[moduleId]/settings`
- `module-diagnostics` — Module diagnostics: `/[locale]/agentos/workspaces/[workspaceId]/modules/[moduleId]/diagnostics`

## Acceptance

- **AC-01** — The exact workspace module collection exposes loading, empty, ready and refused states plus a Create module action without replacing the existing catalogue-installation surface.
- **AC-02** — Opening the create route persists nothing; the first submitted answer idempotently creates the exact draft and session and continues on the persistent module-studio route.
- **AC-03** — Every accepted answer or correction updates the persisted conversation, profile, progress and missing fields before returning a backend-selected next question or completion result.
- **AC-04** — An interrupted custom-module draft restores its exact conversation, live profile, unresolved fields, attachments, masked integrations and specification without duplication.
- **AC-05** — Image and document attachments expose uploading, scanning, ready, refused, retry and removal outcomes and contribute to readiness only after successful scanning.
- **AC-06** — A submitted integration key is never returned or rendered; success exposes only provider, label, masked hint and configured status, while refusal proves nothing was stored.
- **AC-07** — The Publish module action is unavailable until backend-owned completeness produces a reviewable specification and requires explicit acknowledgement of the exact version.
- **AC-08** — Successful publishing returns an existing installation identity and uses the current exact-workspace installation-detail route; refusal preserves the specification and provides a safe retry.
- **AC-09** — Interview, attachment, secret and publishing failures preserve every unrelated accepted profile field and remain local block states inside the unchanged module-studio page architecture.
- **AC-10** — No Nivo surface or operation adopts TEDO-specific content, pricing, deliverables or artifact promises; only the owner-approved adaptive-interview interaction shape is retained.
- **AC-11** — Every installed or published module exposes exactly one kind and opens the same persistent module shell.
- **AC-12** — The module shell renders responsive breadcrumbs, owner-safe identity and status, shared chat and one kind-resolved workbench.
- **AC-13** — Chat history survives navigation and workbench changes and is not recreated per workbench kind.
- **AC-14** — Chatbot, document, spreadsheet and calendar examples resolve different workbenches without branching Module Core or Chat Core.
- **AC-15** — A newly registered kind can appear without editing the shared shell, chat contract or existing kind implementations.
- **AC-16** — Typed trusted widgets can render and invoke declared actions in chat; arbitrary HTML, script and undeclared actions are refused.
- **AC-17** — Module settings separate identity, module knowledge, integrations and permissions from workspace AI readiness.
- **AC-18** — Package digests, embeddings, containers, storage and raw failure evidence are absent from the default operating surface and available in diagnostics.
- **AC-19** — Failure of chat, workbench, settings or diagnostics preserves every unrelated ready axis.
- **AC-20** — Small-screen navigation preserves the exact module, conversation and workbench context while presenting one primary pane at a time.

## Unknowns and architecture handoff

- **attachment-policy-limits** — Which exact MIME types, per-file size, file count, retention period and scanner own production module attachments?
  - Impact: Implementation must not invent limits or retain unscanned uploads without an approved policy.
- **integration-provider-validation** — Which named integration providers are supported and which provider-owned verification proves a submitted key is usable?
  - Impact: The studio may render generic provider and key fields, but provider-specific validation and labels remain unavailable until resolved.
- **module-plan-entitlements** — Which AgentOS plans permit custom modules and what workspace module quota applies?
  - Impact: Create and publish entitlement or quota refusal cannot be implemented as a product fact until plan policy is decided.
- **module-kind-storage-strategy** — Which physical persistence strategy implements the business inheritance model: STI, CTI, JSONB registry or another plugin boundary?
  - Impact: Architecture must decide storage without weakening exactly-one-kind, shared-chat or kind-workbench business invariants.
- **trusted-widget-contract** — Which widget schemas, action permissions, sandbox and version-compatibility rules form the initial trusted registry?
  - Impact: Implementation may not render arbitrary HTML while this security contract remains unresolved.
- **initial-kind-catalogue** — Which module kinds ship first beyond the observed chatbot and custom module examples?
  - Impact: The business registry remains extensible and examples cannot become a closed enum.
