# Business rules · Seeded owned apps

## BR-01

The demo seed is idempotent and scoped only to tester@nivo.local; a missing demo account is a safe skip.

- Strength: `confirmed`
- Evidence: `EV-001`, `EV-005`

## BR-02

The MMO seed binds the existing mmo provisionable-app registry identity but remains non-provisionable and has no product-detail row.

- Strength: `confirmed`
- Evidence: `EV-002`, `EV-003`, `EV-005`

## BR-03

Owned apps are exposed through the generic instance spine; adding MMO does not add an MMO branch to myInstances.

- Strength: `confirmed`
- Evidence: `EV-003`, `EV-004`, `EV-005`
