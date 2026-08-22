# MMO application Helm chart

> Business head: `4fa19804a0aa753a456c597b952bff858ed4592c9f8bbfeba653edeed0b2a8bc`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Nivo gains one MMO-owned Helm chart artifact that the backend can resolve through its generic chart-source contract, while provisioning activation remains separately authorized.

Included:
- One MMO-specific Helm chart artifact consumable through the backend chart-ref and optional chart-version contract.
- A declared chart values and runtime contract sufficient for deterministic Helm lint and template validation.
- Backend chart-source resolution that continues to refuse null, unsupported or missing chart sources before Helm executes.
- Preservation of MMO as non-provisionable until a separate authority approves its runtime pipeline and customer flow.

Excluded:
- Changing the current multi-app-registry authority or its child-pipeline behavior.
- Setting the MMO registry row isProvisionable flag to true.
- Creating catalogue offers, prices, plans, demo-owned instances or frontend availability for MMO.
- Running a deployment, publishing DNS, selecting an MMO management destination or exposing infrastructure fields publicly.
- Guessing MMO workloads, images, commands, ports, probes, identity, secrets, configuration, persistence or tenant resources.

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |

## 3. Actors and access

### Nivo control-plane maintainer

- Define and validate the MMO chart package without activating customer provisioning.

Evidence: `EV-001`, `EV-002`

## 4. Entry points and surfaces

### MMO Helm chart

- ID: `mmo-chart-package`
- Route: `backend-private MMO Helm artifact`
- Purpose: Define and validate the chart artifact the backend may resolve for MMO without activating provisioning.
- Regions: `chart-contract`
- Navigation: none

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`

## 5. Business flows

### Define and validate the MMO chart package

Trigger: The owner requires one backend-consumable Helm chart for the MMO application.

1. **control-plane-maintainer** — Record the MMO chart as accepted intent while preserving every unresolved runtime decision. → The chart requirement is pending and cannot be mistaken for implemented provisioning.
2. **control-plane-maintainer** — Resolve the artifact owner, chart reference form and complete MMO runtime values contract. → The chart package has enough product truth to be authored without borrowing Academy behavior.
3. **control-plane-maintainer** — Run deterministic Helm lint and template validation with representative non-secret values. → The chart is either validated for backend resolution or refused with an explicit chart error.

Outcomes:
- One MMO chart artifact can be resolved and validated without enabling MMO provisioning or inventing its customer flow.

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## 6. Business rules

### BR-01

MMO owns one distinct Helm chart artifact and the backend consumes it only through the registry chart-ref and optional chart-version contract.

Strength: **confirmed** · Evidence: `EV-001`, `EV-004`, `EV-005`

### BR-02

A null, unsupported or missing MMO chart source is refused before Helm executes or provisioning secrets are minted.

Strength: **confirmed** · Evidence: `EV-004`

### BR-03

Adding the chart artifact does not by itself make MMO provisionable, define its pipeline or expose a frontend action.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`

### BR-04

MMO-specific runtime values remain explicit unknowns until product evidence or an owner decision defines them; Academy values are not defaults for MMO.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`

### BR-05

The chart package must pass deterministic Helm lint and template validation before its reference can be treated as usable.

Strength: **confirmed** · Evidence: `EV-001`

## 7. State model

- **MMO chart accepted but runtime contract unresolved** (`chart-unresolved`, initial) → chart-defined — `EV-001`, `EV-002`
- **MMO chart package and values contract defined** (`chart-defined`, pending) → chart-validated, chart-refused — `EV-001`
- **MMO chart passes deterministic Helm validation** (`chart-validated`, success) → terminal — `EV-001`
- **MMO chart source or rendered package is invalid** (`chart-refused`, error) → chart-defined — `EV-001`, `EV-004`

## 8. Entities and data

- **MMO Helm chart package**: artifact owner and chart reference form, chart metadata and optional version, values contract, workload and service templates, validation fixtures — `EV-001`, `EV-003`, `EV-005`
- **MMO registry chart link**: application key, chart reference, optional chart version, provisioning availability — `EV-002`, `EV-005`

## 9. Operations and APIs

- **resolveMmoChart** (query, backend) — input: MMO application registry identity; output: resolved chart reference, optional chart version, MMO application key; failures: missing registry row, null chart reference, unsupported Helm repository reference, missing filesystem chart — `EV-004`, `EV-005`
- **validateMmoChart** (command, backend) — input: MMO chart package, representative non-secret values; output: lint verdict, rendered Kubernetes manifests; failures: invalid chart metadata, missing required value, invalid rendered manifest — `EV-001`

## 10. Acceptance conditions

- **AC-01** One distinct MMO Helm chart package exists at an explicitly approved artifact owner and passes deterministic Helm lint and template validation. — `EV-001`
- **AC-02** The backend can resolve the approved MMO chart reference and optional version through the generic chart-source contract without an MMO chart-selection branch. — `EV-001`, `EV-004`, `EV-005`
- **AC-03** MMO remains non-provisionable and gains no catalogue, frontend or management behavior under this feature. — `EV-001`, `EV-002`
- **AC-04** A null, unsupported or missing MMO chart source is refused before Helm executes. — `EV-004`

## 11. Explicit unknowns

- **Will the MMO chart live in the Nivo monorepo, the separate nivo-charts repository or an OCI registry, and what exact reference/version will the backend store?** — The backend currently contains no chart tree and already uses two external chart ownership patterns, so implementation cannot name a legal file boundary until this is decided.
- **Which images, commands, ports, services, probes and rollout/readiness conditions define the MMO workload?** — Chart templates and validation fixtures cannot be authored without the actual workload contract.
- **Which configuration, secrets, persistent volumes and external dependencies does each MMO tenant require?** — Values, Secret and PVC templates would otherwise invent operational and security behavior.
- **What domain, TLS, identity, plan and resource-allocation policy belongs to MMO tenants?** — The current MMO registry row leaves all of these fields unset and cannot safely borrow Academy policy.
- **Which backend dispatcher, ordered steps, values builder and record-outcome/readiness contract will install MMO after the chart exists?** — The current generic fulfillment has no MMO driver and the stored pipeline step list is not yet executable authority.
- **Does the owner intend this change to add only the chart artifact, or later activate MMO purchasing, provisioning and management?** — Activation requires separate transitions for the multi-app registry and app lifecycle; this pending feature keeps MMO unavailable by default.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | owner | `decision:793f044e95ba391da2558a5c4d3665ae0633f4087e2d455e96f790feb1135606` | owner-decision | The owner requires one backend-consumable Helm chart for the MMO application. |
| EV-002 | be | `src/modules/platform/databases/postgresql/primary/provisionable-app-seeder.service.ts:163` | policy | The current MMO registry row deliberately has no chart, runtime policy or pipeline and remains non-provisionable until those product decisions exist. |
| EV-003 | be | `src/modules/platform/env/config.ts:1108` | policy | The current Academy chart and its installer tool are owned together by an external Nivo repository root rather than the backend checkout. |
| EV-004 | be | `src/modules/bussiness/expert-provision/chart/chart-source.service.ts:64` | api | ChartSourceService resolves registry chart references and optional versions while refusing null, unsupported or missing filesystem chart sources before Helm runs. |
| EV-005 | be | `src/modules/platform/databases/postgresql/primary/entities/provisionable-app.entity.ts:138` | schema | The generic application registry stores exactly the chart argument and optional Helm version consumed by the installer. |
