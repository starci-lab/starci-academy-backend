# Seeded owned apps

> Business head: `7536d86f1222e9e9af68ab35411d8f81e88e588499e89e2bdebc20a721df38a0`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

The Nivo backend idempotently seeds an Expert Academy app and an MMO app for the fixed demo account so the existing generic owned-instance query can expose both without provisioning MMO infrastructure or inventing MMO product features.

Included:
- Idempotent demo-owned instance seed for tester@nivo.local
- One seeded ai_academy instance labelled Học viện Chuyên gia
- One seeded mmo instance labelled MMO
- Generic myInstances projection for both seeded rows

Excluded:
- MMO provisioning, chart installation, DNS publication or deployment
- MMO catalogue purchase or pricing tiers
- MMO-specific product detail tables, operations or control-center behavior
- Production users other than the fixed demo account

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| be | https://github.com/starci-lab/nivo-backend.git | `947c6f4a117e1677e37ad98ba03f3dac0bca148e` |

## 3. Actors and access

### Fixed Nivo demo account owner

- See the seeded Expert Academy and MMO instances through the existing owned-app query

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## 4. Entry points and surfaces

### Owned apps feed

- ID: `owned-apps-feed`
- Route: `GraphQL myInstances`
- Purpose: Supply the authenticated owner's current app instances to the console Apps flow.
- Regions: `owned-apps`
- Navigation: none

Evidence: `EV-003`, `EV-004`, `EV-005`

## 5. Business flows

### Seed demo-owned apps

Trigger: The Nivo backend completes application bootstrap

1. **demo-owner** — The backend resolves the fixed demo account → Seeding skips safely when the account does not exist
2. **demo-owner** — The backend upserts the two declared owned instances → Exactly one Expert Academy row and one MMO row are owned by the demo account
3. **demo-owner** — The authenticated demo owner requests myInstances → Both seeded app identities are returned through the generic instance projection

Outcomes:
- The frontend can render Học viện Chuyên gia and MMO as two current owned apps without provisioning MMO infrastructure

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`

## 6. Business rules

### BR-01

The demo seed is idempotent and scoped only to tester@nivo.local; a missing demo account is a safe skip.

Strength: **confirmed** · Evidence: `EV-001`, `EV-005`

### BR-02

The MMO seed binds the existing mmo provisionable-app registry identity but remains non-provisionable and has no product-detail row.

Strength: **confirmed** · Evidence: `EV-002`, `EV-003`, `EV-005`

### BR-03

Owned apps are exposed through the generic instance spine; adding MMO does not add an MMO branch to myInstances.

Strength: **confirmed** · Evidence: `EV-003`, `EV-004`, `EV-005`

## 7. State model

- **Demo owner missing** (`owner-missing`, empty) → seeded — `EV-001`
- **Demo apps seeded** (`seeded`, success) → available — `EV-001`, `EV-002`, `EV-005`
- **Owned apps available** (`available`, success) → terminal — `EV-003`, `EV-004`, `EV-005`

## 8. Entities and data

- **Owned application instance**: owner, app registry identity, customer-facing name, hostname, resource allocation, status, chart and image version snapshot — `EV-002`, `EV-003`, `EV-005`

## 9. Operations and APIs

- **seedDemoOwnedApps** (command, backend) — input: fixed demo account, ai_academy registry row, mmo registry row; output: idempotently persisted academy and MMO instances; failures: demo account absent, required registry identity absent, database write refusal — `EV-001`, `EV-002`, `EV-005`
- **myInstances** (query, backend) — input: authenticated viewer; output: owned app key, instance identity, name, plan, resources and status; failures: authentication rejected, instance registry identity missing — `EV-003`, `EV-004`

## 10. Acceptance conditions

- **AC-01** Repeated backend boot does not duplicate either seeded owned app for tester@nivo.local. — `EV-001`, `EV-005`
- **AC-02** myInstances returns one ai_academy row labelled Học viện Chuyên gia and one mmo row labelled MMO for the demo owner. — `EV-003`, `EV-004`, `EV-005`
- **AC-03** The MMO seed creates no provisioning request, deployment, chart install, catalogue order or MMO-specific detail row. — `EV-002`, `EV-003`, `EV-005`

## 11. Explicit unknowns

- **Which product-specific regions and operations will an MMO control center eventually own?** — The backend may expose the seeded MMO instance through myInstances, but design and implementation must not invent MMO-specific management behavior.
- **Which deterministic local hostname, resource allocation, plan and version snapshot should the seed use for each instance?** — Backend planning must choose values compatible with the existing InstanceEntity without treating them as product pricing or provisioning claims.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | be | `src/modules/platform/databases/postgresql/primary/domain-seeder.service.ts:26` | policy | The existing primary-database demo seeder resolves tester@nivo.local, skips safely when absent and idempotently updates or inserts demo-owned rows. |
| EV-002 | be | `src/modules/platform/databases/postgresql/primary/provisionable-app-seeder.service.ts:103` | schema | The provisionable-app registry already defines ai_academy and a deliberately non-provisionable mmo identity with no chart, host, pipeline or product-specific detail contract. |
| EV-003 | be | `src/features/core/api/core/graphql/queries/instances/my-instances/my-instances.handler.ts:90` | api | myInstances reads instances as the generic spine, joins the app registry and maps any app key, name, plan, resources and status without an app-specific branch. |
| EV-004 | be | `src/features/core/api/core/graphql/queries/instances/my-instances/my-instances.handler.spec.ts:131` | test | The query test proves an MMO instance with no product enum or detail table is returned as appKey mmo through the generic owned-instance response. |
| EV-005 | owner | `decision:d9776286e15da17c2e5b5669dc6c22f93e310722a5e1d5db3ea329507fb3c5e2` | owner-decision | The owner requested that Nivo backend assume an MMO app exists and provide seed data for two current apps, Học viện Chuyên gia and MMO, without provisioning. |
