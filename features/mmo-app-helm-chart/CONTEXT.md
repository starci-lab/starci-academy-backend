# MMO application Helm chart

> Business identity: `nivo/mmo-app-helm-chart@4eafdcbc8c72d9eca144dd93e86a41b83988c42e26f7ca647bcdac68f028cd21`
>
> Source heads: authority `implemented` · `be@947c6f4a117e`, `chart@c1f88fc9e21b`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Nivo has one validated generic MMO Helm chart at charts/mmo in the dedicated nivo-charts repository, while backend provisioning activation remains separately authorized.

**Primary actor.** Nivo control-plane maintainer

**Primary outcome.** One MMO chart artifact can be resolved and validated without enabling MMO provisioning or inventing its customer flow.

**Never does.** Changing the current multi-app-registry authority or its child-pipeline behavior.

## Invariants

- `BR-01` — MMO owns one distinct Helm chart artifact at charts/mmo in starci-lab/nivo-charts and the backend consumes it only through the registry chart-ref and optional chart-version contract.
- `BR-02` — A null, unsupported or missing MMO chart source is refused before Helm executes or provisioning secrets are minted.
- `BR-03` — Adding the chart artifact does not by itself make MMO provisionable, define its pipeline or expose a frontend action.
- `BR-04` — The generic chart requires image repository, image tag and service port, exposes configurable ingress, persistence and probes, and never borrows Academy runtime values as MMO defaults.
- `BR-05` — The chart package must pass deterministic Helm lint and template validation before its reference can be treated as usable.

## Primary flow

```text
chart-unresolved → chart-defined → chart-validated
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `mmo-chart-package` | `charts/mmo` | Define and validate the generic charts/mmo artifact the backend may resolve without activating provisioning. | [surface](surfaces/mmo-chart-package.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `resolveMmoChart` | backend | MMO application registry identity | resolved chart reference, optional chart version, MMO application key |
| `validateMmoChart` | provider | MMO chart package, representative non-secret values | lint verdict, rendered Kubernetes manifests |

## Explicit unknowns

- `mmo-config-and-persistence` — Which concrete configuration, secret references, volume size and external dependencies will each MMO deployment provide? Impact: The generic chart can expose configuration points and optional persistence, but representative production values remain outside this artifact-only feature.
- `mmo-tenant-policy` — What domain, TLS, identity, plan and resource-allocation policy belongs to MMO tenants? Impact: The current MMO registry row leaves all of these fields unset and cannot safely borrow Academy policy.
- `mmo-pipeline-integration` — Which backend dispatcher, ordered steps, values builder and record-outcome/readiness contract will install MMO after the chart exists? Impact: The current generic fulfillment has no MMO driver and the stored pipeline step list is not yet executable authority.
- `mmo-provisioning-activation` — Does the owner intend this change to add only the chart artifact, or later activate MMO purchasing, provisioning and management? Impact: Activation requires separate transitions for the multi-app registry and app lifecycle; this artifact-only feature keeps MMO unavailable by default.

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
