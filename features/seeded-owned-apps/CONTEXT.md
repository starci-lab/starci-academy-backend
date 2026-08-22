# Seeded owned apps

> Business identity: `nivo/seeded-owned-apps@fc9ab6a9e709076658a82d630cfc60c3e3199538ea5a92bf37f2fe2424ff079c`
>
> Source heads: authority `in-progress` · `be@947c6f4a117e`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** The Nivo backend idempotently seeds an Expert Academy app and an MMO app for the fixed demo account so the existing generic owned-instance query can expose both without provisioning MMO infrastructure or inventing MMO product features.

**Primary actor.** Fixed Nivo demo account owner

**Primary outcome.** The frontend can render Học viện Chuyên gia and MMO as two current owned apps without provisioning MMO infrastructure

**Never does.** MMO provisioning, chart installation, DNS publication or deployment

## Invariants

- `BR-01` — The demo seed is idempotent and scoped only to tester@nivo.local; a missing demo account is a safe skip.
- `BR-02` — The MMO seed binds the existing mmo provisionable-app registry identity but remains non-provisionable and has no product-detail row.
- `BR-03` — Owned apps are exposed through the generic instance spine; adding MMO does not add an MMO branch to myInstances.

## Primary flow

```text
owner-missing → seeded → available
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `owned-apps-feed` | `GraphQL myInstances` | Supply the authenticated owner's current app instances to the console Apps flow. | [surface](surfaces/owned-apps-feed.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `seedDemoOwnedApps` | backend | fixed demo account, ai_academy registry row, mmo registry row | idempotently persisted academy and MMO instances |
| `myInstances` | backend | authenticated viewer | owned app key, instance identity, name, plan, resources and status |

## Explicit unknowns

- `mmo-control-center` — Which product-specific regions and operations will an MMO control center eventually own? Impact: The backend may expose the seeded MMO instance through myInstances, but design and implementation must not invent MMO-specific management behavior.
- `demo-instance-technical-values` — Which deterministic local hostname, resource allocation, plan and version snapshot should the seed use for each instance? Impact: Backend planning must choose values compatible with the existing InstanceEntity without treating them as product pricing or provisioning claims.

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
