# uat flow — agentos-modules/collection-to-module-workspace

Draft. This document was drafted by `platform.operate` (session
`20260903-104251-nivo-frontend.direction.decide`, step-20) from the shipped template and the
direction decision's coverage (`step-18/parallel-1/response/data/coverage.json`); `uat.verify`
freezes it at its step 4 and a person owns every sentence after that. Its row expectations were reconciled to `seed/records.json` before the first run, because step-35 brought the workspace to the flow’s representative volume after this document was drafted and the seed is the fixture authority. Nothing here is a secret: the
account is named in `accounts.dev.json`, its password is resolved by name at sign-in and never
written.

## Goal

A workspace owner opens the Modules collection of their AgentOS workspace, sees their custom
modules and installed solution modules apart, and reaches the dedicated management workspace of
one installed module and the Studio of one custom module without losing the collection's identity.

## Budgets

| Budget | Value | Why |
| --- | --- | --- |
| Steps | `6` | Sign in, open the collection, open an installed module, switch one task, return, open a custom module's Studio |
| Time | `90s` | First activation to terminal assertion |
| Surface class | `console` | Declared by the direction decision (`## Surface class`, `coverage.surfaceClass`) |
| Viewports | `1440x900, 390x844` | The direction's wide and compact management-workspace branches |

## Cases

| Order | Case | As | Entry | Steps | Terminal assertion | Lanes asserted |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `collection-lists-owned-modules` | `owner` | `/en/agentos/workspaces/5a7c0d3e-0003-4a00-8000-20260903a003/modules`, signed in | `2` | The collection shows the eight custom modules and four installed solutions the seed placed, in three separately labelled sections — custom modules, installed solutions, then the Nivo catalogue — with one primary Create module action | `behavior`, `ux`, `ui` |
| 2 | `installed-module-opens-dedicated-workspace` | `owner` | the collection at rest | `2` | Activating the installed module's destination lands on `/modules/5a7c0d3e-0004-4a00-8000-20260903a004` with the module identity shell, the five task destinations, Setup shown as the canonical root, and the back-to-modules exit | `behavior`, `ux`, `ui` |
| 3 | `task-switch-keeps-identity` | `owner` | the installed module's Setup | `1` | Activating Diagnostics changes the URL to `/diagnostics`, the task body, and nothing in the identity shell | `behavior`, `ux`, `ui` |
| 4 | `custom-module-resumes-studio` | `owner` | the collection at rest | `1` | Activating the draft custom module lands on `/modules/studio/5a7c0d3e-0008-4a00-8000-20260903a008` with the draft's progress and no new draft created | `behavior`, `ux`, `ui` |

`As` names one alias of `accounts.dev.json`.

## Assertions

| Assertion | Case | Lane | What is observed | Rule ids measured |
| --- | --- | --- | --- | --- |
| `collection-three-sections` | `collection-lists-owned-modules` | `ui` | Three labelled collection regions, custom first, then installed solutions, then the catalogue, each one joined card | `UX-10, UX-11` |
| `collection-rows-match-seed` | `collection-lists-owned-modules` | `behavior` | Twelve ledger rows, every one of them a seeded record: the eight custom modules and the four installations, each carrying the `UAT ` prefix of the namespace, and no row outside it | `UX-1` |
| `collection-one-create` | `collection-lists-owned-modules` | `ux` | Exactly one primary Create module button; every row has one destination control | `UX-5, UX-8` |
| `installed-route-committed` | `installed-module-opens-dedicated-workspace` | `behavior` | The URL is the installation root and the shell names `UAT Knowledge Hub` | `UX-1, UX-4` |
| `task-navigation-present` | `installed-module-opens-dedicated-workspace` | `ux` | Setup, Test, Operate, Settings, Diagnostics are visible peer destinations with Setup selected | `UX-5, UX-6` |
| `identity-shell-stable` | `task-switch-keeps-identity` | `ui` | Breadcrumb, module name, kind and lifecycle badge are unchanged between Setup and Diagnostics | `UX-7, UX-10` |
| `studio-resumes-draft` | `custom-module-resumes-studio` | `behavior` | The Studio route carries the draft's id and shows progress 40; the custom-module count stays 2 | `UX-1, UX-7` |

## Alternate paths

| Branch | Triggered by | Terminal assertion |
| --- | --- | --- |
| `collection-refused` | the installations read is refused (the API answers an error for the workspace) | The installed section alone shows its refusal, its own line and its own Try again; the custom section, the catalogue and the Create action stay usable |
| `module-not-in-workspace` | a deep link to an installation id the workspace does not own | The task body states the refusal and the back-to-modules exit remains |

## Fixtures

| Record | Source | Created by | Namespaced |
| --- | --- | --- | --- |
| `agent_workspaces` UAT module workspace | `seed/records.json` | `seed` | `uat-collection-to-module-workspace` |
| `agentos_module_installations` four installations across ready, provisioning and failed, UAT Knowledge Hub among them | `seed/records.json` | `seed` | `uat-collection-to-module-workspace` |
| `agentos_custom_modules` eight custom modules across every status, UAT sales reply copilot (active) and UAT partner onboarding guide (draft) among them | `seed/records.json` | `seed` | `uat-collection-to-module-workspace` |
| navigation history and the selected task | the run | `run` | `uat-<runId>` |

## Steps

| # | As | Action | Expected | Evidence | UX ids measured |
| --- | --- | --- | --- | --- | --- |
| 1 | `owner` | Sign in at `/en/authentication` with the owner's email | The console opens on the overview | `steps/01-sign-in/capture-<viewport>-<scheme>.png` (after the redirect) | `UX-4` |
| 2 | `owner` | Open `/en/agentos/workspaces/5a7c0d3e-0003-4a00-8000-20260903a003/modules` | The collection at rest with twelve rows in two ledger sections and the catalogue beneath | `steps/02-collection/capture-<viewport>-<scheme>.png` | `UX-1, UX-5, UX-10` |
| 3 | `owner` | Activate the `UAT Knowledge Hub` row's destination | The installation root with the identity shell and Setup | `steps/03-installed-root/capture-<viewport>-<scheme>.png` | `UX-1, UX-4, UX-6` |
| 4 | `owner` | Activate `Diagnostics` | The URL ends in `/diagnostics`; the shell is unchanged | `steps/04-diagnostics/capture-<viewport>-<scheme>.png` | `UX-7, UX-10` |
| 5 | `owner` | Activate the back-to-modules exit | The collection again, unchanged | `steps/05-back/capture-<viewport>-<scheme>.png` | `UX-7` |
| 6 | `owner` | Activate the `UAT partner onboarding guide` row's destination | The Studio of the draft at progress 40 | `steps/06-studio/capture-<viewport>-<scheme>.png` | `UX-1, UX-7` |

## Cleanup

The run writes nothing to the store; its namespace `uat-<runId>` covers only the run record under
`runs/`. The seed's own namespace `uat-collection-to-module-workspace` stays for the next run and is
removed by deleting the ids `seed/records.json` lists.
