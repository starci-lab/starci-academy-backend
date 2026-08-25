# Business specification · AgentOS module studio and adaptive operating shell

## Authority

- Status: `in-progress`
- Basis: `owner-intent`
- Previous head: `a382ff502481d568de1f84fc72b26461b91d2b35c6cb1758fc791108c97bb5d0`
- Required roles: `fe`, `be`

## Summary

An authenticated workspace owner creates, installs, configures, tests and operates many module instances. Every module has exactly one kind, exactly one private resumable setup chat, a kind-resolved sandbox Test workbench, zero-to-many collaborative execute chat sessions and one kind-resolved adaptive operating workbench while versioned context, configuration and technical diagnostics remain progressively disclosed.

## Scope

### Included

- Module collection, custom-module studio and installed-module operation inside one exact ready AgentOS workspace
- Exactly-one-kind identity for every module instance and an extensible kind registry
- Exactly one private resumable setup chat and zero-to-many collaborative execute chat sessions for every module
- Explicitly applied versioned business context produced through the setup chat without rewriting execute history
- One kind-resolved adaptive workbench operating beside the shared chat
- Typed trusted widgets rendered inside chat from structured payloads
- Module-scoped knowledge, integrations, permissions and settings separated from workspace-scoped AI readiness
- Progressively disclosed lifecycle and technical diagnostics
- Existing resumable custom-module interview, scanned attachments, write-only secrets, review and explicit publish transition
- One versioned kind-resolved sandbox Test workbench per module that proves a selected immutable context version without changing Execute history or external systems

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
- **BR-12** — Every module kind inherits the same collaborative execute-chat contract with zero-to-many independent sessions.
- **BR-13** — Every registered module kind resolves to exactly one workbench definition; a missing or incompatible binding is an explicit unavailable state.
- **BR-14** — A new module kind is added through registry, schema, capabilities and workbench registration without modifying Module Core, Chat Core or the persistent shell.
- **BR-15** — Chatbot, document, spreadsheet, calendar and similar workbenches are examples, not a closed business enum.
- **BR-16** — Widgets in chat are typed trusted payloads rendered by registered widget definitions; arbitrary HTML, scripts and undeclared actions are refused.
- **BR-17** — Module-scoped knowledge and integrations are configured on the exact module; provider credentials, global model readiness and shared knowledge origins remain workspace-owned.
- **BR-18** — The primary module route is an operating surface with chat and workbench; package metadata and runtime internals are secondary diagnostics.
- **BR-19** — Conversation, workbench, configuration and diagnostics are independent state axes so one failure does not erase or falsely disable unrelated accepted state.
- **BR-20** — Responsive presentation may collapse navigation, chat and workbench into drill-down surfaces, but preserves the same module identity and active work context.
- **BR-21** — Every module has exactly one private resumable setup chat session and may have zero-to-many independent collaborative execute chat sessions.
- **BR-22** — Opening Setup always resumes the same module setup session; New chat creates only an execute session and can never create or replace Setup.
- **BR-23** — Setup messages are private to authorized module administrators and never appear in execute session history or the operational conversation list.
- **BR-24** — Only an explicitly applied immutable context version can affect execution; setup drafts never change the active effective context.
- **BR-25** — Every execute message retains the effective context version used, and applying a later setup revision never rewrites prior execute messages or sessions.
- **BR-26** — A setup draft or apply failure preserves the last active context and leaves every execute session, workbench and unrelated module state usable.
- **BR-27** — The initial shipped kind catalogue contains customer-support (Support Desk), accounting (Finance Copilot), calendar-assistant (Scheduling AI) and document-research (Knowledge Hub); these are registered initial entries and never a closed core enum.
- **BR-28** — Each initial-kind installation owns the same setup, execute, context, settings and diagnostics lifecycle while resolving only its registered workbench and typed widgets.
- **BR-29** — Nivo-owned manifests and bootstrap knowledge are public-safe versioned operational data under the data mount and idempotently seed database rows; customer credentials and secrets never enter that mount.
- **BR-30** — Module credential fields are declared by the registered kind, accepted only through module Settings, stored write-only and encrypted, and returned only as masked configuration status.
- **BR-31** — The local proof workspace contains exactly two installations of each initial kind, eight initial-kind installations total, and one private resumable setup session per installation; custom capability remains available but is not part of that seed set.
- **BR-32** — Every module kind registers one versioned test-workbench contract beside its operating-workbench contract; shared Module Core renders the resolved contract and never branches on a closed kind enum.
- **BR-33** — Every test run belongs to one exact installation and records the kind version, test-contract version and explicitly selected immutable context version.
- **BR-34** — Test sessions, inputs, generated outputs and results are isolated from the one Setup session, all collaborative Execute sessions, their messages, widgets and live workbench state.
- **BR-35** — Customer support tests a sandbox conversation, accounting tests fixture documents and calculations, calendar assistance tests a fake calendar, and document research tests questions and citations; these initial examples do not close the registry.
- **BR-36** — A test cannot invoke a live external action, disclose a stored credential, mutate production data, apply a context version or authorize operation automatically.
- **BR-37** — A completed test exposes pass, warning or fail, assertion-level evidence, the selected context version and test-contract version so the owner can inspect why the result is trusted or refused.
- **BR-38** — Adding a new module kind and its test workbench does not require changing the shared shell, shared test-run identity, Setup contract or Execute contract.

