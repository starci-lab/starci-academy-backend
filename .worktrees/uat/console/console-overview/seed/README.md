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
| one `expert_sites` row, `draft` / `not_provisioned`, no `instance_id`, no `catalog_order_id` | the owned-services block's disabled state (`step-33/parallel-1`; see below) |

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
named in `records.json`; `wallets`, `catalog_orders`, `instances`, `agent_workspaces`, `invoices`
and `expert_sites` all cascade from it (`expert_sites.user_id` carries `ON DELETE CASCADE`, the
same as every other row here).

No secret belongs here. The `reader` alias's password is the sealed shared credential resolved by
name; it is never written into a fixture, a command or a file.

## Investigated for step-32, corrected by step-33

`step-26/parallel-1` and `step-28/parallel-1` of session `20260903-162203-nivo-frontend.direction.decide`
found the delivered surface's coverage matrix short three states — `partially refused`, `nothing to
open` and `disabled` — for want of a domain and an expert site on this account, and asked whether
extending this seed could reach them. `step-32/parallel-1` (`platform.operate`, identity branch)
investigated and placed no new row, concluding none of the three states could be reached by any row
this seed could place. **That conclusion was reached against the wrong tree.** It read
`AppsSummary/component.tsx`, `AgentOSSummary/component.tsx` and `InfrastructureSummary/component.tsx`
— components this session's `frontend.source.apply` work retired, which survive only on the
product's main branch and were never the code served at `nivo/fe` generation 13. The delivered and
served composition retired all five of those blocks and wrote five new ones —
`OverviewSignals`, `OverviewServices`, `OverviewRuntime`, `OverviewAccount`, `OverviewAddresses` —
under `apps/app/src/components/blocks/console/`. `step-33/parallel-1` re-investigated by reading
the composition actually served (`nivo-fe` commit `9d511ad8c4c79b2d8d6a30f06c9f387fda2ccc1b`, inside
registry entry `nivo/fe` generation 13, head `42f29d59dfafed42bdd10111a1ffae5099a78038`, which
contains it) and found a different answer for each of the three states.

- **`disabled` — reachable, and now seeded.** `OverviewServices/index.tsx` derives
  `isDisabled: isUnavailable` where `isUnavailable = site.provisionStatus === "not_provisioned"`,
  on every row built from `apps` (the connected twin's name for `useQueryMyExpertSitesSwr`, i.e.
  `myExpertSites`). `MyExpertSitesService.execute` (`nivo-backend`,
  `.../expert-sites/my-expert-sites/my-expert-sites.service.ts`) lists every `expert_sites` row by
  `user_id` with no status filter, so a real row owned by the reader with `provision_status =
  'not_provisioned'` answers in the list and its `Button` renders `isDisabled={true}`
  (`OverviewServices/component.tsx`). This is a genuine product condition — an expert site the
  provisioning worker has never touched — not a degraded read. `records.json` now carries one
  `expert_sites` row, id `c075ce00-0008-4a00-8000-2026090300a8`, `status: draft`,
  `provision_status: not_provisioned`, no `instance_id`, no `catalog_order_id`; inserted directly
  (the flow's account already existed, so this extends the existing seed rather than starting a
  parallel fixture). Verified live: signed in as `reader` and queried
  `myExpertSites { data { id slug provisionStatus } }` over `http://localhost:3068/graphql` —
  answers `provisionStatus: "not_provisioned"` for this row, and the row therefore carries
  `isDisabled: true` on `OverviewServices`' `Button` by the connected twin's own logic above.
- **`nothing to open` — already reachable at the current seeded volume; no row added.**
  `OverviewSignals/index.tsx`'s `domains` cell and `OverviewAddresses/index.tsx` both key off
  `data.domains.ok && data.domains.data.length === 0`, rendering `overview.signals.nothingToOpen` /
  the `empty` phase. This seed has never placed a `domains` row (unchanged from the original
  reasoning: seeding one would erase the state), and `MyDomainsService` finds by `user_id` with no
  special-casing of an empty result, so the reader's zero domains already answer an empty, ok list.
  Verified live: the same signed-in query with `myDomains { data { id name } }` answers `data: []`
  for this reader. Nothing needed placing; the state was already standing on the seed step-19 wrote,
  and step-32 never checked it because it was busy reading retired components.
- **`partially refused` — genuinely unreachable in this composition; nothing was manufactured.**
  A `partial` phase needs a region whose own read answered while a read it depends on did not,
  inside one collection. Reading every block of the actually-served composition
  (`OverviewSignals`, `OverviewServices`, `OverviewRuntime`, `OverviewAccount`,
  `OverviewAddresses` — the whole `blocks/console/` folder) for any state literal named `partial`:
  none exists. `OverviewAddresses` only reaches `pending` / `failed` / `empty` / `populated`;
  `OverviewSignals` only reaches a cell that is pending, failed (`!ok`), empty, or answered;
  `OverviewRuntime` only reaches `unavailable` (the whole pod read failed) or answered, and is
  absent entirely when there is no workspace. The direction that produced this composition split
  the pod status read into its own region (`OverviewRuntime`), so there is no longer a collection
  whose domains sub-read can fail while a sibling in the same card answers — the per-row/per-block
  composite `InfrastructureSummary` used to carry does not exist anywhere in the new shape. This is
  a coverage gap with a real reason, not an unseeded one: no row this seed places, and no seed at
  all, can produce a phase the served components never render. Degrading a live read to fake it
  would prove the renderer's fallback branch and not the surface, which this operator's law refuses.

`records.json` gained exactly one row (`expert_sites`, above); `wallets`, `catalog_orders`,
`instances`, `agent_workspaces`, `invoices`, `users` and the account are unchanged. Rollback deletes
the `users` row named in `records.json`, and `expert_sites` cascades from it along with every other
row (see Idempotency and rollback, above).

## Layout

| Path | Holds |
| --- | --- |
| `records.json` | the rows placed, by entity and fixed id, with the namespace |
