# MMO application Helm chart

> Business head: `26bb61ae9faaa75b79f61bf47813cc5b3e8edb4e6812d7e9e651983003fe3167`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Nivo gains one generic MMO Helm chart at charts/mmo in the dedicated nivo-charts repository, while backend provisioning activation remains separately authorized.

Included:
- One MMO-specific Helm chart at charts/mmo in starci-lab/nivo-charts, consumable through the backend chart-ref and optional chart-version contract.
- A generic values contract requiring image repository, image tag and service port while allowing ingress, persistence and probes to be configured.
- A Helm v2 application package with workload, service and optional ingress and persistence templates sufficient for deterministic lint and template validation.
- Backend chart-source resolution that continues to refuse null, unsupported or missing chart sources before Helm executes.
- Preservation of MMO as non-provisionable until a separate authority approves its runtime pipeline and customer flow.

Excluded:
- Changing the current multi-app-registry authority or its child-pipeline behavior.
- Setting the MMO registry row isProvisionable flag to true.
- Creating catalogue offers, prices, plans, demo-owned instances or frontend availability for MMO.
- Running a deployment, publishing DNS, selecting an MMO management destination or exposing infrastructure fields publicly.
- Supplying concrete MMO images, commands, credentials, tenant domains or resource policy that the owner has not declared.

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |
| chart | https://github.com/starci-lab/nivo-charts.git | `4a3aabb9d4db60f0f9e7332195b46276368b5295` |

## 3. Actors and access

### Nivo control-plane maintainer

- Define and validate the generic charts/mmo package without activating customer provisioning.

Evidence: `EV-001`, `EV-002`

## 4. Entry points and surfaces

### MMO Helm chart

- ID: `mmo-chart-package`
- Route: `charts/mmo`
- Purpose: Define and validate the generic charts/mmo artifact the backend may resolve without activating provisioning.
- Regions: `chart-contract`
- Navigation: none

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-006`, `EV-007`, `EV-009`

## 5. Business flows

### Define and validate the MMO chart package

Trigger: The owner requires one backend-consumable Helm chart for the MMO application.

1. **control-plane-maintainer** — Open implementation for the approved charts/mmo artifact while preserving every unresolved activation decision. → The exact generic chart contract is in progress and cannot be mistaken for implemented provisioning.
2. **control-plane-maintainer** — Define charts/mmo with required image repository, image tag and service port plus configurable ingress, persistence and probes. → The generic chart package can be authored without borrowing Academy runtime behavior or inventing concrete deployment values.
3. **control-plane-maintainer** — Run deterministic Helm lint and template validation with representative non-secret values. → The chart is either validated for backend resolution or refused with an explicit chart error.

Outcomes:
- One MMO chart artifact can be resolved and validated without enabling MMO provisioning or inventing its customer flow.

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`

## 6. Business rules

### BR-01

MMO owns one distinct Helm chart artifact at charts/mmo in starci-lab/nivo-charts and the backend consumes it only through the registry chart-ref and optional chart-version contract.

Strength: **confirmed** · Evidence: `EV-001`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

### BR-02

A null, unsupported or missing MMO chart source is refused before Helm executes or provisioning secrets are minted.

Strength: **confirmed** · Evidence: `EV-004`

### BR-03

Adding the chart artifact does not by itself make MMO provisionable, define its pipeline or expose a frontend action.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`

### BR-04

The generic chart requires image repository, image tag and service port, exposes configurable ingress, persistence and probes, and never borrows Academy runtime values as MMO defaults.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`, `EV-006`

### BR-05

The chart package must pass deterministic Helm lint and template validation before its reference can be treated as usable.

Strength: **confirmed** · Evidence: `EV-001`, `EV-008`

## 7. State model

- **MMO generic chart implementation opened** (`chart-unresolved`, initial) → chart-defined — `EV-001`, `EV-002`, `EV-006`
- **charts/mmo package and generic values contract defined** (`chart-defined`, pending) → chart-validated, chart-refused — `EV-001`, `EV-006`, `EV-009`
- **MMO chart passes deterministic Helm validation** (`chart-validated`, success) → terminal — `EV-001`
- **MMO chart source or rendered package is invalid** (`chart-refused`, error) → chart-defined — `EV-001`, `EV-004`

## 8. Entities and data

