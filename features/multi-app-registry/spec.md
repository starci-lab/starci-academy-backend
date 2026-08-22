# Multi-app provisioning registry

> Business head: `80dc8e9a0abc3324878e6540fcfd858c5d7bd815a2b7ee50e56a1fdba5fa186b`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

The Nivo control plane models each installable application as a registry row with its own Helm chart reference, identity policy, ordered child pipeline, step configuration, secret specification, config-builder strategy, default plan and provisioning availability.

Included:
- Stable data-backed application identities
- Per-app Helm chart reference and optional chart version
- Per-app identity, host, pipeline, step config, secret, config builder and default plan policies
- Generic instance creation and chart resolution from the registry
- Per-row provisioning availability

Excluded:
- Helm chart contents
- Marketing copy, catalogue pricing and tenant-specific values
- Public GraphQL enumeration of infrastructure registry data
- Assuming every registered app is provisionable

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |

## 3. Actors and access

### Nivo control plane

- Resolve one registered app and apply its app-specific installation policy without adding an application enum branch

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 4. Entry points and surfaces

### Application registry

- ID: `app-registry`
- Route: `internal provisionable_apps registry`
- Purpose: Resolve application-owned installation policy without exposing infrastructure configuration publicly.
- Regions: `app-definition`
- Navigation: none

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 5. Business flows

### Resolve and provision one registered application

Trigger: An instance-shaped catalogue fulfillment names an application key

1. **control-plane** — Resolve the provisionable_apps row by stable key → The app-specific policy is available
2. **control-plane** — Check whether the row is provisionable → Unavailable apps are refused before instance creation
3. **control-plane** — Resolve the row's Helm chart argument and optional version → The installer receives the app-owned chart source
4. **control-plane** — Run the row's ordered pipeline and app-specific child configuration → Different applications share the registry lifecycle while retaining distinct child policies

Outcomes:
- A new application can be represented by data and policy keys without extending a product enum or adding a chart-selection branch

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`

## 6. Business rules

### BR-01

Each app owns one stable registry key and its own Helm chart argument; filesystem paths and OCI references are supported, while unresolved chart sources are refused before Helm runs.

Strength: **confirmed** · Evidence: `EV-001`, `EV-004`, `EV-006`

### BR-02

App-specific child behavior is selected through identity mode, ordered pipeline step keys, per-step config, secret specs and config-builder key rather than class inheritance or application conditionals.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`

### BR-03

A registered app is not necessarily provisionable; isProvisionable refuses new fulfillment before instance or secret creation while retaining registry truth for existing instances.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-005`

### BR-04

Chart contents, prices, marketing copy and per-tenant values remain owned outside the app registry.

Strength: **confirmed** · Evidence: `EV-001`

## 7. State model

- **Registered** (`registered`, initial) → unavailable, ready — `EV-001`, `EV-002`
- **Not provisionable** (`unavailable`, partial) → terminal — `EV-001`, `EV-003`, `EV-005`
- **Ready to provision** (`ready`, success) → provisioning — `EV-001`, `EV-004`, `EV-006`
- **Running app policy** (`provisioning`, pending) → terminal — `EV-001`, `EV-002`, `EV-003`

## 8. Entities and data

- **Provisionable application**: key, name, instance label, chart ref, chart version, host base domain, identity mode, auth host prefix, pipeline steps, step config, secret specs, config builder key, default plan code, is provisionable — `EV-001`, `EV-002`
- **Application child policy**: ordered step keys, per-step parameters, secret requirements, config builder strategy, identity strategy — `EV-001`, `EV-002`

## 9. Operations and APIs

- **resolveApp** (query, backend) — input: application key; output: provisionable app registry row; failures: application key absent or unregistered — `EV-003`
- **resolveForExpertSite** (query, backend) — input: instance-linked site identity; output: Helm chart ref, optional version and app key; failures: registry row absent, chart ref absent, local chart directory absent — `EV-004`, `EV-006`
- **createInstance** (command, backend) — input: catalogue order, resolved app row, resolved plan; output: instance bound to the app registry row; failures: app not provisionable, instance label absent, host base domain absent — `EV-003`, `EV-005`

## 10. Acceptance conditions

- **AC-01** A provisionable app row stores a stable key, one Helm chart reference and the app-specific identity, pipeline, step, secret, config-builder, plan and availability policies. — `EV-001`, `EV-002`
- **AC-02** Generic fulfillment resolves an app row, refuses unavailable apps before durable instance creation and binds created instances to the registry row. — `EV-003`, `EV-005`
- **AC-03** Chart resolution returns the selected app's filesystem or OCI Helm chart argument and rejects absent or unresolved sources before invoking Helm. — `EV-004`, `EV-006`

## 11. Explicit unknowns

- **Should future app child policies remain seed-reviewed configuration or become operator-authored records with schema validation and versioning?** — Current source treats child policies as reviewed seed data and validates behavior in code; an operator-editable model would require new validation, authorization and compatibility rules.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | be | `src/modules/platform/databases/postgresql/primary/entities/provisionable-app.entity.ts:45` | schema | ProvisionableAppEntity is the generic application registry and stores chart, identity, child pipeline, step config, secret, config-builder, default-plan and availability policies while excluding chart contents, catalogue and tenant data. |
| EV-002 | be | `src/modules/platform/databases/postgresql/primary/provisionable-app-seeder.service.ts:29` | policy | The reviewed registry seed defines multiple applications with distinct chart, identity and pipeline values, including a deliberately non-provisionable MMO row. |
| EV-003 | be | `src/modules/bussiness/catalog-fulfillment/catalog-fulfillment.dispatcher.ts:588` | api | Generic fulfillment resolves and gates a registry row, creates an app-bound instance and derives identity from the row without adding a new product enum branch. |
| EV-004 | be | `src/modules/bussiness/expert-provision/chart/chart-source.service.ts:46` | api | ChartSourceService resolves the instance app's chart ref and version from the registry and refuses missing or unresolved local chart sources before Helm runs. |
| EV-005 | be | `src/modules/bussiness/catalog-fulfillment/catalog-fulfillment.dispatcher.spec.ts:132` | test | Fulfillment tests cover generic registered apps, the non-provisionable MMO shape, app-key resolution and refusal before fulfillment effects. |
| EV-006 | be | `src/modules/bussiness/expert-provision/chart/chart-source.service.spec.ts:44` | test | Chart source tests prove different app keys resolve their own chart references and missing chart sources are refused. |
