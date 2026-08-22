# Multi-app provisioning registry

> Business identity: `nivo/multi-app-registry@761df8bcae551ec8d72c8acf56ac2c7a78d17b367d36d37feb1a54a62f73ef40`
>
> Source heads: authority `pending` · base `80dc8e9a0abc3324878e6540fcfd858c5d7bd815a2b7ee50e56a1fdba5fa186b` · `fe@269c99b0cf97`, `be@947c6f4a117e`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** The Nivo control plane models each installable application as a registry row with its own Helm chart reference, identity policy, ordered child pipeline, step configuration, secret specification, config-builder strategy, default plan and provisioning availability. The authenticated Apps console will consume a safe owned-instance projection and present Học viện Chuyên gia and MMO as two current apps with distinct black-red SVG identity marks.

**Primary actor.** Nivo control plane

**Primary outcome.** A new application can be represented by data and policy keys without extending a product enum or adding a chart-selection branch

**Never does.** Helm chart contents

## Invariants

- `BR-01` — Each app owns one stable registry key and its own Helm chart argument; filesystem paths and OCI references are supported, while unresolved chart sources are refused before Helm runs.
- `BR-02` — App-specific child behavior is selected through identity mode, ordered pipeline step keys, per-step config, secret specs and config-builder key rather than class inheritance or application conditionals.
- `BR-03` — A registered app is not necessarily provisionable; isProvisionable refuses new fulfillment before instance or secret creation while retaining registry truth for existing instances.
- `BR-04` — Chart contents, prices, marketing copy and per-tenant values remain owned outside the app registry.
- `BR-05` — The Apps console consumes only safe owned-instance fields; Helm chart and child-policy infrastructure remain backend-private.

## Primary flow

```text
registered → unavailable → ready → provisioning
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `app-registry` | `internal provisionable_apps registry` | Resolve application-owned installation policy without exposing infrastructure configuration publicly. | [surface](surfaces/app-registry.md) |
| `apps-console` | `/[locale]/apps` | Review current apps and enter the app-specific destinations currently available. | [surface](surfaces/apps-console.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `resolveApp` | backend | application key | provisionable app registry row |
| `resolveForExpertSite` | backend | instance-linked site identity | Helm chart ref, optional version and app key |
| `createInstance` | backend | catalogue order, resolved app row, resolved plan | instance bound to the app registry row |
| `seedDemoOwnedApps` | backend | fixed demo owner, ai_academy app row, mmo app row | idempotently persisted academy and MMO instances |
| `myInstances` | backend | authenticated viewer | safe owned app projection |

## Explicit unknowns

- `child-policy-authoring` — Should future app child policies remain seed-reviewed configuration or become operator-authored records with schema validation and versioning? Impact: Current source treats child policies as reviewed seed data and validates behavior in code; an operator-editable model would require new validation, authorization and compatibility rules.
- `mmo-management-destination` — Which product-specific route and operations will MMO management own? Impact: MMO may appear as a current app, but its management action remains unavailable until that destination is authorized.

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
