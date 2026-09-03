# uat seed — console-overview

Draft, written by `platform.operate` (step-19 of session
`20260903-162203-nivo-frontend.direction.decide`) when the seed was first applied to the dev
store. `records.json` beside this file names every row that was placed, with its fixed id.

## What is placed

The preconditions of the flow for the `reader` alias of `accounts.dev.json`, in the nivo store
(`nivo-postgres`, database `nivo`):

| Row | Why it must exist before the run |
| --- | --- |
| one `users` row, linked to the reader's Keycloak account | the local identity the other rows attach to; without it the reader signs in to a console with nothing of its own |
| one `wallets` row, balance 150000 VND | the wallet block's answered state |
| one `catalog_orders` row, `active`, `instance_provisioned` | the owned-applications block's answered state |
| two `instances` rows, one `running` one `degraded` | the pod-status block's mixed answered / needs-attention state |
| one `agent_workspaces` row, attached to the seeded order and the running instance | the agent-workspaces block's answered state |
| one `invoices` row, `unpaid`, due in 3 days | the invoices block's needs-attention / intended-next-step state |

No `domains` row is placed. The domains block's empty, nothing-to-open state is the absence of a
row, not a row that says so: seeding a domain would erase the one state this flow needs it to show.

The seed never creates the outcome under test: rendering each block's state correctly from what
the store holds is what the run's overview visit verifies.

## Namespace

The nivo tables carry no `is_uat` column. The namespace is therefore the fixed ids in
`records.json` and the `uat-console-overview` prefix on every name and hostname. `records.json`
marks each record `is_uat: true` and names the namespace so a later reader can tell these rows
from product data.

## Where the data state comes from

`db/before.json` and `db/after.json` of a run hold, in this order: the reader's owned
applications, agent workspaces, pod status, domains, wallet and invoices, each taken over the
product's own GraphQL API at `http://localhost:3068/graphql` as the `reader` alias (the password
resolved by name at sign-in). Nothing requires a direct database connection to take it.

## Idempotency and rollback

Every insert names its fixed id and is `ON CONFLICT (id) DO NOTHING` (the `users` row is matched
on its unique `keycloak_user_id` instead, since its id is generated on first sign-in by the
product itself in the ordinary case), so applying the seed again changes nothing — verified by
re-running the same insert set, which placed zero further rows. Rollback deletes the `users` row
named in `records.json`; `wallets`, `catalog_orders`, `instances`, `agent_workspaces` and
`invoices` all cascade from it.

No secret belongs here. The `reader` alias's password is the sealed shared credential resolved by
name; it is never written into a fixture, a command or a file.

## Layout

| Path | Holds |
| --- | --- |
| `records.json` | the rows placed, by entity and fixed id, with the namespace |