- **MMO Helm chart package**: starci-lab/nivo-charts ownership and charts/mmo path, Helm v2 application metadata and optional version, required image repository, image tag and service port values, configurable ingress, persistence and probes, generic workload and service templates, validation fixtures — `EV-001`, `EV-003`, `EV-005`, `EV-006`, `EV-007`, `EV-009`
- **MMO registry chart link**: application key, chart reference, optional chart version, provisioning availability — `EV-002`, `EV-005`

## 9. Operations and APIs

- **resolveMmoChart** (query, backend) — input: MMO application registry identity; output: resolved chart reference, optional chart version, MMO application key; failures: missing registry row, null chart reference, unsupported Helm repository reference, missing filesystem chart — `EV-004`, `EV-005`
- **validateMmoChart** (command, provider) — input: MMO chart package, representative non-secret values; output: lint verdict, rendered Kubernetes manifests; failures: invalid chart metadata, missing required value, invalid rendered manifest — `EV-001`, `EV-006`, `EV-008`

## 10. Acceptance conditions

- **AC-01** One distinct Helm v2 MMO chart exists at starci-lab/nivo-charts/charts/mmo and passes deterministic Helm lint and template validation. — `EV-001`, `EV-006`, `EV-007`, `EV-008`, `EV-009`
- **AC-02** The backend can resolve the approved MMO chart reference and optional version through the generic chart-source contract without an MMO chart-selection branch. — `EV-001`, `EV-004`, `EV-005`
- **AC-03** MMO remains non-provisionable and gains no catalogue, frontend or management behavior under this feature. — `EV-001`, `EV-002`
- **AC-04** A null, unsupported or missing MMO chart source is refused before Helm executes. — `EV-004`

## 11. Explicit unknowns

- **Which concrete configuration, secret references, volume size and external dependencies will each MMO deployment provide?** — The generic chart can expose configuration points and optional persistence, but representative production values remain outside this artifact-only feature.
- **What domain, TLS, identity, plan and resource-allocation policy belongs to MMO tenants?** — The current MMO registry row leaves all of these fields unset and cannot safely borrow Academy policy.
- **Which backend dispatcher, ordered steps, values builder and record-outcome/readiness contract will install MMO after the chart exists?** — The current generic fulfillment has no MMO driver and the stored pipeline step list is not yet executable authority.
- **Does the owner intend this change to add only the chart artifact, or later activate MMO purchasing, provisioning and management?** — Activation requires separate transitions for the multi-app registry and app lifecycle; this artifact-only feature keeps MMO unavailable by default.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | owner | `decision:793f044e95ba391da2558a5c4d3665ae0633f4087e2d455e96f790feb1135606` | owner-decision | The owner requires one backend-consumable Helm chart for the MMO application. |
| EV-002 | be | `src/modules/platform/databases/postgresql/primary/provisionable-app-seeder.service.ts:163` | policy | The current MMO registry row deliberately has no chart, runtime policy or pipeline and remains non-provisionable until those product decisions exist. |
| EV-003 | be | `src/modules/platform/env/config.ts:1108` | policy | The current Academy chart and its installer tool are owned together by an external Nivo repository root rather than the backend checkout. |
| EV-004 | be | `src/modules/bussiness/expert-provision/chart/chart-source.service.ts:64` | api | ChartSourceService resolves registry chart references and optional versions while refusing null, unsupported or missing filesystem chart sources before Helm runs. |
| EV-005 | be | `src/modules/platform/databases/postgresql/primary/entities/provisionable-app.entity.ts:138` | schema | The generic application registry stores exactly the chart argument and optional Helm version consumed by the installer. |
| EV-006 | owner | `decision:165286ff3e5897a59c3fa8690f2ad936c69cbc3aca6c29d1f93118a55da64f48` | owner-decision | The owner approved starci-lab/nivo-charts/charts/mmo as a generic chart requiring image repository, image tag and service port, with configurable ingress, persistence and probes, while MMO provisioning remains disabled. |
| EV-007 | chart | `README.md:3` | policy | The dedicated nivo-charts repository owns Nivo Helm artifacts under charts/<chart>, with one product instance represented by one Helm release. |
| EV-008 | chart | `README.md:72` | test | The chart repository validates packages with deterministic helm lint and helm template commands. |
| EV-009 | chart | `charts/expert-academy/Chart.yaml:2` | schema | An existing clean sibling chart establishes the repository's Helm v2 application metadata shape with explicit chart and app versions. |