## Journeys

- `create-and-complete-module` — Create a custom module through adaptive follow-up questions
- `resume-and-manage-module` — Resume or manage one exact custom module
- `review-and-publish-module` — Review and explicitly publish one complete custom module
- `setup-and-activate-module-context` — Teach one module through its single private setup chat
- `manage-module-chat-sessions` — Manage many execute chat sessions separately from Setup
- `operate-kind-module` — Operate one module through shared chat and its adaptive workbench
- `configure-and-diagnose-module` — Configure a module without mixing workspace operations or runtime diagnostics
- `test-module-before-operation` — Prove one configured module in its kind-specific sandbox

## Surfaces

- `module-management` — Modules: `/[locale]/agentos/workspaces/[workspaceId]/modules`
- `module-create` — Create module: `/[locale]/agentos/workspaces/[workspaceId]/modules/create`
- `module-studio` — Module studio: `/[locale]/agentos/workspaces/[workspaceId]/modules/studio/[moduleId]`
- `module-setup` — Set up module: `/[locale]/agentos/workspaces/[workspaceId]/modules/[moduleId]/setup`
- `module-operating-shell` — Module workspace: `/[locale]/agentos/workspaces/[workspaceId]/modules/[moduleId]/operate`
- `module-settings` — Module settings: `/[locale]/agentos/workspaces/[workspaceId]/modules/[moduleId]/settings`
- `module-diagnostics` — Module diagnostics: `/[locale]/agentos/workspaces/[workspaceId]/modules/[moduleId]/diagnostics`
- `module-test` — Test module: `/[locale]/agentos/workspaces/[workspaceId]/modules/[moduleId]/test`

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
- **AC-21** — Chat navigation displays one fixed private Setup entry separately from zero-to-many collaborative execute chat sessions.
- **AC-22** — New chat creates a new execute session and cannot create, duplicate or replace the module setup session.
- **AC-23** — Reloading or reopening Setup restores the same private setup session identity, accepted history, draft context and active version.
- **AC-24** — A module without an active context enters Setup and cannot execute until the exact complete draft context version is explicitly applied.
- **AC-25** — Applying a later setup draft changes the active context without rewriting prior execute messages, widgets or session history.
- **AC-26** — Every execute message retains the effective context version used while setup history remains unavailable to ordinary operational collaborators.
- **AC-27** — Archiving one execute session does not affect Setup, the active context, other execute sessions or the kind workbench.
- **AC-28** — The module catalogue and installed collection expose Support Desk, Finance Copilot, Scheduling AI and Knowledge Hub using the shared shell and their distinct registered workbenches.
- **AC-29** — A clean local proof boot idempotently produces exactly two installations per initial kind and exactly eight initial-kind installations in the selected workspace without creating custom demo fixtures.
- **AC-30** — Every one of the eight seeded installations resumes one private Setup chat and can explicitly apply its own immutable business-context version before execution.
- **AC-31** — Each initial kind loads Nivo-owned bootstrap knowledge from its versioned data-mount package and remains operable when customer-specific knowledge has not yet been supplied.
- **AC-32** — Submitting a kind-declared credential through Settings persists it through the encrypted write-only boundary, clears the input and returns only provider identity plus masked configured status.
- **AC-33** — Every module exposes Test after Setup has produced an immutable context version, and the persistent shell resolves the Test workbench from the installed kind contract.
- **AC-34** — A test run records one exact installation, kind version, test-contract version and selected candidate or active context version without creating an Execute session.
- **AC-35** — Customer-support Test provides a sandbox conversation and evaluates declared behavior without sending to Telegram or another live channel.
- **AC-36** — Accounting, calendar-assistant and document-research Tests respectively use fixture documents and calculations, a fake calendar, and questions with citation assertions.
- **AC-37** — Test inputs, outputs and results never enter Setup or Execute history and never mutate live workbench or external-system state.
- **AC-38** — Pass, warning and fail results expose assertion-level evidence, bound context version and test-contract version while all credentials remain undisclosed.
- **AC-39** — A passing test does not apply a candidate context or authorize external mutations; the owner must still use the existing explicit context apply and confirmation boundaries.
- **AC-40** — Registering another kind and its Test workbench requires no edit to shared Module Core, Setup Core or Execute Core.

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
