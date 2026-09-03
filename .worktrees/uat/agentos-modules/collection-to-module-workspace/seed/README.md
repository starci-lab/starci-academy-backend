# uat seed — agentos-modules/collection-to-module-workspace

Draft, written by `platform.operate` (step-20 of session
`20260903-104251-nivo-frontend.direction.decide`) when the seed was first applied to the dev
store. `records.json` beside this file names every row that was placed, with its fixed id.

## What is placed

The preconditions of the flow for the `owner` alias of `accounts.dev.json`, in the nivo store
(`nivo-postgres`, database `nivo`):

| Row | Why it must exist before the run |
| --- | --- |
| one `catalog_orders` row, active, `agent_workspace_provisioned`, owned by the account | `myAgentWorkspace` lists a workspace only through the order the viewer owns |
| one `instances` row, `agent_os`, active | the workspace's infrastructure view |
| one `agent_workspaces` row, `UAT module workspace` | the workspace whose Modules collection the flow opens |
| one `agentos_module_installations` row, `UAT Knowledge Hub`, `knowledge-hub@1.0.0`, `ready`, with its `agentos_module_context_versions` v1 and its `Operations` `agentos_module_chat_sessions` row | the installed solution module whose dedicated workspace (Setup, Test, Operate, Settings, Diagnostics) the flow enters; its shape is cloned from a ready dev row so the task views have what they read |
| one `agentos_custom_modules` row, `UAT sales reply copilot`, `active`, attached to that installation | a custom module that opens the installation |
| one `agentos_custom_modules` row, `UAT partner onboarding guide`, `draft`, progress 40 | a custom module that resumes its Studio |

The seed never creates the outcome under test: navigation from the collection into a module
workspace is performed by the run.

## Namespace

The nivo tables carry no `is_uat` column. The namespace is therefore the fixed ids in
`records.json` and the `uat-collection-to-module-workspace` prefix on every name, hostname,
external reference and idempotency key. `records.json` marks each record `is_uat: true` and names
the namespace so a later reader can tell these rows from product data.

## Where the data state comes from

`db/before.json` and `db/after.json` of a run hold, in this order: the owner's `myAgentWorkspace`
list, the `myAgentosModuleInstallations` of the seeded workspace and its `myAgentosCustomModules`,
taken over the product's own GraphQL API at `http://localhost:3068/graphql` as the `owner` alias
(the password resolved by name at sign-in). Nothing requires a database connection to take it.

## Idempotency and rollback

Every insert names its fixed id and is `ON CONFLICT (id) DO NOTHING`, so applying the seed again
changes nothing. Rollback deletes the `catalog_orders` and `instances` rows named in
`records.json`; `agent_workspaces` cascades from the order and every installation, context version,
session and custom module cascades from the workspace.

No secret belongs here. The `owner` alias's password is the sealed shared credential resolved by
name; it is never written into a fixture, a command or a file.

## Layout

| Path | Holds |
| --- | --- |
| `records.json` | the rows placed, by entity and fixed id, with the namespace and the template rows they were cloned from |
