# uat flow — console-overview

Draft. This document was drafted by `platform.operate` (session
`20260903-162203-nivo-frontend.direction.decide`, step-19) from the shipped template, for the
Nivo console operations overview at `/en/overview`; `uat.verify` freezes it at its step 4 and a
person owns every sentence after that. Nothing here is a secret: the account is named in
`accounts.dev.json`, its password is resolved by name at sign-in and never written.

## Goal

A signed-in customer opens the console operations overview and sees, across five summary blocks
fed by six independent account reads, exactly the state each block is actually in — data, empty,
refused, partially refused, needing attention, or with nothing to open — rather than a screen that
only ever shows the happy path.

## Budgets

| Budget | Value | Why |
| --- | --- | --- |
| Steps | `2` | Sign in, open the overview |
| Time | `30s` | First activation to terminal assertion |
| Surface class | `console` | The overview is the console's own landing surface |
| Viewports | `1440x900, 390x844` | The direction's wide and compact overview branches |

## Cases

| Order | Case | As | Entry | Steps | Terminal assertion | Lanes asserted |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `overview-shows-mixed-block-states` | `reader` | `/en/overview`, signed in | `1` | The five summary blocks render: owned applications and agent workspaces answered with the seeded rows, pod status showing one running and one needing attention, domains empty with nothing to open, wallet answered with its balance, and the unpaid invoice as an intended next step | `behavior`, `ux`, `ui` |

`As` names one alias of `accounts.dev.json`.

## Assertions

| Assertion | Case | Lane | What is observed | Rule ids measured |
| --- | --- | --- | --- | --- |
| `applications-answered` | `overview-shows-mixed-block-states` | `behavior` | The owned-applications block lists the one seeded active order | `UX-1` |
| `workspaces-answered` | `overview-shows-mixed-block-states` | `behavior` | The agent-workspaces block lists the one seeded workspace | `UX-1` |
| `pod-status-needs-attention` | `overview-shows-mixed-block-states` | `ui` | The pod-status block shows one running and one degraded pod, the degraded one marked for attention | `UX-6` |
| `domains-nothing-to-open` | `overview-shows-mixed-block-states` | `ux` | The domains block shows its empty state with no row to activate | `UX-5` |
| `wallet-answered` | `overview-shows-mixed-block-states` | `behavior` | The wallet block shows the seeded balance | `UX-1` |
| `invoice-intended-next-step` | `overview-shows-mixed-block-states` | `ux` | The invoices block shows the unpaid invoice with a pay action as the offered next step | `UX-6, UX-8` |

## Alternate paths

| Branch | Triggered by | Terminal assertion |
| --- | --- | --- |
| `block-refused` | one account read the overview depends on answers with an error | That one block alone shows its refusal and a retry; the other four blocks stay usable |
| `block-partially-refused` | one account read returns some rows and an error for the rest | That block shows the rows it has plus a partial-refusal notice, not a blank block |

Both branches are exercised by the run itself, against a deliberately degraded read (a stopped
dependency or a scoped-out reader), not by seed data: a seed can place rows, not make an API call
fail.

## Fixtures

| Record | Source | Created by | Namespaced |
| --- | --- | --- | --- |
| `users` UAT console-overview reader | `seed/records.json` | `seed` | `uat-console-overview` |
| `wallets` one row, balance 150000 VND | `seed/records.json` | `seed` | `uat-console-overview` |
| `catalog_orders` one active `instance_provisioned` order | `seed/records.json` | `seed` | `uat-console-overview` |
| `instances` two rows, one `running`, one `degraded` | `seed/records.json` | `seed` | `uat-console-overview` |
| `agent_workspaces` one active workspace | `seed/records.json` | `seed` | `uat-console-overview` |
| `invoices` one `unpaid` invoice due in 3 days | `seed/records.json` | `seed` | `uat-console-overview` |
| `domains` none — the block's empty state is the absence of a row | — | — | — |

## Steps

| # | As | Action | Expected | Evidence | UX ids measured |
| --- | --- | --- | --- | --- | --- |
| 1 | `reader` | Sign in at `/en/authentication` with the reader's email | The console opens on the overview | `steps/01-sign-in/capture-<viewport>-<scheme>.png` (after the redirect) | `UX-4` |
| 2 | `reader` | Open `/en/overview` | The five blocks at rest, each in the state the seed and the run set up | `steps/02-overview/capture-<viewport>-<scheme>.png` | `UX-1, UX-5, UX-6, UX-8` |

## Cleanup

The run writes nothing to the store; its namespace `uat-<runId>` covers only the run record under
`runs/`. The seed's own namespace `uat-console-overview` stays for the next run and is removed by
deleting the ids `seed/records.json` lists.
